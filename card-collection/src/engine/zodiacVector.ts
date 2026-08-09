/**
 * 星盘 → 人格向量
 * 六星体（太阳/月亮/上升/水星/火星/金星）× 四象 → 权重累加
 * 纯函数
 */
import type { PersonaVector, ZodiacResult } from '../types';
import { ZODIAC_PERSONA_MAP, SIGN_ELEMENT } from '../data/personaMaps';
import { zeroVector } from './normalize';

const PLANETS = ['太阳', '月亮', '上升', '水星', '火星', '金星'] as const;

export function zodiacToVector(result: ZodiacResult): PersonaVector {
  const vec = zeroVector();
  const signByKey: Record<string, string> = {
    太阳: result.sunSign,
    月亮: result.moonSign,
    上升: result.risingSign,
    水星: result.mercurySign,
    火星: result.marsSign,
    金星: result.venusSign,
  };

  for (const planet of PLANETS) {
    const sign = signByKey[planet];
    const el = SIGN_ELEMENT[sign];
    if (!el) continue;
    const weights = ZODIAC_PERSONA_MAP[`${planet}_${el}`];
    if (!weights) continue;
    for (const [dim, w] of Object.entries(weights)) {
      vec[dim as keyof PersonaVector] += w ?? 0;
    }
  }
  return vec;
}
