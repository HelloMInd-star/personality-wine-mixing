/**
 * QuestionCard · 单题展示卡
 * 夜之问卷里一盏灯，照见此刻的你
 * 金边磨砂玻璃 · 进入时自下浮起 · 五点量表横向点选
 */

import type { PersonalityQuestion } from '../../types/personality';
import { LIKERT_OPTIONS } from '../../data/personalityQuestions';
import { TRAIT_MAP } from '../../data/personalityTraits';
import GlassPanel from '../ui/GlassPanel';

export interface QuestionCardProps {
  question: PersonalityQuestion;
  /** 当前题序 · 0 起始 */
  index: number;
  /** 总题数 */
  total: number;
  /** 当前选中值 · 未答为 undefined */
  value: number | undefined;
  /** 选项点击回调 */
  onSelect: (value: number) => void;
}

/** 两位补零 · 用于题号显示 */
const pad2 = (n: number): string => n.toString().padStart(2, '0');

export default function QuestionCard({
  question,
  index,
  total,
  value,
  onSelect,
}: QuestionCardProps) {
  const trait = TRAIT_MAP[question.dimension];

  return (
    <GlassPanel gold padding="lg" className="animate-slide-up">
      {/* 题号 · 维度字母 */}
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-xs tracking-[0.3em] text-amethyst-400/80">
          {pad2(index + 1)} / {pad2(total)}
        </span>
        <span className="font-display text-sm tracking-[0.4em] text-gold-400/60">
          {trait.shortLetter}
        </span>
      </div>

      {/* 题干 · 衬线大字 */}
      <h3 className="font-display text-2xl md:text-[1.7rem] leading-relaxed text-moon-50 text-shadow-glow-soft mb-10">
        {question.text}
      </h3>

      {/* 五点量表 · 横向点选 */}
      <div className="flex items-stretch gap-2 md:gap-3">
        {LIKERT_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={[
                'flex-1 h-14 md:h-16 rounded-xl border transition-all duration-300',
                'flex items-center justify-center',
                active
                  ? 'border-gold-400 bg-gold-400/10 shadow-glow-gold'
                  : 'border-amethyst-500/30 hover:border-amethyst-400/60 hover:bg-amethyst-500/5',
              ].join(' ')}
              aria-pressed={active}
              aria-label={opt.label}
            >
              <span
                className={[
                  'font-display text-lg leading-none transition-colors',
                  active
                    ? 'text-gold-400 text-shadow-glow-gold'
                    : 'text-moon-200/70',
                ].join(' ')}
              >
                {opt.value}
              </span>
            </button>
          );
        })}
      </div>

      {/* 两端提示 · 量表的方向感 */}
      <div className="mt-3 flex items-center justify-between text-[11px] tracking-[0.2em] text-moon-200/40">
        <span>{LIKERT_OPTIONS[0].label}</span>
        <span className="text-amethyst-400/40">←→</span>
        <span>{LIKERT_OPTIONS[LIKERT_OPTIONS.length - 1].label}</span>
      </div>
    </GlassPanel>
  );
}
