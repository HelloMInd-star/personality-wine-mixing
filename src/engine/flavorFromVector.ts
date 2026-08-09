/**
 * flavorFromVector · 六维向量 → 八维风味偏好加权矩阵
 *
 * 派生链：
 *   PersonaVector(六维 [-1,1]) → FlavorPreference(八维 [0,1])
 *
 * 设计理念：
 *   每个风味维度由六维加权计算，正倾向提升该风味，负倾向压制
 *   全零向量输出中性偏好 0.5（与 personalityEngine.generateFlavorPreference 对齐）
 *   风味权重 0.5 为中性，>0.5 偏好，<0.5 排斥
 *
 * 矩阵设计呼应现有 FLAVOR_MAPPING_RULES 语义，但用六维表达：
 *   sweet   ← ENT(热情) + VIS(直觉) + 微量 TOL(容错)
 *   sour    ← SPD(速度) + 微量 INF/ENT
 *   bitter  ← INF(信息) + LEAD(主导) - ENT(热情)
 *   strong  ← TOL(容错) + LEAD(主导) + 微量 ENT
 *   smoky   ← TOL + INF + 微量 VIS - 微量 ENT
 *   fruity  ← ENT + VIS + 微量 SPD
 *   herbal  ← INF + VIS - 微量 ENT + 微量 TOL
 *   creamy  ← ENT + VIS + 微量 TOL
 *
 * 视觉联动：
 *   八维风味权重可直接驱动 FlavorSpectrum 色阶渐变组件
 *   权重 → HSL 饱和度，形成动态色谱条
 *
 * 纯函数，无副作用，可独立测试
 */

import type { PersonaVector, PersonaDim } from '../types/personaFusion';
import type { FlavorKey } from '../types/cocktail';
import type { FlavorPreference } from '../types/personality';

/** 八维风味键 · 顺序固定 */
const FLAVOR_KEYS: FlavorKey[] = [
  'sweet', 'sour', 'bitter', 'strong',
  'smoky', 'fruity', 'herbal', 'creamy',
];

/** 六维键 · 顺序固定 */
const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

/**
 * 加权矩阵 · flavorMatrix[flavor][dim] = 权重
 *
 * 每行权重绝对值之和 ≤ 1，保证 raw 值落在 [-1, 1]
 * 负权重表示该维度压制该风味（如 ENT 高 → bitter 低）
 */
export const FLAVOR_MATRIX: Record<FlavorKey, Record<PersonaDim, number>> = {
  sweet:   { TOL: 0.1,  SPD: 0,    INF: 0,    ENT: 0.4,  LEAD: 0,    VIS: 0.2  },
  sour:    { TOL: 0,    SPD: 0.3,  INF: 0.1,  ENT: 0.1,  LEAD: 0,    VIS: 0    },
  bitter:  { TOL: 0,    SPD: 0.1,  INF: 0.4,  ENT: -0.2, LEAD: 0.2,  VIS: 0    },
  strong:  { TOL: 0.3,  SPD: 0,    INF: 0,    ENT: 0.1,  LEAD: 0.4,  VIS: 0    },
  smoky:   { TOL: 0.3,  SPD: 0,    INF: 0.2,  ENT: -0.1, LEAD: 0.2,  VIS: 0.1  },
  fruity:  { TOL: 0,    SPD: 0.1,  INF: 0,    ENT: 0.4,  LEAD: 0,    VIS: 0.2  },
  herbal:  { TOL: 0.1,  SPD: 0,    INF: 0.4,  ENT: -0.1, LEAD: 0,    VIS: 0.3  },
  creamy:  { TOL: 0.1,  SPD: 0,    INF: 0,    ENT: 0.2,  LEAD: 0,    VIS: 0.2  },
};

/**
 * 六维向量 → 八维风味偏好
 *
 * @param vec 六维向量 [-1, 1]
 * @returns 八维风味偏好 [0, 1] · 0.5 为中性
 *
 * @example
 *   // 全零向量 → 全中性 0.5
 *   flavorFromVector({ TOL:0, SPD:0, INF:0, ENT:0, LEAD:0, VIS:0 })
 *   // → { sweet:0.5, sour:0.5, bitter:0.5, ... }
 *
 *   // 高 ENT + 高 VIS → sweet/fruity 偏高，bitter 偏低
 *   flavorFromVector({ TOL:0, SPD:0, INF:0, ENT:1, LEAD:0, VIS:1 })
 *   // → { sweet:0.8, fruity:0.8, bitter:0.3, ... }
 */
export function flavorFromVector(vec: PersonaVector): FlavorPreference {
  const preference: FlavorPreference = {};

  for (const flavor of FLAVOR_KEYS) {
    const row = FLAVOR_MATRIX[flavor];
    // raw = sum(vec[d] * weight[d]) · 范围 [-1, 1]
    let raw = 0;
    for (const d of DIMS) {
      raw += vec[d] * row[d];
    }
    // 夹取到 [-1, 1] 防止极端叠加溢出
    raw = Math.max(-1, Math.min(1, raw));
    // 映射到 [0, 1] · 0.5 为中性
    preference[flavor] = Math.round((0.5 + 0.5 * raw) * 1000) / 1000;
  }

  return preference;
}

/**
 * 取主调风味 · 用于 UI 展示「最偏好的味道」
 * 返回权重最高的风味键，零向量时返回 null
 */
export function getPrimaryFlavor(pref: FlavorPreference): FlavorKey | null {
  let maxKey: FlavorKey | null = null;
  let maxVal = 0.5; // 严格大于中性才算偏好
  for (const k of FLAVOR_KEYS) {
    const v = pref[k] ?? 0.5;
    if (v > maxVal) {
      maxVal = v;
      maxKey = k;
    }
  }
  return maxKey;
}

/**
 * 取最排斥风味 · 用于 UI 展示「最回避的味道」
 * 返回权重最低的风味键，零向量时返回 null
 */
export function getAvoidFlavor(pref: FlavorPreference): FlavorKey | null {
  let minKey: FlavorKey | null = null;
  let minVal = 0.5; // 严格小于中性才算排斥
  for (const k of FLAVOR_KEYS) {
    const v = pref[k] ?? 0.5;
    if (v < minVal) {
      minVal = v;
      minKey = k;
    }
  }
  return minKey;
}
