/**
 * 可编程酒馆 · 场所主题库与默认夜程曲线
 *
 * 主题：一套全场基调预设（环境光 / 音乐风格 / 空间香氛 / 四阶段微调）
 * 夜程曲线：四阶段在一场夜里的时间窗口，缺省 20:00 起的标准化夜程
 *
 * 主题设计呼应深空紫金色谱与镜月隐喻，色值与 journeyMeta 阶段色协调
 */

import type { TavernTheme, NightCurve } from '../types/tavern';

// ═════════════════════════════════════════════════════════
// 默认夜程曲线 · 20:00 起的标准化夜程
// ═════════════════════════════════════════════════════════

export const DEFAULT_NIGHT_CURVE: NightCurve = {
  opening: { start: '20:00', end: '21:30' },
  rising: { start: '21:30', end: '23:00' },
  climax: { start: '23:00', end: '01:00' }, // 跨日
  closing: { start: '01:00', end: '03:00' }, // 跨日
};

// ═════════════════════════════════════════════════════════
// 场所主题 · 四套
// ═════════════════════════════════════════════════════════

export const TAVERN_THEMES: TavernTheme[] = [
  {
    code: 'deep-space',
    name: '深空夜航',
    tagline: '把整座夜，泊进一艘静默的船。',
    description: '深空紫金为底，低频环境呼吸，白茶底香托住全场。适合沉浸独酌与低声絮语。',
    ambientColor: '#1a1430',
    accentColor: '#7c5fbf',
    musicStyle: '深空环境 · 低频呼吸',
    ambientScent: 'white-tea',
    ambientScentLabel: '白茶',
    symbol: '夜',
    phaseTuning: {
      opening: { colorShift: '#2a2150', bpmRange: [55, 65], scentIntensity: 0.3 },
      rising: { colorShift: '#3d2d6b', bpmRange: [80, 95], scentIntensity: 0.5 },
      climax: { colorShift: '#5a3f8f', bpmRange: [120, 130], scentIntensity: 0.8 },
      closing: { colorShift: '#241a3d', bpmRange: [60, 70], scentIntensity: 0.35 },
    },
  },
  {
    code: 'moon-tide',
    name: '月潮秘境',
    tagline: '潮汐随月，心绪随杯。',
    description: '月蓝银调，水波环境音，薰衣草底香抚平潮汐。适合浪漫低语与怅然回望。',
    ambientColor: '#13202e',
    accentColor: '#7c8db5',
    musicStyle: '月潮环境 · 水波微波',
    ambientScent: 'lavender',
    ambientScentLabel: '薰衣草',
    symbol: '潮',
    phaseTuning: {
      opening: { colorShift: '#1d3045', bpmRange: [55, 65], scentIntensity: 0.35 },
      rising: { colorShift: '#2a4259', bpmRange: [80, 95], scentIntensity: 0.55 },
      climax: { colorShift: '#3d5d7a', bpmRange: [120, 130], scentIntensity: 0.75 },
      closing: { colorShift: '#1a2a3a', bpmRange: [60, 70], scentIntensity: 0.4 },
    },
  },
  {
    code: 'ember-forge',
    name: '焰心工坊',
    tagline: '把夜，锻成一团不熄的火。',
    description: '焰红铜调，鼓点环境节奏，沉香底香托住热烈。适合庆典高潮与叛逆狂欢。',
    ambientColor: '#2a1410',
    accentColor: '#e06552',
    musicStyle: '焰心节拍 · 鼓点渐强',
    ambientScent: 'oud',
    ambientScentLabel: '沉香',
    symbol: '焰',
    phaseTuning: {
      opening: { colorShift: '#3a1d16', bpmRange: [60, 70], scentIntensity: 0.3 },
      rising: { colorShift: '#4d261b', bpmRange: [85, 100], scentIntensity: 0.55 },
      climax: { colorShift: '#6b3324', bpmRange: [125, 135], scentIntensity: 0.9 },
      closing: { colorShift: '#2e1813', bpmRange: [62, 72], scentIntensity: 0.4 },
    },
  },
  {
    code: 'mist-walk',
    name: '雾行秘境',
    tagline: '雾起时，每一步都是夜的注脚。',
    description: '雾灰青调，杜松底香，冷冽而清醒。适合神秘探索与雅致独处。',
    ambientColor: '#1a1f1d',
    accentColor: '#5b8a7a',
    musicStyle: '雾行环境 · 冷冽空灵',
    ambientScent: 'juniper',
    ambientScentLabel: '杜松',
    symbol: '雾',
    phaseTuning: {
      opening: { colorShift: '#243030', bpmRange: [55, 65], scentIntensity: 0.3 },
      rising: { colorShift: '#2f4040', bpmRange: [80, 95], scentIntensity: 0.5 },
      climax: { colorShift: '#3d5555', bpmRange: [120, 130], scentIntensity: 0.75 },
      closing: { colorShift: '#1f2a2a', bpmRange: [60, 70], scentIntensity: 0.4 },
    },
  },
];

/** 按 code 取主题 · 未命中返回首个主题（兜底） */
export function getTavernThemeByCode(code: string): TavernTheme {
  return TAVERN_THEMES.find((t) => t.code === code) ?? TAVERN_THEMES[0];
}

/** 缺省主题 · 深空夜航 */
export const DEFAULT_TAVERN_THEME: TavernTheme = TAVERN_THEMES[0];
