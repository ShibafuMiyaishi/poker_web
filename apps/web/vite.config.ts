import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  optimizeDeps: {
    // pokersolver は CJS、Vite に強制バンドルさせる
    include: ['pokersolver'],
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // 初期チャンクを軽量化: react/zustand を vendor、pokersolver + engine を engine 分離。
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('zustand')) return 'vendor';
            if (id.includes('pokersolver')) return 'engine';
          }
          if (id.includes('packages/engine') || id.includes('packages/gto-charts')) {
            return 'engine';
          }
        },
      },
    },
  },
});
