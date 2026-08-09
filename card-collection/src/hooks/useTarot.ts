/**
 * 塔罗采集状态机
 * idle → shuffling → drawn → revealed → submitted
 * 管理洗牌、抽3张、逐张翻牌、提交
 */
import { useState, useCallback } from 'react';
import type { TarotCard, TarotPosition, TarotResult } from '../types';
import { drawRandomTarot } from '../data/tarotCards';

export type TarotPhase = 'idle' | 'shuffling' | 'drawn' | 'revealed' | 'submitted';

export interface DrawnCard {
  card: TarotCard;
  position: TarotPosition;
  isReversed: boolean;
  revealed: boolean;
}

const POSITIONS: TarotPosition[] = ['past', 'present', 'future'];

const POSITION_LABEL: Record<TarotPosition, string> = {
  past: '过去',
  present: '现在',
  future: '未来',
};

export function useTarot() {
  const [phase, setPhase] = useState<TarotPhase>('idle');
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);

  /** 开始洗牌 */
  const shuffle = useCallback(() => {
    setPhase('shuffling');
    setDrawn([]);
    // 洗牌动画时长 1.6s 后自动抽牌
    window.setTimeout(() => {
      const cards = drawRandomTarot(3);
      const next: DrawnCard[] = cards.map((card, i) => ({
        card,
        position: POSITIONS[i],
        isReversed: Math.random() < 0.5,
        revealed: false,
      }));
      setDrawn(next);
      setPhase('drawn');
    }, 1600);
  }, []);

  /** 翻开单张 */
  const reveal = useCallback((index: number) => {
    setDrawn((prev) =>
      prev.map((c, i) => (i === index ? { ...c, revealed: true } : c)),
    );
    setPhase((p) => (p === 'drawn' ? 'drawn' : p));
  }, []);

  /** 全部翻开 */
  const revealAll = useCallback(() => {
    setDrawn((prev) => prev.map((c) => ({ ...c, revealed: true })));
    setPhase('revealed');
  }, []);

  /** 检查是否全部翻开 */
  const allRevealed = drawn.length > 0 && drawn.every((c) => c.revealed);

  /** 提交结果 */
  const submit = useCallback((): TarotResult => {
    const result: TarotResult = {
      cards: drawn.map((c) => ({
        cardId: c.card.id,
        position: c.position,
        isReversed: c.isReversed,
      })),
      submittedAt: Date.now(),
    };
    setPhase('submitted');
    return result;
  }, [drawn]);

  /** 重新抽牌 */
  const reset = useCallback(() => {
    setPhase('idle');
    setDrawn([]);
  }, []);

  return {
    phase,
    drawn,
    allRevealed,
    positionLabel: POSITION_LABEL,
    shuffle,
    reveal,
    revealAll,
    submit,
    reset,
  };
}
