/**
 * StarfieldBackground · 深空星野背景
 * Canvas 粒子系统 · 漂浮星点 + 缓慢呼吸的星云
 * 固定铺底，让一切内容悬浮于深空之上
 */

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  /** 缓慢漂移 */
  vx: number;
  vy: number;
}

interface Nebula {
  x: number;
  y: number;
  r: number;
  color: string;
  phase: number;
}

const STAR_COUNT = 140;
const NEBULA_COUNT = 4;
const NEBULA_COLORS = [
  'rgba(124, 95, 191, 0.10)',
  'rgba(240, 198, 116, 0.06)',
  'rgba(93, 68, 160, 0.10)',
  'rgba(155, 123, 212, 0.07)',
];

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let rafId = 0;

    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.25,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
      });
    }

    const nebulas: Nebula[] = [];
    for (let i = 0; i < NEBULA_COUNT; i++) {
      nebulas.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 280 + 220,
        color: NEBULA_COLORS[i % NEBULA_COLORS.length],
        phase: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 星云 · 缓慢呼吸的色团
      for (const n of nebulas) {
        n.phase += 0.0015;
        const breathe = 1 + Math.sin(n.phase) * 0.08;
        const grad = ctx.createRadialGradient(
          n.x,
          n.y,
          0,
          n.x,
          n.y,
          n.r * breathe,
        );
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, 'rgba(7, 4, 20, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * breathe, 0, Math.PI * 2);
        ctx.fill();
      }

      // 星点 · 闪烁 + 漂移
      for (const s of stars) {
        s.twinklePhase += s.twinkleSpeed;
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        const alpha = s.baseAlpha + Math.sin(s.twinklePhase) * 0.35;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        // 金紫二色随机赋色 · 多为月白，少量金紫
        const tint = Math.random();
        if (tint > 0.92) {
          ctx.fillStyle = `rgba(240, 198, 116, ${Math.max(0, alpha)})`;
        } else if (tint > 0.85) {
          ctx.fillStyle = `rgba(155, 123, 212, ${Math.max(0, alpha)})`;
        } else {
          ctx.fillStyle = `rgba(216, 201, 245, ${Math.max(0, alpha)})`;
        }
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };
    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
