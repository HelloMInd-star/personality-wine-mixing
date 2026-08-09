/**
 * PersonalityPage · 人格测评主页面
 * 夜之问卷的入口与归宿：从一盏灯，到一张星图
 * 三态流转：idle 封面 → testing 问卷 → done 星图
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersonality, TOTAL_QUESTIONS } from '../hooks/usePersonality';
import { useAppStore } from '../store/appStore';
import { PERSONALITY_TRAITS, TRAIT_MAP } from '../data/personalityTraits';
import { profileToVector } from '../engine/profileToVector';
import { PERSONALITY_QUESTIONS } from '../data/personalityQuestions';
import type { PersonalityProfile, TraitKey } from '../types/personality';
import GlassPanel from '../components/ui/GlassPanel';
import GradientButton from '../components/ui/GradientButton';
import QuestionCard from '../components/personality/QuestionCard';
import PersonalityRadar from '../components/personality/PersonalityRadar';
import GalaxyConstellation from '../components/personality/GalaxyConstellation';

/** 高低分阈值 · 50 为分水岭，决定显示 highTrait 或 lowTrait */
const TRAIT_THRESHOLD = 50;

export default function PersonalityPage() {
  const navigate = useNavigate();
  const { saveProfile, saveVector } = useAppStore();
  const {
    currentStep,
    answers,
    profile,
    status,
    answer,
    next,
    prev,
    reset,
    getProgress,
  } = usePersonality();

  // 本地控制 · 是否已离开封面进入问卷
  const [started, setStarted] = useState(false);

  const currentQuestion = PERSONALITY_QUESTIONS[currentStep];
  const progress = getProgress();
  const isAnswered = currentQuestion
    ? answers[currentQuestion.id] !== undefined
    : false;

  // 完成态优先 · hook 在三十题答满时自动织就画像并切到 done
  const isDone = status === 'done' && profile !== null;
  const isTesting = started && !isDone;

  const handleStart = () => setStarted(true);

  const handleReset = () => {
    reset();
    setStarted(false);
  };

  const handleViewCocktail = () => {
    if (!profile) return;
    saveProfile(profile);
    // 派生六维向量落库 · 统一数据契约 · 让消费层（调酒/气味/回路）共用向量
    saveVector(profileToVector(profile));
    navigate('/cocktail');
  };

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 页面标题区 */}
      <header className="mb-10 md:mb-14">
        <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
          人格 · Persona
        </h1>
        <p className="mt-2 text-sm md:text-base text-moon-200/60 italic">
          夜给的镜，照见白日里看不见的那个自己。
        </p>
        <div className="divider-gold mt-5 w-40" />
      </header>

      {isDone && profile ? (
        <DoneView
          profile={profile}
          onReset={handleReset}
          onViewCocktail={handleViewCocktail}
        />
      ) : isTesting ? (
        <div className="max-w-3xl mx-auto">
          {/* 当前题卡 */}
          {currentQuestion && (
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              index={currentStep}
              total={TOTAL_QUESTIONS}
              value={answers[currentQuestion.id]}
              onSelect={(v) => answer(currentQuestion.id, v)}
            />
          )}

          {/* 进度条 · 金色渐变 */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-xs text-moon-200/50 mb-2">
              <span className="tracking-[0.2em]">
                已答 {Object.keys(answers).length} / {TOTAL_QUESTIONS}
              </span>
              <span className="font-mono">
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-amethyst-500/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amethyst-600 via-gold-500 to-gold-400 transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* 上一题 / 下一题 */}
          <div className="mt-8 flex items-center justify-between">
            <GradientButton
              variant="ghost"
              size="md"
              onClick={prev}
              disabled={currentStep === 0}
            >
              ← 上一题
            </GradientButton>
            <GradientButton
              variant="gold"
              size="md"
              onClick={next}
              disabled={!isAnswered || currentStep === TOTAL_QUESTIONS - 1}
            >
              下一题 →
            </GradientButton>
          </div>
        </div>
      ) : (
        <IdleView onStart={handleStart} />
      )}
    </div>
  );
}

/* ============================================================
   封面态 · idle
   ============================================================ */

interface IdleViewProps {
  onStart: () => void;
}

function IdleView({ onStart }: IdleViewProps) {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto text-center">
      {/* 星系入口 · 22 大阿尔卡纳 ↔ 太阳系星体 · 点击星体揭示对应塔罗牌 */}
      <div className="mb-8 animate-fade-in">
        <GalaxyConstellation />
        <p className="mt-3 text-[10px] text-moon-200/40 tracking-[0.25em] italic">
          22 颗星 · 22 张塔罗 · 点一颗，看它的牌
        </p>
      </div>

      <GlassPanel gold padding="lg" className="animate-slide-up">
        {/* 主标题 */}
        <h2 className="font-display text-4xl md:text-5xl text-gold-sheen text-shadow-glow-gold leading-tight mb-4">
          织一张属于你的夜
        </h2>
        <p className="text-moon-200/70 text-sm md:text-base leading-relaxed mb-8 max-w-xl mx-auto">
          三十题夜之问卷，约三分钟。
          每一次作答都是一根丝，织出一张独属于你的星图，
          它将在吧台那头，点亮一杯为你而调的酒。
        </p>

        {/* 五维简介 · 横向星点 */}
        <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-3 mb-10">
          {PERSONALITY_TRAITS.map((trait) => (
            <div
              key={trait.key}
              className="flex items-center gap-2 text-xs text-moon-200/60"
            >
              <span
                className="inline-block w-2 h-2 rounded-full animate-breathe"
                style={{ backgroundColor: trait.color }}
              />
              <span className="tracking-[0.15em]">{trait.label}</span>
            </div>
          ))}
        </div>

        <GradientButton variant="gold" size="lg" onClick={onStart}>
          开始测评
        </GradientButton>
      </GlassPanel>

      {/* 牌类入口 · 另一条采集路径 */}
      <div className="mt-8 flex items-center justify-center gap-3 text-xs">
        <span className="text-moon-200/40">或</span>
        <button
          className="text-amethyst-300/80 hover:text-gold-sheen transition-colors tracking-widest"
          onClick={() => navigate('/cards')}
        >
          以牌类采集人格 →
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   完成态 · done
   ============================================================ */

interface DoneViewProps {
  profile: PersonalityProfile;
  onReset: () => void;
  onViewCocktail: () => void;
}

function DoneView({ profile, onReset, onViewCocktail }: DoneViewProps) {
  const { scores, archetype } = profile;

  return (
    <div className="space-y-8">
      {/* 上栏 · 左雷达 / 右原型卡 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 雷达图 */}
        <GlassPanel gold padding="md">
          <h3 className="font-display text-lg text-moon-200/80 mb-2 tracking-[0.1em]">
            五维星图
          </h3>
          <PersonalityRadar scores={scores} />
        </GlassPanel>

        {/* 原型卡 · 光晕背景 */}
        <GlassPanel gold padding="lg">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${archetype.auraColor}33 0%, transparent 70%)`,
            }}
          />
          <div className="relative">
            <span className="font-mono text-xs tracking-[0.3em] text-amethyst-400/80">
              {archetype.code}
            </span>
            <h3 className="font-display text-4xl md:text-5xl text-gold-sheen text-shadow-glow-gold mt-2 mb-3">
              {archetype.name}
            </h3>
            <p className="text-moon-200/80 text-sm md:text-base italic mb-5">
              {archetype.tagline}
            </p>
            <div className="divider-gold w-24 mb-5" />
            <p className="text-moon-200/70 text-sm leading-relaxed">
              {archetype.description}
            </p>
          </div>
        </GlassPanel>
      </div>

      {/* 五维详情 */}
      <GlassPanel padding="lg">
        <h3 className="font-display text-xl text-moon-200/80 mb-6 tracking-[0.1em]">
          五维落点
        </h3>
        <div className="space-y-5">
          {PERSONALITY_TRAITS.map((trait) => (
            <TraitDetail
              key={trait.key}
              traitKey={trait.key}
              score={scores[trait.key]}
            />
          ))}
        </div>
      </GlassPanel>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <GradientButton variant="ghost" size="md" onClick={onReset}>
          重新测评
        </GradientButton>
        <GradientButton variant="gold" size="lg" onClick={onViewCocktail}>
          查看专属调酒 →
        </GradientButton>
      </div>
    </div>
  );
}

/* ============================================================
   五维详情行
   ============================================================ */

interface TraitDetailProps {
  traitKey: TraitKey;
  score: number;
}

function TraitDetail({ traitKey, score }: TraitDetailProps) {
  const trait = TRAIT_MAP[traitKey];
  // 高分显 highTrait，低分显 lowTrait · 50 为分水岭
  const isHigh = score >= TRAIT_THRESHOLD;
  const desc = isHigh ? trait.highTrait : trait.lowTrait;

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
      {/* 维度标识 */}
      <div className="flex items-center gap-2 md:w-40 shrink-0">
        <span className="text-base">{trait.symbol}</span>
        <span className="font-display text-moon-50 tracking-[0.1em]">
          {trait.label}
        </span>
        <span className="font-mono text-xs text-amethyst-400/60">
          {trait.shortLetter}
        </span>
      </div>

      {/* 分数条 */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-amethyst-500/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amethyst-600 via-gold-500 to-gold-400 transition-all duration-700"
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="font-mono text-xs text-gold-400 w-9 text-right">
            {score}
          </span>
        </div>
        {/* 高低描述 */}
        <p className="mt-2 text-xs text-moon-200/55 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}
