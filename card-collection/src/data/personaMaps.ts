/**
 * 星盘 / 扑克 / 德州 → 人格维度映射表
 * 塔罗的权重内嵌在每张牌数据中，见 tarotCards.ts
 */
import type { PersonaVector, PokerHandType } from '../types';

// ═════════════════════════════════════════════════════════
// 星座四象
// ═════════════════════════════════════════════════════════

export type Element = '火' | '土' | '风' | '水';

export const SIGN_ELEMENT: Record<string, Element> = {
  白羊: '火', 狮子: '火', 射手: '火',
  金牛: '土', 处女: '土', 摩羯: '土',
  双子: '风', 天秤: '风', 水瓶: '风',
  巨蟹: '水', 天蝎: '水', 双鱼: '水',
};

export const ALL_SIGNS = Object.keys(SIGN_ELEMENT);

/** 星体 × 四象 → 人格权重 */
export const ZODIAC_PERSONA_MAP: Record<string, Partial<PersonaVector>> = {
  // 太阳 · 核心自我
  太阳_火: { LEAD: 0.15, TOL: 0.1 },
  太阳_土: { INF: 0.15, TOL: -0.1 },
  太阳_风: { VIS: 0.15, SPD: 0.1 },
  太阳_水: { ENT: 0.15, VIS: 0.1 },
  // 月亮 · 情感本能
  月亮_火: { LEAD: 0.1, TOL: 0.1 },
  月亮_土: { INF: 0.1, SPD: -0.1 },
  月亮_风: { VIS: 0.1, SPD: 0.1 },
  月亮_水: { ENT: 0.2, VIS: 0.1 },
  // 上升 · 外在面具
  上升_火: { LEAD: 0.12, SPD: 0.08 },
  上升_土: { INF: 0.12, TOL: -0.08 },
  上升_风: { VIS: 0.12, SPD: 0.08 },
  上升_水: { ENT: 0.12, VIS: 0.08 },
  // 水星 · 思维沟通
  水星_火: { SPD: 0.15, LEAD: 0.08 },
  水星_土: { INF: 0.18 },
  水星_风: { SPD: 0.12, VIS: 0.1 },
  水星_水: { VIS: 0.12, ENT: 0.08 },
  // 火星 · 行动力
  火星_火: { TOL: 0.18, SPD: 0.12 },
  火星_土: { INF: 0.1, TOL: 0.08 },
  火星_风: { SPD: 0.12, VIS: 0.08 },
  火星_水: { ENT: 0.12, TOL: 0.08 },
  // 金星 · 情感审美
  金星_火: { ENT: 0.12, LEAD: 0.08 },
  金星_土: { INF: 0.1, ENT: 0.08 },
  金星_风: { VIS: 0.1, ENT: 0.08 },
  金星_水: { ENT: 0.15, VIS: 0.1 },
};

// ═════════════════════════════════════════════════════════
// 扑克牌型 → 人格权重
// ═════════════════════════════════════════════════════════

export const POKER_HAND_MAP: Record<PokerHandType, Partial<PersonaVector>> = {
  同花顺: { TOL: 0.25, SPD: 0.2 }, // 极致的策略与运气
  四条: { TOL: 0.2, INF: 0.1 },
  葫芦: { TOL: 0.15, LEAD: 0.1 },
  同花: { VIS: 0.15, INF: 0.1 },
  顺子: { SPD: 0.15, TOL: 0.1 },
  三条: { TOL: 0.1, LEAD: 0.1 },
  两对: { INF: 0.1, SPD: 0.1 },
  对子: { INF: 0.1 },
  高牌: { TOL: -0.1 }, // 运气不佳，风险偏好低
};

// ═════════════════════════════════════════════════════════
// 德州行为 → 人格权重
// ═════════════════════════════════════════════════════════

export const TEXAS_ACTION_MAP = {
  fold: { TOL: -0.15, SPD: -0.1 }, // 弃牌 → 风险规避
  raise: { TOL: 0.2, SPD: 0.15 }, // 加注 → 风险偏好
  call: { INF: 0.1 }, // 跟注 → 信息依赖
} as const;

/** 决策速度档位 → 权重（决策快 → SPD 高） */
export const TEXAS_SPEED_MAP = {
  fast: { SPD: 0.2 }, // < 3s
  mid: { SPD: 0.05 }, // 3-8s
  slow: { SPD: -0.12 }, // > 8s
} as const;

/** 诈唬成功 → 高直觉 */
export const TEXAS_BLUFF_BONUS = { TOL: 0.25, VIS: 0.15 } as const;
