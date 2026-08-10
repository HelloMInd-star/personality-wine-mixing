/**
 * 单人酒局沙盘引擎 · SandboxEngine
 *
 * 核心逻辑：场景选择 → 五轮推理 → MBTI 概率分布 → 桥接 Y.Mine 六维向量
 *
 * 算法链路：
 *   八维分数累加 → 四维度百分比 → MBTI 类型推导
 *   → 16 型概率分布（维度比例相乘 + 归一化）
 *   → 桥接 mbtiToBaseVector → 6D PersonaVector
 *
 * 纯函数，无副作用，无外部依赖
 */

import { logger } from './logger';
import {
  SANDBOX_SCENARIOS,
  SANDBOX_CHARACTERS,
  SANDBOX_ROUNDS,
  ROUND_OPTIONS,
  MBTI_TRAIT_WEIGHTS,
  JUDGE_COMMENTS,
  JUDGE_META,
  DIM_PAIRS,
} from '../data/sandboxData';
import { mbtiToBaseVector, derivePersonaTag } from './personaFusionEngine';
import type {
  SandboxScenario,
  SandboxCharacter,
  RoundChoice,
  RoundWithOptions,
  SandboxResult,
  SandboxJudgeComment,
  TraitScores,
  DimensionMap,
  MbtiDim,
} from '../types/sandbox';
import type { PersonaVector } from '../types/personaFusion';

// ═════════════════════════════════════════════════════════
// 八维初始分数
// ═════════════════════════════════════════════════════════

const INITIAL_SCORES: TraitScores = {
  E: 50, I: 50,
  S: 50, N: 50,
  T: 50, F: 50,
  J: 50, P: 50,
};

// ═════════════════════════════════════════════════════════
// 沙盘引擎
// ═════════════════════════════════════════════════════════

/**
 * 获取随机场景
 */
export function getRandomScenario(excludeIds: string[] = []): SandboxScenario {
  const available = SANDBOX_SCENARIOS.filter((s) => !excludeIds.includes(s.id));
  const pool = available.length > 0 ? available : SANDBOX_SCENARIOS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 获取随机角色（4 个）
 */
export function getRandomCharacters(count = 4): SandboxCharacter[] {
  const shuffled = [...SANDBOX_CHARACTERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * 获取某一轮配置 + 选项
 */
export function getRoundConfig(roundNum: number): RoundWithOptions | null {
  const round = SANDBOX_ROUNDS.find((r) => r.round === roundNum);
  if (!round) return null;
  const options = ROUND_OPTIONS[roundNum] || [];
  return { round, options };
}

/**
 * 获取所有轮次
 */
export function getAllRounds(): RoundWithOptions[] {
  return SANDBOX_ROUNDS.map((r) => ({
    round: r,
    options: ROUND_OPTIONS[r.round] || [],
  }));
}

/**
 * 获取总轮数
 */
export function getTotalRounds(): number {
  return SANDBOX_ROUNDS.length;
}

// ═════════════════════════════════════════════════════════
// 核心算法：人格图谱计算
// ═════════════════════════════════════════════════════════

/**
 * 根据用户五轮选择计算 MBTI 人格图谱
 *
 * 算法步骤：
 *   1. 初始化八维分数（各 50）
 *   2. 累加每轮选项的 trait 加减分
 *   3. 计算四维度百分比（E/I, S/N, T/F, J/P）
 *   4. 推导 MBTI 类型（取每维度主导倾向）
 *   5. 计算 16 型概率分布（维度比例相乘 + 归一化）
 *
 * @param choices 用户五轮选择
 * @returns 完整人格图谱（dimensions + scores + mbtiType + probabilities）
 */
export function calculatePersonality(choices: RoundChoice[]): SandboxResult {
  logger.info('Sandbox:calculatePersonality', { choices: choices.length });

  // 1. 初始化分数
  const scores: TraitScores = { ...INITIAL_SCORES };
  const choiceDescriptions = [];

  // 2. 累加每轮选择
  for (const choice of choices) {
    const { round, optionKey } = choice;
    const options = ROUND_OPTIONS[round] || [];
    const selected = options.find((o) => o.key === optionKey);

    if (selected) {
      choiceDescriptions.push({
        round,
        title: SANDBOX_ROUNDS.find((r) => r.round === round)?.title,
        text: selected.text,
      });

      if (selected.traits) {
        for (const [trait, value] of Object.entries(selected.traits)) {
          if (scores[trait] !== undefined) {
            scores[trait] += (value as number);
          }
        }
      }
    }
  }

  // 3. 计算四维度百分比
  const dimensions: DimensionMap = {
    'E/I': calcDimensionPercent(scores.E, scores.I),
    'S/N': calcDimensionPercent(scores.S, scores.N),
    'T/F': calcDimensionPercent(scores.T, scores.F),
    'J/P': calcDimensionPercent(scores.J, scores.P),
  };

  // 4. 推导 MBTI 类型
  const mbtiType = calcMbtiType(dimensions);

  // 5. 计算 16 型概率分布
  const probabilities = calcMbtiProbabilities(scores);

  logger.info('Sandbox:calculatePersonality:done', { mbtiType, topProb: probabilities[0] });

  return {
    dimensions,
    scores,
    mbtiType,
    probabilities,
    choiceDescriptions,
    calculatedAt: Date.now(),
  };
}

// ═════════════════════════════════════════════════════════
// 子算法
// ═════════════════════════════════════════════════════════

/**
 * 计算单维度百分比
 *
 * @param a 第一个倾向分数（如 E）
 * @param b 第二个倾向分数（如 I）
 * @returns percentA（a 占比）、percentB（b 占比）、dominant
 */
function calcDimensionPercent(a: number, b: number): DimensionMap[MbtiDim] {
  const total = Math.max(1, a + b);
  const percentA = Math.round((a / total) * 100);
  const percentB = 100 - percentA;
  const dominant: 'A' | 'B' = a >= b ? 'A' : 'B';
  return { percentA, percentB, dominant };
}

/**
 * 从四维度百分比推导 MBTI 类型
 */
function calcMbtiType(dimensions: DimensionMap): string {
  const ei = dimensions['E/I'].dominant === 'A' ? 'E' : 'I';
  const sn = dimensions['S/N'].dominant === 'A' ? 'S' : 'N';
  const tf = dimensions['T/F'].dominant === 'A' ? 'T' : 'F';
  const jp = dimensions['J/P'].dominant === 'A' ? 'J' : 'P';
  return ei + sn + tf + jp;
}

/**
 * 计算 16 型 MBTI 概率分布
 *
 * 算法原理：
 *   对每个 MBTI 类型，将其四维度偏好与用户八维分数做维度比例相乘。
 *   例如用户 E/I 分数为 60/40，INTJ 偏好 I → 该维度命中率 = 40/100 = 0.4
 *   四维度命中率相乘 → 原始匹配度 → 全局归一化 → 概率分布
 *
 * 这种乘性算法比加性算法更能放大维度差异，使概率分布更分散。
 *
 * @param scores 八维分数
 * @returns 16 型概率分布（降序，总和 = 100%）
 */
export function calcMbtiProbabilities(scores: TraitScores): { type: string; probability: number }[] {
  const results = Object.entries(MBTI_TRAIT_WEIGHTS).map(([type, traits]) => {
    let matchScore = 1;

    for (const [a, b] of DIM_PAIRS) {
      const total = (scores[a] || 50) + (scores[b] || 50);
      if (total <= 0) continue;

      // 如果该类型偏好 a（如 INTJ 偏好 I），命中率 = scores[a] / total
      if (traits[a] !== undefined) {
        matchScore *= (scores[a] || 50) / total;
      } else if (traits[b] !== undefined) {
        matchScore *= (scores[b] || 50) / total;
      }
    }

    return { type, score: matchScore };
  });

  // 归一化 → 概率分布
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const probabilities = results.map((r) => ({
    type: r.type,
    probability: totalScore > 0 ? Math.round((r.score / totalScore) * 100) : 6,
  }));

  // 降序排列
  probabilities.sort((a, b) => b.probability - a.probability);

  // 修正四舍五入误差，确保总和 = 100%
  const probSum = probabilities.reduce((sum, p) => sum + p.probability, 0);
  if (probSum !== 100 && probabilities.length > 0) {
    probabilities[0].probability += 100 - probSum;
  }

  return probabilities;
}

// ═════════════════════════════════════════════════════════
// 桥接：沙盘结果 → Y.Mine 六维向量
// ═════════════════════════════════════════════════════════

/**
 * 沙盘结果 → 六维人格向量
 *
 * 桥接路径：
 *   SandboxResult.mbtiType → mbtiToBaseVector() → PersonaVector
 *
 * 六维向量可直接喂给 Y.Mine 的推荐引擎：
 *   - cocktailEngine（调酒推荐）
 *   - scentEngine（气味定制）
 *   - cocktailStoryEngine（故事生成）
 *   - lightEngine（光效）
 *   - musicEngine（音乐）
 */
export function sandboxToVector(result: SandboxResult): PersonaVector {
  logger.info('Sandbox:toVector', { mbti: result.mbtiType });
  return mbtiToBaseVector(result.mbtiType);
}

/**
 * 沙盘结果 → 人格标签
 */
export function sandboxToPersonaTag(result: SandboxResult): string {
  return derivePersonaTag(sandboxToVector(result));
}

// ═════════════════════════════════════════════════════════
// 调酒师评语
// ═════════════════════════════════════════════════════════

/**
 * 生成 3 位调酒师评语
 */
export function getJudgeComments(): SandboxJudgeComment[] {
  return JUDGE_META.map((judge) => {
    const comments = JUDGE_COMMENTS[judge.key] || [];
    const comment = comments[Math.floor(Math.random() * comments.length)];

    return {
      key: judge.key,
      name: judge.name,
      icon: judge.icon,
      color: judge.color,
      personality: judge.personality,
      comment,
    };
  });
}