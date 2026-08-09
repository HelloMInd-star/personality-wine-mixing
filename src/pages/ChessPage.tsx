/**
 * ChessPage · MBTI 国际象棋局 · 棋风人格采集
 *
 * 三态：atlas（棋风图谱）→ collecting（4 场景决策采集）→ report（棋风人格报告）
 *
 * 采集逻辑：
 *   4 个棋局关键节点 → 用户选走法 → ChessDecisionSignals(0-1)
 *   → signalsToTemperament → temperament.vector → saveVector 落库
 *
 * 不依赖完整棋局 AI · 用关键节点选择式交互降级复杂度
 * 与 CardsPage（牌类采集）同构 · 作为人格采集的第三轨
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { resolveTimeSlot } from '../engine/timeEngine';
import GlassPanel from '../components/ui/GlassPanel';
import GradientButton from '../components/ui/GradientButton';
import { DIM_LABEL, type PersonaVector } from '../types/personaFusion';
import {
  CHESS_TEMPERAMENTS,
  MBTI_CHESS_MAPPING,
  CHESS_COCKTAIL_PARALLEL,
  getChessTemperament,
  signalsToTemperament,
  type ChessDecisionSignals,
  type ChessTemperament,
  type MbtiDimension,
} from '../data/mbtiChessData';

// ═════════════════════════════════════════════════════════
// 4 个棋局场景 · 对应 4 个 MBTI 维度信号
// ═════════════════════════════════════════════════════════

interface ScenarioOption {
  /** 走法标签 */
  label: string;
  /** 走法描述 */
  desc: string;
  /** 信号值 0-1 · 越接近 1 越偏 poleA */
  signal: number;
}

interface Scenario {
  dim: MbtiDimension;
  /** 信号键 */
  signalKey: keyof ChessDecisionSignals;
  title: string;
  /** 棋谱符号 */
  notation: string;
  /** 局面描述 */
  situation: string;
  options: ScenarioOption[];
}

const SCENARIOS: Scenario[] = [
  {
    dim: 'EI',
    signalKey: 'openingAggression',
    title: '开局 · 你的第一手',
    notation: '1. e4 ...',
    situation: '对手走出王兵开局 1.e4 · 抢占中心 · 你执黑回应。',
    options: [
      { label: '1...e5 · 主动对攻', desc: '对称抢占中心 · 开放局面 · 正面交锋', signal: 0.9 },
      { label: '1...e6 · 法兰西稳健', desc: '先稳固阵地 · 结构性反击 · 防守反扑', signal: 0.3 },
      { label: '1...Nf6 · 阿廖欣反常规', desc: '诱兵深入 · 非对称布局 · 灵活反击', signal: 0.65 },
    ],
  },
  {
    dim: 'NS',
    signalKey: 'moveIntuition',
    title: '中局 · 弃子的诱惑',
    notation: '... Nxe5!?',
    situation: '复杂中局 · 一枚弃子可换攻势 · 但计算路径尚不明确。',
    options: [
      { label: '弃子求势 · 直觉出击', desc: '凭全局 pattern 出手 · 敢于未计算的冒险', signal: 0.9 },
      { label: '长考计算 · 保守稳固', desc: '算清变化再走 · 不冒未计算的风险', signal: 0.2 },
      { label: '简化兑子 · 快速定型', desc: '减少复杂度 · 转入可掌握的局面', signal: 0.55 },
    ],
  },
  {
    dim: 'TF',
    signalKey: 'decisionLogic',
    title: '决策 · 牺牲与否',
    notation: '... Bxh7+!?',
    situation: '可弃象攻王 · 子力损失明确但攻势可观 · 你的判断依据？',
    options: [
      { label: '客观评估子力价值', desc: '计算得失比 · 风格稳定不随情绪波动', signal: 0.85 },
      { label: '凭直觉与感觉走', desc: '局势"感觉对"就出手 · 重棋子的情感价值', signal: 0.25 },
      { label: '看对手反应再定', desc: '依对手状态调整 · 风格随势波动', signal: 0.5 },
    ],
  },
  {
    dim: 'JP',
    signalKey: 'endgameDecisiveness',
    title: '残局 · 占优之后',
    notation: '= 1/2 ?',
    situation: '你已占优 · 对手提和 · 一分到手 · 但或许还能赢。',
    options: [
      { label: '接受和棋 · 快速收局', desc: '转弯控制 · 不留变数 · 落袋为安', signal: 0.9 },
      { label: '拒绝和棋 · 继续施压', desc: '开放局 · 扩大胜势 · 追求更大战果', signal: 0.2 },
      { label: '寻找将杀路径 · 追求完胜', desc: '再算几步 · 看能否走到绝杀', signal: 0.6 },
    ],
  },
];

// ═════════════════════════════════════════════════════════
// 页面
// ═════════════════════════════════════════════════════════

type Phase = 'atlas' | 'collecting' | 'report';

export default function ChessPage() {
  const navigate = useNavigate();
  const { manualTimeSlot, setManualTimeSlot, saveVector, vector } = useAppStore();
  const currentSlot = resolveTimeSlot(new Date(), manualTimeSlot);

  const [phase, setPhase] = useState<Phase>('atlas');
  const [step, setStep] = useState(0);
  const [signals, setSignals] = useState<Partial<ChessDecisionSignals>>({});
  const [result, setResult] = useState<{
    temperament: ChessTemperament;
    scores: Record<MbtiDimension, number>;
  } | null>(null);

  // ── 采集：选择某选项 ──
  const handleChoose = (scenario: Scenario, opt: ScenarioOption) => {
    const next = { ...signals, [scenario.signalKey]: opt.signal };
    setSignals(next);

    if (step < SCENARIOS.length - 1) {
      setStep(step + 1);
    } else {
      // 4 步完成 · 推断 temperament + 落库
      const full: ChessDecisionSignals = {
        openingAggression: next.openingAggression ?? 0.5,
        moveIntuition: next.moveIntuition ?? 0.5,
        decisionLogic: next.decisionLogic ?? 0.5,
        endgameDecisiveness: next.endgameDecisiveness ?? 0.5,
      };
      const { temperamentId, scores } = signalsToTemperament(full);
      const temperament = getChessTemperament(temperamentId);
      saveVector(temperament.vector);
      setResult({ temperament, scores });
      setPhase('report');
    }
  };

  const restart = () => {
    setStep(0);
    setSignals({});
    setResult(null);
    setPhase('collecting');
  };

  // ═════════════════════════════════════════════════════════
  // 渲染
  // ═════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen px-6 lg:px-16 py-12 max-w-6xl mx-auto animate-fade-in">
      {/* 标题区 */}
      <header className="mb-10 text-center">
        <div className="text-[11px] tracking-[0.5em] text-amethyst-400/70 uppercase font-mono mb-2">
          MBTI Chess · 棋局人格采集
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-gold-sheen text-shadow-glow-gold tracking-[0.18em]">
          国际象棋局
        </h1>
        <p className="text-sm text-moon-200/60 italic mt-3 max-w-xl mx-auto leading-relaxed">
          走棋即答问 · 每一步都在泄露你的人格。
          <br />
          棋局是人格验证的策略推演场景 · 与调酒双轨互校。
        </p>
        <div className="divider-gold mt-5 w-40" />

        {/* 时段校准 */}
        <div className="mt-5 inline-flex items-center gap-2 text-[11px] tracking-widest">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-breathe"
            style={{ background: currentSlot.auraColor, boxShadow: `0 0 8px ${currentSlot.auraColor}` }}
          />
          <span className="text-moon-200/60">棋局时辰</span>
          <span className="font-display text-gold-sheen">{currentSlot.label}</span>
          <span className="text-amethyst-400/40">·</span>
          <span className="text-moon-200/50 italic">{currentSlot.biologyNote}</span>
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
      </header>

      {/* ── atlas 棋风图谱 ── */}
      {phase === 'atlas' && (
        <>
          {/* ① 四组棋风 */}
          <section className="mb-12">
            <div className="mb-5">
              <div className="text-[10px] tracking-[0.35em] text-amethyst-400/60 uppercase font-mono">
                ① Temperaments · 四组棋风
              </div>
              <h2 className="font-display text-lg text-moon-50/90 tracking-[0.1em] mt-1">
                紫 · 黄 · 蓝 · 绿 · 四种棋风原型
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHESS_TEMPERAMENTS.map((t) => (
                <GlassPanel key={t.id} padding="md" className="relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none rounded-2xl"
                    style={{ background: `radial-gradient(ellipse at 80% 20%, ${t.color}55, transparent 60%)` }}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center font-display text-lg shrink-0"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${t.secondaryColor}, ${t.color})`,
                          boxShadow: `0 0 16px ${t.color}66`,
                          color: '#fff',
                          textShadow: '0 1px 3px rgba(7,4,20,0.6)',
                        }}
                      >
                        {t.symbol}
                      </span>
                      <div>
                        <div className="text-[10px] tracking-widest text-amethyst-400/60">
                          {t.name} · {t.mbtiMembers.join('/')}
                        </div>
                        <div className="font-display text-gold-sheen">{t.chessArchetype}</div>
                      </div>
                    </div>
                    <div className="text-xs text-moon-200/70 italic mb-3">{t.chessStyle}</div>
                    <div className="space-y-1 text-[11px] text-moon-200/60">
                      <div><span className="text-amethyst-300/50">开局</span> · {t.openingStrategy}</div>
                      <div><span className="text-amethyst-300/50">中局</span> · {t.midgameTendency}</div>
                      <div><span className="text-amethyst-300/50">残局</span> · {t.endgameStyle}</div>
                    </div>
                    <div className="mt-3 text-[10px] text-moon-200/40 italic border-t border-amethyst-500/10 pt-2">
                      {t.poem}
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </section>

          {/* ② MBTI 映射 */}
          <section className="mb-12">
            <div className="mb-5">
              <div className="text-[10px] tracking-[0.35em] text-amethyst-400/60 uppercase font-mono">
                ② Mapping · MBTI ↔ 棋局
              </div>
              <h2 className="font-display text-lg text-moon-50/90 tracking-[0.1em] mt-1">
                四维度如何映射到棋局行为
              </h2>
            </div>
            <GlassPanel padding="lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {MBTI_CHESS_MAPPING.map((m) => (
                  <div key={m.dim} className="border-l-2 border-gold-400/30 pl-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-display text-gold-sheen text-sm">{m.dim}</span>
                      <span className="text-[10px] text-amethyst-400/60 tracking-widest">{m.mbtiMeaning}</span>
                    </div>
                    <div className="text-xs text-moon-200/60 mb-2">{m.observableMetric}</div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-gold-400/80">{m.poleA.pole} · {m.poleA.label}</span>
                      <span className="text-amethyst-400/30">↔</span>
                      <span className="text-amethyst-300/70">{m.poleB.pole} · {m.poleB.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </section>

          {/* ③ 双轨对应 */}
          <section className="mb-12">
            <div className="mb-5">
              <div className="text-[10px] tracking-[0.35em] text-amethyst-400/60 uppercase font-mono">
                ③ Dual Track · 双轨互校
              </div>
              <h2 className="font-display text-lg text-moon-50/90 tracking-[0.1em] mt-1">
                棋局与调酒 · 同一人格的两条采集路径
              </h2>
            </div>
            <GlassPanel padding="lg">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="text-[10px] tracking-widest text-amethyst-400/60 uppercase">维度</div>
                <div className="text-[10px] tracking-widest text-gold-400/70 uppercase">棋局侧</div>
                <div className="text-[10px] tracking-widest text-amethyst-300/60 uppercase">调酒侧</div>
                {CHESS_COCKTAIL_PARALLEL.map((p) => (
                  <div key={p.aspect} className="contents">
                    <div className="text-moon-200/50 py-2 border-t border-amethyst-500/10">{p.aspect}</div>
                    <div className="text-moon-200/70 py-2 border-t border-amethyst-500/10">{p.chessSide}</div>
                    <div className="text-moon-200/70 py-2 border-t border-amethyst-500/10">{p.cocktailSide}</div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </section>

          {/* 开始采集 CTA */}
          <section className="text-center py-8">
            {vector ? (
              <div className="mb-6 text-[11px] tracking-[0.3em] text-amethyst-400/60">
                已有棋风向量为 {Object.entries(vector).slice(0, 3).map(([k, v]) => `${DIM_LABEL[k as keyof PersonaVector]}${(v as number).toFixed(2)}`).join(' · ')}... · 重新采集将覆盖
              </div>
            ) : null}
            <GradientButton variant="gold" size="lg" onClick={() => setPhase('collecting')}>
              开始棋风采集 →
            </GradientButton>
            <div className="mt-6 font-display text-moon-200/40 text-sm italic max-w-md mx-auto leading-relaxed">
              「棋盘是夜的另一面镜子 · 照见调酒照不见的那部分你。」
            </div>
          </section>
        </>
      )}

      {/* ── collecting 采集流程 ── */}
      {phase === 'collecting' && (
        <section className="max-w-2xl mx-auto">
          {/* 进度条 */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {SCENARIOS.map((s, i) => (
              <div key={s.dim} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono tracking-wider transition-all duration-300 ${
                    i < step
                      ? 'bg-gold-400/20 text-gold-400 border border-gold-400/40'
                      : i === step
                        ? 'bg-amethyst-500/30 text-gold-sheen border border-gold-400/60 shadow-glow-gold'
                        : 'bg-amethyst-500/10 text-amethyst-400/40 border border-amethyst-500/15'
                  }`}
                >
                  {i < step ? '✓' : s.dim}
                </div>
                {i < SCENARIOS.length - 1 && (
                  <div className={`w-8 h-px ${i < step ? 'bg-gold-400/40' : 'bg-amethyst-500/15'}`} />
                )}
              </div>
            ))}
          </div>

          {/* 当前场景 */}
          {SCENARIOS[step] && (
            <ScenarioCard
              scenario={SCENARIOS[step]}
              onChoose={(opt) => handleChoose(SCENARIOS[step], opt)}
            />
          )}

          {/* 返回图谱 */}
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => setPhase('atlas')}
              className="text-[11px] tracking-[0.3em] text-amethyst-400/50 hover:text-gold-400 transition-colors"
            >
              ← 返回棋风图谱
            </button>
          </div>
        </section>
      )}

      {/* ── report 棋风人格报告 ── */}
      {phase === 'report' && result && (
        <ReportView
          result={result}
          onRestart={restart}
          onGoCocktail={() => navigate('/cocktail')}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 场景卡片
// ═════════════════════════════════════════════════════════

function ScenarioCard({
  scenario,
  onChoose,
}: {
  scenario: Scenario;
  onChoose: (opt: ScenarioOption) => void;
}) {
  return (
    <GlassPanel gold padding="lg" className="animate-slide-up">
      {/* 场景头 */}
      <div className="text-center mb-6">
        <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase font-mono mb-2">
          {scenario.title}
        </div>
        <div className="font-display text-2xl text-gold-sheen tracking-[0.15em] mb-3">
          {scenario.notation}
        </div>
        <p className="text-sm text-moon-200/65 italic leading-relaxed max-w-md mx-auto">
          {scenario.situation}
        </p>
      </div>

      <div className="divider-gold mb-6 opacity-50" />

      {/* 选项 */}
      <div className="flex flex-col gap-3">
        {scenario.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChoose(opt)}
            className="group text-left p-4 rounded-xl border border-amethyst-500/20 hover:border-gold-400/50 bg-amethyst-500/5 hover:bg-gold-400/5 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-amethyst-500/30 group-hover:bg-gold-400/30 flex items-center justify-center text-[11px] font-mono text-moon-200/70 group-hover:text-gold-sheen shrink-0 mt-0.5 transition-colors">
                {String.fromCharCode(65 + i)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm text-moon-50/90 group-hover:text-gold-sheen transition-colors">
                  {opt.label}
                </div>
                <div className="text-[11px] text-moon-200/50 mt-1 leading-relaxed">
                  {opt.desc}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}

// ═════════════════════════════════════════════════════════
// 报告视图
// ═════════════════════════════════════════════════════════

function ReportView({
  result,
  onRestart,
  onGoCocktail,
}: {
  result: { temperament: ChessTemperament; scores: Record<MbtiDimension, number> };
  onRestart: () => void;
  onGoCocktail: () => void;
}) {
  const { temperament, scores } = result;
  const DIM_LABEL_MAP: Record<MbtiDimension, string> = {
    EI: '能量方向',
    NS: '信息获取',
    TF: '决策方式',
    JP: '生活方式',
  };

  return (
    <section className="max-w-2xl mx-auto animate-slide-up">
      {/* 棋风人格揭晓 */}
      <div className="text-center mb-8">
        <div className="text-[10px] tracking-[0.5em] text-amethyst-400/60 uppercase font-mono mb-3">
          Your Chess Persona
        </div>
        <div className="inline-flex items-center gap-4">
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center font-display text-2xl shrink-0 animate-breathe"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${temperament.secondaryColor}, ${temperament.color})`,
              boxShadow: `0 0 32px ${temperament.color}66`,
              color: '#fff',
              textShadow: '0 1px 4px rgba(7,4,20,0.7)',
            }}
          >
            {temperament.symbol}
          </span>
          <div className="text-left">
            <div className="text-[10px] tracking-widest text-amethyst-400/60">{temperament.name}</div>
            <div className="font-display text-3xl text-gold-sheen text-shadow-glow-gold tracking-[0.1em]">
              {temperament.chessArchetype}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-moon-200/60 italic max-w-md mx-auto leading-relaxed">
          {temperament.chessStyle}
        </p>
        <div className="mt-3 text-[11px] text-moon-200/40 italic">{temperament.poem}</div>
      </div>

      {/* 四维度倾向 */}
      <GlassPanel padding="lg" className="mb-6">
        <div className="text-[10px] tracking-[0.35em] text-amethyst-400/60 uppercase font-mono mb-4">
          四维度倾向
        </div>
        <div className="flex flex-col gap-4">
          {MBTI_CHESS_MAPPING.map((m) => {
            const score = scores[m.dim];
            const poleALabel = m.poleA.pole;
            const poleBLabel = m.poleB.pole;
            return (
              <div key={m.dim}>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-gold-400/80">{poleALabel} · {m.poleA.label}</span>
                  <span className="text-amethyst-400/50 font-mono">{DIM_LABEL_MAP[m.dim]}</span>
                  <span className="text-amethyst-300/70">{m.poleB.label} · {poleBLabel}</span>
                </div>
                <div className="relative h-2 rounded-full bg-amethyst-500/15 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-400/70 to-amethyst-400/70 transition-all duration-700"
                    style={{ width: `${score * 100}%` }}
                  />
                  {/* 中点标记 */}
                  <div className="absolute inset-y-0 left-1/2 w-px bg-moon-200/30" />
                </div>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* 六维向量 */}
      <GlassPanel padding="lg" className="mb-6">
        <div className="text-[10px] tracking-[0.35em] text-amethyst-400/60 uppercase font-mono mb-4">
          六维棋风向量 · 已落库
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.keys(temperament.vector) as (keyof PersonaVector)[]).map((dim) => {
            const v = temperament.vector[dim];
            return (
              <div key={dim} className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest text-amethyst-400/60 font-mono w-8">
                  {dim}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-amethyst-500/15 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${v * 100}%`,
                      background: `linear-gradient(to right, ${temperament.color}, ${temperament.secondaryColor})`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-gold-sheen w-8 text-right">
                  {v.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* 出口 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <GradientButton variant="gold" size="lg" onClick={onGoCocktail}>
          融入调酒 →
        </GradientButton>
        <button
          type="button"
          onClick={onRestart}
          className="text-[11px] tracking-[0.3em] text-amethyst-400/60 hover:text-gold-400 transition-colors py-2 px-4"
        >
          ↺ 重新采集
        </button>
      </div>
    </section>
  );
}
