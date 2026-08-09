/**
 * timeEngine · 单元测试
 * 覆盖时段划分、风味调整、融合逻辑的边界情况
 */

import { describe, it, expect } from 'vitest';
import {
  getTimeSlot,
  getTimeFlavorAdjustment,
  blendWithTime,
  applyBiologyShift,
  resolveTimeSlot,
  getDynamicVector,
  describeBiologyShift,
  TIME_SLOTS,
} from './timeEngine';
import type { FlavorPreference } from '../types/personality';
import type { PersonaVector } from '../types/personaFusion';

/** 构造指定小时的 Date（分秒归零） */
function atHour(hour: number): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** 全零偏好 · 边界用例 */
const ZERO_PREF: FlavorPreference = {
  sweet: 0,
  sour: 0,
  bitter: 0,
  strong: 0,
  smoky: 0,
  fruity: 0,
  herbal: 0,
  creamy: 0,
};

/** 均匀偏好 0.5 */
const UNIFORM_PREF: FlavorPreference = {
  sweet: 0.5,
  sour: 0.5,
  bitter: 0.5,
  strong: 0.5,
  smoky: 0.5,
  fruity: 0.5,
  herbal: 0.5,
  creamy: 0.5,
};

// ════════════════════════════════════════════════════════════
// getTimeSlot · 时段划分
// ════════════════════════════════════════════════════════════
describe('timeEngine · getTimeSlot', () => {
  it('5 点 → dawn（破晓）· 左闭', () => {
    expect(getTimeSlot(atHour(5)).slot).toBe('dawn');
  });

  it('8 点 → dawn', () => {
    expect(getTimeSlot(atHour(8)).slot).toBe('dawn');
  });

  it('9 点 → noon（白昼）· 右开', () => {
    expect(getTimeSlot(atHour(9)).slot).toBe('noon');
  });

  it('12 点 → noon', () => {
    expect(getTimeSlot(atHour(12)).slot).toBe('noon');
  });

  it('16 点 → noon', () => {
    expect(getTimeSlot(atHour(16)).slot).toBe('noon');
  });

  it('17 点 → dusk（暮色）', () => {
    expect(getTimeSlot(atHour(17)).slot).toBe('dusk');
  });

  it('18 点 → dusk', () => {
    expect(getTimeSlot(atHour(18)).slot).toBe('dusk');
  });

  it('19 点 → night（夜深）', () => {
    expect(getTimeSlot(atHour(19)).slot).toBe('night');
  });

  it('22 点 → night', () => {
    expect(getTimeSlot(atHour(22)).slot).toBe('night');
  });

  it('23 点 → midnight（子夜）', () => {
    expect(getTimeSlot(atHour(23)).slot).toBe('midnight');
  });

  it('0 点 → midnight（跨日）', () => {
    expect(getTimeSlot(atHour(0)).slot).toBe('midnight');
  });

  it('4 点 → midnight', () => {
    expect(getTimeSlot(atHour(4)).slot).toBe('midnight');
  });

  it('返回完整 TimeSlotInfo 结构', () => {
    const info = getTimeSlot(atHour(20));
    expect(info).toHaveProperty('slot');
    expect(info).toHaveProperty('label');
    expect(info).toHaveProperty('hourRange');
    expect(info).toHaveProperty('poem');
    expect(info).toHaveProperty('moodWeights');
    expect(info).toHaveProperty('auraColor');
  });

  it('TIME_SLOTS 包含 5 个时段 · 顺序正确', () => {
    expect(TIME_SLOTS).toHaveLength(5);
    expect(TIME_SLOTS.map((s) => s.slot)).toEqual([
      'dawn',
      'noon',
      'dusk',
      'night',
      'midnight',
    ]);
  });

  it('默认参数使用当前时间 · 不抛错', () => {
    expect(() => getTimeSlot()).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════
// getTimeFlavorAdjustment · 风味调整向量
// ════════════════════════════════════════════════════════════
describe('timeEngine · getTimeFlavorAdjustment', () => {
  it('返回八维完整的风味偏好', () => {
    const slot = getTimeSlot(atHour(20));
    const adj = getTimeFlavorAdjustment(slot);
    expect(Object.keys(adj).sort()).toEqual([
      'bitter',
      'creamy',
      'fruity',
      'herbal',
      'smoky',
      'sour',
      'strong',
      'sweet',
    ]);
  });

  it('所有值在 0-1 范围内', () => {
    for (const slot of TIME_SLOTS) {
      const adj = getTimeFlavorAdjustment(slot);
      for (const v of Object.values(adj)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('归一化后最高维度为 1.0', () => {
    for (const slot of TIME_SLOTS) {
      const adj = getTimeFlavorAdjustment(slot);
      const max = Math.max(...Object.values(adj));
      expect(max).toBeCloseTo(1.0, 1);
    }
  });

  it('night 时段（mystery+elegant）· smoky 和 herbal 应偏高', () => {
    const nightSlot = TIME_SLOTS.find((s) => s.slot === 'night')!;
    const adj = getTimeFlavorAdjustment(nightSlot);
    // mystery → smoky 0.7 · elegant → herbal 0.6
    expect(adj.smoky).toBeGreaterThan(0.5);
    expect(adj.herbal).toBeGreaterThan(0.4);
  });

  it('noon 时段（celebration+passion）· fruity 和 strong 应偏高', () => {
    const noonSlot = TIME_SLOTS.find((s) => s.slot === 'noon')!;
    const adj = getTimeFlavorAdjustment(noonSlot);
    // celebration → fruity 0.7 · passion → strong 0.8
    expect(adj.fruity).toBeGreaterThan(0.5);
    expect(adj.strong).toBeGreaterThan(0.5);
  });

  it('dawn 时段（calm+elegant）· herbal 应最高', () => {
    const dawnSlot = TIME_SLOTS.find((s) => s.slot === 'dawn')!;
    const adj = getTimeFlavorAdjustment(dawnSlot);
    // calm → herbal 0.7 × 0.5 = 0.35 · elegant → herbal 0.6 × 0.3 = 0.18 · 合计 0.53
    expect(adj.herbal).toBeGreaterThan(0.5);
  });

  it('不同时段产生不同调整向量', () => {
    const dawnAdj = getTimeFlavorAdjustment(TIME_SLOTS[0]);
    const nightAdj = getTimeFlavorAdjustment(TIME_SLOTS[3]);
    const diffs = Object.keys(dawnAdj).filter(
      (k) =>
        Math.abs(
          dawnAdj[k as keyof FlavorPreference] -
            nightAdj[k as keyof FlavorPreference],
        ) > 0.01,
    );
    expect(diffs.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════
// blendWithTime · 画像与时段融合
// ════════════════════════════════════════════════════════════
describe('timeEngine · blendWithTime', () => {
  it('profileWeight=1.0 · 结果等于画像偏好', () => {
    const slot = getTimeSlot(atHour(20));
    const blended = blendWithTime(UNIFORM_PREF, slot, 1.0);
    for (const [k, v] of Object.entries(UNIFORM_PREF)) {
      expect(blended[k as keyof FlavorPreference]).toBeCloseTo(v, 1);
    }
  });

  it('profileWeight=0.0 · 结果等于时段调整', () => {
    const slot = getTimeSlot(atHour(20));
    const timeAdj = getTimeFlavorAdjustment(slot);
    const blended = blendWithTime(UNIFORM_PREF, slot, 0.0);
    for (const k of Object.keys(timeAdj)) {
      expect(blended[k as keyof FlavorPreference]).toBeCloseTo(
        timeAdj[k as keyof FlavorPreference],
        1,
      );
    }
  });

  it('默认 profileWeight=0.6 · 结果在画像与时段之间', () => {
    const slot = getTimeSlot(atHour(20));
    const timeAdj = getTimeFlavorAdjustment(slot);
    const blended = blendWithTime(UNIFORM_PREF, slot); // 默认 0.6
    for (const k of Object.keys(UNIFORM_PREF)) {
      const profileVal = UNIFORM_PREF[k as keyof FlavorPreference];
      const timeVal = timeAdj[k as keyof FlavorPreference];
      const blendedVal = blended[k as keyof FlavorPreference];
      const min = Math.min(profileVal, timeVal);
      const max = Math.max(profileVal, timeVal);
      expect(blendedVal).toBeGreaterThanOrEqual(min - 0.01);
      expect(blendedVal).toBeLessThanOrEqual(max + 0.01);
    }
  });

  it('零画像 + 时段调整 · 结果 = 时段调整 × timeWeight', () => {
    const slot = getTimeSlot(atHour(20));
    const timeAdj = getTimeFlavorAdjustment(slot);
    const blended = blendWithTime(ZERO_PREF, slot, 0.6);
    for (const k of Object.keys(timeAdj)) {
      const expected = timeAdj[k as keyof FlavorPreference] * 0.4;
      expect(blended[k as keyof FlavorPreference]).toBeCloseTo(expected, 1);
    }
  });

  it('所有值在 0-1 范围内', () => {
    for (const slot of TIME_SLOTS) {
      const blended = blendWithTime(UNIFORM_PREF, slot, 0.6);
      for (const v of Object.values(blended)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('不同时段产生不同融合结果', () => {
    const dawnBlended = blendWithTime(UNIFORM_PREF, TIME_SLOTS[0], 0.6);
    const nightBlended = blendWithTime(UNIFORM_PREF, TIME_SLOTS[3], 0.6);
    const diffs = Object.keys(dawnBlended).filter(
      (k) =>
        Math.abs(
          dawnBlended[k as keyof FlavorPreference] -
            nightBlended[k as keyof FlavorPreference],
        ) > 0.01,
    );
    expect(diffs.length).toBeGreaterThan(0);
  });

  it('融合权重线性可加 · profile + time = 1.0', () => {
    // 验证数学性质：blended = profile × w + time × (1-w)
    const slot = getTimeSlot(atHour(20));
    const timeAdj = getTimeFlavorAdjustment(slot);
    const profileWeight = 0.7;
    const blended = blendWithTime(UNIFORM_PREF, slot, profileWeight);
    for (const k of Object.keys(UNIFORM_PREF)) {
      const expected =
        UNIFORM_PREF[k as keyof FlavorPreference] * profileWeight +
        timeAdj[k as keyof FlavorPreference] * (1 - profileWeight);
      expect(blended[k as keyof FlavorPreference]).toBeCloseTo(
        Math.round(expected * 100) / 100,
        1,
      );
    }
  });
});

// ════════════════════════════════════════════════════════════
// applyBiologyShift · 生物学时间校准
// ════════════════════════════════════════════════════════════

/** 测试用基础向量 · 全 0.5 */
const BASE_VECTOR: PersonaVector = {
  TOL: 0.5,
  SPD: 0.5,
  INF: 0.5,
  ENT: 0.5,
  LEAD: 0.5,
  VIS: 0.5,
};

describe('timeEngine · applyBiologyShift', () => {
  it('dawn 时段 · TOL+0.10 SPD+0.15 ENT-0.05 正确叠加', () => {
    const dawn = TIME_SLOTS.find((s) => s.slot === 'dawn')!;
    const shifted = applyBiologyShift(BASE_VECTOR, dawn);
    expect(shifted.TOL).toBeCloseTo(0.6, 2); // 0.5 + 0.10
    expect(shifted.SPD).toBeCloseTo(0.65, 2); // 0.5 + 0.15
    expect(shifted.ENT).toBeCloseTo(0.45, 2); // 0.5 - 0.05
    // 未指定偏移的维度保持原值
    expect(shifted.INF).toBe(0.5);
    expect(shifted.LEAD).toBe(0.5);
    expect(shifted.VIS).toBe(0.5);
  });

  it('midnight 时段 · VIS+0.20 TOL-0.15 SPD-0.20 正确叠加', () => {
    const midnight = TIME_SLOTS.find((s) => s.slot === 'midnight')!;
    const shifted = applyBiologyShift(BASE_VECTOR, midnight);
    expect(shifted.VIS).toBeCloseTo(0.7, 2); // 0.5 + 0.20
    expect(shifted.TOL).toBeCloseTo(0.35, 2); // 0.5 - 0.15
    expect(shifted.SPD).toBeCloseTo(0.3, 2); // 0.5 - 0.20
  });

  it('叠加后 clamp 到 [0,1] · 高值不超 1 · 低值不低于 0', () => {
    const highVector: PersonaVector = {
      TOL: 0.95, SPD: 0.9, INF: 0.5, ENT: 0.5, LEAD: 0.5, VIS: 0.5,
    };
    const dawn = TIME_SLOTS.find((s) => s.slot === 'dawn')!;
    const shifted = applyBiologyShift(highVector, dawn);
    expect(shifted.TOL).toBe(1); // 0.95 + 0.10 = 1.05 → clamp
    expect(shifted.SPD).toBe(1); // 0.9 + 0.15 = 1.05 → clamp

    const lowVector: PersonaVector = {
      TOL: 0.05, SPD: 0.1, INF: 0.5, ENT: 0.5, LEAD: 0.5, VIS: 0.5,
    };
    const midnight = TIME_SLOTS.find((s) => s.slot === 'midnight')!;
    const shiftedLow = applyBiologyShift(lowVector, midnight);
    expect(shiftedLow.TOL).toBe(0); // 0.05 - 0.15 = -0.10 → clamp
    expect(shiftedLow.SPD).toBe(0); // 0.1 - 0.20 = -0.10 → clamp
  });

  it('所有时段所有维度结果在 [0,1]', () => {
    for (const slot of TIME_SLOTS) {
      const shifted = applyBiologyShift(BASE_VECTOR, slot);
      for (const v of Object.values(shifted)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('不同时段产生不同偏移结果', () => {
    const dawnShifted = applyBiologyShift(BASE_VECTOR, TIME_SLOTS[0]);
    const midnightShifted = applyBiologyShift(BASE_VECTOR, TIME_SLOTS[4]);
    expect(dawnShifted).not.toEqual(midnightShifted);
  });

  it('不修改原始向量 · 纯函数无副作用', () => {
    const original = { ...BASE_VECTOR };
    const dawn = TIME_SLOTS.find((s) => s.slot === 'dawn')!;
    applyBiologyShift(BASE_VECTOR, dawn);
    expect(BASE_VECTOR).toEqual(original);
  });
});

// ════════════════════════════════════════════════════════════
// resolveTimeSlot · 时段解析（含手动覆盖）
// ════════════════════════════════════════════════════════════
describe('timeEngine · resolveTimeSlot', () => {
  it('manualOverride 优先于系统时间', () => {
    // 系统时间是 20 点（night）· 但 override 为 dawn
    const slot = resolveTimeSlot(atHour(20), 'dawn');
    expect(slot.slot).toBe('dawn');
  });

  it('null override · 回退系统时间', () => {
    const slot = resolveTimeSlot(atHour(20), null);
    expect(slot.slot).toBe('night');
  });

  it('每个 override 都能正确解析', () => {
    const overrides = ['dawn', 'noon', 'dusk', 'night', 'midnight'] as const;
    for (const o of overrides) {
      expect(resolveTimeSlot(atHour(0), o).slot).toBe(o);
    }
  });
});

// ════════════════════════════════════════════════════════════
// getDynamicVector · 动态向量组合
// ════════════════════════════════════════════════════════════
describe('timeEngine · getDynamicVector', () => {
  it('返回 { vector, slot } 结构', () => {
    const result = getDynamicVector(BASE_VECTOR, atHour(20), null);
    expect(result).toHaveProperty('vector');
    expect(result).toHaveProperty('slot');
    expect(result.slot.slot).toBe('night');
  });

  it('vector = applyBiologyShift(基础向量, slot)', () => {
    const result = getDynamicVector(BASE_VECTOR, atHour(6), null);
    const dawn = TIME_SLOTS.find((s) => s.slot === 'dawn')!;
    const expected = applyBiologyShift(BASE_VECTOR, dawn);
    expect(result.vector).toEqual(expected);
  });

  it('manualOverride 影响最终向量', () => {
    const sysResult = getDynamicVector(BASE_VECTOR, atHour(20), null);
    const overrideResult = getDynamicVector(BASE_VECTOR, atHour(20), 'dawn');
    expect(sysResult.vector).not.toEqual(overrideResult.vector);
    expect(overrideResult.slot.slot).toBe('dawn');
  });
});

// ════════════════════════════════════════════════════════════
// describeBiologyShift · 偏移描述
// ════════════════════════════════════════════════════════════
describe('timeEngine · describeBiologyShift', () => {
  it('dawn 返回 3 个偏移 · TOL/SPD/ENT', () => {
    const dawn = TIME_SLOTS.find((s) => s.slot === 'dawn')!;
    const desc = describeBiologyShift(dawn);
    expect(desc).toHaveLength(3);
    const dims = desc.map((d) => d.dim);
    expect(dims).toContain('TOL');
    expect(dims).toContain('SPD');
    expect(dims).toContain('ENT');
  });

  it('sign 正确 · 正偏移 + 负偏移', () => {
    const dawn = TIME_SLOTS.find((s) => s.slot === 'dawn')!;
    const desc = describeBiologyShift(dawn);
    const tol = desc.find((d) => d.dim === 'TOL')!;
    expect(tol.sign).toBe('+');
    const ent = desc.find((d) => d.dim === 'ENT')!;
    expect(ent.sign).toBe('-');
  });

  it('按绝对值降序排列', () => {
    for (const slot of TIME_SLOTS) {
      const desc = describeBiologyShift(slot);
      for (let i = 1; i < desc.length; i++) {
        expect(desc[i].delta).toBeLessThanOrEqual(desc[i - 1].delta);
      }
    }
  });

  it('midnight 含 VIS +0.20 与 SPD -0.20 · 绝对值并列最大', () => {
    const midnight = TIME_SLOTS.find((s) => s.slot === 'midnight')!;
    const desc = describeBiologyShift(midnight);
    const vis = desc.find((d) => d.dim === 'VIS')!;
    const spd = desc.find((d) => d.dim === 'SPD')!;
    expect(vis.delta).toBeCloseTo(0.2, 2);
    expect(vis.sign).toBe('+');
    expect(spd.delta).toBeCloseTo(0.2, 2);
    expect(spd.sign).toBe('-');
    // 两者绝对值并列最大 · 占据 desc 前两位
    expect(desc[0].delta).toBeCloseTo(0.2, 2);
    expect(desc[1].delta).toBeCloseTo(0.2, 2);
    expect(desc[2].delta).toBeLessThan(0.2); // TOL -0.15 排第三
  });
});

// ════════════════════════════════════════════════════════════
// TIME_SLOTS 生物学字段完整性
// ════════════════════════════════════════════════════════════
describe('timeEngine · TIME_SLOTS 生物学字段完整性', () => {
  it('每个时段都有 biologyNote / biologyShifts / orbSymbol / orbState', () => {
    for (const slot of TIME_SLOTS) {
      expect(typeof slot.biologyNote).toBe('string');
      expect(slot.biologyNote.length).toBeGreaterThan(0);
      expect(slot.biologyShifts).toBeDefined();
      expect(typeof slot.orbSymbol).toBe('string');
      expect(slot.orbSymbol.length).toBe(1);
      expect(typeof slot.orbState).toBe('string');
    }
  });

  it('biologyShifts 至少一个维度有偏移 · 值在 [-0.3, 0.3]', () => {
    for (const slot of TIME_SLOTS) {
      const keys = Object.keys(slot.biologyShifts);
      expect(keys.length).toBeGreaterThan(0);
      for (const v of Object.values(slot.biologyShifts)) {
        expect(Math.abs(v as number)).toBeLessThanOrEqual(0.3);
      }
    }
  });

  it('5 个 orbSymbol 唯一 · 日/咖/茶/酒/月', () => {
    const symbols = TIME_SLOTS.map((s) => s.orbSymbol);
    expect(new Set(symbols).size).toBe(5);
    expect(symbols).toEqual(['日', '咖', '茶', '酒', '月']);
  });

  it('5 个 orbState 唯一 · 起床/工作中/休闲/夜晚/入眠', () => {
    const states = TIME_SLOTS.map((s) => s.orbState);
    expect(new Set(states).size).toBe(5);
    expect(states).toEqual(['起床', '工作中', '休闲', '夜晚', '入眠']);
  });
});
