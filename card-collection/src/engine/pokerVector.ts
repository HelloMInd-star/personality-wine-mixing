/**
 * 扑克 → 人格向量
 * 牌型直接映射权重
 * 纯函数
 */
import type { PersonaVector, PokerResult } from '../types';
import { POKER_HAND_MAP } from '../data/personaMaps';
import { zeroVector } from './normalize';

export function pokerToVector(result: PokerResult): PersonaVector {
  const vec = zeroVector();
  const weights = POKER_HAND_MAP[result.handType];
  if (weights) {
    for (const [dim, w] of Object.entries(weights)) {
      vec[dim as keyof PersonaVector] += w ?? 0;
    }
  }
  return vec;
}
