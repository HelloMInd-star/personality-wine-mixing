/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 深空基底
        void: {
          900: '#08080E',
          800: '#0E0E16',
          700: '#14141E',
        },
        // 模块主色
        tarot: '#D4A040',
        zodiac: '#7A4BFF',
        poker: '#C41E3A',
        texas: '#4DD0E1',
        // 文字
        moon: {
          50: '#FFFFFF',
          200: '#E8E2D8',
          300: '#C8C0B8',
          400: '#9A9388',
        },
        amethyst: {
          300: '#B8A4E8',
          400: '#8B73D1',
          500: '#6B4FBF',
        },
        gold: {
          300: '#E8C870',
          400: '#D4A040',
          500: '#B88830',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-tarot': '0 0 24px rgba(212, 160, 64, 0.35)',
        'glow-zodiac': '0 0 24px rgba(122, 75, 255, 0.35)',
        'glow-poker': '0 0 24px rgba(196, 30, 58, 0.35)',
        'glow-texas': '0 0 24px rgba(77, 208, 225, 0.35)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'card-flip': {
          '0%': { transform: 'rotateY(180deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        'shuffle-drift': {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '50%': { transform: 'translateX(-6px) rotate(-1deg)' },
        },
        'breath-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out both',
        'shuffle-drift': 'shuffle-drift 1.6s ease-in-out infinite',
        'breath-glow': 'breath-glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
