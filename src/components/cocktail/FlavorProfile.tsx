/**
 * FlavorProfile · 八维风味可视化
 * 每一维是一条会发光的色带，错位升起如夜幕里依次点亮的星
 * 紧凑布局，适合置于卡片侧栏与详情右栏
 */

import type { CSSProperties } from 'react';
import type { FlavorKey } from '../../types/cocktail';
import { FLAVOR_META } from '../../data/flavorMeta';

export interface FlavorProfileProps {
  /** 八维风味值 0-10 */
  flavorProfile: Record<FlavorKey, number>;
  /** 高亮维度 · 命中者圆点与数值转为金色 */
  highlight?: FlavorKey[];
}

export default function FlavorProfile({
  flavorProfile,
  highlight,
}: FlavorProfileProps) {
  const highlightSet = highlight ? new Set(highlight) : null;

  return (
    <div className="space-y-2.5">
      {FLAVOR_META.map((meta, i) => {
        const value = flavorProfile[meta.key] ?? 0;
        const isHighlight = highlightSet?.has(meta.key) ?? false;
        // 错位上升 · 每维晚 60ms，初帧隐藏以承接 slide-up 的起点
        const rowStyle: CSSProperties = {
          animationDelay: `${i * 60}ms`,
          animationFillMode: 'both',
        };

        return (
          <div
            key={meta.key}
            className="flex items-center gap-3 animate-slide-up"
            style={rowStyle}
          >
            {/* 维度标签 · 圆点 + 文字 */}
            <div className="flex items-center gap-1.5 w-16 shrink-0">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  backgroundColor: meta.color,
                  boxShadow: `0 0 6px ${meta.color}99`,
                }}
              />
              <span
                className={`text-xs tracking-[0.1em] ${
                  isHighlight ? 'text-moon-50' : 'text-moon-200/70'
                }`}
              >
                {meta.label}
              </span>
            </div>

            {/* 风味条 · 背景虚紫，填充该维色相并带微发光 */}
            <div className="flex-1 h-1.5 rounded-full bg-void-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${value * 10}%`,
                  background: `linear-gradient(90deg, ${meta.color}66, ${meta.color})`,
                  boxShadow: `0 0 8px ${meta.color}77`,
                }}
              />
            </div>

            {/* 数值 */}
            <span
              className={`font-mono text-xs w-5 text-right ${
                isHighlight ? 'text-gold-400' : 'text-moon-200/60'
              }`}
            >
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
