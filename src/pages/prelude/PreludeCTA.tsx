/**
 * PreludeCTA · 交互入口组件
 *
 * 包含：
 *   - StarfieldEnterTrigger · 阶段 1 点击进入银河的触发区
 *   - EpilogueCTA · 终章 5 维度探索入口 + 进入枢纽按钮
 */

import { useNavigate } from 'react-router-dom';

/** 阶段 1 · 点击进入银河的触发区（覆盖全屏） */
export function StarfieldEnterTrigger({ onActivate }: { onActivate: () => void }) {
  return (
    <button
      type="button"
      className="prelude-enter-trigger"
      onClick={onActivate}
      aria-label="点击进入银河系"
    >
      <span className="prelude-enter-hint">触</span>
      <style>{`
        .prelude-enter-trigger {
          position: absolute; inset: 0; z-index: 5;
          background: transparent; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .prelude-enter-hint {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-size: 10px; letter-spacing: 0.3em;
          color: rgba(240, 198, 116, 0.6);
          animation: hint-pulse 2.4s ease-in-out infinite;
        }
        @keyframes hint-pulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
      `}</style>
    </button>
  );
}

/** 终章 · 5 维度探索入口 + 进入枢纽按钮 */
export function EpilogueCTA() {
  const navigate = useNavigate();

  const dims = [
    { accent: '#f0c674', aura: 'rgba(240,198,116,0.35)', glyph: '镜', name: '人格', sub: 'Persona', path: '/personality', delay: '0s' },
    { accent: '#a78bfa', aura: 'rgba(167,139,250,0.35)', glyph: '杯', name: '调酒', sub: 'Elixir', path: '/cocktail', delay: '0.15s' },
    { accent: '#22d3ee', aura: 'rgba(34,211,238,0.35)', glyph: '局', name: '酒局', sub: 'Party', path: '/mbti-party', delay: '0.3s' },
    { accent: '#f472b6', aura: 'rgba(244,114,182,0.35)', glyph: '夜', name: '酒馆', sub: 'Tavern', path: '/tavern', delay: '0.45s' },
    { accent: '#60a5fa', aura: 'rgba(96,165,250,0.35)', glyph: '库', name: '思维库', sub: 'Library', path: '/mind', delay: '0.6s' },
  ];

  return (
    <div className="prelude-explore-wrap animate-orbit-fade-up">
      {/* 5 维度探索入口 */}
      <div className="prelude-explore-dims">
        {dims.map((d) => (
          <button
            key={d.path}
            type="button"
            className="prelude-explore-dim"
            style={{
              ['--dim-accent' as string]: d.accent,
              ['--dim-aura' as string]: d.aura,
              ['--dim-delay' as string]: d.delay,
            }}
            onClick={() => navigate(d.path)}
            aria-label={`进入${d.name}`}
          >
            <div className="prelude-dim-ring" />
            <div className="prelude-dim-body">
              <span className="prelude-dim-glyph">{d.glyph}</span>
            </div>
            <div className="prelude-dim-label">
              <span className="prelude-dim-name">{d.name}</span>
              <span className="prelude-dim-sub">{d.sub}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 进入枢纽主按钮 */}
      <button
        type="button"
        onClick={() => navigate('/hub')}
        className="prelude-enter-btn"
      >
        进入星球枢纽 →
      </button>

      <style>{`
        .prelude-explore-wrap {
          position: absolute; left: 0; right: 0; bottom: 64px; z-index: 9;
          display: flex; flex-direction: column; align-items: center; gap: 40px;
        }
        .prelude-explore-dims {
          display: flex; align-items: flex-end; justify-content: center;
          gap: 36px; padding: 0 24px; max-width: 760px;
        }
        .prelude-explore-dim {
          position: relative; width: 72px; height: 72px;
          padding: 0; border: none; background: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transform: translateY(16px);
          animation: dim-enter 0.9s cubic-bezier(.2,.7,.2,1) var(--dim-delay) forwards;
        }
        @keyframes dim-enter { to { opacity: 1; transform: translateY(0); } }
        .prelude-dim-body {
          width: 100%; height: 100%; border-radius: 50%;
          background: radial-gradient(circle at 32% 28%,
            color-mix(in srgb, var(--dim-accent) 88%, white 12%),
            var(--dim-accent) 55%,
            color-mix(in srgb, var(--dim-accent) 35%, #070414 65%) 100%);
          box-shadow: inset -6px -6px 18px rgba(7,4,20,0.65), 0 0 24px var(--dim-aura);
          display: flex; align-items: center; justify-content: center;
          animation: dim-float 4.8s ease-in-out infinite var(--dim-delay);
          transition: transform 240ms cubic-bezier(.2,.7,.2,1), box-shadow 240ms cubic-bezier(.2,.7,.2,1);
        }
        @keyframes dim-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .prelude-explore-dim:hover .prelude-dim-body {
          transform: scale(1.12);
          box-shadow: inset -6px -6px 18px rgba(7,4,20,0.65), 0 0 48px var(--dim-aura);
        }
        .prelude-dim-ring {
          position: absolute; inset: -10px;
          border: 1px solid color-mix(in srgb, var(--dim-accent) 35%, transparent);
          border-radius: 50%;
          transform: rotateX(70deg);
          animation: dim-orbit 14s linear infinite;
          pointer-events: none;
        }
        @keyframes dim-orbit { to { transform: rotateX(70deg) rotateZ(360deg); } }
        .prelude-dim-glyph {
          font-family: 'Noto Serif SC', serif; font-size: 22px; font-weight: 300;
          color: rgba(7, 4, 20, 0.85);
          text-shadow: 0 1px 2px rgba(255,255,255,0.2);
        }
        .prelude-dim-label {
          position: absolute; bottom: -44px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          white-space: nowrap; pointer-events: none;
        }
        .prelude-dim-name {
          font-size: 11px; letter-spacing: 0.25em; color: var(--dim-accent); opacity: 0.85;
        }
        .prelude-dim-sub {
          font-size: 9px; letter-spacing: 0.2em; color: rgba(216,201,245,0.4);
          opacity: 0; transition: opacity 0.3s;
        }
        .prelude-explore-dim:hover .prelude-dim-sub { opacity: 1; }
        .prelude-enter-btn {
          padding: 14px 36px;
          font-family: 'Noto Serif SC', serif; font-size: 14px; letter-spacing: 0.4em;
          color: #070414;
          background: linear-gradient(135deg, #f0c674 0%, #d4a84b 50%, #a8842f 100%);
          border: none; border-radius: 999px; cursor: pointer;
          box-shadow: 0 0 32px rgba(240, 198, 116, 0.45);
          transition: all 240ms cubic-bezier(.2,.7,.2,1);
        }
        .prelude-enter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 40px rgba(240, 198, 116, 0.6);
        }
        @media (max-width: 640px) {
          .prelude-explore-dims { gap: 20px; }
          .prelude-explore-dim { width: 56px; height: 56px; }
          .prelude-dim-glyph { font-size: 17px; }
          .prelude-dim-label { bottom: -38px; }
          .prelude-explore-wrap { bottom: 48px; gap: 32px; }
        }
      `}</style>
    </div>
  );
}