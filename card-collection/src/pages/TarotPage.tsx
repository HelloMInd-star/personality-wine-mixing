/**
 * 塔罗采集页 · 完整流程
 * 牌堆 → 洗牌 → 抽三张 → 逐张翻牌 → 提交
 */
import { Link, useNavigate } from 'react-router-dom';
import { useTarot } from '../hooks/useTarot';
import { useCollection } from '../store/collectionStore';
import GlassPanel from '../components/ui/GlassPanel';
import TarotCardView from '../components/tarot/TarotCardView';

export default function TarotPage() {
  const { phase, drawn, allRevealed, positionLabel, shuffle, reveal, revealAll, submit, reset } =
    useTarot();
  const { setTarot } = useCollection();
  const navigate = useNavigate();

  const handleSubmit = () => {
    const result = submit();
    setTarot(result);
  };

  return (
    <div className={`module-tarot max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-14 animate-fade-in`}>
      {/* 标题 */}
      <header className="mb-8 md:mb-10">
        <Link
          to="/"
          className="text-xs text-moon-300/50 hover:text-gold-300 transition-colors tracking-[0.1em]"
        >
          ← 返回牌类选择
        </Link>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="font-display text-3xl text-tarot leading-none">☉</span>
          <h1 className="font-display text-2xl md:text-3xl text-moon-50 tracking-display">
            塔罗 · 三牌阵
          </h1>
        </div>
        <p className="mt-2 text-sm text-moon-300/55 leading-relaxed max-w-xl">
          过去 · 现在 · 未来。三张牌从潜意识深处映照你的轮廓，
          逆位之处，权重反转。
        </p>
      </header>

      {/* 主体 */}
      {(phase === 'idle' || phase === 'shuffling') && (
        <GlassPanel module="tarot" padding="lg" className="text-center">
          {/* 牌堆 */}
          <div className="flex justify-center mb-8">
            <div className={`relative w-36 h-52 md:w-40 md:h-60 ${phase === 'shuffling' ? 'animate-shuffle-drift' : ''}`}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-xl border border-gold-400/25 bg-gradient-to-br from-void-700 to-void-900 flex items-center justify-center"
                  style={{
                    transform: `translate(${i * 2}px, ${-i * 2}px)`,
                    zIndex: 5 - i,
                    opacity: 1 - i * 0.08,
                  }}
                >
                  {i === 0 && (
                    <div className="text-center">
                      <div className="font-display text-3xl text-gold-400/70 mb-1">☉</div>
                      <div className="text-[9px] tracking-[0.3em] text-gold-300/40 uppercase">
                        Y.Mine
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={shuffle}
            disabled={phase === 'shuffling'}
            className="px-8 py-3 rounded-xl border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 hover:border-gold-400/70 transition-all duration-300 text-sm tracking-[0.2em] disabled:opacity-50 shadow-glow-tarot"
          >
            {phase === 'shuffling' ? '洗牌中…' : '洗牌并抽三张'}
          </button>
          <p className="mt-4 text-[11px] text-moon-300/40 tracking-wider">
            78 张牌 · 22 大阿尔卡纳 + 56 小阿尔卡纳
          </p>
        </GlassPanel>
      )}

      {/* 抽牌结果 */}
      {(phase === 'drawn' || phase === 'revealed' || phase === 'submitted') && (
        <>
          <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
            {drawn.map((d, i) => (
              <TarotCardView
                key={d.card.id}
                data={d}
                index={i}
                positionLabel={positionLabel[d.position]}
                onReveal={reveal}
              />
            ))}
          </div>

          {/* 控制区 */}
          <GlassPanel module="tarot" padding="md" className="text-center">
            {!allRevealed && phase !== 'submitted' && (
              <>
                <p className="text-sm text-moon-300/60 mb-4">
                  点击牌面逐张翻开，或一键全部展开
                </p>
                <button
                  type="button"
                  onClick={revealAll}
                  className="px-6 py-2.5 rounded-lg border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 transition-all duration-300 text-sm tracking-[0.15em]"
                >
                  全部翻开
                </button>
              </>
            )}

            {allRevealed && phase !== 'submitted' && (
              <>
                <p className="text-sm text-moon-300/60 mb-4">
                  三张牌已尽数展开，确认这份映照
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-6 py-2.5 rounded-lg bg-gold-400/15 border border-gold-400/60 text-gold-300 hover:bg-gold-400/25 transition-all duration-300 text-sm tracking-[0.15em] shadow-glow-tarot"
                  >
                    提交采集
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="px-6 py-2.5 rounded-lg border border-amethyst-500/30 text-moon-300/60 hover:text-moon-200 hover:border-amethyst-400/50 transition-all duration-300 text-sm tracking-[0.15em]"
                  >
                    重新抽牌
                  </button>
                </div>
              </>
            )}

            {phase === 'submitted' && (
              <div className="animate-fade-in">
                <div className="font-display text-2xl text-gold-300 mb-2">
                  塔罗映照已采集
                </div>
                <p className="text-sm text-moon-300/55 mb-5">
                  这份潜意识之镜已并入你的人格轮廓。
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    to="/"
                    className="px-6 py-2.5 rounded-lg border border-amethyst-500/30 text-moon-300/60 hover:text-moon-200 hover:border-amethyst-400/50 transition-all duration-300 text-sm tracking-[0.15em]"
                  >
                    继续其他牌类
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate('/result')}
                    className="px-6 py-2.5 rounded-lg bg-gold-400/15 border border-gold-400/60 text-gold-300 hover:bg-gold-400/25 transition-all duration-300 text-sm tracking-[0.15em] shadow-glow-tarot"
                  >
                    查看融合结果 →
                  </button>
                </div>
              </div>
            )}
          </GlassPanel>
        </>
      )}
    </div>
  );
}
