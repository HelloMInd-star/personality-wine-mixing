/**
 * 平衡性分析 · 类型定义
 *
 * 用于模拟人格化对手与玩家的对局，统计各人格类型的胜率分布，
 * 评估游戏平衡性。核心数据流：
 *   MBTI → 棋局四维信号 → PersonaPokerProfile → 模拟对局 → 胜率统计
 */

// ═════════════════════════════════════════════════════════
// 棋局四维决策信号
// ═════════════════════════════════════════════════════════

export interface ChessDecisionSignals {
  /** 开局进攻度 0-1 · 1=主动进攻(E) 0=防守反击(I) */
  openingAggression: number;
  /** 走棋直觉度 0-1 · 1=直觉快走(N) 0=长考慢走(S) */
  moveIntuition: number;
  /** 决策逻辑度 0-1 · 1=逻辑评估(T) 0=情绪判断(F) */
  decisionLogic: number;
  /** 收局果断度 0-1 · 1=快速收局(J) 0=继续施压(P) */
  endgameDecisiveness: number;
}

// ═════════════════════════════════════════════════════════
// 扑克行为画像（PersonaPokerMapper 输出）
// ═════════════════════════════════════════════════════════

export interface PokerBehaviorProfile {
  foldRate: number;
  raiseRate: number;
  allinRate: number;
  bluffFrequency: number;
  aggressionLevel: number;
  tiltResistance: number;
  potControlTight: number;
  noiseResistance: number;
  /** 人格标签 NF/NT/SJ/SP */
  personaLabel: string;
  /** 打牌风格描述 */
  playStyle: string;
  /** 棋风原型名 */
  archetype: string;
  /** 人格主色 */
  color: string;
  /** 棋风组名 */
  name: string;
}

// ═════════════════════════════════════════════════════════
// 对局场景
// ═════════════════════════════════════════════════════════

export interface GameScenario {
  id: string;
  name: string;
  /** 真实胜率 0-1 */
  trueP: number;
  /** 赔率 */
  b: number;
  /** 推荐动作 */
  recAction: 'RAISE' | 'FOLD';
  /** 描述 */
  desc: string;
}

// ═════════════════════════════════════════════════════════
// 单局结果
// ═════════════════════════════════════════════════════════

export interface GameResult {
  won: boolean;
  playerAction: string;
  optimalAction: string;
  madeOptimal: boolean;
  decisionAccuracy: number;
  perceivedP: number;
}

// ═════════════════════════════════════════════════════════
// 按场景统计
// ═════════════════════════════════════════════════════════

export interface ScenarioStats {
  wins: number;
  losses: number;
}

// ═════════════════════════════════════════════════════════
// 按人格统计
// ═════════════════════════════════════════════════════════

export interface MbtiStats {
  wins: number;
  losses: number;
  scenarios: Record<string, ScenarioStats>;
}

// ═════════════════════════════════════════════════════════
// 按组统计
// ═════════════════════════════════════════════════════════

export interface GroupStats {
  /** 组名 */
  name: string;
  /** 组内 MBTI 类型列表 */
  members: string[];
  /** 总胜数 */
  wins: number;
  /** 总对局数 */
  total: number;
  /** 组胜率 */
  winRate: number;
  /** 组内成员胜率列表 */
  memberRates: { mbti: string; winRate: number }[];
}

// ═════════════════════════════════════════════════════════
// 平衡性报告
// ═════════════════════════════════════════════════════════

export interface BalanceReport {
  /** 总对局数 */
  totalRounds: number;
  /** 总胜率 */
  overallWinRate: number;
  /** 最高胜率 */
  maxWinRate: number;
  /** 最低胜率 */
  minWinRate: number;
  /** 胜率极差 */
  spread: number;
  /** 平衡性评级 */
  balanceGrade: 'balanced' | 'slight_deviation' | 'unbalanced';
  /** 平衡性描述 */
  balanceDesc: string;
  /** 最高胜率对手 TOP3 */
  top3: Array<{ mbti: string; winRate: number }>;
  /** 最低胜率对手 BOTTOM3 */
  bottom3: Array<{ mbti: string; winRate: number }>;
  /** 按组统计 */
  groupStats: GroupStats[];
  /** 按场景统计 */
  scenarioStats: Array<{ id: string; name: string; winRate: number; desc: string }>;
  /** 详细表格行 */
  tableRows: BalanceTableRow[];
  /** 纳什均衡分析 · 每型对手的博弈论评估 */
  nashAnalysis?: NashAnalysisRow[];
}

export interface BalanceTableRow {
  mbti: string;
  group: string;
  groupColor: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  foldRate: number;
  raiseRate: number;
  bluffFreq: number;
  aggression: number;
  tiltResist: number;
  archetype: string;
}

// ═════════════════════════════════════════════════════════
// 运行配置
// ═════════════════════════════════════════════════════════

export interface BalanceConfig {
  totalRounds: number;
  /** 玩家基础正确率 */
  baseSkill: number;
  /** 是否输出详细日志 */
  debug: boolean;
  /** 用户棋局决策信号 · 用于个性化模拟 */
  userSignals?: ChessDecisionSignals;
}

/** 纳什均衡分析行 · 每型对手的博弈论评估 */
export interface NashAnalysisRow {
  mbti: string;
  group: string;
  groupColor: string;
  /** 均衡分数 0-1 */
  equilibriumScore: number;
  /** 策略推荐 0-1 */
  strategyRecommendation: number;
  /** 市场格局 */
  marketRegime: string;
  /** 纳什稳定性 0-1 */
  nashStability: number;
  /** 胜率 */
  winRate: number;
}

// ═════════════════════════════════════════════════════════
// 模拟结果 · pokerSimulator 输出
// ═════════════════════════════════════════════════════════

export interface SimulationResult {
  stats: Record<string, MbtiStats>;
  personas: Record<string, PokerBehaviorProfile>;
  scenarios: GameScenario[];
  mbtiList: string[];
  totalRounds: number;
  baseSkill: number;
}

// ═════════════════════════════════════════════════════════
// 对局历史 · 从 PokerPage 持久化到 BalancePage
// ═════════════════════════════════════════════════════════

export interface GameHistoryEntry {
  /** 唯一 ID */
  id: string;
  /** 对局时间戳 */
  timestamp: number;
  /** 玩家名 */
  players: string[];
  /** 各玩家手牌（字符串表示） */
  holeCards: string[][];
  /** 公共牌 */
  communityCards: string[];
  /** 各玩家手牌评估 */
  handEvaluations: string[];
  /** 胜者名 */
  winner: string;
  /** 胜者牌型 */
  winnerHand: string;
  /** 底池 */
  pot: number;
  /** 弃牌玩家 */
  foldedPlayers: string[];
  /** 各玩家行动序列 */
  actionSummary: string[];
}

// ═════════════════════════════════════════════════════════
// 日志条目
// ═════════════════════════════════════════════════════════

export interface BalanceLogEntry {
  scope: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  timestamp: string;
}