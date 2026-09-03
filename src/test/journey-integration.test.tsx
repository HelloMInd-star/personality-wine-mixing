/**
 * 旅程回路端到端集成测试
 *
 * 模拟用户从进入 cocktail 页面到完成整个情绪旅程回路的完整交互：
 *   1. 进入页面 → opening（开场，低刺激，月下寂止 60 BPM）
 *   2. 点击「热烈」→ climax（高潮，高刺激，焰心之帷 128 BPM）
 *   3. 调节强度至 0.2 → rising（上升，中刺激，琥珀脉动 90 BPM）
 *   4. 切换「沉静」+ 强度 0.9 → closing（收尾，低刺激，余烬归寂 65 BPM）
 *   5. 完整回路 opening→rising→climax→closing→opening 顺序流转
 *   6. 音乐播放/暂停控制
 *   7. 高潮阶段推荐优先高刺激酒款
 *
 * 渲染真实 CocktailPage + AppStoreProvider + MemoryRouter
 * mock AudioContext（jsdom 无原生实现），其余用真实引擎与数据
 *
 * 控制台日志：每次阶段切换打印 mood / intensity / phase / tier / bpm / track / top3 推荐样本
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStoreProvider } from '../store/appStore';
import CocktailPage from '../pages/CocktailPage';
import { cocktailService } from '../services/cocktailService';
import type { PersonalityProfile } from '../types/personality';
import type { MoodTag } from '../types/cocktail';

/** 测试用画像 · 平衡八维风味，注入 localStorage 供 appStore 挂载时读取 */
const TEST_PROFILE: PersonalityProfile = {
  scores: {
    openness: 60,
    conscientiousness: 55,
    extraversion: 50,
    agreeableness: 65,
    neuroticism: 45,
  },
  archetype: {
    code: 'TWILIGHT',
    name: '暮色者',
    tagline: '不偏不倚，恰是夜与昼交界的颜色。',
    description: '测试用画像',
    signature: {},
    auraColor: '#7c5fbf',
  },
  flavorPreference: {
    sweet: 0.5,
    sour: 0.5,
    bitter: 0.5,
    strong: 0.5,
    smoky: 0.5,
    fruity: 0.5,
    herbal: 0.5,
    creamy: 0.5,
  },
  createdAt: Date.now(),
};

/** 注入 localStorage 供 appStore 挂载时读取 */
function injectProfile(): PersonalityProfile {
  localStorage.setItem('juezui-profile', JSON.stringify(TEST_PROFILE));
  return TEST_PROFILE;
}

/** 阶段参数 · 用于日志记录 */
interface PhaseParams {
  mood: MoodTag | null;
  intensity: number;
}

/**
 * 打印阶段切换的参数变化日志
 * 记录：mood / intensity / phase / tier / bpm / track / top3 推荐样本
 * 通过 cocktailService 直接计算预期值，与 UI 断言并行对照
 */
function logPhase(step: string, prev: PhaseParams | null, next: PhaseParams): void {
  const prevState = prev ? cocktailService.getJourneyState(prev.mood, prev.intensity) : null;
  const nextState = cocktailService.getJourneyState(next.mood, next.intensity);
  const prevTrack = prev ? cocktailService.getJourneyTrack(prev.mood, prev.intensity) : null;
  const nextTrack = cocktailService.getJourneyTrack(next.mood, next.intensity);
  const nextRecs = cocktailService.recommendByJourney(
    TEST_PROFILE,
    next.mood,
    next.intensity,
    new Date(),
    3,
  );

  const fmtMood = (v: MoodTag | null) => (v === null ? 'null' : v);
  const arrow = (from: string, to: string) => `${prev ? from : '—'} → ${to}`;

  console.log(
    `\n[Journey] ${step}\n` +
      `  ├─ mood:      ${arrow(fmtMood(prev?.mood ?? null), fmtMood(next.mood))}\n` +
      `  ├─ intensity: ${arrow(
        prev ? prev.intensity.toFixed(2) : '—',
        next.intensity.toFixed(2),
      )}\n` +
      `  ├─ phase:     ${arrow(prevState?.meta.label ?? '—', nextState.meta.label)}\n` +
      `  ├─ tier:      ${arrow(
        prevState?.meta.stimulationTier ?? '—',
        nextState.meta.stimulationTier,
      )}\n` +
      `  ├─ bpm:       ${arrow(
        prevState ? String(prevState.meta.bpm) : '—',
        String(nextState.meta.bpm),
      )}\n` +
      `  ├─ track:     ${arrow(prevTrack?.title ?? '—', nextTrack.title)}\n` +
      `  └─ top3 recs: ${nextRecs
        .map(
          (r) =>
            `${r.cocktail.name}(score=${r.matchScore},tier=${r.stimulation.tier})`,
        )
        .join(' | ')}`,
  );
}

/** 渲染 CocktailPage · 带 Router + Store · profile 已注入 localStorage */
function renderJourneyPage() {
  return render(
    <MemoryRouter initialEntries={['/cocktail']}>
      <AppStoreProvider>
        <CocktailPage />
      </AppStoreProvider>
    </MemoryRouter>,
  );
}

/**
 * 取 MoodDial 内的情绪瓣 · 页面有两套同名按钮（调节器瓣 + 酒单筛选药丸）
 *
 * 关键区分：MoodDial 情绪瓣带 aria-pressed（选中态），酒单筛选药丸不带
 * 注意：cocktail-menu 区的筛选药丸在 DOM 中先于 Section Ⅱ 的 MoodDial 渲染
 *       故不能用 getAllByRole[0]，否则取到的是筛选药丸
 * 点击药丸只 setFilterMood，不会触发 setActiveMood → 滑块仍 disabled + 阶段不切换
 */
function getMoodButton(label: string) {
  const buttons = screen.getAllByRole('button', { name: label });
  const dialBtn = buttons.find((btn) => btn.hasAttribute('aria-pressed'));
  if (!dialBtn) {
    throw new Error(
      `MoodDial 情绪瓣未找到: ${label}（页面只找到酒单筛选药丸，可能 MoodDial 未渲染）`,
    );
  }
  return dialBtn;
}

/** 取情绪强度滑块 · 全页唯一 */
function getIntensitySlider() {
  return screen.getByRole('slider', { name: '情绪强度' }) as HTMLInputElement;
}

/** 取音乐播放按钮 · 全页唯一 */
function getMusicButton() {
  return screen.getByRole('button', { name: /旅程音乐/ });
}

/** 断言旅程弧线当前阶段 · JourneyArc 详情文案格式「{label} · {symbol} {poem}」 */
function expectJourneyPhase(label: string, symbol: string) {
  // 直接匹配阶段详情文案 · 该组合在页面唯一（推荐区标题为「{symbol} · {label}」顺序相反）
  expect(screen.getByText(new RegExp(`${label} · ${symbol}`))).toBeInTheDocument();
}

/** 断言音乐控件当前曲目名 · 用 getAllByText 因 PlaylistSelector 占位曲目列表也可能展示同名 */
function expectTrack(title: string) {
  expect(screen.getAllByText(title).length).toBeGreaterThan(0);
}

/** 断言 BPM 出现 · JourneyArc 详情与 MusicControl 均会渲染，故用 getAllByText */
function expectBpm(bpm: number) {
  expect(screen.getAllByText(new RegExp(`${bpm} BPM`)).length).toBeGreaterThan(0);
}

describe('情绪旅程回路 · 端到端集成', () => {
  beforeEach(() => {
    cleanup();
    injectProfile();
  });

  it('场景1 · 进入页面 → opening 开场阶段（低刺激 + 月下寂止 60 BPM）', async () => {
    logPhase('场景1 · 初始挂载', null, { mood: null, intensity: 0.5 });
    renderJourneyPage();

    // 等待画像加载 · 旅程推荐区出现标志 profile 就绪
    await screen.findByRole('heading', { name: '旅程契合推荐' });

    // 旅程弧线显示「开场」
    expectJourneyPhase('开场', '启');
    // 音乐曲目为「月下寂止」60 BPM
    expectTrack('月下寂止');
    expectBpm(60);
    // 推荐区标题带阶段标签「启 · 开场」
    expect(screen.getByText('启 · 开场')).toBeInTheDocument();
    // 强度滑块默认禁用（未选情绪）
    expect(getIntensitySlider()).toBeDisabled();
  });

  it('场景2 · 点击「热烈」→ climax 高潮阶段（高刺激 + 焰心之帷 128 BPM）', async () => {
    renderJourneyPage();
    await screen.findByRole('heading', { name: '旅程契合推荐' });

    logPhase('场景2 · 点击「热烈」', { mood: null, intensity: 0.5 }, { mood: 'passion', intensity: 0.5 });
    // 点击热烈情绪瓣
    fireEvent.click(getMoodButton('热烈'));

    // 旅程弧线切换到「高潮」
    await waitFor(() => expectJourneyPhase('高潮', '炽'));
    // 音乐曲目切换到「焰心之帷」128 BPM
    expectTrack('焰心之帷');
    expectBpm(128);
    // 推荐区标题带「炽 · 高潮」
    expect(screen.getByText('炽 · 高潮')).toBeInTheDocument();
    // 强度滑块启用（默认 0.5）
    expect(getIntensitySlider()).not.toBeDisabled();
    expect(getIntensitySlider().value).toBe('0.5');
  });

  it('场景3 · 调节强度至 0.2 → rising 上升阶段（中刺激 + 琥珀脉动 90 BPM）', async () => {
    renderJourneyPage();
    await screen.findByRole('heading', { name: '旅程契合推荐' });

    // 先选「热烈」进入 climax
    fireEvent.click(getMoodButton('热烈'));
    await waitFor(() => expectJourneyPhase('高潮', '炽'));

    logPhase('场景3 · 强度 0.5 → 0.2', { mood: 'passion', intensity: 0.5 }, { mood: 'passion', intensity: 0.2 });
    // 调节强度到 0.2 → rising
    const slider = getIntensitySlider();
    fireEvent.change(slider, { target: { value: '0.2' } });

    // 旅程弧线切换到「上升」
    await waitFor(() => expectJourneyPhase('上升', '渐'));
    // 音乐曲目切换到「琥珀脉动」90 BPM
    expectTrack('琥珀脉动');
    expectBpm(90);
    // 推荐区标题带「渐 · 上升」
    expect(screen.getByText('渐 · 上升')).toBeInTheDocument();
  });

  it('场景4 · 切换「沉静」+ 强度 0.9 → closing 收尾阶段（低刺激 + 余烬归寂 65 BPM）', async () => {
    renderJourneyPage();
    await screen.findByRole('heading', { name: '旅程契合推荐' });

    logPhase('场景4 ① 选「沉静」', { mood: null, intensity: 0.5 }, { mood: 'calm', intensity: 0.5 });
    // 选「沉静」收敛型情绪
    fireEvent.click(getMoodButton('沉静'));
    await waitFor(() => expect(getIntensitySlider()).not.toBeDisabled());

    logPhase('场景4 ② 强度 0.5 → 0.9', { mood: 'calm', intensity: 0.5 }, { mood: 'calm', intensity: 0.9 });
    // 强度调到 0.9 → closing（收敛型 + 高强度触发回路收尾）
    const slider = getIntensitySlider();
    fireEvent.change(slider, { target: { value: '0.9' } });

    // 旅程弧线切换到「收尾」
    await waitFor(() => expectJourneyPhase('收尾', '归'));
    // 音乐曲目切换到「余烬归寂」65 BPM
    expectTrack('余烬归寂');
    expectBpm(65);
    // 推荐区标题带「归 · 收尾」
    expect(screen.getByText('归 · 收尾')).toBeInTheDocument();
  });

  it('场景5 · 完整回路 opening→rising→climax→closing 顺序流转', async () => {
    renderJourneyPage();
    await screen.findByRole('heading', { name: '旅程契合推荐' });

    // ① opening
    logPhase('场景5 ① opening', null, { mood: null, intensity: 0.5 });
    expectJourneyPhase('开场', '启');
    expectTrack('月下寂止');

    // ② rising：选热烈 + 强度 0.2
    logPhase('场景5 ② → rising', { mood: null, intensity: 0.5 }, { mood: 'passion', intensity: 0.2 });
    fireEvent.click(getMoodButton('热烈'));
    await waitFor(() => expect(getIntensitySlider()).not.toBeDisabled());
    fireEvent.change(getIntensitySlider(), { target: { value: '0.2' } });
    await waitFor(() => expectJourneyPhase('上升', '渐'));
    expectTrack('琥珀脉动');

    // ③ climax：强度调到 0.5
    logPhase('场景5 ③ → climax', { mood: 'passion', intensity: 0.2 }, { mood: 'passion', intensity: 0.5 });
    fireEvent.change(getIntensitySlider(), { target: { value: '0.5' } });
    await waitFor(() => expectJourneyPhase('高潮', '炽'));
    expectTrack('焰心之帷');

    // ④ closing：切沉静 + 强度 0.9
    logPhase('场景5 ④ → closing', { mood: 'passion', intensity: 0.5 }, { mood: 'calm', intensity: 0.9 });
    fireEvent.click(getMoodButton('沉静'));
    await waitFor(() => expect(getIntensitySlider()).not.toBeDisabled());
    fireEvent.change(getIntensitySlider(), { target: { value: '0.9' } });
    await waitFor(() => expectJourneyPhase('收尾', '归'));
    expectTrack('余烬归寂');

    // ⑤ 回到 opening：关闭情绪调节（再点沉静）· intensity 保留 0.9
    logPhase('场景5 ⑤ → opening（关闭调节）', { mood: 'calm', intensity: 0.9 }, { mood: null, intensity: 0.9 });
    fireEvent.click(getMoodButton('沉静'));
    await waitFor(() => expectJourneyPhase('开场', '启'));
    expectTrack('月下寂止');
  }, 20000);

  it('场景6 · 音乐播放/暂停控制', async () => {
    renderJourneyPage();
    await screen.findByRole('heading', { name: '旅程契合推荐' });

    logPhase('场景6 · 初始（暂停态）', null, { mood: null, intensity: 0.5 });
    // 初始为「播放」
    expect(getMusicButton()).toHaveAccessibleName('播放旅程音乐');

    console.log('[Journey] 场景6 · 点击播放 → 暂停态');
    // 点击播放 → 切换为「暂停」
    fireEvent.click(getMusicButton());
    expect(getMusicButton()).toHaveAccessibleName('暂停旅程音乐');

    console.log('[Journey] 场景6 · 点击暂停 → 播放态');
    // 再次点击 → 回到「播放」
    fireEvent.click(getMusicButton());
    expect(getMusicButton()).toHaveAccessibleName('播放旅程音乐');
  });

  it('场景7 · 高潮阶段推荐优先高刺激酒款', async () => {
    renderJourneyPage();
    await screen.findByRole('heading', { name: '旅程契合推荐' });

    logPhase('场景7 · → climax 验证推荐', { mood: null, intensity: 0.5 }, { mood: 'passion', intensity: 0.5 });
    // 进入高潮
    fireEvent.click(getMoodButton('热烈'));
    await waitFor(() => expectJourneyPhase('高潮', '炽'));

    // 推荐区前几款应包含高刺激酒（古典之事/涩格罗尼/盘尼西林之一）
    const recSection = screen.getByText('炽 · 高潮').closest('section') ?? document.body;
    const highStimNames = ['古典之事', '涩格罗尼', '盘尼西林'];
    const hasHighStim = highStimNames.some((name) =>
      within(recSection).queryByText(name) !== null,
    );
    expect(hasHighStim).toBe(true);
  });
});
