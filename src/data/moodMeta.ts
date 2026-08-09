/**
 * 情绪元数据 · 八种夜的心境
 * 既是情绪调节器的视觉来源，也是情绪→风味映射的单一数据源
 * 色取紫金与琥珀色谱，与风味轮、时段色保持一致的深空语境
 */

import type { MoodTag, MoodMeta } from '../types/cocktail';
import type { FlavorPreference } from '../types/personality';

/** 八维情绪元数据 · 顺序固定，对应情绪调节器的八瓣 */
export const MOOD_META: MoodMeta[] = [
  {
    key: 'calm',
    label: '沉静',
    color: '#7c8db5', // 月蓝
    poem: '寂止如月落杯心。',
    symbol: '寂',
  },
  {
    key: 'passion',
    label: '热烈',
    color: '#e06552', // 焰红
    poem: '焰心向夜，烈而成歌。',
    symbol: '焰',
  },
  {
    key: 'melancholy',
    label: '怅然',
    color: '#6b5b95', // 暮紫
    poem: '愁是杯底未燃的烟。',
    symbol: '愁',
  },
  {
    key: 'elegant',
    label: '雅致',
    color: '#d4af7a', // 香槟金
    poem: '雅是节制之美，月光成线。',
    symbol: '雅',
  },
  {
    key: 'rebel',
    label: '叛逆',
    color: '#8b3a3a', // 暗红
    poem: '逆夜而生，棱角即风骨。',
    symbol: '逆',
  },
  {
    key: 'romantic',
    label: '浪漫',
    color: '#c97b9e', // 桃粉
    poem: '恋是两颗星的私语。',
    symbol: '恋',
  },
  {
    key: 'mystery',
    label: '神秘',
    color: '#4a3b6b', // 深紫
    poem: '秘而不宣，深空自知。',
    symbol: '秘',
  },
  {
    key: 'celebration',
    label: '庆典',
    color: '#e8b04c', // 流金
    poem: '欢声坠杯，溅起流金。',
    symbol: '欢',
  },
];

/** 情绪键 → 元数据 · 便于按 key 快速取色与诗 */
export const MOOD_MAP: Record<MoodTag, MoodMeta> = MOOD_META.reduce(
  (map, meta) => {
    map[meta.key] = meta;
    return map;
  },
  {} as Record<MoodTag, MoodMeta>,
);

/**
 * 情绪 → 风味调整向量
 * 每种情绪对八维风味的偏好倾向（0-1）
 * 基于调酒配方库中情绪标签与风味分布的统计推断
 *
 * 单一数据源：timeEngine 与 moodEngine 共享此映射，避免数据分叉
 */
export const MOOD_FLAVOR_MAP: Record<MoodTag, Partial<FlavorPreference>> = {
  calm: { herbal: 0.7, smoky: 0.5, creamy: 0.4 },
  passion: { strong: 0.8, fruity: 0.6, sweet: 0.4 },
  melancholy: { bitter: 0.7, creamy: 0.5, sour: 0.3 },
  elegant: { herbal: 0.6, bitter: 0.5, strong: 0.4 },
  rebel: { strong: 0.7, bitter: 0.6, smoky: 0.4 },
  romantic: { sweet: 0.7, fruity: 0.6, creamy: 0.4 },
  mystery: { smoky: 0.7, strong: 0.5, bitter: 0.4 },
  celebration: { fruity: 0.7, sweet: 0.5, strong: 0.4 },
};
