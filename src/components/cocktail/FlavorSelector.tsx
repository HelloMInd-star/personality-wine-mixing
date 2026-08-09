/**
 * FlavorSelector · Step 2 · 拼风味
 * 点击选择为主 · 主理人图标随选中滑动移动 · 选中后触发推荐语
 *
 * 复用 FLAVOR_META（八维风味轮元数据）+ flavorFromVector（向量→风味偏好推荐）
 * 视觉语言：深空紫金 + 磨砂玻璃 · 与 BaseSelector 同语
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { FlavorKey } from '../../types/cocktail';
import type { PersonaVector } from '../../types/personaFusion';
import { FLAVOR_META, FLAVOR_MAP } from '../../data/flavorMeta';
import { flavorFromVector } from '../../engine/flavorFromVector';

/** 最多选 3 种风味 · 避免风味过载 */
const MAX_FLAVORS = 3;

/** 主理人推荐语生成 · 基于选中风味组合 · 按优先级匹配 */
function generateGuide(flavors: FlavorKey[]): string | null {
  if (flavors.length === 0) return null;
  if (flavors.length === 1) return FLAVOR_MAP[flavors[0]].poem;
  const set = new Set(flavors);
  // 组合规则 · 优先级从高到低
  if (set.has('sweet') && set.has('fruity')) return '甜美果香，夜的糖衣裹着紫罗兰的潮汐。';
  if (set.has('bitter') && set.has('strong')) return '深沉烈饮，咽下时星河倒灌进胸腔。';
  if (set.has('smoky') && set.has('strong')) return '烟与烈交织，把夜的轮廓烧成余烬。';
  if (set.has('herbal') && set.has('sour')) return '草本森林里一线清亮月光，酸得发亮。';
  if (set.has('creamy') && set.has('sweet')) return '柔润丝绒铺喉，蜜糖溶进星河。';
  if (set.has('smoky')) return '烟从冰里升起，这一杯带着余烬的温度。';
  if (set.has('herbal')) return '草本在舌尖生根，长成一座夜的森林。';
  if (set.has('creamy')) return '柔润漫过喉间，像月光铺成的一层丝绒。';
  if (set.has('strong')) return '烈酒入喉，星河倒灌进胸腔。';
  // 默认 · 拼接首尾两句诗
  return flavors.map((f) => FLAVOR_MAP[f].poem).join(' ');
}

interface FlavorSelectorProps {
  dynamicVector: PersonaVector | null;
  selected: FlavorKey[];
  onSelect: (flavors: FlavorKey[]) => void;
}

export default function FlavorSelector({ dynamicVector, selected, onSelect }: FlavorSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Partial<Record<FlavorKey, HTMLButtonElement | null>>>({});
  const [indicatorX, setIndicatorX] = useState<number | null>(null);
  const [guideKey, setGuideKey] = useState(0); // 触发推荐语重渲染动画

  /** 推荐高亮 · 有向量时取偏好 top 2 */
  const recommendedKeys = (() => {
    if (!dynamicVector) return new Set<FlavorKey>();
    const pref = flavorFromVector(dynamicVector);
    return new Set(
      FLAVOR_META.map((f) => ({ key: f.key, val: pref[f.key] ?? 0.5 }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 2)
        .map((x) => x.key),
    );
  })();

  /** 测量主理人图标位置 · 滑动到最新选中风味的卡片中心 */
  const measureIndicator = useCallback(() => {
    if (selected.length === 0) {
      setIndicatorX(null);
      return;
    }
    const last = selected[selected.length - 1];
    const el = cardRefs.current[last];
    const container = containerRef.current;
    if (!el || !container) return;
    const cardRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setIndicatorX(cardRect.left - containerRect.left + cardRect.width / 2);
  }, [selected]);

  useEffect(() => {
    measureIndicator();
  }, [measureIndicator]);

  // 容器尺寸变化时重新测量 · 保持响应式跟随准确
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => measureIndicator());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measureIndicator]);

  /** 选中/取消 · 已满时替换最早的 */
  const handleClick = (key: FlavorKey) => {
    setGuideKey((k) => k + 1); // 触发推荐语动画
    if (selected.includes(key)) {
      onSelect(selected.filter((f) => f !== key));
      return;
    }
    if (selected.length >= MAX_FLAVORS) {
      onSelect([...selected.slice(1), key]);
      return;
    }
    onSelect([...selected, key]);
  };

  const guide = generateGuide(selected);
  const lastFlavor = selected.length > 0 ? selected[selected.length - 1] : null;
  const indicatorColor = lastFlavor ? FLAVOR_MAP[lastFlavor].color : '#f0c674';

  return (
    <div>
      {/* 标题区 */}
      <div className="text-center mb-8">
        <div className="text-[11px] tracking-[0.6em] text-amethyst-400/60 uppercase mb-3">
          Step 2 · 风味
        </div>
        <h3 className="font-display text-xl text-gold-sheen mb-2">拼风味</h3>
        <p className="text-sm text-moon-200/60 leading-relaxed">
          {dynamicVector
            ? `主理人基于你的人格向量标记了推荐风味 · 最多选 ${MAX_FLAVORS} 种`
            : `选择你想要的味道 · 最多选 ${MAX_FLAVORS} 种`}
        </p>
      </div>

      {/* 主理人图标轨道 · 选中后滑动跟随 */}
      <div
        ref={containerRef}
        className="relative"
        style={{ ['--flavor-color' as string]: indicatorColor }}
      >
        {/* 主理人光标 · absolute 滑动 */}
        <div
          className="absolute -top-2 z-20 pointer-events-none transition-all duration-500 ease-out"
          style={{
            transform: `translateX(${indicatorX ?? 0}px) translateX(-50%)`,
            opacity: indicatorX !== null ? 1 : 0,
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display text-void-900 animate-breathe"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${indicatorColor}, ${indicatorColor}aa)`,
              boxShadow: `0 0 14px ${indicatorColor}88, 0 2px 6px rgba(0,0,0,0.3)`,
              border: '1px solid rgba(240, 198, 116, 0.4)',
            }}
          >
            主
          </div>
          {/* 光标尾迹 · 指向卡片 */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full w-px h-3"
            style={{ background: `linear-gradient(to bottom, ${indicatorColor}88, transparent)` }}
          />
        </div>

        {/* 风味卡片网格 · 8 瓣风味轮 */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 pt-6">
          {FLAVOR_META.map((flavor) => {
            const isSelected = selected.includes(flavor.key);
            const isRec = recommendedKeys.has(flavor.key);
            return (
              <button
                key={flavor.key}
                ref={(el) => {
                  cardRefs.current[flavor.key] = el;
                }}
                type="button"
                onClick={() => handleClick(flavor.key)}
                className="relative rounded-2xl p-4 text-center transition-all duration-500 group"
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${flavor.color}22, ${flavor.color}08)`
                    : 'rgba(15, 10, 30, 0.5)',
                  border: isSelected
                    ? `1px solid ${flavor.color}66`
                    : '1px solid rgba(124, 95, 191, 0.15)',
                  boxShadow: isSelected ? `0 4px 18px ${flavor.color}33` : 'none',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* 推荐角标 */}
                {isRec && !isSelected && (
                  <div
                    className="absolute -top-1.5 -right-1.5 text-[8px] tracking-widest px-1.5 py-0.5 rounded-full font-mono"
                    style={{
                      background: 'rgba(240, 198, 116, 0.12)',
                      color: '#f0c674',
                      border: '1px solid rgba(240, 198, 116, 0.3)',
                    }}
                  >
                    推
                  </div>
                )}

                {/* 风味珠 · 选中时放大 */}
                <div
                  className="w-9 h-9 mx-auto rounded-full mb-2 transition-transform duration-500 group-hover:scale-110"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${flavor.color}, ${flavor.color}66)`,
                    boxShadow: isSelected
                      ? `0 0 16px ${flavor.color}88, inset 0 1px 2px rgba(255,255,255,0.2)`
                      : `0 0 8px ${flavor.color}44`,
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  }}
                />

                {/* 风味名 */}
                <div className="font-display text-sm text-moon-50 mb-0.5">
                  {flavor.label}
                </div>

                {/* 选中标记 */}
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                    style={{ background: flavor.color, color: '#070414' }}
                  >
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 主理人推荐语 · 选中后触发 · key 触发滑入动画 */}
      <div className="max-w-2xl mx-auto mt-8 min-h-[60px]">
        {guide && (
          <div
            key={guideKey}
            className="relative rounded-xl px-5 py-4 overflow-hidden"
            style={{
              background: 'rgba(15, 10, 30, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(124, 95, 191, 0.2)',
              animation: 'flavor-guide-slide 0.4s ease-out',
            }}
          >
            <style>{`
              @keyframes flavor-guide-slide {
                0% { transform: translateY(8px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
              }
            `}</style>
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: `radial-gradient(ellipse at 0% 50%, ${indicatorColor}33, transparent 60%)`,
              }}
            />
            <div className="relative flex items-start gap-3">
              <span
                className="shrink-0 inline-block w-1.5 h-1.5 rounded-full mt-2 animate-breathe"
                style={{ background: indicatorColor, boxShadow: `0 0 6px ${indicatorColor}` }}
              />
              <p className="text-sm text-moon-200/80 italic font-display leading-relaxed">
                {guide}
              </p>
            </div>
            {/* 已选计数 */}
            <div className="relative mt-2 text-right text-[10px] font-mono text-amethyst-400/50 tracking-widest">
              {selected.length}/{MAX_FLAVORS}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
