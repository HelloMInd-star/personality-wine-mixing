/**
 * oceanToVector · 单元测试
 * 覆盖 OCEAN 五维 → 六维向量转换 · 边界值 · 映射正确性
 */

import { describe, it, expect } from 'vitest';
import { oceanToVector, vectorToOceanEstimate } from './oceanToVector';
import type { PersonalityScores } from '../types/personality';

const DIMS = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'] as const;

function makeScores(overrides: Partial<PersonalityScores> = {}): PersonalityScores {
  return {
    openness: 50,
    conscientiousness: 50,
    extraversion: 50,
    agreeableness: 50,
    neuroticism: 50,
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════
// 基础映射
// ═════════════════════════════════════════════════════════

describe('oceanToVector · 基础映射', () => {
  it('全 50 分 → 全零向量', () => {
    const v = oceanToVector(makeScores());
    for (const d of DIMS) expect(v[d]).toBe(0);
  });

  it('O(openness) → VIS', () => {
    const v = oceanToVector(makeScores({ openness: 100 }));
    expect(v.VIS).toBeCloseTo(1, 3);
    // 其他维度不受 O 影响
    expect(v.INF).toBe(0);
    expect(v.ENT).toBe(0);
  });

  it('C(conscientiousness) → INF', () => {
    const v = oceanToVector(makeScores({ conscientiousness: 100 }));
    expect(v.INF).toBeCloseTo(1, 3);
    expect(v.VIS).toBe(0);
  });

  it('E(extraversion) → ENT + LEAD 合成', () => {
    const v = oceanToVector(makeScores({ extraversion: 100 }));
    expect(v.ENT).toBeCloseTo(1, 3);
    // LEAD = (E + A) / 2 = (1 + 0) / 2 = 0.5
    expect(v.LEAD).toBeCloseTo(0.5, 3);
  });

  it('A(agreeableness) → TOL(+0.5) + LEAD 合成', () => {
    const v = oceanToVector(makeScores({ agreeableness: 100 }));
    // A→TOL 权重 0.5：100 分 → 1 × 0.5 = 0.5
    expect(v.TOL).toBeCloseTo(0.5, 3);
    // LEAD = (E + A) / 2 = (0 + 1) / 2 = 0.5
    expect(v.LEAD).toBeCloseTo(0.5, 3);
  });

  it('N(neuroticism) → TOL(-0.5) · 取反', () => {
    const v = oceanToVector(makeScores({ neuroticism: 100 }));
    // N→TOL 权重 0.5 取反：100 分 → -1 × 0.5 = -0.5
    expect(v.TOL).toBeCloseTo(-0.5, 3);
  });
});

// ═════════════════════════════════════════════════════════
// TOL 平衡 · A 与 -N 各贡献 0.5
// ═════════════════════════════════════════════════════════

describe('oceanToVector · TOL 平衡', () => {
  it('A 高 N 低 → TOL 强正', () => {
    const v = oceanToVector(makeScores({ agreeableness: 100, neuroticism: 0 }));
    // A=100 → +0.5, N=0 → -(-1)*0.5 = +0.5, 合计 +1
    expect(v.TOL).toBeCloseTo(1, 3);
  });

  it('A 低 N 高 → TOL 强负', () => {
    const v = oceanToVector(makeScores({ agreeableness: 0, neuroticism: 100 }));
    // A=0 → -0.5, N=100 → -1*0.5 = -0.5, 合计 -1
    expect(v.TOL).toBeCloseTo(-1, 3);
  });

  it('A 与 N 同向 → TOL 抵消', () => {
    const v = oceanToVector(makeScores({ agreeableness: 100, neuroticism: 100 }));
    // A=100 → +0.5, N=100 → -0.5, 合计 0
    expect(v.TOL).toBeCloseTo(0, 3);
  });

  it('A 与 N 同低 → TOL 抵消', () => {
    const v = oceanToVector(makeScores({ agreeableness: 0, neuroticism: 0 }));
    // A=0 → -0.5, N=0 → +0.5, 合计 0
    expect(v.TOL).toBeCloseTo(0, 3);
  });
});

// ═════════════════════════════════════════════════════════
// LEAD 合成
// ═════════════════════════════════════════════════════════

describe('oceanToVector · LEAD 合成', () => {
  it('LEAD = (E + A) / 2', () => {
    const v = oceanToVector(makeScores({ extraversion: 80, agreeableness: 60 }));
    // E_norm = 0.6, A_norm = 0.2 → LEAD = 0.4
    expect(v.LEAD).toBeCloseTo(0.4, 3);
  });

  it('E=100 A=100 → LEAD = 1', () => {
    const v = oceanToVector(makeScores({ extraversion: 100, agreeableness: 100 }));
    expect(v.LEAD).toBeCloseTo(1, 3);
  });

  it('E=0 A=0 → LEAD = -1', () => {
    const v = oceanToVector(makeScores({ extraversion: 0, agreeableness: 0 }));
    expect(v.LEAD).toBeCloseTo(-1, 3);
  });

  it('N 不影响 LEAD', () => {
    const low = oceanToVector(makeScores({ neuroticism: 0 }));
    const high = oceanToVector(makeScores({ neuroticism: 100 }));
    expect(low.LEAD).toBe(high.LEAD);
  });
});

// ═════════════════════════════════════════════════════════
// SPD 固定为 0
// ═════════════════════════════════════════════════════════

describe('oceanToVector · SPD 不贡献', () => {
  it('SPD 始终为 0（测评不贡献决策速度）', () => {
    const v = oceanToVector(makeScores({
      openness: 100, conscientiousness: 100, extraversion: 100,
      agreeableness: 100, neuroticism: 100,
    }));
    expect(v.SPD).toBe(0);
  });

  it('极端低分 SPD 仍为 0', () => {
    const v = oceanToVector(makeScores({
      openness: 0, conscientiousness: 0, extraversion: 0,
      agreeableness: 0, neuroticism: 0,
    }));
    expect(v.SPD).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════
// 边界与夹取
// ═════════════════════════════════════════════════════════

describe('oceanToVector · 边界与夹取', () => {
  it('所有维度落在 [-1, 1]', () => {
    const cases: PersonalityScores[] = [
      makeScores({ openness: 100, agreeableness: 100 }),
      makeScores({ neuroticism: 100, agreeableness: 0 }),
      makeScores({ extraversion: 100, agreeableness: 100, neuroticism: 0 }),
    ];
    for (const s of cases) {
      const v = oceanToVector(s);
      for (const d of DIMS) {
        expect(v[d]).toBeGreaterThanOrEqual(-1);
        expect(v[d]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('分数 0 → 归一化为 -1', () => {
    const v = oceanToVector(makeScores({ openness: 0 }));
    expect(v.VIS).toBeCloseTo(-1, 3);
  });

  it('分数 100 → 归一化为 +1', () => {
    const v = oceanToVector(makeScores({ openness: 100 }));
    expect(v.VIS).toBeCloseTo(1, 3);
  });

  it('分数 75 → 归一化为 +0.5', () => {
    const v = oceanToVector(makeScores({ openness: 75 }));
    expect(v.VIS).toBeCloseTo(0.5, 3);
  });

  it('保留 3 位小数', () => {
    const v = oceanToVector(makeScores({ openness: 73 }));
    // (73-50)/50 = 0.46
    expect(v.VIS).toBeCloseTo(0.46, 3);
  });
});

// ═════════════════════════════════════════════════════════
// 综合用例
// ═════════════════════════════════════════════════════════

describe('oceanToVector · 综合', () => {
  it('典型内向者画像', () => {
    // 低 E，高 N，中等 O
    const v = oceanToVector(makeScores({
      openness: 70, conscientiousness: 60, extraversion: 30,
      agreeableness: 55, neuroticism: 75,
    }));
    // VIS = (70-50)/50 = 0.4
    expect(v.VIS).toBeCloseTo(0.4, 3);
    // ENT = (30-50)/50 = -0.4
    expect(v.ENT).toBeCloseTo(-0.4, 3);
    // TOL = (55-50)/50 * 0.5 + (-(75-50)/50) * 0.5 = 0.05 - 0.25 = -0.2
    expect(v.TOL).toBeCloseTo(-0.2, 3);
    // LEAD = (-0.4 + 0.1) / 2 = -0.15
    expect(v.LEAD).toBeCloseTo(-0.15, 3);
  });

  it('典型冒险者画像', () => {
    // 高 E, 高 A, 低 N, 高 O
    const v = oceanToVector(makeScores({
      openness: 85, conscientiousness: 40, extraversion: 80,
      agreeableness: 70, neuroticism: 25,
    }));
    // VIS = 0.7, INF = -0.2, ENT = 0.6
    // TOL = 0.4*0.5 - (-0.5)*0.5 = 0.2 + 0.25 = 0.45
    // LEAD = (0.6 + 0.4) / 2 = 0.5
    expect(v.VIS).toBeCloseTo(0.7, 3);
    expect(v.INF).toBeCloseTo(-0.2, 3);
    expect(v.ENT).toBeCloseTo(0.6, 3);
    expect(v.TOL).toBeCloseTo(0.45, 3);
    expect(v.LEAD).toBeCloseTo(0.5, 3);
  });
});

// ═════════════════════════════════════════════════════════
// 反查 · vectorToOceanEstimate
// ═════════════════════════════════════════════════════════

describe('oceanToVector · 反查估算', () => {
  it('VIS → openness 估算', () => {
    const est = vectorToOceanEstimate({ TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0.6 });
    expect(est.openness).toBe(80); // 0.6 * 50 + 50 = 80
  });

  it('INF → conscientiousness 估算', () => {
    const est = vectorToOceanEstimate({ TOL: 0, SPD: 0, INF: -0.4, ENT: 0, LEAD: 0, VIS: 0 });
    expect(est.conscientiousness).toBe(30); // -0.4 * 50 + 50 = 30
  });

  it('TOL 正 → agreeableness 高、neuroticism 中性', () => {
    const est = vectorToOceanEstimate({ TOL: 0.5, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0 });
    expect(est.agreeableness).toBe(75); // 0.5 * 50 + 50 = 75
    expect(est.neuroticism).toBe(50); // 中性
  });

  it('TOL 负 → neuroticism 高、agreeableness 中性', () => {
    const est = vectorToOceanEstimate({ TOL: -0.5, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0 });
    expect(est.neuroticism).toBe(75); // -(-0.5) * 50 + 50 = 75
    expect(est.agreeableness).toBe(50); // 中性
  });

  it('反查有损 · TOL 由 A/N 共享无法精确还原', () => {
    // 原 A=100 N=100 → TOL=0
    const est = vectorToOceanEstimate({ TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0 });
    // 反查会得到 A=50, N=50（中性），与原值不同 · 这是有损估算的预期行为
    expect(est.agreeableness).toBe(50);
    expect(est.neuroticism).toBe(50);
  });
});
