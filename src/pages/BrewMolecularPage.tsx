/**
 * BrewMolecularPage · 觉醉·酿·分子 · 风味工程
 *
 * 圆锥浓度模型 + 七维风味向量 + 3D 分子可视化
 *
 * 战略定位：觉醉「感官情绪探索」中的味觉/嗅觉轴 · 圆锥浓度跨域同构的工程化
 *
 * 核心功能：
 *   1. 基酒选择（清酒/威士忌/白酒/洋酒）+ 品牌
 *   2. 5 个风味参数滑条（酒精度/甜度/酸度/苦度/果香）
 *   3. 圆锥浓度实时计算 C = m × ρ₀ / V(h)
 *   4. 七维风味向量雷达图（与 BrewMusicPage 共享 SevenDimensionalRadar）
 *   5. 3D 分子查看器（动态旋转+浮动）
 *   6. PID 负反馈稳态调节
 *   7. 风味演变时间轴
 */

import { Link } from 'react-router-dom';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import GlassPanel from '../components/ui/GlassPanel';
import SevenDimensionalRadar from '../components/brew/music/SevenDimensionalRadar';
import MoleculeViewer from '../components/brew/molecular/MoleculeViewer';
import FlavorSliders from '../components/brew/molecular/FlavorSliders';
import ConcentrationSimulator from '../components/brew/molecular/ConcentrationSimulator';
import logger from '../engine/logger';
import {
  type FlavorParams,
  type SolventConfig,
  type ConcentrationResult,
  type PidState,
  type FlavorDimension,
  calcConcentration,
  createPidState,
  pidStep,
  applyPidDelta,
  toFlavorVector,
  ICE_DILUTION,
} from '../engine/concentrationEngine';

// ═════════════════════════════════════════════════════════
// 默认值
// ═════════════════════════════════════════════════════════

const DEFAULT_FLAVOR: FlavorParams = {
  alcohol: 0.45,
  sweetness: 0.55,
  sourness: 0.35,
  bitterness: 0.20,
  fruitiness: 0.00,
};

const BASE_SPIRITS = [
  { key: 'sake', label: '日本清酒', icon: '🍶' },
  { key: 'whisky', label: '威士忌', icon: '🥃' },
  { key: 'baijiu', label: '中国白酒', icon: '🍶' },
  { key: 'other', label: '其他洋酒', icon: '🍸' },
] as const;

const BRANDS: Record<string, string[]> = {
  sake: ['獭祭 二割三分', '獭祭 三割九分', '月桂冠 上撰', '月桂冠 纯米大吟酿'],
  whisky: ['山崎 12年', '響 和风醇韵', '白州 12年', '余市'],
  baijiu: ['茅台 飞天', '五粮液', '泸州老窖 国窖1573', '汾酒 青花30'],
  other: ['轩尼诗 XO', '马爹利 蓝带', '百龄坛 17年', '添加利 金酒'],
};

const GLASS_TYPES = [
  { key: 'flute', label: '笛形杯' },
  { key: 'coupe', label: '碟形杯' },
  { key: 'rock', label: '古典杯' },
  { key: 'highball', label: '高球杯' },
] as const;

const ICE_OPTIONS = [
  { key: 'none', label: '不加冰' },
  { key: 'single', label: '单块冰' },
  { key: 'crushed', label: '碎冰' },
] as const;

// 分子映射：基酒 → 分子 key
const SPIRIT_MOLECULE: Record<string, string> = {
  sake: 'ethanol',
  whisky: 'ethanol',
  baijiu: 'ethanol',
  other: 'limonene',
};

// ═════════════════════════════════════════════════════════

export default function BrewMolecularPage() {
  // 风味参数
  const [flavor, setFlavor] = useState<FlavorParams>(DEFAULT_FLAVOR);

  // 溶剂配置
  const [solvent, setSolvent] = useState<SolventConfig>({
    baseSpirit: 'sake',
    glassType: 'rock',
    ice: 'none',
    brand: null,
  });

  // 浓度结果
  const [result, setResult] = useState<ConcentrationResult>(() =>
    calcConcentration(DEFAULT_FLAVOR, {
      baseSpirit: 'sake',
      glassType: 'rock',
      ice: 'none',
      brand: null,
    }),
  );

  // PID 状态
  const pidRef = useRef<PidState>(createPidState());
  const [pidActive, setPidActive] = useState(false);
  const pidTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 浓度历史
  const [historyLog, setHistoryLog] = useState<string[]>([]);

  /** 重新计算浓度 */
  const recalc = useCallback(
    (params: FlavorParams, config: SolventConfig) => {
      const r = calcConcentration(params, config);
      setResult(r);
      setHistoryLog((prev) => {
        const line = `[${new Date().toISOString().slice(11, 19)}] C=${r.concentration.toFixed(4)} · ${r.zone}`;
        return [...prev.slice(-49), line];
      });
      return r;
    },
    [],
  );

  /** 风味参数变更 */
  const handleFlavorChange = useCallback(
    (params: FlavorParams) => {
      setFlavor(params);
      recalc(params, solvent);
    },
    [solvent, recalc],
  );

  /** 基酒切换 */
  const handleSpiritChange = useCallback(
    (key: typeof BASE_SPIRITS[number]['key']) => {
      const next: SolventConfig = { ...solvent, baseSpirit: key, brand: null };
      setSolvent(next);
      recalc(flavor, next);
    },
    [flavor, solvent, recalc],
  );

  /** 品牌选择 */
  const handleBrandChange = useCallback(
    (brand: string) => {
      const next = { ...solvent, brand };
      setSolvent(next);
      logger.ui('分子:品牌', { brand });
    },
    [solvent],
  );

  /** 杯型切换 */
  const handleGlassChange = useCallback(
    (key: typeof GLASS_TYPES[number]['key']) => {
      const next: SolventConfig = { ...solvent, glassType: key };
      setSolvent(next);
      recalc(flavor, next);
    },
    [flavor, solvent, recalc],
  );

  /** 冰量切换 */
  const handleIceChange = useCallback(
    (key: typeof ICE_OPTIONS[number]['key']) => {
      const next: SolventConfig = { ...solvent, ice: key };
      setSolvent(next);
      recalc(flavor, next);
    },
    [flavor, solvent, recalc],
  );

  /** 稳态验证 */
  const handleVerify = useCallback(() => {
    const r = recalc(flavor, solvent);
    logger.engine('分子:稳态验证', {
      C: r.concentration,
      zone: r.zone,
      isSteady: r.isSteady,
    });
  }, [flavor, solvent, recalc]);

  /** PID 调节开关 */
  const handlePidToggle = useCallback(() => {
    if (pidActive) {
      // 停止 PID
      setPidActive(false);
      if (pidTimerRef.current) {
        clearInterval(pidTimerRef.current);
        pidTimerRef.current = null;
      }
      logger.engine('PID:停止');
    } else {
      // 启动 PID
      setPidActive(true);
      pidRef.current = createPidState();
      logger.engine('PID:启动');

      pidTimerRef.current = setInterval(() => {
        setFlavor((prev) => {
          setResult((currentResult) => {
            const delta = pidStep(currentResult.concentration, pidRef.current);
            const next = applyPidDelta(prev, delta);
            const newResult = calcConcentration(next, solvent);

            // 收敛到稳态后自动停止
            if (newResult.isSteady) {
              setPidActive(false);
              if (pidTimerRef.current) {
                clearInterval(pidTimerRef.current);
                pidTimerRef.current = null;
              }
              logger.engine('PID:收敛', { C: newResult.concentration });
            }

            setHistoryLog((prevLog) => {
              const line = `[PID] C=${newResult.concentration.toFixed(4)} · err=${delta._debug.error}`;
              return [...prevLog.slice(-49), line];
            });

            return newResult;
          });
          return prev;
        });
      }, 200);
    }
  }, [pidActive, solvent]);

  // 清理 PID 定时器
  useEffect(() => {
    return () => {
      if (pidTimerRef.current) {
        clearInterval(pidTimerRef.current);
      }
    };
  }, []);

  /** 重置 */
  const handleReset = useCallback(() => {
    setPidActive(false);
    if (pidTimerRef.current) {
      clearInterval(pidTimerRef.current);
      pidTimerRef.current = null;
    }
    pidRef.current = createPidState();
    setFlavor(DEFAULT_FLAVOR);
    const r = calcConcentration(DEFAULT_FLAVOR, solvent);
    setResult(r);
    setHistoryLog([]);
    logger.engine('分子:重置');
  }, [solvent]);

  /** 加冰 · 趣味操作 */
  const handleIce = useCallback(() => {
    const iceKeys: (keyof typeof ICE_DILUTION)[] = ['none', 'single', 'crushed'];
    const idx = iceKeys.indexOf(solvent.ice);
    const next = iceKeys[Math.min(idx + 1, iceKeys.length - 1)];
    const nextSolvent = { ...solvent, ice: next };
    setSolvent(nextSolvent);
    recalc(flavor, nextSolvent);
  }, [flavor, solvent, recalc]);

  /** 加酒 · 趣味操作 */
  const handleAddSpirit = useCallback(() => {
    const next = { ...flavor, alcohol: Math.min(1, flavor.alcohol + 0.05) };
    setFlavor(next);
    recalc(next, solvent);
  }, [flavor, solvent, recalc]);

  /** 七维风味向量 */
  const flavorVector: FlavorDimension[] = useMemo(
    () => toFlavorVector(flavor, result),
    [flavor, result],
  );

  /** 分子 key */
  const moleculeKey = SPIRIT_MOLECULE[solvent.baseSpirit] || 'ethanol';

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 标题区 */}
      <header className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-[11px] tracking-[0.6em] text-amethyst-400/80 uppercase mb-3">
              觉醉 · 酿·分子 · Flavor Engineering
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
              分子调酒实验室
            </h1>
          </div>
          <Link
            to="/brew/journey"
            className="text-xs text-amethyst-300/70 hover:text-amethyst-200 transition-colors tracking-[0.1em]"
          >
            ← 返回酿层
          </Link>
        </div>
        <p className="text-sm text-moon-200/60 italic max-w-2xl">
          圆锥浓度模型 · 0.48/0.50/0.68 三基准阈值 · PID 负反馈调节 · 味觉系统跨域验证
        </p>
        <div className="divider-gold mt-5 w-40" />
      </header>

      {/* 核心公式 */}
      <GlassPanel padding="md" className="mb-8">
        <div className="text-center space-y-2">
          <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase">
            核心公式 · 圆锥浓度模型（金融 → 风味迁移）
          </div>
          <div className="font-mono text-sm text-gold-400/80 tracking-[0.1em]">
            C = m × ρ₀ / V(h)
          </div>
          <div className="text-[10px] text-moon-200/40">
            C = 风味浓度 · m = 有效风味溶质 · ρ₀ = 分子信源密度 · V(h) = 酒体空间容积
          </div>
        </div>
      </GlassPanel>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* 左侧: 3D 分子查看器 */}
        <GlassPanel gold padding="lg">
          <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-4 text-center">
            风味分子结构
          </div>
          <MoleculeViewer moleculeKey={moleculeKey} height={380} />
          <div className="text-[9px] text-center text-moon-200/40 mt-3 tracking-[0.05em]">
            拖拽旋转 · 悬停原子查看详情 · 氧原子呼吸辉光
          </div>
        </GlassPanel>

        {/* 右侧: 七维雷达图 */}
        <GlassPanel gold padding="lg">
          <SevenDimensionalRadar
            dimensions={flavorVector}
            size={320}
            title="七维风味向量 · 实时映射"
          />
          {pidActive && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] text-green-400/70 tracking-[0.1em]">
                PID 调节中 · 收敛至 0.50 金线
              </span>
            </div>
          )}
        </GlassPanel>
      </div>

      {/* 基酒选择 */}
      <GlassPanel padding="md" className="mb-8">
        <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-4">
          基酒选择与参数调节
        </div>

        {/* 基酒类型 */}
        <div className="flex flex-wrap gap-2 mb-5">
          {BASE_SPIRITS.map((s) => (
            <button
              key={s.key}
              onClick={() => handleSpiritChange(s.key)}
              className={`px-4 py-2 text-xs rounded-full border transition-all tracking-[0.05em] ${
                solvent.baseSpirit === s.key
                  ? 'border-gold-400/50 bg-gold-400/10 text-gold-400'
                  : 'border-amethyst-500/20 text-moon-200/50 hover:border-amethyst-500/40'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* 品牌选择 */}
        <div className="mb-5">
          <select
            value={solvent.brand || ''}
            onChange={(e) => handleBrandChange(e.target.value)}
            className="w-full md:w-64 px-3 py-2 text-xs bg-void-700/80 border border-amethyst-500/20 rounded-lg text-moon-200/70 focus:border-gold-400/40 focus:outline-none transition-colors"
          >
            <option value="">-- 选择具体品牌 --</option>
            {(BRANDS[solvent.baseSpirit] || []).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* 杯型 + 冰量 */}
        <div className="flex flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.1em] text-amethyst-400/60">杯型</span>
            {GLASS_TYPES.map((g) => (
              <button
                key={g.key}
                onClick={() => handleGlassChange(g.key)}
                className={`px-2.5 py-1 text-[10px] rounded-full border transition-all ${
                  solvent.glassType === g.key
                    ? 'border-gold-400/40 bg-gold-400/10 text-gold-400'
                    : 'border-amethyst-500/15 text-moon-200/40 hover:border-amethyst-500/30'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.1em] text-amethyst-400/60">冰量</span>
            {ICE_OPTIONS.map((ice) => (
              <button
                key={ice.key}
                onClick={() => handleIceChange(ice.key)}
                className={`px-2.5 py-1 text-[10px] rounded-full border transition-all ${
                  solvent.ice === ice.key
                    ? 'border-gold-400/40 bg-gold-400/10 text-gold-400'
                    : 'border-amethyst-500/15 text-moon-200/40 hover:border-amethyst-500/30'
                }`}
              >
                {ice.label}
              </button>
            ))}
          </div>
        </div>

        {/* 风味参数滑条 */}
        <FlavorSliders value={flavor} onChange={handleFlavorChange} disabled={pidActive} />
      </GlassPanel>

      {/* 圆锥浓度模拟器 */}
      <GlassPanel gold padding="lg" className="mb-8">
        <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-1 text-center">
          风味浓度动态模拟器
        </div>
        <div className="text-[9px] text-center text-moon-200/40 mb-5 tracking-[0.05em]">
          拖动滑条调节风味溶质投入量，观察浓度在三基准阈值区间中的变化
        </div>

        <ConcentrationSimulator
          result={result}
          pidActive={pidActive}
          onVerify={handleVerify}
          onPidToggle={handlePidToggle}
          onReset={handleReset}
          onIce={handleIce}
          onAddSpirit={handleAddSpirit}
        />
      </GlassPanel>

      {/* 风味演变时间轴 */}
      <GlassPanel padding="md" className="mb-8">
        <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-4">
          风味演变时间轴
        </div>
        <div className="flex items-center justify-between relative">
          {/* 时间线 */}
          <div className="absolute top-4 left-0 right-0 h-px bg-amethyst-500/20" />
          {[
            { time: '0h', label: '初始', desc: '初始状态' },
            { time: '6h', label: '出味', desc: '风味初现' },
            { time: '24h', label: '变化', desc: '层次展开' },
            { time: '48h', label: '充分', desc: '风味融合' },
            { time: '72h', label: '极限', desc: '极限萃取' },
          ].map((point) => (
            <div key={point.time} className="relative flex flex-col items-center" style={{ width: '20%' }}>
              <div className="w-3 h-3 rounded-full bg-amethyst-500/40 border border-amethyst-500/60 mb-2 z-10" />
              <div className="text-[10px] text-moon-200/70 font-mono">{point.time}</div>
              <div className="text-[9px] text-moon-200/40">{point.label}</div>
              <div className="text-[8px] text-moon-200/25">{point.desc}</div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* 浓度历史日志 */}
      {historyLog.length > 0 && (
        <GlassPanel padding="md" className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase">
              浓度历史日志
            </div>
            <span className="text-[9px] text-moon-200/30 font-mono">
              {historyLog.length} 条
            </span>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {historyLog.slice(-20).map((line, i) => (
              <div
                key={i}
                className="text-[10px] font-mono text-moon-200/35 px-2 py-0.5 rounded hover:bg-white/[0.02]"
              >
                {line}
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      <div className="h-16" />
    </div>
  );
}