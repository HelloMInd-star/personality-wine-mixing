/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * vitest 配置
 * - jsdom 环境：支持组件渲染与 DOM 交互（@testing-library/react）
 * - setup 文件：注入 jest-dom 断言 + mock AudioContext（jsdom 无原生实现）
 * - 纯逻辑单测在 jsdom 下同样运行，无需分环境
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
