/**
 * 角色人格矩阵 · 类型契约
 *
 * 三角色（创业家/投资人/架构师）× 10 位代表人物
 * 每位含 MBTI + 六维向量 + 核心标签 + 酒体风格
 *
 * 作为 CocktailPage 的「角色身份」入口产物：
 *   用户选择角色 → 系统按向量匹配该组内最接近的人物 → 输出人格标签 + 角色标签 + 酒体
 */

import type { PersonaVector } from './personaFusion';
import type { FlavorKey, CocktailRecommendation } from './cocktail';

/** 角色类型 */
export type RoleType = 'entrepreneur' | 'investor' | 'architect';

/** 角色元数据 · 三角色的产品定位 */
export interface RoleMeta {
  type: RoleType;
  /** 中文标签 · 创业家/投资人/架构师 */
  label: string;
  /** 英文 */
  en: string;
  /** 单字符号 · 用于 UI */
  symbol: string;
  /** 代表色 */
  color: string;
  /** 角色描述 */
  description: string;
  /** 维度倾向 · 如 TOL↑, LEAD↑ */
  vectorTendency: Partial<PersonaVector>;
  /** 典型酒体风格 */
  cocktailStyle: string;
  /** 酒体风格关键词 */
  cocktailKeywords: string[];
}

/** 代表人物 · 角色矩阵单元 */
export interface RolePersona {
  /** 序号 1-10 */
  index: number;
  /** 角色类型 */
  role: RoleType;
  /** 姓名 */
  name: string;
  /** 核心标签 */
  coreTags: string[];
  /** 人格特质 */
  traits: string[];
  /** MBTI */
  mbti: string;
  /** 六维向量 · 由 MBTI 基线 × 角色倾向派生 */
  vector: PersonaVector;
  /** 个人酒体风格偏好（叠加角色风格） */
  cocktailStyle: string;
}

/** 角色匹配结果 */
export interface RoleMatchResult {
  /** 匹配的人物 */
  persona: RolePersona;
  /** 所属角色元数据 */
  role: RoleMeta;
  /** 输出主标签 · 如 "INTJ · 谋略者 · 属于投资人人格" */
  displayTag: string;
  /** MBTI */
  mbti: string;
  /** 由向量派生的人格标签（复用 derivePersonaTag 逻辑） */
  personaTag: string;
  /** 匹配度 0-1（有向量时为相似度，无向量时为默认代表） */
  matchScore: number;
  /** 推荐酒体风格描述 */
  cocktailStyle: string;
  /** 是否为默认代表（无向量时） */
  isDefault: boolean;
  /** 角色层调酒调整 · 风味系数 + 特效 + 温度 + 服务备注 */
  flavorAdjustment: RoleFlavorAdjustment;
  /** 专属调酒推荐 · 由 基础向量 × 角色系数 派生 */
  cocktail: CocktailRecommendation | null;
  /** 输出长标签 · 如 "INTJ · 战略建筑师 · 创业家型调酒" */
  cocktailTag: string;
}

/** 视觉特效倾向 · 角色层叠加在基础酒体之上 */
export type RoleEffect = 'fire' | 'mist' | 'layered';

/** 温度倾向 · 角色层调整 */
export type RoleTemperature = 'hot' | 'cold' | 'normal';

/**
 * 角色层调酒调整系数 · 在基础 MBTI 酒体之上叠加
 *
 * 派生链：
 *   基础向量 × 角色系数 → 调整后向量 → flavorFromVector → 风味偏好
 *   风味偏好 + flavorShift → 最终偏好 → recommendCocktails
 *
 * 设计原则：
 *   - 基础层（MBTI → 酒体）不变
 *   - 角色层只做"叠加调整"，不替换基础逻辑
 *   - 同一个 INTJ，选不同角色得到不同调酒
 */
export interface RoleFlavorAdjustment {
  /** 角色类型 */
  role: RoleType;
  /** 向量调整系数 · 叠加到基础向量上 */
  vectorAdj: Partial<PersonaVector>;
  /** 风味偏移 · 直接叠加到 flavorFromVector 输出的 preference 上（-0.3 ~ +0.3） */
  flavorShift: Partial<Record<FlavorKey, number>>;
  /** 风味主调标签 · 如 "辛辣" / "木质" / "花香" */
  flavorShiftLabel: string;
  /** 视觉特效倾向 */
  effect: RoleEffect;
  /** 特效中文标签 */
  effectLabel: string;
  /** 温度倾向 */
  temperature: RoleTemperature;
  /** 温度中文标签 */
  temperatureLabel: string;
  /** 服务备注 · 如 "加冰" / "分层结构" / "火焰效果" */
  servingNote: string;
}
