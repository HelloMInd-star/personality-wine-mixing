/**
 * 人格测评引擎 · 单元测试
 * 覆盖计分、原型匹配、风味偏好生成、画像构建的边界情况
 */

import { describe, it, expect } from 'vitest';
import {
  calculateScores,
  matchArchetype,
  generateFlavorPreference,
  buildProfile,
} from './personalityEngine';
import { PERSONALITY_QUESTIONS } from '../data/personalityQuestions';
import { PERSONALITY_ARCHETYPES } from '../data/personalityArchetypes';
import type { TraitKey } from '../types/personality';

const TRAIT_KEYS: TraitKey[] = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
];

type Level = 'high' | 'low' | 'mid';

/** 构造模拟答案 · 自动处理反向题（high=5/反向1，low=1/反向5，mid=3） */
function buildAnswers(target: Partial<Record<TraitKey, Level>>): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const q of PERSONALITY_QUESTIONS) {
    const level = target[q.dimension] ?? 'mid';
    let v: number;
    if (level === 'high') v = q.reverse ? 1 : 5;
    else if (level === 'low') v = q.reverse ? 5 : 1;
    else v = 3;
    answers[q.id] = v;
  }
  return answers;
}

const ALL_HIGH: Record<TraitKey, Level> = {
  openness: 'high',
  conscientiousness: 'high',
  extraversion: 'high',
  agreeableness: 'high',
  neuroticism: 'high',
};
const ALL_LOW: Record<TraitKey, Level> = {
  openness: 'low',
  conscientiousness: 'low',
  extraversion: 'low',
  agreeableness: 'low',
  neuroticism: 'low',
};
const ALL_MID: Record<TraitKey, Level> = {
  openness: 'mid',
  conscientiousness: 'mid',
  extraversion: 'mid',
  agreeableness: 'mid',
  neuroticism: 'mid',
};

// ════════════════════════════════════════════════════════════
// calculateScores · 计分
// ════════════════════════════════════════════════════════════
describe('calculateScores', () => {
  it('全高 → 每维度 100', () => {
    const scores = calculateScores(buildAnswers(ALL_HIGH));
    for (const key of TRAIT_KEYS) {
      expect(scores[key]).toBe(100);
    }
  });

  it('全低 → 每维度 0', () => {
    const scores = calculateScores(buildAnswers(ALL_LOW));
    for (const key of TRAIT_KEYS) {
      expect(scores[key]).toBe(0);
    }
  });

  it('全中 → 每维度 50', () => {
    const scores = calculateScores(buildAnswers(ALL_MID));
    for (const key of TRAIT_KEYS) {
      expect(scores[key]).toBe(50);
    }
  });

  it('反向题正确反转 · 开放性独高仍得 100', () => {
    // 开放性含 2 道反向题 (o4/o6)，high 时给 1，反转后得 5
    const scores = calculateScores(buildAnswers({ openness: 'high' }));
    expect(scores.openness).toBe(100);
  });

  it('反向题正确反转 · 开放性独低仍得 0', () => {
    const scores = calculateScores(buildAnswers({ openness: 'low' }));
    expect(scores.openness).toBe(0);
  });

  it('缺省答案按中性 3 处理 → 每维度 50', () => {
    const scores = calculateScores({});
    for (const key of TRAIT_KEYS) {
      expect(scores[key]).toBe(50);
    }
  });

  it('部分作答 · 未答维度取中性，已答维度正常', () => {
    const answers = buildAnswers({ openness: 'high' });
    // 仅保留开放性答案，删除其余
    const partial: Record<string, number> = {};
    for (const q of PERSONALITY_QUESTIONS) {
      if (q.dimension === 'openness') partial[q.id] = answers[q.id];
    }
    const scores = calculateScores(partial);
    expect(scores.openness).toBe(100);
    // 其余维度缺省 → 50
    expect(scores.conscientiousness).toBe(50);
    expect(scores.extraversion).toBe(50);
  });

  it('所有分数落在 [0, 100]', () => {
    const cases: Partial<Record<TraitKey, Level>>[] = [
      ALL_HIGH,
      ALL_LOW,
      ALL_MID,
      { openness: 'high' },
      { neuroticism: 'low' },
      {},
    ];
    for (const c of cases) {
      const scores = calculateScores(buildAnswers(c));
      for (const key of TRAIT_KEYS) {
        expect(scores[key]).toBeGreaterThanOrEqual(0);
        expect(scores[key]).toBeLessThanOrEqual(100);
      }
    }
  });
});

// ════════════════════════════════════════════════════════════
// matchArchetype · 原型匹配
// ════════════════════════════════════════════════════════════
describe('matchArchetype', () => {
  it('全高 → 炼金者（O+C 双高，比单维原型更具体）', () => {
    const scores = calculateScores(buildAnswers(ALL_HIGH));
    expect(matchArchetype(scores).code).toBe('The Alchemist');
  });

  it('宜人性独高 → 月潮者', () => {
    const scores = calculateScores(buildAnswers({ agreeableness: 'high' }));
    expect(matchArchetype(scores).code).toBe('The Velvet');
  });

  it('全中 → 暮色者（均衡兜底型）', () => {
    const scores = calculateScores(buildAnswers(ALL_MID));
    expect(matchArchetype(scores).code).toBe('The Twilight');
  });

  it('全低 → 独酌者（低外向 + 低宜人特征主导）', () => {
    const scores = calculateScores(buildAnswers(ALL_LOW));
    expect(matchArchetype(scores).code).toBe('The Solitude');
  });

  it('更具体的原型优先 · O+C 双高时 Alchemist 胜过单维的 Dreamweaver', () => {
    // O 高 + C 高，其余中：Alchemist(2维) 应优先于 Dreamweaver(1维)
    const scores = calculateScores(
      buildAnswers({ openness: 'high', conscientiousness: 'high' }),
    );
    const matched = matchArchetype(scores);
    expect(matched.code).toBe('The Alchemist');
  });

  it('始终返回原型集合内的有效原型', () => {
    const cases: Partial<Record<TraitKey, Level>>[] = [
      ALL_HIGH,
      ALL_LOW,
      ALL_MID,
      { openness: 'high' },
      {},
    ];
    for (const c of cases) {
      const scores = calculateScores(buildAnswers(c));
      const matched = matchArchetype(scores);
      expect(PERSONALITY_ARCHETYPES).toContain(matched);
    }
  });

  it('返回的原型含完整字段', () => {
    const scores = calculateScores(buildAnswers(ALL_HIGH));
    const matched = matchArchetype(scores);
    expect(matched).toHaveProperty('code');
    expect(matched).toHaveProperty('name');
    expect(matched).toHaveProperty('tagline');
    expect(matched).toHaveProperty('description');
    expect(matched).toHaveProperty('signature');
    expect(matched).toHaveProperty('auraColor');
    expect(typeof matched.name).toBe('string');
    expect(matched.name.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════
// generateFlavorPreference · 风味偏好
// ════════════════════════════════════════════════════════════
describe('generateFlavorPreference', () => {
  it('全中 → 八维皆 0.5（无激活，无除零）', () => {
    const scores = calculateScores(buildAnswers(ALL_MID));
    const pref = generateFlavorPreference(scores);
    const keys = Object.keys(pref);
    expect(keys).toHaveLength(8);
    for (const k of keys) {
      expect(pref[k]).toBe(0.5);
    }
  });

  it('包含全部八维风味', () => {
    const pref = generateFlavorPreference(calculateScores(buildAnswers(ALL_HIGH)));
    const expected = [
      'sweet',
      'sour',
      'bitter',
      'strong',
      'smoky',
      'fruity',
      'herbal',
      'creamy',
    ];
    for (const k of expected) {
      expect(pref).toHaveProperty(k);
    }
  });

  it('所有权重落在 [0, 1]', () => {
    const cases: Partial<Record<TraitKey, Level>>[] = [
      ALL_HIGH,
      ALL_LOW,
      ALL_MID,
      { openness: 'high' },
      { neuroticism: 'high' },
    ];
    for (const c of cases) {
      const pref = generateFlavorPreference(calculateScores(buildAnswers(c)));
      for (const v of Object.values(pref)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('非全中场景 · 最大权重为 1（归一化顶点）', () => {
    const pref = generateFlavorPreference(calculateScores(buildAnswers(ALL_HIGH)));
    const max = Math.max(...Object.values(pref));
    expect(max).toBe(1);
  });

  it('全高场景 · 甜/柔润 > 酸（多维映射累加差异）', () => {
    const pref = generateFlavorPreference(calculateScores(buildAnswers(ALL_HIGH)));
    expect(pref.sweet).toBeGreaterThan(pref.sour);
    expect(pref.creamy).toBeGreaterThan(pref.sour);
  });

  it('宜人独高 · 甜与柔润被激活（强于未被激活的酸）', () => {
    const pref = generateFlavorPreference(
      calculateScores(buildAnswers({ agreeableness: 'high' })),
    );
    // 高宜人 → sweet/creamy 激活，应强于从不被激活的 sour
    expect(pref.sweet).toBeGreaterThan(pref.sour);
    expect(pref.creamy).toBeGreaterThan(pref.sour);
  });

  it('神经质独高 · 柔润被激活（安抚映射）', () => {
    const pref = generateFlavorPreference(
      calculateScores(buildAnswers({ neuroticism: 'high' })),
    );
    expect(pref.creamy).toBeGreaterThan(pref.sour);
  });

  it('尽责独高 · 烈与苦被激活（经典严谨映射）', () => {
    const pref = generateFlavorPreference(
      calculateScores(buildAnswers({ conscientiousness: 'high' })),
    );
    expect(pref.strong).toBeGreaterThan(pref.sour);
    expect(pref.bitter).toBeGreaterThan(pref.sour);
  });
});

// ════════════════════════════════════════════════════════════
// buildProfile · 画像构建
// ════════════════════════════════════════════════════════════
describe('buildProfile', () => {
  it('组合 scores + archetype + flavorPreference', () => {
    const profile = buildProfile(buildAnswers(ALL_HIGH));
    expect(profile).toHaveProperty('scores');
    expect(profile).toHaveProperty('archetype');
    expect(profile).toHaveProperty('flavorPreference');
    expect(profile).toHaveProperty('createdAt');
    // scores 完整
    for (const key of TRAIT_KEYS) {
      expect(profile.scores).toHaveProperty(key);
    }
  });

  it('createdAt 接近当前时间', () => {
    const before = Date.now();
    const profile = buildProfile(buildAnswers(ALL_MID));
    const after = Date.now();
    expect(profile.createdAt).toBeGreaterThanOrEqual(before);
    expect(profile.createdAt).toBeLessThanOrEqual(after);
  });

  it('archetype 与 matchArchetype 一致', () => {
    const answers = buildAnswers({ agreeableness: 'high' });
    const profile = buildProfile(answers);
    const scores = calculateScores(answers);
    expect(profile.archetype.code).toBe(matchArchetype(scores).code);
  });

  it('flavorPreference 与 generateFlavorPreference 一致', () => {
    const answers = buildAnswers(ALL_HIGH);
    const profile = buildProfile(answers);
    const direct = generateFlavorPreference(calculateScores(answers));
    expect(profile.flavorPreference).toEqual(direct);
  });
});
