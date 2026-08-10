/**
 * 酒库 · 朗姆酒（Rum）系列
 *
 * 4 款经典朗姆鸡尾酒 · 富文本百科数据
 */

import type { Cocktail } from '../../types/cocktail';

export const RUM_COCKTAILS: Cocktail[] = [
  // ──────────────────────────────────────────────────────────────────────
  // 001 · 黛克瑞
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'rum-daiquiri',
    name: '黛克瑞',
    nameEn: 'Daiquiri',
    tagline: '海明威用这杯酸酒打败了古巴的午后。',
    story:
      '海明威最爱的日常饮品，在古巴矿山工作的美国工程师创造。白朗姆+青柠+糖，三步摇匀，没有多余装饰，是酸酒的完美教科书。',
    baseSpirit: 'rum',
    abv: 22,
    glass: 'coupe',
    garnish: '青柠轮 1 片',
    flavorProfile: {
      sweet: 4,
      sour: 8,
      bitter: 0,
      strong: 6,
      smoky: 0,
      fruity: 8,
      herbal: 0,
      creamy: 0,
    },
    ingredients: [
      { name: '白朗姆酒', amount: '60ml' },
      { name: '青柠汁', amount: '25ml' },
      { name: '单糖浆', amount: '15ml' },
      { name: '青柠轮', amount: '1 片', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '将所有原料加入摇酒壶，加冰用力摇荡 12 秒。' },
      { order: 2, text: '双重滤入冰镇鸡尾酒杯。' },
      { order: 3, text: '青柠轮装饰。' },
    ],
    moods: ['passion', 'celebration'],
    auraColor: '#F0E68C',
    archetypeAffinity: ['ESTP', 'ESFP'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['酸酒', '摇荡', '清爽', '经典', '海明威', '极简', '热带'],
    tastingNotes:
      '白朗姆的甘蔗清甜与青柠的酸在口中碰撞，砂糖的甜润柔和了酸度的锐利。入口干净利落，没有多余的风味绕路，每一口都是酸酒哲学的完美演绎。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '中度',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['夏日派对', '轻松社交', '海边度假'],
    classicRating: 5,
    method: '摇荡法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 002 · 莫吉托
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'rum-mojito',
    name: '莫吉托',
    nameEn: 'Mojito',
    tagline: '薄荷被轻轻捣醒，碎冰在杯底沙沙作响。',
    story:
      '古巴哈瓦那的夏日名片。薄荷叶轻捣出香，朗姆青柠苏打水碎冰装满，杯口冒着冷气——全世界最能让人放下手机的酒。',
    baseSpirit: 'rum',
    abv: 14,
    glass: 'highball',
    garnish: '薄荷枝 1 支',
    flavorProfile: {
      sweet: 6,
      sour: 6,
      bitter: 2,
      strong: 4,
      smoky: 0,
      fruity: 4,
      herbal: 8,
      creamy: 0,
    },
    ingredients: [
      { name: '白朗姆酒', amount: '60ml' },
      { name: '青柠汁', amount: '25ml' },
      { name: '单糖浆', amount: '20ml' },
      { name: '新鲜薄荷叶', amount: '8-10 片' },
      { name: '苏打水', amount: '60ml' },
      { name: '薄荷枝', amount: '1 支', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '在高球杯中放入薄荷叶和糖浆，轻轻捣碎 5-6 下（不要捣碎叶脉避免苦味）。' },
      { order: 2, text: '加入朗姆酒和青柠汁，搅拌均匀。' },
      { order: 3, text: '碎冰装满杯子，注入苏打水至满杯。' },
      { order: 4, text: '用吧勺轻轻提拉混合，薄荷枝装饰。' },
    ],
    moods: ['celebration', 'romantic'],
    auraColor: '#C8E6C9',
    archetypeAffinity: ['ESFP', 'ESTP'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['捣碎', '清爽', '夏日', '派对', '薄荷', '古巴', '气泡'],
    tastingNotes:
      '薄荷叶被轻轻捣碎后释放出清凉的草本香气，白朗姆的甘蔗甜藏在青柠的酸后面，苏打水的气泡将一切搅匀送到舌尖。碎冰在杯底沙沙作响，是最夏天的声音。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['夏日派对', '沙滩酒吧', '轻松社交'],
    classicRating: 5,
    method: '捣碎法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 003 · 迈泰
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'rum-mai-tai',
    name: '迈泰',
    nameEn: 'Mai Tai',
    tagline: '塔希提语说"好到极点"，太平洋的风都在杯里。',
    story:
      'Trader Vic的提基经典，Mai Tai Roa Ae在塔希提语里意为"好到极点"。陈年朗姆的厚重搭橙汁利口和杏仁糖浆，碎冰上一杯就是太平洋的风。',
    baseSpirit: 'rum',
    abv: 24,
    glass: 'tiki',
    garnish: '薄荷枝 1 支 + 青柠壳',
    flavorProfile: {
      sweet: 6,
      sour: 6,
      bitter: 2,
      strong: 6,
      smoky: 0,
      fruity: 8,
      herbal: 0,
      creamy: 0,
    },
    ingredients: [
      { name: '牙买加陈年朗姆酒', amount: '60ml' },
      { name: '青柠汁', amount: '22ml' },
      { name: '橙皮利口酒', amount: '15ml' },
      { name: '杏仁糖浆', amount: '15ml' },
      { name: '单糖浆', amount: '7ml' },
      { name: '薄荷枝', amount: '1 支', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '将所有原料加入摇酒壶，加碎冰用力摇荡 10 秒。' },
      { order: 2, text: '连冰块一起倒入提基杯或古典杯。' },
      { order: 3, text: '薄荷枝拍醒后插入杯中，挤过的青柠壳放入装饰。' },
    ],
    moods: ['celebration', 'passion'],
    auraColor: '#DAA520',
    archetypeAffinity: ['ESFP', 'ESTP'],
    difficulty: 3,
    category: '经典',
    flavorTags: ['提基', '摇荡', '热带', '坚果', '波利尼西亚', '杏仁', '层次'],
    tastingNotes:
      '两种朗姆酒的复合层次——陈年朗姆的木质焦糖和白朗姆的甘蔗清甜在杏仁糖浆的坚果香中融合。橙汁利口带来柑橘的明亮，青柠的酸在尾调收束。碎冰缓缓融化，每一口都略有不同。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '中度',
      complexity: '层次丰富',
      flavorTone: '果味型',
    },
    scenarios: ['提基派对', '热带度假', '周末放松'],
    classicRating: 5,
    method: '摇荡法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 004 · 椰林飘香
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'rum-pina-colada',
    name: '椰林飘香',
    nameEn: 'Piña Colada',
    tagline: '一杯就足够让你飞到加勒比海。',
    story:
      '波多黎各国酒，度假村的灵魂饮品。朗姆、椰浆、菠萝汁打成冰沙，甜稠香浓——如果你喜欢逃离现实，这就是机票。',
    baseSpirit: 'rum',
    abv: 13,
    glass: 'tiki',
    garnish: '菠萝角 1 块 + 樱桃',
    flavorProfile: {
      sweet: 8,
      sour: 2,
      bitter: 0,
      strong: 4,
      smoky: 0,
      fruity: 10,
      herbal: 0,
      creamy: 3,
    },
    ingredients: [
      { name: '白朗姆酒', amount: '50ml' },
      { name: '椰浆', amount: '30ml' },
      { name: '菠萝汁', amount: '50ml' },
      { name: '菠萝角', amount: '1 块', note: '装饰' },
      { name: '樱桃', amount: '1 颗', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '将所有原料加入搅拌机，加碎冰搅拌至冰沙状。' },
      { order: 2, text: '倒入飓风杯（或高球杯），菠萝角和樱桃装饰。' },
    ],
    moods: ['celebration', 'romantic'],
    auraColor: '#FFFACD',
    archetypeAffinity: ['ESFP', 'ENFP'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['搅拌', '热带', '奶油', '甜味', '度假', '椰香', '菠萝'],
    tastingNotes:
      '椰浆的丝滑奶油感包裹着菠萝的酸甜热带果香，朗姆酒在背后提供温暖的力量。冰沙的质地让每一口都像在喝融化的椰奶冰淇淋——甜蜜、放纵、不需要任何理由。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '奶油型',
    },
    scenarios: ['度假', '泳池派对', '甜品替代'],
    classicRating: 4,
    method: '搅拌法',
  },
];