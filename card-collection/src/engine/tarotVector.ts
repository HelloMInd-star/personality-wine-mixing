/**
 * 塔罗 → 人格向量
 * 三张牌加权：过去 0.2 / 现在 0.5 / 未来 0.3
 * 逆位 → 权重反转
 * 纯函数
 */
import type { PersonaVector, TarotResult, TarotPosition } from '../types';
import { getTarotCardById } from '../data/tarotCards';
import { zeroVector } from './normalize';

const POSITION_WEIGHT: Record<TarotPosition, number> = {
  past: 0.2,
  present: 0.5,
  future: 0.3,
};

export function tarotToVector(result: TarotResult): PersonaVector {
  const vec = zeroVector();
  for (const drawn of result.cards) {
    const card = getTarotCardById(drawn.cardId);
    if (!card) continue;
    let weights = card.personaWeights;
    if (drawn.isReversed) {
      // 逆位 → 权重反转
      weights = Object.fromEntries(
        Object.entries(weights).map(([k, v]) => [k, -v!]),
      ) as typeof weights;
    }
    const pw = POSITION_WEIGHT[drawn.position];
    for (const [dim, w] of Object.entries(weights)) {
      vec[dim as keyof PersonaVector] += (w ?? 0) * pw;
    }
  }
  return vec;
}
