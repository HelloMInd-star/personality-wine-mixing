/**
 * personaMusicEngine · 单元测试
 *
 * 覆盖：
 *   1. 六维向量 → 音乐参数映射（边界值、中性、极端）
 *   2. MBTI → 音乐参数快捷路径
 *   3. 16 型全量生成验证
 *   4. 子映射函数（timbre、rootFreq、genre、description）
 *   5. toSynthParams 格式兼容性
 */

import { describe, it, expect } from 'vitest';
import {
  vectorToMusicParams,
  mbtiToMusicParams,
  generateAllMbtiMusicParams,
  getRootNote,
  toSynthParams,
} from './personaMusicEngine';
import type { OscillatorType, MusicalScale, GenreTag } from './personaMusicEngine';
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

const VALID_TIMBRES: OscillatorType[] = ['sine', 'triangle', 'sawtooth', 'square'];
const VALID_SCALES: MusicalScale[] = ['major', 'minor'];
const VALID_GENRES: GenreTag[] = [
  'ambient', 'classical', 'electronic', 'jazz',
  'lo-fi', 'minimal', 'orchestral', 'trip-hop',
];

// ═════════════════════════════════════════════════════════
// 基础结构
// ═════════════════════════════════════════════════════════

describe('personaMusicEngine · 基础结构', () => {
  it('返回完整字段', () => {
    const params = vectorToMusicParams(makeVec());
    expect(params).toHaveProperty('bpm');
    expect(params).toHaveProperty('timbre');
    expect(params).toHaveProperty('rootFreq');
    expect(params).toHaveProperty('filterFreq');
    expect(params).toHaveProperty('reverb');
    expect(params).toHaveProperty('energy');
    expect(params).toHaveProperty('scale');
    expect(params).toHaveProperty('harmonicDensity');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('genreTags');
    expect(params).toHaveProperty('sourceVector');
  });

  it('所有字段类型正确', () => {
    const params = vectorToMusicParams(makeVec());
    expect(typeof params.bpm).toBe('number');
    expect(VALID_TIMBRES).toContain(params.timbre);
    expect(typeof params.rootFreq).toBe('number');
    expect(typeof params.filterFreq).toBe('number');
    expect(typeof params.reverb).toBe('number');
    expect(typeof params.energy).toBe('number');
    expect(VALID_SCALES).toContain(params.scale);
    expect(typeof params.harmonicDensity).toBe('number');
    expect(typeof params.description).toBe('string');
    expect(params.description.length).toBeGreaterThan(0);
    expect(Array.isArray(params.genreTags)).toBe(true);
    expect(params.genreTags.length).toBeGreaterThan(0);
  });

  it('sourceVector 是输入向量的副本（非引用）', () => {
    const input = makeVec({ ENT: 0.8 });
    const params = vectorToMusicParams(input);
    expect(params.sourceVector).toEqual(input);
    expect(params.sourceVector).not.toBe(input);
  });
});

// ═════════════════════════════════════════════════════════
// 边界值测试
// ═════════════════════════════════════════════════════════

describe('personaMusicEngine · 边界值', () => {
  it('全零向量 → 中性参数', () => {
    const params = vectorToMusicParams(makeVec());
    expect(params.bpm).toBe(115); // 50 + 0.5 * 130
    expect(params.timbre).toBe('triangle');
    expect(params.scale).toBe('minor'); // LEAD=0 → minor
    expect(params.energy).toBeCloseTo(0.55, 1); // 0.1 + 0.5 * 0.9
    expect(params.filterFreq).toBe(2100); // 200 + 0.5 * 3800
    expect(params.reverb).toBeCloseTo(0.4, 1); // 0.05 + 0.5 * 0.7
  });

  it('全 +1 向量 → 最大参数', () => {
    const params = vectorToMusicParams(makeVec({ TOL: 1, SPD: 1, INF: 1, ENT: 1, LEAD: 1, VIS: 1 }));
    expect(params.bpm).toBe(180);
    expect(params.timbre).toBe('sine');
    expect(params.scale).toBe('major');
    expect(params.energy).toBeCloseTo(1.0, 1);
    expect(params.filterFreq).toBe(4000);
    expect(params.reverb).toBeCloseTo(0.75, 1);
    expect(params.harmonicDensity).toBeCloseTo(1.0, 1);
  });

  it('全 -1 向量 → 最小参数', () => {
    const params = vectorToMusicParams(makeVec({ TOL: -1, SPD: -1, INF: -1, ENT: -1, LEAD: -1, VIS: -1 }));
    expect(params.bpm).toBe(50);
    expect(params.timbre).toBe('sawtooth');
    expect(params.scale).toBe('minor');
    expect(params.energy).toBeCloseTo(0.1, 1);
    expect(params.filterFreq).toBe(200);
    expect(params.reverb).toBeCloseTo(0.05, 1);
    expect(params.harmonicDensity).toBeCloseTo(0.0, 1);
  });

  it('BPM 始终在 [50, 180] 范围内', () => {
    const cases: PersonaVector[] = [
      makeVec({ SPD: -1 }),
      makeVec({ SPD: 0 }),
      makeVec({ SPD: 1 }),
      makeVec({ SPD: -0.5 }),
      makeVec({ SPD: 0.7 }),
    ];
    for (const v of cases) {
      const params = vectorToMusicParams(v);
      expect(params.bpm).toBeGreaterThanOrEqual(50);
      expect(params.bpm).toBeLessThanOrEqual(180);
    }
  });

  it('energy 始终在 [0.1, 1.0] 范围内', () => {
    const cases: PersonaVector[] = [
      makeVec({ ENT: -1 }),
      makeVec({ ENT: 0 }),
      makeVec({ ENT: 1 }),
    ];
    for (const v of cases) {
      const params = vectorToMusicParams(v);
      expect(params.energy).toBeGreaterThanOrEqual(0.1);
      expect(params.energy).toBeLessThanOrEqual(1.0);
    }
  });

  it('filterFreq 始终在 [200, 4000] 范围内', () => {
    const cases: PersonaVector[] = [
      makeVec({ INF: -1 }),
      makeVec({ INF: 0 }),
      makeVec({ INF: 1 }),
    ];
    for (const v of cases) {
      const params = vectorToMusicParams(v);
      expect(params.filterFreq).toBeGreaterThanOrEqual(200);
      expect(params.filterFreq).toBeLessThanOrEqual(4000);
    }
  });

  it('reverb 始终在 [0.05, 0.75] 范围内', () => {
    const cases: PersonaVector[] = [
      makeVec({ VIS: -1 }),
      makeVec({ VIS: 0 }),
      makeVec({ VIS: 1 }),
    ];
    for (const v of cases) {
      const params = vectorToMusicParams(v);
      expect(params.reverb).toBeGreaterThanOrEqual(0.05);
      expect(params.reverb).toBeLessThanOrEqual(0.75);
    }
  });
});

// ═════════════════════════════════════════════════════════
// 子映射函数
// ═════════════════════════════════════════════════════════

describe('personaMusicEngine · 子映射', () => {
  describe('TOL → timbre', () => {
    it('TOL > 0.3 → sine', () => {
      expect(vectorToMusicParams(makeVec({ TOL: 0.5 })).timbre).toBe('sine');
      expect(vectorToMusicParams(makeVec({ TOL: 1.0 })).timbre).toBe('sine');
    });

    it('TOL < -0.3 → sawtooth', () => {
      expect(vectorToMusicParams(makeVec({ TOL: -0.5 })).timbre).toBe('sawtooth');
      expect(vectorToMusicParams(makeVec({ TOL: -1.0 })).timbre).toBe('sawtooth');
    });

    it('TOL ∈ [-0.3, 0.3] → triangle', () => {
      expect(vectorToMusicParams(makeVec({ TOL: 0 })).timbre).toBe('triangle');
      expect(vectorToMusicParams(makeVec({ TOL: 0.3 })).timbre).toBe('triangle');
      expect(vectorToMusicParams(makeVec({ TOL: -0.3 })).timbre).toBe('triangle');
    });
  });

  describe('LEAD → scale', () => {
    it('LEAD > 0 → major', () => {
      expect(vectorToMusicParams(makeVec({ LEAD: 0.1 })).scale).toBe('major');
      expect(vectorToMusicParams(makeVec({ LEAD: 1.0 })).scale).toBe('major');
    });

    it('LEAD ≤ 0 → minor', () => {
      expect(vectorToMusicParams(makeVec({ LEAD: 0 })).scale).toBe('minor');
      expect(vectorToMusicParams(makeVec({ LEAD: -0.1 })).scale).toBe('minor');
      expect(vectorToMusicParams(makeVec({ LEAD: -1.0 })).scale).toBe('minor');
    });
  });

  describe('LEAD → rootFreq', () => {
    it('LEAD > 0.5 → C4 (261.63)', () => {
      expect(vectorToMusicParams(makeVec({ LEAD: 0.6 })).rootFreq).toBeCloseTo(261.63, 0);
      expect(vectorToMusicParams(makeVec({ LEAD: 1.0 })).rootFreq).toBeCloseTo(261.63, 0);
    });

    it('LEAD [0, 0.5] → G3 (196.00)', () => {
      expect(vectorToMusicParams(makeVec({ LEAD: 0.3 })).rootFreq).toBeCloseTo(196.00, 0);
      expect(vectorToMusicParams(makeVec({ LEAD: 0 })).rootFreq).toBeCloseTo(196.00, 0);
    });

    it('LEAD [-0.5, 0) → D3 (146.83)', () => {
      expect(vectorToMusicParams(makeVec({ LEAD: -0.3 })).rootFreq).toBeCloseTo(146.83, 0);
      expect(vectorToMusicParams(makeVec({ LEAD: -0.5 })).rootFreq).toBeCloseTo(146.83, 0);
    });

    it('LEAD < -0.5 → A2 (110.00)', () => {
      expect(vectorToMusicParams(makeVec({ LEAD: -0.6 })).rootFreq).toBeCloseTo(110.00, 0);
      expect(vectorToMusicParams(makeVec({ LEAD: -1.0 })).rootFreq).toBeCloseTo(110.00, 0);
    });
  });

  describe('genre tags', () => {
    it('genreTags 都是有效标签', () => {
      const all = generateAllMbtiMusicParams();
      for (const params of Object.values(all)) {
        for (const tag of params.genreTags) {
          expect(VALID_GENRES).toContain(tag);
        }
      }
    });

    it('每种 MBTI 都有非空曲风标签', () => {
      const all = generateAllMbtiMusicParams();
      for (const [mbti, params] of Object.entries(all)) {
        expect(params.genreTags.length, `${mbti} 应有曲风标签`).toBeGreaterThan(0);
      }
    });
  });

  describe('description', () => {
    it('描述非空且有意义', () => {
      const all = generateAllMbtiMusicParams();
      for (const [mbti, params] of Object.entries(all)) {
        expect(params.description.length, `${mbti} 描述应非空`).toBeGreaterThan(10);
      }
    });

    it('16 型描述不全部相同', () => {
      const all = generateAllMbtiMusicParams();
      const descriptions = new Set(Object.values(all).map((p) => p.description));
      expect(descriptions.size).toBeGreaterThan(1);
    });
  });
});

// ═════════════════════════════════════════════════════════
// MBTI 快捷路径
// ═════════════════════════════════════════════════════════

describe('personaMusicEngine · MBTI 快捷路径', () => {
  it('mbtiToMusicParams 与 vectorToMusicParams 结果一致', () => {
    // 手动构造 ENFP 向量，与 mbtiToBaseVector('ENFP') 的结果对比
    const manualVector = mbtiToMusicParams('ENFP').sourceVector;
    const viaVector = vectorToMusicParams(manualVector);
    const viaMbti = mbtiToMusicParams('ENFP');

    expect(viaMbti.bpm).toBe(viaVector.bpm);
    expect(viaMbti.timbre).toBe(viaVector.timbre);
    expect(viaMbti.scale).toBe(viaVector.scale);
    expect(viaMbti.rootFreq).toBe(viaVector.rootFreq);
  });

  it('不区分大小写', () => {
    const upper = mbtiToMusicParams('INTJ');
    const lower = mbtiToMusicParams('intj');
    const mixed = mbtiToMusicParams('Intj');

    expect(upper.bpm).toBe(lower.bpm);
    expect(upper.timbre).toBe(lower.timbre);
    expect(mixed.bpm).toBe(upper.bpm);
  });

  it('16 型全部可生成且不报错', () => {
    const all = generateAllMbtiMusicParams();
    expect(Object.keys(all)).toHaveLength(16);
  });
});

// ═════════════════════════════════════════════════════════
// 典型人格场景 · 模拟验证（使用显式向量，避免依赖 mbtiToBaseVector 内部实现）
// ═════════════════════════════════════════════════════════

describe('personaMusicEngine · 典型人格场景', () => {
  it('高容错 + 高速度 + 主导 → 正弦波、快速、大调、高能量', () => {
    const params = vectorToMusicParams(makeVec({ TOL: 0.8, SPD: 0.7, ENT: 0.9, LEAD: 0.6 }));
    expect(params.timbre).toBe('sine');         // 高容错 → 柔和正弦波
    expect(params.bpm).toBeGreaterThan(120);    // 快节奏
    expect(params.scale).toBe('major');         // 主导 → 大调
    expect(params.energy).toBeGreaterThan(0.7); // 高能量
  });

  it('低容错 + 低速度 + 追随 → 锯齿波、慢速、小调、低能量', () => {
    const params = vectorToMusicParams(makeVec({ TOL: -0.8, SPD: -0.7, ENT: -0.9, LEAD: -0.6 }));
    expect(params.timbre).toBe('sawtooth');     // 低容错 → 锋利锯齿波
    expect(params.bpm).toBeLessThanOrEqual(70);  // 慢节奏
    expect(params.scale).toBe('minor');         // 追随 → 小调
    expect(params.energy).toBeLessThan(0.3);    // 低能量
    expect(params.rootFreq).toBeCloseTo(110, 0); // A2 深沉
  });

  it('高直觉 + 低信息 → 高混响、低和声密度', () => {
    const params = vectorToMusicParams(makeVec({ VIS: 0.9, INF: -0.8 }));
    expect(params.reverb).toBeGreaterThan(0.5);       // 高混响
    expect(params.harmonicDensity).toBeLessThan(0.3);  // 低和声密度
    expect(params.filterFreq).toBeLessThan(1500);      // 窄频
  });

  it('高信息 + 低直觉 → 宽频、高和声密度、低混响', () => {
    const params = vectorToMusicParams(makeVec({ INF: 0.9, VIS: -0.8 }));
    expect(params.filterFreq).toBeGreaterThan(3000);   // 宽频
    expect(params.harmonicDensity).toBeGreaterThan(0.7); // 高和声密度
    expect(params.reverb).toBeLessThan(0.3);           // 低混响
  });

  it('INFP · 调停者 → 小调、高混响、柔和（验证 MBTI 快捷路径可用）', () => {
    const params = mbtiToMusicParams('INFP');
    expect(params.scale).toBe('minor');            // 内敛
    expect(params.reverb).toBeGreaterThan(0.3);    // 梦幻混响
    expect(params.timbre).toBe('sine');            // 柔和
    // 验证 sourceVector 回传正确
    expect(params.sourceVector.VIS).toBeGreaterThan(0);
  });
});

// ═════════════════════════════════════════════════════════
// 16 型差异化验证
// ═════════════════════════════════════════════════════════

describe('personaMusicEngine · 16 型差异化', () => {
  const all = generateAllMbtiMusicParams();

  it('BPM 存在差异 · 不是全部相同', () => {
    const bpms = new Set(Object.values(all).map((p) => p.bpm));
    expect(bpms.size).toBeGreaterThan(3); // 至少有 4 种不同 BPM
  });

  it('timbre 至少出现 2 种类型', () => {
    const timbres = new Set(Object.values(all).map((p) => p.timbre));
    expect(timbres.size).toBeGreaterThanOrEqual(2);
  });

  it('scale 同时存在 major 和 minor', () => {
    const scales = new Set(Object.values(all).map((p) => p.scale));
    expect(scales.has('major')).toBe(true);
    expect(scales.has('minor')).toBe(true);
  });

  it('rootFreq 至少出现 3 种不同音高', () => {
    const freqs = new Set(Object.values(all).map((p) => Math.round(p.rootFreq)));
    expect(freqs.size).toBeGreaterThanOrEqual(3);
  });

  it('每种 MBTI 的 sourceVector 维度值在 [-1, 1]', () => {
    for (const [mbti, params] of Object.entries(all)) {
      const v = params.sourceVector;
      for (const dim of ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'] as const) {
        expect(v[dim], `${mbti}.${dim} 应在 [-1,1]`).toBeGreaterThanOrEqual(-1);
        expect(v[dim], `${mbti}.${dim} 应在 [-1,1]`).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

describe('personaMusicEngine · 工具函数', () => {
  it('getRootNote 返回正确的音符名', () => {
    expect(getRootNote(mbtiToMusicParams('ENTJ'))).toBe('C4');
    expect(getRootNote(mbtiToMusicParams('INTJ'))).toBe('G3');
    expect(getRootNote(mbtiToMusicParams('ISFP'))).toBe('D3');
    expect(getRootNote(mbtiToMusicParams('INFP'))).toBe('D3');
  });

  it('toSynthParams 返回与 musicEngine 兼容的格式', () => {
    const params = mbtiToMusicParams('INTJ');
    const synth = toSynthParams(params);

    expect(synth).toHaveProperty('rootFreq');
    expect(synth).toHaveProperty('timbre');
    expect(synth).toHaveProperty('filterFreq');
    expect(synth).toHaveProperty('reverb');

    expect(synth.rootFreq).toBe(params.rootFreq);
    expect(synth.timbre).toBe(params.timbre);
    expect(synth.filterFreq).toBe(params.filterFreq);
    expect(synth.reverb).toBe(params.reverb);

    // 验证 timbre 是 musicEngine 接受的类型
    expect(['sine', 'triangle', 'sawtooth', 'square']).toContain(synth.timbre);
  });
});

// ═════════════════════════════════════════════════════════
// 一致性验证
// ═════════════════════════════════════════════════════════

describe('personaMusicEngine · 一致性', () => {
  it('相同输入 → 相同输出（幂等）', () => {
    const v = makeVec({ TOL: 0.5, SPD: -0.3, INF: 0.8, ENT: 0.2, LEAD: 0.6, VIS: -0.4 });
    const a = vectorToMusicParams(v);
    const b = vectorToMusicParams(v);
    expect(a).toEqual(b);
  });

  it('输入向量不被修改', () => {
    const v = makeVec({ ENT: 0.7, VIS: 0.3 });
    const snapshot = { ...v };
    vectorToMusicParams(v);
    expect(v).toEqual(snapshot);
  });
});