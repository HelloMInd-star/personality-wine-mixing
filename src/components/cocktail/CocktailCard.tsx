/**
 * CocktailCard · 调酒推荐卡片
 * 一杯酒的侧影 · 名、引语、契合度与风味标签
 * 左侧竖向光晕线呼应酒的灵气色，hover 时浮起并发紫光
 */

import type { ReactNode } from 'react';
import type {
  CocktailRecommendation,
  BaseSpirit,
  GlassType,
  MoodTag,
} from '../../types/cocktail';
import GlassPanel from '../ui/GlassPanel';

export interface CocktailCardProps {
  recommendation: CocktailRecommendation;
  onSelect: (id: string) => void;
  /** 是否展示契合度徽章 · 浏览全部酒单（无画像）时关闭 */
  showMatch?: boolean;
}

/** 基酒中文映射 */
const BASE_SPIRIT_LABELS: Record<BaseSpirit, string> = {
  gin: '金酒',
  whisky: '威士忌',
  rum: '朗姆',
  vodka: '伏特加',
  tequila: '龙舌兰',
  brandy: '白兰地',
  liqueur: '利口酒',
  wine: '葡萄酒',
  sake: '清酒',
  none: '无酒精',
};

/** 酒杯中文映射 */
const GLASS_LABELS: Record<GlassType, string> = {
  coupe: '浅碟杯',
  martini: '马天尼杯',
  highball: '高球杯',
  rocks: '古典杯',
  flute: '笛形杯',
  snifter: '白兰地杯',
  mug: '啤酒杯',
  tiki: '提基杯',
};

/** 情绪中文映射 · 与 CocktailPage 共享语义 */
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

/** 难度星级 · 1-5 金点，余者为暗紫 */
function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            i < level ? 'bg-gold-400' : 'bg-amethyst-500/25'
          }`}
          style={
            i < level ? { boxShadow: '0 0 4px rgba(240,198,116,0.5)' } : undefined
          }
        />
      ))}
    </div>
  );
}

/** 药丸标签 · amethyst 边框低透明，hover 微加深 */
function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] tracking-[0.1em] text-moon-200/70 border border-amethyst-500/30 bg-amethyst-500/5 transition-colors duration-300 hover:border-amethyst-400/50 hover:text-moon-200/90">
      {children}
    </span>
  );
}

export default function CocktailCard({
  recommendation,
  onSelect,
  showMatch = true,
}: CocktailCardProps) {
  const { cocktail, matchScore } = recommendation;
  const {
    id,
    name,
    nameEn,
    tagline,
    baseSpirit,
    glass,
    moods,
    auraColor,
    difficulty,
  } = cocktail;

  // 契合度档位 · 决定徽章色与发光
  const tier = matchScore >= 85 ? 'high' : matchScore >= 60 ? 'mid' : 'low';
  const badgeCls =
    tier === 'high'
      ? 'text-gold-400 text-shadow-glow-gold border-gold-400/50'
      : tier === 'mid'
        ? 'text-gold-500 border-gold-500/30'
        : 'text-moon-200/40 border-amethyst-500/20';

  return (
    <GlassPanel hover padding="md" onClick={() => onSelect(id)} className="group">
      {/* 左侧竖向光晕线 · 呼应酒的灵气色 */}
      <div
        className="absolute left-0 top-6 bottom-6 w-px"
        style={{
          background: `linear-gradient(180deg, transparent, ${auraColor}, transparent)`,
          boxShadow: `0 0 12px ${auraColor}66`,
        }}
      />

      <div className="relative pl-3">
        {/* 顶部 · 酒名 + 契合度徽章 */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl md:text-2xl text-moon-50 leading-tight truncate">
              {name}
            </h3>
            <p className="text-xs text-amethyst-400/80 tracking-[0.15em] mt-0.5 truncate">
              {nameEn}
            </p>
          </div>

          {showMatch && (
            <div
              className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-full border bg-void-900/40 ${badgeCls}`}
            >
              <span className="font-mono text-lg leading-none">{matchScore}</span>
              <span className="text-[10px] tracking-[0.15em] mt-0.5">契合</span>
            </div>
          )}
        </div>

        {/* 中部 · 引语 */}
        <p className="mt-3 text-sm italic text-moon-200/70 leading-relaxed">
          「{tagline}」
        </p>

        {/* 底部 · 标签簇 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Pill>{BASE_SPIRIT_LABELS[baseSpirit]}</Pill>
          <Pill>{GLASS_LABELS[glass]}</Pill>
          {moods.map((m) => (
            <Pill key={m}>{MOOD_LABELS[m]}</Pill>
          ))}
        </div>

        {/* 难度 */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] tracking-[0.15em] text-moon-200/40">
            难度
          </span>
          <DifficultyDots level={difficulty} />
        </div>
      </div>
    </GlassPanel>
  );
}
