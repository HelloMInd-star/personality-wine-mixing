/**
 * 人格类型系统 · 大五人格 OCEAN 模型
 * Y.Mine 以五维人格画像作为调酒推荐的内在引线
 */

/** 人格五大维度键 */
export type TraitKey =
  | 'openness' // 开放性 · 创新与经验
  | 'conscientiousness' // 尽责性 · 自律与严谨
  | 'extraversion' // 外向性 · 活力与社交
  | 'agreeableness' // 宜人性 · 信任与温和
  | 'neuroticism'; // 神经质 · 情绪敏感

/** 维度元数据 */
export interface TraitMeta {
  key: TraitKey;
  label: string;
  labelEn: string;
  shortLetter: string; // O / C / E / A / N
  description: string;
  highTrait: string; // 高分倾向描述
  lowTrait: string; // 低分倾向描述
  /** 维度代表色（用于雷达图与可视化） */
  color: string;
  /** 维度象征物 · 用于人格叙事 */
  symbol: string;
}

/** 人格画像 · 五维分数（0-100） */
export type PersonalityScores = Record<TraitKey, number>;

/** 李克特量表选项 */
export interface LikertOption {
  value: 1 | 2 | 3 | 4 | 5;
  label: string;
}

/** 测评题目 */
export interface PersonalityQuestion {
  id: string;
  dimension: TraitKey;
  text: string;
  /** 是否反向计分 */
  reverse: boolean;
}

/** 人格原型 · 由五维组合推导 */
export interface PersonalityArchetype {
  code: string; // 如 "The Dreamweaver"
  name: string; // 中文名
  tagline: string; // 一句话标语
  description: string; // 叙事描述
  /** 该原型的五维分布区间（用于匹配） */
  signature: Partial<Record<TraitKey, [number, number]>>;
  /** 对应的调性色 */
  auraColor: string;
}

/** 完整人格画像结果 */
export interface PersonalityProfile {
  scores: PersonalityScores;
  archetype: PersonalityArchetype;
  /** 由画像推导出的风味偏好权重 */
  flavorPreference: FlavorPreference;
  /** 生成时间戳 */
  createdAt: number;
}

/** 风味偏好 · 由人格映射而来（详见 flavor.ts） */
export interface FlavorPreference {
  [flavor: string]: number; // 0-1 权重
}
