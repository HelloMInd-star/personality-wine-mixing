/**
 * 人格声纹引擎 · PersonaMusicEngine
 *
 * 借鉴金融孪生平台 musicEngine.js 的「数据→音乐叙事」映射思路，
 * 将 Y.Mine 六维人格向量 (PersonaVector) 翻译为音乐合成参数。
 *
 * 映射逻辑：
 *   SPD  (速度)   → BPM         · 决策速度映射为节奏
 *   TOL  (容错)   → timbre      · 风险偏好映射为音色柔/利
 *   LEAD (主导)   → scale/调性  · 主导倾向映射为大/小调
 *   ENT  (热情)   → energy      · 热情强度映射为能量
 *   INF  (信息)   → filterFreq  · 信息依赖映射为频谱宽度
 *   VIS  (直觉)   → reverb      · 直觉权重映射为空间感
 *
 * 输出可直接喂给 musicEngine 的合成参数，或独立使用。
 *
 * 用法：
 *   import { vectorToMusicParams, mbtiToMusicParams } from './personaMusicEngine';
 *   const params = vectorToMusicParams(myPersonaVector);
 *   const params = mbtiToMusicParams('INTJ');
 */

import { mbtiToBaseVector } from './personaFusionEngine';
import { logger } from './logger';
import type { PersonaVector, PersonaDim } from '../types/personaFusion';

// ═════════════════════════════════════════════════════════
// 类型定义
// ═════════════════════════════════════════════════════════

/** 音频合成波形类型 */
export type OscillatorType = 'sine' | 'triangle' | 'sawtooth' | 'square';

/** 调性 */
export type MusicalScale = 'major' | 'minor';

/** 曲风标签 */
export type GenreTag =
  | 'ambient' | 'classical' | 'electronic' | 'jazz'
  | 'lo-fi' | 'minimal' | 'orchestral' | 'trip-hop';

/** 人格声纹 · 六维向量 → 音乐参数映射结果 */
export interface PersonaMusicParams {
  /** BPM 节奏 · 50-180 */
  bpm: number;
  /** 音色/波形类型 */
  timbre: OscillatorType;
  /** 根音频率 Hz */
  rootFreq: number;
  /** 滤波器截止频率 Hz · 200-4000 */
  filterFreq: number;
  /** 混响程度 0-1 */
  reverb: number;
  /** 能量 0-1 */
  energy: number;
  /** 调性 */
  scale: MusicalScale;
  /** 和声密度 0-1 · 高 = 复杂和声，低 = 单音 */
  harmonicDensity: number;
  /** 人格声纹的自然语言描述 */
  description: string;
  /** 推荐曲风标签 */
  genreTags: GenreTag[];
  /** 来源向量（用于调试追踪） */
  sourceVector: PersonaVector;
}

// ═════════════════════════════════════════════════════════
// 映射常量
// ═════════════════════════════════════════════════════════

/** 根音频率表 · 基于 LEAD 维度选择 */
const ROOT_FREQ_TABLE: Array<{ range: [number, number]; freq: number; note: string; label: string }> = [
  { range: [0.5, 1.0], freq: 261.63, note: 'C4', label: '中央C · 坚定明亮' },
  { range: [0.0, 0.5], freq: 196.00, note: 'G3', label: 'G3 · 沉稳均衡' },
  { range: [-0.5, 0.0], freq: 146.83, note: 'D3', label: 'D3 · 内省回响' },
  { range: [-1.0, -0.5], freq: 110.00, note: 'A2', label: 'A2 · 深邃沉静' },
];

/** 曲风标签映射 · 基于向量组合 */
interface GenreRule {
  tags: GenreTag[];
  condition: (v: PersonaVector) => boolean;
  description: string;
}

const GENRE_RULES: GenreRule[] = [
  {
    tags: ['ambient', 'minimal'],
    condition: (v) => v.ENT < -0.3 && v.VIS > 0.3,
    description: '内敛直觉型 · 氛围音乐',
  },
  {
    tags: ['orchestral', 'classical'],
    condition: (v) => v.INF > 0.3 && v.LEAD > 0.2,
    description: '信息主导型 · 管弦/古典',
  },
  {
    tags: ['electronic', 'trip-hop'],
    condition: (v) => v.SPD > 0.3 && v.TOL > 0.2,
    description: '高速容错型 · 电子/碎拍',
  },
  {
    tags: ['jazz', 'lo-fi'],
    condition: (v) => v.TOL > 0.2 && v.VIS > 0.2,
    description: '灵活直觉型 · 爵士/Lo-Fi',
  },
  {
    tags: ['classical', 'ambient'],
    condition: (v) => v.LEAD < -0.2 && v.INF > 0.0,
    description: '追随思考型 · 古典/氛围',
  },
  {
    tags: ['electronic', 'minimal'],
    condition: (v) => v.SPD > 0.0 && v.ENT < 0.0,
    description: '高效冷静型 · 极简电子',
  },
];

/** 默认曲风 · 无规则命中时 */
const DEFAULT_GENRES: GenreTag[] = ['ambient', 'lo-fi'];

/** 声纹描述模板池 */
const DESCRIPTION_TEMPLATES: Array<{
  condition: (v: PersonaVector) => boolean;
  text: (v: PersonaVector) => string;
}> = [
  {
    condition: (v) => v.ENT > 0.5 && v.LEAD > 0.3,
    text: () => '炽烈的主导者 · 大调明亮，节奏强劲，像指挥棒挥下的瞬间',
  },
  {
    condition: (v) => v.ENT > 0.5 && v.LEAD < -0.3,
    text: () => '热情的追随者 · 旋律先行，让渡控制权，像海浪推着船前行',
  },
  {
    condition: (v) => v.INF > 0.5 && v.VIS < -0.3,
    text: () => '冷静的分析者 · 频谱宽而清晰，每个音符都有精确的位置',
  },
  {
    condition: (v) => v.VIS > 0.5 && v.INF < -0.3,
    text: () => '直觉的漫游者 · 混响深长，空间感弥漫，像月光下的即兴',
  },
  {
    condition: (v) => v.TOL > 0.5 && v.SPD > 0.3,
    text: () => '从容的冒险者 · 正弦波柔滑，节奏却不慢，像在风暴中散步',
  },
  {
    condition: (v) => v.TOL < -0.5 && v.SPD < -0.3,
    text: () => '审慎的守卫者 · 锯齿波锋利，节拍缓慢，每一步都经过计算',
  },
  {
    condition: (v) => v.SPD > 0.5 && v.ENT > 0.3,
    text: () => '急速的火焰 · 高 BPM 驱动，三角波跳跃，像火花四溅',
  },
  {
    condition: (v) => v.SPD < -0.5 && v.INF > 0.3,
    text: () => '深沉的思考者 · 低频缓慢推进，多层信息交织，像深海暗流',
  },
];

/** 默认描述 */
function defaultDescription(_v: PersonaVector): string {
  return '均衡的声纹 · 各维度居中，音色柔和，节奏平稳，像一杯恰到好处的酒';
}

// ═════════════════════════════════════════════════════════
// 核心映射函数
// ═════════════════════════════════════════════════════════

/**
 * 六维人格向量 → 音乐参数
 *
 * @param vector 六维人格向量 · 各维度 ∈ [-1, 1]
 * @returns 完整的人格声纹参数
 *
 * @example
 *   const v: PersonaVector = { TOL: 0.67, SPD: -0.14, INF: 0, ENT: 1.0, LEAD: 0.43, VIS: 0.76 };
 *   const params = vectorToMusicParams(v);
 *   // → { bpm: 106, timbre: 'sine', scale: 'major', ... }
 */
export function vectorToMusicParams(vector: PersonaVector): PersonaMusicParams {
  logger.info('PersonaMusic:vectorToMusicParams', {
    TOL: vector.TOL.toFixed(2),
    SPD: vector.SPD.toFixed(2),
    INF: vector.INF.toFixed(2),
    ENT: vector.ENT.toFixed(2),
    LEAD: vector.LEAD.toFixed(2),
    VIS: vector.VIS.toFixed(2),
  });

  // ── 1. SPD → BPM [50, 180] ──
  const bpm = Math.round(50 + ((vector.SPD + 1) / 2) * 130);

  // ── 2. TOL → timbre ──
  const timbre = mapTolToTimbre(vector.TOL);

  // ── 3. LEAD → rootFreq + scale ──
  const rootFreq = mapLeadToRootFreq(vector.LEAD);
  const scale: MusicalScale = vector.LEAD > 0 ? 'major' : 'minor';

  // ── 4. ENT → energy [0.1, 1.0] ──
  const energy = clamp(0.1 + ((vector.ENT + 1) / 2) * 0.9, 0.1, 1.0);

  // ── 5. INF → filterFreq [200, 4000] + harmonicDensity [0, 1] ──
  const filterFreq = Math.round(200 + ((vector.INF + 1) / 2) * 3800);
  const harmonicDensity = clamp((vector.INF + 1) / 2, 0, 1);

  // ── 6. VIS → reverb [0.05, 0.75] ──
  const reverb = clamp(0.05 + ((vector.VIS + 1) / 2) * 0.7, 0.05, 0.75);

  // ── 7. 派生：曲风 + 描述 ──
  const genreTags = mapGenres(vector);
  const description = mapDescription(vector);

  const params: PersonaMusicParams = {
    bpm,
    timbre,
    rootFreq: Math.round(rootFreq * 100) / 100,
    filterFreq,
    reverb: Math.round(reverb * 1000) / 1000,
    energy: Math.round(energy * 1000) / 1000,
    scale,
    harmonicDensity: Math.round(harmonicDensity * 1000) / 1000,
    description,
    genreTags,
    sourceVector: { ...vector },
  };

  logger.info('PersonaMusic:result', {
    bpm,
    timbre,
    rootFreq: params.rootFreq,
    filterFreq,
    reverb: params.reverb,
    energy: params.energy,
    scale,
    harmonicDensity: params.harmonicDensity,
    genres: genreTags,
  });

  return params;
}

/**
 * MBTI 四字母 → 音乐参数
 *
 * 快捷路径：MBTI → mbtiToBaseVector → vectorToMusicParams
 *
 * @param mbti 四字母 MBTI 类型 · 如 'INTJ', 'ENFP'
 * @returns 人格声纹参数
 */
export function mbtiToMusicParams(mbti: string): PersonaMusicParams {
  logger.info('PersonaMusic:mbtiToMusicParams', { mbti: mbti.toUpperCase() });
  const vector = mbtiToBaseVector(mbti);
  return vectorToMusicParams(vector);
}

// ═════════════════════════════════════════════════════════
// 子映射函数
// ═════════════════════════════════════════════════════════

/** TOL → 波形类型 */
function mapTolToTimbre(tol: number): OscillatorType {
  if (tol > 0.3) return 'sine';      // 高容错 → 柔和正弦波
  if (tol < -0.3) return 'sawtooth'; // 低容错 → 锋利锯齿波
  return 'triangle';                   // 中性 → 三角波
}

/** LEAD → 根音频率 */
function mapLeadToRootFreq(lead: number): number {
  for (const entry of ROOT_FREQ_TABLE) {
    if (lead >= entry.range[0] && lead <= entry.range[1]) {
      return entry.freq;
    }
  }
  return 196.00; // 默认 G3
}

/** 向量 → 曲风标签 */
function mapGenres(vector: PersonaVector): GenreTag[] {
  for (const rule of GENRE_RULES) {
    if (rule.condition(vector)) {
      return rule.tags;
    }
  }
  return DEFAULT_GENRES;
}

/** 向量 → 自然语言描述 */
function mapDescription(vector: PersonaVector): string {
  for (const template of DESCRIPTION_TEMPLATES) {
    if (template.condition(vector)) {
      return template.text(vector);
    }
  }
  return defaultDescription(vector);
}

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 获取根音对应的音符名称
 */
export function getRootNote(params: PersonaMusicParams): string {
  for (const entry of ROOT_FREQ_TABLE) {
    if (Math.abs(entry.freq - params.rootFreq) < 1) {
      return entry.note;
    }
  }
  return 'G3';
}

/**
 * 批量生成所有 16 型 MBTI 的音乐参数
 * 用于对比验证和调试
 */
export function generateAllMbtiMusicParams(): Record<string, PersonaMusicParams> {
  const mbtiTypes = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP',
  ];

  const result: Record<string, PersonaMusicParams> = {};
  for (const mbti of mbtiTypes) {
    result[mbti] = mbtiToMusicParams(mbti);
  }
  return result;
}

/**
 * 将人格声纹参数转换为 musicEngine 可用的 MusicTrack.synth 格式
 * 用于与现有 musicEngine 无缝对接
 */
export function toSynthParams(params: PersonaMusicParams): {
  rootFreq: number;
  timbre: 'sine' | 'triangle' | 'sawtooth' | 'square';
  filterFreq: number;
  reverb: number;
} {
  return {
    rootFreq: params.rootFreq,
    timbre: params.timbre,
    filterFreq: params.filterFreq,
    reverb: params.reverb,
  };
}

export type { PersonaVector, PersonaDim };