/**
 * 酒库 · 威士忌（Whiskey）系列
 *
 * 6 款经典威士忌鸡尾酒 · 富文本百科数据
 * 后续补充 7-20 款
 */

import type { Cocktail } from '../../types/cocktail';

export const WHISKEY_COCKTAILS: Cocktail[] = [
  // ──────────────────────────────────────────────────────────────────────
  // 001 · 古典
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'whisky-old-fashioned',
    name: '古典',
    nameEn: 'Old Fashioned',
    tagline: '极简到只剩骨架，却撑起整个鸡尾酒的历史。',
    story:
      '鸡尾酒之王。糖+苦精+威士忌+橙皮，1806年定义了"鸡尾酒"一词，没有任何多余。',
    baseSpirit: 'whisky',
    abv: 32,
    glass: 'rocks',
    garnish: '橙皮 twist',
    flavorProfile: {
      sweet: 4,
      sour: 0,
      bitter: 8,
      strong: 10,
      smoky: 0,
      fruity: 2,
      herbal: 8,
      creamy: 0,
    },
    ingredients: [
      { name: '波本/黑麦威士忌', amount: '60ml' },
      { name: '安高天娜苦精', amount: '3 dashes' },
      { name: '方糖', amount: '1 块' },
      { name: '橙皮', amount: '1 twist', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '在古典杯中放入方糖，加 3 dashes 苦精和少许苏打水，捣碎方糖。' },
      { order: 2, text: '加入大冰块，倒入威士忌，轻轻搅拌 20 秒。' },
      { order: 3, text: '橙皮 twist 挤出精油涂抹杯口，放入杯中装饰。' },
    ],
    moods: ['elegant', 'calm'],
    auraColor: '#8B4513',
    archetypeAffinity: ['ISTJ', 'ESTJ'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['经典之王', '搅拌', '烈酒', '绅士', '苦甜', '极简', '复古'],
    tastingNotes:
      '入口醇厚饱满，苦精的草本药香与威士忌的焦糖木质在方糖的甜润中交织。橙皮精油喷洒的瞬间唤醒嗅觉，每一口都是对经典的致敬。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '浓烈',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['独酌沉思', '商务社交', '餐后小酌'],
    classicRating: 5,
    method: '搅拌法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 002 · 曼哈顿
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'whisky-manhattan',
    name: '曼哈顿',
    nameEn: 'Manhattan',
    tagline: '甜苦交错的城市底色，杯底沉着一颗不说话的红樱桃。',
    story:
      '1870年代诞生于纽约曼哈顿俱乐部。黑麦威士忌与甜苦艾酒黄金2:1比例，苦精点睛，是都市绅士的晚饭后。',
    baseSpirit: 'whisky',
    abv: 28,
    glass: 'coupe',
    garnish: '马拉斯奇诺樱桃 1 颗',
    flavorProfile: {
      sweet: 6,
      sour: 0,
      bitter: 6,
      strong: 8,
      smoky: 0,
      fruity: 4,
      herbal: 8,
      creamy: 0,
    },
    ingredients: [
      { name: '黑麦威士忌', amount: '60ml' },
      { name: '甜味美思', amount: '30ml' },
      { name: '安高天娜苦精', amount: '2 dashes' },
      { name: '马拉斯奇诺樱桃', amount: '1 颗', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '将所有原料倒入调酒杯，加冰搅拌 25 秒至充分冰镇。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯。' },
      { order: 3, text: '樱桃装饰。' },
    ],
    moods: ['elegant', 'mystery'],
    auraColor: '#7B2D26',
    archetypeAffinity: ['INTJ', 'ISTJ'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['经典', '搅拌', '优雅', '都市', '甜苦平衡', '精致', '深邃'],
    tastingNotes:
      '黑麦威士忌的辛香骨架支撑着甜苦艾酒的醇厚，苦精在中间架桥。入口温暖顺滑，中段甜苦交织，尾韵带樱桃的微甜——像纽约的暮色，凛冽中藏着温柔。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '中度',
      complexity: '层次丰富',
      flavorTone: '甜润型',
    },
    scenarios: ['商务社交', '餐后小酌', '精致约会'],
    classicRating: 5,
    method: '搅拌法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 003 · 威士忌酸
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'whisky-whisky-sour',
    name: '威士忌酸',
    nameEn: 'Whiskey Sour',
    tagline: '酸甜像一场争执，泡沫浮在表面当和事佬。',
    story:
      '酸酒家族的元老。波本的甜香与柠檬的明亮在泡沫中碰撞，加蛋清有天鹅绒般的口感，不加则是纯粹的爽朗。',
    baseSpirit: 'whisky',
    abv: 18,
    glass: 'rocks',
    garnish: '安高天娜苦精 2 dashes 点缀泡沫',
    flavorProfile: {
      sweet: 6,
      sour: 8,
      bitter: 2,
      strong: 6,
      smoky: 0,
      fruity: 4,
      herbal: 0,
      creamy: 3,
    },
    ingredients: [
      { name: '波本威士忌', amount: '60ml' },
      { name: '柠檬汁', amount: '30ml' },
      { name: '单糖浆', amount: '25ml' },
      { name: '蛋清', amount: '1 个', note: '可选·加则泡沫更绵密' },
      { name: '安高天娜苦精', amount: '2 dashes', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '将所有原料（除蛋清外）加入摇酒壶，加冰用力摇荡 15 秒。' },
      { order: 2, text: '若加蛋清，先干摇 30 秒（不加冰），再加冰摇 10 秒。' },
      { order: 3, text: '滤入加冰古典杯，苦精滴在泡沫上装饰。' },
    ],
    moods: ['passion', 'celebration'],
    auraColor: '#F4A460',
    archetypeAffinity: ['ESFP', 'ESTP'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['酸酒', '摇荡', '派对', '经典', '酸甜', '泡沫', '社交'],
    tastingNotes:
      '波本的焦糖甜首先出场，柠檬的酸紧随其后划开味蕾，蛋清泡沫如丝绸般包裹舌面。酸甜在口中跳探戈，苦精点缀在泡沫上如夜空中的星。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '中度',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['派对聚会', '轻松社交', '周末Brunch'],
    classicRating: 5,
    method: '摇荡法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 004 · 萨泽拉克
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'whisky-sazerac',
    name: '萨泽拉克',
    nameEn: 'Sazerac',
    tagline: '苦艾洗杯是第一道咒语，柠檬皮是最后一道封印。',
    story:
      '新奥尔良最古老的鸡尾酒。苦精润杯、冰块搅拌、柠檬皮喷雾，每一步都是仪式。药草苦香浓烈，是懂的人才懂的老派浪漫。',
    baseSpirit: 'whisky',
    abv: 35,
    glass: 'rocks',
    garnish: '柠檬皮 twist',
    flavorProfile: {
      sweet: 4,
      sour: 0,
      bitter: 10,
      strong: 10,
      smoky: 0,
      fruity: 0,
      herbal: 8,
      creamy: 0,
    },
    ingredients: [
      { name: '黑麦威士忌', amount: '60ml' },
      { name: 'Peychaud苦精', amount: '4 dashes' },
      { name: '方糖', amount: '1 块' },
      { name: '苦艾酒', amount: '洗杯用', note: '仅润杯' },
      { name: '柠檬皮', amount: '1 twist', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '预先冰镇古典杯，倒入少量苦艾酒旋转润杯后倒掉。' },
      { order: 2, text: '在调酒杯中放入方糖和苦精，加少许苏打水捣碎。' },
      { order: 3, text: '加入威士忌和冰块，搅拌 20 秒。' },
      { order: 4, text: '滤入苦艾润过的杯中，柠檬皮 twist 挤出精油后丢弃（不放入杯中）。' },
    ],
    moods: ['mystery', 'melancholy'],
    auraColor: '#6B2A2A',
    archetypeAffinity: ['ISTJ', 'ISTP'],
    difficulty: 3,
    category: '经典',
    flavorTags: ['经典', '搅拌', '苦味', '仪式感', '新奥尔良', '药草', '老派'],
    tastingNotes:
      '苦艾酒洗杯后的茴香余韵缠绕杯壁，黑麦威士忌的辛烈与Peychaud苦精的樱桃红交织，方糖在底部融化释放微甜。复杂、厚重、不可替代——只有去过新奥尔良的人才知道它的灵魂。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '浓烈',
      complexity: '复杂多变',
      flavorTone: '草本型',
    },
    scenarios: ['独酌沉思', '深夜酒吧', '老派社交'],
    classicRating: 5,
    method: '搅拌法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 005 · 花花公子
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'whisky-boulevardier',
    name: '花花公子',
    nameEn: 'Boulevardier',
    tagline: 'Negroni 换上了威士忌的外套，就变成了冬夜的壁炉。',
    story:
      'Negroni的波本表亲，1920年代巴黎的美国记者发明。威士忌的温热取代金酒的清爽，更加厚重温暖，是冬夜的苦甜沉思。',
    baseSpirit: 'whisky',
    abv: 25,
    glass: 'rocks',
    garnish: '橙皮 twist',
    flavorProfile: {
      sweet: 6,
      sour: 0,
      bitter: 8,
      strong: 8,
      smoky: 0,
      fruity: 4,
      herbal: 8,
      creamy: 0,
    },
    ingredients: [
      { name: '波本威士忌', amount: '45ml' },
      { name: '金巴利（Campari）', amount: '30ml' },
      { name: '甜味美思', amount: '30ml' },
      { name: '橙皮', amount: '1 twist', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '将所有原料加入调酒杯，加冰搅拌 20 秒。' },
      { order: 2, text: '滤入加冰古典杯。' },
      { order: 3, text: '橙皮 twist 挤出精油涂抹杯口，放入杯中装饰。' },
    ],
    moods: ['elegant', 'mystery'],
    auraColor: '#B22222',
    archetypeAffinity: ['INTJ', 'ENTJ'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['搅拌', '苦味', '精致', '平衡', 'Negroni变体', '冬夜', '层次'],
    tastingNotes:
      '波本的焦糖暖意包裹着金巴利的苦红，甜味美思在其中调和。入口比Negroni更温厚，少了金酒的凛冽多了木质的深沉。苦甜苦的循环像冬夜壁炉里的火焰，明灭不定却始终不熄。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '中度',
      complexity: '层次丰富',
      flavorTone: '甜润型',
    },
    scenarios: ['独酌沉思', '冬夜小酌', '精致晚餐'],
    classicRating: 4,
    method: '搅拌法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 006 · 纸飞机
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'whisky-paper-plane',
    name: '纸飞机',
    nameEn: 'Paper Plane',
    tagline: '四等分的苦甜哲学，像折纸一样精确。',
    story:
      '2008年纽约传奇调酒师Sam Ross创造，致敬M.I.A.同名歌曲。波本、Aperol、阿玛罗、柠檬汁四等分——像Last Word的当代传人，苦甜酸平衡得像数学公式。',
    baseSpirit: 'whisky',
    abv: 22,
    glass: 'coupe',
    garnish: '无',
    flavorProfile: {
      sweet: 4,
      sour: 6,
      bitter: 8,
      strong: 6,
      smoky: 0,
      fruity: 4,
      herbal: 8,
      creamy: 0,
    },
    ingredients: [
      { name: '波本威士忌', amount: '30ml' },
      { name: 'Aperol', amount: '30ml' },
      { name: 'Amaro Nonino', amount: '30ml' },
      { name: '柠檬汁', amount: '30ml' },
    ],
    steps: [
      { order: 1, text: '将所有原料等量加入摇酒壶，加冰用力摇荡 12 秒。' },
      { order: 2, text: '双重滤入冰镇鸡尾酒杯。' },
    ],
    moods: ['elegant', 'mystery'],
    auraColor: '#CD853F',
    archetypeAffinity: ['INTP', 'ENTP'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['摇荡', '现代经典', '等量配方', '平衡', '苦甜哲学', '精密', '当代'],
    tastingNotes:
      '四等分的配方展现出惊人的平衡感。波本提供骨架，Aperol带来橙红苦甜，Amaro Nonino的草本复杂度从中突围，柠檬汁的酸将一切拉回正轨。入口丝滑，中段复杂，尾韵清爽——当代鸡尾酒的数学之美。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '中度',
      complexity: '复杂多变',
      flavorTone: '草本型',
    },
    scenarios: ['精致酒吧', '调酒师交流', '独酌品味'],
    classicRating: 4,
    method: '摇荡法',
  },
];