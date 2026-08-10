/**
 * 酒库 · 伏特加（Vodka）系列
 *
 * 3 款经典伏特加鸡尾酒 · 富文本百科数据
 */

import type { Cocktail } from '../../types/cocktail';

export const VODKA_COCKTAILS: Cocktail[] = [
  // ─────────────────────────────────────────────────────
  // 001 · 浓缩马天尼
  // ─────────────────────────────────────────────────────
  {
    id: 'vodka-espresso-martini',
    name: '浓缩马天尼',
    nameEn: 'Espresso Martini',
    tagline: '酒精与咖啡因的危险联盟，深夜清醒的悖论。',
    story:
      '1980年代伦敦Soho诞生，客人要"一杯能唤醒我"的酒。伏特加+咖啡利口+新鲜浓缩，摇出泡沫，三颗咖啡豆装饰——酒精与咖啡因的危险联盟。',
    baseSpirit: 'vodka',
    abv: 20,
    glass: 'coupe',
    garnish: '咖啡豆 3 颗',
    flavorProfile: {
      sweet: 6,
      sour: 0,
      bitter: 6,
      strong: 6,
      smoky: 0,
      fruity: 0,
      herbal: 2,
      creamy: 3,
    },
    ingredients: [
      { name: '伏特加', amount: '50ml' },
      { name: '咖啡利口酒（Kahlúa）', amount: '15ml' },
      { name: '新鲜浓缩咖啡', amount: '30ml' },
      { name: '单糖浆', amount: '10ml' },
      { name: '咖啡豆', amount: '3 颗', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '将所有原料加入摇酒壶，加冰用力摇荡 15 秒至壶身起霜。' },
      { order: 2, text: '双重滤入冰镇鸡尾酒杯（确保泡沫细腻）。' },
      { order: 3, text: '三颗咖啡豆呈三角形排列于泡沫上装饰。' },
    ],
    moods: ['passion', 'celebration'],
    auraColor: '#2F1B14',
    archetypeAffinity: ['ESTP', 'ENTP'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['摇荡', '咖啡', '现代经典', '派对', '提神', '泡沫', '浓郁'],
    tastingNotes:
      '浓缩咖啡的浓郁苦香被伏特加干净地托举，咖啡利口为甜度铺设了舒适的底色。摇荡产生的丝滑泡沫浮在表面，三颗咖啡豆是健康、财富、幸福的意式祝福。入口如丝绒般顺滑，咖啡因和酒精同时在血液里赛跑。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '中度',
      complexity: '简单直接',
      flavorTone: '甜润型',
    },
    scenarios: ['派对续命', '餐后提神', '深夜酒吧'],
    classicRating: 4,
    method: '摇荡法',
  },

  // ─────────────────────────────────────────────────────
  // 002 · 大都会
  // ─────────────────────────────────────────────────────
  {
    id: 'vodka-cosmopolitan',
    name: '大都会',
    nameEn: 'Cosmopolitan',
    tagline: '一杯粉色的纽约上东区宣言。',
    story:
      '《欲望都市》让它成为千禧年的粉红图标。柑橘伏特加配蔓越莓汁，亮粉颜色和酸甜口感，是纽约上东区的时尚宣言。',
    baseSpirit: 'vodka',
    abv: 20,
    glass: 'coupe',
    garnish: '青柠 twist',
    flavorProfile: {
      sweet: 4,
      sour: 6,
      bitter: 0,
      strong: 6,
      smoky: 0,
      fruity: 8,
      herbal: 0,
      creamy: 0,
    },
    ingredients: [
      { name: '柑橘伏特加', amount: '40ml' },
      { name: '君度橙酒', amount: '15ml' },
      { name: '青柠汁', amount: '15ml' },
      { name: '蔓越莓汁', amount: '30ml' },
      { name: '青柠 twist', amount: '1', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '将所有原料加入摇酒壶，加冰用力摇荡 12 秒。' },
      { order: 2, text: '双重滤入冰镇鸡尾酒杯。' },
      { order: 3, text: '青柠 twist 挤出精油后放入杯中装饰。' },
    ],
    moods: ['elegant', 'romantic'],
    auraColor: '#E85A8C',
    archetypeAffinity: ['ENFP', 'ENFJ'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['摇荡', '粉色', '流行文化', '优雅', '都市', '蔓越莓', '时尚'],
    tastingNotes:
      '柑橘伏特加提供了明亮的橙香基底，君度的橙皮甜润在蔓越莓的酸中时隐时现，青柠汁增添了锐利的酸度层次。纯净的粉色在鸡尾酒杯中闪耀，酸甜平衡得像一首City Pop。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '中度',
      complexity: '简单直接',
      flavorTone: '果味型',
    },
    scenarios: ['精致约会', '时尚派对', '闺蜜之夜'],
    classicRating: 4,
    method: '摇荡法',
  },

  // ─────────────────────────────────────────────────────
  // 003 · 莫斯科骡子
  // ─────────────────────────────────────────────────────
  {
    id: 'vodka-moscow-mule',
    name: '莫斯科骡子',
    nameEn: 'Moscow Mule',
    tagline: '铜杯里的姜味风暴，谁说伏特加没性格。',
    story:
      '1940年代洛杉矶的营销奇迹，用铜杯卖伏特加。姜啤的辛烈撞上伏特加的干净，气泡里带着姜的辣劲儿——谁说伏特加没性格？',
    baseSpirit: 'vodka',
    abv: 12,
    glass: 'highball',
    garnish: '青柠角 1 块',
    flavorProfile: {
      sweet: 6,
      sour: 4,
      bitter: 0,
      strong: 4,
      smoky: 0,
      fruity: 2,
      herbal: 2,
      creamy: 8,
    },
    ingredients: [
      { name: '伏特加', amount: '45ml' },
      { name: '姜汁啤酒', amount: '120ml' },
      { name: '青柠汁', amount: '15ml' },
      { name: '青柠角', amount: '1 块', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '在铜杯中加满冰块。' },
      { order: 2, text: '倒入伏特加和青柠汁，轻轻搅拌。' },
      { order: 3, text: '注入姜汁啤酒至满杯，用吧勺轻轻提拉混合。' },
      { order: 4, text: '青柠角挤汁后放入杯中装饰。' },
    ],
    moods: ['passion', 'celebration'],
    auraColor: '#D4C68A',
    archetypeAffinity: ['ESTP', 'ESFP'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['直调', '辛辣', '清爽', '铜杯', '姜啤', '社交', '经典'],
    tastingNotes:
      '姜啤的辛辣气泡在舌尖炸开，伏特加的纯净在辛烈中若隐若现，青柠的酸在边缘收束。铜杯的冰凉触感从指尖传到手腕，每一口都带着姜的辣劲儿——这是伏特加最有性格的时刻。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['派对聚会', '轻松社交', '夏日解暑'],
    classicRating: 5,
    method: '直调法',
  },
];