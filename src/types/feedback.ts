/**
 * 喝后评分 · 类型契约
 *
 * 闭环：喝后评分 → 向量校准 → 推荐优化
 * 评分信号驱动 PersonaVector 朝推荐方向微调（高分靠拢 / 低分远离）
 */

import type { PersonaVector } from './personaFusion';

/** 三维度细分评分 · 1-5 整数，可选 */
export interface FeedbackDimensions {
  /** 口味 1-5 */
  flavor?: number;
  /** 气味 1-5 */
  scent?: number;
  /** 情绪 1-5 */
  mood?: number;
}

/**
 * 单次反馈信号 · 一次喝后评分 = 一条记录
 *
 * - rating：1-5 整数，≥4 朝推荐方向校准，≤2 反向，=3 中性不动
 * - recommendedVec：本次推荐所用向量快照 · 校准时判断方向所必需
 * - ts：提交时间戳，用于排序与去重
 */
export interface FeedbackSignal {
  /** 推荐产物 ID（鸡尾酒 id / 香味配方 YM-RP 凭证） */
  recipeId: string;
  /** 1-5 整数评分 */
  rating: number;
  /** 可选三维度细分 */
  dimensions?: FeedbackDimensions;
  /** 提交时间戳 Date.now() */
  ts: number;
  /** 本次推荐所用向量快照 · 校准方向依据（addFeedback 时由调用方传入） */
  recommendedVec?: PersonaVector;
}

/**
 * 校准审计条目 · 仅追加 · 用于追溯向量演变
 *
 * 三分区存储中的 audit 区条目结构：
 *   - raw：原始 FeedbackSignal[]（用户评分信号）
 *   - calibrated：最新校准后向量快照（可覆盖）
 *   - audit：本条目列表（仅追加，含 drift/fused 元数据）
 *
 * 触发：每次 getCalibratedVector 计算出新向量且与上次快照不同时追加一条
 */
export interface CalibrateAuditEntry {
  /** 校准动作时间戳 Date.now() */
  ts: number;
  /** 当时应用的 feedback 条数 */
  feedbackCount: number;
  /** 校准后向量与 base 的余弦距离（熔断前）· 0=同向，1=正交 */
  drift: number;
  /** 是否触发漂移熔断 · drift > 0.3 */
  fused: boolean;
  /** 校准后向量快照（已应用熔断）· 用于追溯 */
  vector: PersonaVector;
}
