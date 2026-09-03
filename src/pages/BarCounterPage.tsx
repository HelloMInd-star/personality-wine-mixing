/**
 * BarCounterPage · 可编程吧台 · 单杯级硬件联动
 *
 * 三层可编程空间的第三层：单杯硬件联动
 *   - 杯底光效 × 杯垫气味 × 杯垫状态机
 *   - 由「向量 × 阶段」派生单杯状态（复用 lightEngine / scentEngine）
 *   - MVP 阶段先打通数据契约与可视化，硬件协议层后续填充
 *
 * 数据契约：
 *   vector 优先（牌类入口）→ profile 回退（测评入口）→ 无则提示采集
 *   单杯状态 = lightEffect + scentProfile + coaster（占位）
 *
 * 视觉语言：背景用 lightEffect.baseColor 渲染单杯氛围光
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useJourney } from '../hooks/useJourney';
import { useCoasterDriver } from '../hooks/useCoasterDriver';
import { useGameTheory } from '../hooks/useGameTheory';
import GlassPanel from '../components/ui/GlassPanel';
import GradientButton from '../components/ui/GradientButton';
import LightCanvas from '../components/brew/light/LightCanvas';
import ScentCard from '../components/brew/scent/ScentCard';
import RolePersonaPicker from '../components/cocktail/RolePersonaPicker';
import NashConvergenceChart from '../components/cocktail/NashConvergenceChart';
import { DIM_LABEL, type PersonaDim } from '../types/personaFusion';
import type { CoasterState } from '../types/tavern';

/** 杯垫模式标签 */
const COASTER_MODE_LABEL: Record<CoasterState['mode'], string> = {
  'in-house': '在馆',
  takeaway: '带走',
  souvenir: '纪念',
};

/** 光效模式中文标签 */
const PATTERN_LABEL: Record<string, string> = {
  breath: '呼吸',
  flow: '流动',
  pulse: '脉动',
  aurora: '极光',
};

/** 扩散模式中文标签 */
const DIFFUSION_LABEL: Record<string, string> = {
  breath: '呼吸式',
  spread: '加速铺开',
  burst: '爆发释放',
  fade: '缓慢淡出',
};

export default function BarCounterPage() {
  const navigate = useNavigate();
  const { profile, vector } = useAppStore();
  const { journeyState, lightEffect, scentProfile } = useJourney();
  const { result: gameTheoryResult, convergenceTrace, input: gameTheoryInput } = useGameTheory();

  // 数据源 · 向量优先 · 无则提示采集
  const hasDataSource = !!(vector || profile);
  const dataSourceLabel = vector
    ? '六维向量'
    : profile
      ? `画像 · ${profile.archetype.name}`
      : '无';

  // 硬件模式 · 自动（派生）vs 手动（直接观察物理响应曲线）
  const [hwMode, setHwMode] = useState<'auto' | 'manual'>('auto');
  // 手动模式控制 · 直接驱动风扇/加热 · 观察物理响应曲线
  const [manualFan, setManualFan] = useState(0.5);
  const [manualHeating, setManualHeating] = useState(false);

  // 硬件协议输入 ·
  //   自动模式：气味强度 → 风扇目标 · 高潮阶段 → 加热
  //   手动模式：用户直接控制 · 便于观察物理响应曲线
  const fanTarget = hwMode === 'auto' ? scentProfile.intensity : manualFan;
  const heatingOn = hwMode === 'auto' ? journeyState.phase === 'climax' : manualHeating;
  const { telemetry } = useCoasterDriver(fanTarget, heatingOn);

  // 杯垫状态机 · 硬件协议遥测驱动 · 实际值由物理模型推进
  const coaster: CoasterState = {
    coasterId: 'YM-001',
    activeScent: scentProfile.signatureNote,
    fanSpeed: telemetry ? telemetry.fanSpeed : 0,
    heating: telemetry ? telemetry.heating : false,
    mode: 'in-house',
  };

  return (
    <div
      className="min-h-screen px-6 lg:px-16 py-12 animate-fade-in relative transition-all duration-700"
      style={{
        backgroundImage: `radial-gradient(ellipse at top, ${lightEffect.baseColor}33, transparent 70%)`,
      }}
    >
      {/* —— Hero —— */}
      <section className="flex flex-col items-center text-center pt-4 pb-10">
        <div className="text-[11px] tracking-[0.6em] text-amethyst-400/80 uppercase mb-4">
          Bar Counter · 吧台
        </div>
        <h1 className="font-display text-5xl lg:text-6xl text-gold-sheen text-shadow-glow-gold leading-tight">
          吧台 · 一杯一世界
        </h1>
        <p className="mt-5 text-moon-200/70 max-w-xl leading-relaxed font-display">
          单杯硬件联动 · 杯垫 × 光效 × 气味
          <br />
          一杯一世界 · 由向量 × 阶段即时编排。
        </p>
      </section>

      <div className="divider-gold max-w-2xl mx-auto mb-10" />

      {/* —— 角色身份选择 · 进吧台先亮身份 —— */}
      <section className="max-w-4xl mx-auto">
        <RolePersonaPicker />
      </section>

      {/* —— 数据源状态 —— */}
      <section className="max-w-4xl mx-auto mb-8">
        <GlassPanel padding="md" gold={hasDataSource}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full animate-breathe"
                style={{
                  background: hasDataSource ? '#f0c674' : '#6b5b95',
                  boxShadow: `0 0 12px ${hasDataSource ? '#f0c67488' : '#6b5b9588'}`,
                }}
              />
              <div>
                <div className="text-[10px] tracking-[0.3em] text-amethyst-400/60 uppercase">
                  Data Source
                </div>
                <div className={`font-display text-base ${hasDataSource ? 'text-gold-sheen' : 'text-moon-200/60'}`}>
                  {dataSourceLabel}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {vector && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-moon-200/60">
                  {(Object.keys(DIM_LABEL) as PersonaDim[]).map((dim) => (
                    <span key={dim} className="flex items-center gap-1">
                      <span className="text-amethyst-400/70">{DIM_LABEL[dim]}</span>
                      <span className="text-moon-50/80">
                        {vector[dim] >= 0 ? '+' : ''}
                        {vector[dim].toFixed(2)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
              {!hasDataSource && (
                <GradientButton variant="ghost" size="sm" onClick={() => navigate('/cards')}>
                  前往采集
                </GradientButton>
              )}
            </div>
          </div>
        </GlassPanel>
      </section>

      {/* —— 单杯编排 · 光效 × 气味 —— */}
      {hasDataSource ? (
        <section className="max-w-5xl mx-auto mb-12">
          <div className="text-center mb-6">
            <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-2">
              Single Glass · 单杯编排
            </div>
            <h2 className="font-display text-2xl text-moon-50">单杯光效 × 气味</h2>
            <p className="text-moon-200/50 text-sm mt-2">
              由「{vector ? '向量' : '画像'} × {journeyState.meta.label}」即时派生
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 杯底光效 · LightCanvas */}
            <GlassPanel gold padding="lg">
              <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase mb-4">
                Light Effect · 杯底光效
              </div>
              <div className="flex flex-col items-center">
                <LightCanvas effect={lightEffect} size={220} />
              </div>
              {/* 光效参数详情 */}
              <div className="mt-6 space-y-2.5 text-xs">
                <ParamRow label="主色" value={lightEffect.baseColor} swatch={lightEffect.baseColor} />
                <ParamRow label="强调色" value={lightEffect.accentColor} swatch={lightEffect.accentColor} />
                <ParamRow
                  label="强度"
                  value={`${Math.round(lightEffect.intensity * 100)}%`}
                  bar={lightEffect.intensity}
                  barColor={lightEffect.baseColor}
                />
                <ParamRow
                  label="速度"
                  value={`${Math.round(lightEffect.speed * 100)}%`}
                  bar={lightEffect.speed}
                  barColor={lightEffect.accentColor}
                />
                <ParamRow label="模式" value={PATTERN_LABEL[lightEffect.pattern] ?? lightEffect.pattern} />
                <ParamRow
                  label="粒子密度"
                  value={`${Math.round(lightEffect.particleDensity * 100)}%`}
                  bar={lightEffect.particleDensity}
                  barColor={lightEffect.accentColor}
                />
              </div>
            </GlassPanel>

            {/* 杯垫气味 · ScentCard */}
            <GlassPanel gold padding="lg">
              <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase mb-4">
                Scent Profile · 杯垫气味
              </div>
              <ScentCard scent={scentProfile} phaseColor={journeyState.meta.color} />
              {/* 气味参数详情 */}
              <div className="mt-6 space-y-2.5 text-xs">
                <ParamRow label="主调" value={scentProfile.primaryLabel} />
                <ParamRow label="签名" value={scentProfile.signatureLabel} />
                <ParamRow
                  label="释放强度"
                  value={`${Math.round(scentProfile.intensity * 100)}%`}
                  bar={scentProfile.intensity}
                  barColor={journeyState.meta.color}
                />
                <ParamRow label="扩散模式" value={DIFFUSION_LABEL[scentProfile.diffusion] ?? scentProfile.diffusion} />
                <div className="pt-2 mt-2 border-t border-amethyst-500/15">
                  <div className="text-[10px] text-moon-200/40 italic leading-relaxed">
                    「{scentProfile.poem}」
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        </section>
      ) : (
        <section className="max-w-3xl mx-auto mb-12">
          <GlassPanel padding="lg">
            <div className="text-center py-8">
              <div className="font-display text-xl text-moon-200/60 mb-3">
                单杯编排需先入镜
              </div>
              <p className="text-xs text-moon-200/50 leading-relaxed max-w-md mx-auto mb-6">
                吧台层的光效与气味由向量 × 阶段派生。
                请先通过牌类采镜或镜中自观，织就你的六维向量。
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <GradientButton variant="gold" size="md" onClick={() => navigate('/cards')}>
                  牌类采镜
                </GradientButton>
                <GradientButton variant="ghost" size="md" onClick={() => navigate('/personality')}>
                  镜中自观
                </GradientButton>
              </div>
            </div>
          </GlassPanel>
        </section>
      )}

      {/* —— 纳什均衡收敛分析 · 博弈论可视化 —— */}
      {hasDataSource && gameTheoryResult && (
        <section className="max-w-4xl mx-auto mb-12">
          <GlassPanel gold padding="lg">
            <NashConvergenceChart
              trace={convergenceTrace}
              result={gameTheoryResult}
              input={gameTheoryInput}
            />
          </GlassPanel>
        </section>
      )}

      {/* —— 杯垫硬件协议 · 实时遥测 —— */}
      {hasDataSource && (
        <section className="max-w-4xl mx-auto mb-12">
          <div className="text-center mb-6">
            <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-2">
              Coaster Hardware · 杯垫硬件协议
            </div>
            <h2 className="font-display text-2xl text-moon-50">硬件实时响应</h2>
            <p className="text-moon-200/50 text-sm mt-2">
              风扇惯性 · 加热热容 · 模拟实体硬件物理响应
            </p>
          </div>

          <GlassPanel gold padding="lg">
            {/* 模式切换器 · 自动（派生）vs 手动（直接观察物理响应） */}
            <div className="mb-6 pb-5 border-b border-amethyst-500/15">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-[10px] tracking-widest text-amethyst-400/60 mb-1">
                    Hardware Mode · 硬件模式
                  </div>
                  <div className="text-xs text-moon-200/55 italic">
                    {hwMode === 'auto'
                      ? '风扇/加热由气味强度与阶段自动派生'
                      : '手动直接控制 · 直观验证物理响应曲线'}
                  </div>
                </div>
                <div className="flex gap-1 p-1 rounded-lg bg-void-700/50 border border-amethyst-500/20">
                  <button
                    type="button"
                    onClick={() => setHwMode('auto')}
                    className={`px-4 py-1.5 rounded-md text-xs tracking-[0.15em] transition-all duration-300 ${
                      hwMode === 'auto'
                        ? 'bg-amethyst-500/30 text-gold-sheen shadow-glow-gold'
                        : 'text-moon-200/55 hover:text-moon-200/85'
                    }`}
                  >
                    自动
                  </button>
                  <button
                    type="button"
                    onClick={() => setHwMode('manual')}
                    className={`px-4 py-1.5 rounded-md text-xs tracking-[0.15em] transition-all duration-300 ${
                      hwMode === 'manual'
                        ? 'bg-amethyst-500/30 text-gold-sheen shadow-glow-gold'
                        : 'text-moon-200/55 hover:text-moon-200/85'
                    }`}
                  >
                    手动
                  </button>
                </div>
              </div>

              {/* 手动模式 · 直接控制面板 */}
              {hwMode === 'manual' && (
                <div className="mt-5 grid md:grid-cols-2 gap-5 animate-fade-in">
                  {/* 风扇目标滑块 */}
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] tracking-widest text-amethyst-400/70">
                        Fan Target · 风扇目标
                      </div>
                      <div className="font-mono text-sm text-gold-sheen">
                        {Math.round(manualFan * 100)}%
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(manualFan * 100)}
                      onChange={(e) => setManualFan(Number(e.target.value) / 100)}
                      className="w-full accent-amethyst-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-moon-200/40 mt-1 font-mono">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* 加热开关 + 快速脉冲 */}
                  <div className="glass rounded-xl p-4">
                    <div className="text-[10px] tracking-widest text-amethyst-400/70 mb-3">
                      Heating · 加热元件
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setManualHeating((v) => !v)}
                        className={`flex-1 py-2 rounded-lg text-sm tracking-[0.15em] transition-all duration-300 border ${
                          manualHeating
                            ? 'border-[#e06552]/60 text-[#e06552] bg-[#e06552]/10 shadow-[0_0_16px_#e0655244]'
                            : 'border-amethyst-500/25 text-moon-200/55 hover:border-amethyst-400/50'
                        }`}
                      >
                        {manualHeating ? '◉ 加热中' : '○ 已关闭'}
                      </button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setManualFan(1);
                          setManualHeating(true);
                        }}
                        className="flex-1 py-1.5 rounded-md text-[10px] tracking-widest text-moon-200/60 border border-amethyst-500/25 hover:text-gold-400 hover:border-gold-400/40 transition-all duration-300"
                      >
                        满载脉冲
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManualFan(0);
                          setManualHeating(false);
                        }}
                        className="flex-1 py-1.5 rounded-md text-[10px] tracking-widest text-moon-200/60 border border-amethyst-500/25 hover:text-gold-400 hover:border-gold-400/40 transition-all duration-300"
                      >
                        归零冷却
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 实时遥测四宫格 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <CoasterParam label="杯垫编号" value={coaster.coasterId} />
              <CoasterParam label="当前气味" value={coaster.activeScent} />
              <CoasterParam
                label="风扇转速"
                value={telemetry ? `${Math.round(telemetry.fanSpeed * 100)}%` : '—'}
                bar={telemetry?.fanSpeed}
              />
              <CoasterParam
                label="加热温度"
                value={telemetry ? `${telemetry.temperature.toFixed(1)}℃` : '—'}
                dot={telemetry?.heating ? '#e06552' : '#5d44a0'}
              />
            </div>

            {/* 响应曲线 · 目标 vs 实际 */}
            {telemetry && (
              <div className="space-y-5 pt-5 border-t border-amethyst-500/15">
                <ResponseCurve
                  label="风扇转速 · PWM 惯性"
                  target={telemetry.fanTarget}
                  actual={telemetry.fanSpeed}
                  color="#9b7bd4"
                  targetLabel="目标转速"
                  actualLabel="实际转速"
                />
                <ResponseCurve
                  label="加热温度 · 热容模型"
                  target={telemetry.heating ? 1 : 0}
                  actual={(telemetry.temperature - 22) / (55 - 22)}
                  color="#e06552"
                  targetLabel={telemetry.heating ? '加热中' : '已关闭'}
                  actualLabel={`${telemetry.temperature.toFixed(1)}℃`}
                />
                <ResponseCurve
                  label="气味释放 · 风扇×温度"
                  target={telemetry.fanTarget}
                  actual={telemetry.scentIntensity}
                  color="#f0c674"
                  targetLabel="期望强度"
                  actualLabel="实际释放"
                />
              </div>
            )}

            {/* 协议说明 */}
            <div className="mt-6 pt-5 border-t border-amethyst-500/15">
              <div className="text-[10px] tracking-widest text-amethyst-400/60 mb-2">
                Protocol Notes
              </div>
              <div className="text-[10px] text-moon-200/50 leading-relaxed space-y-1">
                <div>· 风扇：PWM 惯性 · 指数趋近目标，模拟电机响应延迟</div>
                <div>· 加热：热容模型 · 升温按功率累积，散热按牛顿冷却衰减到室温 22℃</div>
                <div>· 安全：温度上限 55℃ · 风扇低于 5% 无气味输出</div>
                <div>· 对接实体硬件：实现 CoasterProtocol 接口替换 MockCoasterDriver，上层零改动</div>
              </div>
            </div>

            {/* 杯垫模式 */}
            <div className="mt-6 pt-6 border-t border-amethyst-500/15">
              <div className="text-[10px] tracking-widest text-amethyst-400/60 mb-3">杯垫模式</div>
              <div className="flex gap-2">
                {(['in-house', 'takeaway', 'souvenir'] as const).map((m) => {
                  const active = coaster.mode === m;
                  return (
                    <div
                      key={m}
                      className={`flex-1 p-3 rounded-lg text-center transition-all duration-300 ${
                        active
                          ? 'glass-gold text-gold-sheen'
                          : 'glass text-moon-200/50'
                      }`}
                    >
                      <div className="font-display text-sm">{COASTER_MODE_LABEL[m]}</div>
                      <div className="text-[9px] text-moon-200/40 mt-0.5">
                        {m === 'in-house' ? '在馆内使用' : m === 'takeaway' ? '带回家续用' : '留存纪念'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassPanel>
        </section>
      )}

      {/* —— 三层架构导航 —— */}
      <section className="max-w-3xl mx-auto mb-8">
        <div className="text-center mb-4">
          <div className="text-xs tracking-[0.4em] text-amethyst-400/60 uppercase mb-2">
            Three Layers
          </div>
          <h2 className="font-display text-xl text-moon-50">三层可编程空间</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <GlassPanel padding="md" hover onClick={() => navigate('/tavern')}>
            <div className="text-[10px] text-amethyst-400/60 tracking-widest mb-1">LAYER 1</div>
            <div className="font-display text-sm text-moon-50 mb-1">可编程酒馆</div>
            <div className="text-[10px] text-amethyst-400/60">→ 场所级</div>
          </GlassPanel>
          <GlassPanel padding="md" hover onClick={() => navigate('/cocktail')}>
            <div className="text-[10px] text-amethyst-400/60 tracking-widest mb-1">LAYER 2</div>
            <div className="font-display text-sm text-moon-50 mb-1">可编程调酒空间</div>
            <div className="text-[10px] text-amethyst-400/60">→ 交互区</div>
          </GlassPanel>
        </div>
      </section>

      {/* —— 引语 —— */}
      <section className="text-center py-6">
        <div className="font-display text-moon-200/40 text-base italic leading-relaxed max-w-md mx-auto">
          「一杯一垫，一光一香，
          <br />
          杯起杯落，皆是编排。」
        </div>
        <div className="divider-gold max-w-xs mx-auto mt-4" />
      </section>

      <div className="h-8" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 子组件 · 参数行
// ═════════════════════════════════════════════════════════

function ParamRow({
  label,
  value,
  swatch,
  bar,
  barColor,
}: {
  label: string;
  value: string;
  swatch?: string;
  bar?: number;
  barColor?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 shrink-0 text-moon-200/50 text-[10px] tracking-widest">{label}</div>
      {swatch && (
        <div
          className="w-4 h-4 rounded shrink-0 border border-moon-200/20"
          style={{ background: swatch }}
        />
      )}
      {bar !== undefined && barColor ? (
        <div className="flex-1">
          <div className="h-1 bg-void/60 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${Math.max(2, bar * 100)}%`,
                background: `linear-gradient(to right, ${barColor}88, ${barColor})`,
              }}
            />
          </div>
        </div>
      ) : null}
      <div className="w-auto shrink-0 text-moon-50/80 font-mono text-[11px] text-right">{value}</div>
    </div>
  );
}

/** 杯垫参数 · 标签 + 值 + 可选进度条/圆点 */
function CoasterParam({
  label,
  value,
  bar,
  dot,
}: {
  label: string;
  value: string;
  bar?: number;
  dot?: string;
}) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] tracking-widest text-amethyst-400/60 mb-2">{label}</div>
      <div className="flex items-center gap-2">
        {dot && (
          <div
            className="w-2 h-2 rounded-full shrink-0 animate-breathe"
            style={{ background: dot, boxShadow: `0 0 8px ${dot}88` }}
          />
        )}
        {bar !== undefined ? (
          <div className="flex-1">
            <div className="text-sm text-gold-sheen font-display mb-1">{value}</div>
            <div className="h-1 bg-void/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amethyst-500 to-gold-400 transition-all duration-300"
                style={{ width: `${Math.max(2, bar * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gold-sheen font-display">{value}</div>
        )}
      </div>
    </div>
  );
}

/**
 * 响应曲线 · 目标值 vs 实际值双条对比
 * 直观展示硬件惯性：目标瞬时跳变，实际渐进趋近
 */
function ResponseCurve({
  label,
  target,
  actual,
  color,
  targetLabel,
  actualLabel,
}: {
  label: string;
  target: number;
  actual: number;
  color: string;
  targetLabel: string;
  actualLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] text-moon-200/60 tracking-widest">{label}</div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-moon-200/40">
            {targetLabel} <span className="text-moon-200/60">{Math.round(target * 100)}%</span>
          </span>
          <span style={{ color }}>
            {actualLabel} <span className="font-bold">{Math.round(actual * 100)}%</span>
          </span>
        </div>
      </div>
      {/* 目标条 · 虚线感 */}
      <div className="relative h-2 bg-void/60 rounded-full overflow-hidden mb-1">
        <div
          className="absolute top-0 bottom-0 transition-all duration-200"
          style={{
            width: `${Math.max(1, target * 100)}%`,
            background: `repeating-linear-gradient(90deg, ${color}55 0 4px, transparent 4px 8px)`,
          }}
        />
      </div>
      {/* 实际条 · 实心 + 光晕 */}
      <div className="relative h-2 bg-void/60 rounded-full overflow-hidden">
        <div
          className="absolute top-0 bottom-0 transition-all duration-300 ease-out"
          style={{
            width: `${Math.max(1, actual * 100)}%`,
            background: `linear-gradient(to right, ${color}66, ${color})`,
            boxShadow: `0 0 6px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}
