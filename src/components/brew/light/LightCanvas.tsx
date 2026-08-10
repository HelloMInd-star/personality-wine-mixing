/**
 * LightCanvas · 杯底光效可视化
 * 用 Canvas 模拟可编程 LED 灯环 · 零硬件依赖
 *
 * 渲染四层（由下至上）：
 *   ① 外光晕 · 径向渐变 · 主色+强调色混合，整体氛围
 *   ② LED 灯环 · 48 段环形光点 · 按 pattern 动画
 *   ③ 杯底中心 · 实心径向渐变 · 模拟酒液导光
 *   ④ 粒子层 · 环形分布光点 · 模拟烟雾散射
 *
 * 动画模式：
 *   breath  · 整体明暗 sin 呼吸
 *   flow    · 光带沿环周角度流动
 *   pulse   · 随拍方波脉动（呼应 musicEngine BPM）
 *   aurora  · 多色 sin 叠加缓流
 *
 * 性能：
 *   - effect 变化通过 ref 读取，不重启 RAF · 动画连续
 *   - DPR 适配高清屏
 *   - 仅 size 变化时重建画布
 *
 * 深空美学：低 alpha、柔和发光、呼应磨砂玻璃质感
 */

import { useEffect, useRef } from 'react';
import type { LightEffect } from '../../../types/journey';

export interface LightCanvasProps {
  /** 光效参数 · 由 lightEngine 派生 */
  effect: LightEffect;
  /** 画布尺寸 px · 默认 240 */
  size?: number;
  className?: string;
}

/** hex(#rrggbb) → rgba 字符串 · 兼容 6 位标准色 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

/** 粒子预生成结构 · 环形分布 */
interface Particle {
  angle: number;
  /** 半径占比 0-1 · 相对外环半径 */
  radius: number;
  size: number;
  phase: number;
}

export default function LightCanvas({
  effect,
  size = 240,
  className,
}: LightCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  // effect 通过 ref 读取 · 避免 effect 变化重启 RAF
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // DPR 适配高清屏
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const start = performance.now();

    // 粒子预生成 · 固定数量，按 particleDensity 采样渲染
    const PARTICLE_COUNT = 28;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle: (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.3,
      radius: 0.55 + Math.random() * 0.35,
      size: 0.8 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = (now: number) => {
      const t = (now - start) / 1000; // 秒
      const eff = effectRef.current;
      const cx = size / 2;
      const cy = size / 2;
      const rOuter = size * 0.46; // 外光晕半径
      const rRing = size * 0.36; // 灯环半径
      const rInner = size * 0.2; // 杯底半径

      ctx.clearRect(0, 0, size, size);

      // ── ① 外光晕 · 径向渐变 ──
      let glowAlpha: number;
      switch (eff.pattern) {
        case 'breath':
          glowAlpha = 0.16 + Math.sin(t * eff.speed * 1.2) * 0.1;
          break;
        case 'flow':
          glowAlpha = 0.2 + Math.sin(t * eff.speed * 2) * 0.05;
          break;
        case 'pulse':
          // 随拍方波 · 呼应 musicEngine BPM
          glowAlpha = Math.sin(t * eff.speed * 4) > 0 ? 0.34 : 0.12;
          break;
        case 'aurora':
          glowAlpha = 0.18 + Math.sin(t * eff.speed * 0.8) * 0.08;
          break;
      }
      glowAlpha *= eff.intensity;

      const glowGrad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
      glowGrad.addColorStop(0, hexToRgba(eff.baseColor, glowAlpha));
      glowGrad.addColorStop(0.55, hexToRgba(eff.accentColor, glowAlpha * 0.55));
      glowGrad.addColorStop(1, hexToRgba(eff.baseColor, 0));
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, size, size);

      // ── ② LED 灯环 · 48 段环形光点 ──
      ctx.save();
      ctx.translate(cx, cy);
      // flow 模式整环旋转 · 增强流动感
      const ringRotation = eff.pattern === 'flow' ? t * eff.speed * 0.6 : 0;
      ctx.rotate(ringRotation);

      const SEGMENTS = 48;
      // flow 模式光带角度 · 随时间推进
      const flowAngle = (t * eff.speed * 2) % (Math.PI * 2);

      for (let i = 0; i < SEGMENTS; i++) {
        const angle = (i / SEGMENTS) * Math.PI * 2;
        let segAlpha: number;
        switch (eff.pattern) {
          case 'flow': {
            // 光带在 flowAngle 处最亮，远离衰减
            let diff = Math.abs(angle - flowAngle);
            diff = Math.min(diff, Math.PI * 2 - diff);
            segAlpha = Math.max(0.08, 0.85 - diff * 0.45) * eff.intensity;
            break;
          }
          case 'pulse':
            segAlpha = (Math.sin(t * eff.speed * 4) > 0 ? 0.82 : 0.28) * eff.intensity;
            break;
          case 'aurora':
            segAlpha = (0.4 + Math.sin(angle * 3 + t * eff.speed) * 0.32) * eff.intensity;
            break;
          default: // breath
            segAlpha = (0.42 + Math.sin(t * eff.speed * 1.2) * 0.2) * eff.intensity;
        }
        // 交替主色/强调色 · 模拟 LED 多色灯环
        const color = i % 2 === 0 ? eff.baseColor : eff.accentColor;
        const px = Math.cos(angle) * rRing;
        const py = Math.sin(angle) * rRing;
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(color, segAlpha);
        ctx.fill();
      }
      ctx.restore();

      // ── ③ 杯底中心 · 酒液导光 ──
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rInner);
      centerGrad.addColorStop(0, hexToRgba(eff.accentColor, 0.55 * eff.intensity));
      centerGrad.addColorStop(0.7, hexToRgba(eff.baseColor, 0.28 * eff.intensity));
      centerGrad.addColorStop(1, hexToRgba(eff.baseColor, 0));
      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
      ctx.fill();

      // ── ④ 粒子层 · 烟雾散射光点 ──
      const pCount = Math.floor(particles.length * eff.particleDensity * 1.4);
      for (let i = 0; i < pCount; i++) {
        const p = particles[i];
        // 粒子缓慢环绕 + 径向呼吸
        const drift = Math.sin(t * eff.speed + p.phase) * 0.04;
        const r = (p.radius + drift) * rOuter;
        const px = cx + Math.cos(p.angle + t * eff.speed * 0.12) * r;
        const py = cy + Math.sin(p.angle + t * eff.speed * 0.12) * r;
        const pAlpha = (0.32 + Math.sin(t * eff.speed * 2 + p.phase) * 0.22) * eff.intensity;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(eff.accentColor, pAlpha);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={className}
      aria-label="杯底光效"
      role="img"
    />
  );
}