/**
 * MBTI 国际象棋局 · 数据契约
 *
 * 棋局作为人格验证工具 · 类比调酒体验的数据采集窗口：
 *   调酒：用户选基酒/风味/温度 → 系统反推人格 → 人格酒单
 *   棋局：用户走棋 → 系统记录决策模式 → 反推人格 → 棋风人格报告
 *
 * 设计层级：
 *   ① MBTI 四维度 ↔ 棋局行为映射（E/I·N/S·T/F·J/P）
 *   ② 四组棋风人格（紫 NF / 黄 NT / 蓝 SJ / 绿 SP）· 组级整体棋风
 *   ③（后续）组内 16 型棋风细分 · 接口预留
 *
 * 视觉色复用 MBTI_PARTICLE_MAP 派色逻辑：NF 紫 / NT 金 / SJ 蓝 / SP 绿
 */

import type { PersonaVector } from '../types/personaFusion';

// ═════════════════════════════════════════════════════════
// ① MBTI 四维度 ↔ 棋局行为映射
// ═════════════════════════════════════════════════════════

/** MBTI 四维度 */
export type MbtiDimension = 'EI' | 'NS' | 'TF' | 'JP';

/** MBTI temperament 四组 */
export type ChessTemperamentId = 'NF' | 'NT' | 'SJ' | 'SP';

/** MBTI 维度 ↔ 棋局行为映射 */
export interface MbtiChessMapping {
  dim: MbtiDimension;
  /** MBTI 维度含义 */
  mbtiMeaning: string;
  /** 棋局行为 */
  chessBehavior: string;
  /** 可观测指标 */
  observableMetric: string;
  /** 极 A（E/N/T/J 侧） */
  poleA: { pole: 'E' | 'N' | 'T' | 'J'; label: string; desc: string };
  /** 极 B（I/S/F/P 侧） */
  poleB: { pole: 'I' | 'S' | 'F' | 'P'; label: string; desc: string };
}

/**
 * MBTI 四维度 ↔ 棋局行为映射表
 * 每个维度对应一种棋局行为与可观测指标
 */
export const MBTI_CHESS_MAPPING: MbtiChessMapping[] = [
  {
    dim: 'EI',
    mbtiMeaning: '能量方向',
    chessBehavior: '是否主动发起攻击 / 等待对手犯错',
    observableMetric: '开局策略：主动进攻 vs 防守反击',
    poleA: {
      pole: 'E',
      label: '主动进攻',
      desc: 'E 型能量向外 · 倾向主动发起攻势 · 抢占先手',
    },
    poleB: {
      pole: 'I',
      label: '防守反击',
      desc: 'I 型能量内收 · 倾向稳固防线 · 等待对手犯错',
    },
  },
  {
    dim: 'NS',
    mbtiMeaning: '信息获取',
    chessBehavior: '是否依赖「直觉型走法」vs「计算型走法」',
    observableMetric: '走棋速度：直觉走法 vs 长考后走',
    poleA: {
      pole: 'N',
      label: '直觉走法',
      desc: 'N 型抓全局 pattern · 走棋快 · 敢于弃子求势',
    },
    poleB: {
      pole: 'S',
      label: '长考后走',
      desc: 'S 型依赖具体变化计算 · 长考 · 走棋稳健',
    },
  },
  {
    dim: 'TF',
    mbtiMeaning: '决策方式',
    chessBehavior: '是否依赖逻辑评估 vs 情绪判断',
    observableMetric: '是否因局势波动改变风格',
    poleA: {
      pole: 'T',
      label: '逻辑评估',
      desc: 'T 型客观评估子力价值 · 风格稳定不随局势波动',
    },
    poleB: {
      pole: 'F',
      label: '情绪判断',
      desc: 'F 型受局势情绪影响 · 风格随势波动 · 重棋子「情感价值」',
    },
  },
  {
    dim: 'JP',
    mbtiMeaning: '生活方式',
    chessBehavior: '是否偏好转弯控制 vs 开放局',
    observableMetric: '是否在优势时快速收局 vs 继续施压',
    poleA: {
      pole: 'J',
      label: '快速收局',
      desc: 'J 型偏好转弯控制 · 优势时快速收束 · 不留变数',
    },
    poleB: {
      pole: 'P',
      label: '继续施压',
      desc: 'P 型偏好开放局 · 优势时继续施压扩战 · 追求更大胜势',
    },
  },
];

// ═════════════════════════════════════════════════════════
// ② 四组棋风人格 · 组级整体棋风
// ═════════════════════════════════════════════════════════

/** 棋风人格（组级别） */
export interface ChessTemperament {
  id: ChessTemperamentId;
  /** 组名 · 紫人组/黄人组/蓝人组/绿人组 */
  name: string;
  /** 主色 */
  color: string;
  /** 辅色 */
  secondaryColor: string;
  /** 棋风原型名 */
  chessArchetype: string;
  /** 棋风一句话 */
  chessStyle: string;
  /** 开局策略 */
  openingStrategy: string;
  /** 中局倾向 */
  midgameTendency: string;
  /** 残局风格 */
  endgameStyle: string;
  /** 棋风人格向量（六维）· 作为组级数据契约 */
  vector: PersonaVector;
  /** 棋局符号 */
  symbol: string;
  /** 诗化描述 */
  poem: string;
  /** 组内 4 型 MBTI */
  mbtiMembers: string[];
}

/**
 * 四组棋风人格 · MBTI temperament 对应
 * 紫 NF（理想主义者）/ 黄 NT（理性者）/ 蓝 SJ（守护者）/ 绿 SP（艺术创造者）
 */
export const CHESS_TEMPERAMENTS: ChessTemperament[] = [
  {
    id: 'NF',
    name: '紫人组',
    color: '#9d6bbf',
    secondaryColor: '#c8a5e0',
    chessArchetype: '诗意弈者',
    chessStyle: '以美感与直觉布局 · 敢于牺牲求攻势',
    openingStrategy: '柔性布局 · 重视棋子协调的美感与潜力',
    midgameTendency: '直觉走法 · 敢于弃子求势 · 以想象力破局',
    endgameStyle: '追求优雅收局 · 不喜枯燥的技术性残局',
    vector: { TOL: 0.55, SPD: 0.62, INF: 0.45, ENT: 0.72, LEAD: 0.5, VIS: 0.78 },
    symbol: '紫',
    poem: '紫人下棋 · 像在棋盘上写一首未完的诗',
    mbtiMembers: ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
  },
  {
    id: 'NT',
    name: '黄人组',
    color: '#f0c674',
    secondaryColor: '#f5d88f',
    chessArchetype: '算度大师',
    chessStyle: '以深度计算与逻辑评估主导局面',
    openingStrategy: '理论型开局 · 精确准备 · 追求开局优势',
    midgameTendency: '深度计算 · 逻辑评估局面 · 风格稳定不波动',
    endgameStyle: '技术性残局 · 精确收束 · 善于转化微小优势',
    vector: { TOL: 0.75, SPD: 0.55, INF: 0.82, ENT: 0.4, LEAD: 0.65, VIS: 0.6 },
    symbol: '黄',
    poem: '黄人下棋 · 每一步都在解一道尚未写出的方程',
    mbtiMembers: ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
  },
  {
    id: 'SJ',
    name: '蓝人组',
    color: '#4d6b8f',
    secondaryColor: '#8aa5c4',
    chessArchetype: '阵地守将',
    chessStyle: '稳健布局 · 步步为营 · 不轻易冒险',
    openingStrategy: '稳健布局 · 重视兵形结构与阵地稳固',
    midgameTendency: '步步为营 · 不轻易冒险 · 以防反等对手失误',
    endgameStyle: '稳健收局 · 重视子力优势 · 不给对手反扑空间',
    vector: { TOL: 0.8, SPD: 0.45, INF: 0.7, ENT: 0.35, LEAD: 0.55, VIS: 0.4 },
    symbol: '蓝',
    poem: '蓝人下棋 · 像在棋盘上筑一座不会倒的城',
    mbtiMembers: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
  },
  {
    id: 'SP',
    name: '绿人组',
    color: '#8fa86b',
    secondaryColor: '#b8d49b',
    chessArchetype: '战术猎手',
    chessStyle: '灵活变阵 · 战术敏锐 · 抓住瞬间机会',
    openingStrategy: '灵活变阵 · 不拘理论 · 随对手调整开局',
    midgameTendency: '战术敏锐 · 抓住瞬间机会 · 实战型计算',
    endgameStyle: '实战型残局 · 善于制造压力 · 逼对手犯错',
    vector: { TOL: 0.5, SPD: 0.8, INF: 0.4, ENT: 0.6, LEAD: 0.55, VIS: 0.62 },
    symbol: '绿',
    poem: '绿人下棋 · 像猎手在棋盘的缝隙里寻找那一瞬的破绽',
    mbtiMembers: ['ISTP', 'ISFP', 'ESTP', 'ESFP'],
  },
];

// ═════════════════════════════════════════════════════════
// 棋局 ↔ 调酒体验对应 · 双轨采集的类比
// ═════════════════════════════════════════════════════════

/** 棋局 ↔ 调酒体验对应 */
export interface ChessCocktailParallel {
  aspect: string;
  chessSide: string;
  cocktailSide: string;
}

/**
 * 棋局与调酒的双轨采集对应表
 * 两条路径都反推人格 · 产物不同 · 场景互补
 */
export const CHESS_COCKTAIL_PARALLEL: ChessCocktailParallel[] = [
  {
    aspect: '数据采集',
    chessSide: '用户走棋 → 系统记录决策模式 → 反推人格',
    cocktailSide: '用户选基酒/风味/温度 → 系统反推人格',
  },
  {
    aspect: '产物',
    chessSide: '棋风人格报告',
    cocktailSide: '人格酒单',
  },
  {
    aspect: '适合场景',
    chessSide: '策略推演场景',
    cocktailSide: '休闲场景',
  },
  {
    aspect: '采集信号',
    chessSide: '开局策略 / 走棋速度 / 决策波动 / 收局倾向',
    cocktailSide: '基酒选择 / 风味叠加 / 温度偏好 / 装饰收束',
  },
];

// ═════════════════════════════════════════════════════════
// ③ 组内细分 · 16 型棋风（接口预留 · 第二步实现）
// ═════════════════════════════════════════════════════════

/**
 * 组内细分 · 16 型棋风
 * 每型在组级棋风基础上，按 MBTI 四字母细调向量
 * 接口预留 · 第二步填充 16 型数据
 */
export interface ChessPersonaDetail {
  mbti: string;
  temperamentId: ChessTemperamentId;
  /** 棋风细名 */
  chessName: string;
  /** 相对组级的向量微调 */
  vectorDelta: Partial<PersonaVector>;
  /** 招牌走法 */
  signature: string;
}

// ═════════════════════════════════════════════════════════
// 辅助函数
// ═════════════════════════════════════════════════════════

/** 取棋风人格 · 未知退回黄人组（NT · 最中性） */
export function getChessTemperament(id: ChessTemperamentId): ChessTemperament {
  return CHESS_TEMPERAMENTS.find((t) => t.id === id) ?? CHESS_TEMPERAMENTS[1];
}

/** MBTI code → 所属 temperament */
export function mbtiToTemperament(mbti: string): ChessTemperamentId {
  const upper = mbti.toUpperCase();
  if (upper.includes('NF')) return 'NF';
  if (upper.includes('NT')) return 'NT';
  if (upper.includes('SJ')) return 'SJ';
  if (upper.includes('SP')) return 'SP';
  return 'NT'; // 兜底
}

/** MBTI code → 棋风人格（组级） */
export function getChessTemperamentByMbti(mbti: string): ChessTemperament {
  return getChessTemperament(mbtiToTemperament(mbti));
}

/**
 * 棋局决策信号 → 推断 MBTI 维度倾向
 * 输入：开局策略/走棋速度/决策波动/收局倾向
 * 输出：四维度倾向（0-1 · 越接近 1 越偏 poleA）
 *
 * 这是「走棋 → 反推人格」的核心算法入口
 * 后续组件内可基于真实棋局记录调用
 */
export interface ChessDecisionSignals {
  /** 开局进攻度 0-1 · 1=主动进攻(E) 0=防守反击(I) */
  openingAggression: number;
  /** 走棋直觉度 0-1 · 1=直觉快走(N) 0=长考慢走(S) */
  moveIntuition: number;
  /** 决策逻辑度 0-1 · 1=逻辑评估(T) 0=情绪判断(F) */
  decisionLogic: number;
  /** 收局果断度 0-1 · 1=快速收局(J) 0=继续施压(P) */
  endgameDecisiveness: number;
}

/** 棋局决策信号 → temperament 推断 */
export function signalsToTemperament(
  signals: ChessDecisionSignals,
): { temperamentId: ChessTemperamentId; scores: Record<MbtiDimension, number> } {
  const scores: Record<MbtiDimension, number> = {
    EI: signals.openingAggression,
    NS: signals.moveIntuition,
    TF: signals.decisionLogic,
    JP: signals.endgameDecisiveness,
  };
  // 简化推断 · 按四维度组合取最接近的 temperament
  // NF: N高·F高·偏直觉与情绪
  // NT: N高·T高·偏直觉与逻辑
  // SJ: S高·J高·偏计算与收束
  // SP: S高·P高·偏计算与施压
  const nf = signals.moveIntuition * (1 - signals.decisionLogic);
  const nt = signals.moveIntuition * signals.decisionLogic;
  const sj = (1 - signals.moveIntuition) * signals.endgameDecisiveness;
  const sp = (1 - signals.moveIntuition) * (1 - signals.endgameDecisiveness);
  const max = Math.max(nf, nt, sj, sp);
  const temperamentId: ChessTemperamentId =
    max === nf ? 'NF' : max === nt ? 'NT' : max === sj ? 'SJ' : 'SP';
  return { temperamentId, scores };
}
