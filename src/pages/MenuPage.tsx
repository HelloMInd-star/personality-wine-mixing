/**
 * MenuPage · 觉醉·调·酒单 · 酒单浏览页
 * 独立页面 · 三分类浏览（经典 / 创意 / 原创）
 * 搜索与情绪筛选作用于全酒单 · 合并库数据 + 现存酒单，同名去重
 *
 * 视觉语言：深空暗紫 + 情绪光斑 · 觉醉感官情绪探索游戏 · 与 TavernPage/CocktailPage 同语
 */

import { useState, useEffect, useMemo } from 'react';
import { COCKTAILS } from '../data/cocktails';
import { ALL_LIBRARY_COCKTAILS } from '../data/cocktailLibrary';
import type { Cocktail, CocktailRecommendation, MoodTag } from '../types/cocktail';
import GlassPanel from '../components/ui/GlassPanel';
import CocktailCard from '../components/cocktail/CocktailCard';
import CocktailDetail from '../components/cocktail/CocktailDetail';

/** 情绪标签中文映射 */
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

/** 酒单分类 tab */
type MenuTab = '经典' | '创意' | '原创' | '全部';

const MENU_TABS: { key: MenuTab; label: string; symbol: string }[] = [
  { key: '全部', label: '全部', symbol: '◆' },
  { key: '经典', label: '经典', symbol: '◇' },
  { key: '创意', label: '创意', symbol: '◈' },
  { key: '原创', label: '原创', symbol: '✦' },
];

/** 分类统计 */
const CATEGORY_COUNTS: Record<MenuTab, number> = {
  '全部': 0,
  '经典': 0,
  '创意': 0,
  '原创': 0,
};

/** 合并酒单 · 库数据优先，同名去重 */
function mergeMenu(): Cocktail[] {
  const seen = new Set<string>();
  const merged: Cocktail[] = [];
  for (const c of ALL_LIBRARY_COCKTAILS) {
    seen.add(c.name.toLowerCase());
    merged.push(c);
  }
  for (const c of COCKTAILS) {
    if (!seen.has(c.name.toLowerCase())) {
      merged.push(c);
    }
  }
  return merged;
}

/** 简易搜索 · 按名称/基酒/风味标签匹配 */
function searchMenu(menu: Cocktail[], keyword: string): Cocktail[] {
  const kw = keyword.toLowerCase().trim();
  if (!kw) return menu;
  return menu.filter((c) => {
    if (c.name.toLowerCase().includes(kw)) return true;
    if (c.nameEn.toLowerCase().includes(kw)) return true;
    if (c.baseSpirit.toLowerCase().includes(kw)) return true;
    if (c.flavorTags?.some((t) => t.toLowerCase().includes(kw))) return true;
    if (c.moods?.some((m) => m.toLowerCase().includes(kw))) return true;
    return false;
  });
}

export default function MenuPage() {
  const mergedMenu = useMemo(() => mergeMenu(), []);
  const [menuTab, setMenuTab] = useState<MenuTab>('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterMood, setFilterMood] = useState<MoodTag | null>(null);

  // 详情弹窗
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleSelect = (id: string) => {
    const found = mergedMenu.find((c) => c.id === id);
    if (found) {
      setSelectedCocktail(found);
      setDetailOpen(true);
    }
  };

  const handleClose = () => setDetailOpen(false);

  // 分类统计
  useEffect(() => {
    CATEGORY_COUNTS['全部'] = mergedMenu.length;
    for (const t of ['经典', '创意', '原创'] as MenuTab[]) {
      CATEGORY_COUNTS[t] = mergedMenu.filter((c) => c.category === t).length;
    }
  }, [mergedMenu]);

  // 酒单展示列表
  const displayedMenu = useMemo(() => {
    let base = searchKeyword.trim()
      ? searchMenu(mergedMenu, searchKeyword)
      : mergedMenu;
    if (filterMood) {
      base = base.filter((c) => c.moods?.includes(filterMood));
    }
    if (menuTab !== '全部') {
      base = base.filter((c) => c.category === menuTab);
    }
    return base;
  }, [mergedMenu, searchKeyword, filterMood, menuTab]);

  const menuRecommendations: CocktailRecommendation[] = displayedMenu.map((c) => ({
    cocktail: c,
    matchScore: 0,
    reasons: [],
  }));

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 页面标题区 */}
      <header className="mb-10 md:mb-14">
        <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
          酒单
        </h1>
        <p className="mt-2 text-sm md:text-base text-moon-200/60 italic">
          每一杯，都是夜为你写下的一则注脚。
        </p>
        <div className="divider-gold mt-5 w-40" />
      </header>

      {/* 分类 tab */}
      <div className="mb-5 flex gap-2">
        {MENU_TABS.map((tab) => {
          const active = menuTab === tab.key;
          const count = CATEGORY_COUNTS[tab.key];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMenuTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm tracking-[0.15em] border transition-all duration-300 ${
                active
                  ? 'border-gold-400/60 text-gold-400 bg-gold-400/10 shadow-glow-gold'
                  : 'border-amethyst-500/25 text-moon-200/55 hover:border-amethyst-400/40 hover:text-moon-200/80'
              }`}
            >
              <span className="mr-1.5 text-xs">{tab.symbol}</span>
              {tab.label}
              <span className="ml-1.5 text-[10px] text-moon-200/40 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 搜索框 */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索酒名、基酒或风味…"
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-void-700/60 border border-amethyst-500/25 text-sm text-moon-50 placeholder-moon-200/35 focus:outline-none focus:border-gold-400/50 focus:shadow-glow-gold transition-all duration-300"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moon-200/40 text-sm pointer-events-none">
            ⌕
          </span>
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
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
              onClick={() => setFilterMood(active ? null : mood)}
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
              onSelect={(id) => handleSelect(id)}
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

      {/* 详情模态 */}
      {detailOpen && selectedCocktail && (
        <CocktailDetail
          cocktail={selectedCocktail}
          reasons={[]}
          onClose={handleClose}
        />
      )}

      <div className="h-16" />
    </div>
  );
}