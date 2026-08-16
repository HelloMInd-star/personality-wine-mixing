/**
 * BalancePage · 衡 · 平衡性验证
 *
 * 模拟 1000 次对局，统计不同人格类型对手的胜率分布，
 * 评估游戏平衡性。支持自定义局数、实时进度、多维度报告。
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlassPanel from '../components/ui/GlassPanel';
import PersonaRadarChart from '../components/balance/PersonaRadarChart';
import WinRateGauges from '../components/balance/WinRateGauges';
import logger from '../engine/logger';
import { runBalanceTest, temperamentColor, temperamentForMbti, mapSignalsToPoker } from '../engine/balanceAnalyzer';
import { signalsToTemperament, getChessTemperament, CHESS_TEMPERAMENTS } from '../data/mbtiChessData';
import { getGameHistory, clearGameHistory } from '../engine/pokerHistoryStore';
import type { BalanceReport, BalanceTableRow, GroupStats, ChessDecisionSignals, PokerBehaviorProfile, NashAnalysisRow, GameHistoryEntry } from '../types/balance';

// ═════════════════════════════════════════════════════════
// 默认配置
// ═════════════════════════════════════════════════════════

const DEFAULT_ROUNDS = 1000;
const ROUND_OPTIONS = [100, 500, 1000, 2000, 5000];

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

function pct(v: number): string {
  return (v * 100).toFixed(1) + '%';
}

function pct0(v: number): string {
  return (v * 100).toFixed(0) + '%';
}

function colorForRate(rate: number): string {
  if (rate > 0.55) return 'text-emerald-400';
  if (rate > 0.48) return 'text-gold-400';
  if (rate > 0.42) return 'text-amber-400';
  return 'text-red-400';
}

// ═════════════════════════════════════════════════════════
// 子组件
// ═════════════════════════════════════════════════════════

/** 总览卡片 */
function OverviewCards({ report }: { report: BalanceReport }) {
  const spreadColor =
    report.balanceGrade === 'balanced' ? 'text-emerald-400' :
    report.balanceGrade === 'slight_deviation' ? 'text-amber-400' : 'text-red-400';

  const cards = [
    { label: '总对局数', value: report.totalRounds.toLocaleString(), color: 'text-cyan-400' },
    { label: '总胜率', value: pct(report.overallWinRate), color: 'text-gold-400', sub: `${report.tableRows.reduce((s, r) => s + r.wins, 0)}胜` },
    { label: '最高胜率', value: pct(report.maxWinRate), color: 'text-emerald-400' },
    { label: '最低胜率', value: pct(report.minWinRate), color: 'text-red-400' },
    { label: '胜率极差', value: pct(report.spread), color: spreadColor, sub: report.balanceDesc.slice(0, 8) },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="glass rounded-xl p-4 text-center border border-amethyst-500/10">
          <div className={`text-2xl md:text-3xl font-display font-bold ${c.color}`}>{c.value}</div>
          <div className="text-[10px] text-amethyst-400/60 tracking-widest mt-1">{c.label}</div>
          {c.sub && <div className="text-[10px] text-moon-200/40 mt-0.5">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/** 按组分布 */
function GroupDistribution({ groupStats }: { groupStats: GroupStats[] }) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {groupStats.map((g) => {
        const color = temperamentColor(g.name.slice(0, 2));
        const memberDetails = g.memberRates
          .map((m) => `${m.mbti} ${pct0(m.winRate)}`)
          .join(' · ');
        return (
          <div
            key={g.name}
            className="glass rounded-xl p-4 text-center border border-amethyst-500/10"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            <div className="text-sm font-bold mb-2" style={{ color }}>{g.name}</div>
            <div className="text-3xl font-display font-bold mb-1" style={{ color }}>
              {pct0(g.winRate)}
            </div>
            <div className="text-[10px] text-amethyst-400/50 leading-relaxed">{memberDetails}</div>
            <div className="mt-3 h-1.5 bg-void-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${g.winRate * 100}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 场景分布 */
function ScenarioDistribution({ scenarioStats }: { scenarioStats: BalanceReport['scenarioStats'] }) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {scenarioStats.map((s) => {
        const cls = s.winRate > 0.6 ? 'text-emerald-400' : s.winRate > 0.4 ? 'text-gold-400' : 'text-red-400';
        return (
          <div key={s.id} className="glass rounded-lg p-3 text-center border border-amethyst-500/10">
            <div className="text-xs font-bold text-cyan-400 mb-1">{s.id}. {s.name}</div>
            <div className={`text-xl font-display font-bold ${cls}`}>{pct0(s.winRate)}</div>
            <div className="text-[10px] text-amethyst-400/50 mt-1">{s.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

/** 平衡性报告 */
function BalanceReportBox({ report }: { report: BalanceReport }) {
  const gradeTag =
    report.balanceGrade === 'balanced' ? '✓ 均衡' :
    report.balanceGrade === 'slight_deviation' ? '⚡ 轻微偏差' : '⚠ 不平衡';

  const gradeColor =
    report.balanceGrade === 'balanced' ? 'text-emerald-400' :
    report.balanceGrade === 'slight_deviation' ? 'text-amber-400' : 'text-red-400';

  return (
    <GlassPanel className="mb-6">
      <h3 className="text-sm text-cyan-400 tracking-[0.2em] mb-4">平衡性报告</h3>

      <div className="space-y-2 text-sm">
        <div className="text-moon-200/60">
          胜率极差 <span className="font-bold text-moon-100">{pct(report.spread)}</span>
          <span className={`ml-2 ${gradeColor}`}>{gradeTag}</span>
          <span className="ml-1 text-amethyst-400/50">— {report.balanceDesc}</span>
        </div>

        <div className="text-moon-200/60">
          最高胜率对手：
          {report.top3.map((t, i) => (
            <span key={t.mbti} className="ml-1.5 font-bold" style={{ color: temperamentColor(temperamentForMbti(t.mbti)) }}>
              {t.mbti} {pct0(t.winRate)}
              {i < report.top3.length - 1 ? ' · ' : ''}
            </span>
          ))}
          <span className="text-amethyst-400/50 ml-1">→ 这些对手太"弱"</span>
        </div>

        <div className="text-moon-200/60">
          最低胜率对手：
          {report.bottom3.map((t, i) => (
            <span key={t.mbti} className="ml-1.5 font-bold" style={{ color: temperamentColor(temperamentForMbti(t.mbti)) }}>
              {t.mbti} {pct0(t.winRate)}
              {i < report.bottom3.length - 1 ? ' · ' : ''}
            </span>
          ))}
          <span className="text-amethyst-400/50 ml-1">→ 这些对手太"强"</span>
        </div>

        {report.groupStats.map((g) => {
          const rates = g.memberRates.map((m) => m.winRate);
          const gMax = Math.max(...rates);
          const gMin = Math.min(...rates);
          const gSpread = gMax - gMin;
          const spreadCls = gSpread > 0.08 ? 'text-red-400' : gSpread > 0.04 ? 'text-amber-400' : 'text-emerald-400';
          return (
            <div key={g.name} className="text-moon-200/60">
              {g.name}：均值 <span className="font-bold text-moon-100">{pct0(g.winRate)}</span>
              <span className="ml-2">组内极差 <span className={spreadCls}>{pct(gSpread)}</span></span>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

/** 详细表格 */
function DetailTable({ rows }: { rows: BalanceTableRow[] }) {
  const sorted = [...rows].sort((a, b) => b.winRate - a.winRate);
  return (
    <div className="overflow-x-auto rounded-xl border border-amethyst-500/10 glass mb-6">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-void-900/60 text-amethyst-400/50">
            <th className="sticky left-0 bg-void-900/60 p-3 text-left">MBTI</th>
            <th className="p-3">棋风组</th>
            <th className="p-3">局数</th>
            <th className="p-3 text-emerald-400/70">胜</th>
            <th className="p-3 text-red-400/70">负</th>
            <th className="p-3">胜率</th>
            <th className="p-3">弃牌率</th>
            <th className="p-3">加注率</th>
            <th className="p-3">诈唬率</th>
            <th className="p-3">攻击性</th>
            <th className="p-3">抗倾斜</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.mbti} className="border-b border-amethyst-500/5 hover:bg-amethyst-500/5 transition-colors">
              <td className="sticky left-0 bg-void-900/80 p-3 font-mono font-bold" style={{ color: r.groupColor }}>
                {r.mbti}
              </td>
              <td className="p-3 text-center">
                <span
                  className="inline-block px-2 py-0.5 rounded text-[10px]"
                  style={{ background: `${r.groupColor}22`, color: r.groupColor, border: `1px solid ${r.groupColor}44` }}
                >
                  {r.archetype}
                </span>
              </td>
              <td className="p-3 text-center text-moon-200/50">{r.total}</td>
              <td className="p-3 text-center text-emerald-400/70">{r.wins}</td>
              <td className="p-3 text-center text-red-400/70">{r.losses}</td>
              <td className={`p-3 text-center font-bold ${colorForRate(r.winRate)}`}>{pct0(r.winRate)}</td>
              <td className="p-3 text-center text-moon-200/50">{pct0(r.foldRate)}</td>
              <td className="p-3 text-center text-moon-200/50">{pct0(r.raiseRate)}</td>
              <td className="p-3 text-center text-moon-200/50">{pct0(r.bluffFreq)}</td>
              <td className="p-3 text-center text-moon-200/50">{pct0(r.aggression)}</td>
              <td className="p-3 text-center text-moon-200/50">{pct0(r.tiltResist)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 纳什均衡分析面板 */
function NashAnalysisPanel({ rows }: { rows: NashAnalysisRow[] }) {
  const sorted = [...rows].sort((a, b) => b.equilibriumScore - a.equilibriumScore);

  return (
    <GlassPanel className="mb-6">
      <h3 className="text-sm text-cyan-400 tracking-[0.2em] mb-4">纳什均衡分析 · 博弈论评估</h3>
      <p className="text-[11px] text-moon-200/50 mb-4 italic">
        每型对手的棋局信号 → 博弈论输入 → 纳什均衡收敛 · 均衡分数越高，对手策略越"稳定"
      </p>
      <div className="overflow-x-auto rounded-xl border border-amethyst-500/10">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-void-900/60 text-amethyst-400/50">
              <th className="sticky left-0 bg-void-900/60 p-3 text-left">MBTI</th>
              <th className="p-3">棋风组</th>
              <th className="p-3">均衡分数</th>
              <th className="p-3">策略推荐</th>
              <th className="p-3">市场格局</th>
              <th className="p-3">纳什稳定性</th>
              <th className="p-3">胜率</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.mbti} className="border-b border-amethyst-500/5 hover:bg-amethyst-500/5 transition-colors">
                <td className="sticky left-0 bg-void-900/80 p-3 font-mono font-bold" style={{ color: r.groupColor }}>
                  {r.mbti}
                </td>
                <td className="p-3 text-center">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-[10px]"
                    style={{ background: `${r.groupColor}22`, color: r.groupColor, border: `1px solid ${r.groupColor}44` }}
                  >
                    {r.group}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-bold text-gold-400">{(r.equilibriumScore * 100).toFixed(1)}%</span>
                    <div className="w-12 h-1.5 bg-void-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${r.equilibriumScore * 100}%`, background: r.groupColor }}
                      />
                    </div>
                  </div>
                </td>
                <td className="p-3 text-center text-moon-200/70">{(r.strategyRecommendation * 100).toFixed(0)}%</td>
                <td className="p-3 text-center">
                  <span className={r.marketRegime === 'BLUE_OCEAN' ? 'text-emerald-400' : 'text-red-400'}>
                    {r.marketRegime === 'BLUE_OCEAN' ? '蓝海' : '红海'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className={r.nashStability > 0.8 ? 'text-emerald-400' : r.nashStability > 0.5 ? 'text-amber-400' : 'text-red-400'}>
                    {(r.nashStability * 100).toFixed(1)}%
                  </span>
                </td>
                <td className={`p-3 text-center font-bold ${colorForRate(r.winRate)}`}>
                  {pct0(r.winRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}

/** 真实对局历史面板 · 从 PokerPage 流入的数据 */
function GameHistoryPanel() {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getGameHistory());
  }, []);

  if (history.length === 0) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <GlassPanel className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm text-cyan-400 tracking-[0.2em]">
            真实对局历史 · 从扑克流入
          </h3>
          <p className="text-[10px] text-moon-200/40 mt-1">
            {history.length} 场对局记录 · 来自 PokerPage 真实牌局
          </p>
        </div>
        <button
          type="button"
          onClick={() => { clearGameHistory(); setHistory([]); }}
          className="text-[10px] text-red-400/40 hover:text-red-400/80 tracking-wider transition-colors"
        >
          清空历史
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-amethyst-500/10">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-void-900/60 text-amethyst-400/50">
              <th className="p-2 text-left">时间</th>
              <th className="p-2 text-left">玩家</th>
              <th className="p-2 text-center">公共牌</th>
              <th className="p-2 text-center">底池</th>
              <th className="p-2 text-center">胜者</th>
              <th className="p-2 text-center">牌型</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 10).map((g) => (
              <tr key={g.id} className="border-b border-amethyst-500/5 hover:bg-amethyst-500/5 transition-colors">
                <td className="p-2 text-moon-200/40 font-mono">{formatTime(g.timestamp)}</td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {g.players.map((p, i) => (
                      <span
                        key={p}
                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${
                          g.foldedPlayers.includes(p)
                            ? 'bg-red-500/10 text-red-400/60 line-through'
                            : g.winner === p
                            ? 'bg-gold-400/15 text-gold-400'
                            : 'bg-amethyst-500/10 text-moon-200/50'
                        }`}
                      >
                        {p}
                        {g.holeCards[i]?.length > 0 && (
                          <span className="ml-0.5 opacity-50">{g.holeCards[i].join(' ')}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-2 text-center font-mono text-moon-200/50">
                  {g.communityCards.join(' ')}
                </td>
                <td className="p-2 text-center font-mono text-gold-400/70">{g.pot}</td>
                <td className="p-2 text-center">
                  <span className="text-gold-400 font-bold">{g.winner}</span>
                </td>
                <td className="p-2 text-center text-moon-200/50">{g.winnerHand}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}

/** 个人扑克画像卡片（从棋局跳转时展示） */
function PersonalProfileCard({ profile }: { profile: PokerBehaviorProfile }) {
  const color = profile.color;
  const temperamentLabel = profile.personaLabel;
  const groupName = temperamentLabel === 'NF' ? '紫人组' : temperamentLabel === 'NT' ? '黄人组' : temperamentLabel === 'SJ' ? '蓝人组' : '绿人组';

  const items: { label: string; value: string }[] = [
    { label: '弃牌率', value: pct0(profile.foldRate) },
    { label: '加注率', value: pct0(profile.raiseRate) },
    { label: '全下率', value: pct0(profile.allinRate) },
    { label: '诈唬频率', value: pct0(profile.bluffFrequency) },
    { label: '攻击性', value: pct0(profile.aggressionLevel) },
    { label: '抗倾斜', value: pct0(profile.tiltResistance) },
    { label: '锅控紧度', value: pct0(profile.potControlTight) },
    { label: '抗噪音', value: pct0(profile.noiseResistance) },
  ];

  return (
    <GlassPanel className="mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-display text-xl shrink-0 animate-breathe"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${color}cc, ${color}88)`,
            boxShadow: `0 0 20px ${color}66`,
          }}
        >
          {temperamentLabel === 'NF' ? '紫' : temperamentLabel === 'NT' ? '黄' : temperamentLabel === 'SJ' ? '蓝' : '绿'}
        </div>
        <div>
          <div className="text-[10px] tracking-widest text-amethyst-400/60 uppercase">
            {groupName} · {profile.archetype}
          </div>
          <div className="font-display text-lg text-gold-sheen">{profile.name}</div>
          <div className="text-[11px] text-moon-200/50 italic mt-0.5">{profile.playStyle}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] text-amethyst-400/50 tracking-widest">来自棋局</div>
          <Link
            to="/chess"
            className="text-[10px] text-amethyst-400/40 hover:text-gold-400 tracking-wider transition-colors"
          >
            ← 返回棋局
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-lg font-display font-bold" style={{ color }}>{item.value}</div>
            <div className="text-[9px] text-amethyst-400/50 tracking-wider mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// ═════════════════════════════════════════════════════════
// 主页面
// ═════════════════════════════════════════════════════════

export default function BalancePage() {
  const location = useLocation();
  const state = location.state as { from?: string; signals?: ChessDecisionSignals } | null;

  // ── 调试日志：打印 location.state 内容 ──
  useEffect(() => {
    console.log('%c[BalancePage] %clocation.state %c→',
      'color:#f0c674;font-weight:bold',
      'color:#a78bfa',
      'color:#e5e7eb');
    console.log('  from:', state?.from ?? '(无)');
    console.log('  signals:', state?.signals
      ? JSON.stringify({
        openingAggression: state.signals.openingAggression.toFixed(2),
        moveIntuition: state.signals.moveIntuition.toFixed(2),
        decisionLogic: state.signals.decisionLogic.toFixed(2),
        endgameDecisiveness: state.signals.endgameDecisiveness.toFixed(2),
      })
      : '(无)');
    if (state?.signals) {
      const profile = mapSignalsToPoker(state.signals, 'user');
      console.log('  profile:', {
        foldRate: (profile.foldRate * 100).toFixed(0) + '%',
        raiseRate: (profile.raiseRate * 100).toFixed(0) + '%',
        bluffFreq: (profile.bluffFrequency * 100).toFixed(0) + '%',
        aggression: (profile.aggressionLevel * 100).toFixed(0) + '%',
        tiltResist: (profile.tiltResistance * 100).toFixed(0) + '%',
        archetype: profile.archetype,
        playStyle: profile.playStyle,
      });
    }
    logger.flow('BalancePage', 'location.state 检测', {
      from: state?.from ?? 'direct',
      hasSignals: !!state?.signals,
    });
  }, [state]);

  const fromChess = state?.from === 'chess' && !!state?.signals;
  const userProfile = fromChess && state?.signals
    ? mapSignalsToPoker(state.signals, 'user')
    : null;

  // 从棋局信号推导用户棋风向量（用于雷达图）
  const userTemperamentVector = useMemo(() => {
    if (!fromChess || !state?.signals) return null;
    const { temperamentId } = signalsToTemperament(state.signals);
    return getChessTemperament(temperamentId).vector;
  }, [fromChess, state?.signals]);

  // 四组棋风参考向量（雷达图对比线）
  const referenceVectors = useMemo(
    () =>
      CHESS_TEMPERAMENTS.map((t) => ({
        label: t.chessArchetype,
        color: t.color,
        vector: t.vector,
      })),
    [],
  );

  // 用户棋风标签（用于雷达图图例）
  const userTemperamentLabel = useMemo(() => {
    if (!fromChess || !state?.signals) return '你的棋风';
    const { temperamentId } = signalsToTemperament(state.signals);
    const t = getChessTemperament(temperamentId);
    return `${t.name} · ${t.chessArchetype}`;
  }, [fromChess, state?.signals]);

  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, pct: 0 });
  const [report, setReport] = useState<BalanceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runRef = useRef(false);
  const autoRanRef = useRef(false);

  // ── Tab 切换 ──
  const [activeTab, setActiveTab] = useState<'overview' | 'nash' | 'gauges'>('overview');

  // ── 手动棋风输入 ──
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualSignals, setManualSignals] = useState<ChessDecisionSignals>({
    openingAggression: 0.5,
    moveIntuition: 0.5,
    decisionLogic: 0.5,
    endgameDecisiveness: 0.5,
  });
  // 手动输入是否已触发运行
  const manualRanRef = useRef(false);

  // ── 从棋局跳转时自动运行 ──
  useEffect(() => {
    if (fromChess && userProfile && !autoRanRef.current && !runRef.current) {
      autoRanRef.current = true;
      logger.flow('BalancePage', '棋局跳转 → 自动运行模拟', {
        signals: state?.signals,
        profile: {
          foldRate: pct0(userProfile.foldRate),
          raiseRate: pct0(userProfile.raiseRate),
          bluffFreq: pct0(userProfile.bluffFrequency),
          aggression: pct0(userProfile.aggressionLevel),
        },
      });
      handleRun();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromChess, userProfile]);

  const handleRun = useCallback((signalsOverride?: ChessDecisionSignals) => {
    if (runRef.current) return;
    runRef.current = true;
    setRunning(true);
    setError(null);
    setReport(null);

    const signals = signalsOverride ?? state?.signals;
    logger.flow('BalancePage', '开始平衡性测试', { rounds, hasSignals: !!signals });

    // 使用 setTimeout 让 UI 先更新
    setTimeout(() => {
      try {
        const result = runBalanceTest(
          { totalRounds: rounds, userSignals: signals },
          (current, total, pct) => {
            setProgress({ current, total, pct });
          },
        );
        setReport(result);
        logger.flow('BalancePage', '测试完成', { spread: pct(result.spread) });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        logger.error('BalancePage', '测试失败', msg);
      } finally {
        setRunning(false);
        runRef.current = false;
      }
    }, 50);
  }, [rounds, state?.signals]);

  // ── 手动棋风运行 ──
  const handleManualRun = useCallback(() => {
    manualRanRef.current = true;
    handleRun(manualSignals);
  }, [handleRun, manualSignals]);

  return (
    <div className="px-6 md:px-12 lg:px-20 py-12 md:py-16 min-h-screen">
      {/* 标题 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            to={fromChess ? '/chess' : '/brew/sandbox'}
            className="text-[10px] text-amethyst-400/50 hover:text-gold-400 tracking-widest transition-colors"
          >
            ← {fromChess ? '棋局' : '沙盘'}
          </Link>
          <div className="w-px h-4 bg-amethyst-500/20" />
          <span className="text-[10px] text-amethyst-400/30 tracking-[0.3em] uppercase">BALANCE</span>
          {fromChess && (
            <>
              <div className="w-px h-4 bg-amethyst-500/20" />
              <span className="text-[10px] text-cyan-400/50 tracking-[0.2em]">FROM CHESS</span>
            </>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gold-sheen tracking-wider">
          {fromChess ? '衡 · 对战模拟' : '衡 · 平衡性验证'}
        </h1>
        <p className="text-sm text-amethyst-400/50 mt-2 tracking-wider">
          {fromChess
            ? '你的棋局人格画像 × 16型MBTI对手模拟 · 看看谁的棋风最难对付'
            : '16型MBTI人格 × 4种场景 × N次模拟 · 统计各人格对手胜率分布'}
        </p>
      </div>

      {/* 个人画像卡片（从棋局跳转时） */}
      {fromChess && userProfile && !running && <PersonalProfileCard profile={userProfile} />}

      {/* 六维雷达图（从棋局跳转时） */}
      {fromChess && userTemperamentVector && !running && (
        <GlassPanel className="mb-8">
          <div className="text-[10px] tracking-[0.35em] text-amethyst-400/60 uppercase font-mono mb-4">
            Radar · 六维棋风向量
          </div>
          <p className="text-[11px] text-moon-200/50 mb-4 italic">
            你的棋局决策映射的六维人格向量 · 金色区域越大，对应维度越强
          </p>
          <PersonaRadarChart
            userVector={userTemperamentVector}
            userLabel={userTemperamentLabel}
            referenceVectors={referenceVectors}
            height={360}
          />
        </GlassPanel>
      )}

      {/* 真实对局历史 · 从 PokerPage 流入 */}
      <GameHistoryPanel />

      {/* 控制栏 */}
      <GlassPanel className="mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-moon-200/60 tracking-wider">局数</span>
          <div className="flex gap-2">
            {ROUND_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                disabled={running}
                onClick={() => setRounds(n)}
                className={`px-4 py-2 rounded-lg text-xs font-mono transition-all border ${
                  rounds === n
                    ? 'border-amethyst-500/40 bg-amethyst-500/15 text-gold-400'
                    : 'border-amethyst-500/10 text-moon-200/50 hover:border-amethyst-500/25'
                } ${running ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {n.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            type="button"
            disabled={running}
            onClick={() => handleRun()}
            className={`px-8 py-2.5 rounded-lg text-sm font-bold tracking-wider transition-all ${
              running
                ? 'bg-amethyst-500/20 text-amethyst-400/50 cursor-wait'
                : 'bg-gradient-to-r from-amethyst-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-amethyst-500/25 hover:-translate-y-0.5'
            }`}
          >
            {running ? '运行中...' : '运行平衡测试'}
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => { setReport(null); setError(null); }}
            className="px-4 py-2 rounded-lg text-xs border border-amethyst-500/15 text-moon-200/50 hover:text-moon-200/80 transition-colors disabled:opacity-40"
          >
            重置
          </button>
        </div>
      </GlassPanel>

      {/* 进度条 */}
      {running && (
        <div className="mb-6">
          <div className="h-2 bg-void-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progress.pct}%`,
                background: 'linear-gradient(90deg, #a78bfa, #22d3ee)',
              }}
            />
          </div>
          <div className="text-center text-[11px] text-amethyst-400/50 mt-2 tracking-wider">
            {progress.current.toLocaleString()} / {progress.total.toLocaleString()} ({progress.pct}%)
          </div>
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* 结果 */}
      {report && !running && (
        <>
          {/* Tab 栏 */}
          <div className="flex gap-1 mb-6">
            {([
              { key: 'overview', label: '衡 · 总览', icon: '衡' },
              { key: 'nash', label: '弈 · 纳什均衡', icon: '弈' },
              { key: 'gauges', label: '盘 · 胜率仪表', icon: '盘' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-2.5 rounded-lg text-xs font-bold tracking-[0.15em] transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-amethyst-500/15 text-gold-400 border border-amethyst-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                    : 'text-moon-200/40 border border-transparent hover:text-moon-200/60 hover:bg-amethyst-500/5'
                }`}
              >
                <span className="mr-1.5 text-[10px] opacity-60">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gold-400/60 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* 概览 Tab */}
          <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
            <OverviewCards report={report} />
            <GroupDistribution groupStats={report.groupStats} />
            <ScenarioDistribution scenarioStats={report.scenarioStats} />
            <BalanceReportBox report={report} />
          </div>

          {/* 博弈 Tab */}
          <div style={{ display: activeTab === 'nash' ? 'block' : 'none' }}>
            {report.nashAnalysis ? (
              <NashAnalysisPanel rows={report.nashAnalysis} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-moon-200/30 text-sm tracking-wider">暂无纳什均衡分析数据</div>
                <div className="text-[10px] text-amethyst-400/20 mt-2">请从棋局页面跳转以获取博弈论数据</div>
              </div>
            )}
          </div>

          {/* 仪表 Tab */}
          <div style={{ display: activeTab === 'gauges' ? 'block' : 'none' }}>
            <WinRateGauges rows={report.tableRows} />
            <DetailTable rows={report.tableRows} />
          </div>
        </>
      )}

      {/* 空状态 */}
      {!report && !running && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border border-amethyst-500/20" />
            <div className="absolute inset-0 rounded-full border-t border-gold-400/50 animate-spin" />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-amethyst-500/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-display text-gold-400/40">
              衡
            </div>
          </div>
          <div className="text-moon-200/40 text-sm tracking-wider">
            {fromChess ? '正在加载棋局画像...' : '选择局数，点击「运行平衡测试」开始'}
          </div>
          <div className="text-[10px] text-amethyst-400/30 mt-2 tracking-[0.2em]">
            {fromChess
              ? '即将自动运行你的个人对战模拟'
              : '模拟对局将在本地浏览器中运行，无需后端'}
          </div>

          {/* 手动棋风输入入口 */}
          {!fromChess && (
            <div className="mt-8 w-full max-w-lg">
              <button
                type="button"
                onClick={() => setShowManualInput(!showManualInput)}
                className="w-full px-4 py-3 rounded-xl border border-amethyst-500/15 bg-amethyst-500/5
                           text-xs text-amethyst-400/60 hover:text-gold-400 hover:border-amethyst-500/30
                           transition-all duration-300 tracking-[0.15em]"
              >
                {showManualInput ? '收起棋风输入 ▴' : '▸ 输入棋风报告 · 手动调整四维信号'}
              </button>

              {/* 四维滑块面板 */}
              {showManualInput && (
                <div className="mt-4 p-5 rounded-xl border border-amethyst-500/15 bg-void-900/60 text-left">
                  <div className="text-[10px] tracking-[0.3em] text-amethyst-400/60 uppercase font-mono mb-4">
                    Chess Style Input · 棋风信号
                  </div>

                  {([
                    { key: 'openingAggression' as const, dim: 'EI', label: '开局攻击性', left: '稳守反击', right: '主动出击', color: '#f0c674' },
                    { key: 'moveIntuition' as const, dim: 'NS', label: '走棋直觉', left: '精确计算', right: '直觉走法', color: '#22d3ee' },
                    { key: 'decisionLogic' as const, dim: 'TF', label: '决策逻辑', left: '情绪驱动', right: '逻辑评估', color: '#a78bfa' },
                    { key: 'endgameDecisiveness' as const, dim: 'JP', label: '残局决断', left: '开放施压', right: '快速收局', color: '#34d399' },
                  ] as const).map((dim) => (
                    <div key={dim.key} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] tracking-widest text-moon-200/50">
                          {dim.dim} · {dim.label}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: dim.color }}>
                          {(manualSignals[dim.key] * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-moon-200/30 w-14 text-right shrink-0">{dim.left}</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(manualSignals[dim.key] * 100)}
                          onChange={(e) =>
                            setManualSignals((prev) => ({
                              ...prev,
                              [dim.key]: Number(e.target.value) / 100,
                            }))
                          }
                          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(90deg, ${dim.color}44, ${dim.color})`,
                            accentColor: dim.color,
                          }}
                        />
                        <span className="text-[9px] text-moon-200/30 w-14 shrink-0">{dim.right}</span>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleManualRun}
                    className="mt-5 w-full px-6 py-2.5 rounded-lg text-sm font-bold tracking-wider
                               bg-gradient-to-r from-amethyst-500 to-indigo-500 text-white
                               hover:shadow-lg hover:shadow-amethyst-500/25 hover:-translate-y-0.5
                               transition-all duration-300"
                  >
                    以此为棋风运行模拟
                  </button>
                </div>
              )}
            </div>
          )}

          {!fromChess && !showManualInput && (
            <div className="mt-6 p-4 rounded-xl border border-amethyst-500/15 bg-amethyst-500/5 max-w-md">
              <div className="text-[10px] text-amethyst-400/60 tracking-widest mb-2">提示</div>
              <div className="text-xs text-moon-200/50 leading-relaxed">
                你也可以从 <Link to="/chess" className="text-cyan-400/70 hover:text-gold-400 transition-colors">棋局页面</Link> 完成棋风采集后，
                点击「对战模拟」按钮，系统将自动生成你的个人扑克画像并运行针对性模拟。
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}