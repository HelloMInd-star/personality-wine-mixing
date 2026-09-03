/**
 * cocktailService · 统一 service 层
 * 整合人格引擎 + 调酒引擎 + 持久化 + 元数据，对前端提供一站式业务 API
 *
 * 分层约定：
 *   - 引擎（engine/）= 纯函数，无副作用，可独立测试
 *   - service（本层）= 业务编排 + localStorage，无 React 依赖
 *   - store/hooks = React 状态管理，调用 service
 *
 * 前端应优先调用本 service，而非直接触及引擎，保证调用入口统一
 */

import { buildProfile } from '../engine/personalityEngine';
import {
  recommendCocktails,
  recommendByArchetype as matchByArchetype,
  recommendByVector,
  getCocktailById,
  searchCocktails,
  filterByMood,
} from '../engine/cocktailEngine';
import {
  getTimeSlot,
  blendWithTime,
  type TimeSlotInfo,
} from '../engine/timeEngine';
import { blendWithMood } from '../engine/moodEngine';
import {
  getJourneyState,
  getJourneyTrack,
  getStimulationInfo,
  recommendByJourney,
  recommendByJourneyVector,
} from '../engine/journeyEngine';
import { getLightEffect, getLightByVector } from '../engine/lightEngine';
import { getScentProfile, getScentByVector } from '../engine/scentEngine';
import {
  getTavernState,
  getNightPhase,
  getPhaseProgress,
  getNightProgress,
} from '../engine/tavernEngine';
import { fusePersona as fusePersonaEngine } from '../engine/personaFusionEngine';
import {
  matchRolePersona as matchRolePersonaEngine,
  recommendByRoleVector as recommendByRoleVectorEngine,
  applyRoleVectorAdjustment as applyRoleVectorAdjustmentEngine,
  applyRoleFlavorShift as applyRoleFlavorShiftEngine,
} from '../engine/roleMatchEngine';
import {
  ROLES,
  ROLE_MAP,
  ROLE_PERSONAS,
  ROLE_FLAVOR_ADJUSTMENT,
  getPersonasByRole,
  getRoleFlavorAdjustment,
} from '../data/rolePersonas';
import { PERSONALITY_TRAITS } from '../data/personalityTraits';
import { PERSONALITY_ARCHETYPES } from '../data/personalityArchetypes';
import { FLAVOR_META } from '../data/flavorMeta';
import { MOOD_META } from '../data/moodMeta';
import {
  JOURNEY_PHASE_META,
  JOURNEY_PHASE_ORDER,
  MUSIC_TRACKS,
} from '../data/journeyMeta';
import { COCKTAILS } from '../data/cocktails';
import {
  TAVERN_THEMES,
  DEFAULT_TAVERN_THEME,
  DEFAULT_NIGHT_CURVE,
  getTavernThemeByCode,
} from '../data/tavernThemes';
import type {
  PersonalityProfile,
  FlavorPreference,
  TraitMeta,
  PersonalityArchetype,
} from '../types/personality';
import type {
  Cocktail,
  CocktailRecommendation,
  MoodMeta,
  MoodTag,
  FlavorMeta,
} from '../types/cocktail';
import type {
  JourneyPhaseMeta,
  JourneyRecommendation,
  JourneyState,
  LightEffect,
  MusicTrack,
  ScentProfile,
  StimulationInfo,
} from '../types/journey';
import type { PersonaVector } from '../types/personaFusion';
import type { FusionInput, PersonaFusion } from '../types/personaFusion';
import type {
  RoleMeta,
  RolePersona,
  RoleMatchResult,
  RoleType,
  RoleFlavorAdjustment,
} from '../types/role';
import type {
  TavernTheme,
  TavernState,
} from '../types/tavern';

/** 画像本地存储键 */
const PROFILE_STORAGE_KEY = 'juezui-profile';

/** 六维向量本地存储键 · 牌类入口产物，作为唯一数据契约的持久化载体 */
const VECTOR_STORAGE_KEY = 'juezui-vector';

/** 酒馆主题本地存储键 · 场所基调偏好持久化 */
const TAVERN_THEME_STORAGE_KEY = 'juezui-tavern-theme';

/** 一站式结果 · 画像 + 推荐一并返回 */
export interface ProfileWithRecommendations {
  profile: PersonalityProfile;
  recommendations: CocktailRecommendation[];
}

export const cocktailService = {
  // ═════════════════════════════════════════════════════════
  // 人格画像 · 由答案织就
  // ═════════════════════════════════════════════════════════

  /** 由测评答案生成完整画像（计分 → 原型 → 风味偏好） */
  generateProfile(answers: Record<string, number>): PersonalityProfile {
    return buildProfile(answers);
  },

  /** 一站式：答案 → 画像 → 契合调酒推荐 */
  generateProfileAndRecommendations(
    answers: Record<string, number>,
    limit = 5,
  ): ProfileWithRecommendations {
    const profile = buildProfile(answers);
    const recommendations = recommendCocktails(profile.flavorPreference, limit);
    return { profile, recommendations };
  },

  // ═════════════════════════════════════════════════════════
  // 调酒推荐 · 三条路径
  // ═════════════════════════════════════════════════════════

  /** 按人格画像的风味偏好推荐 */
  recommendByProfile(
    profile: PersonalityProfile,
    limit = 5,
  ): CocktailRecommendation[] {
    return recommendCocktails(profile.flavorPreference, limit);
  },

  /** 按风味偏好直接推荐（无需完整画像） */
  recommendByPreference(
    preference: FlavorPreference,
    limit = 5,
  ): CocktailRecommendation[] {
    return recommendCocktails(preference, limit);
  },

  /** 按人格原型亲和推荐 · 命中 archetypeAffinity 的酒优先 */
  recommendByArchetype(
    archetypeCode: string,
    limit = 5,
  ): CocktailRecommendation[] {
    return matchByArchetype(archetypeCode, limit);
  },

  /**
   * 按六维向量推荐调酒 · 新入口（向量派生）
   * 牌类入口使用 · 内部由 flavorFromVector 派生八维风味偏好再走统一推荐流程
   * 与测评入口（recommendByProfile）共享同一推荐逻辑，保证数据契约一致
   *
   * @param vec 六维人格向量 [-1, 1]
   * @param limit 返回前 N 款 · 默认 5
   */
  recommendByVector(
    vec: PersonaVector,
    limit = 5,
  ): CocktailRecommendation[] {
    return recommendByVector(vec, limit);
  },

  /**
   * 时段感知推荐 · 画像风味偏好 × 0.6 + 时段情绪调整 × 0.4
   * 让推荐随夜的深浅呼吸
   *
   * @param profile 人格画像
   * @param date 指定时刻（默认当前时间）· 便于测试与回放
   * @param limit 返回条数
   */
  recommendByTime(
    profile: PersonalityProfile,
    date: Date = new Date(),
    limit = 5,
  ): CocktailRecommendation[] {
    const slot = getTimeSlot(date);
    const blended = blendWithTime(profile.flavorPreference, slot);
    return recommendCocktails(blended, limit);
  },

  /**
   * 情绪调节推荐 · 画像 × 时段 × 主动情绪 三方融合
   * 让用户此刻选择的心境，参与推荐织造
   *
   * 融合权重（默认）：画像 0.5 + 时段 0.2 + 情绪 0.3 × intensity
   * 调节器关闭（mood=null 或 intensity=0）时，退化为时段感知推荐
   *
   * @param profile 人格画像
   * @param mood 用户主动选择的情绪 · null 表示关闭调节
   * @param intensity 情绪强度 0-1 · 默认 0.5
   * @param date 指定时刻（默认当前时间）· 便于测试与回放
   * @param limit 返回条数
   */
  recommendByMood(
    profile: PersonalityProfile,
    mood: MoodTag | null,
    intensity = 0.5,
    date: Date = new Date(),
    limit = 5,
  ): CocktailRecommendation[] {
    const slot = getTimeSlot(date);
    const blended = blendWithMood(
      profile.flavorPreference,
      slot,
      mood,
      intensity,
    );
    return recommendCocktails(blended, limit);
  },

  /**
   * 旅程化推荐 · 画像 × 时段 × 情绪 三方融合 + 阶段刺激档位加权
   * 在情绪调节推荐之上叠加「情绪回路」编排：
   *   - 由情绪强度 + 情绪类型解析四阶段（开场/上升/高潮/收尾）
   *   - 按阶段刺激档位（低/中/高）重排推荐候选
   *   - 每条附阶段、刺激信息、音乐曲目
   *
   * @param profile 人格画像
   * @param mood 主动情绪 · null 关闭调节（退化为开场阶段）
   * @param intensity 情绪强度 0-1
   * @param date 指定时刻（默认当前时间）
   * @param limit 返回条数
   */
  recommendByJourney(
    profile: PersonalityProfile,
    mood: MoodTag | null,
    intensity: number,
    date: Date = new Date(),
    limit = 5,
  ): JourneyRecommendation[] {
    return recommendByJourney(profile, mood, intensity, date, limit);
  },

  /**
   * 旅程化推荐 · 六维向量入口 · 牌类入口产物作为唯一数据契约
   * 内部由 flavorFromVector 派生八维风味偏好，再走统一旅程推荐流程
   * 与画像入口（recommendByJourney）共享同一档位加权逻辑
   *
   * @param vec 六维人格向量 [-1, 1]
   * @param mood 主动情绪 · null 关闭调节
   * @param intensity 情绪强度 0-1
   * @param date 指定时刻（默认当前时间）
   * @param limit 返回条数
   */
  recommendByJourneyVector(
    vec: PersonaVector,
    mood: MoodTag | null,
    intensity: number,
    date: Date = new Date(),
    limit = 5,
  ): JourneyRecommendation[] {
    return recommendByJourneyVector(vec, mood, intensity, date, limit);
  },

  /**
   * 解析当前旅程状态 · 阶段 + 元数据 + 期望刺激档位
   * 供 UI 渲染旅程弧线与音乐控件，无需画像即可调用
   */
  getJourneyState(mood: MoodTag | null, intensity: number): JourneyState {
    return getJourneyState(mood, intensity);
  },

  /** 取当前阶段 + 情绪对应的音乐曲目 · 供 musicEngine 合成 */
  getJourneyTrack(mood: MoodTag | null, intensity: number): MusicTrack {
    return getJourneyTrack(mood, intensity);
  },

  /**
   * 派生杯底光效参数 · 人格 × 阶段 × 情绪
   * 供 LightCanvas 渲染可编程 LED 灯环模拟
   *
   * @param profile 人格画像 · null 时主色取默认深空紫
   * @param mood 主动情绪 · null 时强调色取阶段色
   * @param intensity 情绪强度 0-1
   */
  getLightEffect(
    profile: PersonalityProfile | null,
    mood: MoodTag | null,
    intensity: number,
  ): LightEffect {
    const journeyState = getJourneyState(mood, intensity);
    return getLightEffect(profile, journeyState, mood);
  },

  /**
   * 派生杯底光效参数 · 六维向量派生入口
   * 主色由六维色环 Top-1 维度插值派生 · 其余参数（强调色/强度/模式/速度）与旧入口一致
   *
   * @param vec 六维人格向量 · 全零时主色取默认紫晶
   * @param mood 主动情绪 · null 时强调色取阶段色
   * @param intensity 情绪强度 0-1
   */
  getLightByVector(
    vec: PersonaVector,
    mood: MoodTag | null,
    intensity: number,
  ): LightEffect {
    const journeyState = getJourneyState(mood, intensity);
    return getLightByVector(vec, journeyState, mood);
  },

  /**
   * 派生杯垫气味配方 · 人格 × 阶段
   * 供 ScentCard 渲染气味配方可视化
   *
   * @param profile 人格画像 · null 时签名气味取默认琥珀
   */
  getScentProfile(
    profile: PersonalityProfile | null,
    mood: MoodTag | null,
    intensity: number,
  ): ScentProfile {
    const journeyState = getJourneyState(mood, intensity);
    return getScentProfile(profile, journeyState);
  },

  /**
   * 派生杯垫气味配方 · 六维向量派生入口
   * 签名气味由向量 Top-1 维度派生 · 主调/强度/扩散模式仍由阶段决定
   *
   * @param vec 六维人格向量 · 全零时签名取默认琥珀
   * @param mood 主动情绪 · 仅用于解析阶段
   * @param intensity 情绪强度 0-1
   */
  getScentByVector(
    vec: PersonaVector,
    mood: MoodTag | null,
    intensity: number,
  ): ScentProfile {
    const journeyState = getJourneyState(mood, intensity);
    return getScentByVector(vec, journeyState);
  },

  /** 取酒款刺激程度信息 · level(0-1) + tier(low/mid/high) */
  getStimulationInfo(cocktail: Cocktail): StimulationInfo {
    return getStimulationInfo(cocktail);
  },

  // ═════════════════════════════════════════════════════════
  // 单一查询
  // ═════════════════════════════════════════════════════════

  /** 按 id 取酒 */
  getCocktail(id: string): Cocktail | undefined {
    return getCocktailById(id);
  },

  /** 关键词模糊搜索（中英名 / 基酒 / 情绪） */
  searchCocktails(keyword: string): Cocktail[] {
    return searchCocktails(keyword);
  },

  /** 按情绪标签筛选 */
  filterByMood(mood: MoodTag): Cocktail[] {
    return filterByMood(mood);
  },

  /** 全部酒单 */
  getAllCocktails(): Cocktail[] {
    return COCKTAILS;
  },

  // ═════════════════════════════════════════════════════════
  // 元数据
  // ═════════════════════════════════════════════════════════

  /** 人格五维元数据 */
  getTraits(): TraitMeta[] {
    return PERSONALITY_TRAITS;
  },

  /** 人格原型集 */
  getArchetypes(): PersonalityArchetype[] {
    return PERSONALITY_ARCHETYPES;
  },

  /** 八维风味轮元数据 */
  getFlavors(): FlavorMeta[] {
    return FLAVOR_META;
  },

  /** 八维情绪元数据 · 供情绪调节器渲染（标签、色、诗、符号） */
  getMoodMeta(): MoodMeta[] {
    return MOOD_META;
  },

  /** 旅程四阶段元数据 · 顺序固定（开场→上升→高潮→收尾），供旅程弧线渲染 */
  getJourneyPhaseMeta(): JourneyPhaseMeta[] {
    return JOURNEY_PHASE_ORDER.map((phase) => JOURNEY_PHASE_META[phase]);
  },

  /** 旅程音乐曲目库 · 供音乐控件展示与切换 */
  getMusicTracks(): MusicTrack[] {
    return MUSIC_TRACKS;
  },

  /**
   * 取当前时段信息 · 供 UI 渲染氛围（标签、诗化描述、主色）
   * @param date 指定时刻（默认当前时间）· 便于测试与回放
   */
  getCurrentTimeSlot(date: Date = new Date()): TimeSlotInfo {
    return getTimeSlot(date);
  },

  // ═════════════════════════════════════════════════════════
  // 画像持久化 · localStorage
  // ═════════════════════════════════════════════════════════

  /** 持久化画像到本地 · 存储不可用时静默降级 */
  saveProfile(profile: PersonalityProfile): void {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* 存储不可用 · 静默降级 */
    }
  },

  /** 从本地读取画像 · 解析失败或不存在返回 null */
  loadProfile(): PersonalityProfile | null {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PersonalityProfile;
    } catch {
      return null;
    }
  },

  /** 清除本地画像 */
  clearProfile(): void {
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      /* 同上 */
    }
  },

  // ═════════════════════════════════════════════════════════
  // 六维向量持久化 · 牌类入口产物
  // 与画像持久化独立存储 · 牌类入口落库后即可作为唯一数据契约驱动全部派生层
  // ═════════════════════════════════════════════════════════

  /** 持久化六维向量到本地 · 存储不可用时静默降级 */
  saveVector(vec: PersonaVector): void {
    try {
      localStorage.setItem(VECTOR_STORAGE_KEY, JSON.stringify(vec));
    } catch {
      /* 存储不可用 · 静默降级 */
    }
  },

  /** 从本地读取六维向量 · 解析失败或不存在返回 null */
  loadVector(): PersonaVector | null {
    try {
      const raw = localStorage.getItem(VECTOR_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<PersonaVector>;
      // 完整性校验 · 六维必须全部为数字
      const dims: (keyof PersonaVector)[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];
      const vec = {} as PersonaVector;
      for (const d of dims) {
        const v = parsed[d];
        if (typeof v !== 'number' || Number.isNaN(v)) return null;
        vec[d] = v;
      }
      return vec;
    } catch {
      return null;
    }
  },

  /** 清除本地六维向量 */
  clearVector(): void {
    try {
      localStorage.removeItem(VECTOR_STORAGE_KEY);
    } catch {
      /* 同上 */
    }
  },

  // ═════════════════════════════════════════════════════════
  // 牌类人格融合 · 数据入口层
  // 四套牌类（塔罗/星盘/扑克/德州）采集结果 → 六维人格向量
  // 作为可编程酒馆的「数据入口层」产物，落库后即作为唯一数据契约驱动全部派生层
  // ═════════════════════════════════════════════════════════

  /**
   * 融合四套牌类采集结果 → 六维人格向量 + 标签
   * 接受任意子集，缺失模块跳过（MVP 简化：缺失模块不补权）
   *
   * 派生链：
   *   TarotResult   → 三牌阵加权（过去0.2/现在0.5/未来0.3）+ 逆位反转
   *   ZodiacResult  → 六星体 × 四象 权重累加
   *   PokerResult   → 牌型直接映射
   *   TexasResult   → 行为计数 + 决策速度 + 诈唬加成
   *   四向量加权融合 → 归一化 → 人格标签
   *
   * @param input 四套牌类采集结果（任意子集）
   * @returns 融合产物 · 含 finalVector / personaTag / breakdown
   */
  fusePersona(input: FusionInput): PersonaFusion {
    return fusePersonaEngine(input);
  },

  /**
   * 一站式：四套牌类采集 → 融合 → 持久化向量
   * 供卡牌采集页完成最后一步时调用 · 落库后直接驱动调酒/光效/香氛派生
   *
   * @param input 四套牌类采集结果
   * @returns 融合产物（含 finalVector）· 调用方可继续读取 breakdown 展示
   */
  fuseAndSaveVector(input: FusionInput): PersonaFusion {
    const fusion = fusePersonaEngine(input);
    this.saveVector(fusion.finalVector);
    return fusion;
  },

  // ═════════════════════════════════════════════════════════
  // 角色人格矩阵 · 3 角色 × 10 位代表人物
  // 用户选择角色身份 → 系统按向量匹配该组内最接近的人物 → 输出人格标签 + 角色标签 + 酒体
  // ═════════════════════════════════════════════════════════

  /** 三角色元数据 · 创业家/投资人/架构师 */
  getRoles(): RoleMeta[] {
    return ROLES;
  },

  /** 按角色类型取该组的 10 位代表人物 */
  getRolePersonas(role: RoleType): RolePersona[] {
    return getPersonasByRole(role);
  },

  /** 取角色元数据 · 未命中抛错便于排查 */
  getRoleMeta(role: RoleType): RoleMeta {
    return ROLE_MAP[role];
  },

  /**
   * 角色匹配主入口 · 向量 × 角色 → 匹配人物 + 标签 + 酒体
   *
   * 派生链：
   *   用户向量 + 选择角色
   *     → 该角色组 10 位人物
   *     → 余弦相似度 Top-1
   *     → 输出 MBTI · 人格标签 · 角色标签 · 酒体
   *
   * @param vec 用户六维向量 · null 时返回该组默认代表（index 1）
   * @param role 用户选择的角色类型
   */
  matchRolePersona(
    vec: PersonaVector | null,
    role: RoleType,
  ): RoleMatchResult {
    return matchRolePersonaEngine(vec, role);
  },

  /**
   * 角色层调酒推荐 · 基础向量 × 角色系数 → 专属调酒列表
   *
   * 派生链：
   *   1. 基础向量 + vectorAdj → 调整后向量
   *   2. 调整后向量 → flavorFromVector → 基础风味偏好
   *   3. 基础偏好 + flavorShift → 最终偏好
   *   4. 最终偏好 → recommendCocktails → 专属调酒
   *
   * @param vec 用户六维向量 · null 时返回空数组
   * @param role 用户选择的角色类型
   * @param limit 返回前 N 款 · 默认 3
   */
  recommendByRoleVector(
    vec: PersonaVector | null,
    role: RoleType,
    limit = 3,
  ): CocktailRecommendation[] {
    return recommendByRoleVectorEngine(vec, role, limit);
  },

  /** 取角色风味调整系数 · 含 vectorAdj / flavorShift / effect / temperature */
  getRoleFlavorAdjustment(role: RoleType): RoleFlavorAdjustment {
    return getRoleFlavorAdjustment(role);
  },

  /** 全部角色风味调整系数 · 3 角色 */
  getAllRoleFlavorAdjustments(): RoleFlavorAdjustment[] {
    return (['entrepreneur', 'investor', 'architect'] as RoleType[]).map(
      (r) => ROLE_FLAVOR_ADJUSTMENT[r],
    );
  },

  /**
   * 单步演示 · 应用角色层向量调整
   * 用于 UI 展示「基础向量 → 角色调整后向量」的对比
   */
  applyRoleVectorAdjustment(vec: PersonaVector, role: RoleType): PersonaVector {
    return applyRoleVectorAdjustmentEngine(vec, role);
  },

  /**
   * 单步演示 · 应用角色层风味偏移
   * 用于 UI 展示「基础偏好 → 角色偏移后偏好」的对比
   */
  applyRoleFlavorShift(pref: FlavorPreference, role: RoleType): FlavorPreference {
    return applyRoleFlavorShiftEngine(pref, role);
  },

  /** 全部角色矩阵 · 30 位 */
  getAllRolePersonas(): RolePersona[] {
    return ROLE_PERSONAS;
  },

  // ═════════════════════════════════════════════════════════
  // 可编程酒馆 · 场所级夜程编排
  // ═════════════════════════════════════════════════════════

  /** 全部场所主题 */
  getTavernThemes(): TavernTheme[] {
    return TAVERN_THEMES;
  },

  /** 按 code 取主题 · 未命中返回默认主题 */
  getTavernTheme(code: string): TavernTheme {
    return getTavernThemeByCode(code);
  },

  /**
   * 派生当前酒馆夜程状态 · 主题 × 时间 → 全场基调
   * 供 TavernPage 渲染夜程弧线与环境光，无需画像/向量即可调用
   *
   * @param theme 场所主题 · 默认深空夜航
   * @param date 指定时刻（默认当前时间）· 便于测试与回放
   */
  getTavernState(
    theme: TavernTheme = DEFAULT_TAVERN_THEME,
    date: Date = new Date(),
  ): TavernState {
    return getTavernState(theme, date, DEFAULT_NIGHT_CURVE);
  },

  /** 仅解析当前夜程阶段 · 轻量入口 */
  getNightPhase(date: Date = new Date()): import('../types/journey').JourneyPhase {
    return getNightPhase(date, DEFAULT_NIGHT_CURVE);
  },

  /** 整夜进度 0-1 · 供夜程弧线渲染 */
  getNightProgress(date: Date = new Date()): number {
    return getNightProgress(date, DEFAULT_NIGHT_CURVE);
  },

  /** 当前阶段内进度 0-1 */
  getPhaseProgress(date: Date = new Date()): number {
    const phase = getNightPhase(date, DEFAULT_NIGHT_CURVE);
    return getPhaseProgress(date, DEFAULT_NIGHT_CURVE[phase]);
  },

  /** 持久化场所主题偏好到本地 */
  saveTavernTheme(theme: TavernTheme): void {
    try {
      localStorage.setItem(TAVERN_THEME_STORAGE_KEY, theme.code);
    } catch {
      /* 存储不可用 · 静默降级 */
    }
  },

  /** 从本地读取场所主题 · 解析失败或不存在返回默认主题 */
  loadTavernTheme(): TavernTheme {
    try {
      const code = localStorage.getItem(TAVERN_THEME_STORAGE_KEY);
      if (!code) return DEFAULT_TAVERN_THEME;
      return getTavernThemeByCode(code);
    } catch {
      return DEFAULT_TAVERN_THEME;
    }
  },

  /** 清除本地场所主题偏好 */
  clearTavernTheme(): void {
    try {
      localStorage.removeItem(TAVERN_THEME_STORAGE_KEY);
    } catch {
      /* 同上 */
    }
  },
} as const;

export type CocktailService = typeof cocktailService;
