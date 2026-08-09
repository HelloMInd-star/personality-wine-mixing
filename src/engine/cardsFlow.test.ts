/**
 * cardsFlow · 牌类采集端到端测试
 *
 * 验证从选牌数据到融合结果的准确性：
 *   - 单模块融合 · 权重被归一化约掉（finalVector === normalizeVector(moduleVector)）
 *   - 全模块融合 · finalVector === normalizeVector(加权 acc)
 *   - breakdown 各模块 vector 与独立 toVector 一致
 *   - 缺失模块不补权
 *   - personaTag 由 finalVector 派生
 *   - 端到端：真实采集结果（塔罗三牌/星盘六星体/扑克牌型/德州决策）→ fusePersona → 向量范围 + 标签
 *
 * 与 personaFusionEngine.test.ts 互补：
 *   后者覆盖各 toVector 内部逻辑 · 本文件覆盖 fusePersona 编排与端到端数据流
 */

import { describe, it, expect } from 'vitest';
import {
  fusePersona,
  tarotToVector,
  zodiacToVector,
  pokerToVector,
  texasToVector,
  normalizeVector,
  zeroVector,
  derivePersonaTag,
} from './personaFusionEngine';
import { cocktailService } from '../services/cocktailService';
import { TAROT_CARDS } from '../data/tarotCards';
import { MODULE_WEIGHT } from '../data/personaFusionMaps';
import type {
  PersonaVector,
  PersonaDim,
  TarotResult,
  ZodiacResult,
  PokerResult,
  PokerCard,
  TexasResult,
  FusionInput,
} from '../types/personaFusion';

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

// ═════════════════════════════════════════════════════════
// Fixture · 真实采集结果构造
// ═════════════════════════════════════════════════════════

/** 取前 3 张大阿尔卡纳 · 三牌阵 */
function makeTarotResult(): TarotResult {
  const majors = TAROT_CARDS.filter((c) => c.arcana === 'major').slice(0, 3);
  return {
    cards: majors.map((c, i) => ({
      cardId: c.id,
      position: (['past', 'present', 'future'] as const)[i],
      isReversed: i === 1, // 现在位逆位
    })),
    submittedAt: 0,
  };
}

function makeZodiacResult(): ZodiacResult {
  return {
    input: { birthDate: '1995-10-15', birthTime: '14:30', birthCity: '北京' },
    sunSign: '天蝎',
    moonSign: '巨蟹',
    risingSign: '狮子',
    mercurySign: '天秤',
    marsSign: '狮子',
    venusSign: '处女',
    submittedAt: 0,
  };
}

/** 对子 · 一对 K */
function makePokerResult(): PokerResult {
  const hand: PokerCard[] = [
    { suit: '♠', rank: 'K' },
    { suit: '♥', rank: 'K' },
    { suit: '♦', rank: '7' },
    { suit: '♣', rank: '4' },
    { suit: '♠', rank: '9' },
  ];
  return { hand, handType: '对子', highCard: 'K', submittedAt: 0 };
}

/** 三次决策 · call/raise/call · 有诈唬倾向 */
function makeTexasResult(): TexasResult {
  return {
    holeCards: [{ suit: '♠', rank: 'A' }, { suit: '♥', rank: 'K' }],
    boardCards: [
      { suit: '♦', rank: 'Q' },
      { suit: '♣', rank: 'J' },
      { suit: '♠', rank: '10' },
      { suit: '♥', rank: '2' },
    ],
    userActions: ['call', 'raise', 'call'],
    handRank: null,
    won: true,
    avgDecisionTime: 2500,
    bluffDetected: false,
    submittedAt: 0,
  };
}

/** 全模块输入 */
function makeFullInput(): FusionInput {
  return {
    tarot: { result: makeTarotResult() },
    zodiac: { result: makeZodiacResult() },
    poker: { result: makePokerResult() },
    texas: { result: makeTexasResult() },
  };
}

/** 向量近似比较 · 容差 0.001 */
function expectVecClose(actual: PersonaVector, expected: PersonaVector) {
  for (const d of DIMS) {
    expect(actual[d]).toBeCloseTo(expected[d], 3);
  }
}

// ═════════════════════════════════════════════════════════
// 单模块融合 · 权重被归一化约掉
// ═════════════════════════════════════════════════════════

describe('cardsFlow · 单模块融合（权重归一化约掉）', () => {
  it('仅塔罗 · finalVector === normalizeVector(tarotToVector)', () => {
    const input: FusionInput = { tarot: { result: makeTarotResult() } };
    const fusion = fusePersona(input);
    const expected = normalizeVector(tarotToVector(input.tarot!.result));
    expectVecClose(fusion.finalVector, expected);
  });

  it('仅星盘 · finalVector === normalizeVector(zodiacToVector)', () => {
    const input: FusionInput = { zodiac: { result: makeZodiacResult() } };
    const fusion = fusePersona(input);
    const expected = normalizeVector(zodiacToVector(input.zodiac!.result));
    expectVecClose(fusion.finalVector, expected);
  });

  it('仅扑克 · finalVector === normalizeVector(pokerToVector)', () => {
    const input: FusionInput = { poker: { result: makePokerResult() } };
    const fusion = fusePersona(input);
    const expected = normalizeVector(pokerToVector(input.poker!.result));
    expectVecClose(fusion.finalVector, expected);
  });

  it('仅德州 · finalVector === normalizeVector(texasToVector)', () => {
    const input: FusionInput = { texas: { result: makeTexasResult() } };
    const fusion = fusePersona(input);
    const expected = normalizeVector(texasToVector(input.texas!.result));
    expectVecClose(fusion.finalVector, expected);
  });
});

// ═════════════════════════════════════════════════════════
// 全模块融合 · 加权 acc 归一化
// ═════════════════════════════════════════════════════════

describe('cardsFlow · 全模块融合', () => {
  it('finalVector === normalizeVector(加权 acc)', () => {
    const input = makeFullInput();
    const fusion = fusePersona(input);

    // 手动计算加权 acc
    const acc = zeroVector();
    const tVec = tarotToVector(input.tarot!.result);
    const zVec = zodiacToVector(input.zodiac!.result);
    const pVec = pokerToVector(input.poker!.result);
    const xVec = texasToVector(input.texas!.result);
    for (const d of DIMS) {
      acc[d] =
        tVec[d] * MODULE_WEIGHT.tarot +
        zVec[d] * MODULE_WEIGHT.zodiac +
        pVec[d] * MODULE_WEIGHT.poker +
        xVec[d] * MODULE_WEIGHT.texas;
    }
    const expected = normalizeVector(acc);
    expectVecClose(fusion.finalVector, expected);
  });

  it('breakdown 四模块齐全 · vector 与独立 toVector 一致', () => {
    const input = makeFullInput();
    const fusion = fusePersona(input);
    expect(fusion.breakdown.tarot).toBeDefined();
    expect(fusion.breakdown.zodiac).toBeDefined();
    expect(fusion.breakdown.poker).toBeDefined();
    expect(fusion.breakdown.texas).toBeDefined();
    expectVecClose(fusion.breakdown.tarot!.vector, tarotToVector(input.tarot!.result));
    expectVecClose(fusion.breakdown.zodiac!.vector, zodiacToVector(input.zodiac!.result));
    expectVecClose(fusion.breakdown.poker!.vector, pokerToVector(input.poker!.result));
    expectVecClose(fusion.breakdown.texas!.vector, texasToVector(input.texas!.result));
  });

  it('personaTag 由 finalVector 派生', () => {
    const fusion = fusePersona(makeFullInput());
    expect(fusion.personaTag).toBe(derivePersonaTag(fusion.finalVector));
  });

  it('finalVector 各维度在 [-1, 1]', () => {
    const fusion = fusePersona(makeFullInput());
    for (const d of DIMS) {
      expect(fusion.finalVector[d]).toBeGreaterThanOrEqual(-1);
      expect(fusion.finalVector[d]).toBeLessThanOrEqual(1);
    }
  });
});

// ═════════════════════════════════════════════════════════
// 缺失模块 · 不补权
// ═════════════════════════════════════════════════════════

describe('cardsFlow · 缺失模块不补权', () => {
  it('仅塔罗+星盘 · 等价于两模块加权 acc 归一化', () => {
    const input: FusionInput = {
      tarot: { result: makeTarotResult() },
      zodiac: { result: makeZodiacResult() },
    };
    const fusion = fusePersona(input);
    const acc = zeroVector();
    const tVec = tarotToVector(input.tarot!.result);
    const zVec = zodiacToVector(input.zodiac!.result);
    for (const d of DIMS) {
      acc[d] = tVec[d] * MODULE_WEIGHT.tarot + zVec[d] * MODULE_WEIGHT.zodiac;
    }
    expectVecClose(fusion.finalVector, normalizeVector(acc));
  });

  it('breakdown 仅含已采集模块', () => {
    const input: FusionInput = { poker: { result: makePokerResult() } };
    const fusion = fusePersona(input);
    expect(fusion.breakdown.poker).toBeDefined();
    expect(fusion.breakdown.tarot).toBeUndefined();
    expect(fusion.breakdown.zodiac).toBeUndefined();
    expect(fusion.breakdown.texas).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════
// 边界
// ═════════════════════════════════════════════════════════

describe('cardsFlow · 边界', () => {
  it('空输入 · 全零向量 · 标签均衡者', () => {
    const fusion = fusePersona({});
    for (const d of DIMS) {
      expect(fusion.finalVector[d]).toBe(0);
    }
    expect(fusion.personaTag).toBe('均衡者');
  });

  it('submittedAt 为数字', () => {
    const fusion = fusePersona(makeFullInput());
    expect(typeof fusion.submittedAt).toBe('number');
  });
});

// ═════════════════════════════════════════════════════════
// service 层 · fusePersona + fuseAndSaveVector
// ═════════════════════════════════════════════════════════

describe('cardsFlow · cocktailService 入口', () => {
  it('cocktailService.fusePersona === 引擎 fusePersona', () => {
    const input = makeFullInput();
    const fromService = cocktailService.fusePersona(input);
    const fromEngine = fusePersona(input);
    expectVecClose(fromService.finalVector, fromEngine.finalVector);
    expect(fromService.personaTag).toBe(fromEngine.personaTag);
  });

  it('fuseAndSaveVector · 返回融合产物并持久化向量', () => {
    // 清理可能存在的旧向量
    cocktailService.clearVector();
    expect(cocktailService.loadVector()).toBeNull();

    const input = makeFullInput();
    const fusion = cocktailService.fuseAndSaveVector(input);
    expect(fusion.finalVector).toBeDefined();
    expect(fusion.personaTag).toBeDefined();

    // 持久化可读回
    const loaded = cocktailService.loadVector();
    expect(loaded).not.toBeNull();
    if (loaded) {
      expectVecClose(loaded, fusion.finalVector);
    }

    // 清理
    cocktailService.clearVector();
    expect(cocktailService.loadVector()).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════
// 实时部分融合演进 · 验证 CardsPage 的 liveVector 逻辑
// ═════════════════════════════════════════════════════════

describe('cardsFlow · 实时部分融合演进（CardsPage liveVector）', () => {
  it('逐步加入模块 · 向量随采集演进', () => {
    const tarot = makeTarotResult();
    const zodiac = makeZodiacResult();
    const poker = makePokerResult();
    const texas = makeTexasResult();

    // 第一步 · 仅塔罗
    const v1 = fusePersona({ tarot: { result: tarot } }).finalVector;
    // 第二步 · 塔罗 + 星盘
    const v2 = fusePersona({ tarot: { result: tarot }, zodiac: { result: zodiac } }).finalVector;
    // 第三步 · + 扑克
    const v3 = fusePersona({
      tarot: { result: tarot },
      zodiac: { result: zodiac },
      poker: { result: poker },
    }).finalVector;
    // 第四步 · 全部
    const v4 = fusePersona({
      tarot: { result: tarot },
      zodiac: { result: zodiac },
      poker: { result: poker },
      texas: { result: texas },
    }).finalVector;

    // 各步向量各维度在 [-1, 1]
    for (const v of [v1, v2, v3, v4]) {
      for (const d of DIMS) {
        expect(v[d]).toBeGreaterThanOrEqual(-1);
        expect(v[d]).toBeLessThanOrEqual(1);
      }
    }

    // v4 应等于全模块融合
    const full = fusePersona(makeFullInput()).finalVector;
    expectVecClose(v4, full);
  });

  it('跳过模块 · liveVector 仍可计算（缺失模块按 0 贡献）', () => {
    // 模拟跳过星盘 · 塔罗 + 扑克 + 德州
    const v = fusePersona({
      tarot: { result: makeTarotResult() },
      poker: { result: makePokerResult() },
      texas: { result: makeTexasResult() },
    }).finalVector;
    for (const d of DIMS) {
      expect(v[d]).toBeGreaterThanOrEqual(-1);
      expect(v[d]).toBeLessThanOrEqual(1);
    }
  });
});
