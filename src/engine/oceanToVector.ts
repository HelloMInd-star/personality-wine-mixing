/**
 * oceanToVector · OCEAN 五维 → 六维向量转换
 *
 * 作为「测评入口」与「牌类入口」的桥接层：
 *   测评答案 → OCEAN scores (0-100) → 六维向量 [-1,1]
 *   牌类融合 → 直接输出六维向量
 *
 * 草案A 映射 · 保留五维原始信息，LEAD 由 E+A 合成：
 *   O(openness)            → VIS      开放性 → 直觉/灵感
 *   C(conscientiousness)   → INF      尽责性 → 信息依赖/谋略
 *   E(extraversion)        → ENT      外向性 → 热情
 *   A(agreeableness)       → TOL(+0.5) 宜人性 → 容错（温和）
 *   N(neuroticism)         → TOL(-0.5) 神经质 → 风险规避（审慎）
 *   LEAD = (E + A) / 2                 主导由外向+宜人合成
 *   SPD = 0                            决策速度仅由牌类德州入口贡献
 *
 * TOL 由 A 与 -N 各贡献一半，避免一维独占；SPD 留空保证语义清晰：
 *   测评回答「你是怎样的人」，牌类回答「你怎么决策」
 *
 * 纯函数，无副作用，可独立测试
 */

import type { PersonaVector } from '../types/personaFusion';
import type { PersonalityScores, TraitKey } from '../types/personality';

/** OCEAN 维度 → 6D 维度的映射配置 */
interface OceanMapping {
  /** 目标六维维度 */
  target: keyof PersonaVector;
  /** 权重 · A 与 N 各 0.5 以平衡 TOL 贡献 */
  weight: number;
  /** 是否取反 · N 取反（高神经质 → 低容错） */
  negate?: boolean;
}

const OCEAN_TO_6D: Record<TraitKey, OceanMapping> = {
  openness: { target: 'VIS', weight: 1 },
  conscientiousness: { target: 'INF', weight: 1 },
  extraversion: { target: 'ENT', weight: 1 },
  agreeableness: { target: 'TOL', weight: 0.5 },
  neuroticism: { target: 'TOL', weight: 0.5, negate: true },
};

/**
 * 把 0-100 分数归一化到 [-1, 1]
 * 50 分为中性零点，>50 为正倾向，<50 为负倾向
 */
function normalizeScore(score: number): number {
  return (score - 50) / 50;
}

/**
 * OCEAN 五维 → 六维向量
 *
 * @param scores OCEAN 五维分数（0-100）
 * @returns 六维向量 [-1, 1] · SPD 固定为 0（测评不贡献决策速度）
 *
 * @example
 *   oceanToVector({ openness: 80, conscientiousness: 60, extraversion: 70,
 *                   agreeableness: 50, neuroticism: 30 })
 *   // → { TOL: 0.2, SPD: 0, INF: 0.2, ENT: 0.4, LEAD: 0.2, VIS: 0.6 }
 */
export function oceanToVector(scores: PersonalityScores): PersonaVector {
  const vec: PersonaVector = {
    TOL: 0,
    SPD: 0,
    INF: 0,
    ENT: 0,
    LEAD: 0,
    VIS: 0,
  };

  // 5 维直接映射
  for (const trait of Object.keys(OCEAN_TO_6D) as TraitKey[]) {
    const cfg = OCEAN_TO_6D[trait];
    const norm = normalizeScore(scores[trait]);
    const contribution = cfg.negate ? -norm : norm;
    vec[cfg.target] += contribution * cfg.weight;
  }

  // LEAD 由 E + A 合成 · 取两者归一化后的平均
  const eNorm = normalizeScore(scores.extraversion);
  const aNorm = normalizeScore(scores.agreeableness);
  vec.LEAD = (eNorm + aNorm) / 2;

  // SPD 固定为 0 · 测评入口不贡献决策速度（牌类德州专属）

  // 夹取到 [-1, 1] 防止极端分数溢出
  for (const dim of Object.keys(vec) as (keyof PersonaVector)[]) {
    vec[dim] = Math.max(-1, Math.min(1, Math.round(vec[dim] * 1000) / 1000));
  }

  return vec;
}

/** 反查 · 由 vec 估算 OCEAN 分数（用于测评入口的回溯展示，有损） */
export function vectorToOceanEstimate(vec: PersonaVector): PersonalityScores {
  const denorm = (v: number) => Math.round(v * 50 + 50);
  // TOL 由 A 与 -N 各贡献 0.5，无法精确反推 · 取 TOL 全部归给 A，N 取 50（中性）
  return {
    openness: denorm(vec.VIS),
    conscientiousness: denorm(vec.INF),
    extraversion: denorm(vec.ENT),
    agreeableness: denorm(Math.max(0, vec.TOL)),
    neuroticism: denorm(Math.max(0, -vec.TOL)),
  };
}
