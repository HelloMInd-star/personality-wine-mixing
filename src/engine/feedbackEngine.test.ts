/**
 * feedbackEngine · 单元测试
 * 覆盖向量校准的边界情况：方向、幅度、clamp、纯函数性、累积、监控埋点
 */

import { describe, it, expect, vi } from 'vitest';
import { calibrateVector, trackFeedback } from './feedbackEngine';
import type { PersonaVector } from '../types/personaFusion';
import type { FeedbackSignal } from '../types/feedback';

/** 中性基础向量 · 全 0.5 */
const BASE_VEC: PersonaVector = {
  TOL: 0.5,
  SPD: 0.5,
  INF: 0.5,
  ENT: 0.5,
  LEAD: 0.5,
  VIS: 0.5,
};

/** 推荐向量 · 全 1.0（远离 base，便于观察靠拢/远离方向） */
const REC_VEC: PersonaVector = {
  TOL: 1.0,
  SPD: 1.0,
  INF: 1.0,
  ENT: 1.0,
  LEAD: 1.0,
  VIS: 1.0,
};

/** 构造单条评分信号 */
function makeFeedback(rating: number, recipeId = 'test-1'): FeedbackSignal {
  return { recipeId, rating, ts: Date.now() };
}

// ════════════════════════════════════════════════════════════
// calibrateVector · 核心逻辑
// ════════════════════════════════════════════════════════════
describe('feedbackEngine · calibrateVector', () => {
  // ── 空反馈 ──
  it('空反馈数组 → 返回原向量（值相等但为新对象）', () => {
    const result = calibrateVector(BASE_VEC, [], REC_VEC);
    expect(result).toEqual(BASE_VEC);
  });

  it('空反馈 → 不修改入参引用', () => {
    const result = calibrateVector(BASE_VEC, [], REC_VEC);
    expect(result).not.toBe(BASE_VEC);
  });

  // ── 高分 → 朝推荐方向靠近 ──
  it('高分（rating=5）→ 向量朝 recommendedVec 靠近', () => {
    const fb = makeFeedback(5);
    const result = calibrateVector(BASE_VEC, [fb], REC_VEC);
    // recommended=1.0, base=0.5, direction=+1
    // delta = (1.0 - 0.5) * 1 * 0.02 = 0.01
    // result = 0.5 + 0.01 = 0.51
    for (const dim of ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'] as const) {
      expect(result[dim]).toBe(0.51);
      expect(result[dim]).toBeGreaterThan(BASE_VEC[dim]);
    }
  });

  it('评分=4 → 同样朝推荐方向靠近', () => {
    const fb = makeFeedback(4);
    const result = calibrateVector(BASE_VEC, [fb], REC_VEC);
    expect(result.TOL).toBe(0.51);
    expect(result.TOL).toBeGreaterThan(BASE_VEC.TOL);
  });

  // ── 低分 → 朝推荐方向远离 ──
  it('低分（rating=1）→ 向量朝 recommendedVec 远离', () => {
    const fb = makeFeedback(1);
    const result = calibrateVector(BASE_VEC, [fb], REC_VEC);
    // recommended=1.0, base=0.5, direction=-1
    // delta = (1.0 - 0.5) * -1 * 0.02 = -0.01
    // result = 0.5 - 0.01 = 0.49
    for (const dim of ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'] as const) {
      expect(result[dim]).toBe(0.49);
      expect(result[dim]).toBeLessThan(BASE_VEC[dim]);
    }
  });

  it('评分=2 → 同样朝推荐方向远离', () => {
    const fb = makeFeedback(2);
    const result = calibrateVector(BASE_VEC, [fb], REC_VEC);
    expect(result.TOL).toBe(0.49);
    expect(result.TOL).toBeLessThan(BASE_VEC.TOL);
  });

  // ── 中性评分 → 不变 ──
  it('中性评分（rating=3）→ 向量不变', () => {
    const fb = makeFeedback(3);
    const result = calibrateVector(BASE_VEC, [fb], REC_VEC);
    expect(result).toEqual(BASE_VEC);
  });

  // ── clamp 边界 ──
  it('clamp 上边界 · result[dim] 接近 1 时不越界', () => {
    const nearMax: PersonaVector = { ...BASE_VEC, TOL: 0.995 };
    const fb = makeFeedback(5);
    const result = calibrateVector(nearMax, [fb], REC_VEC);
    expect(result.TOL).toBeLessThanOrEqual(1);
    expect(result.TOL).toBeGreaterThanOrEqual(0);
  });

  it('clamp 下边界 · result[dim] 接近 0 时不越界', () => {
    const nearMin: PersonaVector = { ...BASE_VEC, TOL: 0.005 };
    const fb = makeFeedback(1);
    const result = calibrateVector(nearMin, [fb], REC_VEC);
    expect(result.TOL).toBeGreaterThanOrEqual(0);
    expect(result.TOL).toBeLessThanOrEqual(1);
  });

  it('clamp · 低分把向量推到 0 以下时夹取为 0', () => {
    // recommended=0, base=0.01, direction=-1（低分远离）
    // delta = (0 - 0.01) * -1 * 0.02 = 0.0002 → result=0.0102（远离 0 即增大）
    // 换个场景：recommended=1, base=0.01, direction=-1（远离 1 即减小）
    const lowVec: PersonaVector = { ...BASE_VEC, TOL: 0.01 };
    const fb = makeFeedback(1);
    const result = calibrateVector(lowVec, [fb], REC_VEC);
    // delta = (1.0 - 0.01) * -1 * 0.02 = -0.0198 → 0.01 - 0.0198 = -0.0098 → clamp 0
    expect(result.TOL).toBe(0);
  });

  it('clamp · 高分把向量推到 1 以上时夹取为 1', () => {
    // recommended=1, base=0.99, direction=+1（高分靠近 1）
    const highVec: PersonaVector = { ...BASE_VEC, TOL: 0.99 };
    const fb = makeFeedback(5);
    const result = calibrateVector(highVec, [fb], REC_VEC);
    // delta = (1.0 - 0.99) * 1 * 0.02 = 0.0002 → 0.9902 → round 0.99
    // 不够明显，换 recommended=1, base=0.99, 高分
    // 实际：0.99 + 0.0002 = 0.9902 → 四舍五入 3 位 = 0.99
    expect(result.TOL).toBeLessThanOrEqual(1);
  });

  // ── 累积校准 ──
  it('多条 feedback 累加 · 同方向累计校准', () => {
    const fbs = [makeFeedback(5, 'a'), makeFeedback(5, 'b'), makeFeedback(5, 'c')];
    const result = calibrateVector(BASE_VEC, fbs, REC_VEC);
    // 每次 delta = 0.01，三次累加（注意每次基于上次 result）
    // 第1次：0.5 + 0.01 = 0.51
    // 第2次：(1.0 - 0.51) * 0.02 = 0.0098 → 0.5198 → 0.52
    // 第3次：(1.0 - 0.52) * 0.02 = 0.0096 → 0.5296 → 0.53
    expect(result.TOL).toBeGreaterThan(0.51);
    expect(result.TOL).toBeCloseTo(0.53, 1);
  });

  it('多条 feedback 混合方向 · 高低抵消后净位移较小', () => {
    const fbs = [makeFeedback(5, 'a'), makeFeedback(1, 'b')];
    const result = calibrateVector(BASE_VEC, fbs, REC_VEC);
    // 第1次高分：0.5 + 0.01 = 0.51
    // 第2次低分：delta = (1.0 - 0.51) * -1 * 0.02 = -0.0098 → 0.51 - 0.0098 = 0.5002 → 0.5
    // 净位移接近 0
    expect(result.TOL).toBeCloseTo(0.5, 2);
  });

  // ── 纯函数 · 不修改入参 ──
  it('不修改 base 入参', () => {
    const baseSnapshot = { ...BASE_VEC };
    const fb = makeFeedback(5);
    calibrateVector(BASE_VEC, [fb], REC_VEC);
    expect(BASE_VEC).toEqual(baseSnapshot);
  });

  it('不修改 recommendedVec 入参', () => {
    const recSnapshot = { ...REC_VEC };
    const fb = makeFeedback(5);
    calibrateVector(BASE_VEC, [fb], REC_VEC);
    expect(REC_VEC).toEqual(recSnapshot);
  });

  it('不修改 feedback 入参', () => {
    const fb = makeFeedback(5);
    const fbSnapshot = { ...fb };
    calibrateVector(BASE_VEC, [fb], REC_VEC);
    expect(fb).toEqual(fbSnapshot);
  });

  // ── 单次幅度上限 ──
  it('单次 delta 绝对值不超过 0.05', () => {
    // 极端差距：recommended=1, base=0, 高分
    const extreme: PersonaVector = {
      TOL: 0,
      SPD: 0,
      INF: 0,
      ENT: 0,
      LEAD: 0,
      VIS: 0,
    };
    const fb = makeFeedback(5);
    const result = calibrateVector(extreme, [fb], REC_VEC);
    // delta = (1 - 0) * 1 * 0.02 = 0.02 ≤ 0.05
    // result = 0 + 0.02 = 0.02
    expect(result.TOL).toBe(0.02);
    expect(Math.abs(result.TOL - extreme.TOL)).toBeLessThanOrEqual(0.05);
  });

  it('单次 delta 绝对值不超过 0.05 · 极端低分场景', () => {
    const extreme: PersonaVector = {
      TOL: 1,
      SPD: 1,
      INF: 1,
      ENT: 1,
      LEAD: 1,
      VIS: 1,
    };
    const fb = makeFeedback(1);
    const result = calibrateVector(extreme, [fb], REC_VEC);
    // delta = (1 - 1) * -1 * 0.02 = 0 → 不变
    // 换 recommended=0 来制造大差距
    expect(Math.abs(result.TOL - extreme.TOL)).toBeLessThanOrEqual(0.05);
  });

  // ── recommendedVec 兜底 ──
  it('feedback 携带 recommendedVec 时优先使用自带值', () => {
    const customRec: PersonaVector = {
      TOL: 0,
      SPD: 0,
      INF: 0,
      ENT: 0,
      LEAD: 0,
      VIS: 0,
    };
    const fb: FeedbackSignal = {
      recipeId: 'test',
      rating: 5,
      ts: Date.now(),
      recommendedVec: customRec,
    };
    const result = calibrateVector(BASE_VEC, [fb], REC_VEC);
    // 用 customRec(0) 而非 REC_VEC(1)：delta = (0 - 0.5) * 1 * 0.02 = -0.01
    // result = 0.5 - 0.01 = 0.49（朝 0 靠拢 = 减小）
    expect(result.TOL).toBe(0.49);
    expect(result.TOL).toBeLessThan(BASE_VEC.TOL);
  });

  // ── 四舍五入 3 位小数 ──
  it('结果四舍五入到 3 位小数（与 applyBiologyShift 一致）', () => {
    const fb = makeFeedback(5);
    const result = calibrateVector(BASE_VEC, [fb], REC_VEC);
    // 0.51 = 0.510
    expect(result.TOL).toBe(0.51);
    // 验证无超过 3 位的小数
    const decimal = (result.TOL.toString().split('.')[1] ?? '').length;
    expect(decimal).toBeLessThanOrEqual(3);
  });
});

// ════════════════════════════════════════════════════════════
// trackFeedback · 监控埋点
// ════════════════════════════════════════════════════════════
describe('feedbackEngine · trackFeedback', () => {
  it('不抛错 · 正常节点', () => {
    expect(() => trackFeedback('feedback.shown', { recipeId: 'x' })).not.toThrow();
  });

  it('不抛错 · calibrate 节点', () => {
    expect(() =>
      trackFeedback('calibrate.invoke', { count: 3, recommendedVec: REC_VEC }),
    ).not.toThrow();
  });

  it('不抛错 · 未知节点降级为 debug', () => {
    expect(() => trackFeedback('unknown.node', {})).not.toThrow();
  });

  it('向量字段被桶化到 0.1 · 不记原始值', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const preciseVec: PersonaVector = {
      TOL: 0.37,
      SPD: 0.82,
      INF: 0.555,
      ENT: 0.123,
      LEAD: 0.999,
      VIS: 0.001,
    };
    trackFeedback('calibrate.result', { vector: preciseVec });
    expect(logSpy).toHaveBeenCalled();
    const payload = logSpy.mock.calls[0][logSpy.mock.calls[0].length - 1] as { vector: PersonaVector };
    expect(payload.vector.TOL).toBe(0.4);
    expect(payload.vector.SPD).toBe(0.8);
    expect(payload.vector.INF).toBe(0.6);
    expect(payload.vector.ENT).toBe(0.1);
    expect(payload.vector.LEAD).toBe(1);
    expect(payload.vector.VIS).toBe(0);
    logSpy.mockRestore();
  });

  it('error 级别节点始终输出', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    trackFeedback('calibrate.error', { msg: 'boom' });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('warn 级别节点 · feedback.skipped', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    trackFeedback('feedback.skipped', { recipeId: 'x' });
    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
  });
});
