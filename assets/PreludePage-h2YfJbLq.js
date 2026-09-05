import{j as e}from"./vendor-three-DDa8oPrP.js";import{u as H,r as y}from"./vendor-react-CSErxCQx.js";function J({stage:n}){return e.jsxs("div",{className:"prelude-visuals","aria-hidden":"true",children:[(n==="tarot"||n==="cardsSpread")&&e.jsx(Z,{spread:n==="cardsSpread"}),n==="descent"&&e.jsx(K,{}),(n==="city"||n==="cardsSpread")&&e.jsx(Q,{}),n==="earth"&&e.jsx(U,{}),n==="sunMoon"&&e.jsx(_,{}),n==="epilogue"&&e.jsx(aa,{}),e.jsx("style",{children:`
        .prelude-visuals {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
        }
      `})]})}function Z({spread:n}){const l=n?[{offset:-2,label:"星",sub:"XVII"},{offset:-1,label:"月",sub:"XVIII"},{offset:0,label:"皇",sub:"IV",main:!0},{offset:1,label:"塔",sub:"XVI"},{offset:2,label:"日",sub:"XIX"}]:[{offset:0,label:"皇",sub:"IV",main:!0}];return e.jsxs("div",{className:`tarot-layer ${n?"spread":"reveal"}`,children:[l.map((o,s)=>e.jsx("div",{className:`tarot-card ${o.main?"main":""}`,style:{"--card-offset":`${o.offset}`,"--card-delay":`${s*.18}s`},children:e.jsxs("div",{className:"tarot-card-inner",children:[e.jsx("div",{className:"tarot-card-label",children:o.label}),e.jsx("div",{className:"tarot-card-sub",children:o.sub}),e.jsx("div",{className:"tarot-card-ornament"})]})},s)),e.jsx("style",{children:`
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
      `})]})}function K(){const n=[{x:"12%",d:"0s"},{x:"48%",d:"0.35s"},{x:"78%",d:"0.7s"}],l=[{x:"5%",d:"0.2s"},{x:"38%",d:"0.55s"},{x:"68%",d:"0.9s"}],o=[{x:"22%",d:"0.45s"},{x:"58%",d:"0.8s"}];return e.jsxs("div",{className:"descent-layer",children:[n.map((s,m)=>e.jsx("div",{className:"descent-cloud far",style:{"--cloud-x":s.x,"--cloud-d":s.d}},`f${m}`)),l.map((s,m)=>e.jsx("div",{className:"descent-cloud mid",style:{"--cloud-x":s.x,"--cloud-d":s.d}},`m${m}`)),o.map((s,m)=>e.jsx("div",{className:"descent-cloud near",style:{"--cloud-x":s.x,"--cloud-d":s.d}},`n${m}`)),e.jsx("div",{className:"descent-horizon"}),e.jsx("div",{className:"descent-vignette"}),e.jsx("style",{children:`
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
      `})]})}function Q(){const n=Array.from({length:28},()=>({left:Math.random()*100,bottom:Math.random()*32+4,delay:Math.random()*3,duration:1.5+Math.random()*2.5,warm:Math.random()>.4}));return e.jsxs("div",{className:"city-layer",children:[e.jsx("div",{className:"city-skyline"}),n.map((l,o)=>e.jsx("div",{className:`city-light ${l.warm?"warm":"cool"}`,style:{left:`${l.left}%`,bottom:`${l.bottom}%`,animationDelay:`${l.delay}s`,animationDuration:`${l.duration}s`}},o)),e.jsx("div",{className:"city-figure"}),e.jsx("style",{children:`
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
      `})]})}function U(){return e.jsxs("div",{className:"earth-layer",children:[e.jsxs("div",{className:"earth-globe",children:[e.jsx("div",{className:"earth-glow"}),e.jsx("div",{className:"earth-surface"}),e.jsx("div",{className:"earth-atmosphere"}),e.jsx("div",{className:"earth-walker"})]}),e.jsx("style",{children:`
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
      `})]})}function _(){return e.jsxs("div",{className:"sunmoon-layer",children:[e.jsx("div",{className:"sun-body"}),e.jsxs("div",{className:"icons-row",children:[e.jsx("span",{className:"life-icon icon-coffee",children:"☕"}),e.jsx("span",{className:"life-icon icon-tea",children:"🍵"}),e.jsx("span",{className:"life-icon icon-wine",children:"🍷"})]}),e.jsx("div",{className:"moon-glow"}),e.jsx("style",{children:`
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
      `})]})}function aa(){return e.jsxs("div",{className:"epilogue-layer",children:[e.jsx("div",{className:"epilogue-halo"}),e.jsx("style",{children:`
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
      `})]})}function ea({onActivate:n}){return e.jsxs("button",{type:"button",className:"prelude-enter-trigger",onClick:n,"aria-label":"点击进入银河系",children:[e.jsx("span",{className:"prelude-enter-hint",children:"触"}),e.jsx("style",{children:`
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
      `})]})}function ta(){const n=H(),l=[{accent:"#f0c674",aura:"rgba(240,198,116,0.35)",glyph:"镜",name:"人格",sub:"Persona",path:"/personality",delay:"0s"},{accent:"#a78bfa",aura:"rgba(167,139,250,0.35)",glyph:"杯",name:"调酒",sub:"Elixir",path:"/cocktail",delay:"0.15s"},{accent:"#22d3ee",aura:"rgba(34,211,238,0.35)",glyph:"局",name:"酒局",sub:"Party",path:"/mbti-party",delay:"0.3s"},{accent:"#f472b6",aura:"rgba(244,114,182,0.35)",glyph:"夜",name:"酒馆",sub:"Tavern",path:"/tavern",delay:"0.45s"},{accent:"#60a5fa",aura:"rgba(96,165,250,0.35)",glyph:"库",name:"思维库",sub:"Library",path:"/mind",delay:"0.6s"}];return e.jsxs("div",{className:"prelude-explore-wrap animate-orbit-fade-up",children:[e.jsx("div",{className:"prelude-explore-dims",children:l.map(o=>e.jsxs("button",{type:"button",className:"prelude-explore-dim",style:{"--dim-accent":o.accent,"--dim-aura":o.aura,"--dim-delay":o.delay},onClick:()=>n(o.path),"aria-label":`进入${o.name}`,children:[e.jsx("div",{className:"prelude-dim-ring"}),e.jsx("div",{className:"prelude-dim-body",children:e.jsx("span",{className:"prelude-dim-glyph",children:o.glyph})}),e.jsxs("div",{className:"prelude-dim-label",children:[e.jsx("span",{className:"prelude-dim-name",children:o.name}),e.jsx("span",{className:"prelude-dim-sub",children:o.sub})]})]},o.path))}),e.jsx("button",{type:"button",onClick:()=>n("/hub"),className:"prelude-enter-btn",children:"进入星球枢纽 →"}),e.jsx("style",{children:`
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
      `})]})}const E=[{id:"starfield",duration:0,caption:"轻触星空 · 进入银河"},{id:"galaxy",duration:4200,caption:"你进入了一个宇宙视角"},{id:"tarot",duration:2800,caption:"你的原型是什么"},{id:"descent",duration:2600,caption:"穿过云层 · 落回人间"},{id:"city",duration:1800,caption:"你在这里"},{id:"cardsSpread",duration:2800,caption:"你确认自己"},{id:"earth",duration:3500,caption:"你在这个世界上行走"},{id:"sunMoon",duration:5200,caption:"你的生活状态 · 夜晚在银河系中涌现"},{id:"epilogue",duration:0,caption:"准备好探索你的宇宙人间了吗"}];function oa(){const n=H(),[l,o]=y.useState(0),s=E[l];y.useEffect(()=>{if(s.duration<=0)return;const u=window.setTimeout(()=>{o(g=>Math.min(g+1,E.length-1))},s.duration);return()=>window.clearTimeout(u)},[l,s.duration]);const m=y.useCallback(u=>{o(Math.max(0,Math.min(u,E.length-1)))},[]),a=y.useCallback(()=>n("/"),[n]);return e.jsxs("div",{className:"prelude-root",children:[e.jsx(ra,{stage:s.id,onActivate:()=>m(l+1)}),e.jsx(J,{stage:s.id}),e.jsx("button",{type:"button",onClick:a,className:"prelude-skip","aria-label":"跳过预告回到首页",children:"跳过 →"}),e.jsx("div",{className:"prelude-caption-wrap","aria-live":"polite",children:e.jsx("p",{className:"prelude-caption",children:s.caption},s.id)}),s.id==="starfield"&&e.jsx(ea,{onActivate:()=>m(l+1)}),s.id==="epilogue"&&e.jsx(ta,{}),e.jsx("style",{children:`
        .prelude-root {
          position: fixed; inset: 0; z-index: 60;
          background: radial-gradient(ellipse at top, #15102e 0%, #070414 70%);
          overflow: hidden; cursor: default;
        }
        .prelude-skip {
          position: absolute; top: 20px; right: 24px; z-index: 10;
          padding: 8px 14px; font-size: 11px; letter-spacing: 0.25em;
          color: rgba(216, 201, 245, 0.5);
          background: rgba(15, 10, 30, 0.4); backdrop-filter: blur(8px);
          border: 1px solid rgba(155, 123, 212, 0.2); border-radius: 999px;
          cursor: pointer; transition: all 240ms cubic-bezier(.2,.7,.2,1);
        }
        .prelude-skip:hover {
          color: #f0c674; border-color: rgba(240, 198, 116, 0.5);
          background: rgba(45, 27, 78, 0.6);
        }
        .prelude-caption-wrap {
          position: absolute; left: 0; right: 0; bottom: 56px; z-index: 8;
          text-align: center; pointer-events: none;
        }
        .prelude-caption {
          font-family: 'Noto Serif SC', serif; font-size: 14px;
          letter-spacing: 0.4em; color: rgba(216, 201, 245, 0.7);
          text-shadow: 0 0 12px rgba(124, 95, 191, 0.4);
          animation: caption-in 600ms ease-out; padding: 0 24px;
        }
        @keyframes caption-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `})]})}function ra({stage:n}){const l=y.useRef(null),o=y.useRef(n),s=y.useRef(0);return y.useEffect(()=>{o.current=n},[n]),y.useEffect(()=>{const m=l.current;if(!m)return;const a=m.getContext("2d");if(!a)return;let u=m.width=window.innerWidth,g=m.height=window.innerHeight;const A=[];for(let d=0;d<200;d++){const b=Math.floor(Math.random()*3);A.push({x:Math.random()*u,y:Math.random()*g,z:Math.random(),layer:b,r:b===0?Math.random()*.5+.3:b===1?Math.random()*.6+.6:Math.random()*.9+.9,alpha:b===0?Math.random()*.25+.15:b===1?Math.random()*.3+.3:Math.random()*.35+.45,twinkle:Math.random()*Math.PI*2,speed:Math.random()*.02+.005,drift:b===0?.015:b===1?.04:.08})}const I=[];for(let d=0;d<380;d++){const T=Math.floor(Math.random()*3)/3*Math.PI*2,$=Math.random()*180+30,r=$<70;I.push({angle:T+Math.random()*1.4,radius:$,size:r?Math.random()*2.2+.8:Math.random()*1.6+.3,alpha:r?Math.random()*.5+.5:Math.random()*.6+.2,speed:.0015+8e-4*(1-$/220),hue:Math.random(),twinkle:Math.random()*Math.PI*2,twinkleSpeed:Math.random()*.04+.01,isCore:r})}const S=I.filter(d=>d.isCore),z=[];let X=0,G=90+Math.random()*150,j=0,C=0;const L=()=>{const d=o.current;a.clearRect(0,0,u,g),a.fillStyle="rgba(7, 4, 20, 1)",a.fillRect(0,0,u,g);const b=["rgba(124, 95, 191, 0.10)","rgba(240, 198, 116, 0.06)","rgba(93, 68, 160, 0.10)"];for(let r=0;r<b.length;r++){const t=u*(.3+r*.25),x=g*(.35+Math.sin(j*.3+r)*.08),w=240+Math.sin(j*.5+r)*30,c=a.createRadialGradient(t,x,0,t,x,w);c.addColorStop(0,b[r]),c.addColorStop(1,"rgba(7, 4, 20, 0)"),a.fillStyle=c,a.beginPath(),a.arc(t,x,w,0,Math.PI*2),a.fill()}const T=d==="starfield"?1:d==="galaxy"||d==="tarot"?.7:.4;for(const r of A){r.twinkle+=r.speed,r.x+=r.drift,r.x>u+5&&(r.x=-5);const t=Math.max(0,r.alpha+Math.sin(r.twinkle)*.3)*T;a.beginPath(),a.arc(r.x,r.y,r.r,0,Math.PI*2);const x=r.z;x>.9?a.fillStyle=`rgba(240, 198, 116, ${t})`:x>.75?a.fillStyle=`rgba(155, 123, 212, ${t})`:a.fillStyle=`rgba(216, 201, 245, ${t})`,a.fill()}if(d==="starfield"||d==="galaxy"){if(X++,X>=G){X=0,G=90+Math.random()*210;const r=Math.random()>.5;z.push({x:r?Math.random()*u*.5:u*.5+Math.random()*u*.5,y:-20,vx:r?3+Math.random()*2.5:-(3+Math.random()*2.5),vy:4+Math.random()*3,len:70+Math.random()*90,life:1})}for(let r=z.length-1;r>=0;r--){const t=z[r];if(t.x+=t.vx,t.y+=t.vy,t.life-=.009,t.life<=0||t.y>g+50||t.x<-60||t.x>u+60){z.splice(r,1);continue}const x=t.x-t.vx*t.len/6,w=t.y-t.vy*t.len/6,c=a.createLinearGradient(t.x,t.y,x,w);c.addColorStop(0,`rgba(255, 245, 220, ${t.life*.9})`),c.addColorStop(.4,`rgba(240, 198, 116, ${t.life*.5})`),c.addColorStop(1,"rgba(240, 198, 116, 0)"),a.strokeStyle=c,a.lineWidth=1.4,a.beginPath(),a.moveTo(t.x,t.y),a.lineTo(x,w),a.stroke(),a.fillStyle=`rgba(255, 250, 235, ${t.life})`,a.beginPath(),a.arc(t.x,t.y,1.6,0,Math.PI*2),a.fill()}}if(d==="galaxy"||d==="tarot"||d==="descent"){C+=((d==="galaxy"||d==="tarot"?1:.3)-C)*.04,j+=.004;const t=u/2,x=g/2,w=.6+C*1.4,c=d==="descent"?Math.max(0,1-C):1;a.save(),a.translate(t,x),a.scale(w,w),a.rotate(j);const P=a.createRadialGradient(0,0,0,0,0,240);P.addColorStop(0,`rgba(124, 95, 191, ${.12*c})`),P.addColorStop(.5,`rgba(93, 68, 160, ${.06*c})`),P.addColorStop(1,"rgba(7, 4, 20, 0)"),a.fillStyle=P,a.beginPath(),a.arc(0,0,240,0,Math.PI*2),a.fill();for(const i of I){i.angle+=i.speed,i.twinkle+=i.twinkleSpeed;const h=.65+Math.sin(i.twinkle)*.35,p=Math.max(0,i.alpha*h*c),N=i.angle+i.radius*.012,k=Math.cos(N)*i.radius,v=Math.sin(N)*i.radius*.45;a.beginPath(),a.arc(k,v,i.size,0,Math.PI*2);let f;i.isCore?f=i.hue>.5?`rgba(255, 230, 180, ${p})`:`rgba(240, 198, 116, ${p})`:i.hue>.8?f=`rgba(255, 220, 180, ${p})`:i.hue>.6?f=`rgba(180, 210, 255, ${p})`:i.hue>.4?f=`rgba(216, 201, 245, ${p})`:i.hue>.2?f=`rgba(155, 123, 212, ${p})`:f=`rgba(140, 200, 220, ${p})`,a.fillStyle=f,a.fill(),i.isCore&&i.size>1.8&&(a.strokeStyle=`rgba(255, 230, 180, ${p*.4})`,a.lineWidth=.5,a.beginPath(),a.moveTo(k-i.size*3,v),a.lineTo(k+i.size*3,v),a.moveTo(k,v-i.size*3),a.lineTo(k,v+i.size*3),a.stroke())}const O=55;for(let i=0;i<O;i++){const h=S[Math.floor(Math.random()*S.length)],p=S[Math.floor(Math.random()*S.length)];if(h===p)continue;const N=h.angle+h.radius*.012,k=p.angle+p.radius*.012,v=Math.cos(N)*h.radius,f=Math.sin(N)*h.radius*.45,D=Math.cos(k)*p.radius,q=Math.sin(k)*p.radius*.45,F=Math.sqrt((v-D)**2+(f-q)**2);if(F<48){const B=(1-F/48)*.22*c;a.strokeStyle=`rgba(240, 198, 116, ${B})`,a.lineWidth=.4,a.beginPath(),a.moveTo(v,f),a.lineTo(D,q),a.stroke()}}a.globalCompositeOperation="multiply";for(let i=0;i<3;i++){const h=i/3*Math.PI*2+.5;a.save(),a.rotate(h);const p=a.createRadialGradient(0,0,50,0,0,200);p.addColorStop(0,"rgba(20, 10, 40, 0)"),p.addColorStop(.4,`rgba(7, 4, 20, ${.35*c})`),p.addColorStop(1,"rgba(7, 4, 20, 0)"),a.fillStyle=p,a.beginPath(),a.ellipse(0,0,200,28,0,0,Math.PI*2),a.fill(),a.restore()}a.globalCompositeOperation="source-over";const M=a.createRadialGradient(0,0,0,0,0,90);M.addColorStop(0,`rgba(255, 245, 220, ${.7*c})`),M.addColorStop(.3,`rgba(240, 198, 116, ${.4*c})`),M.addColorStop(.7,`rgba(155, 123, 212, ${.12*c})`),M.addColorStop(1,"rgba(7, 4, 20, 0)"),a.fillStyle=M,a.beginPath(),a.arc(0,0,90,0,Math.PI*2),a.fill();const R=.85+Math.sin(j*6)*.18,W=24*R,Y=a.createRadialGradient(0,0,0,0,0,W);Y.addColorStop(0,`rgba(255, 250, 235, ${.95*c*R})`),Y.addColorStop(.5,`rgba(255, 230, 180, ${.5*c*R})`),Y.addColorStop(1,"rgba(240, 198, 116, 0)"),a.fillStyle=Y,a.beginPath(),a.arc(0,0,W,0,Math.PI*2),a.fill(),a.restore()}s.current=requestAnimationFrame(L)};L();const V=()=>{u=m.width=window.innerWidth,g=m.height=window.innerHeight};return window.addEventListener("resize",V),()=>{cancelAnimationFrame(s.current),window.removeEventListener("resize",V)}},[]),e.jsx("canvas",{ref:l,className:"prelude-canvas","aria-hidden":"true",children:e.jsx("style",{children:`
        .prelude-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
      `})})}export{E as STAGES,oa as default};
