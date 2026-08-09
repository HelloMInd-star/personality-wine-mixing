/**
 * PlaylistSelector · 四梯度歌单切换器
 *
 * 与情绪旅程四阶段联动 · 用户可在四档歌单预设间手动切换
 * 当前由 musicEngine 程序化合成白噪音底 · UI 展示歌单元数据
 * 接入网易云 MCP 后 · 此组件切换会触发外链播放
 *
 * 交互语言：
 *   - hover 只加深不跳色 · 呼应侧边星微妙
 *   - 选中态以歌单主色染色 · 与 RolePersonaPicker 同语
 *   - 当前档位下方展示占位曲目意境
 */

import { useMemo } from 'react';
import {
  PLAYLIST_PRESETS,
  type PlaylistTier,
  type PlaylistPreset,
} from '../../data/playlistPresets';
import GlassPanel from '../ui/GlassPanel';

export interface PlaylistSelectorProps {
  /** 当前选中歌单档位 · 由 useJourney 派生（跟随旅程阶段） */
  currentTier: PlaylistTier;
  /** 歌单切换回调 · 用户手动覆盖阶段联动 */
  onTierChange: (tier: PlaylistTier) => void;
  /** 是否禁用 · 无画像/向量时灰显 */
  disabled?: boolean;
}

/** 将秒数格式化为 mm:ss */
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlaylistSelector({
  currentTier,
  onTierChange,
  disabled = false,
}: PlaylistSelectorProps) {
  const current: PlaylistPreset = useMemo(
    () => PLAYLIST_PRESETS.find((p) => p.tier === currentTier) ?? PLAYLIST_PRESETS[0],
    [currentTier],
  );

  return (
    <GlassPanel padding="md" className="mb-8">
      {/* 当前档位氛围光晕 · 跟随选中歌单主色 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 100% 0%, ${current.color}44 0%, transparent 60%)`,
        }}
      />

      <div className={`relative ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase mb-1">
              Mood Playlist
            </div>
            <h3 className="font-display text-base text-moon-50 tracking-[0.1em]">
              四梯度歌单
            </h3>
          </div>
          <div className="text-right max-w-[14rem]">
            <div
              className="font-display text-sm tracking-[0.15em] transition-colors duration-500"
              style={{ color: current.color }}
            >
              {current.symbol} · {current.title}
            </div>
            <div className="text-[10px] text-moon-200/50 italic mt-0.5">
              {current.poem}
            </div>
          </div>
        </div>

        {/* 四档歌单卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
          {PLAYLIST_PRESETS.map((p) => {
            const selected = currentTier === p.tier;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onTierChange(p.tier)}
                className="group relative flex flex-col items-start justify-center p-3 rounded-lg border transition-all duration-300 hover:bg-white/[0.03] text-left"
                style={{
                  borderColor: selected ? `${p.color}99` : 'rgba(124, 95, 191, 0.18)',
                  background: selected ? `${p.color}14` : 'transparent',
                  boxShadow: selected
                    ? `0 0 12px ${p.color}40, inset 0 0 8px ${p.color}10`
                    : 'none',
                }}
                aria-pressed={selected}
                aria-label={p.title}
                title={p.poem}
              >
                <span
                  className="font-display text-lg leading-none transition-colors duration-300"
                  style={{
                    color: selected ? p.color : 'rgba(216, 201, 245, 0.55)',
                  }}
                >
                  {p.symbol}
                </span>
                <span
                  className="text-[11px] mt-1 tracking-[0.1em] transition-colors duration-300"
                  style={{
                    color: selected ? p.color : 'rgba(216, 201, 245, 0.4)',
                  }}
                >
                  {p.title}
                </span>
                <span className="text-[9px] mt-0.5 text-moon-200/35 italic tracking-wide">
                  {p.styleLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* 当前档位曲目列表 · 占位意境 */}
        <div className="border-t border-amethyst-500/15 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] tracking-[0.25em] text-amethyst-400/60 uppercase font-mono">
              Tracks · {current.subtitle}
            </span>
            <span className="text-[10px] text-moon-200/40 font-mono">
              {current.neteasePlaylistId
                ? `网易云歌单 ${current.neteasePlaylistId}`
                : '深空合成 · 待接入'}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {current.tracks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.02] border border-amethyst-500/10 transition-colors duration-300 hover:border-amethyst-400/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-moon-50/85 truncate font-display tracking-[0.05em]">
                    {t.title}
                  </div>
                  <div className="text-[10px] text-moon-200/40 italic truncate">
                    {t.note}
                  </div>
                </div>
                <span className="text-[10px] text-moon-200/35 font-mono flex-shrink-0">
                  {formatDuration(t.durationSec)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
