/**
 * 光效元数据 · 杯底 LED 灯环的配色与模式映射
 *
 * 单一数据源：
 *   - 阶段 → 动画模式（breath/flow/pulse/aurora）
 *   - 默认主色（无画像时取深空紫晶，与 appStore 默认氛围一致）
 *
 * 人格主色复用 PERSONALITY_ARCHETYPES.auraColor，阶段色复用 JOURNEY_PHASE_META.color，
 * 情绪色复用 MOOD_META.color · 零数据冗余
 */

import type { JourneyPhase } from '../types/journey';
import type { LightPattern } from '../types/journey';

/**
 * 阶段 → 光效模式映射
 *
 * 呼应情绪回路四阶段：
 *   opening  · breath  · 暖色缓慢呼吸 · 夜幕初落
 *   rising   · flow    · 彩色光带流动 · 灯火渐醒
 *   climax   · pulse   · 火焰随拍脉动 · 焰心向夜
 *   closing  · aurora  · 极光缓流回归 · 余烬归寂
 */
export const PHASE_LIGHT_PATTERN: Record<JourneyPhase, LightPattern> = {
  opening: 'breath',
  rising: 'flow',
  climax: 'pulse',
  closing: 'aurora',
};

/**
 * 无画像时的默认光效主色 · 深空紫晶
 * 与 Sidebar 品牌色、appStore 默认氛围一致
 */
export const DEFAULT_LIGHT_COLOR = '#7c5fbf';

/**
 * BPM 归一化基准 · 128 BPM = speed 1.0
 * 让高潮阶段光效最快，开场最慢
 */
export const BPM_SPEED_BASE = 128;
