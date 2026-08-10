/**
 * 酒库 · 龙舌兰（Tequila）系列
 *
 * 3 款经典龙舌兰鸡尾酒 · 富文本百科数据
 */

import type { Cocktail } from '../../types/cocktail';

export const TEQUILA_COCKTAILS: Cocktail[] = [
  // ──────────────────────────────────────────────────────────────────────
  // 001 · 玛格丽特
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'tequila-margarita',
    name: '玛格丽特',
    nameEn: 'Margarita',
    tagline: '盐边是试探，青柠是承诺，龙舌兰是答案。',
    story:
      '全球最知名的龙舌兰酒。盐边、龙舌兰、橙酒、青柠，2:1:1的酸酒结构被墨西哥的大地味道点燃，第一口总是带着盐和酸的咧嘴笑。',
    baseSpirit: 'tequila',
    abv: 27,
    glass: 'coupe',
    garnish: '盐边 + 青柠轮 1 片',
    flavorProfile: {
      sweet: 4,
      sour: 8,
      bitter: 0,
      strong: 8,
      smoky: 0,
      fruity: 6,
      herbal: 0,
      creamy: 2,
    },
    ingredients: [
      { name: '银龙舌兰酒', amount: '50ml' },
      { name: '君度橙酒', amount: '25ml' },
      { name: '青柠汁', amount: '25ml' },
      { name: '盐', amount: '杯口蘸边', note: '装饰' },
      { name: '青柠轮', amount: '1 片', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '用青柠角擦拭鸡尾酒杯口，倒扣在盐盘上蘸取盐边。' },
      { order: 2, text: '将所有原料加入摇酒壶，加冰用力摇荡 12 秒。' },
      { order: 3, text: '双重滤入盐边冰镇鸡尾酒杯。' },
      { order: 4, text: '青柠轮装饰。' },
    ],
    moods: ['passion', 'celebration'],
    auraColor: '#F0E68C',
    archetypeAffinity: ['ESTP', 'ESFP'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['经典', '摇荡', '派对', '盐边', '酸酒', '墨西哥', '奔放'],
    tastingNotes:
      '盐边轻触舌尖带来咸味冲击，紧接着龙舌兰的植物甘甜和青柠的酸在口中争夺主导权。橙酒在中间调和，像和事佬一样将两种力量拉回平衡。第一口总是咧嘴笑，第二口就停不下来——这是墨西哥大地最热烈的问候。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '中度',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['派对主角', '墨西哥之夜', '阳台小酌'],
    classicRating: 5,
    method: '摇荡法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 002 · 帕洛玛
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'tequila-paloma',
    name: '帕洛玛',
    nameEn: 'Paloma',
    tagline: '墨西哥人的日常，比玛格丽特更朴素也更持久。',
    story:
      '墨西哥人的日常最爱，比玛格丽特朴素却更持久。龙舌兰加西柚汽水，西柚的微苦清甜与盐边交织，是阳光下的慢饮。',
    baseSpirit: 'tequila',
    abv: 12,
    glass: 'highball',
    garnish: '盐边 + 青柠角 1 块',
    flavorProfile: {
      sweet: 4,
      sour: 6,
      bitter: 4,
      strong: 4,
      smoky: 0,
      fruity: 8,
      herbal: 0,
      creamy: 0,
    },
    ingredients: [
      { name: '银龙舌兰酒', amount: '50ml' },
      { name: '西柚汽水（或西柚汁+苏打水）', amount: '100ml' },
      { name: '青柠汁', amount: '15ml' },
      { name: '盐', amount: '杯口蘸边', note: '装饰' },
      { name: '青柠角', amount: '1 块', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '用青柠角擦拭高球杯口，蘸取盐边。' },
      { order: 2, text: '杯中加满冰块，倒入龙舌兰和青柠汁。' },
      { order: 3, text: '注入西柚汽水至满杯，用吧勺轻轻提拉混合。' },
      { order: 4, text: '青柠角挤汁后放入杯中装饰。' },
    ],
    moods: ['celebration', 'calm'],
    auraColor: '#FFA07A',
    archetypeAffinity: ['ESFP', 'ENFP'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['直调', '清爽', '西柚', '日常', '墨西哥', '盐边', '气泡'],
    tastingNotes:
      '西柚汽水的微苦清甜是主角，龙舌兰的植物香气在背后默默支撑。盐边让每一口都带着咸味的层次，气泡在舌尖跳跃，是阳光下午最简单的快乐。不复杂、不炫技，但喝了就停不下来。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '果味型',
    },
    scenarios: ['日常小酌', '户外野餐', '墨西哥风味餐搭配'],
    classicRating: 4,
    method: '直调法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 003 · 汤米玛格丽特
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'tequila-tommys-margarita',
    name: '汤米玛格丽特',
    nameEn: "Tommy's Margarita",
    tagline: '去掉橙酒的伪装，让龙舌兰的灵魂直接说话。',
    story:
      '旧金山Tommy\'s餐厅的Julio Bermejo创造，去掉君度换成龙舌兰蜜——更纯粹地展现龙舌兰的植物甘甜，是调酒师圈的宠儿。',
    baseSpirit: 'tequila',
    abv: 23,
    glass: 'rocks',
    garnish: '青柠轮 1 片',
    flavorProfile: {
      sweet: 4,
      sour: 8,
      bitter: 0,
      strong: 8,
      smoky: 0,
      fruity: 4,
      herbal: 0,
      creamy: 0,
    },
    ingredients: [
      { name: '银龙舌兰酒', amount: '60ml' },
      { name: '青柠汁', amount: '30ml' },
      { name: '龙舌兰蜜', amount: '20ml' },
      { name: '青柠轮', amount: '1 片', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '将所有原料加入摇酒壶，加冰用力摇荡 12 秒。' },
      { order: 2, text: '滤入加冰古典杯。' },
      { order: 3, text: '青柠轮装饰。' },
    ],
    moods: ['elegant', 'calm'],
    auraColor: '#F5DEB3',
    archetypeAffinity: ['ESTP', 'ESFP'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['摇荡', '龙舌兰纯粹', '现代经典', '简单', '调酒师圈', '龙舌兰蜜', '纯粹'],
    tastingNotes:
      '去掉了君度橙酒的柑橘层，龙舌兰蜜的草木甜与银龙舌兰自身的植物甘甜产生共鸣。青柠的酸在其中切割出清晰的线条，每一口都是对龙舌兰本质的致敬——比经典玛格丽特更真诚、更直接。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '中度',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['调酒师交流', '品味鉴赏', '餐前开胃'],
    classicRating: 4,
    method: '摇荡法',
  },
];