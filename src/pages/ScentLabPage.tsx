/**
 * ScentLabPage · 气味定制页 · 五步流程
 *
 * 1. 选香味基础（6 调性 · 对应 MBTI 倾向）
 * 2. 拖拽组合配方（乐高分子结构搭建 · MoleculeBuilder）
 * 3. 预览气味（分子结构图 + 诗化描述）
 * 4. 选交付方式（4 种 · 含精油瓶）
 * 5. 输出结果（线上注册复用 / 线下预约定制杯垫）
 *
 * MBTI 联动：选 MBTI 后高亮推荐基础 + 一键填充推荐配方
 * 视觉语言：深空紫金 + 磨砂玻璃 · 与 TavernPage/CocktailPage 同语
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { resolveTimeSlot, describeBiologyShift, applyBiologyShift } from '../engine/timeEngine';
import { profileToVector } from '../engine/profileToVector';
import { DIM_LABEL, type PersonaVector } from '../types/personaFusion';
import GlassPanel from '../components/ui/GlassPanel';
import GradientButton from '../components/ui/GradientButton';
import RatingCard from '../components/cocktail/RatingCard';
import MoleculeBuilder from '../components/scentlab/MoleculeBuilder';
import {
  SCENT_BASES,
  DELIVERY_OPTIONS,
  BOTTLE_OPTIONS,
  getScentBase,
  getScentNote,
  getMbtiScentRec,
  describeRecipe,
} from '../data/scentLabData';
import type {
  ScentLabStep,
  ScentRecipe,
  ScentBaseType,
  ScentNoteLayer,
  DeliveryMethod,
  BottleType,
} from '../types/scentLab';
import { EMPTY_RECIPE } from '../types/scentLab';

// ═════════════════════════════════════════════════════════
// 常量
// ═════════════════════════════════════════════════════════

const STEP_ORDER: ScentLabStep[] = ['base', 'recipe', 'preview', 'delivery', 'result'];
const STEP_LABEL: Record<ScentLabStep, string> = {
  base: '选基础',
  recipe: '组合配方',
  preview: '预览气味',
  delivery: '交付方式',
  result: '输出结果',
};

/** 16 种 MBTI */
const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

// ═════════════════════════════════════════════════════════
// 主组件
// ═════════════════════════════════════════════════════════

/** 时段气味建议 · 同一人格在不同时段匹配不同气味（生物学依据） */
const SLOT_SCENT_HINT: Record<string, string> = {
  dawn: '提神 · 薄荷 / 柑橘',
  noon: '清新 · 柑橘 / 绿茶',
  dusk: '舒缓 · 花香 / 木质',
  night: '放松 · 檀香 / 薰衣草',
  midnight: '沉静 · 麝香 / 广藿香',
};

export default function ScentLabPage() {
  const navigate = useNavigate();
  const { profile, vector, manualTimeSlot, setManualTimeSlot, getCalibratedVector } = useAppStore();
  const currentSlot = resolveTimeSlot(new Date(), manualTimeSlot);
  const bioShifts = describeBiologyShift(currentSlot);
  // 校准向量优先 · 评分闭环回流 · 无评分退化为原始向量 · 再兜底 profile 派生
  // useMemo 稳定引用 · 避免每次渲染返回新对象
  const dynamicVector = useMemo(() => {
    const calibratedBase = getCalibratedVector() ?? vector ?? (profile ? profileToVector(profile) : null);
    return calibratedBase ? applyBiologyShift(calibratedBase, currentSlot) : null;
  }, [getCalibratedVector, vector, profile, currentSlot]);

  const [step, setStep] = useState<ScentLabStep>('base');
  const [recipe, setRecipe] = useState<ScentRecipe>({ ...EMPTY_RECIPE });
  const [mbti, setMbti] = useState<string | null>(null);
  /** 线上注册的配方 ID · result 步生成 */
  const [recipeId, setRecipeId] = useState<string | null>(null);
  /** 线下预约凭证 · result 步生成 */
  const [reservationCode, setReservationCode] = useState<string | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step);
  const isResult = step === 'result';

  /** MBTI 推荐 */
  const mbtiRec = useMemo(() => (mbti ? getMbtiScentRec(mbti) : null), [mbti]);

  /** 当前基础调颜色 · 用于全流程视觉统一 */
  const baseColor = recipe.base ? getScentBase(recipe.base).color : '#7c5fbf';
  const baseSymbol = recipe.base ? getScentBase(recipe.base).symbol : null;

  /** 更新某层原料 */
  const handleLayerChange = (layer: ScentNoteLayer, notes: string[]) => {
    if (layer === 'top') setRecipe((r) => ({ ...r, topNotes: notes }));
    if (layer === 'heart') setRecipe((r) => ({ ...r, heartNotes: notes }));
    if (layer === 'base') setRecipe((r) => ({ ...r, baseNotes: notes }));
  };

  /** 一键填充 MBTI 推荐配方 */
  const handleApplyRec = () => {
    if (!mbtiRec) return;
    setRecipe((r) => ({
      ...r,
      base: mbtiRec.bases[0],
      topNotes: mbtiRec.notes.slice(0, 2),
      heartNotes: mbtiRec.notes.slice(2, 3),
      baseNotes: mbtiRec.notes.slice(3),
    }));
  };

  /** 判断当前步是否完成 · 用于启用下一步 */
  const isStepComplete = (): boolean => {
    if (step === 'base') return recipe.base !== null;
    if (step === 'recipe')
      return recipe.topNotes.length + recipe.heartNotes.length + recipe.baseNotes.length > 0;
    if (step === 'preview') return true;
    if (step === 'delivery') return recipe.delivery !== null && recipe.bottle !== null;
    return true;
  };

  /** 进入下一步 · result 步生成凭证 */
  const handleNext = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx >= STEP_ORDER.length) return;
    const nextStep = STEP_ORDER[nextIdx];
    if (nextStep === 'result') {
      // 生成线上配方 ID + 线下预约凭证
      const ts = Date.now().toString(36).toUpperCase();
      setRecipeId(`YM-RP-${ts}`);
      if (recipe.delivery === 'onetime' || recipe.delivery === 'preorder') {
        setReservationCode(`YM-RS-${ts}`);
      }
    }
    setStep(nextStep);
  };

  const handlePrev = () => {
    if (stepIndex <= 0) return;
    setStep(STEP_ORDER[stepIndex - 1]);
  };

  /** 重新开始 */
  const handleRestart = () => {
    setRecipe({ ...EMPTY_RECIPE });
    setRecipeId(null);
    setReservationCode(null);
    setStep('base');
  };

  const description = useMemo(() => describeRecipe(recipe), [recipe]);

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 标题区 */}
      <header className="mb-10">
        <div className="text-[11px] tracking-[0.6em] text-amethyst-400/80 uppercase mb-3">
          Scent Lab · 气味定制
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
          气味 · 分子搭建
        </h1>
        <p className="mt-2 text-sm md:text-base text-moon-200/60 italic">
          拖拽香味分子，拼出属于你的一缕气。
        </p>
        <div className="divider-gold mt-5 w-40" />
      </header>

      {/* 时段气味校准 · 同一人格在不同时段匹配不同气味（生物学依据） */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] tracking-widest">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full animate-breathe"
          style={{ background: currentSlot.auraColor, boxShadow: `0 0 8px ${currentSlot.auraColor}` }}
        />
        <span className="text-moon-200/60">气味时辰</span>
        <span className="font-display text-gold-sheen">{currentSlot.label}</span>
        <span className="text-amethyst-400/40">·</span>
        <span className="text-moon-200/70">{SLOT_SCENT_HINT[currentSlot.slot]}</span>
        <span className="text-amethyst-400/30">·</span>
        <span className="text-moon-200/40 italic">{currentSlot.biologyNote}</span>
        {bioShifts.length > 0 && (
          <span className="text-amethyst-300/50 font-mono text-[10px] ml-1">
            ({bioShifts.map(({ dim, sign, delta }) => `${DIM_LABEL[dim]}${sign}${delta.toFixed(2)}`).join(' ')})
          </span>
        )}
        {manualTimeSlot && (
          <button
            type="button"
            onClick={() => setManualTimeSlot(null)}
            className="text-[10px] text-amethyst-400/50 hover:text-gold-400 transition-colors ml-1"
          >
            ↺ 系统时间
          </button>
        )}
      </div>

      {/* MBTI 联动区 · 可选 */}
      <div className="max-w-3xl mx-auto mb-8">
        <GlassPanel padding="sm" className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-15 transition-all duration-500"
            style={{ background: `radial-gradient(ellipse at 100% 0%, ${baseColor}33 0%, transparent 60%)` }}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase">
                MBTI 联动 · 可选
              </span>
              {mbtiRec && (
                <button
                  type="button"
                  onClick={handleApplyRec}
                  className="text-[10px] tracking-[0.15em] text-gold-400/70 hover:text-gold-400 transition-colors font-mono"
                >
                  ⌁ 一键填充推荐配方
                </button>
              )}
            </div>
            <div className="grid grid-cols-8 gap-1">
              {MBTI_TYPES.map((t) => {
                const selected = mbti === t;
                const isRec = mbtiRec?.mbti === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMbti(selected ? null : t)}
                    className="text-[10px] py-1 rounded font-mono tracking-wider transition-all duration-300"
                    style={{
                      color: selected ? '#f0c674' : isRec ? '#d4af7a' : 'rgba(216,201,245,0.4)',
                      background: selected ? 'rgba(240,198,116,0.12)' : 'transparent',
                      border: `1px solid ${selected ? 'rgba(240,198,116,0.4)' : 'rgba(124,95,191,0.15)'}`,
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            {mbtiRec && (
              <p className="text-[10px] text-moon-200/45 italic mt-2">
                {mbtiRec.mbti} · 推荐基础 {mbtiRec.bases.map((b) => getScentBase(b).label).join(' + ')} ·
                {' '}{mbtiRec.notes.map((n) => getScentNote(n)?.label).filter(Boolean).join('、')}
              </p>
            )}
            {profile && !mbti && (
              <p className="text-[10px] text-moon-200/35 italic mt-2">
                已检测到你的人格画像 · 选择 MBTI 可获得联动推荐
              </p>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* 步骤指示器 */}
      {!isResult && (
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between gap-2">
            {STEP_ORDER.map((s, i) => {
              const done = i < stepIndex;
              const active = s === step;
              return (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-xs transition-all duration-500 ${
                        active
                          ? 'bg-gold-sheen text-void-900 shadow-glow-gold'
                          : done
                            ? 'bg-amethyst-500/30 text-moon-50'
                            : 'bg-white/[0.03] text-moon-200/40 border border-amethyst-500/20'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <span
                      className={`text-[10px] tracking-[0.1em] transition-colors duration-300 ${
                        active ? 'text-gold-400' : done ? 'text-moon-200/60' : 'text-moon-200/30'
                      }`}
                    >
                      {STEP_LABEL[s]}
                    </span>
                  </div>
                  {i < STEP_ORDER.length - 1 && (
                    <div
                      className={`h-px flex-1 transition-all duration-500 ${
                        done ? 'bg-amethyst-400/40' : 'bg-amethyst-500/15'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 步骤内容 */}
      <div className="max-w-5xl mx-auto">
        {step === 'base' && (
          <StepBase
            selected={recipe.base}
            mbtiRecBases={mbtiRec?.bases}
            onSelect={(b) => setRecipe((r) => ({ ...r, base: b }))}
          />
        )}

        {step === 'recipe' && (
          <StepRecipe
            recipe={recipe}
            baseColor={baseColor}
            baseSymbol={baseSymbol}
            onLayerChange={handleLayerChange}
          />
        )}

        {step === 'preview' && (
          <StepPreview
            recipe={recipe}
            baseColor={baseColor}
            description={description}
          />
        )}

        {step === 'delivery' && (
          <StepDelivery
            selectedDelivery={recipe.delivery}
            selectedBottle={recipe.bottle}
            onSelectDelivery={(d) => setRecipe((r) => ({ ...r, delivery: d }))}
            onSelectBottle={(b) => setRecipe((r) => ({ ...r, bottle: b }))}
          />
        )}

        {isResult && (
          <StepResult
            recipe={recipe}
            description={description}
            baseColor={baseColor}
            recipeId={recipeId}
            reservationCode={reservationCode}
            recommendedVec={dynamicVector ?? undefined}
            onRestart={handleRestart}
            onBackHome={() => navigate('/cocktail')}
          />
        )}
      </div>

      {/* 底部导航 · result 步不显示 */}
      {!isResult && (
        <div className="max-w-5xl mx-auto mt-10 flex items-center justify-between">
          <GradientButton
            variant="ghost"
            size="md"
            onClick={step === 'base' ? () => navigate('/cocktail') : handlePrev}
          >
            ← {step === 'base' ? '返回调酒' : '上一步'}
          </GradientButton>
          <GradientButton
            variant="gold"
            size="md"
            onClick={handleNext}
            disabled={!isStepComplete()}
          >
            {step === 'delivery' ? '生成配方 →' : '下一步 →'}
          </GradientButton>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 第一步 · 选香味基础
// ═════════════════════════════════════════════════════════

function StepBase({
  selected,
  mbtiRecBases,
  onSelect,
}: {
  selected: ScentBaseType | null;
  mbtiRecBases?: ScentBaseType[];
  onSelect: (b: ScentBaseType) => void;
}) {
  return (
    <GlassPanel padding="lg">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase mb-1">
          Step 01 · 香味基础
        </div>
        <h2 className="font-display text-xl text-moon-50 tracking-[0.1em]">
          选一种调性 · 像选基酒
        </h2>
        <p className="text-xs text-moon-200/55 italic mt-1">
          基础调决定整支气味的骨架与人格倾向。
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SCENT_BASES.map((b) => {
          const active = selected === b.id;
          const isRec = mbtiRecBases?.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect(b.id)}
              className="group relative p-4 rounded-xl border text-left transition-all duration-400 overflow-hidden"
              style={{
                borderColor: active ? `${b.color}80` : 'rgba(124,95,191,0.2)',
                background: active
                  ? `linear-gradient(135deg, ${b.color}18 0%, ${b.color}08 100%)`
                  : 'transparent',
                boxShadow: active ? `0 0 16px ${b.color}30` : 'none',
              }}
            >
              {isRec && (
                <span
                  className="absolute top-2 right-2 text-[9px] tracking-[0.15em] font-mono px-1.5 py-0.5 rounded"
                  style={{ color: b.color, background: `${b.color}15` }}
                >
                  推荐
                </span>
              )}
              <div
                className="font-display text-3xl mb-2"
                style={{ color: active ? b.color : '#b8a8d8' }}
              >
                {b.symbol}
              </div>
              <div className="font-display text-base text-moon-50 tracking-[0.1em]">{b.label}</div>
              <div className="font-mono text-[9px] tracking-[0.25em] text-moon-200/40 uppercase mt-0.5">
                {b.en}
              </div>
              <p className="text-[11px] text-moon-200/55 mt-2 leading-relaxed">{b.desc}</p>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {b.traits.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] px-1.5 py-0.5 rounded-full border tracking-wide"
                    style={{
                      color: active ? b.color : 'rgba(216,201,245,0.5)',
                      borderColor: active ? `${b.color}50` : 'rgba(124,95,191,0.25)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ═════════════════════════════════════════════════════════
// 第二步 · 拖拽组合配方 · 委托 MoleculeBuilder
// ═════════════════════════════════════════════════════════

function StepRecipe({
  recipe,
  baseColor,
  baseSymbol,
  onLayerChange,
}: {
  recipe: ScentRecipe;
  baseColor: string;
  baseSymbol: string | null;
  onLayerChange: (layer: ScentNoteLayer, notes: string[]) => void;
}) {
  return (
    <GlassPanel padding="lg">
      <div className="mb-5">
        <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase mb-1">
          Step 02 · 组合配方
        </div>
        <h2 className="font-display text-xl text-moon-50 tracking-[0.1em]">
          拖拽分子 · 搭建你的气味结构
        </h2>
        <p className="text-xs text-moon-200/55 italic mt-1">
          前调 → 中调 → 后调 · 像乐高一样拼出分子的形状。
        </p>
      </div>
      <MoleculeBuilder
        topNotes={recipe.topNotes}
        heartNotes={recipe.heartNotes}
        baseNotes={recipe.baseNotes}
        baseColor={baseColor}
        baseSymbol={baseSymbol}
        onChange={onLayerChange}
      />
    </GlassPanel>
  );
}

// ═════════════════════════════════════════════════════════
// 第三步 · 预览气味 · SVG 分子结构图
// ═════════════════════════════════════════════════════════

function StepPreview({
  recipe,
  baseColor,
  description,
}: {
  recipe: ScentRecipe;
  baseColor: string;
  description: string;
}) {
  const allNotes = [
    ...recipe.topNotes.map((id) => ({ id, layer: 'top' as const })),
    ...recipe.heartNotes.map((id) => ({ id, layer: 'heart' as const })),
    ...recipe.baseNotes.map((id) => ({ id, layer: 'base' as const })),
  ];

  // 分子结构图布局 · 中心基础调 + 三层环绕
  const center = { x: 150, y: 150 };
  const layerY = { top: 60, heart: 150, base: 240 };

  return (
    <GlassPanel padding="lg">
      <div className="mb-5">
        <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase mb-1">
          Step 03 · 预览气味
        </div>
        <h2 className="font-display text-xl text-moon-50 tracking-[0.1em]">
          分子结构 · 你的气味形状
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        {/* SVG 分子结构图 */}
        <div className="flex justify-center">
          <svg viewBox="0 0 300 300" className="w-full max-w-xs">
            {/* 化学键连线 */}
            {allNotes.map((n, i) => {
              const note = getScentNote(n.id);
              if (!note) return null;
              const y = layerY[n.layer];
              const x = 150 + (i - (allNotes.length - 1) / 2) * 50;
              return (
                <line
                  key={`bond-${n.id}`}
                  x1={center.x}
                  y1={center.y}
                  x2={x}
                  y2={y}
                  stroke={baseColor}
                  strokeWidth={1.5}
                  strokeOpacity={0.4}
                  strokeDasharray="3 3"
                />
              );
            })}
            {/* 三层节点 */}
            {allNotes.map((n, i) => {
              const note = getScentNote(n.id);
              if (!note) return null;
              const y = layerY[n.layer];
              const x = 150 + (i - (allNotes.length - 1) / 2) * 50;
              return (
                <g key={`node-${n.id}`} className="molecule-rise" style={{ animationDelay: `${i * 0.1}s` }}>
                  <circle cx={x} cy={y} r={16} fill={`${note.color}22`} stroke={note.color} strokeWidth={1.5} />
                  <text x={x} y={y + 3} textAnchor="middle" fontSize={9} fontFamily="monospace" fill={note.color} fontWeight="bold">
                    {note.molecule}
                  </text>
                  <text x={x} y={y + 28} textAnchor="middle" fontSize={8} fill="rgba(216,201,245,0.6)">
                    {note.label}
                  </text>
                </g>
              );
            })}
            {/* 中心基础调节点 */}
            {recipe.base && (
              <g className="molecule-rise">
                <circle cx={center.x} cy={center.y} r={22} fill={`${baseColor}33`} stroke={baseColor} strokeWidth={2} />
                <text x={center.x} y={center.y + 5} textAnchor="middle" fontSize={14} fontFamily="serif" fill={baseColor} fontWeight="bold">
                  {getScentBase(recipe.base).symbol}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* 气味描述 */}
        <div>
          <div className="text-[10px] tracking-[0.3em] text-amethyst-400/60 uppercase mb-2">气味描述</div>
          <p className="font-display text-base text-moon-50/90 leading-relaxed tracking-[0.05em]">
            {description}
          </p>
          <div className="mt-4 space-y-2">
            {(['top', 'heart', 'base'] as ScentNoteLayer[]).map((layer) => {
              const notes = layer === 'top' ? recipe.topNotes : layer === 'heart' ? recipe.heartNotes : recipe.baseNotes;
              const label = layer === 'top' ? '前调' : layer === 'heart' ? '中调' : '后调';
              return (
                <div key={layer} className="flex items-baseline gap-2">
                  <span className="text-[10px] tracking-[0.2em] text-moon-200/40 font-mono w-8">{label}</span>
                  <span className="text-xs text-moon-50/75">
                    {notes.length ? notes.map((id) => getScentNote(id)?.label).join(' · ') : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

// ═════════════════════════════════════════════════════════
// 第四步 · 选交付方式 + 精油瓶
// ═════════════════════════════════════════════════════════

function StepDelivery({
  selectedDelivery,
  selectedBottle,
  onSelectDelivery,
  onSelectBottle,
}: {
  selectedDelivery: DeliveryMethod | null;
  selectedBottle: BottleType | null;
  onSelectDelivery: (d: DeliveryMethod) => void;
  onSelectBottle: (b: BottleType) => void;
}) {
  return (
    <GlassPanel padding="lg">
      <div className="mb-5">
        <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase mb-1">
          Step 04 · 交付方式
        </div>
        <h2 className="font-display text-xl text-moon-50 tracking-[0.1em]">
          这缕气 · 如何到你手里
        </h2>
      </div>

      {/* 交付方式 */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {DELIVERY_OPTIONS.map((d) => {
          const active = selectedDelivery === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelectDelivery(d.id)}
              className="p-4 rounded-lg border text-left transition-all duration-300"
              style={{
                borderColor: active ? 'rgba(240,198,116,0.5)' : 'rgba(124,95,191,0.2)',
                background: active ? 'rgba(240,198,116,0.06)' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm text-moon-50 tracking-[0.1em]">{d.label}</span>
                <span className="text-[10px] text-gold-400/70 font-mono">{d.priceRange}</span>
              </div>
              <p className="text-[11px] text-moon-200/55 mt-1.5 leading-relaxed">{d.desc}</p>
            </button>
          );
        })}
      </div>

      {/* 精油瓶 */}
      <div className="text-[10px] tracking-[0.3em] text-amethyst-400/60 uppercase mb-2">精油瓶</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {BOTTLE_OPTIONS.map((b) => {
          const active = selectedBottle === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBottle(b.id)}
              className="p-3 rounded-lg border text-center transition-all duration-300"
              style={{
                borderColor: active ? 'rgba(240,198,116,0.5)' : 'rgba(124,95,191,0.2)',
                background: active ? 'rgba(240,198,116,0.06)' : 'transparent',
              }}
            >
              <div className="font-display text-2xl text-moon-50/80">{b.symbol}</div>
              <div className="text-[11px] text-moon-50/80 mt-1">{b.label}</div>
              <div className="text-[9px] text-moon-200/40 mt-0.5">{b.capacity}</div>
              <div className="text-[9px] text-moon-200/35 italic mt-1">{b.useCase}</div>
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ═════════════════════════════════════════════════════════
// 第五步 · 输出结果 · 线上注册 / 线下预约
// ═════════════════════════════════════════════════════════

function StepResult({
  recipe,
  description,
  baseColor,
  recipeId,
  reservationCode,
  recommendedVec,
  onRestart,
  onBackHome,
}: {
  recipe: ScentRecipe;
  description: string;
  baseColor: string;
  recipeId: string | null;
  reservationCode: string | null;
  recommendedVec?: PersonaVector;
  onRestart: () => void;
  onBackHome: () => void;
}) {
  const base = recipe.base ? getScentBase(recipe.base) : null;
  const delivery = recipe.delivery ? DELIVERY_OPTIONS.find((d) => d.id === recipe.delivery) : null;
  const bottle = recipe.bottle ? BOTTLE_OPTIONS.find((b) => b.id === recipe.bottle) : null;
  const isOffline = recipe.delivery === 'onetime' || recipe.delivery === 'preorder';

  return (
    <GlassPanel gold padding="lg">
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${baseColor}44 0%, transparent 65%)` }}
      />
      <div className="relative text-center">
        <div className="text-[11px] tracking-[0.5em] text-amethyst-400/70 uppercase mb-2">
          Step 05 · 你的气味已成型
        </div>
        {base && (
          <div className="font-display text-5xl mb-2" style={{ color: baseColor }}>
            {base.symbol}
          </div>
        )}
        <p className="font-display text-lg text-moon-50/90 leading-relaxed tracking-[0.05em] max-w-md mx-auto">
          {description}
        </p>

        {/* 配方摘要 */}
        <div className="mt-6 grid grid-cols-3 gap-2 max-w-md mx-auto">
          {base && (
            <div className="glass rounded-lg p-2.5">
              <div className="text-[9px] tracking-[0.2em] text-moon-200/40 uppercase font-mono">基础</div>
              <div className="text-xs mt-1 font-medium" style={{ color: baseColor }}>{base.label}</div>
            </div>
          )}
          {delivery && (
            <div className="glass rounded-lg p-2.5">
              <div className="text-[9px] tracking-[0.2em] text-moon-200/40 uppercase font-mono">交付</div>
              <div className="text-xs mt-1 font-medium text-gold-400/80">{delivery.label}</div>
            </div>
          )}
          {bottle && (
            <div className="glass rounded-lg p-2.5">
              <div className="text-[9px] tracking-[0.2em] text-moon-200/40 uppercase font-mono">瓶器</div>
              <div className="text-xs mt-1 font-medium text-moon-50/80">{bottle.label}</div>
            </div>
          )}
        </div>

        {/* 线上注册 · 配方复用 */}
        {recipeId && (
          <div className="mt-6 p-4 rounded-lg border border-amethyst-500/20 bg-white/[0.02]">
            <div className="text-[10px] tracking-[0.3em] text-amethyst-400/60 uppercase mb-1">
              ◆ 线上配方已注册
            </div>
            <div className="font-mono text-sm text-gold-sheen tracking-[0.1em]">{recipeId}</div>
            <p className="text-[10px] text-moon-200/45 italic mt-1.5">
              下次复用此配方 · 直接输入 ID 即可还原你的气味
            </p>
          </div>
        )}

        {/* 线下预约 · 定制杯垫 */}
        {isOffline && reservationCode && (
          <div className="mt-3 p-4 rounded-lg border border-gold-400/25 bg-gold-400/[0.04]">
            <div className="text-[10px] tracking-[0.3em] text-gold-400/70 uppercase mb-1">
              ◇ 线下预约凭证
            </div>
            <div className="font-mono text-sm text-gold-sheen tracking-[0.1em]">{reservationCode}</div>
            <p className="text-[10px] text-moon-200/45 italic mt-1.5">
              凭此码到酒馆现场取杯 · 可预约下次定制调酒香味杯垫
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-8 flex gap-3 justify-center">
          <GradientButton variant="ghost" size="md" onClick={onRestart}>
            重新搭建
          </GradientButton>
          <GradientButton variant="gold" size="md" onClick={onBackHome}>
            返回调酒 →
          </GradientButton>
        </div>

        {/* 喝后评分 · 闭环入口 · 产物成型后征集味觉反馈 */}
        <div className="mt-8 max-w-sm mx-auto">
          <RatingCard
            recipeId={`scent-${recipe.base ?? 'x'}-${[...recipe.topNotes, ...recipe.heartNotes, ...recipe.baseNotes].sort().join(',')}`}
            recommendedVec={recommendedVec}
          />
        </div>
      </div>
    </GlassPanel>
  );
}
