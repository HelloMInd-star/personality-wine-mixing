/**
 * GalaxyConstellation · 入口星系动画
 *
 * PersonalityPage 封面态的视觉主体 · 22 颗星体环绕中央种子：
 *   - 4 条轨道环按四元素分组（火内 → 水外）· 各环缓慢自转
 *   - 每颗星体 = 一张大阿尔卡纳 ↔ 一个星体 / 星座
 *   - 圆形发光 · 呼吸 twinkle · hover 高亮 + 符号显现
 *   - 点击星体 → 揭示对应塔罗牌（modal 卡片 · 正逆位可切换）
 *
 * 视觉语言：深空紫金 + 元素派色 + 磨砂玻璃 · 与项目一致
 * 工程约定：单 Canvas + RAF · DPR 适配 · 卸载取消 RAF · hex 颜色（addColorStop 用 rgba）
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  TAROT_ASTRO_MAP,
  type TarotAstroEntry,
} from '../../data/tarotAstroMap';
import { deriveTarotCard } from '../../data/cardCustomization';

interface HoverState {
  entry: TarotAstroEntry;
  x: number;
  y: number;
}

interface SelectedState {
  entry: TarotAstroEntry;
  reversed: boolean;
}

interface StarPos {
  entry: TarotAstroEntry;
  x: number;
  y: number;
  r: number;
}

/** hex → rgba · 仅 #rrggbb · 与全局约定一致 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

export default function GalaxyConstellation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const entriesRef = useRef<TarotAstroEntry[]>(TAROT_ASTRO_MAP);
  const hoverRef = useRef<HoverState | null>(null);
  const sizeRef = useRef(480);
  const positionsRef = useRef<StarPos[]>([]);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [selected, setSelected] = useState<SelectedState | null>(null);
  const selectedRef = useRef<SelectedState | null>(null);
  selectedRef.current = selected;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const size = Math.max(260, Math.min(rect.width, rect.height));
      sizeRef.current = size;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const start = performance.now();

    const draw = (now: number) => {
      const size = sizeRef.current;
      const cx = size / 2;
      const cy = size / 2;
      const t = (now - start) / 1000;

      ctx.clearRect(0, 0, size, size);

      // ── 背景星尘 · 缓慢漂移 + twinkle ──
      ctx.save();
      for (let i = 0; i < 64; i++) {
        const a = (i * 137.5) * (Math.PI / 180);
        const rad = (size / 2) * (0.25 + 0.75 * ((i * 13) % 100) / 100);
        const x = cx + Math.cos(a + t * 0.02) * rad;
        const y = cy + Math.sin(a + t * 0.02) * rad;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.8 + i));
        ctx.globalAlpha = 0.18 * tw;
        ctx.fillStyle = '#e8e0ff';
        ctx.beginPath();
        ctx.arc(x, y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ── 4 条轨道环 ──
      const ringCount = 4;
      const baseR = size * 0.13;
      const ringGap = (size / 2 - baseR - 10) / (ringCount - 1);
      const ringRadii = [0, 1, 2, 3].map((i) => baseR + i * ringGap);

      ctx.save();
      ctx.lineWidth = 1;
      for (let i = 0; i < ringCount; i++) {
        ctx.strokeStyle = 'rgba(155, 123, 212, 0.12)';
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadii[i], 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // ── 中央种子 · 呼吸光晕 ──
      const corePulse = 0.6 + 0.4 * Math.sin(t * 0.9);
      const coreR = size * 0.045;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3.2);
      coreGrad.addColorStop(0, `rgba(240, 198, 116, ${0.9 * corePulse})`);
      coreGrad.addColorStop(0.4, 'rgba(240, 198, 116, 0.22)');
      coreGrad.addColorStop(1, 'rgba(240, 198, 116, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f0c674';
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // ── 22 颗星体 ──
      const positions: StarPos[] = [];
      // 各环自转速度 · 内环快外环慢 · 视觉像太阳系
      const ringSpeed = [0.05, 0.038, 0.026, 0.016];
      const hoveredId = hoverRef.current?.entry.tarotId;
      const selectedId = selectedRef.current?.entry.tarotId;

      for (const entry of entriesRef.current) {
        const ringR = ringRadii[entry.ring];
        const ang = entry.angle + t * ringSpeed[entry.ring];
        const x = cx + Math.cos(ang) * ringR;
        const y = cy + Math.sin(ang) * ringR;
        const isHover = hoveredId === entry.tarotId;
        const isSelected = selectedId === entry.tarotId;
        const twinkle = 0.7 + 0.3 * Math.sin(t * 1.6 + entry.tarotId);
        const dotR = isHover || isSelected ? 6.5 : 4.5;
        const glowR = (isHover || isSelected ? 18 : 11) * twinkle;

        // 光晕
        const grad = ctx.createRadialGradient(x, y, 0, x, y, glowR);
        grad.addColorStop(0, hexToRgba(entry.color, 0.85 * twinkle));
        grad.addColorStop(0.5, hexToRgba(entry.color, 0.28));
        grad.addColorStop(1, hexToRgba(entry.color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // 实心星点 · hover/选中时偏暖白
        ctx.fillStyle = isHover || isSelected ? '#fff8e0' : entry.color;
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fill();

        // hover/选中时显现符号
        if (isHover || isSelected) {
          ctx.fillStyle = '#1a1024';
          ctx.font = 'bold 9px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(entry.symbol, x, y + 0.5);
        }

        positions.push({ entry, x, y, r: glowR });
      }

      positionsRef.current = positions;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  // 命中检测 · 命中则高亮 + tooltip
  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found: HoverState | null = null;
    for (const p of positionsRef.current) {
      if (Math.hypot(p.x - mx, p.y - my) <= p.r) {
        found = { entry: p.entry, x: p.x, y: p.y };
        break;
      }
    }
    hoverRef.current = found;
    setHover(found);
    canvas.style.cursor = found ? 'pointer' : 'default';
  }, []);

  const handleLeave = useCallback(() => {
    hoverRef.current = null;
    setHover(null);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = 'default';
  }, []);

  const handleClick = useCallback(() => {
    const h = hoverRef.current;
    if (!h) return;
    setSelected({ entry: h.entry, reversed: false });
  }, []);

  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={handleClick}
        className="w-full aspect-square"
      />

      {/* hover tooltip · 牌名 · 星体名 */}
      {hover && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full glass-gold border border-gold-400/40 rounded-lg px-3 py-1.5 text-[10px] tracking-widest whitespace-nowrap"
          style={{ left: hover.x, top: hover.y - 14 }}
        >
          <span className="font-display text-gold-sheen">{hover.entry.tarotName}</span>
          <span className="text-amethyst-300/60 mx-1.5">·</span>
          <span className="text-moon-200/80">{hover.entry.celestialName}</span>
        </div>
      )}

      {/* 选中 → 塔罗牌卡片揭示 */}
      {selected && (
        <TarotCardModal
          entry={selected.entry}
          reversed={selected.reversed}
          onToggleReversed={() =>
            setSelected((s) => (s ? { ...s, reversed: !s.reversed } : s))
          }
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* ============================================================
   塔罗牌揭示卡片 · 复用 deriveTarotCard 派生牌义 + 元素派色
   ============================================================ */

interface TarotCardModalProps {
  entry: TarotAstroEntry;
  reversed: boolean;
  onToggleReversed: () => void;
  onClose: () => void;
}

function TarotCardModal({
  entry,
  reversed,
  onToggleReversed,
  onClose,
}: TarotCardModalProps) {
  const spec = deriveTarotCard(entry.tarotId, reversed);
  const title = reversed ? `${spec.name}·逆` : spec.name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void-900/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            width: 220,
            height: 330,
            background: `linear-gradient(180deg, ${hexToRgba(entry.color, 0.45)} 0%, #15102e 50%, #070414 100%)`,
            border: '1px solid rgba(240, 198, 116, 0.6)',
            boxShadow: `0 12px 48px ${hexToRgba(entry.color, 0.4)}, 0 0 32px ${hexToRgba(entry.color, 0.25)}`,
          }}
        >
          {/* 顶部金线 */}
          <div
            className="absolute top-2.5 left-1/2 -translate-x-1/2 h-px w-2/3"
            style={{ background: 'linear-gradient(90deg, transparent, #f0c674, transparent)' }}
          />
          {/* 角落符号 + 星体名 */}
          <div className="absolute top-3 left-3 text-gold-sheen/80 font-display text-lg">
            {entry.symbol}
          </div>
          <div className="absolute top-3.5 right-3 text-gold-sheen/60 font-mono text-[9px] tracking-widest">
            {entry.celestialName}
          </div>

          {/* 中央标题 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-3">
            <div
              className="font-display text-3xl font-bold tracking-wider"
              style={{ color: entry.color }}
            >
              {title}
            </div>
            <div
              className="mx-auto mt-2 h-px w-2/5"
              style={{ background: spec.accent, opacity: 0.7 }}
            />
            <div className="mt-3 text-gold-sheen/90 font-display text-xs italic">
              {spec.nameEn}
            </div>
            <div className="mt-1 text-[10px] text-moon-200/50 tracking-widest">
              {spec.element} · {entry.celestialType === 'planet' ? '行星' : '星座'}
            </div>
          </div>

          {/* 牌义 */}
          <div className="absolute bottom-12 left-0 right-0 text-center text-[10px] text-moon-200/70 italic px-4 leading-relaxed">
            {spec.meaning}
          </div>

          {/* 底部金线 */}
          <div
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 h-px w-2/5"
            style={{ background: 'linear-gradient(90deg, transparent, #f0c674aa, transparent)' }}
          />
        </div>

        {/* 控件 · 正逆位切换 + 收起 */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={onToggleReversed}
            className="glass border border-amethyst-500/30 rounded-full px-4 py-1.5 text-[11px] text-moon-200/80 hover:border-gold-400/50 hover:text-gold-sheen transition-colors tracking-widest"
          >
            {reversed ? '切回正位' : '查看逆位'}
          </button>
          <button
            onClick={onClose}
            className="text-moon-200/50 hover:text-gold-sheen transition-colors text-[11px] tracking-widest"
          >
            ✕ 收起
          </button>
        </div>
      </div>
    </div>
  );
}
