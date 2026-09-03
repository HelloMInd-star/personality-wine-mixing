/**
 * SandboxPage · 单人酒局沙盘
 *
 * 五轮场景选择 → MBTI 概率推导 → 六维向量桥接
 * 独立采集入口，与 MbtiPartyPage（多人酒局）互为补充
 *
 * 流程：选场景 → 五轮选择 → 人格图谱
 */

import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/ui/GlassPanel';
import { useAppStore } from '../store/appStore';
import { logger } from '../engine/logger';
import {
  getRandomCharacters,
  getRoundConfig,
  getTotalRounds,
  calculatePersonality,
  sandboxToVector,
  sandboxToPersonaTag,
  getJudgeComments,
} from '../engine/sandboxEngine';
import {
  SANDBOX_SCENARIOS,
  DIM_PAIR_LABELS,
} from '../data/sandboxData';
import type {
  SandboxScenario,
  SandboxCharacter,
  RoundWithOptions,
  RoundChoice,
  SandboxResult,
  SandboxPhase,
  SandboxJudgeComment,
} from '../types/sandbox';
import type { PersonaVector } from '../types/personaFusion';
import { DIM_LABEL } from '../types/personaFusion';

// ═════════════════════════════════════════════════════════
// 页面组件
// ═════════════════════════════════════════════════════════

export default function SandboxPage() {
  const { saveVector } = useAppStore();

  // 状态
  const [phase, setPhase] = useState<SandboxPhase>('selecting-scene');
  const [scenario, setScenario] = useState<SandboxScenario | null>(null);
  const [characters, setCharacters] = useState<SandboxCharacter[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [choices, setChoices] = useState<RoundChoice[]>([]);
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [judgeComments, setJudgeComments] = useState<SandboxJudgeComment[]>([]);

  const totalRounds = getTotalRounds();

  // ── 选择场景 ──
  const handleSelectScene = useCallback((s: SandboxScenario) => {
    logger.info('Sandbox:selectScene', { scene: s.id });
    setScenario(s);
    setCharacters(getRandomCharacters());
    setPhase('in-rounds');
    setCurrentRound(1);
    setChoices([]);
  }, []);

  // ── 选择选项 ──
  const handleSelectOption = useCallback(
    (optionKey: string) => {
      const newChoice: RoundChoice = { round: currentRound, optionKey };
      const newChoices = [...choices, newChoice];
      setChoices(newChoices);

      logger.info('Sandbox:selectOption', {
        round: currentRound,
        option: optionKey,
        total: newChoices.length,
      });

      if (currentRound >= totalRounds) {
        // 最后一轮 → 计算结果
        const calcResult = calculatePersonality(newChoices);
        setResult(calcResult);
        setJudgeComments(getJudgeComments());

        // 桥接 → 觉醉 六维向量
        const vector = sandboxToVector(calcResult);
        saveVector(vector);

        logger.info('Sandbox:result', {
          mbti: calcResult.mbtiType,
          topProb: calcResult.probabilities[0],
          tag: sandboxToPersonaTag(calcResult),
        });

        setPhase('result');
      } else {
        setCurrentRound((r) => r + 1);
      }
    },
    [currentRound, choices, totalRounds, saveVector],
  );

  // ── 重置 ──
  const handleReset = useCallback(() => {
    setPhase('selecting-scene');
    setScenario(null);
    setCharacters([]);
    setCurrentRound(1);
    setChoices([]);
    setResult(null);
    setJudgeComments([]);
  }, []);

  // ── 当前轮数据 ──
  const roundData = useMemo<RoundWithOptions | null>(
    () => getRoundConfig(currentRound),
    [currentRound],
  );

  // ── 六维向量（仅结果阶段） ──
  const personaVector = useMemo<PersonaVector | null>(
    () => (result ? sandboxToVector(result) : null),
    [result],
  );

  // ═════════════════════════════════════════════════════════
  // 渲染
  // ═════════════════════════════════════════════════════════

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl text-gold-sheen mb-2">
          单人酒局 · 沙盘
        </h1>
        <p className="text-amethyst-400/60 text-sm tracking-wider">
          在五个场景中做出选择，让系统推导你的社交人格
        </p>
      </div>

      {/* ══════ 阶段一：选场景 ══════ */}
      {phase === 'selecting-scene' && (
        <div className="max-w-4xl">
          <p className="text-moon-200/70 mb-6 text-sm">
            选择一个场景，你将在其中面对五轮社交选择。每个选择都会影响你的人格画像。
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SANDBOX_SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectScene(s)}
                className="glass rounded-xl p-5 text-left transition-all duration-300 hover:border-gold-400/40 hover:shadow-glow-amethyst group"
              >
                <div className="text-lg font-display text-gold-sheen mb-2 group-hover:text-gold-400 transition-colors">
                  {s.title}
                </div>
                <div className="text-sm text-moon-200/60 mb-2 leading-relaxed">
                  {s.desc}
                </div>
                <div className="text-[10px] text-amethyst-400/40 tracking-wider">
                  {s.background}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════ 阶段二：五轮选择 ══════ */}
      {phase === 'in-rounds' && scenario && roundData && (
        <div className="max-w-4xl">
          {/* 进度条 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amethyst-400/60 tracking-wider">
                第 {currentRound} / {totalRounds} 轮
              </span>
              <span className="text-xs text-amethyst-400/40">
                {roundData.round.dimensionLabel}
              </span>
            </div>
            <div className="h-1 bg-amethyst-500/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-400/60 to-gold-400/90 rounded-full transition-all duration-500"
                style={{ width: `${(currentRound / totalRounds) * 100}%` }}
              />
            </div>
          </div>

          {/* 场景信息 */}
          <div className="glass rounded-xl p-4 mb-6 border-l-2 border-gold-400/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-amethyst-400/60 tracking-wider">
                {scenario.title}
              </span>
              <span className="text-[10px] text-moon-200/30">·</span>
              <span className="text-[10px] text-moon-200/30">
                {scenario.background}
              </span>
            </div>
          </div>

          {/* 角色卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {characters.map((ch) => (
              <div
                key={ch.mbti}
                className="glass rounded-lg p-3 text-center"
                style={{ borderColor: `${ch.color}20` }}
              >
                <div
                  className="text-lg font-display mb-1"
                  style={{ color: ch.color }}
                >
                  {ch.name}
                </div>
                <div className="text-[10px] text-moon-200/40 mb-1">
                  {ch.role}
                </div>
                <div className="text-[10px] text-amethyst-400/30 tracking-wider">
                  {ch.mbti}
                </div>
              </div>
            ))}
          </div>

          {/* 当前轮问题 */}
          <GlassPanel gold padding="lg">
            <div className="mb-1 text-xs text-amethyst-400/60 tracking-wider uppercase">
              {roundData.round.title}
            </div>
            <h2 className="font-display text-xl text-gold-sheen mb-2">
              {roundData.round.question}
            </h2>
            <p className="text-sm text-moon-200/60 mb-6">
              {roundData.round.desc}
            </p>

            {/* 选项 */}
            <div className="space-y-3">
              {roundData.options.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSelectOption(opt.key)}
                  className="w-full glass rounded-lg p-4 text-left transition-all duration-300 hover:border-gold-400/30 hover:bg-amethyst-500/5 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full border border-gold-400/30 flex items-center justify-center text-xs text-gold-400/70 font-display shrink-0 group-hover:border-gold-400/60 group-hover:text-gold-400 transition-colors">
                      {opt.key.toUpperCase()}
                    </span>
                    <span className="text-sm text-moon-200/80 group-hover:text-moon-100 transition-colors">
                      {opt.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* ══════ 阶段三：结果 ══════ */}
      {phase === 'result' && result && personaVector && (
        <div className="max-w-4xl space-y-8">
          {/* 标题 */}
          <div className="text-center">
            <div className="text-xs text-amethyst-400/60 tracking-[0.3em] uppercase mb-2">
              人格图谱生成完毕
            </div>
            <h2 className="font-display text-3xl text-gold-sheen mb-2">
              {result.mbtiType}
            </h2>
            <p className="text-sm text-moon-200/50">
              {sandboxToPersonaTag(result)}
            </p>
          </div>

          {/* 四维度条形图 */}
          <GlassPanel gold padding="lg">
            <div className="text-xs text-amethyst-400/60 tracking-wider uppercase mb-4">
              四维度明细
            </div>
            <div className="space-y-4">
              {(['E/I', 'S/N', 'T/F', 'J/P'] as const).map((dim) => {
                const d = result.dimensions[dim];
                const [labelA, labelB] = DIM_PAIR_LABELS[dim];
                return (
                  <div key={dim}>
                    <div className="flex justify-between text-xs text-moon-200/50 mb-1">
                      <span className={d.dominant === 'A' ? 'text-gold-sheen' : ''}>
                        {labelA} {d.percentA}%
                      </span>
                      <span className="text-amethyst-400/30">{dim}</span>
                      <span className={d.dominant === 'B' ? 'text-gold-sheen' : ''}>
                        {d.percentB}% {labelB}
                      </span>
                    </div>
                    <div className="h-2 bg-amethyst-500/10 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-gold-400/60 to-gold-400/90 rounded-l-full transition-all duration-700"
                        style={{ width: `${d.percentA}%` }}
                      />
                      <div
                        className="h-full bg-gradient-to-l from-amethyst-400/40 to-amethyst-400/60 rounded-r-full transition-all duration-700"
                        style={{ width: `${d.percentB}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>

          {/* 16 型概率分布 */}
          <GlassPanel gold padding="lg">
            <div className="text-xs text-amethyst-400/60 tracking-wider uppercase mb-4">
              16 型匹配度
            </div>
            <div className="space-y-2">
              {result.probabilities.slice(0, 8).map((p) => (
                <div key={p.type} className="flex items-center gap-3">
                  <span className={`w-12 text-xs font-mono shrink-0 ${p.type === result.mbtiType ? 'text-gold-sheen font-bold' : 'text-moon-200/40'}`}>
                    {p.type}
                  </span>
                  <div className="flex-1 h-3 bg-amethyst-500/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        p.type === result.mbtiType
                          ? 'bg-gradient-to-r from-gold-400/70 to-gold-400'
                          : 'bg-gradient-to-r from-amethyst-400/30 to-amethyst-400/50'
                      }`}
                      style={{ width: `${p.probability}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-moon-200/30 font-mono">
                    {p.probability}%
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* 六维向量桥接 */}
          <GlassPanel gold padding="lg">
            <div className="text-xs text-amethyst-400/60 tracking-wider uppercase mb-4">
              桥接 · 六维人格向量
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {(Object.entries(personaVector) as [string, number][]).map(([dim, val]) => (
                <div key={dim} className="text-center">
                  <div className="text-[10px] text-amethyst-400/40 mb-1">
                    {DIM_LABEL[dim as keyof typeof DIM_LABEL] || dim}
                  </div>
                  <div className="text-sm font-mono text-gold-sheen">
                    {val.toFixed(2)}
                  </div>
                  <div className="mt-1 h-1 bg-amethyst-500/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold-400/60 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.abs(val) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* 调酒师评语 */}
          <GlassPanel gold padding="lg">
            <div className="text-xs text-amethyst-400/60 tracking-wider uppercase mb-4">
              调酒师评语
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {judgeComments.map((judge) => (
                <div
                  key={judge.key}
                  className="glass rounded-lg p-4"
                  style={{ borderColor: `${judge.color}20` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{judge.icon}</span>
                    <div>
                      <div className="text-sm text-gold-sheen font-display">
                        {judge.name}
                      </div>
                      <div className="text-[10px] text-amethyst-400/40">
                        {judge.personality}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-moon-200/60 leading-relaxed italic">
                    "{judge.comment}"
                  </p>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* 底部操作 */}
          <div className="flex gap-4 justify-center pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="glass rounded-lg px-6 py-2.5 text-sm text-moon-200/60 hover:text-gold-sheen hover:border-gold-400/40 transition-all duration-300"
            >
              再来一次
            </button>
            <Link
              to="/cocktail"
              className="glass rounded-lg px-6 py-2.5 text-sm text-gold-sheen hover:text-gold-400 border border-gold-400/30 hover:border-gold-400/60 transition-all duration-300"
            >
              用这个画像去调酒 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}