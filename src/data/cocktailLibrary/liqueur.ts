/**
 * 酒库 · 利口酒/气泡酒（Liqueur & Sparkling）系列
 *
 * 6 款经典利口酒与气泡酒鸡尾酒 · 富文本百科数据
 */

import type { Cocktail } from '../../types/cocktail';

export const LIQUEUR_COCKTAILS: Cocktail[] = [
  // ──────────────────────────────────────────────────────────────────────
  // 001 · 阿佩罗气泡
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'liqueur-aperol-spritz',
    name: '阿佩罗气泡',
    nameEn: 'Aperol Spritz',
    tagline: '欧洲人傍晚六点的手中橙光，露台文化的全球开场白。',
    story:
      '意大利Aperitivo文化的全球大使。3-2-1比例（Prosecco-Aperol-Soda），橙红亮色、苦甜微泡，欧洲人傍晚六点的露台标配。',
    baseSpirit: 'liqueur',
    abv: 9,
    glass: 'flute',
    garnish: '橙片 1 片',
    flavorProfile: {
      sweet: 4,
      sour: 2,
      bitter: 6,
      strong: 2,
      smoky: 0,
      fruity: 8,
      herbal: 4,
      creamy: 0,
    },
    ingredients: [
      { name: 'Aperol', amount: '60ml' },
      { name: 'Prosecco 起泡酒', amount: '90ml' },
      { name: '苏打水', amount: '30ml' },
      { name: '橙片', amount: '1 片', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '在葡萄酒杯中加入大块冰。' },
      { order: 2, text: '倒入 Aperol 和 Prosecco，轻轻搅拌。' },
      { order: 3, text: '注入苏打水，用吧勺轻轻提拉。' },
      { order: 4, text: '橙片装饰。' },
    ],
    moods: ['celebration', 'calm'],
    auraColor: '#FF6347',
    archetypeAffinity: ['ESFP', 'ENFP'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['气泡', '直调', '开胃', '清爽', '橙色', '意大利', '露台'],
    tastingNotes:
      '橙红色的液体在笛形杯中闪着微光，Aperol的苦甜橙香被Prosecco的气泡托举到舌尖。苏打水的稀释让一切变得轻盈，苦味在尾调短暂停留后迅速消散——是让你胃开始期待的完美开胃信号。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '果味型',
    },
    scenarios: ['下午茶', '露台社交', '餐前开胃', '户外派对'],
    classicRating: 5,
    method: '直调法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 002 · 金巴利苏打
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'liqueur-campari-soda',
    name: '金巴利苏打',
    nameEn: 'Campari Soda',
    tagline: '极简到只剩苦与红，却是胃的闹钟。',
    story:
      '意大利开胃酒的原点。金巴利红亮如宝石，只加苏打水和一片橙——第一口苦到皱眉，第二口就开始分泌消化液，是胃的闹钟。',
    baseSpirit: 'liqueur',
    abv: 10,
    glass: 'highball',
    garnish: '橙片 1 片',
    flavorProfile: {
      sweet: 2,
      sour: 0,
      bitter: 10,
      strong: 2,
      smoky: 0,
      fruity: 4,
      herbal: 4,
      creamy: 0,
    },
    ingredients: [
      { name: '金巴利（Campari）', amount: '60ml' },
      { name: '苏打水', amount: '90ml' },
      { name: '橙片', amount: '1 片', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '在高球杯中加满冰块。' },
      { order: 2, text: '倒入金巴利，注入苏打水。' },
      { order: 3, text: '用吧勺轻轻提拉混合，橙片装饰。' },
    ],
    moods: ['calm', 'mystery'],
    auraColor: '#DC143C',
    archetypeAffinity: ['INTJ', 'ISTP'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['直调', '苦味', '开胃', '极简', '意大利', '经典', '红宝石'],
    tastingNotes:
      '金巴利的红宝石液体在苏打水中扩散，纯苦的草本药香是唯一的主题。第一口苦到皱眉，第二口苦味开始转化成一种奇异的愉悦——消化液开始分泌，胃醒了。橙片在杯壁上渗出微甜，是苦海中唯一的浮木。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '草本型',
    },
    scenarios: ['餐前开胃', '独饮放松', '意式生活方式'],
    classicRating: 4,
    method: '直调法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 003 · 杏仁酸
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'liqueur-amaretto-sour',
    name: '杏仁酸',
    nameEn: 'Amaretto Sour',
    tagline: '杏仁甜香与柠檬酸的温柔交织，酸酒家族里最会撒娇的。',
    story:
      '杏仁甜酒与柠檬汁的经典搭配，加蛋清泡沫柔滑如丝绸。苦杏仁香气浓郁又温柔，是酸酒家族里最会撒娇的那一个。',
    baseSpirit: 'liqueur',
    abv: 14,
    glass: 'rocks',
    garnish: '柠檬 twist + 安高天娜苦精',
    flavorProfile: {
      sweet: 8,
      sour: 6,
      bitter: 2,
      strong: 2,
      smoky: 0,
      fruity: 4,
      herbal: 2,
      creamy: 3,
    },
    ingredients: [
      { name: '杏仁利口酒（Amaretto）', amount: '60ml' },
      { name: '柠檬汁', amount: '30ml' },
      { name: '蛋清', amount: '1 个', note: '可选' },
      { name: '安高天娜苦精', amount: '2 dashes', note: '装饰' },
      { name: '柠檬 twist', amount: '1', note: '装饰' },
    ],
    steps: [
      { order: 1, text: '将所有原料（除苦精）加入摇酒壶，先干摇 30 秒（不加冰）。' },
      { order: 2, text: '加冰再摇 10 秒。' },
      { order: 3, text: '滤入加冰古典杯，苦精滴在泡沫上，柠檬 twist 装饰。' },
    ],
    moods: ['romantic', 'calm'],
    auraColor: '#F5DEB3',
    archetypeAffinity: ['ISFP', 'ENFP'],
    difficulty: 2,
    category: '经典',
    flavorTags: ['酸酒', '摇荡', '坚果', '甜味', '杏仁', '泡沫', '温柔'],
    tastingNotes:
      '杏仁甜酒的浓郁坚果香首先占领鼻腔，柠檬汁的酸在口中划开甜腻的帷幕。蛋清泡沫如丝绸般滑过舌面，苦精在泡沫表面点缀出微苦的层次。甜而不腻、酸而不锐——是酸酒家族里最温柔的那个孩子。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '甜润型',
    },
    scenarios: ['甜品替代', '情侣约会', '轻松小酌'],
    classicRating: 4,
    method: '摇荡法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 004 · 黑俄罗斯
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'liqueur-black-russian',
    name: '黑俄罗斯',
    nameEn: 'Black Russian',
    tagline: '不加奶油的纯粹，黑沉沉甜苦苦的深夜独白。',
    story:
      '1949年布鲁塞尔为一位美国女大使创造。伏特加加咖啡利口酒直接在冰上搅拌，黑沉沉、甜苦苦——不加奶油的版本更纯粹，是深夜的独白。',
    baseSpirit: 'liqueur',
    abv: 27,
    glass: 'rocks',
    garnish: '无',
    flavorProfile: {
      sweet: 6,
      sour: 0,
      bitter: 6,
      strong: 8,
      smoky: 0,
      fruity: 0,
      herbal: 2,
      creamy: 0,
    },
    ingredients: [
      { name: '伏特加', amount: '50ml' },
      { name: '咖啡利口酒（Kahlúa）', amount: '20ml' },
    ],
    steps: [
      { order: 1, text: '在古典杯中放入大冰块。' },
      { order: 2, text: '倒入伏特加和咖啡利口酒。' },
      { order: 3, text: '用吧勺轻轻搅拌 10 秒。' },
    ],
    moods: ['mystery', 'melancholy'],
    auraColor: '#1A0F0A',
    archetypeAffinity: ['INTJ', 'ISTP'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['直调', '咖啡', '烈酒', '暗黑', '极简', '深夜', '浓郁'],
    tastingNotes:
      '伏特加的纯净与咖啡利口酒的深烘焙苦甜在冰上融合，黑沉沉的液体在古典杯中不冒泡也不分层。入口是咖啡的焦香，中段是伏特加的暖意，尾韵是苦甜交织的余味——纯粹、不修饰、像深夜独自面对镜子的时刻。',
    mbtiProfile: {
      introversionBias: '偏内向独酌',
      abvPreference: '浓烈',
      complexity: '简单直接',
      flavorTone: '甜润型',
    },
    scenarios: ['深夜独酌', '静谧思考', '餐后酒'],
    classicRating: 4,
    method: '直调法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 005 · 皇家基尔
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'liqueur-kir-royale',
    name: '皇家基尔',
    nameEn: 'Kir Royale',
    tagline: '黑醋栗与香槟的紫色升腾，法式优雅的庆祝时刻。',
    story:
      '法国勃艮第传统开胃酒Kir的香槟升级版。杯底先注黑醋栗利口，香槟冲下时紫红色缓缓升腾——优雅、浪漫、毫不费力。',
    baseSpirit: 'liqueur',
    abv: 13,
    glass: 'flute',
    garnish: '无',
    flavorProfile: {
      sweet: 4,
      sour: 2,
      bitter: 0,
      strong: 2,
      smoky: 0,
      fruity: 8,
      herbal: 2,
      creamy: 0,
    },
    ingredients: [
      { name: '黑醋栗利口酒', amount: '10ml' },
      { name: '香槟', amount: '120ml' },
    ],
    steps: [
      { order: 1, text: '在冰镇笛形杯中倒入黑醋栗利口酒。' },
      { order: 2, text: '缓慢注入香槟至满杯，观察紫色在气泡中缓缓升腾。' },
    ],
    moods: ['celebration', 'elegant'],
    auraColor: '#722F37',
    archetypeAffinity: ['INFP', 'ENFJ'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['直调', '气泡', '庆祝', '优雅', '法式', '黑醋栗', '浪漫'],
    tastingNotes:
      '黑醋栗利口酒在杯底沉着如紫红宝石，香槟冲下的瞬间紫色在气泡中升腾。入口是香槟的酵母烤面包香气，紧接着黑醋栗的甜润果香在舌尖展开——法式优雅的极致，庆祝不需要理由。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '果味型',
    },
    scenarios: ['庆祝时刻', '浪漫晚餐', '开胃酒'],
    classicRating: 5,
    method: '直调法',
  },

  // ──────────────────────────────────────────────────────────────────────
  // 006 · 贝里尼
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'liqueur-bellini',
    name: '贝里尼',
    nameEn: 'Bellini',
    tagline: '白桃与Prosecco的桃粉色交融，威尼斯画派下的诗意甜蜜。',
    story:
      '1948年威尼斯Harry\'s Bar为纪念画家贝里尼展览而创。白桃泥与Prosecco交融出柔和桃粉色，入口是夏天蜜桃最温柔的香——像一次威尼斯的初吻。',
    baseSpirit: 'liqueur',
    abv: 10,
    glass: 'flute',
    garnish: '无',
    flavorProfile: {
      sweet: 6,
      sour: 2,
      bitter: 0,
      strong: 2,
      smoky: 0,
      fruity: 10,
      herbal: 0,
      creamy: 0,
    },
    ingredients: [
      { name: '白桃泥', amount: '30ml' },
      { name: 'Prosecco 起泡酒', amount: '100ml' },
    ],
    steps: [
      { order: 1, text: '在冰镇笛形杯中倒入白桃泥。' },
      { order: 2, text: '缓慢注入 Prosecco 至满杯，用吧勺轻轻提拉混合。' },
    ],
    moods: ['romantic', 'celebration'],
    auraColor: '#FFDAB9',
    archetypeAffinity: ['INFP', 'ENFP'],
    difficulty: 1,
    category: '经典',
    flavorTags: ['直调', '气泡', '果味', '浪漫', '威尼斯', '白桃', '诗意'],
    tastingNotes:
      '白桃泥的丝滑果肉与Prosecco的气泡共舞，桃粉色在笛形杯中泛着柔和的光。入口是蜜桃最纯粹的甜香，没有一丝杂味，气泡在舌面轻轻爆裂——像威尼斯的初吻，温柔、甜蜜、让人想再来一次。',
    mbtiProfile: {
      introversionBias: '偏外向社交',
      abvPreference: '轻量',
      complexity: '简单直接',
      flavorTone: '果味型',
    },
    scenarios: ['浪漫晚餐', '早午餐', '庆祝日'],
    classicRating: 5,
    method: '直调法',
  },
];