/**
 * MbtiCardRevealStage · 牌盒取出动画舞台
 *
 * Y.Mine 周边产品牌定制的揭示层 · 与 CocktailRevealStage 并列于酒局揭示阶段：
 *   CocktailRevealStage 渲染「联合酒体」· 本组件渲染「每人定制卡」
 *
 * 支持三类定制卡（通过 UnifiedCardSpec 统一渲染契约）：
 *   ① MBTI 人格卡 · 组合字母 + 昵称
 *   ② 塔罗牌定制 · 牌名 + 元素派色
 *   ③ 扑克牌定制 · 点数+花色 + 红黑派色
 *
 * 渲染时间线：
 *   ① lid 阶段（0 ~ 0.9s）  · 牌盒淡入 · 盖子滑开 · 露出暗槽
 *   ② draw 阶段（0.9s ~ ）   · 卡牌依次从牌盒暗槽抽出 · 错峰 0.35s
 *   ③ settle 阶段（全部抽完后） · 卡牌轻微浮动 · 暗槽光晕呼吸
 *
 * 关键节点 logger（排查卡顿/并发）：
 *   - 每张卡牌「开始抽出」(t ≥ startT 首次)
 *   - 每张卡牌「peek 露头」(progress 首次 ≥ 40%)
 *   - 每张卡牌「到达终位」(progress ≥ 1)
 *   - settle 进入时「性能汇总」(maxFrameDelta + 卡牌数)
 *
 * 配色约束（用户要求）：
 *   「背景和底色统一综合酒局的调」
 *   - 所有卡牌底色 = 酒局主色 与 深空底混合 · 调暗至 28% 亮度
 *   - 各卡牌仅用人格主色作为字母与细线高亮 · 不抢底
 *
 * 工程约定：
 *   - hexToRgba 仅接受 #rrggbb · Canvas 渐变 addColorStop 用 rgba 字符串
 *   - 单 Canvas + RAF · DPR 适配 · props 通过 ref 读取避免重启
 *   - key={revealKey} 触发重挂载以重播牌盒入场动画
 *   - 时间相位触发（无 setTimeout）· 卸载时取消 RAF
 */

import { useEffect, useRef } from 'react';
import type { MbtiCode } from '../../types/mbtiParty';
import {
  deriveMbtiCards,
  deriveCardPalette,
  getPackagingStyle,
  getGoldPattern,
  unifyMbtiCard,
  DEFAULT_PACKAGING,
  type UnifiedCardSpec,
  type CardPalette,
  type PackagingConfig,
} from '../../data/cardCustomization';

export interface MbtiCardRevealStageProps {
  /** 参与者 MBTI 码列表 · 每位一张卡（与 cards 二选一 · codes 优先转 MBTI 卡） */
  codes?: MbtiCode[];
  /** 统一卡片规格列表 · 支持塔罗/扑克/MBTI 三类 · 优先于 codes */
  cards?: UnifiedCardSpec[];
  /** 酒局主色 · 来自 fusion.primaryColor · 决定卡牌统一底色 */
  partyPrimaryColor: string;
  /** 包装定制 · 材质 + 烫金纹样 · 默认夜绒+镜月 */
  packaging?: PackagingConfig;
  /** 画布高度（像素）· 宽度按卡牌数自适应 */
  size?: number;
}

/** 时间相位节点（秒） */
const T_LID_END = 0.9; // 牌盒盖掀开结束
const T_CARD_STAGGER = 0.35; // 每张卡牌错峰间隔
const T_CARD_DRAW = 0.7; // 单张卡牌抽出时长
const T_PEEK_PROGRESS = 0.4; // peek 露头进度阈值

/** 缓动 · easeOutCubic */
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
/** 缓动 · easeInOutQuad */
const easeInOutQuad = (x: number) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

/** hex → rgba · 只接受 #rrggbb 格式 · 与全局约定一致 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

/** 圆角矩形路径 */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** 截断长文本 · 用于卡片底部短语 */
function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

export default function MbtiCardRevealStage({
  codes,
  cards,
  partyPrimaryColor,
  packaging = DEFAULT_PACKAGING,
  size = 360,
}: MbtiCardRevealStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  // props 通过 ref 读取 · 避免变化时重启 RAF
  const cardsInputRef = useRef(cards);
  const codesRef = useRef(codes);
  const colorRef = useRef(partyPrimaryColor);
  const packagingRef = useRef(packaging);
  cardsInputRef.current = cards;
  codesRef.current = codes;
  colorRef.current = partyPrimaryColor;
  packagingRef.current = packaging;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── 派生统一卡片规格 · 优先 cards prop · 否则 codes → MBTI 卡 ──
    let unified: UnifiedCardSpec[];
    if (cardsInputRef.current && cardsInputRef.current.length > 0) {
      unified = cardsInputRef.current;
    } else {
      const mbtiCards = deriveMbtiCards(codesRef.current ?? []);
      unified = mbtiCards.map(unifyMbtiCard);
    }
    const palette: CardPalette = deriveCardPalette(colorRef.current, packagingRef.current);
    const pkgStyle = getPackagingStyle(packagingRef.current.material);
    const goldPattern = getGoldPattern(packagingRef.current.pattern);
    const N = Math.max(1, unified.length);

    // ── 画布几何 · 宽度按卡牌数自适应 ──
    const cardW = size * 0.2;
    const cardH = size * 0.32;
    const cardGap = size * 0.045;
    const cardsRowW = N * cardW + (N - 1) * cardGap;
    const width = Math.max(size * 1.3, cardsRowW + size * 0.2);
    const height = size;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const cx = width / 2;

    // 牌盒几何 · 顶部居中
    const boxW = size * 0.56;
    const boxH = size * 0.16;
    const boxX = cx - boxW / 2;
    const boxY = size * 0.1; // 牌盒顶 y
    // 暗槽 · 牌盒顶部开口
    const slotW = boxW * 0.62;
    const slotH = size * 0.022;
    const slotX = cx - slotW / 2;
    const slotY = boxY + size * 0.018; // 暗槽 y（卡牌抽出口）
    // 盖子 · 关闭时覆盖暗槽
    const lidH = size * 0.04;
    const lidClosedY = slotY - lidH * 0.1; // 关闭位置
    const lidOpenY = boxY - size * 0.05; // 滑开位置

    // 卡牌最终位置 · 顶部居中下方一行
    const cardsTopY = size * 0.5;
    const cardsRowStartX = cx - cardsRowW / 2;

    const start = performance.now();

    // ── 日志基础设施 · 排查渲染卡顿/并发 ──
    // 跟踪每张卡牌的关键节点 · 只在首次触发时输出 · 避免每帧刷屏
    const logState = {
      lastPhase: '' as string,
      drawStartLogged: new Set<number>(), // 卡牌「开始抽出」已记录
      peekLogged: new Set<number>(), // 卡牌「peek 露头」已记录
      drawnCardLogged: new Set<number>(), // 卡牌「到达终位」已记录
      lidOpenLogged: false,
      settleSummaryLogged: false,
      fpsFrames: 0,
      fpsLastNow: start,
      lastFrameNow: start,
      maxFrameDelta: 0,
      /** settle 期间累计的帧间隔峰值 · 用于汇总 */
      settleMaxFrameDelta: 0,
    };
    const log = (event: string, data?: unknown) => {
      const ts = (performance.now() - start) / 1000;
      console.log(
        `%c[CardReveal] ${ts.toFixed(3)}s ${event}`,
        'color:#f0c674;font-weight:bold',
        data ?? '',
      );
    };
    log('挂载 · RAF 启动', {
      kind: unified[0]?.kind ?? 'mbti',
      cards: N,
      titles: unified.map((c) => c.title),
      partyColor: colorRef.current,
      packaging: packagingRef.current,
      width: +width.toFixed(0),
      height,
      dpr,
    });

    /** 计算第 i 张卡牌的抽出起始时间 */
    const cardStartT = (i: number) => T_LID_END + i * T_CARD_STAGGER;

    /** 全部抽完的时间 · 进入 settle 相位 */
    const T_SETTLE = cardStartT(N - 1) + T_CARD_DRAW;

    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);

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
          t: +t.toFixed(2) + 's',
          cards: N,
        };
        if (fps < 50) {
          console.warn(
            `%c[CardReveal] 性能告警 ${sample.t} · FPS ${sample.fps}`,
            'color:#e06552',
            sample,
          );
        } else {
          console.log(
            `%c[CardReveal] 性能采样 ${sample.t}`,
            'color:#9b7bd4',
            sample,
          );
        }
        logState.fpsFrames = 0;
        logState.fpsLastNow = now;
        logState.maxFrameDelta = 0;
      }

      // 相位判断
      const isLid = t < T_LID_END;
      const isSettle = t >= T_SETTLE;

      // settle 阶段累计帧间隔峰值
      if (isSettle && frameDelta > logState.settleMaxFrameDelta) {
        logState.settleMaxFrameDelta = frameDelta;
      }

      // ── 相位切换日志 · 只在进入新相位时输出一次 ──
      const phaseNow = isLid ? 'lid' : isSettle ? 'settle' : 'draw';
      if (phaseNow !== logState.lastPhase) {
        const prev = logState.lastPhase || 'init';
        logState.lastPhase = phaseNow;
        if (phaseNow === 'lid') {
          log(`相位 ${prev} → lid · 牌盒淡入+盖子滑开`, {
            material: pkgStyle.id,
            pattern: goldPattern.id,
            boxW: +boxW.toFixed(0),
          });
        } else if (phaseNow === 'draw') {
          log(`相位 lid → draw · 开始抽卡 · 共 ${N} 张`, {
            stagger: T_CARD_STAGGER,
            drawDuration: T_CARD_DRAW,
            settleAt: +T_SETTLE.toFixed(2) + 's',
          });
        } else if (phaseNow === 'settle') {
          // settle 进入时输出性能汇总 · 含 draw 阶段峰值帧间隔
          log(`相位 draw → settle · 全部卡牌已抽出 · 进入稳定循环`, {
            cardsDrawn: N,
            drawPhaseMaxFrameDelta: +logState.maxFrameDelta.toFixed(1) + 'ms',
          });
        }
      }

      // ── ① 牌盒 · 材质底色渐变 ──
      const boxAlpha = Math.min(1, t / 0.4); // 0-0.4s 淡入
      const boxSlideY = (1 - easeOutCubic(Math.min(1, t / 0.5))) * size * 0.04; // 轻微下滑入场
      ctx.save();
      ctx.globalAlpha = boxAlpha;
      // 牌盒主体 · 垂直渐变
      const boxGrad = ctx.createLinearGradient(0, boxY + boxSlideY, 0, boxY + boxH + boxSlideY);
      boxGrad.addColorStop(0, hexToRgba(pkgStyle.boxHighlight, 0.95));
      boxGrad.addColorStop(0.5, hexToRgba(pkgStyle.boxBase, 0.95));
      boxGrad.addColorStop(1, hexToRgba(pkgStyle.boxBase, 0.85));
      ctx.fillStyle = boxGrad;
      roundRectPath(ctx, boxX, boxY + boxSlideY, boxW, boxH, size * 0.02);
      ctx.fill();
      // 牌盒金线描边
      ctx.strokeStyle = hexToRgba(palette.goldLine, 0.45);
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // 暗槽 · 牌盒顶部开口（深色内壁）
      const slotAlpha = isLid ? Math.min(1, t / 0.4) * 0.5 : 1;
      ctx.fillStyle = hexToRgba(palette.boxInner, slotAlpha);
      roundRectPath(ctx, slotX, slotY + boxSlideY, slotW, slotH, slotH * 0.4);
      ctx.fill();

      // 暗槽内壁光晕 · 抽卡阶段透出酒局主色微光
      if (!isLid) {
        const slotGlow = isSettle
          ? 0.4 + Math.sin(t * 1.6) * 0.15 // settle 呼吸
          : 0.6; // draw 阶段稳定
        const slotGrad = ctx.createRadialGradient(
          cx,
          slotY + slotH / 2 + boxSlideY,
          0,
          cx,
          slotY + slotH / 2 + boxSlideY,
          slotW * 0.6,
        );
        slotGrad.addColorStop(0, hexToRgba(colorRef.current, slotGlow * 0.55));
        slotGrad.addColorStop(1, hexToRgba(colorRef.current, 0));
        ctx.fillStyle = slotGrad;
        ctx.fillRect(slotX - size * 0.05, slotY + boxSlideY, slotW + size * 0.1, slotH * 2);
      }

      // ── ② 牌盒盖子 · lid 阶段滑开 ──
      // 盖子滑开进度 · 0.3-0.9s
      const lidProgress = isLid
        ? easeInOutQuad(Math.max(0, Math.min(1, (t - 0.3) / (T_LID_END - 0.3))))
        : 1;
      const lidY = lidClosedY + (lidOpenY - lidClosedY) * lidProgress + boxSlideY;
      const lidAlpha = Math.min(1, t / 0.3);
      ctx.save();
      ctx.globalAlpha = lidAlpha * boxAlpha;
      // 盖子主体
      const lidGrad = ctx.createLinearGradient(0, lidY, 0, lidY + lidH);
      lidGrad.addColorStop(0, hexToRgba(pkgStyle.boxHighlight, 0.98));
      lidGrad.addColorStop(1, hexToRgba(pkgStyle.boxBase, 0.95));
      ctx.fillStyle = lidGrad;
      roundRectPath(ctx, slotX - size * 0.01, lidY, slotW + size * 0.02, lidH, size * 0.012);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(palette.goldLine, 0.5);
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // 盖子烫金纹样 · 中央符号
      if (lidProgress > 0.3) {
        const patternAlpha = Math.min(1, (lidProgress - 0.3) / 0.4);
        ctx.globalAlpha = patternAlpha * lidAlpha * boxAlpha;
        ctx.fillStyle = hexToRgba(palette.goldLine, 0.85);
        ctx.font = `${size * 0.028}px 'PingFang SC', system-ui, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(goldPattern.symbol, cx, lidY + lidH / 2);
      }
      ctx.restore();

      ctx.restore(); // 牌盒 boxAlpha

      // ── lid 完成日志（一次性） ──
      if (!isLid && !logState.lidOpenLogged) {
        logState.lidOpenLogged = true;
        log('牌盒盖已滑开 · 暗槽露出', { slotW: +slotW.toFixed(0), at: +t.toFixed(3) + 's' });
      }

      // ── ③ 卡牌 · 依次从暗槽抽出 ──
      for (let i = 0; i < N; i++) {
        const card = unified[i];
        const startT = cardStartT(i);
        if (t < startT) continue; // 未到该卡时间
        const localT = t - startT;
        const progress = Math.min(1, localT / T_CARD_DRAW);

        // ── 关键节点 logger · 「开始抽出」(t ≥ startT 首次) ──
        if (!logState.drawStartLogged.has(i)) {
          logState.drawStartLogged.add(i);
          log(`卡 ${i + 1}/${N} 开始抽出`, {
            title: card.title,
            kind: card.kind,
            startAt: +t.toFixed(3) + 's',
          });
        }

        // 卡牌抽出路径：
        //   0-40% · 从暗槽(cx, slotY) 上升到 (cx, slotY - 30) · alpha 0→0.7
        //   40-100% · 移动到最终位置 (finalX, cardsTopY) · alpha 0.7→1
        const finalX = cardsRowStartX + i * (cardW + cardGap);
        const finalY = cardsTopY;
        let cardX: number;
        let cardY: number;
        let cardAlpha: number;
        if (progress < T_PEEK_PROGRESS) {
          const p1 = easeOutCubic(progress / T_PEEK_PROGRESS);
          cardX = cx;
          cardY = slotY - size * 0.08 * p1 + boxSlideY;
          cardAlpha = p1 * 0.7;
        } else {
          // ── 关键节点 logger · 「peek 露头」(progress 首次 ≥ 40%) ──
          if (!logState.peekLogged.has(i)) {
            logState.peekLogged.add(i);
            log(`卡 ${i + 1}/${N} peek 露头`, {
              title: card.title,
              peekAt: +t.toFixed(3) + 's',
              alpha: 0.7,
            });
          }
          const p2 = easeInOutQuad((progress - T_PEEK_PROGRESS) / (1 - T_PEEK_PROGRESS));
          // 从 (cx, slotY-30) 插值到 (finalX, finalY)
          const fromX = cx;
          const fromY = slotY - size * 0.08 + boxSlideY;
          cardX = fromX + (finalX - fromX) * p2;
          cardY = fromY + (finalY - fromY) * p2;
          cardAlpha = 0.7 + 0.3 * p2;
        }

        // settle 阶段轻微浮动
        let floatY = 0;
        if (isSettle) {
          floatY = Math.sin(t * 1.2 + i * 0.8) * size * 0.006;
        }

        // ── 关键节点 logger · 「到达终位」(progress ≥ 1 首次) ──
        if (progress >= 1 && !logState.drawnCardLogged.has(i)) {
          logState.drawnCardLogged.add(i);
          log(`卡 ${i + 1}/${N} 到达终位`, {
            title: card.title,
            subtitle: card.subtitle,
            at: +t.toFixed(3) + 's',
            finalX: +finalX.toFixed(1),
          });
        }

        ctx.save();
        ctx.globalAlpha = cardAlpha;
        const cy = cardY + floatY;

        // 卡牌阴影 · 抽出过程中较深 · settle 时柔和
        const shadowAlpha = progress < 1 ? 0.4 * progress : 0.25;
        ctx.fillStyle = hexToRgba('#000000', shadowAlpha);
        roundRectPath(ctx, cardX + 2, cy + 3, cardW, cardH, size * 0.014);
        ctx.fill();

        // 卡牌底色 · 统一酒局基调（深色版主色）
        const cardGrad = ctx.createLinearGradient(0, cy, 0, cy + cardH);
        cardGrad.addColorStop(0, hexToRgba(palette.cardTopGlow, 0.95));
        cardGrad.addColorStop(0.5, hexToRgba(palette.cardBase, 0.97));
        cardGrad.addColorStop(1, hexToRgba(palette.cardShadow, 0.95));
        ctx.fillStyle = cardGrad;
        roundRectPath(ctx, cardX, cy, cardW, cardH, size * 0.014);
        ctx.fill();

        // 卡牌金线描边
        ctx.strokeStyle = hexToRgba(palette.goldLine, 0.55);
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // 顶部金线高光
        ctx.strokeStyle = hexToRgba(palette.goldLine, 0.7);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cardX + cardW * 0.18, cy + size * 0.012);
        ctx.lineTo(cardX + cardW * 0.82, cy + size * 0.012);
        ctx.stroke();

        // 角落单字符号
        ctx.fillStyle = hexToRgba(palette.goldLine, 0.55);
        ctx.font = `${size * 0.032}px 'PingFang SC', system-ui, serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(card.symbol, cardX + size * 0.012, cy + size * 0.02);

        // 中央主标题 · 人格主色高亮 · 字号按 kind 略调
        const titleFont =
          card.kind === 'mbti'
            ? `bold ${size * 0.062}px 'PingFang SC', system-ui, monospace`
            : `bold ${size * 0.05}px 'PingFang SC', system-ui, serif`;
        ctx.fillStyle = hexToRgba(card.primary, 0.95);
        ctx.font = titleFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(truncate(card.title, 7), cardX + cardW / 2, cy + cardH * 0.42);

        // 主标题下方细线 · 人格主色
        ctx.strokeStyle = hexToRgba(card.accent, 0.5);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(cardX + cardW * 0.28, cy + cardH * 0.58);
        ctx.lineTo(cardX + cardW * 0.72, cy + cardH * 0.58);
        ctx.stroke();

        // 副标题 · 金色小字
        ctx.fillStyle = hexToRgba(palette.goldLine, 0.85);
        ctx.font = `${size * 0.026}px 'PingFang SC', system-ui, serif`;
        ctx.fillText(truncate(card.subtitle, 8), cardX + cardW / 2, cy + cardH * 0.72);

        // 人格标签 · personaTag · 仅 MBTI 卡有效 · 人格主色小字
        if (card.personaTag) {
          ctx.fillStyle = hexToRgba(card.primary, 0.8);
          ctx.font = `${size * 0.022}px 'PingFang SC', system-ui, serif`;
          ctx.fillText(
            truncate(card.personaTag, 12),
            cardX + cardW / 2,
            cy + cardH * 0.8,
          );
        }

        // 底部短语 · 极小字 · settle 阶段渐入
        if (progress >= 1) {
          const captionAlpha = Math.min(1, (localT - T_CARD_DRAW) / 0.5);
          ctx.globalAlpha = cardAlpha * captionAlpha * 0.7;
          ctx.fillStyle = hexToRgba(card.accent, 0.7);
          ctx.font = `${size * 0.018}px 'PingFang SC', system-ui, serif`;
          ctx.fillText(truncate(card.caption, 9), cardX + cardW / 2, cy + cardH * 0.88);
        }

        ctx.restore();
      }

      // ── settle 性能汇总（一次性 · settle 后 1s 输出） ──
      if (
        isSettle &&
        !logState.settleSummaryLogged &&
        t >= T_SETTLE + 1
      ) {
        logState.settleSummaryLogged = true;
        log('settle 性能汇总', {
          totalCards: N,
          cardsDrawn: logState.drawnCardLogged.size,
          settleMaxFrameDelta: +logState.settleMaxFrameDelta.toFixed(1) + 'ms',
          elapsed: +t.toFixed(2) + 's',
        });
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    // ── 卸载时取消 RAF · 避免并发残留 ──
    return () => {
      cancelAnimationFrame(rafRef.current);
      const elapsed = (performance.now() - start) / 1000;
      console.log(
        `%c[CardReveal] ${elapsed.toFixed(3)}s 卸载 · RAF 取消`,
        'color:#9b7bd4;font-weight:bold',
        {
          finalPhase: logState.lastPhase,
          cardsDrawn: logState.drawnCardLogged.size,
          totalCards: N,
          drawStartLogged: logState.drawStartLogged.size,
          peekLogged: logState.peekLogged.size,
        },
      );
    };
    // 依赖空数组 · 仅挂载时派生 · props 变化通过 ref 读取
    // 重挂载由父组件 key={revealKey} 触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{ maxWidth: '100%', height: 'auto' }}
      aria-label="人格卡牌揭示动画"
    />
  );
}
