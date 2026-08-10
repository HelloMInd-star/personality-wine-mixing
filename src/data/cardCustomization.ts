/**
 * 卡牌定制数据 · 周边产品牌定制系统
 *
 * Y.Mine 周边产品牌定制层 · 与牌类人格采集（CardsPage）解耦：
 *   CardsPage 四套牌（塔罗/星盘/扑克/德州）→ 六维向量 → 调酒
 *   本层（cardCustomization）→ 包装样式 + 三类定制卡 → 牌盒取出动画
 *
 * 当前阶段完成：
 *   ① 包装定制 · 4 种材质 + 4 种烫金纹样
 *   ② MBTI 人格卡片 · 16 型组合字母 + 昵称 + 诗化短语
 *   ③ 塔罗牌定制 · 78 张（22 大阿尔卡纳手写 + 56 小阿尔卡纳）· 正逆位 · 元素派色
 *   ④ 扑克牌定制 · 4 花色 × 13 点数 · 红黑派色
 *   ⑤ 酒局基调色融合 · 所有卡片底色统一为酒局主色（不抢底）
 *
 * 三类卡片共用同一包装（材质+纹样）与酒局基调底色，
 * 在 MbtiCardRevealStage 牌盒取出动画中统一渲染。
 */

import { getMbtiProfile } from './mbtiPartyData';
import { TAROT_CARDS, getTarotCardById } from './tarotCards';
import type { MbtiCode } from '../types/mbtiParty';
import type { PokerSuit, PokerRank } from '../types/personaFusion';

// ═════════════════════════════════════════════════════════
// 包装定制 · 材质 + 烫金纹样
// ═════════════════════════════════════════════════════════

export type PackagingMaterial = '夜绒' | '镜纸' | '紫檀' | '雾锡';
export type GoldPattern = '星轨' | '镜月' | '潮汐' | '无纹';

export interface PackagingStyle {
  id: PackagingMaterial;
  label: string;
  /** 牌盒底色 · hex */
  boxBase: string;
  /** 牌盒高光色 · hex */
  boxHighlight: string;
  /** 牌盒内壁色 · hex · 抽出卡片时透出的暗色 */
  boxInner: string;
  /** 材质文案 */
  desc: string;
}

/** 4 种包装材质 · 呼应深空紫金基调 */
export const PACKAGING_STYLES: PackagingStyle[] = [
  {
    id: '夜绒',
    label: '夜绒',
    boxBase: '#15102e',
    boxHighlight: '#2d1b4e',
    boxInner: '#0a0620',
    desc: '深空绒面 · 吸光而不刺目',
  },
  {
    id: '镜纸',
    label: '镜纸',
    boxBase: '#2a2150',
    boxHighlight: '#5a4a8f',
    boxInner: '#1a1538',
    desc: '半透镜面 · 倒映杯中星',
  },
  {
    id: '紫檀',
    label: '紫檀',
    boxBase: '#3a2616',
    boxHighlight: '#6b4a2c',
    boxInner: '#1f1408',
    desc: '紫檀木纹 · 旧馆的温度',
  },
  {
    id: '雾锡',
    label: '雾锡',
    boxBase: '#3a3f4a',
    boxHighlight: '#6a7080',
    boxInner: '#1f2228',
    desc: '雾锡磨砂 · 雨夜金属感',
  },
];

export interface GoldPatternSpec {
  id: GoldPattern;
  label: string;
  /** 纹样符号 · 牌盒盖中央装饰 */
  symbol: string;
  desc: string;
}

export const GOLD_PATTERNS: GoldPatternSpec[] = [
  { id: '星轨', label: '星轨', symbol: '✦', desc: '细金线弧 · 像未启的夜路' },
  { id: '镜月', label: '镜月', symbol: '☾', desc: '一轮金月 · 悬于牌盒中央' },
  { id: '潮汐', label: '潮汐', symbol: '∿', desc: '金波纹 · 像酒面渐起' },
  { id: '无纹', label: '无纹', symbol: '·', desc: '不施金线 · 让底色说话' },
];

export interface PackagingConfig {
  material: PackagingMaterial;
  pattern: GoldPattern;
}

export const DEFAULT_PACKAGING: PackagingConfig = {
  material: '夜绒',
  pattern: '镜月',
};

/** 取包装样式预设 · 未知材质退回夜绒 */
export function getPackagingStyle(material: PackagingMaterial): PackagingStyle {
  return PACKAGING_STYLES.find((s) => s.id === material) ?? PACKAGING_STYLES[0];
}

/** 取烫金纹样预设 · 未知纹样退回镜月 */
export function getGoldPattern(pattern: GoldPattern): GoldPatternSpec {
  return GOLD_PATTERNS.find((g) => g.id === pattern) ?? GOLD_PATTERNS[1];
}

// ═════════════════════════════════════════════════════════
// MBTI 人格卡片 · 16 型组合字母
// ═════════════════════════════════════════════════════════

export interface MbtiCardSpec {
  code: MbtiCode;
  /** 卡片标题 · 人格昵称 */
  nickname: string;
  /** 单字符号 */
  symbol: string;
  /** 4 字母拆分 · 用于组合展示（如 ['I','N','T','J']） */
  letters: string[];
  /** 诗化短语 · 卡片底部 */
  poem: string;
  /** 卡片人格主色 · 派生自 MBTI_PARTICLE_MAP · 用于字母高亮与细线 */
  primary: string;
  /** 卡片强调色 */
  accent: string;
  /** 三级人格标签 · 如 "谋略者·敛·锐" · 由 mbtiToBaseVector + derivePersonaTag 派生 */
  personaTag: string;
}

/** 由 MBTI 码派生卡片规格 · 复用 MBTI_PARTICLE_MAP 的色系与昵称 */
export function deriveMbtiCard(code: MbtiCode): MbtiCardSpec {
  const p = getMbtiProfile(code);
  return {
    code,
    nickname: p.nickname,
    symbol: p.symbol,
    letters: code.toUpperCase().split(''),
    poem: p.poem,
    primary: p.primary,
    accent: p.accent,
    personaTag: p.personaTag,
  };
}

/** 批量派生 · 用于酒局揭示时构造所有玩家的卡片 */
export function deriveMbtiCards(codes: MbtiCode[]): MbtiCardSpec[] {
  return codes.map(deriveMbtiCard);
}

// ═════════════════════════════════════════════════════════
// 塔罗牌定制 · 78 张 · 正逆位 · 元素派色
// ═════════════════════════════════════════════════════════

/** 塔罗元素 → 主色/强调色映射 · 呼应四元素气质 */
const TAROT_ELEMENT_COLOR: Record<string, { primary: string; accent: string }> = {
  火: { primary: '#c4392f', accent: '#e87060' }, // 烈焰红
  水: { primary: '#5a9bbf', accent: '#9bd1e8' }, // 深海蓝
  风: { primary: '#9b7bd4', accent: '#c8a5e0' }, // 灵风紫
  土: { primary: '#8f5a3c', accent: '#c4856b' }, // 大地棕
};

export interface TarotCardSpec {
  /** 牌 id · 对应 tarotCards.ts 的 TarotCard.id */
  cardId: number;
  /** 中文牌名 · 如「愚者」 */
  name: string;
  /** 英文牌名 · 如 The Fool */
  nameEn: string;
  /** 大/小阿尔卡纳 */
  arcana: 'major' | 'minor';
  /** 元素 · 火/水/风/土 */
  element: string;
  /** 是否逆位 */
  isReversed: boolean;
  /** 牌义摘要 · 正位或逆位对应文案 */
  meaning: string;
  /** 主色 · 由元素派生 · 用于牌面高亮 */
  primary: string;
  /** 强调色 */
  accent: string;
  /** 单字符号 · 牌面角落 · 取牌名首字 */
  symbol: string;
}

/** 由牌 id + 正逆位派生塔罗定制卡 · 未知 id 退回愚者 */
export function deriveTarotCard(cardId: number, isReversed = false): TarotCardSpec {
  const card = getTarotCardById(cardId) ?? TAROT_CARDS[0];
  const colors = TAROT_ELEMENT_COLOR[card.element] ?? TAROT_ELEMENT_COLOR.风;
  return {
    cardId: card.id,
    name: card.name,
    nameEn: card.nameEn,
    arcana: card.arcana,
    element: card.element,
    isReversed,
    meaning: isReversed ? card.meaningReversed : card.meaningUpright,
    primary: colors.primary,
    accent: colors.accent,
    symbol: card.name.charAt(0),
  };
}

/** 大阿尔卡纳选项 · 用于定制选择器（22 张） */
export const TAROT_MAJOR_OPTIONS = TAROT_CARDS.filter((c) => c.arcana === 'major').map((c) => ({
  id: c.id,
  name: c.name,
  nameEn: c.nameEn,
  element: c.element,
}));

// ═════════════════════════════════════════════════════════
// 扑克牌定制 · 4 花色 × 13 点数 · 红黑派色
// ═════════════════════════════════════════════════════════

/** 扑克花色 → 主色/强调色 + 单字符号 */
const POKER_SUIT_META: Record<PokerSuit, { primary: string; accent: string; symbol: string; label: string }> = {
  '♥': { primary: '#c4392f', accent: '#e87060', symbol: '心', label: '红心' },
  '♦': { primary: '#d4673c', accent: '#f0a070', symbol: '方', label: '方块' },
  '♠': { primary: '#5a4a8f', accent: '#9b7bd4', symbol: '黑', label: '黑桃' },
  '♣': { primary: '#4d6b8f', accent: '#8aa5c4', symbol: '梅', label: '梅花' },
};

export interface PokerCardSpec {
  suit: PokerSuit;
  rank: PokerRank;
  /** 花色中文标签 · 如「红心」 */
  suitLabel: string;
  /** 主色 · 红色花色暖红 / 黑色花色冷紫蓝 */
  primary: string;
  /** 强调色 */
  accent: string;
  /** 单字符号 · 牌面角落 */
  symbol: string;
}

/** 由花色 + 点数派生扑克定制卡 */
export function derivePokerCard(suit: PokerSuit, rank: PokerRank): PokerCardSpec {
  const meta = POKER_SUIT_META[suit];
  return {
    suit,
    rank,
    suitLabel: meta.label,
    primary: meta.primary,
    accent: meta.accent,
    symbol: meta.symbol,
  };
}

/** 扑克花色选项 · 用于定制选择器 */
export const POKER_SUIT_OPTIONS: { suit: PokerSuit; label: string; symbol: string }[] = (
  ['♠', '♥', '♦', '♣'] as PokerSuit[]
).map((suit) => ({
  suit,
  label: POKER_SUIT_META[suit].label,
  symbol: suit,
}));

/** 扑克点数选项 */
export const POKER_RANK_OPTIONS: PokerRank[] = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
];

// ═════════════════════════════════════════════════════════
// 统一卡片规格 · 三类卡片归一 · 供 MbtiCardRevealStage 渲染
// ═════════════════════════════════════════════════════════

/** 卡片类型 · 区分三类定制卡 */
export type CardKind = 'mbti' | 'tarot' | 'poker';

/**
 * 统一卡片规格 · 三类卡片归一为同一渲染契约
 * MbtiCardRevealStage 仅消费此结构 · 不关心原始类型
 */
export interface UnifiedCardSpec {
  kind: CardKind;
  /** 主标题 · MBTI 码 / 塔罗牌名 / 扑克点数 */
  title: string;
  /** 副标题 · 昵称 / 英文名 / 花色标签 */
  subtitle: string;
  /** 单字符号 · 牌面角落 */
  symbol: string;
  /** 底部诗化短语 / 牌义摘要 */
  caption: string;
  /** 人格主色 · 用于字母/牌面高亮 */
  primary: string;
  /** 强调色 */
  accent: string;
  /** 三级人格标签 · 仅 MBTI 卡有效 · 塔罗/扑克卡为空字符串 */
  personaTag: string;
}

/** MBTI 卡 → 统一规格 */
export function unifyMbtiCard(card: MbtiCardSpec): UnifiedCardSpec {
  return {
    kind: 'mbti',
    title: card.code,
    subtitle: card.nickname,
    symbol: card.symbol,
    caption: card.poem,
    primary: card.primary,
    accent: card.accent,
    personaTag: card.personaTag,
  };
}

/** 塔罗卡 → 统一规格 · 逆位时标题加「·逆」 */
export function unifyTarotCard(card: TarotCardSpec): UnifiedCardSpec {
  return {
    kind: 'tarot',
    title: card.isReversed ? `${card.name}·逆` : card.name,
    subtitle: card.nameEn,
    symbol: card.symbol,
    caption: card.meaning,
    primary: card.primary,
    accent: card.accent,
    personaTag: '',
  };
}

/** 扑克卡 → 统一规格 · 标题为「点数+花色」 */
export function unifyPokerCard(card: PokerCardSpec): UnifiedCardSpec {
  return {
    kind: 'poker',
    title: `${card.rank}${card.suit}`,
    subtitle: card.suitLabel,
    symbol: card.symbol,
    caption: `${card.suitLabel} · ${card.rank}`,
    primary: card.primary,
    accent: card.accent,
    personaTag: '',
  };
}

// ═════════════════════════════════════════════════════════
// 酒局基调色融合 · 卡片底色统一
// ═════════════════════════════════════════════════════════

/**
 * 颜色工具 · hex → rgb / 混合 / 调暗
 * 约束：仅接受 #rrggbb · 与 hexToRgba 全局约定一致
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** 混合两色 · t=0 返回 a · t=1 返回 b */
function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
}

/**
 * 卡片统一调色板 · 由酒局主色派生
 *
 * 用户要求：「背景和底色统一综合酒局的调」
 *   - 所有卡片共享同一底色 · 由 fusion.primaryColor 派生
 *   - 各卡片仅用人格主色作为字母高亮与细线 · 不抢底
 *   - 底色 = 酒局主色 与 深空底 (#070414) 混合 · 调暗至 28% 亮度
 *     避免亮色酒局（如 ESFP 亮金）导致卡片底色过亮刺目
 */
export interface CardPalette {
  /** 卡片统一底色 · 深色版酒局主色 */
  cardBase: string;
  /** 卡片统一暗角 · 更深的同色 */
  cardShadow: string;
  /** 卡片顶部高光 · 略亮的同色 */
  cardTopGlow: string;
  /** 牌盒金线 · 固定金 */
  goldLine: string;
  /** 牌盒内壁 · 包装材质的内壁色 */
  boxInner: string;
}

export function deriveCardPalette(
  partyPrimaryColor: string,
  packaging: PackagingConfig = DEFAULT_PACKAGING,
): CardPalette {
  const VOID = '#070414';
  // 底色 = 酒局主色 28% + 深空底 72% · 保证深色基调
  const cardBase = mixHex(VOID, partyPrimaryColor, 0.28);
  // 暗角 = 再向深空底压低 14%
  const cardShadow = mixHex(VOID, partyPrimaryColor, 0.14);
  // 顶部高光 = 酒局主色 45% + 深空底
  const cardTopGlow = mixHex(VOID, partyPrimaryColor, 0.45);
  const boxInner = getPackagingStyle(packaging.material).boxInner;
  return {
    cardBase,
    cardShadow,
    cardTopGlow,
    goldLine: '#f0c674',
    boxInner,
  };
}

// ═════════════════════════════════════════════════════════
// 持久化 · localStorage · 用户在 CardsPage 选定的包装偏好
// ═════════════════════════════════════════════════════════

const PACKAGING_STORAGE_KEY = 'y-mine-packaging-config';

export function loadPackagingConfig(): PackagingConfig {
  try {
    const raw = localStorage.getItem(PACKAGING_STORAGE_KEY);
    if (!raw) return DEFAULT_PACKAGING;
    const parsed = JSON.parse(raw) as Partial<PackagingConfig>;
    return {
      material: parsed.material ?? DEFAULT_PACKAGING.material,
      pattern: parsed.pattern ?? DEFAULT_PACKAGING.pattern,
    };
  } catch {
    return DEFAULT_PACKAGING;
  }
}

export function savePackagingConfig(config: PackagingConfig): void {
  try {
    localStorage.setItem(PACKAGING_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // 静默失败 · localStorage 不可用时不阻塞 UI
  }
}
