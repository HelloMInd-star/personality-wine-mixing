/**
 * feedbackEngine · 喝后评分校准引擎
 *
 * 闭环：喝后评分 → 向量校准 → 推荐优化
 *   - 高分（≥4）：向量朝「当时推荐向量」方向微调，下次同类推荐更准
 *   - 低分（≤2）：向量朝「当时推荐向量」反向微调，远离不合口味的方向
 *   - 中性（=3）：不动
 *
 * 纯函数 + 监控埋点 · 无副作用，可独立测试
 * 与 applyBiologyShift 同构：clamp [0,1]，四舍五入到 3 位小数
 */

import type { PersonaVector, PersonaDim } from '../types/personaFusion';
import type { FeedbackSignal } from '../types/feedback';

/** 六维人格向量维度键 · 顺序固定，用于遍历 */
const PERSONA_DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

/** 单次校准步长系数 · 控制 delta 基准幅度 */
const CALIBRATE_STEP = 0.02;

/** 单次校准幅度硬上限 · |delta| 不得超过此值 */
const CALIBRATE_HARD_CAP = 0.05;

/**
 * 漂移熔断阈值 · 校准后向量与 base 的余弦距离上限
 *
 * 含义：单次校准有 0.05 上限，但 100 条 feedback 累积仍可能把向量
 * 推到与初始 profile 完全不同的位置——这是隐性失控。
 * 漂移 > 0.3（约 43° 夹角）时按比例回拉至阈值，引入 base 作为兜底维度。
 * 对应「0.8 高权重要更多维辅助」的数值哲学：超阈值即降权。
 */
const DRIFT_FUSE = 0.3;

// ═════════════════════════════════════════════════════════
// 监控埋点
// ═════════════════════════════════════════════════════════

/** 埋点节点 · 级别映射 */
const NODE_LEVEL: Record<string, 'error' | 'warn' | 'debug'> = {
  'feedback.shown': 'debug',
  'feedback.submitted': 'debug',
  'feedback.skipped': 'warn',
  'calibrate.invoke': 'debug',
  'calibrate.result': 'debug',
  'calibrate.overflow': 'warn',
  'calibrate.fuse': 'warn',
  'calibrate.persist': 'debug',
  'calibrate.error': 'error',
};

/** 线上采样率 · 1% */
const PROD_SAMPLE_RATE = 0.01;

/**
 * 把向量摘要到 0.1 桶 · 隐私保护，不记原始值
 * 例：0.37 → 0.4，0.82 → 0.8
 */
function bucketVector(vec: PersonaVector): Record<PersonaDim, number> {
  const bucketed = {} as Record<PersonaDim, number>;
  for (const dim of PERSONA_DIMS) {
    bucketed[dim] = Math.round(vec[dim] * 10) / 10;
  }
  return bucketed;
}

/**
 * 监控埋点 · 评分回路全链路追踪
 *
 * - DEV：全量输出（console.debug/warn/error）
 * - 线上：按 1% 采样输出，error 级别始终输出
 * - 向量数据自动摘要到 0.1 桶，不记原始向量（隐私）
 *
 * @param node 埋点节点（见 NODE_LEVEL）
 * @param payload 负载 · 含向量字段会被自动桶化
 */
export function trackFeedback(
  node: string,
  payload: Record<string, unknown> = {},
): void {
  const level = NODE_LEVEL[node] ?? 'debug';
  const isDev = import.meta.env.DEV;
  // DEV 全量 · 线上 error 始终 · 其余线上 1% 采样
  const shouldLog =
    isDev || level === 'error' || Math.random() < PROD_SAMPLE_RATE;
  if (!shouldLog) return;

  // 向量字段自动桶化 · 隐私保护
  const safePayload: Record<string, unknown> = { ...payload };
  for (const key of Object.keys(safePayload)) {
    const val = safePayload[key];
    if (key === 'vector' && val && typeof val === 'object') {
      safePayload[key] = bucketVector(val as PersonaVector);
    }
    if (key === 'recommendedVec' && val && typeof val === 'object') {
      safePayload[key] = bucketVector(val as PersonaVector);
    }
  }

  const ts = performance.now().toFixed(1);
  const tag = `[Feedback:${node}] t=${ts}ms`;
  switch (level) {
    case 'error':
      console.error(tag, safePayload);
      break;
    case 'warn':
      console.warn(tag, safePayload);
      break;
    default:
      console.debug(tag, safePayload);
  }
}

// ═════════════════════════════════════════════════════════
// 向量校准 · 纯函数
// ═════════════════════════════════════════════════════════

/**
 * 余弦距离 · 0=同向，1=正交，2=反向
 * 边界：任一向量为零向量 → 返回 0（无方向可比，视为无漂移）
 *
 * 用于漂移熔断 · 衡量校准后向量与 base 的方向偏离
 */
function cosineDistance(a: PersonaVector, b: PersonaVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const dim of PERSONA_DIMS) {
    dot += a[dim] * b[dim];
    normA += a[dim] * a[dim];
    normB += b[dim] * b[dim];
  }
  if (normA === 0 || normB === 0) return 0;
  const cos = dot / Math.sqrt(normA * normB);
  // clamp 防浮点误差致 cos 略超 [-1, 1]
  return 1 - Math.max(-1, Math.min(1, cos));
}

/**
 * 线性插值 · t∈[0,1] · t=0 返回 a，t=1 返回 b
 * 用于漂移熔断时按比例回拉至阈值
 */
function lerpVector(a: PersonaVector, b: PersonaVector, t: number): PersonaVector {
  const out = {} as PersonaVector;
  for (const dim of PERSONA_DIMS) {
    out[dim] = Math.round((a[dim] + (b[dim] - a[dim]) * t) * 1000) / 1000;
  }
  return out;
}

/**
 * 校准六维人格向量 · 基于喝后评分信号
 *
 * 算法（每条 feedback 顺序累加）：
 *   direction = rating≥4 ? +1 : rating≤2 ? -1 : 0
 *   对每个维度：
 *     delta = (recommendedVec[dim] - result[dim]) * direction * 0.02
 *     |delta| 硬上限 0.05
 *     result[dim] = clamp01(round3(result[dim] + delta))
 *
 * 漂移熔断（末尾）：
 *   drift = cosineDistance(result, base)
 *   drift > 0.3 → lerp(base, result, 0.3 / drift) 按比例回拉至阈值
 *   引入 base 作为兜底维度 · 防止累积校准把向量推离原始 profile 过远
 *
 * 含义：
 *   - 高分 → 向推荐向量靠拢（下次同类推荐更准）
 *   - 低分 → 远离推荐向量（下次避开不合口味的方向）
 *   - recommendedVec 是当时推荐所用的向量快照，知道方向才能校准
 *
 * 纯函数：不修改入参（浅拷贝 {...base}），返回新向量
 *
 * @param base 基础六维向量
 * @param feedback 评分信号列表（按时间顺序）
 * @param recommendedVec 兜底推荐向量 · 当某条 feedback 未携带 recommendedVec 时使用
 * @returns 校准后的新向量（已应用漂移熔断）
 */
export function calibrateVector(
  base: PersonaVector,
  feedback: FeedbackSignal[],
  recommendedVec: PersonaVector,
): PersonaVector {
  trackFeedback('calibrate.invoke', {
    count: feedback.length,
    recommendedVec,
  });

  const result: PersonaVector = { ...base };

  for (const fb of feedback) {
    const direction = fb.rating >= 4 ? 1 : fb.rating <= 2 ? -1 : 0;
    if (direction === 0) continue;

    // 优先用 feedback 自带的推荐向量快照 · 缺失则用兜底
    const refVec = fb.recommendedVec ?? recommendedVec;

    for (const dim of PERSONA_DIMS) {
      const diff = refVec[dim] - result[dim];
      let delta = diff * direction * CALIBRATE_STEP;

      // 单次幅度硬上限 · |delta| ≤ 0.05
      if (Math.abs(delta) > CALIBRATE_HARD_CAP) {
        trackFeedback('calibrate.overflow', {
          dim,
          rawDelta: Math.round(delta * 1000) / 1000,
          cap: CALIBRATE_HARD_CAP,
        });
        delta = Math.sign(delta) * CALIBRATE_HARD_CAP;
      }

      const raw = result[dim] + delta;
      result[dim] = Math.max(0, Math.min(1, Math.round(raw * 1000) / 1000));
    }
  }

  // 漂移熔断 · 累积校准防失控
  // 余弦距离 > 0.3（约 43° 夹角）→ 按比例回拉至阈值，引入 base 兜底维度
  const drift = cosineDistance(result, base);
  if (drift > DRIFT_FUSE) {
    const pullback = DRIFT_FUSE / drift;
    trackFeedback('calibrate.fuse', {
      drift: Math.round(drift * 1000) / 1000,
      threshold: DRIFT_FUSE,
      pullback: Math.round(pullback * 1000) / 1000,
    });
    const fused = lerpVector(base, result, pullback);
    // 覆盖 result · 后续 calibrate.result 埋点记录的是熔断后的值
    for (const dim of PERSONA_DIMS) {
      result[dim] = fused[dim];
    }
  }

  trackFeedback('calibrate.result', {
    vector: result,
    changed: !PERSONA_DIMS.every((d) => result[d] === base[d]),
    drift: Math.round(drift * 1000) / 1000,
    fused: drift > DRIFT_FUSE,
  });

  return result;
}

/**
 * 校准结果（含审计元数据）· 用于 audit 日志记录
 *
 * calibrateVector 的薄包装 · 不改原 API · 仅在外层补算 drift/fused 供审计
 * drift 重新计算（6 次乘法，可忽略）· 避免改动 calibrateVector 返回类型破坏测试
 */
export interface CalibrateResult {
  /** 校准后向量（已应用漂移熔断） */
  vector: PersonaVector;
  /** 校准后向量与 base 的余弦距离（熔断前）· 0=同向，1=正交 */
  drift: number;
  /** 是否触发漂移熔断 · drift > 0.3 */
  fused: boolean;
}

/**
 * 校准向量并返回审计元数据 · 供 appStore 写入 audit 日志
 *
 * 与 calibrateVector 行为一致 · 额外返回 drift/fused 供审计追溯
 */
export function calibrateVectorWithAudit(
  base: PersonaVector,
  feedback: FeedbackSignal[],
  recommendedVec: PersonaVector,
): CalibrateResult {
  const vector = calibrateVector(base, feedback, recommendedVec);
  const drift = cosineDistance(vector, base);
  return {
    vector,
    drift: Math.round(drift * 1000) / 1000,
    fused: drift > DRIFT_FUSE,
  };
}
