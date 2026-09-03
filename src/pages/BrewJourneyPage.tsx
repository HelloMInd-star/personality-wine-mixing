/**
 * BrewJourneyPage · 觉醉·酿·弧 · 情绪旅程回路
 * 轻量演示页 · 零新依赖，复用真实组件与深空 UI
 *
 * 展示内容：
 *   1. 阶段预设控制台 · 一键切换四阶段（开场/上升/高潮/收尾）
 *   2. 五组件实况 · MoodDial + JourneyArc + MusicControl + LightCanvas + ScentCard
 *   3. 当前阶段元数据卡 · 诗、色、BPM、刺激档位、曲目、合成参数
 *   4. 阶段契合推荐样本 · 带刺激档位标签
 *   5. 四阶段对照表 · 回路全貌
 *
 * 独立工作 · 内置 mock 画像，无需先做测评
 *
 * 视觉语言：深空暗紫 + 情绪光斑 · 觉醉感官情绪探索游戏 · 与 TavernPage/CocktailPage 同语
 */

import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useJourney } from '../hooks/useJourney';
import { cocktailService } from '../services/cocktailService';
import { JOURNEY_PHASE_META, JOURNEY_PHASE_ORDER, MUSIC_TRACKS } from '../data/journeyMeta';
import MoodDial from '../components/brew/journey/MoodDial';
import JourneyArc from '../components/brew/journey/JourneyArc';
import MusicControl from '../components/brew/music/MusicControl';
import LightCanvas from '../components/brew/light/LightCanvas';
import ScentCard from '../components/brew/scent/ScentCard';
import GlassPanel from '../components/ui/GlassPanel';
import type { PersonalityProfile } from '../types/personality';
import type { JourneyPhase, StimulationTier } from '../types/journey';

/** 演示用平衡画像 · 八维居中，让推荐聚焦于阶段刺激档位差异 */
const DEMO_PROFILE: PersonalityProfile = {
  scores: {
    openness: 55,
    conscientiousness: 55,
    extraversion: 55,
    agreeableness: 55,
    neuroticism: 55,
  },
  archetype: {
    code: 'DEMO',
    name: '演示者',
    tagline: '回路中的一切，皆可调。',
    description: '情绪旅程回路演示用画像',
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

/** 刺激档位标签 */
const TIER_LABEL: Record<StimulationTier, string> = {
  low: '低刺激',
  mid: '中刺激',
  high: '高刺激',
};

/** 阶段预设 · 一键设置情绪+强度，触发对应阶段 */
function presetPhase(
  phase: JourneyPhase,
  setActiveMood: (m: import('../types/cocktail').MoodTag | null) => void,
  setMoodIntensity: (v: number) => void,
) {
  switch (phase) {
    case 'opening':
      setActiveMood(null);
      break;
    case 'rising':
      setActiveMood('passion');
      setMoodIntensity(0.2);
      break;
    case 'climax':
      setActiveMood('passion');
      setMoodIntensity(0.5);
      break;
    case 'closing':
      setActiveMood('calm');
      setMoodIntensity(0.9);
      break;
  }
}

export default function BrewJourneyPage() {
  const {
    profile: storedProfile,
    activeMood,
    moodIntensity,
    setActiveMood,
    setMoodIntensity,
    audioEnabled,
    musicVolume,
    setAudioEnabled,
    setMusicVolume,
  } = useAppStore();

  // 优先用真实画像，无则用演示画像 · 保证页面独立可用
  const profile = storedProfile ?? DEMO_PROFILE;
  const { journeyState, currentTrack, isPlaying, lightEffect, scentProfile } = useJourney();

  // 布局调试日志 · 挂载时打印内边距与返回链接信息
  useEffect(() => {
    console.debug('[BrewJourneyPage:layout]', {
      padding: 'px-6 md:px-12 lg:px-20 py-12 md:py-16 pb-20',
      mainOffset: 'ml-20 lg:ml-64 (App.tsx 非沉浸页统一偏移)',
      returnLink: '/cocktail · 返回调酒',
      sidebarWidth: { mobile: 80, desktop: 256 },
      breakpoints: { sm: 640, md: 768, lg: 1024 },
      pageTitle: '酿 · 弧 · Journey Arc',
      timestamp: new Date().toISOString(),
    });
  }, []);

  // 当前阶段推荐样本 · 3 款，带刺激档位
  const recs = useMemo(
    () => cocktailService.recommendByJourney(profile, activeMood, moodIntensity, new Date(), 3),
    [profile, activeMood, moodIntensity],
  );

  const meta = journeyState.meta;

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16 pb-20">
      {/* 顶部标题区 */}
      <header className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase mb-1">
              觉醉 · 酿·弧 · Journey Arc
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-moon-50 tracking-[0.1em]">
              情绪旅程回路
            </h1>
          </div>
          <Link
            to="/cocktail"
            className="text-xs text-amethyst-300/70 hover:text-amethyst-200 transition-colors tracking-[0.1em]"
          >
            ← 返回调酒
          </Link>
        </div>
        <p className="text-sm text-moon-200/55 leading-relaxed max-w-2xl">
          情绪调节器作为主动控件，驱动酒款刺激程度 + 程序化氛围音乐 + 四阶段回路编排。
          切换阶段预设，观察弧线、音乐、推荐的联动变化。
        </p>
      </header>

      {/* 阶段预设控制台 */}
      <GlassPanel padding="md" className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-sm text-moon-200/80 tracking-[0.15em]">
            阶段预设
          </h2>
          <span
            className="text-xs tracking-[0.15em] font-display transition-colors duration-500"
            style={{ color: meta.color }}
          >
            {meta.symbol} · {meta.label}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {JOURNEY_PHASE_ORDER.map((phase) => {
            const pMeta = JOURNEY_PHASE_META[phase];
            const active = journeyState.phase === phase;
            return (
              <button
                key={phase}
                type="button"
                onClick={() => presetPhase(phase, setActiveMood, setMoodIntensity)}
                className="group relative flex flex-col items-center py-3 rounded-lg border transition-all duration-300"
                style={{
                  borderColor: active ? `${pMeta.color}cc` : 'rgba(124, 95, 191, 0.18)',
                  background: active ? `${pMeta.color}14` : 'rgba(10, 8, 20, 0.4)',
                  boxShadow: active ? `0 0 14px ${pMeta.color}44` : 'none',
                }}
              >
                <span
                  className="font-display text-lg leading-none mb-1.5 transition-colors duration-300"
                  style={{ color: active ? pMeta.color : 'rgba(216, 201, 245, 0.5)' }}
                >
                  {pMeta.symbol}
                </span>
                <span
                  className="text-[11px] tracking-[0.15em] transition-colors duration-300"
                  style={{ color: active ? pMeta.color : 'rgba(216, 201, 245, 0.45)' }}
                >
                  {pMeta.label}
                </span>
                <span className="text-[9px] text-moon-200/35 mt-1 font-mono">
                  {pMeta.bpm} BPM · {TIER_LABEL[pMeta.stimulationTier]}
                </span>
              </button>
            );
          })}
        </div>
      </GlassPanel>

      {/* 五组件实况 */}
      <MoodDial
        activeMood={activeMood}
        intensity={moodIntensity}
        onMoodChange={setActiveMood}
        onIntensityChange={setMoodIntensity}
      />
      <JourneyArc journeyState={journeyState} />
      <MusicControl
        track={currentTrack}
        isPlaying={isPlaying}
        volume={musicVolume}
        onTogglePlay={() => setAudioEnabled(!audioEnabled)}
        onVolumeChange={setMusicVolume}
      />
      <GlassPanel padding="md" className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-display text-sm text-moon-200/80 tracking-[0.15em]">
            杯底光效
          </h3>
          <span className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase">
            Light · {lightEffect.pattern}
          </span>
        </div>
        <div className="flex justify-center py-2">
          <LightCanvas effect={lightEffect} size={220} />
        </div>
      </GlassPanel>
      <ScentCard scent={scentProfile} phaseColor={journeyState.meta.color} />

      {/* 当前阶段元数据卡 */}
      <GlassPanel padding="md" className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-sm text-moon-200/80 tracking-[0.15em]">
            当前阶段元数据
          </h2>
          <span className="text-[10px] text-amethyst-400/60 tracking-[0.2em] uppercase">
            Phase Meta
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <MetaRow label="阶段" value={`${meta.label} (${meta.phase})`} accent={meta.color} />
          <MetaRow label="符号" value={meta.symbol} accent={meta.color} />
          <MetaRow label="刺激档位" value={TIER_LABEL[meta.stimulationTier]} accent={meta.color} />
          <MetaRow label="BPM" value={`${meta.bpm}`} accent={meta.color} />
          <MetaRow label="能量" value={meta.energy.toFixed(2)} accent={meta.color} />
          <MetaRow label="音乐风格" value={meta.musicStyle} accent={meta.color} />
          <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-amethyst-500/15">
            <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-1">
              诗
            </div>
            <div className="font-display text-base" style={{ color: meta.color }}>
              {meta.poem}
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-1">
              合成参数
            </div>
            <div className="text-xs text-moon-200/55 font-mono">
              rootFreq: {currentTrack.synth.rootFreq}Hz · timbre: {currentTrack.synth.timbre} ·
              filter: {currentTrack.synth.filterFreq}Hz · reverb: {currentTrack.synth.reverb}
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* 阶段契合推荐样本 */}
      <section className="mb-8">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="font-display text-sm text-moon-200/80 tracking-[0.15em]">
            阶段契合推荐样本
          </h2>
          <span className="text-[10px] text-amethyst-400/60 tracking-[0.2em] uppercase">
            Sample · 3
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {recs.map((rec, idx) => (
            <GlassPanel key={rec.cocktail.id} padding="sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-display text-sm text-moon-50">
                    {rec.cocktail.name}
                  </div>
                  <div className="text-[10px] text-moon-200/40 italic">
                    {rec.cocktail.nameEn}
                  </div>
                </div>
                <span className="text-[10px] text-moon-200/40 font-mono">#{idx + 1}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span
                  className="px-1.5 py-0.5 rounded font-mono"
                  style={{
                    color: meta.color,
                    background: `${meta.color}14`,
                    border: `1px solid ${meta.color}33`,
                  }}
                >
                  {TIER_LABEL[rec.stimulation.tier]}
                </span>
                <span className="text-moon-200/50 font-mono">
                  lv {rec.stimulation.level.toFixed(2)}
                </span>
                <span className="ml-auto text-amethyst-300/70 font-mono">
                  {rec.matchScore} 契合
                </span>
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* 四阶段对照表 */}
      <GlassPanel padding="md">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-sm text-moon-200/80 tracking-[0.15em]">
            四阶段回路对照
          </h2>
          <span className="text-[10px] text-amethyst-400/60 tracking-[0.2em] uppercase">
            Arc Overview
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-amethyst-400/60 tracking-[0.1em]">
                <th className="py-2 pr-4 font-normal">阶段</th>
                <th className="py-2 pr-4 font-normal">触发</th>
                <th className="py-2 pr-4 font-normal">刺激</th>
                <th className="py-2 pr-4 font-normal">BPM</th>
                <th className="py-2 pr-4 font-normal">曲目</th>
                <th className="py-2 font-normal">诗</th>
              </tr>
            </thead>
            <tbody>
              {JOURNEY_PHASE_ORDER.map((phase) => {
                const pMeta = JOURNEY_PHASE_META[phase];
                const track = MUSIC_TRACKS.find((t) => t.phase === phase);
                const active = journeyState.phase === phase;
                const trigger =
                  phase === 'opening'
                    ? '无情绪 / 强度 0'
                    : phase === 'rising'
                      ? '强度 < 0.35'
                      : phase === 'climax'
                        ? '0.35 ≤ 强度 < 0.8'
                        : '强度 ≥ 0.8 + 收敛型';
                return (
                  <tr
                    key={phase}
                    className="border-t border-amethyst-500/10 transition-colors"
                    style={{ background: active ? `${pMeta.color}0a` : 'transparent' }}
                  >
                    <td className="py-2.5 pr-4">
                      <span
                        className="font-display"
                        style={{ color: active ? pMeta.color : 'rgba(216, 201, 245, 0.7)' }}
                      >
                        {pMeta.symbol} {pMeta.label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-moon-200/50">{trigger}</td>
                    <td className="py-2.5 pr-4 text-moon-200/50">
                      {TIER_LABEL[pMeta.stimulationTier]}
                    </td>
                    <td className="py-2.5 pr-4 text-moon-200/50 font-mono">{pMeta.bpm}</td>
                    <td className="py-2.5 pr-4 text-moon-200/60">{track?.title ?? '—'}</td>
                    <td className="py-2.5 text-moon-200/40 italic">{pMeta.poem}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
}

/** 元数据行 · 标签 + 值 */
function MetaRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase w-16 flex-shrink-0">
        {label}
      </span>
      <span className="text-moon-200/80" style={{ color: accent }}>
        {value}
      </span>
    </div>
  );
}