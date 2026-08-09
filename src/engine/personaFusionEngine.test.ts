/**
 * personaFusionEngine · 单元测试
 * 覆盖所有向量映射（塔罗/星盘/扑克/德州）+ 归一化 + 标签派生 + 融合
 */

import { describe, it, expect } from 'vitest';
import {
  zeroVector,
  normalizeVector,
  tarotToVector,
  zodiacToVector,
  pokerToVector,
  texasToVector,
  derivePersonaTag,
  fusePersona,
} from './personaFusionEngine';
import { TAROT_CARDS, getTarotCardById, drawRandomTarot } from '../data/tarotCards';
import {
  ZODIAC_PERSONA_MAP,
  SIGN_ELEMENT,
  POKER_HAND_MAP,
  TEXAS_ACTION_MAP,
  MODULE_WEIGHT,
} from '../data/personaFusionMaps';
import type {
  PersonaVector,
  PersonaDim,
  TarotResult,
  ZodiacResult,
  PokerResult,
  PokerHandType,
  TexasResult,
} from '../types/personaFusion';

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

// ═════════════════════════════════════════════════════════
// Fixture 构造
// ═════════════════════════════════════════════════════════

function makeTarotResult(
  cards: { cardId: number; position: 'past' | 'present' | 'future'; isReversed: boolean }[],
): TarotResult {
  return { cards, submittedAt: 0 };
}

function makeZodiacResult(overrides: Partial<ZodiacResult> = {}): ZodiacResult {
  return {
    input: { birthDate: '1995-10-15', birthTime: '14:30', birthCity: '北京' },
    sunSign: '天蝎',
    moonSign: '巨蟹',
    risingSign: '狮子',
    mercurySign: '天秤',
    marsSign: '狮子',
    venusSign: '处女',
    submittedAt: 0,
    ...overrides,
  };
}

function makePokerResult(handType: PokerHandType): PokerResult {
  return {
    hand: [],
    handType,
    highCard: 'A',
    submittedAt: 0,
  };
}

function makeTexasResult(overrides: Partial<TexasResult> = {}): TexasResult {
  return {
    holeCards: [],
    boardCards: [],
    userActions: [],
    handRank: null,
    won: false,
    avgDecisionTime: 5000,
    bluffDetected: false,
    submittedAt: 0,
    ...overrides,
  };
}

/** 取牌 id · 便于构造塔罗结果 */
const FOOL_ID = 0; // 愚者 { VIS:0.20, TOL:0.15, ENT:0.10 }
const MAGICIAN_ID = 1; // 魔术师 { LEAD:0.20, VIS:0.15 }
const EMPEROR_ID = 4; // 皇帝 { LEAD:0.25, TOL:0.10 }

// ═════════════════════════════════════════════════════════
// 数据层 · 塔罗牌
// ═════════════════════════════════════════════════════════

describe('personaFusionEngine · 数据层', () => {
  it('TAROT_CARDS 共 78 张', () => {
    expect(TAROT_CARDS).toHaveLength(78);
  });

  it('22 张大阿尔卡纳（id 0-21）', () => {
    const major = TAROT_CARDS.filter((c) => c.arcana === 'major');
    expect(major).toHaveLength(22);
    expect(major.map((c) => c.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 22 }, (_, i) => i),
    );
  });

  it('56 张小阿尔卡纳（4 花色 × 14 张）', () => {
    const minor = TAROT_CARDS.filter((c) => c.arcana === 'minor');
    expect(minor).toHaveLength(56);
    // 四花色各 14 张
    for (const suit of ['权杖', '圣杯', '宝剑', '星币']) {
      expect(minor.filter((c) => c.name.startsWith(suit))).toHaveLength(14);
    }
  });

  it('getTarotCardById 命中', () => {
    expect(getTarotCardById(FOOL_ID)?.name).toBe('愚者');
    expect(getTarotCardById(EMPEROR_ID)?.name).toBe('皇帝');
  });

  it('getTarotCardById 未命中返回 undefined', () => {
    expect(getTarotCardById(999)).toBeUndefined();
    expect(getTarotCardById(-1)).toBeUndefined();
  });

  it('drawRandomTarot 数量正确且不重复', () => {
    const drawn = drawRandomTarot(3, 42);
    expect(drawn).toHaveLength(3);
    const ids = drawn.map((c) => c.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('drawRandomTarot 种子可复现', () => {
    expect(drawRandomTarot(3, 42).map((c) => c.id)).toEqual(
      drawRandomTarot(3, 42).map((c) => c.id),
    );
  });

  it('每张牌 personaWeights 在 [-0.25, 0.25]', () => {
    for (const card of TAROT_CARDS) {
      for (const v of Object.values(card.personaWeights)) {
        expect(Math.abs(v ?? 0)).toBeLessThanOrEqual(0.25);
      }
    }
  });
});

// ═════════════════════════════════════════════════════════
// 归一化
// ═════════════════════════════════════════════════════════

describe('personaFusionEngine · 归一化', () => {
  it('zeroVector 六维全 0', () => {
    const v = zeroVector();
    for (const d of DIMS) expect(v[d]).toBe(0);
  });

  it('全零向量原样返回', () => {
    const v = normalizeVector(zeroVector());
    for (const d of DIMS) expect(v[d]).toBe(0);
  });

  it('单维度归一化到 +1', () => {
    const v = normalizeVector({ ...zeroVector(), TOL: 0.3 });
    expect(v.TOL).toBe(1);
    for (const d of DIMS.filter((x) => x !== 'TOL')) expect(v[d]).toBe(0);
  });

  it('负值归一化到 -1', () => {
    const v = normalizeVector({ ...zeroVector(), SPD: -0.42 });
    expect(v.SPD).toBe(-1);
  });

  it('多维度按最大绝对值缩放', () => {
    const v = normalizeVector({ ...zeroVector(), TOL: 0.2, INF: -0.1 });
    expect(v.TOL).toBe(1);
    expect(v.INF).toBe(-0.5);
  });

  it('保留 3 位小数', () => {
    const v = normalizeVector({ ...zeroVector(), TOL: 0.3, INF: 0.1 });
    // 0.1/0.3 = 0.333...
    expect(v.INF).toBe(0.333);
  });
});

// ═════════════════════════════════════════════════════════
// 塔罗 → 向量
// ═════════════════════════════════════════════════════════

describe('personaFusionEngine · 塔罗向量映射', () => {
  it('单张正位 · 权重 × 位置权重', () => {
    // 愚者现在位：{ VIS:0.20, TOL:0.15, ENT:0.10 } × 0.5
    const v = tarotToVector(
      makeTarotResult([{ cardId: FOOL_ID, position: 'present', isReversed: false }]),
    );
    expect(v.VIS).toBeCloseTo(0.1, 5);
    expect(v.TOL).toBeCloseTo(0.075, 5);
    expect(v.ENT).toBeCloseTo(0.05, 5);
  });

  it('逆位 · 权重反转', () => {
    const v = tarotToVector(
      makeTarotResult([{ cardId: FOOL_ID, position: 'present', isReversed: true }]),
    );
    // 逆位：VIS -0.20 × 0.5 = -0.1
    expect(v.VIS).toBeCloseTo(-0.1, 5);
    expect(v.TOL).toBeCloseTo(-0.075, 5);
  });

  it('过去位权重 0.2', () => {
    const v = tarotToVector(
      makeTarotResult([{ cardId: MAGICIAN_ID, position: 'past', isReversed: false }]),
    );
    // 魔术师 LEAD 0.20 × 0.2 = 0.04
    expect(v.LEAD).toBeCloseTo(0.04, 5);
  });

  it('未来位权重 0.3', () => {
    const v = tarotToVector(
      makeTarotResult([{ cardId: MAGICIAN_ID, position: 'future', isReversed: false }]),
    );
    expect(v.LEAD).toBeCloseTo(0.06, 5);
  });

  it('三张牌加权累加', () => {
    // 愚者过去(0.2) + 皇帝现在(0.5) + 魔术师未来(0.3)
    const v = tarotToVector(
      makeTarotResult([
        { cardId: FOOL_ID, position: 'past', isReversed: false }, // VIS 0.04, TOL 0.03, ENT 0.02
        { cardId: EMPEROR_ID, position: 'present', isReversed: false }, // LEAD 0.125, TOL 0.05
        { cardId: MAGICIAN_ID, position: 'future', isReversed: false }, // LEAD 0.06, VIS 0.045
      ]),
    );
    expect(v.LEAD).toBeCloseTo(0.125 + 0.06, 5);
    expect(v.TOL).toBeCloseTo(0.03 + 0.05, 5);
    expect(v.VIS).toBeCloseTo(0.04 + 0.045, 5);
    expect(v.ENT).toBeCloseTo(0.02, 5);
  });

  it('缺失 cardId 跳过', () => {
    const v = tarotToVector(
      makeTarotResult([{ cardId: 9999, position: 'present', isReversed: false }]),
    );
    for (const d of DIMS) expect(v[d]).toBe(0);
  });

  it('空结果返回零向量', () => {
    const v = tarotToVector(makeTarotResult([]));
    for (const d of DIMS) expect(v[d]).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════
// 星盘 → 向量
// ═════════════════════════════════════════════════════════

describe('personaFusionEngine · 星盘向量映射', () => {
  it('六星体映射命中 ZODIAC_PERSONA_MAP', () => {
    const result = makeZodiacResult(); // 默认六星座
    const v = zodiacToVector(result);
    // 太阳天蝎(水): ENT 0.15, VIS 0.10
    // 月亮巨蟹(水): ENT 0.20, VIS 0.10
    // 上升狮子(火): LEAD 0.12, SPD 0.08
    // 水星天秤(风): SPD 0.12, VIS 0.10
    // 火星狮子(火): TOL 0.18, SPD 0.12
    // 金星处女(土): INF 0.10, ENT 0.08
    expect(v.ENT).toBeCloseTo(0.15 + 0.2 + 0.08, 5);
    expect(v.VIS).toBeCloseTo(0.1 + 0.1 + 0.1, 5);
    expect(v.LEAD).toBeCloseTo(0.12, 5);
    expect(v.SPD).toBeCloseTo(0.08 + 0.12 + 0.12, 5);
    expect(v.TOL).toBeCloseTo(0.18, 5);
    expect(v.INF).toBeCloseTo(0.1, 5);
  });

  it('单星体 · 太阳火象', () => {
    const v = zodiacToVector(
      makeZodiacResult({
        sunSign: '白羊', moonSign: '', risingSign: '', mercurySign: '', marsSign: '', venusSign: '',
      }),
    );
    // 太阳_火: LEAD 0.15, TOL 0.10
    expect(v.LEAD).toBeCloseTo(0.15, 5);
    expect(v.TOL).toBeCloseTo(0.1, 5);
  });

  it('未知星座跳过', () => {
    const v = zodiacToVector(
      makeZodiacResult({
        sunSign: '未知星座', moonSign: '', risingSign: '', mercurySign: '', marsSign: '', venusSign: '',
      }),
    );
    for (const d of DIMS) expect(v[d]).toBe(0);
  });

  it('SIGN_ELEMENT 覆盖 12 星座四象', () => {
    expect(SIGN_ELEMENT['天蝎']).toBe('水');
    expect(SIGN_ELEMENT['白羊']).toBe('火');
    expect(SIGN_ELEMENT['金牛']).toBe('土');
    expect(SIGN_ELEMENT['双子']).toBe('风');
    expect(Object.keys(SIGN_ELEMENT)).toHaveLength(12);
  });

  it('ZODIAC_PERSONA_MAP 覆盖 6 星体 × 4 象 = 24 项', () => {
    expect(Object.keys(ZODIAC_PERSONA_MAP)).toHaveLength(24);
  });
});

// ═════════════════════════════════════════════════════════
// 扑克 → 向量
// ═════════════════════════════════════════════════════════

describe('personaFusionEngine · 扑克向量映射', () => {
  const CASES: [PokerHandType, Partial<PersonaVector>][] = [
    ['同花顺', { TOL: 0.25, SPD: 0.2 }],
    ['四条', { TOL: 0.2, INF: 0.1 }],
    ['葫芦', { TOL: 0.15, LEAD: 0.1 }],
    ['同花', { VIS: 0.15, INF: 0.1 }],
    ['顺子', { SPD: 0.15, TOL: 0.1 }],
    ['三条', { TOL: 0.1, LEAD: 0.1 }],
    ['两对', { INF: 0.1, SPD: 0.1 }],
    ['对子', { INF: 0.1 }],
    ['高牌', { TOL: -0.1 }],
  ];

  for (const [handType, expected] of CASES) {
    it(`${handType} 映射正确`, () => {
      const v = pokerToVector(makePokerResult(handType));
      for (const [dim, val] of Object.entries(expected)) {
        expect(v[dim as PersonaDim]).toBeCloseTo(val as number, 5);
      }
    });
  }

  it('高牌 TOL 为负（运气差 → 风险偏好低）', () => {
    expect(pokerToVector(makePokerResult('高牌')).TOL).toBeLessThan(0);
  });

  it('POKER_HAND_MAP 覆盖 9 种牌型', () => {
    expect(Object.keys(POKER_HAND_MAP)).toHaveLength(9);
  });
});

// ═════════════════════════════════════════════════════════
// 德州 → 向量
// ═════════════════════════════════════════════════════════

describe('personaFusionEngine · 德州向量映射', () => {
  it('全弃牌 → TOL/SPD 负（风险规避）', () => {
    // 显式 slow 档位 (10s) → SPD -0.12，强化风险规避倾向
    const v = texasToVector(
      makeTexasResult({ userActions: ['fold', 'fold', 'fold'], avgDecisionTime: 10000 }),
    );
    // fold × 3: TOL -0.15×3 = -0.45；SPD -0.10×3 + (-0.12) = -0.42
    expect(v.TOL).toBeCloseTo(-0.45, 5);
    expect(v.SPD).toBeCloseTo(-0.42, 5);
  });

  it('全加注 → TOL/SPD 正（风险偏好）', () => {
    // 显式 fast 档位 (2s) → SPD +0.20，强化果断倾向
    const v = texasToVector(
      makeTexasResult({ userActions: ['raise', 'raise', 'raise'], avgDecisionTime: 2000 }),
    );
    // raise × 3: TOL 0.20×3 = 0.60；SPD 0.15×3 + 0.20 = 0.65
    expect(v.TOL).toBeCloseTo(0.6, 5);
    expect(v.SPD).toBeCloseTo(0.65, 5);
  });

  it('全跟注 → INF 正（信息依赖）', () => {
    const v = texasToVector(makeTexasResult({ userActions: ['call', 'call', 'call'] }));
    expect(v.INF).toBeCloseTo(0.3, 5); // 0.10×3
  });

  it('混合行为累加', () => {
    // 默认 avgDecisionTime 5000 → mid 档位 SPD +0.05
    const v = texasToVector(makeTexasResult({ userActions: ['fold', 'raise', 'call'] }));
    // TOL -0.15 + 0.20 = 0.05
    // SPD -0.10 + 0.15 + 0.05(mid) = 0.10
    // INF 0.10
    expect(v.TOL).toBeCloseTo(0.05, 5);
    expect(v.SPD).toBeCloseTo(0.1, 5);
    expect(v.INF).toBeCloseTo(0.1, 5);
  });

  it('决策速度 fast (<3s) → SPD +0.20', () => {
    const v = texasToVector(makeTexasResult({ userActions: [], avgDecisionTime: 2000 }));
    expect(v.SPD).toBeCloseTo(0.2, 5);
  });

  it('决策速度 mid (3-8s) → SPD +0.05', () => {
    const v = texasToVector(makeTexasResult({ userActions: [], avgDecisionTime: 5000 }));
    expect(v.SPD).toBeCloseTo(0.05, 5);
  });

  it('决策速度 slow (>8s) → SPD -0.12', () => {
    const v = texasToVector(makeTexasResult({ userActions: [], avgDecisionTime: 10000 }));
    expect(v.SPD).toBeCloseTo(-0.12, 5);
  });

  it('avgDecisionTime ≤ 0 → 跳过 speed 档位（未决策不误派 fast）', () => {
    const v = texasToVector(makeTexasResult({ userActions: [], avgDecisionTime: 0 }));
    expect(v.SPD).toBe(0);
    for (const d of DIMS.filter((x) => x !== 'SPD')) expect(v[d]).toBe(0);
  });

  it('avgDecisionTime 为负值 → 同样跳过 speed 档位', () => {
    const v = texasToVector(makeTexasResult({ userActions: ['raise'], avgDecisionTime: -1 }));
    // raise: TOL 0.20, SPD 0.15 · 不叠加 speed 档位
    expect(v.TOL).toBeCloseTo(0.2, 5);
    expect(v.SPD).toBeCloseTo(0.15, 5);
  });

  it('诈唬加成 → TOL/VIS 额外', () => {
    const base = texasToVector(makeTexasResult({ userActions: [], bluffDetected: false }));
    const bluff = texasToVector(makeTexasResult({ userActions: [], bluffDetected: true }));
    expect(bluff.TOL - base.TOL).toBeCloseTo(0.25, 5);
    expect(bluff.VIS - base.VIS).toBeCloseTo(0.15, 5);
  });

  it('空行为 + mid 速度 → 仅 SPD', () => {
    const v = texasToVector(makeTexasResult({ userActions: [], avgDecisionTime: 5000 }));
    expect(v.SPD).toBeCloseTo(0.05, 5);
    expect(v.TOL).toBe(0);
    expect(v.INF).toBe(0);
  });

  it('TEXAS_ACTION_MAP 覆盖 3 种行为', () => {
    expect(Object.keys(TEXAS_ACTION_MAP).sort()).toEqual(['call', 'fold', 'raise']);
  });
});

// ═════════════════════════════════════════════════════════
// 标签派生
// ═════════════════════════════════════════════════════════

describe('personaFusionEngine · 标签派生', () => {
  it('TOL 正 → 冒险者', () => {
    expect(derivePersonaTag({ ...zeroVector(), TOL: 0.8 })).toBe('冒险者');
  });

  it('TOL 负 → 审慎者', () => {
    expect(derivePersonaTag({ ...zeroVector(), TOL: -0.8 })).toBe('审慎者');
  });

  it('SPD 正 → 决断者', () => {
    expect(derivePersonaTag({ ...zeroVector(), SPD: 0.5 })).toBe('决断者');
  });

  it('INF 正 → 谋略者', () => {
    expect(derivePersonaTag({ ...zeroVector(), INF: 0.5 })).toBe('谋略者');
  });

  it('ENT 正 → 炽烈者', () => {
    expect(derivePersonaTag({ ...zeroVector(), ENT: 0.5 })).toBe('炽烈者');
  });

  it('LEAD 正 → 引领者', () => {
    expect(derivePersonaTag({ ...zeroVector(), LEAD: 0.5 })).toBe('引领者');
  });

  it('VIS 正 → 灵感者', () => {
    expect(derivePersonaTag({ ...zeroVector(), VIS: 0.5 })).toBe('灵感者');
  });

  it('VIS 负 → 实证者', () => {
    expect(derivePersonaTag({ ...zeroVector(), VIS: -0.5 })).toBe('实证者');
  });

  it('取绝对值最大的维度', () => {
    // TOL 0.3 vs SPD 0.5 → SPD 主调
    expect(derivePersonaTag({ ...zeroVector(), TOL: 0.3, SPD: 0.5 })).toBe('决断者');
  });

  it('全零 → 中性均衡者（不误派倾向）', () => {
    // 全零向量无主调维度，返回中性「均衡者」
    expect(derivePersonaTag(zeroVector())).toBe('均衡者');
  });
});

// ═════════════════════════════════════════════════════════
// 融合
// ═════════════════════════════════════════════════════════

describe('personaFusionEngine · 融合', () => {
  it('空输入 → 零向量 + 中性均衡者标签', () => {
    const fusion = fusePersona({});
    for (const d of DIMS) expect(fusion.finalVector[d]).toBe(0);
    expect(fusion.breakdown.tarot).toBeUndefined();
    expect(fusion.breakdown.zodiac).toBeUndefined();
    expect(fusion.breakdown.poker).toBeUndefined();
    expect(fusion.breakdown.texas).toBeUndefined();
    expect(fusion.personaTag).toBe('均衡者');
  });

  it('仅塔罗 · breakdown 填充 vector', () => {
    const tarot = makeTarotResult([
      { cardId: FOOL_ID, position: 'present', isReversed: false },
    ]);
    const fusion = fusePersona({ tarot: { result: tarot } });
    expect(fusion.breakdown.tarot).toBeDefined();
    expect(fusion.breakdown.tarot!.vector).toBeDefined();
    expect(fusion.breakdown.tarot!.result).toBe(tarot);
    // 其他模块未参与
    expect(fusion.breakdown.zodiac).toBeUndefined();
  });

  it('塔罗权重 0.3 正确加权', () => {
    // 愚者现在位正向：VIS 0.10, TOL 0.075, ENT 0.05（tarotToVector 输出）
    // 融合 × 0.3 后再归一化（单模块最大值归一到 1）
    const tarot = makeTarotResult([
      { cardId: FOOL_ID, position: 'present', isReversed: false },
    ]);
    const fusion = fusePersona({ tarot: { result: tarot } });
    // 单模块：acc = vector × 0.3，归一化后最大维度 = 1
    // vector.VIS=0.10 最大 → acc.VIS=0.03 → 归一化 VIS=1, TOL=0.075×0.3/0.03=0.75, ENT=0.05×0.3/0.03=0.5
    expect(fusion.finalVector.VIS).toBeCloseTo(1, 3);
    expect(fusion.finalVector.TOL).toBeCloseTo(0.75, 3);
    expect(fusion.finalVector.ENT).toBeCloseTo(0.5, 3);
  });

  it('全模块融合 · 权重正确', () => {
    const fusion = fusePersona({
      tarot: { result: makeTarotResult([{ cardId: EMPEROR_ID, position: 'present', isReversed: false }]) },
      zodiac: { result: makeZodiacResult({ sunSign: '白羊', moonSign: '', risingSign: '', mercurySign: '', marsSign: '', venusSign: '' }) },
      poker: { result: makePokerResult('同花顺') },
      texas: { result: makeTexasResult({ userActions: ['raise', 'raise', 'raise'], avgDecisionTime: 2000 }) },
    });
    // 四模块 breakdown 全填充
    expect(fusion.breakdown.tarot).toBeDefined();
    expect(fusion.breakdown.zodiac).toBeDefined();
    expect(fusion.breakdown.poker).toBeDefined();
    expect(fusion.breakdown.texas).toBeDefined();
    // 最终归一化后最大绝对值为 1
    const maxAbs = Math.max(...DIMS.map((d) => Math.abs(fusion.finalVector[d])));
    expect(maxAbs).toBeCloseTo(1, 3);
  });

  it('缺失模块跳过（不报错）', () => {
    const fusion = fusePersona({
      tarot: { result: makeTarotResult([{ cardId: FOOL_ID, position: 'present', isReversed: false }]) },
      poker: { result: makePokerResult('高牌') },
    });
    expect(fusion.breakdown.zodiac).toBeUndefined();
    expect(fusion.breakdown.texas).toBeUndefined();
    expect(fusion.breakdown.tarot).toBeDefined();
    expect(fusion.breakdown.poker).toBeDefined();
  });

  it('MODULE_WEIGHT 权重和为 1', () => {
    const sum = Object.values(MODULE_WEIGHT).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('MODULE_WEIGHT 塔罗/星盘各 0.3，扑克/德州各 0.2', () => {
    expect(MODULE_WEIGHT.tarot).toBe(0.3);
    expect(MODULE_WEIGHT.zodiac).toBe(0.3);
    expect(MODULE_WEIGHT.poker).toBe(0.2);
    expect(MODULE_WEIGHT.texas).toBe(0.2);
  });

  it('personaTag 由最终向量派生', () => {
    // 全加注德州主导 → TOL/SPD 正，且 TOL 最大
    const fusion = fusePersona({
      texas: { result: makeTexasResult({ userActions: ['raise', 'raise', 'raise'], avgDecisionTime: 2000 }) },
    });
    // raise×3: TOL 0.60, SPD 0.45+0.20=0.65 → SPD 最大正 → 决断者
    expect(['决断者', '冒险者']).toContain(fusion.personaTag);
  });

  it('submittedAt 为数字', () => {
    const fusion = fusePersona({});
    expect(typeof fusion.submittedAt).toBe('number');
  });

  it('最终向量在 [-1, 1] 区间', () => {
    const fusion = fusePersona({
      tarot: { result: makeTarotResult([{ cardId: EMPEROR_ID, position: 'present', isReversed: false }]) },
      zodiac: { result: makeZodiacResult() },
      poker: { result: makePokerResult('同花顺') },
      texas: { result: makeTexasResult({ userActions: ['raise', 'raise', 'raise'], bluffDetected: true }) },
    });
    for (const d of DIMS) {
      expect(fusion.finalVector[d]).toBeGreaterThanOrEqual(-1);
      expect(fusion.finalVector[d]).toBeLessThanOrEqual(1);
    }
  });
});
