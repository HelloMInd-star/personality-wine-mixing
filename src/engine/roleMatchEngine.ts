/**
 * roleMatchEngine · 角色人格匹配引擎
 *
 * 接收用户向量和选择的角色类型，在该角色组内按余弦相似度匹配最接近的人物
 * 输出 RoleMatchResult：人格标签 + 角色标签 + 酒体 + 专属调酒
 *
 * 派生链：
 *   PersonaVector + RoleType
 *     → 该角色组的 10 位人物
 *     → 余弦相似度排序
 *     → Top-1 + 派生标签 + 酒体
 *     → 角色层调酒调整（基础向量 + 角色系数 → 风味偏好 → 专属调酒）
 *
 * 纯函数，无副作用，可独立测试
 */

import type { PersonaVector, PersonaDim } from '../types/personaFusion';
import type { FlavorKey } from '../types/cocktail';
import type { FlavorPreference } from '../types/personality';
import type {
  RoleType,
  RoleMatchResult,
  RolePersona,
  RoleMeta,
  RoleFlavorAdjustment,
} from '../types/role';
import {
  ROLE_MAP,
  getPersonasByRole,
  getRoleFlavorAdjustment,
} from '../data/rolePersonas';
import { derivePersonaTag } from './personaFusionEngine';
import { flavorFromVector } from './flavorFromVector';
import { recommendCocktails } from './cocktailEngine';

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

/**
 * 余弦相似度 · [-1, 1]
 * 全零向量返回 0（避免误判）
 */
export function cosineSimilarity(a: PersonaVector, b: PersonaVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const d of DIMS) {
    dot += a[d] * b[d];
    normA += a[d] * a[d];
    normB += b[d] * b[d];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** 将相似度 [-1, 1] 映射到 [0, 1] 供 UI 展示 */
export function similarityToScore(sim: number): number {
  return Math.round(((sim + 1) / 2) * 1000) / 1000;
}

// ═════════════════════════════════════════════════════════
// 角色层调酒调整
// ═════════════════════════════════════════════════════════

const FLAVOR_KEYS: FlavorKey[] = [
  'sweet', 'sour', 'bitter', 'strong',
  'smoky', 'fruity', 'herbal', 'creamy',
];

/**
 * 应用角色层向量调整 · 基础向量 + 角色系数 → 调整后向量
 *
 * 调整后向量会被夹取到 [-1, 1] 防止溢出
 */
export function applyRoleVectorAdjustment(
  vec: PersonaVector,
  role: RoleType,
): PersonaVector {
  const adj = getRoleFlavorAdjustment(role);
  const out = { ...vec };
  for (const d of DIMS) {
    const delta = adj.vectorAdj[d] ?? 0;
    out[d] = Math.max(-1, Math.min(1, out[d] + delta));
  }
  return out;
}

/**
 * 应用角色层风味偏移 · 基础偏好 + flavorShift → 最终偏好
 *
 * 偏移后夹取到 [0, 1] · 0.5 为中性
 */
export function applyRoleFlavorShift(
  pref: FlavorPreference,
  role: RoleType,
): FlavorPreference {
  const adj = getRoleFlavorAdjustment(role);
  const out: FlavorPreference = { ...pref };
  for (const k of FLAVOR_KEYS) {
    const shift = adj.flavorShift[k] ?? 0;
    out[k] = Math.max(0, Math.min(1, Math.round(((out[k] ?? 0.5) + shift) * 1000) / 1000));
  }
  return out;
}

/**
 * 角色层调酒推荐 · 基础向量 × 角色系数 → 专属调酒
 *
 * 派生链：
 *   1. 基础向量 + vectorAdj → 调整后向量
 *   2. 调整后向量 → flavorFromVector → 基础风味偏好
 *   3. 基础偏好 + flavorShift → 最终偏好
 *   4. 最终偏好 → recommendCocktails → Top-1 专属调酒
 *
 * @param vec 用户六维向量 · null 时返回 null（无向量不推荐）
 * @param role 用户选择的角色类型
 * @param limit 返回前 N 款 · 默认 1
 */
export function recommendByRoleVector(
  vec: PersonaVector | null,
  role: RoleType,
  limit = 1,
) {
  if (!vec) return [];
  const adjustedVec = applyRoleVectorAdjustment(vec, role);
  const basePref = flavorFromVector(adjustedVec);
  const finalPref = applyRoleFlavorShift(basePref, role);
  return recommendCocktails(finalPref, limit);
}

// ═════════════════════════════════════════════════════════
// 角色匹配主入口
// ═════════════════════════════════════════════════════════

/**
 * 角色匹配主入口
 *
 * @param vec 用户六维向量 · null 时返回该角色组的默认代表（index 1）
 * @param role 用户选择的角色类型
 * @returns 角色匹配结果 · 含专属调酒推荐
 */
export function matchRolePersona(
  vec: PersonaVector | null,
  role: RoleType,
): RoleMatchResult {
  const roleMeta: RoleMeta = ROLE_MAP[role];
  const personas: RolePersona[] = getPersonasByRole(role);
  const flavorAdj: RoleFlavorAdjustment = getRoleFlavorAdjustment(role);

  // 无向量 · 返回该组默认代表（index 1）· 不推荐调酒
  if (!vec) {
    const persona = personas.find((p) => p.index === 1) ?? personas[0];
    return buildResult(persona, roleMeta, 0, true, flavorAdj, null);
  }

  // 计算相似度并取 Top-1
  let best = personas[0];
  let bestSim = -Infinity;
  for (const p of personas) {
    const sim = cosineSimilarity(vec, p.vector);
    if (sim > bestSim) {
      bestSim = sim;
      best = p;
    }
  }

  // 角色层调酒推荐 · Top-1
  const cocktailRec = recommendByRoleVector(vec, role, 1)[0] ?? null;

  return buildResult(best, roleMeta, bestSim, false, flavorAdj, cocktailRec);
}

/** 构造匹配结果 */
function buildResult(
  persona: RolePersona,
  role: RoleMeta,
  sim: number,
  isDefault: boolean,
  flavorAdj: RoleFlavorAdjustment,
  cocktail: RoleMatchResult['cocktail'],
): RoleMatchResult {
  const personaTag = derivePersonaTag(persona.vector);
  const matchScore = isDefault ? 0 : similarityToScore(sim);
  const displayTag = `${persona.mbti} · ${personaTag} · 属于${role.label}人格`;
  // 输出长标签 · 如 "INTJ · 战略建筑师 · 创业家型调酒"
  const cocktailTag = `${persona.mbti} · ${personaTag} · ${role.label}型调酒`;
  return {
    persona,
    role,
    displayTag,
    mbti: persona.mbti,
    personaTag,
    matchScore,
    cocktailStyle: persona.cocktailStyle,
    isDefault,
    flavorAdjustment: flavorAdj,
    cocktail,
    cocktailTag,
  };
}
