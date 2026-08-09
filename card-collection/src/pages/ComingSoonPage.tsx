/**
 * 通用占位页 · P1/P2 模块未开放
 */
import { Link } from 'react-router-dom';
import GlassPanel from '../components/ui/GlassPanel';
import { MODULE_LABEL, MODULE_COLOR, MODULE_SYMBOL, MODULE_DESC } from '../data/moduleMeta';
import type { CardModule } from '../types';

interface Props {
  module: CardModule;
  priority: string;
  features: string[];
}

export default function ComingSoonPage({ module, priority, features }: Props) {
  const color = MODULE_COLOR[module];
  return (
    <div className={`max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-16 animate-fade-in module-${module}`}>
      <Link
        to="/"
        className="text-xs text-moon-300/50 hover:text-moon-200 transition-colors tracking-[0.1em]"
      >
        ← 返回牌类选择
      </Link>

      <header className="mt-3 mb-8">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl leading-none" style={{ color }}>
            {MODULE_SYMBOL[module]}
          </span>
          <h1 className="font-display text-2xl md:text-3xl text-moon-50 tracking-display">
            {MODULE_LABEL[module]}
          </h1>
        </div>
        <p className="mt-2 text-sm text-moon-300/55">{MODULE_DESC[module]}</p>
      </header>

      <GlassPanel module={module} padding="lg" className="text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-[0.2em] uppercase mb-5"
          style={{
            color,
            border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
          }}
        >
          {priority} · 即将开放
        </div>

        <h2 className="font-display text-xl text-moon-50 mb-3">这一面镜子，正在打磨</h2>
        <p className="text-sm text-moon-300/55 leading-relaxed max-w-md mx-auto mb-6">
          以下能力已在路线图中，待时机成熟便会开启。
        </p>

        <ul className="text-left max-w-sm mx-auto space-y-2 mb-8">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-moon-300/60">
              <span style={{ color }}>·</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <Link
          to="/tarot"
          className="inline-block px-6 py-2.5 rounded-lg border text-sm tracking-[0.15em] transition-all duration-300"
          style={{
            color: '#D4A040',
            borderColor: 'rgba(212,160,64,0.5)',
          }}
        >
          先去塔罗采集 →
        </Link>
      </GlassPanel>
    </div>
  );
}
