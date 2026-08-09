/**
 * 情绪旅程元数据 · 旅程层单一数据源
 * 四阶段回路元数据 + 程序化音乐曲目合成参数
 *
 * 色取紫金与琥珀色谱，与风味轮、时段色、情绪色保持一致的深空语境
 * 音乐参数由 musicEngine 读取，用 AudioContext 程序化合成，零音频文件依赖
 */

import type {
  JourneyPhase,
  JourneyPhaseMeta,
  MusicTrack,
} from '../types/journey';

/**
 * 四阶段元数据 · 顺序固定，对应情绪回路的开→升→炽→归
 *
 * 刺激档位与 BPM 随阶段递进：
 *   opening  · low  · 60 BPM · 舒缓环境音
 *   rising   · mid  · 90 BPM · 节拍渐起
 *   climax   · high · 128 BPM · 和弦垫 + 强节拍
 *   closing  · low  · 65 BPM · 舒缓回归
 */
export const JOURNEY_PHASE_META: Record<JourneyPhase, JourneyPhaseMeta> = {
  opening: {
    phase: 'opening',
    label: '开场',
    poem: '夜幕初落，杯沿凝霜。',
    color: '#7c8db5', // 月蓝
    symbol: '启',
    stimulationTier: 'low',
    bpm: 60,
    energy: 0.2,
    musicStyle: '环境氛围 · 低频呼吸',
  },
  rising: {
    phase: 'rising',
    label: '上升',
    poem: '灯火渐醒，心跳成节。',
    color: '#d4af7a', // 香槟金
    symbol: '渐',
    stimulationTier: 'mid',
    bpm: 90,
    energy: 0.5,
    musicStyle: '深空节拍 · 律动渐起',
  },
  climax: {
    phase: 'climax',
    label: '高潮',
    poem: '焰心向夜，万物成歌。',
    color: '#e06552', // 焰红
    symbol: '炽',
    stimulationTier: 'high',
    bpm: 128,
    energy: 0.9,
    musicStyle: '和弦垫 · 焰心渐强',
  },
  closing: {
    phase: 'closing',
    label: '收尾',
    poem: '余烬归寂，月落杯心。',
    color: '#6b5b95', // 暮紫
    symbol: '归',
    stimulationTier: 'low',
    bpm: 65,
    energy: 0.25,
    musicStyle: '余韵舒缓 · 子夜回归',
  },
};

/** 阶段顺序 · 用于遍历与可视化 */
export const JOURNEY_PHASE_ORDER: JourneyPhase[] = [
  'opening',
  'rising',
  'climax',
  'closing',
];

/**
 * 程序化音乐曲目库 · 每阶段两首，对应不同情绪亲和
 * 合成参数传给 musicEngine，由 AudioContext 实时合成
 *
 * 频率取自等比律：A3=220, C4=261.63, E4=329.63, G3=196
 */
export const MUSIC_TRACKS: MusicTrack[] = [
  // ── 开场 · 低刺激 · 舒缓 ──
  {
    id: 'moonlit-stillness',
    title: '月下寂止',
    subtitle: 'Moonlit Stillness',
    phase: 'opening',
    bpm: 60,
    energy: 0.2,
    moodAffinity: ['calm', 'melancholy'],
    synth: {
      rootFreq: 220, // A3
      timbre: 'sine',
      filterFreq: 800,
      reverb: 0.7,
    },
  },
  {
    id: 'dawn-whisper',
    title: '晨语低回',
    subtitle: 'Dawn Whisper',
    phase: 'opening',
    bpm: 64,
    energy: 0.25,
    moodAffinity: ['elegant', 'romantic'],
    synth: {
      rootFreq: 261.63, // C4
      timbre: 'sine',
      filterFreq: 900,
      reverb: 0.65,
    },
  },

  // ── 上升 · 中刺激 · 节拍渐起 ──
  {
    id: 'amber-pulse',
    title: '琥珀脉动',
    subtitle: 'Amber Pulse',
    phase: 'rising',
    bpm: 90,
    energy: 0.5,
    moodAffinity: ['passion', 'celebration'],
    synth: {
      rootFreq: 261.63, // C4
      timbre: 'triangle',
      filterFreq: 1200,
      reverb: 0.5,
    },
  },
  {
    id: 'velvet-current',
    title: '丝绒暗流',
    subtitle: 'Velvet Current',
    phase: 'rising',
    bpm: 88,
    energy: 0.48,
    moodAffinity: ['mystery', 'rebel'],
    synth: {
      rootFreq: 220, // A3
      timbre: 'triangle',
      filterFreq: 1100,
      reverb: 0.55,
    },
  },

  // ── 高潮 · 高刺激 · 焰心渐强 ──
  {
    id: 'ignition-veil',
    title: '焰心之帷',
    subtitle: 'Ignition Veil',
    phase: 'climax',
    bpm: 128,
    energy: 0.9,
    moodAffinity: ['passion', 'rebel'],
    synth: {
      rootFreq: 329.63, // E4
      timbre: 'sawtooth',
      filterFreq: 2400,
      reverb: 0.3,
    },
  },
  {
    id: 'golden-crescendo',
    title: '流金渐强',
    subtitle: 'Golden Crescendo',
    phase: 'climax',
    bpm: 126,
    energy: 0.88,
    moodAffinity: ['celebration', 'romantic'],
    synth: {
      rootFreq: 293.66, // D4
      timbre: 'sawtooth',
      filterFreq: 2200,
      reverb: 0.35,
    },
  },

  // ── 收尾 · 低刺激 · 舒缓回归 ──
  {
    id: 'ember-settle',
    title: '余烬归寂',
    subtitle: 'Ember Settle',
    phase: 'closing',
    bpm: 65,
    energy: 0.25,
    moodAffinity: ['calm', 'melancholy'],
    synth: {
      rootFreq: 196, // G3
      timbre: 'sine',
      filterFreq: 600,
      reverb: 0.8,
    },
  },
  {
    id: 'midnight-return',
    title: '子夜归途',
    subtitle: 'Midnight Return',
    phase: 'closing',
    bpm: 68,
    energy: 0.28,
    moodAffinity: ['elegant', 'mystery'],
    synth: {
      rootFreq: 174.61, // F3
      timbre: 'sine',
      filterFreq: 700,
      reverb: 0.75,
    },
  },
];

/** 按阶段取曲目列表 */
export function getTracksByPhase(phase: JourneyPhase): MusicTrack[] {
  return MUSIC_TRACKS.filter((t) => t.phase === phase);
}

/**
 * 按阶段 + 情绪亲和选曲 · 无匹配时回退该阶段首曲
 * 让音乐与用户主动情绪同频
 */
export function selectTrack(
  phase: JourneyPhase,
  mood: import('../types/cocktail').MoodTag | null,
): MusicTrack {
  const tracks = getTracksByPhase(phase);
  if (tracks.length === 0) {
    // 防御性回退 · 实际不会触发
    return MUSIC_TRACKS[0];
  }
  if (!mood) return tracks[0];
  const matched = tracks.find((t) => t.moodAffinity.includes(mood));
  return matched ?? tracks[0];
}
