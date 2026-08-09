import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 牌类采集系统 · 独立 Vite 项目
// 端口 5175，避开调酒系统主项目（5173/5174）
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
  },
  preview: {
    port: 5175,
    strictPort: true,
  },
});
