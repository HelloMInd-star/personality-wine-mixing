/**
 * BalanceAnalyzer · 平衡性分析协调器
 *
 * 职责：协调扑克模拟层 + 博弈论层，构建统一的平衡性报告。
 *
 * 架构：
 *   pokerSimulator ──→ Monte Carlo 模拟 → 原始统计
 *   gameTheoryEngine ──→ 纳什均衡分析 → 博弈论数据
 *   balanceAnalyzer ──→ 协调二者 → 完整 BalanceReport
 *
 * 用法：
 *   import { runBalanceTest } from './balanceAnalyzer';
 *   const report = runBalanceTest({ totalRounds: 1000 });
 */

import { logger } from './logger';
import { runPokerSimulation, mapSignalsToPoker, temperamentForMbti, temperamentColor, MBTI_SIGNALS } from './pokerSimulator';
import { GameTheoryEngine } from './gameTheoryEngine';
import type {
  ChessDecisionSignals,
  PokerBehaviorProfile,
  BalanceReport,
  BalanceConfig,
  BalanceTableRow,
  GroupStats,
  MbtiStats,
  NashAnalysisRow,
} from '../types/balance';

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

// ═════════════════════════════════════════════════════════
// 棋局信号 → 博弈论输入
// ═════════════════════════════════════════════════════════

function signalsToGameTheoryInput(s: ChessDecisionSignals) {
  return {
    competitionIntensity: clamp(s.openingAggression * 0.5 + s.decisionLogic * 0.5, 0.01, 0.99),
    marketGrowth: clamp(s.moveIntuition * 0.5 + s.endgameDecisiveness * 0.5, 0.01, 0.99),
    cooperationBonus: clamp(1 - s.openingAggression * 0.6, 0.01, 0.99),
    priceWarCost: clamp(s.openingAggression * 0.4 + s.decisionLogic * 0.3, 0.01, 0.99),
  };
}

// ═════════════════════════════════════════════════════════
// 纳什均衡分析
// ═════════════════════════════════════════════════════════

function runNashAnalysis(
  stats: Record<string, MbtiStats>,
): NashAnalysisRow[] {
  const engine = new GameTheoryEngine();
  const mbtiList = Object.keys(MBTI_SIGNALS);

  return mbtiList.map((mbti) => {
    const signals = MBTI_SIGNALS[mbti];
    const input = signalsToGameTheoryInput(signals);
    const result = engine.evaluate(input);

    const t = stats[mbti].wins + stats[mbti].losses;
    const winRate = t > 0 ? stats[mbti].wins / t : 0;

    return {
      mbti,
      group: temperamentForMbti(mbti),
      groupColor: temperamentColor(temperamentForMbti(mbti)),
      equilibriumScore: result.equilibriumScore,
      strategyRecommendation: result.strategyRecommendation,
      marketRegime: result.marketRegime,
      nashStability: result.nashStability,
      winRate,
    };
  });
}

// ═════════════════════════════════════════════════════════
// 报告构建
// ═════════════════════════════════════════════════════════

function buildReport(
  stats: Record<string, MbtiStats>,
  personas: Record<string, PokerBehaviorProfile>,
  totalRounds: number,
  scenarios: { id: string; name: string; desc: string }[],
): BalanceReport {
  const mbtiList = Object.keys(MBTI_SIGNALS);

  // 总胜率
  const allWins = mbtiList.reduce((s, m) => s + stats[m].wins, 0);
  const overallWinRate = totalRounds > 0 ? allWins / totalRounds : 0;

  // 各人格胜率
  const winrates = mbtiList.map((m) => {
    const t = stats[m].wins + stats[m].losses;
    return { mbti: m, winRate: t > 0 ? stats[m].wins / t : 0 };
  });

  const maxWinRate = Math.max(...winrates.map((w) => w.winRate));
  const minWinRate = Math.min(...winrates.map((w) => w.winRate));
  const spread = maxWinRate - minWinRate;

  // 平衡性评级
  let balanceGrade: BalanceReport['balanceGrade'];
  let balanceDesc: string;
  if (spread <= 0.05) {
    balanceGrade = 'balanced';
    balanceDesc = '平衡良好 · 各人格对手难度差异在可接受范围内';
  } else if (spread <= 0.10) {
    balanceGrade = 'slight_deviation';
    balanceDesc = '轻微偏差 · 建议微调极端人格的诈唬/攻击参数';
  } else {
    balanceGrade = 'unbalanced';
    balanceDesc = '显著不平衡 · 需要重新校准人格模板参数';
  }

  // 排序
  const sortedByWR = [...winrates].sort((a, b) => b.winRate - a.winRate);
  const top3 = sortedByWR.slice(0, 3).map((w) => ({ mbti: w.mbti, winRate: w.winRate }));
  const bottom3 = sortedByWR.slice(-3).reverse().map((w) => ({ mbti: w.mbti, winRate: w.winRate }));

  // 按组统计
  const groups: Record<string, string[]> = { NF: [], NT: [], SJ: [], SP: [] };
  mbtiList.forEach((m) => groups[temperamentForMbti(m)].push(m));

  const groupNames: Record<string, string> = {
    NF: '紫人组 · NF', NT: '黄人组 · NT', SJ: '蓝人组 · SJ', SP: '绿人组 · SP',
  };

  const groupStats: GroupStats[] = Object.entries(groups).map(([g, members]) => {
    const gWins = members.reduce((s, m) => s + stats[m].wins, 0);
    const gTotal = members.reduce((s, m) => s + stats[m].wins + stats[m].losses, 0);
    const winRate = gTotal > 0 ? gWins / gTotal : 0;
    const memberRates = members.map((m) => {
      const t = stats[m].wins + stats[m].losses;
      return { mbti: m, winRate: t > 0 ? stats[m].wins / t : 0 };
    });
    return { name: groupNames[g], members, wins: gWins, total: gTotal, winRate, memberRates };
  });

  // 按场景统计
  const scenarioStats = scenarios.map((s) => {
    let sw = 0, sl = 0;
    mbtiList.forEach((m) => { sw += stats[m].scenarios[s.id]?.wins ?? 0; sl += stats[m].scenarios[s.id]?.losses ?? 0; });
    const winRate = sw + sl > 0 ? sw / (sw + sl) : 0;
    return { id: s.id, name: s.name, winRate, desc: s.desc };
  });

  // 详细表格行
  const tableRows: BalanceTableRow[] = mbtiList.map((m) => {
    const s = stats[m];
    const t = s.wins + s.losses;
    const p = personas[m];
    const group = temperamentForMbti(m);
    return {
      mbti: m,
      group,
      groupColor: temperamentColor(group),
      total: t,
      wins: s.wins,
      losses: s.losses,
      winRate: t > 0 ? s.wins / t : 0,
      foldRate: p.foldRate,
      raiseRate: p.raiseRate,
      bluffFreq: p.bluffFrequency,
      aggression: p.aggressionLevel,
      tiltResist: p.tiltResistance,
      archetype: p.archetype,
    };
  });

  return {
    totalRounds,
    overallWinRate,
    maxWinRate,
    minWinRate,
    spread,
    balanceGrade,
    balanceDesc,
    top3,
    bottom3,
    groupStats,
    scenarioStats,
    tableRows,
  };
}

// ═════════════════════════════════════════════════════════
// 主入口
// ═════════════════════════════════════════════════════════

/**
 * 运行平衡性测试
 *
 * 1. 调用 pokerSimulator 进行 Monte Carlo 模拟
 * 2. 调用 gameTheoryEngine 进行纳什均衡分析
 * 3. 构建统一报告
 *
 * @param config 运行配置
 * @param onProgress 进度回调
 * @returns 完整平衡性报告
 */
export function runBalanceTest(
  config: Partial<BalanceConfig> = {},
  onProgress?: (current: number, total: number, pct: number) => void,
): BalanceReport {
  logger.flow('BalanceAnalyzer', '开始平衡性测试', config);

  // ── 1. 扑克模拟层 ──
  const simResult = runPokerSimulation(config, onProgress);

  // ── 2. 报告构建 ──
  const report = buildReport(
    simResult.stats,
    simResult.personas,
    simResult.totalRounds,
    simResult.scenarios.map((s) => ({ id: s.id, name: s.name, desc: s.desc })),
  );

  // ── 3. 博弈论层 ──
  report.nashAnalysis = runNashAnalysis(simResult.stats);

  logger.flow('BalanceAnalyzer', '测试完成', {
    spread: report.spread,
    grade: report.balanceGrade,
    nashRows: report.nashAnalysis?.length ?? 0,
  });

  return report;
}

// ═════════════════════════════════════════════════════════
// 导出
// ═════════════════════════════════════════════════════════

export { mapSignalsToPoker, temperamentForMbti, temperamentColor };