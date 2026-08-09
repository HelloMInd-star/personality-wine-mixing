/**
 * moodEngine · 单元测试
 * 覆盖单情绪向量、三方融合、退化分支、权重归一化
 */

import { describe, it, expect } from 'vitest';
import {
  getMoodFlavorAdjustment,
  blendWithMood,
  DEFAULT_MOOD_WEIGHTS,
} from './moodEngine';
import {
  blendWithTime,
  getTimeSlot,
  getTimeFlavorAdjustment,
  TIME_SLOTS,
} from './timeEngine';
import type { FlavorPreference } from '../types/personality';
import type { FlavorKey, MoodTag } from '../types/cocktail';

/** 构造指定小时的 Date（分秒归零） */
function atHour(hour: number): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** 全零偏好 · 边界用例 */
const ZERO_PREF: FlavorPreference = {
  sweet: 0,
  sour: 0,
  bitter: 0,
  strong: 0,
  smoky: 0,
  fruity: 0,
  herbal: 0,
  creamy: 0,
};

/** 均匀偏好 0.5 */
const UNIFORM_PREF: FlavorPreference = {
  sweet: 0.5,
  sour: 0.5,
  bitter: 0.5,
  strong: 0.5,
  smoky: 0.5,
  fruity: 0.5,
  herbal: 0.5,
  creamy: 0.5,
};

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

const ALL_MOODS: MoodTag[] = [
  'calm',
  'passion',
  'melancholy',
  'elegant',
  'rebel',
  'romantic',
  'mystery',
  'celebration',
];

// ════════════════════════════════════════════════════════════
// getMoodFlavorAdjustment · 单情绪向量
// ════════════════════════════════════════════════════════════
describe('moodEngine · getMoodFlavorAdjustment', () => {
  it('返回八维完整的风味偏好', () => {
    const adj = getMoodFlavorAdjustment('calm');
    for (const k of FLAVOR_KEYS) {
      expect(adj[k]).toBeDefined();
      expect(typeof adj[k]).toBe('number');
    }
  });

  it('所有值在 0-1 范围内', () => {
    for (const mood of ALL_MOODS) {
      const adj = getMoodFlavorAdjustment(mood);
      for (const v of Object.values(adj)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('归一化后最高维度为 1.0', () => {
    for (const mood of ALL_MOODS) {
      const adj = getMoodFlavorAdjustment(mood);
      const max = Math.max(...Object.values(adj));
      expect(max).toBeCloseTo(1.0, 1);
    }
  });

  it('calm 情绪 · herbal 为最高维（映射值 0.7）', () => {
    const adj = getMoodFlavorAdjustment('calm');
    expect(adj.herbal).toBeCloseTo(1.0, 1);
    // smoky(0.5) > creamy(0.4) → 归一化后保持序
    expect(adj.smoky).toBeGreaterThan(adj.creamy);
  });

  it('passion 情绪 · strong 为最高维', () => {
    const adj = getMoodFlavorAdjustment('passion');
    expect(adj.strong).toBeCloseTo(1.0, 1);
  });

  it('未映射的维度为 0（如 calm 的 sweet）', () => {
    const adj = getMoodFlavorAdjustment('calm');
    expect(adj.sweet).toBe(0);
    expect(adj.sour).toBe(0);
    expect(adj.bitter).toBe(0);
  });

  it('不同情绪产生不同调整向量', () => {
    const calm = getMoodFlavorAdjustment('calm');
    const passion = getMoodFlavorAdjustment('passion');
    expect(Object.values(calm).join(',')).not.toBe(
      Object.values(passion).join(','),
    );
  });
});

// ════════════════════════════════════════════════════════════
// blendWithMood · 三方融合
// ════════════════════════════════════════════════════════════
describe('moodEngine · blendWithMood', () => {
  it('mood=null · 退化为 P0-1 blendWithTime', () => {
    const slot = getTimeSlot(atHour(20));
    const expected = blendWithTime(UNIFORM_PREF, slot);
    expect(blendWithMood(UNIFORM_PREF, slot, null, 0.5)).toEqual(expected);
  });

  it('intensity=0 · 退化为 P0-1 blendWithTime', () => {
    const slot = getTimeSlot(atHour(20));
    const expected = blendWithTime(UNIFORM_PREF, slot);
    expect(blendWithMood(UNIFORM_PREF, slot, 'passion', 0)).toEqual(expected);
  });

  it('mood=null 默认参数 · 也退化', () => {
    const slot = getTimeSlot(atHour(10));
    const expected = blendWithTime(ZERO_PREF, slot);
    expect(blendWithMood(ZERO_PREF, slot, null)).toEqual(expected);
  });

  it('默认权重 · intensity=1 时三方权重和 = 1.0', () => {
    const w = DEFAULT_MOOD_WEIGHTS;
    const total = w.profile + w.time + w.mood * 1;
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('intensity=1 + 零画像 · 结果 = 时段×0.2 + 情绪×0.3（画像=0）', () => {
    const slot = getTimeSlot(atHour(20));
    const timeAdj = getTimeFlavorAdjustment(slot);
    const moodAdj = getMoodFlavorAdjustment('passion');
    const blended = blendWithMood(ZERO_PREF, slot, 'passion', 1);
    for (const k of FLAVOR_KEYS) {
      const expected =
        Math.round((timeAdj[k] * 0.2 + moodAdj[k] * 0.3) * 100) / 100;
      expect(blended[k]).toBeCloseTo(expected, 1);
    }
  });

  it('intensity 越高 · 情绪对结果影响越大', () => {
    const slot = getTimeSlot(atHour(20));
    const moodAdj = getMoodFlavorAdjustment('passion');
    const low = blendWithMood(UNIFORM_PREF, slot, 'passion', 0.2);
    const high = blendWithMood(UNIFORM_PREF, slot, 'passion', 1.0);
    // passion 最高维是 strong · 高强度应更靠近 moodAdj.strong(=1.0)
    expect(Math.abs(high.strong - moodAdj.strong)).toBeLessThanOrEqual(
      Math.abs(low.strong - moodAdj.strong),
    );
  });

  it('所有值落在 0-1 范围内', () => {
    const slot = getTimeSlot(atHour(20));
    for (const mood of ALL_MOODS) {
      const blended = blendWithMood(UNIFORM_PREF, slot, mood, 1);
      for (const v of Object.values(blended)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('不同情绪 · 产生不同融合结果（同时段同强度）', () => {
    const slot = getTimeSlot(atHour(20));
    const calm = blendWithMood(UNIFORM_PREF, slot, 'calm', 0.8);
    const passion = blendWithMood(UNIFORM_PREF, slot, 'passion', 0.8);
    expect(Object.values(calm).join(',')).not.toBe(
      Object.values(passion).join(','),
    );
  });

  it('不同时段 · 产生不同融合结果（同情绪同强度）', () => {
    const noon = blendWithMood(UNIFORM_PREF, getTimeSlot(atHour(12)), 'mystery', 0.8);
    const night = blendWithMood(UNIFORM_PREF, getTimeSlot(atHour(22)), 'mystery', 0.8);
    expect(Object.values(noon).join(',')).not.toBe(
      Object.values(night).join(','),
    );
  });

  it('自定义权重 · 生效（提高 mood 权重 → 更靠近情绪向量）', () => {
    const slot = getTimeSlot(atHour(20));
    const moodAdj = getMoodFlavorAdjustment('romantic');
    const defaultBlend = blendWithMood(UNIFORM_PREF, slot, 'romantic', 1);
    const moodHeavy = blendWithMood(UNIFORM_PREF, slot, 'romantic', 1, {
      profile: 0.2,
      time: 0.1,
      mood: 0.7,
    });
    // romantic 最高维是 sweet · mood 权重提高后更靠近 moodAdj.sweet
    expect(Math.abs(moodHeavy.sweet - moodAdj.sweet)).toBeLessThanOrEqual(
      Math.abs(defaultBlend.sweet - moodAdj.sweet),
    );
  });

  it('遍历所有时段 × 所有情绪 · 不崩溃', () => {
    for (const slot of TIME_SLOTS) {
      for (const mood of ALL_MOODS) {
        const blended = blendWithMood(UNIFORM_PREF, slot, mood, 0.7);
        expect(Object.keys(blended).length).toBe(8);
      }
    }
  });
});
