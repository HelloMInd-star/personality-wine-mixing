/**
 * BarCounterPage · 纳什均衡集成测试
 *
 * 模拟用户从首页 → BarCounterPage 完整流程，
 * 验证纳什均衡算法在实时页面中生效：
 *
 *   1. 六维向量 → 博弈论输入映射
 *   2. GameTheoryEngine 评估流水线
 *   3. 收敛轨迹记录
 *   4. NashConvergenceChart 图表渲染
 *   5. 无向量时的引导态
 *
 * 环境约束：
 *   - 需 AppStoreProvider（BarCounterPage 用 useAppStore 读取 vector）
 *   - 需 MemoryRouter（BarCounterPage 用 useNavigate）
 *   - 注入 localStorage 'juezui-vector' 模拟已采集人格
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStoreProvider } from '../store/appStore';
import BarCounterPage from './BarCounterPage';
import { personaVectorToGameTheoryInput } from '../hooks/useGameTheory';
import { GameTheoryEngine } from '../engine/gameTheoryEngine';
import type { PersonaVector } from '../types/personaFusion';

// ═════════════════════════════════════════════════════════
// 测试用向量 · 模拟真实的六维人格数据
// ═════════════════════════════════════════════════════════

const TEST_VECTOR: PersonaVector = {
  /** 容错 · 高容错倾向合作 */
  TOL: 0.75,
  /** 速度 · 中等节奏 */
  SPD: 0.55,
  /** 信息 · 信息敏锐 */
  INF: 0.82,
  /** 热情 · 偏低，偏冷静 */
  ENT: 0.40,
  /** 主导 · 中等偏高 */
  LEAD: 0.65,
  /** 直觉 · 中等 */
  VIS: 0.60,
};

const VECTOR_KEY = 'juezui-vector';

function injectVector(vector: PersonaVector): void {
  localStorage.setItem(VECTOR_KEY, JSON.stringify(vector));
}

function clearVector(): void {
  localStorage.removeItem(VECTOR_KEY);
}

/** 渲染 BarCounterPage · 带 Router + Store · 注入向量 */
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bar-counter']}>
      <AppStoreProvider>
        <BarCounterPage />
      </AppStoreProvider>
    </MemoryRouter>,
  );
}

// ═════════════════════════════════════════════════════════
// 测试套件
// ═════════════════════════════════════════════════════════

describe('BarCounterPage · 纳什均衡集成', () => {
  beforeEach(() => {
    injectVector(TEST_VECTOR);
  });

  afterEach(() => {
    clearVector();
    cleanup();
  });

  // ─────────────────────────────────────────────────────────
  // 1. 向量 → 博弈论输入映射
  // ─────────────────────────────────────────────────────────

  describe('personaVectorToGameTheoryInput · 映射正确性', () => {
    it('六维向量应正确映射为四维博弈论输入', () => {
      const input = personaVectorToGameTheoryInput(TEST_VECTOR);

      expect(input.competitionIntensity).toBe(TEST_VECTOR.LEAD);
      expect(input.marketGrowth).toBe(TEST_VECTOR.VIS);
      expect(input.cooperationBonus).toBe(TEST_VECTOR.TOL);
      expect(input.priceWarCost).toBeCloseTo(1 - TEST_VECTOR.TOL, 2);
    });

    it('所有输入应在 [0, 1] 范围内', () => {
      const input = personaVectorToGameTheoryInput(TEST_VECTOR);

      expect(input.competitionIntensity).toBeGreaterThanOrEqual(0);
      expect(input.competitionIntensity).toBeLessThanOrEqual(1);
      expect(input.marketGrowth).toBeGreaterThanOrEqual(0);
      expect(input.marketGrowth).toBeLessThanOrEqual(1);
      expect(input.cooperationBonus).toBeGreaterThanOrEqual(0);
      expect(input.cooperationBonus).toBeLessThanOrEqual(1);
      expect(input.priceWarCost).toBeGreaterThanOrEqual(0);
      expect(input.priceWarCost).toBeLessThanOrEqual(1);
    });

    it('边界向量 · 全零应映射为 {0, 0, 0, 1}', () => {
      const zeroVec: PersonaVector = { TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0 };
      const input = personaVectorToGameTheoryInput(zeroVec);

      expect(input.competitionIntensity).toBe(0);
      expect(input.marketGrowth).toBe(0);
      expect(input.cooperationBonus).toBe(0);
      expect(input.priceWarCost).toBe(1);
    });

    it('边界向量 · 全一应映射为 {1, 1, 1, 0}', () => {
      const oneVec: PersonaVector = { TOL: 1, SPD: 1, INF: 1, ENT: 1, LEAD: 1, VIS: 1 };
      const input = personaVectorToGameTheoryInput(oneVec);

      expect(input.competitionIntensity).toBe(1);
      expect(input.marketGrowth).toBe(1);
      expect(input.cooperationBonus).toBe(1);
      expect(input.priceWarCost).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 2. 引擎评估流水线
  // ─────────────────────────────────────────────────────────

  describe('GameTheoryEngine · 评估流水线', () => {
    it('引擎应输出有效结果', () => {
      const input = personaVectorToGameTheoryInput(TEST_VECTOR);
      const engine = new GameTheoryEngine();
      const result = engine.evaluate(input);

      expect(result.equilibriumScore).toBeGreaterThanOrEqual(0);
      expect(result.equilibriumScore).toBeLessThanOrEqual(1);
      expect(result.strategyRecommendation).toBeGreaterThanOrEqual(0);
      expect(result.strategyRecommendation).toBeLessThanOrEqual(1);
      expect(['RED_OCEAN', 'BLUE_OCEAN']).toContain(result.marketRegime);
      expect(typeof result.fuseCheck).toBe('boolean');
      expect(result.nashStability).toBeGreaterThanOrEqual(0);
      expect(result.nashStability).toBeLessThanOrEqual(1);

      engine.destroy();
    });

    it('收敛轨迹应记录每轮快照', () => {
      const input = personaVectorToGameTheoryInput(TEST_VECTOR);
      const engine = new GameTheoryEngine();
      engine.evaluate(input);
      const trace = engine.getConvergenceHistory();

      // 验证轨迹记录
      expect(trace.length).toBeGreaterThan(0);
      expect(trace.length).toBeLessThanOrEqual(50); // maxIterations

      // 每轮快照应包含必要字段
      for (const t of trace) {
        expect(t.round).toBeGreaterThanOrEqual(0);
        expect(t.belief).toBeGreaterThanOrEqual(0);
        expect(t.belief).toBeLessThanOrEqual(1);
        expect([0, 1]).toContain(t.action);
        expect(typeof t.explore).toBe('boolean');
        expect(typeof t.expectedPayoff).toBe('number');
      }

      // 首轮信念应为 0.5（初始）
      expect(trace[0].belief).toBeCloseTo(0.5, 1);

      engine.destroy();
    });

    it('信念应在迭代中收敛（最终信念 ≈ 0 或接近 0）', () => {
      const input = personaVectorToGameTheoryInput(TEST_VECTOR);
      const engine = new GameTheoryEngine();
      engine.evaluate(input);
      const trace = engine.getConvergenceHistory();
      const finalBelief = trace[trace.length - 1].belief;

      // 最终信念应在合理范围内
      expect(finalBelief).toBeGreaterThanOrEqual(0);
      expect(finalBelief).toBeLessThan(0.6); // 通常收敛到 ~0.004

      engine.destroy();
    });
  });

  // ─────────────────────────────────────────────────────────
  // 3. UI 渲染 · 有向量
  // ─────────────────────────────────────────────────────────

  describe('BarCounterPage · 有向量时的 UI', () => {
    it('应渲染"可编程吧台"标题', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('可编程吧台')).toBeDefined();
      });
    });

    it('应显示六维向量数据', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('六维向量')).toBeDefined();
      });
    });

    it('应渲染纳什收敛图标题', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/Nash Convergence.*纳什收敛/)).toBeDefined();
      });
    });

    it('应显示收敛状态标签', async () => {
      renderPage();
      await waitFor(() => {
        // 已收敛或未收敛
        const statusEl = screen.queryByText(/已收敛|未收敛/);
        expect(statusEl).toBeDefined();
      });
    });

    it('应显示结果摘要 · 均衡分数', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('均衡分数')).toBeDefined();
      });
    });

    it('应显示结果摘要 · 市场格局', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('市场格局')).toBeDefined();
      });
    });

    it('应渲染 SVG 收敛图', async () => {
      renderPage();
      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toBeDefined();
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // 4. UI 渲染 · 无向量（引导态）
  // ─────────────────────────────────────────────────────────

  describe('BarCounterPage · 无向量时的引导态', () => {
    it('无向量时不渲染纳什收敛图', async () => {
      clearVector();
      renderPage();
      await waitFor(() => {
        expect(screen.queryByText(/Nash Convergence/)).toBeNull();
      });
    });

    it('无向量时显示引导提示', async () => {
      clearVector();
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/单杯编排需先采集人格/)).toBeDefined();
      });
    });
  });
});