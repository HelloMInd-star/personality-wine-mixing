/**
 * 气味定制模块数据 · ScentLab
 *
 * 含：6 种香味基础 · 15 种前中后调原料 · 4 种交付方式 · 4 种精油瓶 · MBTI 联动推荐
 * 色谱延续项目深空紫金琥珀 · 与 TavernPage/CocktailPage 同语
 */

import type {
  ScentBase,
  ScentNote,
  DeliveryOption,
  BottleOption,
  MbtiScentRecommendation,
  ScentBaseType,
  ScentNoteLayer,
} from '../types/scentLab';

// ═════════════════════════════════════════════════════════
// 香味基础 · 6 种调性 · 对应 MBTI 倾向
// ═════════════════════════════════════════════════════════

export const SCENT_BASES: ScentBase[] = [
  {
    id: 'woody',
    label: '木质调',
    en: 'Woody',
    symbol: '木',
    color: '#8b6f47', // 沉木棕
    traits: ['沉稳', '温暖', '持久'],
    mbtiTypes: ['INTJ', 'ISTJ'],
    desc: '沉稳的木质感，像旧书页与雨后森林，留得住时间。',
  },
  {
    id: 'floral',
    label: '花香调',
    en: 'Floral',
    symbol: '花',
    color: '#d4a0b8', // 粉花香
    traits: ['柔和', '浪漫', '轻盈'],
    mbtiTypes: ['INFP', 'ISFP'],
    desc: '柔软的花瓣气息，像清晨第一缕光落在花苞上。',
  },
  {
    id: 'fruity',
    label: '果香调',
    en: 'Fruity',
    symbol: '果',
    color: '#e8a87c', // 蜜果橙
    traits: ['清新', '活力', '明亮'],
    mbtiTypes: ['ENFP', 'ESFP'],
    desc: '明亮的多汁感，像夏日午后咬下第一口蜜桃。',
  },
  {
    id: 'spicy',
    label: '辛香调',
    en: 'Spicy',
    symbol: '辛',
    color: '#c75450', // 辛香红
    traits: ['温暖', '刺激', '强烈'],
    mbtiTypes: ['ENTJ', 'ESTJ'],
    desc: '热烈的辛香，像壁炉里的火星与黑胡椒的碰撞。',
  },
  {
    id: 'herbal',
    label: '草本调',
    en: 'Herbal',
    symbol: '草',
    color: '#7a9b76', // 草本绿
    traits: ['清爽', '冷静', '自然'],
    mbtiTypes: ['INTP', 'ISTP'],
    desc: '清冽的草本气，像雨后的草地与碾碎的薄荷叶。',
  },
  {
    id: 'oceanic',
    label: '海洋调',
    en: 'Oceanic',
    symbol: '海',
    color: '#5b8ba0', // 海雾蓝
    traits: ['清新', '开放', '自由'],
    mbtiTypes: ['ENTP', 'ESFP'],
    desc: '开阔的海风感，像黎明时分咸湿的浪与远处的帆。',
  },
];

// ═════════════════════════════════════════════════════════
// 香味原料 · 前中后调各 5 种 · 共 15 种
// ═════════════════════════════════════════════════════════

export const SCENT_NOTES: ScentNote[] = [
  // 前调 · 挥发最快
  { id: 'citrus', label: '柑橘', en: 'Citrus', layer: 'top', color: '#f0c674', molecule: 'Ctl', desc: '明亮的第一感，撕开果皮的瞬间。' },
  { id: 'mint', label: '薄荷', en: 'Mint', layer: 'top', color: '#9bc4a0', molecule: 'Mnt', desc: '清凉的锐度，呼吸变得通透。' },
  { id: 'lemon', label: '柠檬', en: 'Lemon', layer: 'top', color: '#e6d860', molecule: 'Lmn', desc: '酸涩的清醒，像晨光切入杯沿。' },
  { id: 'bergamot', label: '佛手柑', en: 'Bergamot', layer: 'top', color: '#c9c44a', molecule: 'Bgm', desc: '优雅的苦甜，伯爵茶的底色。' },
  { id: 'lime', label: '青柠', en: 'Lime', layer: 'top', color: '#b5d65a', molecule: 'Lim', desc: '锐利的青涩，夏夜的第一口。' },

  // 中调 · 核心香气
  { id: 'rose', label: '玫瑰', en: 'Rose', layer: 'heart', color: '#d4708a', molecule: 'Ros', desc: '盛放的中心，一切围绕它展开。' },
  { id: 'jasmine', label: '茉莉', en: 'Jasmine', layer: 'heart', color: '#e8d4b0', molecule: 'Jsm', desc: '夜里的甜，白色的低语。' },
  { id: 'lavender', label: '薰衣草', en: 'Lavender', layer: 'heart', color: '#9a8ac4', molecule: 'Lav', desc: '安定的紫，把心放平。' },
  { id: 'cinnamon', label: '肉桂', en: 'Cinnamon', layer: 'heart', color: '#b5654a', molecule: 'Cin', desc: '温热的辛，壁炉里的余烬。' },
  { id: 'geranium', label: '天竺葵', en: 'Geranium', layer: 'heart', color: '#c47a9a', molecule: 'Ger', desc: '草本与花的交界，不偏不倚。' },

  // 后调 · 余香最慢
  { id: 'sandalwood', label: '檀香', en: 'Sandalwood', layer: 'base', color: '#a08060', molecule: 'Snd', desc: '寺庙的底，最久的留白。' },
  { id: 'cedar', label: '雪松', en: 'Cedar', layer: 'base', color: '#7a6850', molecule: 'Cdr', desc: '干燥的木骨，撑起整个结构。' },
  { id: 'vanilla', label: '香草', en: 'Vanilla', layer: 'base', color: '#d4b888', molecule: 'Van', desc: '甜的归处，像奶与木的拥抱。' },
  { id: 'amber', label: '琥珀', en: 'Amber', layer: 'base', color: '#c98a3a', molecule: 'Amb', desc: '金色的暖，凝固的时间。' },
  { id: 'musk', label: '麝香', en: 'Musk', layer: 'base', color: '#9a8270', molecule: 'Msk', desc: '肌肤的底，最私密的余韵。' },
];

// ═════════════════════════════════════════════════════════
// 交付方式 · 4 种
// ═════════════════════════════════════════════════════════

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: 'preorder',
    label: '提前定制',
    desc: '下单后系统生成配方，3-5 天后寄出成品。',
    priceRange: '¥99-299',
    priceMin: 99,
    priceMax: 299,
  },
  {
    id: 'onetime',
    label: '单次调制',
    desc: '在酒馆/线下体验店现场调配，即调即取。',
    priceRange: '¥59-159',
    priceMin: 59,
    priceMax: 159,
  },
  {
    id: 'subscription',
    label: '订阅制',
    desc: '每月寄送一瓶「当月人格精油」，与你的时令同行。',
    priceRange: '¥89/月',
    priceMin: 89,
    priceMax: 89,
    isSubscription: true,
  },
  {
    id: 'digital',
    label: '数字配方',
    desc: '仅提供配方与调配指南，你自己在家完成。',
    priceRange: '¥9.9-29.9',
    priceMin: 9.9,
    priceMax: 29.9,
  },
];

// ═════════════════════════════════════════════════════════
// 精油瓶 · 4 种
// ═════════════════════════════════════════════════════════

export const BOTTLE_OPTIONS: BottleOption[] = [
  { id: 'roller', label: '滚珠瓶', capacity: '10ml', useCase: '随身携带 · 局部使用', symbol: '◯' },
  { id: 'spray', label: '喷雾瓶', capacity: '30ml', useCase: '空间喷雾', symbol: '▢' },
  { id: 'dropper', label: '滴管瓶', capacity: '5ml', useCase: '稀释使用 · 调配其他产品', symbol: '▽' },
  { id: 'diffuser', label: '香薰石/扩香木', capacity: '—', useCase: '配合精油使用', symbol: '◇' },
];

// ═════════════════════════════════════════════════════════
// MBTI 联动推荐 · 人格派生香味基础与调性组合
// ═════════════════════════════════════════════════════════

export const MBTI_SCENT_RECS: MbtiScentRecommendation[] = [
  { mbti: 'INTJ', bases: ['woody', 'spicy'], notes: ['cedar', 'cinnamon', 'sandalwood'] },
  { mbti: 'INFP', bases: ['floral', 'fruity'], notes: ['rose', 'jasmine', 'vanilla'] },
  { mbti: 'ENFP', bases: ['fruity', 'floral'], notes: ['citrus', 'bergamot', 'lavender'] },
  { mbti: 'ENTJ', bases: ['spicy', 'woody'], notes: ['cinnamon', 'amber', 'sandalwood'] },
  { mbti: 'ISTJ', bases: ['woody'], notes: ['cedar', 'sandalwood', 'musk'] },
  { mbti: 'ISFP', bases: ['floral'], notes: ['rose', 'jasmine', 'vanilla'] },
  { mbti: 'ESFP', bases: ['fruity', 'oceanic'], notes: ['citrus', 'lime', 'musk'] },
  { mbti: 'ESTJ', bases: ['spicy'], notes: ['cinnamon', 'amber', 'cedar'] },
  { mbti: 'INTP', bases: ['herbal'], notes: ['mint', 'geranium', 'cedar'] },
  { mbti: 'ISTP', bases: ['herbal', 'woody'], notes: ['mint', 'bergamot', 'sandalwood'] },
  { mbti: 'ENTP', bases: ['oceanic', 'spicy'], notes: ['lime', 'cinnamon', 'amber'] },
  { mbti: 'ISFJ', bases: ['floral', 'woody'], notes: ['jasmine', 'rose', 'vanilla'] },
  { mbti: 'ESFJ', bases: ['floral', 'fruity'], notes: ['rose', 'citrus', 'vanilla'] },
  { mbti: 'ENFJ', bases: ['floral', 'spicy'], notes: ['rose', 'cinnamon', 'amber'] },
  { mbti: 'INFJ', bases: ['floral', 'herbal'], notes: ['jasmine', 'lavender', 'sandalwood'] },
  { mbti: 'ESTP', bases: ['spicy', 'oceanic'], notes: ['lime', 'cinnamon', 'musk'] },
];

// ═════════════════════════════════════════════════════════
// 辅助函数
// ═════════════════════════════════════════════════════════

/** 按层取原料 */
export function getNotesByLayer(layer: ScentNoteLayer): ScentNote[] {
  return SCENT_NOTES.filter((n) => n.layer === layer);
}

/** 按 ID 取香味基础 */
export function getScentBase(id: ScentBaseType): ScentBase {
  return SCENT_BASES.find((b) => b.id === id) ?? SCENT_BASES[0];
}

/** 按 ID 取原料 */
export function getScentNote(id: string): ScentNote | null {
  return SCENT_NOTES.find((n) => n.id === id) ?? null;
}

/** 按 MBTI 取推荐 · 无匹配返回 null */
export function getMbtiScentRec(mbti: string): MbtiScentRecommendation | null {
  return MBTI_SCENT_RECS.find((r) => r.mbti === mbti) ?? null;
}

/** 每层最大选择数 */
export const MAX_NOTES_PER_LAYER = 3;

/** 气味描述生成 · 由配方派生诗化描述 */
export function describeRecipe(recipe: {
  base: ScentBaseType | null;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
}): string {
  const baseLabel = recipe.base ? getScentBase(recipe.base).label : '未选基础';
  const top = recipe.topNotes.map((id) => getScentNote(id)?.label).filter(Boolean);
  const heart = recipe.heartNotes.map((id) => getScentNote(id)?.label).filter(Boolean);
  const base = recipe.baseNotes.map((id) => getScentNote(id)?.label).filter(Boolean);
  const parts: string[] = [];
  if (top.length) parts.push(`前调 ${top.join('、')}`);
  if (heart.length) parts.push(`中调 ${heart.join('、')}`);
  if (base.length) parts.push(`后调 ${base.join('、')}`);
  if (!parts.length) return `${baseLabel} · 还未拼出形状`;
  return `${baseLabel} · ${parts.join(' / ')}`;
}
