/**
 * GlassPanel · 磨砂玻璃容器
 * 深空紫金的基底质感单元，承载一切内容
 */

import type { ReactNode, CSSProperties } from 'react';

export interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  /** 金边强调 · 用于重要内容卡 */
  gold?: boolean;
  /** 内边距档位 */
  padding?: 'sm' | 'md' | 'lg' | 'none';
  /** 自定义样式（如悬浮光晕色） */
  style?: CSSProperties;
  /** 点击回调 */
  onClick?: () => void;
  /** 悬浮放大 */
  hover?: boolean;
}

const PADDING_MAP: Record<NonNullable<GlassPanelProps['padding']>, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  none: '',
};

export default function GlassPanel({
  children,
  className = '',
  gold = false,
  padding = 'md',
  style,
  onClick,
  hover = false,
}: GlassPanelProps) {
  const base = 'glass rounded-2xl relative overflow-hidden';
  const goldCls = gold ? 'glass-gold' : '';
  const padCls = PADDING_MAP[padding];
  const hoverCls = hover
    ? 'transition-all duration-500 cursor-pointer hover:-translate-y-1 hover:shadow-glow-amethyst'
    : '';
  const clickCls = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${base} ${goldCls} ${padCls} ${hoverCls} ${clickCls} ${className}`}
      style={style}
      onClick={onClick}
    >
      {/* 顶部细金线 · 呼应镜月光晕 */}
      {gold && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
      )}
      {children}
    </div>
  );
}
