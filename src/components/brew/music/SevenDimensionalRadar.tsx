/**
 * SevenDimensionalRadar · 七维雷达图
 *
 * 移植自 Game-OS 音乐生成系统的七维向量可视化风格
 * 手绘 Canvas 实现 · 零外部图表库依赖
 *
 * 视觉特征：
 *   - 7 轴放射状布局，每轴带彩色标签
 *   - 3 圈阈值环（0.48 保本 / 0.50 稳态 / 0.68 熔断）
 *   - 数据多边形填充（半透明辉光）
 *   - 深空底色 · 金色中心点
 *   - 右侧图例面板
 *
 * 设计呼应 Y.Mine 紫金语系，阈值环色与 Game-OS 三基准对齐
 */

import { useEffect, useRef } from 'react';

/** 维度定义 */
export interface RadarDimension {
  key: string;
  label: string;
  /** 该维度颜色 · hex */
  color: string;
  /** 0-1 归一化值 */
  value: number;
}

export interface SevenDimensionalRadarProps {
  /** 7 个维度数据 · 按顺序排列 */
  dimensions: RadarDimension[];
  /** 画布尺寸 · 默认 340 */
  size?: number;
  /** 标题 */
  title?: string;
}

/** 三基准阈值环定义 */
const THRESHOLDS = [
  { value: 0.48, label: '0.48 · 保本', color: 'rgba(249,115,22,0.35)' },
  { value: 0.50, label: '0.50 · 稳态', color: 'rgba(34,197,94,0.35)' },
  { value: 0.68, label: '0.68 · 熔断', color: 'rgba(239,68,68,0.35)' },
] as const;

/** 绘制七维雷达图 */
function drawRadar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  dimensions: RadarDimension[],
) {
  const count = dimensions.length;
  if (count === 0) return;

  // 角度步长 · 从正上方 (-π/2) 开始顺时针
  const angleStep = (Math.PI * 2) / count;
  const startAngle = -Math.PI / 2;

  // 计算每个轴端点的坐标
  const points = dimensions.map((_, i) => {
    const angle = startAngle + angleStep * i;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });

  // ① 绘制阈值环
  ctx.save();
  for (const th of THRESHOLDS) {
    const r = radius * th.value;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = th.color;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  // ② 绘制轴线
  ctx.save();
  points.forEach((p) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = 'rgba(155,123,212,0.15)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });
  ctx.restore();

  // ③ 绘制数据多边形
  ctx.save();
  const dataPoints = dimensions.map((dim, i) => {
    const angle = startAngle + angleStep * i;
    const r = radius * Math.max(0.02, Math.min(1, dim.value));
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  if (dataPoints.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(dataPoints[0].x, dataPoints[0].y);
    for (let i = 1; i < dataPoints.length; i++) {
      ctx.lineTo(dataPoints[i].x, dataPoints[i].y);
    }
    ctx.closePath();

    // 填充 · 半透明金色辉光
    const fillGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    fillGrad.addColorStop(0, 'rgba(240,198,116,0.12)');
    fillGrad.addColorStop(0.5, 'rgba(240,198,116,0.06)');
    fillGrad.addColorStop(1, 'rgba(240,198,116,0.01)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // 描边 · 金色
    ctx.strokeStyle = 'rgba(240,198,116,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ④ 数据顶点小圆点 + 值标签
  dataPoints.forEach((dp, i) => {
    const dim = dimensions[i];
    // 顶点圆
    ctx.beginPath();
    ctx.arc(dp.x, dp.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = dim.color;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 值标签 · 微偏移
    const angle = startAngle + angleStep * i;
    const labelR = Math.max(0.02, Math.min(1, dim.value)) * radius + 14;
    const lx = cx + Math.cos(angle) * labelR;
    const ly = cy + Math.sin(angle) * labelR;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px "Noto Serif SC", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const valText = dim.value.toFixed(2);
    ctx.fillText(valText, lx, ly);
  });

  ctx.restore();

  // ⑤ 中心金点
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 4);
  centerGrad.addColorStop(0, '#fbbf24');
  centerGrad.addColorStop(1, 'rgba(251,191,36,0.3)');
  ctx.fillStyle = centerGrad;
  ctx.fill();
  ctx.restore();

  // ⑥ 轴标签 · 在端点外侧
  ctx.save();
  dimensions.forEach((dim, i) => {
    const angle = startAngle + angleStep * i;
    const labelR = radius + 22;
    const lx = cx + Math.cos(angle) * labelR;
    const ly = cy + Math.sin(angle) * labelR;
    ctx.fillStyle = dim.color;
    ctx.font = '600 11px "Noto Serif SC", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dim.label, lx, ly);
  });
  ctx.restore();
}

export default function SevenDimensionalRadar({
  dimensions,
  size = 340,
  title,
}: SevenDimensionalRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.35;

    drawRadar(ctx, cx, cy, radius, dimensions);
  }, [dimensions, size]);

  return (
    <div className="flex flex-col items-center">
      {/* 标题 */}
      {title && (
        <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase mb-3">
          {title}
        </div>
      )}

      {/* 雷达图 */}
      <canvas
        ref={canvasRef}
        className="block"
        aria-label="七维向量雷达图"
      />

      {/* 图例 */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {dimensions.map((dim) => (
          <div key={dim.key} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: dim.color }}
            />
            <span className="text-[10px] text-moon-200/60 tracking-[0.05em]">
              {dim.label}
            </span>
            <span className="font-mono text-[10px] text-moon-200/40 ml-0.5">
              {dim.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* 阈值环说明 */}
      <div className="flex items-center gap-4 mt-3">
        {THRESHOLDS.map((th) => (
          <div key={th.value} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{ backgroundColor: th.color }}
            />
            <span className="text-[9px] text-moon-200/35 tracking-[0.05em]">
              {th.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}