/**
 * CardsPage · 牌类人格采集 · 数据入口层
 *
 * 觉醉 可编程酒馆的「数据入口层」UI：
 *   四套牌类（塔罗/星盘/扑克/德州）采集 → 融合 → 六维人格向量
 *   落库后作为唯一数据契约，驱动调酒/光效/香氛派生
 *
 * 四步流程：
 *   1. 塔罗 · 22 张大阿尔卡纳选 3 张 → 三牌阵（过去/现在/未来）+ 逆位
 *   2. 星盘 · 选太阳星座 + 出生时辰 → 派生六星体星座
 *   3. 扑克 · 随机发 5 张 → 识别牌型
 *   4. 德州 · 3 次决策（fold/call/raise）→ 记录行为与决策时长
 *
 * 完成后调用 cocktailService.fuseAndSaveVector → 展示融合结果 → 跳转调酒页
 *
 * 视觉语言：深空紫金 + 磨砂玻璃 + 单字符号，与 TavernPage / CocktailPage 一致
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cocktailService } from '../services/cocktailService';
import { useAppStore } from '../store/appStore';
import { TAROT_CARDS, drawRandomTarot } from '../data/tarotCards';
import { ALL_SIGNS, SIGN_ELEMENT } from '../data/personaFusionMaps';
import {
  MODULE_LABEL,
  MODULE_COLOR,
  MODULE_SYMBOL,
  MODULE_DESC,
} from '../data/personaFusionMaps';
import { DIM_LABEL, type PersonaDim } from '../types/personaFusion';
import type {
  TarotCard,
  TarotDrawnCard,
  TarotResult,
  TarotPosition,
  ZodiacResult,
  PokerCard,
  PokerHandType,
  PokerResult,
  PokerSuit,
  PokerRank,
  TexasAction,
  TexasResult,
  FusionInput,
  PersonaFusion,
} from '../types/personaFusion';
import GlassPanel from '../components/ui/GlassPanel';
import GradientButton from '../components/ui/GradientButton';
import VectorLiveBar from '../components/cards/VectorLiveBar';
import CardCustomizationSection from '../components/cards/CardCustomizationSection';

// ═════════════════════════════════════════════════════════
// 常量
// ═════════════════════════════════════════════════════════

type Step = 'tarot' | 'zodiac' | 'poker' | 'texas' | 'result';

const STEP_ORDER: Step[] = ['tarot', 'zodiac', 'poker', 'texas', 'result'];

const STEP_INDEX: Record<Step, number> = {
  tarot: 0,
  zodiac: 1,
  poker: 2,
  texas: 3,
  result: 4,
};

/** 22 张大阿尔卡纳 · 塔罗步只从大牌中选 */
const MAJOR_ARCANA = TAROT_CARDS.filter((c) => c.arcana === 'major');

/** 三牌阵位置 · 顺序固定 */
const TAROT_POSITIONS: TarotPosition[] = ['past', 'present', 'future'];
const TAROT_POSITION_LABEL: Record<TarotPosition, string> = {
  past: '过去',
  present: '现在',
  future: '未来',
};

/** 出生时辰段 · 用于派生月亮/上升星座（简化映射） */
const TIME_SLOTS = ['子时 23-01', '卯时 05-07', '午时 11-13', '酉时 17-19'] as const;

/** 扑克花色与点数 */
const SUITS: PokerSuit[] = ['♠', '♥', '♦', '♣'];
const RANKS: PokerRank[] = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
];

/** 牌型中文标签 */
const HAND_LABEL: Record<PokerHandType, string> = {
  同花顺: '同花顺',
  四条: '四条',
  葫芦: '葫芦',
  同花: '同花',
  顺子: '顺子',
  三条: '三条',
  两对: '两对',
  对子: '对子',
  高牌: '高牌',
};

/** 德州决策场景 · 简化为 3 个固定场景 */
const TEXAS_SCENES = [
  { title: '翻牌前', desc: '手牌已发，公共牌未开', board: 0 },
  { title: '翻牌', desc: '三张公共牌已开', board: 3 },
  { title: '转牌', desc: '第四张公共牌已开', board: 4 },
] as const;

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

/** 简易种子随机 · 便于回放 */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** 随机整数 [0, n) */
function randInt(rng: () => number, n: number): number {
  return Math.floor(rng() * n);
}

/** 随机发 n 张不重复扑克牌 */
function dealPoker(n: number, seed?: number): PokerCard[] {
  const rng = makeRng(seed ?? Date.now());
  const pool: PokerCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      pool.push({ suit, rank });
    }
  }
  const hand: PokerCard[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = randInt(rng, pool.length);
    hand.push(pool.splice(idx, 1)[0]);
  }
  return hand;
}

/** 点数排序值 · A=14 最大 */
function rankValue(r: PokerRank): number {
  if (r === 'A') return 14;
  if (r === 'K') return 13;
  if (r === 'Q') return 12;
  if (r === 'J') return 11;
  return parseInt(r, 10);
}

/** 识别 5 张牌的牌型 */
function evaluateHand(hand: PokerCard[]): { handType: PokerHandType; highCard: PokerRank } {
  const values = hand.map((c) => rankValue(c.rank)).sort((a, b) => b - a);
  const suits = hand.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);
  // 顺子 · 含 A-2-3-4-5 低顺
  const uniqVals = [...new Set(values)].sort((a, b) => b - a);
  let isStraight = false;
  if (uniqVals.length === 5) {
    if (uniqVals[0] - uniqVals[4] === 4) isStraight = true;
    // A-2-3-4-5
    if (uniqVals[0] === 14 && uniqVals[1] === 5 && uniqVals[4] === 2) isStraight = true;
  }
  // 点数计数
  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
  const countVals = Object.values(counts).sort((a, b) => b - a);
  const highRank = hand.find((c) => rankValue(c.rank) === values[0])!.rank;

  if (isStraight && isFlush) return { handType: '同花顺', highCard: highRank };
  if (countVals[0] === 4) return { handType: '四条', highCard: highRank };
  if (countVals[0] === 3 && countVals[1] === 2) return { handType: '葫芦', highCard: highRank };
  if (isFlush) return { handType: '同花', highCard: highRank };
  if (isStraight) return { handType: '顺子', highCard: highRank };
  if (countVals[0] === 3) return { handType: '三条', highCard: highRank };
  if (countVals[0] === 2 && countVals[1] === 2) return { handType: '两对', highCard: highRank };
  if (countVals[0] === 2) return { handType: '对子', highCard: highRank };
  return { handType: '高牌', highCard: highRank };
}

/** 由太阳星座 + 时辰段派生六星体星座（简化映射） */
function deriveZodiacSigns(sun: string, timeSlotIndex: number): Omit<ZodiacResult, 'input' | 'submittedAt'> {
  const rng = makeRng(sun.charCodeAt(0) + timeSlotIndex * 31 + 7);
  const pick = (exclude: string[]) => {
    const pool = ALL_SIGNS.filter((s) => !exclude.includes(s));
    return pool[randInt(rng, pool.length)];
  };
  const moon = pick([sun]);
  const rising = pick([sun, moon]);
  const mercury = pick([sun, moon, rising]);
  const mars = pick([sun, moon, rising, mercury]);
  const venus = pick([sun, moon, rising, mercury, mars]);
  return { sunSign: sun, moonSign: moon, risingSign: rising, mercurySign: mercury, marsSign: mars, venusSign: venus };
}

// ═════════════════════════════════════════════════════════
// 主组件
// ═════════════════════════════════════════════════════════

export default function CardsPage() {
  const navigate = useNavigate();
  const { saveVector } = useAppStore();

  const [step, setStep] = useState<Step>('tarot');

  // 四步采集结果
  const [tarotResult, setTarotResult] = useState<TarotResult | null>(null);
  const [zodiacResult, setZodiacResult] = useState<ZodiacResult | null>(null);
  const [pokerResult, setPokerResult] = useState<PokerResult | null>(null);
  const [texasResult, setTexasResult] = useState<TexasResult | null>(null);

  // 融合产物
  const [fusion, setFusion] = useState<PersonaFusion | null>(null);

  const stepIndex = STEP_INDEX[step];
  const isResult = step === 'result';

  // 实时部分融合向量 · 每步完成后用已采集模块计算
  const { liveVector, collectedCount } = useMemo(() => {
    const input: FusionInput = {};
    let count = 0;
    if (tarotResult) { input.tarot = { result: tarotResult }; count++; }
    if (zodiacResult) { input.zodiac = { result: zodiacResult }; count++; }
    if (pokerResult) { input.poker = { result: pokerResult }; count++; }
    if (texasResult) { input.texas = { result: texasResult }; count++; }
    if (count === 0) return { liveVector: null, collectedCount: 0 };
    return { liveVector: cocktailService.fusePersona(input).finalVector, collectedCount: count };
  }, [tarotResult, zodiacResult, pokerResult, texasResult]);

  /** 进入下一步 · result 步触发融合 + 持久化 */
  const handleNext = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx >= STEP_ORDER.length) return;
    const nextStep = STEP_ORDER[nextIdx];
    if (nextStep === 'result') {
      // 融合 + 持久化
      const input: FusionInput = {};
      if (tarotResult) input.tarot = { result: tarotResult };
      if (zodiacResult) input.zodiac = { result: zodiacResult };
      if (pokerResult) input.poker = { result: pokerResult };
      if (texasResult) input.texas = { result: texasResult };
      const f = cocktailService.fuseAndSaveVector(input);
      saveVector(f.finalVector);
      setFusion(f);
    }
    setStep(nextStep);
  };

  const handlePrev = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx < 0) return;
    setStep(STEP_ORDER[prevIdx]);
  };

  /** 跳过当前步 · 该步结果置 null，融合时缺失模块跳过 */
  const handleSkip = () => {
    if (step === 'tarot') setTarotResult(null);
    if (step === 'zodiac') setZodiacResult(null);
    if (step === 'poker') setPokerResult(null);
    if (step === 'texas') setTexasResult(null);
    handleNext();
  };

  /** 完成态 · 跳转调酒页查看专属推荐 */
  const handleViewCocktail = () => navigate('/cocktail');

  /** 重新采集 · 清空所有结果回到塔罗步 */
  const handleRestart = () => {
    setTarotResult(null);
    setZodiacResult(null);
    setPokerResult(null);
    setTexasResult(null);
    setFusion(null);
    setStep('tarot');
  };

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 页面标题 */}
      <header className="mb-10 md:mb-14">
        <div className="text-[11px] tracking-[0.6em] text-amethyst-400/80 uppercase mb-3">
          Card-based Persona Collection
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
          牌类 · 采镜
        </h1>
        <p className="mt-2 text-sm md:text-base text-moon-200/60 italic">
          四套牌织一张向量，向量织一杯酒。
        </p>
        <div className="divider-gold mt-5 w-40" />
      </header>

      {/* 进度条 · 四步采集 + 结果 */}
      {!isResult && (
        <StepIndicator currentStep={step} doneCount={stepIndex} />
      )}

      {/* 实时向量可视化 · 采镜阶段显示 · 每步完成后部分融合演进 */}
      {!isResult && (
        <div className="max-w-3xl mx-auto mb-10">
          <VectorLiveBar
            vector={liveVector}
            collectedCount={collectedCount}
            title="实时向量 · 随采镜演进"
          />
        </div>
      )}

      {/* 各步内容 */}
      {step === 'tarot' && (
        <TarotStep
          result={tarotResult}
          onChange={setTarotResult}
        />
      )}
      {step === 'zodiac' && (
        <ZodiacStep
          result={zodiacResult}
          onChange={setZodiacResult}
        />
      )}
      {step === 'poker' && (
        <PokerStep
          result={pokerResult}
          onChange={setPokerResult}
        />
      )}
      {step === 'texas' && (
        <TexasStep
          result={texasResult}
          onChange={setTexasResult}
        />
      )}
      {isResult && fusion && (
        <ResultView
          fusion={fusion}
          onViewCocktail={handleViewCocktail}
          onRestart={handleRestart}
        />
      )}

      {/* 底部导航 · 结果步不显示 */}
      {!isResult && (
        <div className="mt-10 flex items-center justify-between">
          <GradientButton
            variant="ghost"
            size="md"
            onClick={step === 'tarot' ? () => navigate('/personality') : handlePrev}
          >
            ← {step === 'tarot' ? '返回人格入口' : '上一步'}
          </GradientButton>
          <div className="flex gap-3">
            <GradientButton variant="ghost" size="md" onClick={handleSkip}>
              跳过此步
            </GradientButton>
            <GradientButton
              variant="gold"
              size="md"
              onClick={handleNext}
              disabled={!isStepComplete(step, tarotResult, zodiacResult, pokerResult, texasResult)}
            >
              {step === 'texas' ? '融合向量 →' : '下一步 →'}
            </GradientButton>
          </div>
        </div>
      )}

      {/* 周边定制区块 · 牌的定制 · 包装材质 + 烫金纹样 + MBTI 卡片预览
          与牌类人格采集解耦 · 用户选择持久化到 localStorage
          在 MBTI 酒局揭示阶段的牌盒取出动画中应用 */}
      <CardCustomizationSection />
    </div>
  );
}

/** 判断当前步是否完成 · 用于启用"下一步" */
function isStepComplete(
  step: Step,
  tarot: TarotResult | null,
  zodiac: ZodiacResult | null,
  poker: PokerResult | null,
  texas: TexasResult | null,
): boolean {
  if (step === 'tarot') return tarot !== null;
  if (step === 'zodiac') return zodiac !== null;
  if (step === 'poker') return poker !== null;
  if (step === 'texas') return texas !== null;
  return false;
}

// ═════════════════════════════════════════════════════════
// 进度指示器
// ═════════════════════════════════════════════════════════

function StepIndicator({ currentStep, doneCount }: { currentStep: Step; doneCount: number }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'tarot', label: '塔罗' },
    { key: 'zodiac', label: '星盘' },
    { key: 'poker', label: '扑克' },
    { key: 'texas', label: '德州' },
  ];
  return (
    <div className="max-w-3xl mx-auto mb-12">
      <div className="flex items-center justify-between gap-2">
        {steps.map((s, i) => {
          const done = i < doneCount;
          const active = s.key === currentStep;
          return (
            <div key={s.key} className="flex-1 flex items-center gap-2">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-sm transition-all duration-500 ${
                    active
                      ? 'bg-gradient-to-br from-gold-400 to-amethyst-500 text-void shadow-glow-gold'
                      : done
                        ? 'bg-amethyst-500/30 text-gold-sheen border border-gold-400/40'
                        : 'glass text-moon-200/50'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </div>
                <div
                  className={`text-[11px] tracking-widest ${
                    active ? 'text-gold-sheen font-display' : done ? 'text-moon-200/70' : 'text-moon-200/40'
                  }`}
                >
                  {s.label}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-px flex-1 transition-all duration-500 ${
                    done ? 'bg-gradient-to-r from-gold-400/60 to-amethyst-500/40' : 'bg-amethyst-500/15'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 步骤 1 · 塔罗
// ═════════════════════════════════════════════════════════

function TarotStep({
  result,
  onChange,
}: {
  result: TarotResult | null;
  onChange: (r: TarotResult | null) => void;
}) {
  // 选中的牌 id 列表 · 最多 3 张
  const [selectedIds, setSelectedIds] = useState<number[]>(
    result ? result.cards.map((c) => c.cardId) : [],
  );

  const handlePick = (card: TarotCard) => {
    const idx = selectedIds.indexOf(card.id);
    if (idx >= 0) {
      // 取消选择
      setSelectedIds(selectedIds.filter((id) => id !== card.id));
      return;
    }
    if (selectedIds.length >= 3) return;
    const next = [...selectedIds, card.id];
    setSelectedIds(next);
    // 选满 3 张 · 构造 TarotResult · 自动分配位置 + 随机逆位
    if (next.length === 3) {
      const rng = makeRng(Date.now());
      const cards: TarotDrawnCard[] = next.map((id, i) => ({
        cardId: id,
        position: TAROT_POSITIONS[i],
        isReversed: rng() < 0.4,
      }));
      onChange({ cards, submittedAt: Date.now() });
    } else {
      onChange(null);
    }
  };

  /** 重新随机抽 3 张 · 体验用 */
  const handleRandomDraw = () => {
    const drawn = drawRandomTarot(3, Date.now());
    const rng = makeRng(Date.now() + 1);
    const cards: TarotDrawnCard[] = drawn.map((c, i) => ({
      cardId: c.id,
      position: TAROT_POSITIONS[i],
      isReversed: rng() < 0.4,
    }));
    setSelectedIds(drawn.map((c) => c.id));
    onChange({ cards, submittedAt: Date.now() });
  };

  const selectedCards = selectedIds
    .map((id) => MAJOR_ARCANA.find((c) => c.id === id))
    .filter(Boolean) as TarotCard[];

  return (
    <section className="max-w-5xl mx-auto">
      <StepHeader
        symbol={MODULE_SYMBOL.tarot}
        color={MODULE_COLOR.tarot}
        title={MODULE_LABEL.tarot}
        en="Tarot"
        desc={MODULE_DESC.tarot}
      />

      {/* 三牌阵位置预览 */}
      {selectedCards.length > 0 && (
        <GlassPanel gold padding="md" className="mb-6">
          <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase mb-3">
            Three Cards Spread
          </div>
          <div className="grid grid-cols-3 gap-3">
            {TAROT_POSITIONS.map((pos, i) => {
              const card = selectedCards[i];
              const drawn = result?.cards[i];
              return (
                <div key={pos} className="text-center">
                  <div className="text-[10px] text-amethyst-400/70 tracking-widest mb-2">
                    {TAROT_POSITION_LABEL[pos]}
                  </div>
                  {card ? (
                    <div
                      className={`glass rounded-lg p-3 ${drawn?.isReversed ? 'rotate-180' : ''} transition-transform duration-500`}
                      style={{ borderColor: MODULE_COLOR.tarot + '44' }}
                    >
                      <div className="font-display text-sm text-gold-sheen">{card.name}</div>
                      <div className="text-[9px] text-moon-200/50 mt-1">{card.nameEn}</div>
                      <div className="text-[9px] text-amethyst-400/60 mt-1">
                        {drawn?.isReversed ? '逆位' : '正位'}
                      </div>
                    </div>
                  ) : (
                    <div className="glass rounded-lg p-3 opacity-40">
                      <div className="text-xs text-moon-200/40">待选</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassPanel>
      )}

      {/* 22 张大阿尔卡纳网格 */}
      <GlassPanel padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-moon-200/60">
            选 3 张牌 ·{' '}
            <span className="text-gold-sheen font-mono">{selectedIds.length}/3</span>
          </div>
          <button
            className="text-[11px] text-amethyst-400/70 hover:text-gold-400 transition-colors"
            onClick={handleRandomDraw}
          >
            随机抽牌
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {MAJOR_ARCANA.map((card) => {
            const selected = selectedIds.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => handlePick(card)}
                className={`text-left p-2.5 rounded-lg transition-all duration-300 border ${
                  selected
                    ? 'glass-gold border-gold-400/60 shadow-glow-gold'
                    : 'glass border-transparent hover:border-amethyst-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] text-amethyst-400/60">
                    {String(card.id).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-moon-200/50">{card.element}</span>
                </div>
                <div className={`font-display text-xs ${selected ? 'text-gold-sheen' : 'text-moon-50'}`}>
                  {card.name}
                </div>
                <div className="text-[9px] text-moon-200/40 mt-0.5 truncate">{card.nameEn}</div>
              </button>
            );
          })}
        </div>
      </GlassPanel>
    </section>
  );
}

// ═════════════════════════════════════════════════════════
// 步骤 2 · 星盘
// ═════════════════════════════════════════════════════════

function ZodiacStep({
  result,
  onChange,
}: {
  result: ZodiacResult | null;
  onChange: (r: ZodiacResult | null) => void;
}) {
  const [sunSign, setSunSign] = useState<string>(result?.sunSign ?? '');
  const [timeSlot, setTimeSlot] = useState<number>(0);

  const handleSubmit = () => {
    if (!sunSign) return;
    const derived = deriveZodiacSigns(sunSign, timeSlot);
    const r: ZodiacResult = {
      input: {
        birthDate: '1995-01-01',
        birthTime: TIME_SLOTS[timeSlot],
        birthCity: '未填',
      },
      ...derived,
      submittedAt: Date.now(),
    };
    onChange(r);
  };

  // 已提交时显示结果，未提交时显示表单
  if (result) {
    const signs = [
      { label: '太阳', key: 'sunSign' as const, color: '#F0C674' },
      { label: '月亮', key: 'moonSign' as const, color: '#9b7bd4' },
      { label: '上升', key: 'risingSign' as const, color: '#7c5fbf' },
      { label: '水星', key: 'mercurySign' as const, color: '#6b5b95' },
      { label: '火星', key: 'marsSign' as const, color: '#e06552' },
      { label: '金星', key: 'venusSign' as const, color: '#d4a84b' },
    ];
    return (
      <section className="max-w-3xl mx-auto">
        <StepHeader
          symbol={MODULE_SYMBOL.zodiac}
          color={MODULE_COLOR.zodiac}
          title={MODULE_LABEL.zodiac}
          en="Zodiac"
          desc={MODULE_DESC.zodiac}
        />
        <GlassPanel gold padding="lg">
          <div className="text-center mb-6">
            <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-2">
              Six Celestial Bodies
            </div>
            <div className="font-display text-lg text-moon-50">六星体星座已派生</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {signs.map((s) => {
              const sign = result[s.key];
              const el = SIGN_ELEMENT[sign] ?? '无';
              return (
                <div key={s.key} className="glass rounded-xl p-3 text-center">
                  <div className="text-[10px] tracking-widest" style={{ color: s.color }}>
                    {s.label}
                  </div>
                  <div className="font-display text-xl text-gold-sheen mt-1">{sign}</div>
                  <div className="text-[10px] text-moon-200/50 mt-1">{el}象</div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <button
              className="text-[11px] text-amethyst-400/70 hover:text-gold-400 transition-colors"
              onClick={() => onChange(null)}
            >
              重新选择
            </button>
          </div>
        </GlassPanel>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto">
      <StepHeader
        symbol={MODULE_SYMBOL.zodiac}
        color={MODULE_COLOR.zodiac}
        title={MODULE_LABEL.zodiac}
        en="Zodiac"
        desc={MODULE_DESC.zodiac}
      />
      <GlassPanel padding="lg">
        {/* 太阳星座选择 */}
        <div className="mb-8">
          <div className="text-xs tracking-[0.3em] text-amethyst-400/70 mb-3">太阳星座 · SUN</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {ALL_SIGNS.map((sign) => {
              const el = SIGN_ELEMENT[sign];
              const selected = sunSign === sign;
              return (
                <button
                  key={sign}
                  onClick={() => setSunSign(sign)}
                  className={`p-3 rounded-lg transition-all duration-300 border ${
                    selected
                      ? 'glass-gold border-gold-400/60 shadow-glow-gold'
                      : 'glass border-transparent hover:border-amethyst-500/30'
                  }`}
                >
                  <div className={`font-display text-base ${selected ? 'text-gold-sheen' : 'text-moon-50'}`}>
                    {sign}
                  </div>
                  <div className="text-[9px] text-moon-200/50 mt-0.5">{el}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 出生时辰段 */}
        <div className="mb-8">
          <div className="text-xs tracking-[0.3em] text-amethyst-400/70 mb-3">出生时辰 · TIME</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIME_SLOTS.map((slot, i) => {
              const selected = timeSlot === i;
              return (
                <button
                  key={slot}
                  onClick={() => setTimeSlot(i)}
                  className={`p-3 rounded-lg transition-all duration-300 border text-sm ${
                    selected
                      ? 'glass-gold border-gold-400/60 text-gold-sheen'
                      : 'glass border-transparent text-moon-200/70 hover:border-amethyst-500/30'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <GradientButton
            variant="gold"
            size="md"
            onClick={handleSubmit}
            disabled={!sunSign}
          >
            派生星盘
          </GradientButton>
        </div>
      </GlassPanel>
    </section>
  );
}

// ═════════════════════════════════════════════════════════
// 步骤 3 · 扑克
// ═════════════════════════════════════════════════════════

function PokerStep({
  result,
  onChange,
}: {
  result: PokerResult | null;
  onChange: (r: PokerResult | null) => void;
}) {
  const handleDeal = () => {
    const hand = dealPoker(5);
    const { handType, highCard } = evaluateHand(hand);
    onChange({
      hand,
      handType,
      highCard,
      submittedAt: Date.now(),
    });
  };

  return (
    <section className="max-w-3xl mx-auto">
      <StepHeader
        symbol={MODULE_SYMBOL.poker}
        color={MODULE_COLOR.poker}
        title={MODULE_LABEL.poker}
        en="Poker"
        desc={MODULE_DESC.poker}
      />
      <GlassPanel padding="lg">
        {result ? (
          <div className="text-center">
            <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-4">
              Your Hand
            </div>
            {/* 五张牌 */}
            <div className="flex justify-center gap-2 mb-6">
              {result.hand.map((card, i) => (
                <div
                  key={i}
                  className="w-16 h-24 glass rounded-lg flex flex-col items-center justify-center relative"
                  style={{
                    borderColor:
                      card.suit === '♥' || card.suit === '♦'
                        ? 'rgba(224, 101, 82, 0.4)'
                        : 'rgba(124, 95, 191, 0.3)',
                  }}
                >
                  <div
                    className={`font-display text-2xl ${
                      card.suit === '♥' || card.suit === '♦' ? 'text-rose-300' : 'text-moon-50'
                    }`}
                  >
                    {card.rank}
                  </div>
                  <div
                    className={`text-lg ${
                      card.suit === '♥' || card.suit === '♦' ? 'text-rose-300' : 'text-moon-200'
                    }`}
                  >
                    {card.suit}
                  </div>
                </div>
              ))}
            </div>
            {/* 牌型 */}
            <div className="mb-6">
              <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase mb-1">
                Hand Type
              </div>
              <div className="font-display text-3xl text-gold-sheen text-shadow-glow-gold">
                {HAND_LABEL[result.handType]}
              </div>
              <div className="text-xs text-moon-200/50 mt-1">最高牌 · {result.highCard}</div>
            </div>
            <button
              className="text-[11px] text-amethyst-400/70 hover:text-gold-400 transition-colors"
              onClick={handleDeal}
            >
              重新发牌
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-moon-200/50 mb-6">点击发牌，让命运给你一个牌型</div>
            <GradientButton variant="gold" size="lg" onClick={handleDeal}>
              发牌
            </GradientButton>
          </div>
        )}
      </GlassPanel>
    </section>
  );
}

// ═════════════════════════════════════════════════════════
// 步骤 4 · 德州
// ═════════════════════════════════════════════════════════

function TexasStep({
  result,
  onChange,
}: {
  result: TexasResult | null;
  onChange: (r: TexasResult | null) => void;
}) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [actions, setActions] = useState<TexasAction[]>([]);
  const [decisionStart, setDecisionStart] = useState<number>(Date.now());
  const [decisionTimes, setDecisionTimes] = useState<number[]>([]);
  // 简化场景 · 预发 hole cards + board cards
  const holeCards = useMemo(() => dealPoker(2, 42), []);
  const boardCards = useMemo(() => dealPoker(5, 137), []);

  const handleAction = (action: TexasAction) => {
    const now = Date.now();
    const dt = now - decisionStart;
    const nextActions = [...actions, action];
    const nextTimes = [...decisionTimes, dt];
    setActions(nextActions);
    setDecisionTimes(nextTimes);

    const nextSceneIdx = sceneIdx + 1;
    if (nextSceneIdx >= TEXAS_SCENES.length) {
      // 完成所有决策 · 构造 TexasResult
      const avgDecisionTime = nextTimes.reduce((a, b) => a + b, 0) / nextTimes.length;
      onChange({
        holeCards,
        boardCards,
        userActions: nextActions,
        handRank: null,
        won: nextActions.filter((a) => a === 'raise').length >= 2, // 简化判定
        avgDecisionTime,
        bluffDetected: nextActions.includes('raise') && nextActions.includes('fold'),
        submittedAt: Date.now(),
      });
      return;
    }
    setSceneIdx(nextSceneIdx);
    setDecisionStart(now);
  };

  // 已完成 · 显示结果
  if (result) {
    const actionCounts: Record<TexasAction, number> = { fold: 0, call: 0, raise: 0 };
    result.userActions.forEach((a) => actionCounts[a]++);
    return (
      <section className="max-w-3xl mx-auto">
        <StepHeader
          symbol={MODULE_SYMBOL.texas}
          color={MODULE_COLOR.texas}
          title={MODULE_LABEL.texas}
          en="Texas Hold'em"
          desc={MODULE_DESC.texas}
        />
        <GlassPanel gold padding="lg">
          <div className="text-center mb-6">
            <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-2">
              Decision Summary
            </div>
            <div className="font-display text-lg text-moon-50">三次决策已记录</div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(['fold', 'call', 'raise'] as TexasAction[]).map((a) => {
              const label = a === 'fold' ? '弃牌' : a === 'call' ? '跟注' : '加注';
              return (
                <div key={a} className="glass rounded-xl p-4 text-center">
                  <div className="text-[10px] tracking-widest text-amethyst-400/60">{label}</div>
                  <div className="font-display text-3xl text-gold-sheen mt-1">
                    {actionCounts[a]}
                  </div>
                  <div className="text-[9px] text-moon-200/40 mt-1">次</div>
                </div>
              );
            })}
          </div>
          <div className="text-center text-xs text-moon-200/50">
            平均决策时长 · {(result.avgDecisionTime / 1000).toFixed(1)}s ·{' '}
            {result.bluffDetected ? (
              <span className="text-gold-sheen">检测到诈唬倾向</span>
            ) : (
              <span>无诈唬</span>
            )}
          </div>
          <div className="mt-6 text-center">
            <button
              className="text-[11px] text-amethyst-400/70 hover:text-gold-400 transition-colors"
              onClick={() => {
                setSceneIdx(0);
                setActions([]);
                setDecisionTimes([]);
                setDecisionStart(Date.now());
                onChange(null);
              }}
            >
              重新决策
            </button>
          </div>
        </GlassPanel>
      </section>
    );
  }

  const scene = TEXAS_SCENES[sceneIdx];

  return (
    <section className="max-w-3xl mx-auto">
      <StepHeader
        symbol={MODULE_SYMBOL.texas}
        color={MODULE_COLOR.texas}
        title={MODULE_LABEL.texas}
        en="Texas Hold'em"
        desc={MODULE_DESC.texas}
      />
      <GlassPanel padding="lg">
        {/* 场景进度 */}
        <div className="text-center mb-6">
          <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase mb-1">
            Scene {sceneIdx + 1} / {TEXAS_SCENES.length}
          </div>
          <div className="font-display text-xl text-gold-sheen">{scene.title}</div>
          <div className="text-xs text-moon-200/50 mt-1">{scene.desc}</div>
        </div>

        {/* 手牌 */}
        <div className="mb-6">
          <div className="text-[10px] tracking-widest text-amethyst-400/60 mb-2 text-center">底牌</div>
          <div className="flex justify-center gap-2">
            {holeCards.map((card, i) => (
              <CardFace key={i} card={card} />
            ))}
          </div>
        </div>

        {/* 公共牌 */}
        {scene.board > 0 && (
          <div className="mb-6">
            <div className="text-[10px] tracking-widest text-amethyst-400/60 mb-2 text-center">公共牌</div>
            <div className="flex justify-center gap-2">
              {boardCards.slice(0, scene.board).map((card, i) => (
                <CardFace key={i} card={card} />
              ))}
              {Array.from({ length: 5 - scene.board }).map((_, i) => (
                <div key={`back-${i}`} className="w-14 h-20 rounded-lg glass opacity-30" />
              ))}
            </div>
          </div>
        )}

        {/* 决策按钮 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleAction('fold')}
            className="py-3 rounded-lg glass hover:border-rose-400/40 transition-all duration-300"
          >
            <div className="font-display text-base text-moon-50">弃牌</div>
            <div className="text-[9px] text-moon-200/40 mt-0.5">Fold</div>
          </button>
          <button
            onClick={() => handleAction('call')}
            className="py-3 rounded-lg glass hover:border-amethyst-400/40 transition-all duration-300"
          >
            <div className="font-display text-base text-moon-50">跟注</div>
            <div className="text-[9px] text-moon-200/40 mt-0.5">Call</div>
          </button>
          <button
            onClick={() => handleAction('raise')}
            className="py-3 rounded-lg glass hover:border-gold-400/50 transition-all duration-300"
          >
            <div className="font-display text-base text-gold-sheen">加注</div>
            <div className="text-[9px] text-moon-200/40 mt-0.5">Raise</div>
          </button>
        </div>
      </GlassPanel>
    </section>
  );
}

/** 扑克牌面 · 小型展示组件 */
function CardFace({ card }: { card: PokerCard }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div
      className="w-14 h-20 glass rounded-lg flex flex-col items-center justify-center"
      style={{
        borderColor: isRed ? 'rgba(224, 101, 82, 0.4)' : 'rgba(124, 95, 191, 0.3)',
      }}
    >
      <div className={`font-display text-xl ${isRed ? 'text-rose-300' : 'text-moon-50'}`}>
        {card.rank}
      </div>
      <div className={`text-sm ${isRed ? 'text-rose-300' : 'text-moon-200'}`}>{card.suit}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 结果视图 · 融合产物
// ═════════════════════════════════════════════════════════

function ResultView({
  fusion,
  onViewCocktail,
  onRestart,
}: {
  fusion: PersonaFusion;
  onViewCocktail: () => void;
  onRestart: () => void;
}) {
  const { finalVector, personaTag, breakdown } = fusion;
  const dims: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

  // 各模块贡献可视化
  const modules: { key: keyof typeof breakdown; label: string }[] = [
    { key: 'tarot', label: '塔罗' },
    { key: 'zodiac', label: '星盘' },
    { key: 'poker', label: '扑克' },
    { key: 'texas', label: '德州' },
  ];

  return (
    <section className="max-w-4xl mx-auto animate-fade-in">
      {/* 主标签 */}
      <GlassPanel gold padding="lg" className="mb-8">
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, #7c5fbf44 0%, transparent 70%)`,
          }}
        />
        <div className="relative text-center">
          <div className="text-[11px] tracking-[0.6em] text-amethyst-400/80 uppercase mb-3">
            Persona Fused
          </div>
          <div className="font-display text-5xl md:text-6xl text-gold-sheen text-shadow-glow-gold leading-tight">
            {personaTag}
          </div>
          <p className="mt-4 text-moon-200/60 italic">
            四套牌织就的向量，已在酒馆那头为你点亮一杯。
          </p>
        </div>
      </GlassPanel>

      {/* 六维向量 */}
      <GlassPanel padding="lg" className="mb-8">
        <div className="text-center mb-6">
          <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-2">
            Six-Dimensional Vector
          </div>
          <h3 className="font-display text-2xl text-moon-50">六维向量</h3>
        </div>
        <div className="space-y-4">
          {dims.map((dim) => {
            const val = finalVector[dim];
            const pct = Math.abs(val) * 100;
            const positive = val >= 0;
            return (
              <div key={dim} className="flex items-center gap-4">
                <div className="w-20 shrink-0">
                  <div className="font-display text-sm text-moon-50">{DIM_LABEL[dim]}</div>
                  <div className="text-[9px] text-amethyst-400/60 font-mono">{dim}</div>
                </div>
                <div className="flex-1 relative h-2 bg-void/60 rounded-full overflow-hidden">
                  {/* 中心线 */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-moon-200/30" />
                  <div
                    className="absolute top-0 bottom-0 transition-all duration-700"
                    style={{
                      left: positive ? '50%' : `${50 - pct / 2}%`,
                      width: `${pct / 2}%`,
                      background: positive
                        ? 'linear-gradient(to right, #7c5fbf, #f0c674)'
                        : 'linear-gradient(to left, #5d44a0, #9b7bd4)',
                    }}
                  />
                </div>
                <div className="w-14 text-right font-mono text-xs">
                  <span className={positive ? 'text-gold-sheen' : 'text-amethyst-300'}>
                    {positive ? '+' : ''}
                    {val.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* 各模块贡献 */}
      <GlassPanel padding="lg" className="mb-8">
        <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-4">
          Module Breakdown
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.map((m) => {
            const bd = breakdown[m.key];
            const present = !!bd;
            return (
              <div
                key={m.key}
                className={`glass rounded-xl p-3 ${present ? '' : 'opacity-40'}`}
              >
                <div className="text-[10px] tracking-widest text-amethyst-400/60 mb-1">
                  {present ? '已采集' : '已跳过'}
                </div>
                <div className="font-display text-base text-moon-50">{m.label}</div>
                {present && (
                  <div className="mt-2 text-[10px] font-mono text-moon-200/50 space-y-0.5">
                    {dims.map((d) => (
                      <div key={d} className="flex justify-between">
                        <span>{d}</span>
                        <span className={bd.vector[d] >= 0 ? 'text-gold-300/70' : 'text-amethyst-300/70'}>
                          {bd.vector[d] >= 0 ? '+' : ''}
                          {bd.vector[d].toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* 操作 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <GradientButton variant="ghost" size="md" onClick={onRestart}>
          重新采集
        </GradientButton>
        <GradientButton variant="gold" size="lg" onClick={onViewCocktail}>
          查看专属调酒 →
        </GradientButton>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════
// 步骤头部 · 复用
// ═════════════════════════════════════════════════════════

function StepHeader({
  symbol,
  color,
  title,
  en,
  desc,
}: {
  symbol: string;
  color: string;
  title: string;
  en: string;
  desc: string;
}) {
  return (
    <div className="text-center mb-8">
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 animate-breathe"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}44)`,
          boxShadow: `0 0 20px ${color}55`,
        }}
      >
        <span className="font-display text-xl text-moon-50/90">{symbol}</span>
      </div>
      <div className="text-[11px] tracking-[0.4em] text-amethyst-400/60 uppercase mb-1">{en}</div>
      <h2 className="font-display text-2xl text-gold-sheen">{title}</h2>
      <p className="text-xs text-moon-200/50 italic mt-1">{desc}</p>
    </div>
  );
}
