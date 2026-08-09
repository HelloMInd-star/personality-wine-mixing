/**
 * CosmicOrbs · 入口页 5 宇宙星球
 *
 * 点击镜月（入口品牌）后展开 · 5 颗底色晃动的星球横向排列：
 *   太阳(日) · 咖啡(咖) · 茶(茶) · 酒杯(酒) · 月亮(月)
 * 分别对应 5 个时段的日常状态：
 *   起床 · 工作中 · 休闲 · 夜晚 · 入眠
 *
 * 每颗星球绑定生物学时间校准（timeEngine.biologyShifts）
 * 点击星球 → 设置 manualTimeSlot → 影响全局调酒/气味/酒局推荐
 *
 * 视觉语言：磨砂玻璃 + 元素派色 + 微妙浮动 · 与项目一致
 * 工程约定：组件内 <style> 注入 keyframes · 纯 CSS 动画无 RAF
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { TIME_SLOTS, type TimeSlot, type TimeSlotInfo } from '../../engine/timeEngine';

/** 5 颗星球的视觉色 · 贴合「太阳/咖啡/茶/酒/月」的星球质感 */
const ORB_VISUALS: Record<TimeSlot, { core: string; glow: string; ring: string }> = {
  dawn: { core: '#f0c674', glow: '#f5d88f', ring: 'rgba(240,198,116,0.45)' }, // 太阳·金黄
  noon: { core: '#b08968', glow: '#d4a88c', ring: 'rgba(176,137,104,0.40)' }, // 咖啡·棕
  dusk: { core: '#8fa86b', glow: '#b8d49b', ring: 'rgba(143,168,107,0.40)' }, // 茶·绿
  night: { core: '#9b7bd4', glow: '#c8a5e0', ring: 'rgba(155,123,212,0.45)' }, // 酒·紫
  midnight: { core: '#c8d4f0', glow: '#e0e8ff', ring: 'rgba(200,212,240,0.40)' }, // 月·银
};

interface CosmicOrbsProps {
  /** 是否展开 · 由入口品牌点击控制 */
  expanded: boolean;
  /** 当前选中的时段 · null 表示未选（按系统时间） */
  selectedSlot: TimeSlot | null;
  /** 点击星球回调 · 设置 manualTimeSlot */
  onSelect: (slot: TimeSlot) => void;
}

interface HoverState {
  slot: TimeSlotInfo;
  x: number;
  y: number;
}

export default function CosmicOrbs({ expanded, selectedSlot, onSelect }: CosmicOrbsProps) {
  const [hover, setHover] = useState<HoverState | null>(null);

  // 并发防御 · RAF 合并同一帧内的多次点击
  // 用户快速连点不同星球时，只取最后一帧的最终值 · 避免中间态动画错乱
  const pendingSlotRef = useRef<TimeSlot | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleSelect = useCallback((slot: TimeSlot) => {
    pendingSlotRef.current = slot;
    // 已有 pending RAF · 只更新 pendingSlot · 等当前帧末统一触发
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const finalSlot = pendingSlotRef.current;
      if (finalSlot !== null) {
        onSelect(finalSlot);
      }
    });
  }, [onSelect]);

  // 卸载时取消 pending RAF · 避免回调在卸载后触发（泄漏）
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, slot: TimeSlotInfo) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHover({
        slot,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    },
    [],
  );

  const handleLeave = useCallback(() => setHover(null), []);

  return (
    <div className="cosmic-orbs-wrap relative">
      {/* 展开提示线 · 镜月到星球的引力线 */}
      <div
        className={`orbs-lead-line ${expanded ? 'shown' : ''}`}
        aria-hidden
      />

      <div className={`orb-row ${expanded ? 'expanded' : ''}`}>
        {TIME_SLOTS.map((slot, i) => {
          const visual = ORB_VISUALS[slot.slot];
          const isSelected = selectedSlot === slot.slot;
          return (
            <button
              key={slot.slot}
              type="button"
              className={`orb-cell ${isSelected ? 'selected' : ''}`}
              style={{
                // CSS 变量驱动颜色 · 遵循动画用 CSS 变量的约定
                ['--orb-core' as string]: visual.core,
                ['--orb-glow' as string]: visual.glow,
                ['--orb-ring' as string]: visual.ring,
                ['--wobble-delay' as string]: `${i * 0.6}s`,
                transitionDelay: expanded ? `${i * 80}ms` : '0ms',
              }}
              onMouseMove={(e) => handleMove(e, slot)}
              onMouseLeave={handleLeave}
              onClick={() => handleSelect(slot.slot)}
              aria-label={`${slot.orbSymbol} · ${slot.orbState} · ${slot.biologyNote}`}
              data-testid={`orb-${slot.slot}`}
            >
              <span className="orb-body">
                <span className="orb-symbol">{slot.orbSymbol}</span>
                {/* 选中态脉冲环 */}
                {isSelected && <span className="orb-pulse" aria-hidden />}
              </span>
              <span className="orb-state-label">{slot.orbState}</span>
            </button>
          );
        })}
      </div>

      {/* hover tooltip · 星球名 + 状态 + 生物学依据 */}
      {hover && (
        <div
          className="orb-tooltip"
          style={{ left: hover.x, top: hover.y }}
          role="tooltip"
        >
          <div className="orb-tooltip-title">
            <span style={{ color: ORB_VISUALS[hover.slot.slot].core }}>
              {hover.slot.orbSymbol}
            </span>
            <span className="text-gold-sheen ml-1.5">{hover.slot.label}</span>
            <span className="text-amethyst-300/50 mx-1.5">·</span>
            <span className="text-moon-200/80">{hover.slot.orbState}</span>
          </div>
          <div className="orb-tooltip-bio">{hover.slot.biologyNote}</div>
          <div className="orb-tooltip-poem">{hover.slot.poem}</div>
        </div>
      )}

      {/* 组件内 keyframes · 遵循不污染全局 index.css 的约定 */}
      <style>{`
        .cosmic-orbs-wrap {
          min-height: 0;
          transition: min-height 500ms ease;
        }
        .cosmic-orbs-wrap:has(.orb-row.expanded) {
          min-height: 130px;
        }

        /* 引力线 · 镜月到星球区的淡线 */
        .orbs-lead-line {
          width: 1px;
          height: 0;
          margin: 0 auto;
          background: linear-gradient(to bottom, transparent, rgba(240,198,116,0.4), transparent);
          transition: height 500ms ease 100ms;
          opacity: 0;
        }
        .orbs-lead-line.shown {
          height: 28px;
          opacity: 1;
        }

        .orb-row {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 18px;
          padding-top: 8px;
        }

        .orb-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          /* 展开/收起动画 */
          transform: scale(0) translateY(-24px);
          opacity: 0;
          transition: transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 400ms ease;
          pointer-events: none;
        }
        .orb-row.expanded .orb-cell {
          transform: scale(1) translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        /* 星球本体 · 底色晃动 */
        .orb-body {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 32% 30%, var(--orb-glow) 0%, var(--orb-core) 55%, color-mix(in srgb, var(--orb-core) 60%, #070414) 100%);
          box-shadow:
            0 0 18px var(--orb-ring),
            inset 0 0 12px rgba(255,255,255,0.12),
            inset -4px -6px 12px rgba(7,4,20,0.35);
          border: 1px solid color-mix(in srgb, var(--orb-core) 50%, transparent);
          animation: orb-wobble 4.4s ease-in-out infinite;
          animation-delay: var(--wobble-delay);
          transition: box-shadow 300ms ease, transform 300ms ease;
        }
        .orb-cell:hover .orb-body {
          transform: scale(1.12);
          box-shadow:
            0 0 28px var(--orb-ring),
            inset 0 0 14px rgba(255,255,255,0.2),
            inset -4px -6px 12px rgba(7,4,20,0.3);
        }
        .orb-cell.selected .orb-body {
          box-shadow:
            0 0 32px var(--orb-core),
            0 0 12px var(--orb-glow),
            inset 0 0 14px rgba(255,255,255,0.25),
            inset -4px -6px 12px rgba(7,4,20,0.25);
        }

        .orb-symbol {
          font-family: 'Noto Serif SC', serif;
          font-size: 22px;
          font-weight: 600;
          color: rgba(255,255,255,0.92);
          text-shadow: 0 1px 4px rgba(7,4,20,0.6);
          letter-spacing: 0;
        }

        /* 选中态脉冲环 */
        .orb-pulse {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid var(--orb-core);
          opacity: 0;
          animation: orb-pulse 2s ease-out infinite;
        }

        .orb-state-label {
          font-size: 10px;
          letter-spacing: 0.25em;
          color: rgba(216,201,245,0.55);
          font-family: 'Noto Serif SC', serif;
          transition: color 300ms ease;
        }
        .orb-cell:hover .orb-state-label,
        .orb-cell.selected .orb-state-label {
          color: var(--orb-glow);
        }

        /* tooltip */
        .orb-tooltip {
          position: fixed;
          transform: translate(-50%, -100%);
          margin-top: -14px;
          z-index: 50;
          padding: 10px 14px;
          min-width: 180px;
          background: rgba(15, 10, 30, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(240,198,116,0.35);
          border-radius: 10px;
          box-shadow: 0 8px 28px rgba(7,4,20,0.5);
          pointer-events: none;
          animation: orb-tip-in 200ms ease;
        }
        .orb-tooltip-title {
          font-size: 12px;
          letter-spacing: 0.1em;
          font-family: 'Noto Serif SC', serif;
        }
        .orb-tooltip-bio {
          margin-top: 4px;
          font-size: 10px;
          color: rgba(240,198,116,0.8);
          letter-spacing: 0.08em;
        }
        .orb-tooltip-poem {
          margin-top: 4px;
          font-size: 10px;
          color: rgba(216,201,245,0.5);
          font-style: italic;
          line-height: 1.5;
        }

        @keyframes orb-wobble {
          0%, 100% { transform: translateY(0) scale(1); }
          35% { transform: translateY(-3px) scale(1.025); }
          65% { transform: translateY(2px) scale(0.985); }
        }
        @keyframes orb-pulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes orb-tip-in {
          from { opacity: 0; transform: translate(-50%, -90%); }
          to { opacity: 1; transform: translate(-50%, -100%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .orb-body, .orb-pulse { animation: none; }
        }
      `}</style>
    </div>
  );
}
