/**
 * GradientButton · 渐变按钮
 * 紫金光晕 · 克制的发光交互
 */

import type { ReactNode, MouseEvent } from 'react';

export interface GradientButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'gold' | 'amethyst' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** 全宽 */
  block?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

const VARIANT_MAP: Record<NonNullable<GradientButtonProps['variant']>, string> = {
  gold: 'bg-gold-sheen text-void-900 font-semibold hover:shadow-glow-gold',
  amethyst:
    'bg-amethyst-sheen text-moon-50 font-medium hover:shadow-glow-amethyst',
  ghost:
    'bg-transparent text-moon-200 border border-amethyst-500/30 btn-ghost',
};

const SIZE_MAP: Record<NonNullable<GradientButtonProps['size']>, string> = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export default function GradientButton({
  children,
  onClick,
  variant = 'gold',
  size = 'md',
  disabled = false,
  block = false,
  className = '',
  type = 'button',
}: GradientButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed';
  const variantCls = VARIANT_MAP[variant];
  const sizeCls = SIZE_MAP[size];
  const blockCls = block ? 'w-full' : '';

  return (
    <button
      type={type}
      className={`${base} ${variantCls} ${sizeCls} ${blockCls} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
