/**
 * RolePersonaPicker · 角色身份选择器
 *
 * 用户进入调酒页时选择角色身份（创业家/投资人/架构师）
 * 选择后系统按向量匹配该组内最接近的人物，输出人格标签 + 角色标签 + 酒体
 *
 * 交互：
 *   - 三角色卡片三选一 · 选中后高亮 + 微妙加深
 *   - 实时显示匹配结果（人物名 + MBTI · 人格标签 · 酒体）
 *   - 重置按钮 · 清空当前选择
 */

import { useState, useMemo } from 'react';
import { cocktailService } from '../../services/cocktailService';
import { useAppStore } from '../../store/appStore';
import type { RoleType, RoleMatchResult } from '../../types/role';
import GlassPanel from '../ui/GlassPanel';
import GradientButton from '../ui/GradientButton';

export default function RolePersonaPicker() {
  const { vector } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);

  const roles = useMemo(() => cocktailService.getRoles(), []);

  const matchResult: RoleMatchResult | null = useMemo(() => {
    if (!selectedRole) return null;
    return cocktailService.matchRolePersona(vector, selectedRole);
  }, [selectedRole, vector]);

  return (
    <GlassPanel gold padding="lg" className="mb-10">
      {/* 装饰光晕 · 跟随选中角色 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 transition-all duration-700"
        style={{
          background: selectedRole
            ? `radial-gradient(ellipse at 30% 0%, ${cocktailService.getRoleMeta(selectedRole).color}55 0%, transparent 65%)`
            : 'radial-gradient(ellipse at 30% 0%, #7c5fbf33 0%, transparent 65%)',
        }}
      />

      <div className="relative">
        {/* 标题区 */}
        <div className="mb-6">
          <span className="font-mono text-xs tracking-[0.3em] text-amethyst-400/80">
            ROLE · 角色身份
          </span>
          <h2 className="font-display text-2xl md:text-3xl text-gold-sheen text-shadow-glow-gold mt-1">
            今夜，你是哪一种人格？
          </h2>
          <p className="text-sm text-moon-200/65 italic mt-1">
            选择一种身份，让酒为你写下注脚。
          </p>
        </div>

        {/* 三角色选择卡 */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {roles.map((r) => {
            const active = selectedRole === r.type;
            return (
              <button
                key={r.type}
                type="button"
                onClick={() => setSelectedRole(r.type)}
                className={`group relative p-5 rounded-xl border text-left transition-all duration-400 overflow-hidden ${
                  active
                    ? 'border-transparent'
                    : 'border-amethyst-500/25 hover:border-amethyst-400/50'
                }`}
                style={
                  active
                    ? {
                        borderColor: `${r.color}80`,
                        background: `linear-gradient(135deg, ${r.color}18 0%, ${r.color}08 100%)`,
                        boxShadow: `0 0 24px ${r.color}25, inset 0 0 1px ${r.color}40`,
                      }
                    : undefined
                }
              >
                {/* 符号 */}
                <div
                  className="font-display text-3xl mb-2 transition-transform duration-400 group-hover:scale-110"
                  style={{ color: active ? r.color : '#b8a8d8' }}
                >
                  {r.symbol}
                </div>
                {/* 标签 */}
                <div className="font-display text-lg text-moon-50 tracking-[0.1em]">
                  {r.label}
                </div>
                <div className="font-mono text-[10px] tracking-[0.25em] text-moon-200/45 uppercase mt-0.5">
                  {r.en}
                </div>
                {/* 描述 */}
                <p className="text-xs text-moon-200/60 mt-2 leading-relaxed">
                  {r.description}
                </p>
                {/* 酒体关键词 */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {r.cocktailKeywords.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded-full text-[10px] tracking-[0.1em] border transition-colors duration-300"
                      style={{
                        color: active ? r.color : '#b8a8d899',
                        borderColor: active ? `${r.color}60` : '#7c5fbf33',
                        background: active ? `${r.color}12` : 'transparent',
                      }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* 匹配结果 */}
        {matchResult && (
          <div
            className="rounded-xl p-5 border transition-all duration-500 animate-fade-in"
            style={{
              borderColor: `${matchResult.role.color}40`,
              background: `linear-gradient(135deg, ${matchResult.role.color}10 0%, transparent 80%)`,
            }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <span
                  className="font-mono text-[10px] tracking-[0.3em] uppercase"
                  style={{ color: matchResult.role.color }}
                >
                  {matchResult.role.symbol} {matchResult.role.en} · Persona Match
                </span>
                <h3 className="font-display text-xl md:text-2xl text-gold-sheen text-shadow-glow-gold mt-1">
                  {matchResult.persona.name}
                </h3>
                {/* 输出长标签 · MBTI · 人格标签 · 角色型调酒 */}
                <p className="font-mono text-sm text-moon-50/90 mt-2 tracking-[0.05em]">
                  {matchResult.cocktailTag}
                </p>
                {/* 核心标签 */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {matchResult.persona.coreTags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-full text-[11px] tracking-[0.1em] border"
                      style={{
                        color: matchResult.role.color,
                        borderColor: `${matchResult.role.color}50`,
                        background: `${matchResult.role.color}10`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {/* 角色层调酒调整 · 风味偏移 + 特效 + 温度 + 服务备注 */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="glass rounded-lg p-2.5">
                    <div className="text-[9px] tracking-[0.2em] text-moon-200/40 uppercase font-mono">
                      风味偏移
                    </div>
                    <div
                      className="text-xs mt-1 font-medium"
                      style={{ color: matchResult.role.color }}
                    >
                      {matchResult.flavorAdjustment.flavorShiftLabel}
                    </div>
                  </div>
                  <div className="glass rounded-lg p-2.5">
                    <div className="text-[9px] tracking-[0.2em] text-moon-200/40 uppercase font-mono">
                      视觉特效
                    </div>
                    <div
                      className="text-xs mt-1 font-medium"
                      style={{ color: matchResult.role.color }}
                    >
                      {matchResult.flavorAdjustment.effectLabel}
                    </div>
                  </div>
                  <div className="glass rounded-lg p-2.5">
                    <div className="text-[9px] tracking-[0.2em] text-moon-200/40 uppercase font-mono">
                      温度倾向
                    </div>
                    <div
                      className="text-xs mt-1 font-medium"
                      style={{ color: matchResult.role.color }}
                    >
                      {matchResult.flavorAdjustment.temperatureLabel}
                    </div>
                  </div>
                  <div className="glass rounded-lg p-2.5">
                    <div className="text-[9px] tracking-[0.2em] text-moon-200/40 uppercase font-mono">
                      服务备注
                    </div>
                    <div className="text-xs mt-1 text-moon-200/75">
                      {matchResult.flavorAdjustment.servingNote}
                    </div>
                  </div>
                </div>
                {/* 专属调酒推荐 */}
                {matchResult.cocktail && (
                  <div className="mt-4 pt-4 border-t border-amethyst-500/15">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] tracking-[0.3em] uppercase font-mono"
                        style={{ color: matchResult.role.color }}
                      >
                        ◆ Signature Cocktail
                      </span>
                      <span className="text-[10px] text-moon-200/40 font-mono">
                        匹配度 {(matchResult.cocktail.matchScore).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h4 className="font-display text-lg text-gold-sheen">
                        {matchResult.cocktail.cocktail.name}
                      </h4>
                      <span className="font-mono text-xs text-moon-200/55">
                        {matchResult.cocktail.cocktail.nameEn}
                      </span>
                    </div>
                    <p className="text-xs text-moon-200/65 italic mt-1">
                      {matchResult.cocktail.cocktail.tagline}
                    </p>
                    <p className="text-xs text-moon-200/75 mt-2">
                      {matchResult.cocktail.cocktail.story}
                    </p>
                    {/* 推荐理由 · 取前 2 条 */}
                    {matchResult.cocktail.reasons.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {matchResult.cocktail.reasons.slice(0, 2).map((r, i) => (
                          <li
                            key={i}
                            className="text-[11px] text-moon-200/55 italic flex gap-1.5"
                          >
                            <span style={{ color: matchResult.role.color }}>·</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {/* 个人酒体风格 */}
                <div className="mt-4">
                  <span className="text-[10px] tracking-[0.25em] text-moon-200/45 uppercase font-mono">
                    Persona Cocktail Style
                  </span>
                  <p className="text-sm text-moon-200/85 mt-1 italic">
                    {matchResult.cocktailStyle}
                  </p>
                </div>
              </div>
              {/* 匹配度 */}
              {!matchResult.isDefault && (
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] tracking-[0.25em] text-moon-200/45 uppercase font-mono">
                    Match
                  </span>
                  <span
                    className="font-display text-2xl mt-1"
                    style={{ color: matchResult.role.color }}
                  >
                    {(matchResult.matchScore * 100).toFixed(0)}%
                  </span>
                  <div className="w-20 h-1 rounded-full bg-void-700/60 mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${matchResult.matchScore * 100}%`,
                        background: `linear-gradient(90deg, ${matchResult.role.color}80, ${matchResult.role.color})`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            {matchResult.isDefault && (
              <p className="text-[11px] text-moon-200/45 italic mt-3">
                尚未采集人格向量 · 已为你展示该角色组的代表人物
              </p>
            )}
          </div>
        )}

        {/* 重置按钮 */}
        {selectedRole && (
          <div className="mt-4 flex justify-end">
            <GradientButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRole(null)}
            >
              重置选择
            </GradientButton>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
