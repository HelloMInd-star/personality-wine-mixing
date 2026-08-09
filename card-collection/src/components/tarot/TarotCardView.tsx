/**
 * 塔罗单牌 · 3D 翻转 + 正逆位
 * 未翻开：牌背（深空 + Y.Mine 符号）
 * 翻开：牌名/元素/牌义/人格影响标签
 * 逆位：牌面旋转 180°
 */
import type { DrawnCard } from '../../hooks/useTarot';
import type { PersonaDim } from '../../types';

interface TarotCardViewProps {
  data: DrawnCard;
  positionLabel: string;
  index: number;
  onReveal: (index: number) => void;
}

const DIM_LABEL: Record<PersonaDim, string> = {
  TOL: '容错', SPD: '速度', INF: '信息', ENT: '热情', LEAD: '主导', VIS: '直觉',
};

export default function TarotCardView({
  data,
  positionLabel,
  index,
  onReveal,
}: TarotCardViewProps) {
  const { card, isReversed, revealed } = data;
  const weights = card.personaWeights;

  return (
    <div className="flex flex-col items-center">
      {/* 位置标签 */}
      <div className="text-[10px] tracking-[0.25em] text-gold-300/60 uppercase mb-3">
        {positionLabel}
      </div>

      {/* 牌体 · 3D 翻转 */}
      <button
        type="button"
        onClick={() => !revealed && onReveal(index)}
        className="relative w-36 h-52 md:w-40 md:h-60 cursor-pointer"
        style={{ perspective: '1000px' }}
        aria-label={revealed ? card.name : '翻牌'}
      >
        <div
          className={`flip-3d absolute inset-0 ${revealed ? 'is-flipped' : ''}`}
        >
          {/* 牌背 · 未翻开时可见 */}
          <div className="flip-face absolute inset-0 rounded-xl border border-gold-400/25 bg-gradient-to-br from-void-700 to-void-900 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-30"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(212,160,64,0.25) 0%, transparent 60%)',
              }}
            />
            <div className="text-center">
              <div className="font-display text-3xl text-gold-400/70 mb-1">☉</div>
              <div className="text-[9px] tracking-[0.3em] text-gold-300/40 uppercase">
                Y.Mine
              </div>
            </div>
            {/* 装饰边框 */}
            <div className="absolute inset-1.5 rounded-lg border border-gold-400/15 pointer-events-none" />
          </div>

          {/* 牌面 · 翻开后可见 */}
          <div className="flip-back flip-face absolute inset-0 rounded-xl border border-gold-400/40 bg-gradient-to-br from-void-800 to-void-900 overflow-hidden flex flex-col">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(circle at 50% 0%, rgba(212,160,64,0.3) 0%, transparent 65%)`,
              }}
            />
            {/* 牌面内容 · 逆位旋转 */}
            <div
              className="relative flex-1 flex flex-col items-center justify-center p-3 text-center"
              style={isReversed ? { transform: 'rotate(180deg)' } : undefined}
            >
              <div className="text-[9px] tracking-[0.2em] text-gold-300/50 uppercase mb-1">
                {card.arcana === 'major' ? 'Major' : 'Minor'} · {card.element}
              </div>
              <div className="font-display text-lg text-gold-300 leading-tight">
                {card.name}
              </div>
              <div className="text-[9px] italic text-moon-300/40 mb-2">
                {card.nameEn}
              </div>
              <div className="text-[10px] text-moon-300/60 leading-relaxed px-1">
                {isReversed ? card.meaningReversed : card.meaningUpright}
              </div>
            </div>

            {/* 正逆位角标 */}
            <div
              className="absolute top-1.5 right-1.5 text-[8px] px-1.5 py-0.5 rounded tracking-[0.1em]"
              style={{
                background: isReversed
                  ? 'rgba(196,30,58,0.25)'
                  : 'rgba(212,160,64,0.2)',
                color: isReversed ? '#E85A78' : '#E8C870',
              }}
            >
              {isReversed ? '逆' : '正'}
            </div>
          </div>
        </div>
      </button>

      {/* 人格影响标签 · 翻开后显示 */}
      {revealed && (
        <div className="mt-3 flex flex-wrap gap-1 justify-center animate-fade-in">
          {Object.entries(weights).map(([dim, w]) => {
            const v = w ?? 0;
            const positive = v >= 0;
            return (
              <span
                key={dim}
                className="text-[9px] px-1.5 py-0.5 rounded font-mono tracking-wider"
                style={{
                  color: positive ? '#E8C870' : '#E85A78',
                  background: positive
                    ? 'rgba(212,160,64,0.1)'
                    : 'rgba(196,30,58,0.1)',
                  border: `1px solid ${positive ? 'rgba(212,160,64,0.25)' : 'rgba(196,30,58,0.25)'}`,
                }}
              >
                {DIM_LABEL[dim as PersonaDim]} {positive ? '+' : ''}{v.toFixed(2)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
