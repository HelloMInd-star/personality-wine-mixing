/**
 * timeEngine · 时间感知引擎
 * 让推荐随夜的深浅呼吸
 *
 * 设计：
 *   - 把一天分为 5 个时段，每个时段有不同的情绪倾向
 *   - 情绪映射到八维风味的调整向量
 *   - 与人格画像的风味偏好按权重融合（默认 profile 0.6 + time 0.4）
 *
 * 纯函数，无副作用，可独立测试
 */

import type { FlavorKey, MoodTag } from '../types/cocktail';
import type { FlavorPreference } from '../types/personality';
import type { PersonaVector, PersonaDim } from '../types/personaFusion';
import { MOOD_FLAVOR_MAP } from '../data/moodMeta';

/** 八维风味键 · 顺序固定，用于遍历 */
const FLAVOR_KEYS: FlavorKey[] = [
  'sweet',
  'sour',
  'bitter',
  'strong',
  'smoky',
  'fruity',
  'herbal',
  'creamy',
];

/** 六维人格向量维度键 · 顺序固定，用于遍历 */
const PERSONA_DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

/** 时段标识 · 一日五段 */
export type TimeSlot = 'dawn' | 'noon' | 'dusk' | 'night' | 'midnight';

/** 时段信息 · 供引擎计算与 UI 展示共用 */
export interface TimeSlotInfo {
  slot: TimeSlot;
  /** 中文标签 */
  label: string;
  /** 时段范围（24h 制，左闭右开）· midnight 跨日时为 [23, 5] */
  hourRange: [number, number];
  /** 诗化描述 · 供 UI 渲染氛围 */
  poem: string;
  /** 情绪权重 · 用于生成风味调整向量 */
  moodWeights: Partial<Record<MoodTag, number>>;
  /** 时段主色 · 用于 UI 氛围背景 */
  auraColor: string;
  /** 生物学依据 · 生理指标在该时段的状态描述（皮质醇/褪黑素/睾酮/血清素/代谢） */
  biologyNote: string;
  /** 人格向量偏移系数 · 基于生物学昼夜节律，叠加到基础 PersonaVector */
  biologyShifts: Partial<PersonaVector>;
  /** 对应的宇宙星球符号（入口页 5 星球交互用）· 太阳/咖啡/茶/酒杯/月亮 */
  orbSymbol: string;
  /** 星球对应的日常状态 · 起床/工作中/休闲/夜晚/入眠 */
  orbState: string;
}

/**
 * 时段定义表 · 顺序即一日进程
 * 边界规则：左闭右开 [start, end)，midnight 跨日特殊处理
 */
export const TIME_SLOTS: TimeSlotInfo[] = [
  {
    slot: 'dawn',
    label: '破晓',
    hourRange: [5, 9],
    poem: '夜将尽，第一缕光落进杯里。',
    moodWeights: { calm: 0.5, elegant: 0.3 },
    auraColor: '#e8c4a0',
    // 生物学：皮质醇峰值（起床后）→ 决策偏快、偏果断
    // 影响：决策速度 SPD↑、不确定性承载力 TOL↑、情绪熵值 ENT↓
    biologyNote: '皮质醇峰值 · 决策快而果断',
    biologyShifts: { TOL: 0.10, SPD: 0.15, ENT: -0.05 },
    orbSymbol: '日',
    orbState: '起床',
  },
  {
    slot: 'noon',
    label: '白昼',
    hourRange: [9, 17],
    poem: '阳光太满，需要一杯让心慢下来。',
    moodWeights: { celebration: 0.4, passion: 0.3 },
    auraColor: '#f0c674',
    // 生物学：血清素峰值 → 情绪稳定、思路清晰
    // 影响：情绪熵值 ENT↓、愿景直觉 VIS↑、认知信息依赖 INF↑
    biologyNote: '血清素峰值 · 情绪稳而思清晰',
    biologyShifts: { ENT: -0.10, VIS: 0.10, INF: 0.05 },
    orbSymbol: '咖',
    orbState: '工作中',
  },
  {
    slot: 'dusk',
    label: '暮色',
    hourRange: [17, 19],
    poem: '天光将熄，思念有了颜色。',
    moodWeights: { romantic: 0.4, melancholy: 0.3 },
    auraColor: '#c97b5a',
    // 生物学：睾酮开始下降 → 风险偏好降低
    // 影响：不确定性承载力 TOL↓、领导力感召 LEAD↓、决策速度 SPD↓
    biologyNote: '睾酮下降 · 风险偏好降低',
    biologyShifts: { TOL: -0.10, LEAD: -0.05, SPD: -0.05 },
    orbSymbol: '茶',
    orbState: '休闲',
  },
  {
    slot: 'night',
    label: '夜深',
    hourRange: [19, 23],
    poem: '夜正式开始，杯沿沾着星光。',
    moodWeights: { mystery: 0.4, elegant: 0.3 },
    auraColor: '#5d44a0',
    // 生物学：褪黑素上升 → 直觉偏强、情绪敏感
    // 影响：愿景直觉 VIS↑、情绪熵值 ENT↑、认知信息依赖 INF↓
    biologyNote: '褪黑素上升 · 直觉强而情敏感',
    biologyShifts: { VIS: 0.15, ENT: 0.10, INF: -0.10 },
    orbSymbol: '酒',
    orbState: '夜晚',
  },
  {
    slot: 'midnight',
    label: '子夜',
    hourRange: [23, 5],
    poem: '世界睡了，只剩杯与自己。',
    moodWeights: { melancholy: 0.5, calm: 0.3 },
    auraColor: '#2d1b4e',
    // 生物学：褪黑素峰值 → 高直觉、低理性
    // 影响：愿景直觉 VIS↑↑、不确定性承载力 TOL↓↓、决策速度 SPD↓↓
    biologyNote: '褪黑素峰值 · 高直觉而低理性',
    biologyShifts: { VIS: 0.20, TOL: -0.15, SPD: -0.20 },
    orbSymbol: '月',
    orbState: '入眠',
  },
];

/**
 * 根据日期获取当前时段
 * 边界规则：左闭右开 [start, end)，midnight 跨日（23-5 点）
 *
 * @example
 *   getTimeSlot(atHour(20))  // → night
 *   getTimeSlot(atHour(2))   // → midnight
 */
export function getTimeSlot(date: Date = new Date()): TimeSlotInfo {
  const hour = date.getHours();

  // midnight 跨日：[23, 24) ∪ [0, 5)
  if (hour >= 23 || hour < 5) {
    return TIME_SLOTS[4]; // midnight
  }

  // 其余时段按 hourRange 左闭右开匹配
  for (const slot of TIME_SLOTS) {
    if (slot.slot === 'midnight') continue;
    const [start, end] = slot.hourRange;
    if (hour >= start && hour < end) {
      return slot;
    }
  }

  // 兜底（理论上不可达）
  return TIME_SLOTS[3]; // night
}

/**
 * 根据时段生成风味调整向量
 * 把时段的 moodWeights 映射到八维风味空间
 *
 * 算法：
 *   1. 对每个情绪，取其 MOOD_FLAVOR_MAP 中的风味值
 *   2. 按 moodWeight 加权累加到八维
 *   3. 归一化到 0-1（除以最大值，使最高维为 1.0）
 */
export function getTimeFlavorAdjustment(slot: TimeSlotInfo): FlavorPreference {
  const accumulated: FlavorPreference = {
    sweet: 0,
    sour: 0,
    bitter: 0,
    strong: 0,
    smoky: 0,
    fruity: 0,
    herbal: 0,
    creamy: 0,
  };

  // 按情绪权重累加风味
  for (const [mood, weight] of Object.entries(slot.moodWeights)) {
    const flavorMap = MOOD_FLAVOR_MAP[mood as MoodTag];
    if (!flavorMap) continue;
    for (const key of FLAVOR_KEYS) {
      const v = flavorMap[key] ?? 0;
      accumulated[key] += v * (weight as number);
    }
  }

  // 归一化到 0-1（除以最大值，使最高维 = 1.0）
  const max = Math.max(
    ...FLAVOR_KEYS.map((k) => accumulated[k]),
    0.001, // 防除零
  );
  for (const key of FLAVOR_KEYS) {
    accumulated[key] = Math.round((accumulated[key] / max) * 100) / 100;
  }

  return accumulated;
}

/**
 * 融合画像偏好与时段调整
 * 默认 profile 0.6 + time 0.4
 *
 * @param profilePref 人格画像生成的风味偏好（0-1）
 * @param slot 当前时段
 * @param profileWeight 画像权重（0-1），默认 0.6
 * @returns 融合后的风味偏好（0-1），四舍五入至 2 位小数
 *
 * @example
 *   // 画像主导，时段微调
 *   blendWithTime(profile.flavorPreference, getTimeSlot())
 *   // 纯时段推荐（无画像）
 *   blendWithTime(zeroPref, slot, 0)
 */
export function blendWithTime(
  profilePref: FlavorPreference,
  slot: TimeSlotInfo,
  profileWeight = 0.6,
): FlavorPreference {
  const timeWeight = 1 - profileWeight;
  const timeAdjustment = getTimeFlavorAdjustment(slot);

  const blended: FlavorPreference = {
    sweet: 0,
    sour: 0,
    bitter: 0,
    strong: 0,
    smoky: 0,
    fruity: 0,
    herbal: 0,
    creamy: 0,
  };

  for (const key of FLAVOR_KEYS) {
    const profileVal = profilePref[key] ?? 0;
    const timeVal = timeAdjustment[key] ?? 0;
    blended[key] =
      Math.round((profileVal * profileWeight + timeVal * timeWeight) * 100) /
      100;
  }

  return blended;
}

// ═════════════════════════════════════════════════════════
// 生物学时间校准 · PersonaVector 动态偏移
// ═════════════════════════════════════════════════════════

/**
 * 应用生物学时间校准 · 把基础人格向量叠加时段偏移系数
 *
 * 算法：
 *   result[dim] = clamp(vector[dim] + shift[dim], 0, 1)
 *   仅对 biologyShifts 中显式给出的维度调整 · 其余维度保持原值
 *   结果四舍五入至 3 位小数
 *
 * @param vector 基础六维人格向量（牌类入口产物）
 * @param slot 当前时段
 * @returns 校准后的动态人格向量
 */
export function applyBiologyShift(
  vector: PersonaVector,
  slot: TimeSlotInfo,
): PersonaVector {
  const shifts = slot.biologyShifts;
  const result: PersonaVector = { ...vector };
  for (const dim of PERSONA_DIMS) {
    const shift = shifts[dim];
    if (typeof shift === 'number') {
      const raw = result[dim] + shift;
      result[dim] = Math.max(0, Math.min(1, Math.round(raw * 1000) / 1000));
    }
  }
  return result;
}

/**
 * 解析当前时段 · 支持手动覆盖（用户通过入口星球选择）
 * 优先级：manualOverride > 系统时间
 *
 * @param date 当前时间
 * @param manualOverride 用户手动选择的时段（null 表示按系统时间）
 */
export function resolveTimeSlot(
  date: Date = new Date(),
  manualOverride: TimeSlot | null = null,
): TimeSlotInfo {
  if (manualOverride) {
    return TIME_SLOTS.find((s) => s.slot === manualOverride) ?? getTimeSlot(date);
  }
  return getTimeSlot(date);
}

/**
 * 计算动态人格向量 · 基础向量 + 当前时段生物学偏移
 * 这是「同一人格在不同时段不同推荐」的核心入口
 *
 * @param vector 基础六维人格向量
 * @param date 当前时间
 * @param manualOverride 用户手动选择的时段（null 表示按系统时间）
 * @returns 动态向量 + 命中时段信息
 */
export function getDynamicVector(
  vector: PersonaVector,
  date: Date = new Date(),
  manualOverride: TimeSlot | null = null,
): { vector: PersonaVector; slot: TimeSlotInfo } {
  const slot = resolveTimeSlot(date, manualOverride);
  return { vector: applyBiologyShift(vector, slot), slot };
}

/**
 * 生成生物学偏移的可读说明 · 供 UI 展示「为什么这一杯变了」
 * 仅返回有偏移的维度，按绝对值降序
 */
export function describeBiologyShift(slot: TimeSlotInfo): {
  dim: PersonaDim;
  delta: number;
  sign: '+' | '-';
}[] {
  const shifts = slot.biologyShifts;
  const list: { dim: PersonaDim; delta: number; sign: '+' | '-' }[] = [];
  for (const dim of PERSONA_DIMS) {
    const delta = shifts[dim];
    if (typeof delta === 'number' && delta !== 0) {
      list.push({
        dim,
        delta: Math.round(Math.abs(delta) * 100) / 100,
        sign: delta > 0 ? '+' : '-',
      });
    }
  }
  return list.sort((a, b) => b.delta - a.delta);
}
