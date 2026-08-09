/**
 * 调酒推荐引擎 · 纯函数模块
 * 人格风味偏好 → 酒的风味画像 → 相似度 → 推荐
 * 所有函数皆纯，无副作用；理由生成引用风味诗，使推荐有可读的温度
 */

import type {
  Cocktail,
  CocktailRecommendation,
  FlavorKey,
  MoodTag,
} from '../types/cocktail';
import type { FlavorPreference } from '../types/personality';
import type { PersonaVector } from '../types/personaFusion';

import { COCKTAILS } from '../data/cocktails';
import { FLAVOR_META } from '../data/flavorMeta';
import { flavorFromVector } from './flavorFromVector';

/** 八维风味键 · 顺序固定，用于向量化与遍历 */
const FLAVOR_KEYS: FlavorKey[] = [
  'sweet',
  'sour',
  'bitter',
  'strong',
  'smoky',
  'fruity',
  'herbal',
  'creamy',
];

/** 风味诗化理由模板 · 每维一句，呼应 FLAVOR_META 的诗 */
const FLAVOR_REASON_TEMPLATES: Record<FlavorKey, string> = {
  sweet: '你心底那点向甜的依恋，它以蜜糖溶进星河的方式温柔回应。',
  sour: '你想要的清亮与锋线，它用青柠切开的月光一一交付。',
  bitter: '你肯承下的那点苦，在杯底沉成夜不肯说出口的往事。',
  strong: '你求的那股冲劲，它以星河倒灌胸腔的烈慷慨应答。',
  smoky: '你渴望的深邃，它正以泥煤的余烬，慢慢应答。',
  fruity: '你期待的鲜活，它让果实坠入夜色，溅起紫罗兰的潮汐。',
  herbal: '你向往的纵深，它在舌尖生根，长成一座夜的森林。',
  creamy: '你需要的安抚，它以月光铺成的丝绒，漫过喉间。',
};

/** 原型 code → 中文名 · 引擎自持的展示映射，避免反向依赖人格模块 */
const ARCHETYPE_LABELS: Record<string, string> = {
  dreamweaver: '织梦者',
  clockmaker: '守序者',
  ember: '焰心者',
  velvet: '月潮者',
  mistwalker: '雾行者',
  alchemist: '炼金者',
  solitude: '独酌者',
  twilight: '暮色者',
  nightcaller: '夜唤者',
};

/** 风味分值上界 · flavorProfile 以 0-10 计 */
const FLAVOR_MAX = 10;

/**
 * 计算人格风味偏好与酒的风味画像的相似度
 * 将 cocktail.flavorProfile（0-10）归一化至 0-1，与 preference 做余弦相似度
 * 返回 0-1，1 表示方向完全一致（完美匹配）；任一向量为零时返回 0
 */
export function computeFlavorDistance(
  preference: FlavorPreference,
  cocktail: Cocktail,
): number {
  // 偏好向量：缺省维度按 0 处理（无倾向）
  const prefVec = FLAVOR_KEYS.map((k) => preference[k] ?? 0);
  // 酒的风味向量：归一化 0-10 → 0-1
  const cocktailVec = FLAVOR_KEYS.map((k) => cocktail.flavorProfile[k] / FLAVOR_MAX);

  const dot = prefVec.reduce((sum, v, i) => sum + v * cocktailVec[i], 0);
  const prefMag = Math.sqrt(prefVec.reduce((s, v) => s + v * v, 0));
  const cocktailMag = Math.sqrt(cocktailVec.reduce((s, v) => s + v * v, 0));

  // 任一向量为零向量则无法定义方向，判作不匹配
  if (prefMag === 0 || cocktailMag === 0) return 0;
  return dot / (prefMag * cocktailMag);
}

/**
 * 生成风味匹配理由
 * 计算每个维度上「偏好 × 酒的强度」的匹配贡献度，取最显著的几维
 * 若偏好过弱导致皆不显著，则回退至酒自身最突出的风味
 */
function generateMatchReasons(
  preference: FlavorPreference,
  cocktail: Cocktail,
): string[] {
  const contributions = FLAVOR_KEYS.map((k) => ({
    flavor: k,
    contribution: (preference[k] ?? 0) * (cocktail.flavorProfile[k] / FLAVOR_MAX),
  }));
  contributions.sort((a, b) => b.contribution - a.contribution);

  // 显著阈值 · 贡献度高于此值方视为值得陈述的契合点
  const SIGNIFICANT = 0.2;
  const significant = contributions.filter((c) => c.contribution > SIGNIFICANT);
  const picks =
    significant.length >= 2 ? significant : contributions;
  return picks.slice(0, 3).map((c) => FLAVOR_REASON_TEMPLATES[c.flavor]);
}

/**
 * 生成原型亲和理由
 * 取酒最突出的两维风味作诗化陈述，并附原型共振之语
 */
function generateArchetypeReasons(cocktail: Cocktail, archetypeCode: string): string[] {
  const top = FLAVOR_KEYS.map((k) => ({
    flavor: k,
    value: cocktail.flavorProfile[k],
  }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  const reasons = top.map((t) => FLAVOR_REASON_TEMPLATES[t.flavor]);
  const label = ARCHETYPE_LABELS[archetypeCode] ?? archetypeCode;
  reasons.push(`它的脾性，与「${label}」原型的夜彼此共振。`);
  return reasons;
}

/**
 * 按人格风味偏好推荐调酒
 * 遍历所有配方，以余弦相似度映射为 0-100 匹配度，取前 limit 款（默认 5）
 * 结果按 matchScore 降序返回，每款附诗化匹配理由
 */
export function recommendCocktails(
  preference: FlavorPreference,
  limit = 5,
): CocktailRecommendation[] {
  const scored = COCKTAILS.map((cocktail) => {
    const similarity = computeFlavorDistance(preference, cocktail);
    const matchScore = Math.round(similarity * 100);
    const reasons = generateMatchReasons(preference, cocktail);
    return { cocktail, matchScore, reasons };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, Math.max(0, limit));
}

/**
 * 按人格原型亲和度推荐
 * archetypeAffinity 命中者优先；命中者匹配度记为 100，并附原型共振理由
 */
export function recommendByArchetype(
  archetypeCode: string,
  limit = 5,
): CocktailRecommendation[] {
  const matched = COCKTAILS.filter((c) =>
    c.archetypeAffinity.includes(archetypeCode),
  );

  const recommendations: CocktailRecommendation[] = matched.map((cocktail) => ({
    cocktail,
    matchScore: 100,
    reasons: generateArchetypeReasons(cocktail, archetypeCode),
  }));

  return recommendations.slice(0, Math.max(0, limit));
}

/**
 * 按六维向量推荐调酒 · 新入口（向量派生）
 *
 * 内部由 flavorFromVector 派生八维风味偏好，再走 recommendCocktails 推荐流程
 * 牌类入口使用 · 与测评入口（recommendCocktails）走同一推荐逻辑
 *
 * @param vec 六维人格向量 [-1, 1]
 * @param limit 返回前 N 款 · 默认 5
 * @returns 推荐列表 · 按 matchScore 降序
 *
 * @example
 *   // 高 ENT + 高 VIS → 偏甜偏果香调酒
 *   recommendByVector({ TOL:0, SPD:0, INF:0, ENT:1, LEAD:0, VIS:1 })
 *   // → [{ cocktail, matchScore, reasons }, ...]
 */
export function recommendByVector(
  vec: PersonaVector,
  limit = 5,
): CocktailRecommendation[] {
  const preference = flavorFromVector(vec);
  return recommendCocktails(preference, limit);
}

/** 按 id 取酒 · 取不到返回 undefined */
export function getCocktailById(id: string): Cocktail | undefined {
  return COCKTAILS.find((c) => c.id === id);
}

/**
 * 模糊搜索 · 按中英名、基酒、情绪标签匹配
 * 关键词经 trim 与 lowercase 处理；空串返回空数组
 */
export function searchCocktails(keyword: string): Cocktail[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return [];
  return COCKTAILS.filter(
    (c) =>
      c.name.toLowerCase().includes(kw) ||
      c.nameEn.toLowerCase().includes(kw) ||
      c.baseSpirit.toLowerCase().includes(kw) ||
      c.moods.some((m) => m.toLowerCase().includes(kw)),
  );
}

/** 按情绪标签筛选 · 返回所有标记该情绪的酒 */
export function filterByMood(mood: MoodTag): Cocktail[] {
  return COCKTAILS.filter((c) => c.moods.includes(mood));
}

/** 重导出风味元数据 · 便于调用方从引擎入口统一取用 */
export { FLAVOR_META };
