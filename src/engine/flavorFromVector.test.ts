/**
 * flavorFromVector · 单元测试
 * 覆盖六维 → 八维风味加权矩阵 · 边界值 · 中性偏好 · 主调派生
 */

import { describe, it, expect } from 'vitest';
import {
  flavorFromVector,
  getPrimaryFlavor,
  getAvoidFlavor,
  FLAVOR_MATRIX,
} from './flavorFromVector';
import type { PersonaVector } from '../types/personaFusion';
import type { FlavorKey } from '../types/cocktail';

const FLAVOR_KEYS: FlavorKey[] = [
  'sweet', 'sour', 'bitter', 'strong',
  'smoky', 'fruity', 'herbal', 'creamy',
];

function makeVec(overrides: Partial<PersonaVector> = {}): PersonaVector {
  return {
    TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0,
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════
// 基础结构
// ═════════════════════════════════════════════════════════

describe('flavorFromVector · 基础结构', () => {
  it('返回八维完整字段', () => {
    const pref = flavorFromVector(makeVec());
    for (const k of FLAVOR_KEYS) {
      expect(pref).toHaveProperty(k);
      expect(typeof pref[k]).toBe('number');
    }
  });

  it('所有风味落在 [0, 1]', () => {
    const cases: PersonaVector[] = [
      makeVec(),
      makeVec({ ENT: 1, VIS: 1 }),
      makeVec({ TOL: -1, LEAD: -1 }),
      makeVec({ TOL: 1, SPD: 1, INF: 1, ENT: 1, LEAD: 1, VIS: 1 }),
      makeVec({ TOL: -1, SPD: -1, INF: -1, ENT: -1, LEAD: -1, VIS: -1 }),
    ];
    for (const v of cases) {
      const pref = flavorFromVector(v);
      for (const k of FLAVOR_KEYS) {
        expect(pref[k]).toBeGreaterThanOrEqual(0);
        expect(pref[k]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('保留 3 位小数', () => {
    const pref = flavorFromVector(makeVec({ ENT: 0.7, VIS: 0.3 }));
    for (const k of FLAVOR_KEYS) {
      const v = pref[k] ?? 0;
      // 3 位小数 · Math.round(x * 1000) / 1000
      expect(Math.round(v * 1000) / 1000).toBe(v);
    }
  });
});

// ═════════════════════════════════════════════════════════
// 全零向量 → 中性偏好 0.5
// ═════════════════════════════════════════════════════════

describe('flavorFromVector · 全零中性', () => {
  it('全零向量 → 所有风味 0.5', () => {
    const pref = flavorFromVector(makeVec());
    for (const k of FLAVOR_KEYS) {
      expect(pref[k]).toBe(0.5);
    }
  });

  it('全零向量 → 无主调偏好', () => {
    const pref = flavorFromVector(makeVec());
    expect(getPrimaryFlavor(pref)).toBeNull();
  });

  it('全零向量 → 无回避风味', () => {
    const pref = flavorFromVector(makeVec());
    expect(getAvoidFlavor(pref)).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════
// 单维度激活 · 矩阵正确性
// ═════════════════════════════════════════════════════════

describe('flavorFromVector · 单维度激活', () => {
  it('ENT=1 → sweet/fruity/creamy 提升 · bitter 压制', () => {
    const pref = flavorFromVector(makeVec({ ENT: 1 }));
    // sweet = 0.5 + 0.5 * (0.4) = 0.7
    expect(pref.sweet).toBeCloseTo(0.7, 3);
    // fruity = 0.5 + 0.5 * (0.4) = 0.7
    expect(pref.fruity).toBeCloseTo(0.7, 3);
    // creamy = 0.5 + 0.5 * (0.2) = 0.6
    expect(pref.creamy).toBeCloseTo(0.6, 3);
    // bitter = 0.5 + 0.5 * (-0.2) = 0.4
    expect(pref.bitter).toBeCloseTo(0.4, 3);
    // herbal = 0.5 + 0.5 * (-0.1) = 0.45
    expect(pref.herbal).toBeCloseTo(0.45, 3);
  });

  it('TOL=1 → strong/smoky 提升', () => {
    const pref = flavorFromVector(makeVec({ TOL: 1 }));
    // strong = 0.5 + 0.5 * (0.3) = 0.65
    expect(pref.strong).toBeCloseTo(0.65, 3);
    // smoky = 0.5 + 0.5 * (0.3) = 0.65
    expect(pref.smoky).toBeCloseTo(0.65, 3);
    // sweet = 0.5 + 0.5 * (0.1) = 0.55
    expect(pref.sweet).toBeCloseTo(0.55, 3);
  });

  it('INF=1 → bitter/herbal/smoky 提升', () => {
    const pref = flavorFromVector(makeVec({ INF: 1 }));
    // bitter = 0.5 + 0.5 * (0.4) = 0.7
    expect(pref.bitter).toBeCloseTo(0.7, 3);
    // herbal = 0.5 + 0.5 * (0.4) = 0.7
    expect(pref.herbal).toBeCloseTo(0.7, 3);
    // smoky = 0.5 + 0.5 * (0.2) = 0.6
    expect(pref.smoky).toBeCloseTo(0.6, 3);
  });

  it('LEAD=1 → strong/bitter/smoky 提升', () => {
    const pref = flavorFromVector(makeVec({ LEAD: 1 }));
    // strong = 0.5 + 0.5 * (0.4) = 0.7
    expect(pref.strong).toBeCloseTo(0.7, 3);
    // bitter = 0.5 + 0.5 * (0.2) = 0.6
    expect(pref.bitter).toBeCloseTo(0.6, 3);
    // smoky = 0.5 + 0.5 * (0.2) = 0.6
    expect(pref.smoky).toBeCloseTo(0.6, 3);
  });

  it('VIS=1 → herbal/sweet/fruity/creamy 提升', () => {
    const pref = flavorFromVector(makeVec({ VIS: 1 }));
    // herbal = 0.5 + 0.5 * (0.3) = 0.65
    expect(pref.herbal).toBeCloseTo(0.65, 3);
    // sweet = 0.5 + 0.5 * (0.2) = 0.6
    expect(pref.sweet).toBeCloseTo(0.6, 3);
    // fruity = 0.5 + 0.5 * (0.2) = 0.6
    expect(pref.fruity).toBeCloseTo(0.6, 3);
    // creamy = 0.5 + 0.5 * (0.2) = 0.6
    expect(pref.creamy).toBeCloseTo(0.6, 3);
  });

  it('SPD=1 → sour/bitter 提升', () => {
    const pref = flavorFromVector(makeVec({ SPD: 1 }));
    // sour = 0.5 + 0.5 * (0.3) = 0.65
    expect(pref.sour).toBeCloseTo(0.65, 3);
    // bitter = 0.5 + 0.5 * (0.1) = 0.55
    expect(pref.bitter).toBeCloseTo(0.55, 3);
  });

  it('负向量 → 反向效果', () => {
    const pos = flavorFromVector(makeVec({ ENT: 1 }));
    const neg = flavorFromVector(makeVec({ ENT: -1 }));
    // ENT=1 → sweet 偏好；ENT=-1 → sweet 排斥
    expect(pos.sweet).toBeGreaterThan(0.5);
    expect(neg.sweet).toBeLessThan(0.5);
    // 对称性：pos + neg = 1
    expect(pos.sweet + neg.sweet).toBeCloseTo(1, 3);
  });
});

// ═════════════════════════════════════════════════════════
// 多维叠加
// ═════════════════════════════════════════════════════════

describe('flavorFromVector · 多维叠加', () => {
  it('ENT + VIS 同时高 → sweet 累加', () => {
    const pref = flavorFromVector(makeVec({ ENT: 1, VIS: 1 }));
    // sweet raw = 0.4(ENT) + 0.2(VIS) = 0.6 → 0.5 + 0.5*0.6 = 0.8
    expect(pref.sweet).toBeCloseTo(0.8, 3);
    // fruity raw = 0.4(ENT) + 0.2(VIS) = 0.6 → 0.8
    expect(pref.fruity).toBeCloseTo(0.8, 3);
  });

  it('TOL + LEAD 同时高 → strong 累加', () => {
    const pref = flavorFromVector(makeVec({ TOL: 1, LEAD: 1 }));
    // strong raw = 0.3(TOL) + 0.4(LEAD) = 0.7 → 0.5 + 0.5*0.7 = 0.85
    expect(pref.strong).toBeCloseTo(0.85, 3);
  });

  it('正负叠加相互抵消', () => {
    const pref = flavorFromVector(makeVec({ ENT: 1, INF: 1 }));
    // bitter raw = 0.4(INF) - 0.2(ENT) = 0.2 → 0.5 + 0.5*0.2 = 0.6
    expect(pref.bitter).toBeCloseTo(0.6, 3);
    // herbal raw = 0.4(INF) - 0.1(ENT) = 0.3 → 0.65
    expect(pref.herbal).toBeCloseTo(0.65, 3);
  });

  it('极端正全维度 → 所有正权重风味接近 1', () => {
    const pref = flavorFromVector(makeVec({
      TOL: 1, SPD: 1, INF: 1, ENT: 1, LEAD: 1, VIS: 1,
    }));
    // strong raw = 0.3 + 0.1 + 0.4 = 0.8 → 0.5 + 0.4 = 0.9
    expect(pref.strong).toBeCloseTo(0.9, 3);
    // smoky raw = 0.3 + 0.2 - 0.1 + 0.2 + 0.1 = 0.7 → 0.85
    expect(pref.smoky).toBeCloseTo(0.85, 3);
  });
});

// ═════════════════════════════════════════════════════════
// 主调派生
// ═════════════════════════════════════════════════════════

describe('flavorFromVector · 主调派生', () => {
  it('ENT=1 → 主调为 sweet 或 fruity（权重相同）', () => {
    const pref = flavorFromVector(makeVec({ ENT: 1 }));
    const primary = getPrimaryFlavor(pref);
    expect(['sweet', 'fruity']).toContain(primary);
  });

  it('TOL=1 LEAD=1 → 主调为 strong', () => {
    const pref = flavorFromVector(makeVec({ TOL: 1, LEAD: 1 }));
    expect(getPrimaryFlavor(pref)).toBe('strong');
  });

  it('INF=1 → 主调为 bitter 或 herbal', () => {
    const pref = flavorFromVector(makeVec({ INF: 1 }));
    const primary = getPrimaryFlavor(pref);
    expect(['bitter', 'herbal']).toContain(primary);
  });

  it('ENT=-1 → 回避 sweet/fruity', () => {
    const pref = flavorFromVector(makeVec({ ENT: -1 }));
    const avoid = getAvoidFlavor(pref);
    expect(['sweet', 'fruity']).toContain(avoid);
  });

  it('中性偏好无主调', () => {
    const pref = flavorFromVector(makeVec());
    expect(getPrimaryFlavor(pref)).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════
// 矩阵完整性
// ═════════════════════════════════════════════════════════

describe('flavorFromVector · 矩阵完整性', () => {
  it('FLAVOR_MATRIX 覆盖 8 个风味', () => {
    expect(Object.keys(FLAVOR_MATRIX).length).toBe(8);
    for (const k of FLAVOR_KEYS) {
      expect(FLAVOR_MATRIX).toHaveProperty(k);
    }
  });

  it('每个风味的六维权重完整', () => {
    for (const k of FLAVOR_KEYS) {
      const row = FLAVOR_MATRIX[k];
      expect(Object.keys(row).length).toBe(6);
      for (const d of ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'] as const) {
        expect(row).toHaveProperty(d);
        expect(typeof row[d]).toBe('number');
      }
    }
  });

  it('每行权重绝对值之和 ≤ 1（防止 raw 溢出 [-1,1]）', () => {
    for (const k of FLAVOR_KEYS) {
      const row = FLAVOR_MATRIX[k];
      const sumAbs = Object.values(row).reduce((s, v) => s + Math.abs(v), 0);
      expect(sumAbs).toBeLessThanOrEqual(1.001); // 浮点容差
    }
  });

  it('每行至少有一个非零权重', () => {
    for (const k of FLAVOR_KEYS) {
      const row = FLAVOR_MATRIX[k];
      const sumAbs = Object.values(row).reduce((s, v) => s + Math.abs(v), 0);
      expect(sumAbs).toBeGreaterThan(0);
    }
  });
});

// ═════════════════════════════════════════════════════════
// 对称性 · 反向量
// ═════════════════════════════════════════════════════════

describe('flavorFromVector · 对称性', () => {
  it('v 与 -v 的风味偏好关于 0.5 对称', () => {
    const v = makeVec({ TOL: 0.6, ENT: -0.3, VIS: 0.4, LEAD: 0.2 });
    const pos = flavorFromVector(v);
    const neg = flavorFromVector({
      TOL: -0.6, SPD: 0, INF: 0, ENT: 0.3, LEAD: -0.2, VIS: -0.4,
    });
    for (const k of FLAVOR_KEYS) {
      expect((pos[k] ?? 0) + (neg[k] ?? 0)).toBeCloseTo(1, 3);
    }
  });
});
