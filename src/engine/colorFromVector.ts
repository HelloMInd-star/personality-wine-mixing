/**
 * colorFromVector · 六维向量 → 光效主色色环派生
 *
 * 派生链：
 *   PersonaVector(六维 [-1,1]) → { primary, secondary }(两个 HSL 色)
 *
 * 算法 · 色环插值：
 *   1. 对每个维度 d，根据 vec[d] 正负取出对应 HSL 色（来自 VECTOR_COLOR_RING）
 *   2. 以 |vec[d]| 作为该色的强度
 *   3. 主色 = 强度最大维度对应的色，向 DEFAULT_VECTOR_COLOR（深空紫晶）按强度插值
 *      · 强度=1 时纯维度色，强度=0 时退化为默认紫晶
 *   4. 次色 = 强度次大维度对应的色，同样按强度向默认紫晶退化
 *   5. 全零向量 → primary 与 secondary 皆为默认紫晶
 *
 * 设计理念：
 *   旧 lightEngine 主色 = profile.archetype.auraColor（10 种原型 10 个固定色）
 *   本派生以六维向量为输入，是连续派生 · 色彩随向量平滑过渡
 *   兼容层：lightEngine 新入口 getLightByVector 用本函数派生 baseColor
 *
 * 视觉联动：
 *   采集阶段（card-collection）四色粒子打散重组为六维
 *   调酒阶段六维派生主色驱动光效/气味，主基调回归深空紫金磨砂玻璃
 *
 * 纯函数，无副作用，可独立测试
 */

import type { PersonaVector, PersonaDim } from '../types/personaFusion';
import {
  VECTOR_COLOR_RING,
  DEFAULT_VECTOR_COLOR,
  interpolateHSL,
  hslToHex,
  hslToString,
  type HSLColor,
} from '../data/vectorColorMap';

/** 派生结果 · 主色 + 次色 */
export interface VectorColorResult {
  /** 主色 HSL · 来自绝对值最大维度 · 全零时取默认紫晶 */
  primary: HSLColor;
  /** 次色 HSL · 来自绝对值次大维度 · 全零或仅一维非零时与 primary 相同 */
  secondary: HSLColor;
  /** 主色 hex · 供需要 hex 格式的组件消费（如 LightCanvas.baseColor） */
  primaryHex: string;
  /** 次色 hex */
  secondaryHex: string;
  /** 主色 CSS · 供 style 直接消费 */
  primaryCss: string;
  /** 次色 CSS */
  secondaryCss: string;
  /** 主色对应维度 · 全零时为 null */
  primaryDim: PersonaDim | null;
  /** 次色对应维度 · 全零或仅一维非零时为 null */
  secondaryDim: PersonaDim | null;
  /** 主色强度 · |vec[primaryDim]| · 全零时为 0 */
  primaryIntensity: number;
  /** 次色强度 · |vec[secondaryDim]| · 全零或仅一维非零时为 0 */
  secondaryIntensity: number;
}

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

interface Candidate {
  dim: PersonaDim;
  value: number;
  intensity: number;
  color: HSLColor;
}

/**
 * 六维向量 → 光效主色 + 次色
 *
 * @param vec 六维向量 [-1, 1]
 * @returns 主色 + 次色（含 HSL/hex/CSS 三种格式）· 全零向量两者皆为默认紫晶
 *
 * @example
 *   // 全零向量 → 默认深空紫晶
 *   colorFromVector({ TOL:0, SPD:0, INF:0, ENT:0, LEAD:0, VIS:0 })
 *   // → { primary: { hue:265, sat:0.5, light:0.55 }, ... }
 *
 *   // ENT=1 → 主色橙红（ENT+ 阳色）
 *   colorFromVector({ TOL:0, SPD:0, INF:0, ENT:1, LEAD:0, VIS:0 })
 *   // → { primary: { hue:20, sat:0.75, light:0.6 }, ... }
 */
export function colorFromVector(vec: PersonaVector): VectorColorResult {
  // 计算每个维度的强度与对应色
  const candidates: Candidate[] = DIMS.map((dim) => {
    const value = vec[dim];
    const intensity = Math.abs(value);
    const pair = VECTOR_COLOR_RING[dim];
    const color = value >= 0 ? pair.positive : pair.negative;
    return { dim, value, intensity, color };
  });

  // 按强度降序排序
  candidates.sort((a, b) => b.intensity - a.intensity);

  const top1 = candidates[0];
  const top2 = candidates[1];

  // 全零向量 → 默认紫晶
  if (top1.intensity === 0) {
    return {
      primary: DEFAULT_VECTOR_COLOR,
      secondary: DEFAULT_VECTOR_COLOR,
      primaryHex: hslToHex(DEFAULT_VECTOR_COLOR),
      secondaryHex: hslToHex(DEFAULT_VECTOR_COLOR),
      primaryCss: hslToString(DEFAULT_VECTOR_COLOR),
      secondaryCss: hslToString(DEFAULT_VECTOR_COLOR),
      primaryDim: null,
      secondaryDim: null,
      primaryIntensity: 0,
      secondaryIntensity: 0,
    };
  }

  // 主色：向维度色按强度插值（强度=1 时纯维度色，强度=0 时默认紫晶）
  const primary = interpolateHSL(DEFAULT_VECTOR_COLOR, top1.color, top1.intensity);

  // 仅一维非零 → 次色与主色相同
  if (top2.intensity === 0) {
    return {
      primary,
      secondary: primary,
      primaryHex: hslToHex(primary),
      secondaryHex: hslToHex(primary),
      primaryCss: hslToString(primary),
      secondaryCss: hslToString(primary),
      primaryDim: top1.dim,
      secondaryDim: null,
      primaryIntensity: top1.intensity,
      secondaryIntensity: 0,
    };
  }

  // 正常情况 · 两维非零
  const secondary = interpolateHSL(DEFAULT_VECTOR_COLOR, top2.color, top2.intensity);
  return {
    primary,
    secondary,
    primaryHex: hslToHex(primary),
    secondaryHex: hslToHex(secondary),
    primaryCss: hslToString(primary),
    secondaryCss: hslToString(secondary),
    primaryDim: top1.dim,
    secondaryDim: top2.dim,
    primaryIntensity: top1.intensity,
    secondaryIntensity: top2.intensity,
  };
}

/**
 * 由维度直接派生单色 · 用于固定维度查询
 */
export function getColorByDim(vec: PersonaVector, dim: PersonaDim): HSLColor {
  const value = vec[dim];
  const pair = VECTOR_COLOR_RING[dim];
  return value >= 0 ? pair.positive : pair.negative;
}

/**
 * 计算向量色环渐变 CSS · 用于 FlavorSpectrum 色阶条
 * 返回线性渐变，从主色到次色
 */
export function getVectorGradientCss(vec: PersonaVector, angle = 90): string {
  const { primary, secondary } = colorFromVector(vec);
  return `linear-gradient(${angle}deg, ${hslToString(primary)} 0%, ${hslToString(secondary)} 100%)`;
}

/**
 * 取向量的"色相签名" · 12 个气味位对应的色相集合
 * 用于视觉层渲染气味谱的色彩底图
 */
export function getVectorColorSignature(vec: PersonaVector): HSLColor[] {
  return DIMS.map((dim) => {
    const value = vec[dim];
    const pair = VECTOR_COLOR_RING[dim];
    const baseColor = value >= 0 ? pair.positive : pair.negative;
    // 按强度向默认紫晶插值
    return interpolateHSL(DEFAULT_VECTOR_COLOR, baseColor, Math.abs(value));
  });
}
