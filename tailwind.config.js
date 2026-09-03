/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 深空紫金主题
        void: {
          900: '#070414',
          800: '#0d0820',
          700: '#15102e',
          600: '#1f1640',
          500: '#2d1b4e',
        },
        gold: {
          400: '#f0c674',
          500: '#d4a84b',
          600: '#a8842f',
        },
        amethyst: {
          400: '#9b7bd4',
          500: '#7c5fbf',
          600: '#5d44a0',
        },
        moon: {
          50: '#f4f0ff',
          200: '#d8c9f5',
        },
        // ORBIT 借鉴的 5 状态色（保留觉醉紫金主色，叠加 ORBIT 极简状态语义）
        orbit: {
          accent: '#6FA8FF',   // 冰蓝 · 高亮/焦点
          signal: '#5BCFA0',   // 绿 · 成功/健康/正向状态
          alert:  '#FF6B6B',   // 红 · 警告/负向状态
          'bg-elev':   'rgba(255,255,255,0.04)',  // 玻璃背景浅
          'bg-elev-2': 'rgba(255,255,255,0.07)',  // 玻璃背景深
          'line':        'rgba(255,255,255,0.08)', // 边框细
          'line-strong': 'rgba(255,255,255,0.18)', // 边框粗
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'void-gradient':
          'radial-gradient(ellipse at top, #2d1b4e 0%, #15102e 40%, #070414 100%)',
        'gold-sheen':
          'linear-gradient(135deg, #f0c674 0%, #d4a84b 50%, #a8842f 100%)',
        'amethyst-sheen':
          'linear-gradient(135deg, #9b7bd4 0%, #7c5fbf 50%, #5d44a0 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(15, 8, 40, 0.45)',
        'glow-gold': '0 0 24px rgba(240, 198, 116, 0.35)',
        'glow-amethyst': '0 0 24px rgba(124, 95, 191, 0.4)',
        // ORBIT 状态色发光
        'glow-accent': '0 0 20px rgba(111, 168, 255, 0.35)',
        'glow-signal': '0 0 20px rgba(91, 207, 160, 0.35)',
        'glow-alert':  '0 0 20px rgba(255, 107, 107, 0.35)',
      },
      borderRadius: {
        // ORBIT 圆角体系（卡片 48 · 胶囊 100）
        'card':    '48px',
        'pill':    '100px',
        'capsule': '28px',
      },
      transitionTimingFunction: {
        // ORBIT 统一过渡曲线 · cubic-bezier(.2,.7,.2,1)
        'orbit': 'cubic-bezier(.2,.7,.2,1)',
      },
      transitionDuration: {
        'orbit-fast': '160ms',
        'orbit-mid':  '240ms',
        'orbit-slow': '380ms',
      },
      animation: {
        'twinkle-slow': 'twinkle 4s ease-in-out infinite',
        'drift-slow': 'drift 24s linear infinite',
        'breathe': 'breathe 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        // ORBIT 借鉴的 2 动画
        'orbit-pulse':  'orbitPulse 2.4s cubic-bezier(.2,.7,.2,1) infinite',
        'orbit-fade-up':'orbitFadeUp 240ms cubic-bezier(.2,.7,.2,1) both',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        drift: {
          '0%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-20px) translateX(10px)' },
          '100%': { transform: 'translateY(0) translateX(0)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.04)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // ORBIT 借鉴的 2 关键帧（pulse · fadeUp）
        orbitPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.55' },
        },
        orbitFadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
