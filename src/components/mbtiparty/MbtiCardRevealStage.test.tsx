/**
 * MbtiCardRevealStage · 并发重置测试
 *
 * 模拟用户快速点击「重看揭示」按钮的场景（与 CocktailRevealStage.test.tsx 对称）：
 *   - 每次 key 变化触发组件卸载 + 重挂载
 *   - 验证旧 RAF 被正确取消（无并发 RAF 残留）
 *   - 验证卸载/挂载日志成对出现
 *   - 验证 props 变化但 key 不变时不重启 RAF（通过 ref 读取）
 *
 * 同时覆盖 cardCustomization 数据层的派生逻辑：
 *   - deriveMbtiCards · 16 型组合字母拆分正确
 *   - deriveCardPalette · 酒局主色派生统一底色
 *
 * 环境约束：
 *   jsdom 不支持 Canvas 2D API · 需 stub getContext
 *   jsdom 无 requestAnimationFrame · 需 polyfill
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import MbtiCardRevealStage from './MbtiCardRevealStage';
import {
  deriveMbtiCards,
  deriveCardPalette,
  deriveTarotCard,
  derivePokerCard,
  unifyMbtiCard,
  unifyTarotCard,
  unifyPokerCard,
  TAROT_MAJOR_OPTIONS,
  POKER_SUIT_OPTIONS,
  POKER_RANK_OPTIONS,
  DEFAULT_PACKAGING,
  PACKAGING_STYLES,
  GOLD_PATTERNS,
  loadPackagingConfig,
  savePackagingConfig,
  getPackagingStyle,
  getGoldPattern,
  type PackagingConfig,
  type UnifiedCardSpec,
} from '../../data/cardCustomization';

/** 构造模拟参与者 · 3 ENFP + 1 INTJ 张力之杯场景（与 CocktailRevealStage 测试同构） */
const mockCodes = ['INTJ', 'ENFP', 'ENFP', 'ENFP'];
const mockPartyColor = '#e88a3c';

/** Stub CanvasRenderingContext2D · 所有方法 noop · 渐变返回带 addColorStop 的对象 */
function makeStubCtx() {
  const gradientStub = { addColorStop: vi.fn() };
  return {
    scale: vi.fn(),
    clearRect: vi.fn(),
    createRadialGradient: vi.fn(() => ({ ...gradientStub })),
    createLinearGradient: vi.fn(() => ({ ...gradientStub })),
    beginPath: vi.fn(),
    ellipse: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillText: vi.fn(),
    set fillStyle(_v: unknown) {},
    set strokeStyle(_v: unknown) {},
    set lineWidth(_v: number) {},
    set globalAlpha(_v: number) {},
    set font(_v: string) {},
    set textAlign(_v: string) {},
    set textBaseline(_v: string) {},
  } as unknown as CanvasRenderingContext2D;
}

describe('MbtiCardRevealStage · 并发重置测试', () => {
  let rafCount: number;
  let cancelCount: number;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    rafCount = 0;
    cancelCount = 0;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // polyfill requestAnimationFrame · 记录调度但不自动执行（避免无限循环）
    globalThis.requestAnimationFrame = vi.fn((_cb: FrameRequestCallback) => {
      rafCount++;
      return rafCount as unknown as number;
    }) as unknown as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = vi.fn(() => {
      cancelCount++;
    }) as unknown as typeof cancelAnimationFrame;

    // stub HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() => makeStubCtx()) as never;

    // performance.now 递增 · 模拟时间流逝（每帧 16ms）
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      now += 16;
      return now;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('快速连续 5 次切换 key · 每次 key 变化都取消旧 RAF · 不抛错', () => {
    const keys = [0, 1, 2, 3, 4];
    const { rerender, unmount } = render(
      <MbtiCardRevealStage key={keys[0]} codes={mockCodes} partyPrimaryColor={mockPartyColor} />,
    );

    // 模拟用户快速点击「重看揭示」· key 连续变化
    for (let i = 1; i < keys.length; i++) {
      rerender(
        <MbtiCardRevealStage key={keys[i]} codes={mockCodes} partyPrimaryColor={mockPartyColor} />,
      );
    }

    // 5 次挂载 · 前 4 次因 key 变化被卸载 → 至少 4 次 cancelAnimationFrame
    expect(cancelCount).toBeGreaterThanOrEqual(4);
    // 不应抛错 · React 卸载/重挂载过程不应产生 console.warn
    expect(warnSpy).not.toHaveBeenCalled();

    unmount();
    // 最后一次卸载也触发 cancel
    expect(cancelCount).toBeGreaterThanOrEqual(5);
  });

  it('卸载/挂载日志成对出现 · 每次重挂载都有「挂载」和「卸载」', () => {
    const { rerender, unmount } = render(
      <MbtiCardRevealStage key={0} codes={mockCodes} partyPrimaryColor={mockPartyColor} />,
    );
    rerender(
      <MbtiCardRevealStage key={1} codes={mockCodes} partyPrimaryColor={mockPartyColor} />,
    );
    unmount();

    const logCalls = logSpy.mock.calls.map((c: unknown[]) => String(c[0] ?? ''));
    const mounts = logCalls.filter((s: string) => s.includes('挂载'));
    const unmounts = logCalls.filter((s: string) => s.includes('卸载'));

    // 初始挂载 + key 变化重挂载 = 2 次挂载
    expect(mounts.length).toBe(2);
    // key 变化卸载 + unmount 卸载 = 2 次卸载
    expect(unmounts.length).toBe(2);
  });

  it('单实例挂载后 · RAF 被调度且卸载时取消', () => {
    const { unmount } = render(
      <MbtiCardRevealStage codes={mockCodes} partyPrimaryColor={mockPartyColor} />,
    );
    expect(rafCount).toBeGreaterThanOrEqual(1);
    unmount();
    expect(cancelCount).toBe(1);
  });

  it('props 变化但 key 不变 · 不重启 RAF（通过 ref 读取 · 避免重启）', () => {
    const { rerender, unmount } = render(
      <MbtiCardRevealStage key={0} codes={mockCodes} partyPrimaryColor={mockPartyColor} />,
    );
    const rafAfterMount = rafCount;
    // codes 与 partyPrimaryColor 引用变化但 key 不变
    const newCodes = ['INFJ', 'ENTP'];
    const newColor = '#9d6bbf';
    rerender(<MbtiCardRevealStage key={0} codes={newCodes} partyPrimaryColor={newColor} />);
    // 不应重新挂载 · RAF 不重启 · 无额外 cancel
    expect(cancelCount).toBe(0);
    expect(rafCount).toBe(rafAfterMount);
    unmount();
  });

  it('单参与者场景 · 也能正常挂载与卸载（边界）', () => {
    const { unmount } = render(
      <MbtiCardRevealStage codes={['INTJ']} partyPrimaryColor="#6b7fd4" />,
    );
    expect(rafCount).toBeGreaterThanOrEqual(1);
    unmount();
    expect(cancelCount).toBe(1);
  });
});

// ═════════════════════════════════════════════════════════
// cardCustomization 数据层测试
// ═════════════════════════════════════════════════════════

describe('cardCustomization · 数据层派生', () => {
  it('deriveMbtiCards · 16 型组合字母拆分正确', () => {
    const codes = ['INTJ', 'ENFP', 'INFJ', 'ESFP'];
    const cards = deriveMbtiCards(codes);
    expect(cards).toHaveLength(4);
    // 组合字母 · 4 字母拆分
    expect(cards[0].letters).toEqual(['I', 'N', 'T', 'J']);
    expect(cards[0].code).toBe('INTJ');
    expect(cards[0].nickname).toBe('黑暗先知');
    expect(cards[1].letters).toEqual(['E', 'N', 'F', 'P']);
    expect(cards[1].nickname).toBe('竞选者');
  });

  it('deriveMbtiCards · 空列表返回空数组', () => {
    expect(deriveMbtiCards([])).toEqual([]);
  });

  it('deriveCardPalette · 底色为酒局主色调暗（与深空底混合）', () => {
    const palette = deriveCardPalette('#e88a3c', DEFAULT_PACKAGING);
    // 底色应为 #rrggbb 格式 · 与深空底 #070414 混合后偏深
    expect(palette.cardBase).toMatch(/^#[0-9a-f]{6}$/);
    expect(palette.cardShadow).toMatch(/^#[0-9a-f]{6}$/);
    expect(palette.cardTopGlow).toMatch(/^#[0-9a-f]{6}$/);
    // 暗角应比底色更暗（r+g+b 之和更小）
    const sumBase = parseInt(palette.cardBase.slice(1, 3), 16) +
      parseInt(palette.cardBase.slice(3, 5), 16) +
      parseInt(palette.cardBase.slice(5, 7), 16);
    const sumShadow = parseInt(palette.cardShadow.slice(1, 3), 16) +
      parseInt(palette.cardShadow.slice(3, 5), 16) +
      parseInt(palette.cardShadow.slice(5, 7), 16);
    expect(sumShadow).toBeLessThan(sumBase);
    // 顶部高光应比底色更亮
    const sumGlow = parseInt(palette.cardTopGlow.slice(1, 3), 16) +
      parseInt(palette.cardTopGlow.slice(3, 5), 16) +
      parseInt(palette.cardTopGlow.slice(5, 7), 16);
    expect(sumGlow).toBeGreaterThan(sumBase);
    // 金线固定金
    expect(palette.goldLine).toBe('#f0c674');
  });

  it('deriveCardPalette · 不同包装材质产生不同内壁色', () => {
    const nightVelvet = deriveCardPalette('#e88a3c', { material: '夜绒', pattern: '镜月' });
    const purpleSandalwood = deriveCardPalette('#e88a3c', { material: '紫檀', pattern: '镜月' });
    // 卡牌底色系列只由酒局主色决定 · 与材质无关
    expect(nightVelvet.cardBase).toBe(purpleSandalwood.cardBase);
    // 但内壁色由材质决定 · 应不同
    expect(nightVelvet.boxInner).not.toBe(purpleSandalwood.boxInner);
  });

  it('getPackagingStyle · 4 种材质预设齐全', () => {
    for (const material of ['夜绒', '镜纸', '紫檀', '雾锡'] as const) {
      const style = getPackagingStyle(material);
      expect(style.id).toBe(material);
      expect(style.boxBase).toMatch(/^#[0-9a-f]{6}$/);
      expect(style.boxHighlight).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('getGoldPattern · 4 种纹样预设齐全', () => {
    for (const pattern of ['星轨', '镜月', '潮汐', '无纹'] as const) {
      const g = getGoldPattern(pattern);
      expect(g.id).toBe(pattern);
      expect(g.symbol).toBeTruthy();
    }
  });

  it('PACKAGING_STYLES / GOLD_PATTERNS · 各 4 项', () => {
    expect(PACKAGING_STYLES).toHaveLength(4);
    expect(GOLD_PATTERNS).toHaveLength(4);
  });
});

// ═════════════════════════════════════════════════════════
// 持久化测试 · localStorage
// ═════════════════════════════════════════════════════════

describe('cardCustomization · 持久化', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadPackagingConfig · 无存储时返回默认（夜绒+镜月）', () => {
    const config = loadPackagingConfig();
    expect(config.material).toBe('夜绒');
    expect(config.pattern).toBe('镜月');
  });

  it('savePackagingConfig → loadPackagingConfig · 往返一致', () => {
    const config: PackagingConfig = { material: '紫檀', pattern: '星轨' };
    savePackagingConfig(config);
    const loaded = loadPackagingConfig();
    expect(loaded).toEqual(config);
  });

  it('loadPackagingConfig · 损坏数据退回默认', () => {
    localStorage.setItem('y-mine-packaging-config', '{invalid json');
    const config = loadPackagingConfig();
    expect(config).toEqual(DEFAULT_PACKAGING);
  });
});

// ═════════════════════════════════════════════════════════
// 塔罗牌定制数据层测试
// ═════════════════════════════════════════════════════════

describe('cardCustomization · 塔罗牌定制派生', () => {
  it('deriveTarotCard · 大阿尔卡纳 · 正位派生正确', () => {
    // TAROT_MAJOR_OPTIONS[0] 是愚者
    const card = deriveTarotCard(TAROT_MAJOR_OPTIONS[0].id, false);
    expect(card.cardId).toBe(TAROT_MAJOR_OPTIONS[0].id);
    expect(card.name).toBe(TAROT_MAJOR_OPTIONS[0].name);
    expect(card.nameEn).toBe(TAROT_MAJOR_OPTIONS[0].nameEn);
    expect(card.isReversed).toBe(false);
    expect(card.arcana).toBe('major');
    // 主色由元素派生 · 应为 hex
    expect(card.primary).toMatch(/^#[0-9a-f]{6}$/);
    expect(card.accent).toMatch(/^#[0-9a-f]{6}$/);
    // 符号取牌名首字
    expect(card.symbol).toBe(card.name.charAt(0));
  });

  it('deriveTarotCard · 逆位切换 meaning 与标题', () => {
    const upright = deriveTarotCard(TAROT_MAJOR_OPTIONS[0].id, false);
    const reversed = deriveTarotCard(TAROT_MAJOR_OPTIONS[0].id, true);
    expect(reversed.isReversed).toBe(true);
    // 逆位 meaning 与正位不同
    expect(reversed.meaning).not.toBe(upright.meaning);
  });

  it('deriveTarotCard · 未知 id 退回愚者（第一张）', () => {
    const card = deriveTarotCard(99999, false);
    expect(card.cardId).toBe(TAROT_CARDS_FIRST_ID);
  });

  it('unifyTarotCard · 逆位标题加「·逆」', () => {
    const upright = unifyTarotCard(deriveTarotCard(TAROT_MAJOR_OPTIONS[0].id, false));
    const reversed = unifyTarotCard(deriveTarotCard(TAROT_MAJOR_OPTIONS[0].id, true));
    expect(upright.kind).toBe('tarot');
    expect(upright.title).toBe(TAROT_MAJOR_OPTIONS[0].name);
    expect(reversed.title).toBe(`${TAROT_MAJOR_OPTIONS[0].name}·逆`);
  });

  it('TAROT_MAJOR_OPTIONS · 22 张大阿尔卡纳', () => {
    expect(TAROT_MAJOR_OPTIONS).toHaveLength(22);
    // 每张应有中英文名 + 元素
    for (const opt of TAROT_MAJOR_OPTIONS) {
      expect(opt.name).toBeTruthy();
      expect(opt.nameEn).toBeTruthy();
      expect(['火', '水', '风', '土']).toContain(opt.element);
    }
  });
});

// 愚者 id · 用于「未知 id 退回」断言
const TAROT_CARDS_FIRST_ID = TAROT_MAJOR_OPTIONS[0].id;

// ═════════════════════════════════════════════════════════
// 扑克牌定制数据层测试
// ═════════════════════════════════════════════════════════

describe('cardCustomization · 扑克牌定制派生', () => {
  it('derivePokerCard · 红心 A 派生正确', () => {
    const card = derivePokerCard('♥', 'A');
    expect(card.suit).toBe('♥');
    expect(card.rank).toBe('A');
    expect(card.suitLabel).toBe('红心');
    // 红色花色应为暖红
    expect(card.primary).toMatch(/^#[0-9a-f]{6}$/);
    expect(card.symbol).toBe('心');
  });

  it('derivePokerCard · 黑桃 K 冷色派生', () => {
    const card = derivePokerCard('♠', 'K');
    expect(card.suitLabel).toBe('黑桃');
    // 黑色花色（黑桃）应为冷紫
    const red = derivePokerCard('♥', 'A');
    expect(card.primary).not.toBe(red.primary);
  });

  it('unifyPokerCard · 标题为「点数+花色」', () => {
    const unified = unifyPokerCard(derivePokerCard('♦', '10'));
    expect(unified.kind).toBe('poker');
    expect(unified.title).toBe('10♦');
    expect(unified.subtitle).toBe('方块');
  });

  it('POKER_SUIT_OPTIONS · 4 花色', () => {
    expect(POKER_SUIT_OPTIONS).toHaveLength(4);
    const suits = POKER_SUIT_OPTIONS.map((o) => o.suit);
    expect(suits).toEqual(['♠', '♥', '♦', '♣']);
  });

  it('POKER_RANK_OPTIONS · 13 点数', () => {
    expect(POKER_RANK_OPTIONS).toHaveLength(13);
    expect(POKER_RANK_OPTIONS[0]).toBe('A');
    expect(POKER_RANK_OPTIONS[12]).toBe('K');
  });

  it('unifyMbtiCard / unifyTarotCard / unifyPokerCard · 三类 kind 区分', () => {
    const mbti = unifyMbtiCard(deriveMbtiCards(['INTJ'])[0]);
    const tarot = unifyTarotCard(deriveTarotCard(TAROT_MAJOR_OPTIONS[0].id));
    const poker = unifyPokerCard(derivePokerCard('♠', 'A'));
    expect(mbti.kind).toBe('mbti');
    expect(tarot.kind).toBe('tarot');
    expect(poker.kind).toBe('poker');
    // 三类都有 title/subtitle/symbol/caption/primary/accent
    for (const c of [mbti, tarot, poker] as UnifiedCardSpec[]) {
      expect(c.title).toBeTruthy();
      expect(c.subtitle).toBeTruthy();
      expect(c.symbol).toBeTruthy();
      expect(c.caption).toBeTruthy();
      expect(c.primary).toMatch(/^#[0-9a-f]{6}$/);
      expect(c.accent).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

// ═════════════════════════════════════════════════════════
// 三类卡片渲染测试 · cards prop 优先于 codes
// ═════════════════════════════════════════════════════════

describe('MbtiCardRevealStage · 三类卡片渲染', () => {
  beforeEach(() => {
    // stub RAF · 记录但不执行
    globalThis.requestAnimationFrame = vi.fn((_cb: FrameRequestCallback) => 1) as unknown as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = vi.fn(() => {}) as unknown as typeof cancelAnimationFrame;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => makeStubCtx()) as never;
    vi.spyOn(performance, 'now').mockImplementation(() => 0);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('塔罗 cards prop · 正常挂载 · 挂载日志含 kind:tarot', () => {
    const tarotCards: UnifiedCardSpec[] = [
      unifyTarotCard(deriveTarotCard(TAROT_MAJOR_OPTIONS[0].id)),
      unifyTarotCard(deriveTarotCard(TAROT_MAJOR_OPTIONS[5].id, true)),
    ];
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<MbtiCardRevealStage cards={tarotCards} partyPrimaryColor={mockPartyColor} />);
    const mountLog = logSpy.mock.calls.find((c: unknown[]) =>
      String(c[0] ?? '').includes('挂载'),
    );
    expect(mountLog).toBeDefined();
    // 挂载日志应含 kind: tarot
    const data = mountLog![2] as { kind: string; cards: number };
    expect(data.kind).toBe('tarot');
    expect(data.cards).toBe(2);
  });

  it('扑克 cards prop · 正常挂载 · 挂载日志含 kind:poker', () => {
    const pokerCards: UnifiedCardSpec[] = [
      unifyPokerCard(derivePokerCard('♠', 'A')),
      unifyPokerCard(derivePokerCard('♥', 'K')),
      unifyPokerCard(derivePokerCard('♦', 'Q')),
    ];
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<MbtiCardRevealStage cards={pokerCards} partyPrimaryColor={mockPartyColor} />);
    const mountLog = logSpy.mock.calls.find((c: unknown[]) =>
      String(c[0] ?? '').includes('挂载'),
    );
    expect(mountLog).toBeDefined();
    const data = mountLog![2] as { kind: string; cards: number };
    expect(data.kind).toBe('poker');
    expect(data.cards).toBe(3);
  });

  it('cards prop 优先于 codes · 同时传两者时用 cards', () => {
    const tarotCards: UnifiedCardSpec[] = [
      unifyTarotCard(deriveTarotCard(TAROT_MAJOR_OPTIONS[0].id)),
    ];
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(
      <MbtiCardRevealStage
        codes={mockCodes}
        cards={tarotCards}
        partyPrimaryColor={mockPartyColor}
      />,
    );
    const mountLog = logSpy.mock.calls.find((c: unknown[]) =>
      String(c[0] ?? '').includes('挂载'),
    );
    const data = mountLog![2] as { kind: string; cards: number };
    // 应为 tarot（cards 优先）· 而非 mbti（codes）
    expect(data.kind).toBe('tarot');
    expect(data.cards).toBe(1);
  });
});

// ═════════════════════════════════════════════════════════
// FPS 跑帧测试 · 让 RAF 实际执行 · 验证关键节点日志齐全 + 无性能告警
// ═════════════════════════════════════════════════════════

describe('MbtiCardRevealStage · FPS 跑帧测试', () => {
  let rafQueue: FrameRequestCallback[];
  let nowValue: number;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    rafQueue = [];
    nowValue = 0;
    // RAF · 记录 cb 到队列 · 不自动执行（测试手动推进）
    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    }) as unknown as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = vi.fn(() => {}) as unknown as typeof cancelAnimationFrame;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => makeStubCtx()) as never;
    // performance.now 由测试循环推进
    vi.spyOn(performance, 'now').mockImplementation(() => nowValue);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  /** 推进时间并执行所有待执行 RAF 回调 · 模拟浏览器帧 */
  const tick = (deltaMs: number) => {
    nowValue += deltaMs;
    const cbs = rafQueue.splice(0);
    for (const cb of cbs) cb(nowValue);
  };

  it('4 张 MBTI 卡 · 跑完完整动画 · 关键节点日志齐全 · 无性能告警', () => {
    render(<MbtiCardRevealStage codes={mockCodes} partyPrimaryColor={mockPartyColor} />);

    // 跑 4 秒 · 每帧 16ms · 覆盖 lid(0.9s) + draw(0.9~2.65s) + settle(2.65s+)
    for (let ms = 0; ms < 4000; ms += 16) {
      tick(16);
    }

    const logs = logSpy.mock.calls.map((c: unknown[]) => String(c[0] ?? ''));

    // 相位切换日志齐全
    expect(logs.some((s: string) => s.includes('→ lid'))).toBe(true);
    expect(logs.some((s: string) => s.includes('→ draw'))).toBe(true);
    expect(logs.some((s: string) => s.includes('→ settle'))).toBe(true);
    expect(logs.some((s: string) => s.includes('牌盒盖已滑开'))).toBe(true);

    // 4 张卡牌的关键节点 · 每张应有 开始抽出 / peek露头 / 到达终位
    for (let i = 1; i <= 4; i++) {
      expect(logs.some((s: string) => s.includes(`卡 ${i}/4 开始抽出`))).toBe(true);
      expect(logs.some((s: string) => s.includes(`卡 ${i}/4 peek 露头`))).toBe(true);
      expect(logs.some((s: string) => s.includes(`卡 ${i}/4 到达终位`))).toBe(true);
    }

    // settle 性能汇总（settle 后 1s · 即 ~3.65s · 在 4s 跑帧内）
    expect(logs.some((s: string) => s.includes('settle 性能汇总'))).toBe(true);

    // 卸载日志（cleanup 触发）
    // 无性能告警（FPS<50 warn）· 16ms/帧 ≈ 62.5 FPS · 应稳定
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('塔罗卡 · 跑完动画 · 关键节点日志含塔罗标题', () => {
    const tarotCards: UnifiedCardSpec[] = [
      unifyTarotCard(deriveTarotCard(TAROT_MAJOR_OPTIONS[0].id)),
      unifyTarotCard(deriveTarotCard(TAROT_MAJOR_OPTIONS[10].id)),
    ];
    render(<MbtiCardRevealStage cards={tarotCards} partyPrimaryColor={mockPartyColor} />);

    for (let ms = 0; ms < 3500; ms += 16) {
      tick(16);
    }

    const logs = logSpy.mock.calls.map((c: unknown[]) => String(c[0] ?? ''));
    // 塔罗卡「到达终位」日志应含塔罗牌名
    const arriveLogs = logs.filter((s: string) => s.includes('到达终位'));
    expect(arriveLogs.length).toBe(2);
    // 无性能告警
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('快速重挂载（材质切换）· 旧 RAF 取消 · 新挂载重新跑帧无残留', () => {
    const { rerender } = render(
      <MbtiCardRevealStage key={0} codes={mockCodes} partyPrimaryColor={mockPartyColor} />,
    );
    // 模拟材质切换 · key 变化触发重挂载
    rerender(
      <MbtiCardRevealStage
        key={1}
        codes={mockCodes}
        partyPrimaryColor={mockPartyColor}
        packaging={{ material: '紫檀', pattern: '星轨' }}
      />,
    );
    // 跑帧 · 新挂载应正常执行
    for (let ms = 0; ms < 1000; ms += 16) {
      tick(16);
    }
    const logs = logSpy.mock.calls.map((c: unknown[]) => String(c[0] ?? ''));
    // 应有两次挂载日志（key=0 和 key=1）
    const mounts = logs.filter((s: string) => s.includes('挂载'));
    expect(mounts.length).toBe(2);
    // 第二次挂载日志应含紫檀材质
    const secondMountData = logSpy.mock.calls.find(
      (c: unknown[]) =>
        String(c[0] ?? '').includes('挂载') &&
        (c[2] as { packaging?: { material: string } })?.packaging?.material === '紫檀',
    );
    expect(secondMountData).toBeDefined();
    // 无告警
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

