/**
 * 气味定制模块类型定义 · ScentLab
 *
 * 五步流程：选基础 → 拖拽组合配方 → 预览气味 → 选交付方式 → 输出结果
 * 与人格系统联动 · MBTI 派生推荐香味基础与调性组合
 */

/** 香味基础调性 · 类似基酒 */
export type ScentBaseType =
  | 'woody' // 木质调
  | 'floral' // 花香调
  | 'fruity' // 果香调
  | 'spicy' // 辛香调
  | 'herbal' // 草本调
  | 'oceanic'; // 海洋调

/** 香味层 · 前中后调 */
export type ScentNoteLayer = 'top' | 'heart' | 'base';

/** 交付方式 */
export type DeliveryMethod =
  | 'preorder' // 提前定制
  | 'onetime' // 单次调制
  | 'subscription' // 订阅制
  | 'digital'; // 数字配方

/** 精油瓶类型 */
export type BottleType =
  | 'roller' // 滚珠瓶
  | 'spray' // 喷雾瓶
  | 'dropper' // 滴管瓶
  | 'diffuser'; // 香薰石/扩香木

/** 气味定制流程步骤 */
export type ScentLabStep =
  | 'base' // 第一步：选基础
  | 'recipe' // 第二步：拖拽组合
  | 'preview' // 第三步：预览气味
  | 'delivery' // 第四步：选交付方式
  | 'result'; // 第五步：输出结果

/** 香味基础 */
export interface ScentBase {
  id: ScentBaseType;
  label: string;
  en: string;
  symbol: string;
  color: string;
  traits: string[];
  mbtiTypes: string[];
  desc: string;
}

/** 香味单卡 · 前中后调的可选原料 */
export interface ScentNote {
  id: string;
  label: string;
  en: string;
  layer: ScentNoteLayer;
  color: string;
  /** 分子符号 · 用于乐高拼图动画的积木标识 */
  molecule: string;
  desc: string;
}

/** 交付方式 */
export interface DeliveryOption {
  id: DeliveryMethod;
  label: string;
  desc: string;
  priceRange: string;
  priceMin: number;
  priceMax: number;
  isSubscription?: boolean;
}

/** 精油瓶 */
export interface BottleOption {
  id: BottleType;
  label: string;
  capacity: string;
  useCase: string;
  symbol: string;
}

/** 用户配方 · 拖拽组合结果 */
export interface ScentRecipe {
  base: ScentBaseType | null;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  delivery: DeliveryMethod | null;
  bottle: BottleType | null;
}

/** MBTI 联动推荐 */
export interface MbtiScentRecommendation {
  mbti: string;
  bases: ScentBaseType[];
  notes: string[];
}

/** 完整气味定制结果 */
export interface ScentLabResult {
  recipe: ScentRecipe;
  description: string;
  createdAt: number;
  /** 线上注册的配方 ID · 复用用 */
  recipeId?: string;
  /** 线下预约凭证 · 杯垫定制 */
  reservationCode?: string;
}

/** 空配方 */
export const EMPTY_RECIPE: ScentRecipe = {
  base: null,
  topNotes: [],
  heartNotes: [],
  baseNotes: [],
  delivery: null,
  bottle: null,
};
