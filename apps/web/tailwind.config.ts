import type { Config } from 'tailwindcss';

// Pokergo Design System: "Botanical Casino"
// 深緑 felt + 真鍮 brass + 骨色 bone + 朱 crimson の上質ラウンジパレット。
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          deepest: '#050a08',
          deep: '#0c1a14',
          DEFAULT: '#152821',
          soft: '#1f3329',
          line: '#2a3b32',
        },
        felt: {
          deep: '#0a2f22',
          DEFAULT: '#0f3d2c',
          mid: '#155a3f',
          light: '#1d8158',
          grain: '#082619',
        },
        brass: {
          deep: '#6f5520',
          DEFAULT: '#c89f48',
          light: '#f5d77a',
          glow: '#fde68a',
        },
        bone: {
          DEFAULT: '#f4ecd8',
          deep: '#d9ccaa',
        },
        ivory: {
          DEFAULT: '#fbf7ed',
          dim: '#d4cdb7',
          muted: '#9c9379',
        },
        crimson: {
          DEFAULT: '#b22a2a',
          glow: '#ef4444',
        },
        jade: {
          DEFAULT: '#4a9d7a',
          glow: '#6ee7b7',
        },
        // 互換: 旧 token を残置（既存コード非破壊）
        accent: '#c89f48',
        win: '#4a9d7a',
        lose: '#b22a2a',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        jp: ['"Shippori Mincho B1"', '"Noto Serif JP"', '"Yu Mincho"', 'serif'],
      },
      letterSpacing: {
        widest: '0.18em',
        ultra: '0.32em',
      },
      boxShadow: {
        brass: '0 0 0 1px rgba(245,215,122,0.3), 0 8px 24px -8px rgba(245,215,122,0.4)',
        felt: 'inset 0 2px 8px rgba(0,0,0,0.4), 0 30px 60px -20px rgba(0,0,0,0.7)',
        card: '0 6px 16px -6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06)',
        verdict:
          '0 0 0 1px rgba(245,215,122,0.5), 0 20px 50px -20px rgba(245,215,122,0.4), inset 0 1px 0 rgba(245,215,122,0.2)',
      },
      backgroundImage: {
        'felt-radial':
          'radial-gradient(ellipse 65% 55% at 50% 35%, #1d8158 0%, #155a3f 35%, #0f3d2c 65%, #0a2f22 100%)',
        'paper-cream': 'linear-gradient(180deg, #f4ecd8 0%, #ede2c6 100%)',
        'brass-sheen':
          'linear-gradient(135deg, #6f5520 0%, #c89f48 30%, #f5d77a 50%, #c89f48 70%, #6f5520 100%)',
        'ink-grad': 'linear-gradient(180deg, #050a08 0%, #0c1a14 100%)',
      },
      keyframes: {
        'deal-in': {
          from: { opacity: '0', transform: 'translateY(-12px) scale(0.9) rotate(-2deg)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1) rotate(0)' },
        },
        'pot-pulse': {
          '0%,100%': { textShadow: '0 0 14px rgba(245,215,122,0.4)' },
          '50%': { textShadow: '0 0 22px rgba(245,215,122,0.7)' },
        },
        'brass-shimmer': {
          '0%': { backgroundPosition: '200% 50%' },
          '100%': { backgroundPosition: '-200% 50%' },
        },
        'verdict-rise': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'chip-toss': {
          from: { transform: 'translateY(-30px) scale(0.6)', opacity: '0' },
          to: { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'felt-drift': {
          '0%,100%': { backgroundPosition: '0 0' },
          '50%': { backgroundPosition: '40px 30px' },
        },
      },
      animation: {
        deal: 'deal-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pot-pulse': 'pot-pulse 3s ease-in-out infinite',
        'brass-shimmer': 'brass-shimmer 4s linear infinite',
        'verdict-rise': 'verdict-rise 320ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'chip-toss': 'chip-toss 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'felt-drift': 'felt-drift 30s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
