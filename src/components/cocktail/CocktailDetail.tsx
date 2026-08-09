/**
 * CocktailDetail · 调酒详情模态
 * 一杯酒的全貌 · 故事、配方、步骤、风味画像与契合之语
 * 遮罩 fade-in，内容 slide-up；点击遮罩关闭，内容区阻止冒泡
 */

import type { Cocktail, BaseSpirit, GlassType } from '../../types/cocktail';
import GlassPanel from '../ui/GlassPanel';
import FlavorProfile from './FlavorProfile';

export interface CocktailDetailProps {
  cocktail: Cocktail | null;
  /** 匹配理由 · 无人格画像浏览时为空 */
  reasons?: string[];
  onClose: () => void;
}

/** 基酒中文映射 · 与卡片同源，独立持有以保持模态自洽 */
const BASE_SPIRIT_LABELS: Record<BaseSpirit, string> = {
  gin: '金酒',
  whisky: '威士忌',
  rum: '朗姆',
  vodka: '伏特加',
  tequila: '龙舌兰',
  brandy: '白兰地',
  liqueur: '利口酒',
  wine: '葡萄酒',
  sake: '清酒',
  none: '无酒精',
};

/** 酒杯中文映射 */
const GLASS_LABELS: Record<GlassType, string> = {
  coupe: '浅碟杯',
  martini: '马天尼杯',
  highball: '高球杯',
  rocks: '古典杯',
  flute: '笛形杯',
  snifter: '白兰地杯',
  mug: '啤酒杯',
  tiki: '提基杯',
};

/** 元信息键值行 */
function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-xs text-moon-200/45 tracking-[0.1em] shrink-0">
        {label}
      </dt>
      <dd className="text-moon-200/80 text-sm truncate">{value}</dd>
    </div>
  );
}

export default function CocktailDetail({
  cocktail,
  reasons = [],
  onClose,
}: CocktailDetailProps) {
  if (!cocktail) return null;

  const {
    name,
    nameEn,
    tagline,
    story,
    baseSpirit,
    abv,
    glass,
    garnish,
    flavorProfile,
    ingredients,
    steps,
    difficulty,
    auraColor,
  } = cocktail;

  return (
    /* 遮罩 · 点击关闭 */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-void-900/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassPanel gold padding="lg">
          {/* 顶部横向光晕分隔 · 呼应酒的灵气色 */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${auraColor}, transparent)`,
              boxShadow: `0 0 16px ${auraColor}88`,
            }}
          />

          <div className="relative">
            {/* 标题区 + 关闭 */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold leading-tight">
                  {name}
                </h2>
                <p className="text-sm text-amethyst-400/80 tracking-[0.2em] mt-1">
                  {nameEn}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-amethyst-500/30 text-moon-200/60 transition-colors duration-300 hover:text-gold-400 hover:border-gold-400/50"
              >
                ✕
              </button>
            </div>

            {/* 引语 */}
            <p className="mt-4 text-lg italic text-moon-200/80 leading-relaxed">
              「{tagline}」
            </p>

            <div className="divider-gold mt-5" />

            {/* 桌面左右分栏 · 移动单列 */}
            <div className="mt-6 grid md:grid-cols-2 gap-6 md:gap-8">
              {/* 左栏 · 故事 + 配方 + 步骤 */}
              <div className="space-y-6">
                <section>
                  <h3 className="font-display text-base text-moon-200/70 tracking-[0.15em] mb-2">
                    故事
                  </h3>
                  <p className="text-sm text-moon-200/75 leading-relaxed">
                    {story}
                  </p>
                </section>

                <section>
                  <h3 className="font-display text-base text-moon-200/70 tracking-[0.15em] mb-3">
                    配方
                  </h3>
                  <ul className="space-y-1.5">
                    {ingredients.map((ing, i) => (
                      <li
                        key={`${ing.name}-${i}`}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <span className="text-moon-200/80">{ing.name}</span>
                        <span className="font-mono text-xs text-gold-400/80 shrink-0">
                          {ing.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="font-display text-base text-moon-200/70 tracking-[0.15em] mb-3">
                    步骤
                  </h3>
                  <ol className="space-y-2.5">
                    {steps.map((s) => (
                      <li
                        key={s.order}
                        className="flex gap-3 text-sm text-moon-200/75 leading-relaxed"
                      >
                        <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full border border-gold-400/40 text-[10px] font-mono text-gold-400/80">
                          {s.order}
                        </span>
                        <span>{s.text}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>

              {/* 右栏 · 风味画像 + 契合理由 + 元信息 */}
              <div className="space-y-6">
                <section>
                  <h3 className="font-display text-base text-moon-200/70 tracking-[0.15em] mb-3">
                    风味画像
                  </h3>
                  <FlavorProfile flavorProfile={flavorProfile} />
                </section>

                {reasons.length > 0 && (
                  <section>
                    <h3 className="font-display text-base text-moon-200/70 tracking-[0.15em] mb-3">
                      契合之语
                    </h3>
                    <ul className="space-y-2">
                      {reasons.map((r, i) => (
                        <li
                          key={i}
                          className="flex gap-2.5 text-sm text-moon-200/75 leading-relaxed"
                        >
                          <span
                            className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-400"
                            style={{ boxShadow: '0 0 6px rgba(240,198,116,0.6)' }}
                          />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section>
                  <h3 className="font-display text-base text-moon-200/70 tracking-[0.15em] mb-3">
                    元信息
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <MetaItem label="基酒" value={BASE_SPIRIT_LABELS[baseSpirit]} />
                    <MetaItem label="酒精度" value={`${abv}%`} />
                    <MetaItem label="酒杯" value={GLASS_LABELS[glass]} />
                    <MetaItem label="装饰" value={garnish} />
                    <MetaItem label="难度" value={`${difficulty} / 5`} />
                  </dl>
                </section>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
