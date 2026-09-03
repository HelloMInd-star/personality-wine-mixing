/**
 * NotFoundPage · 觉醉·途·404 · 兜底
 * 深空风格 · 此路无月 · 引导回入口
 *
 * 视觉语言：深空暗紫 + 情绪光斑 · 觉醉感官情绪探索游戏 · 与 TavernPage/CocktailPage 同语
 */

import { useNavigate, useLocation } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 animate-fade-in">
      {/* 月相 · 缺损的半月 */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full border border-amethyst-500/30 animate-breathe" />
        <div
          className="absolute inset-2 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, rgba(124,95,191,0.35) 0%, rgba(7,4,20,0.9) 70%)',
            boxShadow: 'inset -8px -8px 24px rgba(7,4,20,0.8), 0 0 40px rgba(124,95,191,0.15)',
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, transparent 60%, rgba(240,198,116,0.15) 65%, transparent 80%)',
          }}
        />
      </div>

      <div className="text-[11px] tracking-[0.5em] text-amethyst-400/60 uppercase mb-4">
        404 · Void
      </div>
      <h1 className="font-display text-4xl md:text-5xl text-gold-sheen text-shadow-glow-gold mb-4">
        此路无月
      </h1>
      <p className="text-sm text-moon-200/60 italic max-w-md leading-relaxed mb-2">
        你走进了一片星图的空白处。
      </p>
      <p className="text-xs text-amethyst-400/50 font-mono mb-10">
        {pathname || '(empty)'} · 不在已织的夜图里
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-8 py-3 rounded-full font-display text-sm tracking-[0.3em] text-void bg-gradient-to-r from-gold-400 to-gold-600 shadow-glow-gold hover:shadow-glow-gold-strong transition-all duration-500"
        >
          回到入口 →
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-6 py-3 text-xs tracking-[0.3em] text-amethyst-400/60 hover:text-gold-400 transition-colors duration-300"
        >
          ← 退回上一步
        </button>
      </div>
    </div>
  );
}
