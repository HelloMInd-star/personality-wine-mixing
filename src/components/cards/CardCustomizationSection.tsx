/**
 * CardCustomizationSection · 周边定制区块
 *
 * CardsPage 底部的周边产品牌定制入口 · 与牌类人格采集解耦：
 *   - 牌类采集（塔罗/星盘/扑克/德州）→ 六维向量 → 调酒
 *   - 周边定制（本组件）→ 包装材质 + 三类定制卡 → 牌盒取出动画
 *
 * 支持三类定制卡（tab 切换）：
 *   ① MBTI 人格卡 · 16 型组合字母
 *   ② 塔罗定制 · 22 大阿尔卡纳 · 正逆位
 *   ③ 扑克定制 · 4 花色 × 13 点数
 *
 * 三类卡片共用同一包装（材质+纹样）与酒局基调底色。
 * 包装偏好持久化到 localStorage · 在 MbtiPartyPage 揭示阶段读取应用。
 *
 * 视觉语言：深空紫金 + 磨砂玻璃 · 与 CardsPage 主体一致
 */

import { useState, useEffect, useMemo } from 'react';
import GlassPanel from '../ui/GlassPanel';
import {
  PACKAGING_STYLES,
  GOLD_PATTERNS,
  DEFAULT_PACKAGING,
  deriveMbtiCard,
  deriveTarotCard,
  derivePokerCard,
  deriveCardPalette,
  getPackagingStyle,
  getGoldPattern,
  unifyMbtiCard,
  unifyTarotCard,
  unifyPokerCard,
  loadPackagingConfig,
  savePackagingConfig,
  TAROT_MAJOR_OPTIONS,
  POKER_SUIT_OPTIONS,
  POKER_RANK_OPTIONS,
  type PackagingMaterial,
  type GoldPattern,
  type PackagingConfig,
  type CardKind,
  type UnifiedCardSpec,
} from '../../data/cardCustomization';
import type { PokerSuit, PokerRank } from '../../types/personaFusion';

/** MBTI 预览轮播 · 4 型让用户感受不同人格主色 */
const PREVIEW_MBTI_CODES = ['INTJ', 'ENFP', 'INFJ', 'ESFP'] as const;

/** tab 选项 */
const KIND_TABS: { id: CardKind; label: string; desc: string }[] = [
  { id: 'mbti', label: 'MBTI 人格卡', desc: '组合字母 · 16 型' },
  { id: 'tarot', label: '塔罗定制', desc: '大阿尔卡纳 · 正逆位' },
  { id: 'poker', label: '扑克定制', desc: '4 花色 × 13 点数' },
];

export default function CardCustomizationSection() {
  const [config, setConfig] = useState<PackagingConfig>(DEFAULT_PACKAGING);
  const [kind, setKind] = useState<CardKind>('mbti');

  // MBTI 预览轮播
  const [mbtiIdx, setMbtiIdx] = useState(0);
  // 塔罗定制
  const [tarotCardId, setTarotCardId] = useState(TAROT_MAJOR_OPTIONS[0].id);
  const [tarotReversed, setTarotReversed] = useState(false);
  // 扑克定制
  const [pokerSuit, setPokerSuit] = useState<PokerSuit>('♠');
  const [pokerRank, setPokerRank] = useState<PokerRank>('A');

  // 挂载时读取 localStorage
  useEffect(() => {
    setConfig(loadPackagingConfig());
  }, []);

  const handleMaterialChange = (material: PackagingMaterial) => {
    const next = { ...config, material };
    setConfig(next);
    savePackagingConfig(next);
  };

  const handlePatternChange = (pattern: GoldPattern) => {
    const next = { ...config, pattern };
    setConfig(next);
    savePackagingConfig(next);
  };

  // 派生当前预览的统一卡片规格 · 三类共用预览卡渲染
  const previewCard: UnifiedCardSpec = useMemo(() => {
    if (kind === 'mbti') {
      return unifyMbtiCard(deriveMbtiCard(PREVIEW_MBTI_CODES[mbtiIdx]));
    }
    if (kind === 'tarot') {
      return unifyTarotCard(deriveTarotCard(tarotCardId, tarotReversed));
    }
    return unifyPokerCard(derivePokerCard(pokerSuit, pokerRank));
  }, [kind, mbtiIdx, tarotCardId, tarotReversed, pokerSuit, pokerRank]);

  // 预览底色 · 用预览卡的人格主色作为「酒局主色」模拟
  const previewPalette = useMemo(
    () => deriveCardPalette(previewCard.primary, config),
    [previewCard.primary, config],
  );
  const pkgStyle = getPackagingStyle(config.material);
  const goldPattern = getGoldPattern(config.pattern);

  return (
    <section className="max-w-5xl mx-auto mt-16 animate-fade-in">
      {/* 区块标题 */}
      <div className="mb-6 text-center">
        <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase font-mono">
          Peripheral · 周边定制
        </div>
        <h2 className="font-display text-2xl text-gold-sheen text-shadow-glow-gold tracking-[0.12em] mt-1">
          牌的定制
        </h2>
        <p className="text-xs text-moon-200/50 italic mt-2">
          选一种材质与金纹 · 让酒局揭示时的牌盒属于你
        </p>
        <div className="divider-gold mt-4 w-32 mx-auto" />
      </div>

      {/* 卡片类型 tab */}
      <div className="flex justify-center gap-2 mb-6">
        {KIND_TABS.map((tab) => {
          const active = kind === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setKind(tab.id)}
              className={`px-4 py-2 rounded-full text-xs tracking-widest transition-all duration-300 border ${
                active
                  ? 'glass-gold border-gold-400/60 text-gold-sheen shadow-glow-gold'
                  : 'glass border-transparent text-moon-200/60 hover:border-amethyst-500/30'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左 · 定制选择（包装 + 当前类型选项） */}
        <GlassPanel padding="lg">
          {/* 包装材质 · 三类共用 */}
          <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase mb-4">
            Packaging · 包装
          </div>

          {/* 材质选择 */}
          <div className="mb-5">
            <div className="text-xs tracking-[0.3em] text-moon-200/70 mb-3">材质 · MATERIAL</div>
            <div className="grid grid-cols-2 gap-2">
              {PACKAGING_STYLES.map((s) => {
                const selected = config.material === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleMaterialChange(s.id)}
                    className={`text-left p-3 rounded-lg transition-all duration-300 border ${
                      selected
                        ? 'glass-gold border-gold-400/60 shadow-glow-gold'
                        : 'glass border-transparent hover:border-amethyst-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-4 h-4 rounded-full border border-gold-400/30"
                        style={{
                          background: `linear-gradient(135deg, ${s.boxHighlight}, ${s.boxBase})`,
                        }}
                      />
                      <span
                        className={`font-display text-sm ${
                          selected ? 'text-gold-sheen' : 'text-moon-50'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-moon-200/45 leading-relaxed">{s.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 烫金纹样选择 */}
          <div className="mb-6">
            <div className="text-xs tracking-[0.3em] text-moon-200/70 mb-3">
              烫金纹样 · GILDING
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GOLD_PATTERNS.map((g) => {
                const selected = config.pattern === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => handlePatternChange(g.id)}
                    className={`text-left p-3 rounded-lg transition-all duration-300 border ${
                      selected
                        ? 'glass-gold border-gold-400/60 shadow-glow-gold'
                        : 'glass border-transparent hover:border-amethyst-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display text-base text-gold-sheen w-5 text-center">
                        {g.symbol}
                      </span>
                      <span
                        className={`font-display text-sm ${
                          selected ? 'text-gold-sheen' : 'text-moon-50'
                        }`}
                      >
                        {g.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-moon-200/45 leading-relaxed">{g.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 当前类型特有选项 */}
          <div className="pt-4 border-t border-amethyst-500/15">
            <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase mb-3">
              {KIND_TABS.find((t) => t.id === kind)?.label} · 选择
            </div>

            {/* MBTI · 轮播选择 */}
            {kind === 'mbti' && (
              <div className="flex flex-wrap gap-2">
                {PREVIEW_MBTI_CODES.map((code, i) => {
                  const active = i === mbtiIdx;
                  return (
                    <button
                      key={code}
                      onClick={() => setMbtiIdx(i)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-mono tracking-widest transition-all duration-300 border ${
                        active
                          ? 'glass-gold border-gold-400/60 text-gold-sheen'
                          : 'glass border-transparent text-moon-200/60 hover:border-amethyst-500/30'
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 塔罗 · 大阿尔卡纳下拉 + 正逆位 */}
            {kind === 'tarot' && (
              <div className="space-y-3">
                <select
                  value={tarotCardId}
                  onChange={(e) => setTarotCardId(Number(e.target.value))}
                  className="w-full glass border border-amethyst-500/25 rounded-lg px-3 py-2 text-sm text-moon-50 bg-transparent focus:outline-none focus:border-gold-400/50"
                >
                  {TAROT_MAJOR_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-void-900 text-moon-50">
                      {opt.name}（{opt.nameEn}）· {opt.element}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs text-moon-200/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tarotReversed}
                    onChange={(e) => setTarotReversed(e.target.checked)}
                    className="accent-gold-400"
                  />
                  逆位（牌义将切换为逆位解读）
                </label>
              </div>
            )}

            {/* 扑克 · 花色 + 点数 */}
            {kind === 'poker' && (
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] tracking-widest text-moon-200/50 mb-2">花色</div>
                  <div className="flex gap-2">
                    {POKER_SUIT_OPTIONS.map((opt) => {
                      const active = pokerSuit === opt.suit;
                      return (
                        <button
                          key={opt.suit}
                          onClick={() => setPokerSuit(opt.suit)}
                          className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all duration-300 border ${
                            active
                              ? 'glass-gold border-gold-400/60 text-gold-sheen'
                              : 'glass border-transparent text-moon-200/70 hover:border-amethyst-500/30'
                          }`}
                          title={opt.label}
                        >
                          {opt.symbol}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] tracking-widest text-moon-200/50 mb-2">点数</div>
                  <div className="flex flex-wrap gap-1.5">
                    {POKER_RANK_OPTIONS.map((r) => {
                      const active = pokerRank === r;
                      return (
                        <button
                          key={r}
                          onClick={() => setPokerRank(r)}
                          className={`min-w-[34px] h-8 px-2 rounded-md text-xs font-mono tracking-wider transition-all duration-300 border ${
                            active
                              ? 'glass-gold border-gold-400/60 text-gold-sheen'
                              : 'glass border-transparent text-moon-200/60 hover:border-amethyst-500/30'
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* 右 · 卡片预览 · 三类共用 */}
        <GlassPanel gold padding="lg" className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${previewCard.primary}33 0%, transparent 70%)`,
            }}
          />
          <div className="relative">
            <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase mb-4">
              Preview · 卡片预览
            </div>

            {/* 预览卡片 · 模拟牌盒取出后的卡片样式 */}
            <div className="flex justify-center mb-6">
              <div
                className="relative rounded-xl overflow-hidden transition-all duration-500"
                style={{
                  width: 160,
                  height: 240,
                  background: `linear-gradient(180deg, ${previewPalette.cardTopGlow} 0%, ${previewPalette.cardBase} 50%, ${previewPalette.cardShadow} 100%)`,
                  border: '1px solid rgba(240, 198, 116, 0.55)',
                  boxShadow: `0 8px 32px ${previewPalette.cardShadow}88, 0 0 24px ${previewCard.primary}22`,
                }}
              >
                {/* 顶部金线 */}
                <div
                  className="absolute top-2 left-1/2 -translate-x-1/2 h-px"
                  style={{
                    width: '64%',
                    background: 'linear-gradient(90deg, transparent, #f0c674, transparent)',
                  }}
                />
                {/* 角落符号 */}
                <div className="absolute top-3 left-3 text-gold-sheen/70 font-display text-sm">
                  {previewCard.symbol}
                </div>
                {/* 中央主标题 · 人格主色 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-2">
                  <div
                    className={`font-display font-bold tracking-wider ${
                      kind === 'mbti' ? 'text-3xl' : 'text-2xl'
                    }`}
                    style={{ color: previewCard.primary }}
                  >
                    {previewCard.title}
                  </div>
                  {/* 主标题下方细线 */}
                  <div
                    className="mx-auto mt-2 h-px"
                    style={{
                      width: '44%',
                      background: previewCard.accent,
                      opacity: 0.6,
                    }}
                  />
                  {/* 副标题 */}
                  <div className="mt-3 text-gold-sheen/90 font-display text-xs">
                    {previewCard.subtitle}
                  </div>
                  {/* 人格标签 · personaTag · 仅 MBTI 卡有效 */}
                  {previewCard.personaTag && (
                    <div
                      className="mt-1 text-[10px] tracking-wider opacity-80"
                      style={{ color: previewCard.primary }}
                    >
                      {previewCard.personaTag}
                    </div>
                  )}
                </div>
                {/* 底部短语 / 牌义 */}
                <div className="absolute bottom-5 left-0 right-0 text-center text-[9px] text-moon-200/55 italic px-3 leading-relaxed">
                  {previewCard.caption}
                </div>
                {/* 底部金线 */}
                <div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 h-px"
                  style={{
                    width: '40%',
                    background: 'linear-gradient(90deg, transparent, #f0c674aa, transparent)',
                  }}
                />
              </div>
            </div>

            {/* 当前包装摘要 */}
            <div className="text-center text-[11px] text-moon-200/55 leading-relaxed">
              <span className="text-gold-sheen/80 font-display">{pkgStyle.label}</span>
              <span className="text-amethyst-400/40 mx-2">·</span>
              <span className="text-gold-sheen/80 font-display">
                {goldPattern.symbol} {goldPattern.label}
              </span>
              <div className="mt-1 text-[10px] text-moon-200/40 italic">
                底色统一为酒局主色调暗 · 字母用人格主色高亮
              </div>
            </div>

            {/* 提示 · 用于酒局 */}
            <div className="mt-5 pt-4 border-t border-amethyst-500/15 text-center">
              <div className="text-[10px] text-amethyst-400/60 tracking-widest uppercase">
                Applied in · 应用于
              </div>
              <div className="text-xs text-moon-200/60 mt-1">
                前往
                <a
                  href="/mbti-party"
                  className="text-gold-sheen/80 hover:text-gold-400 mx-1 transition-colors"
                >
                  MBTI 酒局
                </a>
                揭示阶段 · 见牌盒抽出
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
