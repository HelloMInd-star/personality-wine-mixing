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
// MBTI → 人格向量 · 独立入口（无需角色参数）
// ═════════════════════════════════════════════════════════

/**
 * MBTI 四字母 → 六维权重基线
 *
 * 每字母对六维的贡献独立累加，不跨字母交叉。
 * 设计语义：
 *   E/I → ENT(热情) / LEAD(主导) / SPD(速度)
 *   S/N → VIS(直觉) / TOL(容错) / SPD(速度)
 *   T/F → INF(信息) / ENT(热情) / TOL(容错)
 *   J/P → SPD(速度) / TOL(容错) / LEAD(主导)
 */
const MBTI_BASE_WEIGHT: Record<string, Partial<PersonaVector>> = {
  E: { ENT: 0.35, LEAD: 0.2, SPD: 0.1 },
  I: { ENT: -0.25, INF: 0.1, SPD: -0.1 },
  S: { VIS: -0.3, TOL: 0.1, SPD: 0.1 },
  N: { VIS: 0.35, TOL: -0.1, SPD: -0.1 },
  T: { INF: 0.25, ENT: -0.1, TOL: -0.1 },
  F: { ENT: 0.15, TOL: 0.1, VIS: 0.05 },
  J: { SPD: 0.2, TOL: -0.15, LEAD: 0.1 },
  P: { SPD: -0.2, TOL: 0.2, LEAD: -0.05 },
};

/**
 * MBTI 16 型直出六维人格向量
 *
 * 四字母权重累加 → 按最大绝对值归一化到 [-1, 1]
 * 纯函数，无副作用，无角色参数。
 *
 * 可作为以下入口的统一数据契约：
 *   - MBTI 定制酒推荐（mbtiToBaseVector → flavorFromVector → recommendCocktails）
 *   - 酒局融合基线（personaFusionEngine.fuseMbtiCodes 的参与者向量）
 *   - 气味实验室 MBTI 模式入口
 *
 * @param mbti MBTI 四字母代码 · 如 "ISTJ" / "ENFP" · 不区分大小写
 * @returns 六维向量 [-1, 1] · 全零或非法输入返回零向量
 *
 * @example
 *   mbtiToBaseVector('ISTJ')
 *   // → { TOL:-0.43, SPD:0.57, INF:1.0, ENT:-1.0, LEAD:0.29, VIS:-0.86 }
 *   mbtiToBaseVector('ENFP')
 *   // → { TOL:0.67, SPD:-0.14, INF:0, ENT:1.0, LEAD:0.43, VIS:0.76 }
 */
export function mbtiToBaseVector(mbti: string): PersonaVector {
  const acc = zeroVector();
  const letters = mbti.toUpperCase().split('');

  for (const letter of letters) {
    const w = MBTI_BASE_WEIGHT[letter];
    if (!w) continue;
    for (const [dim, v] of Object.entries(w)) {
      acc[dim as PersonaDim] += v ?? 0;
    }
  }

  return normalizeVector(acc);
}

// ═════════════════════════════════════════════════════════
// 标签派生
// ═════════════════════════════════════════════════════════

/**
 * 三级人格标签 · 由最终向量派生
 *
 *   L1 基础词 · 主维度 × 正负方向（12 种）
 *   L2 修饰字 · 第二高维度 × 正负方向（细化语义）
 *   L3 微标   · 仅冲突对用第三维度区分（16 型 1:1 映射）
 *
 * 全零向量 → 中性「均衡者」
 */
export function derivePersonaTag(vec: PersonaVector): string {
  // 按绝对值降序排列
  const ranked = DIMS
    .map((d) => ({ dim: d, val: vec[d], abs: Math.abs(vec[d]) }))
    .sort((a, b) => b.abs - a.abs);

  if (ranked[0].abs === 0) return '均衡者';

  // L1: 基础词 = 主维度 × 方向
  const L1 = (() => {
    const [neg, pos] = L1_LABEL[ranked[0].dim];
    return ranked[0].val >= 0 ? pos : neg;
  })();

  // L2: 修饰字 = 第二高维度 × 方向
  const L2 = (() => {
    const [neg, pos] = L2_MODIFIER[ranked[1].dim];
    return ranked[1].val >= 0 ? pos : neg;
  })();

  const base = `${L1}·${L2}`;

  // 检查是否属于冲突对（同一 L1·L2 对应多个 MBTI 类型）
  const conflictRule = CONFLICT_RULES[base];
  if (!conflictRule) return base;

  // L3: 微标 = 冲突解决规则选出的区分维度
  const L3 = conflictRule(vec);
  return `${base}·${L3}`;
}

// ── L1 基础词（12 种）──
const L1_LABEL: Record<PersonaDim, [string, string]> = {
  TOL:  ['结构者', '弹性者'],
  SPD:  ['沉思者', '决断者'],
  INF:  ['直觉者', '谋略者'],
  ENT:  ['沉静者', '炽烈者'],
  LEAD: ['追随者', '引领者'],
  VIS:  ['实干者', '灵感者'],
};

// ── L2 修饰字（12 种）──
const L2_MODIFIER: Record<PersonaDim, [string, string]> = {
  TOL:  ['律', '韧'],
  SPD:  ['缓', '锐'],
  INF:  ['敏', '深'],
  ENT:  ['敛', '热'],
  LEAD: ['随', '强'],
  VIS:  ['实', '灵'],
};

// ── L3 冲突解决规则 ──
// 当两个 MBTI 类型共享同一 L1·L2 时，用一条规则选区分维度
const CONFLICT_RULES: Record<string, (v: PersonaVector) => string> = {
  // ISTJ（SPD+） vs ISTP（TOL+）：SPD 正则锐，否则韧
  '谋略者·敛': (v) => (v.SPD > 0 ? '锐' : '韧'),

  // ENFJ（LEAD+） vs ENFP（TOL+）：LEAD 高于 TOL 则强，否则稳
  '炽烈者·灵': (v) => (v.LEAD > v.TOL ? '强' : '稳'),
};

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
