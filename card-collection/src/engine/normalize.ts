/**
 * 归一化引擎 · 将六维向量归一化到 [-1, 1]
 * 纯函数，无副作用
 */
import type { PersonaVector, PersonaDim } from '../types';

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

/**
 * 按最大绝对值归一化到 [-1, 1]
 * 全零向量原样返回（避免除零）
 */
export function normalizeVector(vec: PersonaVector): PersonaVector {
  const maxAbs = Math.max(...DIMS.map((d) => Math.abs(vec[d])));
  if (maxAbs === 0) return { ...vec };
  const out = {} as PersonaVector;
  for (const d of DIMS) {
    out[d] = Math.round((vec[d] / maxAbs) * 1000) / 1000;
  }
  return out;
}

/** 空向量 · 融合前的初始态 */
export function zeroVector(): PersonaVector {
  return { TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0 };
}
