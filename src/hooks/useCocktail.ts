/**
 * useCocktail · 调酒模块状态钩子
 * 管理推荐列表、详情查看、关键词搜索与情绪筛选
 * 推荐刷新支持两条路径：
 *   - refreshRecommendations · 纯画像风味偏好
 *   - refreshByMood          · 画像 × 时段 × 主动情绪（情绪调节器联动）
 * 仅依赖 React 核心 API；推荐结果按 matchScore 降序（由引擎保证）
 */

import { useState, useCallback } from 'react';
import type { Cocktail, CocktailRecommendation, MoodTag } from '../types/cocktail';
import type {
  FlavorPreference,
  PersonalityProfile,
} from '../types/personality';
import type { JourneyRecommendation } from '../types/journey';
import type { PersonaVector } from '../types/personaFusion';
import { cocktailService } from '../services/cocktailService';

/** useCocktail 返回结构 */
export interface UseCocktailReturn {
  /** 推荐列表 · 按 matchScore 降序 */
  recommendations: CocktailRecommendation[];
  /** 旅程推荐列表 · 带阶段、刺激、音乐信息 */
  journeyRecommendations: JourneyRecommendation[];
  /** 当前查看的详情酒 · null 表示未选定 */
  selectedCocktail: Cocktail | null;
  /** 当前搜索关键词 */
  searchKeyword: string;
  /** 最近一次搜索结果 */
  searchResults: Cocktail[];
  /** 依人格风味偏好刷新推荐 */
  refreshRecommendations: (preference: FlavorPreference, limit?: number) => void;
  /** 依六维向量刷新推荐 · 牌类入口产物作为唯一数据契约驱动推荐 */
  refreshByVector: (vec: PersonaVector, limit?: number) => void;
  /** 依画像 × 时段 × 主动情绪刷新推荐 · 情绪调节器联动入口 */
  refreshByMood: (
    profile: PersonalityProfile,
    mood: MoodTag | null,
    intensity: number,
    limit?: number,
  ) => void;
  /** 旅程化刷新 · 画像 × 时段 × 情绪 + 阶段刺激档位加权 · 情绪回路联动入口 */
  refreshByJourney: (
    profile: PersonalityProfile,
    mood: MoodTag | null,
    intensity: number,
    limit?: number,
  ) => void;
  /** 旅程化刷新 · 六维向量入口 · 牌类产物作为唯一数据契约驱动回路推荐 */
  refreshByJourneyVector: (
    vec: PersonaVector,
    mood: MoodTag | null,
    intensity: number,
    limit?: number,
  ) => void;
  /** 选定一款酒查看详情 */
  selectCocktail: (id: string) => void;
  /** 按关键词搜索 · 同时更新关键词与结果 */
  search: (keyword: string) => Cocktail[];
  /** 按情绪标签筛选 · 直接返回结果（无状态副作用） */
  filterByMoodTag: (mood: MoodTag) => Cocktail[];
}

/**
 * 调酒模块状态钩子
 * @param initialPreference 可选 · 初始风味偏好，传入则挂载时生成首批推荐
 */
export function useCocktail(initialPreference?: FlavorPreference): UseCocktailReturn {
  // 若传入初始偏好，则惰性生成首批推荐（仅首次渲染执行一次）
  const [recommendations, setRecommendations] = useState<CocktailRecommendation[]>(
    () => (initialPreference ? cocktailService.recommendByPreference(initialPreference) : []),
  );
  const [journeyRecommendations, setJourneyRecommendations] = useState<
    JourneyRecommendation[]
  >([]);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Cocktail[]>([]);

  const refreshRecommendations = useCallback(
    (preference: FlavorPreference, limit = 5) => {
      // service 已按 matchScore 降序返回，直接落入状态
      setRecommendations(cocktailService.recommendByPreference(preference, limit));
    },
    [],
  );

  const refreshByVector = useCallback((vec: PersonaVector, limit = 5) => {
    // 牌类入口 · 向量派生八维风味偏好再走统一推荐流程
    setRecommendations(cocktailService.recommendByVector(vec, limit));
  }, []);

  const refreshByMood = useCallback(
    (profile: PersonalityProfile, mood: MoodTag | null, intensity: number, limit = 5) => {
      setRecommendations(
        cocktailService.recommendByMood(profile, mood, intensity, new Date(), limit),
      );
    },
    [],
  );

  const refreshByJourney = useCallback(
    (profile: PersonalityProfile, mood: MoodTag | null, intensity: number, limit = 5) => {
      setJourneyRecommendations(
        cocktailService.recommendByJourney(profile, mood, intensity, new Date(), limit),
      );
    },
    [],
  );

  const refreshByJourneyVector = useCallback(
    (vec: PersonaVector, mood: MoodTag | null, intensity: number, limit = 5) => {
      setJourneyRecommendations(
        cocktailService.recommendByJourneyVector(vec, mood, intensity, new Date(), limit),
      );
    },
    [],
  );

  const selectCocktail = useCallback((id: string) => {
    setSelectedCocktail(cocktailService.getCocktail(id) ?? null);
  }, []);

  const search = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
    const results = cocktailService.searchCocktails(keyword);
    setSearchResults(results);
    return results;
  }, []);

  const filterByMoodTag = useCallback((mood: MoodTag) => {
    return cocktailService.filterByMood(mood);
  }, []);

  return {
    recommendations,
    journeyRecommendations,
    selectedCocktail,
    searchKeyword,
    searchResults,
    refreshRecommendations,
    refreshByVector,
    refreshByMood,
    refreshByJourney,
    refreshByJourneyVector,
    selectCocktail,
    search,
    filterByMoodTag,
  };
}
