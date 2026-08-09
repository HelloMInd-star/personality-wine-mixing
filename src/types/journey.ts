/**
 * 情绪旅程类型系统
 * 把情绪调节器从静态控件升级为「情绪回路导演」
 * 四阶段回路：开场 → 上升 → 高潮 → 收尾，由情绪强度与情绪类型共同解析
 *
 * 刺激程度由酒款八维风味派生，零数据改动
 * 音乐由 AudioContext 程序化合成，零音频文件依赖
 */

import type { CocktailRecommendation, MoodTag } from './cocktail';

/** 旅程四阶段 · 情绪回路 */
export type JourneyPhase = 'opening' | 'rising' | 'climax' | 'closing';

/** 酒款刺激程度档位 */
export type StimulationTier = 'low' | 'mid' | 'high';

/** 阶段元数据 · 供 UI 渲染与音乐合成共享 */
export interface JourneyPhaseMeta {
  phase: JourneyPhase;
  /** 中文标签 */
  label: string;
  /** 诗化描述 */
  poem: string;
  /** 阶段主色 · 与深空紫金色谱一致 */
  color: string;
  /** 单字符号 · 呼应镜月隐喻 */
  symbol: string;
  /** 该阶段推荐的刺激档位 */
  stimulationTier: StimulationTier;
  /** 音乐 BPM · 节奏随阶段递进 */
  bpm: number;
  /** 音乐能量 0-1 · 合成器参数 */
  energy: number;
  /** 推荐曲目风格标签 */
  musicStyle: string;
}

/** 酒款刺激程度信息 */
export interface StimulationInfo {
  /** 0-1 连续值 */
  level: number;
  /** 档位 */
  tier: StimulationTier;
}

/** 旅程解析结果 · 由情绪 + 强度派生 */
export interface JourneyState {
  /** 当前阶段 */
  phase: JourneyPhase;
  /** 阶段元数据 */
  meta: JourneyPhaseMeta;
  /** 期望的刺激档位 */
  stimulationTier: StimulationTier;
}

/** 音乐曲目元数据 · 程序化合成的参数模板 */
export interface MusicTrack {
  id: string;
  /** 曲名 · 诗化 */
  title: string;
  /** 副标题 · 风格注脚 */
  subtitle: string;
  /** 对应阶段 */
  phase: JourneyPhase;
  /** BPM */
  bpm: number;
  /** 能量 0-1 */
  energy: number;
  /** 亲和的情绪 · 用于阶段内的微调 */
  moodAffinity: MoodTag[];
  /** 合成参数 · 传给 musicEngine */
  synth: {
    /** 根音频率 Hz */
    rootFreq: number;
    /** 音色类型 */
    timbre: 'sine' | 'triangle' | 'sawtooth' | 'square';
    /** 滤波器截止频率 Hz */
    filterFreq: number;
    /** 混响程度 0-1 */
    reverb: number;
  };
}

/** 旅程推荐结果 · 在调酒推荐上叠加阶段与音乐 */
export interface JourneyRecommendation extends CocktailRecommendation {
  /** 旅程阶段 */
  phase: JourneyPhase;
  /** 该酒款的刺激程度信息 */
  stimulation: StimulationInfo;
  /** 该阶段 + 情绪选中的音乐曲目 */
  track: MusicTrack;
}

/**
 * 光效动画模式 · 与旅程四阶段对应
 * - breath  · 开场 · 缓慢明暗呼吸，呼应夜幕初落
 * - flow    · 上升 · 光带沿环周流动，呼应灯火渐醒
 * - pulse   · 高潮 · 随 BPM 节拍脉动，呼应焰心向夜
 * - aurora  · 收尾 · 多色极光缓流，呼应余烬归寂
 */
export type LightPattern = 'breath' | 'flow' | 'pulse' | 'aurora';

/**
 * 杯底光效参数 · 由人格 × 阶段 × 情绪派生
 * 驱动 LightCanvas 的 Canvas 渲染，模拟可编程 LED 灯环
 */
export interface LightEffect {
  /** 主色 · 人格原型 auraColor · 无画像时取深空紫 */
  baseColor: string;
  /** 强调色 · 情绪色优先，无情绪取阶段色 */
  accentColor: string;
  /** 光效强度 0-1 · 复用阶段 energy */
  intensity: number;
  /** 动画模式 · 由阶段决定 */
  pattern: LightPattern;
  /** 动画速度 0-1 · 由 BPM 归一化（128 BPM = 1.0） */
  speed: number;
  /** 粒子密度 0-1 · 模拟烟雾散射感 · 随能量派生 */
  particleDensity: number;
}

/**
 * 气味扩散模式 · 与旅程四阶段对应
 * - breath  · 开场 · 温和呼吸式扩散
 * - spread  · 上升 · 加速铺开
 * - burst   · 高潮 · 爆发释放
 * - fade    · 收尾 · 缓慢淡出
 */
export type ScentDiffusion = 'breath' | 'spread' | 'burst' | 'fade';

/**
 * 气味配方 · 由人格 × 阶段派生
 * 驱动 ScentCard 可视化 · 软件层编排「哪种气味、何时释放、多强」
 *
 * 设计呼应「杯垫独立性」：配方可离线派生、可序列化导出，
 * 每个人格原型有专属签名气味，阶段决定主调与扩散节奏
 */
export interface ScentProfile {
  /** 主调气味 · 阶段决定（舒缓/活力/专属/余韵） */
  primaryNote: string;
  /** 签名气味 · 人格原型专属 · 全程不变 */
  signatureNote: string;
  /** 主调中文名 · 供 UI 展示 */
  primaryLabel: string;
  /** 签名中文名 · 供 UI 展示 */
  signatureLabel: string;
  /** 签名单字符号 · 镜月隐喻 · 供中心标识渲染 */
  signatureSymbol: string;
  /** 释放强度 0-1 · 复用阶段 energy */
  intensity: number;
  /** 扩散模式 · 由阶段决定 */
  diffusion: ScentDiffusion;
  /** 诗化描述 · 气味意境 */
  poem: string;
}
