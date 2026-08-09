/**
 * 德州 → 人格向量
 * 行为统计：弃牌数/加注数/跟注数 → 行为权重
 * 决策速度档位 → SPD 权重
 * 诈唬成功 → 额外直觉加成
 * 纯函数
 */
import type { PersonaVector, TexasResult, TexasAction } from '../types';
import { TEXAS_ACTION_MAP, TEXAS_SPEED_MAP, TEXAS_BLUFF_BONUS } from '../data/personaMaps';
import { zeroVector } from './normalize';

function getSpeedTier(ms: number): keyof typeof TEXAS_SPEED_MAP {
  if (ms < 3000) return 'fast';
  if (ms < 8000) return 'mid';
  return 'slow';
}

export function texasToVector(result: TexasResult): PersonaVector {
  const vec = zeroVector();

  // 行为计数 → 权重累加
  const counts: Record<TexasAction, number> = { fold: 0, call: 0, raise: 0 };
  for (const a of result.userActions) counts[a]++;

  for (const action of Object.keys(counts) as TexasAction[]) {
    const w = TEXAS_ACTION_MAP[action];
    const n = counts[action];
    for (const [dim, v] of Object.entries(w)) {
      vec[dim as keyof PersonaVector] += (v ?? 0) * n;
    }
  }

  // 决策速度
  const tier = getSpeedTier(result.avgDecisionTime);
  const speedW = TEXAS_SPEED_MAP[tier];
  for (const [dim, v] of Object.entries(speedW)) {
    vec[dim as keyof PersonaVector] += v ?? 0;
  }

  // 诈唬加成
  if (result.bluffDetected) {
    for (const [dim, v] of Object.entries(TEXAS_BLUFF_BONUS)) {
      vec[dim as keyof PersonaVector] += v ?? 0;
    }
  }

  return vec;
}
