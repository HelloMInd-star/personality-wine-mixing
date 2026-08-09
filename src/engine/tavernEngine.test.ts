/**
 * tavernEngine · 单元测试
 * 覆盖时间解析、夜程阶段判断、进度计算、状态派生、跨日窗口
 */

import { describe, it, expect } from 'vitest';
import {
  parseHHMM,
  isCrossDay,
  inWindow,
  isWithinNight,
  getNightPhase,
  getPhaseProgress,
  getNightProgress,
  getTavernState,
} from './tavernEngine';
import { DEFAULT_NIGHT_CURVE, DEFAULT_TAVERN_THEME, TAVERN_THEMES, getTavernThemeByCode } from '../data/tavernThemes';
import { JOURNEY_PHASE_META, JOURNEY_PHASE_ORDER } from '../data/journeyMeta';
import type { NightCurve, NightWindow } from '../types/tavern';
import type { JourneyPhase } from '../types/journey';

// ═════════════════════════════════════════════════════════
// 工具 · 构造指定时刻的 Date（仅时分有效，年月日不影响计算）
// ═════════════════════════════════════════════════════════

function atTime(h: number, m: number): Date {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

// ═════════════════════════════════════════════════════════
// 时间解析工具
// ═════════════════════════════════════════════════════════

describe('tavernEngine · 时间解析', () => {
  it('parseHHMM · 标准格式', () => {
    expect(parseHHMM('20:00')).toBe(20 * 60);
    expect(parseHHMM('00:00')).toBe(0);
    expect(parseHHMM('23:59')).toBe(23 * 60 + 59);
    expect(parseHHMM('01:30')).toBe(90);
  });

  it('parseHHMM · 边界值', () => {
    expect(parseHHMM('00:00')).toBe(0);
    expect(parseHHMM('24:00')).toBe(1440); // 非标准但可解析
  });

  it('isCrossDay · end > start 不跨日', () => {
    expect(isCrossDay({ start: '20:00', end: '21:30' })).toBe(false);
    expect(isCrossDay({ start: '20:00', end: '23:59' })).toBe(false);
  });

  it('isCrossDay · end <= start 视为跨日', () => {
    expect(isCrossDay({ start: '23:00', end: '01:00' })).toBe(true);
    expect(isCrossDay({ start: '23:00', end: '23:00' })).toBe(true); // 零长度窗口也算跨日
  });

  it('inWindow · 普通窗口内', () => {
    const w: NightWindow = { start: '20:00', end: '21:30' };
    expect(inWindow(20 * 60, w)).toBe(true);
    expect(inWindow(21 * 60, w)).toBe(true);
    expect(inWindow(21 * 60 + 29, w)).toBe(true);
  });

  it('inWindow · 普通窗口边界（左闭右开）', () => {
    const w: NightWindow = { start: '20:00', end: '21:30' };
    expect(inWindow(20 * 60, w)).toBe(true); // start 闭
    expect(inWindow(21 * 60 + 30, w)).toBe(false); // end 开
    expect(inWindow(19 * 60 + 59, w)).toBe(false);
  });

  it('inWindow · 跨日窗口前段（≥start）', () => {
    const w: NightWindow = { start: '23:00', end: '01:00' };
    expect(inWindow(23 * 60, w)).toBe(true);
    expect(inWindow(23 * 60 + 30, w)).toBe(true);
    expect(inWindow(23 * 60 + 59, w)).toBe(true);
  });

  it('inWindow · 跨日窗口后段（<end）', () => {
    const w: NightWindow = { start: '23:00', end: '01:00' };
    expect(inWindow(0, w)).toBe(true); // 00:00
    expect(inWindow(30, w)).toBe(true); // 00:30
    expect(inWindow(60, w)).toBe(false); // 01:00 开区间
  });

  it('inWindow · 跨日窗口外', () => {
    const w: NightWindow = { start: '23:00', end: '01:00' };
    expect(inWindow(22 * 60, w)).toBe(false);
    expect(inWindow(12 * 60, w)).toBe(false);
    expect(inWindow(2 * 60, w)).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════
// 夜程阶段判断
// ═════════════════════════════════════════════════════════

describe('tavernEngine · 夜程阶段判断', () => {
  it('opening · 20:00-21:30', () => {
    expect(getNightPhase(atTime(20, 0), DEFAULT_NIGHT_CURVE)).toBe('opening');
    expect(getNightPhase(atTime(21, 0), DEFAULT_NIGHT_CURVE)).toBe('opening');
    expect(getNightPhase(atTime(21, 29), DEFAULT_NIGHT_CURVE)).toBe('opening');
  });

  it('rising · 21:30-23:00', () => {
    expect(getNightPhase(atTime(21, 30), DEFAULT_NIGHT_CURVE)).toBe('rising');
    expect(getNightPhase(atTime(22, 0), DEFAULT_NIGHT_CURVE)).toBe('rising');
    expect(getNightPhase(atTime(22, 59), DEFAULT_NIGHT_CURVE)).toBe('rising');
  });

  it('climax · 23:00-01:00（跨日）', () => {
    expect(getNightPhase(atTime(23, 0), DEFAULT_NIGHT_CURVE)).toBe('climax');
    expect(getNightPhase(atTime(23, 59), DEFAULT_NIGHT_CURVE)).toBe('climax');
    expect(getNightPhase(atTime(0, 0), DEFAULT_NIGHT_CURVE)).toBe('climax');
    expect(getNightPhase(atTime(0, 30), DEFAULT_NIGHT_CURVE)).toBe('climax');
    expect(getNightPhase(atTime(0, 59), DEFAULT_NIGHT_CURVE)).toBe('climax');
  });

  it('closing · 01:00-03:00（跨日）', () => {
    expect(getNightPhase(atTime(1, 0), DEFAULT_NIGHT_CURVE)).toBe('closing');
    expect(getNightPhase(atTime(2, 0), DEFAULT_NIGHT_CURVE)).toBe('closing');
    expect(getNightPhase(atTime(2, 59), DEFAULT_NIGHT_CURVE)).toBe('closing');
  });

  it('非营业时间兜底 opening', () => {
    // 18:00 在开场前
    expect(getNightPhase(atTime(18, 0), DEFAULT_NIGHT_CURVE)).toBe('opening');
    // 04:00 在收尾后
    expect(getNightPhase(atTime(4, 0), DEFAULT_NIGHT_CURVE)).toBe('opening');
    // 12:00 中午
    expect(getNightPhase(atTime(12, 0), DEFAULT_NIGHT_CURVE)).toBe('opening');
  });

  it('阶段窗口左闭右开', () => {
    // opening 结束 21:30 = rising 开始 → 21:30 应属 rising
    expect(getNightPhase(atTime(21, 30), DEFAULT_NIGHT_CURVE)).toBe('rising');
    // rising 结束 23:00 = climax 开始 → 23:00 应属 climax
    expect(getNightPhase(atTime(23, 0), DEFAULT_NIGHT_CURVE)).toBe('climax');
    // climax 结束 01:00 = closing 开始 → 01:00 应属 closing
    expect(getNightPhase(atTime(1, 0), DEFAULT_NIGHT_CURVE)).toBe('closing');
  });

  it('默认 curve 参数等价于显式传入', () => {
    expect(getNightPhase(atTime(22, 0))).toBe(
      getNightPhase(atTime(22, 0), DEFAULT_NIGHT_CURVE),
    );
  });

  it('自定义 curve · 全部不跨日', () => {
    const curve: NightCurve = {
      opening: { start: '18:00', end: '19:00' },
      rising: { start: '19:00', end: '20:00' },
      climax: { start: '20:00', end: '21:00' },
      closing: { start: '21:00', end: '22:00' },
    };
    expect(getNightPhase(atTime(18, 30), curve)).toBe('opening');
    expect(getNightPhase(atTime(19, 30), curve)).toBe('rising');
    expect(getNightPhase(atTime(20, 30), curve)).toBe('climax');
    expect(getNightPhase(atTime(21, 30), curve)).toBe('closing');
  });
});

// ═════════════════════════════════════════════════════════
// 是否在夜程窗口内
// ═════════════════════════════════════════════════════════

describe('tavernEngine · 是否在夜程窗口内', () => {
  it('各阶段中段时刻 → true', () => {
    expect(isWithinNight(atTime(20, 45), DEFAULT_NIGHT_CURVE)).toBe(true); // opening
    expect(isWithinNight(atTime(22, 15), DEFAULT_NIGHT_CURVE)).toBe(true); // rising
    expect(isWithinNight(atTime(0, 0), DEFAULT_NIGHT_CURVE)).toBe(true); // climax 跨日
    expect(isWithinNight(atTime(2, 0), DEFAULT_NIGHT_CURVE)).toBe(true); // closing 跨日
  });

  it('阶段边界左闭右开 → 左 true 右 false', () => {
    // opening 20:00-21:30
    expect(isWithinNight(atTime(20, 0), DEFAULT_NIGHT_CURVE)).toBe(true);
    expect(isWithinNight(atTime(21, 30), DEFAULT_NIGHT_CURVE)).toBe(true); // 属 rising
    // closing 01:00-03:00
    expect(isWithinNight(atTime(3, 0), DEFAULT_NIGHT_CURVE)).toBe(false); // 右开
  });

  it('非营业时段 → false', () => {
    expect(isWithinNight(atTime(12, 0), DEFAULT_NIGHT_CURVE)).toBe(false);
    expect(isWithinNight(atTime(18, 0), DEFAULT_NIGHT_CURVE)).toBe(false);
    expect(isWithinNight(atTime(4, 0), DEFAULT_NIGHT_CURVE)).toBe(false);
    expect(isWithinNight(atTime(19, 59), DEFAULT_NIGHT_CURVE)).toBe(false);
  });

  it('默认 curve 参数等价于显式传入', () => {
    expect(isWithinNight(atTime(22, 0))).toBe(
      isWithinNight(atTime(22, 0), DEFAULT_NIGHT_CURVE),
    );
  });
});

// ═════════════════════════════════════════════════════════
// 阶段内进度
// ═════════════════════════════════════════════════════════

describe('tavernEngine · 阶段内进度', () => {
  it('起点进度 0', () => {
    const w: NightWindow = { start: '20:00', end: '21:30' };
    expect(getPhaseProgress(atTime(20, 0), w)).toBe(0);
  });

  it('终点外进度 1（右开区间 clamp）', () => {
    const w: NightWindow = { start: '20:00', end: '21:30' };
    expect(getPhaseProgress(atTime(21, 30), w)).toBe(1);
    expect(getPhaseProgress(atTime(22, 0), w)).toBe(1);
  });

  it('中点 0.5', () => {
    // 20:00-21:30 共 90 分钟，中点 20:45
    const w: NightWindow = { start: '20:00', end: '21:30' };
    expect(getPhaseProgress(atTime(20, 45), w)).toBeCloseTo(0.5, 5);
  });

  it('窗口前时刻 · 视为前一轮尾部 → clamp 1', () => {
    // 实现语义：窗口前的时刻被当作"前一轮的尾部"
    // elapsed = nowMin - start < 0 → += 1440 → 远超 span → clamp 1
    const w: NightWindow = { start: '20:00', end: '21:30' };
    expect(getPhaseProgress(atTime(18, 0), w)).toBe(1);
  });

  it('跨日窗口 · 23:00-01:00 起点 0', () => {
    const w: NightWindow = { start: '23:00', end: '01:00' };
    expect(getPhaseProgress(atTime(23, 0), w)).toBe(0);
  });

  it('跨日窗口 · 00:00 中点 0.5', () => {
    // 23:00-01:00 共 120 分钟，00:00 已过 60 分钟
    const w: NightWindow = { start: '23:00', end: '01:00' };
    expect(getPhaseProgress(atTime(0, 0), w)).toBeCloseTo(0.5, 5);
  });

  it('跨日窗口 · 00:59 接近 1', () => {
    const w: NightWindow = { start: '23:00', end: '01:00' };
    // 00:59 已过 119 分钟 / 120
    expect(getPhaseProgress(atTime(0, 59), w)).toBeCloseTo(119 / 120, 5);
  });
});

// ═════════════════════════════════════════════════════════
// 整夜进度
// ═════════════════════════════════════════════════════════

describe('tavernEngine · 整夜进度', () => {
  it('opening 起点 · 整夜进度 0', () => {
    expect(getNightProgress(atTime(20, 0), DEFAULT_NIGHT_CURVE)).toBe(0);
  });

  it('closing 终点 · 整夜进度 1', () => {
    // closing 结束 03:00，是整夜终点
    expect(getNightProgress(atTime(3, 0), DEFAULT_NIGHT_CURVE)).toBe(1);
  });

  it('非营业时段 · 整夜前视为前一轮尾部 → clamp 1', () => {
    // 实现语义同 getPhaseProgress：窗口前时刻 elapsed += 1440 → 超 span → clamp 1
    expect(getNightProgress(atTime(18, 0), DEFAULT_NIGHT_CURVE)).toBe(1);
  });

  it('非营业时段 · 整夜后 clamp 1', () => {
    expect(getNightProgress(atTime(4, 0), DEFAULT_NIGHT_CURVE)).toBe(1);
  });

  it('climax 中点（00:00）· 整夜进度约为 0.5', () => {
    // 20:00 起，03:00 终，共 7h = 420 分钟
    // 00:00 距 20:00 共 4h = 240 分钟 → 240/420 ≈ 0.571
    const p = getNightProgress(atTime(0, 0), DEFAULT_NIGHT_CURVE);
    expect(p).toBeCloseTo(240 / 420, 3);
  });
});

// ═════════════════════════════════════════════════════════
// 派生酒馆状态
// ═════════════════════════════════════════════════════════

describe('tavernEngine · 派生酒馆状态', () => {
  it('返回完整 TavernState 结构', () => {
    const s = getTavernState(DEFAULT_TAVERN_THEME, atTime(22, 0));
    expect(s).toHaveProperty('theme');
    expect(s).toHaveProperty('phase');
    expect(s).toHaveProperty('phaseMeta');
    expect(s).toHaveProperty('withinNight');
    expect(s).toHaveProperty('ambientColor');
    expect(s).toHaveProperty('ambientScentIntensity');
    expect(s).toHaveProperty('bpm');
    expect(s).toHaveProperty('nightProgress');
    expect(s).toHaveProperty('phaseProgress');
  });

  it('withinNight · 夜程窗口内 true', () => {
    expect(getTavernState(DEFAULT_TAVERN_THEME, atTime(22, 0)).withinNight).toBe(true);
    expect(getTavernState(DEFAULT_TAVERN_THEME, atTime(0, 0)).withinNight).toBe(true);
  });

  it('withinNight · 非营业时段 false', () => {
    expect(getTavernState(DEFAULT_TAVERN_THEME, atTime(12, 0)).withinNight).toBe(false);
    expect(getTavernState(DEFAULT_TAVERN_THEME, atTime(18, 0)).withinNight).toBe(false);
  });

  it('phase 与 phaseMeta 一致', () => {
    for (const phase of JOURNEY_PHASE_ORDER) {
      // 为每个阶段构造一个命中时间
      const time = phaseTime(phase);
      const s = getTavernState(DEFAULT_TAVERN_THEME, time);
      expect(s.phase).toBe(phase);
      expect(s.phaseMeta).toEqual(JOURNEY_PHASE_META[phase]);
    }
  });

  it('ambientColor 取主题阶段调谐色', () => {
    const s = getTavernState(DEFAULT_TAVERN_THEME, atTime(22, 0));
    expect(s.ambientColor).toBe(DEFAULT_TAVERN_THEME.phaseTuning.rising.colorShift);
  });

  it('ambientScentIntensity 取主题阶段调谐强度', () => {
    const s = getTavernState(DEFAULT_TAVERN_THEME, atTime(23, 30));
    expect(s.ambientScentIntensity).toBe(DEFAULT_TAVERN_THEME.phaseTuning.climax.scentIntensity);
  });

  it('bpm 落在阶段区间内', () => {
    // rising 22:00 · 区间 [80, 95]
    const s = getTavernState(DEFAULT_TAVERN_THEME, atTime(22, 0));
    const [lo, hi] = DEFAULT_TAVERN_THEME.phaseTuning.rising.bpmRange;
    expect(s.bpm).toBeGreaterThanOrEqual(lo);
    expect(s.bpm).toBeLessThanOrEqual(hi);
  });

  it('bpm · 阶段起点等于区间下限', () => {
    const s = getTavernState(DEFAULT_TAVERN_THEME, atTime(21, 30)); // rising 起点
    expect(s.bpm).toBe(DEFAULT_TAVERN_THEME.phaseTuning.rising.bpmRange[0]);
  });

  it('bpm · 阶段终点等于区间上限', () => {
    // rising 终点 23:00（实际属 climax），取 climax 起点
    const s = getTavernState(DEFAULT_TAVERN_THEME, atTime(23, 0)); // climax 起点
    expect(s.bpm).toBe(DEFAULT_TAVERN_THEME.phaseTuning.climax.bpmRange[0]);
  });

  it('nightProgress ∈ [0,1]', () => {
    const times = [atTime(20, 0), atTime(22, 0), atTime(0, 0), atTime(3, 0), atTime(12, 0)];
    for (const t of times) {
      const np = getTavernState(DEFAULT_TAVERN_THEME, t).nightProgress;
      expect(np).toBeGreaterThanOrEqual(0);
      expect(np).toBeLessThanOrEqual(1);
    }
  });

  it('phaseProgress ∈ [0,1]', () => {
    const times = [atTime(20, 0), atTime(22, 0), atTime(0, 0), atTime(3, 0), atTime(12, 0)];
    for (const t of times) {
      const pp = getTavernState(DEFAULT_TAVERN_THEME, t).phaseProgress;
      expect(pp).toBeGreaterThanOrEqual(0);
      expect(pp).toBeLessThanOrEqual(1);
    }
  });

  it('进度保留 3 位小数', () => {
    const s = getTavernState(DEFAULT_TAVERN_THEME, atTime(22, 7));
    // 验证小数位不超过 3
    const npStr = s.nightProgress.toString();
    const ppStr = s.phaseProgress.toString();
    if (npStr.includes('.')) {
      expect(npStr.split('.')[1].length).toBeLessThanOrEqual(3);
    }
    if (ppStr.includes('.')) {
      expect(ppStr.split('.')[1].length).toBeLessThanOrEqual(3);
    }
  });

  it('默认参数等价于显式传入', () => {
    const a = getTavernState();
    const b = getTavernState(DEFAULT_TAVERN_THEME, new Date(), DEFAULT_NIGHT_CURVE);
    // 仅比较结构（时间相同，结果一致）
    expect(a.phase).toBe(b.phase);
    expect(a.theme).toBe(b.theme);
  });

  it('切换主题 · 同一时刻状态不同', () => {
    const deep = getTavernState(TAVERN_THEMES[0], atTime(22, 0));
    const ember = getTavernState(TAVERN_THEMES[2], atTime(22, 0));
    expect(deep.ambientColor).not.toBe(ember.ambientColor);
    expect(deep.bpm).not.toBe(ember.bpm);
  });

  it('非营业时间 · 兜底 opening 阶段', () => {
    const s = getTavernState(DEFAULT_TAVERN_THEME, atTime(12, 0));
    expect(s.phase).toBe('opening');
    expect(s.phaseMeta).toEqual(JOURNEY_PHASE_META.opening);
  });
});

// ═════════════════════════════════════════════════════════
// 主题库
// ═════════════════════════════════════════════════════════

describe('tavernEngine · 主题库', () => {
  it('TAVERN_THEMES 至少 4 套主题', () => {
    expect(TAVERN_THEMES.length).toBeGreaterThanOrEqual(4);
  });

  it('每套主题含四阶段调谐', () => {
    for (const theme of TAVERN_THEMES) {
      for (const phase of JOURNEY_PHASE_ORDER) {
        expect(theme.phaseTuning).toHaveProperty(phase);
        const t = theme.phaseTuning[phase];
        expect(typeof t.colorShift).toBe('string');
        expect(t.bpmRange[0]).toBeLessThanOrEqual(t.bpmRange[1]);
        expect(t.scentIntensity).toBeGreaterThanOrEqual(0);
        expect(t.scentIntensity).toBeLessThanOrEqual(1);
      }
    }
  });

  it('DEFAULT_TAVERN_THEME 是 TAVERN_THEMES[0]', () => {
    expect(DEFAULT_TAVERN_THEME).toBe(TAVERN_THEMES[0]);
  });

  it('getTavernThemeByCode · 命中', () => {
    expect(getTavernThemeByCode('deep-space')).toBe(TAVERN_THEMES[0]);
    expect(getTavernThemeByCode('ember-forge').code).toBe('ember-forge');
  });

  it('getTavernThemeByCode · 未命中兜底首个', () => {
    expect(getTavernThemeByCode('non-exist')).toBe(TAVERN_THEMES[0]);
    expect(getTavernThemeByCode('')).toBe(TAVERN_THEMES[0]);
  });

  it('主题 code 唯一', () => {
    const codes = TAVERN_THEMES.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

// ═════════════════════════════════════════════════════════
// 辅助
// ═════════════════════════════════════════════════════════

/** 取每个阶段的中段时刻 · 用于遍历验证 */
function phaseTime(phase: JourneyPhase): Date {
  switch (phase) {
    case 'opening':
      return atTime(20, 45); // 20:00-21:30 中点
    case 'rising':
      return atTime(22, 15); // 21:30-23:00 中点
    case 'climax':
      return atTime(0, 0); // 23:00-01:00 中点
    case 'closing':
      return atTime(2, 0); // 01:00-03:00 中点
  }
}
