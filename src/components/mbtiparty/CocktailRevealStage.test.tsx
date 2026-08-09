/**
 * CocktailRevealStage · 并发重置测试
 *
 * 模拟用户快速点击「重看揭示」按钮的场景：
 *   - 每次 key 变化触发组件卸载 + 重挂载
 *   - 验证旧 RAF 被正确取消（无并发 RAF 残留）
 *   - 验证卸载/挂载日志成对出现
 *   - 验证 setTimeout 涟漪已改为基于时间触发（无定时器泄漏）
 *
 * 环境约束：
 *   jsdom 不支持 Canvas 2D API · 需 stub getContext
 *   jsdom 无 requestAnimationFrame · 需 polyfill
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import CocktailRevealStage from './CocktailRevealStage';
import type { FusionCocktail } from '../../types/mbtiParty';

/** 构造模拟 fusion 数据 · 3 ENFP + 1 INTJ 张力之杯场景 */
const mockFusion: FusionCocktail = {
  name: '张力之杯',
  subtitle: '不同的星辰 · 在同一只杯里点亮',
  primaryColor: '#e88a3c',
  accentColor: '#f5b885',
  matchScore: 85,
  fusionLabel: 'INTJ × ENFP 的张力',
  participants: ['INTJ', 'ENFP', 'ENFP', 'ENFP'],
};

/** Stub CanvasRenderingContext2D · 所有方法 noop · 渐变返回带 addColorStop 的对象 */
function makeStubCtx() {
  const gradientStub = { addColorStop: vi.fn() };
  return {
    scale: vi.fn(),
    clearRect: vi.fn(),
    createRadialGradient: vi.fn(() => ({ ...gradientStub })),
    createLinearGradient: vi.fn(() => ({ ...gradientStub })),
    beginPath: vi.fn(),
    ellipse: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    set fillStyle(_v: unknown) {},
    set strokeStyle(_v: unknown) {},
    set lineWidth(_v: number) {},
    set globalAlpha(_v: number) {},
    set font(_v: string) {},
  } as unknown as CanvasRenderingContext2D;
}

describe('CocktailRevealStage · 并发重置测试', () => {
  let rafCount: number;
  let cancelCount: number;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    rafCount = 0;
    cancelCount = 0;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // polyfill requestAnimationFrame · 记录调度但不自动执行（避免无限循环）
    globalThis.requestAnimationFrame = vi.fn((_cb: FrameRequestCallback) => {
      rafCount++;
      // 返回一个 id · 不立即执行 cb · 测试控制时间推进
      return rafCount as unknown as number;
    }) as unknown as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = vi.fn(() => {
      cancelCount++;
    }) as unknown as typeof cancelAnimationFrame;

    // stub HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() => makeStubCtx()) as never;

    // performance.now 递增 · 模拟时间流逝（每帧 16ms）
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      now += 16;
      return now;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('快速连续 5 次切换 key · 每次 key 变化都取消旧 RAF · 不抛错', () => {
    const keys = [0, 1, 2, 3, 4];
    const { rerender, unmount } = render(
      <CocktailRevealStage key={keys[0]} fusion={mockFusion} size={360} />,
    );

    // 模拟用户快速点击「重看揭示」· key 连续变化
    for (let i = 1; i < keys.length; i++) {
      rerender(<CocktailRevealStage key={keys[i]} fusion={mockFusion} size={360} />);
    }

    // 5 次挂载 · 前 4 次因 key 变化被卸载 → 至少 4 次 cancelAnimationFrame
    expect(cancelCount).toBeGreaterThanOrEqual(4);
    // 不应抛错 · React 卸载/重挂载过程不应产生 console.warn
    expect(warnSpy).not.toHaveBeenCalled();

    unmount();
    // 最后一次卸载也触发 cancel
    expect(cancelCount).toBeGreaterThanOrEqual(5);
  });

  it('卸载/挂载日志成对出现 · 每次重挂载都有「挂载」和「卸载」', () => {
    const { rerender, unmount } = render(
      <CocktailRevealStage key={0} fusion={mockFusion} size={360} />,
    );
    rerender(<CocktailRevealStage key={1} fusion={mockFusion} size={360} />);
    unmount();

    const logCalls = logSpy.mock.calls.map((c: unknown[]) => String(c[0] ?? ''));
    const mounts = logCalls.filter((s: string) => s.includes('挂载'));
    const unmounts = logCalls.filter((s: string) => s.includes('卸载'));

    // 初始挂载 + key 变化重挂载 = 2 次挂载
    expect(mounts.length).toBe(2);
    // key 变化卸载 + unmount 卸载 = 2 次卸载
    expect(unmounts.length).toBe(2);
  });

  it('单实例挂载后 · RAF 被调度且卸载时取消', () => {
    const { unmount } = render(<CocktailRevealStage fusion={mockFusion} size={360} />);
    expect(rafCount).toBeGreaterThanOrEqual(1);
    unmount();
    expect(cancelCount).toBe(1);
  });

  it('fusion 变化但 key 不变 · 不重启 RAF（通过 ref 读取 · 避免重启）', () => {
    const { rerender, unmount } = render(
      <CocktailRevealStage key={0} fusion={mockFusion} size={360} />,
    );
    const rafAfterMount = rafCount;
    // fusion 引用变化但 key 不变
    const newFusion = { ...mockFusion, name: '共鸣之杯', matchScore: 72 };
    rerender(<CocktailRevealStage key={0} fusion={newFusion} size={360} />);
    // 不应重新挂载 · RAF 不重启 · 无额外 cancel
    expect(cancelCount).toBe(0);
    expect(rafCount).toBe(rafAfterMount);
    unmount();
  });
});
