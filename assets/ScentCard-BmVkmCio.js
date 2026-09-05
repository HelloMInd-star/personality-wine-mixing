import{j as e}from"./vendor-three-DDa8oPrP.js";import{r}from"./vendor-react-CSErxCQx.js";import{o as g,G as b}from"./index-CvvMMla5.js";const j=`
@keyframes scent-ring-breath {
  0%, 100% { transform: scale(0.72); opacity: 0.42; }
  50%      { transform: scale(1.02); opacity: 0.12; }
}
@keyframes scent-ring-spread {
  0%   { transform: scale(0.5);  opacity: 0.55; }
  100% { transform: scale(1.5);  opacity: 0; }
}
@keyframes scent-ring-burst {
  0%   { transform: scale(0.4);  opacity: 0.75; }
  55%  { opacity: 0.22; }
  100% { transform: scale(1.85); opacity: 0; }
}
@keyframes scent-ring-fade {
  0%   { transform: scale(0.6);  opacity: 0.45; filter: blur(0px); }
  100% { transform: scale(1.35); opacity: 0;    filter: blur(4px); }
}
@keyframes scent-core-glow {
  0%, 100% { text-shadow: 0 0 8px var(--scent-color-soft), 0 0 18px var(--scent-color-faint); }
  50%      { text-shadow: 0 0 14px var(--scent-color),     0 0 30px var(--scent-color-soft); }
}
@keyframes scent-particle-rise {
  0%   { transform: translate(0, 0) scale(1);     opacity: 0; }
  18%  { opacity: var(--particle-peak, 0.7); }
  100% { transform: translate(var(--drift, 0px), -42px) scale(0.25); opacity: 0; }
}
@keyframes scent-bar-sheen {
  0%   { transform: translateX(-120%); }
  60%  { transform: translateX(120%); }
  100% { transform: translateX(120%); }
}
`,v={breath:"scent-ring-breath",spread:"scent-ring-spread",burst:"scent-ring-burst",fade:"scent-ring-fade"},N={breath:"呼吸",spread:"铺开",burst:"爆发",fade:"淡出"},k=["-6px","4px","-2px","8px"];function S({scent:t,phaseColor:s}){const i=g[t.diffusion],u=v[t.diffusion],p=i/3,c=(t.intensity*100).toFixed(0),l=r.useRef(null),o=r.useRef(t.intensity),d=r.useRef(performance.now());r.useLayoutEffect(()=>{const n=performance.now()-d.current,f=l.current,m=f!==null&&f!==t.diffusion,x=o.current!==t.intensity;m?(t.diffusion,n.toFixed(2),void 0):x&&(t.diffusion,o.current.toFixed(2),t.intensity.toFixed(2),n.toFixed(2),void 0),(m||x)&&(t.diffusion,t.intensity.toFixed(2),n.toFixed(2),t.intensity>.3,void 0),l.current=t.diffusion,o.current=t.intensity,d.current=performance.now()},[t.diffusion,t.intensity,i]),r.useEffect(()=>(t.diffusion,()=>{}),[]);const y={"--scent-color":s,"--scent-color-soft":`${s}88`,"--scent-color-faint":`${s}44`},h=Math.max(.3,Math.min(.85,t.intensity*.9+.15));return e.jsxs(b,{padding:"md",className:"mb-6",children:[e.jsx("style",{children:j}),e.jsxs("div",{className:"flex items-center justify-between gap-4 mb-4",children:[e.jsx("h3",{className:"font-display text-sm text-moon-200/80 tracking-[0.15em]",children:"杯垫气味"}),e.jsxs("span",{className:"text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase",children:["Scent · ",N[t.diffusion]]})]}),e.jsxs("div",{className:"flex items-center gap-6",style:y,children:[e.jsxs("div",{className:"relative shrink-0 flex items-center justify-center",style:{width:104,height:104},"aria-hidden":"true",children:[[0,1,2].map(a=>e.jsx("span",{className:"absolute rounded-full",style:{width:84,height:84,border:`1.5px solid ${s}`,animation:`${u} ${i}ms ease-out ${p*a}ms infinite`}},a)),k.map((a,n)=>e.jsx("span",{className:"absolute rounded-full",style:{width:3,height:3,background:s,bottom:"30%",left:`${42+(n-1.5)*12}%`,"--drift":a,"--particle-peak":h.toFixed(2),animation:`scent-particle-rise ${i*1.4}ms ease-out ${n*(i/5)}ms infinite`}},`p-${n}`)),e.jsx("span",{className:"relative font-display text-2xl leading-none",style:{color:s,animation:`scent-core-glow ${i*1.5}ms ease-in-out infinite`},children:t.signatureSymbol})]},t.diffusion),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-3 mb-3",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-0.5",children:"主调"}),e.jsx("div",{className:"font-display text-sm text-moon-50",children:t.primaryLabel})]}),e.jsxs("div",{children:[e.jsx("div",{className:"text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-0.5",children:"签名"}),e.jsx("div",{className:"font-display text-sm text-moon-50",children:t.signatureLabel})]})]}),e.jsxs("div",{className:"mb-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-[10px] text-moon-200/45 mb-1",children:[e.jsx("span",{className:"tracking-[0.15em]",children:"释放强度"}),e.jsxs("span",{className:"font-mono",children:[c,"%"]})]}),e.jsxs("div",{className:"relative h-1 rounded-full bg-amethyst-500/15 overflow-hidden",children:[e.jsx("div",{className:"h-full rounded-full transition-all duration-700",style:{width:`${c}%`,background:`linear-gradient(90deg, ${s}88, ${s})`,boxShadow:`0 0 6px ${s}66`}}),t.intensity>.3&&e.jsx("div",{className:"absolute top-0 left-0 h-full w-1/3",style:{background:`linear-gradient(90deg, transparent, ${s}55, transparent)`,animation:`scent-bar-sheen ${i*1.2}ms ease-in-out infinite`}})]})]}),e.jsx("div",{className:"text-xs italic",style:{color:`${s}cc`},children:t.poem})]})]})]})}export{S};
