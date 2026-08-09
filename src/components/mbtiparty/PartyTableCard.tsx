/**
 * PartyTableCard · 酒桌卡片
 *
 * 主入口形态：显示桌号、当前人数、锁定人格类型、状态
 * 视觉语言：
 *   - 磨砂玻璃容器 + 主色边光
 *   - 锁定桌用 MBTI 主色作为 accent · 自由桌用紫金
 *   - 状态用色点 + 文字双标识 · 不喧宾夺主
 *   - 鼠标点入时只加深的微妙交互（呼应侧栏 nav-item 风格）
 */

import GlassPanel from '../ui/GlassPanel';
import type { PartyTable } from '../../types/mbtiParty';

export interface PartyTableCardProps {
  table: PartyTable;
  active: boolean;
  onSelect: (table: PartyTable) => void;
}

/** 状态色 · 与 STATUS_COLOR 一致 */
const STATUS_TONE: Record<PartyTable['status'], { color: string; label: string }> = {
  empty: { color: '#7c8db5', label: '空' },
  waiting: { color: '#d4af7a', label: '等位中' },
  'in-progress': { color: '#9b7bd4', label: '进行中' },
  full: { color: '#6b5b95', label: '已满' },
};

export default function PartyTableCard({ table, active, onSelect }: PartyTableCardProps) {
  const tone = STATUS_TONE[table.status];
  const disabled = table.status === 'full';

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(table)}
      disabled={disabled}
      aria-label={`${table.label} · ${tone.label} · ${table.seatCount}/${table.seatCapacity}`}
      className="group block w-full text-left disabled:cursor-not-allowed focus:outline-none"
    >
      <GlassPanel
        gold={active}
        padding="md"
        className={`transition-all duration-500 ${
          active
            ? 'shadow-glow-amethyst'
            : disabled
              ? 'opacity-50'
              : 'group-hover:-translate-y-0.5'
        }`}
        style={
          active
            ? { boxShadow: `0 0 24px ${table.accentColor}30, inset 0 0 1px ${table.accentColor}40` }
            : undefined
        }
      >
        {/* 顶部主色光带 · 锁定桌用 MBTI 色 · 自由桌用紫金 */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${table.accentColor}80, transparent)`,
          }}
        />

        {/* 桌号 + 锁定标识 */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] tracking-[0.35em] text-amethyst-400/70 uppercase font-mono">
              Table · 桌 {table.id}
            </div>
            <div className="font-display text-lg text-moon-50/90 mt-1 tracking-[0.08em]">
              {table.lockMode === 'locked' && table.lockedMbti
                ? table.lockedMbti
                : table.lockMode === 'free'
                  ? '自由'
                  : '—'}
            </div>
          </div>
          {/* 锁定/自由标识符 */}
          {table.lockMode === 'locked' ? (
            <span
              className="text-[9px] tracking-[0.25em] font-mono px-1.5 py-0.5 rounded border"
              style={{
                color: table.accentColor,
                borderColor: `${table.accentColor}40`,
                background: `${table.accentColor}10`,
              }}
            >
              LOCK
            </span>
          ) : (
            <span className="text-[9px] tracking-[0.25em] font-mono px-1.5 py-0.5 rounded border border-gold-400/30 text-gold-400/70 bg-gold-400/[0.04]">
              FREE
            </span>
          )}
        </div>

        {/* 状态条 · 色点 + 文字 + 座位进度 */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              background: tone.color,
              boxShadow: `0 0 6px ${tone.color}80`,
            }}
          />
          <span className="text-[11px] text-moon-200/65 tracking-[0.1em]">{tone.label}</span>
          <span className="ml-auto font-mono text-[11px] text-moon-200/55">
            {table.seatCount}/{table.seatCapacity}
          </span>
        </div>

        {/* 座位进度条 · 4 段 */}
        <div className="flex gap-1 mb-3">
          {Array.from({ length: table.seatCapacity }).map((_, i) => (
            <span
              key={i}
              className="flex-1 h-0.5 rounded-full transition-all duration-500"
              style={{
                background:
                  i < table.seatCount
                    ? table.accentColor
                    : 'rgba(155, 123, 212, 0.12)',
                boxShadow: i < table.seatCount ? `0 0 4px ${table.accentColor}60` : 'none',
              }}
            />
          ))}
        </div>

        {/* 标语 · 一句话气质 */}
        {table.tagline && (
          <p className="text-[11px] text-moon-200/50 italic leading-relaxed">
            {table.tagline}
          </p>
        )}
      </GlassPanel>
    </button>
  );
}
