/**
 * journeyEngine · 情绪旅程引擎
 * 把情绪调节器从静态控件升级为「情绪回路导演」
 *
 * 四阶段回路：开场 → 上升 → 高潮 → 收尾
 *   - 由情绪强度 + 情绪类型共同解析当前阶段
 *   - 阶段决定酒款刺激档位（低/中/高）与音乐参数（BPM/能量）
 *   - 高强度 + 收敛型情绪 触发「收尾」回路回归
 *
 * 刺激程度由酒款八维风味派生，零数据改动：
 *   刺激正向：strong(烈) / bitter(苦) / smoky(烟熏) / sour(酸)
 *   舒缓正向：sweet(甜) / creamy(柔润) / herbal(草本) / fruity(果香)
 *
 * 纯函数，无副作用，可独立测试
 */

import type {
  Cocktail,
  CocktailRecommendation,
  FlavorKey,
  MoodTag,
} from '../types/cocktail';
import type { FlavorPreference, PersonalityProfile } from '../types/personality';
import type {
  JourneyPhase,
  JourneyRecommendation,
  JourneyState,
  MusicTrack,
  StimulationInfo,
  StimulationTier,
} from '../types/journey';
import { recommendCocktails } from './cocktailEngine';
import { blendWithMood } from './moodEngine';
import { flavorFromVector } from './flavorFromVector';
import { getTimeSlot, type TimeSlotInfo } from './timeEngine';
import { JOURNEY_PHASE_META, selectTrack } from '../data/journeyMeta';
import type { PersonaVector } from '../types/personaFusion';

/** 收敛型情绪 · 高强度时触发「收尾」回路回归 */
const CONTRACTIVE_MOODS: ReadonlySet<MoodTag> = new Set([
  'calm',
  'melancholy',
  'elegant',
  'mystery',
]);

/** 刺激正向风味的权重（0-10 维度） */
const STIM_WEIGHTS: Partial<Record<FlavorKey, number>> = {
  strong: 1.0,
  bitter: 0.8,
  smoky: 0.7,
  sour: 0.5,
};

/** 舒缓正向风味的权重（0-10 维度） */
const SOOTHE_WEIGHTS: Partial<Record<FlavorKey, number>> = {
  sweet: 0.6,
  creamy: 0.7,
  herbal: 0.4,
  fruity: 0.3,
};

/** 刺激程度归一化的原始区间 · [最小, 最大] */
const STIM_RAW_RANGE: [number, number] = [-20, 30];

/**
 * 由酒款八维风味派生刺激程度（0-1）
 *
 * 算法：刺激分 = Σ(刺激风味 × 权重) - Σ(舒缓风味 × 权重)
 *       归一化到 0-1，四舍五入至 3 位小数
 *
 * @example
 *   // 烈而苦的酒 → 接近 1
 *   getStimulationLevel({ strong: 9, bitter: 8, smoky: 6, sour: 2, ... })
 *   // 甜柔的酒 → 接近 0
 *   getStimulationLevel({ sweet: 8, creamy: 7, herbal: 5, ... })
 */
export function getStimulationLevel(
  flavorProfile: Record<FlavorKey, number>,
): number {
  let raw = 0;
  for (const key of Object.keys(STIM_WEIGHTS) as FlavorKey[]) {
    raw += (flavorProfile[key] ?? 0) * (STIM_WEIGHTS[key] ?? 0);
  }
  for (const key of Object.keys(SOOTHE_WEIGHTS) as FlavorKey[]) {
    raw -= (flavorProfile[key] ?? 0) * (SOOTHE_WEIGHTS[key] ?? 0);
  }
  const [min, max] = STIM_RAW_RANGE;
  const clamped = Math.max(min, Math.min(max, raw));
  const level = (clamped - min) / (max - min);
  return Math.round(level * 1000) / 1000;
}

/**
 * 刺激程度 → 档位映射
 *
 * 阈值依据配方库实际分布标定，使低/中/高三档均有酒款落入：
 *   - low  · 甜柔系（椰林飘香、莫吉托等）· level < 0.45
 *   - mid  · 平衡系（马天尼、曼哈顿等）· 0.45 ≤ level < 0.6
 *   - high · 烈苦系（古典之事、涩格罗尼等）· level ≥ 0.6
 */
export function getStimulationTier(level: number): StimulationTier {
  if (level < 0.45) return 'low';
  if (level < 0.6) return 'mid';
  return 'high';
}

/** 取酒款刺激程度信息 · level + tier 组合 */
export function getStimulationInfo(cocktail: Cocktail): StimulationInfo {
  const level = getStimulationLevel(cocktail.flavorProfile);
  return { level, tier: getStimulationTier(level) };
}

/**
 * 由情绪 + 强度解析旅程阶段
 *
 * 解析规则：
 *   - mood 为空 或 intensity=0 → opening（开场，随时段呼吸）
 *   - intensity < 0.35 → rising（情绪逐渐打开）
 *   - 0.35 ≤ intensity < 0.8 → climax（高潮体验）
 *   - intensity ≥ 0.8：
 *       收敛型情绪（calm/melancholy/elegant/mystery）→ closing（回路收尾）
 *       扩张型情绪（passion/celebration/rebel/romantic）→ climax（持续高潮）
 *
 * @example
 *   resolveJourneyPhase(null, 0)        // 'opening'
 *   resolveJourneyPhase('passion', 0.2) // 'rising'
 *   resolveJourneyPhase('passion', 0.6) // 'climax'
 *   resolveJourneyPhase('calm', 0.9)    // 'closing'
 */
export function resolveJourneyPhase(
  mood: MoodTag | null,
  intensity: number,
): JourneyPhase {
  if (!mood || intensity <= 0) return 'opening';
  if (intensity < 0.35) return 'rising';
  if (intensity < 0.8) return 'climax';
  // intensity ≥ 0.8 · 高强度下按情绪收敛/扩张分流
  return CONTRACTIVE_MOODS.has(mood) ? 'closing' : 'climax';
}

/** 取完整旅程状态 · 阶段 + 元数据 + 期望刺激档位 */
export function getJourneyState(
  mood: MoodTag | null,
  intensity: number,
): JourneyState {
  const phase = resolveJourneyPhase(mood, intensity);
  const meta = JOURNEY_PHASE_META[phase];
  return {
    phase,
    meta,
    stimulationTier: meta.stimulationTier,
  };
}

/**
 * 按刺激档位筛选酒款 · 用于阶段化推荐的候选过滤
 */
export function filterByStimulationTier(
  cocktails: Cocktail[],
  tier: StimulationTier,
): Cocktail[] {
  return cocktails.filter(
    (c) => getStimulationTier(getStimulationLevel(c.flavorProfile)) === tier,
  );
}

/**
 * 旅程化推荐 · 风味偏好入口 · 画像与向量共用
 *
 * 算法：
 *   1. blendWithMood 得到融合风味偏好（复用 P0-2 三方融合）
 *   2. recommendCocktails 取候选（多取以备档位筛选）
 *   3. 按当前阶段刺激档位重排：命中档位者保留高匹配度，未命中者降权
 *   4. 每条附加阶段、刺激信息、音乐曲目
 *
 * @param flavor 基础风味偏好（画像 flavorPreference 或向量派生）
 * @param mood 主动情绪 · null 关闭调节
 * @param intensity 情绪强度 0-1
 * @param date 指定时刻（默认当前时间）
 * @param limit 返回条数
 */
export function recommendByJourneyFlavor(
  flavor: FlavorPreference,
  mood: MoodTag | null,
  intensity: number,
  date: Date = new Date(),
  limit = 5,
): JourneyRecommendation[] {
  const slot: TimeSlotInfo = getTimeSlot(date);
  const blended: FlavorPreference = blendWithMood(
    flavor,
    slot,
    mood,
    intensity,
  );

  // 多取候选以备档位筛选 · 至少 limit×3，保证档位命中后仍有足够数量
  const poolSize = Math.max(limit * 3, 12);
  const candidates = recommendCocktails(blended, poolSize);

  const state = getJourneyState(mood, intensity);
  const tier = state.stimulationTier;
  const track: MusicTrack = selectTrack(state.phase, mood);

  // 档位加权排序 · 命中档位者排前，未命中者按原匹配度顺延
  const tiered = candidates
    .map((rec) => {
      const stim = getStimulationInfo(rec.cocktail);
      const tierHit = stim.tier === tier ? 0 : 1; // 0 优先
      return { rec, stim, tierHit };
    })
    .sort((a, b) => {
      if (a.tierHit !== b.tierHit) return a.tierHit - b.tierHit;
      return b.rec.matchScore - a.rec.matchScore;
    });

  return tiered.slice(0, limit).map(({ rec, stim }) => ({
    ...rec,
    phase: state.phase,
    stimulation: stim,
    track,
  }));
}

/**
 * 旅程化推荐 · 画像入口 · 旧调用方兼容
 * 内部转调 recommendByJourneyFlavor，以 profile.flavorPreference 为基础风味
 */
export function recommendByJourney(
  profile: PersonalityProfile,
  mood: MoodTag | null,
  intensity: number,
  date: Date = new Date(),
  limit = 5,
): JourneyRecommendation[] {
  return recommendByJourneyFlavor(
    profile.flavorPreference,
    mood,
    intensity,
    date,
    limit,
  );
}

/**
 * 旅程化推荐 · 六维向量入口 · 牌类入口产物作为唯一数据契约
 * 内部由 flavorFromVector 派生八维风味偏好，再走统一旅程推荐流程
 *
 * @param vec 六维人格向量 [-1, 1]
 * @param mood 主动情绪 · null 关闭调节
 * @param intensity 情绪强度 0-1
 * @param date 指定时刻（默认当前时间）
 * @param limit 返回条数
 */
export function recommendByJourneyVector(
  vec: PersonaVector,
  mood: MoodTag | null,
  intensity: number,
  date: Date = new Date(),
  limit = 5,
): JourneyRecommendation[] {
  const flavor = flavorFromVector(vec);
  return recommendByJourneyFlavor(flavor, mood, intensity, date, limit);
}

/**
 * 仅解析旅程推荐的音乐曲目 · 不计算推荐列表
 * 供 UI 在无画像时也能展示当前阶段的音乐
 */
export function getJourneyTrack(
  mood: MoodTag | null,
  intensity: number,
): MusicTrack {
  const state = getJourneyState(mood, intensity);
  return selectTrack(state.phase, mood);
}

export type { CocktailRecommendation };
