/**
 * 音乐 API 客户端 · MusicApi
 *
 * 借鉴金融孪生平台 musicApi.js 的接口设计，为将来接入网易云 API 做准备。
 *
 * 当前状态：Mock 模式
 *   - 所有接口返回模拟数据，无需后端
 *   - 接口签名与金融孪生平台保持一致，后端就绪后只需替换 baseUrl
 *
 * 后端就绪后切换步骤：
 *   1. 部署 music_service.py（Python FastAPI）
 *   2. 部署 NeteaseCloudMusicApi（Node.js，端口 3000）
 *   3. 将 MOCK_MODE 改为 false
 *   4. 设置 API_BASE_URL 为后端地址
 *
 * 用法：
 *   import { musicApi } from './musicApi';
 *   const status = await musicApi.getStatus();
 *   const result = await musicApi.neteaseLogin('13800138000', 'password');
 */

import { logger } from '../engine/logger';

// ═════════════════════════════════════════════════════════
// 配置
// ═════════════════════════════════════════════════════════

/** Mock 模式开关 · 后端就绪后改为 false */
const MOCK_MODE = true;

/** 后端 API 地址 · 后端就绪后设置 */
const API_BASE_URL = 'http://localhost:8000/api';

// ═════════════════════════════════════════════════════════
// 类型定义
// ═════════════════════════════════════════════════════════

export interface NeteaseLoginResult {
  success: boolean;
  token?: string;
  userInfo?: {
    nickname: string;
    avatarUrl: string;
    userId: number;
  };
  message: string;
  demoMode?: boolean;
}

export interface PlaylistInfo {
  id: number;
  name: string;
  trackCount: number;
  coverUrl: string;
  description: string;
}

export interface TrackInfo {
  id: number;
  name: string;
  artists: Array<{ name: string; id: number }>;
  album: string;
  duration: number;
  genre?: string;
  bpm?: number;
  year?: number;
  emotion?: string;
}

export interface PlaylistTracksResult {
  success: boolean;
  tracks: TrackInfo[];
  demoMode?: boolean;
}

export interface SongUrlResult {
  success: boolean;
  url?: string;
  br?: number;
  message?: string;
}

export interface MusicStatus {
  neteaseApiAvailable: boolean;
  demoMode: boolean;
}

// ═════════════════════════════════════════════════════════
// HTTP 客户端
// ═════════════════════════════════════════════════════════

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  if (MOCK_MODE) {
    logger.info(`MusicApi:GET ${path} (mock)`, params ?? {});
    return {} as T;
  }
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const resp = await fetch(url.toString());
  if (!resp.ok) throw new Error(`API ${path} 返回 ${resp.status}`);
  return resp.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (MOCK_MODE) {
    logger.info(`MusicApi:POST ${path} (mock)`, body as Record<string, unknown>);
    return {} as T;
  }
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`API ${path} 返回 ${resp.status}`);
  return resp.json() as Promise<T>;
}

// ═════════════════════════════════════════════════════════
// API 方法
// ═════════════════════════════════════════════════════════

export const musicApi = {
  /**
   * 获取音乐服务状态
   */
  async getStatus(): Promise<MusicStatus> {
    if (MOCK_MODE) {
      return { neteaseApiAvailable: false, demoMode: true };
    }
    return apiGet<MusicStatus>('/music/status');
  },

  /**
   * 网易云手机号登录
   *
   * @param phone 手机号
   * @param password 密码（明文，后端加密传输）
   * @returns 登录结果，含 token 和用户信息
   */
  async neteaseLogin(phone: string, password: string): Promise<NeteaseLoginResult> {
    logger.info('MusicApi:neteaseLogin', { phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') });

    if (MOCK_MODE) {
      // 模拟延迟
      await delay(800);
      return {
        success: true,
        token: `mock_token_${phone}`,
        userInfo: {
          nickname: `用户_${phone.slice(-4)}`,
          avatarUrl: '',
          userId: parseInt(phone, 10) || 100000,
        },
        message: '登录成功（演示模式）',
        demoMode: true,
      };
    }

    return apiPost<NeteaseLoginResult>('/music/netease/login', { phone, password });
  },

  /**
   * 获取用户歌单列表
   *
   * @param token 登录 token
   * @param uid 用户 ID（可选）
   */
  async getUserPlaylists(token: string, uid?: number): Promise<{ success: boolean; playlists: PlaylistInfo[]; demoMode?: boolean }> {
    logger.info('MusicApi:getUserPlaylists', { hasToken: !!token, uid });

    if (MOCK_MODE) {
      await delay(500);
      return {
        success: true,
        playlists: MOCK_PLAYLISTS,
        demoMode: true,
      };
    }

    const params: Record<string, string> = { token };
    if (uid) params.uid = String(uid);
    return apiGet('/music/netease/playlists', params);
  },

  /**
   * 获取歌单曲目
   *
   * @param playlistId 歌单 ID
   * @param token 登录 token（可选）
   */
  async getPlaylistTracks(playlistId: number, token?: string): Promise<PlaylistTracksResult> {
    logger.info('MusicApi:getPlaylistTracks', { playlistId });

    if (MOCK_MODE) {
      await delay(600);
      return {
        success: true,
        tracks: generateMockTracks(playlistId),
        demoMode: true,
      };
    }

    const params: Record<string, string> = {};
    if (token) params.token = token;
    return apiGet(`/music/netease/playlist/${playlistId}`, params);
  },

  /**
   * 获取歌曲播放 URL
   *
   * @param id 歌曲 ID
   * @param token 登录 token（可选）
   */
  async getSongUrl(id: number, token?: string): Promise<SongUrlResult> {
    logger.info('MusicApi:getSongUrl', { id });

    if (MOCK_MODE) {
      await delay(300);
      return {
        success: false,
        message: '演示模式不支持播放，请接入后端后使用',
      };
    }

    const params: Record<string, string> = { id: String(id) };
    if (token) params.token = token;
    return apiGet('/music/song/url', params);
  },

  /**
   * 分析音乐画像（提交歌单数据，由后端/前端引擎处理）
   */
  async analyzeMusicProfile(payload: { playlistIds?: number[]; token?: string }): Promise<{ success: boolean; tracks?: TrackInfo[]; demoMode?: boolean }> {
    logger.info('MusicApi:analyzeMusicProfile', { playlistCount: payload.playlistIds?.length ?? 0 });

    if (MOCK_MODE) {
      await delay(1000);
      const allTracks: TrackInfo[] = [];
      const ids = payload.playlistIds ?? [1, 2, 3];
      for (const id of ids) {
        allTracks.push(...generateMockTracks(id));
      }
      return {
        success: true,
        tracks: allTracks,
        demoMode: true,
      };
    }

    return apiPost('/music/analyze', payload);
  },
};

// ═════════════════════════════════════════════════════════
// Mock 数据
// ═════════════════════════════════════════════════════════

const MOCK_PLAYLISTS: PlaylistInfo[] = [
  { id: 1, name: '我的最爱', trackCount: 50, coverUrl: '', description: '收藏的歌曲' },
  { id: 2, name: '工作专注', trackCount: 30, coverUrl: '', description: '工作时听的音乐' },
  { id: 3, name: '运动节拍', trackCount: 25, coverUrl: '', description: '健身时听的音乐' },
  { id: 4, name: '深夜沉思', trackCount: 20, coverUrl: '', description: '思考时听的音乐' },
];

const GENRE_POOL: Array<{ genre: string; bpmRange: [number, number] }> = [
  { genre: 'pop', bpmRange: [90, 120] },
  { genre: 'rock', bpmRange: [120, 160] },
  { genre: 'electronic', bpmRange: [120, 180] },
  { genre: 'classical', bpmRange: [60, 120] },
  { genre: 'jazz', bpmRange: [80, 140] },
  { genre: 'hiphop', bpmRange: [80, 110] },
  { genre: 'folk', bpmRange: [70, 110] },
  { genre: 'metal', bpmRange: [140, 200] },
  { genre: 'indie', bpmRange: [80, 130] },
  { genre: 'ambient', bpmRange: [60, 90] },
];

const EMOTION_POOL = ['joyful', 'calm', 'energetic', 'melancholic', 'romantic', 'dreamy', 'nostalgic', 'focused'];

/** 根据歌单 ID 生成不同风格的模拟曲目 */
function generateMockTracks(playlistId: number): TrackInfo[] {
  // 歌单风格分布
  const genreWeights: Record<number, string[]> = {
    1: ['pop', 'pop', 'rock', 'electronic', 'classical'],
    2: ['classical', 'classical', 'jazz', 'jazz', 'folk', 'ambient'],
    3: ['electronic', 'electronic', 'rock', 'hiphop', 'metal'],
    4: ['folk', 'folk', 'classical', 'jazz', 'ambient', 'ambient'],
  };

  const weights = genreWeights[playlistId] ?? genreWeights[1];
  const count = 15 + Math.floor(Math.random() * 20);
  const tracks: TrackInfo[] = [];

  for (let i = 0; i < count; i++) {
    const genreName = weights[Math.floor(Math.random() * weights.length)];
    const genreConfig = GENRE_POOL.find((g) => g.genre === genreName) ?? GENRE_POOL[0];
    const [bpmLo, bpmHi] = genreConfig.bpmRange;
    const bpm = bpmLo + Math.floor(Math.random() * (bpmHi - bpmLo));

    tracks.push({
      id: playlistId * 1000 + i,
      name: `模拟歌曲 ${i + 1}`,
      artists: [{ name: `艺术家_${Math.floor(Math.random() * 10) + 1}`, id: 1000 + Math.floor(Math.random() * 9000) }],
      album: `专辑_${Math.floor(Math.random() * 20) + 1}`,
      duration: 180 + Math.floor(Math.random() * 120),
      genre: genreName,
      bpm,
      year: [2018, 2019, 2020, 2021, 2022, 2023, 2024][Math.floor(Math.random() * 7)],
      emotion: EMOTION_POOL[Math.floor(Math.random() * EMOTION_POOL.length)],
    });
  }

  return tracks;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default musicApi;