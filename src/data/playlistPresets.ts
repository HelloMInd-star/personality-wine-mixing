/**
 * 四梯度歌单预设 · 情绪旅程音乐层
 *
 * 与旅程四阶段（opening/rising/climax/closing）一一对应
 * 每档歌单携带网易云歌单 ID 字段（预留接入位）· 当前由 musicEngine 程序化合成白噪音底
 *
 * 接入网易云 MCP 时：
 *   1. 填入 neteasePlaylistId
 *   2. 由 service 层拉取歌单曲目 · 覆盖 tracks 占位
 *   3. 播放层切换为外链播放（music.163.com/song/media/outer/url?id={songId}.mp3）
 *
 * 当前阶段（无 MCP）：
 *   - tracks 为占位元数据 · 供 UI 展示曲目意境
 *   - 实际播放仍由 musicEngine 合成白噪音底 · 与四档色调一致
 */

import type { JourneyPhase } from '../types/journey';

/** 歌单档位 · 与旅程阶段一一对应 */
export type PlaylistTier = 'low' | 'mid' | 'high' | 'close';

/** 占位曲目元数据 · 接入网易云后由真实曲目覆盖 */
export interface PlaylistTrack {
  /** 曲目 ID · 接入网易云后替换为真实 songId */
  id: string;
  /** 曲名 */
  title: string;
  /** 艺术家 */
  artist: string;
  /** 时长秒数 · 占位 */
  durationSec: number;
  /** 意境注脚 · 诗化 */
  note: string;
}

/** 四梯度歌单预设 */
export interface PlaylistPreset {
  /** 歌单 ID · 程序内引用 */
  id: string;
  /** 档位 */
  tier: PlaylistTier;
  /** 对应旅程阶段 · 用于联动 */
  phase: JourneyPhase;
  /** 中文标题 */
  title: string;
  /** 副标题 · 英文注脚 */
  subtitle: string;
  /** 诗化描述 · 与旅程元数据同语 */
  poem: string;
  /** 单字符号 · 镜月隐喻 */
  symbol: string;
  /** 主色 · 与 JOURNEY_PHASE_META 一致 */
  color: string;
  /** 网易云歌单 ID · 预留接入位 · null 表示未接入 */
  neteasePlaylistId: string | null;
  /** 占位曲目列表 · 接入网易云后覆盖 */
  tracks: PlaylistTrack[];
  /** 风格标签 · 供 UI 展示 */
  styleLabel: string;
}

/**
 * 四梯度歌单预设数据
 *
 * 色取与 JOURNEY_PHASE_META 一致的紫金琥珀色谱
 * 占位曲目意境呼应阶段诗化描述
 */
export const PLAYLIST_PRESETS: PlaylistPreset[] = [
  {
    id: 'playlist-low',
    tier: 'low',
    phase: 'opening',
    title: '夜未启',
    subtitle: 'Night Unfolded',
    poem: '杯沿凝霜，心绪初落。',
    symbol: '启',
    color: '#7c8db5', // 月蓝 · 与 opening 阶段一致
    neteasePlaylistId: null, // 预留 · 接入网易云 MCP 时填入
    styleLabel: '环境氛围 · 棕噪音底',
    tracks: [
      {
        id: 'low-1',
        title: '月下寂止',
        artist: '深空合成',
        durationSec: 240,
        note: '低频呼吸 · 棕噪音包覆',
      },
      {
        id: 'low-2',
        title: '晨语低回',
        artist: '深空合成',
        durationSec: 260,
        note: '根音 A3 · sine 柔和',
      },
    ],
  },
  {
    id: 'playlist-mid',
    tier: 'mid',
    phase: 'rising',
    title: '灯火渐醒',
    subtitle: 'Lanterns Awake',
    poem: '心跳成节，灯火次第亮起。',
    symbol: '渐',
    color: '#d4af7a', // 香槟金 · 与 rising 阶段一致
    neteasePlaylistId: null,
    styleLabel: '深空节拍 · 粉红噪音',
    tracks: [
      {
        id: 'mid-1',
        title: '琥珀脉动',
        artist: '深空合成',
        durationSec: 220,
        note: 'triangle 中频 · 弱节拍',
      },
      {
        id: 'mid-2',
        title: '丝绒暗流',
        artist: '深空合成',
        durationSec: 230,
        note: '根音 A3 · 流动底',
      },
    ],
  },
  {
    id: 'playlist-high',
    tier: 'high',
    phase: 'climax',
    title: '焰心向夜',
    subtitle: 'Ember to Night',
    poem: '万物成歌，焰心炽燃。',
    symbol: '炽',
    color: '#e06552', // 焰红 · 与 climax 阶段一致
    neteasePlaylistId: null,
    styleLabel: '和弦垫 · 宽频噪音',
    tracks: [
      {
        id: 'high-1',
        title: '焰心之帷',
        artist: '深空合成',
        durationSec: 200,
        note: 'sawtooth 高频 · 强节拍',
      },
      {
        id: 'high-2',
        title: '流金渐强',
        artist: '深空合成',
        durationSec: 210,
        note: '根音 D4 · 渐强包络',
      },
    ],
  },
  {
    id: 'playlist-close',
    tier: 'close',
    phase: 'closing',
    title: '余烬归寂',
    subtitle: 'Embers Settle',
    poem: '月落杯心，余韵归寂。',
    symbol: '归',
    color: '#6b5b95', // 暮紫 · 与 closing 阶段一致
    neteasePlaylistId: null,
    styleLabel: '余韵舒缓 · 棕噪音回归',
    tracks: [
      {
        id: 'close-1',
        title: '余烬归寂',
        artist: '深空合成',
        durationSec: 280,
        note: '根音 G3 · sine 回归',
      },
      {
        id: 'close-2',
        title: '子夜归途',
        artist: '深空合成',
        durationSec: 270,
        note: '根音 F3 · 暮紫余韵',
      },
    ],
  },
];

/** 按档位取歌单预设 */
export function getPlaylistByTier(tier: PlaylistTier): PlaylistPreset {
  return PLAYLIST_PRESETS.find((p) => p.tier === tier) ?? PLAYLIST_PRESETS[0];
}

/** 按 ID 取歌单预设 */
export function getPlaylistById(id: string): PlaylistPreset | null {
  return PLAYLIST_PRESETS.find((p) => p.id === id) ?? null;
}

/** 按旅程阶段取对应歌单预设 · 用于自动联动 */
export function getPlaylistByPhase(phase: JourneyPhase): PlaylistPreset {
  return PLAYLIST_PRESETS.find((p) => p.phase === phase) ?? PLAYLIST_PRESETS[0];
}
