/**
 * useJourney · 情绪旅程钩子
 * 派生当前旅程阶段与音乐曲目，并自动联动 musicEngine
 *
 * 派生链：
 *   activeMood + moodIntensity → journeyState → currentTrack
 *   用户手动歌单切换 → 覆盖 currentTrack 为对应阶段代表曲目
 *
 * 音乐联动：
 *   - audioEnabled 为 true 且 track 变化 → musicEngine.transitionTo(track)
 *   - audioEnabled 为 false → musicEngine.stop()
 *   - musicVolume 变化 → musicEngine.setVolume()
 *
 * 歌单档位联动：
 *   - 默认跟随 journeyState.phase 自动派生 currentTier
 *   - 用户手动切换后 manualTier 覆盖 · currentTrack 同步切换到该档位代表曲目
 *   - musicEngine 的白噪音底随之重合成（不同阶段不同噪音颜色）
 *
 * 旅程推荐刷新由 useCocktail 承载，本钩子只管阶段与音乐
 *
 * 性能监控：派生重算与 musicEngine 调用均输出 perfMark（仅 DEV），含堆内存
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { cocktailService } from '../services/cocktailService';
import { musicEngine } from '../engine/musicEngine';
import type { JourneyState, LightEffect, MusicTrack, ScentProfile } from '../types/journey';
import {
  getPlaylistByPhase,
  getPlaylistByTier,
  type PlaylistTier,
} from '../data/playlistPresets';
import { getTracksByPhase, MUSIC_TRACKS } from '../data/journeyMeta';

export interface UseJourneyReturn {
  /** 当前旅程状态 · 阶段 + 元数据 + 期望刺激档位 */
  journeyState: JourneyState;
  /** 当前阶段对应的音乐曲目 */
  currentTrack: MusicTrack;
  /** 音乐是否正在播放（audioEnabled 且 engine 在播） */
  isPlaying: boolean;
  /** 杯底光效参数 · 人格 × 阶段 × 情绪派生 · 供 LightCanvas 渲染 */
  lightEffect: LightEffect;
  /** 杯垫气味配方 · 人格 × 阶段派生 · 供 ScentCard 渲染 */
  scentProfile: ScentProfile;
  /** 当前歌单档位 · 默认跟随阶段 · 用户手动切换后覆盖 */
  currentTier: PlaylistTier;
  /** 歌单档位切换回调 · 传 null 重置为跟随阶段 */
  onTierChange: (tier: PlaylistTier) => void;
}

/**
 * 性能监控日志 · 仅 DEV 环境（含测试）输出
 * 输出：时间戳 + JS 堆内存占用（Chrome 非标准 API，jsdom 无则省略）+ 详情
 */
function perfMark(scope: string, detail: Record<string, unknown> = {}): void {
  if (!import.meta.env.DEV) return;
  const mem = (
    performance as Performance & { memory?: { usedJSHeapSize: number } }
  ).memory;
  const memStr = mem
    ? ` mem=${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
    : '';
  const ts = performance.now().toFixed(1);
  console.debug(`[Perf:Journey:${scope}] t=${ts}ms${memStr}`, detail);
}

export function useJourney(): UseJourneyReturn {
  const { profile, vector, activeMood, moodIntensity, audioEnabled, musicVolume } = useAppStore();

  // 派生计数器 · 统计重算次数，判断是否过度派生
  const deriveCountRef = useRef({ state: 0, track: 0, tier: 0 });

  // 用户手动歌单档位 · null 表示跟随阶段自动派生
  const [manualTier, setManualTier] = useState<PlaylistTier | null>(null);

  // 派生旅程状态 · mood/intensity 变化时重算
  const journeyState = useMemo(() => {
    deriveCountRef.current.state += 1;
    const state = cocktailService.getJourneyState(activeMood, moodIntensity);
    perfMark('derive:journeyState', {
      mood: activeMood,
      intensity: moodIntensity.toFixed(2),
      phase: state.meta.label,
      tier: state.meta.stimulationTier,
      count: deriveCountRef.current.state,
    });
    return state;
  }, [activeMood, moodIntensity]);

  // 当前歌单档位 · manualTier 优先 · 否则跟随阶段自动派生
  const currentTier: PlaylistTier = useMemo(() => {
    deriveCountRef.current.tier += 1;
    const tier = manualTier ?? getPlaylistByPhase(journeyState.phase).tier;
    perfMark('derive:currentTier', {
      manualTier,
      phase: journeyState.phase,
      tier,
      count: deriveCountRef.current.tier,
    });
    return tier;
  }, [manualTier, journeyState.phase]);

  // 派生当前曲目 · 用户手动选档时覆盖为该档位对应阶段代表曲目 · 否则由 mood/intensity 派生
  const currentTrack = useMemo(() => {
    deriveCountRef.current.track += 1;
    let track: MusicTrack;
    if (manualTier) {
      // 用户手动选档 · 取该档位对应阶段的代表曲目（首曲）
      const playlist = getPlaylistByTier(manualTier);
      const phaseTracks = getTracksByPhase(playlist.phase);
      track = phaseTracks[0] ?? MUSIC_TRACKS[0];
    } else {
      track = cocktailService.getJourneyTrack(activeMood, moodIntensity);
    }
    perfMark('derive:currentTrack', {
      trackId: track.id,
      title: track.title,
      bpm: track.bpm,
      manualTier,
      count: deriveCountRef.current.track,
    });
    return track;
  }, [manualTier, activeMood, moodIntensity]);

  // 歌单切换回调 · 再次点击同档位则重置为跟随阶段
  const onTierChange = useCallback((tier: PlaylistTier) => {
    perfMark('user:onTierChange', { to: tier });
    setManualTier((prev) => (prev === tier ? null : tier));
  }, []);

  // 派生杯底光效 · 向量优先（唯一数据契约）· 无 vector 回退 profile 路径
  const lightEffect = useMemo(() => {
    const effect = vector
      ? cocktailService.getLightByVector(vector, activeMood, moodIntensity)
      : cocktailService.getLightEffect(profile, activeMood, moodIntensity);
    perfMark('derive:lightEffect', {
      source: vector ? 'vector' : 'profile',
      baseColor: effect.baseColor,
      accentColor: effect.accentColor,
      pattern: effect.pattern,
      intensity: effect.intensity.toFixed(2),
    });
    return effect;
  }, [vector, profile, activeMood, moodIntensity]);

  // 派生杯垫气味配方 · 向量优先 · 无 vector 回退 profile 路径
  const scentProfile = useMemo(() => {
    const scent = vector
      ? cocktailService.getScentByVector(vector, activeMood, moodIntensity)
      : cocktailService.getScentProfile(profile, activeMood, moodIntensity);
    perfMark('derive:scentProfile', {
      source: vector ? 'vector' : 'profile',
      primary: scent.primaryLabel,
      signature: scent.signatureLabel,
      diffusion: scent.diffusion,
    });
    return scent;
  }, [vector, profile, activeMood, moodIntensity]);

  // 音乐联动 · track 或 audioEnabled 变化时切换
  useEffect(() => {
    perfMark('effect:musicToggle', {
      audioEnabled,
      trackId: currentTrack.id,
      action: audioEnabled ? 'transitionTo' : 'stop',
    });
    if (audioEnabled) {
      musicEngine.transitionTo(currentTrack);
    } else {
      musicEngine.stop();
    }
  }, [audioEnabled, currentTrack]);

  // 音量联动 · musicVolume 变化时实时调整
  useEffect(() => {
    perfMark('effect:setVolume', { volume: musicVolume.toFixed(2) });
    musicEngine.setVolume(musicVolume);
  }, [musicVolume]);

  // 卸载时停止音乐 · 避免离开页面后继续播放
  useEffect(() => {
    perfMark('effect:mount', { msg: 'useJourney mounted' });
    return () => {
      perfMark('effect:unmount', {
        msg: 'useJourney unmount → musicEngine.stop()',
        deriveStateCount: deriveCountRef.current.state,
        deriveTrackCount: deriveCountRef.current.track,
      });
      musicEngine.stop();
    };
  }, []);

  return {
    journeyState,
    currentTrack,
    lightEffect,
    scentProfile,
    isPlaying: audioEnabled,
    currentTier,
    onTierChange,
  };
}
