/**
 * MindLibraryPage · 思维库 · 底座架构展示
 *
 * 极客程序员在夜里编程的底座。
 * 当前为骨架页 · 六重底座待点亮,后续逐步填充引擎。
 *
 * 非空壳 ComingSoon · 展示底座架构让用户看见"即将长出来的东西"
 */

import { useNavigate } from 'react-router-dom';
import GlassPanel from '../components/ui/GlassPanel';
import GradientButton from '../components/ui/GradientButton';

/** 六重底座模块 · 各自待点亮 */
const MIND_MODULES = [
  {
    symbol: '染',
    name: '染色体',
    nameEn: 'Chromosome',
    layer: '基因型层',
    desc: '认知基因组 · 不可直接观测的底层参数,通过探针推断,随行为微演化',
  },
  {
    symbol: '阶',
    name: '斐波那契',
    nameEn: 'Fibonacci',
    layer: '深度层级',
    desc: '认知台阶 · 1,1,2,3,5,8,13 · 自相似的思维深度递进',
  },
  {
    symbol: '脉',
    name: '脉冲函数',
    nameEn: 'Pulse',
    layer: '节律调节',
    desc: '多周期叠加 · 皮质醇昼夜 + BRAC 超日 + 睡眠反弹 · 认知活跃度 A(t)',
  },
  {
    symbol: '圈',
    name: '画圈实验',
    nameEn: 'Circle',
    layer: '实时探针',
    desc: '运动-认知外显 · 速度/圆度/节奏稳定性 · 与镜中自观互补的实时测量',
  },
  {
    symbol: '忘',
    name: '记忆曲线',
    nameEn: 'Forgetting',
    layer: '时序加权',
    desc: 'Ebbinghaus 遗忘曲线 · 工作记忆/短期/长期分层衰减 · 替代硬截断',
  },
  {
    symbol: '眠',
    name: '睡眠增益',
    nameEn: 'Sleep',
    layer: '离线整合',
    desc: '慢波巩固 + REM 整合 · 睡眠作为下一活跃期的增益因子',
  },
];

/** 底座五层架构 · 自上而下派生 */
const ARCH_LAYERS = [
  { name: '基因型层', desc: '染色体 · 认知基因组(底层参数)' },
  { name: '节律调节层', desc: '脉冲函数 · 多周期活跃度 A(t)' },
  { name: '探针层', desc: '画圈实验 + 牌类行为 + 评分(表现型测量)' },
  { name: '记忆层', desc: '遗忘曲线加权 · 时序汇聚' },
  { name: '产物层', desc: '思维库 · 派生推荐/叙事/预测' },
];

export default function MindLibraryPage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 页面标题区 */}
      <header className="mb-10 md:mb-14">
        <div className="text-[11px] tracking-[0.4em] text-amethyst-400/80 mb-3">
          MIND · 底座
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
          思维库 · 镜的两面
        </h1>
        <p className="mt-3 text-sm md:text-base text-moon-200/60 italic max-w-xl leading-relaxed">
          觉醉在夜里编程的底座 · 六重结构，待你点亮。
        </p>
        <div className="divider-gold mt-5 w-40" />
      </header>

      {/* 六重底座模块 · 待点亮卡片网格 */}
      <section className="mb-16">
        <div className="text-[11px] tracking-[0.3em] text-amethyst-400/60 uppercase mb-5">
          六重底座 · Six Pillars
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MIND_MODULES.map((m) => (
            <div
              key={m.nameEn}
              className="relative rounded-2xl p-5 border border-dashed border-amethyst-500/25 bg-void/40 backdrop-blur-sm transition-all duration-500 hover:border-gold-400/30 hover:bg-void/60"
            >
              {/* 符号 · 虚线圆 · 待点亮态 */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-display text-base text-moon-200/40 shrink-0"
                  style={{ border: '1px dashed rgba(216, 201, 245, 0.25)' }}
                >
                  {m.symbol}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-base text-moon-200/70">
                    {m.name}
                  </div>
                  <div className="text-[10px] tracking-[0.2em] text-amethyst-400/40 uppercase">
                    {m.nameEn}
                  </div>
                </div>
              </div>
              {/* 层级标签 */}
              <div className="text-[10px] tracking-[0.2em] text-gold-400/40 mb-2">
                {m.layer}
              </div>
              {/* 描述 */}
              <p className="text-xs text-moon-200/50 leading-relaxed">
                {m.desc}
              </p>
              {/* 待点亮状态 */}
              <div className="mt-3 text-[10px] tracking-[0.3em] text-amethyst-400/30">
                ○ 待点亮
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 底座五层架构 · 自上而下派生流 */}
      <section className="mb-16 max-w-2xl mx-auto">
        <div className="text-[11px] tracking-[0.3em] text-amethyst-400/60 uppercase mb-5 text-center">
          底座架构 · Architecture
        </div>
        <GlassPanel padding="lg">
          <div className="space-y-1">
            {ARCH_LAYERS.map((layer, idx) => (
              <div
                key={layer.name}
                className="flex items-center gap-4 py-2.5"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs text-gold-400/60 shrink-0"
                  style={{ border: '1px solid rgba(240, 198, 116, 0.2)' }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm text-moon-50">
                    {layer.name}
                  </div>
                  <div className="text-xs text-moon-200/50">
                    {layer.desc}
                  </div>
                </div>
                {idx < ARCH_LAYERS.length - 1 && (
                  <div className="text-amethyst-400/30 text-xs">↓</div>
                )}
              </div>
            ))}
          </div>
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
