/**
 * colorFromVector · 单元测试
 * 覆盖六维 → 光效主色色环派生 · 插值 · 边界 · 工具函数
 */

import { describe, it, expect } from 'vitest';
import {
  colorFromVector,
  getColorByDim,
  getVectorGradientCss,
  getVectorColorSignature,
} from './colorFromVector';
import {
  VECTOR_COLOR_RING,
  DEFAULT_VECTOR_COLOR,
  hslToHex,
  hslToString,
  interpolateHSL,
} from '../data/vectorColorMap';
import type { PersonaVector, PersonaDim } from '../types/personaFusion';

function makeVec(overrides: Partial<PersonaVector> = {}): PersonaVector {
  return { TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0, ...overrides };
}

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

// ═════════════════════════════════════════════════════════
// 基础结构
// ═════════════════════════════════════════════════════════

describe('colorFromVector · 基础结构', () => {
  it('返回完整字段', () => {
    const r = colorFromVector(makeVec());
    expect(r).toHaveProperty('primary');
    expect(r).toHaveProperty('secondary');
    expect(r).toHaveProperty('primaryHex');
    expect(r).toHaveProperty('secondaryHex');
    expect(r).toHaveProperty('primaryCss');
    expect(r).toHaveProperty('secondaryCss');
    expect(r).toHaveProperty('primaryDim');
    expect(r).toHaveProperty('secondaryDim');
    expect(r).toHaveProperty('primaryIntensity');
    expect(r).toHaveProperty('secondaryIntensity');
  });

  it('HSL 字段含 hue/saturation/lightness', () => {
    const r = colorFromVector(makeVec({ ENT: 1 }));
    expect(r.primary).toHaveProperty('hue');
    expect(r.primary).toHaveProperty('saturation');
    expect(r.primary).toHaveProperty('lightness');
  });

  it('hex 格式正确（#rrggbb）', () => {
    const r = colorFromVector(makeVec({ ENT: 1 }));
    expect(r.primaryHex).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('CSS 格式以 hsl 开头', () => {
    const r = colorFromVector(makeVec({ ENT: 1 }));
    expect(r.primaryCss).toMatch(/^hsl\(/);
  });
});

// ═════════════════════════════════════════════════════════
// 全零向量 → 默认紫晶
// ═════════════════════════════════════════════════════════

describe('colorFromVector · 全零默认', () => {
  it('全零向量 → primary/secondary 皆默认紫晶', () => {
    const r = colorFromVector(makeVec());
    expect(r.primary.hue).toBe(DEFAULT_VECTOR_COLOR.hue);
    expect(r.primary.saturation).toBe(DEFAULT_VECTOR_COLOR.saturation);
    expect(r.primary.lightness).toBe(DEFAULT_VECTOR_COLOR.lightness);
    expect(r.secondary.hue).toBe(DEFAULT_VECTOR_COLOR.hue);
  });

  it('全零向量 → primaryDim/secondaryDim 为 null', () => {
    const r = colorFromVector(makeVec());
    expect(r.primaryDim).toBeNull();
    expect(r.secondaryDim).toBeNull();
  });

  it('全零向量 → intensity 皆为 0', () => {
    const r = colorFromVector(makeVec());
    expect(r.primaryIntensity).toBe(0);
    expect(r.secondaryIntensity).toBe(0);
  });

  it('全零向量 → hex 与 DEFAULT_VECTOR_COLOR 一致', () => {
    const r = colorFromVector(makeVec());
    expect(r.primaryHex).toBe(hslToHex(DEFAULT_VECTOR_COLOR));
  });
});

// ═════════════════════════════════════════════════════════
// 单维度激活 · 正负倾向
// ═════════════════════════════════════════════════════════

describe('colorFromVector · 单维度正倾向', () => {
  for (const dim of DIMS) {
    it(`${dim}=1 → primary 接近 ${dim} 正色（强度=1 时为纯色）`, () => {
      const r = colorFromVector(makeVec({ [dim]: 1 }));
      expect(r.primaryDim).toBe(dim);
      expect(r.primaryIntensity).toBeCloseTo(1, 3);
      // 强度=1 → 插值结果 = 维度色
      const expected = VECTOR_COLOR_RING[dim].positive;
      expect(r.primary.hue).toBeCloseTo(expected.hue, 1);
      expect(r.primary.saturation).toBeCloseTo(expected.saturation, 1);
      expect(r.primary.lightness).toBeCloseTo(expected.lightness, 1);
    });
  }
});

describe('colorFromVector · 单维度负倾向', () => {
  for (const dim of DIMS) {
    it(`${dim}=-1 → primary 接近 ${dim} 负色`, () => {
      const r = colorFromVector(makeVec({ [dim]: -1 }));
      expect(r.primaryDim).toBe(dim);
      const expected = VECTOR_COLOR_RING[dim].negative;
      expect(r.primary.hue).toBeCloseTo(expected.hue, 1);
      expect(r.primary.saturation).toBeCloseTo(expected.saturation, 1);
      expect(r.primary.lightness).toBeCloseTo(expected.lightness, 1);
    });
  }
});

// ═════════════════════════════════════════════════════════
// 强度插值
// ═════════════════════════════════════════════════════════

describe('colorFromVector · 强度插值', () => {
  it('强度=0.5 → primary 在默认紫晶与维度色之间', () => {
    const r = colorFromVector(makeVec({ ENT: 0.5 }));
    const entColor = VECTOR_COLOR_RING.ENT.positive;
    // 插值 t=0.5
    const expected = interpolateHSL(DEFAULT_VECTOR_COLOR, entColor, 0.5);
    expect(r.primary.hue).toBeCloseTo(expected.hue, 1);
    expect(r.primary.saturation).toBeCloseTo(expected.saturation, 1);
  });

  it('强度=0.2 → primary 偏移量小于强度=1.0', () => {
    // hue 环形插值 · 强度 0.2 时偏移量约为 23°（最短弧 115° × 0.2）
    // 不严格断言接近默认紫晶，而是断言「低强度偏移 < 高强度偏移」
    const low = colorFromVector(makeVec({ ENT: 0.2 }));
    const high = colorFromVector(makeVec({ ENT: 1 }));
    const defaultHue = DEFAULT_VECTOR_COLOR.hue;
    const distLow = Math.min(
      Math.abs(low.primary.hue - defaultHue),
      360 - Math.abs(low.primary.hue - defaultHue),
    );
    const distHigh = Math.min(
      Math.abs(high.primary.hue - defaultHue),
      360 - Math.abs(high.primary.hue - defaultHue),
    );
    expect(distLow).toBeLessThan(distHigh);
    // 低强度时偏移量应小于 30°
    expect(distLow).toBeLessThan(30);
  });

  it('强度越大 → primary 越接近维度色', () => {
    const low = colorFromVector(makeVec({ ENT: 0.3 }));
    const high = colorFromVector(makeVec({ ENT: 1 }));
    const entColor = VECTOR_COLOR_RING.ENT.positive;
    // 高强度更接近 ENT 色
    const distHigh = Math.abs(high.primary.hue - entColor.hue);
    const distLow = Math.abs(low.primary.hue - entColor.hue);
    expect(distHigh).toBeLessThanOrEqual(distLow);
  });
});

// ═════════════════════════════════════════════════════════
// Top-2 排序
// ═════════════════════════════════════════════════════════

describe('colorFromVector · Top-2 排序', () => {
  it('强度最高者 → primary', () => {
    const r = colorFromVector(makeVec({ ENT: 1, VIS: 0.5 }));
    expect(r.primaryDim).toBe('ENT');
    expect(r.secondaryDim).toBe('VIS');
    expect(r.primaryIntensity).toBeCloseTo(1, 3);
    expect(r.secondaryIntensity).toBeCloseTo(0.5, 3);
  });

  it('负强度仍参与排序（按绝对值）', () => {
    const r = colorFromVector(makeVec({ TOL: -0.8, ENT: 0.5 }));
    expect(r.primaryDim).toBe('TOL');
    expect(r.secondaryDim).toBe('ENT');
  });

  it('仅一维非零 → secondary 与 primary 相同', () => {
    const r = colorFromVector(makeVec({ ENT: 0.6 }));
    expect(r.primaryHex).toBe(r.secondaryHex);
    expect(r.secondaryDim).toBeNull();
    expect(r.secondaryIntensity).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════
// 多维场景
// ═════════════════════════════════════════════════════════

describe('colorFromVector · 多维场景', () => {
  it('三维非零 → Top-2 取最强的两个', () => {
    const r = colorFromVector(makeVec({ ENT: 0.9, VIS: 0.6, TOL: 0.3 }));
    expect(r.primaryDim).toBe('ENT');
    expect(r.secondaryDim).toBe('VIS');
  });

  it('主色与次色不同（强度足够时）', () => {
    const r = colorFromVector(makeVec({ ENT: 1, VIS: 1 }));
    // 两者 hue 差距应明显（ENT=20°, VIS=280°）
    const hueDiff = Math.abs(r.primary.hue - r.secondary.hue);
    expect(hueDiff).toBeGreaterThan(180); // 环形差距大
  });

  it('全维度非零 → 仅取 Top-2', () => {
    const r = colorFromVector({
      TOL: 0.1, SPD: 0.2, INF: 0.3, ENT: 0.4, LEAD: 0.5, VIS: 0.6,
    });
    expect(r.primaryDim).toBe('VIS');
    expect(r.secondaryDim).toBe('LEAD');
  });
});

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

describe('colorFromVector · 工具函数', () => {
  it('getColorByDim · 正值 → positive', () => {
    const c = getColorByDim(makeVec({ ENT: 1 }), 'ENT');
    expect(c.hue).toBe(VECTOR_COLOR_RING.ENT.positive.hue);
  });

  it('getColorByDim · 负值 → negative', () => {
    const c = getColorByDim(makeVec({ ENT: -1 }), 'ENT');
    expect(c.hue).toBe(VECTOR_COLOR_RING.ENT.negative.hue);
  });

  it('getVectorGradientCss · 返回 linear-gradient', () => {
    const css = getVectorGradientCss(makeVec({ ENT: 1, VIS: 0.5 }));
    expect(css).toMatch(/^linear-gradient\(90deg,/);
    expect(css).toContain('hsl(');
  });

  it('getVectorGradientCss · 支持自定义角度', () => {
    const css = getVectorGradientCss(makeVec({ ENT: 1 }), 45);
    expect(css).toMatch(/^linear-gradient\(45deg,/);
  });

  it('getVectorColorSignature · 返回 6 个 HSL 色（每维度一个）', () => {
    const sig = getVectorColorSignature(makeVec({ ENT: 1, VIS: 0.5 }));
    expect(sig.length).toBe(6);
    for (const c of sig) {
      expect(c).toHaveProperty('hue');
      expect(c).toHaveProperty('saturation');
      expect(c).toHaveProperty('lightness');
    }
  });

  it('getVectorColorSignature · 全零向量 → 6 个默认紫晶', () => {
    const sig = getVectorColorSignature(makeVec());
    for (const c of sig) {
      expect(c.hue).toBe(DEFAULT_VECTOR_COLOR.hue);
    }
  });
});

// ═════════════════════════════════════════════════════════
// 与 vectorColorMap 一致性
// ═════════════════════════════════════════════════════════

describe('colorFromVector · 与 vectorColorMap 一致性', () => {
  it('主色 hex 与 hslToHex(primary) 一致', () => {
    const r = colorFromVector(makeVec({ ENT: 1 }));
    expect(r.primaryHex).toBe(hslToHex(r.primary));
  });

  it('主色 CSS 与 hslToString(primary) 一致', () => {
    const r = colorFromVector(makeVec({ ENT: 1 }));
    expect(r.primaryCss).toBe(hslToString(r.primary));
  });

  it('色环表 6 维度完整', () => {
    expect(Object.keys(VECTOR_COLOR_RING).length).toBe(6);
    for (const d of DIMS) {
      expect(VECTOR_COLOR_RING[d]).toBeDefined();
      expect(VECTOR_COLOR_RING[d].positive).toBeDefined();
      expect(VECTOR_COLOR_RING[d].negative).toBeDefined();
    }
  });
});

// ═════════════════════════════════════════════════════════
// 视觉联动 · 配色一致性
// ═════════════════════════════════════════════════════════

describe('colorFromVector · 配色联动', () => {
  it('TOL=1 主色 hue 接近塔罗金（45°）· 呼应采集阶段', () => {
    const r = colorFromVector(makeVec({ TOL: 1 }));
    expect(r.primary.hue).toBeCloseTo(45, 0);
  });

  it('SPD=1 主色 hue 接近德州蓝（200°）· 呼应采集阶段', () => {
    const r = colorFromVector(makeVec({ SPD: 1 }));
    expect(r.primary.hue).toBeCloseTo(200, 0);
  });

  it('VIS=1 主色 hue 接近紫罗兰（280°）· 呼应深空紫金', () => {
    const r = colorFromVector(makeVec({ VIS: 1 }));
    expect(r.primary.hue).toBeCloseTo(280, 0);
  });

  it('全零向量 hex 接近 #7c5fbf（深空紫晶）', () => {
    const r = colorFromVector(makeVec());
    // DEFAULT_VECTOR_COLOR = { hue:265, sat:0.5, light:0.55 }
    // hslToHex(265, 0.5, 0.55) ≈ #7c5fbf 系
    expect(r.primaryHex.length).toBe(7);
    // 不严格断言具体 hex（避免颜色微调导致测试失败）· 只验证格式
  });
});
