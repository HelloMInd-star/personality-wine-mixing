/**
 * BalanceAnalyzer · 平衡性分析引擎
 *
 * 模拟 N 次对局，统计不同人格类型对手的胜率分布，评估游戏平衡性。
 *
 * 核心链路：
 *   MBTI 信号 → PersonaPokerProfile → 模拟对局 → 胜率统计 → 平衡性报告
 *
 * 用法：
 *   import { runBalanceTest } from './balanceAnalyzer';
 *   const report = await runBalanceTest({ totalRounds: 1000 });
 *   console.log(report.spread, report.balanceGrade);
 */

import { logger } from './logger';
import type {
  ChessDecisionSignals,
  PokerBehaviorProfile,
  GameScenario,
  GameResult,
  MbtiStats,
  BalanceReport,
  BalanceConfig,
  BalanceTableRow,
  GroupStats,
} from '../types/balance';

// ═════════════════════════════════════════════════════════
// 对局场景
// ═════════════════════════════════════════════════════════

const SCENARIOS: GameScenario[] = [
  { id: 'A', name: '强牌 vs 诈唬', trueP: 0.82, b: 1.85, recAction: 'RAISE', desc: 'AA超池压力' },
  { id: 'B', name: '中等牌 vs 真强牌', trueP: 0.08, b: 2.40, recAction: 'FOLD', desc: 'AK撞上QQ' },
  { id: 'C', name: '小对埋伏', trueP: 0.90, b: 5.20, recAction: 'RAISE', desc: '77 set mining' },
  { id: 'D', name: '垃圾牌 vs 大注', trueP: 0.22, b: 2.00, recAction: 'FOLD', desc: '27o被bluff' },
];

// ═════════════════════════════════════════════════════════
// 16型MBTI → 棋局四维信号
// ═════════════════════════════════════════════════════════

const MBTI_SIGNALS: Record<string, ChessDecisionSignals> = {
  // NF 紫人组
  INFJ: { openingAggression: 0.25, moveIntuition: 0.85, decisionLogic: 0.30, endgameDecisiveness: 0.82 },
  INFP: { openingAggression: 0.18, moveIntuition: 0.92, decisionLogic: 0.22, endgameDecisiveness: 0.25 },
  ENFJ: { openingAggression: 0.80, moveIntuition: 0.78, decisionLogic: 0.35, endgameDecisiveness: 0.78 },
  ENFP: { openingAggression: 0.88, moveIntuition: 0.90, decisionLogic: 0.28, endgameDecisiveness: 0.20 },
  // NT 黄人组
  INTJ: { openingAggression: 0.30, moveIntuition: 0.88, decisionLogic: 0.92, endgameDecisiveness: 0.85 },
  INTP: { openingAggression: 0.22, moveIntuition: 0.85, decisionLogic: 0.88, endgameDecisiveness: 0.30 },
  ENTJ: { openingAggression: 0.92, moveIntuition: 0.82, decisionLogic: 0.90, endgameDecisiveness: 0.88 },
  ENTP: { openingAggression: 0.85, moveIntuition: 0.88, decisionLogic: 0.82, endgameDecisiveness: 0.22 },
  // SJ 蓝人组
  ISTJ: { openingAggression: 0.15, moveIntuition: 0.20, decisionLogic: 0.85, endgameDecisiveness: 0.88 },
  ISFJ: { openingAggression: 0.12, moveIntuition: 0.18, decisionLogic: 0.30, endgameDecisiveness: 0.82 },
  ESTJ: { openingAggression: 0.82, moveIntuition: 0.22, decisionLogic: 0.88, endgameDecisiveness: 0.90 },
  ESFJ: { openingAggression: 0.78, moveIntuition: 0.20, decisionLogic: 0.28, endgameDecisiveness: 0.85 },
  // SP 绿人组
  ISTP: { openingAggression: 0.25, moveIntuition: 0.22, decisionLogic: 0.82, endgameDecisiveness: 0.28 },
  ISFP: { openingAggression: 0.20, moveIntuition: 0.25, decisionLogic: 0.25, endgameDecisiveness: 0.22 },
  ESTP: { openingAggression: 0.90, moveIntuition: 0.28, decisionLogic: 0.78, endgameDecisiveness: 0.25 },
  ESFP: { openingAggression: 0.88, moveIntuition: 0.30, decisionLogic: 0.22, endgameDecisiveness: 0.20 },
};

// ═════════════════════════════════════════════════════════
// 四组棋风模板
// ═════════════════════════════════════════════════════════

const TEMPERAMENT_TEMPLATES: Record<string, {
  name: string;
  archetype: string;
  playStyle: string;
  color: string;
  baseProfile: Omit<PokerBehaviorProfile, 'personaLabel' | 'playStyle' | 'archetype' | 'color' | 'name'>;
}> = {
  NF: {
    name: '紫人组', archetype: '诗意弈者', playStyle: '直觉型松凶玩家', color: '#9d6bbf',
    baseProfile: { foldRate: 0.45, raiseRate: 0.22, allinRate: 0.04, bluffFrequency: 0.55, aggressionLevel: 0.65, tiltResistance: 0.35, potControlTight: 0.30, noiseResistance: 0.40 },
  },
  NT: {
    name: '黄人组', archetype: '算度大师', playStyle: '计算型紧凶玩家', color: '#f0c674',
    baseProfile: { foldRate: 0.55, raiseRate: 0.25, allinRate: 0.03, bluffFrequency: 0.30, aggressionLevel: 0.70, tiltResistance: 0.85, potControlTight: 0.60, noiseResistance: 0.80 },
  },
  SJ: {
    name: '蓝人组', archetype: '阵地守将', playStyle: '保守型紧弱玩家', color: '#4d6b8f',
    baseProfile: { foldRate: 0.62, raiseRate: 0.12, allinRate: 0.01, bluffFrequency: 0.10, aggressionLevel: 0.25, tiltResistance: 0.70, potControlTight: 0.70, noiseResistance: 0.65 },
  },
  SP: {
    name: '绿人组', archetype: '战术猎手', playStyle: '灵活型松凶玩家', color: '#8fa86b',
    baseProfile: { foldRate: 0.40, raiseRate: 0.28, allinRate: 0.06, bluffFrequency: 0.65, aggressionLevel: 0.75, tiltResistance: 0.50, potControlTight: 0.35, noiseResistance: 0.55 },
  },
};

// 四组棋风权重
const TEMPERAMENT_WEIGHTS: Record<string, (s: ChessDecisionSignals) => number> = {
  NF: (s) => s.moveIntuition * (1 - s.decisionLogic),
  NT: (s) => s.moveIntuition * s.decisionLogic,
  SJ: (s) => (1 - s.moveIntuition) * s.endgameDecisiveness,
  SP: (s) => (1 - s.moveIntuition) * (1 - s.endgameDecisiveness),
};

// ═════════════════════════════════════════════════════════
// 逐型微调覆盖表（在模板映射后应用）
// 用于精确校准个别 MBTI 类型的参数，不影响同组其他类型
// ═════════════════════════════════════════════════════════

type ProfileOverride = Partial<Record<keyof PokerBehaviorProfile, number>>;

const MBTI_PROFILE_OVERRIDES: Record<string, ProfileOverride> = {
  // NT 组微调
  INTP: { tiltResistance: 0.90 },   // 抗倾斜 -10% → 更易被情绪影响
  ENTP: { bluffFrequency: 1.15 },   // 诈唬 +15% → 更激进诈唬
};

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** 推断 MBTI 所属棋风组 */
export function temperamentForMbti(mbti: string): string {
  if (mbti.includes('NF')) return 'NF';
  if (mbti.includes('NT')) return 'NT';
  if (mbti.includes('SJ')) return 'SJ';
  if (mbti.includes('SP')) return 'SP';
  return 'NT';
}

/** 棋风组颜色 */
export function temperamentColor(id: string): string {
  const map: Record<string, string> = { NF: '#9d6bbf', NT: '#f0c674', SJ: '#4d6b8f', SP: '#8fa86b' };
  return map[id] || '#888';
}

// ═════════════════════════════════════════════════════════
// 人格→扑克行为映射（内联 PersonaPokerMapper 核心逻辑）
// ═════════════════════════════════════════════════════════

function inferTemperament(s: ChessDecisionSignals): string {
  const scores: Record<string, number> = {};
  for (const [key, fn] of Object.entries(TEMPERAMENT_WEIGHTS)) {
    scores[key] = fn(s);
  }
  const max = Math.max(...Object.values(scores));
  return Object.keys(scores).find((k) => scores[k] === max) || 'NT';
}

function mapSignalsToPoker(signals: ChessDecisionSignals, mbti?: string): PokerBehaviorProfile {
  const temperamentId = inferTemperament(signals);
  const template = TEMPERAMENT_TEMPLATES[temperamentId];
  const base = { ...template.baseProfile };

  const RANGE = 0.15;
  const norm = (v: number) => (v - 0.5) * 2;
  const a = norm(signals.openingAggression);
  const n = norm(signals.moveIntuition);
  const t = norm(signals.decisionLogic);
  const j = norm(signals.endgameDecisiveness);

  const adjustments: Record<string, number> = {
    foldRate: RANGE * (-a * 0.5 + j * 0.3 - n * 0.2),
    raiseRate: RANGE * (a * 0.5 - j * 0.3 + n * 0.2),
    allinRate: RANGE * (a * 0.35 + n * 0.35 - j * 0.3),
    bluffFrequency: RANGE * (n * 0.6 - t * 0.4),
    aggressionLevel: RANGE * (a * 0.7 + n * 0.3),
    tiltResistance: RANGE * (t * 0.8),
    potControlTight: RANGE * (j * 0.8),
    noiseResistance: RANGE * (t * 0.7),
  };

  const profile: Record<string, number> = {};
  for (const key of Object.keys(base)) {
    let val = (base as Record<string, number>)[key] + (adjustments[key] || 0);
    // 应用逐型微调覆盖（乘数）
    const overrides = mbti ? MBTI_PROFILE_OVERRIDES[mbti] : undefined;
    if (overrides && key in overrides) {
      val *= (overrides as Record<string, number>)[key];
    }
    profile[key] = clamp(val, 0.02, 0.95);
  }

  return {
    ...profile,
    personaLabel: temperamentId,
    playStyle: template.playStyle,
    archetype: template.archetype,
    color: template.color,
    name: template.name,
  } as PokerBehaviorProfile;
}

// ═════════════════════════════════════════════════════════
// 对局仿真
// ═════════════════════════════════════════════════════════

/**
 * 模拟一局游戏
 * 对手的人格画像会影响玩家的决策准确度：
 *   - bluffFrequency 高 → 玩家更倾向跟注（怕被诈）
 *   - aggressionLevel 高 → 玩家更容易被吓退
 *   - noiseResistance 高 → 对手信号更"可信"
 */
export function simulateOneGame(scenario: GameScenario, persona: PokerBehaviorProfile, baseSkill = 0.65): GameResult {
  const { trueP, recAction } = scenario;

  const noiseImpact =
    persona.bluffFrequency * 0.25 +
    persona.aggressionLevel * 0.20 -
    persona.noiseResistance * 0.10;

  const perceivedP = clamp(trueP + noiseImpact * 0.3, 0.01, 0.99);
  const decisionAccuracy = clamp(baseSkill - Math.abs(noiseImpact) * 0.4, 0.3, 0.95);

  const madeOptimal = Math.random() < decisionAccuracy;

  let playerAction: string;
  if (madeOptimal) {
    playerAction = recAction;
  } else {
    if (recAction === 'FOLD') {
      playerAction = Math.random() < 0.7 ? 'CALL' : 'RAISE';
    } else {
      playerAction = Math.random() < 0.5 ? 'FOLD' : 'CALL';
    }
  }

  let won: boolean;
  if (playerAction === 'FOLD') {
    won = recAction === 'FOLD';
  } else {
    won = Math.random() < trueP;
  }

  return { won, playerAction, optimalAction: recAction, madeOptimal, decisionAccuracy, perceivedP };
}

// ═════════════════════════════════════════════════════════
// 平衡性测试 · 主入口
// ═════════════════════════════════════════════════════════

const DEFAULT_CONFIG: BalanceConfig = {
  totalRounds: 1000,
  baseSkill: 0.65,
  debug: false,
};

/**
 * 运行平衡性测试
 *
 * @param config 运行配置
 * @param onProgress 进度回调 (current, total, pct)
 * @returns 平衡性报告
 */
export function runBalanceTest(
  config: Partial<BalanceConfig> = {},
  onProgress?: (current: number, total: number, pct: number) => void,
): BalanceReport {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { totalRounds } = cfg;

  logger.engine('BalanceAnalyzer:runBalanceTest 开始', { totalRounds });

  const mbtiList = Object.keys(MBTI_SIGNALS);

  // 初始化统计
  const stats: Record<string, MbtiStats> = {};
  mbtiList.forEach((m) => {
    stats[m] = { wins: 0, losses: 0, scenarios: {} };
    SCENARIOS.forEach((s) => { stats[m].scenarios[s.id] = { wins: 0, losses: 0 }; });
  });

  // 缓存人格画像
  const personas: Record<string, PokerBehaviorProfile> = {};
  mbtiList.forEach((m) => {
    personas[m] = mapSignalsToPoker(MBTI_SIGNALS[m], m);
  });

  const { baseSkill } = cfg;
  const BATCH_SIZE = 100;
  let currentRound = 0;

  while (currentRound < totalRounds) {
    const batchEnd = Math.min(currentRound + BATCH_SIZE, totalRounds);
    for (let i = currentRound; i < batchEnd; i++) {
      const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
      const mbti = mbtiList[Math.floor(Math.random() * mbtiList.length)];
      const persona = personas[mbti];
      const result = simulateOneGame(scenario, persona, baseSkill);

      if (result.won) {
        stats[mbti].wins++;
        stats[mbti].scenarios[scenario.id].wins++;
      } else {
        stats[mbti].losses++;
        stats[mbti].scenarios[scenario.id].losses++;
      }
    }
    currentRound = batchEnd;
    if (onProgress) {
      onProgress(currentRound, totalRounds, Math.round((currentRound / totalRounds) * 100));
    }
  }

  const report = buildReport(stats, personas, totalRounds);
  logger.engine('BalanceAnalyzer:runBalanceTest 完成', { spread: report.spread, grade: report.balanceGrade });
  return report;
}

// ═════════════════════════════════════════════════════════
// 报告构建
// ═════════════════════════════════════════════════════════

function buildReport(
  stats: Record<string, MbtiStats>,
  personas: Record<string, PokerBehaviorProfile>,
  totalRounds: number,
): BalanceReport {
  const mbtiList = Object.keys(MBTI_SIGNALS);

  // 总胜率
  const allWins = mbtiList.reduce((s, m) => s + stats[m].wins, 0);
  const overallWinRate = allWins / totalRounds;

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
  const scenarioStats = SCENARIOS.map((s) => {
    let sw = 0, sl = 0;
    mbtiList.forEach((m) => { sw += stats[m].scenarios[s.id].wins; sl += stats[m].scenarios[s.id].losses; });
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
// 导出
// ═════════════════════════════════════════════════════════

export { MBTI_SIGNALS, SCENARIOS, TEMPERAMENT_TEMPLATES };
export { mapSignalsToPoker, inferTemperament };