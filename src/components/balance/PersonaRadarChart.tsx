/**
 * PersonaRadarChart · 六维人格雷达图
 *
 * 使用 Recharts RadarChart 展示六维人格向量（TOL/SPD/INF/ENT/LEAD/VIS）
 * 支持用户向量 + 四组棋风参考向量叠加对比
 *
 * 视觉：深空底色 · 金色用户区域 · 四组彩色参考线
 */

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PersonaVector } from '../../types/personaFusion';
import { DIM_LABEL, DIM_DESC } from '../../types/personaFusion';

// ═════════════════════════════════════════════════════════
// 类型
// ═════════════════════════════════════════════════════════

export interface PersonaRadarChartProps {
  /** 用户六维向量 */
  userVector: PersonaVector;
  /** 用户标签（如「紫人组 · 诗意弈者」） */
  userLabel?: string;
  /** 四组参考向量（可选，用于对比） */
  referenceVectors?: {
    label: string;
    color: string;
    vector: PersonaVector;
  }[];
  /** 图表高度 */
  height?: number;
  /** 额外类名 */
  className?: string;
}

// ═════════════════════════════════════════════════════════
// 维度顺序
// ═════════════════════════════════════════════════════════

const DIM_ORDER = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'] as const;

// ═════════════════════════════════════════════════════════
// 组件
// ═════════════════════════════════════════════════════════

export default function PersonaRadarChart({
  userVector,
  userLabel = '你的棋风',
  referenceVectors,
  height = 380,
  className = '',
}: PersonaRadarChartProps) {
  // 构建 Recharts 数据：每行为一个维度，列为各系列的值
  const data = DIM_ORDER.map((dim) => {
    const row: Record<string, unknown> = {
      dim: DIM_LABEL[dim],
      desc: DIM_DESC[dim],
      user: userVector[dim],
    };
    if (referenceVectors) {
      for (const ref of referenceVectors) {
        row[ref.label] = ref.vector[dim];
      }
    }
    return row;
  });

  const allSeries = [
    { key: 'user', label: userLabel, color: '#f0c674', fillOpacity: 0.2 },
    ...(referenceVectors ?? []).map((ref) => ({
      key: ref.label,
      label: ref.label,
      color: ref.color,
      fillOpacity: 0.06,
    })),
  ];

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} cx="50%" cy="50%">
          <PolarGrid
            stroke="rgba(155,123,212,0.18)"
            strokeWidth={0.8}
          />
          <PolarAngleAxis
            dataKey="dim"
            tick={{
              fill: 'rgba(216,201,245,0.7)',
              fontSize: 12,
              fontFamily: '"Noto Serif SC", Georgia, serif',
            }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 1]}
            tickCount={5}
            tick={{
              fill: 'rgba(200,200,220,0.35)',
              fontSize: 9,
            }}
            stroke="rgba(155,123,212,0.1)"
          />
          {allSeries.map((s) => (
            <Radar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              fill={s.color}
              fillOpacity={s.fillOpacity}
              strokeWidth={s.key === 'user' ? 2 : 1.2}
              strokeDasharray={s.key === 'user' ? undefined : '4 3'}
              dot={{
                r: s.key === 'user' ? 4 : 0,
                fill: s.color,
                stroke: 'rgba(255,255,255,0.4)',
                strokeWidth: 1,
              }}
            />
          ))}
          <Legend
            wrapperStyle={{
              fontSize: 11,
              fontFamily: '"Noto Serif SC", Georgia, serif',
            }}
            iconType="circle"
            formatter={(value: string) => (
              <span style={{ color: 'rgba(216,201,245,0.7)' }}>{value}</span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}