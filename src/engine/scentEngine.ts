/**
 * scentEngine · 杯垫气味配方派生引擎
 *
 * 双入口并存：
 *   旧入口 · getScentProfile(profile, journeyState)
 *     · 测评入口 · 通过原型 code 查 SIGNATURE_SCENTS 表 · 兼容层
 *   新入口 · getScentByVector(vec, journeyState)
 *     · 牌类入口 · 直接消费六维向量 · 由 scentFromVector 派生签名气味
 *
 * 派生链：
 *   profile + journeyState → ScentProfile（旧 · 查表）
 *   PersonaVector + journeyState → ScentProfile（新 · 向量派生）
 *
 * 主调气味、强度、扩散模式在两个入口中一致 · 仅 signatureNote 派生方式不同
 *
 * 纯函数，无副作用，可独立测试
 * 延续 lightEngine / musicEngine 的程序化派生模式
 */

import type { PersonalityProfile } from '../types/personality';
import type { PersonaVector } from '../types/personaFusion';
import type { JourneyState, ScentProfile } from '../types/journey';
import {
  SIGNATURE_SCENTS,
  DEFAULT_SIGNATURE_SCENT,
  PHASE_PRIMARY_SCENT,
  PHASE_SCENT_DIFFUSION,
} from '../data/scentMeta';
import { scentFromVector } from './scentFromVector';

/**
 * 派生杯垫气味配方 · 旧入口（兼容层）
 *
 * 通过原型 code 查 SIGNATURE_SCENTS 表获取签名气味 · 测评入口使用
 *
 * @param profile 人格画像 · null 时签名气味取默认琥珀
 * @param journeyState 当前旅程状态（含阶段元数据：energy）
 * @returns 气味配方 · 供 ScentCard 渲染
 *
 * @example
 *   // 开场 + 织梦者 → 白茶主调 + 鸢尾签名
 *   getScentProfile(dreamweaver, openingState)
 *   // → { primaryNote: 'white-tea', signatureNote: 'iris', diffusion: 'breath', ... }
 */
export function getScentProfile(
  profile: PersonalityProfile | null,
  journeyState: JourneyState,
): ScentProfile {
  // 签名气味 · 人格原型专属 · 无画像取默认琥珀
  const signature =
    (profile && SIGNATURE_SCENTS[profile.archetype.code]) || DEFAULT_SIGNATURE_SCENT;

  // 主调气味 · 阶段决定
  const primary = PHASE_PRIMARY_SCENT[journeyState.phase];

  // 释放强度 · 复用阶段 energy
  const intensity = journeyState.meta.energy;

  // 扩散模式 · 阶段决定
  const diffusion = PHASE_SCENT_DIFFUSION[journeyState.phase];

  return {
    primaryNote: primary.note,
    signatureNote: signature.note,
    primaryLabel: primary.label,
    signatureLabel: signature.label,
    signatureSymbol: signature.symbol,
    intensity,
    diffusion,
    poem: primary.poem,
  };
}

/**
 * 派生杯垫气味配方 · 新入口（向量派生）
 *
 * 由六维向量直接派生签名气味 · 牌类入口使用
 * 主调气味、强度、扩散模式与旧入口一致 · 仅 signatureNote 走向量派生
 *
 * @param vec 六维人格向量 [-1, 1]
 * @param journeyState 当前旅程状态
 * @returns 气味配方 · 供 ScentCard 渲染
 *
 * @example
 *   // 高 ENT + 高 VIS → 柑橘签名
 *   getScentByVector({ TOL:0, SPD:0, INF:0, ENT:1, LEAD:0, VIS:0 }, climaxState)
 *   // → { primaryNote: 'oud', signatureNote: 'citrus', diffusion: 'burst', ... }
 *
 *   // 全零向量 → 默认琥珀签名
 *   getScentByVector(zeroVec, openingState)
 *   // → { primaryNote: 'white-tea', signatureNote: 'amber', diffusion: 'breath', ... }
 */
export function getScentByVector(
  vec: PersonaVector,
  journeyState: JourneyState,
): ScentProfile {
  // 签名气味 · 向量派生 · 取 Top-1 维度对应的气味
  const { primary: signature } = scentFromVector(vec);

  // 主调气味 · 阶段决定（与旧入口一致）
  const primary = PHASE_PRIMARY_SCENT[journeyState.phase];

  // 释放强度 · 复用阶段 energy
  const intensity = journeyState.meta.energy;

  // 扩散模式 · 阶段决定
  const diffusion = PHASE_SCENT_DIFFUSION[journeyState.phase];

  return {
    primaryNote: primary.note,
    signatureNote: signature.note,
    primaryLabel: primary.label,
    signatureLabel: signature.label,
    signatureSymbol: signature.symbol,
    intensity,
    diffusion,
    poem: primary.poem,
  };
}
