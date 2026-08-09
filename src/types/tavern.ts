/**
 * 可编程酒馆 · 三层空间类型契约
 *
 * Y.Mine 把「可编程」理念落地为三层空间，从宏观到微观：
 *   1. 可编程酒馆（Tavern）      · 场所级氛围编排 · 主题 × 夜程曲线
 *   2. 可编程调酒空间（CocktailSpace）· 调酒体验交互区 · 向量 × 情绪 × 时段
 *   3. 可编程吧台（BarCounter）   · 单杯硬件联动 · 杯垫 × 光效 × 气味
 *
 * 三层共享同一数据契约（六维 PersonaVector）与同一情绪回路（四阶段 JourneyPhase），
 * 差异在编排粒度与输出通道。本文件定义三层的 state 接口与场所主题/夜程契约。
 *
 * 派生链：
 *   时间 × 主题 → 夜程阶段 → TavernState（全场基调）
 *   向量 × 情绪 × 时段 → CocktailSpaceState（推荐多轨 · 复用现有 journeyEngine）
 *   向量 × 阶段 → BarCounterState（单杯光效/气味 · 复用现有 lightEngine/scentEngine）
 */

import type { PersonaVector } from './personaFusion';
import type {
  JourneyPhase,
  JourneyPhaseMeta,
  LightEffect,
  ScentProfile,
} from './journey';
import type { CocktailRecommendation, MoodTag } from './cocktail';

// ═════════════════════════════════════════════════════════
// 可编程酒馆 · 场所级
// ═════════════════════════════════════════════════════════

/**
 * 夜程时间窗口 · "HH:MM" 24 小时制
 * 跨日窗口（如 23:00 → 01:00）由夜程编排器识别并正确解析
 */
export interface NightWindow {
  start: string;
  end: string;
}

/**
 * 夜程曲线 · 定义四阶段在一场夜里的时间窗口
 * 缺省由 DEFAULT_NIGHT_CURVE 提供（20:00 起的标准化夜程）
 */
export interface NightCurve {
  opening: NightWindow;
  rising: NightWindow;
  climax: NightWindow;
  closing: NightWindow;
}

/** 各夜程阶段在主题下的微调参数 */
export interface TavernPhaseTuning {
  /** 环境光偏移色 · 叠加在主题 ambientColor 之上 */
  colorShift: string;
  /** BPM 区间 · 阶段内按夜程进度插值 */
  bpmRange: [number, number];
  /** 空间香氛强度 0-1 */
  scentIntensity: number;
}

/** 场所主题 · 一套全场基调预设 */
export interface TavernTheme {
  code: string;
  name: string;
  tagline: string;
  description: string;
  /** 全场环境光基调 */
  ambientColor: string;
  /** 强调色 · 与 ambientColor 形成主辅关系 */
  accentColor: string;
  /** 环境音乐风格标签 */
  musicStyle: string;
  /** 空间香氛 note · 全场底香 */
  ambientScent: string;
  /** 空间香氛中文名 */
  ambientScentLabel: string;
  /** 单字符号 · 镜月隐喻 */
  symbol: string;
  /** 四阶段微调 */
  phaseTuning: Record<JourneyPhase, TavernPhaseTuning>;
}

/** 酒馆状态 · 由时间 × 主题派生的全场夜程状态 */
export interface TavernState {
  /** 当前主题 */
  theme: TavernTheme;
  /** 当前夜程阶段 */
  phase: JourneyPhase;
  /** 阶段元数据（复用 JOURNEY_PHASE_META） */
  phaseMeta: JourneyPhaseMeta;
  /** 当前时刻是否落在夜程窗口内 · false 表示非营业时段（夜未启） */
  withinNight: boolean;
  /** 派生环境光 · 主题基调 × 阶段偏移 */
  ambientColor: string;
  /** 派生空间香氛强度 · 主题阶段调谐 */
  ambientScentIntensity: number;
  /** 派生 BPM · 阶段区间内按夜程进度插值 */
  bpm: number;
  /** 整夜进度 0-1 · 从 opening 起点到 closing 终点 */
  nightProgress: number;
  /** 当前阶段内进度 0-1 */
  phaseProgress: number;
}

// ═════════════════════════════════════════════════════════
// 可编程调酒空间 · 调酒体验区（骨架占位 · 复用现有实现）
// ═════════════════════════════════════════════════════════

/**
 * 调酒空间状态 · 聚合向量推荐 + 情绪回路 + 风味派生
 * MVP 阶段复用 useCocktail/useJourney 产出，本接口作为三层统一视图
 * 后续扩展：多轨推荐（主推/对照/冒险）、八维风味轮
 */
export interface CocktailSpaceState {
  vector: PersonaVector | null;
  activeMood: MoodTag | null;
  moodIntensity: number;
  journeyRecommendations: CocktailRecommendation[];
  /** 占位 · 多轨推荐（后续填充） */
  multiTrack?: CocktailMultiTrack;
}

/** 多轨并行推荐 · 呼应「多轨并行架构」偏好 · 占位接口 */
export interface CocktailMultiTrack {
  main: CocktailRecommendation[];
  contrast: CocktailRecommendation[];
  adventure: CocktailRecommendation[];
}

// ═════════════════════════════════════════════════════════
// 可编程吧台 · 单杯级（骨架占位 · 复用现有实现）
// ═════════════════════════════════════════════════════════

/**
 * 吧台状态 · 聚合单杯光效 + 气味配方 + 杯垫硬件状态
 * MVP 阶段复用 lightEngine/scentEngine 产出，本接口作为三层统一视图
 * 后续扩展：硬件协议层、杯垫状态机、多杯垫协同
 */
export interface BarCounterState {
  lightEffect: LightEffect;
  scentProfile: ScentProfile;
  /** 占位 · 杯垫硬件状态（后续填充） */
  coaster?: CoasterState;
}

/** 杯垫状态机 · 占位接口 · 后续对接实体硬件协议 */
export interface CoasterState {
  coasterId: string;
  /** 当前释放气味 note */
  activeScent: string;
  /** 风扇转速 0-1 */
  fanSpeed: number;
  /** 加热元件开关 */
  heating: boolean;
  /** 杯垫模式：在馆 / 带走 / 纪念 */
  mode: 'in-house' | 'takeaway' | 'souvenir';
}
