/**
 * PreludePage · Y.Mine 概念预告
 *
 * 一段从宇宙到地面的连续视觉叙事：
 *   星空 → 银河转动 → 塔罗揭晓 → 视角下坠 → 城市 → 牌铺开 →
 *   地球行走 → 太阳/图标/月光 → 引导词 → 进入系统
 *
 * 工程约定：
 *   - 单文件状态机驱动阶段切换 · duration>0 自动推进 · duration=0 等待交互
 *   - Canvas 渲染星空与银河 · SVG/CSS 渲染塔罗/人物/地球/日月/图标
 *   - 卸载时取消 RAF 与定时器 · 遵循深空紫金视觉语言
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

type StageId =
  | 'starfield'
  | 'galaxy'
  | 'tarot'
  | 'descent'
  | 'city'
  | 'cardsSpread'
  | 'earth'
  | 'sunMoon'
  | 'epilogue';

interface StageDef {
  id: StageId;
  /** 自动推进时长（ms）；0 表示等待用户点击 */
  duration: number;
  /** 底部引导词 · 同步 cross-fade */
  caption: string;
}

const STAGES: StageDef[] = [
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

export default function PreludePage() {
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

      {/* 阶段 1 · 点击进入银河的触发区（覆盖全屏） */}
      {current.id === 'starfield' && (
        <button
          type="button"
          className="prelude-enter-trigger"
          onClick={() => goTo(stageIdx + 1)}
          aria-label="点击进入银河系"
        >
          <span className="prelude-enter-hint">触</span>
        </button>
      )}

      {/* 终章 · 进入枢纽 */}
      {current.id === 'epilogue' && (
        <div className="prelude-explore-wrap animate-fade-in">
          <button
            type="button"
            onClick={() => navigate('/hub')}
            className="prelude-enter-btn"
          >
            进入星球枢纽 →
          </button>
        </div>
      )}

      <style>{`
        .prelude-root {
          position: fixed;
          inset: 0;
          z-index: 60;
          background: radial-gradient(ellipse at top, #15102e 0%, #070414 70%);
          overflow: hidden;
          cursor: default;
        }
        .prelude-skip {
          position: absolute;
          top: 20px;
          right: 24px;
          z-index: 10;
          padding: 8px 14px;
          font-size: 11px;
          letter-spacing: 0.25em;
          color: rgba(216, 201, 245, 0.5);
          background: rgba(15, 10, 30, 0.4);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(155, 123, 212, 0.2);
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .prelude-skip:hover {
          color: #f0c674;
          border-color: rgba(240, 198, 116, 0.5);
          background: rgba(45, 27, 78, 0.6);
        }
        .prelude-caption-wrap {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 56px;
          z-index: 8;
          text-align: center;
          pointer-events: none;
        }
        .prelude-caption {
          font-family: 'Noto Serif SC', serif;
          font-size: 14px;
          letter-spacing: 0.4em;
          color: rgba(216, 201, 245, 0.7);
          text-shadow: 0 0 12px rgba(124, 95, 191, 0.4);
          animation: caption-in 600ms ease-out;
          padding: 0 24px;
        }
        @keyframes caption-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .prelude-enter-trigger {
          position: absolute;
          inset: 0;
          z-index: 5;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .prelude-enter-hint {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 10px;
          letter-spacing: 0.3em;
          color: rgba(240, 198, 116, 0.6);
          animation: hint-pulse 2.4s ease-in-out infinite;
        }
        @keyframes hint-pulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
        .prelude-epilogue-cta {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 100px;
          z-index: 9;
          text-align: center;
        }
        .prelude-enter-btn {
          padding: 14px 36px;
          font-family: 'Noto Serif SC', serif;
          font-size: 14px;
          letter-spacing: 0.4em;
          color: #070414;
          background: linear-gradient(135deg, #f0c674 0%, #d4a84b 50%, #a8842f 100%);
          border: none;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 0 32px rgba(240, 198, 116, 0.45);
          transition: all 0.3s ease;
        }
        .prelude-enter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 40px rgba(240, 198, 116, 0.6);
        }
        /* 终章 · 5 维度探索入口 */
        .prelude-explore-wrap {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 64px;
          z-index: 9;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
        }
        .prelude-explore-dims {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 36px;
          padding: 0 24px;
          max-width: 760px;
        }
        .prelude-explore-dim {
          position: relative;
          width: 72px;
          height: 72px;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: translateY(16px);
          animation: dim-enter 0.9s cubic-bezier(0.22,1,0.36,1) var(--dim-delay) forwards;
        }
        @keyframes dim-enter {
          to { opacity: 1; transform: translateY(0); }
        }
        .prelude-dim-body {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 28%,
            color-mix(in srgb, var(--dim-accent) 88%, white 12%),
            var(--dim-accent) 55%,
            color-mix(in srgb, var(--dim-accent) 35%, #070414 65%) 100%);
          box-shadow:
            inset -6px -6px 18px rgba(7,4,20,0.65),
            0 0 24px var(--dim-aura);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: dim-float 4.8s ease-in-out infinite var(--dim-delay);
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s;
        }
        @keyframes dim-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .prelude-explore-dim:hover .prelude-dim-body {
          transform: scale(1.12);
          box-shadow:
            inset -6px -6px 18px rgba(7,4,20,0.65),
            0 0 48px var(--dim-aura);
        }
        .prelude-dim-ring {
          position: absolute;
          inset: -10px;
          border: 1px solid color-mix(in srgb, var(--dim-accent) 35%, transparent);
          border-radius: 50%;
          transform: rotateX(70deg);
          animation: dim-orbit 14s linear infinite;
          pointer-events: none;
        }
        @keyframes dim-orbit {
          to { transform: rotateX(70deg) rotateZ(360deg); }
        }
        .prelude-dim-glyph {
          font-family: 'Noto Serif SC', serif;
          font-size: 22px;
          font-weight: 300;
          color: rgba(7, 4, 20, 0.85);
          text-shadow: 0 1px 2px rgba(255,255,255,0.2);
        }
        .prelude-dim-label {
          position: absolute;
          bottom: -44px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          white-space: nowrap;
          pointer-events: none;
        }
        .prelude-dim-name {
          font-size: 11px;
          letter-spacing: 0.25em;
          color: var(--dim-accent);
          opacity: 0.85;
        }
        .prelude-dim-sub {
          font-size: 9px;
          letter-spacing: 0.2em;
          color: rgba(216,201,245,0.4);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .prelude-explore-dim:hover .prelude-dim-sub {
          opacity: 1;
        }
        @media (max-width: 640px) {
          .prelude-explore-dims { gap: 20px; }
          .prelude-explore-dim { width: 56px; height: 56px; }
          .prelude-dim-glyph { font-size: 17px; }
          .prelude-dim-label { bottom: -38px; }
          .prelude-explore-wrap { bottom: 48px; gap: 32px; }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   Canvas 层 · 星空 / 银河 / 地球粒子
   阶段切换时改变渲染模式 · 卸载取消 RAF
   ============================================================ */

interface CanvasProps {
  stage: StageId;
  onActivate: () => void;
}

interface Star {
  x: number;
  y: number;
  z: number; // 深度 · 用于银河放大时的透视
  r: number;
  alpha: number;
  twinkle: number;
  speed: number;
  layer: number; // 0=远 1=中 2=近 · 视差漂移层
  drift: number; // 横向漂移速度
}

interface Particle {
  angle: number;
  radius: number;
  size: number;
  alpha: number;
  speed: number;
  hue: number;
  twinkle: number;
  twinkleSpeed: number;
  isCore: boolean;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number;
}

function PreludeCanvas({ stage }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<StageId>(stage);
  const rafRef = useRef<number>(0);

  // 同步 stage 到 ref · RAF 内读取避免重启动画
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // 星空 · 200 颗 · 分3层视差漂移（远/中/近 · 不同大小亮度速度）
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      const layer = Math.floor(Math.random() * 3);
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        layer,
        r: layer === 0 ? Math.random() * 0.5 + 0.3 : layer === 1 ? Math.random() * 0.6 + 0.6 : Math.random() * 0.9 + 0.9,
        alpha: layer === 0 ? Math.random() * 0.25 + 0.15 : layer === 1 ? Math.random() * 0.3 + 0.3 : Math.random() * 0.35 + 0.45,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.005,
        drift: layer === 0 ? 0.015 : layer === 1 ? 0.04 : 0.08,
      });
    }

    // 银河粒子 · 螺旋分布 · 380 颗 · 核心区更密更亮
    const particles: Particle[] = [];
    for (let i = 0; i < 380; i++) {
      const arm = Math.floor(Math.random() * 3);
      const baseAngle = (arm / 3) * Math.PI * 2;
      const radius = Math.random() * 180 + 30;
      const isCore = radius < 70;
      particles.push({
        angle: baseAngle + Math.random() * 1.4,
        radius,
        size: isCore ? Math.random() * 2.2 + 0.8 : Math.random() * 1.6 + 0.3,
        alpha: isCore ? Math.random() * 0.5 + 0.5 : Math.random() * 0.6 + 0.2,
        speed: 0.0015 + (0.0008 * (1 - radius / 220)),
        hue: Math.random(),
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.04 + 0.01,
        isCore,
      });
    }

    // 核心区粒子预存 · 分子网络连线用
    const coreParticles = particles.filter((p) => p.isCore);

    // 流星 · starfield/galaxy 阶段偶现划过
    const meteors: Meteor[] = [];
    let meteorTimer = 0;
    let meteorNext = 90 + Math.random() * 150;

    let galaxyRot = 0;
    let zoomT = 0; // 0→1 银河放大进度

    const render = () => {
      const s = stageRef.current;
      ctx.clearRect(0, 0, width, height);

      // 全阶段底色 · 深空
      ctx.fillStyle = 'rgba(7, 4, 20, 1)';
      ctx.fillRect(0, 0, width, height);

      // 星云团 · 持续呼吸
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
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 星点 · 始终渲染 · 3层视差漂移 + 闪烁
      const starAlphaMul = s === 'starfield' ? 1 : s === 'galaxy' || s === 'tarot' ? 0.7 : 0.4;
      for (const star of stars) {
        star.twinkle += star.speed;
        star.x += star.drift;
        if (star.x > width + 5) star.x = -5;
        const a = Math.max(0, star.alpha + Math.sin(star.twinkle) * 0.3) * starAlphaMul;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        const tint = star.z;
        if (tint > 0.9) ctx.fillStyle = `rgba(240, 198, 116, ${a})`;
        else if (tint > 0.75) ctx.fillStyle = `rgba(155, 123, 212, ${a})`;
        else ctx.fillStyle = `rgba(216, 201, 245, ${a})`;
        ctx.fill();
      }

      // 流星 · starfield/galaxy 阶段偶现划过 · 带尾迹
      if (s === 'starfield' || s === 'galaxy') {
        meteorTimer++;
        if (meteorTimer >= meteorNext) {
          meteorTimer = 0;
          meteorNext = 90 + Math.random() * 210;
          const fromLeft = Math.random() > 0.5;
          meteors.push({
            x: fromLeft ? Math.random() * width * 0.5 : width * 0.5 + Math.random() * width * 0.5,
            y: -20,
            vx: fromLeft ? 3 + Math.random() * 2.5 : -(3 + Math.random() * 2.5),
            vy: 4 + Math.random() * 3,
            len: 70 + Math.random() * 90,
            life: 1,
          });
        }
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.vx;
          m.y += m.vy;
          m.life -= 0.009;
          if (m.life <= 0 || m.y > height + 50 || m.x < -60 || m.x > width + 60) {
            meteors.splice(i, 1);
            continue;
          }
          // 尾迹渐变线
          const tailX = m.x - (m.vx * m.len) / 6;
          const tailY = m.y - (m.vy * m.len) / 6;
          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          grad.addColorStop(0, `rgba(255, 245, 220, ${m.life * 0.9})`);
          grad.addColorStop(0.4, `rgba(240, 198, 116, ${m.life * 0.5})`);
          grad.addColorStop(1, 'rgba(240, 198, 116, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
          // 头部亮点
          ctx.fillStyle = `rgba(255, 250, 235, ${m.life})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 银河系 · galaxy/tarot 阶段放大转动；descent 阶段淡出
      const showGalaxy = s === 'galaxy' || s === 'tarot' || s === 'descent';
      if (showGalaxy) {
        // 放大进度
        const target = s === 'galaxy' ? 1 : s === 'tarot' ? 1 : 0.3;
        zoomT += (target - zoomT) * 0.04;
        galaxyRot += 0.004;

        const cx = width / 2;
        const cy = height / 2;
        const scale = 0.6 + zoomT * 1.4;
        const galaxyAlpha = s === 'descent' ? Math.max(0, 1 - zoomT) : 1;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.rotate(galaxyRot);

        // 外层弥散光晕 · 银河整体辉光
        const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 240);
        haloGrad.addColorStop(0, `rgba(124, 95, 191, ${0.12 * galaxyAlpha})`);
        haloGrad.addColorStop(0.5, `rgba(93, 68, 160, ${0.06 * galaxyAlpha})`);
        haloGrad.addColorStop(1, 'rgba(7, 4, 20, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 240, 0, Math.PI * 2);
        ctx.fill();

        // 螺旋臂粒子 · 闪烁 + 多元恒星色 + 核心十字光芒
        for (const p of particles) {
          p.angle += p.speed;
          p.twinkle += p.twinkleSpeed;
          const flicker = 0.65 + Math.sin(p.twinkle) * 0.35;
          const a = Math.max(0, p.alpha * flicker * galaxyAlpha);
          const spiralAngle = p.angle + p.radius * 0.012;
          const px = Math.cos(spiralAngle) * p.radius;
          const py = Math.sin(spiralAngle) * p.radius * 0.45; // 椭圆压扁
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          // 多元恒星色 · 核心区偏暖（老年星），外围偏冷（年轻星）
          let c: string;
          if (p.isCore) {
            c = p.hue > 0.5
              ? `rgba(255, 230, 180, ${a})`
              : `rgba(240, 198, 116, ${a})`;
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
          ctx.fillStyle = c;
          ctx.fill();
          // 核心区亮星 · 十字光芒
          if (p.isCore && p.size > 1.8) {
            ctx.strokeStyle = `rgba(255, 230, 180, ${a * 0.4})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(px - p.size * 3, py);
            ctx.lineTo(px + p.size * 3, py);
            ctx.moveTo(px, py - p.size * 3);
            ctx.lineTo(px, py + p.size * 3);
            ctx.stroke();
          }
        }

        // 分子网络 · 核心区粒子随机配对画连线 · 极客分子结构感
        const linkCount = 55;
        for (let k = 0; k < linkCount; k++) {
          const a = coreParticles[Math.floor(Math.random() * coreParticles.length)];
          const b = coreParticles[Math.floor(Math.random() * coreParticles.length)];
          if (a === b) continue;
          const sa = a.angle + a.radius * 0.012;
          const sb = b.angle + b.radius * 0.012;
          const ax = Math.cos(sa) * a.radius;
          const ay = Math.sin(sa) * a.radius * 0.45;
          const bx = Math.cos(sb) * b.radius;
          const by = Math.sin(sb) * b.radius * 0.45;
          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 48) {
            const linkAlpha = (1 - dist / 48) * 0.22 * galaxyAlpha;
            ctx.strokeStyle = `rgba(240, 198, 116, ${linkAlpha})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }

        // 尘埃带 · 螺旋臂间的暗区 · multiply 加深模拟尘埃遮挡
        ctx.globalCompositeOperation = 'multiply';
        for (let d = 0; d < 3; d++) {
          const dustAngle = (d / 3) * Math.PI * 2 + 0.5;
          ctx.save();
          ctx.rotate(dustAngle);
          const dustGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, 200);
          dustGrad.addColorStop(0, 'rgba(20, 10, 40, 0)');
          dustGrad.addColorStop(0.4, `rgba(7, 4, 20, ${0.35 * galaxyAlpha})`);
          dustGrad.addColorStop(1, 'rgba(7, 4, 20, 0)');
          ctx.fillStyle = dustGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, 200, 28, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over';

        // 核心吸积盘 · 多层叠加
        const diskGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 90);
        diskGrad.addColorStop(0, `rgba(255, 245, 220, ${0.7 * galaxyAlpha})`);
        diskGrad.addColorStop(0.3, `rgba(240, 198, 116, ${0.4 * galaxyAlpha})`);
        diskGrad.addColorStop(0.7, `rgba(155, 123, 212, ${0.12 * galaxyAlpha})`);
        diskGrad.addColorStop(1, 'rgba(7, 4, 20, 0)');
        ctx.fillStyle = diskGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 90, 0, Math.PI * 2);
        ctx.fill();

        // 核心亮点 · 最亮的中子星核 · 脉动呼吸
        const corePulse = 0.85 + Math.sin(galaxyRot * 6) * 0.18;
        const coreR = 24 * corePulse;
        const coreDot = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
        coreDot.addColorStop(0, `rgba(255, 250, 235, ${0.95 * galaxyAlpha * corePulse})`);
        coreDot.addColorStop(0.5, `rgba(255, 230, 180, ${0.5 * galaxyAlpha * corePulse})`);
        coreDot.addColorStop(1, 'rgba(240, 198, 116, 0)');
        ctx.fillStyle = coreDot;
        ctx.beginPath();
        ctx.arc(0, 0, coreR, 0, Math.PI * 2);
        ctx.fill();

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
    <canvas
      ref={canvasRef}
      className="prelude-canvas"
      aria-hidden="true"
    >
      <style>{`
        .prelude-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
      `}</style>
    </canvas>
  );
}

/* ============================================================
   SVG/CSS 视觉层 · 塔罗 / 人物 / 地球 / 日月 / 图标
   ============================================================ */

function PreludeVisuals({ stage }: { stage: StageId }) {
  return (
    <div className="prelude-visuals" aria-hidden="true">
      {/* 塔罗牌 · 揭晓 + 铺开两阶段共用 */}
      {(stage === 'tarot' || stage === 'cardsSpread') && (
        <TarotLayer spread={stage === 'cardsSpread'} />
      )}

      {/* 视角下坠 · 云层模糊带 */}
      {stage === 'descent' && <DescentLayer />}

      {/* 城市 + 人物剪影 */}
      {(stage === 'city' || stage === 'cardsSpread') && <CityLayer />}

      {/* 地球 + 行走小人 */}
      {stage === 'earth' && <EarthLayer />}

      {/* 太阳 → 图标 → 月光 */}
      {stage === 'sunMoon' && <SunMoonLayer />}

      {/* 终章 · 引导词背景光 */}
      {stage === 'epilogue' && <EpilogueLayer />}

      <style>{`
        .prelude-visuals {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

/* —— 塔罗牌层 · 皇帝牌 —— */
function TarotLayer({ spread }: { spread: boolean }) {
  // 铺开时显示 5 张牌 · 中心一张为主牌（皇帝）
  const cards = spread
    ? [
        { offset: -2, label: '星', sub: 'XVII' },
        { offset: -1, label: '月', sub: 'XVIII' },
        { offset: 0, label: '皇', sub: 'IV', main: true },
        { offset: 1, label: '塔', sub: 'XVI' },
        { offset: 2, label: '日', sub: 'XIX' },
      ]
    : [{ offset: 0, label: '皇', sub: 'IV', main: true }];

  return (
    <div className={`tarot-layer ${spread ? 'spread' : 'reveal'}`}>
      {cards.map((c, i) => (
        <div
          key={i}
          className={`tarot-card ${c.main ? 'main' : ''}`}
          style={{
            ['--card-offset' as string]: `${c.offset}`,
            ['--card-delay' as string]: `${i * 0.18}s`,
          }}
        >
          <div className="tarot-card-inner">
            <div className="tarot-card-label">{c.label}</div>
            <div className="tarot-card-sub">{c.sub}</div>
            <div className="tarot-card-ornament" />
          </div>
        </div>
      ))}
      <style>{`
        .tarot-layer {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tarot-card {
          position: absolute;
          width: 120px;
          height: 180px;
          transform: translateX(calc(var(--card-offset) * 95px)) translateY(0);
          opacity: 0;
        }
        /* 揭晓阶段 · 主牌翻转出现 */
        .tarot-layer.reveal .tarot-card {
          animation: tarot-flip 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        /* 铺开阶段 · 5 张牌错峰飞入 */
        .tarot-layer.spread .tarot-card {
          animation: tarot-spread 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) var(--card-delay) forwards;
        }
        @keyframes tarot-flip {
          0%   { opacity: 0; transform: translateX(0) rotateY(180deg) scale(0.6); }
          60%  { opacity: 1; transform: translateX(0) rotateY(40deg) scale(1.05); }
          100% { opacity: 1; transform: translateX(0) rotateY(0) scale(1); }
        }
        @keyframes tarot-spread {
          0%   { opacity: 0; transform: translateX(0) translateY(20px) rotate(0); }
          100% { opacity: 1; transform: translateX(calc(var(--card-offset) * 95px)) translateY(0) rotate(calc(var(--card-offset) * 4deg)); }
        }
        .tarot-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(45, 27, 78, 0.85) 0%, rgba(21, 16, 46, 0.95) 100%);
          border: 1px solid rgba(240, 198, 116, 0.4);
          box-shadow: 0 8px 32px rgba(7, 4, 20, 0.6), 0 0 24px rgba(240, 198, 116, 0.15);
          backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .tarot-card.main .tarot-card-inner {
          border-color: rgba(240, 198, 116, 0.7);
          box-shadow: 0 8px 40px rgba(7, 4, 20, 0.7), 0 0 36px rgba(240, 198, 116, 0.3);
        }
        /* 能量边框 · 旋转金紫光弧 · 极客分子仪式感 */
        .tarot-card-inner::after {
          content: '';
          position: absolute;
          inset: -1.5px;
          border-radius: 9.5px;
          background: conic-gradient(transparent 0%, rgba(240, 198, 116, 0.6) 12%, transparent 25%, transparent 50%, rgba(155, 123, 212, 0.5) 62%, transparent 75%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          padding: 1.5px;
          animation: energy-spin 4s linear infinite;
          pointer-events: none;
        }
        .tarot-card.main .tarot-card-inner::after {
          background: conic-gradient(transparent 0%, rgba(255, 230, 180, 0.85) 12%, transparent 25%, transparent 50%, rgba(240, 198, 116, 0.7) 62%, transparent 75%);
          animation-duration: 3s;
        }
        @keyframes energy-spin {
          to { transform: rotate(360deg); }
        }
        .tarot-card-label {
          font-family: 'Noto Serif SC', serif;
          font-size: 42px;
          font-weight: 600;
          background: linear-gradient(135deg, #f0c674 0%, #d4a84b 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 16px rgba(240, 198, 116, 0.3);
        }
        .tarot-card-sub {
          font-size: 10px;
          letter-spacing: 0.3em;
          color: rgba(216, 201, 245, 0.5);
          font-family: 'JetBrains Mono', monospace;
        }
        .tarot-card-ornament {
          position: absolute;
          inset: 8px;
          border: 1px solid rgba(240, 198, 116, 0.15);
          border-radius: 4px;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

/* —— 视角下坠 · 多层视差云 + 地平线渐显 —— */
function DescentLayer() {
  // 三层视差云 · 远(慢糊)/中/近(快实) · 错峰下落营造纵深感
  const farClouds = [
    { x: '12%', d: '0s' },
    { x: '48%', d: '0.35s' },
    { x: '78%', d: '0.7s' },
  ];
  const midClouds = [
    { x: '5%',  d: '0.2s' },
    { x: '38%', d: '0.55s' },
    { x: '68%', d: '0.9s' },
  ];
  const nearClouds = [
    { x: '22%', d: '0.45s' },
    { x: '58%', d: '0.8s' },
  ];
  return (
    <div className="descent-layer">
      {/* 远景云 · 慢速 · 高模糊 · 紫调 */}
      {farClouds.map((c, i) => (
        <div
          key={`f${i}`}
          className="descent-cloud far"
          style={{ ['--cloud-x' as string]: c.x, ['--cloud-d' as string]: c.d }}
        />
      ))}
      {/* 中景云 · 中速 · 金紫调 */}
      {midClouds.map((c, i) => (
        <div
          key={`m${i}`}
          className="descent-cloud mid"
          style={{ ['--cloud-x' as string]: c.x, ['--cloud-d' as string]: c.d }}
        />
      ))}
      {/* 近景云 · 快速 · 较实 · 深紫调 */}
      {nearClouds.map((c, i) => (
        <div
          key={`n${i}`}
          className="descent-cloud near"
          style={{ ['--cloud-x' as string]: c.x, ['--cloud-d' as string]: c.d }}
        />
      ))}
      {/* 地平线辉光 · 末尾渐显 · 衔接 city 城市剪影升起 */}
      <div className="descent-horizon" />
      {/* 暗角 · 压暗四周聚焦下坠感 */}
      <div className="descent-vignette" />
      <style>{`
        .descent-layer {
          position: absolute;
          inset: 0;
        }
        .descent-cloud {
          position: absolute;
          left: var(--cloud-x);
          border-radius: 50%;
          opacity: 0;
          animation: descent-fall 2.6s ease-in var(--cloud-d) forwards;
        }
        /* 远景 · 小慢糊 · 营造深度 */
        .descent-cloud.far {
          width: 32%;
          height: 90px;
          filter: blur(28px);
          background: radial-gradient(ellipse at center, rgba(124, 95, 191, 0.28) 0%, transparent 70%);
          animation-duration: 2.6s;
        }
        /* 中景 · 中速 · 金紫调 */
        .descent-cloud.mid {
          width: 42%;
          height: 130px;
          filter: blur(18px);
          background: radial-gradient(ellipse at center, rgba(155, 123, 212, 0.34) 0%, rgba(240, 198, 116, 0.08) 50%, transparent 75%);
          animation-duration: 2s;
        }
        /* 近景 · 大快实 · 深紫压底 */
        .descent-cloud.near {
          width: 54%;
          height: 170px;
          filter: blur(10px);
          background: radial-gradient(ellipse at center, rgba(45, 27, 78, 0.6) 0%, rgba(7, 4, 20, 0.35) 55%, transparent 80%);
          animation-duration: 1.5s;
        }
        @keyframes descent-fall {
          0%   { transform: translateY(-35vh); opacity: 0; }
          22%  { opacity: 1; }
          82%  { opacity: 1; }
          100% { transform: translateY(115vh); opacity: 0; }
        }
        /* 地平线辉光 · 1.1s 后渐显 · 底部深空渐变 + 金线 · 衔接 city */
        .descent-horizon {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 38%;
          background:
            linear-gradient(to top, rgba(7, 4, 20, 0.92) 0%, rgba(45, 27, 78, 0.4) 35%, rgba(240, 198, 116, 0.06) 65%, transparent 100%);
          opacity: 0;
          transform: translateY(24px);
          animation: horizon-emerge 1.5s ease-out 1.1s forwards;
        }
        @keyframes horizon-emerge {
          0%   { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .descent-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center 40%, transparent 25%, rgba(7, 4, 20, 0.55) 100%);
          animation: vignette-in 2.6s ease-out forwards;
        }
        @keyframes vignette-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* —— 城市剪影 + 人物 —— */
function CityLayer() {
  // 窗户灯光 · 随机位置+独立闪烁
  const lights = Array.from({ length: 28 }, () => ({
    left: Math.random() * 100,
    bottom: Math.random() * 32 + 4,
    delay: Math.random() * 3,
    duration: 1.5 + Math.random() * 2.5,
    warm: Math.random() > 0.4,
  }));
  return (
    <div className="city-layer">
      <div className="city-skyline" />
      {lights.map((l, i) => (
        <div
          key={i}
          className={`city-light ${l.warm ? 'warm' : 'cool'}`}
          style={{
            left: `${l.left}%`,
            bottom: `${l.bottom}%`,
            animationDelay: `${l.delay}s`,
            animationDuration: `${l.duration}s`,
          }}
        />
      ))}
      <div className="city-figure" />
      <style>{`
        .city-layer {
          position: absolute;
          inset: 0;
          animation: city-rise 1.4s ease-out forwards;
        }
        @keyframes city-rise {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .city-skyline {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 40%;
          background:
            linear-gradient(to top, rgba(7, 4, 20, 0.95) 0%, transparent 100%),
            repeating-linear-gradient(
              90deg,
              transparent 0,
              transparent 40px,
              rgba(45, 27, 78, 0.6) 40px,
              rgba(45, 27, 78, 0.6) 70px,
              transparent 70px,
              transparent 110px,
              rgba(21, 16, 46, 0.8) 110px,
              rgba(21, 16, 46, 0.8) 150px
            );
          mask: linear-gradient(to top, black 0%, black 60%, transparent 100%);
          -webkit-mask: linear-gradient(to top, black 0%, black 60%, transparent 100%);
        }
        .city-figure {
          position: absolute;
          left: 50%;
          bottom: 18%;
          width: 14px;
          height: 36px;
          transform: translateX(-50%);
          background: linear-gradient(to top, #070414 0%, #2d1b4e 100%);
          border-radius: 7px 7px 0 0;
          box-shadow: 0 0 16px rgba(124, 95, 191, 0.4);
          animation: figure-appear 1s ease-out 0.4s both;
        }
        .city-figure::before {
          content: '';
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(circle, #f0c674 0%, transparent 70%);
          box-shadow: 0 0 12px rgba(240, 198, 116, 0.6);
        }
        @keyframes figure-appear {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        /* 窗户灯光 · 暖黄/冷白随机闪烁 */
        .city-light {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          animation: light-flicker 2s ease-in-out infinite;
          z-index: 1;
        }
        .city-light.warm {
          background: rgba(240, 198, 116, 0.9);
          box-shadow: 0 0 5px rgba(240, 198, 116, 0.8);
        }
        .city-light.cool {
          background: rgba(180, 210, 255, 0.8);
          box-shadow: 0 0 5px rgba(180, 210, 255, 0.6);
        }
        @keyframes light-flicker {
          0%, 100% { opacity: 0.15; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* —— 地球 + 行走小人 —— */
function EarthLayer() {
  return (
    <div className="earth-layer">
      <div className="earth-globe">
        <div className="earth-glow" />
        <div className="earth-surface" />
        <div className="earth-atmosphere" />
        <div className="earth-walker" />
      </div>
      <style>{`
        .earth-layer {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .earth-globe {
          position: relative;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          animation: earth-rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes earth-rise {
          from { opacity: 0; transform: scale(0.6) translateY(60px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .earth-glow {
          position: absolute;
          inset: -40px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124, 95, 191, 0.3) 0%, transparent 60%);
          filter: blur(20px);
        }
        .earth-surface {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background:
            /* 点阵层 · 分子化网格 · 紫点 14px 间距 */
            radial-gradient(circle, rgba(155, 123, 212, 0.5) 1px, transparent 1.5px) 0 0 / 14px 14px,
            /* 金点 · 错峰 7px · 呼应星云 */
            radial-gradient(circle, rgba(240, 198, 116, 0.3) 0.5px, transparent 1px) 7px 7px / 14px 14px,
            /* 渐变底 · 球面感 */
            radial-gradient(circle at 30% 30%, rgba(155, 123, 212, 0.35) 0%, transparent 40%),
            radial-gradient(circle at 70% 60%, rgba(45, 27, 78, 0.6) 0%, transparent 50%),
            linear-gradient(135deg, #15102e 0%, #070414 100%);
          border: 1px solid rgba(240, 198, 116, 0.3);
          box-shadow: inset -20px -20px 60px rgba(7, 4, 20, 0.8), 0 0 60px rgba(124, 95, 191, 0.2);
          animation: earth-rotate 8s linear infinite;
          overflow: hidden;
        }
        @keyframes earth-rotate {
          from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0; }
          to   { background-position: 14px 0, 14px 0, 0 0, 0 0, 0 0; }
        }
        /* 大气层光环 · 脉动呼吸 */
        .earth-atmosphere {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid rgba(124, 95, 191, 0.35);
          box-shadow: 0 0 24px rgba(124, 95, 191, 0.4), inset 0 0 24px rgba(124, 95, 191, 0.2);
          pointer-events: none;
          animation: atmosphere-pulse 3s ease-in-out infinite;
        }
        @keyframes atmosphere-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.02); }
        }
        .earth-walker {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 16px;
          transform: translate(-50%, -50%);
          background: #f0c674;
          border-radius: 4px 4px 0 0;
          box-shadow: 0 0 10px rgba(240, 198, 116, 0.8);
          animation: walker-orbit 4s linear infinite;
          transform-origin: center;
        }
        @keyframes walker-orbit {
          0%   { transform: translate(-50%, -50%) rotate(0deg) translateY(-160px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateY(-160px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}

/* —— 太阳 → 图标 → 月光 —— */
function SunMoonLayer() {
  return (
    <div className="sunmoon-layer">
      {/* 太阳升起 + 淡出 (0-2.4s) */}
      <div className="sun-body" />

      {/* 咖啡/茶/酒图标依次涌现 (1.6-3.4s) */}
      <div className="icons-row">
        <span className="life-icon icon-coffee">☕</span>
        <span className="life-icon icon-tea">🍵</span>
        <span className="life-icon icon-wine">🍷</span>
      </div>

      {/* 月光浮现 (3.4-5.2s) */}
      <div className="moon-glow" />

      <style>{`
        .sunmoon-layer {
          position: absolute;
          inset: 0;
        }
        .sun-body {
          position: absolute;
          left: 50%;
          bottom: 30%;
          width: 80px;
          height: 80px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: radial-gradient(circle at 40% 40%, #f5d88f 0%, #f0c674 50%, #a8842f 100%);
          box-shadow: 0 0 60px rgba(240, 198, 116, 0.6), 0 0 120px rgba(240, 198, 116, 0.3);
          animation: sun-rise-fade 2.4s ease-in-out forwards;
        }
        @keyframes sun-rise-fade {
          0%   { opacity: 0; transform: translate(-50%, 80px) scale(0.5); }
          40%  { opacity: 1; transform: translate(-50%, 0) scale(1); }
          75%  { opacity: 1; transform: translate(-50%, -20px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -40px) scale(0.9); }
        }
        .icons-row {
          position: absolute;
          left: 50%;
          bottom: 28%;
          transform: translateX(-50%);
          display: flex;
          gap: 40px;
        }
        .life-icon {
          font-size: 36px;
          opacity: 0;
          filter: drop-shadow(0 0 12px rgba(240, 198, 116, 0.5));
          animation: icon-emerge 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .icon-coffee { animation-delay: 1.6s; }
        .icon-tea    { animation-delay: 2.0s; }
        .icon-wine   { animation-delay: 2.4s; }
        @keyframes icon-emerge {
          0%   { opacity: 0; transform: translateY(20px) scale(0.5); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .moon-glow {
          position: absolute;
          left: 50%;
          top: 25%;
          width: 120px;
          height: 120px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, rgba(244, 240, 255, 0.9) 0%, rgba(216, 201, 245, 0.4) 40%, transparent 70%);
          box-shadow: 0 0 80px rgba(216, 201, 245, 0.4), 0 0 160px rgba(124, 95, 191, 0.2);
          opacity: 0;
          animation: moon-fade-in 1.8s ease-out 3.4s forwards;
        }
        @keyframes moon-fade-in {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* —— 终章背景光 —— */
function EpilogueLayer() {
  return (
    <div className="epilogue-layer">
      <div className="epilogue-halo" />
      <style>{`
        .epilogue-layer {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .epilogue-halo {
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(240, 198, 116, 0.18) 0%, transparent 60%);
          filter: blur(20px);
          animation: halo-breathe 4s ease-in-out infinite;
        }
        @keyframes halo-breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
