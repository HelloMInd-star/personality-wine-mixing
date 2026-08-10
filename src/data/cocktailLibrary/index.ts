/**
 * 酒库 · 聚合入口
 *
 * 按基酒分类的完整调酒百科，每款酒含：
 *   - 完整配方与调制步骤
 *   - 八维风味向量 + 文本风味标签
 *   - 口感描述 + 场景推荐
 *   - MBTI 适配维度（内外向/酒精度/复杂度/风味调性）
 *   - 经典指数
 *
 * 目录：
 *   gin    · 金酒系列（16/35 款，持续补充）
 *   whisky · 威士忌系列（待补充）
 *   rum    · 朗姆系列（待补充）
 *   vodka  · 伏特加系列（待补充）
 *   tequila· 龙舌兰系列（待补充）
 *   brandy · 白兰地系列（待补充）
 */

import type { Cocktail } from '../../types/cocktail';
import { GIN_COCKTAILS } from './gin';
import { RUM_COCKTAILS } from './rum';
import { WHISKEY_COCKTAILS } from './whiskey';
import { VODKA_COCKTAILS } from './vodka';
import { TEQUILA_COCKTAILS } from './tequila';
import { BRANDY_COCKTAILS } from './brandy';
import { LIQUEUR_COCKTAILS } from './liqueur';

/** 全酒库 · 按基酒分类 */
export const COCKTAIL_LIBRARY: Record<string, Cocktail[]> = {
  gin: GIN_COCKTAILS,
  rum: RUM_COCKTAILS,
  whisky: WHISKEY_COCKTAILS,
  vodka: VODKA_COCKTAILS,
  tequila: TEQUILA_COCKTAILS,
  brandy: BRANDY_COCKTAILS,
  liqueur: LIQUEUR_COCKTAILS,
};

/** 扁平化全酒库列表 */
export const ALL_LIBRARY_COCKTAILS: Cocktail[] = Object.values(COCKTAIL_LIBRARY).flat();

/** 按基酒筛选 */
export function getLibraryBySpirit(spirit: string): Cocktail[] {
  return COCKTAIL_LIBRARY[spirit] ?? [];
}

/** 按分类筛选 */
export function getLibraryByCategory(category: string): Cocktail[] {
  return ALL_LIBRARY_COCKTAILS.filter((c) => c.category === category);
}

/** 按 id 查找 */
export function getLibraryCocktailById(id: string): Cocktail | undefined {
  return ALL_LIBRARY_COCKTAILS.find((c) => c.id === id);
}

/** 按 MBTI 适配维度筛选 · 偏内向酒款 */
export function getLibraryByIntroversion(): Cocktail[] {
  return ALL_LIBRARY_COCKTAILS.filter(
    (c) => c.mbtiProfile?.introversionBias === '偏内向独酌',
  );
}

/** 按 MBTI 适配维度筛选 · 偏外向酒款 */
export function getLibraryByExtroversion(): Cocktail[] {
  return ALL_LIBRARY_COCKTAILS.filter(
    (c) => c.mbtiProfile?.introversionBias === '偏外向社交',
  );
}

/** 酒库统计 */
export function getLibraryStats() {
  const total = ALL_LIBRARY_COCKTAILS.length;
  const bySpirit = Object.fromEntries(
    Object.entries(COCKTAIL_LIBRARY).map(([k, v]) => [k, v.length]),
  );
  const byCategory = ALL_LIBRARY_COCKTAILS.reduce<Record<string, number>>((acc, c) => {
    const cat = c.category ?? '未分类';
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});
  return { total, bySpirit, byCategory };
}