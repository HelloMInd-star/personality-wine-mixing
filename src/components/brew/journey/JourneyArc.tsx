/**
 * JourneyArc · 情绪旅程弧线
 * 四阶段回路可视化：开场 → 上升 → 高潮 → 收尾
 * 当前阶段由情绪 + 强度派生，弧线高亮当前节点并显示阶段诗与音乐参数
 *
 * 视觉语言：磨砂玻璃深空 · 节点用单字符号 · 当前阶段主色光晕呼吸
 */

import { cocktailService } from '../../../services/cocktailService';
import type { JourneyState, StimulationTier } from '../../../types/journey';
import GlassPanel from '../../ui/GlassPanel';

/** 刺激档位中文标签 */
const TIER_LABEL: Record<StimulationTier, string> = {
  low: '低刺激',
  mid: '中刺激',
  high: '高刺激',
};

export interface JourneyArcProps {
  /** 当前旅程状态 · 由 useJourney 派生 */
  journeyState: JourneyState;
}

export default function JourneyArc({ journeyState }: JourneyArcProps) {
  const phases = cocktailService.getJourneyPhaseMeta();
  const activePhase = journeyState.phase;
  const activeMeta = journeyState.meta;

  return (
    <GlassPanel padding="md" className="mb-8">
      {/* 当前阶段氛围光晕 · 呼吸 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${activeMeta.color}55 0%, transparent 70%)`,
        }}
      />

      <div className="relative">
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-5 gap-4">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase mb-1">
              Journey Arc
            </div>
            <h3 className="font-display text-base text-moon-50 tracking-[0.1em]">
              情绪回路
            </h3>
          </div>
          <div className="text-right">
            <div
              className="font-display text-sm tracking-[0.15em] transition-colors duration-500"
              style={{ color: activeMeta.color }}
            >
              {activeMeta.label} · {activeMeta.symbol}
            </div>
            <div className="text-[10px] text-moon-200/50 italic mt-0.5">
              {activeMeta.poem}
            </div>
          </div>
        </div>

        {/* 四阶段节点弧线 */}
        <div className="relative flex items-center justify-between px-2 sm:px-4">
          {/* 连接线 · 背景层 */}
          <div className="absolute left-[12%] right-[12%] top-[22px] h-px bg-gradient-to-r from-amethyst-500/20 via-amethyst-400/30 to-amethyst-500/20" />
          {/* 连接线 · 当前阶段之前的进度层 */}
          <div
            className="absolute left-[12%] top-[22px] h-px transition-all duration-700"
            style={{
              width: `${(phases.findIndex((p) => p.phase === activePhase) / (phases.length - 1)) * 76}%`,
              background: `linear-gradient(to right, ${activeMeta.color}66, ${activeMeta.color})`,
            }}
          />

          {phases.map((meta) => {
            const active = meta.phase === activePhase;
            return (
              <div
                key={meta.phase}
                className="relative flex flex-col items-center"
                style={{ width: '25%' }}
              >
                {/* 节点圆 */}
                <div
                  className="flex items-center justify-center rounded-full border transition-all duration-500"
                  style={{
                    width: active ? 48 : 34,
                    height: active ? 48 : 34,
                    borderColor: active
                      ? `${meta.color}cc`
                      : 'rgba(124, 95, 191, 0.3)',
                    background: active
                      ? `${meta.color}1f`
                      : 'rgba(10, 8, 20, 0.5)',
                    boxShadow: active
                      ? `0 0 18px ${meta.color}66, inset 0 0 10px ${meta.color}22`
                      : 'none',
                  }}
                >
                  <span
                    className="font-display leading-none transition-all duration-500"
                    style={{
                      fontSize: active ? 20 : 15,
                      color: active
                        ? meta.color
                        : 'rgba(216, 201, 245, 0.45)',
                    }}
                  >
                    {meta.symbol}
                  </span>
                </div>
                {/* 标签 */}
                <span
                  className="mt-2 text-[10px] tracking-[0.15em] transition-colors duration-500"
                  style={{
                    color: active
                      ? meta.color
                      : 'rgba(216, 201, 245, 0.4)',
                  }}
                >
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 当前阶段详情条 */}
        <div className="mt-5 pt-4 border-t border-amethyst-500/15">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: activeMeta.color }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: activeMeta.color }}
              />
              {TIER_LABEL[activeMeta.stimulationTier]}酒款
            </span>
            <span className="text-moon-200/55 font-mono">
              {activeMeta.bpm} BPM
            </span>
            <span className="text-moon-200/55">{activeMeta.musicStyle}</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}