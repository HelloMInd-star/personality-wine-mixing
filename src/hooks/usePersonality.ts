/**
 * usePersonality · 人格测评状态钩子
 * 管理题号推进、答案记录、画像生成与重置
 * 仅依赖 React 核心 API，无额外副作用
 */

import { useState, useCallback } from 'react';
import type { PersonalityProfile } from '../types/personality';
import { PERSONALITY_QUESTIONS } from '../data/personalityQuestions';
import { cocktailService } from '../services/cocktailService';

/** 总题数 · 由题目集派生，保持单一数据源 */
export const TOTAL_QUESTIONS = PERSONALITY_QUESTIONS.length;

/** 测评状态机：未开始 / 进行中 / 已完成 */
export type PersonalityStatus = 'idle' | 'testing' | 'done';

/** usePersonality 返回结构 */
export interface UsePersonalityReturn {
  /** 当前题号（0 起始） */
  currentStep: number;
  /** 已作答记录 · qid → 量表值 */
  answers: Record<string, number>;
  /** 画像结果 · null 表示尚未完成 */
  profile: PersonalityProfile | null;
  /** 测评状态 */
  status: PersonalityStatus;
  /** 记录一题答案；全部作答后自动生成画像 */
  answer: (qid: string, value: number) => void;
  /** 下一题（不越界） */
  next: () => void;
  /** 上一题（不越界） */
  prev: () => void;
  /** 重置测评 */
  reset: () => void;
  /** 当前进度 · 0-1 */
  getProgress: () => number;
}

/**
 * 人格测评状态钩子
 */
export function usePersonality(): UsePersonalityReturn {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [status, setStatus] = useState<PersonalityStatus>('idle');

  const answer = useCallback(
    (qid: string, value: number) => {
      // 基于闭包内的最新 answers 计算，避免在 setState 更新函数内执行副作用
      const updated = { ...answers, [qid]: value };
      setAnswers(updated);

      if (Object.keys(updated).length >= TOTAL_QUESTIONS) {
        // 三十题皆备 · 自动织就画像（经 service 层统一入口）
        const result = cocktailService.generateProfile(updated);
        setProfile(result);
        setStatus('done');
      } else {
        setStatus('testing');
      }
    },
    [answers],
  );

  const next = useCallback(() => {
    setCurrentStep((step) => Math.min(step + 1, TOTAL_QUESTIONS - 1));
  }, []);

  const prev = useCallback(() => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setAnswers({});
    setProfile(null);
    setStatus('idle');
  }, []);

  const getProgress = useCallback(() => {
    const answered = Object.keys(answers).length;
    return Math.min(answered / TOTAL_QUESTIONS, 1);
  }, [answers]);

  return {
    currentStep,
    answers,
    profile,
    status,
    answer,
    next,
    prev,
    reset,
    getProgress,
  };
}
