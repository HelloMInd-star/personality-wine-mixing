/**
 * InvestorMatchEngine · 金融孪生匹配引擎
 *
 * 核心流程：
 *   用户棋风信号 → 3D 坐标 → 欧几里得距离匹配 → 加权排序 → Top 3 投资人
 *
 * 匹配维度：
 *   1. 3D 坐标距离（权重 50%）
 *   2. MBTI 类型匹配（权重 30%）
 *   3. 棋子类型匹配（权重 20%）
 */

import type { ChessDecisionSignals } from '../types/balance';
import { INVESTORS, getInvestmentStyleByMbti } from '../data/investorTwin';
import type { InvestorProfile, ChessPiece, MbtiInvestmentStyle } from '../data/investorTwin';
import { signalsToTemperament } from '../data/mbtiChessData';

// ═════════════════════════════════════════════════════════
// 类型定义
// ═════════════════════════════════════════════════════════

/** 3D 坐标 */
export interface Coordinate3D {
  x: number; // 战略度 0-1
  y: number; // 风险偏好 0-1
  z: number; // 攻击性 0-1
}

/** 匹配结果 */
export interface MatchResult {
  /** 投资人 */
  investor: InvestorProfile;
  /** 综合匹配分数 0-1 */
  score: number;
  /** 3D 距离分数 */
  distanceScore: number;
  /** MBTI 匹配分数 */
  mbtiScore: number;
  /** 棋子匹配分数 */
  pieceScore: number;
  /** 投资风格描述 */
  investmentStyle?: MbtiInvestmentStyle;
}

/** 用户投资画像 */
export interface UserInvestmentProfile {
  /** 推断 MBTI */
  mbti: string;
  /** 棋子类型 */
  chessPiece: ChessPiece;
  /** 3D 坐标 */
  coordinate: Coordinate3D;
  /** 投资风格 */
  investmentStyle: MbtiInvestmentStyle;
}

// ═════════════════════════════════════════════════════════
// 坐标映射
// ═════════════════════════════════════════════════════════

/**
 * 将棋风信号映射为投资 3D 坐标
 *
 * 映射逻辑：
 * - X 战略度 = 长期主义 + 逻辑分析 → 高 timeValue + 低 attack
 * - Y 风险偏好 = 激进 + 直觉 → 高 openingAggression + 高 intuition
 * - Z 攻击性 = 主动出击 + 持续施压 → 高 aggression + 低 decisiveness
 */
export function signalsToCoordinate(signals: ChessDecisionSignals): Coordinate3D {
  const { openingAggression, moveIntuition, decisionLogic, endgameDecisiveness } = signals;

  return {
    // 战略度：越不激进 + 越计算 + 越果断收局 = 越高
    x: clamp(
      (1 - openingAggression) * 0.35 +
        (1 - moveIntuition) * 0.25 +
        decisionLogic * 0.25 +
        endgameDecisiveness * 0.15,
      0, 1,
    ),
    // 风险偏好：越激进 + 越直觉 + 越情绪化 = 越高
    y: clamp(
      openingAggression * 0.35 +
        moveIntuition * 0.30 +
        (1 - decisionLogic) * 0.20 +
        (1 - endgameDecisiveness) * 0.15,
      0, 1,
    ),
    // 攻击性：越激进 + 越持续施压 = 越高
    z: clamp(
      openingAggression * 0.50 +
        (1 - endgameDecisiveness) * 0.35 +
        moveIntuition * 0.15,
      0, 1,
    ),
  };
}

/**
 * 根据棋子类型判定坐标边界
 */
export function getPieceByCoordinate(coord: Coordinate3D): ChessPiece {
  const { x, y, z } = coord;

  // 按优先级从高到低判断
  if (y > 0.65 && x > 0.72 && z > 0.70) return 'Queen';
  if (y > 0.65 && z > 0.70 && x <= 0.72) return 'Knight';
  if (x > 0.72 && y >= 0.30 && y <= 0.72 && z >= 0.30 && z <= 0.60) return 'King';
  if (y >= 0.30 && y <= 0.50 && x >= 0.30 && x <= 0.60 && z >= 0.40 && z <= 0.60) return 'Bishop';
  // 默认低风险低攻击为车
  return 'Rook';
}

// ═════════════════════════════════════════════════════════
// 用户画像生成
// ═════════════════════════════════════════════════════════

/**
 * 从棋局信号生成用户投资画像
 */
export function buildUserProfile(signals: ChessDecisionSignals): UserInvestmentProfile {
  const { temperamentId } = signalsToTemperament(signals);
  const coordinate = signalsToCoordinate(signals);
  const chessPiece = getPieceByCoordinate(coordinate);
  const investmentStyle = getInvestmentStyleByMbti(temperamentId);

  return {
    mbti: temperamentId,
    chessPiece,
    coordinate,
    investmentStyle: investmentStyle ?? getDefaultInvestmentStyle(temperamentId),
  };
}

/** 后备投资风格 */
function getDefaultInvestmentStyle(mbti: string): MbtiInvestmentStyle {
  return {
    mbti,
    typeName: mbti,
    risk: 50,
    timeValue: 50,
    decisionStyle: '分析型',
    chessPiece: 'Rook',
    features: '个性化投资风格',
    strategy: '根据个人棋风定制',
  };
}

// ═════════════════════════════════════════════════════════
// 匹配算法
// ═════════════════════════════════════════════════════════

/**
 * 计算用户与投资人的匹配度
 *
 * 评分权重：
 * - 3D 坐标距离 50%：欧几里得距离归一化
 * - MBTI 匹配 30%：同 MBTI 满分，同组 0.5，不同组 0
 * - 棋子匹配 20%：同棋子满分，相邻棋子 0.5，不同 0
 */
export function matchInvestors(
  signals: ChessDecisionSignals,
  topN: number = 3,
): MatchResult[] {
  const profile = buildUserProfile(signals);
  const userCoord = profile.coordinate;
  const userMbti = profile.mbti;
  const userPiece = profile.chessPiece;

  const results: MatchResult[] = INVESTORS.map((investor) => {
    const invCoord = investor.coordinate;

    // 1. 3D 欧几里得距离
    const dist = Math.sqrt(
      (userCoord.x - invCoord.x) ** 2 +
        (userCoord.y - invCoord.y) ** 2 +
        (userCoord.z - invCoord.z) ** 2,
    );
    // 最大可能距离 = sqrt(3) ≈ 1.732，归一化到 0-1
    const distanceScore = 1 - Math.min(dist / Math.sqrt(3), 1);

    // 2. MBTI 匹配
    const mbtiScore = calcMbtiScore(userMbti, investor.mbti);

    // 3. 棋子匹配
    const pieceScore = calcPieceScore(userPiece, investor.chessPiece);

    // 加权综合
    const score = distanceScore * 0.50 + mbtiScore * 0.30 + pieceScore * 0.20;

    const invStyle = getInvestmentStyleByMbti(investor.mbti);

    return {
      investor,
      score,
      distanceScore,
      mbtiScore,
      pieceScore,
      investmentStyle: invStyle,
    };
  });

  // 按综合分数降序排列
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topN);
}

/**
 * 从用户 MBTI 直接匹配（无需棋局信号）
 */
export function matchInvestorsByMbti(mbti: string, topN: number = 3): MatchResult[] {
  const style = getInvestmentStyleByMbti(mbti);
  const userCoord: Coordinate3D = style
    ? { x: style.timeValue / 100, y: style.risk / 100, z: style.risk / 100 }
    : { x: 0.5, y: 0.5, z: 0.5 };

  const userPiece = style?.chessPiece ?? 'Rook';

  const results: MatchResult[] = INVESTORS.map((investor) => {
    const invCoord = investor.coordinate;
    const dist = Math.sqrt(
      (userCoord.x - invCoord.x) ** 2 +
        (userCoord.y - invCoord.y) ** 2 +
        (userCoord.z - invCoord.z) ** 2,
    );
    const distanceScore = 1 - Math.min(dist / Math.sqrt(3), 1);
    const mbtiScore = calcMbtiScore(mbti, investor.mbti);
    const pieceScore = calcPieceScore(userPiece, investor.chessPiece);
    const score = distanceScore * 0.50 + mbtiScore * 0.30 + pieceScore * 0.20;

    return {
      investor,
      score,
      distanceScore,
      mbtiScore,
      pieceScore,
      investmentStyle: getInvestmentStyleByMbti(investor.mbti),
    };
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}

// ═════════════════════════════════════════════════════════
// 辅助函数
// ═════════════════════════════════════════════════════════

/** MBTI 气质分组 */
const MBTI_GROUPS: Record<string, string> = {
  INFJ: 'NF', INFP: 'NF', ENFJ: 'NF', ENFP: 'NF',
  INTJ: 'NT', INTP: 'NT', ENTJ: 'NT', ENTP: 'NT',
  ISTJ: 'SJ', ISFJ: 'SJ', ESTJ: 'SJ', ESFJ: 'SJ',
  ISTP: 'SP', ISFP: 'SP', ESTP: 'SP', ESFP: 'SP',
};

function calcMbtiScore(userMbti: string, investorMbti: string): number {
  if (userMbti === investorMbti) return 1.0;
  const userGroup = MBTI_GROUPS[userMbti];
  const invGroup = MBTI_GROUPS[investorMbti];
  if (userGroup && invGroup && userGroup === invGroup) return 0.5;
  return 0.0;
}

/** 棋子相邻关系：Rook-Bishop-Knight-Queen-King 环形 */
function calcPieceScore(userPiece: ChessPiece, invPiece: ChessPiece): number {
  if (userPiece === invPiece) return 1.0;

  // 某些棋子天然相近
  const closePairs: [ChessPiece, ChessPiece][] = [
    ['Rook', 'Bishop'], ['Bishop', 'Knight'],
    ['Knight', 'Queen'], ['Queen', 'King'],
    ['Rook', 'King'], ['Bishop', 'King'],
  ];

  const isClose = closePairs.some(
    ([a, b]) => (a === userPiece && b === invPiece) || (a === invPiece && b === userPiece),
  );
  return isClose ? 0.4 : 0.0;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ═════════════════════════════════════════════════════════
// 导出工具
// ═════════════════════════════════════════════════════════

/** 获取所有投资人 3D 坐标（用于散点图） */
export function getAllCoordinates(): { investor: InvestorProfile; coordinate: Coordinate3D }[] {
  return INVESTORS.map((inv) => ({
    investor: inv,
    coordinate: inv.coordinate,
  }));
}

/** 棋子类型中文名 */
export const PIECE_LABELS: Record<ChessPiece, string> = {
  Rook: '车 · 直线战略家',
  Bishop: '象 · 斜线思考者',
  Knight: '马 · 跳跃突破者',
  Queen: '后 · 全域进攻者',
  King: '王 · 系统核心者',
};