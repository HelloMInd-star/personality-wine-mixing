/**
 * 人格测评引擎 · 纯函数模块
 * 答案 → 五维分数 → 原型匹配 → 风味偏好 → 完整画像
 * 所有函数皆为纯函数，无副作用，便于测试与复用
 */

import type {
  TraitKey,
  PersonalityScores,
  PersonalityArchetype,
  PersonalityProfile,
  FlavorPreference,
} from '../types/personality';
import type { FlavorKey } from '../types/cocktail';

import { PERSONALITY_QUESTIONS } from '../data/personalityQuestions';
import { PERSONALITY_ARCHETYPES } from '../data/personalityArchetypes';
import {
  FLAVOR_MAPPING_RULES,
  MAPPING_TRAIT_THRESHOLD,
} from '../data/flavorMapping';

/** 五维键 · 顺序固定为 OCEAN */
const TRAIT_KEYS: TraitKey[] = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
];

/** 八维风味键 · 用于初始化完整的风味偏好 */
const FLAVOR_KEYS: FlavorKey[] = [
  'sweet',
  'sour',
  'bitter',
  'strong',
  'smoky',
  'fruity',
  'herbal',
  'creamy',
];

/** 单维度题目数 · 用于分数映射的上下界 */
const QUESTIONS_PER_TRAIT = 6;
/** 单题原始分上下界（李克特 1-5） */
const RAW_MIN = 1;
const RAW_MAX = 5;
/** 单维度原始总分上下界 */
const TRAIT_RAW_MIN = RAW_MIN * QUESTIONS_PER_TRAIT; // 6
const TRAIT_RAW_MAX = RAW_MAX * QUESTIONS_PER_TRAIT; // 30

/**
 * 计算五维分数
 * 反向题以 (6 - value) 反转；维度分 = 该维题目得分之和映射到 0-100
 * 未作答的题目按中性分 3 处理（正常流程下 buildProfile 仅在全部作答后调用）
 */
export function calculateScores(answers: Record<string, number>): PersonalityScores {
  const scores = {} as PersonalityScores;

  for (const trait of TRAIT_KEYS) {
    const traitQuestions = PERSONALITY_QUESTIONS.filter((q) => q.dimension === trait);
    let rawSum = 0;
    for (const q of traitQuestions) {
      const raw = answers[q.id] ?? 3; // 缺省取中性
      const value = q.reverse ? RAW_MAX + RAW_MIN - raw : raw; // 反向：6 - raw
      rawSum += value;
    }
    // 映射 6-30 → 0-100
    const normalized =
      ((rawSum - TRAIT_RAW_MIN) / (TRAIT_RAW_MAX - TRAIT_RAW_MIN)) * 100;
    scores[trait] = Math.round(normalized);
  }

  return scores;
}

/**
 * 匹配人格原型
 * 规则：优先返回所有 signature 区间都命中的原型；
 * 多个完美匹配时，更具体（指定维度更多）者优先；
 * 无完美匹配时，返回综合距离最近者；兜底返回均衡型
 */
export function matchArchetype(scores: PersonalityScores): PersonalityArchetype {
  let best: PersonalityArchetype | null = null;
  let bestPerfect = false;
  let bestSpecificity = -1;
  let bestPenalty = Infinity;

  for (const archetype of PERSONALITY_ARCHETYPES) {
    const signatureEntries = Object.entries(archetype.signature) as [
      TraitKey,
      [number, number],
    ][];

    let inRangeCount = 0;
    let penalty = 0;
    for (const [trait, [low, high]] of signatureEntries) {
      const score = scores[trait];
      if (score >= low && score <= high) {
        inRangeCount += 1;
      } else {
        // 越界距离：到最近边界的距离
        penalty += score < low ? low - score : score - high;
      }
    }

    const specifiedCount = signatureEntries.length;
    const isPerfect = inRangeCount === specifiedCount && specifiedCount > 0;

    // 排序键：完美匹配 > 具体度（指定维度数）> 距离更近
    const better = isPerfect && !bestPerfect
      ? true
      : isPerfect === bestPerfect && specifiedCount > bestSpecificity
        ? true
        : isPerfect === bestPerfect
          && specifiedCount === bestSpecificity
          && penalty < bestPenalty
          ? true
          : false;

    if (best === null || better) {
      best = archetype;
      bestPerfect = isPerfect;
      bestSpecificity = specifiedCount;
      bestPenalty = penalty;
    }
  }

  // 兜底：均衡型（正常逻辑下 best 必有值）
  return best ?? PERSONALITY_ARCHETYPES[PERSONALITY_ARCHETYPES.length - 1];
}

/**
 * 由五维分数生成风味偏好
 * 维度分 > 阈值 → 激活 highFlavors；维度分 < (100-阈值) → 激活 lowFlavors
 * 累加权重后做 min-max 归一化到 0-1；全平等时取中性 0.5
 */
export function generateFlavorPreference(scores: PersonalityScores): FlavorPreference {
  const raw: Record<FlavorKey, number> = {
    sweet: 0,
    sour: 0,
    bitter: 0,
    strong: 0,
    smoky: 0,
    fruity: 0,
    herbal: 0,
    creamy: 0,
  };

  const lowTrigger = 100 - MAPPING_TRAIT_THRESHOLD;

  for (const rule of FLAVOR_MAPPING_RULES) {
    const score = scores[rule.trait];
    if (score > rule.threshold) {
      for (const fw of rule.highFlavors) {
        raw[fw.flavor] += fw.weight;
      }
    } else if (score < lowTrigger) {
      for (const fw of rule.lowFlavors) {
        raw[fw.flavor] += fw.weight;
      }
    }
  }

  const values = FLAVOR_KEYS.map((k) => raw[k]);
  const max = Math.max(...values);
  const min = Math.min(...values);

  const preference: FlavorPreference = {};
  if (max === min) {
    // 全平等（含全 0）：取中性偏好，避免除零
    for (const k of FLAVOR_KEYS) preference[k] = 0.5;
  } else {
    for (const k of FLAVOR_KEYS) {
      preference[k] = (raw[k] - min) / (max - min);
    }
  }

  return preference;
}

/**
 * 构建完整人格画像 · 组合分数 / 原型 / 风味偏好 / 时间戳
 */
export function buildProfile(answers: Record<string, number>): PersonalityProfile {
  const scores = calculateScores(answers);
  const archetype = matchArchetype(scores);
  const flavorPreference = generateFlavorPreference(scores);
  return {
    scores,
    archetype,
    flavorPreference,
    createdAt: Date.now(),
  };
}
