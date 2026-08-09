/**
 * ExplorePage · 五维探索（概念预告）
 *
 * 沉浸式全屏 · 不渲染侧栏/主理人/星野背景
 *
 * 历史变更：
 *   - 旧版含 5 个 :type 维度（product/business/finance/cooperation/operation）
 *     这些主题与"人格调酒"产品定位脱节，已于本次清理移除
 *   - 现 /explore/:type 路由已下线，仅保留 /explore 作为概念预告页
 *   - 五维度的语义回归产品本体：人格 / 感官 / 时间 / 场景 / 反馈
 */

import { useNavigate } from 'react-router-dom';

/** 五维切面 · 呼应产品本体而非商业概念 */
const FIVE_DIMS = [
  { glyph: '镜', name: '人格', sub: 'Persona',   desc: '六维向量 · OCEAN 映射 · 双轨采集（静问卷 + 动棋局）' },
  { glyph: '香', name: '感官', sub: 'Sensory',   desc: '视觉色 / 听觉乐 / 嗅觉香 / 味觉酒 · 多模态同构' },
  { glyph: '弧', name: '时间', sub: 'Time',      desc: '皮质醇 / 褪黑素 / 睾酮 / 血清素 · 昼夜动态校准' },
  { glyph: '局', name: '场景', sub: 'Scene',     desc: '吧台 / 酒馆 / 酒局 · 一份向量织入不同氛围' },
  { glyph: '杯', name: '反馈', sub: 'Feedback', desc: '评分 → 向量校准 → 推荐优化 · 闭环回路' },
] as const;

export default function ExplorePage() {
  const navigate = useNavigate();

  return (
    <div className="explore-root">
      {/* 背景层 */}
      <div className="explore-stars" />
      <div
        className="explore-aura"
        style={{ background: 'radial-gradient(circle at 50% 30%, rgba(124,95,191,0.25), transparent 60%)' }}
      />

      {/* 返回入口 */}
      <button
        type="button"
        className="explore-back"
        onClick={() => navigate('/')}
        aria-label="回到首页"
      >
        ← 回到首页
      </button>

      {/* 主体 */}
      <main className="explore-main">
        <div className="text-[11px] tracking-[0.6em] text-amethyst-400/70 uppercase mb-4">
          Five Dimensions · 五维
        </div>
        <h1 className="explore-title">五维织夜</h1>
        <p className="explore-lead">
          Y.Mine 把人格、感官、时间、场景、反馈织成同一份向量。
          这不是问卷换酒单，是向量织夜。
        </p>

        {/* 五维切面 */}
        <div className="explore-dims">
          {FIVE_DIMS.map((d, i) => (
            <article
              key={d.name}
              className="explore-dim-card"
              style={{ ['--card-delay' as string]: `${0.15 + i * 0.1}s` }}
            >
              <div className="explore-dim-glyph">{d.glyph}</div>
              <div className="explore-dim-meta">
                <div className="explore-dim-name">
                  <span className="explore-dim-zh">{d.name}</span>
                  <span className="explore-dim-en">{d.sub}</span>
                </div>
                <p className="explore-dim-desc">{d.desc}</p>
              </div>
            </article>
          ))}
        </div>

        {/* 出口 */}
        <div className="explore-exits">
          <button
            type="button"
            className="explore-exit-primary"
            onClick={() => navigate('/hub')}
          >
            进入星球枢纽 →
          </button>
          <button
            type="button"
            className="explore-exit-secondary"
            onClick={() => navigate('/')}
          >
            回到首页
          </button>
        </div>
      </main>

      <style>{`
        .explore-root {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at top, #15102e 0%, #070414 70%);
          overflow-y: auto;
          overflow-x: hidden;
        }
        .explore-stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            radial-gradient(1px 1px at 20% 30%, rgba(216,201,245,0.5), transparent),
            radial-gradient(1px 1px at 60% 70%, rgba(240,198,116,0.4), transparent),
            radial-gradient(0.5px 0.5px at 80% 20%, rgba(216,201,245,0.35), transparent),
            radial-gradient(1px 1px at 40% 80%, rgba(155,123,212,0.4), transparent),
            radial-gradient(0.5px 0.5px at 90% 50%, rgba(216,201,245,0.3), transparent),
            radial-gradient(1px 1px at 10% 60%, rgba(240,198,116,0.35), transparent);
          background-size: 280px 280px;
          animation: explore-drift 90s linear infinite;
        }
        @keyframes explore-drift {
          to { background-position: 280px 0; }
        }
        .explore-aura {
          position: absolute;
          inset: 0;
          pointer-events: none;
          animation: explore-breath 8s ease-in-out infinite;
        }
        @keyframes explore-breath {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        .explore-back {
          position: fixed;
          top: 24px;
          left: 24px;
          z-index: 10;
          font-size: 11px;
          letter-spacing: 0.3em;
          color: rgba(155,123,212,0.7);
          background: rgba(15,10,30,0.4);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(155,123,212,0.2);
          border-radius: 999px;
          padding: 8px 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .explore-back:hover {
          color: #f0c674;
          border-color: rgba(240,198,116,0.5);
        }
        .explore-main {
          position: relative;
          z-index: 5;
          max-width: 760px;
          margin: 0 auto;
          padding: 120px 24px 80px;
          text-align: center;
          animation: explore-fade-in 1s ease-out;
        }
        @keyframes explore-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .explore-title {
          font-family: 'Noto Serif SC', serif;
          font-size: 42px;
          font-weight: 300;
          background: linear-gradient(135deg, #f0c674, #d8c9f5);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 20px;
        }
        .explore-lead {
          font-size: 14px;
          line-height: 1.9;
          color: rgba(216,201,245,0.65);
          max-width: 540px;
          margin: 0 auto 56px;
          font-family: 'Noto Serif SC', serif;
          letter-spacing: 0.05em;
        }
        .explore-dims {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 56px;
          text-align: left;
        }
        .explore-dim-card {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 18px 22px;
          background: rgba(15,10,30,0.5);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(155,123,212,0.18);
          border-radius: 14px;
          opacity: 0;
          transform: translateY(12px);
          animation: explore-card-in 0.8s cubic-bezier(0.22,1,0.36,1) var(--card-delay) forwards;
        }
        @keyframes explore-card-in {
          to { opacity: 1; transform: translateY(0); }
        }
        .explore-dim-glyph {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 28%, rgba(240,198,116,0.85), rgba(124,95,191,0.6) 70%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Noto Serif SC', serif;
          font-size: 20px;
          color: rgba(7,4,20,0.85);
          text-shadow: 0 1px 2px rgba(255,255,255,0.2);
          flex-shrink: 0;
        }
        .explore-dim-name {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 4px;
        }
        .explore-dim-zh {
          font-family: 'Noto Serif SC', serif;
          font-size: 16px;
          color: #f0c674;
        }
        .explore-dim-en {
          font-size: 10px;
          letter-spacing: 0.25em;
          color: rgba(155,123,212,0.6);
          text-transform: uppercase;
        }
        .explore-dim-desc {
          font-size: 12px;
          line-height: 1.7;
          color: rgba(216,201,245,0.65);
          letter-spacing: 0.03em;
        }
        .explore-exits {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        .explore-exit-primary {
          padding: 14px 36px;
          font-family: 'Noto Serif SC', serif;
          font-size: 14px;
          letter-spacing: 0.4em;
          color: #070414;
          background: linear-gradient(135deg, #f0c674 0%, #a8842f 100%);
          border: none;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 0 32px rgba(240,198,116,0.35);
          transition: all 0.3s ease;
        }
        .explore-exit-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 40px rgba(240,198,116,0.55);
        }
        .explore-exit-secondary {
          font-size: 11px;
          letter-spacing: 0.3em;
          color: rgba(155,123,212,0.6);
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 16px;
          transition: color 0.3s;
        }
        .explore-exit-secondary:hover {
          color: #f0c674;
        }
        @media (max-width: 640px) {
          .explore-main { padding: 100px 20px 60px; }
          .explore-title { font-size: 32px; }
          .explore-lead { font-size: 13px; }
          .explore-dim-card { padding: 14px 16px; gap: 14px; }
          .explore-dim-glyph { width: 36px; height: 36px; font-size: 16px; }
        }
      `}</style>
    </div>
  );
}
