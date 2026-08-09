/**
 * journeyEngine · 单元测试
 * 覆盖刺激程度推算、阶段解析、档位筛选、旅程化推荐、曲目选取
 */

import { describe, it, expect } from 'vitest';
import {
  getStimulationLevel,
  getStimulationTier,
  getStimulationInfo,
  resolveJourneyPhase,
  getJourneyState,
  filterByStimulationTier,
  recommendByJourney,
  getJourneyTrack,
} from './journeyEngine';
import { COCKTAILS } from '../data/cocktails';
import { JOURNEY_PHASE_META, JOURNEY_PHASE_ORDER, MUSIC_TRACKS } from '../data/journeyMeta';
import type { FlavorKey } from '../types/cocktail';
import type { PersonalityProfile } from '../types/personality';
import type { StimulationTier } from '../types/journey';

/** 构造全零风味 */
function zeroFlavor(): Record<FlavorKey, number> {
  return {
    sweet: 0,
    sour: 0,
    bitter: 0,
    strong: 0,
    smoky: 0,
    fruity: 0,
    herbal: 0,
    creamy: 0,
  };
}

/** 构造 mock 画像 · 用于 recommendByJourney */
function mockProfile(): PersonalityProfile {
  return {
    scores: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
    },
    archetype: {
      code: 'TEST',
      name: '测试原型',
      tagline: '测试',
      description: '测试用画像',
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

// ═════════════════════════════════════════════════════════
// 刺激程度推算
// ═════════════════════════════════════════════════════════

describe('getStimulationLevel · 刺激程度推算', () => {
  it('烈而苦的酒 → 高刺激（接近 1）', () => {
    const flavor = zeroFlavor();
    flavor.strong = 10;
    flavor.bitter = 10;
    flavor.smoky = 10;
    flavor.sour = 10;
    const level = getStimulationLevel(flavor);
    expect(level).toBeGreaterThan(0.9);
    expect(level).toBeLessThanOrEqual(1);
  });

  it('甜柔的酒 → 低刺激（接近 0）', () => {
    const flavor = zeroFlavor();
    flavor.sweet = 10;
    flavor.creamy = 10;
    flavor.herbal = 10;
    flavor.fruity = 10;
    const level = getStimulationLevel(flavor);
    expect(level).toBeLessThan(0.1);
    expect(level).toBeGreaterThanOrEqual(0);
  });

  it('全零风味 → level 0.4（low 档下沿）', () => {
    const level = getStimulationLevel(zeroFlavor());
    // 全零 raw=0，归一化 (0 - (-20)) / 50 = 0.4
    expect(level).toBe(0.4);
  });

  it('结果夹取在 0-1', () => {
    const flavor = zeroFlavor();
    flavor.strong = 100; // 超出 0-10 区间也应夹取
    const level = getStimulationLevel(flavor);
    expect(level).toBeGreaterThanOrEqual(0);
    expect(level).toBeLessThanOrEqual(1);
  });

  it('真实酒款 · 刺激程度为有限数', () => {
    for (const c of COCKTAILS) {
      const level = getStimulationLevel(c.flavorProfile);
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
      expect(Number.isFinite(level)).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════

describe('getStimulationTier · 档位映射', () => {
  it('< 0.45 → low', () => {
    expect(getStimulationTier(0)).toBe('low');
    expect(getStimulationTier(0.44)).toBe('low');
  });

  it('0.45 ≤ v < 0.6 → mid', () => {
    expect(getStimulationTier(0.45)).toBe('mid');
    expect(getStimulationTier(0.59)).toBe('mid');
  });

  it('≥ 0.6 → high', () => {
    expect(getStimulationTier(0.6)).toBe('high');
    expect(getStimulationTier(1)).toBe('high');
  });
});

describe('getStimulationInfo · 组合', () => {
  it('返回 level + tier', () => {
    const cocktail = COCKTAILS[0];
    const info = getStimulationInfo(cocktail);
    expect(info).toHaveProperty('level');
    expect(info).toHaveProperty('tier');
    expect(getStimulationTier(info.level)).toBe(info.tier);
  });
});

// ═════════════════════════════════════════════════════════

describe('resolveJourneyPhase · 阶段解析', () => {
  it('mood=null → opening', () => {
    expect(resolveJourneyPhase(null, 0.5)).toBe('opening');
    expect(resolveJourneyPhase(null, 0.9)).toBe('opening');
  });

  it('intensity=0 → opening', () => {
    expect(resolveJourneyPhase('passion', 0)).toBe('opening');
  });

  it('intensity<0.35 → rising', () => {
    expect(resolveJourneyPhase('passion', 0.1)).toBe('rising');
    expect(resolveJourneyPhase('calm', 0.34)).toBe('rising');
  });

  it('0.35 ≤ intensity < 0.8 → climax', () => {
    expect(resolveJourneyPhase('passion', 0.35)).toBe('climax');
    expect(resolveJourneyPhase('celebration', 0.79)).toBe('climax');
  });

  it('intensity≥0.8 + 收敛型情绪 → closing', () => {
    expect(resolveJourneyPhase('calm', 0.8)).toBe('closing');
    expect(resolveJourneyPhase('melancholy', 0.9)).toBe('closing');
    expect(resolveJourneyPhase('elegant', 1)).toBe('closing');
    expect(resolveJourneyPhase('mystery', 0.85)).toBe('closing');
  });

  it('intensity≥0.8 + 扩张型情绪 → climax（持续高潮）', () => {
    expect(resolveJourneyPhase('passion', 0.8)).toBe('climax');
    expect(resolveJourneyPhase('celebration', 0.9)).toBe('climax');
    expect(resolveJourneyPhase('rebel', 1)).toBe('climax');
    expect(resolveJourneyPhase('romantic', 0.85)).toBe('climax');
  });
});

describe('getJourneyState · 完整状态', () => {
  it('返回阶段 + 元数据 + 刺激档位', () => {
    const state = getJourneyState(null, 0);
    expect(state.phase).toBe('opening');
    expect(state.meta).toBe(JOURNEY_PHASE_META.opening);
    expect(state.stimulationTier).toBe(JOURNEY_PHASE_META.opening.stimulationTier);
  });

  it('阶段元数据与档位一致', () => {
    for (const phase of JOURNEY_PHASE_ORDER) {
      const meta = JOURNEY_PHASE_META[phase];
      // 用对应阶段的边界强度构造（opening 用 null，其他用扩张型情绪）
      const mood = phase === 'opening' ? null : 'passion';
      const intensity =
        phase === 'opening' ? 0 : phase === 'rising' ? 0.2 : phase === 'climax' ? 0.5 : 0.9;
      // closing 需收敛型
      const actualMood = phase === 'closing' ? 'calm' : mood;
      const state = getJourneyState(actualMood, intensity);
      expect(state.stimulationTier).toBe(meta.stimulationTier);
    }
  });
});

// ═════════════════════════════════════════════════════════

describe('filterByStimulationTier · 档位筛选', () => {
  it('low 档位 · 筛出所有低刺激酒', () => {
    const filtered = filterByStimulationTier(COCKTAILS, 'low');
    for (const c of filtered) {
      expect(getStimulationTier(getStimulationLevel(c.flavorProfile))).toBe('low');
    }
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('保留原数组不变异', () => {
    const before = COCKTAILS.length;
    filterByStimulationTier(COCKTAILS, 'high');
    expect(COCKTAILS.length).toBe(before);
  });

  it('每档位至少有一款酒 · 保证旅程可编排', () => {
    const tiers: StimulationTier[] = ['low', 'mid', 'high'];
    for (const tier of tiers) {
      const filtered = filterByStimulationTier(COCKTAILS, tier);
      expect(filtered.length).toBeGreaterThan(0);
    }
  });
});

// ═════════════════════════════════════════════════════════

describe('recommendByJourney · 旅程化推荐', () => {
  const profile = mockProfile();

  it('返回带 phase/stimulation/track 的推荐', () => {
    const recs = recommendByJourney(profile, 'passion', 0.5, new Date(), 3);
    expect(recs.length).toBe(3);
    for (const rec of recs) {
      expect(rec).toHaveProperty('phase');
      expect(rec).toHaveProperty('stimulation');
      expect(rec).toHaveProperty('track');
      expect(rec.phase).toBe('climax');
      expect(rec.stimulation).toHaveProperty('level');
      expect(rec.stimulation).toHaveProperty('tier');
      expect(rec.track).toHaveProperty('id');
      expect(rec.track).toHaveProperty('bpm');
    }
  });

  it('调节器关闭（mood=null）→ opening 阶段', () => {
    const recs = recommendByJourney(profile, null, 0, new Date(), 3);
    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      expect(rec.phase).toBe('opening');
    }
  });

  it('climax 阶段 · 命中 high 档位的酒优先排前', () => {
    const recs = recommendByJourney(profile, 'passion', 0.6, new Date(), 5);
    expect(recs[0].phase).toBe('climax');
    // 高潮阶段期望 high 档位，首位应为 high（若存在）
    const hasHigh = recs.some((r) => r.stimulation.tier === 'high');
    if (hasHigh) {
      expect(recs[0].stimulation.tier).toBe('high');
    }
  });

  it('closing 阶段 · 收敛型高强度触发回路收尾', () => {
    const recs = recommendByJourney(profile, 'calm', 0.9, new Date(), 3);
    for (const rec of recs) {
      expect(rec.phase).toBe('closing');
    }
  });

  it('limit 控制返回条数', () => {
    const recs5 = recommendByJourney(profile, 'passion', 0.5, new Date(), 5);
    const recs2 = recommendByJourney(profile, 'passion', 0.5, new Date(), 2);
    expect(recs5.length).toBe(5);
    expect(recs2.length).toBe(2);
  });

  it('track 与阶段一致', () => {
    const recs = recommendByJourney(profile, 'passion', 0.2, new Date(), 3);
    for (const rec of recs) {
      expect(rec.track.phase).toBe(rec.phase);
    }
  });
});

// ═════════════════════════════════════════════════════════

describe('getJourneyTrack · 曲目选取', () => {
  it('opening 阶段 · 返回 opening 曲目', () => {
    const track = getJourneyTrack(null, 0);
    expect(track.phase).toBe('opening');
  });

  it('climax 阶段 · 返回 climax 曲目', () => {
    const track = getJourneyTrack('passion', 0.6);
    expect(track.phase).toBe('climax');
  });

  it('closing 阶段 · 返回 closing 曲目', () => {
    const track = getJourneyTrack('calm', 0.9);
    expect(track.phase).toBe('closing');
  });

  it('情绪亲和匹配 · passion 在 climax 命中 passion 亲和曲目', () => {
    const track = getJourneyTrack('passion', 0.6);
    expect(track.moodAffinity).toContain('passion');
  });

  it('无情绪时回退该阶段首曲', () => {
    const track = getJourneyTrack(null, 0);
    const openingTracks = MUSIC_TRACKS.filter((t) => t.phase === 'opening');
    expect(openingTracks).toContain(track);
  });
});

// ═════════════════════════════════════════════════════════

describe('JOURNEY_PHASE_META · 阶段元数据完整性', () => {
  it('四阶段顺序固定 · 开场→上升→高潮→收尾', () => {
    expect(JOURNEY_PHASE_ORDER).toEqual([
      'opening',
      'rising',
      'climax',
      'closing',
    ]);
  });

  it('每阶段元数据字段完整', () => {
    for (const phase of JOURNEY_PHASE_ORDER) {
      const meta = JOURNEY_PHASE_META[phase];
      expect(meta.phase).toBe(phase);
      expect(meta.label).toBeTruthy();
      expect(meta.poem).toBeTruthy();
      expect(meta.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(meta.symbol).toBeTruthy();
      expect(['low', 'mid', 'high']).toContain(meta.stimulationTier);
      expect(meta.bpm).toBeGreaterThan(0);
      expect(meta.energy).toBeGreaterThanOrEqual(0);
      expect(meta.energy).toBeLessThanOrEqual(1);
      expect(meta.musicStyle).toBeTruthy();
    }
  });

  it('BPM 与能量随阶段递进', () => {
    const o = JOURNEY_PHASE_META.opening;
    const r = JOURNEY_PHASE_META.rising;
    const c = JOURNEY_PHASE_META.climax;
    expect(r.bpm).toBeGreaterThan(o.bpm);
    expect(c.bpm).toBeGreaterThan(r.bpm);
    expect(c.energy).toBeGreaterThan(r.energy);
    expect(r.energy).toBeGreaterThan(o.energy);
  });

  it('开场与收尾同为低刺激 · 形成回路闭环', () => {
    expect(JOURNEY_PHASE_META.opening.stimulationTier).toBe('low');
    expect(JOURNEY_PHASE_META.closing.stimulationTier).toBe('low');
  });
});
