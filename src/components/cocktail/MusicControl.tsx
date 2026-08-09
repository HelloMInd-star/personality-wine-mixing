/**
 * MusicControl · 旅程音乐控件
 * 显示当前阶段曲目，控制播放/暂停与音量
 * 音乐由 musicEngine 用 AudioContext 程序化合成，无音频文件
 *
 * 交互语言：播放按钮主色脉动 · 音量滑块与情绪滑块同语
 */

import type { CSSProperties } from 'react';
import type { MusicTrack } from '../../types/journey';
import { JOURNEY_PHASE_META } from '../../data/journeyMeta';
import GlassPanel from '../ui/GlassPanel';

export interface MusicControlProps {
  /** 当前曲目 · 由 useJourney 派生 */
  track: MusicTrack;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前音量 0-1 */
  volume: number;
  /** 切换播放/暂停 */
  onTogglePlay: () => void;
  /** 音量变化 */
  onVolumeChange: (v: number) => void;
}

export default function MusicControl({
  track,
  isPlaying,
  volume,
  onTogglePlay,
  onVolumeChange,
}: MusicControlProps) {
  const phaseMeta = JOURNEY_PHASE_META[track.phase];
  const accent = phaseMeta.color;

  return (
    <GlassPanel padding="md" className="mb-8">
      {/* 阶段氛围光晕 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 0% 50%, ${accent}44 0%, transparent 60%)`,
        }}
      />

      <div className="relative flex items-center gap-4">
        {/* 播放/暂停按钮 */}
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? '暂停旅程音乐' : '播放旅程音乐'}
          className="relative flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-105 flex-shrink-0"
          style={{
            width: 48,
            height: 48,
            borderColor: `${accent}cc`,
            background: isPlaying ? `${accent}1f` : 'rgba(10, 8, 20, 0.5)',
            boxShadow: isPlaying
              ? `0 0 18px ${accent}66, inset 0 0 10px ${accent}22`
              : `0 0 6px ${accent}33`,
          }}
        >
          {/* 播放时脉动光圈 */}
          {isPlaying && (
            <span
              className="absolute inset-0 rounded-full animate-ping-slow"
              style={{ border: `1px solid ${accent}55` }}
            />
          )}
          <span
            className="font-display leading-none"
            style={{ color: accent, fontSize: 18 }}
          >
            {isPlaying ? '❙❙' : '►'}
          </span>
        </button>

        {/* 曲目信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className="font-display text-sm tracking-[0.1em] transition-colors duration-500"
              style={{ color: 'rgba(216, 201, 245, 0.9)' }}
            >
              {track.title}
            </span>
            <span className="text-[10px] text-moon-200/40 italic tracking-wide">
              {track.subtitle}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-moon-200/45 font-mono">
            <span>{track.bpm} BPM</span>
            {/* 能量条 */}
            <span className="flex items-center gap-1">
              <span className="tracking-[0.1em]">能量</span>
              <span className="inline-flex gap-0.5">
                {[0.2, 0.4, 0.6, 0.8, 1].map((threshold) => (
                  <span
                    key={threshold}
                    className="inline-block w-1 h-2.5 rounded-sm transition-all duration-500"
                    style={{
                      background:
                        track.energy >= threshold
                          ? accent
                          : 'rgba(124, 95, 191, 0.2)',
                    }}
                  />
                ))}
              </span>
            </span>
          </div>
        </div>

        {/* 音量控制 */}
        <div className="flex items-center gap-2 w-28 sm:w-36 flex-shrink-0">
          <span className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase">
            音量
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="flex-1 mood-slider"
            style={{ '--mood-color': accent } as CSSProperties}
            aria-label="音乐音量"
          />
        </div>
      </div>
    </GlassPanel>
  );
}
