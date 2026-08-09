/**
 * 六维向量色环映射表 · 视觉融合层的单一真相源
 *
 * 设计理念：
 *   每个人格维度在 HSL 色环上占有正负两个色相段
 *   正倾向（+1）取该维度的「阳色」 · 通常是暖色或高饱和
 *   负倾向（-1）取该维度的「阴色」 · 通常是冷色或低饱和
 *   零点附近色彩退化为深空紫金基调（与 appStore 默认氛围一致）
 *
 * 派生层（colorFromVector）与视觉层（FusionMolecule / FlavorSpectrum）
 * 共享本表，避免色环散落多处造成不一致
 *
 * 配色联动：
 *   采集阶段（card-collection）四色 · 塔罗金/星盘紫/扑克红/德州蓝
 *   调酒阶段（主项目）紫金 · 深空紫 #7C5FBF + 月光金 #E8C870
 *   六维派生色作为「强调色」叠加在紫金基调之上，不喧宾夺主
 */

import type { PersonaDim } from '../types/personaFusion';

/** HSL 色彩描述 · hue 0-360, saturation/lightness 0-1 */
export interface HSLColor {
  hue: number;
  saturation: number;
  lightness: number;
}

/** 单个维度的正负色相 · 用于色环插值 */
export interface DimensionColorPair {
  /** 维度键 */
  dim: PersonaDim;
  /** 正倾向色 · vec[d] = +1 时的纯色 */
  positive: HSLColor;
  /** 负倾向色 · vec[d] = -1 时的纯色 */
  negative: HSLColor;
  /** 中文标签 · 供 UI 展示 */
  label: string;
  /** 单字符号 · 供视觉层渲染 */
  symbol: string;
}

/**
 * 六维色环 · 每维度的正负色相
 *
 * 色相分布遵循「情绪温度」逻辑：
 *   TOL(容错) · 阳金/阴红 · 冒险者暖金、审慎者深红
 *   SPD(速度) · 阳青/阴灰 · 决断者青蓝、沉思者烟灰
 *   INF(信息) · 阳翠/阴墨 · 谋略者翠绿、直觉者墨绿
 *   ENT(热情) · 阳橙/阴紫 · 炽烈者橙红、沉静者紫罗兰
 *   LEAD(主导) · 阳赤/阴蓝 · 引领者深赤、追随者靛蓝
 *   VIS(直觉) · 阳紫/阴银 · 灵感者紫罗兰、实证者银白
 */
export const VECTOR_COLOR_RING: Record<PersonaDim, DimensionColorPair> = {
  TOL: {
    dim: 'TOL',
    positive: { hue: 45, saturation: 0.7, lightness: 0.6 }, // 暖金 · 呼应塔罗金
    negative: { hue: 0, saturation: 0.65, lightness: 0.45 }, // 深红 · 呼应扑克红
    label: '容错',
    symbol: '险',
  },
  SPD: {
    dim: 'SPD',
    positive: { hue: 200, saturation: 0.7, lightness: 0.55 }, // 青蓝 · 呼应德州蓝
    negative: { hue: 240, saturation: 0.15, lightness: 0.4 }, // 烟灰 · 沉思
    label: '速度',
    symbol: '决',
  },
  INF: {
    dim: 'INF',
    positive: { hue: 150, saturation: 0.6, lightness: 0.5 }, // 翠绿 · 草本
    negative: { hue: 120, saturation: 0.3, lightness: 0.3 }, // 墨绿 · 沉静
    label: '信息',
    symbol: '谋',
  },
  ENT: {
    dim: 'ENT',
    positive: { hue: 20, saturation: 0.75, lightness: 0.6 }, // 橙红 · 焰心
    negative: { hue: 280, saturation: 0.5, lightness: 0.45 }, // 紫罗兰 · 内敛
    label: '热情',
    symbol: '焰',
  },
  LEAD: {
    dim: 'LEAD',
    positive: { hue: 350, saturation: 0.7, lightness: 0.5 }, // 深赤 · 引领
    negative: { hue: 220, saturation: 0.6, lightness: 0.4 }, // 靛蓝 · 追随
    label: '主导',
    symbol: '引',
  },
  VIS: {
    dim: 'VIS',
    positive: { hue: 280, saturation: 0.55, lightness: 0.55 }, // 紫罗兰 · 灵感
    negative: { hue: 0, saturation: 0.05, lightness: 0.75 }, // 银白 · 实证
    label: '直觉',
    symbol: '灵',
  },
};

/** 默认基调色 · 全零向量时的视觉 fallback · 深空紫晶 */
export const DEFAULT_VECTOR_COLOR: HSLColor = {
  hue: 265,
  saturation: 0.5,
  lightness: 0.55,
};

/**
 * 采集阶段四模块色 · 用于分子动画的源粒子配色
 * 与 card-collection/moduleMeta.ts 的 MODULE_COLOR 对齐
 */
export const COLLECTION_MODULE_COLORS: Record<'tarot' | 'zodiac' | 'poker' | 'texas', HSLColor> = {
  tarot: { hue: 45, saturation: 0.7, lightness: 0.55 }, // 塔罗金 #D4A040
  zodiac: { hue: 265, saturation: 0.6, lightness: 0.6 }, // 星盘紫 #7A4BFF
  poker: { hue: 350, saturation: 0.7, lightness: 0.45 }, // 扑克红 #C41E3A
  texas: { hue: 190, saturation: 0.6, lightness: 0.6 }, // 德州蓝 #4DD0E1
};

/** HSL → CSS 字符串 · 供 Canvas / style 直接消费 */
export function hslToString({ hue, saturation, lightness }: HSLColor, alpha = 1): string {
  if (alpha === 1) {
    return `hsl(${Math.round(hue)}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%)`;
  }
  return `hsla(${Math.round(hue)}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%, ${alpha})`;
}

/** HSL → hex · 供需要 hex 格式的组件消费（如 LightCanvas 的 baseColor） */
export function hslToHex({ hue, saturation, lightness }: HSLColor): string {
  const h = hue / 360;
  const s = saturation;
  const l = lightness;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 在两 HSL 色之间线性插值 · 用于向量零点附近的色彩退化
 * hue 走最短弧（环形插值），saturation/lightness 走直线
 */
export function interpolateHSL(a: HSLColor, b: HSLColor, t: number): HSLColor {
  // hue 环形插值 · 取最短弧
  let dh = b.hue - a.hue;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const hue = (a.hue + dh * t + 360) % 360;
  return {
    hue,
    saturation: a.saturation + (b.saturation - a.saturation) * t,
    lightness: a.lightness + (b.lightness - a.lightness) * t,
  };
}
