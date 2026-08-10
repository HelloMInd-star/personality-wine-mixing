/**
 * ScentCard · 杯垫气味配方可视化
 * 展示「哪种气味、何时释放、多强」的编排结果
 *
 * 浏览器无法产生真实气味，本组件以视觉化方式呈现配方：
 *   - 气流扩散动画 · 四种扩散模式各自差异化的 keyframes
 *   - 中心签名符号 · 镜月单字 + 光晕脉动
 *   - 香气微粒 · 固定数量 + opacity 调制（修复 intensity 阈值抖动 Bug）
 *   - 强度条 · 流光扫过 + 随阶段 energy 变化
 *   - 诗化描述 · 气味意境
 *
 * 扩散模式（呼应旅程四阶段）：
 *   breath · 缓慢呼吸（环缩放不消散，opacity 往返）
 *   spread · 加速铺开（环快速外扩淡出）
 *   burst  · 爆发释放（环急速放大后骤散）
 *   fade   · 缓慢淡出（环渐扩并模糊）
 *
 * 动画通过 duration + keyframes 双重控制 · breath 最慢，burst 最快
 * 颜色通过 CSS 变量 --scent-color 注入，避免 keyframes 硬编码
 *
 * 性能监控：渲染耗时 + JS 堆内存 + 动画重启事件（仅 DEV）
 *
 * Bug 修复记录：
 *   1. 粒子数量原用 Math.round(intensity*5) · intensity 经 0.5 阈值时
 *      粒子 mount/unmount 闪烁。改为固定 4 粒子 + opacity 调制，消除 DOM 抖动
 *   2. diffusion 切换时扩散环 keyframe/duration/delay 同时变 · CSS 动画硬重启
 *      burst(1200ms) 中段截断跳跃最明显。用 key={diffusion} 强制干净重挂载，
 *      让动画从 0% 干净开始，并在 perf 日志记录重启事件
 */

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { ScentProfile } from '../../../types/journey';
import { DIFFUSION_DURATION } from '../../../data/scentMeta';
import GlassPanel from '../../ui/GlassPanel';

export interface ScentCardProps {
  /** 气味配方 · 由 scentEngine 派生 */
  scent: ScentProfile;
  /** 阶段色 · 用于扩散环配色 · 取 journeyState.meta.color */
  phaseColor: string;
}

/** 四种扩散模式各自的 keyframes · 视觉特征差异化 */
const SCENT_KEYFRAMES = `
@keyframes scent-ring-breath {
  0%, 100% { transform: scale(0.72); opacity: 0.42; }
  50%      { transform: scale(1.02); opacity: 0.12; }
}
@keyframes scent-ring-spread {
  0%   { transform: scale(0.5);  opacity: 0.55; }
  100% { transform: scale(1.5);  opacity: 0; }
}
@keyframes scent-ring-burst {
  0%   { transform: scale(0.4);  opacity: 0.75; }
  55%  { opacity: 0.22; }
  100% { transform: scale(1.85); opacity: 0; }
}
@keyframes scent-ring-fade {
  0%   { transform: scale(0.6);  opacity: 0.45; filter: blur(0px); }
  100% { transform: scale(1.35); opacity: 0;    filter: blur(4px); }
}
@keyframes scent-core-glow {
  0%, 100% { text-shadow: 0 0 8px var(--scent-color-soft), 0 0 18px var(--scent-color-faint); }
  50%      { text-shadow: 0 0 14px var(--scent-color),     0 0 30px var(--scent-color-soft); }
}
@keyframes scent-particle-rise {
  0%   { transform: translate(0, 0) scale(1);     opacity: 0; }
  18%  { opacity: var(--particle-peak, 0.7); }
  100% { transform: translate(var(--drift, 0px), -42px) scale(0.25); opacity: 0; }
}
@keyframes scent-bar-sheen {
  0%   { transform: translateX(-120%); }
  60%  { transform: translateX(120%); }
  100% { transform: translateX(120%); }
}
`;

/** 扩散模式 → 对应 keyframe 名 */
const DIFFUSION_ANIM: Record<ScentProfile['diffusion'], string> = {
  breath: 'scent-ring-breath',
  spread: 'scent-ring-spread',
  burst: 'scent-ring-burst',
  fade: 'scent-ring-fade',
};

/** 扩散模式中文标签 */
const DIFFUSION_LABEL: Record<ScentProfile['diffusion'], string> = {
  breath: '呼吸',
  spread: '铺开',
  burst: '爆发',
  fade: '淡出',
};

/**
 * 固定粒子数 · 修复 Bug 1
 * 原值随 intensity 抖动导致 mount/unmount 闪烁，改为固定 4 粒子
 * intensity 通过 --particle-peak 调制单粒子峰值透明度，保留「高强度更密」的视觉语义
 */
const FIXED_PARTICLE_COUNT = 4;

/** 微粒飘散的水平偏移 · 营造随机感 */
const PARTICLE_DRIFTS = ['-6px', '4px', '-2px', '8px'];

/**
 * 性能监控日志 · 仅 DEV 环境
 * 输出：时间戳 + JS 堆内存（Chrome 非标准 API，jsdom 无则省略）+ 详情
 */
function perfMark(scope: string, detail: Record<string, unknown> = {}): void {
  if (!import.meta.env.DEV) return;
  const mem = (
    performance as Performance & { memory?: { usedJSHeapSize: number } }
  ).memory;
  const memStr = mem
    ? ` mem=${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
    : '';
  const ts = performance.now().toFixed(1);
  // eslint-disable-next-line no-console
  console.debug(`[Perf:ScentCard:${scope}] t=${ts}ms${memStr}`, detail);
}

export default function ScentCard({ scent, phaseColor }: ScentCardProps) {
  const duration = DIFFUSION_DURATION[scent.diffusion];
  const ringAnim = DIFFUSION_ANIM[scent.diffusion];
  // 三个环错峰扩散 · delay 递增 1/3 周期
  const ringDelay = duration / 3;
  const intensityPct = (scent.intensity * 100).toFixed(0);

  // 追踪 diffusion/intensity 变化 · 用于检测动画重启事件
  const prevDiffusionRef = useRef<ScentProfile['diffusion'] | null>(null);
  const prevIntensityRef = useRef<number>(scent.intensity);

  // 渲染开始标记 · useLayoutEffect 在 DOM commit 后同步执行 · 两者差值 ≈ 渲染+commit 耗时
  const renderStartTs = useRef<number>(performance.now());

  useLayoutEffect(() => {
    const commitTs = performance.now();
    const renderMs = commitTs - renderStartTs.current;

    const prevDiff = prevDiffusionRef.current;
    const diffusionChanged = prevDiff !== null && prevDiff !== scent.diffusion;
    const intensityChanged = prevIntensityRef.current !== scent.intensity;

    if (diffusionChanged) {
      // Bug 2 修复点 · diffusion 变更触发动画干净重启
      perfMark('animation:restart', {
        from: prevDiff,
        to: scent.diffusion,
        durationMs: duration,
        reason: 'diffusion 变更 · key={diffusion} 强制重挂载扩散环',
        renderMs: renderMs.toFixed(2),
      });
    } else if (intensityChanged) {
      perfMark('animation:intensityUpdate', {
        diffusion: scent.diffusion,
        from: prevIntensityRef.current.toFixed(2),
        to: scent.intensity.toFixed(2),
        renderMs: renderMs.toFixed(2),
        restart: false,
      });
    }

    // 每次有意义的渲染都记录耗时 + 内存
    if (diffusionChanged || intensityChanged) {
      perfMark('render:commit', {
        diffusion: scent.diffusion,
        intensity: scent.intensity.toFixed(2),
        renderMs: renderMs.toFixed(2),
        particleCount: FIXED_PARTICLE_COUNT,
        sheenVisible: scent.intensity > 0.3,
      });
    }

    prevDiffusionRef.current = scent.diffusion;
    prevIntensityRef.current = scent.intensity;
    // 重置 render 计时器 · 为下一次 render 准备
    renderStartTs.current = performance.now();
  }, [scent.diffusion, scent.intensity, duration]);

  // 挂载/卸载日志
  useEffect(() => {
    perfMark('mount', {
      diffusion: scent.diffusion,
      durationMs: duration,
      particleCount: FIXED_PARTICLE_COUNT,
    });
    return () => {
      perfMark('unmount', { msg: 'ScentCard unmount · 动画停止' });
    };
    // 仅挂载/卸载时执行 · 不随 scent 变化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CSS 变量 · 让 keyframes 能取到阶段色
  const cssVars = {
    '--scent-color': phaseColor,
    '--scent-color-soft': `${phaseColor}88`,
    '--scent-color-faint': `${phaseColor}44`,
  } as CSSProperties;

  // 粒子峰值透明度 · 随强度调制（0.3 ~ 0.85）
  // 修复 Bug 1 · 不再用 mount/unmount 控制数量，改用 opacity 保留视觉语义
  const particlePeak = Math.max(0.3, Math.min(0.85, scent.intensity * 0.9 + 0.15));

  return (
    <GlassPanel padding="md" className="mb-6">
      <style>{SCENT_KEYFRAMES}</style>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="font-display text-sm text-moon-200/80 tracking-[0.15em]">
          杯垫气味
        </h3>
        <span className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase">
          Scent · {DIFFUSION_LABEL[scent.diffusion]}
        </span>
      </div>

      <div className="flex items-center gap-6" style={cssVars}>
        {/* 气流扩散动画 · 三环错峰 + 中心符号 + 飘散微粒 */}
        {/*
          Bug 2 修复 · key={scent.diffusion} 强制 diffusion 变更时重挂载容器
          让 burst→fade 等切换时动画从 0% 干净开始，而非从旧 keyframe 中段硬跳
        */}
        <div
          key={scent.diffusion}
          className="relative shrink-0 flex items-center justify-center"
          style={{ width: 104, height: 104 }}
          aria-hidden="true"
        >
          {/* 三层扩散环 · 各模式动画差异化 */}
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                width: 84,
                height: 84,
                border: `1.5px solid ${phaseColor}`,
                animation: `${ringAnim} ${duration}ms ease-out ${ringDelay * i}ms infinite`,
              }}
            />
          ))}

          {/* 香气微粒 · 固定 4 粒子 + opacity 调制（修复 Bug 1 抖动） */}
          {PARTICLE_DRIFTS.map((drift, i) => (
            <span
              key={`p-${i}`}
              className="absolute rounded-full"
              style={
                {
                  width: 3,
                  height: 3,
                  background: phaseColor,
                  bottom: '30%',
                  left: `${42 + (i - 1.5) * 12}%`,
                  '--drift': drift,
                  '--particle-peak': particlePeak.toFixed(2),
                  animation: `scent-particle-rise ${duration * 1.4}ms ease-out ${
                    i * (duration / 5)
                  }ms infinite`,
                } as CSSProperties
              }
            />
          ))}

          {/* 中心签名符号 · 镜月单字 + 光晕脉动 */}
          <span
            className="relative font-display text-2xl leading-none"
            style={{
              color: phaseColor,
              animation: `scent-core-glow ${duration * 1.5}ms ease-in-out infinite`,
            }}
          >
            {scent.signatureSymbol}
          </span>
        </div>

        {/* 配方信息 */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-0.5">
                主调
              </div>
              <div className="font-display text-sm text-moon-50">
                {scent.primaryLabel}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-0.5">
                签名
              </div>
              <div className="font-display text-sm text-moon-50">
                {scent.signatureLabel}
              </div>
            </div>
          </div>

          {/* 强度条 · 流光扫过 */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] text-moon-200/45 mb-1">
              <span className="tracking-[0.15em]">释放强度</span>
              <span className="font-mono">{intensityPct}%</span>
            </div>
            <div className="relative h-1 rounded-full bg-amethyst-500/15 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${intensityPct}%`,
                  background: `linear-gradient(90deg, ${phaseColor}88, ${phaseColor})`,
                  boxShadow: `0 0 6px ${phaseColor}66`,
                }}
              />
              {/* 流光 · 仅在高强度时显眼 */}
              {scent.intensity > 0.3 && (
                <div
                  className="absolute top-0 left-0 h-full w-1/3"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${phaseColor}55, transparent)`,
                    animation: `scent-bar-sheen ${duration * 1.2}ms ease-in-out infinite`,
                  }}
                />
              )}
            </div>
          </div>

          {/* 诗化描述 */}
          <div className="text-xs italic" style={{ color: `${phaseColor}cc` }}>
            {scent.poem}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}