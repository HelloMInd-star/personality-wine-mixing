/**
 * PreludeNarrative · 预告视觉叙事层
 *
 * 包含所有 SVG/CSS 视觉层：
 *   塔罗揭晓 → 视角下坠 → 城市 → 地球 → 日月 → 终章光
 */

import type { StageId } from './PreludeIntro';

/* ============================================================
   SVG/CSS 视觉层调度器
   ============================================================ */

export function PreludeVisuals({ stage }: { stage: StageId }) {
  return (
    <div className="prelude-visuals" aria-hidden="true">
      {(stage === 'tarot' || stage === 'cardsSpread') && (
        <TarotLayer spread={stage === 'cardsSpread'} />
      )}
      {stage === 'descent' && <DescentLayer />}
      {(stage === 'city' || stage === 'cardsSpread') && <CityLayer />}
      {stage === 'earth' && <EarthLayer />}
      {stage === 'sunMoon' && <SunMoonLayer />}
      {stage === 'epilogue' && <EpilogueLayer />}
      <style>{`
        .prelude-visuals {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

/* —— 塔罗牌层 · 皇帝牌 —— */
function TarotLayer({ spread }: { spread: boolean }) {
  const cards = spread
    ? [
        { offset: -2, label: '星', sub: 'XVII' },
        { offset: -1, label: '月', sub: 'XVIII' },
        { offset: 0, label: '皇', sub: 'IV', main: true },
        { offset: 1, label: '塔', sub: 'XVI' },
        { offset: 2, label: '日', sub: 'XIX' },
      ]
    : [{ offset: 0, label: '皇', sub: 'IV', main: true }];

  return (
    <div className={`tarot-layer ${spread ? 'spread' : 'reveal'}`}>
      {cards.map((c, i) => (
        <div
          key={i}
          className={`tarot-card ${c.main ? 'main' : ''}`}
          style={{
            ['--card-offset' as string]: `${c.offset}`,
            ['--card-delay' as string]: `${i * 0.18}s`,
          }}
        >
          <div className="tarot-card-inner">
            <div className="tarot-card-label">{c.label}</div>
            <div className="tarot-card-sub">{c.sub}</div>
            <div className="tarot-card-ornament" />
          </div>
        </div>
      ))}
      <style>{`
        .tarot-layer {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .tarot-card {
          position: absolute;
          width: 120px; height: 180px;
          transform: translateX(calc(var(--card-offset) * 95px)) translateY(0);
          opacity: 0;
        }
        .tarot-layer.reveal .tarot-card {
          animation: tarot-flip 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .tarot-layer.spread .tarot-card {
          animation: tarot-spread 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) var(--card-delay) forwards;
        }
        @keyframes tarot-flip {
          0%   { opacity: 0; transform: translateX(0) rotateY(180deg) scale(0.6); }
          60%  { opacity: 1; transform: translateX(0) rotateY(40deg) scale(1.05); }
          100% { opacity: 1; transform: translateX(0) rotateY(0) scale(1); }
        }
        @keyframes tarot-spread {
          0%   { opacity: 0; transform: translateX(0) translateY(20px) rotate(0); }
          100% { opacity: 1; transform: translateX(calc(var(--card-offset) * 95px)) translateY(0) rotate(calc(var(--card-offset) * 4deg)); }
        }
        .tarot-card-inner {
          position: relative; width: 100%; height: 100%;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(45, 27, 78, 0.85) 0%, rgba(21, 16, 46, 0.95) 100%);
          border: 1px solid rgba(240, 198, 116, 0.4);
          box-shadow: 0 8px 32px rgba(7, 4, 20, 0.6), 0 0 24px rgba(240, 198, 116, 0.15);
          backdrop-filter: blur(8px);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
        }
        .tarot-card.main .tarot-card-inner {
          border-color: rgba(240, 198, 116, 0.7);
          box-shadow: 0 8px 40px rgba(7, 4, 20, 0.7), 0 0 36px rgba(240, 198, 116, 0.3);
        }
        .tarot-card-inner::after {
          content: '';
          position: absolute; inset: -1.5px; border-radius: 9.5px;
          background: conic-gradient(transparent 0%, rgba(240, 198, 116, 0.6) 12%, transparent 25%, transparent 50%, rgba(155, 123, 212, 0.5) 62%, transparent 75%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          padding: 1.5px;
          animation: energy-spin 4s linear infinite;
          pointer-events: none;
        }
        .tarot-card.main .tarot-card-inner::after {
          background: conic-gradient(transparent 0%, rgba(255, 230, 180, 0.85) 12%, transparent 25%, transparent 50%, rgba(240, 198, 116, 0.7) 62%, transparent 75%);
          animation-duration: 3s;
        }
        @keyframes energy-spin { to { transform: rotate(360deg); } }
        .tarot-card-label {
          font-family: 'Noto Serif SC', serif; font-size: 42px; font-weight: 600;
          background: linear-gradient(135deg, #f0c674 0%, #d4a84b 100%);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 16px rgba(240, 198, 116, 0.3);
        }
        .tarot-card-sub {
          font-size: 10px; letter-spacing: 0.3em;
          color: rgba(216, 201, 245, 0.5);
          font-family: 'JetBrains Mono', monospace;
        }
        .tarot-card-ornament {
          position: absolute; inset: 8px;
          border: 1px solid rgba(240, 198, 116, 0.15); border-radius: 4px;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

/* —— 视角下坠 · 多层视差云 + 地平线渐显 —— */
function DescentLayer() {
  const farClouds = [
    { x: '12%', d: '0s' }, { x: '48%', d: '0.35s' }, { x: '78%', d: '0.7s' },
  ];
  const midClouds = [
    { x: '5%',  d: '0.2s' }, { x: '38%', d: '0.55s' }, { x: '68%', d: '0.9s' },
  ];
  const nearClouds = [
    { x: '22%', d: '0.45s' }, { x: '58%', d: '0.8s' },
  ];
  return (
    <div className="descent-layer">
      {farClouds.map((c, i) => (
        <div key={`f${i}`} className="descent-cloud far"
          style={{ ['--cloud-x' as string]: c.x, ['--cloud-d' as string]: c.d }} />
      ))}
      {midClouds.map((c, i) => (
        <div key={`m${i}`} className="descent-cloud mid"
          style={{ ['--cloud-x' as string]: c.x, ['--cloud-d' as string]: c.d }} />
      ))}
      {nearClouds.map((c, i) => (
        <div key={`n${i}`} className="descent-cloud near"
          style={{ ['--cloud-x' as string]: c.x, ['--cloud-d' as string]: c.d }} />
      ))}
      <div className="descent-horizon" />
      <div className="descent-vignette" />
      <style>{`
        .descent-layer { position: absolute; inset: 0; }
        .descent-cloud {
          position: absolute; left: var(--cloud-x); border-radius: 50%;
          opacity: 0; animation: descent-fall 2.6s ease-in var(--cloud-d) forwards;
        }
        .descent-cloud.far {
          width: 32%; height: 90px; filter: blur(28px);
          background: radial-gradient(ellipse at center, rgba(124, 95, 191, 0.28) 0%, transparent 70%);
          animation-duration: 2.6s;
        }
        .descent-cloud.mid {
          width: 42%; height: 130px; filter: blur(18px);
          background: radial-gradient(ellipse at center, rgba(155, 123, 212, 0.34) 0%, rgba(240, 198, 116, 0.08) 50%, transparent 75%);
          animation-duration: 2s;
        }
        .descent-cloud.near {
          width: 54%; height: 170px; filter: blur(10px);
          background: radial-gradient(ellipse at center, rgba(45, 27, 78, 0.6) 0%, rgba(7, 4, 20, 0.35) 55%, transparent 80%);
          animation-duration: 1.5s;
        }
        @keyframes descent-fall {
          0%   { transform: translateY(-35vh); opacity: 0; }
          22%  { opacity: 1; }
          82%  { opacity: 1; }
          100% { transform: translateY(115vh); opacity: 0; }
        }
        .descent-horizon {
          position: absolute; left: 0; right: 0; bottom: 0; height: 38%;
          background: linear-gradient(to top, rgba(7, 4, 20, 0.92) 0%, rgba(45, 27, 78, 0.4) 35%, rgba(240, 198, 116, 0.06) 65%, transparent 100%);
          opacity: 0; transform: translateY(24px);
          animation: horizon-emerge 1.5s ease-out 1.1s forwards;
        }
        @keyframes horizon-emerge {
          0%   { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .descent-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at center 40%, transparent 25%, rgba(7, 4, 20, 0.55) 100%);
          animation: vignette-in 2.6s ease-out forwards;
        }
        @keyframes vignette-in { 0% { opacity: 0; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}

/* —— 城市剪影 + 人物 —— */
function CityLayer() {
  const lights = Array.from({ length: 28 }, () => ({
    left: Math.random() * 100,
    bottom: Math.random() * 32 + 4,
    delay: Math.random() * 3,
    duration: 1.5 + Math.random() * 2.5,
    warm: Math.random() > 0.4,
  }));
  return (
    <div className="city-layer">
      <div className="city-skyline" />
      {lights.map((l, i) => (
        <div key={i} className={`city-light ${l.warm ? 'warm' : 'cool'}`}
          style={{ left: `${l.left}%`, bottom: `${l.bottom}%`, animationDelay: `${l.delay}s`, animationDuration: `${l.duration}s` }} />
      ))}
      <div className="city-figure" />
      <style>{`
        .city-layer { position: absolute; inset: 0; animation: city-rise 1.4s ease-out forwards; }
        @keyframes city-rise { from { opacity: 0; } to { opacity: 1; } }
        .city-skyline {
          position: absolute; left: 0; right: 0; bottom: 0; height: 40%;
          background:
            linear-gradient(to top, rgba(7, 4, 20, 0.95) 0%, transparent 100%),
            repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(45, 27, 78, 0.6) 40px, rgba(45, 27, 78, 0.6) 70px, transparent 70px, transparent 110px, rgba(21, 16, 46, 0.8) 110px, rgba(21, 16, 46, 0.8) 150px);
          mask: linear-gradient(to top, black 0%, black 60%, transparent 100%);
          -webkit-mask: linear-gradient(to top, black 0%, black 60%, transparent 100%);
        }
        .city-figure {
          position: absolute; left: 50%; bottom: 18%; width: 14px; height: 36px;
          transform: translateX(-50%);
          background: linear-gradient(to top, #070414 0%, #2d1b4e 100%);
          border-radius: 7px 7px 0 0;
          box-shadow: 0 0 16px rgba(124, 95, 191, 0.4);
          animation: figure-appear 1s ease-out 0.4s both;
        }
        .city-figure::before {
          content: ''; position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
          width: 8px; height: 8px; border-radius: 50%;
          background: radial-gradient(circle, #f0c674 0%, transparent 70%);
          box-shadow: 0 0 12px rgba(240, 198, 116, 0.6);
        }
        @keyframes figure-appear {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .city-light {
          position: absolute; width: 2px; height: 2px; border-radius: 50%;
          animation: light-flicker 2s ease-in-out infinite; z-index: 1;
        }
        .city-light.warm { background: rgba(240, 198, 116, 0.9); box-shadow: 0 0 5px rgba(240, 198, 116, 0.8); }
        .city-light.cool { background: rgba(180, 210, 255, 0.8); box-shadow: 0 0 5px rgba(180, 210, 255, 0.6); }
        @keyframes light-flicker { 0%, 100% { opacity: 0.15; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}

/* —— 地球 + 行走小人 —— */
function EarthLayer() {
  return (
    <div className="earth-layer">
      <div className="earth-globe">
        <div className="earth-glow" />
        <div className="earth-surface" />
        <div className="earth-atmosphere" />
        <div className="earth-walker" />
      </div>
      <style>{`
        .earth-layer { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .earth-globe {
          position: relative; width: 320px; height: 320px; border-radius: 50%;
          animation: earth-rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes earth-rise {
          from { opacity: 0; transform: scale(0.6) translateY(60px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .earth-glow {
          position: absolute; inset: -40px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124, 95, 191, 0.3) 0%, transparent 60%);
          filter: blur(20px);
        }
        .earth-surface {
          position: absolute; inset: 0; border-radius: 50%;
          background:
            radial-gradient(circle, rgba(155, 123, 212, 0.5) 1px, transparent 1.5px) 0 0 / 14px 14px,
            radial-gradient(circle, rgba(240, 198, 116, 0.3) 0.5px, transparent 1px) 7px 7px / 14px 14px,
            radial-gradient(circle at 30% 30%, rgba(155, 123, 212, 0.35) 0%, transparent 40%),
            radial-gradient(circle at 70% 60%, rgba(45, 27, 78, 0.6) 0%, transparent 50%),
            linear-gradient(135deg, #15102e 0%, #070414 100%);
          border: 1px solid rgba(240, 198, 116, 0.3);
          box-shadow: inset -20px -20px 60px rgba(7, 4, 20, 0.8), 0 0 60px rgba(124, 95, 191, 0.2);
          animation: earth-rotate 8s linear infinite; overflow: hidden;
        }
        @keyframes earth-rotate {
          from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0; }
          to   { background-position: 14px 0, 14px 0, 0 0, 0 0, 0 0; }
        }
        .earth-atmosphere {
          position: absolute; inset: -4px; border-radius: 50%;
          border: 1px solid rgba(124, 95, 191, 0.35);
          box-shadow: 0 0 24px rgba(124, 95, 191, 0.4), inset 0 0 24px rgba(124, 95, 191, 0.2);
          pointer-events: none;
          animation: atmosphere-pulse 3s ease-in-out infinite;
        }
        @keyframes atmosphere-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.02); }
        }
        .earth-walker {
          position: absolute; top: 50%; left: 50%; width: 8px; height: 16px;
          transform: translate(-50%, -50%);
          background: #f0c674; border-radius: 4px 4px 0 0;
          box-shadow: 0 0 10px rgba(240, 198, 116, 0.8);
          animation: walker-orbit 4s linear infinite;
          transform-origin: center;
        }
        @keyframes walker-orbit {
          0%   { transform: translate(-50%, -50%) rotate(0deg) translateY(-160px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateY(-160px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}

/* —— 太阳 → 图标 → 月光 —— */
function SunMoonLayer() {
  return (
    <div className="sunmoon-layer">
      <div className="sun-body" />
      <div className="icons-row">
        <span className="life-icon icon-coffee">☕</span>
        <span className="life-icon icon-tea">🍵</span>
        <span className="life-icon icon-wine">🍷</span>
      </div>
      <div className="moon-glow" />
      <style>{`
        .sunmoon-layer { position: absolute; inset: 0; }
        .sun-body {
          position: absolute; left: 50%; bottom: 30%; width: 80px; height: 80px;
          transform: translateX(-50%); border-radius: 50%;
          background: radial-gradient(circle at 40% 40%, #f5d88f 0%, #f0c674 50%, #a8842f 100%);
          box-shadow: 0 0 60px rgba(240, 198, 116, 0.6), 0 0 120px rgba(240, 198, 116, 0.3);
          animation: sun-rise-fade 2.4s ease-in-out forwards;
        }
        @keyframes sun-rise-fade {
          0%   { opacity: 0; transform: translate(-50%, 80px) scale(0.5); }
          40%  { opacity: 1; transform: translate(-50%, 0) scale(1); }
          75%  { opacity: 1; transform: translate(-50%, -20px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -40px) scale(0.9); }
        }
        .icons-row {
          position: absolute; left: 50%; bottom: 28%; transform: translateX(-50%);
          display: flex; gap: 40px;
        }
        .life-icon {
          font-size: 36px; opacity: 0;
          filter: drop-shadow(0 0 12px rgba(240, 198, 116, 0.5));
          animation: icon-emerge 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .icon-coffee { animation-delay: 1.6s; }
        .icon-tea    { animation-delay: 2.0s; }
        .icon-wine   { animation-delay: 2.4s; }
        @keyframes icon-emerge {
          0%   { opacity: 0; transform: translateY(20px) scale(0.5); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .moon-glow {
          position: absolute; left: 50%; top: 25%; width: 120px; height: 120px;
          transform: translate(-50%, -50%); border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, rgba(244, 240, 255, 0.9) 0%, rgba(216, 201, 245, 0.4) 40%, transparent 70%);
          box-shadow: 0 0 80px rgba(216, 201, 245, 0.4), 0 0 160px rgba(124, 95, 191, 0.2);
          opacity: 0;
          animation: moon-fade-in 1.8s ease-out 3.4s forwards;
        }
        @keyframes moon-fade-in {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* —— 终章背景光 —— */
function EpilogueLayer() {
  return (
    <div className="epilogue-layer">
      <div className="epilogue-halo" />
      <style>{`
        .epilogue-layer { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .epilogue-halo {
          width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(240, 198, 116, 0.18) 0%, transparent 60%);
          filter: blur(20px);
          animation: halo-breathe 4s ease-in-out infinite;
        }
        @keyframes halo-breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}