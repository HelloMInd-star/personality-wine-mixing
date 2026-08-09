/**
 * 融合权重配置
 * 塔罗 30% · 星盘 30% · 扑克 20% · 德州 20%
 */
import type { CardModule } from '../types';

export const MODULE_WEIGHT: Record<CardModule, number> = {
  tarot: 0.3,
  zodiac: 0.3,
  poker: 0.2,
  texas: 0.2,
};

/** 模块中文标签 */
export const MODULE_LABEL: Record<CardModule, string> = {
  tarot: '塔罗牌',
  zodiac: '星盘牌',
  poker: '扑克牌',
  texas: '德州牌',
};

/** 模块主色（与 tailwind 配色一致） */
export const MODULE_COLOR: Record<CardModule, string> = {
  tarot: '#D4A040',
  zodiac: '#7A4BFF',
  poker: '#C41E3A',
  texas: '#4DD0E1',
};

/** 模块图标符号 */
export const MODULE_SYMBOL: Record<CardModule, string> = {
  tarot: '☉',
  zodiac: '✦',
  poker: '♠',
  texas: '♦',
};

/** 模块简述 */
export const MODULE_DESC: Record<CardModule, string> = {
  tarot: '潜意识与直觉的镜像',
  zodiac: '先天倾向的星图',
  poker: '即时决策的剪影',
  texas: '策略博弈的轮廓',
};
