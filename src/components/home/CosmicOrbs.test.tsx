/**
 * CosmicOrbs · 快速连点并发测试
 *
 * 模拟用户快速连续点击不同星球的场景：
 *   - 同一帧内连点 5 个星球 → RAF 合并 · 只触发最后一次 onSelect
 *   - 跨帧点击 → 每帧各触发一次
 *   - 选中态唯一性 → 同一时间只有一个星球 selected
 *   - pending 状态下卸载 → RAF 被取消 · onSelect 不泄漏
 *   - 快速展开/收起切换 → 不崩溃 · DOM 一致
 *
 * 环境约束：
 *   jsdom 无 requestAnimationFrame · 需可控 polyfill（支持 cancel）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import CosmicOrbs from './CosmicOrbs';

// ── 可控 RAF polyfill · 支持 cancel · flush 时机由测试控制 ──
const rafMap = new Map<number, FrameRequestCallback>();
let rafCounter = 0;

function installRAF() {
  rafMap.clear();
  rafCounter = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCounter += 1;
    const id = rafCounter;
    rafMap.set(id, cb);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafMap.delete(id);
  });
}

/** 执行所有 pending RAF 回调 · 模拟下一帧 */
function flushRAF() {
  const entries = Array.from(rafMap.entries());
  rafMap.clear();
  for (const [, cb] of entries) {
    cb(performance.now());
  }
}

/** 当前 pending RAF 数量 · 用于断言无泄漏 */
function pendingRAFCount(): number {
  return rafMap.size;
}

beforeEach(() => {
  installRAF();
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe('CosmicOrbs · 快速连点并发防御', () => {
  it('同一帧内连点 5 个星球 · RAF 合并 · 只触发最后一次 onSelect', () => {
    const onSelect = vi.fn();
    const { getByTestId } = render(
      <CosmicOrbs expanded={true} selectedSlot={null} onSelect={onSelect} />,
    );

    // 快速连续点击 5 个星球（RAF 未 flush）
    fireEvent.click(getByTestId('orb-dawn'));
    fireEvent.click(getByTestId('orb-noon'));
    fireEvent.click(getByTestId('orb-dusk'));
    fireEvent.click(getByTestId('orb-night'));
    fireEvent.click(getByTestId('orb-midnight'));

    // RAF 未 flush · onSelect 不应被调用 · 只有一个 pending RAF
    expect(onSelect).not.toHaveBeenCalled();
    expect(pendingRAFCount()).toBe(1);

    // flush RAF · 合并触发最终值
    flushRAF();

    // 只触发 1 次 · 参数是最后一次点击的 midnight
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('midnight');
    // flush 后无 pending
    expect(pendingRAFCount()).toBe(0);
  });

  it('跨帧点击 · 每帧各触发一次 onSelect · 顺序正确', () => {
    const onSelect = vi.fn();
    const { getByTestId } = render(
      <CosmicOrbs expanded={true} selectedSlot={null} onSelect={onSelect} />,
    );

    fireEvent.click(getByTestId('orb-dawn'));
    flushRAF();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenLastCalledWith('dawn');

    fireEvent.click(getByTestId('orb-noon'));
    flushRAF();
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenLastCalledWith('noon');

    fireEvent.click(getByTestId('orb-midnight'));
    flushRAF();
    expect(onSelect).toHaveBeenCalledTimes(3);
    expect(onSelect).toHaveBeenLastCalledWith('midnight');
  });

  it('选中态唯一 · 同一时间只有一个星球 selected', () => {
    const { rerender, container } = render(
      <CosmicOrbs expanded={true} selectedSlot="dawn" onSelect={vi.fn()} />,
    );

    let selected = container.querySelectorAll('.orb-cell.selected');
    expect(selected.length).toBe(1);
    expect(selected[0]).toHaveAttribute('data-testid', 'orb-dawn');

    // 快速切换选中态 5 次 · 验证每次都唯一
    const slots = ['noon', 'dusk', 'night', 'midnight', 'dawn'] as const;
    for (const slot of slots) {
      rerender(
        <CosmicOrbs expanded={true} selectedSlot={slot} onSelect={vi.fn()} />,
      );
      selected = container.querySelectorAll('.orb-cell.selected');
      expect(selected.length).toBe(1);
      expect(selected[0]).toHaveAttribute('data-testid', `orb-${slot}`);
    }
  });

  it('pending 状态下卸载 · RAF 被取消 · onSelect 不泄漏', () => {
    const onSelect = vi.fn();
    const { getByTestId, unmount } = render(
      <CosmicOrbs expanded={true} selectedSlot={null} onSelect={onSelect} />,
    );

    fireEvent.click(getByTestId('orb-dawn'));
    expect(pendingRAFCount()).toBe(1);

    // 不 flush · 直接卸载 · cleanup effect 应取消 RAF
    unmount();
    expect(pendingRAFCount()).toBe(0);

    // flush · onSelect 不应被调用（RAF 已取消）
    flushRAF();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('快速展开/收起切换 5 次 · 不崩溃 · 星球数量恒为 5', () => {
    const { rerender, container } = render(
      <CosmicOrbs expanded={false} selectedSlot={null} onSelect={vi.fn()} />,
    );

    // 快速切换 expanded 5 次
    for (let i = 0; i < 5; i++) {
      rerender(
        <CosmicOrbs expanded={i % 2 === 0} selectedSlot={null} onSelect={vi.fn()} />,
      );
    }

    // 星球数量恒为 5 · 无重复渲染
    const orbs = container.querySelectorAll('[data-testid^="orb-"]');
    expect(orbs.length).toBe(5);
  });

  it('连点同一星球多次 · 合并为一次 · 无重复触发', () => {
    const onSelect = vi.fn();
    const { getByTestId } = render(
      <CosmicOrbs expanded={true} selectedSlot={null} onSelect={onSelect} />,
    );

    // 同一帧内连点同一星球 3 次
    fireEvent.click(getByTestId('orb-night'));
    fireEvent.click(getByTestId('orb-night'));
    fireEvent.click(getByTestId('orb-night'));

    expect(onSelect).not.toHaveBeenCalled();
    flushRAF();

    // 合并为 1 次
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('night');
  });
});
