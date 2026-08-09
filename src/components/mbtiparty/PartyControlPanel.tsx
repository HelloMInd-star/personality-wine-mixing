/**
 * PartyControlPanel · 底部交互面板
 *
 * 模块分层（按酒局阶段切换可见性）：
 *   ① 角色选择 · 创业家 / 投资人 / 设计师 · 决定调酒风格倾向
 *   ② 酒局选择 · 进入 / 创建酒局
 *   ③ 调酒匹配 · 4 步选择（基酒→风味→温度→装饰） · 触发粒子色变
 *   ④ 回合控制 · 匹配 / 完成 / 跳过
 *
 * 视觉语言：磨砂玻璃 + 紫金基调 · 与全站一致
 * 交互：鼠标点入时只加深的微妙高亮 · 不喧宾夺主
 */

import GlassPanel from '../ui/GlassPanel';
import type { RoleType } from '../../types/role';
import type { PartyPhase, MixStep, MixChoice } from '../../types/mbtiParty';
import { MIX_OPTIONS, MIX_STEP_META, PARTY_ROLE_META } from '../../data/mbtiPartyData';

export interface PartyControlPanelProps {
  phase: PartyPhase;
  /** 当前选择的角色 */
  selectedRole: RoleType | null;
  onRoleSelect: (role: RoleType) => void;
  /** 当前调酒步骤 */
  currentStep: MixStep | null;
  /** 已完成的调酒选择 · step → label */
  choices: Partial<Record<MixStep, string>>;
  onChoice: (choice: MixChoice) => void;
  /** 进入下一阶段 */
  onEnterTable: () => void;
  onEnterMixing: () => void;
  onFinishTurn: () => void;
  onReveal: () => void;
  onReset: () => void;
  /** 当前用户的 MBTI · 用于显示调酒风格预测 */
  userMbti?: string;
}

export default function PartyControlPanel({
  phase,
  selectedRole,
  onRoleSelect,
  currentStep,
  choices,
  onChoice,
  onEnterTable,
  onEnterMixing,
  onFinishTurn,
  onReveal,
  onReset,
  userMbti,
}: PartyControlPanelProps) {
  return (
    <GlassPanel gold padding="lg" className="mb-8">
      <div className="relative">
        {/* 顶部小标题 */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-amethyst-400/70 uppercase font-mono">
              Control Panel · 底部交互
            </div>
            <h3 className="font-display text-base text-moon-50/90 tracking-[0.1em] mt-1">
              {phase === 'waiting' && '选择角色 · 让酒为你写下注脚'}
              {phase === 'mixing' && '调酒中 · 选择每一步 · 触发粒子变化'}
              {phase === 'revealing' && '联合酒体 · 已揭示'}
            </h3>
          </div>
          {/* 重置按钮 */}
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] tracking-[0.25em] text-moon-200/45 hover:text-moon-200/70 font-mono uppercase transition-colors"
          >
            ↺ 重置
          </button>
        </div>

        {/* ① 角色选择 · waiting 阶段可见 */}
        {phase === 'waiting' && (
          <div className="mb-5">
            <div className="text-[10px] tracking-[0.3em] text-moon-200/50 font-mono uppercase mb-2.5">
              ① 角色选择
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {(Object.keys(PARTY_ROLE_META) as RoleType[]).map((role) => {
                const meta = PARTY_ROLE_META[role];
                const active = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onRoleSelect(role)}
                    className={`group relative p-3 rounded-lg border text-left transition-all duration-400 ${
                      active
                        ? 'border-transparent'
                        : 'border-amethyst-500/20 hover:border-amethyst-400/45'
                    }`}
                    style={
                      active
                        ? {
                            borderColor: `${meta.color}80`,
                            background: `linear-gradient(135deg, ${meta.color}18 0%, ${meta.color}08 100%)`,
                            boxShadow: `0 0 16px ${meta.color}25`,
                          }
                        : undefined
                    }
                  >
                    <div
                      className="font-display text-2xl mb-1 transition-transform duration-400 group-hover:scale-110"
                      style={{ color: active ? meta.color : '#b8a8d8' }}
                    >
                      {meta.symbol}
                    </div>
                    <div className="font-display text-sm text-moon-50/90">{meta.label}</div>
                    <div className="text-[10px] text-moon-200/45 mt-0.5">
                      {role === 'entrepreneur' && '辛辣 · 火焰'}
                      {role === 'investor' && '木质 · 干冰'}
                      {role === 'architect' && '分层 · 结构'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ② 酒局选择 · waiting 阶段可见 */}
        {phase === 'waiting' && (
          <div className="mb-5">
            <div className="text-[10px] tracking-[0.3em] text-moon-200/50 font-mono uppercase mb-2.5">
              ② 酒局选择
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onEnterTable}
                disabled={!selectedRole}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gold-400/30 bg-gold-400/[0.04] text-gold-sheen font-display text-sm tracking-[0.1em] transition-all duration-400 hover:bg-gold-400/[0.08] hover:border-gold-400/55 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                进入酒桌
              </button>
              <button
                type="button"
                disabled
                className="flex-1 px-4 py-2.5 rounded-lg border border-amethyst-500/20 text-moon-200/45 font-display text-sm tracking-[0.1em] cursor-not-allowed"
                title="下一层 · 待启"
              >
                创建酒局 · 待启
              </button>
            </div>
            {!selectedRole && (
              <p className="text-[10px] text-moon-200/35 italic mt-2 tracking-[0.05em]">
                先选一种角色 · 再进入酒桌
              </p>
            )}
          </div>
        )}

        {/* ③ 调酒匹配 · mixing 阶段可见 */}
        {phase === 'mixing' && currentStep && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] tracking-[0.3em] text-moon-200/50 font-mono uppercase">
                ③ 调酒匹配
              </div>
              {/* 步骤进度条 · 4 段 */}
              <div className="flex gap-1">
                {MIX_STEP_META.map((meta, i) => {
                  const isActive = meta.step === currentStep;
                  const isDone = choices[meta.step] !== undefined;
                  // 当前步骤在 MIX_STEP_META 中的索引
                  const currentIdx = MIX_STEP_META.findIndex((m) => m.step === currentStep);
                  const isPast = i < currentIdx;
                  return (
                    <span
                      key={meta.step}
                      className="h-0.5 w-8 rounded-full transition-all duration-400"
                      style={{
                        background: isActive
                          ? '#f0c674'
                          : isDone || isPast
                            ? 'rgba(240, 198, 116, 0.55)'
                            : 'rgba(155, 123, 212, 0.18)',
                        boxShadow: isActive ? '0 0 6px rgba(240, 198, 116, 0.55)' : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* 当前步骤提示 */}
            <div className="mb-3 px-3 py-2 rounded-md bg-white/[0.02] border border-amethyst-500/15">
              <div className="text-[11px] text-gold-400/70 font-display tracking-[0.08em]">
                {MIX_STEP_META.find((m) => m.step === currentStep)?.label}
              </div>
              <div className="text-[10px] text-moon-200/45 mt-0.5">
                {MIX_STEP_META.find((m) => m.step === currentStep)?.hint}
                {userMbti && (
                  <span className="ml-2 text-amethyst-400/55">· 当前 {userMbti}</span>
                )}
              </div>
            </div>

            {/* 当前步骤可选项 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MIX_OPTIONS[currentStep].map((opt) => {
                const selected = choices[currentStep] === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onChoice(opt)}
                    className={`relative px-3 py-2 rounded-md border text-[12px] font-display tracking-[0.08em] transition-all duration-300 ${
                      selected
                        ? 'border-transparent text-moon-50'
                        : 'border-amethyst-500/20 text-moon-200/70 hover:border-amethyst-400/45'
                    }`}
                    style={
                      selected && opt.particleColor
                        ? {
                            borderColor: `${opt.particleColor}80`,
                            background: `linear-gradient(135deg, ${opt.particleColor}22 0%, ${opt.particleColor}10 100%)`,
                            boxShadow: `0 0 10px ${opt.particleColor}30`,
                          }
                        : undefined
                    }
                  >
                    {opt.label}
                    {selected && (
                      <span
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                        style={{
                          background: opt.particleColor ?? '#f0c674',
                          boxShadow: `0 0 6px ${opt.particleColor ?? '#f0c674'}`,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 已完成步骤的小标签 · 显示已选内容 */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {MIX_STEP_META.map((meta) => {
                const val = choices[meta.step];
                if (!val) return null;
                return (
                  <span
                    key={meta.step}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-gold-400/25 text-gold-400/70 font-mono tracking-[0.1em]"
                  >
                    {meta.label} · {val}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ④ 回合控制 · 三种按钮 · 按阶段切换 */}
        <div className="flex flex-wrap gap-2.5 pt-4 border-t border-amethyst-500/10">
          {phase === 'waiting' && (
            <button
              type="button"
              onClick={onEnterMixing}
              disabled={!selectedRole}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amethyst-500/30 to-gold-400/20 text-moon-50 font-display text-sm tracking-[0.1em] border border-gold-400/40 transition-all duration-400 hover:from-amethyst-500/40 hover:to-gold-400/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              进入回合 · 开始调酒
            </button>
          )}
          {phase === 'mixing' && (
            <>
              <button
                type="button"
                onClick={onFinishTurn}
                disabled={!currentStep || choices[currentStep] === undefined}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amethyst-500/30 to-gold-400/20 text-moon-50 font-display text-sm tracking-[0.1em] border border-gold-400/40 transition-all duration-400 hover:from-amethyst-500/40 hover:to-gold-400/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                完成本回合
              </button>
              <button
                type="button"
                onClick={onFinishTurn}
                className="px-4 py-2.5 rounded-lg border border-amethyst-500/25 text-moon-200/55 font-display text-sm tracking-[0.1em] transition-all duration-400 hover:border-amethyst-400/45 hover:text-moon-200/80"
              >
                跳过
              </button>
            </>
          )}
          {phase === 'revealing' && (
            <button
              type="button"
              onClick={onReset}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amethyst-500/30 to-gold-400/20 text-moon-50 font-display text-sm tracking-[0.1em] border border-gold-400/40 transition-all duration-400 hover:from-amethyst-500/40 hover:to-gold-400/30"
            >
              再来一局
            </button>
          )}
          {phase === 'revealing' && (
            <button
              type="button"
              onClick={onReveal}
              className="px-4 py-2.5 rounded-lg border border-gold-400/30 text-gold-400/75 font-display text-sm tracking-[0.1em] transition-all duration-400 hover:border-gold-400/55 hover:text-gold-400"
            >
              ↻ 重看揭示
            </button>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
