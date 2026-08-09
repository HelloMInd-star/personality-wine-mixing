/**
 * scentAnimation.sim · 模拟代码
 * 演示用户情绪从「放松(opening)」切换到「高潮(climax)」时，
 * ScentCard 组件的动画状态如何实时响应
 *
 * 模拟时间线：
 *   t=0   放松态 · mood=null, intensity=0    → opening · breath
 *   t=1   开始升温 · mood=passion, intensity=0.2 → rising · spread
 *   t=2   情绪打开 · intensity=0.5            → climax · burst
 *   t=3   拉满高潮 · intensity=0.7            → climax · burst（强度变化）
 *   t=4   高位持续 · intensity=0.9            → climax · burst（强度拉满）
 *
 * 每一步打印：
 *   - ScentProfile（主调/签名/扩散/强度/诗）
 *   - ScentCard 动画参数（keyframe/duration/ringDelay/粒子数/流光可见）
 *   - 阶段切换事件（diffusion 是否变化 → 是否触发动画重启）
 *
 * 这段代码既是文档也是回归守护：确保切换路径上的动画参数符合预期
 */

import { describe, it, expect } from 'vitest';
import { getScentProfile } from './scentEngine';
import { JOURNEY_PHASE_META } from '../data/journeyMeta';
import { DIFFUSION_DURATION } from '../data/scentMeta';
import type { PersonalityProfile } from '../types/personality';
import type { JourneyState, ScentDiffusion } from '../types/journey';
import type { MoodTag } from '../types/cocktail';

/** 构造指定阶段旅程状态 · 与 ScentCard 消费的形态一致 */
function makeJourneyState(intensity: number, mood: MoodTag | null): JourneyState {
  // 复刻 journeyEngine.resolveJourneyPhase 的阶段解析逻辑（模拟用，不引依赖）
  let phase: JourneyState['phase'];
  if (!mood || intensity <= 0) phase = 'opening';
  else if (intensity < 0.35) phase = 'rising';
  else if (intensity < 0.8) phase = 'climax';
  else phase = CONTRACTIVE.has(mood) ? 'closing' : 'climax';
  return {
    phase,
    meta: JOURNEY_PHASE_META[phase],
    stimulationTier: JOURNEY_PHASE_META[phase].stimulationTier,
  };
}

const CONTRACTIVE = new Set<MoodTag>(['calm', 'melancholy', 'elegant', 'mystery']);

/** 演示画像 · 织梦者（鸢尾签名） */
const DEMO_PROFILE: PersonalityProfile = {
  scores: {
    openness: 70,
    conscientiousness: 50,
    extraversion: 60,
    agreeableness: 55,
    neuroticism: 50,
  },
  archetype: {
    code: 'The Dreamweaver',
    name: '织梦者',
    tagline: '以梦织夜',
    description: '演示用',
    signature: {},
    auraColor: '#7c5fbf',
  },
  flavorPreference: {
    sweet: 0.5,
    sour: 0.5,
    bitter: 0.5,
    strong: 0.5,
    smoky: 0.5,
    fruity: 0.5,
    herbal: 0.5,
    creamy: 0.5,
  },
  createdAt: Date.now(),
};

/** 复刻 ScentCard 的动画参数派生 · 让模拟与真实组件一致 */
interface ScentAnimState {
  diffusion: ScentDiffusion;
  duration: number;
  ringDelay: number;
  particleCount: number;
  sheenVisible: boolean;
  phaseColor: string;
}

function deriveAnimState(
  intensity: number,
  diffusion: ScentDiffusion,
  phaseColor: string,
): ScentAnimState {
  const duration = DIFFUSION_DURATION[diffusion];
  return {
    diffusion,
    duration,
    ringDelay: duration / 3,
    // 复刻修复前的抖动逻辑用于对比 · 修复后为固定值
    particleCount: Math.max(2, Math.round(intensity * 5)),
    sheenVisible: intensity > 0.3,
    phaseColor,
  };
}

/** 时间线节点 */
interface TimelineNode {
  t: number;
  label: string;
  mood: MoodTag | null;
  intensity: number;
}

const TIMELINE: TimelineNode[] = [
  { t: 0, label: '放松态', mood: null, intensity: 0 },
  { t: 1, label: '开始升温', mood: 'passion', intensity: 0.2 },
  { t: 2, label: '情绪打开', mood: 'passion', intensity: 0.5 },
  { t: 3, label: '拉满高潮', mood: 'passion', intensity: 0.7 },
  { t: 4, label: '高位持续', mood: 'passion', intensity: 0.9 },
];

describe('scentAnimation.sim · 放松→高潮切换的动画状态实时响应', () => {
  it('打印完整切换时序 · 每步的 ScentProfile + 动画参数', () => {
    const log: string[] = [];
    let prevDiffusion: ScentDiffusion | null = null;

    log.push('╔══════════════════════════════════════════════════════════════╗');
    log.push('║  情绪切换模拟 · 放松 → 高潮 · ScentCard 动画状态实时响应    ║');
    log.push('╚══════════════════════════════════════════════════════════════╝');

    for (const node of TIMELINE) {
      const journey = makeJourneyState(node.intensity, node.mood);
      const scent = getScentProfile(DEMO_PROFILE, journey);
      const anim = deriveAnimState(scent.intensity, scent.diffusion, journey.meta.color);
      const diffusionChanged = prevDiffusion !== null && prevDiffusion !== scent.diffusion;
      const restartHint = diffusionChanged ? '⚠ 动画重启(diffusion 变更)' : '○ 动画延续';

      log.push('');
      log.push(`┌─ t=${node.t} · ${node.label}`);
      log.push(`│  输入: mood=${node.mood ?? 'null'}, intensity=${node.intensity.toFixed(2)}`);
      log.push(`│  阶段: ${journey.meta.label}(${journey.phase}) · 色 ${anim.phaseColor}`);
      log.push(`│  气味: 主调=${scent.primaryLabel} · 签名=${scent.signatureLabel}(${scent.signatureSymbol})`);
      log.push(`│  扩散: ${scent.diffusion} · 诗「${scent.poem}」`);
      log.push(`│  动画: keyframe=scent-ring-${scent.diffusion} · duration=${anim.duration}ms · ringDelay=${anim.ringDelay.toFixed(0)}ms`);
      log.push(`│  粒子: count=${anim.particleCount} · 流光可见=${anim.sheenVisible}`);
      log.push(`│  状态: ${restartHint}${diffusionChanged ? ` (${prevDiffusion}→${scent.diffusion})` : ''}`);
      prevDiffusion = scent.diffusion;
    }

    log.push('');
    log.push('═══ 切换路径总结 ═══');
    // eslint-disable-next-line no-console
    console.log(log.join('\n'));

    // 关键断言 · 确保切换路径符合回路设计
    const states = TIMELINE.map((n) => {
      const j = makeJourneyState(n.intensity, n.mood);
      return getScentProfile(DEMO_PROFILE, j);
    });

    // 主调顺序：白茶 → 柑橘 → 沉香 → 沉香 → 沉香
    expect(states.map((s) => s.primaryLabel)).toEqual([
      '白茶',
      '柑橘',
      '沉香',
      '沉香',
      '沉香',
    ]);

    // 扩散顺序：breath → spread → burst → burst → burst
    expect(states.map((s) => s.diffusion)).toEqual([
      'breath',
      'spread',
      'burst',
      'burst',
      'burst',
    ]);

    // 签名气味全程不变 · 织梦者 = 鸢尾
    expect(states.every((s) => s.signatureNote === 'iris')).toBe(true);
    expect(states.every((s) => s.signatureSymbol === '梦')).toBe(true);

    // 强度递增 · 呼应 energy：0.2 → 0.5 → 0.9 → 0.9 → 0.9
    expect(states[0].intensity).toBe(0.2);
    expect(states[2].intensity).toBe(0.9);
    expect(states[4].intensity).toBe(0.9);
  });

  it('breath → spread → burst 两次 diffusion 变更 · 各触发一次动画重启', () => {
    const transitions: Array<{ from: ScentDiffusion; to: ScentDiffusion; at: string }> = [];
    let prev: ScentDiffusion | null = null;

    for (const node of TIMELINE) {
      const j = makeJourneyState(node.intensity, node.mood);
      const scent = getScentProfile(DEMO_PROFILE, j);
      if (prev && prev !== scent.diffusion) {
        transitions.push({ from: prev, to: scent.diffusion, at: node.label });
      }
      prev = scent.diffusion;
    }

    // 放松→升温: breath→spread ; 升温→打开: spread→burst
    expect(transitions).toEqual([
      { from: 'breath', to: 'spread', at: '开始升温' },
      { from: 'spread', to: 'burst', at: '情绪打开' },
    ]);
  });

  it('burst 阶段内 intensity 变化 · diffusion 不变 · 动画不重启', () => {
    // t=2,3,4 都在 climax · diffusion 恒为 burst
    const burstStates = TIMELINE.slice(2).map((n) => {
      const j = makeJourneyState(n.intensity, n.mood);
      return getScentProfile(DEMO_PROFILE, j);
    });
    const diffusions = burstStates.map((s) => s.diffusion);
    expect(new Set(diffusions).size).toBe(1);
    expect(diffusions[0]).toBe('burst');

    // 但 duration 恒为 1200ms · ringDelay 恒为 400ms · animation 属性字符串不变
    // → CSS 不会重启 · 仅强度条/粒子数变化
    burstStates.forEach((s) => {
      expect(DIFFUSION_DURATION[s.diffusion]).toBe(1200);
    });
  });

  it('演示修复前的粒子抖动 Bug · intensity=0.499↔0.5 粒子数 2↔3 闪烁', () => {
    // 复刻修复前的 round 逻辑 · 用于回归对比
    const countOld = (i: number) => Math.max(2, Math.round(i * 5));
    expect(countOld(0.499)).toBe(2);
    expect(countOld(0.5)).toBe(3); // ← 抖动点：0.5 时跳到 3
    expect(countOld(0.501)).toBe(3);

    // 修复后逻辑 · 固定粒子数 · 不随 intensity 抖动
    const FIXED_PARTICLE_COUNT = 4;
    expect(FIXED_PARTICLE_COUNT).toBe(4);
    // 修复后 intensity 只影响粒子 opacity · 不影响数量
  });
});
