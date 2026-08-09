/**
 * MoodDial · 情绪调节器
 * 主动控件 · 让此刻的心境参与推荐织造
 * 八瓣情绪 × 强度滑块 · 关闭即回到时段感知
 *
 * 交互语言：hover 只加深不跳色 · 呼应侧边星的微妙
 */

import type { CSSProperties } from 'react';
import { MOOD_META } from '../../data/moodMeta';
import type { MoodTag } from '../../types/cocktail';
import GlassPanel from '../ui/GlassPanel';

export interface MoodDialProps {
  /** 当前主动情绪 · null 表示关闭调节 */
  activeMood: MoodTag | null;
  /** 情绪强度 0-1 */
  intensity: number;
  /** 情绪切换 · 传 null 关闭调节 */
  onMoodChange: (mood: MoodTag | null) => void;
  /** 强度变化 */
  onIntensityChange: (intensity: number) => void;
}

export default function MoodDial({
  activeMood,
  intensity,
  onMoodChange,
  onIntensityChange,
}: MoodDialProps) {
  const active = activeMood !== null;
  const activeMeta = MOOD_META.find((m) => m.key === activeMood);

  const handleMoodClick = (mood: MoodTag) => {
    // 再次点击同一情绪 · 关闭调节，回到时段感知
    onMoodChange(activeMood === mood ? null : mood);
  };

  // 滑块自定义色变量 · 选中情绪时染其色
  const sliderStyle =
    active && activeMeta
      ? ({ '--mood-color': activeMeta.color } as CSSProperties)
      : undefined;

  return (
    <GlassPanel padding="md" className="mb-8">
      {/* 选中情绪的氛围光晕 · 呼吸 */}
      {activeMeta && (
        <div
          className="absolute inset-0 pointer-events-none opacity-25 transition-opacity duration-700"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${activeMeta.color}55 0%, transparent 65%)`,
          }}
        />
      )}

      <div className="relative">
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase mb-1">
              Mood Dial
            </div>
            <h3 className="font-display text-base text-moon-50 tracking-[0.1em]">
              情绪调节
            </h3>
          </div>
          <div className="text-right max-w-[14rem]">
            {activeMeta ? (
              <>
                <div
                  className="font-display text-sm tracking-[0.15em] transition-colors duration-500"
                  style={{ color: activeMeta.color }}
                >
                  {activeMeta.label}
                </div>
                <div className="text-[10px] text-moon-200/50 italic mt-0.5">
                  {activeMeta.poem}
                </div>
              </>
            ) : (
              <div className="text-[11px] text-moon-200/40 italic">
                未启 · 随时段呼吸
              </div>
            )}
          </div>
        </div>

        {/* 八瓣情绪 */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-5">
          {MOOD_META.map((meta) => {
            const selected = activeMood === meta.key;
            return (
              <button
                key={meta.key}
                type="button"
                onClick={() => handleMoodClick(meta.key)}
                className="group relative flex flex-col items-center justify-center py-2.5 rounded-lg border transition-all duration-300 hover:bg-white/[0.03]"
                style={{
                  borderColor: selected
                    ? `${meta.color}99`
                    : 'rgba(124, 95, 191, 0.18)',
                  background: selected ? `${meta.color}14` : 'transparent',
                  boxShadow: selected
                    ? `0 0 12px ${meta.color}40, inset 0 0 8px ${meta.color}10`
                    : 'none',
                }}
                aria-pressed={selected}
                aria-label={meta.label}
                title={meta.poem}
              >
                <span
                  className="font-display text-lg leading-none transition-colors duration-300"
                  style={{
                    color: selected ? meta.color : 'rgba(216, 201, 245, 0.55)',
                  }}
                >
                  {meta.symbol}
                </span>
                <span
                  className="text-[10px] mt-1 tracking-[0.1em] transition-colors duration-300"
                  style={{
                    color: selected ? meta.color : 'rgba(216, 201, 245, 0.4)',
                  }}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 强度滑块 · 仅调节器开启时启用 */}
        <div
          className={`transition-opacity duration-300 ${
            active ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase">
              强度
            </span>
            <span className="text-[10px] text-moon-200/50 font-mono">
              {Math.round(intensity * 100)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={intensity}
            disabled={!active}
            onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
            className="w-full mood-slider"
            style={sliderStyle}
            aria-label="情绪强度"
          />
          <div className="flex justify-between mt-1 text-[9px] text-moon-200/30 tracking-widest">
            <span>微</span>
            <span>浓</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
