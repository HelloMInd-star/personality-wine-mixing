/**
 * 圆锥浓度引擎 · Concentration Engine
 *
 * 将金融 KMP→IPD→七维向量体系平移至味觉系统：
 *   C = m × ρ₀ / V(h)
 *
 * C  = 风味浓度（0-1 归一化）
 * m  = 有效风味溶质（滑条值加权和）
 * ρ₀ = 分子信源密度（基酒类型决定）
 * V(h) = 酒体空间容积（杯型 + 冰量决定）
 *
 * 三基准阈值：
 *   0.48 — 风味寡淡线（保本底线）
 *   0.50 — 口感均衡线（金线 · 稳态中轴）
 *   0.68 — 风味熔断线（越界警告）
 *
 * PID 负反馈调节：
 *   偏差 e = 0.50 - C
 *   输出 u = Kp·e + Ki·∫e + Kd·Δe
 *   自动收敛至 0.50 稳态
 */

import { logger } from './logger';

// ═════════════════════════════════════════════════════════
// 类型定义
// ═════════════════════════════════════════════════════════

/** 分子信源密度 · 基酒类型 */
export const SPIRIT_DENSITY: Record<string, number> = {
  sake: 0.85,          // 清酒 · 低密度
  whisky: 0.92,        // 威士忌 · 中高密度
  baijiu: 0.95,        // 白酒 · 高密度
  other: 0.78,         // 其他洋酒
};

/** 杯型容积系数 */
export const GLASS_VOLUME: Record<string, number> = {
  flute: 0.6,          // 笛形杯
  coupe: 0.8,          // 碟形杯
  rock: 1.0,           // 古典杯
  highball: 1.2,       // 高球杯
};

/** 冰量稀释系数 */
export const ICE_DILUTION: Record<string, number> = {
  none: 1.0,           // 不加冰
  single: 1.15,        // 单块冰
  crushed: 1.35,       // 碎冰
};

/** 风味参数 */
export interface FlavorParams {
  alcohol: number;     // 酒精度 0-1
  sweetness: number;   // 甜度 0-1
  sourness: number;    // 酸度 0-1
  bitterness: number;  // 苦度 0-1
  fruitiness: number;  // 果香 0-1
}

/** 溶剂配置 */
export interface SolventConfig {
  baseSpirit: keyof typeof SPIRIT_DENSITY;
  glassType: keyof typeof GLASS_VOLUME;
  ice: keyof typeof ICE_DILUTION;
  brand: string | null;
}

/** 浓度计算结果 */
export interface ConcentrationResult {
  /** 当前浓度 C */
  concentration: number;
  /** 是否在稳态区间 [0.48, 0.52] */
  isSteady: boolean;
  /** 当前阈值区间 */
  zone: 'below' | 'steady' | 'above' | 'fuse';
  /** 品质标签 */
  label: string;
  /** 溶质总量 m */
  soluteMass: number;
  /** 信源密度 ρ₀ */
  sourceDensity: number;
  /** 容积 V(h) */
  volume: number;
}

/** PID 状态 */
export interface PidState {
  integral: number;
  previousError: number;
  active: boolean;
}

/** 七维风味向量维度 */
export interface FlavorDimension {
  key: string;
  label: string;
  color: string;
  value: number;
}

// ═════════════════════════════════════════════════════════
// 阈值常量
// ═════════════════════════════════════════════════════════

export const THRESHOLDS = {
  BREAKEVEN: 0.48,   // 保本底线
  STEADY: 0.50,      // 稳态中轴
  FUSE: 0.68,        // 熔断线
} as const;

// PID 参数
const PID_KP = 0.35;  // 比例系数
const PID_KI = 0.08;  // 积分系数
const PID_KD = 0.12;  // 微分系数
const PID_DT = 0.1;   // 时间步长

// ═════════════════════════════════════════════════════════
// 圆锥浓度模型
// ═════════════════════════════════════════════════════════

/**
 * 计算有效风味溶质 m
 * 各滑条值加权求和，酒精度权重最高
 */
export function calcSoluteMass(params: FlavorParams): number {
  const weights = {
    alcohol: 0.30,
    sweetness: 0.25,
    sourness: 0.15,
    bitterness: 0.15,
    fruitiness: 0.15,
  };
  return (
    params.alcohol * weights.alcohol +
    params.sweetness * weights.sweetness +
    params.sourness * weights.sourness +
    params.bitterness * weights.bitterness +
    params.fruitiness * weights.fruitiness
  );
}

/**
 * 计算圆锥浓度 C = m × ρ₀ / V(h)
 */
export function calcConcentration(
  params: FlavorParams,
  config: SolventConfig,
): ConcentrationResult {
  const m = calcSoluteMass(params);
  const rho0 = SPIRIT_DENSITY[config.baseSpirit] || 0.85;
  const V = GLASS_VOLUME[config.glassType] * ICE_DILUTION[config.ice];

  const C = clamp01((m * rho0) / V);

  let zone: ConcentrationResult['zone'];
  let label: string;

  if (C < THRESHOLDS.BREAKEVEN) {
    zone = 'below';
    const diff = (THRESHOLDS.BREAKEVEN - C).toFixed(2);
    label = `寡淡 · 距保本线差 ${diff}`;
  } else if (C < THRESHOLDS.STEADY - 0.02) {
    zone = 'below';
    label = '接近寡淡 · 风味偏弱';
  } else if (C <= THRESHOLDS.STEADY + 0.02) {
    zone = 'steady';
    label = '均衡金线 · 口感完美';
  } else if (C < THRESHOLDS.FUSE) {
    zone = 'above';
    label = '浓郁饱满 · 风味充沛';
  } else {
    zone = 'fuse';
    label = '熔断警告 · 风味过载';
  }

  const isSteady = Math.abs(C - THRESHOLDS.STEADY) <= 0.02;

  return {
    concentration: round4(C),
    isSteady,
    zone,
    label,
    soluteMass: round4(m),
    sourceDensity: rho0,
    volume: round4(V),
  };
}

// ═════════════════════════════════════════════════════════
// PID 负反馈调节
// ═════════════════════════════════════════════════════════

/**
 * 创建 PID 状态
 */
export function createPidState(): PidState {
  return { integral: 0, previousError: 0, active: false };
}

/**
 * PID 一次迭代 · 返回风味参数调节建议
 *
 * @param currentC 当前浓度
 * @param state PID 状态（会被原地修改）
 * @returns 各滑条调节量 { alcohol, sweetness, sourness, bitterness, fruitiness }
 */
export function pidStep(
  currentC: number,
  state: PidState,
): Partial<FlavorParams> & { _debug: { error: number; p: number; i: number; d: number; output: number } } {
  const error = THRESHOLDS.STEADY - currentC;

  const p = PID_KP * error;
  state.integral += error * PID_DT;
  const i = PID_KI * state.integral;
  const d = PID_KD * (error - state.previousError) / PID_DT;
  state.previousError = error;

  const output = clamp01(p + i + d);

  // 按权重分配调节量到各滑条
  const delta = {
    alcohol: output * 0.30,
    sweetness: output * 0.25,
    sourness: output * 0.15,
    bitterness: output * 0.15,
    fruitiness: output * 0.15,
    _debug: {
      error: round4(error),
      p: round4(p),
      i: round4(i),
      d: round4(d),
      output: round4(output),
    },
  };

  logger.engine('PID:step', {
    currentC: round4(currentC),
    error: delta._debug.error,
    output: delta._debug.output,
    integral: round4(state.integral),
  });

  return delta;
}

/**
 * 应用 PID 调节量到风味参数
 */
export function applyPidDelta(
  params: FlavorParams,
  delta: Partial<FlavorParams>,
): FlavorParams {
  return {
    alcohol: clamp01(params.alcohol + (delta.alcohol || 0)),
    sweetness: clamp01(params.sweetness + (delta.sweetness || 0)),
    sourness: clamp01(params.sourness + (delta.sourness || 0)),
    bitterness: clamp01(params.bitterness + (delta.bitterness || 0)),
    fruitiness: clamp01(params.fruitiness + (delta.fruitiness || 0)),
  };
}

// ═════════════════════════════════════════════════════════
// 七维风味向量映射
// ═════════════════════════════════════════════════════════

/**
 * 将风味参数 + 浓度结果映射为七维向量
 *
 * 映射关系（与 BrewMusicPage 共享 RadarDimension 接口）：
 *   I  → 甜度
 *   P  → 酸度
 *   D  → 苦涩（苦度×0.7 + 酒精度×0.3）
 *   S  → 复杂度（果香×0.5 + 甜度×0.3 + 苦度×0.2）
 *   Dev-I → 浓度偏差 |C - 0.50|
 *   Dev1  → 均衡度（1 - 各维度方差）
 *   Dev2  → 酒精度
 */
export function toFlavorVector(
  params: FlavorParams,
  result: ConcentrationResult,
): FlavorDimension[] {
  const vals = [params.sweetness, params.sourness, params.bitterness, params.fruitiness, params.alcohol];
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  const balance = 1 - Math.sqrt(variance);

  return [
    {
      key: 'I',
      label: 'I 甜度',
      color: '#f59e0b',
      value: params.sweetness,
    },
    {
      key: 'P',
      label: 'P 酸度',
      color: '#a3e635',
      value: params.sourness,
    },
    {
      key: 'D',
      label: 'D 苦涩',
      color: '#94a3b8',
      value: params.bitterness * 0.7 + params.alcohol * 0.3,
    },
    {
      key: 'S',
      label: 'S 复杂度',
      color: '#c084fc',
      value: params.fruitiness * 0.5 + params.sweetness * 0.3 + params.bitterness * 0.2,
    },
    {
      key: 'DevI',
      label: 'Dev-I 偏差',
      color: '#f472b6',
      value: Math.abs(result.concentration - THRESHOLDS.STEADY) * 2,
    },
    {
      key: 'Dev1',
      label: 'Dev1 均衡',
      color: '#34d399',
      value: balance,
    },
    {
      key: 'Dev2',
      label: 'Dev2 酒精度',
      color: '#38bdf8',
      value: params.alcohol,
    },
  ];
}

// ═════════════════════════════════════════════════════════
// 工具
// ═════════════════════════════════════════════════════════

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function round4(v: number): number {
  return Number(v.toFixed(4));
}

export default {
  SPIRIT_DENSITY,
  GLASS_VOLUME,
  ICE_DILUTION,
  THRESHOLDS,
  calcSoluteMass,
  calcConcentration,
  createPidState,
  pidStep,
  applyPidDelta,
  toFlavorVector,
};