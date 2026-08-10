/**
 * 音乐偏好画像引擎 · MusicProfileEngine
 *
 * 借鉴金融孪生平台 musicProfileEngine.js 的画像分析体系，
 * 但方向相反：Y.Mine 是从人格向量正推音乐偏好，而非从歌单反推人格。
 *
 * 映射逻辑：
 *   TOL  (容错)  → genreOpenness     · 高容错→开放多元曲风，低容错→经典保守
 *   SPD  (速度)  → bpmPreference     · 决策速度映射为节奏偏好
 *   INF  (信息)  → complexityPreference · 信息依赖→和声/结构复杂度
 *   ENT  (热情)  → emotionProfile    · 热情强度→情绪偏好
 *   LEAD (主导)  → artistDiversity   · 主导倾向→艺人广度
 *   VIS  (直觉)  → nostalgia         · 直觉权重→怀旧vs现代
 *
 * 用法：
 *   import { vectorToMusicProfile, mbtiToMusicProfile } from './musicProfileEngine';
 *   const profile = vectorToMusicProfile(myVector);
 *   const profile = mbtiToMusicProfile('INTJ');
 */

import { mbtiToBaseVector } from './personaFusionEngine';
import { logger } from './logger';
import type { PersonaVector } from '../types/personaFusion';

// ═════════════════════════════════════════════════════════
// 类型定义
// ═════════════════════════════════════════════════════════

/** 曲风大类 */
export type MusicGenre =
  | 'pop' | 'rock' | 'electronic' | 'classical' | 'jazz'
  | 'hiphop' | 'folk' | 'rnb' | 'metal' | 'indie' | 'ambient';

/** 情绪标签 */
export type MusicEmotion =
  | 'joyful' | 'calm' | 'energetic' | 'melancholic'
  | 'romantic' | 'dreamy' | 'nostalgic' | 'focused';

/** BPM 偏好档位 */
export type BpmTier = 'slow' | 'medium' | 'fast' | 'very_fast';

/** 年代偏好 */
export type EraPreference = 'classic' | 'retro' | 'modern' | 'cutting_edge';

/** 曲风分布 · 归一化权重 */
export type GenreDistribution = Partial<Record<MusicGenre, number>>;

/** 情绪分布 */
export type EmotionDistribution = Partial<Record<MusicEmotion, number>>;

/** BPM 分布 */
export type BpmDistribution = Record<BpmTier, number>;

/** 音乐偏好画像 */
export interface MusicProfile {
  /** 来源类型 */
  source: 'persona' | 'netease' | 'manual';
  /** 生成时间戳 */
  generatedAt: number;
  /** 来源向量（用于调试追踪） */
  sourceVector: PersonaVector;
  /** 曲风分布 · 归一化 */
  genreDistribution: GenreDistribution;
  /** BPM 分布 */
  bpmDistribution: BpmDistribution;
  /** 情绪分布 */
  emotionDistribution: EmotionDistribution;
  /** 年代偏好分布 */
  eraDistribution: Record<EraPreference, number>;
  /** 综合特质 */
  computedTraits: MusicTraits;
  /** 摘要描述 */
  summary: MusicProfileSummary;
  /** 推荐曲风标签 */
  topGenres: MusicGenre[];
  /** 推荐 BPM 区间 */
  bpmRange: [number, number];
  /** 推荐情绪 */
  topEmotion: MusicEmotion;
}

/** 音乐综合特质 */
export interface MusicTraits {
  /** 曲风开放性 0-1 */
  genreOpenness: number;
  /** 节奏偏好 BPM 归一化 */
  bpmPreference: number;
  /** 和声复杂度 0-1 */
  complexityPreference: number;
  /** 情绪能量水平 0-1 */
  energyLevel: number;
  /** 艺人多样性偏好 0-1 */
  artistDiversity: number;
  /** 怀旧倾向 0-1 */
  nostalgia: number;
  /** 创新接受度 0-1 */
  innovationAcceptance: number;
}

/** 画像摘要 */
export interface MusicProfileSummary {
  dominantGenre: string;
  dominantEmotion: string;
  bpmTier: string;
  eraLabel: string;
  openness: string;
  energy: string;
  oneLiner: string;
}

// ═════════════════════════════════════════════════════════
// 映射常量
// ═════════════════════════════════════════════════════════

/** 曲风元数据 */
const GENRE_META: Record<MusicGenre, { label: string; riskLevel: number; complexity: number; modernity: number }> = {
  pop:       { label: '流行', riskLevel: 0.3, complexity: 0.3, modernity: 0.7 },
  rock:      { label: '摇滚', riskLevel: 0.7, complexity: 0.5, modernity: 0.5 },
  electronic:{ label: '电子', riskLevel: 0.6, complexity: 0.6, modernity: 0.9 },
  classical: { label: '古典', riskLevel: 0.1, complexity: 0.9, modernity: 0.1 },
  jazz:      { label: '爵士', riskLevel: 0.3, complexity: 0.8, modernity: 0.3 },
  hiphop:    { label: '嘻哈', riskLevel: 0.7, complexity: 0.4, modernity: 0.8 },
  folk:      { label: '民谣', riskLevel: 0.2, complexity: 0.2, modernity: 0.3 },
  rnb:       { label: 'R&B',  riskLevel: 0.4, complexity: 0.4, modernity: 0.6 },
  metal:     { label: '金属', riskLevel: 0.9, complexity: 0.7, modernity: 0.5 },
  indie:     { label: '独立', riskLevel: 0.5, complexity: 0.5, modernity: 0.7 },
  ambient:   { label: '氛围', riskLevel: 0.2, complexity: 0.3, modernity: 0.6 },
};

/** BPM 档位 */
const BPM_TIERS: Array<{ tier: BpmTier; range: [number, number]; label: string }> = [
  { tier: 'slow',      range: [40, 70],   label: '慢速 · 深思' },
  { tier: 'medium',    range: [70, 110],  label: '中速 · 稳健' },
  { tier: 'fast',      range: [110, 150], label: '快速 · 敏锐' },
  { tier: 'very_fast', range: [150, 200], label: '极速 · 直觉' },
];

/** 情绪元数据 */
const EMOTION_META: Record<MusicEmotion, { label: string; energy: number; valence: number }> = {
  joyful:      { label: '愉悦', energy: 0.8, valence: 0.9 },
  calm:        { label: '平静', energy: 0.2, valence: 0.6 },
  energetic:   { label: '激昂', energy: 0.95, valence: 0.8 },
  melancholic: { label: '忧郁', energy: 0.15, valence: 0.2 },
  romantic:    { label: '浪漫', energy: 0.5, valence: 0.7 },
  dreamy:      { label: '梦幻', energy: 0.3, valence: 0.5 },
  nostalgic:   { label: '怀旧', energy: 0.25, valence: 0.4 },
  focused:     { label: '专注', energy: 0.4, valence: 0.5 },
};

/** 年代偏好 */
const ERA_META: Record<EraPreference, { label: string; yearRange: string }> = {
  classic:      { label: '经典', yearRange: '2000前' },
  retro:        { label: '怀旧', yearRange: '2000-2010' },
  modern:       { label: '现代', yearRange: '2010-2020' },
  cutting_edge: { label: '前沿', yearRange: '2020+' },
};

// ═════════════════════════════════════════════════════════
// 核心映射函数
// ═════════════════════════════════════════════════════════

/**
 * 六维人格向量 → 音乐偏好画像
 *
 * @param vector 六维人格向量
 * @returns 完整音乐偏好画像
 */
export function vectorToMusicProfile(vector: PersonaVector): MusicProfile {
  logger.info('MusicProfile:vectorToMusicProfile', {
    TOL: vector.TOL.toFixed(2),
    SPD: vector.SPD.toFixed(2),
    INF: vector.INF.toFixed(2),
    ENT: vector.ENT.toFixed(2),
    LEAD: vector.LEAD.toFixed(2),
    VIS: vector.VIS.toFixed(2),
  });

  // ── 1. 曲风分布 ──
  const genreDistribution = computeGenreDistribution(vector);

  // ── 2. BPM 分布 ──
  const bpmDistribution = computeBpmDistribution(vector.SPD);

  // ── 3. 情绪分布 ──
  const emotionDistribution = computeEmotionDistribution(vector.ENT, vector.VIS);

  // ── 4. 年代分布 ──
  const eraDistribution = computeEraDistribution(vector.TOL, vector.VIS);

  // ── 5. 综合特质 ──
  const computedTraits = computeTraits(vector, genreDistribution, bpmDistribution, eraDistribution);

  // ── 6. 摘要 ──
  const topGenres = getTopGenres(genreDistribution);
  const topEmotion = getTopEmotion(emotionDistribution);
  const bpmTier = getBpmTier(vector.SPD);
  const bpmRange = BPM_TIERS.find((t) => t.tier === bpmTier)?.range ?? [70, 110];

  const summary: MusicProfileSummary = {
    dominantGenre: GENRE_META[topGenres[0]]?.label ?? '流行',
    dominantEmotion: EMOTION_META[topEmotion]?.label ?? '平静',
    bpmTier: BPM_TIERS.find((t) => t.tier === bpmTier)?.label ?? '中速',
    eraLabel: getTopEra(eraDistribution),
    openness: computedTraits.genreOpenness > 0.6 ? '开放多元' : computedTraits.genreOpenness < 0.4 ? '专注经典' : '适度探索',
    energy: computedTraits.energyLevel > 0.6 ? '高能量' : computedTraits.energyLevel < 0.4 ? '低能量' : '中能量',
    oneLiner: generateOneLiner(vector, topGenres, topEmotion),
  };

  const profile: MusicProfile = {
    source: 'persona',
    generatedAt: Date.now(),
    sourceVector: { ...vector },
    genreDistribution,
    bpmDistribution,
    emotionDistribution,
    eraDistribution,
    computedTraits,
    summary,
    topGenres,
    bpmRange,
    topEmotion,
  };

  logger.info('MusicProfile:result', {
    topGenres,
    topEmotion,
    bpmTier,
    openness: computedTraits.genreOpenness.toFixed(2),
    energy: computedTraits.energyLevel.toFixed(2),
  });

  return profile;
}

/**
 * MBTI 四字母 → 音乐偏好画像
 */
export function mbtiToMusicProfile(mbti: string): MusicProfile {
  logger.info('MusicProfile:mbtiToMusicProfile', { mbti: mbti.toUpperCase() });
  const vector = mbtiToBaseVector(mbti);
  return vectorToMusicProfile(vector);
}

// ═════════════════════════════════════════════════════════
// 子计算函数
// ═════════════════════════════════════════════════════════

/** 计算曲风分布 */
function computeGenreDistribution(v: PersonaVector): GenreDistribution {
  const dist: GenreDistribution = {};

  for (const [genre, meta] of Object.entries(GENRE_META)) {
    let score = 0.5; // 基线

    // TOL → risk alignment: 高容错偏好高风险曲风
    score += (v.TOL - 0) * (meta.riskLevel - 0.5) * 0.6;

    // INF → complexity: 高信息偏好复杂曲风
    score += (v.INF - 0) * (meta.complexity - 0.5) * 0.5;

    // VIS → modernity: 高直觉偏好现代/前沿
    score += (v.VIS - 0) * (meta.modernity - 0.5) * 0.4;

    // 夹取并保留
    dist[genre as MusicGenre] = clamp(score, 0.05, 0.95);
  }

  // 归一化
  return normalizeDistribution(dist);
}

/** 计算 BPM 分布 */
function computeBpmDistribution(spd: number): BpmDistribution {
  // SPD 转换为 BPM 中心值
  const centerBpm = 50 + ((spd + 1) / 2) * 130;

  const dist: BpmDistribution = { slow: 0, medium: 0, fast: 0, very_fast: 0 };

  for (const { tier, range } of BPM_TIERS) {
    const [lo, hi] = range;
    const mid = (lo + hi) / 2;
    // 高斯衰减：距离中心越远，权重越低
    const distance = Math.abs(centerBpm - mid) / 80;
    dist[tier] = Math.exp(-distance * distance * 2);
  }

  return normalizeDistribution(dist) as BpmDistribution;
}

/** 计算情绪分布 */
function computeEmotionDistribution(ent: number, vis: number): EmotionDistribution {
  const dist: EmotionDistribution = {};

  for (const [emotion, meta] of Object.entries(EMOTION_META)) {
    let score = 0.5;

    // ENT → energy: 高热情偏好高能量情绪
    score += (ent - 0) * (meta.energy - 0.5) * 0.7;

    // VIS → valence: 高直觉偏好正面情绪
    score += (vis - 0) * (meta.valence - 0.5) * 0.4;

    dist[emotion as MusicEmotion] = clamp(score, 0.05, 0.95);
  }

  return normalizeDistribution(dist);
}

/** 计算年代分布 */
function computeEraDistribution(tol: number, vis: number): Record<EraPreference, number> {
  // TOL → 创新接受度: 高容错→前沿，低容错→经典
  // VIS → 怀旧: 高直觉→怀旧/经典

  const dist: Record<EraPreference, number> = {
    classic:      clamp(0.3 - tol * 0.2 + vis * 0.3, 0.05, 0.95),
    retro:        clamp(0.3 - tol * 0.1 + vis * 0.2, 0.05, 0.95),
    modern:       clamp(0.3 + tol * 0.1 - vis * 0.1, 0.05, 0.95),
    cutting_edge: clamp(0.3 + tol * 0.3 - vis * 0.3, 0.05, 0.95),
  };

  return normalizeDistribution(dist);
}

/** 计算综合特质 */
function computeTraits(
  v: PersonaVector,
  _genres: GenreDistribution,
  bpm: BpmDistribution,
  _eras: Record<EraPreference, number>,
): MusicTraits {
  // 曲风开放性: 标准差反比（分布越均匀→开放，越集中→保守）
  const genreWeights = Object.values(_genres);
  const mean = genreWeights.reduce((a, b) => a + b, 0) / genreWeights.length;
  const variance = genreWeights.reduce((sum, w) => sum + (w - mean) ** 2, 0) / genreWeights.length;
  const stdDev = Math.sqrt(variance);
  // 最大可能标准差（一个曲风=1，其余=0）
  const maxStdDev = Math.sqrt((1 - 1 / genreWeights.length) ** 2 / genreWeights.length +
    (genreWeights.length - 1) * (1 / genreWeights.length) ** 2);
  const genreOpenness = clamp(1 - stdDev / maxStdDev, 0, 1);

  // BPM 偏好: 加权平均
  const bpmWeights: Record<BpmTier, number> = { slow: 0.2, medium: 0.5, fast: 0.75, very_fast: 0.95 };
  const bpmPreference = Object.entries(bpm).reduce(
    (sum, [tier, w]) => sum + (bpmWeights[tier as BpmTier] ?? 0.5) * w,
    0,
  );

  // 和声复杂度: INF 直接映射
  const complexityPreference = (v.INF + 1) / 2;

  // 情绪能量: ENT 直接映射
  const energyLevel = (v.ENT + 1) / 2;

  // 艺人多样性: TOL + LEAD
  const artistDiversity = clamp((v.TOL + 1) / 2 * 0.6 + (v.LEAD + 1) / 2 * 0.4, 0, 1);

  // 怀旧倾向: VIS
  const nostalgia = (v.VIS + 1) / 2;

  // 创新接受度: TOL + 1 - nostalgia
  const innovationAcceptance = clamp((v.TOL + 1) / 2 * 0.7 + (1 - nostalgia) * 0.3, 0, 1);

  return {
    genreOpenness: Math.round(genreOpenness * 1000) / 1000,
    bpmPreference: Math.round(bpmPreference * 1000) / 1000,
    complexityPreference: Math.round(complexityPreference * 1000) / 1000,
    energyLevel: Math.round(energyLevel * 1000) / 1000,
    artistDiversity: Math.round(artistDiversity * 1000) / 1000,
    nostalgia: Math.round(nostalgia * 1000) / 1000,
    innovationAcceptance: Math.round(innovationAcceptance * 1000) / 1000,
  };
}

// ═════════════════════════════════════════════════════════
// 导出工具函数
// ═════════════════════════════════════════════════════════

/** 获取 Top 3 曲风 */
export function getTopGenres(dist: GenreDistribution, n = 3): MusicGenre[] {
  return (Object.entries(dist) as [MusicGenre, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([g]) => g);
}

/** 获取最高情绪 */
export function getTopEmotion(dist: EmotionDistribution): MusicEmotion {
  const entries = Object.entries(dist) as [MusicEmotion, number][];
  if (entries.length === 0) return 'calm';
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

/** 获取 BPM 档位 */
export function getBpmTier(spd: number): BpmTier {
  const bpm = 50 + ((spd + 1) / 2) * 130;
  if (bpm < 70) return 'slow';
  if (bpm < 110) return 'medium';
  if (bpm < 150) return 'fast';
  return 'very_fast';
}

/** 获取最高年代偏好 */
function getTopEra(dist: Record<EraPreference, number>): string {
  const entries = Object.entries(dist) as [EraPreference, number][];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return ERA_META[top[0]]?.label ?? '现代';
}

/** 生成一句话画像描述 */
function generateOneLiner(v: PersonaVector, genres: MusicGenre[], emotion: MusicEmotion): string {
  const genreLabel = GENRE_META[genres[0]]?.label ?? '音乐';
  const emotionLabel = EMOTION_META[emotion]?.label ?? '情绪';
  const energyText = v.ENT > 0.3 ? '充满能量' : v.ENT < -0.3 ? '内敛沉静' : '张弛有度';

  return `一位${energyText}的${genreLabel}爱好者，偏好${emotionLabel}的氛围`;
}

/** 批量生成所有 16 型 MBTI 的音乐偏好画像 */
export function generateAllMbtiProfiles(): Record<string, MusicProfile> {
  const mbtiTypes = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP',
  ];
  const result: Record<string, MusicProfile> = {};
  for (const mbti of mbtiTypes) {
    result[mbti] = mbtiToMusicProfile(mbti);
  }
  return result;
}

/**
 * 将音乐偏好画像合并到人格向量（加权融合）
 * 借鉴金融孪生平台 mergeMusicVector 的思路
 *
 * @param userVector 用户已有六维向量
 * @param profile 音乐偏好画像
 * @param musicWeight 音乐向量权重 0-1（默认 0.2）
 */
export function mergeMusicProfileToVector(
  userVector: PersonaVector,
  profile: MusicProfile,
  musicWeight = 0.2,
): PersonaVector {
  const traits = profile.computedTraits;
  const userWeight = 1 - musicWeight;

  return {
    TOL:  userVector.TOL  * userWeight + (traits.genreOpenness * 2 - 1) * musicWeight,
    SPD:  userVector.SPD  * userWeight + (traits.bpmPreference * 2 - 1) * musicWeight,
    INF:  userVector.INF  * userWeight + (traits.complexityPreference * 2 - 1) * musicWeight,
    ENT:  userVector.ENT  * userWeight + (traits.energyLevel * 2 - 1) * musicWeight,
    LEAD: userVector.LEAD * userWeight + (traits.artistDiversity * 2 - 1) * musicWeight,
    VIS:  userVector.VIS  * userWeight + (traits.nostalgia * 2 - 1) * musicWeight,
  };
}

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeDistribution<T extends Record<string, number>>(dist: T): T {
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  if (total === 0) return dist;
  const result = { ...dist };
  for (const key of Object.keys(result)) {
    (result as Record<string, number>)[key] = Math.round(((result as Record<string, number>)[key] / total) * 1000) / 1000;
  }
  return result;
}

export { GENRE_META, EMOTION_META, BPM_TIERS, ERA_META };