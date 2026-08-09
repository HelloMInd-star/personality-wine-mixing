/**
 * 人格 → 风味映射规则
 * 五维 OCEAN 与八维风味的纽带，是 Y.Mine 双轨系统的引线
 * 每条规则述说：当某维倾向高低，杯中便偏向何种味道
 */

import type { MappingRule } from '../types/flavor';

/** 默认激活阈值 · 维度分数超过此值则激活高分倾向，低于 (100-此值) 则激活低分倾向 */
export const MAPPING_TRAIT_THRESHOLD = 60;

/**
 * 五维 → 八维风味的映射规则
 * weight 取值 -1 至 1：正为倾向，负为排斥
 */
export const FLAVOR_MAPPING_RULES: MappingRule[] = [
  {
    trait: 'openness',
    threshold: MAPPING_TRAIT_THRESHOLD,
    highFlavors: [
      { flavor: 'smoky', weight: 0.7 },
      { flavor: 'herbal', weight: 0.6 },
      { flavor: 'sour', weight: 0.2 },
    ],
    lowFlavors: [
      { flavor: 'sweet', weight: 0.6 },
      { flavor: 'fruity', weight: 0.5 },
      { flavor: 'creamy', weight: 0.2 },
    ],
    rationale:
      '开放性高者愿赴复杂之约，偏好烟熏与草本的纵深；低者安于熟悉，向甜与果香靠拢。',
  },
  {
    trait: 'conscientiousness',
    threshold: MAPPING_TRAIT_THRESHOLD,
    highFlavors: [
      { flavor: 'bitter', weight: 0.7 },
      { flavor: 'strong', weight: 0.6 },
    ],
    lowFlavors: [
      { flavor: 'fruity', weight: 0.5 },
      { flavor: 'creamy', weight: 0.5 },
      { flavor: 'sweet', weight: 0.2 },
    ],
    rationale:
      '尽责性高者信奉经典，苦与烈是其秩序；低者图一份轻松，果与润是其释然。',
  },
  {
    trait: 'extraversion',
    threshold: MAPPING_TRAIT_THRESHOLD,
    highFlavors: [
      { flavor: 'fruity', weight: 0.7 },
      { flavor: 'strong', weight: 0.6 },
      { flavor: 'sweet', weight: 0.2 },
    ],
    lowFlavors: [
      { flavor: 'herbal', weight: 0.6 },
      { flavor: 'smoky', weight: 0.5 },
      { flavor: 'bitter', weight: 0.2 },
    ],
    rationale:
      '外向者以明亮应世，果与烈是它的光；低者于沉静处自洽，草本与烟熏是它的影。',
  },
  {
    trait: 'agreeableness',
    threshold: MAPPING_TRAIT_THRESHOLD,
    highFlavors: [
      { flavor: 'sweet', weight: 0.7 },
      { flavor: 'creamy', weight: 0.6 },
    ],
    lowFlavors: [
      { flavor: 'bitter', weight: 0.6 },
      { flavor: 'strong', weight: 0.5 },
      { flavor: 'smoky', weight: 0.2 },
    ],
    rationale:
      '宜人者以甜润待人，丝绒般的柔是其底色；低者锋芒外露，苦与烈是其棱角。',
  },
  {
    trait: 'neuroticism',
    threshold: MAPPING_TRAIT_THRESHOLD,
    highFlavors: [
      { flavor: 'creamy', weight: 0.7 },
      { flavor: 'sweet', weight: 0.5 },
    ],
    lowFlavors: [
      { flavor: 'strong', weight: 0.6 },
      { flavor: 'smoky', weight: 0.5 },
      { flavor: 'bitter', weight: 0.2 },
    ],
    rationale:
      '神经质高者需一杯安抚，柔与甜是夜的镇定；低者坚定如石，烈与烟熏是其骨。',
  },
];
