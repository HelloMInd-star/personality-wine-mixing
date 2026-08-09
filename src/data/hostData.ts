/**
 * 主理人数据层 · 状态映射 + 页面提示词
 *
 * 主理人 = 用户的人格化身（非 AI、非真人）
 * 在线状态由 5 星球时段驱动：起床/工作/休闲/夜晚/入眠
 */

import type { TimeSlot } from '../engine/timeEngine';

/** 主理人状态 · 由时段 + 画像有无决定 */
export type HostStatus =
  | 'online'       // 在线·营业中（休闲/夜晚）
  | 'preparing'    // 备料中（起床）
  | 'offline'      // 离线（工作）
  | 'closed'       // 打烊（入眠）
  | 'unmanifested'; // 未显形（无画像）

/** 时段 → 主理人状态映射 */
export const SLOT_TO_HOST_STATUS: Record<TimeSlot, HostStatus> = {
  dawn: 'preparing',
  noon: 'offline',
  dusk: 'online',
  night: 'online',
  midnight: 'closed',
};

/** 状态元数据 · 指示灯色 + 文案 */
export const HOST_STATUS_META: Record<HostStatus, {
  dotColor: string;       // 指示灯颜色
  glowColor: string;      // 光晕颜色
  label: string;          // 状态标签
  hint: string;           // 默认提示词
}> = {
  online: {
    dotColor: '#4ade80',
    glowColor: 'rgba(74, 222, 128, 0.4)',
    label: '编译中',
    hint: '人格已就位，今夜为自己调一杯',
  },
  preparing: {
    dotColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    label: '收尾中',
    hint: '正在提交最后的代码',
  },
  offline: {
    dotColor: '#6b7280',
    glowColor: 'rgba(107, 114, 128, 0.2)',
    label: '补眠中',
    hint: '白天在睡，夜了再上线',
  },
  closed: {
    dotColor: '#4b5563',
    glowColor: 'rgba(75, 85, 99, 0.2)',
    label: '已关机',
    hint: '该歇了，代码明天再写',
  },
  unmanifested: {
    dotColor: 'transparent',
    glowColor: 'transparent',
    label: '镜空',
    hint: '完成测评，让镜中的程序员显形',
  },
};

/** 每页定位说明 · 主理人为用户指引当前页面功能 */
export const PAGE_GUIDES: Record<string, { title: string; hint: string }> = {
  '/': {
    title: '入口 · Portal',
    hint: '这里是夜的总览，选一颗星球开始你的夜',
  },
  '/personality': {
    title: '人格 · Persona',
    hint: '回答夜的问题，让镜中的程序员显形',
  },
  '/cards': {
    title: '牌类 · Cards',
    hint: '牌类采集，织就你的六维向量契约',
  },
  '/cocktail': {
    title: '调酒 · Elixir',
    hint: '用你的人格，给自己调一杯契合今夜的酒',
  },
  '/scent-lab': {
    title: '气味 · Scent',
    hint: '搭建属于你的一缕气，从基础到分子',
  },
  '/storybook/journey': {
    title: '回路 · Journey',
    hint: '情绪、音乐、光效的回路在此调节',
  },
  '/mbti-party': {
    title: '酒局 · Party',
    hint: '多人 MBTI 酒局场景，看人格如何碰撞',
  },
  '/tavern': {
    title: '酒馆 · Tavern',
    hint: '夜间营业场景，时段决定氛围',
  },
  '/bar-counter': {
    title: '吧台 · Counter',
    hint: '单杯编排工作台，从基酒到装饰',
  },
  '/chess': {
    title: '棋局 · Chess',
    hint: 'MBTI 棋风人格采集，走法即人格',
  },
};

/** 默认页面指引 · 未知路由兜底 */
export const DEFAULT_PAGE_GUIDE = {
  title: '夜之深处',
  hint: '程序员在此等候',
};
