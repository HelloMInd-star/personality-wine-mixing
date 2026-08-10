/**
 * ConcentrationSimulator · 圆锥浓度模拟器
 *
 * 可视化展示：
 *   - 三基准阈值线（0.48 寡淡 / 0.50 金线 / 0.68 熔断）
 *   - 当前浓度位置指示器
 *   - 风味溶质 m 滑块
 *   - 稳态验证 / PID 调节 / 重置按钮
 *   - 品质状态标签
 */

import { useCallback } from 'react';
import { THRESHOLDS, type ConcentrationResult } from '../../../engine/concentrationEngine';

export interface ConcentrationSimulatorProps {
  result: ConcentrationResult;
  pidActive: boolean;
  onVerify: () => void;
  onPidToggle: () => void;
  onReset: () => void;
  onIce?: () => void;
  onAddSpirit?: () => void;
}

export default function ConcentrationSimulator({
  result,
  pidActive,
  onVerify,
  onPidToggle,
  onReset,
  onIce,
  onAddSpirit,
}: ConcentrationSimulatorProps) {
  const gaugePct = Math.min(100, Math.max(0, result.concentration * 100));

  const getZoneColor = useCallback(() => {
    switch (result.zone) {
      case 'below': return 'rgba(249,115,22,0.5)';
      case 'steady': return 'rgba(34,197,94,0.5)';
      case 'above': return 'rgba(59,130,246,0.5)';
      case 'fuse': return 'rgba(239,68,68,0.6)';
    }
  }, [result.zone]);

  const getZoneBg = useCallback(() => {
    switch (result.zone) {
      case 'below': return 'rgba(249,115,22,0.08)';
      case 'steady': return 'rgba(34,197,94,0.08)';
      case 'above': return 'rgba(59,130,246,0.08)';
      case 'fuse': return 'rgba(239,68,68,0.12)';
    }
  }, [result.zone]);

  return (
    <div className="space-y-5">
      {/* 阈值图例 */}
      <div className="flex items-center justify-center gap-4 text-[10px] tracking-[0.05em]">
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.5)' }} />
          <span className="text-orange-400/60">0.48 寡淡</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.5)' }} />
          <span className="text-green-400/60">0.50 金线</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.5)' }} />
          <span className="text-red-400/60">0.68 熔断</span>
        </div>
      </div>

      {/* 浓度仪表盘 */}
      <div className="relative h-10 bg-white/[0.03] rounded-lg overflow-hidden border border-amethyst-500/10">
        {/* 阈值线 */}
        <div
          className="absolute top-0 bottom-0 w-px bg-orange-400/30"
          style={{ left: `${THRESHOLDS.BREAKEVEN * 100}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-green-400/40"
          style={{ left: `${THRESHOLDS.STEADY * 100}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-red-400/30"
          style={{ left: `${THRESHOLDS.FUSE * 100}%` }}
        />

        {/* 浓度填充 */}
        <div
          className="absolute top-0 bottom-0 transition-all duration-500"
          style={{
            left: 0,
            width: `${gaugePct}%`,
            background: getZoneColor(),
          }}
        />

        {/* 浓度指示器 */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-gold-400 shadow-lg transition-all duration-500"
          style={{ left: `calc(${gaugePct}% - 2px)` }}
        />
      </div>

      {/* 浓度数据 */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="space-y-0.5">
          <div className="text-[10px] tracking-[0.1em] text-amethyst-400/60 uppercase">浓度 C</div>
          <div className="font-mono text-lg text-moon-50" style={{ color: getZoneColor() }}>
            {result.concentration.toFixed(4)}
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] tracking-[0.1em] text-amethyst-400/60 uppercase">品质</div>
          <div className="text-xs text-moon-50/80">{result.label}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] tracking-[0.1em] text-amethyst-400/60 uppercase">溶质 m</div>
          <div className="font-mono text-sm text-moon-200/70">{result.soluteMass.toFixed(4)}</div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onVerify}
          className="px-4 py-2 text-xs rounded-full border border-amethyst-500/30 text-amethyst-300/80 hover:bg-amethyst-500/10 transition-colors tracking-[0.1em]"
        >
          稳态验证
        </button>
        <button
          onClick={onPidToggle}
          className={`px-4 py-2 text-xs rounded-full border transition-all tracking-[0.1em] ${
            pidActive
              ? 'border-green-400/50 text-green-400 bg-green-400/10'
              : 'border-gold-400/30 text-gold-400/80 hover:bg-gold-400/10'
          }`}
        >
          {pidActive ? 'PID 调节中...' : '启动 PID 调节'}
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 text-xs rounded-full border border-moon-200/15 text-moon-200/50 hover:bg-white/5 transition-colors tracking-[0.1em]"
        >
          重置
        </button>
      </div>

      {/* 趣味操作 */}
      {onIce && onAddSpirit && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onIce}
            className="px-3 py-1.5 text-xs rounded-full border border-blue-400/20 text-blue-300/60 hover:bg-blue-400/10 transition-colors"
          >
            🧊 加冰
          </button>
          <button
            onClick={onAddSpirit}
            className="px-3 py-1.5 text-xs rounded-full border border-amber-400/20 text-amber-300/60 hover:bg-amber-400/10 transition-colors"
          >
            🍾 加酒
          </button>
        </div>
      )}

      {/* PID 说明 */}
      {pidActive && (
        <div
          className="text-[10px] text-center tracking-[0.05em] px-3 py-2 rounded-lg"
          style={{ backgroundColor: getZoneBg() }}
        >
          PID 负反馈调节中 · 自动将浓度收敛至 0.50 稳态金线 · 偏差越大，调节力度越强
        </div>
      )}
    </div>
  );
}