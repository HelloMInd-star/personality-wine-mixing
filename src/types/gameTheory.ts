/**
 * Game Theory 类型定义
 *
 * 从 juezui 仓库 models/gamemind 移植的纳什均衡博弈论类型系统
 */

/** 博弈输入参数 */
export interface GameTheoryInput {
  /** 竞争强度 0-1 · 越高对手越激进 */
  competitionIntensity: number;
  /** 市场增长 0-1 · 越高合作收益越大 */
  marketGrowth: number;
  /** 合作红利 0-1 · 双方合作时的额外收益 */
  cooperationBonus: number;
  /** 价格战成本 0-1 · 恶性竞争的损失 */
  priceWarCost: number;
}

/** 2x2 收益矩阵 · 行=我方行动 [0=AGGRESSIVE, 1=COOPERATE], 列=对手行动 */
export type PayoffMatrix = [[number, number], [number, number]];

/** 最佳响应结果 */
export interface BestResponse {
  action: 0 | 1;
  expectedPayoff: number;
}

/** 单轮收敛轨迹 · 可视化用 */
export interface ConvergenceTrace {
  /** 迭代轮次 (0-based) */
  round: number;
  /** 本轮信念值 */
  belief: number;
  /** 本轮行动 */
  action: 0 | 1;
  /** 是否为探索步 */
  explore: boolean;
  /** 本轮收益 */
  expectedPayoff: number;
}

/** 迭代结果 */
export interface NashResult {
  /** 最终信念（对手激进的概率） */
  belief: number;
  /** 迭代次数 */
  iterations: number;
  /** 是否收敛 */
  converged: boolean;
  /** 最终行动 */
  finalAction: 0 | 1;
  /** 收敛轨迹 · 每轮快照 */
  convergenceTrace: ConvergenceTrace[];
}

/** 博弈评估结果 */
export interface GameTheoryResult {
  /** 均衡分数 0-1 · 越高越稳定 */
  equilibriumScore: number;
  /** 策略推荐 0-1 · >0.5 偏合作, <0.5 偏激进 */
  strategyRecommendation: number;
  /** 市场格局 · RED_OCEAN=红海竞争, BLUE_OCEAN=蓝海合作 */
  marketRegime: 'RED_OCEAN' | 'BLUE_OCEAN';
  /** 纳什稳定性 0-1 · 越高越稳定 */
  nashStability: number;
  /** 是否触发熔断 · 均衡分数过低时触发 */
  fuseCheck: boolean;
}

/** 博弈论配置 */
export interface GameTheoryConfig {
  /** 纳什收敛阈值 */
  nashConvergenceEpsilon: number;
  /** 最大迭代次数 */
  maxIterations: number;
  /** 初始信念 */
  initialBelief: number;
  /** 探索率 · ε-greedy 探索概率 */
  explorationRate: number;
  /** 阈值 */
  thresholds: {
    /** 盈亏平衡点 */
    BREAKEVEN: number;
    /** 稳定点 */
    STEADY: number;
    /** 熔断点 */
    FUSE: number;
  };
}

/** 默认配置 · 严格对齐原版 gamemind-config.js 参数 */
export const DEFAULT_GAME_THEORY_CONFIG: GameTheoryConfig = {
  /** 收敛阈值 · 原版 0.02 */
  nashConvergenceEpsilon: 0.02,
  /** 最大迭代次数 · 原版 50 */
  maxIterations: 50,
  /** 初始信念 · 原版 0.5 */
  initialBelief: 0.5,
  /** 探索率 · 原版 0.1 */
  explorationRate: 0.1,
  thresholds: {
    /** 盈亏平衡点 · 原版 0.48 */
    BREAKEVEN: 0.48,
    /** 稳定点 · 原版 0.50 */
    STEADY: 0.50,
    /** 熔断点 · 原版 0.68（关键！原版多数场景触发熔断） */
    FUSE: 0.68,
  },
};