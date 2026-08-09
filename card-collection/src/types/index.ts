/**
 * 牌类人格采集系统 · 类型定义
 * 六维人格向量 + 四类牌数据契约
 */

/** 六维人格向量维度 */
export type PersonaDim = 'TOL' | 'SPD' | 'INF' | 'ENT' | 'LEAD' | 'VIS';

/** 维度含义：容错/速度/信息/热情/主导/直觉 */
export type PersonaVector = Record<PersonaDim, number>;

/** 维度中文标签 */
export const DIM_LABEL: Record<PersonaDim, string> = {
  TOL: '容错',
  SPD: '速度',
  INF: '信息',
  ENT: '热情',
  LEAD: '主导',
  VIS: '直觉',
};

/** 维度简述 */
export const DIM_DESC: Record<PersonaDim, string> = {
  TOL: '风险偏好 · 容忍不确定性',
  SPD: '决策速度 · 果断或审慎',
  INF: '信息依赖 · 谋定而后动',
  ENT: '热情强度 · 内敛或炽烈',
  LEAD: '主导倾向 · 引领或追随',
  VIS: '直觉权重 · 理性或灵感',
};

// ═════════════════════════════════════════════════════════
// 塔罗牌
// ═════════════════════════════════════════════════════════

export interface TarotCard {
  id: number;
  name: string;
  nameEn: string;
  arcana: 'major' | 'minor';
  element: '火' | '风' | '水' | '土' | '无';
  meaningUpright: string;
  meaningReversed: string;
  /** 对六维人格的权重影响 (-0.25 ~ +0.25) */
  personaWeights: Partial<PersonaVector>;
}

/** 三张牌位置 */
export type TarotPosition = 'past' | 'present' | 'future';

export interface TarotDrawnCard {
  cardId: number;
  position: TarotPosition;
  isReversed: boolean;
}

export interface TarotResult {
  cards: TarotDrawnCard[];
  submittedAt: number;
}

// ═════════════════════════════════════════════════════════
// 星盘
// ═════════════════════════════════════════════════════════

export interface ZodiacInput {
  birthDate: string; // "1995-10-15"
  birthTime: string; // "14:30"
  birthCity: string;
}

export interface ZodiacResult {
  input: ZodiacInput;
  sunSign: string;
  moonSign: string;
  risingSign: string;
  mercurySign: string;
  marsSign: string;
  venusSign: string;
  submittedAt: number;
}

// ═════════════════════════════════════════════════════════
// 扑克
// ═════════════════════════════════════════════════════════

export type PokerSuit = '♠' | '♥' | '♦' | '♣';
export type PokerRank =
  | 'A' | '2' | '3' | '4' | '5' | '6' | '7'
  | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface PokerCard {
  suit: PokerSuit;
  rank: PokerRank;
}

export type PokerHandType =
  | '同花顺' | '四条' | '葫芦' | '同花'
  | '顺子' | '三条' | '两对' | '对子' | '高牌';

export interface PokerResult {
  hand: PokerCard[];
  handType: PokerHandType;
  highCard: PokerRank;
  submittedAt: number;
}

// ═════════════════════════════════════════════════════════
// 德州
// ═════════════════════════════════════════════════════════

export type TexasAction = 'fold' | 'call' | 'raise';

export interface TexasResult {
  holeCards: PokerCard[];
  boardCards: PokerCard[];
  userActions: TexasAction[];
  handRank: PokerHandType | null;
  won: boolean;
  /** 平均决策时长 ms */
  avgDecisionTime: number;
  /** 是否检测到诈唬 */
  bluffDetected: boolean;
  submittedAt: number;
}

// ═════════════════════════════════════════════════════════
// 融合结果
// ═════════════════════════════════════════════════════════

export type CardModule = 'tarot' | 'zodiac' | 'poker' | 'texas';

/** 各模块贡献的人格向量 + 原始记录 */
export interface FusionBreakdown {
  tarot?: { vector: PersonaVector; result: TarotResult };
  zodiac?: { vector: PersonaVector; result: ZodiacResult };
  poker?: { vector: PersonaVector; result: PokerResult };
  texas?: { vector: PersonaVector; result: TexasResult };
}

export interface PersonaFusion {
  breakdown: FusionBreakdown;
  finalVector: PersonaVector;
  /** 由最终向量派生的人格标签 */
  personaTag: string;
  submittedAt: number;
}
