/**
 * 调酒故事预览页 · 临时用于验证 cocktailStoryEngine 输出效果
 * 路由: /brew/story-preview
 */

import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/ui/GlassPanel';
import { generateFromMbti, type StoryOutput } from '../engine/cocktailStoryEngine';
import { GIN_COCKTAILS } from '../data/cocktailLibrary/gin';
import { logger } from '../engine/logger';

const MBTI_OPTIONS = [
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
];

const COCKTAIL_OPTIONS = GIN_COCKTAILS.map((c) => ({ id: c.id, name: c.name, nameEn: c.nameEn }));

export default function StoryPreviewPage() {
  const [mbti, setMbti] = useState('ISTJ');
  const [cocktailId, setCocktailId] = useState('gin-dry-martini');

  const story = useMemo<StoryOutput | null>(() => {
    const cocktail = GIN_COCKTAILS.find((c) => c.id === cocktailId);
    if (!cocktail) return null;
    try {
      const result = generateFromMbti(mbti, cocktail);
      logger.engine('Story:preview', { mbti, cocktail: cocktail.name });
      return result;
    } catch (e) {
      logger.error('Story:preview:error', e);
      return null;
    }
  }, [mbti, cocktailId]);

  const handleMbtiClick = useCallback((m: string) => {
    setMbti(m);
  }, []);

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 标题 */}
      <header className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-[11px] tracking-[0.6em] text-amethyst-400/80 uppercase mb-3">
              酿 · 故事 · Story Preview
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
              调酒故事预览
            </h1>
          </div>
          <Link
            to="/brew/molecular"
            className="text-xs text-amethyst-300/70 hover:text-amethyst-200 transition-colors tracking-[0.1em]"
          >
            ← 返回分子实验室
          </Link>
        </div>
        <div className="divider-gold mt-5 w-40" />
      </header>

      {/* 选择器 */}
      <GlassPanel padding="md" className="mb-8">
        <div className="space-y-5">
          {/* MBTI 选择 */}
          <div>
            <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-3">
              MBTI 人格类型
            </div>
            <div className="flex flex-wrap gap-2">
              {MBTI_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => handleMbtiClick(m)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all tracking-[0.05em] ${
                    mbti === m
                      ? 'border-gold-400/50 bg-gold-400/10 text-gold-400'
                      : 'border-amethyst-500/20 text-moon-200/50 hover:border-amethyst-500/40'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 酒款选择 */}
          <div>
            <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-3">
              金酒酒款
            </div>
            <select
              value={cocktailId}
              onChange={(e) => setCocktailId(e.target.value)}
              className="w-full md:w-80 px-3 py-2 text-xs bg-void-700/80 border border-amethyst-500/20 rounded-lg text-moon-200/70 focus:border-gold-400/40 focus:outline-none transition-colors"
            >
              {COCKTAIL_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassPanel>

      {/* 故事输出 */}
      {story && (
        <GlassPanel gold padding="lg" className="mb-8">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-2">
              {story.subtitleEn}
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-gold-sheen tracking-[0.15em] mb-2">
              {story.title}
            </h2>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="px-2 py-0.5 text-[10px] rounded-full border border-amethyst-500/30 text-amethyst-300/80 bg-amethyst-500/5">
                {story.meta.mbti}
              </span>
              <span className="px-2 py-0.5 text-[10px] rounded-full border border-gold-400/30 text-gold-400/80 bg-gold-400/5">
                {story.meta.tag}
              </span>
              <span className="px-2 py-0.5 text-[10px] rounded-full border border-moon-200/20 text-moon-200/50">
                {story.meta.abv}% ABV
              </span>
            </div>
          </div>

          <div className="divider-gold mb-8" />

          {/* 序章 */}
          <section className="mb-8">
            <div className="text-[10px] tracking-[0.3em] text-gold-400/60 uppercase mb-4 text-center">
              序章 · 人格底色
            </div>
            <div className="text-sm text-moon-200/80 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
              {story.opening}
            </div>
          </section>

          <div className="divider-gold mb-8" />

          {/* 风味叙事 */}
          <section className="mb-8">
            <div className="text-[10px] tracking-[0.3em] text-gold-400/60 uppercase mb-4 text-center">
              风味叙事
            </div>
            <div className="text-sm text-moon-200/80 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
              {story.flavorNarrative}
            </div>
          </section>

          <div className="divider-gold mb-8" />

          {/* 场景时刻 */}
          <section className="mb-8">
            <div className="text-[10px] tracking-[0.3em] text-gold-400/60 uppercase mb-4 text-center">
              场景时刻
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {story.scenes.map((scene, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-white/[0.03] border border-amethyst-500/10 text-sm text-moon-200/70 leading-relaxed"
                >
                  <div className="text-[10px] tracking-[0.2em] text-amethyst-400/50 uppercase mb-2">
                    场景 {i + 1}
                  </div>
                  {scene}
                </div>
              ))}
            </div>
          </section>

          <div className="divider-gold mb-8" />

          {/* 金句 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] text-gold-400/60 uppercase mb-4 text-center">
              落款 · 金句
            </div>
            <blockquote className="text-lg text-gold-400/90 text-center italic max-w-xl mx-auto leading-relaxed tracking-[0.05em]">
              "{story.quote}"
            </blockquote>
          </section>

          {/* 元数据 */}
          <div className="mt-10 pt-6 border-t border-amethyst-500/10">
            <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-moon-200/30 font-mono">
              <span>主维度: {story.meta.topDim} ({story.meta.topDimDir})</span>
              <span>基酒: {story.meta.baseSpirit}</span>
              <span>主导风味: {story.meta.dominantFlavor}</span>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}