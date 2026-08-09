/**
 * 主理人引擎 · 状态计算 + 提示词生成
 *
 * 输入：时段 + 有无画像 + 当前路由
 * 输出：主理人完整状态（指示灯 + 相位 + 页面指引 + 提示词）
 *
 * 主理人 = 用户的人格化身
 * 在线状态由 5 星球时段驱动，提示词由页面路由决定
 */

import type { TimeSlot } from './timeEngine';
import type { PersonalityProfile } from '../types/personality';
import type { HostStatus } from '../data/hostData';
import {
  SLOT_TO_HOST_STATUS,
  HOST_STATUS_META,
  PAGE_GUIDES,
  DEFAULT_PAGE_GUIDE,
} from '../data/hostData';

/** 主理人完整状态 · 喂给 HostBadge / HostPanel 渲染 */
export interface HostState {
  /** 在线状态（由时段 + 画像决定） */
  status: HostStatus;
  /** 指示灯颜色 */
  dotColor: string;
  /** 光晕颜色 */
  glowColor: string;
  /** 状态标签（营业中/备料中/离线/打烊/镜空） */
  statusLabel: string;
  /** 主理人名（原型名 or "镜中人未现"） */
  name: string;
  /** 主理人主色（原型 auraColor or 默认紫） */
  primaryColor: string;
  /** 主理人符号（原型 code 首字 or "空"） */
  symbol: string;
  /** 当前页面标题 */
  pageTitle: string;
  /** 当前页面功能指引 */
  pageHint: string;
  /** 默认提示词（由时段决定） */
  statusHint: string;
  /** 是否已显形（有画像） */
  manifested: boolean;
}

/** 默认主色 · 无画像时的灰紫调 */
const DEFAULT_HOST_COLOR = '#7c5fbf';
const DEFAULT_HOST_SYMBOL = '空';

/**
 * 计算主理人完整状态
 * @param slot 当前时段（5 星球之一）
 * @param profile 用户画像（可为 null）
 * @param pathname 当前路由路径
 */
export function resolveHostState(
  slot: TimeSlot,
  profile: PersonalityProfile | null,
  pathname: string,
): HostState {
  const manifested = profile !== null;
  // 无画像时强制为"未显形"状态，忽略时段
  const rawStatus = manifested ? SLOT_TO_HOST_STATUS[slot] : 'unmanifested';
  const statusMeta = HOST_STATUS_META[rawStatus];

  // 页面指引 · 精确匹配优先，前缀匹配兜底（如 /cocktail/xxx）
  const pageGuide = PAGE_GUIDES[pathname] ?? resolveByPrefix(pathname);

  return {
    status: rawStatus,
    dotColor: statusMeta.dotColor,
    glowColor: statusMeta.glowColor,
    statusLabel: statusMeta.label,
    name: manifested ? profile!.archetype.name : '镜中人未现',
    primaryColor: manifested ? profile!.archetype.auraColor : DEFAULT_HOST_COLOR,
    symbol: manifested ? profile!.archetype.code.charAt(0) : DEFAULT_HOST_SYMBOL,
    pageTitle: pageGuide.title,
    pageHint: pageGuide.hint,
    statusHint: statusMeta.hint,
    manifested,
  };
}

/** 前缀匹配 · 处理子路由（如 /cocktail/detail） */
function resolveByPrefix(pathname: string): { title: string; hint: string } {
  for (const [route, guide] of Object.entries(PAGE_GUIDES)) {
    if (route !== '/' && pathname.startsWith(route)) {
      return guide;
    }
  }
  return DEFAULT_PAGE_GUIDE;
}
