/**
 * Game Theory Engine · 纳什均衡博弈论引擎
 *
 * 从 juezui 仓库 models/gamemind/gamemind-model.js 移植至 TypeScript，
 * 与 觉醉 日志系统集成。
 *
 * 核心算法：
 *   1. 根据输入参数构建 2x2 收益矩阵
 *   2. 迭代最佳响应动态寻找近似纳什均衡
 *   3. 映射收敛结果到均衡分数、策略推荐、市场格局
 *
 * 应用场景：
 *   - BalancePage · 平衡性验证中的对手策略模拟
 *   - SandboxPage · 沙盘扑克游戏中的对手 AI 决策
 *   - ChessPage · 棋局策略深度分析
 */

import type {
  GameTheoryInput,
  GameTheoryResult,
  GameTheoryConfig,
  PayoffMatrix,
  BestResponse,
  NashResult,
  ConvergenceTrace,
} from '../types/gameTheory';
import { DEFAULT_GAME_THEORY_CONFIG } from '../types/gameTheory';
import logger from './logger';

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

/** 数值安全截断至 [0, 1] */
function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** 安全数值 · 非数字或 undefined 时返回默认值 */
function safeNum(v: number | undefined, fallback: number): number {
  return typeof v === 'number' && !isNaN(v) ? v : fallback;
}

/** 绝对值差 */
function absDiff(a: number, b: number): number {
  return Math.abs(a - b);
}

// ═════════════════════════════════════════════════════════
// GameTheoryEngine 类
// ═════════════════════════════════════════════════════════

export class GameTheoryEngine {
  private config: GameTheoryConfig;
  private instanceId: string;
  private destroyed = false;
  private payoffMatrix: PayoffMatrix | null = null;
  private lastResult: GameTheoryResult | null = null;
  private convergenceHistory: ConvergenceTrace[] = [];

  constructor(config?: Partial<GameTheoryConfig>) {
    this.config = { ...DEFAULT_GAME_THEORY_CONFIG, ...config };
    this.instanceId = `gte-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    logger.flow('GameTheoryEngine', '实例创建', { instanceId: this.instanceId });
  }

  // ═════════════════════════════════════════════════════════
  // 公开 API
  // ═════════════════════════════════════════════════════════

  /**
   * 运行纳什均衡博弈模拟
   * 构建收益矩阵 → 迭代最佳响应 → 映射结果
   */
  evaluate(input: GameTheoryInput): GameTheoryResult {
    if (this.destroyed) {
      throw new Error('GameTheoryEngine 实例已销毁');
    }

    try {
      this.payoffMatrix = this.buildPayoffMatrix(input);
      const nash = this.iterateBestResponse(this.payoffMatrix);

      const convergenceRatio = nash.iterations / this.config.maxIterations;
      const distancePenalty = nash.converged ? 0 : convergenceRatio * 0.3;
      const rawEquilibrium = 1 - distancePenalty - nash.belief * 0.3;
      const equilibriumScore = clamp01(rawEquilibrium);

      const strategy = nash.finalAction === 1
        ? clamp01(0.3 + equilibriumScore * 0.4)
        : clamp01(0.1 + (1 - equilibriumScore) * 0.3);

      const marketRegime = this.classifyRegime(nash.belief, this.payoffMatrix);
      const nashStability = clamp01(nash.converged ? 1 - convergenceRatio * 0.3 : 0.2);
      const fuseCheck = equilibriumScore <= this.config.thresholds.FUSE;

      const result: GameTheoryResult = {
        equilibriumScore,
        strategyRecommendation: strategy,
        marketRegime,
        nashStability,
        fuseCheck,
      };

      this.lastResult = result;

      logger.flow('GameTheoryEngine', '评估完成', {
        instanceId: this.instanceId,
        equilibriumScore: equilibriumScore.toFixed(3),
        strategyRecommendation: strategy.toFixed(3),
        marketRegime,
        nashStability: nashStability.toFixed(3),
        fuseCheck,
        iterations: nash.iterations,
        converged: nash.converged,
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.flow('GameTheoryEngine', '评估错误', {
        instanceId: this.instanceId,
        error: message,
      });
      throw err;
    }
  }

  /** 获取最后一次评估结果 */
  getLastResult(): GameTheoryResult | null {
    return this.lastResult;
  }

  /** 获取收益矩阵（调试用） */
  getPayoffMatrix(): PayoffMatrix | null {
    return this.payoffMatrix;
  }

  /** 获取收敛轨迹 · 可视化用 */
  getConvergenceHistory(): ConvergenceTrace[] {
    return this.convergenceHistory;
  }

  /** 销毁实例 */
  destroy(): void {
    this.destroyed = true;
    this.payoffMatrix = null;
    this.lastResult = null;
    this.convergenceHistory = [];
    logger.flow('GameTheoryEngine', '实例销毁', { instanceId: this.instanceId });
  }

  // ═════════════════════════════════════════════════════════
  // 核心算法
  // ═════════════════════════════════════════════════════════

  /**
   * 构建 2x2 收益矩阵
   *
   * 矩阵表示一个通用的市场参与博弈：
   *   行 = 我方行动（0=AGGRESSIVE 激进, 1=COOPERATE 合作）
   *   列 = 对手行动（0=AGGRESSIVE, 1=COOPERATE）
   *   值 = 我方收益
   */
  private buildPayoffMatrix(input: GameTheoryInput): PayoffMatrix {
    const intensity = clamp01(safeNum(input.competitionIntensity, 0.5));
    const growth = clamp01(safeNum(input.marketGrowth, 0.5));
    const coopBonus = clamp01(safeNum(input.cooperationBonus, 0.3));
    const warCost = clamp01(safeNum(input.priceWarCost, 0.4));

    // 双方都合作 · 收益最高
    const cooperateVsCoop = 0.5 + coopBonus + growth * 0.3;
    // 我方合作、对手激进 · 收益最低
    const coopVsAgg = 0.2 - warCost * 0.5;
    // 我方激进、对手合作 · 收益较高
    const aggVsCoop = 0.6 + intensity * 0.2 - growth * 0.1;
    // 双方都激进 · 收益中等偏低
    const aggVsAgg = 0.3 - warCost * 0.3 + intensity * 0.1;

    const matrix: PayoffMatrix = [
      [aggVsAgg, aggVsCoop],   // 我方激进
      [coopVsAgg, cooperateVsCoop], // 我方合作
    ];

    logger.flow('GameTheoryEngine', '收益矩阵构建', {
      instanceId: this.instanceId,
      matrix: `[[${matrix[0][0].toFixed(2)}, ${matrix[0][1].toFixed(2)}], [${matrix[1][0].toFixed(2)}, ${matrix[1][1].toFixed(2)}]]`,
      params: { intensity: intensity.toFixed(2), growth: growth.toFixed(2), coopBonus: coopBonus.toFixed(2), warCost: warCost.toFixed(2) },
    });

    return matrix;
  }

  /**
   * 最佳响应 · 给定对手激进的概率，计算期望收益并选择最优行动
   */
  private bestResponse(payoff: PayoffMatrix, beliefOppAgg: number): BestResponse {
    const p = clamp01(beliefOppAgg);
    // 期望收益 = payoff[action][对手激进] * 对手激进概率 + payoff[action][对手合作] * 对手合作概率
    const eu0 = payoff[0][0] * p + payoff[0][1] * (1 - p); // 我方激进
    const eu1 = payoff[1][0] * p + payoff[1][1] * (1 - p); // 我方合作

    if (eu0 >= eu1) {
      return { action: 0, expectedPayoff: eu0 };
    }
    return { action: 1, expectedPayoff: eu1 };
  }

  /**
   * 迭代最佳响应 · 直到收敛或达到最大迭代次数
   *
   * 轮流更新我方信念和对手最佳响应，模拟双方逐步调整策略的过程。
   * 引入 ε-greedy 探索以避免局部最优。
   */
  private iterateBestResponse(payoff: PayoffMatrix): NashResult {
    const { maxIterations, initialBelief, explorationRate, nashConvergenceEpsilon } = this.config;

    const trace: ConvergenceTrace[] = [];
    let ourBelief = safeNum(initialBelief, 0.5);
    let iterations = 0;
    let converged = false;
    let lastBelief = -1;
    let finalAction: 0 | 1 = 1;

    for (let i = 0; i < maxIterations; i += 1) {
      iterations = i + 1;

      // ε-greedy 探索
      const explore = Math.random() < explorationRate;
      let br: BestResponse;
      if (explore) {
        br = { action: Math.random() < 0.5 ? 0 : 1, expectedPayoff: 0 };
      } else {
        br = this.bestResponse(payoff, ourBelief);
      }
      finalAction = br.action as 0 | 1;

      // 记录本轮轨迹
      trace.push({
        round: i,
        belief: clamp01(ourBelief),
        action: finalAction,
        explore,
        expectedPayoff: br.expectedPayoff,
      });

      // 构造对手的收益矩阵（转置我方矩阵）
      const oppPayoff: PayoffMatrix = [
        [payoff[0][0], payoff[1][0]], // 对手激进时
        [payoff[0][1], payoff[1][1]], // 对手合作时
      ];

      // 对手对我们行动的信念
      const opponentBeliefAboutUs = 1 - ourBelief;
      const oppBR = this.bestResponse(oppPayoff, opponentBeliefAboutUs);

      // 更新信念 · 对手激进则增加我方信念，对手合作则减少
      const newBelief = oppBR.action === 0
        ? ourBelief + (1 - ourBelief) * 0.5
        : ourBelief * 0.5;

      // 收敛检查
      if (absDiff(newBelief, lastBelief) < nashConvergenceEpsilon) {
        ourBelief = newBelief;
        converged = true;
        break;
      }

      lastBelief = ourBelief;
      ourBelief = newBelief;
    }

    this.convergenceHistory = trace;

    logger.flow('GameTheoryEngine', '迭代完成', {
      instanceId: this.instanceId,
      belief: ourBelief.toFixed(4),
      iterations,
      converged,
      finalAction,
      traceLen: trace.length,
    });

    return {
      belief: clamp01(ourBelief),
      iterations,
      converged,
      finalAction,
      convergenceTrace: trace,
    };
  }

  /**
   * 市场格局分类
   *
   * BLUE_OCEAN（蓝海）：合作/增长型均衡，双方合作收益高
   * RED_OCEAN（红海）：竞争/价格战型均衡，双方都偏激进
   */
  private classifyRegime(finalBelief: number, payoff: PayoffMatrix): 'RED_OCEAN' | 'BLUE_OCEAN' {
    const coopPayoff = payoff[1][1]; // 双方合作
    const aggPayoff = payoff[0][0];  // 双方激进

    if (coopPayoff > aggPayoff && finalBelief < 0.5) {
      return 'BLUE_OCEAN';
    }
    return 'RED_OCEAN';
  }
}

/**
 * 快捷函数 · 创建实例并评估
 * 适合一次性调用场景
 */
export function evaluateGameTheory(
  input: GameTheoryInput,
  config?: Partial<GameTheoryConfig>,
): { result: GameTheoryResult; engine: GameTheoryEngine } {
  const engine = new GameTheoryEngine(config);
  const result = engine.evaluate(input);
  return { result, engine };
}

/**
 * 将扑克行为画像参数映射为博弈论输入
 *
 * 用于 BalancePage 中的人格 → 博弈论参数转换
 */
export function pokerProfileToGameTheoryInput(profile: {
  aggressionLevel: number;   // 0-1 攻击性
  tiltResistance: number;    // 0-1 抗倾斜
  bluffFrequency: number;    // 0-1 诈唬频率
  foldRate: number;          // 0-1 弃牌率
}): GameTheoryInput {
  return {
    competitionIntensity: clamp01(profile.aggressionLevel),
    marketGrowth: clamp01(1 - profile.foldRate),
    cooperationBonus: clamp01(profile.tiltResistance),
    priceWarCost: clamp01(profile.bluffFrequency),
  };
}