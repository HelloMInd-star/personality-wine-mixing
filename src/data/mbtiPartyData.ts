/**
 * MBTI 酒局数据预设
 *
 * 包含：
 *   - 4 张酒桌（INTJ 局 / ENFP 局 / 自由 / 自由）
 *   - 16 型 MBTI 粒子色映射（含符号、昵称、诗化短语）
 *   - 4 座位环形位置
 *   - 调酒步骤可选项
 *   - 联合酒体融合算法（综合人格向量色 + 匹配度）
 *
 * 配色逻辑：
 *   用户文档示例：
 *     INTJ → 冷蓝紫   INFP → 柔粉   ENFP → 暖橙   ENTJ → 深红
 *   派生规则：分析者(NT) → 冷色 / 外向者(E) → 暖色 / 情感者(F) → 柔色 / 实感者(S) → 偏稳
 */

import type {
  PartyTable,
  MbtiParticleProfile,
  SeatPosition,
  MixChoice,
  FusionCocktail,
  MbtiCode,
} from '../types/mbtiParty';
import type { RoleType } from '../types/role';

// ═════════════════════════════════════════════════════════
// 16 型 MBTI 粒子色映射
// ═════════════════════════════════════════════════════════

export const MBTI_PARTICLE_MAP: Record<MbtiCode, MbtiParticleProfile> = {
  // 分析者 NT · 冷色调
  INTJ: {
    code: 'INTJ',
    primary: '#6b7fd4',
    accent: '#a8b5f0',
    symbol: '策',
    nickname: '黑暗先知',
    poem: '冷蓝紫粒子 · 像深夜未启的星辰',
  },
  INTP: {
    code: 'INTP',
    primary: '#5a9bbf',
    accent: '#9bd1e8',
    symbol: '思',
    nickname: '逻辑构建者',
    poem: '青蓝粒子 · 像不断重组的方程',
  },
  ENTJ: {
    code: 'ENTJ',
    primary: '#c4392f',
    accent: '#e87060',
    symbol: '统',
    nickname: '统帅',
    poem: '深红粒子 · 像握紧的指挥棒',
  },
  ENTP: {
    code: 'ENTP',
    primary: '#d4673c',
    accent: '#f0a070',
    symbol: '辩',
    nickname: '辩论家',
    poem: '橙红粒子 · 像永远未熄的火花',
  },

  // 外交家 NF · 柔色调
  INFJ: {
    code: 'INFJ',
    primary: '#9d6bbf',
    accent: '#c8a5e0',
    symbol: '倡',
    nickname: '提倡者',
    poem: '暮紫粒子 · 像夜深处的一盏灯',
  },
  INFP: {
    code: 'INFP',
    primary: '#e08ec0',
    accent: '#f5c5dc',
    symbol: '调',
    nickname: '调停者',
    poem: '柔粉粒子 · 像清晨第一缕光',
  },
  ENFJ: {
    code: 'ENFJ',
    primary: '#e09b5f',
    accent: '#f5c896',
    symbol: '主',
    nickname: '主人公',
    poem: '暖金粒子 · 像酒馆里最暖的灯',
  },
  ENFP: {
    code: 'ENFP',
    primary: '#e88a3c',
    accent: '#f5b885',
    symbol: '竞',
    nickname: '竞选者',
    poem: '暖橙粒子 · 像夏日午后的蜜桃',
  },

  // 守护者 SJ · 稳色调
  ISTJ: {
    code: 'ISTJ',
    primary: '#4d6b8f',
    accent: '#8aa5c4',
    symbol: '务',
    nickname: '物流师',
    poem: '深蓝粒子 · 像旧书页与雨夜',
  },
  ISFJ: {
    code: 'ISFJ',
    primary: '#8fa86b',
    accent: '#c4d49b',
    symbol: '守',
    nickname: '守卫者',
    poem: '苔绿粒子 · 像清晨湿润的草地',
  },
  ESTJ: {
    code: 'ESTJ',
    primary: '#8f5a3c',
    accent: '#c4856b',
    symbol: '总',
    nickname: '总经理',
    poem: '焦糖粒子 · 像陈年橡木桶',
  },
  ESFJ: {
    code: 'ESFJ',
    primary: '#c4856b',
    accent: '#e8b09b',
    symbol: '执',
    nickname: '执政官',
    poem: '暖陶粒子 · 像家中的暖光餐桌',
  },

  // 探险家 SP · 明色调
  ISTP: {
    code: 'ISTP',
    primary: '#5abfbf',
    accent: '#9be0e0',
    symbol: '匠',
    nickname: '鉴赏家',
    poem: '青绿粒子 · 像雨后的金属光泽',
  },
  ISFP: {
    code: 'ISFP',
    primary: '#c46bb0',
    accent: '#e8a5d8',
    symbol: '探',
    nickname: '探险家',
    poem: '紫粉粒子 · 像未完成的画',
  },
  ESTP: {
    code: 'ESTP',
    primary: '#bf6b3c',
    accent: '#e09b6b',
    symbol: '企',
    nickname: '企业家',
    poem: '焦橙粒子 · 像赛车场的尾焰',
  },
  ESFP: {
    code: 'ESFP',
    primary: '#e0b53c',
    accent: '#f5d985',
    symbol: '表',
    nickname: '表演者',
    poem: '亮金粒子 · 像聚光灯下的杯沿',
  },
};

/** 取 MBTI 粒子配置 · 未知类型退回紫金基调 */
export function getMbtiProfile(code: MbtiCode): MbtiParticleProfile {
  return (
    MBTI_PARTICLE_MAP[code.toUpperCase()] ?? {
      code,
      primary: '#7c5fbf',
      accent: '#d8c9f5',
      symbol: '？',
      nickname: '神秘客',
      poem: '紫金粒子 · 像未明的星辰',
    }
  );
}

// ═════════════════════════════════════════════════════════
// 酒桌预设 · 4 张
// ═════════════════════════════════════════════════════════

export const PARTY_TABLES: PartyTable[] = [
  {
    id: 1,
    label: '桌1 · INTJ 局',
    lockMode: 'locked',
    lockedMbti: 'INTJ',
    seatCount: 4,
    seatCapacity: 4,
    status: 'full',
    accentColor: MBTI_PARTICLE_MAP.INTJ.primary,
    tagline: '策者之夜 · 沉默而锋利',
  },
  {
    id: 2,
    label: '桌2 · ENFP 局',
    lockMode: 'locked',
    lockedMbti: 'ENFP',
    seatCount: 3,
    seatCapacity: 4,
    status: 'waiting',
    accentColor: MBTI_PARTICLE_MAP.ENFP.primary,
    tagline: '焰心之约 · 让火花成为主角',
  },
  {
    id: 3,
    label: '桌3 · 自由',
    lockMode: 'free',
    seatCount: 0,
    seatCapacity: 4,
    status: 'empty',
    accentColor: '#7c5fbf',
    tagline: '不限人格 · 任你以谁入桌',
  },
  {
    id: 4,
    label: '桌4 · 自由',
    lockMode: 'free',
    seatCount: 0,
    seatCapacity: 4,
    status: 'empty',
    accentColor: '#a8842f',
    tagline: '不限人格 · 等一位不期而至的客人',
  },
];

// ═════════════════════════════════════════════════════════
// 座位位置 · 4 座位环形分布（半俯视图）
// ═════════════════════════════════════════════════════════

export const SEAT_POSITIONS: SeatPosition[] = [
  { angle: Math.PI / 2, radius: 0.78 }, // 下方 · 当前用户默认位
  { angle: Math.PI, radius: 0.78 }, // 左方
  { angle: -Math.PI / 2, radius: 0.78 }, // 上方
  { angle: 0, radius: 0.78 }, // 右方
];

// ═════════════════════════════════════════════════════════
// 调酒步骤选项 · 模拟博弈台
// ═════════════════════════════════════════════════════════

export const MIX_OPTIONS: Record<
  'base' | 'flavor' | 'temperature' | 'garnish',
  MixChoice[]
> = {
  base: [
    { step: 'base', label: '威士忌', particleColor: '#c4853c' },
    { step: 'base', label: '金酒', particleColor: '#9bd1c4' },
    { step: 'base', label: '朗姆', particleColor: '#e0b53c' },
    { step: 'base', label: '龙舌兰', particleColor: '#bf9b6b' },
  ],
  flavor: [
    { step: 'flavor', label: '辛辣', particleColor: '#c4392f' },
    { step: 'flavor', label: '木质', particleColor: '#8f5a3c' },
    { step: 'flavor', label: '果香', particleColor: '#e88a3c' },
    { step: 'flavor', label: '草本', particleColor: '#8fa86b' },
  ],
  temperature: [
    { step: 'temperature', label: '高温燃烧', particleColor: '#e06552' },
    { step: 'temperature', label: '低温慢饮', particleColor: '#5a9bbf' },
    { step: 'temperature', label: '常温结构', particleColor: '#9b7bd4' },
  ],
  garnish: [
    { step: 'garnish', label: '柑橘皮', particleColor: '#e0b53c' },
    { step: 'garnish', label: '樱桃', particleColor: '#c4392f' },
    { step: 'garnish', label: '薄荷', particleColor: '#8fa86b' },
    { step: 'garnish', label: '烟火', particleColor: '#d4673c' },
  ],
};

/** 调酒步骤标签与顺序 */
export const MIX_STEP_META: { step: 'base' | 'flavor' | 'temperature' | 'garnish'; label: string; hint: string }[] = [
  { step: 'base', label: '选基酒', hint: '决定酒体骨架' },
  { step: 'flavor', label: '选风味', hint: '叠加人格气质' },
  { step: 'temperature', label: '选温度', hint: '呼应角色倾向' },
  { step: 'garnish', label: '选装饰', hint: '收束这一杯' },
];

// ═════════════════════════════════════════════════════════
// Mock 玩家 · 用于在桌1/桌2 模拟已就位的客人
// ═════════════════════════════════════════════════════════

export interface MockPlayer {
  name: string;
  mbti: MbtiCode;
  role: RoleType;
  cocktailName: string;
}

/** 桌1 · INTJ 局 · 已满 4 人 */
export const TABLE1_MOCK_PLAYERS: MockPlayer[] = [
  { name: '夜行者', mbti: 'INTJ', role: 'architect', cocktailName: '协议分层' },
  { name: '镜', mbti: 'INTJ', role: 'investor', cocktailName: '原则桥水' },
  { name: '寒', mbti: 'INTJ', role: 'entrepreneur', cocktailName: '冷萃金酒' },
  { name: '痕', mbti: 'INTJ', role: 'architect', cocktailName: '内核纯净' },
];

/** 桌2 · ENFP 局 · 3/4 已就位（3 ENFP 同型共鸣测试场景） */
export const TABLE2_MOCK_PLAYERS: MockPlayer[] = [
  { name: '焰', mbti: 'ENFP', role: 'entrepreneur', cocktailName: '灵活鸡尾' },
  { name: '光', mbti: 'ENFP', role: 'entrepreneur', cocktailName: '设计甜香' },
  { name: '星', mbti: 'ENFP', role: 'entrepreneur', cocktailName: '创意火花' },
];

// ═════════════════════════════════════════════════════════
// 联合酒体融合算法
// ═════════════════════════════════════════════════════════

/** hex → {r,g,b} · 用于颜色平均融合 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/** {r,g,b} → hex */
function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 多色平均融合 · 用于联合酒体主色
 * 各 MBTI 主色平均得到融合主色 · 强调色取最亮
 */
function blendColors(colors: string[]): { primary: string; accent: string } {
  if (colors.length === 0) return { primary: '#7c5fbf', accent: '#d8c9f5' };
  const rgbs = colors.map(hexToRgb);
  const avg = {
    r: rgbs.reduce((s, c) => s + c.r, 0) / rgbs.length,
    g: rgbs.reduce((s, c) => s + c.g, 0) / rgbs.length,
    b: rgbs.reduce((s, c) => s + c.b, 0) / rgbs.length,
  };
  const brightest = rgbs.reduce((max, c) => (c.r + c.g + c.b > max.r + max.g + max.b ? c : max), rgbs[0]);
  return { primary: rgbToHex(avg), accent: rgbToHex(brightest) };
}

/** 联合酒体诗意命名 · 根据 MBTI 组合派生 */
function deriveFusionName(codes: MbtiCode[]): { name: string; subtitle: string; fusionLabel: string } {
  if (codes.length === 0) {
    return { name: '空桌之杯', subtitle: '夜未启 · 等一双手落下', fusionLabel: '尚未成酒' };
  }
  if (codes.length === 1) {
    const p = getMbtiProfile(codes[0]);
    return {
      name: `${p.nickname}的独酌`,
      subtitle: '一杯独饮，亦是夜的全部',
      fusionLabel: `${codes[0]} 的独饮`,
    };
  }
  const unique = Array.from(new Set(codes));
  if (unique.length === 1) {
    const p = getMbtiProfile(unique[0]);
    return {
      name: `${p.nickname}·共鸣之杯`,
      subtitle: '同型相聚 · 让一种气质反复回响',
      fusionLabel: `${unique[0]} × ${codes.length} 的共鸣`,
    };
  }
  // 多型融合 · 用首尾 MBTI 拼接张力
  const first = unique[0];
  const last = unique[unique.length - 1];
  return {
    name: '张力之杯',
    subtitle: '不同的星辰 · 在同一只杯里点亮',
    fusionLabel: `${first} × ${last} 的张力`,
  };
}

/** 计算匹配度 · MBTI 多样性越高分越高 · 同型相聚略低 */
function calcMatchScore(codes: MbtiCode[]): number {
  if (codes.length <= 1) return 60;
  const unique = new Set(codes).size;
  // 多样性 0-1 · 越多型越接近 1
  const diversity = unique / codes.length;
  // 座位满度加成
  const fillRatio = Math.min(1, codes.length / 4);
  const score = 50 + diversity * 30 + fillRatio * 20;
  return Math.round(Math.max(45, Math.min(98, score)));
}

/**
 * 计算联合酒体 · 由所有玩家 MBTI 融合
 * 边界：全同 MBTI 时跳过融合 · 直接返回该型基础酒体
 */
export function computeFusionCocktail(codes: MbtiCode[]): FusionCocktail {
  // 边界 · 全同 MBTI · 不计算融合 · 返回该型基础酒体（同型共鸣）
  if (codes.length > 1 && new Set(codes).size === 1) {
    const code = codes[0];
    const profile = getMbtiProfile(code);
    const fillRatio = Math.min(1, codes.length / 4);
    const baseScore = Math.round(60 + fillRatio * 15); // 同型共鸣基础分 60-75
    console.debug(
      `[Fusion] 同型共鸣 ${code}×${codes.length} → ${profile.nickname}·共鸣之杯 | 分 ${baseScore} | ${profile.primary}`,
    );
    return {
      name: `${profile.nickname}·共鸣之杯`,
      subtitle: '同型相聚 · 让一种气质反复回响',
      primaryColor: profile.primary,
      accentColor: profile.accent,
      matchScore: baseScore,
      fusionLabel: `${code} × ${codes.length} 的共鸣`,
      participants: codes,
    };
  }

  const colors = codes.map((c) => getMbtiProfile(c).primary);
  const { primary, accent } = blendColors(colors);
  const { name, subtitle, fusionLabel } = deriveFusionName(codes);
  const matchScore = calcMatchScore(codes);
  const uniqueCodes = Array.from(new Set(codes));
  console.debug(
    `[Fusion] ${codes.length}人 ${uniqueCodes.join('+')} → ${name} | 分 ${matchScore} | ${primary}`,
  );
  return {
    name,
    subtitle,
    primaryColor: primary,
    accentColor: accent,
    matchScore,
    fusionLabel,
    participants: codes,
  };
}

// ═════════════════════════════════════════════════════════
// 角色标签 · 复用 rolePersonas 但精简为酒局展示用
// ═════════════════════════════════════════════════════════

export const PARTY_ROLE_META: Record<RoleType, { label: string; symbol: string; color: string }> = {
  entrepreneur: { label: '创业家', symbol: '◈', color: '#e08a3c' },
  investor: { label: '投资人', symbol: '◇', color: '#7c9cbf' },
  architect: { label: '设计师', symbol: '◊', color: '#9b7bd4' },
};
