/**
 * MBTI 酒局类型系统 · 人格博弈空间
 *
 * 把 觉醉 核心能力（人格调酒、角色系统、气味映射、共创机制）
 * 整合到一个酒桌形态的界面里，让用户像进入一场游戏一样进入酒局。
 */

import type { RoleType } from './role';

/** MBTI 16 型字符串 · 如 "INTJ" / "ENFP" */
export type MbtiCode = string;

/** 酒桌锁定模式 */
export type TableLockMode = 'locked' | 'free';

/** 酒桌状态 */
export type TableStatus = 'empty' | 'waiting' | 'in-progress' | 'full';

/** 酒桌元数据 · 主入口卡片 */
export interface PartyTable {
  /** 桌号 · 1-4 */
  id: number;
  /** 显示名 · 如 "桌1 · INTJ 局" */
  label: string;
  /** 锁定模式 · locked 限定 MBTI / free 自由加入 */
  lockMode: TableLockMode;
  /** 锁定的 MBTI 类型（lockMode=locked 时生效） */
  lockedMbti?: MbtiCode;
  /** 当前座位人数 0-4 */
  seatCount: number;
  /** 座位上限 */
  seatCapacity: number;
  /** 当前状态 */
  status: TableStatus;
  /** 桌面色调 · 由锁定 MBTI 派生，free 桌用紫金基调 */
  accentColor: string;
  /** 桌面一句话标语 · 锁定桌展示人格气质 */
  tagline?: string;
}

/** 座位位置 · 围绕中央酒桌的环状分布 */
export interface SeatPosition {
  /** 角度（弧度） · 0 为正下方，逆时针 */
  angle: number;
  /** 半径占比 0-1 · 相对画布半径 */
  radius: number;
}

/** 单个玩家在酒桌上的座位态 */
export interface PartySeat {
  /** 座位序号 0-3 · 对应 SeatPosition 索引 */
  index: number;
  /** 玩家昵称 · mock 阶段可空 */
  name?: string;
  /** 玩家 MBTI */
  mbti?: MbtiCode;
  /** 玩家角色 */
  role?: RoleType;
  /** 是否为当前用户 · 决定高亮态 */
  isCurrentUser?: boolean;
  /** 是否为空位 */
  isEmpty: boolean;
  /** 玩家选择的酒体名（调酒中阶段填入） */
  cocktailName?: string;
  /** 是否已完成调酒 */
  hasFinished: boolean;
}

/** 酒局阶段状态机 */
export type PartyPhase = 'waiting' | 'mixing' | 'revealing';

/** 当前回合信息 · 调酒中阶段 */
export interface TurnInfo {
  /** 当前轮到的座位序号 */
  seatIndex: number;
  /** 当前轮到的 MBTI 标签 · 如 "INTJ · 黑暗先知" */
  mbtiLabel: string;
  /** 当前轮到的角色标签 */
  roleLabel: string;
}

/** 联合酒体结果 · 所有玩家完成后融合可视化 */
export interface FusionCocktail {
  /** 融合酒名 */
  name: string;
  /** 副标题 · 诗意标签 */
  subtitle: string;
  /** 主色调 · 综合人格向量色 */
  primaryColor: string;
  /** 副色调 · 强调色 */
  accentColor: string;
  /** 匹配度 0-100 */
  matchScore: number;
  /** 综合人格标签 · 如 "INTJ × ENFP 的张力之杯" */
  fusionLabel: string;
  /** 参与者 MBTI 列表 */
  participants: MbtiCode[];
}

/** MBTI 粒子色映射 · 用于气味动图与人格标签 */
export interface MbtiParticleProfile {
  code: MbtiCode;
  /** 主色 · hex */
  primary: string;
  /** 强调色 · hex */
  accent: string;
  /** 单字符号 · 头顶标签 */
  symbol: string;
  /** 中文标签 · 如 "黑暗先知" */
  nickname: string;
  /** 诗意短语 · 气味卡片下方 */
  poem: string;
  /** 三级人格标签 · 如 "谋略者·敛·锐" · 由 mbtiToBaseVector + derivePersonaTag 派生 */
  personaTag: string;
}

/** 调酒操作步骤 · 模拟博弈台 */
export type MixStep = 'base' | 'flavor' | 'temperature' | 'garnish';

/** 单步调酒选择 */
export interface MixChoice {
  step: MixStep;
  label: string;
  /** 选择后触发的粒子色变 */
  particleColor?: string;
}
