/**
 * scentEngine · 单元测试
 * 覆盖签名气味映射、主调气味派生、扩散模式、强度、跨阶段一致性
 */

import { describe, it, expect } from 'vitest';
import { getScentProfile, getScentByVector } from './scentEngine';
import { JOURNEY_PHASE_META } from '../data/journeyMeta';
import {
  SIGNATURE_SCENTS,
  DEFAULT_SIGNATURE_SCENT,
  PHASE_PRIMARY_SCENT,
  PHASE_SCENT_DIFFUSION,
} from '../data/scentMeta';
import { VECTOR_SCENT_SPACE, DEFAULT_VECTOR_SCENT } from '../data/vectorScentMap';
import type { PersonalityProfile } from '../types/personality';
import type { JourneyState } from '../types/journey';
import type { PersonaVector } from '../types/personaFusion';

/** 构造指定阶段的旅程状态 · 独立于 journeyEngine */
function makeJourneyState(phase: keyof typeof JOURNEY_PHASE_META): JourneyState {
  const meta = JOURNEY_PHASE_META[phase];
  return { phase, meta, stimulationTier: meta.stimulationTier };
}

/** 构造指定原型 code 的画像 */
function makeProfile(code: string): PersonalityProfile {
  return {
    scores: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
    },
    archetype: {
      code,
      name: '测试者',
      tagline: 'test',
      description: 'test',
      signature: {},
      auraColor: '#7c5fbf',
    },
    flavorPreference: {
      sweet: 0.5,
      sour: 0.5,
      bitter: 0.5,
      strong: 0.5,
      smoky: 0.5,
      fruity: 0.5,
      herbal: 0.5,
      creamy: 0.5,
    },
    createdAt: Date.now(),
  };
}

const ALL_PHASES = ['opening', 'rising', 'climax', 'closing'] as const;
const TEST_CODES = Object.keys(SIGNATURE_SCENTS);

// ════════════════════════════════════════════════════════════
// 基础结构 · 字段完整性
// ════════════════════════════════════════════════════════════
describe('scentEngine · 基础结构', () => {
  it('返回完整的 ScentProfile 字段', () => {
    const scent = getScentProfile(makeProfile('The Dreamweaver'), makeJourneyState('opening'));
    expect(scent).toHaveProperty('primaryNote');
    expect(scent).toHaveProperty('signatureNote');
    expect(scent).toHaveProperty('primaryLabel');
    expect(scent).toHaveProperty('signatureLabel');
    expect(scent).toHaveProperty('signatureSymbol');
    expect(scent).toHaveProperty('intensity');
    expect(scent).toHaveProperty('diffusion');
    expect(scent).toHaveProperty('poem');
  });

  it('intensity 落在 0-1 范围', () => {
    for (const phase of ALL_PHASES) {
      const scent = getScentProfile(makeProfile('The Ember'), makeJourneyState(phase));
      expect(scent.intensity).toBeGreaterThanOrEqual(0);
      expect(scent.intensity).toBeLessThanOrEqual(1);
    }
  });
});

// ════════════════════════════════════════════════════════════
// 签名气味 · 人格原型专属
// ════════════════════════════════════════════════════════════
describe('scentEngine · 签名气味', () => {
  it('原型 code → SIGNATURE_SCENTS 映射', () => {
    for (const code of TEST_CODES) {
      const scent = getScentProfile(makeProfile(code), makeJourneyState('climax'));
      expect(scent.signatureNote).toBe(SIGNATURE_SCENTS[code].note);
      expect(scent.signatureLabel).toBe(SIGNATURE_SCENTS[code].label);
      expect(scent.signatureSymbol).toBe(SIGNATURE_SCENTS[code].symbol);
    }
  });

  it('profile=null → 签名取默认琥珀', () => {
    const scent = getScentProfile(null, makeJourneyState('opening'));
    expect(scent.signatureNote).toBe(DEFAULT_SIGNATURE_SCENT.note);
    expect(scent.signatureLabel).toBe(DEFAULT_SIGNATURE_SCENT.label);
    expect(scent.signatureSymbol).toBe(DEFAULT_SIGNATURE_SCENT.symbol);
  });

  it('未知原型 code → 签名取默认琥珀', () => {
    const scent = getScentProfile(makeProfile('Unknown'), makeJourneyState('opening'));
    expect(scent.signatureNote).toBe(DEFAULT_SIGNATURE_SCENT.note);
  });

  it('不同原型 → 不同签名气味', () => {
    const dreamweaver = getScentProfile(makeProfile('The Dreamweaver'), makeJourneyState('climax'));
    const clockmaker = getScentProfile(makeProfile('The Clockmaker'), makeJourneyState('climax'));
    expect(dreamweaver.signatureNote).not.toBe(clockmaker.signatureNote);
    expect(dreamweaver.signatureLabel).not.toBe(clockmaker.signatureLabel);
  });

  it('签名气味跨阶段不变 · 人格标识全程一致', () => {
    const code = 'The Mistwalker';
    const scents = ALL_PHASES.map((p) => getScentProfile(makeProfile(code), makeJourneyState(p)));
    const signatureNotes = scents.map((s) => s.signatureNote);
    expect(new Set(signatureNotes).size).toBe(1);
    expect(signatureNotes[0]).toBe(SIGNATURE_SCENTS[code].note);
  });
});

// ════════════════════════════════════════════════════════════
// 主调气味 · 阶段决定
// ════════════════════════════════════════════════════════════
describe('scentEngine · 主调气味', () => {
  it('opening → 白茶', () => {
    const scent = getScentProfile(null, makeJourneyState('opening'));
    expect(scent.primaryNote).toBe(PHASE_PRIMARY_SCENT.opening.note);
    expect(scent.primaryLabel).toBe('白茶');
  });

  it('rising → 柑橘', () => {
    const scent = getScentProfile(null, makeJourneyState('rising'));
    expect(scent.primaryNote).toBe(PHASE_PRIMARY_SCENT.rising.note);
    expect(scent.primaryLabel).toBe('柑橘');
  });

  it('climax → 沉香', () => {
    const scent = getScentProfile(null, makeJourneyState('climax'));
    expect(scent.primaryNote).toBe(PHASE_PRIMARY_SCENT.climax.note);
    expect(scent.primaryLabel).toBe('沉香');
  });

  it('closing → 琥珀', () => {
    const scent = getScentProfile(null, makeJourneyState('closing'));
    expect(scent.primaryNote).toBe(PHASE_PRIMARY_SCENT.closing.note);
    expect(scent.primaryLabel).toBe('琥珀');
  });

  it('四阶段产生四种不同主调', () => {
    const notes = ALL_PHASES.map((p) => getScentProfile(null, makeJourneyState(p)).primaryNote);
    expect(new Set(notes).size).toBe(4);
  });

  it('主调不受人格影响 · 仅由阶段决定', () => {
    const state = makeJourneyState('climax');
    const a = getScentProfile(makeProfile('The Dreamweaver'), state);
    const b = getScentProfile(makeProfile('The Solitude'), state);
    expect(a.primaryNote).toBe(b.primaryNote);
  });
});

// ════════════════════════════════════════════════════════════
// 扩散模式 · 阶段决定
// ════════════════════════════════════════════════════════════
describe('scentEngine · 扩散模式', () => {
  it('opening → breath', () => {
    expect(getScentProfile(null, makeJourneyState('opening')).diffusion).toBe('breath');
  });

  it('rising → spread', () => {
    expect(getScentProfile(null, makeJourneyState('rising')).diffusion).toBe('spread');
  });

  it('climax → burst', () => {
    expect(getScentProfile(null, makeJourneyState('climax')).diffusion).toBe('burst');
  });

  it('closing → fade', () => {
    expect(getScentProfile(null, makeJourneyState('closing')).diffusion).toBe('fade');
  });

  it('扩散映射与 PHASE_SCENT_DIFFUSION 一致', () => {
    for (const phase of ALL_PHASES) {
      const scent = getScentProfile(null, makeJourneyState(phase));
      expect(scent.diffusion).toBe(PHASE_SCENT_DIFFUSION[phase]);
    }
  });

  it('四阶段产生四种不同扩散模式', () => {
    const modes = ALL_PHASES.map((p) => getScentProfile(null, makeJourneyState(p)).diffusion);
    expect(new Set(modes).size).toBe(4);
  });
});

// ════════════════════════════════════════════════════════════
// 强度 · 复用阶段 energy
// ════════════════════════════════════════════════════════════
describe('scentEngine · 强度派生', () => {
  it('intensity = 阶段 energy', () => {
    for (const phase of ALL_PHASES) {
      const scent = getScentProfile(null, makeJourneyState(phase));
      expect(scent.intensity).toBe(JOURNEY_PHASE_META[phase].energy);
    }
  });

  it('climax 能量 0.9 → intensity 0.9', () => {
    expect(getScentProfile(null, makeJourneyState('climax')).intensity).toBe(0.9);
  });

  it('opening 能量 0.2 → intensity 0.2', () => {
    expect(getScentProfile(null, makeJourneyState('opening')).intensity).toBe(0.2);
  });

  it('高潮强度高于开场', () => {
    const opening = getScentProfile(null, makeJourneyState('opening'));
    const climax = getScentProfile(null, makeJourneyState('climax'));
    expect(climax.intensity).toBeGreaterThan(opening.intensity);
  });
});

// ════════════════════════════════════════════════════════════
// 诗化描述
// ════════════════════════════════════════════════════════════
describe('scentEngine · 诗化描述', () => {
  it('poem 取自阶段主调的 poem', () => {
    for (const phase of ALL_PHASES) {
      const scent = getScentProfile(null, makeJourneyState(phase));
      expect(scent.poem).toBe(PHASE_PRIMARY_SCENT[phase].poem);
    }
  });

  it('poem 非空字符串', () => {
    for (const phase of ALL_PHASES) {
      const scent = getScentProfile(null, makeJourneyState(phase));
      expect(scent.poem.length).toBeGreaterThan(0);
    }
  });
});

// ════════════════════════════════════════════════════════════
// 端到端 · 完整回路气味流转
// ════════════════════════════════════════════════════════════
describe('scentEngine · 完整回路流转', () => {
  it('四阶段主调+扩散顺序符合回路设计', () => {
    const profile = makeProfile('The Alchemist');
    const scents = ALL_PHASES.map((p) => getScentProfile(profile, makeJourneyState(p)));

    // 主调顺序：白茶 → 柑橘 → 沉香 → 琥珀
    expect(scents.map((s) => s.primaryNote)).toEqual([
      'white-tea',
      'citrus',
      'oud',
      'amber',
    ]);

    // 扩散顺序：breath → spread → burst → fade
    expect(scents.map((s) => s.diffusion)).toEqual([
      'breath',
      'spread',
      'burst',
      'fade',
    ]);
  });

  it('签名气味全程不变 · 主调随阶段切换', () => {
    const profile = makeProfile('The Navigator'); // 杜松
    const opening = getScentProfile(profile, makeJourneyState('opening'));
    const climax = getScentProfile(profile, makeJourneyState('climax'));

    // 签名不变
    expect(opening.signatureNote).toBe('juniper');
    expect(climax.signatureNote).toBe('juniper');

    // 主调切换
    expect(opening.primaryNote).toBe('white-tea');
    expect(climax.primaryNote).toBe('oud');
  });
});

// ════════════════════════════════════════════════════════════
// 新入口 · getScentByVector（向量派生）
// ════════════════════════════════════════════════════════════

function makeVec(overrides: Partial<PersonaVector> = {}): PersonaVector {
  return { TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0, ...overrides };
}

describe('scentEngine · 新入口 getScentByVector', () => {
  it('返回完整 ScentProfile 字段', () => {
    const scent = getScentByVector(makeVec({ ENT: 1 }), makeJourneyState('opening'));
    expect(scent).toHaveProperty('primaryNote');
    expect(scent).toHaveProperty('signatureNote');
    expect(scent).toHaveProperty('primaryLabel');
    expect(scent).toHaveProperty('signatureLabel');
    expect(scent).toHaveProperty('signatureSymbol');
    expect(scent).toHaveProperty('intensity');
    expect(scent).toHaveProperty('diffusion');
    expect(scent).toHaveProperty('poem');
  });

  it('全零向量 → signatureNote 为默认琥珀', () => {
    const scent = getScentByVector(makeVec(), makeJourneyState('opening'));
    expect(scent.signatureNote).toBe(DEFAULT_VECTOR_SCENT.note);
    expect(scent.signatureLabel).toBe(DEFAULT_VECTOR_SCENT.label);
    expect(scent.signatureSymbol).toBe(DEFAULT_VECTOR_SCENT.symbol);
  });

  it('ENT=1 → signatureNote 为柑橘（ENT 正倾向）', () => {
    const scent = getScentByVector(makeVec({ ENT: 1 }), makeJourneyState('climax'));
    expect(scent.signatureNote).toBe(VECTOR_SCENT_SPACE.ENT.positive.note);
    expect(scent.signatureLabel).toBe(VECTOR_SCENT_SPACE.ENT.positive.label);
  });

  it('ENT=-1 → signatureNote 为鸢尾（ENT 负倾向）', () => {
    const scent = getScentByVector(makeVec({ ENT: -1 }), makeJourneyState('opening'));
    expect(scent.signatureNote).toBe(VECTOR_SCENT_SPACE.ENT.negative.note);
  });

  it('主调气味仍由阶段决定 · 与旧入口一致', () => {
    for (const phase of ALL_PHASES) {
      const state = makeJourneyState(phase);
      const newScent = getScentByVector(makeVec({ ENT: 1 }), state);
      const oldScent = getScentProfile(null, state);
      expect(newScent.primaryNote).toBe(oldScent.primaryNote);
      expect(newScent.primaryLabel).toBe(oldScent.primaryLabel);
      expect(newScent.poem).toBe(oldScent.poem);
    }
  });

  it('强度仍由阶段 energy 决定 · 与旧入口一致', () => {
    for (const phase of ALL_PHASES) {
      const state = makeJourneyState(phase);
      const newScent = getScentByVector(makeVec({ TOL: 0.8 }), state);
      const oldScent = getScentProfile(null, state);
      expect(newScent.intensity).toBe(oldScent.intensity);
    }
  });

  it('扩散模式仍由阶段决定 · 与旧入口一致', () => {
    for (const phase of ALL_PHASES) {
      const state = makeJourneyState(phase);
      const newScent = getScentByVector(makeVec({ VIS: 1 }), state);
      const oldScent = getScentProfile(null, state);
      expect(newScent.diffusion).toBe(oldScent.diffusion);
    }
  });

  it('signatureNote 随向量变化 · 不依赖原型 code', () => {
    // 同一向量在不同阶段 → 签名气味相同
    const vec = makeVec({ LEAD: 1 });
    const opening = getScentByVector(vec, makeJourneyState('opening'));
    const climax = getScentByVector(vec, makeJourneyState('climax'));
    expect(opening.signatureNote).toBe(climax.signatureNote);
    expect(opening.signatureNote).toBe(VECTOR_SCENT_SPACE.LEAD.positive.note);
  });

  it('不同向量 → 不同签名气味（强度足够时）', () => {
    const entScent = getScentByVector(makeVec({ ENT: 1 }), makeJourneyState('climax'));
    const tolScent = getScentByVector(makeVec({ TOL: 1 }), makeJourneyState('climax'));
    expect(entScent.signatureNote).not.toBe(tolScent.signatureNote);
  });

  it('完整回路 · 四阶段主调切换 + 签名不变', () => {
    const vec = makeVec({ INF: 0.8, VIS: 0.5 });
    const scents = ALL_PHASES.map((p) => getScentByVector(vec, makeJourneyState(p)));
    // 主调顺序：白茶 → 柑橘 → 沉香 → 琥珀
    expect(scents.map((s) => s.primaryNote)).toEqual(['white-tea', 'citrus', 'oud', 'amber']);
    // 签名全程不变（INF 主导 → 迷迭香）
    const signatures = scents.map((s) => s.signatureNote);
    expect(new Set(signatures).size).toBe(1);
    expect(signatures[0]).toBe(VECTOR_SCENT_SPACE.INF.positive.note);
  });
});
