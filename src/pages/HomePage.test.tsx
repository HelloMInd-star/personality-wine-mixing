/**
 * HomePage · 底座双联 + 主理人极客叙事单元测试
 *
 * 验证:
 *   - 底座双联卡片渲染（思维库 + 灵感实验室）
 *   - 点击思维库卡片调用 navigate('/mind')
 *   - 点击灵感实验室卡片调用 navigate('/invest')
 *   - 主理人 section 极客叙事文案(极客化身/镜中的程序员/用你的人格给自己调一杯)
 *   - 无画像时主理人 section 显示引导态(镜中人未现 + 让镜中的程序员显形)
 *
 * 环境约束:
 *   - 需 AppStoreProvider(HomePage 用 useAppStore 读取 profile/vector)
 *   - 需 MemoryRouter(HomePage 用 useNavigate)
 *   - 需 RAF polyfill(CosmicOrbs 子组件依赖,即使 expanded=false 挂载时也可能调用)
 *   - 不注入画像 · profile=null · 验证无画像态的渲染
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AppStoreProvider } from '../store/appStore';

// mock useNavigate · 验证占位卡片导航调用
const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';

// ── 可控 RAF polyfill · CosmicOrbs 子组件可能依赖 ──
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

/** flush 所有 pending RAF · 防止挂载时 RAF 回调未执行 */
function flushRAF() {
  const entries = Array.from(rafMap.entries());
  rafMap.clear();
  for (const [, cb] of entries) {
    cb(performance.now());
  }
}

/** 渲染 HomePage · 无画像 · 带 Router + Store + RAF 环境 */
function renderHome() {
  const result = render(
    <MemoryRouter initialEntries={['/']}>
      <AppStoreProvider>
        <HomePage />
      </AppStoreProvider>
    </MemoryRouter>,
  );
  // flush 挂载期间的 RAF · 确保 CosmicOrbs 等子组件完成初始化
  flushRAF();
  return result;
}

beforeEach(() => {
  navigateMock.mockClear();
  installRAF();
  cleanup();
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe('HomePage · 底座双联', () => {
  it('渲染底座 section 标题 · 向内 · 向外', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: '向内 · 向外' })).toBeInTheDocument();
  });

  it('渲染底座描述 · 已造 / 待造', () => {
    renderHome();
    expect(screen.getByText(/思维库展示已实现的认知引擎/)).toBeInTheDocument();
    expect(screen.getByText(/灵感实验室承接未实现的创意/)).toBeInTheDocument();
  });

  it('渲染"进入思维库底座"按钮 · aria-label 可达', () => {
    renderHome();
    expect(screen.getByRole('button', { name: '进入思维库底座' })).toBeInTheDocument();
  });

  it('渲染"进入灵感实验室"按钮 · aria-label 可达', () => {
    renderHome();
    expect(screen.getByRole('button', { name: '进入灵感实验室' })).toBeInTheDocument();
  });

  it('点击思维库卡片 · 调用 navigate("/mind")', () => {
    renderHome();
    const btn = screen.getByRole('button', { name: '进入思维库底座' });
    fireEvent.click(btn);
    expect(navigateMock).toHaveBeenCalledWith('/mind');
  });

  it('点击灵感实验室卡片 · 调用 navigate("/invest")', () => {
    renderHome();
    const btn = screen.getByRole('button', { name: '进入灵感实验室' });
    fireEvent.click(btn);
    expect(navigateMock).toHaveBeenCalledWith('/invest');
  });
});

describe('HomePage · 主理人极客叙事', () => {
  it('渲染主理人 section 标题 · 主理人 · 镜中之你', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: /主理人 · 镜中之你/ })).toBeInTheDocument();
  });

  it('渲染极客化身叙事文案 · 极客化身 / 镜中的程序员 / 用你的人格给自己调一杯', () => {
    renderHome();
    expect(screen.getByText(/主理人是你的极客化身/)).toBeInTheDocument();
    // "镜中的程序员显形"同时出现在主理人描述和无画像引导态,用 getAllByText 处理
    expect(screen.getAllByText(/镜中的程序员显形/).length).toBeGreaterThan(0);
    expect(screen.getByText(/用你的人格给自己调一杯/)).toBeInTheDocument();
  });

  it('渲染 Host · 主理人 分组小标题', () => {
    renderHome();
    expect(screen.getByText('Host · 主理人')).toBeInTheDocument();
  });

  it('无画像时显示引导态 · 镜中人未现 + 让镜中的程序员显形', () => {
    renderHome();
    expect(screen.getByText(/镜中人未现/)).toBeInTheDocument();
    expect(screen.getByText(/让镜中的程序员显形/)).toBeInTheDocument();
  });
});
