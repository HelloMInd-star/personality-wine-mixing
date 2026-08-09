/**
 * lightEngine · 杯底光效派生引擎
 *
 * 双入口并存：
 *   旧入口 · getLightEffect(profile, journeyState, mood)
 *     · 测评入口 · 通过原型 auraColor 取主色 · 兼容层
 *   新入口 · getLightByVector(vec, journeyState, mood)
 *     · 牌类入口 · 由 colorFromVector 派生主色（六维色环）
 *
 * 派生链：
 *   profile + journeyState + mood → LightEffect（旧 · 查表）
 *   PersonaVector + journeyState + mood → LightEffect（新 · 向量派生）
 *
 * 强调色、强度、模式、速度、粒子密度在两个入口中一致 · 仅 baseColor 派生方式不同
 *
 * 纯函数，无副作用，可独立测试
 * 延续 musicEngine 程序化合成的模式，零外部依赖
 */

import type { PersonalityProfile } from '../types/personality';
import type { PersonaVector } from '../types/personaFusion';
import type { MoodTag } from '../types/cocktail';
import type { JourneyState, LightEffect } from '../types/journey';
import { MOOD_MAP } from '../data/moodMeta';
import {
  PHASE_LIGHT_PATTERN,
  DEFAULT_LIGHT_COLOR,
  BPM_SPEED_BASE,
} from '../data/lightMeta';
import { colorFromVector } from './colorFromVector';

/**
 * 派生杯底光效参数 · 旧入口（兼容层）
 *
 * 通过原型 auraColor 取主色 · 测评入口使用
 *
 * @param profile 人格画像 · null 时主色取默认深空紫
 * @param journeyState 当前旅程状态（含阶段元数据：color/energy/bpm）
 * @param mood 主动情绪 · null 时强调色取阶段色
 * @returns 光效参数 · 供 LightCanvas 渲染
 *
 * @example
 *   // 开场 + 无情绪 → 月蓝呼吸
 *   getLightEffect(profile, openingState, null)
 *   // → { baseColor: '#7c5fbf', accentColor: '#7c8db5', pattern: 'breath', ... }
 *
 *   // 高潮 + 热烈 → 焰红脉动
 *   getLightEffect(profile, climaxState, 'passion')
 *   // → { baseColor: auraColor, accentColor: '#e06552', pattern: 'pulse', ... }
 */
export function getLightEffect(
  profile: PersonalityProfile | null,
  journeyState: JourneyState,
  mood: MoodTag | null,
): LightEffect {
  // 主色 · 人格原型 auraColor · 无画像取默认深空紫
  const baseColor = profile?.archetype.auraColor ?? DEFAULT_LIGHT_COLOR;

  // 强调色 · 情绪色优先（用户主动选择的心境覆盖阶段氛围），无情绪取阶段色
  const accentColor = mood ? MOOD_MAP[mood].color : journeyState.meta.color;

  // 强度 · 复用阶段 energy（opening 0.2 → climax 0.9）
  const intensity = journeyState.meta.energy;

  // 模式 · 阶段决定
  const pattern = PHASE_LIGHT_PATTERN[journeyState.phase];

  // 速度 · BPM 归一化到 0-1（128 BPM = 1.0），夹取防止超 1
  const speed = Math.min(1, journeyState.meta.bpm / BPM_SPEED_BASE);

  // 粒子密度 · 随能量派生 · 高潮烟雾感最强，开场最弱
  const particleDensity = Math.round(journeyState.meta.energy * 0.7 * 100) / 100;

  return {
    baseColor,
    accentColor,
    intensity,
    pattern,
    speed,
    particleDensity,
  };
}

/**
 * 派生杯底光效参数 · 新入口（向量派生）
 *
 * 由六维向量派生主色（六维色环）· 牌类入口使用
 * 强调色、强度、模式、速度、粒子密度与旧入口一致 · 仅 baseColor 走向量派生
 *
 * @param vec 六维人格向量 [-1, 1]
 * @param journeyState 当前旅程状态
 * @param mood 主动情绪 · null 时强调色取阶段色
 * @returns 光效参数 · 供 LightCanvas 渲染
 *
 * @example
 *   // 高 ENT → 橙红主色脉动
 *   getLightByVector({ TOL:0, SPD:0, INF:0, ENT:1, LEAD:0, VIS:0 }, climaxState, null)
 *   // → { baseColor: '#e0... ', accentColor: phaseColor, pattern: 'pulse', ... }
 *
 *   // 全零向量 → 默认深空紫晶主色
 *   getLightByVector(zeroVec, openingState, null)
 *   // → { baseColor: '#7c5fbf', ... }
 */
export function getLightByVector(
  vec: PersonaVector,
  journeyState: JourneyState,
  mood: MoodTag | null,
): LightEffect {
  // 主色 · 向量派生 · 取六维色环 Top-1 维度对应的色
  const { primaryHex } = colorFromVector(vec);
  const baseColor = primaryHex;

  // 强调色 · 情绪色优先（与旧入口一致）
  const accentColor = mood ? MOOD_MAP[mood].color : journeyState.meta.color;

  // 强度 · 复用阶段 energy
  const intensity = journeyState.meta.energy;

  // 模式 · 阶段决定
  const pattern = PHASE_LIGHT_PATTERN[journeyState.phase];

  // 速度 · BPM 归一化
  const speed = Math.min(1, journeyState.meta.bpm / BPM_SPEED_BASE);

  // 粒子密度 · 随能量派生
  const particleDensity = Math.round(journeyState.meta.energy * 0.7 * 100) / 100;

  return {
    baseColor,
    accentColor,
    intensity,
    pattern,
    speed,
    particleDensity,
  };
}
