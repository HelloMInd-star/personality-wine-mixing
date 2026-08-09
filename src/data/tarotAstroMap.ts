/**
 * 塔罗 ↔ 星体系 · 22 大阿尔卡纳与太阳系星体 / 占星学对应
 *
 * 对应体系（用户指定）：
 *   ① 22 大阿尔卡纳 ↔ 太阳系星体 / 黄道星座
 *   ② 4 个轨道环按四元素分组 · 火(内) → 土 → 风 → 水(外)
 *   ③ 颜色复用元素派色 · 与 cardCustomization 的 TAROT_ELEMENT_COLOR 一致
 *
 * 用于 PersonalityPage 入口星系动画：22 颗星体环绕中央种子 ·
 * 点击对应星体 → 揭示其塔罗牌。
 */

export type CelestialType = 'planet' | 'sign';
export type AstroElement = '火' | '水' | '风' | '土';

export interface TarotAstroEntry {
  /** 塔罗牌 id · 对应 tarotCards.ts 的 TarotCard.id (0-21) */
  tarotId: number;
  /** 塔罗牌中文名 · 如「愚者」 */
  tarotName: string;
  /** 星体 / 星座名 · 如「天王星」「白羊座」 */
  celestialName: string;
  /** 类型 · 行星 或 星座 */
  celestialType: CelestialType;
  /** 占星符号 · ☿ ♀ ♂ ♅ 等 */
  symbol: string;
  /** 元素 · 火/水/风/土 · 决定轨道环与颜色 */
  element: AstroElement;
  /** 轨道环索引 · 0 内 → 3 外 */
  ring: number;
  /** 在环上的初始角度（弧度）· 由元素分组均匀分布 */
  angle: number;
  /** 星体颜色 · 派生自元素 */
  color: string;
}

/** 元素 → 颜色 · 复用 cardCustomization 的 TAROT_ELEMENT_COLOR */
export const TAROT_ASTRO_ELEMENT_COLOR: Record<AstroElement, string> = {
  火: '#c4392f', // 烈焰红
  土: '#8f5a3c', // 大地棕
  风: '#9b7bd4', // 灵风紫
  水: '#5a9bbf', // 深海蓝
};

/** 元素 → 轨道环（0 内 → 3 外）· 火最内（热而快）水最外（柔而慢） */
const ELEMENT_RING: Record<AstroElement, number> = {
  火: 0,
  土: 1,
  风: 2,
  水: 3,
};

/** 22 条对应关系 · 顺序按塔罗 id 0-21 · 牌名内联避免运行时查表 */
const RAW_MAP: Array<{
  tarotId: number;
  tarotName: string;
  celestialName: string;
  celestialType: CelestialType;
  symbol: string;
  element: AstroElement;
}> = [
  { tarotId: 0, tarotName: '愚者', celestialName: '天王星', celestialType: 'planet', symbol: '♅', element: '风' },
  { tarotId: 1, tarotName: '魔术师', celestialName: '水星', celestialType: 'planet', symbol: '☿', element: '风' },
  { tarotId: 2, tarotName: '女祭司', celestialName: '月亮', celestialType: 'planet', symbol: '☾', element: '水' },
  { tarotId: 3, tarotName: '皇后', celestialName: '金星', celestialType: 'planet', symbol: '♀', element: '土' },
  { tarotId: 4, tarotName: '皇帝', celestialName: '白羊座', celestialType: 'sign', symbol: '♈', element: '火' },
  { tarotId: 5, tarotName: '教皇', celestialName: '金牛座', celestialType: 'sign', symbol: '♉', element: '土' },
  { tarotId: 6, tarotName: '恋人', celestialName: '双子座', celestialType: 'sign', symbol: '♊', element: '风' },
  { tarotId: 7, tarotName: '战车', celestialName: '巨蟹座', celestialType: 'sign', symbol: '♋', element: '水' },
  { tarotId: 8, tarotName: '力量', celestialName: '狮子座', celestialType: 'sign', symbol: '♌', element: '火' },
  { tarotId: 9, tarotName: '隐者', celestialName: '处女座', celestialType: 'sign', symbol: '♍', element: '土' },
  { tarotId: 10, tarotName: '命运之轮', celestialName: '木星', celestialType: 'planet', symbol: '♃', element: '火' },
  { tarotId: 11, tarotName: '正义', celestialName: '天秤座', celestialType: 'sign', symbol: '♎', element: '风' },
  { tarotId: 12, tarotName: '倒吊人', celestialName: '海王星', celestialType: 'planet', symbol: '♆', element: '水' },
  { tarotId: 13, tarotName: '死神', celestialName: '天蝎座', celestialType: 'sign', symbol: '♏', element: '水' },
  { tarotId: 14, tarotName: '节制', celestialName: '射手座', celestialType: 'sign', symbol: '♐', element: '火' },
  { tarotId: 15, tarotName: '恶魔', celestialName: '摩羯座', celestialType: 'sign', symbol: '♑', element: '土' },
  { tarotId: 16, tarotName: '高塔', celestialName: '火星', celestialType: 'planet', symbol: '♂', element: '火' },
  { tarotId: 17, tarotName: '星星', celestialName: '水瓶座', celestialType: 'sign', symbol: '♒', element: '风' },
  { tarotId: 18, tarotName: '月亮', celestialName: '双鱼座', celestialType: 'sign', symbol: '♓', element: '水' },
  { tarotId: 19, tarotName: '太阳', celestialName: '太阳', celestialType: 'planet', symbol: '☉', element: '火' },
  { tarotId: 20, tarotName: '审判', celestialName: '冥王星', celestialType: 'planet', symbol: '♇', element: '水' },
  { tarotId: 21, tarotName: '世界', celestialName: '土星', celestialType: 'planet', symbol: '♄', element: '土' },
];

/** 按元素分组计算每条在环上的均匀角度 · 加元素偏移避免完美对齐 */
function buildEntries(): TarotAstroEntry[] {
  const counts: Record<AstroElement, number> = { 火: 0, 土: 0, 风: 0, 水: 0 };
  for (const r of RAW_MAP) counts[r.element]++;
  const counters: Record<AstroElement, number> = { 火: 0, 土: 0, 风: 0, 水: 0 };
  return RAW_MAP.map((r) => {
    const total = counts[r.element];
    const idx = counters[r.element]++;
    // 均匀分布 · 以元素字首码做小偏移 · 打破环间对齐
    const angle = (idx / total) * Math.PI * 2 + (r.element.charCodeAt(0) % 7) * 0.18;
    return {
      tarotId: r.tarotId,
      tarotName: r.tarotName,
      celestialName: r.celestialName,
      celestialType: r.celestialType,
      symbol: r.symbol,
      element: r.element,
      ring: ELEMENT_RING[r.element],
      angle,
      color: TAROT_ASTRO_ELEMENT_COLOR[r.element],
    };
  });
}

export const TAROT_ASTRO_MAP: TarotAstroEntry[] = buildEntries();

export function getAstroByTarotId(tarotId: number): TarotAstroEntry | undefined {
  return TAROT_ASTRO_MAP.find((e) => e.tarotId === tarotId);
}
