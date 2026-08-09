/**
 * 调酒类型系统
 * 每一款酒都是一个有性格的夜的故事
 */

/** 风味维度键 · 八维风味轮 */
export type FlavorKey =
  | 'sweet' // 甜
  | 'sour' // 酸
  | 'bitter' // 苦
  | 'strong' // 烈
  | 'smoky' // 烟熏
  | 'fruity' // 果香
  | 'herbal' // 草本
  | 'creamy'; // 柔润

/** 风味元数据 */
export interface FlavorMeta {
  key: FlavorKey;
  label: string;
  /** 风味在风味轮中的色相 */
  color: string;
  /** 一句诗化描述 */
  poem: string;
}

/** 基酒类型 */
export type BaseSpirit =
  | 'gin' // 金酒
  | 'whisky' // 威士忌
  | 'rum' // 朗姆
  | 'vodka' // 伏特加
  | 'tequila' // 龙舌兰
  | 'brandy' // 白兰地
  | 'liqueur' // 利口酒
  | 'wine' // 葡萄酒
  | 'sake' // 清酒
  | 'none'; // 无酒精

/** 配方材料 */
export interface Ingredient {
  name: string;
  amount: string; // 用量如 "45ml"、"2 dashes"
  /** 可选 · 材料说明 */
  note?: string;
}

/** 调制步骤 */
export interface RecipeStep {
  order: number;
  text: string;
}

/** 酒杯类型 */
export type GlassType =
  | 'coupe' // 浅碟杯
  | 'martini' // 马天尼杯
  | 'highball' // 高球杯
  | 'rocks' // 古典杯
  | 'flute' // 笛形杯
  | 'snifter' // 白兰地杯
  | 'mug' // 啤酒杯
  | 'tiki'; // 提基杯

/** 情绪标签 · 用于场景化推荐 */
export type MoodTag =
  | 'calm' // 沉静
  | 'passion' // 热烈
  | 'melancholy' // 怅然
  | 'elegant' // 雅致
  | 'rebel' // 叛逆
  | 'romantic' // 浪漫
  | 'mystery' // 神秘
  | 'celebration'; // 庆典

/** 情绪元数据 · 用于情绪调节器 UI */
export interface MoodMeta {
  key: MoodTag;
  /** 中文标签 */
  label: string;
  /** 情绪主色 · 用于调节器光晕 */
  color: string;
  /** 诗化描述 */
  poem: string;
  /** 单字符号 · 呼应镜月隐喻 */
  symbol: string;
}

/** 调酒配方 · 完整定义 */
export interface Cocktail {
  id: string;
  name: string; // 中文名
  nameEn: string; // 英文名
  /** 一句调性引语 */
  tagline: string;
  /** 故事/调性叙事 */
  story: string;
  baseSpirit: BaseSpirit;
  abv: number; // 酒精度 %
  glass: GlassType;
  garnish: string; // 装饰
  /** 八维风味 0-10 */
  flavorProfile: Record<FlavorKey, number>;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  /** 情绪标签 */
  moods: MoodTag[];
  /** 视觉主色 · 用于卡片光晕 */
  auraColor: string;
  /** 适配的人格原型倾向（与 PersonalityArchetype.code 对应） */
  archetypeAffinity: string[];
  /** 难度 1-5 */
  difficulty: number;
}

/** 推荐结果 · 带匹配度 */
export interface CocktailRecommendation {
  cocktail: Cocktail;
  /** 0-100 匹配度 */
  matchScore: number;
  /** 匹配理由 */
  reasons: string[];
}
