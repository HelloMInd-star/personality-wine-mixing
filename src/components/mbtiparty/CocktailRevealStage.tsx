/**
 * CocktailRevealStage · 酒款揭示舞台
 *
 * 渲染时间线：
 *   ① drip 阶段（0 ~ 1.4s）   · 滴管从顶部入场 · 液滴形成 + 下落
 *   ② fill 阶段（1.4 ~ 2.6s） · 涟漪扩散 · 液面从杯底上升 · 分子逐渐显现
 *   ③ reveal 阶段（2.6s+）     · 正常循环：杯垫/酒液/分子/冰块/干冰/金线
 *
 * 视觉分层：
 *   ① 杯垫光晕 · 径向渐变 + 呼吸 + 金线
 *   ② 酒杯轮廓 · 马天尼杯（倒三角 + 杯柄 + 杯座）· 金色细描边
 *   ③ 液态酒液 · 杯底渐变 + sin 轻晃（fill 阶段液面动态上升）
 *   ④ 分子粒子 · 液体内环绕浮动（裁剪到酒液区）· alpha 随相位渐入
 *   ⑤ 固态冰块 · 半透明白方（静态叠加 · reveal 阶段显现）
 *   ⑥ 气态干冰 · 杯口向上飘散 · 透明度衰减（仅 reveal 阶段）
 *   ⑦ 杯口金线高光
 *   ⑧ 滴管入场动画（drip 阶段）+ 涟漪扩散
 *
 * 物态分层：液态（底部稳定）/ 气态（上升消散）/ 固态（冰块静态）
 * 配色：主色为酒液基调，强调色为粒子高光与雾气
 * 性能：单 Canvas + RAF · DPR 适配 · fusion 通过 ref 读取避免重启
 */

import { useEffect, useRef, useState } from 'react';
import type { FusionCocktail } from '../../types/mbtiParty';

export interface CocktailRevealStageProps {
  fusion: FusionCocktail;
  size?: number;
}

/** hex → rgba · 只接受 #rrggbb 格式 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

/** 液体内分子粒子 */
interface MoleculeParticle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  phase: number;
}

/** 气态干冰雾气粒子 */
interface MistParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
}

/** 涟漪 · 液滴入水后扩散 */
interface Ripple {
  r: number;
  alpha: number;
}

/** 时间相位节点（秒） */
const T_DRIP_END = 1.4; // 滴管 + 液滴下落结束
const T_FILL_END = 2.6; // 液面填充结束
const T_RIPPLE_START = 1.38; // 涟漪触发点

/** 缓动 · easeOutCubic */
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
/** 缓动 · easeInOutQuad */
const easeInOutQuad = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export default function CocktailRevealStage({
  fusion,
  size = 360,
}: CocktailRevealStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const fusionRef = useRef(fusion);
  fusionRef.current = fusion;
  // 黑胶播放器 · 默认旋转（氛围音乐）
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const start = performance.now();

    // ── 日志基础设施 · 排查渲染卡顿 ──
    // logState 跟踪上一次记录的相位/子事件，只在变化时输出，避免每帧刷屏
    const logState = {
      lastPhase: '' as string,
      lastDripSub: '' as string,
      rippleLogged: false,
      rippleStartTime: 0,
      rippleSecondTriggered: false,
      fpsFrames: 0,
      fpsLastNow: start,
      lastFrameNow: start,
      maxFrameDelta: 0,
    };
    const log = (event: string, data?: unknown) => {
      const ts = (performance.now() - start) / 1000;
      console.log(
        `%c[RevealStage] ${ts.toFixed(3)}s ${event}`,
        'color:#f0c674;font-weight:bold',
        data ?? '',
      );
    };
    log('挂载 · RAF 启动', { size, dpr, fusion: fusionRef.current.name });
    // 酒杯几何 · 马天尼杯（倒三角）
    const cx = size / 2;
    const cupTop = size * 0.16; // 杯口 y
    const cupBottom = size * 0.56; // 杯底 y
    const cupTopR = size * 0.32; // 杯口半径
    const cupBottomR = size * 0.035; // 杯底半径
    const stemBottom = size * 0.8; // 杯柄底
    const baseR = size * 0.16; // 杯座半径

    // 液面最终位置（略低于杯口）
    const liquidTopFinal = cupTop + (cupBottom - cupTop) * 0.16;

    // 分子粒子预生成 · 固定数量避免抖动
    const MOLECULES = 22;
    const molecules: MoleculeParticle[] = Array.from({ length: MOLECULES }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.2 + Math.random() * 0.7,
      speed: 0.1 + Math.random() * 0.25,
      size: 0.6 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
    }));

    // 干冰雾气粒子池
    const mistPool: MistParticle[] = [];
    const spawnMist = () => {
      mistPool.push({
        x: (Math.random() - 0.5) * cupTopR * 1.3,
        y: 0,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.25 - Math.random() * 0.5,
        size: 2 + Math.random() * 4,
        life: 1,
        maxLife: 1.4 + Math.random() * 1.4,
      });
    };

    // 固态冰块 · 预定义位置
    const iceCubes = [
      { x: -0.35, y: 0.12, s: 6, rot: 0.5 },
      { x: 0.28, y: 0.2, s: 5, rot: -0.4 },
      { x: 0.05, y: 0.45, s: 4.5, rot: 0.3 },
    ];

    // 涟漪池
    const ripples: Ripple[] = [];

    // 滴管几何 · 顶部正中央
    const dropperRestY = cupTop - size * 0.16; // 滴管停留位置
    const dropperStartY = -size * 0.05; // 滴管入场起点（画布外）

    const render = (now: number) => {
      const t = (now - start) / 1000;
      const f = fusionRef.current;
      ctx.clearRect(0, 0, size, size);

      // ── 帧间隔监控 · 检测掉帧/卡顿 ──
      const frameDelta = now - logState.lastFrameNow;
      logState.lastFrameNow = now;
      if (frameDelta > logState.maxFrameDelta) logState.maxFrameDelta = frameDelta;
      logState.fpsFrames++;
      if (now - logState.fpsLastNow >= 1000) {
        const fps = (logState.fpsFrames * 1000) / (now - logState.fpsLastNow);
        const sample = {
          fps: +fps.toFixed(1),
          maxFrameDelta: +logState.maxFrameDelta.toFixed(1) + 'ms',
          mist: mistPool.length,
          ripples: ripples.length,
          t: +t.toFixed(2) + 's',
        };
        if (fps < 50) {
          console.warn(`%c[RevealStage] 性能告警 ${sample.t} · FPS ${sample.fps}`, 'color:#e06552', sample);
        } else {
          console.log(`%c[RevealStage] 性能采样 ${sample.t}`, 'color:#9b7bd4', sample);
        }
        logState.fpsFrames = 0;
        logState.fpsLastNow = now;
        logState.maxFrameDelta = 0;
      }

      // 相位判断
      const isDrip = t < T_DRIP_END;
      const isFill = t >= T_DRIP_END && t < T_FILL_END;
      const isReveal = t >= T_FILL_END;

      // ── 相位切换日志 · 只在进入新相位时输出一次 ──
      const phaseNow = isDrip ? 'drip' : isFill ? 'fill' : 'reveal';
      if (phaseNow !== logState.lastPhase) {
        const prev = logState.lastPhase || 'init';
        logState.lastPhase = phaseNow;
        if (phaseNow === 'drip') {
          log(`相位 ${prev} → drip · 滴管入场开始`, { fusion: f.name, primary: f.primaryColor });
        } else if (phaseNow === 'fill') {
          log(`相位 drip → fill · 液面填充+分子渐入`, { liquidTopFinal: +liquidTopFinal.toFixed(1) });
        } else if (phaseNow === 'reveal') {
          log(`相位 fill → reveal · 进入稳定循环 · 冰块+干冰激活`, {
            molecules: MOLECULES,
            iceCubes: iceCubes.length,
          });
        }
      }

      // ── ① 杯垫光晕（最底层） ──
      const coasterY = stemBottom + size * 0.05;
      const coasterPulse = 0.45 + Math.sin(t * 0.9) * 0.15;
      const coasterGrad = ctx.createRadialGradient(cx, coasterY, 0, cx, coasterY, baseR * 2.4);
      coasterGrad.addColorStop(0, hexToRgba(f.primaryColor, 0.32 * coasterPulse));
      coasterGrad.addColorStop(0.5, hexToRgba(f.accentColor, 0.16 * coasterPulse));
      coasterGrad.addColorStop(1, hexToRgba(f.primaryColor, 0));
      ctx.fillStyle = coasterGrad;
      ctx.beginPath();
      ctx.ellipse(cx, coasterY, baseR * 2.4, baseR * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      // 杯垫金线
      ctx.strokeStyle = 'rgba(240, 198, 116, 0.3)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(cx, coasterY, baseR * 1.9, baseR * 0.44, 0, 0, Math.PI * 2);
      ctx.stroke();

      // ── ② 酒杯轮廓 · 倒三角杯身 + 杯柄 + 杯座 ──
      ctx.strokeStyle = 'rgba(240, 198, 116, 0.5)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx - cupTopR, cupTop);
      ctx.lineTo(cx + cupTopR, cupTop);
      ctx.lineTo(cx + cupBottomR, cupBottom);
      ctx.lineTo(cx - cupBottomR, cupBottom);
      ctx.closePath();
      ctx.stroke();
      // 杯柄
      ctx.beginPath();
      ctx.moveTo(cx, cupBottom);
      ctx.lineTo(cx, stemBottom);
      ctx.stroke();
      // 杯座
      ctx.beginPath();
      ctx.ellipse(cx, stemBottom, baseR, baseR * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();

      // ── ③ 液态酒液 · 渐变 + sin 晃动 ──
      // fill 阶段液面从 cupBottom 上升到 liquidTopFinal
      let liquidTop = liquidTopFinal;
      let liquidAlpha = 1;
      if (isDrip) {
        // 滴管阶段 · 酒杯为空
        liquidTop = cupBottom;
        liquidAlpha = 0;
      } else if (isFill) {
        const fillProgress = easeOutCubic((t - T_DRIP_END) / (T_FILL_END - T_DRIP_END));
        liquidTop = cupBottom + (liquidTopFinal - cupBottom) * (1 - fillProgress);
        liquidAlpha = Math.min(1, fillProgress * 1.5);
      }

      if (liquidAlpha > 0.01) {
        const sway = Math.sin(t * 1.2) * 1.6 * (isReveal ? 1 : 0.3);
        const liquidTopR =
          cupTopR - (cupTopR - cupBottomR) * ((liquidTop - cupTop) / (cupBottom - cupTop));
        const liquidGrad = ctx.createLinearGradient(cx, liquidTop, cx, cupBottom);
        liquidGrad.addColorStop(0, hexToRgba(f.accentColor, 0.55 * liquidAlpha));
        liquidGrad.addColorStop(0.6, hexToRgba(f.primaryColor, 0.6 * liquidAlpha));
        liquidGrad.addColorStop(1, hexToRgba(f.primaryColor, 0.42 * liquidAlpha));
        ctx.fillStyle = liquidGrad;
        ctx.beginPath();
        ctx.moveTo(cx - liquidTopR + sway, liquidTop);
        ctx.quadraticCurveTo(cx, liquidTop - 2.5, cx + liquidTopR + sway, liquidTop);
        ctx.lineTo(cx + cupBottomR, cupBottom);
        ctx.lineTo(cx - cupBottomR, cupBottom);
        ctx.closePath();
        ctx.fill();

        // ── ④ 分子粒子 · 裁剪到酒液区域 · fill 阶段 alpha 渐入 ──
        const moleculeAlpha = isFill ? Math.min(1, (t - T_DRIP_END) / 0.8) : isReveal ? 1 : 0;
        if (moleculeAlpha > 0.01) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx - liquidTopR, liquidTop);
          ctx.lineTo(cx + liquidTopR, liquidTop);
          ctx.lineTo(cx + cupBottomR, cupBottom);
          ctx.lineTo(cx - cupBottomR, cupBottom);
          ctx.closePath();
          ctx.clip();

          for (const m of molecules) {
            const angle = m.angle + t * m.speed * 0.3;
            const yRatio = 0.15 + m.radius * 0.75;
            const py =
              liquidTop + (cupBottom - liquidTop) * yRatio + Math.sin(t * m.speed + m.phase) * 3;
            const rAtY = liquidTopR - (liquidTopR - cupBottomR) * yRatio;
            const px = cx + Math.cos(angle) * rAtY * 0.72;
            const pAlpha =
              (0.5 + Math.sin(t * m.speed * 2 + m.phase) * 0.3) * 0.85 * moleculeAlpha;
            ctx.beginPath();
            ctx.arc(px, py, m.size, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(m.size > 1.2 ? f.accentColor : f.primaryColor, pAlpha);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // ── ⑤ 固态冰块 · 半透明白方（reveal 阶段才显现） ──
      const iceAlpha = isReveal ? Math.min(1, (t - T_FILL_END) / 0.5) : 0;
      if (iceAlpha > 0.01) {
        for (const ice of iceCubes) {
          const ix = cx + ice.x * cupTopR;
          const iy = liquidTopFinal + (cupBottom - liquidTopFinal) * ice.y;
          const s = ice.s;
          ctx.save();
          ctx.translate(ix, iy);
          ctx.rotate(ice.rot);
          ctx.fillStyle = hexToRgba('#ffffff', 0.1 * iceAlpha);
          ctx.strokeStyle = hexToRgba(f.accentColor, 0.38 * iceAlpha);
          ctx.lineWidth = 0.6;
          ctx.fillRect(-s, -s, s * 2, s * 2);
          ctx.strokeRect(-s, -s, s * 2, s * 2);
          ctx.restore();
        }
      }

      // ── ⑥ 气态干冰雾气 · 杯口向上飘散（仅 reveal 阶段） ──
      if (isReveal) {
        if (Math.random() < 0.45) spawnMist();
        if (Math.random() < 0.12) {
          spawnMist();
          spawnMist();
        }
      }

      for (let i = mistPool.length - 1; i >= 0; i--) {
        const p = mistPool[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.995;
        p.life -= 0.016 / p.maxLife;
        if (p.life <= 0 || p.y < -cupTop) {
          mistPool.splice(i, 1);
          continue;
        }
        const px = cx + p.x;
        const py = cupTop + p.y;
        const alpha = p.life * 0.22 * Math.max(0, 1 - Math.abs(p.y) / cupTop);
        ctx.beginPath();
        ctx.arc(px, py, p.size * (1.6 - p.life * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(f.accentColor, Math.max(0, alpha));
        ctx.fill();
      }

      // ── ⑦ 杯口金线高光 ──
      ctx.strokeStyle = 'rgba(240, 198, 116, 0.7)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - cupTopR, cupTop);
      ctx.lineTo(cx + cupTopR, cupTop);
      ctx.stroke();

      // ── ⑧ 滴管入场动画（drip 阶段） ──
      if (isDrip) {
        // 滴管下移：0 ~ 0.6s 从 dropperStartY 移到 dropperRestY
        const moveProgress = easeInOutQuad(Math.min(1, t / 0.6));
        const dropperY = dropperStartY + (dropperRestY - dropperStartY) * moveProgress;
        const dropperAlpha = Math.min(1, t / 0.3); // 0.3s 内淡入

        // 滴管几何 · 上方圆柱 + 下方玻璃球 + 滴尖
        const tubeW = size * 0.022;
        const tubeH = size * 0.14;
        const bulbR = size * 0.03;
        const dropperX = cx;

        // 滴管整体淡入
        ctx.save();
        ctx.globalAlpha = dropperAlpha;

        // 玻璃管 · 半透明白
        ctx.fillStyle = hexToRgba('#ffffff', 0.12);
        ctx.strokeStyle = 'rgba(240, 198, 116, 0.55)';
        ctx.lineWidth = 0.8;
        // 圆柱
        ctx.fillRect(dropperX - tubeW / 2, dropperY - tubeH, tubeW, tubeH);
        ctx.strokeRect(dropperX - tubeW / 2, dropperY - tubeH, tubeW, tubeH);
        // 玻璃球
        ctx.beginPath();
        ctx.arc(dropperX, dropperY, bulbR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 滴尖 · 短细锥
        ctx.beginPath();
        ctx.moveTo(dropperX - tubeW * 0.6, dropperY + bulbR * 0.5);
        ctx.lineTo(dropperX, dropperY + bulbR * 1.4);
        ctx.lineTo(dropperX + tubeW * 0.6, dropperY + bulbR * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 滴管内液柱 · 主色
        const liquidColumnH = tubeH * 0.55;
        ctx.fillStyle = hexToRgba(f.primaryColor, 0.7);
        ctx.fillRect(
          dropperX - tubeW / 2 + 1,
          dropperY - liquidColumnH,
          tubeW - 2,
          liquidColumnH,
        );

        // 液滴形成 + 下落（0.6 ~ 1.4s）
        if (t > 0.6) {
          if (logState.lastDripSub !== 'dropper_ready') {
            logState.lastDripSub = 'dropper_ready';
            log('滴管就位 · 开始形成液滴', { dropperY: +dropperY.toFixed(1) });
          }
          const dripT = t - 0.6; // 0 ~ 0.8s
          const DROP_FALL_START = 0.5; // 0.5s 后液滴开始下落
          const DROP_FALL_DURATION = 0.3; // 下落持续 0.3s
          const dropStartY = dropperY + bulbR * 1.4;
          const dropEndY = cupTop - 1;

          if (dripT < DROP_FALL_START) {
            // 液滴形成 · 体积从 0 增大到完整
            if (logState.lastDripSub !== 'forming') {
              logState.lastDripSub = 'forming';
              log('液滴形成中 · 体积渐增', { duration: DROP_FALL_START + 's' });
            }
            const formProgress = dripT / DROP_FALL_START;
            const dropR = size * 0.018 * easeOutCubic(formProgress);
            const dropY = dropStartY + dropR * 0.3;
            ctx.beginPath();
            ctx.arc(dropperX, dropY, dropR, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(f.primaryColor, 0.9);
            ctx.fill();
            // 高光
            ctx.fillStyle = hexToRgba(f.accentColor, 0.6);
            ctx.beginPath();
            ctx.arc(dropperX - dropR * 0.3, dropY - dropR * 0.3, dropR * 0.35, 0, Math.PI * 2);
            ctx.fill();
          } else if (dripT < DROP_FALL_START + DROP_FALL_DURATION) {
            // 液滴下落 · 重力加速
            if (logState.lastDripSub !== 'falling') {
              logState.lastDripSub = 'falling';
              log('液滴下落 · 重力加速', { from: +dropStartY.toFixed(1), to: +dropEndY.toFixed(1) });
            }
            const fallProgress = (dripT - DROP_FALL_START) / DROP_FALL_DURATION;
            const fallEase = fallProgress * fallProgress; // easeInQuad 模拟重力
            const dropY = dropStartY + (dropEndY - dropStartY) * fallEase;
            const dropR = size * 0.018 * (1 + fallProgress * 0.2); // 略微拉长
            // 拖尾
            ctx.fillStyle = hexToRgba(f.primaryColor, 0.25);
            ctx.beginPath();
            ctx.ellipse(
              dropperX,
              dropY - dropR * 1.5,
              dropR * 0.5,
              dropR * 1.8,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            // 液滴本体
            ctx.beginPath();
            ctx.arc(dropperX, dropY, dropR, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(f.primaryColor, 0.92);
            ctx.fill();
            // 高光
            ctx.fillStyle = hexToRgba(f.accentColor, 0.55);
            ctx.beginPath();
            ctx.arc(dropperX - dropR * 0.3, dropY - dropR * 0.3, dropR * 0.32, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      // ── ⑨ 涟漪扩散 · 液滴入水后触发（基于时间 · 避免 setTimeout 残留导致并发泄漏）──
      if (t >= T_RIPPLE_START && !logState.rippleLogged) {
        logState.rippleLogged = true;
        logState.rippleStartTime = t;
        logState.rippleSecondTriggered = false;
        logState.lastDripSub = 'landed';
        log('液滴入水 · 涟漪触发', { at: +t.toFixed(3) + 's', cupTop: +cupTop.toFixed(1) });
        // 第一圈涟漪
        ripples.push({ r: 0, alpha: 0.7 });
      }
      // 第二圈涟漪 · 基于时间偏移触发（重挂载时自动重置 · 无 setTimeout 残留）
      if (
        logState.rippleStartTime > 0 &&
        !logState.rippleSecondTriggered &&
        t - logState.rippleStartTime >= 0.12
      ) {
        logState.rippleSecondTriggered = true;
        ripples.push({ r: 0, alpha: 0.5 });
      }

      // 涟漪渲染 · 仅在液面之上
      if (ripples.length > 0 && liquidAlpha > 0.01) {
        const liquidTopR =
          cupTopR - (cupTopR - cupBottomR) * ((liquidTop - cupTop) / (cupBottom - cupTop));
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.r += 0.9;
          r.alpha -= 0.012;
          if (r.alpha <= 0) {
            ripples.splice(i, 1);
            continue;
          }
          ctx.strokeStyle = hexToRgba(f.accentColor, r.alpha);
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.ellipse(cx, liquidTop, r.r, r.r * 0.32, 0, 0, Math.PI * 2);
          ctx.stroke();
          // 限制不超过液面宽度
          if (r.r > liquidTopR * 1.4) {
            ripples.splice(i, 1);
          }
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      const elapsed = (performance.now() - start) / 1000;
      console.log(
        `%c[RevealStage] ${elapsed.toFixed(3)}s 卸载 · RAF 取消`,
        'color:#9b7bd4;font-weight:bold',
        { finalPhase: logState.lastPhase, finalDripSub: logState.lastDripSub },
      );
      cancelAnimationFrame(rafRef.current);
    };
  }, [size]);

  // 黑胶尺寸 · 约为酒杯画布的 28%
  const vinylSize = size * 0.28;

  return (
    <div className="relative flex flex-col items-center animate-fade-in" style={{ width: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        aria-label="酒款展示"
        role="img"
      />
      {/* 文字信息层 */}
      <div className="mt-1 text-center">
        <div className="font-display text-2xl text-gold-sheen text-shadow-glow-gold">
          {fusion.name}
        </div>
        <div className="text-xs text-moon-200/60 italic mt-1.5">{fusion.subtitle}</div>
        <div
          className="mt-2.5 text-sm font-mono tracking-[0.2em]"
          style={{ color: fusion.primaryColor }}
        >
          匹配度 {fusion.matchScore} · {fusion.fusionLabel}
        </div>
      </div>

      {/* 黑胶胶片氛围播放器 · 替代原占位符 */}
      <div className="mt-5 flex items-center justify-center gap-4">
        {/* 黑胶本体 + 唱臂 */}
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? '暂停氛围音乐' : '播放氛围音乐'}
          className="relative flex-shrink-0 cursor-pointer"
          style={{ width: vinylSize, height: vinylSize }}
        >
          {/* 黑胶胶片 · 纹路 + 反光 + 旋转 */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 32% 28%, rgba(255,255,255,0.10) 0%, transparent 38%),
                repeating-radial-gradient(circle at center, #1c1c1c 0px, #1c1c1c 1px, #050505 2px, #050505 3px)
              `,
              animation: isPlaying ? 'vinyl-spin 4s linear infinite' : 'none',
              boxShadow: `0 0 18px ${fusion.primaryColor}40, inset 0 0 22px rgba(0,0,0,0.7)`,
              border: '1px solid rgba(240, 198, 116, 0.25)',
            }}
          >
            {/* 中央标签 · fusion 主色 */}
            <div
              className="absolute rounded-full flex items-center justify-center"
              style={{
                width: '42%',
                height: '42%',
                top: '29%',
                left: '29%',
                background: `linear-gradient(135deg, ${fusion.accentColor} 0%, ${fusion.primaryColor} 100%)`,
                boxShadow: `inset 0 0 6px rgba(0,0,0,0.3), 0 0 8px ${fusion.primaryColor}55`,
              }}
            >
              <span
                className="font-display text-[9px] tracking-[0.18em] text-white/90"
                style={{ textShadow: '0 0 4px rgba(0,0,0,0.5)' }}
              >
                Y.Mine
              </span>
            </div>
            {/* 中心孔 */}
            <div
              className="absolute rounded-full bg-black"
              style={{ width: '5%', height: '5%', top: '47.5%', left: '47.5%' }}
            />
          </div>

          {/* 唱臂 · 右上方底座 · 旋转中心在底座 */}
          <div
            className="absolute"
            style={{
              top: '-6%',
              right: '-8%',
              width: vinylSize * 0.55,
              height: 3,
              transformOrigin: 'right center',
              transform: `rotate(${isPlaying ? -22 : -48}deg)`,
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
            }}
          >
            {/* 唱臂主体 · 金色渐变细条 */}
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, rgba(240,198,116,0.3) 0%, rgba(240,198,116,0.85) 80%, rgba(240,198,116,1) 100%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
            />
            {/* 底座 · 右端金色圆球 */}
            <div
              className="absolute rounded-full"
              style={{
                right: -5,
                top: -3.5,
                width: 10,
                height: 10,
                background: 'radial-gradient(circle at 30% 30%, #f5d68a 0%, #a8842f 100%)',
                boxShadow: '0 0 6px rgba(240,198,116,0.5)',
              }}
            />
            {/* 针尖 · 左端小三角 */}
            <div
              className="absolute"
              style={{
                left: -1,
                top: -2,
                width: 0,
                height: 0,
                borderLeft: '3px solid transparent',
                borderRight: '3px solid transparent',
                borderTop: '5px solid rgba(240,198,116,0.95)',
              }}
            />
          </div>

          {/* 播放/暂停状态光晕 · 主色脉动 */}
          {isPlaying && (
            <span
              className="absolute inset-0 rounded-full pointer-events-none animate-ping-slow"
              style={{ border: `1px solid ${fusion.primaryColor}40` }}
            />
          )}
        </button>

        {/* 曲目信息 */}
        <div className="text-left">
          <div className="text-[9px] tracking-[0.35em] text-moon-200/40 font-mono uppercase">
            Ambient
          </div>
          <div
            className="font-display text-sm tracking-[0.08em] mt-0.5"
            style={{ color: fusion.primaryColor }}
          >
            {fusion.name}·夜曲
          </div>
          <div className="text-[10px] text-moon-200/45 italic mt-0.5">
            {isPlaying ? '♪ 旋转中' : '❙❙ 已停'}
          </div>
        </div>
      </div>

      {/* 黑胶旋转 keyframes · 组件内注入避免污染全局 */}
      <style>{`
        @keyframes vinyl-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
