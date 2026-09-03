/**
 * HomePage · 觉醉 入口
 * 双轨系统的总览 · 人格与调酒在此交汇
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import GlassPanel from '../components/ui/GlassPanel';
import GradientButton from '../components/ui/GradientButton';
import CosmicOrbs from '../components/home/CosmicOrbs';
import { resolveTimeSlot, describeBiologyShift } from '../engine/timeEngine';
import { DIM_LABEL } from '../types/personaFusion';
import { resolveHostState } from '../engine/hostEngine';

export default function HomePage() {
  const navigate = useNavigate();
  const { profile, vector, manualTimeSlot, setManualTimeSlot, feedbackHistory } = useAppStore();
  const [orbsExpanded, setOrbsExpanded] = useState(false);

  // 状态判断日志 · 验证 Hero 智能 CTA 切换是否正确
  useEffect(() => {
    const heroCTA = !profile && !vector
      ? '开启人格测评'
      : feedbackHistory.length === 0
        ? '查看专属调酒'
        : '回到今夜的杯';
    console.debug('[HomePage:hero-state]', {
      hasProfile: !!profile,
      hasVector: !!vector,
      feedbackCount: feedbackHistory.length,
      heroCTA,
      timestamp: new Date().toISOString(),
    });
  }, [profile, vector, feedbackHistory.length]);

  // 当前生效时段 · manualTimeSlot 优先于系统时间
  const currentSlot = resolveTimeSlot(new Date(), manualTimeSlot);
  const shifts = describeBiologyShift(currentSlot);
  // 主理人状态 · 首页介绍区使用
  const hostState = resolveHostState(currentSlot.slot, profile, '/');

  return (
    <div className="min-h-screen px-6 lg:px-16 py-12 animate-orbit-fade-up">
      {/* —— Hero · 镜月入口 —— */}
      <section className="flex flex-col items-center text-center pt-8 pb-16">
        <div className="relative mb-6">
          {/* 镜月 · 呼吸 · 点击展开 5 宇宙星球 */}
          <button
            type="button"
            onClick={() => setOrbsExpanded((v) => !v)}
            className="block cursor-pointer group"
            aria-label={orbsExpanded ? '收起宇宙星球' : '展开宇宙星球'}
            aria-expanded={orbsExpanded}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-moon-50 via-amethyst-400 to-amethyst-600 shadow-glow-amethyst animate-breathe relative group-hover:shadow-glow-gold transition-all duration-orbit-mid ease-orbit">
              <div className="absolute inset-[6px] rounded-full bg-void-gradient opacity-90" />
              <div className="absolute inset-0 rounded-full border border-gold-400/40" />
              <div className="absolute -inset-3 rounded-full border border-amethyst-500/20 animate-twinkle-slow" />
              {/* 展开提示 · 微妙的光点 */}
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] text-gold-400/60 transition-opacity duration-300 ${orbsExpanded ? 'opacity-0' : 'opacity-100'}`}>
                触
              </div>
            </div>
          </button>
        </div>

        {/* 5 宇宙星球 · 点击镜月展开 · 太阳/咖啡/茶/酒/月 → 起床/工作/休闲/夜晚/入眠 */}
        <CosmicOrbs
          expanded={orbsExpanded}
          selectedSlot={manualTimeSlot}
          onSelect={(slot) => setManualTimeSlot(slot)}
        />

        {/* 当前时段校准面板 · 显示生物学依据与人格向量偏移 */}
        {orbsExpanded && (
          <div className="mt-3 mb-2 animate-orbit-fade-up max-w-md">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] tracking-widest">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-breathe"
                style={{ background: currentSlot.auraColor, boxShadow: `0 0 8px ${currentSlot.auraColor}` }}
              />
              <span className="font-display text-gold-sheen">{currentSlot.label}</span>
              <span className="text-amethyst-400/40">·</span>
              <span className="text-moon-200/70">{currentSlot.orbState}</span>
              <span className="text-amethyst-400/40">·</span>
              <span className="text-moon-200/50 italic">{currentSlot.biologyNote}</span>
            </div>
            {shifts.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-mono">
                <span className="text-amethyst-400/40">向量偏移</span>
                {shifts.map(({ dim, delta, sign }) => (
                  <span
                    key={dim}
                    className={sign === '+' ? 'text-gold-400/80' : 'text-amethyst-300/70'}
                  >
                    {DIM_LABEL[dim]}{sign}{delta.toFixed(2)}
                  </span>
                ))}
                {vector && (
                  <span className="text-amethyst-400/30 ml-1">· 基于六维向量动态校准</span>
                )}
              </div>
            )}
            {manualTimeSlot && (
              <button
                type="button"
                onClick={() => setManualTimeSlot(null)}
                className="mt-2 text-[10px] text-amethyst-400/50 hover:text-gold-400 transition-colors duration-orbit-mid ease-orbit tracking-widest"
              >
                ↺ 回到系统时间
              </button>
            )}
          </div>
        )}

        <div className="text-[11px] tracking-[0.4em] text-amethyst-400/80 mb-4 flex items-center justify-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-orbit-signal animate-orbit-pulse shadow-glow-signal" />
          觉醉 · 感官情绪探索
        </div>
        <h1 className="font-display text-6xl lg:text-7xl text-gold-sheen text-shadow-glow-gold leading-tight">
          入镜 · 调一杯夜
        </h1>
        <p className="mt-6 text-moon-200/70 max-w-xl leading-relaxed font-display">
          镜中自观，调酒仪式，情绪反馈。
          <br />
          在深空里，感官在夜里循环往复。
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
          <GradientButton
            variant="gold"
            size="lg"
            onClick={() => navigate('/hub')}
            className="rounded-capsule duration-orbit-mid ease-orbit"
          >
            入夜 →
          </GradientButton>
          <button
            type="button"
            onClick={() => navigate('/prelude')}
            className="text-xs tracking-[0.3em] text-amethyst-400/60 hover:text-gold-400 transition-colors duration-orbit-mid ease-orbit py-2 px-3"
            aria-label="观看觉醉概念预告"
          >
            概念预告 →
          </button>
        </div>
      </section>

      <div className="divider-gold max-w-2xl mx-auto mb-16" />

      {/* —— 若已有画像 · 当前映照 —— */}
      {profile && (
        <section className="max-w-4xl mx-auto mb-16 animate-slide-up">
          <GlassPanel gold padding="lg" className="rounded-card overflow-visible">
            <div
              className="absolute inset-0 opacity-30 pointer-events-none rounded-2xl"
              style={{
                background: `radial-gradient(ellipse at top right, ${profile.archetype.auraColor}33, transparent 60%)`,
              }}
            />
            <div className="relative flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="text-xs text-amethyst-400/70 tracking-widest mb-2">
                  镜中映照
                </div>
                <div className="font-display text-3xl text-gold-sheen mb-2">
                  {profile.archetype.name}
                </div>
                <div className="text-moon-200/70 text-sm italic leading-relaxed">
                  {profile.archetype.tagline}
                </div>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <GradientButton
                  variant="amethyst"
                  onClick={() => navigate('/cocktail')}
                >
                  查看专属调酒 →
                </GradientButton>
                <button
                  className="text-xs text-amethyst-400/60 hover:text-gold-400 transition-colors duration-orbit-mid ease-orbit"
                  onClick={() => navigate('/personality')}
                >
                  重新织镜
                </button>
              </div>
            </div>
          </GlassPanel>
        </section>
      )}

      {/* —— 主理人 · 镜中之你 —— */}
      <section className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-8">
          <div className="text-[11px] tracking-[0.6em] text-amethyst-400/60 uppercase mb-3 flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orbit-accent animate-orbit-pulse shadow-glow-accent" />
            Host · 镜中之你
          </div>
          <h2 className="font-display text-2xl text-gold-sheen">
            镜中之你
          </h2>
          <p className="text-moon-200/50 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
            完成镜中自观后，镜中人会按时段切换在线状态。
            不是为你调一杯，是陪你看着自己，给此刻调一杯。
          </p>
        </div>

        <GlassPanel padding="lg" className="rounded-card max-w-md mx-auto">
          {profile ? (
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-display text-xl text-moon-50 shrink-0"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${profile.archetype.auraColor}, ${profile.archetype.auraColor}88)`,
                  border: '1px solid rgba(240, 198, 116, 0.25)',
                  boxShadow: `0 4px 16px ${profile.archetype.auraColor}33`,
                }}
              >
                {profile.archetype.code.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg text-gold-sheen">
                  {profile.archetype.name}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full animate-breathe"
                    style={{
                      background: hostState.dotColor,
                      boxShadow: hostState.dotColor !== 'transparent' ? `0 0 6px ${hostState.glowColor}` : 'none',
                    }}
                  />
                  <span className="text-xs text-moon-200/60">
                    {hostState.statusLabel} · {hostState.statusHint}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-display text-sm text-moon-200/40 shrink-0"
                style={{ border: '1px dashed rgba(216, 201, 245, 0.3)' }}
              >
                空
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg text-moon-200/60">
                  镜中未现
                </div>
                <div className="text-xs text-moon-200/50 mt-0.5">
                  完成镜中自观 · 让镜中的你显形
                </div>
              </div>
            </div>
          )}
        </GlassPanel>

        <div className="divider-gold max-w-xs mx-auto mt-8" />
      </section>

      {/* —— 底座双联 · 已造 / 待造 —— */}
      <section className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-8">
          <div className="text-[11px] tracking-[0.6em] text-amethyst-400/60 uppercase mb-3 flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orbit-signal animate-orbit-pulse" />
            Foundation · 底座
          </div>
          <h2 className="font-display text-2xl text-gold-sheen">
            镜的两面
          </h2>
          <p className="text-moon-200/50 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
            思维库照见已实现的认知引擎（向内），
            灵感实验室收容未点亮的灵感（向外）。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 思维库 · 已造（向内） */}
          <button
            type="button"
            onClick={() => navigate('/mind')}
            className="block w-full text-left group cursor-pointer"
            aria-label="进入思维库底座"
          >
            <GlassPanel padding="lg" className="rounded-card relative h-full">
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-500"
                style={{ border: '1px dashed rgba(240, 198, 116, 0.25)' }}
              />
              <div className="relative flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-display text-sm text-moon-200/40 shrink-0 transition-all duration-500 group-hover:text-gold-400/60"
                  style={{ border: '1px dashed rgba(216, 201, 245, 0.3)' }}
                >
                  底
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg text-moon-200/70 group-hover:text-gold-sheen transition-colors duration-500">
                    思维库
                  </div>
                  <div className="text-[10px] text-amethyst-400/50 tracking-[0.2em] uppercase mt-0.5">
                    Mind · 向内
                  </div>
                  <div className="text-xs text-moon-200/50 mt-1">
                    已造好的镜 · 六重底座
                  </div>
                </div>
                <div className="text-gold-400/40 group-hover:text-gold-400 transition-colors duration-500 text-sm tracking-widest">
                  →
                </div>
              </div>
            </GlassPanel>
          </button>

          {/* 灵感实验室 · 待造（向外） */}
          <button
            type="button"
            onClick={() => navigate('/invest')}
            className="block w-full text-left group cursor-pointer"
            aria-label="进入灵感实验室"
          >
            <GlassPanel padding="lg" className="rounded-card relative h-full">
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-500"
                style={{ border: '1px dashed rgba(155, 123, 212, 0.3)' }}
              />
              <div className="relative flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-display text-sm text-moon-200/40 shrink-0 transition-all duration-500 group-hover:text-amethyst-300/70"
                  style={{ border: '1px dashed rgba(216, 201, 245, 0.3)' }}
                >
                  灵
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg text-moon-200/70 group-hover:text-gold-sheen transition-colors duration-500">
                    灵感实验室
                  </div>
                  <div className="text-[10px] text-amethyst-400/50 tracking-[0.2em] uppercase mt-0.5">
                    Ideas · 向外
                  </div>
                  <div className="text-xs text-moon-200/50 mt-1">
                    未点亮的灵感池 · 等你的火
                  </div>
                </div>
                <div className="text-amethyst-400/40 group-hover:text-gold-400 transition-colors duration-500 text-sm tracking-widest">
                  →
                </div>
              </div>
            </GlassPanel>
          </button>

          {/* 扑克对局 · 金融孪生 */}
          <button
            type="button"
            onClick={() => navigate('/poker')}
            className="block w-full text-left group cursor-pointer"
            aria-label="进入扑克对局"
          >
            <GlassPanel padding="lg" className="rounded-card relative h-full">
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-500"
                style={{ border: '1px dashed rgba(240, 198, 116, 0.25)' }}
              />
              <div className="relative flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-display text-sm text-moon-200/40 shrink-0 transition-all duration-500 group-hover:text-gold-400/60"
                  style={{ border: '1px dashed rgba(216, 201, 245, 0.3)' }}
                >
                  扑
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg text-moon-200/70 group-hover:text-gold-sheen transition-colors duration-500">
                    金融孪生对局
                  </div>
                  <div className="text-[10px] text-amethyst-400/50 tracking-[0.2em] uppercase mt-0.5">
                    Poker · 三人德州
                  </div>
                  <div className="text-xs text-moon-200/50 mt-1">
                    你的棋风化身入局 · 与 AI 在筹码间对话
                  </div>
                </div>
                <div className="text-gold-400/40 group-hover:text-gold-400 transition-colors duration-500 text-sm tracking-widest">
                  →
                </div>
              </div>
            </GlassPanel>
          </button>
        </div>

        <div className="divider-gold max-w-xs mx-auto mt-8" />
      </section>
    </div>
  );
}
