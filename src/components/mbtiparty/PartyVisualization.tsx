/**
 * PartyVisualization · 酒局主场景（半俯视 Canvas 可视化）
 *
 * 渲染分层：
 *   Canvas 底层
 *     ① 中央酒桌椭圆 · 半俯视透视
 *     ② 中央联合酒体光晕 · 多色融合
 *     ③ 4 座位酒杯光晕 · 按 MBTI 主色
 *     ④ 气味粒子系统 · 彩色分子粒子慢速浮动 + 旋转
 *
 *   HTML 叠加层
 *     ⑤ 4 座位玩家卡片 · 头像位 + MBTI 标签 + 角色标签 + 酒体名
 *     ⑥ 中央回合指示 · 当前轮到谁
 *     ⑦ 中央联合酒体结果 · 揭示阶段
 *
 * 粒子色映射：每座位独立粒子环 · 颜色来自玩家 MBTI 主色
 * 性能：DPR 适配 · RAF 单循环 · seats 通过 ref 读取避免重启
 */

import { useEffect, useRef } from 'react';
import type { PartySeat, FusionCocktail, TurnInfo, PartyPhase } from '../../types/mbtiParty';
import { SEAT_POSITIONS, getMbtiProfile, PARTY_ROLE_META } from '../../data/mbtiPartyData';

export interface PartyVisualizationProps {
  seats: PartySeat[];
  phase: PartyPhase;
  turn: TurnInfo | null;
  fusion: FusionCocktail | null;
  /** 当前用户选择的调酒步骤触发的临时粒子色 */
  activeParticleColor?: string;
  size?: number;
}

/** hex → rgba */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

/** 单个座位的粒子预生成结构 */
interface RingParticle {
  /** 在座位环中的角度 */
  angle: number;
  /** 半径占比 0-1 · 相对该座位的粒子环半径 */
  radius: number;
  size: number;
  phase: number;
  speed: number;
}

export default function PartyVisualization({
  seats,
  phase,
  turn,
  fusion,
  activeParticleColor,
  size = 520,
}: PartyVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  // 通过 ref 读取 · 避免 seats 变化重启 RAF
  const seatsRef = useRef(seats);
  seatsRef.current = seats;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const fusionRef = useRef(fusion);
  fusionRef.current = fusion;
  const activeColorRef = useRef(activeParticleColor);
  activeColorRef.current = activeParticleColor;

  // 每座位独立粒子环 · 固定 18 粒子
  const PARTICLES_PER_SEAT = 18;
  const particlesRef = useRef<RingParticle[][]>(
    Array.from({ length: 4 }, () =>
      Array.from({ length: PARTICLES_PER_SEAT }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 0.5 + Math.random() * 0.4,
        size: 0.8 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.2,
      })),
    ),
  );

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

    const render = (now: number) => {
      const t = (now - start) / 1000;
      const currentSeats = seatsRef.current;
      const currentPhase = phaseRef.current;
      const currentFusion = fusionRef.current;
      const cx = size / 2;
      const cy = size / 2;
      // 中央酒桌 · 半俯视椭圆
      const tableRx = size * 0.32;
      const tableRy = size * 0.2;
      // 座位酒杯环半径
      const seatRingR = size * 0.36;

      ctx.clearRect(0, 0, size, size);

      // ── ① 中央酒桌椭圆 · 半俯视 ──
      // 桌面渐变 · 紫金基底
      const tableGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, tableRx);
      tableGrad.addColorStop(0, 'rgba(124, 95, 191, 0.22)');
      tableGrad.addColorStop(0.6, 'rgba(45, 27, 78, 0.32)');
      tableGrad.addColorStop(1, 'rgba(15, 8, 40, 0.0)');
      ctx.fillStyle = tableGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, tableRx, tableRy, 0, 0, Math.PI * 2);
      ctx.fill();

      // 桌沿金线 · 椭圆描边
      ctx.strokeStyle = 'rgba(240, 198, 116, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, tableRx, tableRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 桌沿内侧细紫线
      ctx.strokeStyle = 'rgba(124, 95, 191, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(cx, cy, tableRx * 0.92, tableRy * 0.88, 0, 0, Math.PI * 2);
      ctx.stroke();

      // ── ② 中央联合酒体光晕（揭示阶段） ──
      if (currentPhase === 'revealing' && currentFusion) {
        const fusionPulse = 0.6 + Math.sin(t * 1.2) * 0.2;
        const fusionGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, tableRy * 0.85);
        fusionGrad.addColorStop(0, hexToRgba(currentFusion.accentColor, 0.55 * fusionPulse));
        fusionGrad.addColorStop(0.5, hexToRgba(currentFusion.primaryColor, 0.35 * fusionPulse));
        fusionGrad.addColorStop(1, hexToRgba(currentFusion.primaryColor, 0));
        ctx.fillStyle = fusionGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, tableRx * 0.85, tableRy * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 桌面中心 · 待启状态 · 微紫光晕
        const idlePulse = 0.4 + Math.sin(t * 0.8) * 0.15;
        const idleGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, tableRy * 0.6);
        idleGrad.addColorStop(0, `rgba(216, 201, 245, ${0.18 * idlePulse})`);
        idleGrad.addColorStop(1, 'rgba(124, 95, 191, 0)');
        ctx.fillStyle = idleGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, tableRx * 0.6, tableRy * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── ③ ④ 4 座位酒杯光晕 + 气味粒子 ──
      for (let i = 0; i < 4; i++) {
        const seat = currentSeats[i];
        const pos = SEAT_POSITIONS[i];
        // 座位在画布上的坐标 · 椭圆环（半俯视压缩 y）
        const sx = cx + Math.cos(pos.angle) * seatRingR;
        const sy = cy + Math.sin(pos.angle) * seatRingR * 0.62; // y 压缩模拟俯视

        // 取该座位的粒子色 · 必须为 hex 格式（hexToRgba 只接受 hex）
        let particleColor = '#9b7bd4';
        let isActiveSeat = false;
        if (seat && !seat.isEmpty && seat.mbti) {
          const profile = getMbtiProfile(seat.mbti);
          particleColor = profile.primary;
          // 当前轮到的座位高亮
          if (turn && turn.seatIndex === i && currentPhase === 'mixing') {
            isActiveSeat = true;
          }
        }

        // 当前用户调酒时 · 临时色覆盖
        if (seat?.isCurrentUser && activeColorRef.current) {
          particleColor = activeColorRef.current;
        }

        // 酒杯光晕 · 径向渐变
        const cupPulse = isActiveSeat ? 0.6 + Math.sin(t * 3) * 0.3 : 0.4 + Math.sin(t * 0.8 + i) * 0.1;
        const cupR = size * 0.05;
        const cupGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, cupR * 2.4);
        cupGrad.addColorStop(0, hexToRgba(particleColor, 0.65 * cupPulse));
        cupGrad.addColorStop(0.5, hexToRgba(particleColor, 0.25 * cupPulse));
        cupGrad.addColorStop(1, hexToRgba(particleColor, 0));
        ctx.fillStyle = cupGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, cupR * 2.4, 0, Math.PI * 2);
        ctx.fill();

        // 酒杯本体 · 小圆点
        ctx.fillStyle = hexToRgba(particleColor, 0.85);
        ctx.beginPath();
        ctx.arc(sx, sy, cupR * 0.55, 0, Math.PI * 2);
        ctx.fill();
        // 杯沿金光
        ctx.strokeStyle = 'rgba(240, 198, 116, 0.55)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, cupR * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        // 气味粒子环 · 围绕酒杯浮动
        if (seat && !seat.isEmpty) {
          const ringR = size * 0.075;
          const particles = particlesRef.current[i];
          for (const p of particles) {
            // 粒子慢速环绕 + 径向呼吸
            const drift = Math.sin(t * p.speed + p.phase) * 0.08;
            const r = (p.radius + drift) * ringR;
            const px = sx + Math.cos(p.angle + t * p.speed * 0.3) * r;
            const py = sy + Math.sin(p.angle + t * p.speed * 0.3) * r * 0.7; // 椭圆粒子环
            const pAlpha = (0.4 + Math.sin(t * p.speed * 2 + p.phase) * 0.25) * (isActiveSeat ? 1.2 : 0.85);
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(particleColor, Math.min(0.95, pAlpha));
            ctx.fill();
            // 粒子高光
            ctx.fillStyle = hexToRgba('#ffffff', Math.min(0.4, pAlpha * 0.3));
            ctx.beginPath();
            ctx.arc(px - p.size * 0.25, py - p.size * 0.25, p.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // 空位 · 灰色虚环提示
          ctx.strokeStyle = 'rgba(155, 123, 212, 0.18)';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.arc(sx, sy, size * 0.045, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size, turn]);

  // ── HTML 叠加层 · 玩家卡片 + 回合指示 ──
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        aria-label="酒局可视化场景"
        role="img"
      />

      {/* 座位玩家卡片叠加 */}
      {seats.map((seat, i) => {
        const pos = SEAT_POSITIONS[i];
        // 椭圆环坐标 · 与 Canvas 一致
        const x = 50 + Math.cos(pos.angle) * 36;
        const y = 50 + Math.sin(pos.angle) * 22;
        // 卡片偏移方向 · 远离桌面
        const offsetX = Math.cos(pos.angle) > 0.5 ? 8 : Math.cos(pos.angle) < -0.5 ? -8 : 0;
        const offsetY = Math.sin(pos.angle) > 0.5 ? 14 : Math.sin(pos.angle) < -0.5 ? -14 : 0;

        if (seat.isEmpty) {
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ left: `${x + offsetX}%`, top: `${y + offsetY}%` }}
            >
              <div className="text-[10px] tracking-[0.3em] text-moon-200/25 font-mono">
                空 位
              </div>
            </div>
          );
        }

        const profile = seat.mbti ? getMbtiProfile(seat.mbti) : null;
        const roleMeta = seat.role ? PARTY_ROLE_META[seat.role] : null;
        const isTurn = turn && turn.seatIndex === i && phase === 'mixing';

        return (
          <div
            key={i}
            className={`absolute -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-500 ${
              isTurn ? 'scale-105' : ''
            }`}
            style={{ left: `${x + offsetX}%`, top: `${y + offsetY}%` }}
          >
            {/* 头像位 · 单字符号 */}
            <div
              className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center font-display text-base border transition-all duration-500 ${
                seat.isCurrentUser ? 'ring-2 ring-gold-400/50' : ''
              }`}
              style={{
                color: profile?.primary ?? '#d8c9f5',
                borderColor: `${profile?.primary ?? '#7c5fbf'}60`,
                background: `linear-gradient(135deg, ${profile?.primary ?? '#7c5fbf'}22 0%, ${
                  profile?.accent ?? '#7c5fbf'
                }10 100%)`,
                boxShadow: isTurn ? `0 0 14px ${profile?.primary ?? '#7c5fbf'}60` : 'none',
              }}
            >
              {profile?.symbol ?? '?'}
            </div>
            {/* MBTI 标签 */}
            <div
              className="mt-1.5 font-mono text-[10px] tracking-[0.18em]"
              style={{ color: profile?.primary ?? '#d8c9f5' }}
            >
              {seat.mbti ?? '???'} · {profile?.nickname ?? '神秘客'}
            </div>
            {/* 人格标签 · personaTag */}
            {profile?.personaTag && (
              <div
                className="text-[9px] tracking-[0.12em] opacity-80"
                style={{ color: profile?.primary ?? '#d8c9f5' }}
              >
                {profile.personaTag}
              </div>
            )}
            {/* 角色标签 */}
            {roleMeta && (
              <div className="text-[9px] text-moon-200/50 tracking-[0.1em] mt-0.5">
                {roleMeta.symbol} {roleMeta.label}
              </div>
            )}
            {/* 已完成 · 显示酒名 */}
            {seat.hasFinished && seat.cocktailName && (
              <div className="mt-1 text-[10px] text-gold-400/70 italic font-display tracking-[0.05em] max-w-[100px] mx-auto leading-tight">
                「{seat.cocktailName}」
              </div>
            )}
            {/* 当前回合指示 */}
            {isTurn && (
              <div className="mt-1 text-[9px] tracking-[0.3em] text-gold-400 font-mono animate-pulse">
                ⟡ 轮到你
              </div>
            )}
          </div>
        );
      })}

      {/* 中央回合指示 · 调酒中阶段 */}
      {phase === 'mixing' && turn && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-[10px] tracking-[0.4em] text-moon-200/40 font-mono uppercase">
            Now Turning
          </div>
          <div className="mt-1 font-display text-sm text-gold-sheen tracking-[0.15em]">
            {turn.mbtiLabel}
          </div>
          <div className="text-[10px] text-moon-200/45 tracking-[0.1em] mt-0.5">
            {turn.roleLabel}
          </div>
        </div>
      )}

      {/* 中央联合酒体揭示 · 结果阶段 */}
      {phase === 'revealing' && fusion && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none animate-fade-in">
          <div className="text-[10px] tracking-[0.4em] text-moon-200/40 font-mono uppercase">
            Fusion · 联合酒体
          </div>
          <div
            className="mt-1 font-display text-xl tracking-[0.12em]"
            style={{
              background: `linear-gradient(135deg, ${fusion.accentColor} 0%, ${fusion.primaryColor} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {fusion.name}
          </div>
          <div className="text-[11px] text-moon-200/55 italic mt-1 max-w-[200px]">
            {fusion.subtitle}
          </div>
          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-gold-400/30 bg-gold-400/[0.04]">
            <span className="text-[10px] text-gold-400/80 font-mono tracking-[0.15em]">
              匹配度 {fusion.matchScore}
            </span>
          </div>
          <div className="text-[10px] text-moon-200/40 mt-1.5 tracking-[0.1em]">
            {fusion.fusionLabel}
          </div>
        </div>
      )}

      {/* 等待加入提示 · 空桌阶段 */}
      {phase === 'waiting' && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-[10px] tracking-[0.4em] text-moon-200/30 font-mono uppercase">
            Waiting
          </div>
          <div className="mt-1 font-display text-sm text-moon-200/50 italic tracking-[0.1em]">
            夜未启 · 等一双手落下
          </div>
        </div>
      )}
    </div>
  );
}
