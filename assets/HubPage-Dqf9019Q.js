import{j as a}from"./vendor-three-DDa8oPrP.js";import{u as i}from"./vendor-react-CSErxCQx.js";const n=[{id:"sun",glyph:"日",name:"人格测评",route:"/personality",size:84,core:"#fff5e0",mid:"#f0c674",deep:"#d4a84b",glow:"rgba(240,198,116,0.5)",orbitDur:12},{id:"coffee",glyph:"咖",name:"香氛实验室",route:"/scent-lab",size:100,core:"#d4b896",mid:"#8b6f47",deep:"#5c4530",glow:"rgba(139,111,71,0.4)",orbitDur:16},{id:"tea",glyph:"茶",name:"棋局",route:"/chess",size:108,core:"#b8d4a8",mid:"#6b8e6b",deep:"#3d5c3d",glow:"rgba(107,142,107,0.4)",orbitDur:14},{id:"wine",glyph:"酒",name:"人格调酒",route:"/cocktail",size:132,core:"#c4a8e0",mid:"#7c5fbf",deep:"#2d1b4e",glow:"rgba(124,95,191,0.5)",orbitDur:10},{id:"moon",glyph:"月",name:"牌",route:"/cards",size:92,core:"#f0eaff",mid:"#d8c9f5",deep:"#8a7bb0",glow:"rgba(216,201,245,0.4)",orbitDur:18}];function l(){const t=i();return a.jsxs("div",{className:"hub-root",children:[a.jsx("div",{className:"hub-stars"}),a.jsx("div",{className:"hub-nebula hub-nebula-a"}),a.jsx("div",{className:"hub-nebula hub-nebula-b"}),a.jsx("button",{className:"hub-back",onClick:()=>t("/"),"aria-label":"返回首页",children:"← 入镜"}),a.jsxs("header",{className:"hub-header",children:[a.jsx("div",{className:"hub-eyebrow",children:"JUEZUI · 觉醉"}),a.jsx("h1",{className:"hub-title",children:"踏入你的星球"}),a.jsx("p",{className:"hub-subtitle",children:"日 · 咖 · 茶 · 酒 · 月 · 五重宇宙入夜"})]}),a.jsx("div",{className:"hub-planets",children:n.map((e,r)=>a.jsxs("button",{className:`hub-planet-btn ${e.id==="wine"?"main":""}`,style:{"--p-size":`${e.size}px`,"--p-core":e.core,"--p-mid":e.mid,"--p-deep":e.deep,"--p-glow":e.glow,"--p-orbit-dur":`${e.orbitDur}s`,"--p-delay":`${r*.4}s`},onClick:()=>t(e.route),"aria-label":`${e.glyph} · ${e.name}`,children:[a.jsx("div",{className:"hub-orbit-ring"}),a.jsx("div",{className:"hub-planet-body"}),a.jsx("div",{className:"hub-planet-glow"}),a.jsxs("div",{className:"hub-planet-label",children:[a.jsx("span",{className:"hub-glyph",children:e.glyph}),a.jsx("span",{className:"hub-name",children:e.name})]})]},e.id))}),a.jsx("style",{children:`
        .hub-root {
          position: fixed;
          inset: 0;
          background: #070414;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        /* 星点背景 · CSS 多层 radial-gradient */
        .hub-stars {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 20% 30%, rgba(216,201,245,0.6), transparent),
            radial-gradient(1px 1px at 60% 70%, rgba(240,198,116,0.5), transparent),
            radial-gradient(0.5px 0.5px at 80% 20%, rgba(216,201,245,0.4), transparent),
            radial-gradient(1.5px 1.5px at 40% 80%, rgba(155,123,212,0.5), transparent),
            radial-gradient(0.5px 0.5px at 90% 50%, rgba(216,201,245,0.3), transparent),
            radial-gradient(1px 1px at 10% 60%, rgba(240,198,116,0.4), transparent),
            radial-gradient(0.5px 0.5px at 50% 15%, rgba(216,201,245,0.3), transparent),
            radial-gradient(1px 1px at 30% 90%, rgba(155,123,212,0.4), transparent);
          background-size: 250px 250px;
          animation: hub-drift 80s linear infinite;
        }
        @keyframes hub-drift {
          to { background-position: 250px 0; }
        }
        /* 星云团 · 呼吸 */
        .hub-nebula {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }
        .hub-nebula-a {
          width: 500px; height: 500px;
          top: -10%; left: -5%;
          background: radial-gradient(circle, rgba(124,95,191,0.3), transparent 60%);
          animation: nebula-breath 8s ease-in-out infinite;
        }
        .hub-nebula-b {
          width: 400px; height: 400px;
          bottom: -10%; right: -5%;
          background: radial-gradient(circle, rgba(240,198,116,0.15), transparent 60%);
          animation: nebula-breath 10s ease-in-out infinite 2s;
        }
        @keyframes nebula-breath {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%      { opacity: 0.35; transform: scale(1.1); }
        }
        /* 返回按钮 */
        .hub-back {
          position: absolute;
          top: 24px; left: 24px;
          font-size: 12px;
          letter-spacing: 0.3em;
          color: rgba(155,123,212,0.6);
          transition: color 0.3s;
          z-index: 10;
        }
        .hub-back:hover { color: rgba(240,198,116,0.9); }
        /* 标题 */
        .hub-header {
          position: relative;
          text-align: center;
          margin-bottom: 56px;
          z-index: 5;
          animation: hub-fade-in 1s ease-out;
        }
        @keyframes hub-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hub-eyebrow {
          font-size: 11px;
          letter-spacing: 0.6em;
          color: rgba(155,123,212,0.6);
          margin-bottom: 12px;
        }
        .hub-title {
          font-family: 'Noto Serif SC', serif;
          font-size: 36px;
          font-weight: 300;
          background: linear-gradient(135deg, #f0c674, #d8c9f5);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hub-subtitle {
          margin-top: 12px;
          font-size: 13px;
          letter-spacing: 0.2em;
          color: rgba(216,201,245,0.4);
        }
        /* 星球容器 · 水平排列 */
        .hub-planets {
          display: flex;
          align-items: flex-end;
          gap: 28px;
          position: relative;
          z-index: 5;
          padding-bottom: 60px;
          animation: hub-fade-in 1.2s ease-out 0.3s both;
        }
        /* 单个星球 */
        .hub-planet-btn {
          position: relative;
          width: var(--p-size);
          height: var(--p-size);
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: planet-float 4s ease-in-out infinite var(--p-delay);
        }
        @keyframes planet-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        .hub-planet-btn.main { animation-duration: 5s; }
        /* 轨道环 · 倾斜旋转 + 轨道粒子 */
        .hub-orbit-ring {
          position: absolute;
          inset: -14px;
          border: 1px solid rgba(240,198,116,0.12);
          border-radius: 50%;
          transform: rotateX(72deg);
          animation: orbit-rotate var(--p-orbit-dur) linear infinite;
        }
        .hub-orbit-ring::before {
          content: '';
          position: absolute;
          top: 50%; left: -2px;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: var(--p-mid);
          box-shadow: 0 0 8px var(--p-glow);
        }
        @keyframes orbit-rotate {
          to { transform: rotateX(72deg) rotateZ(360deg); }
        }
        /* 球体 · 偏心高光渐变 */
        .hub-planet-body {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 28%, var(--p-core), var(--p-mid) 50%, var(--p-deep) 100%);
          box-shadow: inset -8px -8px 24px rgba(7,4,20,0.7);
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        /* 外光晕 */
        .hub-planet-glow {
          position: absolute;
          inset: -24px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--p-glow), transparent 60%);
          filter: blur(10px);
          opacity: 0.5;
          transition: opacity 0.4s;
          pointer-events: none;
        }
        /* hover · 放大 + 光晕增强 */
        .hub-planet-btn:hover .hub-planet-body { transform: scale(1.12); }
        .hub-planet-btn:hover .hub-planet-glow { opacity: 1; }
        /* 标签 */
        .hub-planet-label {
          position: absolute;
          bottom: -52px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          pointer-events: none;
        }
        .hub-glyph {
          font-family: 'Noto Serif SC', serif;
          font-size: 18px;
          color: var(--p-mid);
          opacity: 0.85;
        }
        .hub-name {
          font-size: 11px;
          letter-spacing: 0.2em;
          color: rgba(216,201,245,0.5);
        }
        /* 主星球 · 酒 · 加强 */
        .hub-planet-btn.main .hub-glyph {
          font-size: 24px;
          color: #f0c674;
        }
        .hub-planet-btn.main .hub-name {
          color: rgba(240,198,116,0.7);
        }
        .hub-planet-btn.main .hub-planet-glow { opacity: 0.7; }
        .hub-planet-btn.main .hub-orbit-ring { border-color: rgba(240,198,116,0.2); }
        /* 响应式 · 小屏缩小间距 */
        @media (max-width: 768px) {
          .hub-planets { gap: 16px; }
          .hub-title { font-size: 28px; }
        }
      `})]})}export{l as default};
