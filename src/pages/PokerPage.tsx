/**
 * PokerPage · 三人德州扑克 · 金融孪生对局
 *
 * 布局：三角形牌桌布局
 *   - 上方：AI 对手 2（索罗斯 · Queen）
 *   - 左下：AI 对手 1（巴菲特 · Rook）
 *   - 右下：你（INTJ 用户）
 *   - 中央：公共牌 + 底池
 *   - 右侧：AI 推理日志
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/ui/GlassPanel';
import GradientButton from '../components/ui/GradientButton';
import {
  createGame,
  executeAction,
  getToCall,
  evaluateHand,
  cardToString,
  getSuitColor,
  type GameState,
  type PlayerAction,
  type HandEvaluation,
} from '../engine/pokerEngine';
import { buildAIPersonality, aiDecide, evaluateForAI, type AIPersonality } from '../engine/pokerAI';
import { INVESTORS, PIECE_COLORS } from '../data/investorTwin';
import type { InvestorProfile } from '../data/investorTwin';
import { saveGameResult } from '../engine/pokerHistoryStore';
import logger from '../engine/logger';

// ═════════════════════════════════════════════════════════
// 测试用例配置
// ═════════════════════════════════════════════════════════

/** 测试用例：INTJ 用户 vs 巴菲特(保守) vs 索罗斯(激进) */
const TEST_CONFIG = {
  userName: '你 · INTJ',
  ai1: INVESTORS.find((i) => i.name === '巴菲特')!,
  ai2: INVESTORS.find((i) => i.name === '索罗斯')!,
};

// ═════════════════════════════════════════════════════════
// 子组件
// ═════════════════════════════════════════════════════════

/** 手牌显示 */
function CardView({ card, faceDown }: { card: { suit: string; rank: number }; faceDown?: boolean }) {
  if (faceDown) {
    return (
      <div className="w-12 h-18 rounded-lg border border-amethyst-500/30 bg-amethyst-500/10 flex items-center justify-center">
        <span className="text-amethyst-400/40 text-lg">?</span>
      </div>
    );
  }
  const color = getSuitColor(card.suit as any);
  const rankNames: Record<number, string> = { 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  const suitSymbols: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  return (
    <div className="w-12 h-18 rounded-lg border border-amethyst-500/20 bg-void-900/80 flex flex-col items-center justify-center shadow-lg" style={{ color }}>
      <span className="text-xs font-bold">{rankNames[card.rank] ?? card.rank}</span>
      <span className="text-sm">{suitSymbols[card.suit] ?? card.suit}</span>
    </div>
  );
}

/** 玩家信息面板 */
function PlayerPanel({
  name,
  chips,
  isActive,
  isFolded,
  isAllIn,
  currentBet,
  holeCards,
  showCards,
  handEval,
  investor,
  isAI,
  aiPersonality,
}: {
  name: string;
  chips: number;
  isActive: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  currentBet: number;
  holeCards: { suit: string; rank: number }[];
  showCards: boolean;
  handEval: HandEvaluation | null;
  investor?: InvestorProfile;
  isAI: boolean;
  aiPersonality?: AIPersonality;
}) {
  const pieceColor = investor ? PIECE_COLORS[investor.chessPiece] : '#f0c674';
  const statusColor = isFolded ? 'text-red-400/60' : isAllIn ? 'text-amber-400' : isActive ? 'text-gold-400' : 'text-moon-200/40';

  return (
    <div className={`relative rounded-2xl border p-4 transition-all duration-500 ${
      isActive ? 'border-gold-400/40 bg-gold-400/5 shadow-[0_0_20px_rgba(240,198,116,0.15)]' :
      isFolded ? 'border-red-400/10 bg-red-400/3 opacity-60' :
      'border-amethyst-500/15 bg-void-900/60'
    }`}>
      {/* 状态指示 */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-gold-400 animate-breathe' : isFolded ? 'bg-red-400' : 'bg-moon-200/30'}`} />
        <span className={`text-xs font-bold tracking-wider ${statusColor}`}>
          {name}
        </span>
        {isAI && aiPersonality && (
          <span className="text-[9px] tracking-widest text-moon-200/30">{aiPersonality.chessPiece}</span>
        )}
      </div>

      {/* 投资人信息 */}
      {investor && (
        <div className="text-[10px] text-moon-200/40 mb-2">
          <span style={{ color: pieceColor }}>{investor.chessPiece} · </span>
          {investor.tags?.slice(0, 2).join(' · ')}
        </div>
      )}

      {/* 筹码 & 下注 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-moon-200/50">筹码 {chips}</span>
        {currentBet > 0 && (
          <span className="text-gold-400/70 font-mono">下注 {currentBet}</span>
        )}
      </div>

      {/* 手牌 */}
      {holeCards.length > 0 && (
        <div className="flex gap-1 mt-2">
          {holeCards.map((c, i) => (
            <CardView key={i} card={c} faceDown={!showCards && isAI} />
          ))}
        </div>
      )}

      {/* 手牌评估 */}
      {handEval && showCards && (
        <div className="text-[10px] mt-2 text-gold-400/60 font-mono">
          {handEval.name}
        </div>
      )}

      {/* 全下/弃牌标记 */}
      {isAllIn && <div className="text-[10px] text-amber-400 font-bold mt-1">ALL IN</div>}
      {isFolded && <div className="text-[10px] text-red-400/60 mt-1">已弃牌</div>}
    </div>
  );
}

/** 公共牌展示 */
function CommunityCards({ cards, phase }: { cards: { suit: string; rank: number }[]; phase: string }) {
  const revealedCount = phase === 'preflop' ? 0 : phase === 'flop' ? 3 : 5;
  return (
    <div className="flex items-center gap-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="w-12 h-18 rounded-lg border border-amethyst-500/20 bg-void-900/80 flex items-center justify-center">
          {i < revealedCount && cards[i] ? (
            <CardView card={cards[i]} />
          ) : (
            <span className="text-amethyst-400/20 text-lg">?</span>
          )}
        </div>
      ))}
    </div>
  );
}

/** AI 推理日志 */
function ReasoningLog({ logs }: { logs: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div ref={scrollRef} className="max-h-60 overflow-y-auto space-y-1.5">
      {logs.length === 0 && (
        <div className="text-[10px] text-moon-200/20 italic">对局开始后将显示 AI 推理过程...</div>
      )}
      {logs.map((log, i) => (
        <div key={i} className="text-[10px] leading-relaxed">
          {log.startsWith('🏆') ? (
            <span className="text-gold-400 font-bold">{log}</span>
          ) : log.startsWith('---') ? (
            <span className="text-cyan-400/60">{log}</span>
          ) : log.startsWith('[POKER]') ? (
            <span className="text-moon-200/40">{log.replace('[POKER] ', '')}</span>
          ) : (
            <span className="text-moon-200/60">{log}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 主页面
// ═════════════════════════════════════════════════════════

export default function PokerPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [reasoningLogs, setReasoningLogs] = useState<string[]>([]);
  const [raiseAmount, setRaiseAmount] = useState(40);
  const [userHandEval, setUserHandEval] = useState<HandEvaluation | null>(null);
  const [aiPersonalities, setAiPersonalities] = useState<AIPersonality[]>([]);
  const savedRef = useRef(false); // 防止重复保存

  // ── 对局结束后保存到历史 ──
  useEffect(() => {
    if (!gameState || !gameState.finished || savedRef.current) return;
    savedRef.current = true;

    const players = gameState.players;
    saveGameResult({
      players: players.map((p) => p.name),
      holeCards: players.map((p) => p.holeCards.map(cardToString)),
      communityCards: gameState.communityCards.map(cardToString),
      handEvaluations: players.map((p) => p.handEvaluation?.name ?? '—'),
      winner: gameState.winner?.name ?? '—',
      winnerHand: gameState.winner?.handName ?? '—',
      pot: gameState.pot,
      foldedPlayers: players.filter((p) => p.folded).map((p) => p.name),
      actionSummary: gameState.roundLog.filter((l) => l.startsWith('[POKER]')),
    });

    logger.store('PokerPage', '对局结果已保存到衡', {
      winner: gameState.winner?.name,
      pot: gameState.pot,
    });
  }, [gameState]);

  // ── 开始新游戏 ──
  const startNewGame = useCallback(() => {
    logger.flow('PokerPage', '开始新游戏');
    savedRef.current = false; // 重置保存标记
    const state = createGame([TEST_CONFIG.userName, TEST_CONFIG.ai1.name, TEST_CONFIG.ai2.name]);
    const p1 = buildAIPersonality(TEST_CONFIG.ai1);
    const p2 = buildAIPersonality(TEST_CONFIG.ai2);
    setAiPersonalities([p1, p2]);
    setGameState(state);
    setReasoningLogs(state.roundLog);
    processingRef.current = false;

    // 评估用户手牌
    const eval_ = evaluateHand(state.players[0].holeCards, []);
    setUserHandEval(eval_);

    logger.engine('PokerPage:startNewGame', {
      user: state.players[0].name,
      ai1: state.players[1].name,
      ai2: state.players[2].name,
      userHand: state.players[0].holeCards.map(cardToString),
    });
  }, []);

  // ── AI 自动行动 ──
  const aiTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const processingRef = useRef(false);

  useEffect(() => {
    if (!gameState || gameState.finished) return;
    if (processingRef.current) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (gameState.currentPlayerIndex === 0) return;
    if (currentPlayer.folded || currentPlayer.isAllIn) return;

    processingRef.current = true;

    aiTimerRef.current = setTimeout(() => {
      const personality = aiPersonalities[gameState.currentPlayerIndex - 1];
      if (!personality) {
        processingRef.current = false;
        return;
      }

      const eval_ = evaluateForAI(gameState, gameState.currentPlayerIndex);
      const decision = aiDecide(gameState, gameState.currentPlayerIndex, personality, eval_);

      const newState = executeAction(gameState, gameState.currentPlayerIndex, decision.action, decision.raiseAmount);
      setGameState(newState);
      setReasoningLogs((prev) => [...prev, ...newState.roundLog.slice(prev.length), decision.reasoning]);

      if (newState.currentPlayerIndex === 0 && !newState.finished) {
        const userEval = evaluateHand(newState.players[0].holeCards, newState.communityCards.slice(0, newState.phase === 'flop' ? 3 : newState.phase === 'river' ? 5 : 0));
        setUserHandEval(userEval);
      }

      processingRef.current = false;
    }, 800);

    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = undefined;
      }
      processingRef.current = false;
    };
  }, [gameState, aiPersonalities]);

  // ── 用户操作 ──
  const handleUserAction = useCallback((action: PlayerAction) => {
    if (!gameState || gameState.finished || gameState.currentPlayerIndex !== 0) return;

    const newState = executeAction(gameState, 0, action, action === 'raise' ? raiseAmount : undefined);
    setGameState(newState);
    setReasoningLogs(newState.roundLog);

    if (newState.currentPlayerIndex === 0 && !newState.finished) {
      const eval_ = evaluateHand(newState.players[0].holeCards, newState.communityCards.slice(0, newState.phase === 'flop' ? 3 : newState.phase === 'river' ? 5 : 0));
      setUserHandEval(eval_);
    }
  }, [gameState, raiseAmount]);

  // ── 渲染 ──
  if (!gameState) {
    return (
      <div className="min-h-screen px-6 lg:px-16 py-12 max-w-6xl mx-auto animate-fade-in">
        <header className="mb-10 text-center">
          <div className="text-[11px] tracking-[0.5em] text-amethyst-400/70 uppercase font-mono mb-2">
            Poker Arena · 三人德州扑克
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-gold-sheen text-shadow-glow-gold tracking-[0.18em]">
            金融孪生对局
          </h1>
          <p className="text-sm text-moon-200/60 italic mt-3 max-w-xl mx-auto leading-relaxed">
            你 vs 巴菲特 vs 索罗斯
            <br />
            你的棋风驱动手牌决策 · AI 由投资人画像驱动
          </p>
          <div className="divider-gold mt-5 w-40" />
        </header>

        <GlassPanel className="max-w-md mx-auto text-center">
          <div className="py-10">
            <div className="text-moon-200/50 text-sm mb-6">测试用例：INTJ 用户 vs 保守型 AI vs 激进型 AI</div>
            <GradientButton variant="gold" size="lg" onClick={startNewGame}>
              开始对局 →
            </GradientButton>
          </div>
        </GlassPanel>
      </div>
    );
  }

  const user = gameState.players[0];
  const ai1 = gameState.players[1];
  const ai2 = gameState.players[2];
  const isUserTurn = gameState.currentPlayerIndex === 0 && !gameState.finished;
  const toCall = getToCall(gameState, 0);

  return (
    <div className="min-h-screen px-6 lg:px-16 py-8 max-w-7xl mx-auto animate-fade-in">
      {/* 标题 */}
      <header className="mb-6 text-center">
        <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase font-mono">
          {gameState.phase === 'preflop' ? '翻牌前' : gameState.phase === 'flop' ? '翻牌' : gameState.phase === 'river' ? '河牌' : gameState.phase === 'showdown' ? '摊牌' : '结束'}
        </div>
      </header>

      <div className="flex gap-6">
        {/* 牌桌区 */}
        <div className="flex-1">
          {/* 上方：AI 对手 2 */}
          <div className="flex justify-center mb-4">
            <div className="w-64">
              <PlayerPanel
                name={ai2.name}
                chips={ai2.chips}
                isActive={gameState.currentPlayerIndex === 2}
                isFolded={ai2.folded}
                isAllIn={ai2.isAllIn}
                currentBet={ai2.currentBet}
                holeCards={ai2.holeCards}
                showCards={gameState.finished}
                handEval={gameState.finished ? ai2.handEvaluation : null}
                investor={TEST_CONFIG.ai2}
                isAI
                aiPersonality={aiPersonalities[1]}
              />
            </div>
          </div>

          {/* 中央：公共牌 + 底池 */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <CommunityCards cards={gameState.communityCards} phase={gameState.phase} />
            <div className="flex items-center gap-3">
              <div className="text-xs text-moon-200/50">底池</div>
              <div className="text-xl font-display font-bold text-gold-400">{gameState.pot}</div>
            </div>
          </div>

          {/* 下方：AI 对手 1（左）+ 用户（右） */}
          <div className="flex justify-center gap-8">
            <div className="w-64">
              <PlayerPanel
                name={ai1.name}
                chips={ai1.chips}
                isActive={gameState.currentPlayerIndex === 1}
                isFolded={ai1.folded}
                isAllIn={ai1.isAllIn}
                currentBet={ai1.currentBet}
                holeCards={ai1.holeCards}
                showCards={gameState.finished}
                handEval={gameState.finished ? ai1.handEvaluation : null}
                investor={TEST_CONFIG.ai1}
                isAI
                aiPersonality={aiPersonalities[0]}
              />
            </div>
            <div className="w-64">
              <PlayerPanel
                name={user.name}
                chips={user.chips}
                isActive={isUserTurn}
                isFolded={user.folded}
                isAllIn={user.isAllIn}
                currentBet={user.currentBet}
                holeCards={user.holeCards}
                showCards
                handEval={userHandEval}
                isAI={false}
              />
            </div>
          </div>
        </div>

        {/* 右侧：操作面板 + 推理日志 */}
        <div className="w-80 shrink-0 space-y-4">
          {/* 操作面板 */}
          {!gameState.finished && (
            <GlassPanel padding="md">
              <div className="text-[10px] tracking-[0.3em] text-amethyst-400/60 uppercase font-mono mb-3">
                {isUserTurn ? '你的回合' : '等待 AI 行动...'}
              </div>

              {isUserTurn && (
                <div className="space-y-2">
                  {/* 加注金额选择 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-moon-200/40">加注量</span>
                    <input
                      type="range"
                      min={Math.max(gameState.bigBlind * 2, toCall + gameState.bigBlind)}
                      max={user.chips + user.currentBet}
                      value={raiseAmount}
                      onChange={(e) => setRaiseAmount(Number(e.target.value))}
                      className="flex-1 h-1 rounded-full"
                      style={{ accentColor: '#f0c674' }}
                    />
                    <span className="text-[10px] font-mono text-gold-400/70 w-10 text-right">{raiseAmount}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUserAction('fold')}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold tracking-wider
                                 bg-red-500/20 text-red-400 border border-red-500/30
                                 hover:bg-red-500/30 transition-colors"
                    >
                      弃牌
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserAction('call')}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold tracking-wider
                                 bg-amethyst-500/20 text-amethyst-300 border border-amethyst-500/30
                                 hover:bg-amethyst-500/30 transition-colors"
                    >
                      跟注 {toCall}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserAction('raise')}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold tracking-wider
                                 bg-gold-400/20 text-gold-400 border border-gold-400/30
                                 hover:bg-gold-400/30 transition-colors"
                    >
                      加注
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserAction('allin')}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold tracking-wider
                                 bg-amber-500/20 text-amber-400 border border-amber-500/30
                                 hover:bg-amber-500/30 transition-colors"
                    >
                      全下
                    </button>
                  </div>
                </div>
              )}
            </GlassPanel>
          )}

          {/* 游戏结束 */}
          {gameState.finished && gameState.winner && (
            <GlassPanel padding="md">
              <div className="text-center">
                <div className="text-gold-400 text-lg font-display font-bold mb-2">
                  {gameState.winner.name} 胜出！
                </div>
                <div className="text-xs text-moon-200/50">
                  {gameState.winner.handName}
                </div>
                <div className="flex justify-center gap-1 mt-2">
                  {gameState.winner.cards?.map((c, i) => (
                    <CardView key={i} card={c} />
                  ))}
                </div>
                <GradientButton variant="gold" size="sm" className="mt-4" onClick={startNewGame}>
                  再来一局
                </GradientButton>
                <div className="mt-3">
                  <Link
                    to="/brew/balance"
                    className="text-[10px] text-amethyst-400/40 hover:text-gold-400 tracking-widest transition-colors"
                  >
                    衡 · 查看对局分析 →
                  </Link>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* AI 推理日志 */}
          <GlassPanel padding="md">
            <div className="text-[10px] tracking-[0.3em] text-amethyst-400/60 uppercase font-mono mb-3">
              AI 推理日志
            </div>
            <ReasoningLog logs={reasoningLogs} />
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}