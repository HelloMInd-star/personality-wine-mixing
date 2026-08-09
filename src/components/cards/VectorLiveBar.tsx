/**
 * VectorLiveBar · 六维向量实时可视化
 *
 * 用于牌类采集页 · 每步选择后实时展示当前部分融合向量
 * 中心零线 · 正值金紫渐变向右 · 负值紫晶向左
 *
 * 视觉语言：深空紫金 · 与 ResultView 的六维条形同源，但支持实时更新动画
 * 轻量纯 CSS · 不依赖 ECharts
 */

import { DIM_LABEL, type PersonaVector, type PersonaDim } from '../../types/personaFusion';
import GlassPanel from '../ui/GlassPanel';

export interface VectorLiveBarProps {
  /** 当前向量 · null 时显示待采集占位 */
  vector: PersonaVector | null;
  /** 标题 · 默认"实时向量" */
  title?: string;
  /** 紧凑模式 · 用于侧边/顶部固定显示 */
  compact?: boolean;
  /** 已采集模块数 · 用于显示进度 */
  collectedCount?: number;
  /** 总模块数 · 默认 4 */
  totalModules?: number;
}

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

/** 各维度强调色 · 用于正值条 */
const DIM_POSITIVE_COLOR: Record<PersonaDim, string> = {
  TOL: '#f0c674', // 金
  SPD: '#e06552', // 焰红
  INF: '#7c8db5', // 月蓝
  ENT: '#e09b4b', // 琥珀
  LEAD: '#9b7bd4', // 紫
  VIS: '#6b5b95', // 暮紫
};

export default function VectorLiveBar({
  vector,
  title = '实时向量',
  compact = false,
  collectedCount = 0,
  totalModules = 4,
}: VectorLiveBarProps) {
  const hasVector = vector !== null;
  const isComplete = collectedCount >= totalModules;

  return (
    <GlassPanel gold={isComplete} padding={compact ? 'sm' : 'md'}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase">
            Live Vector
          </div>
          <div className={`font-display ${compact ? 'text-sm' : 'text-base'} text-moon-50`}>
            {title}
          </div>
        </div>
        {/* 采集进度 */}
        <div className="text-right">
          <div className="text-[10px] text-amethyst-400/60 tracking-widest">已采集</div>
          <div className="font-mono text-sm">
            <span className={hasVector ? 'text-gold-sheen' : 'text-moon-200/40'}>
              {collectedCount}
            </span>
            <span className="text-moon-200/40">/{totalModules}</span>
          </div>
        </div>
      </div>

      {/* 六维条形 */}
      <div className={`space-y-${compact ? '2' : '3'}`}>
        {DIMS.map((dim) => {
          const val = hasVector ? vector[dim] : 0;
          const pct = Math.abs(val) * 50; // 半幅 50% · 中心为零
          const positive = val >= 0;
          const color = DIM_POSITIVE_COLOR[dim];
          return (
            <div key={dim} className="flex items-center gap-2">
              {/* 维度标签 */}
              <div className="w-12 shrink-0">
                <div className={`font-display ${compact ? 'text-[10px]' : 'text-xs'} text-moon-50`}>
                  {DIM_LABEL[dim]}
                </div>
                {!compact && (
                  <div className="text-[8px] text-amethyst-400/50 font-mono">{dim}</div>
                )}
              </div>

              {/* 条形 · 中心零线 */}
              <div className={`flex-1 relative ${compact ? 'h-1.5' : 'h-2'} bg-void/60 rounded-full overflow-hidden`}>
                {/* 中心线 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-moon-200/30 z-10" />
                {/* 数值条 */}
                <div
                  className="absolute top-0 bottom-0 transition-all duration-700 ease-out"
                  style={{
                    left: positive ? '50%' : `${50 - pct}%`,
                    width: `${pct}%`,
                    background: hasVector
                      ? positive
                        ? `linear-gradient(to right, ${color}66, ${color})`
                        : `linear-gradient(to left, ${color}66, ${color})`
                      : 'transparent',
                    boxShadow: hasVector && Math.abs(val) > 0.5 ? `0 0 8px ${color}66` : 'none',
                  }}
                />
              </div>

              {/* 数值 */}
              <div className={`w-12 shrink-0 text-right font-mono ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {hasVector ? (
                  <span className={positive ? 'text-gold-sheen' : 'text-amethyst-300'}>
                    {positive ? '+' : ''}
                    {val.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-moon-200/30">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部状态 */}
      {!compact && (
        <div className="mt-4 pt-3 border-t border-amethyst-500/15">
          {hasVector ? (
            <div className="flex items-center gap-2 text-[10px] text-moon-200/50">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-400 animate-breathe" />
              <span>
                {isComplete
                  ? '四套牌已融合 · 向量稳定'
                  : `已融合 ${collectedCount} 套 · 向量随采集演进`}
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-moon-200/40 italic">
              完成任一步采集 · 向量即刻显形
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}
