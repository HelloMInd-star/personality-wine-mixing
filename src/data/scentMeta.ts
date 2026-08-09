/**
 * 气味元数据 · 杯垫气味系统的单一数据源
 *
 * 三层映射：
 *   - 人格原型 → 签名气味（专属标识，全程不变）
 *   - 旅程阶段 → 主调气味（舒缓/活力/仪式/余韵）
 *   - 旅程阶段 → 扩散模式（breath/spread/burst/fade）
 *
 * 呼应「杯垫独立性」：配方可离线派生、可序列化导出
 * 每个人格原型一种气质签名，阶段决定主调与扩散节奏
 */

import type { JourneyPhase } from '../types/journey';
import type { ScentDiffusion } from '../types/journey';

/**
 * 人格原型 → 签名气味映射
 * key 为原型 code（如 'The Dreamweaver'），与 PERSONALITY_ARCHETYPES 对齐
 *
 * 气味选择呼应原型气质，取自然香料谱：
 *   织梦者 → 鸢尾（清灵开放）
 *   守序者 → 雪松（沉稳经典）
 *   焰心者 → 胡椒（热烈外放）
 *   月潮者 → 薰衣草（温润体贴）
 *   雾行者 → 广藿香（敏感深邃）
 *   炼金者 → 檀香（好奇耐心）
 *   独酌者 → 烟草（孤独锋利）
 *   引航者 → 杜松（坚定稳重）
 *   夜宴者 → 肉桂（热烈锋芒）
 *   暮色者 → 琥珀（均衡柔和）
 */
export interface SignatureScent {
  /** 气味英文标识 · 用于 key 与序列化 */
  note: string;
  /** 中文名 · 供 UI 展示 */
  label: string;
  /** 单字符号 · 镜月隐喻 */
  symbol: string;
}

export const SIGNATURE_SCENTS: Record<string, SignatureScent> = {
  'The Dreamweaver': { note: 'iris', label: '鸢尾', symbol: '梦' },
  'The Clockmaker': { note: 'cedar', label: '雪松', symbol: '序' },
  'The Ember': { note: 'pepper', label: '胡椒', symbol: '焰' },
  'The Velvet': { note: 'lavender', label: '薰衣草', symbol: '潮' },
  'The Mistwalker': { note: 'patchouli', label: '广藿香', symbol: '雾' },
  'The Alchemist': { note: 'sandalwood', label: '檀香', symbol: '炼' },
  'The Solitude': { note: 'tobacco', label: '烟草', symbol: '独' },
  'The Navigator': { note: 'juniper', label: '杜松', symbol: '航' },
  'The Revel': { note: 'cinnamon', label: '肉桂', symbol: '宴' },
  'The Twilight': { note: 'amber', label: '琥珀', symbol: '暮' },
};

/** 无画像时的默认签名气味 · 琥珀（与默认光色 #7c5fbf 同语境） */
export const DEFAULT_SIGNATURE_SCENT: SignatureScent = SIGNATURE_SCENTS['The Twilight'];

/**
 * 阶段 → 主调气味映射
 *
 * 呼应情绪回路四阶段的气味叙事：
 *   opening  · 白茶 · 舒缓开场
 *   rising   · 柑橘 · 活力升温
 *   climax   · 沉香 · 仪式高潮
 *   closing  · 琥珀 · 余韵回归
 */
export interface PrimaryScent {
  note: string;
  label: string;
  poem: string;
}

export const PHASE_PRIMARY_SCENT: Record<JourneyPhase, PrimaryScent> = {
  opening: {
    note: 'white-tea',
    label: '白茶',
    poem: '白茶初醒，夜未深。',
  },
  rising: {
    note: 'citrus',
    label: '柑橘',
    poem: '柑橘破皮，光渐亮。',
  },
  climax: {
    note: 'oud',
    label: '沉香',
    poem: '沉香燃起，焰心成礼。',
  },
  closing: {
    note: 'amber',
    label: '琥珀',
    poem: '琥珀归寂，余韵绕杯。',
  },
};

/**
 * 阶段 → 扩散模式映射
 *
 * breath  · 开场 · 温和呼吸式扩散
 * spread  · 上升 · 加速铺开
 * burst   · 高潮 · 爆发释放
 * fade    · 收尾 · 缓慢淡出
 */
export const PHASE_SCENT_DIFFUSION: Record<JourneyPhase, ScentDiffusion> = {
  opening: 'breath',
  rising: 'spread',
  climax: 'burst',
  closing: 'fade',
};

/** 扩散模式 → 动画时长 ms · breath 最慢，burst 最快 */
export const DIFFUSION_DURATION: Record<ScentDiffusion, number> = {
  breath: 4200,
  spread: 2600,
  burst: 1200,
  fade: 5200,
};
