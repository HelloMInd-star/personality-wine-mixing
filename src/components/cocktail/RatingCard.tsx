/**
 * RatingCard · 喝后评分卡
 *
 * 闭环入口：用户对推荐产物打分 → 信号回传 appStore → 向量校准 → 下次推荐优化
 *
 * 视觉：深空紫金 · 磨砂玻璃 · 圆点星级 · 走 CSS 变量 --gold-400
 * 行为：
 *   - 挂载时 trackFeedback('feedback.shown')
 *   - 30 秒未提交 trackFeedback('feedback.skipped')
 *   - 提交时 trackFeedback('feedback.submitted') + addFeedback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import GlassPanel from '../ui/GlassPanel';
import GradientButton from '../ui/GradientButton';
import { useAppStore } from '../../store/appStore';
import { trackFeedback } from '../../engine/feedbackEngine';
import type { PersonaVector } from '../../types/personaFusion';
import type { FeedbackSignal, FeedbackDimensions } from '../../types/feedback';

/** 跳过埋点超时 · 30 秒未提交视为跳过 */
const SKIP_TIMEOUT_MS = 30_000;

/** 评分上限 */
const MAX_RATING = 5;

export interface RatingCardProps {
  /** 推荐产物 ID（鸡尾酒 id / 香味配方 YM-RP 凭证） */
  recipeId: string;
  /** 本次推荐所用向量 · 随评分一并存入 feedback，供校准判断方向 */
  recommendedVec?: PersonaVector;
  /** 提交后回调 · 可用于关闭卡片或跳转 */
  onSubmitted?: (fb: FeedbackSignal) => void;
  /** 额外类名 */
  className?: string;
}

/** 三维度评分标签 */
const DIM_LABELS: { key: keyof FeedbackDimensions; label: string }[] = [
  { key: 'flavor', label: '口味' },
  { key: 'scent', label: '气味' },
  { key: 'mood', label: '情绪' },
];

/** 渲染一行圆点评分 · 点击选分 */
function DotRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {label && (
        <span className="text-[10px] tracking-[0.15em] text-moon-200/45 w-8 shrink-0">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: MAX_RATING }, (_, i) => {
          const filled = i < value;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1} 分`}
              onClick={() => onChange(i + 1)}
              className="w-3.5 h-3.5 rounded-full transition-all duration-300 hover:scale-110"
              style={{
                background: filled ? 'var(--gold-400)' : 'transparent',
                border: `1px solid ${filled ? 'var(--gold-400)' : 'rgba(155,123,212,0.3)'}`,
                boxShadow: filled ? '0 0 8px rgba(240,198,116,0.4)' : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function RatingCard({
  recipeId,
  recommendedVec,
  onSubmitted,
  className = '',
}: RatingCardProps) {
  const { addFeedback } = useAppStore();
  const [rating, setRating] = useState(0);
  const [dimsExpanded, setDimsExpanded] = useState(false);
  const [dimensions, setDimensions] = useState<FeedbackDimensions>({});
  const [submitted, setSubmitted] = useState(false);
  const skipLoggedRef = useRef(false);

  // 挂载时埋点 · shown
  useEffect(() => {
    trackFeedback('feedback.shown', { recipeId, hasRecommendedVec: !!recommendedVec });
  }, [recipeId, recommendedVec]);

  // 30 秒未提交 → 跳过埋点 · 提交后或卸载时取消
  useEffect(() => {
    if (submitted) return;
    const timer = setTimeout(() => {
      if (!skipLoggedRef.current && !submitted) {
        skipLoggedRef.current = true;
        trackFeedback('feedback.skipped', { recipeId });
      }
    }, SKIP_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [submitted, recipeId]);

  const handleSubmit = useCallback(() => {
    if (rating === 0 || submitted) return;
    const fb: FeedbackSignal = {
      recipeId,
      rating,
      dimensions: dimsExpanded ? dimensions : undefined,
      ts: Date.now(),
      recommendedVec,
    };
    trackFeedback('feedback.submitted', {
      recipeId,
      rating,
      hasDimensions: dimsExpanded,
    });
    addFeedback(fb);
    setSubmitted(true);
    onSubmitted?.(fb);
  }, [rating, submitted, recipeId, dimsExpanded, dimensions, recommendedVec, addFeedback, onSubmitted]);

  // 已提交 · 收起为致谢态
  if (submitted) {
    return (
      <GlassPanel padding="sm" className={className}>
        <div className="text-center py-2">
          <div
            className="font-display text-sm tracking-[0.1em]"
            style={{ color: 'var(--gold-400)' }}
          >
            ◆ 评分已记入夜色
          </div>
          <p className="text-[10px] text-moon-200/45 italic mt-1">
            你的味觉正让下一杯更懂你。
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel padding="md" className={className}>
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(240,198,116,0.3) 0%, transparent 65%)',
        }}
      />
      <div className="relative">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase">
              Aftertaste · 喝后评分
            </div>
            <p className="text-[11px] text-moon-200/50 italic mt-0.5">
              这一杯如何？你的味觉会校准下一杯。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDimsExpanded((v) => !v)}
            className="text-[10px] tracking-[0.15em] text-amethyst-400/60 hover:text-gold-400 transition-colors font-mono"
          >
            {dimsExpanded ? '收起细分' : '细分 ▾'}
          </button>
        </div>

        {/* 总评分 · 圆点 */}
        <div className="flex items-center justify-center gap-2 py-2">
          {Array.from({ length: MAX_RATING }, (_, i) => {
            const filled = i < rating;
            return (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1} 分`}
                onClick={() => setRating(i + 1)}
                className="w-5 h-5 rounded-full transition-all duration-300 hover:scale-125"
                style={{
                  background: filled ? 'var(--gold-400)' : 'transparent',
                  border: `1.5px solid ${filled ? 'var(--gold-400)' : 'rgba(155,123,212,0.35)'}`,
                  boxShadow: filled ? '0 0 12px rgba(240,198,116,0.45)' : 'none',
                }}
              />
            );
          })}
        </div>

        {/* 三维度细分 · 可展开 */}
        {dimsExpanded && (
          <div className="mt-3 pt-3 border-t border-amethyst-500/15 space-y-2 animate-fade-in">
            {DIM_LABELS.map(({ key, label }) => (
              <DotRating
                key={key}
                label={label}
                value={dimensions[key] ?? 0}
                onChange={(v) =>
                  setDimensions((prev) => ({ ...prev, [key]: v }))
                }
              />
            ))}
          </div>
        )}

        {/* 提交按钮 */}
        <div className="mt-4 flex justify-center">
          <GradientButton
            variant="gold"
            size="sm"
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            记入夜色
          </GradientButton>
        </div>
      </div>
    </GlassPanel>
  );
}
