/**
 * musicEngine · 频繁切换场景下的内存泄漏验证
 *
 * 验证目标：修复后的 scheduleBeat 递归在 stop / 切换曲目后正确终止，
 * 不再有旧节拍 timer 持续触发 triggerBeat 导致 timer 堆积。
 *
 * 验证手段：
 *   1. vi.useFakeTimers() 接管 setTimeout/clearTimeout
 *   2. start(climaxTrack) 触发节拍递归（energy > 0.4 启用节拍）
 *   3. advanceTimersByTime 推进节拍周期
 *   4. stop() 或 start(其他track) 切换
 *   5. advanceTimersByTime 推进多个节拍周期
 *   6. 用 vi.getTimerCount() 断言 timer 已全部清理（修复前会堆积）
 *
 * 修复前行为（已废弃）：
 *   scheduleBeat 内 `beatTimer = setTimeout(scheduleBeat, ...)` 赋值给闭包变量，
 *   不写回 this.nodes.beatTimer → fadeOutAndStopNodes 的 clearTimeout 漏清最新 timer
 *   → 旧节拍持续递归 → timer 永不消失
 *
 * 修复后行为：
 *   scheduleBeat 顶部检查 `if (!this.nodes) return` · 且每次写回 this.nodes.beatTimer
 *   → stop/切换后 this.nodes=null → 递归终止 → timer 全部清理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { musicEngine } from './musicEngine';
import type { MusicTrack } from '../types/journey';

/** 构造测试用 climax 曲目 · energy=0.9 > 0.4 启用节拍 */
function makeClimaxTrack(id: string, bpm = 128): MusicTrack {
  return {
    id,
    title: `climax-${id}`,
    subtitle: 'test',
    phase: 'climax',
    bpm,
    energy: 0.9,
    moodAffinity: ['passion'],
    synth: {
      rootFreq: 220,
      timbre: 'sawtooth',
      filterFreq: 1200,
      reverb: 0.6,
    },
  };
}

/** 构造测试用 opening 曲目 · energy=0.2 < 0.4 无节拍 */
function makeOpeningTrack(id: string): MusicTrack {
  return {
    id,
    title: `opening-${id}`,
    subtitle: 'test',
    phase: 'opening',
    bpm: 60,
    energy: 0.2,
    moodAffinity: ['calm'],
    synth: {
      rootFreq: 130,
      timbre: 'sine',
      filterFreq: 600,
      reverb: 0.4,
    },
  };
}

const CLIMAX_TRACK = makeClimaxTrack('climax-1');
const OPENING_TRACK = makeOpeningTrack('opening-1');

/** climax 节拍间隔 ms · 60000 / 128 ≈ 468.75 */
const CLIMAX_BEAT_MS = 60000 / 128;
/** fadeOutAndStopNodes 延迟清理时长 ms · (FADE_MS 1200 + 100) */
const CLEANUP_DELAY_MS = 1300;

describe('musicEngine · 频繁切换内存泄漏验证', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 重置单例状态 · 避免上一个测试残留
    musicEngine.stop();
  });

  afterEach(() => {
    musicEngine.stop();
    vi.useRealTimers();
  });

  it('修复验证 · stop() 后节拍递归终止，timer 不堆积', () => {
    musicEngine.start(CLIMAX_TRACK);
    // 推进 3 个节拍周期 · 触发 scheduleBeat 递归 3 次
    vi.advanceTimersByTime(CLIMAX_BEAT_MS * 3);

    // 播放中应有 pending 节拍 timer
    const timersDuringPlayback = vi.getTimerCount();
    expect(timersDuringPlayback).toBeGreaterThan(0);
    expect(musicEngine.isPlaying()).toBe(true);

    // 停止 · 触发 fadeOutAndStopNodes：clearTimeout(beatTimer) + setTimeout(cleanup)
    musicEngine.stop();
    expect(musicEngine.isPlaying()).toBe(false);

    // 推进 5 个节拍周期（≈2344ms > CLEANUP_DELAY 1300ms）
    // 修复后：this.nodes=null → scheduleBeat 即使被旧 timer 触发也立即 return
    //         延迟清理 setTimeout 在 1300ms 执行后无新 timer
    // 修复前：scheduleBeat 不检查 this.nodes → 持续递归创建新 timer
    vi.advanceTimersByTime(CLIMAX_BEAT_MS * 5);

    // 断言：所有 timer 已清理，无堆积
    expect(vi.getTimerCount()).toBe(0);
  });

  it('频繁切换 10 次 climax 曲目 · 旧节拍递归全部终止', () => {
    musicEngine.start(CLIMAX_TRACK);
    vi.advanceTimersByTime(CLIMAX_BEAT_MS * 2); // 触发几次节拍

    // 快速切换 10 次 · 每次切换触发 fadeOutAndStopNodes + buildNodes
    for (let i = 0; i < 10; i++) {
      musicEngine.start(makeClimaxTrack(`switch-${i}`, 128 + i));
      vi.advanceTimersByTime(80); // 短暂推进 · 不完整触发节拍
    }

    // 推进足够时间让所有延迟清理 setTimeout 执行
    vi.advanceTimersByTime(CLEANUP_DELAY_MS * 2);

    // 当前在播最后一首
    expect(musicEngine.isPlaying()).toBe(true);
    expect(musicEngine.getCurrentTrack()?.id).toBe('switch-9');

    // 停止并推进 · 应清零
    musicEngine.stop();
    vi.advanceTimersByTime(CLEANUP_DELAY_MS * 2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('切换到无节拍曲目 · 旧 climax 节拍立即停止递归', () => {
    musicEngine.start(CLIMAX_TRACK);
    vi.advanceTimersByTime(CLIMAX_BEAT_MS * 2); // 触发节拍

    // 切换到 opening（energy 0.2 < 0.4 · 无节拍 timer）
    musicEngine.start(OPENING_TRACK);

    // 推进 5 个 climax 节拍周期（≈2344ms > 1300ms 延迟清理）
    // 修复后：旧 climax 的 scheduleBeat 因 this.nodes=null 而 return
    //         opening 无节拍，无新节拍 timer
    //         延迟清理 setTimeout 已执行
    vi.advanceTimersByTime(CLIMAX_BEAT_MS * 5);

    // opening 无节拍 · 无 pending timer
    expect(vi.getTimerCount()).toBe(0);
    expect(musicEngine.getCurrentTrack()?.id).toBe('opening-1');
    expect(musicEngine.isPlaying()).toBe(true);
  });

  it('内存曲线 · 重复 start→stop 循环 20 次，timer 不累积', () => {
    // 每次循环：start + 推进 1 拍 + stop + 推进清理
    for (let i = 0; i < 20; i++) {
      musicEngine.start(makeClimaxTrack(`loop-${i}`, 128));
      vi.advanceTimersByTime(CLIMAX_BEAT_MS);
      musicEngine.stop();
      vi.advanceTimersByTime(CLEANUP_DELAY_MS);
      // 每次循环结束 timer 应为 0
      expect(vi.getTimerCount()).toBe(0);
    }

    // 20 次循环后仍为 0 · 证明无累积泄漏
    expect(vi.getTimerCount()).toBe(0);
  });

  it('同曲目重复 start · 幂等不重启，无额外 timer', () => {
    musicEngine.start(CLIMAX_TRACK);
    vi.advanceTimersByTime(CLIMAX_BEAT_MS);
    const timersAfterFirstStart = vi.getTimerCount();

    // 重复 start 同曲目 · 应幂等返回
    musicEngine.start(CLIMAX_TRACK);
    musicEngine.start(CLIMAX_TRACK);

    vi.advanceTimersByTime(CLIMAX_BEAT_MS);
    const timersAfterRepeat = vi.getTimerCount();

    // 不应有额外 timer 堆积
    expect(timersAfterRepeat).toBe(timersAfterFirstStart);

    musicEngine.stop();
    vi.advanceTimersByTime(CLEANUP_DELAY_MS);
    expect(vi.getTimerCount()).toBe(0);
  });
});
