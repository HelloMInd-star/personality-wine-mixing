/**
 * CocktailBuilder · 步进式调酒搭建主容器
 * 5 步流程：选基调 → 拼风味 → 预览 → 选场景 → 完成（揭示动画）
 * 参考 ScentLabPage 步进式设计 · 推荐驱动 · 每步主理人引导
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PersonaVector } from '../../types/personaFusion';
import type { BaseSpirit, FlavorKey } from '../../types/cocktail';
import type { FusionCocktail } from '../../types/mbtiParty';
import { FLAVOR_MAP } from '../../data/flavorMeta';
import GlassPanel from '../ui/GlassPanel';
import GradientButton from '../ui/GradientButton';
import BaseSelector, { getBaseMeta, calcAffinity } from './BaseSelector';
import FlavorSelector from './FlavorSelector';
import CocktailRevealStage from '../mbtiparty/CocktailRevealStage';

type BuilderStep = 'base' | 'flavor' | 'preview' | 'scene' | 'result';
type DrinkScene = 'solo' | 'tipsy' | 'party' | 'latenight';

const STEP_ORDER: BuilderStep[] = ['base', 'flavor', 'preview', 'scene', 'result'];
const STEP_LABEL: Record<BuilderStep, string> = {
  base: '选基调',
  flavor: '拼风味',
  preview: '预览',
  scene: '选场景',
  result: '完成',
};

/** 主理人引导语 · 每步一句 */
const STEP_GUIDE: Record<BuilderStep, string> = {
  base: '选一个基调，让我开始调',
  flavor: '加入你喜欢的味道',
  preview: '看看这杯怎么样',
  scene: '这杯适合什么场景',
  result: '调好了，今夜随你选',
};

/** 场景元数据 · 影响命名后缀与氛围 */
const SCENE_META: Record<DrinkScene, { label: string; symbol: string; suffix: string; desc: string }> = {
  solo: { label: '独酌', symbol: '◐', suffix: '独酌之杯', desc: '一人一夜 · 与自己对饮' },
  tipsy: { label: '微醺', symbol: '◑', suffix: '微醺之杯', desc: '半醒半醉的临界' },
  party: { label: '聚会', symbol: '◒', suffix: '同饮之杯', desc: '众人举杯的喧响' },
  latenight: { label: '夜深', symbol: '◓', suffix: '夜深之杯', desc: '星河低垂时的静饮' },
};

const SCENE_KEYS: DrinkScene[] = ['solo', 'tipsy', 'party', 'latenight'];

/** 派生融合酒 · 喂给 CocktailRevealStage 揭示动画 */
function buildFusion(
  base: BaseSpirit,
  flavors: FlavorKey[],
  scene: DrinkScene,
  vec: PersonaVector | null,
): FusionCocktail {
  const baseMeta = getBaseMeta(base);
  const primaryColor = baseMeta?.color ?? '#f0c674';
  const accentColor = flavors[0] ? FLAVOR_MAP[flavors[0]].color : primaryColor;
  const matchScore = vec && baseMeta ? Math.round(calcAffinity(baseMeta, vec) * 100) : 80;
  const sceneMeta = SCENE_META[scene];
  const flavorLabel =
    flavors.length > 0 ? flavors.map((f) => FLAVOR_MAP[f].label).join('·') : '纯饮';
  return {
    name: `${baseMeta?.label ?? '酒'}·${sceneMeta.suffix}`,
    subtitle: flavors[0] ? FLAVOR_MAP[flavors[0]].poem : '夜为你调的一则注脚',
    primaryColor,
    accentColor,
    matchScore,
    fusionLabel: `${sceneMeta.label} · ${flavorLabel}`,
    participants: [],
  };
}

interface CocktailBuilderProps {
  dynamicVector: PersonaVector | null;
  /** 调酒完成回调 · 进入 result 步时传出稳定 recipeId 供评分回路使用 */
  onCrafted?: (crafted: { recipeId: string; name: string }) => void;
}

export default function CocktailBuilder({ dynamicVector, onCrafted }: CocktailBuilderProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<BuilderStep>('base');
  const [baseSpirit, setBaseSpirit] = useState<BaseSpirit | null>(null);
  const [flavors, setFlavors] = useState<FlavorKey[]>([]);
  const [scene, setScene] = useState<DrinkScene | null>(null);
  const [revealKey, setRevealKey] = useState(0); // 触发揭示动画重播

  const stepIndex = STEP_ORDER.indexOf(step);
  const isResult = step === 'result';

  /** 判断当前步是否完成 · 用于启用下一步 */
  const isStepComplete = (): boolean => {
    if (step === 'base') return baseSpirit !== null;
    if (step === 'flavor') return flavors.length > 0;
    if (step === 'preview') return true;
    if (step === 'scene') return scene !== null;
    return true;
  };

  const handleNext = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx >= STEP_ORDER.length) return;
    // 进入 result 步递增 revealKey · 触发揭示动画重挂载重播
    if (STEP_ORDER[nextIdx] === 'result') setRevealKey((k) => k + 1);
    setStep(STEP_ORDER[nextIdx]);
  };

  const handlePrev = () => {
    if (stepIndex <= 0) return;
    setStep(STEP_ORDER[stepIndex - 1]);
  };

  const reset = () => {
    setStep('base');
    setBaseSpirit(null);
    setFlavors([]);
    setScene(null);
  };

  // result 步派生 · 必须有 base+scene
  const fusion = useMemo(() => {
    if (!baseSpirit || !scene) return null;
    return buildFusion(baseSpirit, flavors, scene, dynamicVector);
  }, [baseSpirit, flavors, scene, dynamicVector]);

  // 预览步派生 · 无 scene 时用 solo 兜底
  const previewFusion = useMemo(() => {
    if (!baseSpirit) return null;
    return buildFusion(baseSpirit, flavors, scene ?? 'solo', dynamicVector);
  }, [baseSpirit, flavors, scene, dynamicVector]);

  // 进入 result 步 · 通知父组件调酒完成 · 传出稳定 recipeId 供评分回路
  useEffect(() => {
    if (isResult && fusion && onCrafted) {
      const recipeId = `juezui-builder-${baseSpirit}-${flavors
        .slice()
        .sort()
        .join('-')}-${scene}`;
      onCrafted({ recipeId, name: fusion.name });
    }
  }, [isResult, fusion, onCrafted, baseSpirit, flavors, scene]);

  return (
    <div>
      {/* 步骤指示器 · 参考 ScentLabPage */}
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

      {/* 主理人引导语 */}
      {!isResult && (
        <div className="max-w-3xl mx-auto mb-8 text-center">
          <p className="text-sm text-moon-200/50 italic font-display">
            「{STEP_GUIDE[step]}」
          </p>
        </div>
      )}

      {/* 步骤内容 */}
      <div className="max-w-5xl mx-auto">
        {step === 'base' && (
          <BaseSelector
            dynamicVector={dynamicVector}
            selected={baseSpirit}
            onSelect={setBaseSpirit}
          />
        )}

        {step === 'flavor' && (
          <FlavorSelector
            dynamicVector={dynamicVector}
            selected={flavors}
            onSelect={setFlavors}
          />
        )}

        {step === 'preview' && previewFusion && baseSpirit && (
          <PreviewStep fusion={previewFusion} baseSpirit={baseSpirit} flavors={flavors} />
        )}

        {step === 'scene' && (
          <SceneSelector selected={scene} onSelect={setScene} />
        )}

        {isResult && fusion && (
          <div className="flex flex-col items-center">
            {/* 揭示动画 · key 触发重挂载重播 */}
            <CocktailRevealStage key={revealKey} fusion={fusion} size={360} />

            {/* 去向入口 */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <GradientButton variant="gold" size="md" onClick={() => navigate('/mbti-party')}>
                去酒局 →
              </GradientButton>
              <GradientButton variant="ghost" size="md" onClick={() => navigate('/bar-counter')}>
                去吧台 →
              </GradientButton>
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-6 text-xs text-amethyst-400/50 hover:text-gold-400 transition-colors tracking-widest"
            >
              ↺ 再调一杯
            </button>
          </div>
        )}
      </div>

      {/* 底部导航 · result 步不显示 */}
      {!isResult && (
        <div className="max-w-5xl mx-auto mt-10 flex items-center justify-between">
          <GradientButton
            variant="ghost"
            size="md"
            onClick={handlePrev}
            disabled={stepIndex === 0}
          >
            ← 上一步
          </GradientButton>
          <GradientButton
            variant="gold"
            size="md"
            onClick={handleNext}
            disabled={!isStepComplete()}
          >
            {step === 'scene' ? '完成调酒' : '下一步 →'}
          </GradientButton>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Step 3 · 预览 · 展示派生酒名/色卡/构成/匹配度
 * ───────────────────────────────────────────── */
function PreviewStep({
  fusion,
  baseSpirit,
  flavors,
}: {
  fusion: FusionCocktail;
  baseSpirit: BaseSpirit;
  flavors: FlavorKey[];
}) {
  const baseMeta = getBaseMeta(baseSpirit);
  return (
    <div className="text-center">
      <div className="text-[11px] tracking-[0.6em] text-amethyst-400/60 uppercase mb-3">
        Step 3 · 预览
      </div>
      <h3 className="font-display text-xl text-gold-sheen mb-2">预览这杯</h3>
      <p className="text-sm text-moon-200/60 leading-relaxed mb-8">
        主理人正在把这杯酒调给你看
      </p>

      <GlassPanel gold padding="lg" className="max-w-md mx-auto">
        {/* 色卡 · primary → accent 渐变 */}
        <div
          className="h-20 rounded-xl mb-5"
          style={{
            background: `linear-gradient(135deg, ${fusion.primaryColor}, ${fusion.accentColor})`,
            boxShadow: `0 0 24px ${fusion.primaryColor}44`,
          }}
        />
        {/* 酒名 */}
        <div className="font-display text-2xl text-gold-sheen mb-1">{fusion.name}</div>
        <div className="text-xs text-moon-200/55 italic mb-4">{fusion.subtitle}</div>

        {/* 构成标签 */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-mono"
            style={{
              background: `${fusion.primaryColor}22`,
              color: fusion.primaryColor,
              border: `1px solid ${fusion.primaryColor}44`,
            }}
          >
            {baseMeta?.label}
          </span>
          {flavors.map((f) => (
            <span
              key={f}
              className="px-2 py-0.5 rounded-full text-[10px] font-mono"
              style={{
                background: `${FLAVOR_MAP[f].color}22`,
                color: FLAVOR_MAP[f].color,
                border: `1px solid ${FLAVOR_MAP[f].color}44`,
              }}
            >
              {FLAVOR_MAP[f].label}
            </span>
          ))}
        </div>

        {/* 匹配度 */}
        <div className="text-[11px] font-mono text-gold-400/60 tracking-widest">
          匹配度 {fusion.matchScore}
        </div>
      </GlassPanel>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Step 4 · 选场景 · 4 种饮用场景
 * ───────────────────────────────────────────── */
function SceneSelector({
  selected,
  onSelect,
}: {
  selected: DrinkScene | null;
  onSelect: (s: DrinkScene) => void;
}) {
  return (
    <div className="text-center">
      <div className="text-[11px] tracking-[0.6em] text-amethyst-400/60 uppercase mb-3">
        Step 4 · 场景
      </div>
      <h3 className="font-display text-xl text-gold-sheen mb-2">选场景</h3>
      <p className="text-sm text-moon-200/60 leading-relaxed mb-8">
        这杯酒，你打算在什么场景喝
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {SCENE_KEYS.map((key) => {
          const meta = SCENE_META[key];
          const isSelected = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className="relative rounded-2xl p-5 text-center transition-all duration-500"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(240,198,116,0.15), rgba(124,95,191,0.08))'
                  : 'rgba(15, 10, 30, 0.6)',
                border: isSelected
                  ? '1px solid rgba(240,198,116,0.5)'
                  : '1px solid rgba(124, 95, 191, 0.15)',
                boxShadow: isSelected ? '0 4px 20px rgba(240,198,116,0.2)' : 'none',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="text-3xl text-gold-sheen mb-2 transition-all duration-500"
                style={{ textShadow: isSelected ? '0 0 12px rgba(240,198,116,0.5)' : 'none' }}
              >
                {meta.symbol}
              </div>
              <div className="font-display text-base text-moon-50 mb-1">{meta.label}</div>
              <div className="text-[10px] text-moon-200/50 leading-relaxed">{meta.desc}</div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-gold-sheen text-void-900">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
