/**
 * InvestPage · 觉醉 · 灵感实验室
 *
 * 原「投资部·商业底座」已下线，本页正重塑为「灵感实验室·创意池」。
 * 当前为占位骨架页，待 Phase 后续填充：
 *   - 创意分类池（6 类：调酒创意 / 感官扩展 / 人格维度 / 场景设计 / 硬件协议 / 算法实验）
 *   - 创意卡片清单（带状态/优先级/标签）
 *   - 主理人「今日推荐做」
 *   - 新建/编辑创意的表单与持久化
 *
 * 与 /mind 的边界：
 *   MindLibraryPage = 已实现的认知引擎展示（向内）
 *   InvestPage      = 未实现的创意池（向外）
 *
 * 旧依赖（investPillars / business-modules）已删除，重塑时新增 ideas 数据源
 */

import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { resolveTimeSlot } from '../engine/timeEngine';
import { resolveInvestHostState } from '../engine/investHostEngine';
import GlassPanel from '../components/ui/GlassPanel';
import GradientButton from '../components/ui/GradientButton';

export default function InvestPage() {
  const navigate = useNavigate();
  const { profile, manualTimeSlot } = useAppStore();
  const currentSlot = resolveTimeSlot(new Date(), manualTimeSlot);

  // 占位 · hasInvestData = false，主理人显形条件待重塑时接入真实数据
  const hostState = resolveInvestHostState(
    currentSlot.slot,
    profile,
    false,
    '/invest',
  );

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 页面标题区 */}
      <header className="mb-10 md:mb-14">
        <div className="text-[11px] tracking-[0.4em] text-amethyst-400/80 mb-3">
          IDEAS · 灵感
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
          灵感实验室
        </h1>
        <p className="mt-3 text-sm md:text-base text-moon-200/60 italic max-w-xl leading-relaxed">
          创意的蓄水池 · 未点燃的火种，在此点亮、孵化、归档。
        </p>
        <div className="divider-gold mt-5 w-40" />
      </header>

      {/* 灵感主理人 · 复用 investHostEngine 状态指示灯 */}
      <section className="mb-12">
        <div className="text-[11px] tracking-[0.3em] text-amethyst-400/60 uppercase mb-5">
          灵感主理人 · Ideas Host
        </div>
        <GlassPanel padding="lg">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 shrink-0">
              {hostState.dotColor !== 'transparent' && (
                <div
                  className="absolute inset-0 rounded-full blur-md"
                  style={{ background: hostState.glowColor }}
                />
              )}
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center font-display text-lg"
                style={{
                  background:
                    hostState.dotColor === 'transparent'
                      ? 'transparent'
                      : hostState.dotColor,
                  color: hostState.manifested
                    ? hostState.primaryColor
                    : 'rgba(216,201,245,0.3)',
                  border:
                    hostState.dotColor === 'transparent'
                      ? '1px dashed rgba(216,201,245,0.25)'
                      : 'none',
                }}
              >
                {hostState.symbol}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-display text-base text-moon-50">
                  {hostState.name}
                </span>
                <span
                  className="text-[10px] tracking-[0.2em] px-2 py-0.5 rounded-full"
                  style={{
                    color:
                      hostState.dotColor === 'transparent'
                        ? 'rgba(216,201,245,0.4)'
                        : hostState.dotColor,
                    border: `1px solid ${hostState.glowColor}`,
                  }}
                >
                  {hostState.statusLabel}
                </span>
              </div>
              <p className="text-xs text-moon-200/50 italic leading-relaxed">
                {hostState.statusHint}
              </p>
            </div>
          </div>
        </GlassPanel>
      </section>

      {/* 创意分类池 · 待重塑 */}
      <section className="mb-16">
        <div className="text-[11px] tracking-[0.3em] text-amethyst-400/60 uppercase mb-5">
          创意分类 · Categories · 待接入
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES_PLACEHOLDER.map((c) => (
            <div
              key={c.id}
              className="relative rounded-2xl p-5 border border-dashed border-amethyst-500/25 bg-void/40 backdrop-blur-sm transition-all duration-500 hover:border-gold-400/30 hover:bg-void/60"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-display text-base text-moon-200/40 shrink-0"
                  style={{ border: '1px dashed rgba(216, 201, 245, 0.25)' }}
                >
                  {c.glyph}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-base text-moon-200/70">
                    {c.title}
                  </div>
                  <div className="text-[10px] tracking-[0.2em] text-amethyst-400/40 uppercase">
                    {c.nameEn}
                  </div>
                </div>
              </div>
              <p className="text-xs text-moon-200/50 leading-relaxed">
                {c.desc}
              </p>
              <div className="mt-3 text-[10px] tracking-[0.3em] text-amethyst-400/30">
                ○ 待点亮
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 重塑提示 */}
      <section className="mb-16 max-w-2xl mx-auto">
        <GlassPanel padding="lg" className="text-center">
          <div className="text-[11px] tracking-[0.3em] text-gold-400/60 uppercase mb-3">
            Under Reconstruction · 重塑中
          </div>
          <p className="text-sm text-moon-200/60 italic leading-relaxed">
            原商业底座已下线。本页正重塑为创意池，
            承接调酒创意 / 感官扩展 / 人格维度 / 场景设计 / 硬件协议 / 算法实验
            六类未实现的想法。
          </p>
          <p className="text-xs text-amethyst-400/50 mt-4">
            数据源（ideas.ts）与表单能力待后续 Phase 接入
          </p>
        </GlassPanel>
      </section>

      {/* 返回入口 */}
      <div className="flex justify-center">
        <GradientButton variant="amethyst" onClick={() => navigate('/')}>
          ← 回到入口
        </GradientButton>
      </div>
    </div>
  );
}

/** 创意分类占位 · 重塑时替换为数据源 */
const CATEGORIES_PLACEHOLDER = [
  { id: 'cocktail', glyph: '杯', title: '调酒创意', nameEn: 'Cocktail', desc: '配方扩展 · 风味维度派生 · 旅程回路实验' },
  { id: 'sensory', glyph: '香', title: '感官扩展', nameEn: 'Sensory', desc: '视觉 / 听觉 / 嗅觉 / 味觉的多模态同构' },
  { id: 'persona', glyph: '镜', title: '人格维度', nameEn: 'Persona', desc: '六维向量扩展 · OCEAN 映射 · 动态校准' },
  { id: 'scene', glyph: '局', title: '场景设计', nameEn: 'Scene', desc: '酒局融合 · 吧台交互 · 酒馆氛围' },
  { id: 'hardware', glyph: '垫', title: '硬件协议', nameEn: 'Hardware', desc: '杯垫协议 · O2O 闭环 · 线下履约' },
  { id: 'algo', glyph: '弧', title: '算法实验', nameEn: 'Algorithm', desc: '反馈回路 · A/B 实验 · 时间生物学' },
] as const;
