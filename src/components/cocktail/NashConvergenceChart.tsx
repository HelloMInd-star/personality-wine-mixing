/**
 * NashConvergenceChart · 纳什均衡收敛过程可视化
 *
 * SVG 折线图展示信念在迭代过程中的收敛轨迹：
 *   - 信念曲线 · 从 initialBelief(0.5) 渐近收敛到终值
 *   - 收敛阈值线 · 虚线标出 epsilon 带
 *   - 探索步标记 · 橙色圆点标注 ε-greedy 探索步
 *   - 结果摘要 · 收敛状态、均衡分数、市场格局
 */
import type { ConvergenceTrace, GameTheoryResult, GameTheoryInput } from '../../types/gameTheory';

interface Props {
  trace: ConvergenceTrace[];
  result: GameTheoryResult | null;
  input: GameTheoryInput | null;
}

const W = 600;
const H = 280;
const PAD = { top: 30, right: 40, bottom: 40, left: 60 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function xScale(round: number, maxRound: number): number {
  return PAD.left + (round / Math.max(1, maxRound)) * CHART_W;
}

function yScale(v: number): number {
  return PAD.top + (1 - v) * CHART_H;
}

export default function NashConvergenceChart({ trace, result }: Props) {
  if (!trace.length || !result) {
    return (
      <div className="text-center py-8 text-moon-200/50 text-xs">
        暂无收敛数据 · 请先采集人格向量
      </div>
    );
  }

  const maxRound = trace[trace.length - 1].round;
  const converged = result.nashStability > 0.5;

  // 收敛阈值带
  const epsilon = 0.02;
  const finalBelief = trace[trace.length - 1].belief;

  // 构造折线点
  const points = trace
    .map((t) => `${xScale(t.round, maxRound)},${yScale(t.belief)}`)
    .join(' ');

  const explorePoints = trace
    .filter((t) => t.explore)
    .map((t) => ({ x: xScale(t.round, maxRound), y: yScale(t.belief) }));

  return (
    <div className="space-y-4">
      {/* 收敛状态标签 */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase">
          Nash Convergence · 纳什收敛
        </div>
        <span
          className={`text-[10px] tracking-widest px-2 py-0.5 rounded-full border ${
            converged
              ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5'
              : 'text-amber-400 border-amber-400/30 bg-amber-400/5'
          }`}
        >
          {converged ? '◉ 已收敛' : '○ 未收敛'}
        </span>
      </div>

      {/* SVG 图表 */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ maxWidth: W }}
      >
        {/* 背景网格 */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <line
            key={`grid-${v}`}
            x1={PAD.left}
            y1={yScale(v)}
            x2={PAD.left + CHART_W}
            y2={yScale(v)}
            stroke="#6b5b95"
            strokeOpacity={0.15}
            strokeDasharray="4 4"
          />
        ))}

        {/* 收敛阈值带 */}
        <rect
          x={PAD.left}
          y={yScale(Math.min(1, finalBelief + epsilon))}
          width={CHART_W}
          height={Math.max(0, yScale(Math.max(0, finalBelief - epsilon)) - yScale(Math.min(1, finalBelief + epsilon)))}
          fill="#f0c674"
          fillOpacity={0.08}
        />

        {/* 信念折线 */}
        <polyline
          points={points}
          fill="none"
          stroke="#f0c674"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 探索步标记 */}
        {explorePoints.map((p, i) => (
          <circle
            key={`explore-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#e06552"
            fillOpacity={0.8}
            stroke="#e06552"
            strokeWidth={1}
          >
            <title>探索步</title>
          </circle>
        ))}

        {/* 终点标记 */}
        <circle
          cx={xScale(trace[trace.length - 1].round, maxRound)}
          cy={yScale(finalBelief)}
          r={5}
          fill={converged ? '#10b981' : '#f59e0b'}
          stroke={converged ? '#10b981' : '#f59e0b'}
          strokeWidth={2}
        >
          <title>最终信念: {finalBelief.toFixed(4)}</title>
        </circle>

        {/* Y 轴标签 */}
        <text
          x={PAD.left - 10}
          y={yScale(0)}
          textAnchor="end"
          className="fill-moon-200/40"
          fontSize={9}
          fontFamily="monospace"
        >
          0.0
        </text>
        <text
          x={PAD.left - 10}
          y={yScale(0.5)}
          textAnchor="end"
          className="fill-moon-200/40"
          fontSize={9}
          fontFamily="monospace"
        >
          0.5
        </text>
        <text
          x={PAD.left - 10}
          y={yScale(1)}
          textAnchor="end"
          className="fill-moon-200/40"
          fontSize={9}
          fontFamily="monospace"
        >
          1.0
        </text>
        <text
          x={PAD.left - 10}
          y={yScale(0.25)}
          textAnchor="end"
          className="fill-moon-200/30"
          fontSize={7}
          fontFamily="monospace"
        >
          0.25
        </text>
        <text
          x={PAD.left - 10}
          y={yScale(0.75)}
          textAnchor="end"
          className="fill-moon-200/30"
          fontSize={7}
          fontFamily="monospace"
        >
          0.75
        </text>

        {/* Y 轴标签 · 纵轴 */}
        <text
          x={PAD.left - 48}
          y={H / 2}
          textAnchor="middle"
          transform={`rotate(-90, ${PAD.left - 48}, ${H / 2})`}
          className="fill-moon-200/50"
          fontSize={9}
          letterSpacing={2}
        >
          信念值
        </text>

        {/* X 轴标签 */}
        <text
          x={PAD.left + CHART_W / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-moon-200/40"
          fontSize={9}
          fontFamily="monospace"
        >
          迭代轮次
        </text>
        <text
          x={PAD.left}
          y={H - 6}
          textAnchor="middle"
          className="fill-moon-200/30"
          fontSize={7}
          fontFamily="monospace"
        >
          0
        </text>
        <text
          x={PAD.left + CHART_W}
          y={H - 6}
          textAnchor="middle"
          className="fill-moon-200/30"
          fontSize={7}
          fontFamily="monospace"
        >
          {maxRound}
        </text>

        {/* 初始信念参考线 */}
        <line
          x1={PAD.left}
          y1={yScale(0.5)}
          x2={PAD.left + CHART_W}
          y2={yScale(0.5)}
          stroke="#6b5b95"
          strokeOpacity={0.3}
          strokeDasharray="2 4"
        />
        <text
          x={PAD.left + CHART_W + 4}
          y={yScale(0.5) + 3}
          className="fill-moon-200/30"
          fontSize={7}
          fontFamily="monospace"
        >
          初始
        </text>
      </svg>

      {/* 图例 */}
      <div className="flex items-center gap-4 text-[10px] text-moon-200/50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-gold-sheen rounded" />
          <span>信念轨迹</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#e06552]" />
          <span>探索步</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 border-t border-dashed border-amethyst-500/40" />
          <span>收敛阈值带</span>
        </div>
      </div>

      {/* 结果摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <SummaryChip label="均衡分数" value={result.equilibriumScore.toFixed(3)} color="text-gold-sheen" />
        <SummaryChip label="策略推荐" value={result.strategyRecommendation.toFixed(3)} color="text-cyan-400" />
        <SummaryChip label="市场格局" value={result.marketRegime === 'BLUE_OCEAN' ? '蓝海' : '红海'} color={result.marketRegime === 'BLUE_OCEAN' ? 'text-emerald-400' : 'text-red-400'} />
        <SummaryChip label="纳什稳定性" value={result.nashStability.toFixed(3)} color="text-amethyst-400" />
      </div>
    </div>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass rounded-lg p-2 text-center">
      <div className="text-[9px] tracking-widest text-moon-200/40 mb-1">{label}</div>
      <div className={`font-mono font-bold ${color}`}>{value}</div>
    </div>
  );
}