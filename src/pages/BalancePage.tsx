/**
 * BalancePage · 衡 · 平衡性验证
 *
 * 模拟 1000 次对局，统计不同人格类型对手的胜率分布，
 * 评估游戏平衡性。支持自定义局数、实时进度、多维度报告。
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlassPanel from '../components/ui/GlassPanel';
import logger from '../engine/logger';
import { runBalanceTest, temperamentColor, temperamentForMbti, mapSignalsToPoker } from '../engine/balanceAnalyzer';
import type { BalanceReport, BalanceTableRow, GroupStats, ChessDecisionSignals, PokerBehaviorProfile } from '../types/balance';

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
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, pct: 0 });
  const [report, setReport] = useState<BalanceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runRef = useRef(false);
  const autoRanRef = useRef(false);

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

  const handleRun = useCallback(() => {
    if (runRef.current) return;
    runRef.current = true;
    setRunning(true);
    setError(null);
    setReport(null);

    logger.flow('BalancePage', '开始平衡性测试', { rounds });

    // 使用 setTimeout 让 UI 先更新
    setTimeout(() => {
      try {
        const result = runBalanceTest(
          { totalRounds: rounds },
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
  }, [rounds]);

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
            onClick={handleRun}
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
          <OverviewCards report={report} />
          <GroupDistribution groupStats={report.groupStats} />
          <ScenarioDistribution scenarioStats={report.scenarioStats} />
          <BalanceReportBox report={report} />
          <DetailTable rows={report.tableRows} />
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
          {!fromChess && (
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