/**
 * PokerAI · 三人德州扑克 AI 决策引擎
 *
 * 每位 AI 由投资人画像驱动，决策流程：
 *   手牌强度评估 → 底池赔率计算 → 人格修正 → 最终决策
 *
 * 人格参数来源：
 *   - aggression (攻击性): 投资人 Z 坐标
 *   - riskTolerance (风险容忍): 投资人 Y 坐标
 *   - patience (耐心): 1 - 投资人 Z 坐标
 *   - bluffTendency (诈唬倾向): 投资人 X 坐标 * 0.3 + Y * 0.3
 *
 * 推理过程：每一步决策返回详细推理字符串，供 UI 展示
 */

import logger from './logger';
import type { InvestorProfile } from '../data/investorTwin';
import type { GameState, PlayerAction, HandEvaluation } from './pokerEngine';
import { getHandStrength, getToCall, cardToString, evaluateHand } from './pokerEngine';

// ═════════════════════════════════════════════════════════
// 类型定义
// ═════════════════════════════════════════════════════════

/** AI 人格参数 */
export interface AIPersonality {
  /** 攻击性 0-1 */
  aggression: number;
  /** 风险容忍 0-1 */
  riskTolerance: number;
  /** 耐心 0-1 */
  patience: number;
  /** 诈唬倾向 0-1 */
  bluffTendency: number;
  /** 投资人名称 */
  investorName: string;
  /** 棋子类型 */
  chessPiece: string;
}

/** AI 决策结果 */
export interface AIDecision {
  action: PlayerAction;
  /** 加注金额（仅 raise 时） */
  raiseAmount?: number;
  /** 推理过程文本 */
  reasoning: string;
  /** 内部参数（调试用） */
  debug: {
    handStrength: number;
    potOdds: number;
    aggressionFactor: number;
    riskFactor: number;
    patienceFactor: number;
    bluffFactor: number;
    finalScore: number;
  };
}

// ═════════════════════════════════════════════════════════
// 人格构建
// ═════════════════════════════════════════════════════════

/**
 * 从投资人画像构建 AI 人格
 */
export function buildAIPersonality(investor: InvestorProfile): AIPersonality {
  const { x, y, z } = investor.coordinate;
  return {
    aggression: z,
    riskTolerance: y,
    patience: 1 - z,
    bluffTendency: x * 0.3 + y * 0.3 + z * 0.4,
    investorName: investor.name,
    chessPiece: investor.chessPiece,
  };
}

/**
 * 默认 INTJ 人格（用于测试）
 */
export function defaultPersonality(): AIPersonality {
  return {
    aggression: 0.2,
    riskTolerance: 0.25,
    patience: 0.8,
    bluffTendency: 0.15,
    investorName: '默认 INTJ',
    chessPiece: 'Rook',
  };
}

// ═════════════════════════════════════════════════════════
// 决策引擎
// ═════════════════════════════════════════════════════════

/**
 * AI 决策主函数
 */
export function aiDecide(
  state: GameState,
  playerIndex: number,
  personality: AIPersonality,
  handEval: HandEvaluation,
): AIDecision {
  const player = state.players[playerIndex];
  const toCall = getToCall(state, playerIndex);
  const handStrength = getHandStrength(handEval);
  const potOdds = state.pot > 0 ? toCall / (state.pot + toCall) : 0;

  // 底池赔率是否有利
  const potOddsFavorable = handStrength > potOdds;

  logger.engine('PokerAI:aiDecide', {
    player: player.name,
    investor: personality.investorName,
    hand: `${player.holeCards.map(cardToString).join(' ')} → ${handEval.name} (${(handStrength * 100).toFixed(0)}%)`,
    toCall,
    pot: state.pot,
    potOdds: (potOdds * 100).toFixed(1) + '%',
    potOddsFavorable,
  });

  // ── 人格修正 ──
  // 攻击性越强，越倾向于加注而非跟注
  const aggressionFactor = personality.aggression * 0.4;
  // 风险容忍越高，越愿意在不利赔率下继续
  const riskFactor = personality.riskTolerance * 0.3;
  // 耐心越高，越倾向于等待好牌
  const patienceFactor = personality.patience * 0.3;
  // 诈唬倾向越高，越可能伪装强牌
  const bluffFactor = personality.bluffTendency * 0.2;

  // 综合决策分数
  // handStrength: 手牌真的强
  // bluffFactor: 假装手牌强（诈唬）
  // riskFactor: 愿意冒险
  // patienceFactor: 扣除耐心惩罚
  const effectiveStrength = handStrength + bluffFactor * (1 - handStrength);
  const finalScore = effectiveStrength + riskFactor - patienceFactor * (1 - handStrength);

  logger.engine('PokerAI:decisionFactors', {
    player: player.name,
    handStrength: (handStrength * 100).toFixed(0) + '%',
    effectiveStrength: (effectiveStrength * 100).toFixed(0) + '%',
    aggressionFactor: aggressionFactor.toFixed(2),
    riskFactor: riskFactor.toFixed(2),
    patienceFactor: patienceFactor.toFixed(2),
    bluffFactor: bluffFactor.toFixed(2),
    finalScore: finalScore.toFixed(3),
  });

  // ── 决策分支 ──
  let action: PlayerAction;
  let raiseAmount: number | undefined;
  let reasoning: string;

  const handDesc = `${player.holeCards.map(cardToString).join(' ')} → ${handEval.name}`;
  const handPct = (handStrength * 100).toFixed(0);

  if (toCall === 0) {
    // 无需跟注（check 状态）
    logger.engine('PokerAI:branch_check_free', { player: player.name, finalScore: finalScore.toFixed(3) });

    if (finalScore > 0.7) {
      // 强牌 → 加注
      const bb = state.bigBlind;
      const multiplier = 1 + Math.floor(personality.aggression * 3);
      raiseAmount = bb * multiplier;
      action = 'raise';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 强牌，无需跟注 → 加注 ${raiseAmount}（${multiplier}BB）→ 人格：${personality.chessPiece}风格，攻击性 ${(personality.aggression * 100).toFixed(0)}%`;
    } else if (finalScore > 0.4) {
      action = 'call';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 中等牌力，免费看牌 → 过牌 → 人格：耐心 ${(personality.patience * 100).toFixed(0)}%，等待更好机会`;
    } else {
      action = 'call';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 弱牌，但免费看牌 → 过牌 → 或许能击中翻牌`;
    }

    logger.engine('PokerAI:result', { player: player.name, action, raiseAmount, finalScore: finalScore.toFixed(3) });
    return { action, raiseAmount, reasoning, debug: { handStrength, potOdds, aggressionFactor, riskFactor, patienceFactor, bluffFactor, finalScore } };
  }

  // 需要跟注
  if (finalScore > 0.75) {
    // 很强 → 加注或全下
    logger.engine('PokerAI:branch_strong', { player: player.name, finalScore: finalScore.toFixed(3) });

    if (finalScore > 0.9 && personality.aggression > 0.7) {
      action = 'allin';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 极强牌 + 高攻击性人格 → 全下！→ 底池赔率 ${(potOdds * 100).toFixed(0)}%，${potOddsFavorable ? '有利' : '不利'} → 人格：${personality.investorName}，${personality.chessPiece}风格`;
    } else {
      const bb = state.bigBlind;
      const multiplier = 2 + Math.floor(personality.aggression * 4);
      raiseAmount = Math.min(state.currentBet + bb * multiplier, player.chips + player.currentBet);
      action = 'raise';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 强牌，底池赔率 ${(potOdds * 100).toFixed(0)}%${potOddsFavorable ? '有利' : '不利'} → 加注到 ${raiseAmount} → 人格：${personality.investorName}，${personality.chessPiece}风格，攻击性 ${(personality.aggression * 100).toFixed(0)}%`;
    }
  } else if (finalScore > 0.45) {
    // 中等 → 跟注或小加注
    logger.engine('PokerAI:branch_medium', { player: player.name, finalScore: finalScore.toFixed(3) });

    if (personality.aggression > 0.6 && Math.random() < personality.aggression * 0.5) {
      const bb = state.bigBlind;
      raiseAmount = state.currentBet + bb;
      action = 'raise';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 中等牌力，底池赔率 ${(potOdds * 100).toFixed(0)}%${potOddsFavorable ? '有利' : '不利'} → 小加注试探 → 人格：${personality.investorName}，攻击性偏高`;
    } else {
      action = 'call';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 中等牌力，底池赔率 ${(potOdds * 100).toFixed(0)}%${potOddsFavorable ? '有利' : '不利'} → 跟注观察 → 人格：${personality.investorName}，耐心 ${(personality.patience * 100).toFixed(0)}%`;
    }
  } else if (finalScore > 0.25) {
    // 较弱 → 跟注或弃牌
    logger.engine('PokerAI:branch_weak', { player: player.name, finalScore: finalScore.toFixed(3) });

    if (potOddsFavorable && riskFactor > 0.3) {
      action = 'call';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 弱牌，但底池赔率有利 (${(potOdds * 100).toFixed(0)}%) + 风险容忍度高 → 跟注 → 人格：${personality.investorName}，风险偏好 ${(personality.riskTolerance * 100).toFixed(0)}%`;
    } else if (bluffFactor > 0.5 && Math.random() < bluffFactor) {
      const bb = state.bigBlind;
      raiseAmount = state.currentBet + bb * 2;
      action = 'raise';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 弱牌 → 诈唬！加注到 ${raiseAmount} → 人格：${personality.investorName}，诈唬倾向 ${(bluffFactor * 100).toFixed(0)}%`;
    } else {
      action = 'fold';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 弱牌，底池赔率 ${(potOdds * 100).toFixed(0)}%${potOddsFavorable ? '有利' : '不利'} → 弃牌 → 人格：${personality.investorName}，保守`;
    }
  } else {
    // 很弱 → 弃牌（除非极高风险容忍 + 诈唬）
    logger.engine('PokerAI:branch_very_weak', { player: player.name, finalScore: finalScore.toFixed(3) });

    if (bluffFactor > 0.7 && Math.random() < bluffFactor * 0.5) {
      const bb = state.bigBlind;
      raiseAmount = state.currentBet + bb * 3;
      action = 'raise';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 极弱牌 → 大胆诈唬！加注到 ${raiseAmount} → 人格：${personality.investorName}，极端诈唬倾向`;
    } else {
      action = 'fold';
      reasoning = `评估手牌 ${handDesc}（强度 ${handPct}%）→ 极弱牌，底池赔率 ${(potOdds * 100).toFixed(0)}%${potOddsFavorable ? '有利' : '不利'} → 弃牌 → 人格：${personality.investorName}，保守`;
    }
  }

  logger.engine('PokerAI:result', {
    player: player.name,
    action,
    raiseAmount,
    finalScore: finalScore.toFixed(3),
    reasoning: reasoning.slice(0, 80) + '...',
  });

  return { action, raiseAmount, reasoning, debug: { handStrength, potOdds, aggressionFactor, riskFactor, patienceFactor, bluffFactor, finalScore } };
}

/**
 * 获取当前玩家手牌评估（含公共牌）
 */
export function evaluateForAI(state: GameState, playerIndex: number): HandEvaluation {
  const player = state.players[playerIndex];
  const communityCount = state.phase === 'preflop' ? 0 : state.phase === 'flop' ? 3 : 5;
  return evaluateHand(player.holeCards, state.communityCards.slice(0, communityCount));
}