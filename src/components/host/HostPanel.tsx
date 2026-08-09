/**
 * HostPanel · 主理人浮层
 * 点击 HostBadge 展开 · 显示状态 + 页面指引 + 提示词
 * 深空紫金视觉语言 · 磨砂玻璃浮层
 */

import type { HostState } from '../../engine/hostEngine';

interface HostPanelProps {
  hostState: HostState;
  onNavigate?: (path: string) => void;
}

export default function HostPanel({ hostState, onNavigate }: HostPanelProps) {
  const {
    dotColor,
    glowColor,
    statusLabel,
    name,
    primaryColor,
    pageTitle,
    pageHint,
    statusHint,
    manifested,
  } = hostState;

  return (
    <div
      className="absolute top-full right-0 mt-3 w-72 rounded-2xl overflow-hidden animate-fade-in origin-top-right"
      style={{
        background: 'rgba(15, 10, 30, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(124, 95, 191, 0.2)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* 顶部光晕 · 主理人主色 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background: `radial-gradient(ellipse at top right, ${primaryColor}33, transparent 60%)`,
        }}
      />

      <div className="relative p-5">
        {/* 头部 · 状态 + 主理人名 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full animate-breathe"
              style={{
                background: dotColor,
                boxShadow: dotColor !== 'transparent' ? `0 0 8px ${glowColor}` : 'none',
                border: dotColor === 'transparent' ? '1px dashed rgba(216, 201, 245, 0.3)' : 'none',
              }}
            />
            <span className="text-[10px] tracking-[0.3em] text-moon-200/60 uppercase">
              {statusLabel}
            </span>
          </div>
          <div className="font-display text-sm text-gold-sheen">
            {name}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="divider-gold mb-4 opacity-40" />

        {/* 当前页面定位 */}
        <div className="mb-4">
          <div className="text-[10px] tracking-[0.3em] text-amethyst-400/60 uppercase mb-1.5">
            当前位置
          </div>
          <div className="font-display text-base text-moon-50 mb-1">
            {pageTitle}
          </div>
          <p className="text-xs text-moon-200/65 leading-relaxed">
            {pageHint}
          </p>
        </div>

        {/* 分隔线 */}
        <div className="divider-gold mb-4 opacity-30" />

        {/* 主理人提示词 · 时段驱动 */}
        <div className="mb-2">
          <div className="text-[10px] tracking-[0.3em] text-amethyst-400/60 uppercase mb-1.5">
            主理人
          </div>
          <p className="text-sm text-moon-200/80 italic leading-relaxed font-display">
            「{statusHint}」
          </p>
        </div>

        {/* 无画像引导 · 引导去测评 */}
        {!manifested && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('/personality')}
            className="mt-4 w-full text-xs text-gold-400/70 hover:text-gold-400 tracking-[0.15em] py-2 rounded-lg border border-gold-400/20 hover:border-gold-400/40 transition-all duration-300"
          >
            完成测评 · 让镜中的程序员显形 →
          </button>
        )}
      </div>
    </div>
  );
}
