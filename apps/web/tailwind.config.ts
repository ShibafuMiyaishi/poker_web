import type { Config } from 'tailwindcss';

// Pokergo Design System "Botanical Vault"
// 深緑 felt + 真鍮 brass を骨格に、botanical 緑 (moss) と朱 (vermilion) を加えた
// アクセント増し版。重複 keyframe は CSS 側に集約し、Tailwind 側は色/フォント中心。
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          abyss: '#04070a',
          deepest: '#070d12',
          deep: '#0d1620',
          DEFAULT: '#16212c',
          soft: '#1f2c38',
          line: '#2a3845',
        },
        felt: {
          shadow: '#06180f',
          deep: '#0a2418',
          DEFAULT: '#0d3a26',
          mid: '#155a3f',
          light: '#1d8158',
        },
        brass: {
          shadow: '#4a3915',
          deep: '#6f5520',
          DEFAULT: '#c89f48',
          light: '#f5d77a',
          glow: '#fde68a',
        },
        vermilion: {
          deep: '#6e1a1f',
          DEFAULT: '#c14a3d',
          light: '#e85d4a',
        },
        moss: {
          deep: '#1f3d2e',
          DEFAULT: '#4d7a5e',
          light: '#7fb88f',
        },
        bone: {
          DEFAULT: '#f4ecd8',
          deep: '#d9ccaa',
        },
        ivory: {
          DEFAULT: '#fbf7ed',
          dim: '#cfc7b1',
          muted: '#8a8270',
        },
        crimson: {
          DEFAULT: '#b22a2a',
          glow: '#ef4444',
        },
        jade: {
          DEFAULT: '#4a9d7a',
          glow: '#6ee7b7',
        },
        // 互換: 旧 token (非破壊のため残置)
        accent: '#c89f48',
        win: '#4a9d7a',
        lose: '#b22a2a',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Manrope"', '"Noto Sans JP"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        // jp = 和文 明朝 (見出し / 朱印感のあるブランド要素)
        jp: ['"Shippori Mincho B1"', '"Noto Serif JP"', '"Yu Mincho"', 'serif'],
        // jp-sans = 和文 ゴシック (本文用、可読性優先)
        'jp-sans': ['"Noto Sans JP"', '"Hiragino Sans"', '"Yu Gothic"', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.18em',
        ultra: '0.32em',
      },
      boxShadow: {
        brass: '0 0 0 1px rgba(245,215,122,0.3), 0 8px 24px -8px rgba(245,215,122,0.4)',
        felt: 'inset 0 2px 8px rgba(0,0,0,0.4), 0 30px 60px -20px rgba(0,0,0,0.7)',
        card: '0 6px 16px -6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
