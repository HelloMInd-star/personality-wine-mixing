/**
 * CocktailPage · 调酒配方库主页面
 * 三层信息架构：Ⅰ 基础酒单 → Ⅱ 角色扮演 → Ⅲ 创意调酒
 * 有人格画像 · 织就契合推荐；无人格画像 · 浏览全部夜之酒单
 * 搜索与情绪筛选始终作用于「全部酒单」区，与推荐区互不干扰
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useCocktail } from '../hooks/useCocktail';
import { useJourney } from '../hooks/useJourney';
import { COCKTAILS } from '../data/cocktails';
import type { Cocktail, CocktailRecommendation, MoodTag } from '../types/cocktail';
import GlassPanel from '../components/ui/GlassPanel';
import GradientButton from '../components/ui/GradientButton';
import CocktailCard from '../components/cocktail/CocktailCard';
import CocktailDetail from '../components/cocktail/CocktailDetail';
import MoodDial from '../components/cocktail/MoodDial';
import JourneyArc from '../components/cocktail/JourneyArc';
import MusicControl from '../components/cocktail/MusicControl';
import LightCanvas from '../components/cocktail/LightCanvas';
import ScentCard from '../components/cocktail/ScentCard';
import PlaylistSelector from '../components/cocktail/PlaylistSelector';
import SanctuarySpace from '../components/cocktail/SanctuarySpace';
import RatingCard from '../components/cocktail/RatingCard';
import CocktailBuilder from '../components/cocktail/CocktailBuilder';
import { DIM_LABEL, type PersonaDim } from '../types/personaFusion';
import { resolveTimeSlot, describeBiologyShift, applyBiologyShift } from '../engine/timeEngine';
import { profileToVector } from '../engine/profileToVector';

/** 情绪标签中文映射 · 筛选药丸的文案来源 */
const MOOD_LABELS: Record<MoodTag, string> = {
  calm: '沉静',
  passion: '热烈',
  melancholy: '怅然',
  elegant: '雅致',
  rebel: '叛逆',
  romantic: '浪漫',
  mystery: '神秘',
  celebration: '庆典',
};

const MOOD_KEYS = Object.keys(MOOD_LABELS) as MoodTag[];

/** 三层分段标题 · 统一深空紫金语系 */
function SectionHeader({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8 mt-16 first:mt-0">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs tracking-[0.4em] text-amethyst-400/60">{index}</span>
        <h2 className="font-display text-2xl md:text-3xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
          {title}
        </h2>
      </div>
      <div className="divider-gold mt-3 w-32" />
      <p className="text-sm text-moon-200/50 italic mt-2">{subtitle}</p>
    </div>
  );
}

export default function CocktailPage() {
  const navigate = useNavigate();
  const {
    profile,
    vector,
    activeMood,
    moodIntensity,
    setActiveMood,
    setMoodIntensity,
    audioEnabled,
    musicVolume,
    setAudioEnabled,
    setMusicVolume,
    manualTimeSlot,
    setManualTimeSlot,
    getCalibratedVector,
    feedbackHistory,
  } = useAppStore();

  // 说明卡片关闭态 · sessionStorage 持久化（同会话不重复打扰）
  const [dismissGuide, setDismissGuide] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('ymine-guide-dismissed') === '1';
    } catch {
      return false;
    }
  });

  const dismissGuideCard = useCallback(() => {
    setDismissGuide(true);
    try {
      sessionStorage.setItem('ymine-guide-dismissed', '1');
    } catch {
      /* sessionStorage 不可用 · 静默降级 */
    }
  }, []);

  // 是否首次进入 · 无评分历史 = 首次（与反馈回路串联）
  const isFirstVisit = feedbackHistory.length === 0;

  // 评分即理解 · 用户完成首次评分后自动关闭说明卡（闭环语义）
  useEffect(() => {
    if (feedbackHistory.length > 0 && !dismissGuide) {
      dismissGuideCard();
    }
  }, [feedbackHistory.length, dismissGuide, dismissGuideCard]);

  // 临时日志 · 验证是否首次进入（无评分历史 = 首次）
  useEffect(() => {
    const hasVector = !!vector;
    const hasProfile = !!profile;
    console.debug('[CocktailPage:visit-check]', {
      isFirstVisit,
      feedbackCount: feedbackHistory.length,
      hasVector,
      hasProfile,
      guideVisible: isFirstVisit && !dismissGuide,
      timestamp: new Date().toISOString(),
    });
  }, [isFirstVisit, feedbackHistory.length, vector, profile, dismissGuide]);
  const {
    journeyRecommendations,
    refreshByJourney,
    refreshByJourneyVector,
    selectedCocktail,
    selectCocktail,
    search,
    searchKeyword,
    searchResults,
    filterByMoodTag,
  } = useCocktail(profile?.flavorPreference);

  // 旅程派生 · 阶段 + 曲目 + 音乐 + 光效 + 气味 + 歌单档位联动
  const {
    journeyState,
    currentTrack,
    isPlaying,
    lightEffect,
    scentProfile,
    currentTier,
    onTierChange,
  } = useJourney();

  // 时段校准 · 同一人格在不同时段不同推荐（基于生物学昼夜节律）
  // dynamicVector = 基础向量 + 当前时段 biologyShifts · 作为推荐的真实输入
  const currentSlot = resolveTimeSlot(new Date(), manualTimeSlot);
  const bioShifts = describeBiologyShift(currentSlot);
  // 校准向量优先 · 评分闭环回流 · 无评分退化为原始向量 · 再兜底 profile 派生
  // useMemo 稳定引用 · 避免 applyBiologyShift 每次渲染返回新对象触发 useEffect 死循环
  const dynamicVector = useMemo(() => {
    const calibratedBase = getCalibratedVector() ?? vector ?? (profile ? profileToVector(profile) : null);
    return calibratedBase ? applyBiologyShift(calibratedBase, currentSlot) : null;
  }, [getCalibratedVector, vector, profile, currentSlot]);

  // 画像 / 动态向量 / 时段 / 情绪 / 强度变化时刷新旅程推荐 · 动态向量优先（含时段校准）
  useEffect(() => {
    if (dynamicVector) {
      refreshByJourneyVector(dynamicVector, activeMood, moodIntensity);
    } else if (profile) {
      refreshByJourney(profile, activeMood, moodIntensity);
    }
  }, [dynamicVector, profile, activeMood, moodIntensity, refreshByJourney, refreshByJourneyVector]);

  // 详情开关与理由 · 与 hook 的 selectedCocktail 协同
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReasons, setDetailReasons] = useState<string[]>([]);

  // Builder 调酒完成态 · 传出稳定 recipeId 供评分回路 · 优先于酒单选择的酒
  const [lastCrafted, setLastCrafted] = useState<{ recipeId: string; name: string } | null>(null);

  // 情绪筛选本地态 · 与搜索互斥（与情绪调节器分离）
  const [filterMood, setFilterMood] = useState<MoodTag | null>(null);
  const [moodResults, setMoodResults] = useState<Cocktail[]>([]);

  const handleSelect = (id: string, reasons: string[]) => {
    selectCocktail(id);
    setDetailReasons(reasons);
    setDetailOpen(true);
  };

  const handleClose = () => setDetailOpen(false);

  const handleSearch = (kw: string) => {
    search(kw);
    // 搜索时清空情绪筛选 · 两者互斥
    setFilterMood(null);
    setMoodResults([]);
  };

  const handleMoodClick = (mood: MoodTag) => {
    if (filterMood === mood) {
      // 再次点击同一情绪 · 取消筛选
      setFilterMood(null);
      setMoodResults([]);
      return;
    }
    const results = filterByMoodTag(mood);
    setFilterMood(mood);
    setMoodResults(results);
    // 情绪筛选时清空搜索
    search('');
  };

  // 酒单展示列表 · 搜索优先于情绪，再回退全量
  const displayedMenu: Cocktail[] = searchKeyword.trim()
    ? searchResults
    : filterMood
      ? moodResults
      : COCKTAILS;

  // 浏览酒单时构造无契合度的推荐对象 · 供 CocktailCard 统一渲染
  const menuRecommendations: CocktailRecommendation[] = displayedMenu.map((c) => ({
    cocktail: c,
    matchScore: 0,
    reasons: [],
  }));

  const hasPersona = !!(profile || vector);

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 页面标题区 */}
      <header className="mb-10 md:mb-14">
        <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
          调酒 · Elixir
        </h1>
        <p className="mt-2 text-sm md:text-base text-moon-200/60 italic">
          每一杯，都是夜为你写下的一则注脚。
        </p>
        <div className="divider-gold mt-5 w-40" />
      </header>

      {/* 时段校准横幅 · 同一人格在不同时段不同推荐（基于生物学昼夜节律） */}
      <GlassPanel padding="md" className="mb-10">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at 20% 50%, ${currentSlot.auraColor}33, transparent 60%)`,
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <span
              className="inline-block w-2 h-2 rounded-full animate-breathe"
              style={{ background: currentSlot.auraColor, boxShadow: `0 0 10px ${currentSlot.auraColor}` }}
            />
            <div>
              <div className="text-[10px] tracking-[0.3em] text-amethyst-400/60 uppercase">时段校准</div>
              <div className="font-display text-gold-sheen text-sm">
                {currentSlot.label} · {currentSlot.orbState}
              </div>
            </div>
          </div>
          <div className="flex-1 text-xs text-moon-200/55 italic leading-relaxed">
            {currentSlot.biologyNote} · {currentSlot.poem}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono shrink-0">
            {bioShifts.map(({ dim, sign, delta }) => (
              <span
                key={dim}
                className={sign === '+' ? 'text-gold-400/80' : 'text-amethyst-300/70'}
              >
                {DIM_LABEL[dim]}{sign}{delta.toFixed(2)}
              </span>
            ))}
            {manualTimeSlot && (
              <button
                type="button"
                onClick={() => setManualTimeSlot(null)}
                className="text-[10px] text-amethyst-400/50 hover:text-gold-400 transition-colors ml-1"
              >
                ↺ 系统时间
              </button>
            )}
          </div>
        </div>
        {vector && dynamicVector && bioShifts.length > 0 && (
          <div className="relative mt-2 text-[10px] text-amethyst-400/40 tracking-widest">
            推荐已随「{currentSlot.label}」时段动态校准 · 入口星球切换可改变这一杯
          </div>
        )}
      </GlassPanel>

      {/* 人格调酒说明卡 · 仅首次进入（无评分历史）且未关闭时展示 · 评分后自动消失 */}
      {hasPersona && isFirstVisit && !dismissGuide && (
        <GlassPanel gold padding="md" className="mb-10 max-w-3xl mx-auto relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background:
                'radial-gradient(ellipse at 100% 0%, rgba(240,198,116,0.25) 0%, transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(124,95,191,0.25) 0%, transparent 55%)',
            }}
          />
          <div className="relative">
            {/* 标题区 */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background:
                    'linear-gradient(135deg, var(--amethyst-500, #7c5fbf) 0%, var(--gold-400, #f0c674) 100%)',
                  boxShadow: '0 0 14px rgba(240,198,116,0.35)',
                }}
              >
                <span className="font-display text-base text-void-900">◆</span>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase">
                  How It Works · 使用指南
                </div>
                <h3 className="font-display text-lg text-gold-sheen tracking-[0.1em]">
                  人格调酒 · 五步成夜
                </h3>
              </div>
            </div>

            {/* 五步流程 · 横向步骤条 */}
            <ol className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2">
              {[
                { n: '①', t: '人格采集', d: '落定六维向量' },
                { n: '②', t: '时段校准', d: '生物钟偏移' },
                { n: '③', t: '选酒入夜', d: '契合夜色推荐' },
                { n: '④', t: '喝后评分', d: '收集味觉信号' },
                { n: '⑤', t: '向量校准', d: '下一杯更懂你' },
              ].map((step, idx) => (
                <li
                  key={step.n}
                  className="relative flex flex-col items-center text-center px-1 py-2 rounded-lg transition-colors duration-300 hover:bg-white/[0.03]"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-display text-sm mb-1.5"
                    style={{
                      background: 'rgba(240,198,116,0.1)',
                      border: '1px solid rgba(240,198,116,0.4)',
                      color: 'var(--gold-400, #f0c674)',
                      boxShadow: '0 0 8px rgba(240,198,116,0.2)',
                    }}
                  >
                    {step.n}
                  </div>
                  <div className="text-xs font-display text-moon-50/90 tracking-[0.05em]">
                    {step.t}
                  </div>
                  <div className="text-[10px] text-moon-200/50 italic mt-0.5 leading-tight">
                    {step.d}
                  </div>
                  {/* 步骤间箭头 · 仅 sm 以上展示 */}
                  {idx < 4 && (
                    <span
                      className="hidden sm:block absolute top-4 -right-1.5 text-amethyst-400/40 text-xs pointer-events-none"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  )}
                </li>
              ))}
            </ol>

            {/* 反馈回路说明 · 强调闭环 */}
            <p className="mt-4 text-[11px] text-moon-200/55 italic leading-relaxed text-center">
              第 ④⑤步构成反馈回路 · 你的每一次评分都会校准向量，让下一杯更贴近此刻的你。
            </p>

            {/* 关闭入口 */}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={dismissGuideCard}
                className="text-[11px] tracking-[0.2em] text-amethyst-400/60 hover:text-gold-400 transition-colors duration-300 font-mono uppercase"
              >
                了解了 · 入夜
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 既无画像也无向量 · 引导提示卡 */}
      {!profile && !vector && (
        <GlassPanel padding="lg" className="mb-10">
          <div className="flex flex-col items-center text-center max-w-xl mx-auto">
            <h2 className="font-display text-2xl text-moon-50 mb-2">
              尚未织就画像
            </h2>
            <p className="text-sm text-moon-200/65 leading-relaxed mb-6">
              先去人格页落定你的夜之轮廓，或直接浏览全部酒单，让一杯酒自己来找你。
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <GradientButton
                variant="gold"
                size="md"
                onClick={() => navigate('/personality')}
              >
                去测评
              </GradientButton>
              <GradientButton
                variant="ghost"
                size="md"
                onClick={() =>
                  document
                    .getElementById('cocktail-menu')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                浏览全部
              </GradientButton>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* ═══════════════════════════════════════
       *  Ⅰ · 基础酒单 · 引导调酒 + 契合推荐 + 全部酒单
       * ═══════════════════════════════════════ */}
      <SectionHeader
        index="Ⅰ"
        title="基础酒单"
        subtitle="从步进调酒或酒单开始 · 落定今夜的第一杯"
      />

      {/* 步进式调酒搭建 · 主入口 · 有画像或向量时显示 */}
      {hasPersona && (
        <section className="mb-12">
          <CocktailBuilder
            dynamicVector={dynamicVector}
            onCrafted={setLastCrafted}
          />
        </section>
      )}

      {/* 旅程契合推荐 · 画像或向量任一存在 · 阶段刺激档位加权 */}
      {hasPersona && journeyRecommendations.length > 0 && (
        <section className="mb-12">
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <h3 className="font-display text-xl md:text-2xl text-moon-200/80 tracking-[0.1em]">
              旅程契合推荐
            </h3>
            <span
              className="text-xs tracking-[0.15em] font-display transition-colors duration-500"
              style={{ color: journeyState.meta.color }}
            >
              {journeyState.meta.symbol} · {journeyState.meta.label}
            </span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {journeyRecommendations.map((rec) => (
              <CocktailCard
                key={rec.cocktail.id}
                recommendation={rec}
                onSelect={(id) => handleSelect(id, rec.reasons)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 酒单区 · 搜索与筛选始终显示 */}
      <section id="cocktail-menu">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h3 className="font-display text-xl md:text-2xl text-moon-200/80 tracking-[0.1em]">
            {profile ? '全部酒单' : '夜之酒单'}
          </h3>
          <span className="text-xs text-moon-200/40 font-mono">
            {displayedMenu.length} 款
          </span>
        </div>

        {/* 搜索框 */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索酒名、基酒或情绪…"
              className="w-full px-4 py-2.5 pl-10 rounded-xl bg-void-700/60 border border-amethyst-500/25 text-sm text-moon-50 placeholder-moon-200/35 focus:outline-none focus:border-gold-400/50 focus:shadow-glow-gold transition-all duration-300"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moon-200/40 text-sm pointer-events-none">
              ⌕
            </span>
            {searchKeyword && (
              <button
                type="button"
                onClick={() => handleSearch('')}
                aria-label="清空"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-moon-200/40 hover:text-gold-400 transition-colors text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 情绪标签筛选 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {MOOD_KEYS.map((mood) => {
            const active = filterMood === mood;
            return (
              <button
                key={mood}
                type="button"
                onClick={() => handleMoodClick(mood)}
                className={`px-3 py-1 rounded-full text-xs tracking-[0.1em] border transition-all duration-300 ${
                  active
                    ? 'border-gold-400/60 text-gold-400 bg-gold-400/10 shadow-glow-gold'
                    : 'border-amethyst-500/30 text-moon-200/60 hover:border-amethyst-400/50 hover:text-moon-200/90'
                }`}
              >
                {MOOD_LABELS[mood]}
              </button>
            );
          })}
        </div>

        {/* 酒单网格 */}
        {displayedMenu.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {menuRecommendations.map((rec) => (
              <CocktailCard
                key={rec.cocktail.id}
                recommendation={rec}
                onSelect={(id) => handleSelect(id, [])}
                showMatch={false}
              />
            ))}
          </div>
        ) : (
          <GlassPanel padding="lg">
            <p className="text-center text-sm text-moon-200/50 italic">
              夜里没有找到这一杯。换一个词，或换一种心情。
            </p>
          </GlassPanel>
        )}
      </section>

      {/* 喝后评分 · 闭环节点 · 基础酒单之后 · 优先评 Builder 调的酒，回退酒单选择的酒 */}
      {hasPersona && (lastCrafted || (!detailOpen && selectedCocktail)) && (
        <RatingCard
          recipeId={lastCrafted?.recipeId ?? selectedCocktail!.id}
          recommendedVec={dynamicVector ?? undefined}
          className="mt-10 max-w-md mx-auto"
        />
      )}

      {/* ═══════════════════════════════════════
       *  Ⅱ · 创意调酒 · 人格 / 情绪 / 杯垫 / 气味
       * ═══════════════════════════════════════ */}
      {hasPersona && (
        <>
          <SectionHeader
            index="Ⅱ"
            title="创意调酒"
            subtitle="人格 · 情绪 · 杯垫 · 气味 · 调酒的创意氛围层"
          />

          {/* 有人格画像 · 画像摘要条 */}
          {profile && (
            <GlassPanel gold padding="md" className="mb-10">
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  background: `radial-gradient(ellipse at 0% 50%, ${profile.archetype.auraColor}44 0%, transparent 60%)`,
                }}
              />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-mono text-xs tracking-[0.3em] text-amethyst-400/80">
                    {profile.archetype.code}
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl text-gold-sheen text-shadow-glow-gold mt-1">
                    {profile.archetype.name}
                  </h2>
                  <p className="text-sm text-moon-200/70 italic mt-1">
                    {profile.archetype.tagline}
                  </p>
                  <p className="text-xs text-moon-200/50 mt-2">
                    这是为你织就的几杯夜。
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <GradientButton
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/bar-counter')}
                  >
                    单杯编排 →
                  </GradientButton>
                  <GradientButton
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/personality')}
                  >
                    重新测评
                  </GradientButton>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* 仅有向量无画像 · 向量契约摘要条 */}
          {!profile && vector && (
            <GlassPanel gold padding="md" className="mb-10">
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  background: `radial-gradient(ellipse at 0% 50%, #7c5fbf44 0%, transparent 60%)`,
                }}
              />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-mono text-xs tracking-[0.3em] text-amethyst-400/80">
                    VECTOR · 六维契约
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl text-gold-sheen text-shadow-glow-gold mt-1">
                    牌类人格已采集
                  </h2>
                  <p className="text-sm text-moon-200/70 italic mt-1">
                    六维向量已织就，正为你派今夜的酒。
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-mono text-moon-200/60 max-w-xs">
                    {(Object.keys(DIM_LABEL) as PersonaDim[]).map((dim) => (
                      <span key={dim} className="flex items-center gap-1.5">
                        <span className="text-amethyst-400/70">{DIM_LABEL[dim]}</span>
                        <span className="text-moon-50/80">
                          {vector[dim] >= 0 ? '+' : ''}
                          {vector[dim].toFixed(2)}
                        </span>
                      </span>
                    ))}
                  </div>
                  <GradientButton
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/bar-counter')}
                  >
                    单杯编排 →
                  </GradientButton>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* 情绪调节器 · 主动控件 */}
          <MoodDial
            activeMood={activeMood}
            intensity={moodIntensity}
            onMoodChange={setActiveMood}
            onIntensityChange={setMoodIntensity}
          />

          {/* 情绪回路弧线 + 旅程音乐 + 四梯度歌单 + 杯底光效 */}
          <JourneyArc journeyState={journeyState} />
          <MusicControl
            track={currentTrack}
            isPlaying={isPlaying}
            volume={musicVolume}
            onTogglePlay={() => setAudioEnabled(!audioEnabled)}
            onVolumeChange={setMusicVolume}
          />
          <PlaylistSelector
            currentTier={currentTier}
            onTierChange={onTierChange}
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

          {/* 树洞空间 · 旅程收尾仪式 · 三入口 + 暗号征集计划 */}
          <SanctuarySpace />
        </>
      )}

      {/* 详情模态 */}
      {detailOpen && selectedCocktail && (
        <CocktailDetail
          cocktail={selectedCocktail}
          reasons={detailReasons}
          onClose={handleClose}
        />
      )}

      {/* 底部留白 */}
      <div className="h-16" />
    </div>
  );
}
