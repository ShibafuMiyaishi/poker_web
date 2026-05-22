import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ten-Four 似の青系 + 緑(勝ち)/赤(負け)
        felt: '#0f3a2e',
        accent: '#3b82f6',
        win: '#22c55e',
        lose: '#ef4444',
      },
    },
  },
  plugins: [],
} satisfies Config;
