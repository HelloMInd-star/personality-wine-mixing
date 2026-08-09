/**
 * 牌类选择页 · 四卡网格
 * 每卡显示模块名、符号、描述、完成状态
 * 点击进入对应模块
 */
import { Link } from 'react-router-dom';
import { useCollection } from '../store/collectionStore';
import GlassPanel from '../components/ui/GlassPanel';
import {
  MODULE_LABEL,
  MODULE_COLOR,
  MODULE_SYMBOL,
  MODULE_DESC,
} from '../data/moduleMeta';
import type { CardModule } from '../types';

const MODULES: CardModule[] = ['tarot', 'zodiac', 'poker', 'texas'];

const MODULE_STATUS: Record<CardModule, string> = {
  tarot: 'P0 · 已开放',
  zodiac: 'P1 · 即将开放',
  poker: 'P2 · 即将开放',
  texas: 'P2 · 即将开放',
};

const MODULE_ENABLED: Record<CardModule, boolean> = {
  tarot: true,
  zodiac: false,
  poker: false,
  texas: false,
};

export default function SelectPage() {
  const { tarot, zodiac, poker, texas, completedCount } = useCollection();
  const done: Record<CardModule, boolean> = {
    tarot: !!tarot,
    zodiac: !!zodiac,
    poker: !!poker,
    texas: !!texas,
  };

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-16 animate-fade-in">
      {/* 标题区 */}
      <header className="mb-10 md:mb-14">
        <div className="text-[10px] tracking-[0.3em] text-gold-300/60 uppercase mb-2">
          Persona Collection
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-moon-50 tracking-display">
          牌类人格采集
        </h1>
        <p className="mt-3 text-sm text-moon-300/60 leading-relaxed max-w-2xl">
          四套牌类工具，从潜意识、星图、即时决策与策略博弈四重维度，织就你的人格轮廓。
          完成越多的牌类，融合越完整。
        </p>
        <div className="mt-5 flex items-center gap-3 text-xs text-moon-300/50">
          <span className="font-mono">进度 {completedCount}/4</span>
          <div className="flex-1 max-w-xs h-px bg-amethyst-500/20 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gold-400/60 transition-all duration-700"
              style={{ width: `${(completedCount / 4) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* 四卡网格 */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((m) => {
          const enabled = MODULE_ENABLED[m];
          const isDone = done[m];
          const color = MODULE_COLOR[m];
          const content = (
            <GlassPanel
              module={m}
              padding="lg"
              className={`relative h-full transition-all duration-500 ${
                enabled
                  ? 'hover:-translate-y-1 hover:shadow-glow-module cursor-pointer'
                  : 'opacity-60'
              }`}
            >
              {/* 完成标记 */}
              {isDone && (
                <span
                  className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full border tracking-[0.1em]"
                  style={{
                    color,
                    borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                    background: `color-mix(in srgb, ${color} 12%, transparent)`,
                  }}
                >
                  已采集
                </span>
              )}

              {/* 符号 */}
              <div
                className="font-display text-5xl mb-5 leading-none transition-all duration-500"
                style={{
                  color,
                  textShadow: `0 0 20px ${color}44`,
                }}
              >
                {MODULE_SYMBOL[m]}
              </div>

              {/* 模块名 */}
              <h2 className="font-display text-xl text-moon-50 mb-1.5 tracking-[0.05em]">
                {MODULE_LABEL[m]}
              </h2>

              {/* 描述 */}
              <p className="text-xs text-moon-300/55 leading-relaxed mb-6 min-h-[2.5em]">
                {MODULE_DESC[m]}
              </p>

              {/* 状态 */}
              <div className="flex items-center justify-between text-[10px] tracking-[0.15em] uppercase">
                <span
                  style={{
                    color: enabled ? color : 'rgba(200,192,184,0.4)',
                  }}
                >
                  {MODULE_STATUS[m]}
                </span>
                <span className="text-moon-300/40">{enabled ? '→' : 'soon'}</span>
              </div>
            </GlassPanel>
          );

          return enabled ? (
            <Link key={m} to={`/${m}`} className="block h-full">
              {content}
            </Link>
          ) : (
            <div key={m} className="h-full">
              {content}
            </div>
          );
        })}
      </div>

      {/* 融合入口 */}
      {completedCount > 0 && (
        <div className="mt-10 text-center animate-fade-in">
          <Link
            to="/result"
            className="inline-block px-8 py-3 rounded-xl border border-gold-400/40 text-gold-300/90 hover:bg-gold-400/10 hover:border-gold-400/70 transition-all duration-300 text-sm tracking-[0.2em] shadow-glow-module"
            style={{ ['--module-color' as string]: '#D4A040' }}
          >
            查看人格融合结果 →
          </Link>
        </div>
      )}
    </div>
  );
}
