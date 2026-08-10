/**
 * FlavorSliders · 风味参数滑条组
 *
 * 5 个滑条：酒精度 · 甜度 · 酸度 · 苦度 · 果香
 * 每个滑条带标签、图标、当前值、颜色指示条
 */

import { useCallback } from 'react';
import type { FlavorParams } from '../../../engine/concentrationEngine';

interface SliderDef {
  key: keyof FlavorParams;
  label: string;
  icon: string;
  color: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderDef[] = [
  { key: 'alcohol', label: '酒精度', icon: '🔥', color: '#ef4444', min: 0, max: 1, step: 0.01 },
  { key: 'sweetness', label: '甜度', icon: '🍯', color: '#f59e0b', min: 0, max: 1, step: 0.01 },
  { key: 'sourness', label: '酸度', icon: '🍋', color: '#a3e635', min: 0, max: 1, step: 0.01 },
  { key: 'bitterness', label: '苦度', icon: '🌿', color: '#94a3b8', min: 0, max: 1, step: 0.01 },
  { key: 'fruitiness', label: '果香', icon: '🍊', color: '#fb923c', min: 0, max: 1, step: 0.01 },
];

export interface FlavorSlidersProps {
  value: FlavorParams;
  onChange: (params: FlavorParams) => void;
  disabled?: boolean;
}

export default function FlavorSliders({ value, onChange, disabled = false }: FlavorSlidersProps) {
  const handleChange = useCallback(
    (key: keyof FlavorParams, val: number) => {
      onChange({ ...value, [key]: val });
    },
    [value, onChange],
  );

  return (
    <div className="space-y-4">
      {SLIDERS.map((slider) => {
        const currentVal = value[slider.key];
        const pct = Math.round(currentVal * 100);

        return (
          <div key={slider.key} className="space-y-1.5">
            {/* 标签行 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{slider.icon}</span>
                <span
                  className="text-xs tracking-[0.1em] font-medium"
                  style={{ color: slider.color }}
                >
                  {slider.label}
                </span>
              </div>
              <span className="font-mono text-xs text-moon-200/60">
                {currentVal.toFixed(2)}
              </span>
            </div>

            {/* 滑条 */}
            <div className="relative">
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={currentVal}
                disabled={disabled}
                onChange={(e) => handleChange(slider.key, Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, ${slider.color}44 0%, ${slider.color} ${pct}%, rgba(255,255,255,0.06) ${pct}%, rgba(255,255,255,0.06) 100%)`,
                  accentColor: slider.color,
                }}
              />
              {/* 0.50 金线标记 */}
              <div
                className="absolute top-0 bottom-0 w-px bg-gold-400/30"
                style={{ left: '50%' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}