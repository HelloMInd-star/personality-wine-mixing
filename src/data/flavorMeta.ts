/**
 * 八维风味轮元数据
 * 深空之中，八种味道是夜写下的八行诗
 * 色取紫金与琥珀色谱，让每一维都有自己的光晕
 */

import type { FlavorKey, FlavorMeta } from '../types/cocktail';

/** 八维风味元数据 · 顺序固定，对应风味轮的八瓣 */
export const FLAVOR_META: FlavorMeta[] = [
  {
    key: 'sweet',
    label: '甜',
    color: '#f0c674', // 琥珀金
    poem: '蜜糖溶进星河，夜便有了甜的回声。',
  },
  {
    key: 'sour',
    label: '酸',
    color: '#d8c9f5', // 月白
    poem: '青柠切开盘旋的雾，酸是一线清亮的月光。',
  },
  {
    key: 'bitter',
    label: '苦',
    color: '#a8842f', // 古铜
    poem: '苦味沉在杯底，是夜不肯说出口的往事。',
  },
  {
    key: 'strong',
    label: '烈',
    color: '#5d44a0', // 深紫
    poem: '烈酒入喉，星河倒灌进胸腔。',
  },
  {
    key: 'smoky',
    label: '烟熏',
    color: '#c97b5a', // 烟橘
    poem: '烟从冰里升起，把夜的轮廓烧成余烬。',
  },
  {
    key: 'fruity',
    label: '果香',
    color: '#9b7bd4', // 紫罗兰
    poem: '果实坠入夜色，溅起一片紫罗兰的潮汐。',
  },
  {
    key: 'herbal',
    label: '草本',
    color: '#7c5fbf', // 紫晶
    poem: '草本在舌尖生根，长成一座夜的森林。',
  },
  {
    key: 'creamy',
    label: '柔润',
    color: '#d4a84b', // 蜜糖
    poem: '柔润漫过喉间，像月光铺成的一层丝绒。',
  },
];

/** 风味键 → 元数据 · 便于按维度快速取诗与色 */
export const FLAVOR_MAP: Record<FlavorKey, FlavorMeta> = FLAVOR_META.reduce(
  (map, meta) => {
    map[meta.key] = meta;
    return map;
  },
  {} as Record<FlavorKey, FlavorMeta>,
);
