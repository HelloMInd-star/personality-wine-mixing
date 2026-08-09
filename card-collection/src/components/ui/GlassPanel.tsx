/**
 * 毛玻璃面板 · 深空基底
 * 支持模块主题色边线 + 金色强调
 */
import type { ReactNode } from 'react';
import type { CardModule } from '../../types';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  /** 绑定模块主题色（影响边线/光晕） */
  module?: CardModule;
  /** 金色强调边线 · 用于结果/标题等关键面板 */
  gold?: boolean;
}

const PAD = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const MODULE_CLASS: Record<CardModule, string> = {
  tarot: 'module-tarot',
  zodiac: 'module-zodiac',
  poker: 'module-poker',
  texas: 'module-texas',
};

export default function GlassPanel({
  children,
  className = '',
  padding = 'md',
  module,
  gold = false,
}: GlassPanelProps) {
  const moduleClass = module ? MODULE_CLASS[module] : '';
  const baseClass = gold ? 'glass-panel-gold' : 'glass-panel';
  const borderStyle = module
    ? { borderColor: 'color-mix(in srgb, var(--module-color) 30%, transparent)' }
    : gold
      ? undefined
      : undefined;
  return (
    <div
      className={`${baseClass} ${moduleClass} ${PAD[padding]} ${className}`}
      style={borderStyle}
    >
      {children}
    </div>
  );
}
