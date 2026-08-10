/**
 * useGameTheory · 纳什均衡博弈论钩子
 *
 * 从 Y.Mine 六维人格向量 → 博弈论输入 → 纳什均衡分析
 * 为 BarCounterPage 的收敛可视化提供数据源
 *
 * 数据流：
 *   appStore.vector → personaVectorToGameTheoryInput → GameTheoryEngine.evaluate
 *   → 收敛轨迹 + 均衡结果 → NashConvergenceChart 渲染
 */
import { useMemo, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { GameTheoryEngine } from '../engine/gameTheoryEngine';
import type { GameTheoryInput, GameTheoryResult, ConvergenceTrace } from '../types/gameTheory';
import type { PersonaVector } from '../types/personaFusion';

/** 将六维人格向量映射为博弈论四维输入 */
export function personaVectorToGameTheoryInput(vector: PersonaVector): GameTheoryInput {
  return {
    /** 竞争强度 · LEAD 主导性 → 越高越倾向于竞争 */
    competitionIntensity: clamp(vector.LEAD),
    /** 市场增长 · VIS 远见 → 越高越看到增长空间 */
    marketGrowth: clamp(vector.VIS),
    /** 合作红利 · TOL 容错 → 越高越愿意合作 */
    cooperationBonus: clamp(vector.TOL),
    /** 价格战成本 · 1 - TOL → 容错越低，战争成本越高 */
    priceWarCost: clamp(1 - vector.TOL),
  };
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export interface UseGameTheoryReturn {
  /** 博弈论分析结果 */
  result: GameTheoryResult | null;
  /** 收敛轨迹 · 每轮快照 */
  convergenceTrace: ConvergenceTrace[];
  /** 收益矩阵 */
  payoffMatrix: [[number, number], [number, number]] | null;
  /** 输入参数 */
  input: GameTheoryInput | null;
  /** 是否有数据源 */
  hasDataSource: boolean;
}

export function useGameTheory(): UseGameTheoryReturn {
  const { vector } = useAppStore();
  const engineRef = useRef<GameTheoryEngine | null>(null);

  return useMemo(() => {
    if (!vector) {
      return {
        result: null,
        convergenceTrace: [],
        payoffMatrix: null,
        input: null,
        hasDataSource: false,
      };
    }

    // 销毁旧实例
    if (engineRef.current) {
      engineRef.current.destroy();
    }

    const input = personaVectorToGameTheoryInput(vector);
    const engine = new GameTheoryEngine();
    engineRef.current = engine;

    const result = engine.evaluate(input);
    const payoffMatrix = engine.getPayoffMatrix();
    const convergenceTrace = engine.getConvergenceHistory();

    return {
      result,
      convergenceTrace,
      payoffMatrix,
      input,
      hasDataSource: true,
    };
  }, [vector]);
}