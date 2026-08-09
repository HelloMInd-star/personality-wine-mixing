/**
 * MindLibraryPage · 思维库骨架页单元测试
 *
 * 验证:
 *   - 标题区渲染(MIND · 底座 / 思维库 / 副标题)
 *   - 六重底座卡片全部渲染 + 各自"○ 待点亮"状态
 *   - 六重底座层级标签全部渲染
 *   - 底座架构五层描述全部渲染
 *   - 点击"回到入口"按钮调用 navigate('/')
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MindLibraryPage from './MindLibraryPage';

// mock useNavigate · 验证返回按钮导航调用,不影响 MemoryRouter 真实路由
const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

// MemoryRouter 从真实模块导入(vi.mock 后 actual 仍保留)
import { MemoryRouter } from 'react-router-dom';

function renderMindPage() {
  return render(
    <MemoryRouter initialEntries={['/mind']}>
      <MindLibraryPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigateMock.mockClear();
  cleanup();
});

describe('MindLibraryPage · 思维库骨架页', () => {
  it('渲染标题区 · MIND · 底座 / 思维库 / 副标题', () => {
    renderMindPage();
    expect(screen.getByText('MIND · 底座')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '思维库' })).toBeInTheDocument();
    expect(screen.getByText(/极客程序员在夜里编程的底座/)).toBeInTheDocument();
  });

  it('六重底座卡片全部渲染 · 染色体/斐波那契/脉冲函数/画圈实验/记忆曲线/睡眠增益', () => {
    renderMindPage();
    const modules = ['染色体', '斐波那契', '脉冲函数', '画圈实验', '记忆曲线', '睡眠增益'];
    for (const name of modules) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('每个底座模块带"○ 待点亮"状态 · 共 6 处', () => {
    renderMindPage();
    const pending = screen.getAllByText('○ 待点亮');
    expect(pending).toHaveLength(6);
  });

  it('六重底座层级标签全部渲染 · 基因型层/深度层级/节律调节/实时探针/时序加权/离线整合', () => {
    renderMindPage();
    const layers = ['基因型层', '深度层级', '节律调节', '实时探针', '时序加权', '离线整合'];
    for (const layer of layers) {
      // "基因型层"同时出现在卡片层标签和架构层,用 getAllByText 处理多匹配
      expect(screen.getAllByText(layer).length).toBeGreaterThan(0);
    }
  });

  it('底座架构五层描述全部渲染', () => {
    renderMindPage();
    // 用描述文案精确匹配(架构层描述与卡片描述不同,避免歧义)
    expect(screen.getByText(/染色体 · 认知基因组\(底层参数\)/)).toBeInTheDocument();
    expect(screen.getByText(/脉冲函数 · 多周期活跃度/)).toBeInTheDocument();
    expect(screen.getByText(/画圈实验 \+ 牌类行为 \+ 评分/)).toBeInTheDocument();
    expect(screen.getByText(/遗忘曲线加权 · 时序汇聚/)).toBeInTheDocument();
    expect(screen.getByText(/思维库 · 派生推荐\/叙事\/预测/)).toBeInTheDocument();
  });

  it('点击"回到入口"按钮 · 调用 navigate("/")', () => {
    renderMindPage();
    const backBtn = screen.getByRole('button', { name: /回到入口/ });
    fireEvent.click(backBtn);
    expect(navigateMock).toHaveBeenCalledWith('/');
  });
});
