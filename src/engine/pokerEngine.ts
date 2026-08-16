/**
 * PokerEngine · 三人简化德州扑克引擎
 *
 * 规则：简化版（翻牌前 → 翻牌 → 河牌，3轮下注）
 * 牌型：标准 9 级（皇家同花顺 → 高牌）
 * 下注：小盲 1BB / 大盲 2BB，可跟注/加注/弃牌/全下
 *
 * 日志：所有核心分支均输出详细日志，标记 [POKER] 前缀
 */

import logger from './logger';

// ═════════════════════════════════════════════════════════
// 类型定义
// ═════════════════════════════════════════════════════════

/** 花色 */
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

/** 牌面值 2-14 */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

/** 一张牌 */
export interface Card {
  suit: Suit;
  rank: Rank;
}

/** 牌型等级 */
export enum HandRank {
  HighCard = 0,
  Pair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

/** 手牌评估结果 */
export interface HandEvaluation {
  rank: HandRank;
  /** 牌型名称 */
  name: string;
  /** 用于比较的排序值（高位优先） */
  kickers: number[];
  /** 最佳 5 张牌 */
  bestCards: Card[];
}

/** 玩家动作 */
export type PlayerAction = 'fold' | 'call' | 'raise' | 'allin';

/** 游戏阶段 */
export type GamePhase = 'preflop' | 'flop' | 'river' | 'showdown' | 'finished';

/** 玩家状态 */
export interface PlayerState {
  name: string;
  chips: number;
  holeCards: Card[];
  currentBet: number;
  folded: boolean;
  isAllIn: boolean;
  lastAction: PlayerAction | null;
  /** 当前手牌评估 */
  handEvaluation: HandEvaluation | null;
}

/** 游戏状态 */
export interface GameState {
  players: PlayerState[];
  communityCards: Card[];
  pot: number;
  phase: GamePhase;
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlind: number;
  bigBlind: number;
  currentBet: number;
  /** 本轮已行动玩家 */
  actedThisRound: Set<number>;
  /** 已弃牌/全下排除 */
  activePlayerIndices: number[];
  /** 回合日志 */
  roundLog: string[];
  /** 游戏是否结束 */
  finished: boolean;
  /** 胜者信息 */
  winner?: {
    name: string;
    handName: string;
    cards: Card[];
  };
}

// ═════════════════════════════════════════════════════════
// 常量
// ═════════════════════════════════════════════════════════

const RANK_NAMES: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#ef4444',
  diamonds: '#ef4444',
  clubs: '#cbd5e1',
  spades: '#cbd5e1',
};

const HAND_NAMES: Record<HandRank, string> = {
  [HandRank.HighCard]: '高牌',
  [HandRank.Pair]: '一对',
  [HandRank.TwoPair]: '两对',
  [HandRank.ThreeOfAKind]: '三条',
  [HandRank.Straight]: '顺子',
  [HandRank.Flush]: '同花',
  [HandRank.FullHouse]: '葫芦',
  [HandRank.FourOfAKind]: '四条',
  [HandRank.StraightFlush]: '同花顺',
  [HandRank.RoyalFlush]: '皇家同花顺',
};

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

export function cardToString(card: Card): string {
  return `${RANK_NAMES[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
}

export function cardToLog(card: Card): string {
  return `${RANK_NAMES[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
}

export function getSuitColor(suit: Suit): string {
  return SUIT_COLORS[suit];
}

/**
 * 创建并洗牌一副 52 张牌
 */
export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return shuffleDeck(deck);
}

/**
 * Fisher-Yates 洗牌
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ═════════════════════════════════════════════════════════
// 手牌评估
// ═════════════════════════════════════════════════════════

/**
 * 评估 7 张牌（2 手牌 + 5 公共牌）中的最佳 5 张组合
 */
export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandEvaluation {
  const allCards = [...holeCards, ...communityCards];

  if (allCards.length < 5) {
    logger.engine('PokerEngine', 'evaluateHand: 牌数不足', { count: allCards.length });
    return {
      rank: HandRank.HighCard,
      name: HAND_NAMES[HandRank.HighCard],
      kickers: [],
      bestCards: [],
    };
  }

  const result = findBestHand(allCards);

  // 详细日志
  logger.engine('PokerEngine:evaluateHand', {
    hole: holeCards.map(cardToLog),
    community: communityCards.map(cardToLog),
    result: result.name,
    kickers: result.kickers,
    best: result.bestCards.map(cardToLog),
  });

  return result;
}

/**
 * 从牌组中找出最佳 5 张组合
 */
function findBestHand(cards: Card[]): HandEvaluation {
  // 生成所有 C(7,5) = 21 种组合
  const combinations = getCombinations(cards, 5);
  let best: HandEvaluation | null = null;

  for (const combo of combinations) {
    const eval_ = evaluate5Cards(combo);
    if (!best || compareHands(eval_, best) > 0) {
      best = eval_;
    }
  }

  return best!;
}

/**
 * 评估 5 张牌的组合
 */
function evaluate5Cards(cards: Card[]): HandEvaluation {
  const ranked = [...cards].sort((a, b) => b.rank - a.rank);
  const suits = ranked.map((c) => c.suit);
  const ranks = ranked.map((c) => c.rank);

  const isFlush = new Set(suits).size === 1;
  const isStraight = checkStraight(ranks);
  const isRoyal = isStraight && isFlush && ranks[0] === 14;

  // 皇家同花顺
  if (isRoyal) {
    return { rank: HandRank.RoyalFlush, name: HAND_NAMES[HandRank.RoyalFlush], kickers: [14], bestCards: ranked };
  }

  // 同花顺
  if (isStraight && isFlush) {
    return { rank: HandRank.StraightFlush, name: HAND_NAMES[HandRank.StraightFlush], kickers: [ranks[0]], bestCards: ranked };
  }

  // 统计面值频率
  const freq: Map<number, number> = new Map();
  for (const r of ranks) freq.set(r, (freq.get(r) || 0) + 1);
  const freqEntries = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  // 四条
  if (freqEntries[0][1] === 4) {
    const quad = freqEntries[0][0];
    const kicker = ranked.find((c) => c.rank !== quad)!.rank;
    return { rank: HandRank.FourOfAKind, name: HAND_NAMES[HandRank.FourOfAKind], kickers: [quad, kicker], bestCards: ranked };
  }

  // 葫芦
  if (freqEntries[0][1] === 3 && freqEntries[1][1] === 2) {
    return { rank: HandRank.FullHouse, name: HAND_NAMES[HandRank.FullHouse], kickers: [freqEntries[0][0], freqEntries[1][0]], bestCards: ranked };
  }

  // 同花
  if (isFlush) {
    return { rank: HandRank.Flush, name: HAND_NAMES[HandRank.Flush], kickers: ranks, bestCards: ranked };
  }

  // 顺子
  if (isStraight) {
    return { rank: HandRank.Straight, name: HAND_NAMES[HandRank.Straight], kickers: [ranks[0]], bestCards: ranked };
  }

  // 三条
  if (freqEntries[0][1] === 3) {
    const trips = freqEntries[0][0];
    const kickers = ranks.filter((r) => r !== trips).sort((a, b) => b - a);
    return { rank: HandRank.ThreeOfAKind, name: HAND_NAMES[HandRank.ThreeOfAKind], kickers: [trips, ...kickers], bestCards: ranked };
  }

  // 两对
  if (freqEntries[0][1] === 2 && freqEntries[1][1] === 2) {
    const pair1 = Math.max(freqEntries[0][0], freqEntries[1][0]);
    const pair2 = Math.min(freqEntries[0][0], freqEntries[1][0]);
    const kicker = ranks.find((r) => r !== pair1 && r !== pair2)!;
    return { rank: HandRank.TwoPair, name: HAND_NAMES[HandRank.TwoPair], kickers: [pair1, pair2, kicker], bestCards: ranked };
  }

  // 一对
  if (freqEntries[0][1] === 2) {
    const pair = freqEntries[0][0];
    const kickers = ranks.filter((r) => r !== pair).sort((a, b) => b - a);
    return { rank: HandRank.Pair, name: HAND_NAMES[HandRank.Pair], kickers: [pair, ...kickers], bestCards: ranked };
  }

  // 高牌
  return { rank: HandRank.HighCard, name: HAND_NAMES[HandRank.HighCard], kickers: ranks, bestCards: ranked };
}

/**
 * 检查 5 张牌是否顺子（含 A-2-3-4-5 特殊处理）
 */
function checkStraight(ranks: number[]): boolean {
  const sorted = [...ranks].sort((a, b) => a - b);
  // 标准顺子
  if (sorted[4] - sorted[0] === 4 && new Set(sorted).size === 5) return true;
  // A-2-3-4-5 (wheel)
  if (sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 4 && sorted[3] === 5 && sorted[4] === 14) return true;
  return false;
}

/**
 * 比较两手牌，返回 >0 表示 a 更好
 */
function compareHands(a: HandEvaluation, b: HandEvaluation): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.min(a.kickers.length, b.kickers.length); i++) {
    if (a.kickers[i] !== b.kickers[i]) return a.kickers[i] - b.kickers[i];
  }
  return 0;
}

/**
 * 获取所有 C(n, k) 组合
 */
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  const [first, ...rest] = arr;
  // 包含 first
  for (const combo of getCombinations(rest, k - 1)) {
    result.push([first, ...combo]);
  }
  // 不包含 first
  result.push(...getCombinations(rest, k));
  return result;
}

// ═════════════════════════════════════════════════════════
// 游戏状态机
// ═════════════════════════════════════════════════════════

/**
 * 创建新游戏
 */
export function createGame(
  playerNames: string[],
  startingChips: number = 1000,
  sb: number = 10,
  bb: number = 20,
): GameState {
  logger.engine('PokerEngine:createGame', { players: playerNames, chips: startingChips, sb, bb });

  const deck = createDeck();
  const players: PlayerState[] = playerNames.map((name) => ({
    name,
    chips: startingChips,
    holeCards: [],
    currentBet: 0,
    folded: false,
    isAllIn: false,
    lastAction: null,
    handEvaluation: null,
  }));

  // 发牌
  let cardIdx = 0;
  for (const player of players) {
    player.holeCards = [deck[cardIdx++], deck[cardIdx++]];
  }

  // 盲注
  const dealerIndex = 0;
  const sbIndex = (dealerIndex + 1) % players.length;
  const bbIndex = (dealerIndex + 2) % players.length;

  players[sbIndex].chips -= sb;
  players[sbIndex].currentBet = sb;
  players[bbIndex].chips -= bb;
  players[bbIndex].currentBet = bb;

  const state: GameState = {
    players,
    communityCards: deck.slice(cardIdx, cardIdx + 5),
    pot: sb + bb,
    phase: 'preflop',
    currentPlayerIndex: (bbIndex + 1) % players.length,
    dealerIndex,
    smallBlind: sb,
    bigBlind: bb,
    currentBet: bb,
    actedThisRound: new Set(),
    activePlayerIndices: [0, 1, 2],
    roundLog: [],
    finished: false,
  };

  logger.engine('PokerEngine:createGame 发牌完成', {
    sb: state.players[sbIndex].name,
    bb: state.players[bbIndex].name,
    community: state.communityCards.map(cardToLog),
    pot: state.pot,
  });

  return state;
}

/**
 * 获取当前活跃玩家数（未弃牌 + 未全下）
 */
export function getActivePlayers(state: GameState): PlayerState[] {
  return state.players.filter((_, i) => state.activePlayerIndices.includes(i));
}

/**
 * 获取还可能需要行动的玩家
 */
function getPlayersNeedingAction(state: GameState): number[] {
  return state.activePlayerIndices.filter((i) => {
    const p = state.players[i];
    if (p.folded || p.isAllIn) return false;
    // 如果该玩家已在本轮行动过且下注已匹配，不需要再行动
    if (state.actedThisRound.has(i) && p.currentBet === state.currentBet) return false;
    return true;
  });
}

/**
 * 玩家执行动作
 */
export function executeAction(
  state: GameState,
  playerIndex: number,
  action: PlayerAction,
  raiseAmount?: number,
): GameState {
  const player = state.players[playerIndex];
  const logPrefix = `[POKER] ${player.name}`;

  logger.engine('PokerEngine:executeAction', {
    player: player.name,
    action,
    raiseAmount,
    phase: state.phase,
    currentBet: state.currentBet,
    playerBet: player.currentBet,
    playerChips: player.chips,
    pot: state.pot,
  });

  const newState = { ...state, players: state.players.map((p) => ({ ...p })), actedThisRound: new Set(state.actedThisRound) };
  const p = newState.players[playerIndex];

  switch (action) {
    case 'fold': {
      p.folded = true;
      p.lastAction = 'fold';
      newState.activePlayerIndices = newState.activePlayerIndices.filter((i) => i !== playerIndex);
      newState.roundLog.push(`${logPrefix} 弃牌`);
      logger.engine('PokerEngine:fold', {
        player: player.name,
        remaining: newState.activePlayerIndices.length,
        chipsLost: player.currentBet,
      });
      break;
    }

    case 'call': {
      const toCall = state.currentBet - p.currentBet;
      const actualCall = Math.min(toCall, p.chips);
      p.chips -= actualCall;
      p.currentBet += actualCall;
      newState.pot += actualCall;
      p.lastAction = 'call';
      newState.actedThisRound.add(playerIndex);

      if (actualCall < toCall) {
        // 筹码不足，自动全下
        p.isAllIn = true;
        newState.roundLog.push(`${logPrefix} 跟注 ${actualCall}（筹码不足，自动全下）`);
        logger.engine('PokerEngine:call_forced_allin', {
          player: player.name,
          needed: toCall,
          actual: actualCall,
          remaining: 0,
        });
      } else {
        newState.roundLog.push(`${logPrefix} 跟注 ${actualCall}`);
        logger.engine('PokerEngine:call', {
          player: player.name,
          amount: actualCall,
          remainingChips: p.chips,
        });
      }
      break;
    }

    case 'raise': {
      const raiseAmt = raiseAmount ?? state.bigBlind * 2;
      const toCallFirst = state.currentBet - p.currentBet;
      const totalNeeded = toCallFirst + raiseAmt;
      const actualTotal = Math.min(totalNeeded, p.chips);

      // 先补平跟注
      const callPart = Math.min(toCallFirst, p.chips);
      p.chips -= callPart;
      p.currentBet += callPart;
      newState.pot += callPart;

      // 再加注
      const raisePart = actualTotal - callPart;
      p.chips -= raisePart;
      p.currentBet += raisePart;
      newState.pot += raisePart;

      p.lastAction = 'raise';
      newState.currentBet = p.currentBet;
      // 如果有人加注，本轮其他玩家需要重新行动
      newState.actedThisRound = new Set([playerIndex]);

      if (actualTotal < totalNeeded) {
        p.isAllIn = true;
        newState.roundLog.push(`${logPrefix} 加注到 ${p.currentBet}（筹码不足，自动全下）`);
        logger.engine('PokerEngine:raise_forced_allin', {
          player: player.name,
          target: newState.currentBet,
          totalNeeded,
          actualTotal,
        });
      } else {
        newState.roundLog.push(`${logPrefix} 加注到 ${p.currentBet}`);
        logger.engine('PokerEngine:raise', {
          player: player.name,
          newBet: newState.currentBet,
          oldBet: state.currentBet,
          raiseBy: raisePart,
        });
      }
      break;
    }

    case 'allin': {
      const toCall = state.currentBet - p.currentBet;
      const totalAllIn = p.chips + p.currentBet;
      const actualCall = Math.min(toCall, p.chips);
      p.chips -= actualCall;
      p.currentBet += actualCall;
      newState.pot += actualCall;

      // 剩余筹码全部推入
      if (p.chips > 0) {
        newState.pot += p.chips;
        p.currentBet += p.chips;
        p.chips = 0;
      }

      p.isAllIn = true;
      p.lastAction = 'allin';

      if (p.currentBet > newState.currentBet) {
        newState.currentBet = p.currentBet;
        newState.actedThisRound = new Set([playerIndex]);
      } else {
        newState.actedThisRound.add(playerIndex);
      }

      newState.roundLog.push(`${logPrefix} 全下！(${totalAllIn})`);
      logger.engine('PokerEngine:allin', {
        player: player.name,
        totalBet: p.currentBet,
        newCurrentBet: newState.currentBet,
        pot: newState.pot,
      });
      break;
    }
  }

  // 检查是否只剩一人（其他人全弃牌）
  const activeCount = newState.activePlayerIndices.filter((i) => !newState.players[i].folded).length;
  if (activeCount === 1) {
    logger.engine('PokerEngine:winner_by_fold', {
      winner: newState.players[newState.activePlayerIndices.find((i) => !newState.players[i].folded)!].name,
      pot: newState.pot,
    });
    return resolveWinner(newState);
  }

  // 推进到下一个需要行动的玩家
  advancePlayer(newState);

  return newState;
}

/**
 * 推进到下一个玩家
 */
function advancePlayer(state: GameState): void {
  const needingAction = getPlayersNeedingAction(state);

  if (needingAction.length === 0) {
    // 本轮结束，推进阶段
    advancePhase(state);
    return;
  }

  // 找到当前玩家之后的下一个需要行动的玩家
  const currentIdx = state.currentPlayerIndex;
  let nextIdx = (currentIdx + 1) % state.players.length;
  while (!needingAction.includes(nextIdx)) {
    nextIdx = (nextIdx + 1) % state.players.length;
  }
  state.currentPlayerIndex = nextIdx;

  logger.engine('PokerEngine:advancePlayer', {
    nextPlayer: state.players[nextIdx].name,
    phase: state.phase,
    needingAction: needingAction.map((i) => state.players[i].name),
  });
}

/**
 * 推进游戏阶段
 */
function advancePhase(state: GameState): void {
  logger.engine('PokerEngine:advancePhase', {
    from: state.phase,
    pot: state.pot,
    communityRevealed: state.communityCards.slice(0, getCommunityCount(state.phase)).map(cardToLog),
  });

  switch (state.phase) {
    case 'preflop': {
      state.phase = 'flop';
      state.actedThisRound = new Set();
      // 重置下注
      state.players.forEach((p) => { p.currentBet = 0; });
      state.currentBet = 0;
      // 庄家左手第一位开始
      state.currentPlayerIndex = (state.dealerIndex + 1) % state.players.length;
      // 跳过已弃牌/全下玩家
      while (state.players[state.currentPlayerIndex].folded || state.players[state.currentPlayerIndex].isAllIn) {
        state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      }
      state.roundLog.push(`--- 翻牌 · Flop [${state.communityCards.slice(0, 3).map(cardToLog).join(' ')}] ---`);
      logger.engine('PokerEngine:phase_flop', {
        community: state.communityCards.slice(0, 3).map(cardToLog),
        nextPlayer: state.players[state.currentPlayerIndex].name,
      });
      break;
    }

    case 'flop': {
      state.phase = 'river';
      state.actedThisRound = new Set();
      state.players.forEach((p) => { p.currentBet = 0; });
      state.currentBet = 0;
      state.currentPlayerIndex = (state.dealerIndex + 1) % state.players.length;
      while (state.players[state.currentPlayerIndex].folded || state.players[state.currentPlayerIndex].isAllIn) {
        state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      }
      state.roundLog.push(`--- 河牌 · River [${state.communityCards.slice(3, 5).map(cardToLog).join(' ')}] ---`);
      logger.engine('PokerEngine:phase_river', {
        allCommunity: state.communityCards.map(cardToLog),
        nextPlayer: state.players[state.currentPlayerIndex].name,
      });
      break;
    }

    case 'river': {
      state.phase = 'showdown';
      logger.engine('PokerEngine:phase_showdown', { pot: state.pot });
      resolveShowdown(state);
      break;
    }
  }
}

function getCommunityCount(phase: GamePhase): number {
  switch (phase) {
    case 'preflop': return 0;
    case 'flop': return 3;
    case 'river': return 5;
    default: return 5;
  }
}

/**
 * 摊牌比大小
 */
function resolveShowdown(state: GameState): void {
  const activePlayers = state.activePlayerIndices
    .filter((i) => !state.players[i].folded)
    .map((i) => state.players[i]);

  const communityCount = getCommunityCount(state.phase);

  let bestPlayer: PlayerState | null = null;
  let bestHand: HandEvaluation | null = null;

  for (const player of activePlayers) {
    const eval_ = evaluateHand(player.holeCards, state.communityCards.slice(0, communityCount));
    player.handEvaluation = eval_;

    logger.engine('PokerEngine:showdown_eval', {
      player: player.name,
      hand: eval_.name,
      kickers: eval_.kickers,
      cards: player.holeCards.map(cardToLog),
    });

    if (!bestHand || compareHands(eval_, bestHand) > 0) {
      bestHand = eval_;
      bestPlayer = player;
    }
  }

  if (bestPlayer && bestHand) {
    bestPlayer.chips += state.pot;
    state.winner = {
      name: bestPlayer.name,
      handName: bestHand.name,
      cards: bestHand.bestCards,
    };
    state.roundLog.push(`🏆 ${bestPlayer.name} 胜出！牌型：${bestHand.name} [${bestHand.bestCards.map(cardToLog).join(' ')}]`);

    logger.engine('PokerEngine:winner', {
      name: bestPlayer.name,
      hand: bestHand.name,
      cards: bestHand.bestCards.map(cardToLog),
      pot: state.pot,
    });
  }

  state.finished = true;
  state.phase = 'finished';
}

/**
 * 全弃牌只剩一人时直接获胜
 */
function resolveWinner(state: GameState): GameState {
  const winnerIdx = state.activePlayerIndices.find((i) => !state.players[i].folded)!;
  const winner = state.players[winnerIdx];
  winner.chips += state.pot;
  const communityCount = getCommunityCount(state.phase);
  winner.handEvaluation = evaluateHand(winner.holeCards, state.communityCards.slice(0, communityCount));

  state.winner = {
    name: winner.name,
    handName: winner.handEvaluation?.name ?? '高牌',
    cards: winner.holeCards,
  };
  state.roundLog.push(`🏆 ${winner.name} 胜出！对手全弃牌`);
  state.finished = true;
  state.phase = 'finished';

  return state;
}

/**
 * 获取当前玩家还需要跟注的金额
 */
export function getToCall(state: GameState, playerIndex: number): number {
  return Math.max(0, state.currentBet - state.players[playerIndex].currentBet);
}

/**
 * 计算手牌强度 0-1（用于 AI 决策参考）
 */
export function getHandStrength(evaluation: HandEvaluation): number {
  const base = evaluation.rank / HandRank.RoyalFlush;
  // 根据 kickers 微调
  const kickerBonus = evaluation.kickers.length > 0
    ? (evaluation.kickers[0] - 2) / 12 * 0.05
    : 0;
  return Math.min(1, base + kickerBonus);
}

export { HAND_NAMES, RANK_NAMES, SUIT_SYMBOLS, SUIT_COLORS };