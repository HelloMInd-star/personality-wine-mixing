/**
 * scentFromVector · 单元测试
 * 覆盖六维 → 签名气味 Top-2 派生 · 边界 · 多维叠加
 */

import { describe, it, expect } from 'vitest';
import {
  scentFromVector,
  getScentByDim,
  getDominantDim,
  getAllVectorScentNotes,
} from './scentFromVector';
import {
  VECTOR_SCENT_SPACE,
  DEFAULT_VECTOR_SCENT,
} from '../data/vectorScentMap';
import type { PersonaVector, PersonaDim } from '../types/personaFusion';

function makeVec(overrides: Partial<PersonaVector> = {}): PersonaVector {
  return { TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0, ...overrides };
}

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

// ═════════════════════════════════════════════════════════
// 基础结构
// ═════════════════════════════════════════════════════════

describe('scentFromVector · 基础结构', () => {
  it('返回完整字段', () => {
    const r = scentFromVector(makeVec());
    expect(r).toHaveProperty('primary');
    expect(r).toHaveProperty('secondary');
    expect(r).toHaveProperty('primaryDim');
    expect(r).toHaveProperty('secondaryDim');
    expect(r).toHaveProperty('primaryIntensity');
    expect(r).toHaveProperty('secondaryIntensity');
  });

  it('primary/secondary 含 note/label/symbol/poem', () => {
    const r = scentFromVector(makeVec({ ENT: 1 }));
    expect(r.primary.note).toBeTruthy();
    expect(r.primary.label).toBeTruthy();
    expect(r.primary.symbol).toBeTruthy();
    expect(r.primary.poem.length).toBeGreaterThan(0);
  });
});

// ═════════════════════════════════════════════════════════
// 全零向量 → 默认琥珀
// ═════════════════════════════════════════════════════════

describe('scentFromVector · 全零默认', () => {
  it('全零向量 → primary/secondary 皆默认琥珀', () => {
    const r = scentFromVector(makeVec());
    expect(r.primary.note).toBe(DEFAULT_VECTOR_SCENT.note);
    expect(r.secondary.note).toBe(DEFAULT_VECTOR_SCENT.note);
  });

  it('全零向量 → primaryDim/secondaryDim 为 null', () => {
    const r = scentFromVector(makeVec());
    expect(r.primaryDim).toBeNull();
    expect(r.secondaryDim).toBeNull();
  });

  it('全零向量 → intensity 皆为 0', () => {
    const r = scentFromVector(makeVec());
    expect(r.primaryIntensity).toBe(0);
    expect(r.secondaryIntensity).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════
// 单维度激活 · 正负倾向
// ═════════════════════════════════════════════════════════

describe('scentFromVector · 单维度正倾向', () => {
  for (const dim of DIMS) {
    it(`${dim}=1 → primary = ${dim} 正倾向气味`, () => {
      const r = scentFromVector(makeVec({ [dim]: 1 }));
      expect(r.primary.note).toBe(VECTOR_SCENT_SPACE[dim].positive.note);
      expect(r.primaryDim).toBe(dim);
      expect(r.primaryIntensity).toBeCloseTo(1, 3);
    });
  }
});

describe('scentFromVector · 单维度负倾向', () => {
  for (const dim of DIMS) {
    it(`${dim}=-1 → primary = ${dim} 负倾向气味`, () => {
      const r = scentFromVector(makeVec({ [dim]: -1 }));
      expect(r.primary.note).toBe(VECTOR_SCENT_SPACE[dim].negative.note);
      expect(r.primaryDim).toBe(dim);
      expect(r.primaryIntensity).toBeCloseTo(1, 3);
    });
  }
});

// ═════════════════════════════════════════════════════════
// Top-2 排序
// ═════════════════════════════════════════════════════════

describe('scentFromVector · Top-2 排序', () => {
  it('强度最高者 → primary', () => {
    // ENT=1 > VIS=0.5
    const r = scentFromVector(makeVec({ ENT: 1, VIS: 0.5 }));
    expect(r.primaryDim).toBe('ENT');
    expect(r.secondaryDim).toBe('VIS');
    expect(r.primaryIntensity).toBeCloseTo(1, 3);
    expect(r.secondaryIntensity).toBeCloseTo(0.5, 3);
  });

  it('强度相等 → 任一为 primary（顺序稳定即可）', () => {
    const r = scentFromVector(makeVec({ ENT: 1, VIS: 1 }));
    expect(['ENT', 'VIS']).toContain(r.primaryDim);
    expect(['ENT', 'VIS']).toContain(r.secondaryDim);
    expect(r.primaryDim).not.toBe(r.secondaryDim);
  });

  it('负强度仍参与排序（按绝对值）', () => {
    // TOL=-0.8 (|0.8|) > ENT=0.5
    const r = scentFromVector(makeVec({ TOL: -0.8, ENT: 0.5 }));
    expect(r.primaryDim).toBe('TOL');
    expect(r.secondaryDim).toBe('ENT');
  });
});

// ═════════════════════════════════════════════════════════
// 仅一维非零 → secondary 与 primary 相同
// ═════════════════════════════════════════════════════════

describe('scentFromVector · 仅一维非零', () => {
  it('仅 ENT=0.6 → secondary 与 primary 相同', () => {
    const r = scentFromVector(makeVec({ ENT: 0.6 }));
    expect(r.primary.note).toBe(r.secondary.note);
  });

  it('仅一维非零 → secondaryDim 为 null', () => {
    const r = scentFromVector(makeVec({ TOL: -0.5 }));
    expect(r.primaryDim).toBe('TOL');
    expect(r.secondaryDim).toBeNull();
    expect(r.secondaryIntensity).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════
// 多维场景
// ═════════════════════════════════════════════════════════

describe('scentFromVector · 多维场景', () => {
  it('三维非零 → Top-2 取最强的两个', () => {
    // ENT=0.9 > VIS=0.6 > TOL=0.3
    const r = scentFromVector(makeVec({ ENT: 0.9, VIS: 0.6, TOL: 0.3 }));
    expect(r.primaryDim).toBe('ENT');
    expect(r.secondaryDim).toBe('VIS');
  });

  it('混合正负 → 各自取对应倾向气味', () => {
    // TOL=-0.8 → 枫香（负）；ENT=0.6 → 柑橘（正）
    const r = scentFromVector(makeVec({ TOL: -0.8, ENT: 0.6 }));
    expect(r.primary.note).toBe(VECTOR_SCENT_SPACE.TOL.negative.note); // 枫香
    expect(r.secondary.note).toBe(VECTOR_SCENT_SPACE.ENT.positive.note); // 柑橘
  });

  it('全维度非零 → 仅取 Top-2', () => {
    const r = scentFromVector({
      TOL: 0.1, SPD: 0.2, INF: 0.3, ENT: 0.4, LEAD: 0.5, VIS: 0.6,
    });
    // 最强: VIS=0.6, 次强: LEAD=0.5
    expect(r.primaryDim).toBe('VIS');
    expect(r.secondaryDim).toBe('LEAD');
  });
});

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

describe('scentFromVector · 工具函数', () => {
  it('getScentByDim · 正值 → positive', () => {
    const s = getScentByDim(makeVec({ ENT: 1 }), 'ENT');
    expect(s.note).toBe(VECTOR_SCENT_SPACE.ENT.positive.note);
  });

  it('getScentByDim · 负值 → negative', () => {
    const s = getScentByDim(makeVec({ ENT: -1 }), 'ENT');
    expect(s.note).toBe(VECTOR_SCENT_SPACE.ENT.negative.note);
  });

  it('getScentByDim · 零值 → positive（>=0）', () => {
    const s = getScentByDim(makeVec({ ENT: 0 }), 'ENT');
    expect(s.note).toBe(VECTOR_SCENT_SPACE.ENT.positive.note);
  });

  it('getDominantDim · 返回最大绝对值维度', () => {
    expect(getDominantDim(makeVec({ ENT: 0.9, VIS: 0.5 }))).toBe('ENT');
    expect(getDominantDim(makeVec({ TOL: -0.8, ENT: 0.5 }))).toBe('TOL');
  });

  it('getDominantDim · 全零返回 null', () => {
    expect(getDominantDim(makeVec())).toBeNull();
  });

  it('getAllVectorScentNotes · 返回 12 个气味（6 维 × 正负）', () => {
    const notes = getAllVectorScentNotes();
    expect(notes.length).toBe(12);
    // note 唯一性
    const noteSet = new Set(notes.map((n) => n.note));
    expect(noteSet.size).toBe(12);
  });
});

// ═════════════════════════════════════════════════════════
// 气味空间完整性 · 与 vectorScentMap 对齐
// ═════════════════════════════════════════════════════════

describe('scentFromVector · 气味空间完整性', () => {
  it('12 个气味 note 各不相同', () => {
    const notes = getAllVectorScentNotes().map((n) => n.note);
    expect(new Set(notes).size).toBe(12);
  });

  it('每个气味有完整字段', () => {
    const notes = getAllVectorScentNotes();
    for (const n of notes) {
      expect(n.note.length).toBeGreaterThan(0);
      expect(n.label.length).toBeGreaterThan(0);
      expect(n.symbol.length).toBeGreaterThan(0);
      expect(n.poem.length).toBeGreaterThan(0);
    }
  });

  it('默认琥珀不在 12 气味空间中（独立位）', () => {
    const notes = getAllVectorScentNotes().map((n) => n.note);
    expect(notes).not.toContain(DEFAULT_VECTOR_SCENT.note);
  });
});
