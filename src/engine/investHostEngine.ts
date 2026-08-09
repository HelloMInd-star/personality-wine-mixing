/**
 * 投资人主理人引擎 · 状态计算 + 提示词生成
 *
 * [复用] 结构完全同构于 hostEngine.ts + hostData.ts
 *   - HostState 接口结构 → InvestHostState（字段相同）
 *   - resolveHostState(slot, profile, pathname) → resolveInvestHostState(slot, profile, hasInvestData, pathname)
 *   - SLOT_TO_HOST_STATUS 时段映射 → SLOT_TO_INVEST_STATUS
 *   - HOST_STATUS_META 状态元数据 → INVEST_HOST_STATUS_META
 *   - PAGE_GUIDES 页面指引 → PAGE_INVEST_GUIDES
 *   - resolveByPrefix 前缀匹配 → resolveInvestByPrefix（逻辑同构）
 *   - DEFAULT_HOST_COLOR / DEFAULT_HOST_SYMBOL 默认值复用
 *
 * [新增] 投资人语义层
 *   - InvestHostStatus 枚举（waiting/monitoring/reviewing/closed/unmanifested）
 *   - 投资人作息映射（日盘盯盘 + 夜复盘 · vs 程序员白天补眠夜编译）
 *   - hasInvestData 双条件显形（有人格 + 有商业数据）
 *   - 商业板块页面指引
 *
 * 叙事内核：在夜里审视组合（vs 程序员在夜里编程）
 * 极简 5 时段线性映射，无 alert 覆盖态
 *
 * 注：早期阶段引擎与数据合一，后续若数据膨胀可拆分为 investHostData.ts（与 hostData.ts 同构）
 */

import type { TimeSlot } from './timeEngine';
import type { PersonalityProfile } from '../types/personality';

// ============ [新增] 投资人状态枚举（替换 HostStatus） ============

/** 投资人主理人状态 · [新增] 投资人语义 */
export type InvestHostStatus =
  | 'waiting'       // 开盘待命（dawn）· [新增] vs 程序员 preparing 收尾中
  | 'monitoring'    // 盘中盯盘（noon）· [新增] vs 程序员 offline 补眠中（作息相反）
  | 'reviewing'     // 复盘（dusk/night）· [新增] vs 程序员 online 编译中
  | 'closed'        // 休市（midnight）· [复用] 同 closed 语义（已关机→休市）
  | 'unmanifested'; // 账本未开 · [复用] 同 unmanifested 语义（镜空→账本未开）

// ============ [新增] 时段→投资人状态映射 ============

/**
 * [新增] 时段 → 投资人状态
 * [复用] SLOT_TO_HOST_STATUS 的 Record<TimeSlot, Status> 结构
 *
 * 作息差异（同一用户的两种身份投射）：
 *   dawn    程序员=收尾中   投资人=开盘待命   都在准备
 *   noon    程序员=补眠中   投资人=盘中盯盘   ★相反（程序员睡/投资人盯）
 *   dusk    程序员=编译中   投资人=盘后复盘   都进入活跃
 *   night   程序员=编译中   投资人=夜复盘     都是主战场
 *   midnight 程序员=已关机  投资人=休市       相同·都收工
 */
export const SLOT_TO_INVEST_STATUS: Record<TimeSlot, InvestHostStatus> = {
  dawn: 'waiting',
  noon: 'monitoring',
  dusk: 'reviewing',
  night: 'reviewing',
  midnight: 'closed',
};

// ============ [新增] 投资人状态元数据 ============

/**
 * [新增] 投资人状态元数据
 * [复用] HOST_STATUS_META 的 Record<Status, {dotColor,glowColor,label,hint}> 结构
 * [复用] 指示灯色系（深空紫金体系：金#fbbf24 / 紫#7c5fbf / 灰#4b5563）
 * [新增] monitoring 用翠绿 #34d399（盯盘·盈利色，投资人专属）
 */
export const INVEST_HOST_STATUS_META: Record<InvestHostStatus, {
  dotColor: string;
  glowColor: string;
  label: string;
  hint: string;
}> = {
  waiting: {
    dotColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    label: '开盘待命',
    hint: '晨会准备中，今日的组合待审视',
  },
  monitoring: {
    dotColor: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    label: '盘中盯盘',
    hint: '监控头寸，波动即人格的镜像',
  },
  reviewing: {
    dotColor: '#7c5fbf',
    glowColor: 'rgba(124, 95, 191, 0.4)',
    label: '夜复盘',
    hint: '审视组合风险，今夜的损益归档',
  },
  closed: {
    dotColor: '#4b5563',
    glowColor: 'rgba(75, 85, 99, 0.2)',
    label: '休市',
    hint: '明日再战，组合已封存',
  },
  unmanifested: {
    dotColor: 'transparent',
    glowColor: 'transparent',
    label: '账本未开',
    hint: '注入商业组件数据，让镜中的投资人显形',
  },
};

// ============ [新增] 商业板块页面指引 ============

/**
 * [新增] 商业板块页面指引
 * [复用] PAGE_GUIDES 的 Record<string, {title,hint}> 结构
 * [复用] DEFAULT_PAGE_GUIDE 兜底模式
 */
export const PAGE_INVEST_GUIDES: Record<string, { title: string; hint: string }> = {
  '/invest': {
    title: '投资部 · Invest',
    hint: '投资人主理人坐镇，审视你的商业组合',
  },
  '/invest/cocktail-recommender': {
    title: '调酒组件 · Asset',
    hint: '调酒推荐引擎的商业估值与风控',
  },
  '/invest/pillars': {
    title: '六重底座 · Foundation',
    hint: '估值/风控/组合/监管/数据/叙事，渐进点亮',
  },
};

/** [复用] DEFAULT_PAGE_GUIDE 兜底模式 */
export const DEFAULT_INVEST_PAGE_GUIDE = {
  title: '账本深处',
  hint: '投资人在此审视',
};

// ============ [复用] HostState 接口结构（字段完全同构） ============

/** 投资人主理人完整状态 · [复用] HostState 接口结构 */
export interface InvestHostState {
  status: InvestHostStatus;
  dotColor: string;
  glowColor: string;
  statusLabel: string;
  name: string;
  primaryColor: string;
  symbol: string;
  pageTitle: string;
  pageHint: string;
  statusHint: string;
  manifested: boolean;
}

/** [复用] 调酒版默认紫 */
const DEFAULT_HOST_COLOR = '#7c5fbf';
/** [复用] 调酒版默认符号 */
const DEFAULT_HOST_SYMBOL = '空';

// ============ 主函数 ============

/**
 * 计算投资人主理人完整状态
 *
 * [复用] resolveHostState(slot, profile, pathname) 的完整逻辑结构
 * [新增] 第三参 pathname 前插入 hasInvestData（商业数据显形条件）
 *
 * 显形条件差异：
 *   调酒版  manifested = profile !== null
 *   投资版  manifested = profile !== null && hasInvestData  ← 双条件
 *
 * @param slot 当前时段（[复用] timeEngine 的 5 时段）
 * @param profile 用户画像（[复用] 调酒系统的 PersonalityProfile）
 * @param hasInvestData 是否有商业数据（[新增] ≥1 底座点亮 或 ≥1 组件填参数）
 * @param pathname 当前路由（[复用] 页面指引匹配）
 */
export function resolveInvestHostState(
  slot: TimeSlot,
  profile: PersonalityProfile | null,
  hasInvestData: boolean,
  pathname: string,
): InvestHostState {
  // [新增] 双条件显形：有人格 + 有商业数据
  const manifested = profile !== null && hasInvestData;
  // [复用] 无数据时强制 unmanifested，忽略时段
  const rawStatus = manifested ? SLOT_TO_INVEST_STATUS[slot] : 'unmanifested';
  const statusMeta = INVEST_HOST_STATUS_META[rawStatus];

  // [复用] 页面指引 · 精确匹配优先，前缀匹配兜底
  const pageGuide = PAGE_INVEST_GUIDES[pathname] ?? resolveInvestByPrefix(pathname);

  return {
    status: rawStatus,
    dotColor: statusMeta.dotColor,
    glowColor: statusMeta.glowColor,
    statusLabel: statusMeta.label,
    // [复用] 显形时用原型名（投资人 = 同一用户的人格化身，原型名不变）
    name: manifested ? profile!.archetype.name : '账本未开',
    // [复用] 显形时用原型主色
    primaryColor: manifested ? profile!.archetype.auraColor : DEFAULT_HOST_COLOR,
    // [复用] 显形时用原型 code 首字
    symbol: manifested ? profile!.archetype.code.charAt(0) : DEFAULT_HOST_SYMBOL,
    pageTitle: pageGuide.title,
    pageHint: pageGuide.hint,
    statusHint: statusMeta.hint,
    manifested,
  };
}

/**
 * [复用] 前缀匹配 · 处理子路由（如 /invest/cocktail-recommender/detail）
 * 逻辑与 hostEngine.resolveByPrefix 完全同构
 */
function resolveInvestByPrefix(pathname: string): { title: string; hint: string } {
  for (const [route, guide] of Object.entries(PAGE_INVEST_GUIDES)) {
    if (route !== '/' && pathname.startsWith(route)) {
      return guide;
    }
  }
  return DEFAULT_INVEST_PAGE_GUIDE;
}
