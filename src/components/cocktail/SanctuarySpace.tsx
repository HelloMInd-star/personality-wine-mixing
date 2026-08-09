/**
 * SanctuarySpace · 树洞空间 · 旅程收尾仪式
 *
 * 作为情绪旅程回路的最后一环 · 在 CocktailPage 末尾挂载
 * 三入口分别对应不同的情感出口：
 *   - AI 树洞 · 即将开启的功能入口（占位）
 *   - 情感博主征集 · 征集计划入口
 *   - 线下酒馆解忧 · 实体场所连接
 *
 * 暗号入口设计（征集计划保留但不写明）：
 *   - 底部留一个不显眼的「夜还在写」暗号 · 极低存在感
 *   - hover 时浮现暗纹 · 暗示有更深一层
 *   - 点击展开「酒馆征集」与「情感博主征集」说明 · 为下一层预留接口
 *   - 全程不显式标注「征集计划」字样 · 用诗化暗号承载
 *
 * 视觉语言：金边玻璃 + 暮紫光晕 · 呼应 closing 阶段归寂感
 */

import { useState } from 'react';
import GlassPanel from '../ui/GlassPanel';

/** 三入口类型 */
type SanctuaryEntry = 'ai-treehole' | 'blogger-call' | 'offline-tavern';

/** 入口元数据 */
const ENTRIES: {
  key: SanctuaryEntry;
  symbol: string;
  title: string;
  subtitle: string;
  desc: string;
  status: string;
  statusTone: 'soon' | 'open' | 'seek';
}[] = [
  {
    key: 'ai-treehole',
    symbol: '◯',
    title: 'AI 树洞',
    subtitle: 'AI Sanctuary',
    desc: '把今夜未说尽的话，交给一个不会评判的耳朵。',
    status: '即将开启',
    statusTone: 'soon',
  },
  {
    key: 'blogger-call',
    symbol: '✎',
    title: '情感博主征集',
    subtitle: 'Blogger Echo',
    desc: '你的故事或许正是某个人深夜里需要的那一杯。',
    status: '征集入口',
    statusTone: 'open',
  },
  {
    key: 'offline-tavern',
    symbol: '⌂',
    title: '线下酒馆解忧',
    subtitle: 'Offline Haven',
    desc: '有些情绪，需要在真实的杯沿与灯光下落地。',
    status: '寻找酒馆',
    statusTone: 'seek',
  },
];

/** 状态标签配色 */
const STATUS_COLOR: Record<string, string> = {
  soon: '#7c8db5', // 月蓝 · 待启
  open: '#d4af7a', // 香槟金 · 开放
  seek: '#6b5b95', // 暮紫 · 寻觅
};

/** 暗号展开后的征集说明 · 为下一层预留接口 */
const WHISPER_DETAILS: { title: string; desc: string; next: string }[] = [
  {
    title: '酒馆征集',
    desc: '寻找愿意在夜里点一盏灯、听一段故事的实体酒馆，成为 Y.Mine 的线下解忧节点。',
    next: '下一层 · 待启',
  },
  {
    title: '情感博主征集',
    desc: '征集愿意把夜里的情绪酿成文字的博主，让一杯酒的故事被更多人听见。',
    next: '征集入口 · 即将开放',
  },
];

export default function SanctuarySpace() {
  const [whisperOpen, setWhisperOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<SanctuaryEntry | null>(null);

  /** 入口点击 · 当前均为占位 · 仅切换高亮态 */
  const handleEntryClick = (key: SanctuaryEntry) => {
    setActiveEntry(activeEntry === key ? null : key);
  };

  return (
    <GlassPanel gold padding="lg" className="mb-10">
      {/* 收尾仪式光晕 · 暮紫归寂感 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 transition-all duration-700"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, #6b5b9544 0%, transparent 65%)',
        }}
      />

      <div className="relative">
        {/* 标题区 */}
        <div className="mb-6 text-center">
          <div className="text-[11px] tracking-[0.5em] text-amethyst-400/70 uppercase mb-2">
            Sanctuary · 树洞空间
          </div>
          <h2 className="font-display text-2xl md:text-3xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
            夜未尽 · 话未落
          </h2>
          <p className="text-sm text-moon-200/60 italic mt-2 max-w-md mx-auto">
            把这一杯余韵，交给一个愿意收下它的地方。
          </p>
        </div>

        {/* 三入口卡片 */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {ENTRIES.map((entry) => {
            const active = activeEntry === entry.key;
            const accent = STATUS_COLOR[entry.statusTone];
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => handleEntryClick(entry.key)}
                className={`group relative p-5 rounded-xl border text-left transition-all duration-400 overflow-hidden ${
                  active
                    ? 'border-transparent'
                    : 'border-amethyst-500/25 hover:border-amethyst-400/50'
                }`}
                style={
                  active
                    ? {
                        borderColor: `${accent}80`,
                        background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
                        boxShadow: `0 0 20px ${accent}25, inset 0 0 1px ${accent}40`,
                      }
                    : undefined
                }
              >
                {/* 符号 */}
                <div
                  className="font-display text-3xl mb-2 transition-transform duration-400 group-hover:scale-110"
                  style={{ color: active ? accent : '#b8a8d8' }}
                >
                  {entry.symbol}
                </div>
                {/* 标题 */}
                <div className="font-display text-lg text-moon-50 tracking-[0.1em]">
                  {entry.title}
                </div>
                <div className="font-mono text-[10px] tracking-[0.25em] text-moon-200/45 uppercase mt-0.5">
                  {entry.subtitle}
                </div>
                {/* 描述 */}
                <p className="text-xs text-moon-200/60 mt-2 leading-relaxed">
                  {entry.desc}
                </p>
                {/* 状态标签 */}
                <div className="mt-3 flex items-center gap-1.5">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full transition-all duration-400"
                    style={{
                      background: accent,
                      boxShadow: active ? `0 0 6px ${accent}` : 'none',
                    }}
                  />
                  <span
                    className="text-[10px] tracking-[0.15em] font-mono transition-colors duration-400"
                    style={{ color: active ? accent : '#b8a8d899' }}
                  >
                    {entry.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 占位提示 · 当前所有入口为即将开启状态 */}
        {activeEntry && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-white/[0.02] border border-amethyst-500/15 text-center">
            <p className="text-xs text-moon-200/55 italic">
              这扇门正在为你点亮 · 稍候片刻，夜会把它打开。
            </p>
          </div>
        )}

        {/* ── 暗号入口 · 征集计划保留但不写明 ── */}
        {/* 极低存在感 · hover 浮现暗纹 · 点击展开下一层说明 */}
        <div className="border-t border-amethyst-500/10 pt-4">
          <button
            type="button"
            onClick={() => setWhisperOpen(!whisperOpen)}
            className="group relative w-full text-center py-2 transition-all duration-500"
            aria-label="夜还在写 · 暗号入口"
          >
            {/* 暗号主文 · 极低存在感 */}
            <span className="text-[11px] tracking-[0.4em] text-moon-200/30 font-mono transition-colors duration-500 group-hover:text-moon-200/55">
              · 夜还在写 · 与我们共酿 ·
            </span>
            {/* hover 暗纹 · 暗示更深一层 · 不显式写明征集计划字样 */}
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              <span className="text-[9px] tracking-[0.6em] text-gold-400/20 font-mono italic">
                ⟡ 还有更深一层 ⟡
              </span>
            </span>
          </button>

          {/* 暗号展开 · 征集计划说明 · 为下一层预留接口 */}
          {whisperOpen && (
            <div className="mt-4 animate-fade-in">
              <div className="text-center mb-4">
                <p className="text-xs text-moon-200/50 italic leading-relaxed max-w-lg mx-auto">
                  有些事不必现在写明 · 它们已经在夜里发生 ·
                  如果你愿意成为其中一盏灯 · 这里是入口
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {WHISPER_DETAILS.map((detail) => (
                  <div
                    key={detail.title}
                    className="rounded-lg p-3.5 border border-amethyst-500/15 bg-white/[0.02] transition-all duration-400 hover:border-gold-400/30 hover:bg-gold-400/[0.03]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-display text-sm text-moon-50/85 tracking-[0.1em]">
                        {detail.title}
                      </span>
                      <span className="text-[9px] tracking-[0.2em] text-amethyst-400/50 font-mono uppercase">
                        {detail.next}
                      </span>
                    </div>
                    <p className="text-[11px] text-moon-200/55 leading-relaxed">
                      {detail.desc}
                    </p>
                  </div>
                ))}
              </div>
              {/* 创意吧台预告 · 下一层规划 · 不实施 */}
              <div className="mt-4 text-center">
                <p className="text-[10px] tracking-[0.3em] text-moon-200/30 font-mono italic">
                  之后 · 创意吧台 · 气味精油 · MBTI 酒局分组
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
