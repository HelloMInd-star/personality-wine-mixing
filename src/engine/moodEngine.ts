/**
 * moodEngine · 情绪调节引擎
 * 让用户主动选择的心境，与画像、时段共同织出此刻的推荐
 *
 * 三方融合（默认权重）：
 *   - 画像（profile）0.5 · 始终主导的基底
 *   - 时段（time）  0.2 · 被动呼吸的背景
 *   - 情绪（mood）  0.3 × intensity · 主动强调，强度可调
 *
 * 调节器关闭（mood 为空或 intensity=0）时，退化为 P0-1 的画像×0.6+时段×0.4
 * 保证「不调节 = 回到时段感知」的语义一致性
 *
 * 纯函数，无副作用，可独立测试
 */

import type { FlavorKey, MoodTag } from '../types/cocktail';
import type { FlavorPreference } from '../types/personality';
import { MOOD_FLAVOR_MAP } from '../data/moodMeta';
import {
  blendWithTime,
  getTimeFlavorAdjustment,
  type TimeSlotInfo,
} from './timeEngine';

/** 八维风味键 · 顺序固定，用于遍历 */
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

/** 三方融合权重 */
export interface MoodBlendWeights {
  /** 画像权重 · 始终主导的基底 */
  profile: number;
  /** 时段权重 · 被动呼吸的背景 */
  time: number;
  /** 情绪权重（基础值，实际乘以 intensity） */
  mood: number;
}

/** 默认融合权重 · 画像主导，时段呼吸，情绪强调 */
export const DEFAULT_MOOD_WEIGHTS: MoodBlendWeights = {
  profile: 0.5,
  time: 0.2,
  mood: 0.3,
};

/**
 * 单情绪 → 风味调整向量
 * 取 MOOD_FLAVOR_MAP 中该情绪的风味值，归一化使最高维 = 1.0
 * 归一化保证与 timeEngine.getTimeFlavorAdjustment 量级一致，融合公平
 */
export function getMoodFlavorAdjustment(mood: MoodTag): FlavorPreference {
  const flavorMap = MOOD_FLAVOR_MAP[mood];
  const accumulated: FlavorPreference = {
    sweet: 0,
    sour: 0,
    bitter: 0,
    strong: 0,
    smoky: 0,
    fruity: 0,
    herbal: 0,
    creamy: 0,
  };

  for (const key of FLAVOR_KEYS) {
    accumulated[key] = flavorMap[key] ?? 0;
  }

  // 归一化到 0-1（最高维 = 1.0），与 timeEngine 一致
  const max = Math.max(
    ...FLAVOR_KEYS.map((k) => accumulated[k]),
    0.001, // 防除零
  );
  for (const key of FLAVOR_KEYS) {
    accumulated[key] = Math.round((accumulated[key] / max) * 100) / 100;
  }

  return accumulated;
}

/**
 * 三方融合 · 画像 × 时段 × 主动情绪
 *
 * @param profilePref 人格画像风味偏好（0-1）
 * @param slot 当前时段
 * @param mood 用户主动选择的情绪 · null 表示关闭调节
 * @param intensity 情绪强度 0-1 · 0 时退化为 P0-1
 * @param weights 融合权重 · 默认 { profile:0.5, time:0.2, mood:0.3 }
 * @returns 融合后的风味偏好（0-1），四舍五入至 2 位小数
 *
 * 算法：
 *   1. 调节器关闭 → blendWithTime（P0-1 一致）
 *   2. 否则：mood 权重 × intensity，三方原始权重归一化后加权求和
 *      intensity 越高情绪越强势；让出的权重按 profile:time 原比例回填
 *
 * @example
 *   // 调节器关闭 · 回到时段感知
 *   blendWithMood(pref, slot, null)
 *   // 强度拉满的浪漫
 *   blendWithMood(pref, slot, 'romantic', 1.0)
 */
export function blendWithMood(
  profilePref: FlavorPreference,
  slot: TimeSlotInfo,
  mood: MoodTag | null,
  intensity = 0.5,
  weights: MoodBlendWeights = DEFAULT_MOOD_WEIGHTS,
): FlavorPreference {
  // 调节器关闭 · 退化为 P0-1 时段感知
  if (!mood || intensity <= 0) {
    return blendWithTime(profilePref, slot);
  }

  const timeAdj = getTimeFlavorAdjustment(slot);
  const moodAdj = getMoodFlavorAdjustment(mood);

  // 原始权重 · mood 按 intensity 缩放
  const wProfile = weights.profile;
  const wTime = weights.time;
  const wMood = weights.mood * intensity;
  const total = wProfile + wTime + wMood;

  // 归一化（intensity 让出的权重按原比例回填 profile/time）
  const nProfile = wProfile / total;
  const nTime = wTime / total;
  const nMood = wMood / total;

  const blended: FlavorPreference = {
    sweet: 0,
    sour: 0,
    bitter: 0,
    strong: 0,
    smoky: 0,
    fruity: 0,
    herbal: 0,
    creamy: 0,
  };

  for (const key of FLAVOR_KEYS) {
    const p = profilePref[key] ?? 0;
    const t = timeAdj[key] ?? 0;
    const m = moodAdj[key] ?? 0;
    blended[key] =
      Math.round((p * nProfile + t * nTime + m * nMood) * 100) / 100;
  }

  return blended;
}
