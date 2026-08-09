/**
 * 顶部导航 · 采集进度 + 返回入口
 * 深空磨砂 · 微妙发光
 */
import { Link, useLocation } from 'react-router-dom';
import { useCollection } from '../../store/collectionStore';
import { MODULE_LABEL, MODULE_COLOR, MODULE_SYMBOL } from '../../data/moduleMeta';
import type { CardModule } from '../../types';

const MODULES: CardModule[] = ['tarot', 'zodiac', 'poker', 'texas'];

export default function Navigation() {
  const { tarot, zodiac, poker, texas, completedCount } = useCollection();
  const location = useLocation();

  const done: Record<CardModule, boolean> = {
    tarot: !!tarot,
    zodiac: !!zodiac,
    poker: !!poker,
    texas: !!texas,
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-void-900/70 border-b border-amethyst-500/15">
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="font-display text-lg text-gold-300 tracking-display group-hover:text-gold-400 transition-colors">
            Y.Mine
          </span>
          <span className="text-[10px] tracking-[0.25em] text-moon-300/50 uppercase">
            Card Collection
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* 模块进度点 */}
          <div className="hidden sm:flex items-center gap-2">
            {MODULES.map((m) => {
              const isDone = done[m];
              const active = location.pathname.startsWith(`/${m}`);
              return (
                <Link
                  key={m}
                  to={`/${m}`}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-300"
                  style={{
                    background: active
                      ? `color-mix(in srgb, ${MODULE_COLOR[m]} 14%, transparent)`
                      : 'transparent',
                  }}
                  title={MODULE_LABEL[m]}
                >
                  <span
                    className="text-sm leading-none transition-opacity duration-300"
                    style={{
                      color: isDone ? MODULE_COLOR[m] : 'rgba(200, 192, 184, 0.35)',
                      textShadow: isDone ? `0 0 8px ${MODULE_COLOR[m]}66` : 'none',
                    }}
                  >
                    {MODULE_SYMBOL[m]}
                  </span>
                  <span
                    className="text-[10px] tracking-[0.1em] transition-colors duration-300"
                    style={{
                      color: isDone ? 'rgba(232, 226, 216, 0.7)' : 'rgba(200, 192, 184, 0.35)',
                    }}
                  >
                    {MODULE_LABEL[m]}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-moon-300/50 tracking-wider">
            {completedCount}/4
          </div>

          <Link
            to="/result"
            className="text-xs px-3 py-1.5 rounded-lg border border-gold-400/30 text-gold-300/80 hover:border-gold-400/60 hover:text-gold-300 hover:bg-gold-400/10 transition-all duration-300 tracking-[0.1em]"
          >
            融合结果
          </Link>
        </div>
      </div>
    </header>
  );
}
