/**
 * MbtiPartyPage · MBTI 酒局页面
 *
 * 把 Y.Mine 核心能力（人格调酒、角色系统、气味映射、共创机制）
 * 整合到一个酒桌形态的界面里 · 让用户像进入一场游戏一样进入酒局
 *
 * 页面结构：
 *   ① 顶部：4 张酒桌卡片（主入口）
 *   ② 中部：酒局主场景 Canvas 可视化
 *   ③ 底部：交互面板（角色/酒局/调酒匹配/回合控制）
 *   ④ 底部下方：语言者友好入口
 *
 * 状态机：
 *   waiting → mixing → revealing
 *   - waiting：选角色 + 选酒桌 + 进入回合
 *   - mixing：4 步调酒 + 依次轮到每位玩家
 *   - revealing：联合酒体融合结果
 */

import { useState, useCallback, useMemo } from 'react';
import PartyTableCard from '../components/mbtiparty/PartyTableCard';
import PartyVisualization from '../components/mbtiparty/PartyVisualization';
import PartyControlPanel from '../components/mbtiparty/PartyControlPanel';
import LanguageFriendlyEntry from '../components/mbtiparty/LanguageFriendlyEntry';
import CocktailRevealStage from '../components/mbtiparty/CocktailRevealStage';
import MbtiCardRevealStage from '../components/mbtiparty/MbtiCardRevealStage';
import GlassPanel from '../components/ui/GlassPanel';
import { loadPackagingConfig } from '../data/cardCustomization';
import type { PartyTable, PartySeat, PartyPhase, MixStep, MixChoice, TurnInfo, FusionCocktail } from '../types/mbtiParty';
import type { RoleType } from '../types/role';
import {
  PARTY_TABLES,
  TABLE1_MOCK_PLAYERS,
  TABLE2_MOCK_PLAYERS,
  computeFusionCocktail,
  getMbtiProfile,
  PARTY_ROLE_META,
} from '../data/mbtiPartyData';
import { useAppStore } from '../store/appStore';
import { resolveTimeSlot, describeBiologyShift } from '../engine/timeEngine';
import { DIM_LABEL } from '../types/personaFusion';

/** 4 步调酒顺序 */
const STEP_ORDER: MixStep[] = ['base', 'flavor', 'temperature', 'garnish'];

/** 把 MockPlayer 列表 + 当前用户 → 转换为 4 个 PartySeat */
function buildSeats(
  mockPlayers: { name: string; mbti: string; role: RoleType; cocktailName: string }[],
  currentUserMbti: string,
  currentUserRole: RoleType,
): PartySeat[] {
  const seats: PartySeat[] = [
    {
      index: 0,
      name: '你',
      mbti: currentUserMbti,
      role: currentUserRole,
      isCurrentUser: true,
      isEmpty: false,
      hasFinished: false,
    },
  ];
  // 把 mock 玩家依次填入 seat 1,2,3
  // mock 玩家初始即已完成（已在桌上就位且调好了酒）· 用户完成后即揭示
  for (let i = 0; i < 3; i++) {
    const mock = mockPlayers[i];
    if (mock) {
      seats.push({
        index: i + 1,
        name: mock.name,
        mbti: mock.mbti,
        role: mock.role,
        isEmpty: false,
        hasFinished: true,
        cocktailName: mock.cocktailName,
      });
    } else {
      seats.push({
        index: i + 1,
        isEmpty: true,
        hasFinished: false,
      });
    }
  }
  return seats;
}

export default function MbtiPartyPage() {
  // 当前用户的 MBTI · 优先从画像派生（这里简化用 profile.archetype.code 取首 4 字符作为 mock）
  // 实际项目中应从画像问卷派生 MBTI · 此处暂用 "INTJ" 作为占位
  const userMbti = useMemo(() => 'INTJ', []);

  // 时段校准 · 从全局 store 读取 manualTimeSlot · 影响酒局氛围
  const { manualTimeSlot, setManualTimeSlot } = useAppStore();
  const currentSlot = resolveTimeSlot(new Date(), manualTimeSlot);
  const bioShifts = describeBiologyShift(currentSlot);

  // ── 状态 ──
  const [selectedTable, setSelectedTable] = useState<PartyTable | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [phase, setPhase] = useState<PartyPhase>('waiting');
  const [seats, setSeats] = useState<PartySeat[]>([]);
  const [turn, setTurn] = useState<TurnInfo | null>(null);
  const [currentStep, setCurrentStep] = useState<MixStep | null>(null);
  const [choices, setChoices] = useState<Partial<Record<MixStep, string>>>({});
  const [fusion, setFusion] = useState<FusionCocktail | null>(null);
  const [activeParticleColor, setActiveParticleColor] = useState<string | undefined>(undefined);
  // 揭示 key · 每次进入 revealing 递增 · 触发 CocktailRevealStage 与 MbtiCardRevealStage 重挂载以重播入场动画
  const [revealKey, setRevealKey] = useState(0);

  // 包装定制偏好 · 从 localStorage 读取 · 用户在 CardsPage「周边定制」区块设定
  // 默认夜绒+镜月 · 与牌盒取出动画共用
  const packagingConfig = useMemo(() => loadPackagingConfig(), []);

  // ── ① 选酒桌 ──
  const handleTableSelect = useCallback((table: PartyTable) => {
    setSelectedTable(table);
  }, []);

  // ── ② 选角色 ──
  const handleRoleSelect = useCallback((role: RoleType) => {
    setSelectedRole(role);
  }, []);

  // ── ③ 进入回合 · 初始化座位 + 进入 mixing ──
  const handleEnterMixing = useCallback(() => {
    if (!selectedTable || !selectedRole) return;

    // 根据酒桌类型决定 mock 玩家填充
    let mockPlayers: { name: string; mbti: string; role: RoleType; cocktailName: string }[] = [];
    if (selectedTable.id === 1) {
      // INTJ 局 · 4 人全满 · 当前用户作为第 4 人加入
      // 前 3 个座位用 mock · 当前用户在第 0 座
      mockPlayers = TABLE1_MOCK_PLAYERS.slice(0, 3);
    } else if (selectedTable.id === 2) {
      // ENFP 局 · 3 ENFP 已就位 · 当前用户加入即满桌（4/4）
      // 测试场景：3 ENFP 同型粒子融合 + 1 当前用户（INTJ）形成张力
      mockPlayers = TABLE2_MOCK_PLAYERS.slice(0, 3);
    } else {
      // 自由桌 · 仅当前用户 · 其他空
      mockPlayers = [];
    }

    const newSeats = buildSeats(mockPlayers, userMbti, selectedRole);
    setSeats(newSeats);
    setPhase('mixing');
    setCurrentStep('base');
    setChoices({});
    setFusion(null);

    // turn 指向当前用户（seat 0）
    const profile = getMbtiProfile(userMbti);
    const roleMeta = PARTY_ROLE_META[selectedRole];
    setTurn({
      seatIndex: 0,
      mbtiLabel: `${userMbti} · ${profile.nickname}`,
      roleLabel: `${roleMeta.symbol} ${roleMeta.label}`,
    });
  }, [selectedTable, selectedRole, userMbti]);

  // ── ④ 调酒选择 · 推进步骤 ──
  const handleChoice = useCallback(
    (choice: MixChoice) => {
      setChoices((prev) => ({ ...prev, [choice.step]: choice.label }));
      // 触发临时粒子色
      if (choice.particleColor) {
        setActiveParticleColor(choice.particleColor);
        // 2 秒后清除 · 让粒子色回归 MBTI 主色
        setTimeout(() => setActiveParticleColor(undefined), 2000);
      }
      // 推进到下一步
      const idx = STEP_ORDER.indexOf(choice.step);
      if (idx < STEP_ORDER.length - 1) {
        setCurrentStep(STEP_ORDER[idx + 1]);
      }
    },
    [],
  );

  // ── ⑤ 完成本回合 · 推进 turn ──
  // mock 玩家初始即已完成 · 用户完成即所有座位完成 → 揭示
  const handleFinishTurn = useCallback(() => {
    if (!turn) return;

    // 标记当前 seat 已完成 · 用 4 步选择组合作为 cocktailName
    const chosenLabels = STEP_ORDER.map((s) => choices[s]).filter(Boolean);
    const cocktailName = chosenLabels.length > 0 ? chosenLabels.join('·') : '一杯独饮';

    setSeats((prev) => {
      const next = [...prev];
      next[turn.seatIndex] = {
        ...next[turn.seatIndex],
        hasFinished: true,
        cocktailName: turn.seatIndex === 0 ? cocktailName : next[turn.seatIndex].cocktailName,
      };

      // 检查是否所有非空座位都已完成
      const allDone = next.every((s) => s.isEmpty || s.hasFinished);
      if (allDone) {
        const completedCodes = next.filter((s) => !s.isEmpty && s.mbti).map((s) => s.mbti!);
        const newFusion = computeFusionCocktail(completedCodes);
        setFusion(newFusion);
        setPhase('revealing');
        setTurn(null);
        setCurrentStep(null);
        setRevealKey((k) => k + 1); // 重播滴管入场动画
      }
      return next;
    });
  }, [turn, choices]);

  // ── 重置 ──
  const handleReset = useCallback(() => {
    setSelectedTable(null);
    setSelectedRole(null);
    setPhase('waiting');
    setSeats([]);
    setTurn(null);
    setCurrentStep(null);
    setChoices({});
    setFusion(null);
    setActiveParticleColor(undefined);
  }, []);

  // ── 重看揭示 ──
  const handleReveal = useCallback(() => {
    if (seats.length === 0) return;
    const codes = seats.filter((s) => !s.isEmpty && s.mbti).map((s) => s.mbti!);
    setFusion(computeFusionCocktail(codes));
    setPhase('revealing');
    setRevealKey((k) => k + 1); // 重播滴管入场动画
  }, [seats]);

  // ── 快速演示 · DEV 模式 · 跳过选桌/选角/调酒 · 直达揭示阶段 ──
  // 构造模拟 MBTI 用户数据（INTJ + 3 INTJ mock 玩家）· 立即触发卡片揭示
  const handleQuickDemo = useCallback(() => {
    const table = PARTY_TABLES[0]; // 桌1 · INTJ 局
    const role: RoleType = 'architect';
    const mockPlayers = TABLE1_MOCK_PLAYERS.slice(0, 3);
    const newSeats = buildSeats(mockPlayers, userMbti, role);
    // 填充默认调酒选择 · 让当前用户也"已完成"
    const defaultChoices: Partial<Record<MixStep, string>> = {
      base: '威士忌',
      flavor: '木质',
      temperature: '低温慢饮',
      garnish: '柑橘皮',
    };
    const cocktailName = STEP_ORDER.map((s) => defaultChoices[s]).filter(Boolean).join('·');
    newSeats[0] = { ...newSeats[0], hasFinished: true, cocktailName };
    setSeats(newSeats);
    setSelectedTable(table);
    setSelectedRole(role);
    setChoices(defaultChoices);
    const completedCodes = newSeats.filter((s) => !s.isEmpty && s.mbti).map((s) => s.mbti!);
    setFusion(computeFusionCocktail(completedCodes));
    setPhase('revealing');
    setRevealKey((k) => k + 1);
    setTimeout(() => {
      document.getElementById('party-scene')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [userMbti]);

  // 进入酒桌 · 滚动到主场景
  const handleEnterTable = useCallback(() => {
    if (selectedTable && selectedRole) {
      // 滚动到主场景
      document.getElementById('party-scene')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedTable, selectedRole]);

  return (
    <div className="min-h-screen px-4 lg:px-10 py-8 lg:py-12 max-w-7xl mx-auto">
      {/* 顶部标题 */}
      <header className="mb-8 text-center">
        <div className="text-[11px] tracking-[0.5em] text-amethyst-400/70 uppercase font-mono mb-2">
          MBTI Party · 人格博弈空间
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.18em]">
          MBTI 酒局
        </h1>
        <p className="text-sm text-moon-200/60 italic mt-3 max-w-xl mx-auto leading-relaxed">
          轻互动 · 有社交感 · 多人参与 · 把人格调酒、角色系统、气味映射、共创机制
          整合到一个酒桌形态的界面里。
        </p>

        {/* 时段校准 · 影响酒局氛围 */}
        <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] tracking-widest max-w-xl">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-breathe"
            style={{ background: currentSlot.auraColor, boxShadow: `0 0 8px ${currentSlot.auraColor}` }}
          />
          <span className="text-moon-200/60">酒局时辰</span>
          <span className="font-display text-gold-sheen">{currentSlot.label}</span>
          <span className="text-amethyst-400/40">·</span>
          <span className="text-moon-200/50 italic">{currentSlot.biologyNote}</span>
          {bioShifts.length > 0 && (
            <span className="text-amethyst-300/50 font-mono text-[10px] ml-1">
              ({bioShifts.map(({ dim, sign, delta }) => `${DIM_LABEL[dim]}${sign}${delta.toFixed(2)}`).join(' ')})
            </span>
          )}
          {manualTimeSlot && (
            <button
              type="button"
              onClick={() => setManualTimeSlot(null)}
              className="text-[10px] text-amethyst-400/40 hover:text-gold-400 transition-colors ml-1"
            >
              ↺ 系统时间
            </button>
          )}
        </div>

        {/* DEV · 快速演示按钮 · 直达卡片揭示阶段 */}
        {import.meta.env.DEV && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="glass border border-gold-400/40 rounded-full px-5 py-1.5 text-[11px] text-gold-sheen hover:border-gold-400/70 hover:shadow-glow-gold transition-all tracking-widest"
            >
              ⚡ 快速演示 · 直达卡片揭示
            </button>
          </div>
        )}
      </header>

      {/* ① 酒桌选择 · 主入口 */}
      <section className="mb-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="text-[10px] tracking-[0.35em] text-amethyst-400/60 uppercase font-mono">
              ① Tables
            </div>
            <h2 className="font-display text-lg text-moon-50/90 tracking-[0.1em] mt-1">
              选一张酒桌 · 像选一场游戏
            </h2>
          </div>
          {selectedTable && (
            <div className="text-[11px] text-gold-400/70 font-mono tracking-[0.15em]">
              已选 · {selectedTable.label}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PARTY_TABLES.map((table) => (
            <PartyTableCard
              key={table.id}
              table={table}
              active={selectedTable?.id === table.id}
              onSelect={handleTableSelect}
            />
          ))}
        </div>
      </section>

      {/* ② 酒局主场景 */}
      <section id="party-scene" className="mb-8">
        <GlassPanel gold padding="lg" className="overflow-hidden">
          {/* 装饰光晕 */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: selectedTable
                ? `radial-gradient(ellipse at 50% 50%, ${selectedTable.accentColor}22 0%, transparent 60%)`
                : 'radial-gradient(ellipse at 50% 50%, rgba(124, 95, 191, 0.15) 0%, transparent 60%)',
            }}
          />
          <div className="relative">
            <div className="mb-4 text-center">
              <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase font-mono">
                ② Main Scene · 主场景
              </div>
              <h2 className="font-display text-lg text-moon-50/90 tracking-[0.1em] mt-1">
                {selectedTable ? selectedTable.label : '尚未选桌'}
                {selectedTable?.tagline && (
                  <span className="ml-3 text-[12px] text-moon-200/45 italic">
                    · {selectedTable.tagline}
                  </span>
                )}
              </h2>
            </div>

            {/* Canvas 可视化 · 居中 */}
            <div className="flex justify-center">
              <PartyVisualization
                seats={seats.length > 0 ? seats : Array.from({ length: 4 }, (_, i) => ({ index: i, isEmpty: true, hasFinished: false }))}
                phase={phase}
                turn={turn}
                fusion={fusion}
                activeParticleColor={activeParticleColor}
                size={520}
              />
            </div>

            {/* 当前阶段元数据 */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[10px] text-moon-200/50 font-mono tracking-[0.15em] uppercase">
              <span>Phase · {phase}</span>
              <span className="text-amethyst-400/30">|</span>
              <span>
                Seats · {seats.filter((s) => !s.isEmpty).length}/{seats.length || 4}
              </span>
              <span className="text-amethyst-400/30">|</span>
              <span>
                Finished · {seats.filter((s) => !s.isEmpty && s.hasFinished).length}
              </span>
              {turn && (
                <>
                  <span className="text-amethyst-400/30">|</span>
                  <span className="text-gold-400/70">Turn · {turn.mbtiLabel}</span>
                </>
              )}
            </div>
          </div>
        </GlassPanel>
      </section>

      {/* ②+ 酒款揭示舞台 · revealing 阶段特写 · 替代纯文字揭示 */}
      {phase === 'revealing' && fusion && (
        <section className="mb-8 animate-fade-in">
          <GlassPanel gold padding="lg" className="overflow-hidden">
            {/* 氛围光晕 · 主色渲染 */}
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                background: `radial-gradient(ellipse at 50% 40%, ${fusion.primaryColor}33 0%, transparent 65%)`,
              }}
            />
            <div className="relative">
              <div className="mb-5 text-center">
                <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase font-mono">
                  ②+ Reveal · 酒款揭示
                </div>
                <h2 className="font-display text-lg text-moon-50/90 tracking-[0.1em] mt-1">
                  一杯已为你酿成
                </h2>
              </div>
              <div className="flex justify-center">
                <CocktailRevealStage key={revealKey} fusion={fusion} size={360} />
              </div>
            </div>
          </GlassPanel>
        </section>
      )}

      {/* ②++ 人格卡牌揭示舞台 · revealing 阶段 · 牌盒取出动画
          每位玩家一张定制 MBTI 卡 · 背景与底色统一为酒局主色调暗
          包装材质与烫金纹样来自用户在 CardsPage 的「周边定制」偏好 */}
      {phase === 'revealing' && fusion && fusion.participants.length > 0 && (
        <section className="mb-8 animate-fade-in">
          <GlassPanel gold padding="lg" className="overflow-hidden">
            {/* 氛围光晕 · 与卡牌底色同源 */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: `radial-gradient(ellipse at 50% 30%, ${fusion.primaryColor}22 0%, transparent 65%)`,
              }}
            />
            <div className="relative">
              <div className="mb-5 text-center">
                <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase font-mono">
                  ②++ Cards · 人格卡牌
                </div>
                <h2 className="font-display text-lg text-moon-50/90 tracking-[0.1em] mt-1">
                  每人一杯 · 一张定制的牌
                </h2>
                <p className="text-[11px] text-moon-200/45 italic mt-1">
                  从牌盒抽出 · 底色织入这一局的调
                </p>
              </div>
              <div className="flex justify-center">
                <MbtiCardRevealStage
                  key={`cards-${revealKey}`}
                  codes={fusion.participants}
                  partyPrimaryColor={fusion.primaryColor}
                  packaging={packagingConfig}
                  size={360}
                />
              </div>
            </div>
          </GlassPanel>
        </section>
      )}

      {/* ③ 底部交互面板 */}
      <PartyControlPanel
        phase={phase}
        selectedRole={selectedRole}
        onRoleSelect={handleRoleSelect}
        currentStep={currentStep}
        choices={choices}
        onChoice={handleChoice}
        onEnterTable={handleEnterTable}
        onEnterMixing={handleEnterMixing}
        onFinishTurn={handleFinishTurn}
        onReveal={handleReveal}
        onReset={handleReset}
        userMbti={userMbti}
      />

      {/* ④ 语言者友好入口 */}
      <LanguageFriendlyEntry />

      {/* 底部空间 · 呼应 closing */}
      <div className="h-12" />
    </div>
  );
}
