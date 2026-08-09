/**
 * 融合引擎 · 四模块向量加权融合 + 归一化 + 标签派生
 *
 * 公式：final = tarot×0.3 + zodiac×0.3 + poker×0.2 + texas×0.2
 * 缺失模块按 0 向量贡献，权重不重新分配（MVP 简化）
 * 最终归一化到 [-1, 1]
 *
 * 纯函数，无副作用
 */
import type {
  PersonaVector,
  PersonaFusion,
  FusionBreakdown,
  PersonaDim,
  TarotResult,
  ZodiacResult,
  PokerResult,
  TexasResult,
} from '../types';
import { MODULE_WEIGHT } from '../data/moduleMeta';
import { normalizeVector, zeroVector } from './normalize';
import { tarotToVector } from './tarotVector';
import { zodiacToVector } from './zodiacVector';
import { pokerToVector } from './pokerVector';
import { texasToVector } from './texasVector';

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

/** 融合输入 · 仅需各模块原始结果，向量由引擎计算填充 */
export interface FusionInput {
  tarot?: { result: TarotResult };
  zodiac?: { result: ZodiacResult };
  poker?: { result: PokerResult };
  texas?: { result: TexasResult };
}

/**
 * 由最终向量派生人格标签
 * 取绝对值最大的维度作为主调，正负号作为倾向
 */
export function derivePersonaTag(vec: PersonaVector): string {
  let maxDim: PersonaDim = 'TOL';
  let maxAbs = 0;
  for (const d of DIMS) {
    const a = Math.abs(vec[d]);
    if (a > maxAbs) {
      maxAbs = a;
      maxDim = d;
    }
  }

  const LABEL: Record<PersonaDim, [string, string]> = {
    // [负倾向, 正倾向]
    TOL: ['审慎者', '冒险者'],
    SPD: ['沉思者', '决断者'],
    INF: ['直觉者', '谋略者'],
    ENT: ['沉静者', '炽烈者'],
    LEAD: ['追随者', '引领者'],
    VIS: ['实证者', '灵感者'],
  };

  const [neg, pos] = LABEL[maxDim];
  return vec[maxDim] >= 0 ? pos : neg;
}

/**
 * 融合四模块结果
 * 接受任意子集，缺失模块跳过
 * 返回的 breakdown 中各模块 vector 已填充
 */
export function fusePersona(input: FusionInput): PersonaFusion {
  const acc = zeroVector();
  const breakdown: FusionBreakdown = {};

  if (input.tarot) {
    const v = tarotToVector(input.tarot.result);
    breakdown.tarot = { vector: v, result: input.tarot.result };
    const w = MODULE_WEIGHT.tarot;
    for (const d of DIMS) acc[d] += v[d] * w;
  }
  if (input.zodiac) {
    const v = zodiacToVector(input.zodiac.result);
    breakdown.zodiac = { vector: v, result: input.zodiac.result };
    const w = MODULE_WEIGHT.zodiac;
    for (const d of DIMS) acc[d] += v[d] * w;
  }
  if (input.poker) {
    const v = pokerToVector(input.poker.result);
    breakdown.poker = { vector: v, result: input.poker.result };
    const w = MODULE_WEIGHT.poker;
    for (const d of DIMS) acc[d] += v[d] * w;
  }
  if (input.texas) {
    const v = texasToVector(input.texas.result);
    breakdown.texas = { vector: v, result: input.texas.result };
    const w = MODULE_WEIGHT.texas;
    for (const d of DIMS) acc[d] += v[d] * w;
  }

  // 缺失模块不补权（MVP 简化）· 标签由最大维度决定，受缩放影响小
  const finalVector = normalizeVector(acc);
  return {
    breakdown,
    finalVector,
    personaTag: derivePersonaTag(finalVector),
    submittedAt: Date.now(),
  };
}
