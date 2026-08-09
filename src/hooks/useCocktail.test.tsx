/**
 * useCocktail · 向量派生推荐链路测试
 *
 * 验证牌类入口产物（六维 PersonaVector）经 useCocktail.refreshByVector
 * 能正确读取并驱动调酒推荐：
 *   1. 推荐非空且数量受 limit 控制
 *   2. 按 matchScore 降序
 *   3. 酒款 id 均存在于酒单
 *   4. 与 cocktailService.recommendByVector 结果一致（hook 仅做状态承载）
 *   5. 不同向量产生不同推荐排序（向量确实参与派生）
 *   6. 全零向量也能给出推荐（默认中性风味）
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCocktail } from './useCocktail';
import { cocktailService } from '../services/cocktailService';
import type { PersonaVector } from '../types/personaFusion';

/** 构造向量 · 缺省 0，覆盖指定维度 */
function makeVec(overrides: Partial<PersonaVector> = {}): PersonaVector {
  return { TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0, ...overrides };
}

/** 高热情 + 高直觉 · 偏甜偏果香倾向 */
const VEC_ENT_VIS: PersonaVector = makeVec({ ENT: 1, VIS: 1 });

/** 高容错（冒险）· 偏烈偏苦倾向 */
const VEC_TOL: PersonaVector = makeVec({ TOL: 1 });

/** 全零向量 · 中性风味 */
const VEC_ZERO: PersonaVector = makeVec();

describe('useCocktail · refreshByVector 向量派生推荐', () => {
  it('调用后返回非空推荐列表', () => {
    const { result } = renderHook(() => useCocktail());
    expect(result.current.recommendations).toHaveLength(0);

    act(() => {
      result.current.refreshByVector(VEC_ENT_VIS, 5);
    });

    expect(result.current.recommendations.length).toBeGreaterThan(0);
    expect(result.current.recommendations.length).toBeLessThanOrEqual(5);
  });

  it('limit 控制返回数量', () => {
    const { result } = renderHook(() => useCocktail());

    act(() => {
      result.current.refreshByVector(VEC_ENT_VIS, 3);
    });
    expect(result.current.recommendations.length).toBeLessThanOrEqual(3);

    act(() => {
      result.current.refreshByVector(VEC_ENT_VIS, 8);
    });
    expect(result.current.recommendations.length).toBeLessThanOrEqual(8);
  });

  it('推荐按 matchScore 降序', () => {
    const { result } = renderHook(() => useCocktail());
    act(() => {
      result.current.refreshByVector(VEC_ENT_VIS, 5);
    });
    const scores = result.current.recommendations.map((r) => r.matchScore);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it('推荐酒款 id 均存在于酒单', () => {
    const { result } = renderHook(() => useCocktail());
    act(() => {
      result.current.refreshByVector(VEC_ENT_VIS, 5);
    });
    const allIds = new Set(cocktailService.getAllCocktails().map((c) => c.id));
    for (const rec of result.current.recommendations) {
      expect(allIds.has(rec.cocktail.id)).toBe(true);
    }
  });

  it('每条推荐含非空 reasons 诗化理由', () => {
    const { result } = renderHook(() => useCocktail());
    act(() => {
      result.current.refreshByVector(VEC_ENT_VIS, 5);
    });
    for (const rec of result.current.recommendations) {
      expect(rec.reasons.length).toBeGreaterThan(0);
    }
  });

  it('与 cocktailService.recommendByVector 结果一致', () => {
    const { result } = renderHook(() => useCocktail());
    act(() => {
      result.current.refreshByVector(VEC_ENT_VIS, 5);
    });
    const expected = cocktailService.recommendByVector(VEC_ENT_VIS, 5);
    expect(result.current.recommendations.map((r) => r.cocktail.id)).toEqual(
      expected.map((r) => r.cocktail.id),
    );
    expect(result.current.recommendations.map((r) => r.matchScore)).toEqual(
      expected.map((r) => r.matchScore),
    );
  });

  it('不同向量产生不同推荐排序', () => {
    const { result } = renderHook(() => useCocktail());

    act(() => {
      result.current.refreshByVector(VEC_ENT_VIS, 5);
    });
    const entVisIds = result.current.recommendations.map((r) => r.cocktail.id);

    act(() => {
      result.current.refreshByVector(VEC_TOL, 5);
    });
    const tolIds = result.current.recommendations.map((r) => r.cocktail.id);

    // 不同风味偏好 → 排序应不同（至少顺序不一致）
    expect(entVisIds).not.toEqual(tolIds);
  });

  it('全零向量也能给出推荐 · 默认中性风味不报错', () => {
    const { result } = renderHook(() => useCocktail());
    act(() => {
      result.current.refreshByVector(VEC_ZERO, 5);
    });
    expect(result.current.recommendations.length).toBeGreaterThan(0);
    // 全零向量 → 风味偏好收敛到 0.5 中性，推荐仍按余弦相似度排序
    const scores = result.current.recommendations.map((r) => r.matchScore);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it('向量路径与画像路径共享同一推荐引擎 · 顶款 matchScore 合理', () => {
    const { result } = renderHook(() => useCocktail());
    act(() => {
      result.current.refreshByVector(VEC_ENT_VIS, 5);
    });
    const top = result.current.recommendations[0];
    expect(top).toBeDefined();
    expect(top.matchScore).toBeGreaterThanOrEqual(0);
    expect(top.matchScore).toBeLessThanOrEqual(100);
  });
});
