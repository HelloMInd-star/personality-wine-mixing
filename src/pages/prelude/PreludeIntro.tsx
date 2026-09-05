/**
 * PreludeIntro · 预告页壳
 *
 * 阶段管理 + Canvas 星空/银河渲染 + 跳过按钮 + 引导词
 * 导出 StageId / STAGES 供子组件消费
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PreludeVisuals } from './PreludeNarrative';
import { StarfieldEnterTrigger, EpilogueCTA } from './PreludeCTA';

export type StageId =
  | 'starfield'
  | 'galaxy'
  | 'tarot'
  | 'descent'
  | 'city'
  | 'cardsSpread'
  | 'earth'
  | 'sunMoon'
  | 'epilogue';

export interface StageDef {
  id: StageId;
  /** 自动推进时长（ms）；0 表示等待用户点击 */
  duration: number;
  /** 底部引导词 · 同步 cross-fade */
  caption: string;
}

export const STAGES: StageDef[] = [
  { id: 'starfield',  duration: 0,    caption: '轻触星空 · 进入银河' },
  { id: 'galaxy',     duration: 4200, caption: '你进入了一个宇宙视角' },
  { id: 'tarot',      duration: 2800, caption: '你的原型是什么' },
  { id: 'descent',    duration: 2600, caption: '穿过云层 · 落回人间' },
  { id: 'city',       duration: 1800, caption: '你在这里' },
  { id: 'cardsSpread',duration: 2800, caption: '你确认自己' },
  { id: 'earth',      duration: 3500, caption: '你在这个世界上行走' },
  { id: 'sunMoon',    duration: 5200, caption: '你的生活状态 · 夜晚在银河系中涌现' },
  { id: 'epilogue',   duration: 0,    caption: '准备好探索你的宇宙人间了吗' },
];

export default function PreludeIntro() {
  const navigate = useNavigate();
  const [stageIdx, setStageIdx] = useState(0);
  const current = STAGES[stageIdx];

  // 阶段自动推进 · duration=0 时等待交互
  useEffect(() => {
    if (current.duration <= 0) return;
    const t = window.setTimeout(() => {
      setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));
    }, current.duration);
    return () => window.clearTimeout(t);
  }, [stageIdx, current.duration]);

  const goTo = useCallback((idx: number) => {
    setStageIdx(Math.max(0, Math.min(idx, STAGES.length - 1)));
  }, []);

  const skipToEnd = useCallback(() => navigate('/'), [navigate]);

  return (
    <div className="prelude-root">
      {/* Canvas 层 · 星空 / 银河 / 地球粒子 */}
      <PreludeCanvas stage={current.id} onActivate={() => goTo(stageIdx + 1)} />

      {/* SVG/CSS 视觉层 · 按阶段渲染 */}
      <PreludeVisuals stage={current.id} />

      {/* 顶部 · 跳过按钮 */}
      <button
        type="button"
        onClick={skipToEnd}
        className="prelude-skip"
        aria-label="跳过预告回到首页"
      >
        跳过 →
      </button>

      {/* 底部 · 引导词 cross-fade */}
      <div className="prelude-caption-wrap" aria-live="polite">
        <p key={current.id} className="prelude-caption">
          {current.caption}
        </p>
      </div>

      {/* 阶段 1 · 点击进入银河的触发区 */}
      {current.id === 'starfield' && (
        <StarfieldEnterTrigger onActivate={() => goTo(stageIdx + 1)} />
      )}

      {/* 终章 · 进入枢纽 */}
      {current.id === 'epilogue' && <EpilogueCTA />}

      <style>{`
        .prelude-root {
          position: fixed; inset: 0; z-index: 60;
          background: radial-gradient(ellipse at top, #15102e 0%, #070414 70%);
          overflow: hidden; cursor: default;
        }
        .prelude-skip {
          position: absolute; top: 20px; right: 24px; z-index: 10;
          padding: 8px 14px; font-size: 11px; letter-spacing: 0.25em;
          color: rgba(216, 201, 245, 0.5);
          background: rgba(15, 10, 30, 0.4); backdrop-filter: blur(8px);
          border: 1px solid rgba(155, 123, 212, 0.2); border-radius: 999px;
          cursor: pointer; transition: all 240ms cubic-bezier(.2,.7,.2,1);
        }
        .prelude-skip:hover {
          color: #f0c674; border-color: rgba(240, 198, 116, 0.5);
          background: rgba(45, 27, 78, 0.6);
        }
        .prelude-caption-wrap {
          position: absolute; left: 0; right: 0; bottom: 56px; z-index: 8;
          text-align: center; pointer-events: none;
        }
        .prelude-caption {
          font-family: 'Noto Serif SC', serif; font-size: 14px;
          letter-spacing: 0.4em; color: rgba(216, 201, 245, 0.7);
          text-shadow: 0 0 12px rgba(124, 95, 191, 0.4);
          animation: caption-in 600ms ease-out; padding: 0 24px;
        }
        @keyframes caption-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   Canvas 层 · 星空 / 银河 / 地球粒子
   ============================================================ */

interface CanvasProps {
  stage: StageId;
  onActivate: () => void;
}

interface Star {
  x: number; y: number; z: number; r: number;
  alpha: number; twinkle: number; speed: number;
  layer: number; drift: number;
}

interface Particle {
  angle: number; radius: number; size: number;
  alpha: number; speed: number; hue: number;
  twinkle: number; twinkleSpeed: number; isCore: boolean;
}

interface Meteor {
  x: number; y: number; vx: number; vy: number;
  len: number; life: number;
}

function PreludeCanvas({ stage }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<StageId>(stage);
  const rafRef = useRef<number>(0);

  useEffect(() => { stageRef.current = stage; }, [stage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // 星空 · 200 颗 · 分3层视差漂移
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      const layer = Math.floor(Math.random() * 3);
      stars.push({
        x: Math.random() * width, y: Math.random() * height,
        z: Math.random(), layer,
        r: layer === 0 ? Math.random() * 0.5 + 0.3 : layer === 1 ? Math.random() * 0.6 + 0.6 : Math.random() * 0.9 + 0.9,
        alpha: layer === 0 ? Math.random() * 0.25 + 0.15 : layer === 1 ? Math.random() * 0.3 + 0.3 : Math.random() * 0.35 + 0.45,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.005,
        drift: layer === 0 ? 0.015 : layer === 1 ? 0.04 : 0.08,
      });
    }

    // 银河粒子 · 380 颗
    const particles: Particle[] = [];
    for (let i = 0; i < 380; i++) {
      const arm = Math.floor(Math.random() * 3);
      const baseAngle = (arm / 3) * Math.PI * 2;
      const radius = Math.random() * 180 + 30;
      const isCore = radius < 70;
      particles.push({
        angle: baseAngle + Math.random() * 1.4, radius,
        size: isCore ? Math.random() * 2.2 + 0.8 : Math.random() * 1.6 + 0.3,
        alpha: isCore ? Math.random() * 0.5 + 0.5 : Math.random() * 0.6 + 0.2,
        speed: 0.0015 + (0.0008 * (1 - radius / 220)),
        hue: Math.random(), twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.04 + 0.01, isCore,
      });
    }

    const coreParticles = particles.filter((p) => p.isCore);
    const meteors: Meteor[] = [];
    let meteorTimer = 0;
    let meteorNext = 90 + Math.random() * 150;
    let galaxyRot = 0;
    let zoomT = 0;

    const render = () => {
      const s = stageRef.current;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(7, 4, 20, 1)';
      ctx.fillRect(0, 0, width, height);

      // 星云团
      const nebulaColors = [
        'rgba(124, 95, 191, 0.10)',
        'rgba(240, 198, 116, 0.06)',
        'rgba(93, 68, 160, 0.10)',
      ];
      for (let i = 0; i < nebulaColors.length; i++) {
        const cx = width * (0.3 + i * 0.25);
        const cy = height * (0.35 + Math.sin(galaxyRot * 0.3 + i) * 0.08);
        const r = 240 + Math.sin(galaxyRot * 0.5 + i) * 30;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, nebulaColors[i]);
        grad.addColorStop(1, 'rgba(7, 4, 20, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      }

      // 星点 · 3层视差漂移 + 闪烁
      const starAlphaMul = s === 'starfield' ? 1 : s === 'galaxy' || s === 'tarot' ? 0.7 : 0.4;
      for (const star of stars) {
        star.twinkle += star.speed;
        star.x += star.drift;
        if (star.x > width + 5) star.x = -5;
        const a = Math.max(0, star.alpha + Math.sin(star.twinkle) * 0.3) * starAlphaMul;
        ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        const tint = star.z;
        if (tint > 0.9) ctx.fillStyle = `rgba(240, 198, 116, ${a})`;
        else if (tint > 0.75) ctx.fillStyle = `rgba(155, 123, 212, ${a})`;
        else ctx.fillStyle = `rgba(216, 201, 245, ${a})`;
        ctx.fill();
      }

      // 流星 · starfield/galaxy 阶段
      if (s === 'starfield' || s === 'galaxy') {
        meteorTimer++;
        if (meteorTimer >= meteorNext) {
          meteorTimer = 0; meteorNext = 90 + Math.random() * 210;
          const fromLeft = Math.random() > 0.5;
          meteors.push({
            x: fromLeft ? Math.random() * width * 0.5 : width * 0.5 + Math.random() * width * 0.5,
            y: -20,
            vx: fromLeft ? 3 + Math.random() * 2.5 : -(3 + Math.random() * 2.5),
            vy: 4 + Math.random() * 3,
            len: 70 + Math.random() * 90, life: 1,
          });
        }
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.vx; m.y += m.vy; m.life -= 0.009;
          if (m.life <= 0 || m.y > height + 50 || m.x < -60 || m.x > width + 60) {
            meteors.splice(i, 1); continue;
          }
          const tailX = m.x - (m.vx * m.len) / 6;
          const tailY = m.y - (m.vy * m.len) / 6;
          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          grad.addColorStop(0, `rgba(255, 245, 220, ${m.life * 0.9})`);
          grad.addColorStop(0.4, `rgba(240, 198, 116, ${m.life * 0.5})`);
          grad.addColorStop(1, 'rgba(240, 198, 116, 0)');
          ctx.strokeStyle = grad; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tailX, tailY); ctx.stroke();
          ctx.fillStyle = `rgba(255, 250, 235, ${m.life})`;
          ctx.beginPath(); ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2); ctx.fill();
        }
      }

      // 银河系
      const showGalaxy = s === 'galaxy' || s === 'tarot' || s === 'descent';
      if (showGalaxy) {
        const target = s === 'galaxy' ? 1 : s === 'tarot' ? 1 : 0.3;
        zoomT += (target - zoomT) * 0.04;
        galaxyRot += 0.004;
        const cx = width / 2, cy = height / 2;
        const scale = 0.6 + zoomT * 1.4;
        const galaxyAlpha = s === 'descent' ? Math.max(0, 1 - zoomT) : 1;

        ctx.save();
        ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.rotate(galaxyRot);

        const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 240);
        haloGrad.addColorStop(0, `rgba(124, 95, 191, ${0.12 * galaxyAlpha})`);
        haloGrad.addColorStop(0.5, `rgba(93, 68, 160, ${0.06 * galaxyAlpha})`);
        haloGrad.addColorStop(1, 'rgba(7, 4, 20, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath(); ctx.arc(0, 0, 240, 0, Math.PI * 2); ctx.fill();

        for (const p of particles) {
          p.angle += p.speed; p.twinkle += p.twinkleSpeed;
          const flicker = 0.65 + Math.sin(p.twinkle) * 0.35;
          const a = Math.max(0, p.alpha * flicker * galaxyAlpha);
          const spiralAngle = p.angle + p.radius * 0.012;
          const px = Math.cos(spiralAngle) * p.radius;
          const py = Math.sin(spiralAngle) * p.radius * 0.45;
          ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2);
          let c: string;
          if (p.isCore) {
            c = p.hue > 0.5 ? `rgba(255, 230, 180, ${a})` : `rgba(240, 198, 116, ${a})`;
          } else if (p.hue > 0.8) {
            c = `rgba(255, 220, 180, ${a})`;
          } else if (p.hue > 0.6) {
            c = `rgba(180, 210, 255, ${a})`;
          } else if (p.hue > 0.4) {
            c = `rgba(216, 201, 245, ${a})`;
          } else if (p.hue > 0.2) {
            c = `rgba(155, 123, 212, ${a})`;
          } else {
            c = `rgba(140, 200, 220, ${a})`;
          }
          ctx.fillStyle = c; ctx.fill();
          if (p.isCore && p.size > 1.8) {
            ctx.strokeStyle = `rgba(255, 230, 180, ${a * 0.4})`; ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(px - p.size * 3, py); ctx.lineTo(px + p.size * 3, py);
            ctx.moveTo(px, py - p.size * 3); ctx.lineTo(px, py + p.size * 3);
            ctx.stroke();
          }
        }

        // 分子网络
        const linkCount = 55;
        for (let k = 0; k < linkCount; k++) {
          const a = coreParticles[Math.floor(Math.random() * coreParticles.length)];
          const b = coreParticles[Math.floor(Math.random() * coreParticles.length)];
          if (a === b) continue;
          const sa = a.angle + a.radius * 0.012;
          const sb = b.angle + b.radius * 0.012;
          const ax = Math.cos(sa) * a.radius, ay = Math.sin(sa) * a.radius * 0.45;
          const bx = Math.cos(sb) * b.radius, by = Math.sin(sb) * b.radius * 0.45;
          const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
          if (dist < 48) {
            const linkAlpha = (1 - dist / 48) * 0.22 * galaxyAlpha;
            ctx.strokeStyle = `rgba(240, 198, 116, ${linkAlpha})`; ctx.lineWidth = 0.4;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
          }
        }

        // 尘埃带
        ctx.globalCompositeOperation = 'multiply';
        for (let d = 0; d < 3; d++) {
          const dustAngle = (d / 3) * Math.PI * 2 + 0.5;
          ctx.save(); ctx.rotate(dustAngle);
          const dustGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, 200);
          dustGrad.addColorStop(0, 'rgba(20, 10, 40, 0)');
          dustGrad.addColorStop(0.4, `rgba(7, 4, 20, ${0.35 * galaxyAlpha})`);
          dustGrad.addColorStop(1, 'rgba(7, 4, 20, 0)');
          ctx.fillStyle = dustGrad;
          ctx.beginPath(); ctx.ellipse(0, 0, 200, 28, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over';

        // 核心吸积盘
        const diskGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 90);
        diskGrad.addColorStop(0, `rgba(255, 245, 220, ${0.7 * galaxyAlpha})`);
        diskGrad.addColorStop(0.3, `rgba(240, 198, 116, ${0.4 * galaxyAlpha})`);
        diskGrad.addColorStop(0.7, `rgba(155, 123, 212, ${0.12 * galaxyAlpha})`);
        diskGrad.addColorStop(1, 'rgba(7, 4, 20, 0)');
        ctx.fillStyle = diskGrad;
        ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI * 2); ctx.fill();

        const corePulse = 0.85 + Math.sin(galaxyRot * 6) * 0.18;
        const coreR = 24 * corePulse;
        const coreDot = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
        coreDot.addColorStop(0, `rgba(255, 250, 235, ${0.95 * galaxyAlpha * corePulse})`);
        coreDot.addColorStop(0.5, `rgba(255, 230, 180, ${0.5 * galaxyAlpha * corePulse})`);
        coreDot.addColorStop(1, 'rgba(240, 198, 116, 0)');
        ctx.fillStyle = coreDot;
        ctx.beginPath(); ctx.arc(0, 0, coreR, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(render);
    };
    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="prelude-canvas" aria-hidden="true">
      <style>{`
        .prelude-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
      `}</style>
    </canvas>
  );
}