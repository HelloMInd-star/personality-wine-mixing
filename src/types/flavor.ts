/**
 * 人格 → 风味映射系统
 * 人格五维 (OCEAN) → 风味八维的权重矩阵
 * 这是 觉醉 双轨系统的核心纽带
 */

import type { FlavorKey } from './cocktail';
import type { TraitKey } from './personality';

/** 人格维度对风味维度的倾向权重 */
export interface FlavorWeight {
  flavor: FlavorKey;
  /** 正值表示该人格维度倾向于该风味；负值表示排斥 */
  weight: number;
}

/** 每个人格维度对应的风味权重表 */
export type TraitFlavorMap = Record<TraitKey, FlavorWeight[]>;

/** 映射规则 · 人格维度如何影响风味偏好 */
export interface MappingRule {
  trait: TraitKey;
  /** 当该维度分数高于此阈值时，规则激活 */
  threshold: number;
  highFlavors: FlavorWeight[]; // 高分时倾向
  lowFlavors: FlavorWeight[]; // 低分时倾向
  rationale: string; // 映射理由（用于解释推荐）
}
