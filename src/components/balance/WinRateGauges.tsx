/**
 * WinRateGauges · 胜率仪表盘
 *
 * 使用 Recharts RadialBarChart 为每型 MBTI 对手渲染半圆仪表盘
 * 按棋风组（NF紫/NT黄/SJ蓝/SP绿）折叠分组，默认展开胜率最低的组
 *
 * 视觉：深空底色 · 半圆仪表盘 · 组色描边 · 中心胜率数字
 * 行为：手风琴折叠 · 全局展开/收起 · 平滑过渡动画
 */

import { useState, useMemo, useCallback } from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import type { BalanceTableRow } from '../../types/balance';
import { temperamentForMbti, temperamentColor } from '../../engine/balanceAnalyzer';

// ═════════════════════════════════════════════════════════
// 类型
// ═════════════════════════════════════════════════════════

export interface WinRateGaugesProps {
  /** 平衡性表格行 · 含每型 MBTI 的胜率 */
  rows: BalanceTableRow[];
  /** 额外类名 */
  className?: string;
}

interface GaugeGroupData {
  group: string;
  name: string;
  color: string;
  rows: BalanceTableRow[];
  /** 组均胜率 */
  avgWinRate: number;
}

// ═════════════════════════════════════════════════════════
// 单个仪表盘（不变）
// ═════════════════════════════════════════════════════════

function GaugeCell({ mbti, winRate, color }: { mbti: string; winRate: number; color: string }) {
  const data = useMemo(() => [{ value: winRate * 100 }], [winRate]);
  const pct = (winRate * 100).toFixed(0);
  const barColor = winRate > 0.55 ? '#22c55e' : winRate > 0.45 ? color : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            startAngle={180}
            endAngle={0}
            cx="50%"
            cy="100%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={8}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              dataKey="value"
              fill={barColor}
              background={{ fill: 'rgba(155,123,212,0.12)' }}
              cornerRadius={3}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <span className="font-mono text-[11px] font-bold" style={{ color }}>
            {pct}%
          </span>
        </div>
      </div>
      <span className="text-[10px] tracking-wider mt-1 font-mono" style={{ color }}>
        {mbti}
      </span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 折叠组
// ═════════════════════════════════════════════════════════

function GaugeGroup({
  group,
  isOpen,
  onToggle,
}: {
  group: GaugeGroupData;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      {/* 组头：可点击折叠 */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 py-2 group cursor-pointer
                   hover:bg-amethyst-500/5 rounded-lg transition-colors px-2 -mx-2"
      >
        {/* 色点 */}
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: group.color }}
        />
        {/* 组名 */}
        <span
          className="text-[11px] tracking-[0.15em] font-bold"
          style={{ color: group.color }}
        >
          {group.name}
        </span>
        {/* 均胜率 */}
        <span className="text-[10px] text-moon-200/40 font-mono">
          均值 {(group.avgWinRate * 100).toFixed(0)}%
        </span>
        {/* 型数 */}
        <span className="text-[10px] text-moon-200/30">
          · {group.rows.length} 型
        </span>
        {/* 折叠箭头 */}
        <span
          className={`
            ml-auto text-[10px] text-moon-200/40 transition-transform duration-300
            ${isOpen ? 'rotate-180' : 'rotate-0'}
          `}
        >
          ▾
        </span>
      </button>

      {/* 仪表盘网格 · 折叠动画 */}
      <div
        className={`
          grid grid-cols-4 gap-3 overflow-hidden
          transition-all duration-300 ease-out
          ${isOpen ? 'max-h-48 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'}
        `}
      >
        {group.rows.map((r) => (
          <GaugeCell
            key={r.mbti}
            mbti={r.mbti}
            winRate={r.winRate}
            color={group.color}
          />
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 主组件
// ═════════════════════════════════════════════════════════

const GROUP_ORDER = ['NF', 'NT', 'SJ', 'SP'];

const GROUP_NAME: Record<string, string> = {
  NF: '紫人组 · NF',
  NT: '黄人组 · NT',
  SJ: '蓝人组 · SJ',
  SP: '绿人组 · SP',
};

export default function WinRateGauges({ rows, className = '' }: WinRateGaugesProps) {
  // ── 分组 + 均胜率 ──
  const grouped = useMemo<GaugeGroupData[]>(() => {
    const map: Record<string, BalanceTableRow[]> = {};
    for (const row of rows) {
      const g = temperamentForMbti(row.mbti);
      if (!map[g]) map[g] = [];
      map[g].push(row);
    }
    return GROUP_ORDER.map((g) => {
      const groupRows = map[g] ?? [];
      const avgWinRate =
        groupRows.length > 0
          ? groupRows.reduce((s, r) => s + r.winRate, 0) / groupRows.length
          : 0;
      return {
        group: g,
        name: GROUP_NAME[g],
        color: temperamentColor(g),
        rows: groupRows,
        avgWinRate,
      };
    });
  }, [rows]);

  // ── 默认展开胜率最低的组 ──
  const defaultExpanded = useMemo(() => {
    const lowest = grouped.reduce(
      (min, g) => (g.avgWinRate < min.avgWinRate ? g : min),
      grouped[0],
    );
    return new Set([lowest.group]);
  }, [grouped]);

  // ── 展开/收起状态 ──
  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded);

  const handleToggle = useCallback((group: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  // 全部展开 / 全部收起
  const allExpanded = expanded.size === grouped.length;
  const handleToggleAll = useCallback(() => {
    if (allExpanded) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(grouped.map((g) => g.group)));
    }
  }, [allExpanded, grouped]);

  return (
    <div className={className}>
      {/* 全局控制栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] tracking-[0.35em] text-amethyst-400/60 uppercase font-mono">
          Win Rate Gauges
        </div>
        <button
          type="button"
          onClick={handleToggleAll}
          className="text-[10px] tracking-[0.15em] text-amethyst-400/50 hover:text-gold-400
                     transition-colors font-mono"
        >
          {allExpanded ? '全部收起 ▴' : '全部展开 ▾'}
        </button>
      </div>

      {/* 分组列表 */}
      <div className="flex flex-col gap-2">
        {grouped.map((g) => (
          <GaugeGroup
            key={g.group}
            group={g}
            isOpen={expanded.has(g.group)}
            onToggle={() => handleToggle(g.group)}
          />
        ))}
      </div>
    </div>
  );
}