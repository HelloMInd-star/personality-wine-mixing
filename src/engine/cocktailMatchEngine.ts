/**
 * cocktailMatchEngine · 人格×鸡尾酒匹配推荐引擎
 *
 * 输入：六维人格向量 + 酒库 → 输出：排名匹配推荐
 *
 * 匹配维度：
 *   1. archetypeAffinity — MBTI 类型直接匹配（权重 0.35）
 *   2. mbtiProfile        — 内外向/酒精度/复杂度/风味调性（权重 0.40）
 *   3. flavorProfile      — 八维风味向量余弦相似度（权重 0.25）
 *
 * 用法：
 *   import { matchCocktailsByPersona } from './cocktailMatchEngine';
 *   const results = matchCocktailsByPersona(vector, 'INTJ', ALL_LIBRARY_COCKTAILS);
 */

import type { Cocktail, CocktailRecommendation } from '../types/cocktail';
import type { PersonaVector } from '../types/personaFusion';

/** 六维向量 → 风味偏好映射表 */
const VECTOR_TO_FLAVOR: Record<string, Record<string, number>> = {
  TOL: { sweet: 0.4, bitter: 0.6, creamy: 0.3 },
  SPD: { sour: 0.5, fruity: 0.5, strong: 0.3 },
  INF: { herbal: 0.6, bitter: 0.4, smoky: 0.2 },
  ENT: { fruity: 0.5, sweet: 0.4, sour: 0.3 },
  LEAD: { strong: 0.6, smoky: 0.4, bitter: 0.3 },
  VIS: { herbal: 0.4, fruity: 0.4, creamy: 0.3 },
};

/** 六维向量 → 复杂度偏好 */
function complexityFromVector(v: PersonaVector): number {
  // INF(信息) + VIS(直觉) → 高复杂度偏好；TOL(容错)高 → 简单直接
  return (v.INF * 0.4 + v.VIS * 0.3 + (1 - v.TOL) * 0.3);
}

/** 复杂度数值 → 标签 */
function complexityLabel(score: number): string {
  if (score > 0.65) return '复杂多变';
  if (score > 0.4) return '层次丰富';
  return '简单直接';
}

/** abv 偏好数值 */
function abvScoreFromVector(v: PersonaVector): number {
  // LEAD(主导) + SPD(速度) → 高酒精度；ENT(热情)高 → 中度
  return v.LEAD * 0.4 + v.SPD * 0.3 + v.ENT * 0.3;
}

/** abv 数值 → 标签 */
function abvLabel(score: number): string {
  if (score > 0.65) return '浓烈';
  if (score > 0.35) return '中度';
  return '轻量';
}

/** 内外向偏向 */
function introversionBias(v: PersonaVector): string {
  // ENT(热情) 高 → 外向；低 → 内向
  if (v.ENT > 0.6) return '偏外向社交';
  if (v.ENT < 0.35) return '偏内向独酌';
  return '皆可';
}

/** 风味调性偏好 */
function flavorToneFromVector(v: PersonaVector): string {
  const scores: Record<string, number> = {
    '清爽型': (1 - v.TOL) * 0.3 + v.SPD * 0.3,
    '果味型': v.ENT * 0.4 + v.SPD * 0.2,
    '草本型': v.INF * 0.3 + v.VIS * 0.3,
    '奶油型': v.TOL * 0.3 + v.ENT * 0.2,
    '甜润型': v.TOL * 0.4 + v.ENT * 0.3,
    '花香型': v.VIS * 0.4 + v.ENT * 0.2,
    '烟熏型': v.LEAD * 0.3 + v.INF * 0.2,
  };
  let best = '清爽型';
  let bestScore = 0;
  for (const [tone, s] of Object.entries(scores)) {
    if (s > bestScore) { best = tone; bestScore = s; }
  }
  return best;
}

/**
 * 计算目标偏好向量 → 鸡尾酒风味向量的余弦相似度
 * 八维风味：sweet/sour/bitter/strong/smoky/fruity/herbal/creamy
 */
function flavorCosineSimilarity(
  target: Record<string, number>,
  cocktail: Cocktail,
): number {
  const keys = ['sweet', 'sour', 'bitter', 'strong', 'smoky', 'fruity', 'herbal', 'creamy'];
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const k of keys) {
    const a = target[k] ?? 0;
    const b = (cocktail.flavorProfile[k as keyof typeof cocktail.flavorProfile] ?? 0) / 10;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0.5;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 六维向量 → 人格口味偏好向量
 * 聚合各维度偏好加权
 */
function personaFlavorTarget(v: PersonaVector): Record<string, number> {
  const target: Record<string, number> = {};
  const dims = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'] as const;
  for (const dim of dims) {
    const w = Math.abs(v[dim]);
    const map = VECTOR_TO_FLAVOR[dim];
    for (const [flavor, coeff] of Object.entries(map)) {
      target[flavor] = (target[flavor] ?? 0) + w * coeff;
    }
  }
  // 归一化
  const maxVal = Math.max(...Object.values(target), 0.01);
  for (const k of Object.keys(target)) {
    target[k] /= maxVal;
  }
  return target;
}

/**
 * 人格×鸡尾酒匹配推荐
 *
 * @param vector 六维人格向量
 * @param mbti 可选 · MBTI 四字母（如 "INTJ"），用于 archetypeAffinity 精确匹配
 * @param library 全酒库
 * @param limit 返回数量 · 默认 6
 */
export function matchCocktailsByPersona(
  vector: PersonaVector,
  mbti: string | undefined,
  library: Cocktail[],
  limit = 6,
): CocktailRecommendation[] {
  const flavorTarget = personaFlavorTarget(vector);
  const userIntroversion = introversionBias(vector);
  const userAbv = abvLabel(abvScoreFromVector(vector));
  const userComplexity = complexityLabel(complexityFromVector(vector));
  const userFlavorTone = flavorToneFromVector(vector);

  const results: CocktailRecommendation[] = [];

  for (const cocktail of library) {
    const reasons: string[] = [];
    let score = 0;

    // 维度 1：archetypeAffinity（权重 0.35）
    if (mbti && cocktail.archetypeAffinity) {
      if (cocktail.archetypeAffinity.includes(mbti)) {
        score += 0.35;
        reasons.push(`MBTI 原型匹配 · ${mbti}`);
      } else if (cocktail.archetypeAffinity.some((a) => a.slice(0, 2) === mbti.slice(0, 2))) {
        // 同气质组（如 INTJ 和 ENTJ 都是 NT）
        score += 0.18;
        reasons.push(`同气质组 · ${mbti.slice(0, 2)} 族`);
      }
    }

    // 维度 2：mbtiProfile（权重 0.40）
    if (cocktail.mbtiProfile) {
      const p = cocktail.mbtiProfile;
      let mbtiScore = 0;

      if (p.introversionBias === userIntroversion) {
        mbtiScore += 0.12;
        reasons.push(`内外向契合 · ${userIntroversion}`);
      } else if (p.introversionBias === '皆可') {
        mbtiScore += 0.06;
      }

      if (p.abvPreference === userAbv) {
        mbtiScore += 0.10;
        reasons.push(`酒精度契合 · ${userAbv}`);
      }

      if (p.complexity === userComplexity) {
        mbtiScore += 0.10;
        reasons.push(`复杂度契合 · ${userComplexity}`);
      } else if (
        (p.complexity === '层次丰富' && userComplexity === '复杂多变') ||
        (p.complexity === '复杂多变' && userComplexity === '层次丰富')
      ) {
        mbtiScore += 0.05;
      }

      if (p.flavorTone === userFlavorTone) {
        mbtiScore += 0.08;
        reasons.push(`风味调性契合 · ${userFlavorTone}`);
      }

      score += mbtiScore;
    }

    // 维度 3：flavorProfile 余弦相似度（权重 0.25）
    const flavorSim = flavorCosineSimilarity(flavorTarget, cocktail);
    score += flavorSim * 0.25;
    if (flavorSim > 0.7) {
      reasons.push(`风味高度相似 · ${(flavorSim * 100).toFixed(0)}%`);
    }

    // 经典指数加成（最多 0.05）
    if (cocktail.classicRating) {
      score += (cocktail.classicRating / 5) * 0.05;
    }

    results.push({
      cocktail,
      matchScore: Math.round(score * 100),
      reasons,
    });
  }

  // 按 matchScore 降序，取前 limit
  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

/**
 * 无向量时 · 按经典指数排序推荐
 */
export function recommendClassics(library: Cocktail[], limit = 6): CocktailRecommendation[] {
  return library
    .filter((c) => (c.classicRating ?? 0) >= 3)
    .sort((a, b) => (b.classicRating ?? 0) - (a.classicRating ?? 0))
    .slice(0, limit)
    .map((cocktail) => ({
      cocktail,
      matchScore: (cocktail.classicRating ?? 3) * 20,
      reasons: [`经典指数 ${cocktail.classicRating}★`],
    }));
}