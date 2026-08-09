/**
 * 融合结果页 · 六维人格向量 + 各模块贡献
 * 未融合时显示采集进度与触发按钮
 */
import { Link } from 'react-router-dom';
import { useCollection } from '../store/collectionStore';
import GlassPanel from '../components/ui/GlassPanel';
import {
  MODULE_LABEL,
  MODULE_COLOR,
  MODULE_SYMBOL,
  MODULE_WEIGHT,
} from '../data/moduleMeta';
import { DIM_LABEL, DIM_DESC } from '../types';
import type { CardModule, PersonaDim, PersonaVector } from '../types';

const MODULES: CardModule[] = ['tarot', 'zodiac', 'poker', 'texas'];
const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

export default function ResultPage() {
  const {
    tarot,
    zodiac,
    poker,
    texas,
    fusion,
    completedCount,
    runFusion,
    reset,
  } = useCollection();

  const done: Record<CardModule, boolean> = {
    tarot: !!tarot,
    zodiac: !!zodiac,
    poker: !!poker,
    texas: !!texas,
  };

  // 无任何采集
  if (completedCount === 0) {
    return (
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-16 text-center animate-fade-in">
        <div className="font-display text-3xl text-moon-50 mb-3 tracking-display">
          尚无采集
        </div>
        <p className="text-sm text-moon-300/55 mb-6">
          先去完成任意一套牌类，人格轮廓才会浮现。
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 rounded-lg border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 transition-all duration-300 text-sm tracking-[0.15em]"
        >
          去牌类选择 →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-14 animate-fade-in">
      <header className="mb-8 md:mb-10">
        <Link
          to="/"
          className="text-xs text-moon-300/50 hover:text-gold-300 transition-colors tracking-[0.1em]"
        >
          ← 返回牌类选择
        </Link>
        <div className="mt-3 text-[10px] tracking-[0.3em] text-gold-300/60 uppercase mb-1">
          Persona Fusion
        </div>
        <h1 className="font-display text-2xl md:text-3xl text-moon-50 tracking-display">
          人格融合
        </h1>
      </header>

      {/* 触发融合 */}
      {!fusion && (
        <GlassPanel padding="lg" className="text-center mb-8">
          <p className="text-sm text-moon-300/60 mb-2">
            已采集 {completedCount}/4 个模块
          </p>
          <p className="text-xs text-moon-300/45 mb-5">
            融合公式：塔罗 × 30% + 星盘 × 30% + 扑克 × 20% + 德州 × 20%
          </p>
          <button
            type="button"
            onClick={() => runFusion()}
            className="px-8 py-3 rounded-xl bg-gold-400/15 border border-gold-400/60 text-gold-300 hover:bg-gold-400/25 transition-all duration-300 text-sm tracking-[0.2em] shadow-glow-tarot"
          >
            融合人格向量
          </button>
        </GlassPanel>
      )}

      {/* 融合结果 */}
      {fusion && (
        <>
          {/* 人格标签 */}
          <GlassPanel gold padding="lg" className="mb-6 text-center">
            <div className="text-[10px] tracking-[0.3em] text-gold-300/60 uppercase mb-2">
              Persona Tag
            </div>
            <div
              className="font-display text-4xl md:text-5xl text-gold-300 mb-2"
              style={{ textShadow: '0 0 20px rgba(212,160,64,0.4)' }}
            >
              {fusion.personaTag}
            </div>
            <p className="text-xs text-moon-300/50">
              由 {completedCount} 个模块融合 · 归一化至 [-1, 1]
            </p>
          </GlassPanel>

          {/* 六维向量条形图 */}
          <GlassPanel padding="md" className="mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-sm text-moon-200/80 tracking-[0.15em]">
                六维向量
              </h2>
              <span className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase">
                Vector · 6D
              </span>
            </div>
            <div className="space-y-4">
              {DIMS.map((d) => {
                const v = fusion.finalVector[d];
                const abs = Math.abs(v);
                const positive = v >= 0;
                return (
                  <div key={d} className="flex items-center gap-3">
                    <div className="w-20 shrink-0">
                      <div className="text-xs text-moon-200/80">{DIM_LABEL[d]}</div>
                      <div className="text-[9px] text-moon-300/40 font-mono">{d}</div>
                    </div>
                    {/* 条形 · 中心0，正向右金色，负向左暗红 */}
                    <div className="relative flex-1 h-6 bg-void-700/50 rounded overflow-hidden">
                      {/* 中线 */}
                      <div className="absolute inset-y-0 left-1/2 w-px bg-amethyst-400/30" />
                      <div
                        className="absolute inset-y-0 transition-all duration-700"
                        style={{
                          left: positive ? '50%' : `${50 - abs * 50}%`,
                          width: `${abs * 50}%`,
                          background: positive
                            ? 'linear-gradient(90deg, rgba(212,160,64,0.3), rgba(212,160,64,0.7))'
                            : 'linear-gradient(90deg, rgba(196,30,58,0.7), rgba(196,30,58,0.3))',
                          boxShadow: positive
                            ? '0 0 8px rgba(212,160,64,0.3)'
                            : '0 0 8px rgba(196,30,58,0.3)',
                        }}
                      />
                    </div>
                    <div
                      className="w-14 text-right font-mono text-xs"
                      style={{ color: positive ? '#E8C870' : '#E85A78' }}
                    >
                      {v > 0 ? '+' : ''}{v.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-amethyst-500/15 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-[10px] text-moon-300/45">
              {DIMS.map((d) => (
                <div key={d}>
                  <span className="text-moon-300/60">{DIM_LABEL[d]}</span>
                  <span className="ml-1">· {DIM_DESC[d]}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* 各模块贡献 */}
          <GlassPanel padding="md" className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-sm text-moon-200/80 tracking-[0.15em]">
                模块贡献
              </h2>
              <span className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase">
                Breakdown
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {MODULES.map((m) => {
                const item = fusion.breakdown[m];
                const color = MODULE_COLOR[m];
                return (
                  <div
                    key={m}
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: done[m]
                        ? `color-mix(in srgb, ${color} 30%, transparent)`
                        : 'rgba(139,115,209,0.15)',
                      background: done[m]
                        ? `color-mix(in srgb, ${color} 6%, transparent)`
                        : 'rgba(20,20,30,0.4)',
                      opacity: done[m] ? 1 : 0.5,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ color }}>{MODULE_SYMBOL[m]}</span>
                        <span className="text-sm text-moon-200/80">
                          {MODULE_LABEL[m]}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-moon-300/40">
                        × {MODULE_WEIGHT[m]}
                      </span>
                    </div>
                    {item ? (
                      <ModuleVectorBar vector={item.vector} color={color} />
                    ) : (
                      <div className="text-[11px] text-moon-300/40 italic">
                        未采集
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassPanel>

          {/* 重置 */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                if (confirm('确定清空全部采集与融合结果？')) reset();
              }}
              className="text-xs text-moon-300/40 hover:text-poker transition-colors tracking-[0.15em]"
            >
              清空全部采集
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** 模块贡献迷你条 · 显示该模块的向量分布 */
function ModuleVectorBar({ vector, color }: { vector: PersonaVector; color: string }) {
  const max = Math.max(...DIMS.map((d) => Math.abs(vector[d])), 0.01);
  return (
    <div className="flex items-end gap-1 h-8">
      {DIMS.map((d) => {
        const v = vector[d];
        const h = (Math.abs(v) / max) * 100;
        const positive = v >= 0;
        return (
          <div key={d} className="flex-1 flex flex-col items-center justify-end h-full">
            <div
              className="w-full rounded-sm transition-all duration-500"
              style={{
                height: `${Math.max(h, 4)}%`,
                background: positive ? color : 'rgba(196,30,58,0.7)',
                opacity: positive ? 0.8 : 0.6,
              }}
              title={`${DIM_LABEL[d]}: ${v.toFixed(2)}`}
            />
          </div>
        );
      })}
    </div>
  );
}
