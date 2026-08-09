/**
 * 可编程酒馆 · 夜程编排引擎 · 纯函数模块
 *
 * 由「时间 × 主题」派生全场夜程状态：
 *   时间 → 夜程阶段（opening/rising/climax/closing）→ TavernState
 *
 * 与 journeyEngine 的关系：
 *   - tavernEngine = 全场背景 · 由时间驱动夜程曲线
 *   - journeyEngine = 个人前景 · 由情绪+强度驱动个人回路
 *   个人回路在全场夜程基调上叠加，二者阶段语义一致（复用 JourneyPhase）
 *
 * 纯函数，无副作用，可独立测试
 */

import type {
  TavernTheme,
  NightCurve,
  TavernState,
  NightWindow,
} from '../types/tavern';
import type { JourneyPhase } from '../types/journey';
import { JOURNEY_PHASE_META, JOURNEY_PHASE_ORDER } from '../data/journeyMeta';
import { DEFAULT_NIGHT_CURVE, DEFAULT_TAVERN_THEME } from '../data/tavernThemes';

const PHASES: JourneyPhase[] = JOURNEY_PHASE_ORDER;

// ═════════════════════════════════════════════════════════
// 时间解析工具
// ═════════════════════════════════════════════════════════

/** "HH:MM" → 当日分钟数（0-1439） */
export function parseHHMM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

/** 窗口是否跨日（end ≤ start 视为次日结束） */
export function isCrossDay(w: NightWindow): boolean {
  return parseHHMM(w.end) <= parseHHMM(w.start);
}

/** 当前分钟数是否落在窗口内（处理跨日） */
export function inWindow(nowMin: number, w: NightWindow): boolean {
  const start = parseHHMM(w.start);
  const end = parseHHMM(w.end);
  if (isCrossDay(w)) {
    return nowMin >= start || nowMin < end;
  }
  return nowMin >= start && nowMin < end;
}

// ═════════════════════════════════════════════════════════
// 夜程阶段解析
// ═════════════════════════════════════════════════════════

/**
 * 当前时刻是否落在夜程曲线的任一阶段窗口内
 * 用于 UI 区分「夜程进行中」与「非营业时段（夜未启）」
 *
 * @param date 指定时刻（默认当前时间）
 * @param curve 夜程曲线 · 默认 DEFAULT_NIGHT_CURVE
 */
export function isWithinNight(
  date: Date = new Date(),
  curve: NightCurve = DEFAULT_NIGHT_CURVE,
): boolean {
  const nowMin = date.getHours() * 60 + date.getMinutes();
  for (const phase of PHASES) {
    if (inWindow(nowMin, curve[phase])) return true;
  }
  return false;
}

/**
 * 由时间解析当前夜程阶段
 * 命中首个匹配窗口的阶段；非营业时间兜底返回 opening
 *
 * @param date 指定时刻（默认当前时间）· 便于测试与回放
 * @param curve 夜程曲线 · 默认 DEFAULT_NIGHT_CURVE
 */
export function getNightPhase(
  date: Date = new Date(),
  curve: NightCurve = DEFAULT_NIGHT_CURVE,
): JourneyPhase {
  const nowMin = date.getHours() * 60 + date.getMinutes();
  for (const phase of PHASES) {
    if (inWindow(nowMin, curve[phase])) return phase;
  }
  return 'opening';
}

// ═════════════════════════════════════════════════════════
// 进度计算
// ═════════════════════════════════════════════════════════

/** 当前阶段内进度 0-1 · 跨日窗口自动处理 */
export function getPhaseProgress(
  date: Date,
  w: NightWindow,
): number {
  const nowMin = date.getHours() * 60 + date.getMinutes();
  const start = parseHHMM(w.start);
  const end = parseHHMM(w.end);
  let span = end - start;
  if (span <= 0) span += 1440; // 跨日
  let elapsed = nowMin - start;
  if (elapsed < 0) elapsed += 1440;
  return Math.max(0, Math.min(1, elapsed / span));
}

/** 整夜进度 0-1 · 从 opening 起点到 closing 终点 */
export function getNightProgress(
  date: Date,
  curve: NightCurve = DEFAULT_NIGHT_CURVE,
): number {
  const nowMin = date.getHours() * 60 + date.getMinutes();
  const start = parseHHMM(curve.opening.start);
  const end = parseHHMM(curve.closing.end);
  let span = end - start;
  if (span <= 0) span += 1440;
  let elapsed = nowMin - start;
  if (elapsed < 0) elapsed += 1440;
  return Math.max(0, Math.min(1, elapsed / span));
}

// ═════════════════════════════════════════════════════════
// 派生酒馆状态
// ═════════════════════════════════════════════════════════

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 派生全场夜程状态 · 主题 × 时间 → TavernState
 *
 * @param theme 场所主题 · 默认深空夜航
 * @param date 指定时刻（默认当前时间）· 便于测试与回放
 * @param curve 夜程曲线 · 默认 DEFAULT_NIGHT_CURVE
 */
export function getTavernState(
  theme: TavernTheme = DEFAULT_TAVERN_THEME,
  date: Date = new Date(),
  curve: NightCurve = DEFAULT_NIGHT_CURVE,
): TavernState {
  const phase = getNightPhase(date, curve);
  const phaseMeta = JOURNEY_PHASE_META[phase];
  const tuning = theme.phaseTuning[phase];
  const pp = getPhaseProgress(date, curve[phase]);
  const np = getNightProgress(date, curve);

  // BPM 在阶段区间内按阶段进度线性插值
  const bpm = Math.round(lerp(tuning.bpmRange[0], tuning.bpmRange[1], pp));

  return {
    theme,
    phase,
    phaseMeta,
    withinNight: isWithinNight(date, curve),
    // 阶段调谐色已融合主题基调 · 直接作为该阶段环境光
    ambientColor: tuning.colorShift,
    ambientScentIntensity: tuning.scentIntensity,
    bpm,
    nightProgress: Math.round(np * 1000) / 1000,
    phaseProgress: Math.round(pp * 1000) / 1000,
  };
}
