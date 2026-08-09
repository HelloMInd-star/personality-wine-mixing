/**
 * recommendCache · 单元测试
 * 覆盖 LRU 核心类、哈希稳定性、前缀清理、异常隔离
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { recommendCache, LRUCache } from './recommendCache';
import type { CocktailRecommendation } from '../types/cocktail';
import type { FlavorPreference } from '../types/personality';

/** 全零偏好 · 边界用例 */
const ZERO_PREF: FlavorPreference = {
  sweet: 0,
  sour: 0,
  bitter: 0,
  strong: 0,
  smoky: 0,
  fruity: 0,
  herbal: 0,
  creamy: 0,
};

/** 均匀偏好 0.5 */
const UNIFORM_PREF: FlavorPreference = {
  sweet: 0.5,
  sour: 0.5,
  bitter: 0.5,
  strong: 0.5,
  smoky: 0.5,
  fruity: 0.5,
  herbal: 0.5,
  creamy: 0.5,
};

/** 构造一个标记化的缓存条目 · 便于断言引用同一性 */
function makeEntry(tag: string): {
  recommendations: CocktailRecommendation[];
  createdAt: number;
} {
  return {
    recommendations: [
      {
        cocktail: {} as CocktailRecommendation['cocktail'],
        matchScore: 0,
        reasons: [tag],
      },
    ],
    createdAt: Date.now(),
  };
}

beforeEach(() => {
  recommendCache.clear();
});

// ════════════════════════════════════════════════════════════
// LRUCache 核心类
// ════════════════════════════════════════════════════════════
describe('LRUCache', () => {
  it('容量必须为正数 · 否则抛错', () => {
    expect(() => new LRUCache<string, number>(0)).toThrow();
    expect(() => new LRUCache<string, number>(-1)).toThrow();
  });

  it('基本 get/set · 未命中返回 undefined', () => {
    const c = new LRUCache<string, number>(4);
    c.set('a', 1);
    expect(c.get('a')).toBe(1);
    expect(c.get('missing')).toBeUndefined();
  });

  it('has 不更新 LRU 顺序', () => {
    const c = new LRUCache<string, number>(2);
    c.set('a', 1);
    c.set('b', 2);
    expect(c.has('a')).toBe(true);
    // has 不应改变顺序 · a 仍是最旧
    c.set('c', 3);
    expect(c.has('a')).toBe(false); // a 被淘汰
    expect(c.has('b')).toBe(true);
  });

  it('LRU 淘汰最旧键', () => {
    const c = new LRUCache<string, number>(2);
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3); // 淘汰 a
    expect(c.get('a')).toBeUndefined();
    expect(c.get('b')).toBe(2);
    expect(c.get('c')).toBe(3);
  });

  it('get 后该键变最新 · 不被淘汰', () => {
    const c = new LRUCache<string, number>(2);
    c.set('a', 1);
    c.set('b', 2);
    c.get('a'); // a 移至最新
    c.set('c', 3); // 淘汰 b
    expect(c.get('a')).toBe(1);
    expect(c.get('b')).toBeUndefined();
  });

  it('set 已存在的键 · 更新值并变最新', () => {
    const c = new LRUCache<string, number>(2);
    c.set('a', 1);
    c.set('b', 2);
    c.set('a', 100); // a 变最新
    c.set('c', 3); // 淘汰 b
    expect(c.get('a')).toBe(100);
    expect(c.get('b')).toBeUndefined();
  });

  it('delete 单个键 · 返回是否确实删除', () => {
    const c = new LRUCache<string, number>(4);
    c.set('a', 1);
    expect(c.delete('a')).toBe(true);
    expect(c.delete('a')).toBe(false);
    expect(c.get('a')).toBeUndefined();
  });

  it('clear 清空全部', () => {
    const c = new LRUCache<string, number>(4);
    c.set('a', 1);
    c.set('b', 2);
    c.clear();
    expect(c.size).toBe(0);
    expect(c.get('a')).toBeUndefined();
  });

  it('keys 按 LRU 顺序（旧 → 新）', () => {
    const c = new LRUCache<string, number>(4);
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    c.get('a'); // a 移至最新
    expect(Array.from(c.keys())).toEqual(['b', 'c', 'a']);
  });

  it('容量 1 · 退化行为正确', () => {
    const c = new LRUCache<string, number>(1);
    c.set('a', 1);
    c.set('b', 2); // 淘汰 a
    expect(c.get('a')).toBeUndefined();
    expect(c.get('b')).toBe(2);
  });

  it('maxCapacity 反映构造容量', () => {
    expect(new LRUCache<string, number>(8).maxCapacity).toBe(8);
    expect(new LRUCache<string, number>(32).maxCapacity).toBe(32);
  });
});

// ════════════════════════════════════════════════════════════
// recommendCache · 按风味偏好
// ════════════════════════════════════════════════════════════
describe('recommendCache · 按风味偏好', () => {
  it('set/get 命中 · 返回同一引用', () => {
    const entry = makeEntry('test-1');
    recommendCache.setByPreference(UNIFORM_PREF, 5, entry);
    expect(recommendCache.getByPreference(UNIFORM_PREF, 5)).toBe(entry);
  });

  it('不同 limit 不冲突', () => {
    const e1 = makeEntry('limit-3');
    const e2 = makeEntry('limit-5');
    recommendCache.setByPreference(UNIFORM_PREF, 3, e1);
    recommendCache.setByPreference(UNIFORM_PREF, 5, e2);
    expect(recommendCache.getByPreference(UNIFORM_PREF, 3)).toBe(e1);
    expect(recommendCache.getByPreference(UNIFORM_PREF, 5)).toBe(e2);
  });

  it('不同偏好不冲突', () => {
    const e1 = makeEntry('uniform');
    const e2 = makeEntry('zero');
    recommendCache.setByPreference(UNIFORM_PREF, 5, e1);
    recommendCache.setByPreference(ZERO_PREF, 5, e2);
    expect(recommendCache.getByPreference(UNIFORM_PREF, 5)).toBe(e1);
    expect(recommendCache.getByPreference(ZERO_PREF, 5)).toBe(e2);
  });

  it('浮点微差 < 0.005 · 命中同一缓存', () => {
    const pref1 = { ...UNIFORM_PREF, sweet: 0.701 };
    const pref2 = { ...UNIFORM_PREF, sweet: 0.704 }; // 差 0.003
    const entry = makeEntry('float-stable');
    recommendCache.setByPreference(pref1, 5, entry);
    expect(recommendCache.getByPreference(pref2, 5)).toBe(entry);
  });

  it('浮点差 ≥ 0.005 · 视为不同偏好', () => {
    const pref1 = { ...UNIFORM_PREF, sweet: 0.7 };
    const pref2 = { ...UNIFORM_PREF, sweet: 0.72 }; // 差 0.02
    const e1 = makeEntry('p1');
    const e2 = makeEntry('p2');
    recommendCache.setByPreference(pref1, 5, e1);
    recommendCache.setByPreference(pref2, 5, e2);
    expect(recommendCache.getByPreference(pref1, 5)).toBe(e1);
    expect(recommendCache.getByPreference(pref2, 5)).toBe(e2);
  });

  it('未命中返回 undefined', () => {
    expect(recommendCache.getByPreference(UNIFORM_PREF, 5)).toBeUndefined();
  });
});

// ════════════════════════════════════════════════════════════
// recommendCache · 按原型
// ════════════════════════════════════════════════════════════
describe('recommendCache · 按原型', () => {
  it('set/get 命中', () => {
    const entry = makeEntry('arch');
    recommendCache.setByArchetype('clockmaker', 5, entry);
    expect(recommendCache.getByArchetype('clockmaker', 5)).toBe(entry);
  });

  it('不同原型不冲突', () => {
    const e1 = makeEntry('clock');
    const e2 = makeEntry('dream');
    recommendCache.setByArchetype('clockmaker', 5, e1);
    recommendCache.setByArchetype('dreamweaver', 5, e2);
    expect(recommendCache.getByArchetype('clockmaker', 5)).toBe(e1);
    expect(recommendCache.getByArchetype('dreamweaver', 5)).toBe(e2);
  });

  it('同一原型不同 limit 不冲突', () => {
    const e1 = makeEntry('arch-3');
    const e2 = makeEntry('arch-5');
    recommendCache.setByArchetype('clockmaker', 3, e1);
    recommendCache.setByArchetype('clockmaker', 5, e2);
    expect(recommendCache.getByArchetype('clockmaker', 3)).toBe(e1);
    expect(recommendCache.getByArchetype('clockmaker', 5)).toBe(e2);
  });

  it('未命中返回 undefined', () => {
    expect(recommendCache.getByArchetype('clockmaker', 5)).toBeUndefined();
  });
});

// ════════════════════════════════════════════════════════════
// recommendCache · 清理
// ════════════════════════════════════════════════════════════
describe('recommendCache · 清理', () => {
  it('clear 清空全部', () => {
    recommendCache.setByPreference(UNIFORM_PREF, 5, makeEntry('p'));
    recommendCache.setByArchetype('clockmaker', 5, makeEntry('a'));
    recommendCache.clear();
    expect(recommendCache.size()).toBe(0);
    expect(recommendCache.getByPreference(UNIFORM_PREF, 5)).toBeUndefined();
    expect(recommendCache.getByArchetype('clockmaker', 5)).toBeUndefined();
  });

  it('clearByPrefix("rec:pref:") 仅清画像相关 · 保留原型缓存', () => {
    recommendCache.setByPreference(UNIFORM_PREF, 5, makeEntry('p'));
    recommendCache.setByArchetype('clockmaker', 5, makeEntry('a'));
    recommendCache.clearByPrefix('rec:pref:');
    expect(recommendCache.getByPreference(UNIFORM_PREF, 5)).toBeUndefined();
    expect(recommendCache.getByArchetype('clockmaker', 5)).toBeDefined();
  });

  it('clearByPrefix("rec:arch:") 仅清原型 · 保留画像缓存', () => {
    recommendCache.setByPreference(UNIFORM_PREF, 5, makeEntry('p'));
    recommendCache.setByArchetype('clockmaker', 5, makeEntry('a'));
    recommendCache.clearByPrefix('rec:arch:');
    expect(recommendCache.getByPreference(UNIFORM_PREF, 5)).toBeDefined();
    expect(recommendCache.getByArchetype('clockmaker', 5)).toBeUndefined();
  });

  it('clearByPrefix 不匹配的前缀 · 无副作用', () => {
    recommendCache.setByPreference(UNIFORM_PREF, 5, makeEntry('p'));
    recommendCache.clearByPrefix('rec:unknown:');
    expect(recommendCache.size()).toBe(1);
    expect(recommendCache.getByPreference(UNIFORM_PREF, 5)).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════
// recommendCache · 容量与淘汰
// ════════════════════════════════════════════════════════════
describe('recommendCache · 容量与淘汰', () => {
  it('默认容量 64', () => {
    expect(recommendCache.capacity()).toBe(64);
  });

  it('写入超过容量 · 最旧条目被淘汰', () => {
    // 写入 65 个不同原型 + limit 组合，应淘汰首个
    for (let i = 0; i < 65; i++) {
      recommendCache.setByArchetype(`arch-${i}`, 5, makeEntry(`e-${i}`));
    }
    expect(recommendCache.size()).toBe(64);
    // 第一个被淘汰
    expect(recommendCache.getByArchetype('arch-0', 5)).toBeUndefined();
    // 最后一个仍在
    expect(recommendCache.getByArchetype('arch-64', 5)).toBeDefined();
  });
});
