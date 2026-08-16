/**
 * TavernPage · 可编程酒馆 · 场所级夜程编排
 *
 * 三层可编程空间的第一层：全场基调由「时间 × 主题」派生
 *   - 主题选择：4 套预设（深空夜航/月潮秘境/焰心工坊/雾行秘境），持久化到本地
 *   - 夜程弧线：opening → rising → climax → closing，由当前时间解析
 *   - 全场基调：环境光 / BPM / 空间香氛强度，随阶段调谐
 *
 * 视觉语言：当前 ambientColor 作为页面背景渐变，营造"全场基调"沉浸感
 * 交互克制：主题卡选中态仅金边 + 微浮，未选中态半透明
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cocktailService } from '../services/cocktailService';
import { TAVERN_THEMES, DEFAULT_TAVERN_THEME } from '../data/tavernThemes';
import { JOURNEY_PHASE_ORDER } from '../data/journeyMeta';
import GlassPanel from '../components/ui/GlassPanel';
import type { TavernTheme, TavernState } from '../types/tavern';
import type { JourneyPhase } from '../types/journey';

const REFRESH_MS = 30_000; // 30s 重新派生夜程状态
const DEV = import.meta.env.DEV;

/** 统一前缀日志 · 方便控制台过滤 `Tavern` */
function logTavern(node: string, payload: Record<string, unknown>) {
  if (!DEV) return;
  console.log(`%c[Tavern:${node}]`, 'color:#d4af7a', payload);
}

export default function TavernPage() {
  const navigate = useNavigate();

  // 主题偏好 · 启动时从本地恢复
  const [theme, setTheme] = useState<TavernTheme>(() => {
    if (typeof window === 'undefined') return DEFAULT_TAVERN_THEME;
    const restored = cocktailService.loadTavernTheme();
    logTavern('theme:restore', {
      code: restored.code,
      name: restored.name,
      from: localStorage.getItem('y-mine-tavern-theme') ? 'localStorage' : 'default',
    });
    return restored;
  });

  // 夜程状态 · 时间驱动，定时刷新
  const [state, setState] = useState<TavernState>(() => {
    const s = cocktailService.getTavernState(theme, new Date());
    logTavern('state:init', {
      theme: theme.code,
      phase: s.phase,
      withinNight: s.withinNight,
      bpm: s.bpm,
      ambientColor: s.ambientColor,
      nightProgress: s.nightProgress,
      phaseProgress: s.phaseProgress,
    });
    return s;
  });

  useEffect(() => {
    // 主题切换时立即重派生
    const s = cocktailService.getTavernState(theme, new Date());
    setState(s);
    logTavern('state:rederive', {
      reason: 'theme changed',
      theme: theme.code,
      phase: s.phase,
      withinNight: s.withinNight,
      bpm: s.bpm,
      ambientColor: s.ambientColor,
    });
  }, [theme]);

  useEffect(() => {
    logTavern('timer:start', { intervalMs: REFRESH_MS, theme: theme.code });
    const id = setInterval(() => {
      const s = cocktailService.getTavernState(theme, new Date());
      setState(s);
      logTavern('state:tick', {
        theme: s.theme.code,
        phase: s.phase,
        withinNight: s.withinNight,
        phaseProgress: s.phaseProgress,
        nightProgress: s.nightProgress,
      });
    }, REFRESH_MS);
    return () => {
      clearInterval(id);
      logTavern('timer:stop', { theme: theme.code });
    };
  }, [theme]);

  const handlePickTheme = (t: TavernTheme) => {
    logTavern('theme:pick', { from: theme.code, to: t.code, name: t.name });
    setTheme(t);
    cocktailService.saveTavernTheme(t);
    logTavern('theme:saved', { code: t.code, storageKey: 'y-mine-tavern-theme' });
  };

  // 整夜进度分段 · 用于弧线渲染
  // 非营业时段（!withinNight）无当前阶段，所有段等亮低透明
  const segments = useMemo(() => {
    return JOURNEY_PHASE_ORDER.map((p) => {
      const meta = state.theme.phaseTuning[p];
      return {
        phase: p,
        color: meta.colorShift,
        isCurrent: state.withinNight && p === state.phase,
      };
    });
  }, [state]);

  return (
    <div
      className="min-h-screen px-6 lg:px-16 py-12 animate-fade-in relative transition-all duration-1000"
      style={{
        // 非营业时段背景更深沉 · 透明度按 withinNight 平滑过渡
        backgroundImage: `radial-gradient(ellipse at top, ${state.ambientColor}${state.withinNight ? '55' : '1a'}, transparent 70%)`,
      }}
    >
      {/* 非营业时段 · 星轨缓动装饰 · 暗夜里的微光 */}
      {!state.withinNight && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <div
            className="absolute top-1/4 left-1/4 w-1 h-1 rounded-full bg-moon-50/40 animate-twinkle-slow"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-gold-400/30 animate-twinkle-slow"
            style={{ animationDelay: '1.2s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-amethyst-300/40 animate-twinkle-slow"
            style={{ animationDelay: '2.4s' }}
          />
          <div
            className="absolute top-2/3 right-1/4 w-1 h-1 rounded-full bg-moon-50/30 animate-twinkle-slow"
            style={{ animationDelay: '0.8s' }}
          />
          <div
            className="absolute top-1/5 right-1/5 w-1.5 h-1.5 rounded-full bg-gold-300/20 animate-twinkle-slow"
            style={{ animationDelay: '1.8s' }}
          />
        </div>
      )}

      {/* —— Hero · 全场基调 —— */}
      <section className="flex flex-col items-center text-center pt-4 pb-12 relative">
        <div className="text-[11px] tracking-[0.6em] text-amethyst-400/80 uppercase mb-4">
          Programmable Tavern
        </div>
        <h1 className="font-display text-5xl lg:text-6xl text-gold-sheen text-shadow-glow-gold leading-tight">
          可编程酒馆
        </h1>
        <p className="mt-5 text-moon-200/70 max-w-xl leading-relaxed font-display">
          {state.withinNight
            ? '时间织出夜程，主题染上基调。'
            : '夜尚未启，主题已在暗处候场。'}
          <br />
          {state.withinNight
            ? '全场氛围由「时间 × 主题」派生，无需画像即可调谐。'
            : '夜启之时，全场氛围即刻由「时间 × 主题」苏醒。'}
        </p>

        {/* 当前主题符号 · 呼吸 · 非营业时段沉睡态 */}
        <div className="relative mt-8 mb-2">
          <div
            className={`w-20 h-20 rounded-full relative transition-all duration-1000 ${
              state.withinNight ? 'animate-breathe' : ''
            }`}
            style={{
              background: `radial-gradient(circle at 30% 30%, ${state.theme.accentColor}, ${state.theme.ambientColor})`,
              boxShadow: state.withinNight
                ? `0 0 32px ${state.theme.accentColor}66`
                : `0 0 16px ${state.theme.accentColor}22`,
              opacity: state.withinNight ? 1 : 0.55,
              filter: state.withinNight ? 'none' : 'saturate(0.6) brightness(0.85)',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center font-display text-3xl text-moon-50/90">
              {state.theme.symbol}
            </div>
            <div className="absolute inset-0 rounded-full border border-gold-400/30" />
          </div>
          {/* 非营业时段 · 月落标识 */}
          {!state.withinNight && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.4em] text-amethyst-400/50 uppercase whitespace-nowrap">
              dormant
            </div>
          )}
        </div>
        <div className="font-display text-xl text-gold-sheen">{state.theme.name}</div>
        <div className="text-moon-200/50 text-sm italic mt-1">{state.theme.tagline}</div>
      </section>

      <div className="divider-gold max-w-2xl mx-auto mb-12" />

      {/* —— 夜程弧线 · 四阶段 —— */}
      <section className="max-w-4xl mx-auto mb-12">
        <div className="text-center mb-6">
          <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-2">
            Night Curve
          </div>
          <h2 className="font-display text-2xl text-moon-50">夜程弧线</h2>
        </div>

        <GlassPanel padding="lg">
          {/* 四阶段分段条 · 非营业时段全部低饱和待启态 */}
          <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-4">
            {segments.map((seg, i) => (
              <div
                key={seg.phase}
                className="flex-1 relative transition-all duration-1000"
                style={{
                  background: seg.color,
                  // 非营业时段 · 全部降至待启低饱和；营业时段 · 当前段满亮其余半暗
                  opacity: state.withinNight ? (seg.isCurrent ? 1 : 0.4) : 0.18,
                  boxShadow: seg.isCurrent && state.withinNight ? `0 0 12px ${seg.color}` : 'none',
                  filter: state.withinNight ? 'none' : 'saturate(0.4)',
                }}
              >
                {i > 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-void/40" />
                )}
              </div>
            ))}
          </div>

          {/* 阶段标签 · 非营业时段全部低透明无诗 */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {JOURNEY_PHASE_ORDER.map((p) => {
              const meta = state.phaseMeta && p === state.phase ? state.phaseMeta : null;
              const labelMap: Record<JourneyPhase, string> = {
                opening: '开场',
                rising: '上升',
                climax: '高潮',
                closing: '收尾',
              };
              const isCurrent = p === state.phase;
              return (
                <div
                  key={p}
                  className={`text-center transition-all duration-700 ${
                    state.withinNight
                      ? isCurrent
                        ? 'opacity-100'
                        : 'opacity-50'
                      : 'opacity-30'
                  }`}
                >
                  <div
                    className={`font-display text-sm ${
                      state.withinNight && isCurrent ? 'text-gold-sheen' : 'text-moon-200/70'
                    }`}
                  >
                    {labelMap[p]}
                  </div>
                  {state.withinNight && isCurrent && meta && (
                    <div className="text-[10px] text-amethyst-400/70 mt-1 italic leading-tight">
                      {meta.poem}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 整夜进度数值 / 夜未启兜底 */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-moon-200/50">
              {state.withinNight ? '整夜进度' : '夜程状态'}
            </span>
            {state.withinNight ? (
              <span className="text-gold-sheen font-display">
                {Math.round(state.nightProgress * 100)}%
              </span>
            ) : (
              <span className="text-amethyst-300/80 font-display tracking-widest">
                夜未启 · 20:00 启幕
              </span>
            )}
          </div>
        </GlassPanel>
      </section>

      {/* —— 全场基调 · 派生状态 —— */}
      <section className="max-w-4xl mx-auto mb-12">
        <div className="text-center mb-6">
          <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-2">
            Ambient
          </div>
          <h2 className="font-display text-2xl text-moon-50">全场基调</h2>
          <p className="text-moon-200/50 text-sm mt-2">
            {state.withinNight
              ? `由「${state.theme.name}」×「${state.phaseMeta.label}」派生`
              : `「${state.theme.name}」已预选 · 夜启后即刻生效`}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* 环境光 */}
          <GlassPanel padding="md">
            <div className="text-xs text-amethyst-400/60 tracking-widest mb-3">AMBIENT LIGHT</div>
            <div
              className="w-full h-16 rounded-lg mb-3 transition-all duration-700"
              style={{
                background: `linear-gradient(135deg, ${state.ambientColor}, ${state.theme.accentColor}88)`,
                boxShadow: `inset 0 0 24px ${state.theme.accentColor}33`,
              }}
            />
            <div className="text-sm text-moon-200/80 font-mono">{state.ambientColor}</div>
          </GlassPanel>

          {/* BPM */}
          <GlassPanel padding="md">
            <div className="text-xs text-amethyst-400/60 tracking-widest mb-3">BPM</div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl text-gold-sheen">{state.bpm}</span>
              <span className="text-xs text-moon-200/50">beats/min</span>
            </div>
            <div className="mt-3 text-[11px] text-moon-200/50 italic leading-relaxed">
              {state.theme.musicStyle}
            </div>
          </GlassPanel>

          {/* 空间香氛强度 */}
          <GlassPanel padding="md">
            <div className="text-xs text-amethyst-400/60 tracking-widest mb-3">SCENT</div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-display text-2xl text-gold-sheen">
                {state.theme.ambientScentLabel}
              </span>
            </div>
            <div className="w-full h-1.5 bg-void/60 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${state.ambientScentIntensity * 100}%`,
                  background: `linear-gradient(to right, ${state.theme.accentColor}, ${state.theme.accentColor}aa)`,
                }}
              />
            </div>
            <div className="mt-2 text-[11px] text-moon-200/50">
              强度 {Math.round(state.ambientScentIntensity * 100)}%
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* —— 主题选择 —— */}
      <section className="max-w-5xl mx-auto mb-12">
        <div className="text-center mb-6">
          <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-2">
            Themes
          </div>
          <h2 className="font-display text-2xl text-moon-50">场所主题</h2>
          <p className="text-moon-200/50 text-sm mt-2">
            选一套基调，整场夜随之调谐
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TAVERN_THEMES.map((t) => {
            const active = t.code === theme.code;
            return (
              <GlassPanel
                key={t.code}
                gold={active}
                padding="md"
                hover={!active}
                onClick={() => handlePickTheme(t)}
                className={active ? 'ring-1 ring-gold-400/50' : ''}
                style={{
                  backgroundImage: `radial-gradient(ellipse at top right, ${t.ambientColor}66, transparent 70%)`,
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-display text-lg"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${t.accentColor}, ${t.ambientColor})`,
                      boxShadow: `0 0 12px ${t.accentColor}55`,
                    }}
                  >
                    <span className="text-moon-50/90">{t.symbol}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-display text-base ${active ? 'text-gold-sheen' : 'text-moon-50'}`}>
                      {t.name}
                    </div>
                    <div className="text-[10px] text-amethyst-400/60 tracking-widest uppercase mt-0.5">
                      {t.code}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-moon-200/60 italic leading-relaxed mb-3">
                  {t.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amethyst-500/15 text-amethyst-300/80">
                    {t.musicStyle.split(' · ')[0]}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300/80">
                    {t.ambientScentLabel}
                  </span>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      </section>

      {/* —— 三层架构 · 导引 —— */}
      <section className="max-w-4xl mx-auto mb-8">
        <div className="text-center mb-6">
          <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-2">
            Three Layers
          </div>
          <h2 className="font-display text-2xl text-moon-50">三层可编程空间</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* 当前层 · 酒馆 */}
          <GlassPanel gold padding="md">
            <div className="text-[10px] text-gold-400/80 tracking-widest mb-2">LAYER 1 · 当前</div>
            <div className="font-display text-lg text-gold-sheen mb-2">可编程酒馆</div>
            <p className="text-xs text-moon-200/60 leading-relaxed mb-3">
              场所级氛围编排 · 主题 × 夜程曲线
            </p>
            <div className="text-[10px] text-amethyst-400/60">您正在此层</div>
          </GlassPanel>

          {/* 调酒空间 */}
          <GlassPanel
            padding="md"
            hover
            onClick={() => navigate('/cocktail')}
          >
            <div className="text-[10px] text-amethyst-400/60 tracking-widest mb-2">LAYER 2</div>
            <div className="font-display text-lg text-moon-50 mb-2">可编程调酒空间</div>
            <p className="text-xs text-moon-200/60 leading-relaxed mb-3">
              调酒体验交互区 · 向量 × 情绪 × 时段
            </p>
            <div className="text-[10px] text-amethyst-400/60">→ 前往调酒</div>
          </GlassPanel>

          {/* 吧台 */}
          <GlassPanel
            padding="md"
            hover
            onClick={() => navigate('/bar-counter')}
          >
            <div className="text-[10px] text-amethyst-400/60 tracking-widest mb-2">LAYER 3</div>
            <div className="font-display text-lg text-moon-50 mb-2">可编程吧台</div>
            <p className="text-xs text-moon-200/60 leading-relaxed mb-3">
              单杯硬件联动 · 杯垫 × 光效 × 气味
            </p>
            <div className="text-[10px] text-amethyst-400/60">→ 进入吧台</div>
          </GlassPanel>
        </div>
      </section>

      {/* —— 引语 —— */}
      <section className="text-center py-8">
        <div className="font-display text-moon-200/40 text-lg italic leading-relaxed max-w-md mx-auto">
          「夜有四态，杯有一种，
          <br />
          二者相遇，便是全场。」
        </div>
        <div className="divider-gold max-w-xs mx-auto mt-6" />
      </section>

      {/* 底部留白 */}
      <div className="h-8" />
    </div>
  );
}
