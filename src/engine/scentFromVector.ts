/**
 * scentFromVector · 六维向量 → 签名气味 Top-2
 *
 * 派生链：
 *   PersonaVector(六维 [-1,1]) → { primary, secondary }(两个气味 note)
 *
 * 算法 · 加权叠加 Top-2：
 *   1. 对每个维度 d，根据 vec[d] 正负取出对应气味 note（positive/negative）
 *   2. 以 |vec[d]| 作为该气味的强度
 *   3. 按强度降序排序，取 Top-1 为 primary（主签名），Top-2 为 secondary（次签名）
 *   4. 全零向量 → primary 与 secondary 均取默认琥珀
 *
 * 设计理念：
 *   旧 SIGNATURE_SCENTS 以原型 code 为 key（10 种），是离散查表
 *   本派生以六维向量为输入，是连续派生 · 气味随向量平滑过渡
 *   兼容层：scentEngine 新入口 getScentByVector 用本函数派生 signatureNote
 *
 * 纯函数，无副作用，可独立测试
 */

import type { PersonaVector, PersonaDim } from '../types/personaFusion';
import {
  VECTOR_SCENT_SPACE,
  DEFAULT_VECTOR_SCENT,
  getScentByDimensionValue,
  type VectorScentNote,
} from '../data/vectorScentMap';

/** 派生结果 · 主签名 + 次签名 */
export interface VectorScentResult {
  /** 主签名气味 · 来自绝对值最大维度 · 全零时取默认琥珀 */
  primary: VectorScentNote;
  /** 次签名气味 · 来自绝对值次大维度 · 全零或仅一维非零时与 primary 相同 */
  secondary: VectorScentNote;
  /** 主签名对应的维度键 · 全零时为 null */
  primaryDim: PersonaDim | null;
  /** 次签名对应的维度键 · 全零或仅一维非零时为 null */
  secondaryDim: PersonaDim | null;
  /** 主签名强度 · |vec[primaryDim]| · 全零时为 0 */
  primaryIntensity: number;
  /** 次签名强度 · |vec[secondaryDim]| · 全零或仅一维非零时为 0 */
  secondaryIntensity: number;
}

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

/**
 * 六维向量 → 签名气味 Top-2
 *
 * @param vec 六维向量 [-1, 1]
 * @returns 主签名 + 次签名 · 全零向量两者皆为默认琥珀
 *
 * @example
 *   // 全零向量 → 默认琥珀
 *   scentFromVector({ TOL:0, SPD:0, INF:0, ENT:0, LEAD:0, VIS:0 })
 *   // → { primary: amber, secondary: amber, primaryDim: null, ... }
 *
 *   // ENT=1 → 主签柑橘（ENT+）
 *   scentFromVector({ TOL:0, SPD:0, INF:0, ENT:1, LEAD:0, VIS:0 })
 *   // → { primary: citrus, primaryDim: 'ENT', ... }
 *
 *   // ENT=1 VIS=0.5 → 主签柑橘，次签紫罗兰
 *   scentFromVector({ TOL:0, SPD:0, INF:0, ENT:1, LEAD:0, VIS:0.5 })
 *   // → { primary: citrus, secondary: violet, ... }
 */
export function scentFromVector(vec: PersonaVector): VectorScentResult {
  // 计算每个维度的强度与对应气味
  const candidates = DIMS.map((dim) => {
    const value = vec[dim];
    const intensity = Math.abs(value);
    const scent = getScentByDimensionValue(dim, value);
    return { dim, value, intensity, scent };
  });

  // 按强度降序排序
  candidates.sort((a, b) => b.intensity - a.intensity);

  const top1 = candidates[0];
  const top2 = candidates[1];

  // 全零向量 → 默认琥珀
  if (top1.intensity === 0) {
    return {
      primary: DEFAULT_VECTOR_SCENT,
      secondary: DEFAULT_VECTOR_SCENT,
      primaryDim: null,
      secondaryDim: null,
      primaryIntensity: 0,
      secondaryIntensity: 0,
    };
  }

  // 仅一维非零 → 次签名与主签名相同
  if (top2.intensity === 0) {
    return {
      primary: top1.scent,
      secondary: top1.scent,
      primaryDim: top1.dim,
      secondaryDim: null,
      primaryIntensity: top1.intensity,
      secondaryIntensity: 0,
    };
  }

  // 正常情况 · 两维非零
  return {
    primary: top1.scent,
    secondary: top2.scent,
    primaryDim: top1.dim,
    secondaryDim: top2.dim,
    primaryIntensity: top1.intensity,
    secondaryIntensity: top2.intensity,
  };
}

/**
 * 由维度倾向直接派生单气味 · 用于固定维度查询
 * 例如：始终取 VIS 维度对应的气味作为某种"灵感签名"
 */
export function getScentByDim(vec: PersonaVector, dim: PersonaDim): VectorScentNote {
  return getScentByDimensionValue(dim, vec[dim]);
}

/**
 * 取向量主导维度 · 绝对值最大者
 * 全零返回 null
 */
export function getDominantDim(vec: PersonaVector): PersonaDim | null {
  let maxDim: PersonaDim | null = null;
  let maxAbs = 0;
  for (const d of DIMS) {
    const abs = Math.abs(vec[d]);
    if (abs > maxAbs) {
      maxAbs = abs;
      maxDim = d;
    }
  }
  return maxAbs === 0 ? null : maxDim;
}

/** 向量空间所有气味 note 列表 · 用于 UI 渲染气味谱 */
export function getAllVectorScentNotes(): VectorScentNote[] {
  return DIMS.flatMap((dim) => [
    VECTOR_SCENT_SPACE[dim].positive,
    VECTOR_SCENT_SPACE[dim].negative,
  ]);
}
