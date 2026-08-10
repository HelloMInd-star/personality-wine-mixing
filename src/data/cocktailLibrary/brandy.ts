/**
 * 酒库 · 白兰地（Brandy）系列
 *
 * 2 款经典白兰地鸡尾酒 · 富文本百科数据
 */

import type { Cocktail } from '../../types/cocktail';

export const BRANDY_COCKTAILS: Cocktail[] = [
  // ──────────────────────────────────────────────────────────────────────
  // 001 · 边车
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'brandy-sidecar',
    name: '边车',
    nameEn: 'Sidecar',
    tagline: '干邑酸酒的优雅代表，杯边是糖的温柔防线。',
    story:
      '一战时期巴黎的传奇——一位爱骑边斗摩托的军官带来的配方。干邑的果香浓郁与橙酒柠檬汁的明亮摇匀，糖边可选，是酸酒家族的绅士。',
    baseSpirit: 'brandy',
    abv: 26,
    glass: 'coupe',
    garnish: '橙皮 twist',
    flavorProfile: {
      sweet: 4,
      sour: 6,
      bitter: 0,
      strong: 8,
      smoky: 0,
      fruity: 6,
      herbal: 0,
      creamy: 0,
    },
    ingredients: [
      { name: '干邑白兰地', amount: '50ml' },
      { name: '君度橙酒', amount: '20ml' },
      { name: '柠檬汁', amount: '20ml' },
      { name: '橙皮', amount: '1 twist', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '（可选）用柠檬角擦拭鸡尾酒杯口，蘸取糖边。' },
      { order: 2, text: '将所有原料加入摇酒壶，加冰用力摇荡 12 秒。' },
      { order: 3, text: '双重滤入冰镇鸡尾酒杯。' },
      { order: 4, text: '橙皮 twist 挤出精油涂抹杯口，放入杯中装饰。' },
    ],
    moods: ['elegant', 'calm'],
    auraColor: '#DAA520',
    archetypeAffinity: ['ENTJ', 'INTJ'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['酸酒', '摇荡', '经典', '优雅', '干邑', '绅士', '巴黎'],
    tastingNotes:
      '干邑的葡萄果香和橡木桶陈年的木质底蕴在柠檬汁的酸中被唤醒。君度橙酒的甜润在中间承上启下，糖边（可选）为每一口提供细微的甜感。入口温暖有力，中段酸甜平衡，尾韵优雅悠长——酸酒家族的绅士，从不会失礼。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '浓烈',
      complexity: '层次丰富',
      flavorTone: '果味型',
    },
    scenarios: ['精致晚餐', '商务社交', '餐后小酌'],
    classicRating: 5,
    method: '摇荡法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 002 · 白兰地亚历山大
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'brandy-brandy-alexander',
    name: '白兰地亚历山大',
    nameEn: 'Brandy Alexander',
    tagline: '约翰·列侬的餐后甜品，奶油鸡尾酒的王者。',
    story:
      '约翰·列侬的最爱，奶油鸡尾酒的王者。白兰地+可可利口+奶油摇匀成丝绒，表面撒肉豆蔻——喝起来像融化的巧克力冰淇淋，是甜党的圣餐。',
    baseSpirit: 'brandy',
    abv: 18,
    glass: 'coupe',
    garnish: '肉豆蔻粉 适量',
    flavorProfile: {
      sweet: 8,
      sour: 0,
      bitter: 2,
      strong: 4,
      smoky: 0,
      fruity: 0,
      herbal: 0,
      creamy: 8,
    },
    ingredients: [
      { name: '干邑白兰地', amount: '30ml' },
      { name: '黑可可利口酒', amount: '30ml' },
      { name: '重奶油', amount: '30ml' },
      { name: '肉豆蔻粉', amount: '适量', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '将所有原料加入摇酒壶，加冰用力摇荡 15 秒使奶油充分乳化。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯。' },
      { order: 3, text: '表面均匀撒上肉豆蔻粉装饰。' },
    ],
    moods: ['romantic', 'calm'],
    auraColor: '#8B6914',
    archetypeAffinity: ['INFP', 'ISFP'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['奶油', '甜品', '摇荡', '甜味', '可可', '丝绒', '餐后'],
    tastingNotes:
      '干邑的果香被厚重的奶油包裹，可可利口酒带来丝滑的巧克力风味。三者在摇荡中融合成类似融化冰淇淋的质地，肉豆蔻粉在表面散发温暖的辛香——入口丝滑如绸，甜而不腻，是甜党最温柔的投降宣言。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '奶油型',
    },
    scenarios: ['甜品替代', '情侣约会', '冬日暖饮'],
    classicRating: 4,
    method: '摇荡法',
  },
];