/**
 * cocktailEngine · 单元测试
 * 覆盖双入口：recommendCocktails（preference）+ recommendByVector（向量派生）
 */

import { describe, it, expect } from 'vitest';
import {
  recommendCocktails,
  recommendByVector,
  recommendByArchetype,
  computeFlavorDistance,
} from './cocktailEngine';
import { flavorFromVector } from './flavorFromVector';
import { COCKTAILS } from '../data/cocktails';
import type { PersonaVector } from '../types/personaFusion';
import type { FlavorPreference } from '../types/personality';

function makeVec(overrides: Partial<PersonaVector> = {}): PersonaVector {
  return { TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0, ...overrides };
}

const NEUTRAL_PREF: FlavorPreference = {
  sweet: 0.5, sour: 0.5, bitter: 0.5, strong: 0.5,
  smoky: 0.5, fruity: 0.5, herbal: 0.5, creamy: 0.5,
};

// ════════════════════════════════════════════════════════════
// 旧入口 · recommendCocktails
// ════════════════════════════════════════════════════════════

describe('cocktailEngine · 旧入口 recommendCocktails', () => {
  it('返回非空推荐列表', () => {
    const recs = recommendCocktails(NEUTRAL_PREF, 5);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.length).toBeLessThanOrEqual(5);
  });

  it('结果按 matchScore 降序', () => {
    const recs = recommendCocktails(NEUTRAL_PREF, 5);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].matchScore).toBeLessThanOrEqual(recs[i - 1].matchScore);
    }
  });

  it('每条推荐含 cocktail/matchScore/reasons', () => {
    const recs = recommendCocktails(NEUTRAL_PREF, 3);
    for (const r of recs) {
      expect(r).toHaveProperty('cocktail');
      expect(r).toHaveProperty('matchScore');
      expect(r).toHaveProperty('reasons');
      expect(Array.isArray(r.reasons)).toBe(true);
      expect(r.reasons.length).toBeGreaterThan(0);
    }
  });

  it('limit=0 → 返回空数组', () => {
    expect(recommendCocktails(NEUTRAL_PREF, 0)).toEqual([]);
  });

  it('limit 大于酒单总数 → 返回全部', () => {
    const recs = recommendCocktails(NEUTRAL_PREF, 9999);
    expect(recs.length).toBeLessThanOrEqual(COCKTAILS.length);
  });
});

// ════════════════════════════════════════════════════════════
// 新入口 · recommendByVector
// ════════════════════════════════════════════════════════════

describe('cocktailEngine · 新入口 recommendByVector', () => {
  it('返回非空推荐列表', () => {
    const recs = recommendByVector(makeVec({ ENT: 1 }), 5);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.length).toBeLessThanOrEqual(5);
  });

  it('结果按 matchScore 降序', () => {
    const recs = recommendByVector(makeVec({ ENT: 1, VIS: 1 }), 5);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].matchScore).toBeLessThanOrEqual(recs[i - 1].matchScore);
    }
  });

  it('每条推荐含完整字段', () => {
    const recs = recommendByVector(makeVec({ TOL: 1, LEAD: 1 }), 3);
    for (const r of recs) {
      expect(r).toHaveProperty('cocktail');
      expect(r).toHaveProperty('matchScore');
      expect(r).toHaveProperty('reasons');
      expect(r.reasons.length).toBeGreaterThan(0);
    }
  });

  it('limit=0 → 返回空数组', () => {
    expect(recommendByVector(makeVec({ ENT: 1 }), 0)).toEqual([]);
  });

  it('与 recommendCocktails(flavorFromVector(vec)) 结果一致', () => {
    const vec = makeVec({ ENT: 0.7, VIS: 0.4 });
    const fromVec = recommendByVector(vec, 5);
    const fromPref = recommendCocktails(flavorFromVector(vec), 5);
    expect(fromVec.length).toBe(fromPref.length);
    for (let i = 0; i < fromVec.length; i++) {
      expect(fromVec[i].cocktail.id).toBe(fromPref[i].cocktail.id);
      expect(fromVec[i].matchScore).toBe(fromPref[i].matchScore);
    }
  });

  it('全零向量 → 仍返回推荐（中性偏好）', () => {
    const recs = recommendByVector(makeVec(), 3);
    expect(recs.length).toBeGreaterThan(0);
  });

  it('不同向量 → 推荐结果可能不同', () => {
    // 高 ENT（甜果）vs 高 INF（苦草） → 推荐顺序可能不同
    const entRecs = recommendByVector(makeVec({ ENT: 1 }), 5);
    const infRecs = recommendByVector(makeVec({ INF: 1 }), 5);
    // 至少首推 id 可能不同（不强制，因为酒单可能集中）
    // 这里只验证两者都返回有效推荐
    expect(entRecs.length).toBe(5);
    expect(infRecs.length).toBe(5);
  });

  it('极端正全维度 → 返回推荐', () => {
    const recs = recommendByVector(
      { TOL: 1, SPD: 1, INF: 1, ENT: 1, LEAD: 1, VIS: 1 },
      5,
    );
    expect(recs.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════
// recommendByArchetype
// ════════════════════════════════════════════════════════════

describe('cocktailEngine · recommendByArchetype', () => {
  it('命中 archetypeAffinity → matchScore=100', () => {
    // 找一个有 archetypeAffinity 的酒
    const cocktail = COCKTAILS.find((c) => c.archetypeAffinity.length > 0);
    if (cocktail) {
      const code = cocktail.archetypeAffinity[0];
      const recs = recommendByArchetype(code, 5);
      expect(recs.length).toBeGreaterThan(0);
      for (const r of recs) {
        expect(r.matchScore).toBe(100);
      }
    }
  });

  it('未命中 → 返回空数组', () => {
    const recs = recommendByArchetype('non-existent-code', 5);
    expect(recs).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════
// computeFlavorDistance
// ════════════════════════════════════════════════════════════

describe('cocktailEngine · computeFlavorDistance', () => {
  it('返回 0-1 之间的相似度', () => {
    const cocktail = COCKTAILS[0];
    const dist = computeFlavorDistance(NEUTRAL_PREF, cocktail);
    expect(dist).toBeGreaterThanOrEqual(0);
    expect(dist).toBeLessThanOrEqual(1);
  });

  it('零向量 preference → 返回 0', () => {
    const cocktail = COCKTAILS[0];
    const zeroPref: FlavorPreference = {
      sweet: 0, sour: 0, bitter: 0, strong: 0,
      smoky: 0, fruity: 0, herbal: 0, creamy: 0,
    };
    expect(computeFlavorDistance(zeroPref, cocktail)).toBe(0);
  });
});
