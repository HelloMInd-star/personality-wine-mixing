/**
 * musicProfileEngine · 单元测试
 *
 * 覆盖：
 *   1. 六维向量 → 音乐偏好画像（边界值、中性、极端）
 *   2. 子映射函数（曲风、BPM、情绪、年代、特质）
 *   3. 画像结构完整性
 *   4. 16 型全量生成验证
 *   5. mergeMusicProfileToVector 加权融合
 */

import { describe, it, expect } from 'vitest';
import {
  vectorToMusicProfile,
  mbtiToMusicProfile,
  generateAllMbtiProfiles,
  getTopGenres,
  getTopEmotion,
  getBpmTier,
  mergeMusicProfileToVector,
  GENRE_META,
  EMOTION_META,
} from './musicProfileEngine';
import type { MusicGenre, MusicEmotion } from './musicProfileEngine';
import type { PersonaVector } from '../types/personaFusion';

// ═════════════════════════════════════════════════════════
// 工具
// ═════════════════════════════════════════════════════════

function makeVec(overrides: Partial<PersonaVector> = {}): PersonaVector {
  return {
    TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0,
    ...overrides,
  };
}

const VALID_GENRES = Object.keys(GENRE_META) as MusicGenre[];
const VALID_EMOTIONS = Object.keys(EMOTION_META) as MusicEmotion[];
// ═════════════════════════════════════════════════════════
// 基础结构
// ═════════════════════════════════════════════════════════

describe('musicProfileEngine · 基础结构', () => {
  it('返回完整字段', () => {
    const profile = vectorToMusicProfile(makeVec());
    expect(profile).toHaveProperty('source');
    expect(profile).toHaveProperty('generatedAt');
    expect(profile).toHaveProperty('sourceVector');
    expect(profile).toHaveProperty('genreDistribution');
    expect(profile).toHaveProperty('bpmDistribution');
    expect(profile).toHaveProperty('emotionDistribution');
    expect(profile).toHaveProperty('eraDistribution');
    expect(profile).toHaveProperty('computedTraits');
    expect(profile).toHaveProperty('summary');
    expect(profile).toHaveProperty('topGenres');
    expect(profile).toHaveProperty('bpmRange');
    expect(profile).toHaveProperty('topEmotion');
  });

  it('source 为 persona', () => {
    expect(vectorToMusicProfile(makeVec()).source).toBe('persona');
  });

  it('sourceVector 是输入向量的副本', () => {
    const input = makeVec({ ENT: 0.8 });
    const profile = vectorToMusicProfile(input);
    expect(profile.sourceVector).toEqual(input);
    expect(profile.sourceVector).not.toBe(input);
  });

  it('曲风分布归一化 · 总和≈1', () => {
    const profile = vectorToMusicProfile(makeVec());
    const sum = Object.values(profile.genreDistribution).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 1);
  });

  it('所有曲风都在有效范围内', () => {
    const profile = vectorToMusicProfile(makeVec());
    for (const [genre, weight] of Object.entries(profile.genreDistribution)) {
      expect(VALID_GENRES).toContain(genre as MusicGenre);
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThanOrEqual(1);
    }
  });

  it('BPM 分布归一化 · 总和≈1', () => {
    const profile = vectorToMusicProfile(makeVec());
    const sum = Object.values(profile.bpmDistribution).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 1);
  });

  it('情绪分布归一化 · 总和≈1', () => {
    const profile = vectorToMusicProfile(makeVec());
    const sum = Object.values(profile.emotionDistribution).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 1);
  });

  it('年代分布归一化 · 总和≈1', () => {
    const profile = vectorToMusicProfile(makeVec());
    const sum = Object.values(profile.eraDistribution).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 1);
  });

  it('computedTraits 所有值在 [0, 1]', () => {
    const profile = vectorToMusicProfile(makeVec());
    const traits = profile.computedTraits;
    for (const [key, val] of Object.entries(traits)) {
      expect(val, `${key} 应在 [0,1]`).toBeGreaterThanOrEqual(0);
      expect(val, `${key} 应在 [0,1]`).toBeLessThanOrEqual(1);
    }
  });

  it('summary 包含完整字段', () => {
    const profile = vectorToMusicProfile(makeVec());
    const s = profile.summary;
    expect(s.dominantGenre.length).toBeGreaterThan(0);
    expect(s.dominantEmotion.length).toBeGreaterThan(0);
    expect(s.bpmTier.length).toBeGreaterThan(0);
    expect(s.oneLiner.length).toBeGreaterThan(10);
  });

  it('topGenres 包含 3 个曲风', () => {
    const profile = vectorToMusicProfile(makeVec());
    expect(profile.topGenres).toHaveLength(3);
  });
});

// ═════════════════════════════════════════════════════════
// 边界值
// ═════════════════════════════════════════════════════════

describe('musicProfileEngine · 边界值', () => {
  it('全零向量 → 中性画像', () => {
    const profile = vectorToMusicProfile(makeVec());
    // 中性时所有曲风权重接近
    const weights = Object.values(profile.genreDistribution);
    const maxDiff = Math.max(...weights) - Math.min(...weights);
    expect(maxDiff).toBeLessThan(0.5); // 不超过 0.5 差异
  });

  it('全 +1 向量 → 高能量、开放、前沿', () => {
    const profile = vectorToMusicProfile(makeVec({ TOL: 1, SPD: 1, INF: 1, ENT: 1, LEAD: 1, VIS: 1 }));
    expect(profile.computedTraits.energyLevel).toBeGreaterThan(0.7);
    expect(profile.computedTraits.innovationAcceptance).toBeGreaterThan(0.5);
    expect(profile.bpmDistribution.very_fast).toBeGreaterThan(0.3);
  });

  it('全 -1 向量 → 低能量、保守、经典', () => {
    const profile = vectorToMusicProfile(makeVec({ TOL: -1, SPD: -1, INF: -1, ENT: -1, LEAD: -1, VIS: -1 }));
    expect(profile.computedTraits.energyLevel).toBeLessThan(0.3);
    expect(profile.computedTraits.nostalgia).toBeLessThan(0.3);
    expect(profile.bpmDistribution.slow).toBeGreaterThan(0.3);
  });

  it('SPD 极高 → very_fast BPM 档位', () => {
    const profile = vectorToMusicProfile(makeVec({ SPD: 1 }));
    expect(profile.bpmDistribution.very_fast).toBeGreaterThan(profile.bpmDistribution.slow);
  });

  it('SPD 极低 → slow BPM 档位', () => {
    const profile = vectorToMusicProfile(makeVec({ SPD: -1 }));
    expect(profile.bpmDistribution.slow).toBeGreaterThan(profile.bpmDistribution.very_fast);
  });

  it('ENT 极高 → 高能量情绪主导', () => {
    const profile = vectorToMusicProfile(makeVec({ ENT: 1 }));
    expect(profile.computedTraits.energyLevel).toBeGreaterThan(0.7);
    const topEmotion = profile.topEmotion;
    expect(EMOTION_META[topEmotion].energy).toBeGreaterThan(0.5);
  });

  it('TOL 极高 → 高曲风开放性', () => {
    const profile = vectorToMusicProfile(makeVec({ TOL: 1 }));
    expect(profile.computedTraits.genreOpenness).toBeGreaterThan(0.5);
  });
});

// ═════════════════════════════════════════════════════════
// 子映射函数
// ═════════════════════════════════════════════════════════

describe('musicProfileEngine · 子映射', () => {
  describe('BPM 档位', () => {
    it('SPD > 0.31 → fast', () => {
      expect(getBpmTier(0.32)).toBe('fast');
      expect(getBpmTier(0.5)).toBe('fast');
    });

    it('SPD > 0.54 → very_fast', () => {
      expect(getBpmTier(0.55)).toBe('very_fast');
      expect(getBpmTier(1)).toBe('very_fast');
    });

    it('SPD < -0.08 → medium', () => {
      expect(getBpmTier(-0.1)).toBe('medium');
    });

    it('SPD < -0.69 → slow', () => {
      expect(getBpmTier(-0.7)).toBe('slow');
      expect(getBpmTier(-1)).toBe('slow');
    });
  });

  describe('topGenres', () => {
    it('返回 3 个有效曲风', () => {
      const profile = vectorToMusicProfile(makeVec({ TOL: 0.5, ENT: 0.8 }));
      const genres = getTopGenres(profile.genreDistribution);
      expect(genres).toHaveLength(3);
      for (const g of genres) {
        expect(VALID_GENRES).toContain(g);
      }
    });

    it('可以自定义数量', () => {
      const profile = vectorToMusicProfile(makeVec());
      expect(getTopGenres(profile.genreDistribution, 5)).toHaveLength(5);
      expect(getTopGenres(profile.genreDistribution, 1)).toHaveLength(1);
    });
  });

  describe('topEmotion', () => {
    it('返回有效情绪', () => {
      const profile = vectorToMusicProfile(makeVec({ ENT: 0.8 }));
      expect(VALID_EMOTIONS).toContain(getTopEmotion(profile.emotionDistribution));
    });
  });
});

// ═════════════════════════════════════════════════════════
// 16 型差异化
// ═════════════════════════════════════════════════════════

describe('musicProfileEngine · 16 型差异化', () => {
  const all = generateAllMbtiProfiles();

  it('16 型全部可生成', () => {
    expect(Object.keys(all)).toHaveLength(16);
  });

  it('曲风分布存在差异 · 不是全部相同', () => {
    const signatures = new Set(
      Object.values(all).map((p) => getTopGenres(p.genreDistribution, 1)[0]),
    );
    expect(signatures.size).toBeGreaterThanOrEqual(2); // 至少有 2 种不同首选曲风
  });

  it('BPM 档位存在差异', () => {
    const tiers = new Set(Object.values(all).map((p) => getBpmTier(p.sourceVector.SPD)));
    expect(tiers.size).toBeGreaterThanOrEqual(2);
  });

  it('情绪分布存在差异', () => {
    const emotions = new Set(Object.values(all).map((p) => p.topEmotion));
    expect(emotions.size).toBeGreaterThanOrEqual(2);
  });

  it('oneLiner 不全部相同', () => {
    const liners = new Set(Object.values(all).map((p) => p.summary.oneLiner));
    expect(liners.size).toBeGreaterThan(1);
  });

  it('每种 MBTI 的 sourceVector 维度值在 [-1, 1]', () => {
    for (const [mbti, profile] of Object.entries(all)) {
      const v = profile.sourceVector;
      for (const dim of ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'] as const) {
        expect(v[dim], `${mbti}.${dim} 应在 [-1,1]`).toBeGreaterThanOrEqual(-1);
        expect(v[dim], `${mbti}.${dim} 应在 [-1,1]`).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ═════════════════════════════════════════════════════════
// 加权融合
// ═════════════════════════════════════════════════════════

describe('musicProfileEngine · 加权融合', () => {
  it('musicWeight=0 时向量不变', () => {
    const v = makeVec({ TOL: 0.5, SPD: 0.3, INF: 0.8, ENT: 0.2, LEAD: 0.6, VIS: -0.4 });
    const profile = vectorToMusicProfile(v);
    const merged = mergeMusicProfileToVector(v, profile, 0);
    for (const dim of ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'] as const) {
      expect(merged[dim]).toBeCloseTo(v[dim], 5);
    }
  });

  it('musicWeight=1 时向量完全由音乐画像决定', () => {
    const v = makeVec({ TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0 });
    const profile = {
      ...vectorToMusicProfile(makeVec({ ENT: 1, SPD: 1 })),
      sourceVector: makeVec({ ENT: 1, SPD: 1 }),
    };
    const merged = mergeMusicProfileToVector(v, profile, 1);
    expect(merged.ENT).toBeGreaterThan(0.5); // 高能量 → ENT 高
    expect(merged.SPD).toBeGreaterThan(0.3); // 高 BPM → SPD 高
  });

  it('默认权重 0.2 时混合合理', () => {
    const v = makeVec({ TOL: 0.5, SPD: 0.3, INF: 0.8, ENT: 0.2, LEAD: 0.6, VIS: -0.4 });
    const profile = vectorToMusicProfile(v);
    const merged = mergeMusicProfileToVector(v, profile);
    for (const dim of ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'] as const) {
      expect(merged[dim]).toBeGreaterThanOrEqual(-1);
      expect(merged[dim]).toBeLessThanOrEqual(1);
    }
  });
});

// ═════════════════════════════════════════════════════════
// 一致性
// ═════════════════════════════════════════════════════════

describe('musicProfileEngine · 一致性', () => {
  it('相同输入 → 相同输出（幂等）', () => {
    const v = makeVec({ TOL: 0.5, SPD: -0.3, INF: 0.8, ENT: 0.2, LEAD: 0.6, VIS: -0.4 });
    const a = vectorToMusicProfile(v);
    const b = vectorToMusicProfile(v);
    expect(a).toEqual(b);
  });

  it('输入向量不被修改', () => {
    const v = makeVec({ ENT: 0.7, VIS: 0.3 });
    const snapshot = { ...v };
    vectorToMusicProfile(v);
    expect(v).toEqual(snapshot);
  });

  it('mbtiToMusicProfile 与 vectorToMusicProfile 路径一致', () => {
    const viaMbti = mbtiToMusicProfile('ENFP');
    const viaVector = vectorToMusicProfile(viaMbti.sourceVector);
    expect(viaMbti.topGenres).toEqual(viaVector.topGenres);
    expect(viaMbti.topEmotion).toBe(viaVector.topEmotion);
  });
});

// ═════════════════════════════════════════════════════════
// 典型场景验证
// ═════════════════════════════════════════════════════════

describe('musicProfileEngine · 典型场景', () => {
  it('高容错 + 高速度 → 偏好电子/摇滚，高 BPM', () => {
    const profile = vectorToMusicProfile(makeVec({ TOL: 0.8, SPD: 0.8, ENT: 0.7 }));
    const topGenres = getTopGenres(profile.genreDistribution, 3);
    // 高容错+高速度应偏好高能量曲风
    const highEnergyGenres: MusicGenre[] = ['electronic', 'rock', 'metal', 'hiphop'];
    const hasHighEnergy = topGenres.some((g) => highEnergyGenres.includes(g));
    expect(hasHighEnergy).toBe(true);
    expect(profile.computedTraits.bpmPreference).toBeGreaterThan(0.5);
  });

  it('低容错 + 低速度 → 偏好古典/氛围，低 BPM', () => {
    const profile = vectorToMusicProfile(makeVec({ TOL: -0.8, SPD: -0.8, ENT: -0.5 }));
    expect(profile.computedTraits.bpmPreference).toBeLessThan(0.5);
    expect(profile.computedTraits.energyLevel).toBeLessThan(0.5);
    // 低容错应偏好保守曲风（古典/民谣/氛围权重大）
    const classicalWeight = profile.genreDistribution.classical ?? 0;
    const folkWeight = profile.genreDistribution.folk ?? 0;
    const ambientWeight = profile.genreDistribution.ambient ?? 0;
    const metalWeight = profile.genreDistribution.metal ?? 0;
    expect(classicalWeight + folkWeight + ambientWeight).toBeGreaterThan(metalWeight);
  });

  it('高直觉 + 高热情 → 梦幻/浪漫情绪', () => {
    const profile = vectorToMusicProfile(makeVec({ VIS: 0.9, ENT: 0.8 }));
    const dreamyEmotions: MusicEmotion[] = ['dreamy', 'romantic', 'joyful', 'energetic'];
    expect(dreamyEmotions).toContain(profile.topEmotion);
  });
});