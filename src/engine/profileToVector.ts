/**
 * profileToVector · 大五人格画像 → 六维人格向量
 *
 * 将 PersonalityProfile.scores（OCEAN · 0-100）映射为 PersonaVector（六维 · 0-1）
 * 作为人格测评入口的派生产物，让向量成为统一的「数据契约」
 *
 * 映射依据（OCEAN → 六维）：
 * - VIS（直觉）  ← openness            开放性高 → 直觉权重高
 * - INF（信息）  ← conscientiousness   尽责性高 → 信息依赖强
 * - ENT（热情）  ← extraversion        外向性高 → 热情强度高
 * - LEAD（主导） ← extraversion*0.6 + (1-agreeableness)*0.4
 *                  外向+不随和 → 主导倾向强
 * - TOL（容错）  ← (1-neuroticism)*0.5 + agreeableness*0.5
 *                  情绪稳定+随和 → 容忍不确定性
 * - SPD（速度）  ← (1-neuroticism)     情绪稳定 → 决策偏快
 *
 * 校准策略：统一可复用优先，后续由 feedbackEngine 的 calibrateVector 做偏差校准
 */

import type { PersonalityProfile } from '../types/personality';
import type { PersonaVector } from '../types/personaFusion';

/** 0-100 分数 → 0-1 权重 · 钳制边界防脏数据 */
const norm = (score: number): number => Math.max(0, Math.min(1, score / 100));

/** 保留 3 位小数 · 与 applyBiologyShift / calibrateVector 保持一致 */
function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

/**
 * 大五人格画像 → 六维人格向量
 * @param profile 人格测评产物（含 OCEAN 五维分数）
 * @returns 六维人格向量（0-1），用于推荐引擎与反馈校准
 */
export function profileToVector(profile: PersonalityProfile): PersonaVector {
  const { scores } = profile;
  const o = norm(scores.openness);
  const c = norm(scores.conscientiousness);
  const e = norm(scores.extraversion);
  const a = norm(scores.agreeableness);
  const n = norm(scores.neuroticism);

  return {
    VIS: round(o),
    INF: round(c),
    ENT: round(e),
    LEAD: round(e * 0.6 + (1 - a) * 0.4),
    TOL: round((1 - n) * 0.5 + a * 0.5),
    SPD: round(1 - n),
  };
}
