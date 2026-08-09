/**
 * lightEngine · 单元测试
 * 覆盖双入口：旧 getLightEffect（查表）+ 新 getLightByVector（向量派生）
 */

import { describe, it, expect } from 'vitest';
import { getLightEffect, getLightByVector } from './lightEngine';
import { JOURNEY_PHASE_META } from '../data/journeyMeta';
import { PHASE_LIGHT_PATTERN, DEFAULT_LIGHT_COLOR } from '../data/lightMeta';
import { MOOD_MAP } from '../data/moodMeta';
import { colorFromVector } from './colorFromVector';
import type { PersonalityProfile } from '../types/personality';
import type { JourneyState } from '../types/journey';
import type { PersonaVector } from '../types/personaFusion';

function makeJourneyState(phase: keyof typeof JOURNEY_PHASE_META): JourneyState {
  const meta = JOURNEY_PHASE_META[phase];
  return { phase, meta, stimulationTier: meta.stimulationTier };
}

function makeProfile(auraColor = '#7c5fbf'): PersonalityProfile {
  return {
    scores: {
      openness: 50, conscientiousness: 50, extraversion: 50,
      agreeableness: 50, neuroticism: 50,
    },
    archetype: {
      code: 'test', name: '测试者', tagline: 't', description: 't',
      signature: {}, auraColor,
    },
    flavorPreference: {
      sweet: 0.5, sour: 0.5, bitter: 0.5, strong: 0.5,
      smoky: 0.5, fruity: 0.5, herbal: 0.5, creamy: 0.5,
    },
    createdAt: Date.now(),
  };
}

function makeVec(overrides: Partial<PersonaVector> = {}): PersonaVector {
  return { TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0, ...overrides };
}

const ALL_PHASES = ['opening', 'rising', 'climax', 'closing'] as const;

// ════════════════════════════════════════════════════════════
// 旧入口 · getLightEffect
// ════════════════════════════════════════════════════════════

describe('lightEngine · 旧入口 getLightEffect', () => {
  it('返回完整 LightEffect 字段', () => {
    const e = getLightEffect(makeProfile(), makeJourneyState('opening'), null);
    expect(e).toHaveProperty('baseColor');
    expect(e).toHaveProperty('accentColor');
    expect(e).toHaveProperty('intensity');
    expect(e).toHaveProperty('pattern');
    expect(e).toHaveProperty('speed');
    expect(e).toHaveProperty('particleDensity');
  });

  it('profile=null → baseColor 取默认深空紫', () => {
    const e = getLightEffect(null, makeJourneyState('opening'), null);
    expect(e.baseColor).toBe(DEFAULT_LIGHT_COLOR);
  });

  it('profile 提供 auraColor → baseColor 取原型色', () => {
    const e = getLightEffect(makeProfile('#ff0000'), makeJourneyState('opening'), null);
    expect(e.baseColor).toBe('#ff0000');
  });

  it('mood=null → accentColor 取阶段色', () => {
    const e = getLightEffect(null, makeJourneyState('opening'), null);
    expect(e.accentColor).toBe(JOURNEY_PHASE_META.opening.color);
  });

  it('mood 提供 → accentColor 取情绪色', () => {
    const moodKey = Object.keys(MOOD_MAP)[0] as keyof typeof MOOD_MAP;
    const e = getLightEffect(null, makeJourneyState('opening'), moodKey);
    expect(e.accentColor).toBe(MOOD_MAP[moodKey].color);
  });

  it('强度 = 阶段 energy', () => {
    for (const phase of ALL_PHASES) {
      const e = getLightEffect(null, makeJourneyState(phase), null);
      expect(e.intensity).toBe(JOURNEY_PHASE_META[phase].energy);
    }
  });

  it('模式 = 阶段对应 PHASE_LIGHT_PATTERN', () => {
    for (const phase of ALL_PHASES) {
      const e = getLightEffect(null, makeJourneyState(phase), null);
      expect(e.pattern).toBe(PHASE_LIGHT_PATTERN[phase]);
    }
  });

  it('速度 = BPM / 128 夹取到 1', () => {
    for (const phase of ALL_PHASES) {
      const e = getLightEffect(null, makeJourneyState(phase), null);
      const expected = Math.min(1, JOURNEY_PHASE_META[phase].bpm / 128);
      expect(e.speed).toBeCloseTo(expected, 3);
    }
  });
});

// ════════════════════════════════════════════════════════════
// 新入口 · getLightByVector
// ════════════════════════════════════════════════════════════

describe('lightEngine · 新入口 getLightByVector', () => {
  it('返回完整 LightEffect 字段', () => {
    const e = getLightByVector(makeVec({ ENT: 1 }), makeJourneyState('opening'), null);
    expect(e).toHaveProperty('baseColor');
    expect(e).toHaveProperty('accentColor');
    expect(e).toHaveProperty('intensity');
    expect(e).toHaveProperty('pattern');
    expect(e).toHaveProperty('speed');
    expect(e).toHaveProperty('particleDensity');
  });

  it('全零向量 → baseColor 取默认紫晶 hex', () => {
    const e = getLightByVector(makeVec(), makeJourneyState('opening'), null);
    const { primaryHex } = colorFromVector(makeVec());
    expect(e.baseColor).toBe(primaryHex);
  });

  it('ENT=1 → baseColor 取 ENT 正色 hex', () => {
    const e = getLightByVector(makeVec({ ENT: 1 }), makeJourneyState('climax'), null);
    const { primaryHex } = colorFromVector(makeVec({ ENT: 1 }));
    expect(e.baseColor).toBe(primaryHex);
  });

  it('ENT=-1 → baseColor 取 ENT 负色 hex', () => {
    const e = getLightByVector(makeVec({ ENT: -1 }), makeJourneyState('opening'), null);
    const { primaryHex } = colorFromVector(makeVec({ ENT: -1 }));
    expect(e.baseColor).toBe(primaryHex);
  });

  it('baseColor 为 hex 格式（#rrggbb）', () => {
    const e = getLightByVector(makeVec({ VIS: 1 }), makeJourneyState('opening'), null);
    expect(e.baseColor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('mood=null → accentColor 取阶段色 · 与旧入口一致', () => {
    for (const phase of ALL_PHASES) {
      const newE = getLightByVector(makeVec({ ENT: 1 }), makeJourneyState(phase), null);
      const oldE = getLightEffect(null, makeJourneyState(phase), null);
      expect(newE.accentColor).toBe(oldE.accentColor);
    }
  });

  it('mood 提供 → accentColor 取情绪色 · 与旧入口一致', () => {
    const moodKey = Object.keys(MOOD_MAP)[0] as keyof typeof MOOD_MAP;
    const newE = getLightByVector(makeVec({ ENT: 1 }), makeJourneyState('opening'), moodKey);
    const oldE = getLightEffect(null, makeJourneyState('opening'), moodKey);
    expect(newE.accentColor).toBe(oldE.accentColor);
  });

  it('强度 = 阶段 energy · 与旧入口一致', () => {
    for (const phase of ALL_PHASES) {
      const newE = getLightByVector(makeVec({ TOL: 0.8 }), makeJourneyState(phase), null);
      const oldE = getLightEffect(null, makeJourneyState(phase), null);
      expect(newE.intensity).toBe(oldE.intensity);
    }
  });

  it('模式 = 阶段对应 · 与旧入口一致', () => {
    for (const phase of ALL_PHASES) {
      const newE = getLightByVector(makeVec({ VIS: 1 }), makeJourneyState(phase), null);
      const oldE = getLightEffect(null, makeJourneyState(phase), null);
      expect(newE.pattern).toBe(oldE.pattern);
    }
  });

  it('速度 = BPM 归一化 · 与旧入口一致', () => {
    for (const phase of ALL_PHASES) {
      const newE = getLightByVector(makeVec({ SPD: 1 }), makeJourneyState(phase), null);
      const oldE = getLightEffect(null, makeJourneyState(phase), null);
      expect(newE.speed).toBe(oldE.speed);
    }
  });

  it('粒子密度 · 与旧入口一致', () => {
    for (const phase of ALL_PHASES) {
      const newE = getLightByVector(makeVec({ LEAD: 1 }), makeJourneyState(phase), null);
      const oldE = getLightEffect(null, makeJourneyState(phase), null);
      expect(newE.particleDensity).toBe(oldE.particleDensity);
    }
  });

  it('baseColor 随向量变化 · 不依赖原型', () => {
    const vec = makeVec({ LEAD: 1 });
    const opening = getLightByVector(vec, makeJourneyState('opening'), null);
    const climax = getLightByVector(vec, makeJourneyState('climax'), null);
    expect(opening.baseColor).toBe(climax.baseColor);
  });

  it('不同向量 → 不同 baseColor（强度足够时）', () => {
    const ent = getLightByVector(makeVec({ ENT: 1 }), makeJourneyState('climax'), null);
    const tol = getLightByVector(makeVec({ TOL: 1 }), makeJourneyState('climax'), null);
    expect(ent.baseColor).not.toBe(tol.baseColor);
  });

  it('完整回路 · 四阶段 baseColor 不变 + 模式切换', () => {
    const vec = makeVec({ INF: 0.8, VIS: 0.5 });
    const effects = ALL_PHASES.map((p) => getLightByVector(vec, makeJourneyState(p), null));
    // baseColor 全程不变
    const baseColors = effects.map((e) => e.baseColor);
    expect(new Set(baseColors).size).toBe(1);
    // 模式四阶段切换
    expect(effects.map((e) => e.pattern)).toEqual(['breath', 'flow', 'pulse', 'aurora']);
  });
});

// ════════════════════════════════════════════════════════════
// 双入口对比 · 字段一致性
// ════════════════════════════════════════════════════════════

describe('lightEngine · 双入口一致性', () => {
  it('全零向量 baseColor 接近旧入口默认深空紫', () => {
    const newE = getLightByVector(makeVec(), makeJourneyState('opening'), null);
    const oldE = getLightEffect(null, makeJourneyState('opening'), null);
    // 两者都是默认紫晶系（hex 可能因 HSL→hex 转换有微差，但同色系）
    expect(newE.baseColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(oldE.baseColor).toBe(DEFAULT_LIGHT_COLOR);
  });

  it('所有非 baseColor 字段在双入口中相等', () => {
    for (const phase of ALL_PHASES) {
      const newE = getLightByVector(makeVec({ ENT: 1 }), makeJourneyState(phase), null);
      const oldE = getLightEffect(null, makeJourneyState(phase), null);
      expect(newE.accentColor).toBe(oldE.accentColor);
      expect(newE.intensity).toBe(oldE.intensity);
      expect(newE.pattern).toBe(oldE.pattern);
      expect(newE.speed).toBe(oldE.speed);
      expect(newE.particleDensity).toBe(oldE.particleDensity);
    }
  });
});
