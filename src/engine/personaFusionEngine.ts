/**
 * personaFusionEngine · 牌类人格融合引擎
 *
 * Y.Mine 可编程酒馆的「数据入口层」融合核心：
 *   四套牌类（塔罗/星盘/扑克/德州）采集结果 → 六维人格向量
 *
 * 融合公式：
 *   final = tarot×0.3 + zodiac×0.3 + poker×0.2 + texas×0.2
 *   缺失模块按 0 向量贡献，权重不重新分配（MVP 简化）
 *   最终归一化到 [-1, 1]，并派生人格标签
 *
 * 六维向量：TOL(容错) SPD(速度) INF(信息) ENT(热情) LEAD(主导) VIS(直觉)
 *
 * 派生链：
 *   TarotResult   → 三牌阵加权（过去0.2/现在0.5/未来0.3）+ 逆位反转
 *   ZodiacResult  → 六星体 × 四象 权重累加
 *   PokerResult   → 牌型直接映射
 *   TexasResult   → 行为计数 + 决策速度 + 诈唬加成
 *   四向量加权融合 → 归一化 → 人格标签
 *
 * 纯函数，无副作用，可独立测试
 * 延续 lightEngine / scentEngine 的程序化派生模式
 */

import type {
  PersonaVector,
  PersonaDim,
  FusionInput,
  FusionBreakdown,
  PersonaFusion,
  TarotResult,
  TarotPosition,
  ZodiacResult,
  PokerResult,
  TexasResult,
  TexasAction,
} from '../types/personaFusion';
import { getTarotCardById } from '../data/tarotCards';
import {
  ZODIAC_PERSONA_MAP,
  SIGN_ELEMENT,
  POKER_HAND_MAP,
  TEXAS_ACTION_MAP,
  TEXAS_SPEED_MAP,
  TEXAS_BLUFF_BONUS,
  MODULE_WEIGHT,
} from '../data/personaFusionMaps';

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

// ═════════════════════════════════════════════════════════
// 归一化
// ═════════════════════════════════════════════════════════

/** 空向量 · 融合前的初始态 */
export function zeroVector(): PersonaVector {
  return { TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0 };
}

/**
 * 按最大绝对值归一化到 [-1, 1]
 * 全零向量原样返回（避免除零）
 */
export function normalizeVector(vec: PersonaVector): PersonaVector {
  const maxAbs = Math.max(...DIMS.map((d) => Math.abs(vec[d])));
  if (maxAbs === 0) return { ...vec };
  const out = {} as PersonaVector;
  for (const d of DIMS) {
    out[d] = Math.round((vec[d] / maxAbs) * 1000) / 1000;
  }
  return out;
}

// ═════════════════════════════════════════════════════════
// 塔罗 → 人格向量
// ═════════════════════════════════════════════════════════

const TAROT_POSITION_WEIGHT: Record<TarotPosition, number> = {
  past: 0.2,
  present: 0.5,
  future: 0.3,
};

/**
 * 塔罗 → 人格向量
 * 三张牌加权：过去 0.2 / 现在 0.5 / 未来 0.3
 * 逆位 → 权重反转
 */
export function tarotToVector(result: TarotResult): PersonaVector {
  const vec = zeroVector();
  for (const drawn of result.cards) {
    const card = getTarotCardById(drawn.cardId);
    if (!card) continue;
    let weights = card.personaWeights;
    if (drawn.isReversed) {
      // 逆位 → 权重反转
      weights = Object.fromEntries(
        Object.entries(weights).map(([k, v]) => [k, -v!]),
      ) as typeof weights;
    }
    const pw = TAROT_POSITION_WEIGHT[drawn.position];
    for (const [dim, w] of Object.entries(weights)) {
      vec[dim as keyof PersonaVector] += (w ?? 0) * pw;
    }
  }
  return vec;
}

// ═════════════════════════════════════════════════════════
// 星盘 → 人格向量
// ═════════════════════════════════════════════════════════

const PLANETS = ['太阳', '月亮', '上升', '水星', '火星', '金星'] as const;

/**
 * 星盘 → 人格向量
 * 六星体（太阳/月亮/上升/水星/火星/金星）× 四象 → 权重累加
 */
export function zodiacToVector(result: ZodiacResult): PersonaVector {
  const vec = zeroVector();
  const signByKey: Record<string, string> = {
    太阳: result.sunSign,
    月亮: result.moonSign,
    上升: result.risingSign,
    水星: result.mercurySign,
    火星: result.marsSign,
    金星: result.venusSign,
  };

  for (const planet of PLANETS) {
    const sign = signByKey[planet];
    const el = SIGN_ELEMENT[sign];
    if (!el) continue;
    const weights = ZODIAC_PERSONA_MAP[`${planet}_${el}`];
    if (!weights) continue;
    for (const [dim, w] of Object.entries(weights)) {
      vec[dim as keyof PersonaVector] += w ?? 0;
    }
  }
  return vec;
}

// ═════════════════════════════════════════════════════════
// 扑克 → 人格向量
// ═════════════════════════════════════════════════════════

/**
 * 扑克 → 人格向量
 * 牌型直接映射权重
 */
export function pokerToVector(result: PokerResult): PersonaVector {
  const vec = zeroVector();
  const weights = POKER_HAND_MAP[result.handType];
  if (weights) {
    for (const [dim, w] of Object.entries(weights)) {
      vec[dim as keyof PersonaVector] += w ?? 0;
    }
  }
  return vec;
}

// ═════════════════════════════════════════════════════════
// 德州 → 人格向量
// ═════════════════════════════════════════════════════════

function getSpeedTier(ms: number): keyof typeof TEXAS_SPEED_MAP {
  if (ms < 3000) return 'fast';
  if (ms < 8000) return 'mid';
  return 'slow';
}

/**
 * 德州 → 人格向量
 * 行为统计：弃牌数/加注数/跟注数 → 行为权重
 * 决策速度档位 → SPD 权重
 * 诈唬成功 → 额外直觉加成
 */
export function texasToVector(result: TexasResult): PersonaVector {
  const vec = zeroVector();

  // 行为计数 → 权重累加
  const counts: Record<TexasAction, number> = { fold: 0, call: 0, raise: 0 };
  for (const a of result.userActions) counts[a]++;

  for (const action of Object.keys(counts) as TexasAction[]) {
    const w = TEXAS_ACTION_MAP[action];
    const n = counts[action];
    for (const [dim, v] of Object.entries(w)) {
      vec[dim as keyof PersonaVector] += (v ?? 0) * n;
    }
  }

  // 决策速度 · avgDecisionTime ≤ 0 视为未决策，跳过 speed 档位（避免 0 误判为 fast）
  if (result.avgDecisionTime > 0) {
    const tier = getSpeedTier(result.avgDecisionTime);
    const speedW = TEXAS_SPEED_MAP[tier];
    for (const [dim, v] of Object.entries(speedW)) {
      vec[dim as keyof PersonaVector] += v ?? 0;
    }
  }

  // 诈唬加成
  if (result.bluffDetected) {
    for (const [dim, v] of Object.entries(TEXAS_BLUFF_BONUS)) {
      vec[dim as keyof PersonaVector] += v ?? 0;
    }
  }

  return vec;
}

// ═════════════════════════════════════════════════════════
// 标签派生
// ═════════════════════════════════════════════════════════

/**
 * 由最终向量派生人格标签
 * 取绝对值最大的维度作为主调，正负号作为倾向
 * 全零向量返回中性「均衡者」· 避免空输入误派冒险者
 */
export function derivePersonaTag(vec: PersonaVector): string {
  let maxDim: PersonaDim = 'TOL';
  let maxAbs = 0;
  for (const d of DIMS) {
    const a = Math.abs(vec[d]);
    if (a > maxAbs) {
      maxAbs = a;
      maxDim = d;
    }
  }

  // 全零向量 → 中性均衡态，不误派任何倾向
  if (maxAbs === 0) return '均衡者';

  const LABEL: Record<PersonaDim, [string, string]> = {
    // [负倾向, 正倾向]
    TOL: ['审慎者', '冒险者'],
    SPD: ['沉思者', '决断者'],
    INF: ['直觉者', '谋略者'],
    ENT: ['沉静者', '炽烈者'],
    LEAD: ['追随者', '引领者'],
    VIS: ['实证者', '灵感者'],
  };

  const [neg, pos] = LABEL[maxDim];
  return vec[maxDim] >= 0 ? pos : neg;
}

// ═════════════════════════════════════════════════════════
// 融合
// ═════════════════════════════════════════════════════════

/**
 * 融合四模块结果
 * 接受任意子集，缺失模块跳过
 * 返回的 breakdown 中各模块 vector 已填充
 *
 * @example
 *   fusePersona({ tarot: { result: tarotResult } })  // 仅塔罗
 *   fusePersona({ tarot, zodiac, poker, texas })     // 全融合
 */
export function fusePersona(input: FusionInput): PersonaFusion {
  const acc = zeroVector();
  const breakdown: FusionBreakdown = {};

  if (input.tarot) {
    const v = tarotToVector(input.tarot.result);
    breakdown.tarot = { vector: v, result: input.tarot.result };
    const w = MODULE_WEIGHT.tarot;
    for (const d of DIMS) acc[d] += v[d] * w;
  }
  if (input.zodiac) {
    const v = zodiacToVector(input.zodiac.result);
    breakdown.zodiac = { vector: v, result: input.zodiac.result };
    const w = MODULE_WEIGHT.zodiac;
    for (const d of DIMS) acc[d] += v[d] * w;
  }
  if (input.poker) {
    const v = pokerToVector(input.poker.result);
    breakdown.poker = { vector: v, result: input.poker.result };
    const w = MODULE_WEIGHT.poker;
    for (const d of DIMS) acc[d] += v[d] * w;
  }
  if (input.texas) {
    const v = texasToVector(input.texas.result);
    breakdown.texas = { vector: v, result: input.texas.result };
    const w = MODULE_WEIGHT.texas;
    for (const d of DIMS) acc[d] += v[d] * w;
  }

  // 缺失模块不补权（MVP 简化）· 标签由最大维度决定，受缩放影响小
  const finalVector = normalizeVector(acc);
  return {
    breakdown,
    finalVector,
    personaTag: derivePersonaTag(finalVector),
    submittedAt: Date.now(),
  };
}
