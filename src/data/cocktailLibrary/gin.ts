/**
 * 酒库 · 金酒（Gin）系列
 *
 * 16 款经典金酒鸡尾酒 · 富文本百科数据
 * 后续补充 17-35 款
 */

import type { Cocktail } from '../../types/cocktail';

export const GIN_COCKTAILS: Cocktail[] = [
  // ─────────────────────────────────────────────────────
  // 001 · 干马天尼
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-dry-martini',
    name: '干马天尼',
    nameEn: 'Dry Martini',
    tagline: '极简配方中蕴藏着无限微妙的平衡。',
    story:
      '它是鸡尾酒界的"白衬衫"——金酒、味美思、橄榄或柠檬皮，三样东西便撑起一个夜晚。每一滴都落在它该落的毫厘之间，比例即是信仰。',
    baseSpirit: 'gin',
    abv: 28,
    glass: 'martini',
    garnish: '橄榄 1 颗（或柠檬皮 twist）',
    flavorProfile: {
      sweet: 0,
      sour: 1,
      bitter: 3,
      strong: 7,
      smoky: 0,
      fruity: 0,
      herbal: 6,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '60ml' },
      { name: '干味美思', amount: '10ml' },
      { name: '橄榄', amount: '1 颗', note: '或柠檬皮 twist' },
    ],
    steps: [
      { order: 1, text: '将所有原料倒入调酒杯，加冰搅拌 20 秒至充分冰镇。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯。' },
      { order: 3, text: '橄榄或柠檬皮装饰。' },
    ],
    moods: ['elegant', 'calm'],
    auraColor: '#a8c8d4',
    archetypeAffinity: ['clockmaker', 'alchemist'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['干冽', '清爽', '草本', '橄榄香', '优雅', '经典', '纯粹'],
    tastingNotes:
      '入口凛冽干爽，金酒的杜松子草本香气在口中缓缓展开，尾韵带有橄榄的咸鲜或柠檬皮的清香。极简配方中蕴藏着无限微妙的平衡，是鸡尾酒界的"白衬衫"。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '中度',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['独酌沉思', '商务社交', '餐前开胃'],
    classicRating: 5,
    method: '搅拌法',
  },

  // ─────────────────────────────────────────────────────
  // 002 · 内格罗尼
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-negroni',
    name: '内格罗尼',
    nameEn: 'Negroni',
    tagline: '一半是夜，一半是不肯熄的火。',
    story:
      '金巴利的苦与甜味美思的甜在金酒的草本基调上完美交织，意大利式的苦甜哲学，越喝越有深度。',
    baseSpirit: 'gin',
    abv: 24,
    glass: 'rocks',
    garnish: '橙皮装饰',
    flavorProfile: {
      sweet: 2,
      sour: 1,
      bitter: 8,
      strong: 6,
      smoky: 0,
      fruity: 3,
      herbal: 5,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '30ml' },
      { name: '金巴利（Campari）', amount: '30ml' },
      { name: '甜味美思', amount: '30ml' },
      { name: '橙皮', amount: '1 片', note: '装饰用' },
    ],
    steps: [
      { order: 1, text: '所有原料倒入古典杯，加冰块搅拌均匀。' },
      { order: 2, text: '橙皮拧香后放入杯中。' },
    ],
    moods: ['rebel', 'elegant'],
    auraColor: '#c97b5a',
    archetypeAffinity: ['clockmaker', 'nightcaller'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['苦甜', '草本', '橙香', '醇厚', '平衡', '经典', '意式'],
    tastingNotes:
      '金巴利的苦与甜味美思的甜在金酒的草本基调上完美交织，入口微苦随即转为甘甜，尾韵悠长带有橙皮的清新。意大利式的苦甜哲学，越喝越有深度。',
    mbtiProfile: {
      introversionBias: '皆可',
      abvPreference: '中度',
      complexity: '层次丰富',
      flavorTone: '草本型',
    },
    scenarios: ['餐前开胃', '深夜小酌', '艺术氛围'],
    classicRating: 5,
    method: '搅拌法',
  },

  // ─────────────────────────────────────────────────────
  // 003 · 金汤力
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-tonic',
    name: '金汤力',
    nameEn: 'Gin Tonic',
    tagline: '气泡在舌尖跳跃，像夏日午后的第一口呼吸。',
    story:
      '世界上最受欢迎的长饮之一，简单却令人难以抗拒。金酒的杜松子香与汤力水的奎宁微苦完美融合，青柠的酸度提亮一切。',
    baseSpirit: 'gin',
    abv: 12,
    glass: 'highball',
    garnish: '青柠角 2 块',
    flavorProfile: {
      sweet: 1,
      sour: 3,
      bitter: 4,
      strong: 3,
      smoky: 0,
      fruity: 2,
      herbal: 4,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '45ml' },
      { name: '汤力水', amount: '120ml' },
      { name: '青柠角', amount: '2 块' },
      { name: '冰块', amount: '适量' },
    ],
    steps: [
      { order: 1, text: '古典杯中装满冰块，倒入金酒。' },
      { order: 2, text: '缓缓注入汤力水，轻轻搅拌。' },
      { order: 3, text: '青柠角挤汁后投入杯中。' },
    ],
    moods: ['celebration', 'calm'],
    auraColor: '#a8d8c8',
    archetypeAffinity: ['firestarter', 'clockmaker'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['清爽', '草本', '气泡', '微苦', '轻盈', '消暑', '经典'],
    tastingNotes:
      '气泡在舌尖跳跃，金酒的杜松子香与汤力水的奎宁微苦完美融合，青柠的酸度提亮整体口感。世界上最受欢迎的长饮之一，简单却令人难以抗拒。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['夏日消暑', '社交聚会', '餐前开胃'],
    classicRating: 5,
    method: '直接注入',
  },

  // ─────────────────────────────────────────────────────
  // 004 · 汤姆柯林斯
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-tom-collins',
    name: '汤姆柯林斯',
    nameEn: 'Tom Collins',
    tagline: '柠檬的清新与气泡的轻盈，永远不会出错的选择。',
    story:
      '经典的酸酒结构，金酒的草本风味在背后支撑，苏打水的气泡带来轻盈的口感。夏日午后的一杯，足以让时间慢下来。',
    baseSpirit: 'gin',
    abv: 12,
    glass: 'highball',
    garnish: '柠檬片',
    flavorProfile: {
      sweet: 3,
      sour: 5,
      bitter: 0,
      strong: 3,
      smoky: 0,
      fruity: 4,
      herbal: 2,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '45ml' },
      { name: '柠檬汁', amount: '30ml' },
      { name: '糖浆', amount: '20ml' },
      { name: '苏打水', amount: '60ml' },
      { name: '柠檬片', amount: '1 片', note: '装饰用' },
    ],
    steps: [
      { order: 1, text: '金酒、柠檬汁、糖浆加冰摇匀。' },
      { order: 2, text: '滤入柯林杯，加冰块。' },
      { order: 3, text: '顶部注入苏打水，柠檬片装饰。' },
    ],
    moods: ['celebration', 'calm'],
    auraColor: '#d4e8a0',
    archetypeAffinity: ['firestarter', 'dreamer'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['清爽', '酸甜', '气泡', '柠檬', '轻盈', '果香', '经典'],
    tastingNotes:
      '柠檬的清新酸度与糖浆的甜蜜达到完美平衡，金酒的草本风味在背后支撑，苏打水的气泡带来轻盈的口感。经典的酸酒结构，永远不会出错的选择。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['夏日午后', '社交聚会', '休闲时光'],
    classicRating: 4,
    method: '摇荡法',
  },

  // ─────────────────────────────────────────────────────
  // 005 · 吉姆莱
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-gimlet',
    name: '吉姆莱',
    nameEn: 'Gimlet',
    tagline: '青柠的酸与金酒的香，简单却蕴含完美的平衡哲学。',
    story:
      '传说中为了预防坏血病而诞生的经典，青柠汁与金酒的简单组合，却蕴含着完美的平衡哲学。干净利落，不拖泥带水。',
    baseSpirit: 'gin',
    abv: 22,
    glass: 'martini',
    garnish: '青柠片',
    flavorProfile: {
      sweet: 2,
      sour: 6,
      bitter: 0,
      strong: 5,
      smoky: 0,
      fruity: 2,
      herbal: 3,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '60ml' },
      { name: '青柠汁', amount: '25ml' },
      { name: '糖浆', amount: '15ml', note: '或直接使用青柠浓缩汁 30ml' },
    ],
    steps: [
      { order: 1, text: '所有原料加冰摇匀。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯。' },
    ],
    moods: ['elegant', 'calm'],
    auraColor: '#b8d4a0',
    archetypeAffinity: ['clockmaker', 'alchemist'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['酸甜', '清爽', '青柠', '纯粹', '优雅', '经典', '平衡'],
    tastingNotes:
      '青柠的清新酸爽与金酒的杜松子香完美融合，甜酸比例恰到好处，口感干净利落。传说中为了预防坏血病而诞生的经典，简单却蕴含完美的平衡哲学。',
    mbtiProfile: {
      introversionBias: '皆可',
      abvPreference: '中度',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['餐前开胃', '独酌小饮', '傍晚放松'],
    classicRating: 4,
    method: '摇荡法',
  },

  // ─────────────────────────────────────────────────────
  // 006 · 红粉佳人
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-pink-lady',
    name: '红粉佳人',
    nameEn: 'Pink Lady',
    tagline: '梦幻的粉红色泽，如丝般滑过舌尖。',
    story:
      '经典的女性化鸡尾酒，蛋清带来绵密泡沫，橙酒的香气在酸甜中若隐若现。浪漫约会的完美选择，每一口都是温柔。',
    baseSpirit: 'gin',
    abv: 22,
    glass: 'martini',
    garnish: '樱桃',
    flavorProfile: {
      sweet: 5,
      sour: 3,
      bitter: 0,
      strong: 4,
      smoky: 0,
      fruity: 5,
      herbal: 1,
      creamy: 4,
    },
    ingredients: [
      { name: '金酒', amount: '45ml' },
      { name: '君度橙酒', amount: '15ml' },
      { name: '红石榴糖浆', amount: '10ml' },
      { name: '柠檬汁', amount: '15ml' },
      { name: '蛋清', amount: '1 个' },
      { name: '樱桃', amount: '1 颗', note: '装饰用' },
    ],
    steps: [
      { order: 1, text: '先不加冰摇荡蛋清使其起泡（干摇）。' },
      { order: 2, text: '再加冰摇荡至充分冷却（湿摇）。' },
      { order: 3, text: '滤入冰镇鸡尾酒杯，樱桃装饰。' },
    ],
    moods: ['romantic', 'elegant'],
    auraColor: '#e8a0b8',
    archetypeAffinity: ['dreamer', 'firestarter'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['甜美', '果香', '粉色', '蛋清', '丝滑', '浪漫', '经典'],
    tastingNotes:
      '梦幻的粉红色泽，入口如丝般顺滑，蛋清带来绵密的泡沫口感，酸甜平衡中带有橙酒的香气。经典的女性化鸡尾酒，浪漫约会的完美选择。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '中度',
      complexity: '层次丰富',
      flavorTone: '果味型',
    },
    scenarios: ['浪漫约会', '闺蜜小聚', '庆祝时刻'],
    classicRating: 4,
    method: '干摇+湿摇',
  },

  // ─────────────────────────────────────────────────────
  // 007 · 白色佳人
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-white-lady',
    name: '白色佳人',
    nameEn: 'White Lady',
    tagline: '纯净而有韵味的白裙少女。',
    story:
      '君度的橙香与柠檬汁的清新在金酒基底上完美舞蹈，酸甜平衡，口感清爽优雅。被誉为"鸡尾酒中的白裙少女"。',
    baseSpirit: 'gin',
    abv: 25,
    glass: 'martini',
    garnish: '柠檬皮',
    flavorProfile: {
      sweet: 2,
      sour: 4,
      bitter: 1,
      strong: 5,
      smoky: 0,
      fruity: 5,
      herbal: 2,
      creamy: 1,
    },
    ingredients: [
      { name: '金酒', amount: '40ml' },
      { name: '君度橙酒', amount: '30ml' },
      { name: '柠檬汁', amount: '20ml' },
      { name: '蛋白', amount: '1 个', note: '可选' },
    ],
    steps: [
      { order: 1, text: '所有原料加冰充分摇匀。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯。' },
    ],
    moods: ['elegant', 'romantic'],
    auraColor: '#e8d8c8',
    archetypeAffinity: ['dreamer', 'alchemist'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['清爽', '柑橘', '橙香', '平衡', '优雅', '经典', '层次'],
    tastingNotes:
      '君度的橙香与柠檬汁的清新在金酒基底上完美舞蹈，酸甜平衡，口感清爽优雅。被誉为"鸡尾酒中的白裙少女"，纯净而有韵味。',
    mbtiProfile: {
      introversionBias: '皆可',
      abvPreference: '中度',
      complexity: '层次丰富',
      flavorTone: '清爽型',
    },
    scenarios: ['约会小酌', '闺蜜聚会', '餐前开胃'],
    classicRating: 4,
    method: '摇荡法',
  },

  // ─────────────────────────────────────────────────────
  // 008 · 蜜蜂的膝盖
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-bees-knees',
    name: '蜜蜂的膝盖',
    nameEn: "Bee's Knees",
    tagline: '禁酒令时期的"最棒之作"。',
    story:
      '禁酒令时期的经典之作，"蜜蜂的膝盖"在当时俚语中意为"最棒的"。蜂蜜的温润甘甜与柠檬的清新酸度完美结合，入口顺滑温暖。',
    baseSpirit: 'gin',
    abv: 22,
    glass: 'martini',
    garnish: '柠檬皮',
    flavorProfile: {
      sweet: 5,
      sour: 3,
      bitter: 0,
      strong: 4,
      smoky: 0,
      fruity: 2,
      herbal: 2,
      creamy: 1,
    },
    ingredients: [
      { name: '金酒', amount: '60ml' },
      { name: '柠檬汁', amount: '20ml' },
      { name: '蜂蜜糖浆', amount: '20ml', note: '蜂蜜:水 = 2:1' },
      { name: '柠檬皮', amount: '1 片', note: '装饰用' },
    ],
    steps: [
      { order: 1, text: '所有原料加冰摇匀。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯，柠檬皮装饰。' },
    ],
    moods: ['calm', 'elegant'],
    auraColor: '#e8d4a0',
    archetypeAffinity: ['clockmaker', 'dreamer'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['蜂蜜甜', '柠檬', '花香', '顺滑', '复古', '经典', '温润'],
    tastingNotes:
      '蜂蜜的温润甘甜与柠檬的清新酸度完美结合，金酒的草本香在蜂香中若隐若现，入口顺滑温暖。禁酒令时期的经典之作，"蜜蜂的膝盖"在当时俚语中意为"最棒的"。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '中度',
      complexity: '简单直接',
      flavorTone: '甜润型',
    },
    scenarios: ['睡前小酌', '雨天独饮', '温暖时刻'],
    classicRating: 4,
    method: '摇荡法',
  },

  // ─────────────────────────────────────────────────────
  // 009 · 拉莫斯金菲士
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-ramos-gin-fizz',
    name: '拉莫斯金菲士',
    nameEn: 'Ramos Gin Fizz',
    tagline: '如云朵般在口中融化，极致的耐心之作。',
    story:
      '以其极致的泡沫质感闻名，需要极其耐心的摇荡（至少 3 分钟）。奶油与蛋清的丝滑融合，柑橘的清新与橙花水的花香交织，是调酒师功力的试金石。',
    baseSpirit: 'gin',
    abv: 15,
    glass: 'highball',
    garnish: '橙花水滴',
    flavorProfile: {
      sweet: 5,
      sour: 3,
      bitter: 0,
      strong: 3,
      smoky: 0,
      fruity: 2,
      herbal: 1,
      creamy: 8,
    },
    ingredients: [
      { name: '金酒', amount: '45ml' },
      { name: '柠檬汁', amount: '15ml' },
      { name: '青柠汁', amount: '15ml' },
      { name: '糖浆', amount: '30ml' },
      { name: '奶油', amount: '30ml' },
      { name: '蛋清', amount: '1 个' },
      { name: '橙花水', amount: '2 dashes' },
      { name: '香草精', amount: '1 dash' },
      { name: '苏打水', amount: '60ml' },
    ],
    steps: [
      { order: 1, text: '除苏打水外所有原料先干摇再加冰摇（建议摇 3 分钟以上）。' },
      { order: 2, text: '滤入高球杯，加苏打水轻轻搅拌。' },
    ],
    moods: ['elegant', 'calm'],
    auraColor: '#f0e8d8',
    archetypeAffinity: ['alchemist', 'dreamer'],
    difficulty: 4,
    category: '经典',
    flavorTags: ['奶香', '泡沫', '丰盈', '柑橘', '花香', '复杂', '经典'],
    tastingNotes:
      '极其绵密丰盈的泡沫口感，奶油与蛋清的丝滑融合，柑橘的清新与橙花水的花香交织，如云朵般在口中融化。以其极致的泡沫质感闻名，需要极其耐心的摇荡。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '轻量',
      complexity: '复杂多变',
      flavorTone: '奶油型',
    },
    scenarios: ['特别时刻', '周末早午餐', '甜品替代'],
    classicRating: 4,
    method: '摇荡法（干摇+湿摇）',
  },

  // ─────────────────────────────────────────────────────
  // 010 · 飞行
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-aviation',
    name: '飞行',
    nameEn: 'Aviation',
    tagline: '一杯可以喝的香水，优雅而神秘。',
    story:
      '梦幻的淡紫色泽来自紫罗兰利口酒，樱桃酒的杏仁甜与柠檬的酸度平衡，余韵悠长。如同一杯可以喝的香水，优雅而神秘。',
    baseSpirit: 'gin',
    abv: 22,
    glass: 'martini',
    garnish: '樱桃',
    flavorProfile: {
      sweet: 3,
      sour: 3,
      bitter: 1,
      strong: 5,
      smoky: 0,
      fruity: 4,
      herbal: 2,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '45ml' },
      { name: '马拉斯奇诺樱桃酒', amount: '15ml' },
      { name: '柠檬汁', amount: '20ml' },
      { name: '紫罗兰利口酒', amount: '7ml' },
      { name: '樱桃', amount: '1 颗', note: '装饰用' },
    ],
    steps: [
      { order: 1, text: '所有原料加冰摇匀。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯，樱桃装饰。' },
    ],
    moods: ['mystery', 'elegant'],
    auraColor: '#c8a8d8',
    archetypeAffinity: ['dreamer', 'nightcaller'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['花香', '紫罗兰', '果香', '优雅', '淡紫色', '经典', '独特'],
    tastingNotes:
      '梦幻的淡紫色泽，紫罗兰的花香在入口瞬间绽放，樱桃酒的杏仁甜与柠檬的酸度平衡，余韵悠长。如同一杯可以喝的香水，优雅而神秘。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '中度',
      complexity: '层次丰富',
      flavorTone: '花香型',
    },
    scenarios: ['约会小酌', '文艺时光', '特别场合'],
    classicRating: 4,
    method: '摇荡法',
  },

  // ─────────────────────────────────────────────────────
  // 011 · 布朗克斯
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-bronx',
    name: '布朗克斯',
    nameEn: 'Bronx',
    tagline: '比马天尼更易饮，比纯果汁更有深度。',
    story:
      '完美马天尼的配方中加入了鲜橙汁，果香浓郁，酸甜平衡。味美思的草本香与橙香交织，是周末早午餐的绝佳伴侣。',
    baseSpirit: 'gin',
    abv: 22,
    glass: 'martini',
    garnish: '橙片',
    flavorProfile: {
      sweet: 3,
      sour: 3,
      bitter: 1,
      strong: 5,
      smoky: 0,
      fruity: 6,
      herbal: 2,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '60ml' },
      { name: '干味美思', amount: '15ml' },
      { name: '甜味美思', amount: '15ml' },
      { name: '橙汁', amount: '30ml' },
      { name: '橙片', amount: '1 片', note: '装饰用' },
    ],
    steps: [
      { order: 1, text: '所有原料加冰摇匀。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯，橙片装饰。' },
    ],
    moods: ['celebration', 'calm'],
    auraColor: '#e8b860',
    archetypeAffinity: ['firestarter', 'clockmaker'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['果香', '橙汁', '酸甜', '平衡', '经典', '清爽', '层次'],
    tastingNotes:
      '完美马天尼的配方中加入了鲜橙汁，果香浓郁，酸甜平衡，味美思的草本香与橙香交织。比马天尼更易饮，比纯果汁更有深度。',
    mbtiProfile: {
      introversionBias: '皆可',
      abvPreference: '中度',
      complexity: '层次丰富',
      flavorTone: '果味型',
    },
    scenarios: ['周末早午餐', '社交聚会', '轻松时刻'],
    classicRating: 3,
    method: '摇荡法',
  },

  // ─────────────────────────────────────────────────────
  // 012 · 最后的话
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-last-word',
    name: '最后的话',
    nameEn: 'Last Word',
    tagline: '调酒界的"完美平衡"教科书，每一口都有新发现。',
    story:
      '四种原料等比例完美平衡——查特绿的草本药香、樱桃酒的杏仁甜、金酒的杜松子与青柠的酸在口中交织绽放。禁酒令时期的遗珠，如今是调酒界的传奇。',
    baseSpirit: 'gin',
    abv: 25,
    glass: 'martini',
    garnish: '樱桃',
    flavorProfile: {
      sweet: 2,
      sour: 3,
      bitter: 3,
      strong: 6,
      smoky: 0,
      fruity: 2,
      herbal: 7,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '22.5ml' },
      { name: '查特绿（Chartreuse Green）', amount: '22.5ml' },
      { name: '马拉斯奇诺樱桃酒', amount: '22.5ml' },
      { name: '青柠汁', amount: '22.5ml' },
    ],
    steps: [
      { order: 1, text: '四种原料等比例加冰摇匀。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯。' },
    ],
    moods: ['mystery', 'elegant'],
    auraColor: '#a8c8a0',
    archetypeAffinity: ['alchemist', 'nightcaller'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['平衡', '草本', '酸甜', '复杂', '经典', '精致', '独特'],
    tastingNotes:
      '四种原料等比例完美平衡，查特绿的草本药香、樱桃酒的杏仁甜、金酒的杜松子与青柠的酸在口中交织绽放。调酒界的"完美平衡"教科书，每一口都有新发现。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '中度',
      complexity: '复杂多变',
      flavorTone: '草本型',
    },
    scenarios: ['深度品鉴', '深夜独酌', '与懂酒的朋友分享'],
    classicRating: 4,
    method: '摇荡法',
  },

  // ─────────────────────────────────────────────────────
  // 013 · 吉布森
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-gibson',
    name: '吉布森',
    nameEn: 'Gibson',
    tagline: '洋葱的咸鲜替代橄榄，别有一番风味。',
    story:
      '与干马天尼相似，但珍珠洋葱的咸鲜替代了橄榄的风味，带来独特的开胃感。一口下去，金酒的干爽与洋葱的微咸在舌尖碰撞，别致而优雅。',
    baseSpirit: 'gin',
    abv: 28,
    glass: 'martini',
    garnish: '珍珠洋葱 1 颗',
    flavorProfile: {
      sweet: 0,
      sour: 1,
      bitter: 3,
      strong: 7,
      smoky: 0,
      fruity: 0,
      herbal: 5,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '60ml' },
      { name: '干味美思', amount: '10ml' },
      { name: '珍珠洋葱', amount: '1 颗' },
    ],
    steps: [
      { order: 1, text: '金酒和味美思加冰搅拌 20 秒。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯，用珍珠洋葱装饰。' },
    ],
    moods: ['elegant', 'calm'],
    auraColor: '#b0c8c0',
    archetypeAffinity: ['clockmaker', 'alchemist'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['干冽', '洋葱香', '清爽', '优雅', '经典', '纯粹', '别致'],
    tastingNotes:
      '与干马天尼相似，但洋葱的咸鲜替代了橄榄的风味，带来独特的开胃感。一口下去，金酒的干爽与洋葱的微咸在舌尖碰撞，别有一番风味。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '中度',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['餐前开胃', '商务小酌', '独酌沉思'],
    classicRating: 4,
    method: '搅拌法',
  },

  // ─────────────────────────────────────────────────────
  // 014 · 维斯帕
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-vesper',
    name: '维斯帕',
    nameEn: 'Vesper',
    tagline: '007 的专属鸡尾酒，强劲而优雅。',
    story:
      '詹姆斯·邦德的专属鸡尾酒，金酒的草本与伏特加的纯净叠加，利莱白带来微妙的果香与甜度。"摇匀，不要搅拌"——这杯酒属于那些有故事的人。',
    baseSpirit: 'gin',
    abv: 30,
    glass: 'martini',
    garnish: '柠檬皮',
    flavorProfile: {
      sweet: 1,
      sour: 2,
      bitter: 2,
      strong: 8,
      smoky: 0,
      fruity: 1,
      herbal: 4,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '60ml' },
      { name: '伏特加', amount: '20ml' },
      { name: '利莱白（Lillet Blanc）', amount: '15ml' },
      { name: '柠檬皮', amount: '1 片', note: '拧香后丢弃' },
    ],
    steps: [
      { order: 1, text: '所有原料加冰搅拌至充分冰镇。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯，柠檬皮拧香后丢弃。' },
    ],
    moods: ['mystery', 'elegant'],
    auraColor: '#c8d0d8',
    archetypeAffinity: ['nightcaller', 'alchemist'],
    difficulty: 2,
    category: '创意',
    flavorTags: ['强烈', '干冽', '复杂', '邦德', '优雅', '浓烈', '经典'],
    tastingNotes:
      '007 詹姆斯·邦德的专属鸡尾酒，金酒的草本与伏特加的纯净叠加，利莱白带来微妙的果香与甜度，整体强劲而优雅。"摇匀，不要搅拌"——但实际上这款酒更适合搅拌。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '浓烈',
      complexity: '层次丰富',
      flavorTone: '清爽型',
    },
    scenarios: ['深夜小酌', '特别场合', '仪式感时刻'],
    classicRating: 4,
    method: '搅拌法',
  },

  // ─────────────────────────────────────────────────────
  // 015 · 新加坡司令
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-singapore-sling',
    name: '新加坡司令',
    nameEn: 'Singapore Sling',
    tagline: '热带鸡尾酒的代表，充满度假氛围。',
    story:
      '新加坡莱佛士酒店的传奇之作，层次丰富的热带水果风味，甜中带酸，多种利口酒交织出复杂的香气。红色酒体充满度假氛围，是热带鸡尾酒的代表。',
    baseSpirit: 'gin',
    abv: 15,
    glass: 'highball',
    garnish: '水果拼盘（菠萝角、樱桃、橙片）',
    flavorProfile: {
      sweet: 5,
      sour: 3,
      bitter: 1,
      strong: 3,
      smoky: 0,
      fruity: 7,
      herbal: 2,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '45ml' },
      { name: '樱桃白兰地', amount: '15ml' },
      { name: '君度橙酒', amount: '7ml' },
      { name: '廊酒（Benedictine）', amount: '7ml' },
      { name: '红石榴糖浆', amount: '10ml' },
      { name: '柠檬汁', amount: '20ml' },
      { name: '菠萝汁', amount: '20ml' },
      { name: '安格斯拉苦精', amount: '1 dash' },
      { name: '苏打水', amount: '30ml' },
    ],
    steps: [
      { order: 1, text: '除苏打水外所有原料加冰摇匀。' },
      { order: 2, text: '滤入柯林杯，加冰块。' },
      { order: 3, text: '顶部注入苏打水，水果装饰。' },
    ],
    moods: ['celebration', 'passion'],
    auraColor: '#e87060',
    archetypeAffinity: ['firestarter', 'dreamer'],
    difficulty: 3,
    category: '经典',
    flavorTags: ['果香', '甜美', '红色', '复杂', '热带', '经典', '度假'],
    tastingNotes:
      '层次丰富的热带水果风味，甜中带酸，多种利口酒交织出复杂的香气，红色酒体充满度假氛围。新加坡莱佛士酒店的传奇之作，热带鸡尾酒的代表。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '轻量',
      complexity: '复杂多变',
      flavorTone: '果味型',
    },
    scenarios: ['度假休闲', '派对聚会', '夏日狂欢'],
    classicRating: 4,
    method: '摇荡法',
  },

  // ─────────────────────────────────────────────────────
  // 016 · 脏马天尼
  // ─────────────────────────────────────────────────────
  {
    id: 'gin-dirty-martini',
    name: '脏马天尼',
    nameEn: 'Dirty Martini',
    tagline: '咸鲜味鸡尾酒的代表，喜欢的人会非常上瘾。',
    story:
      '橄榄盐水带来浓郁的咸鲜风味，使马天尼变得更加醇厚有层次。入口先是金酒的干爽，随后橄榄的咸鲜在口中弥漫——一杯属于深夜的酒。',
    baseSpirit: 'gin',
    abv: 27,
    glass: 'martini',
    garnish: '橄榄 2-3 颗',
    flavorProfile: {
      sweet: 0,
      sour: 1,
      bitter: 3,
      strong: 7,
      smoky: 0,
      fruity: 0,
      herbal: 4,
      creamy: 0,
    },
    ingredients: [
      { name: '金酒', amount: '60ml' },
      { name: '干味美思', amount: '10ml' },
      { name: '橄榄盐水', amount: '15ml' },
      { name: '橄榄', amount: '2-3 颗' },
    ],
    steps: [
      { order: 1, text: '所有原料加冰搅拌均匀。' },
      { order: 2, text: '滤入冰镇鸡尾酒杯，橄榄串装饰。' },
    ],
    moods: ['mystery', 'calm'],
    auraColor: '#b8c8a8',
    archetypeAffinity: ['nightcaller', 'clockmaker'],
    difficulty: 1,
    category: '创意',
    flavorTags: ['咸鲜', '橄榄', '干冽', '醇厚', '经典', '浓郁', '独特'],
    tastingNotes:
      '橄榄盐水带来浓郁的咸鲜风味，使马天尼变得更加醇厚有层次，入口先是金酒的干爽，随后橄榄的咸鲜在口中弥漫。喜欢的人会非常上瘾，咸鲜味鸡尾酒的代表。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '中度',
      complexity: '简单直接',
      flavorTone: '清爽型',
    },
    scenarios: ['深夜小酌', '餐前开胃', '搭配橄榄小食'],
    classicRating: 3,
    method: '搅拌法',
  },
];