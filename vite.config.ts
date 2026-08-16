import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// ESM 下没有 __dirname · 用 import.meta.url 派生（跨平台兼容）
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/**
 * Swagger UI 中间件 · 在 dev server 提供 /api-docs 路径
 *
 * 路由约定：
 *   GET /api-docs              → Swagger UI HTML 入口
 *   GET /api-docs/*            → swagger-ui-dist 静态资源（JS/CSS/图标）
 *   GET /docs/openapi.yaml     → OpenAPI 规范（供 Swagger UI fetch）
 *   GET /docs/openapi.json     → JSON 版本（供 Postman 等工具导入）
 *
 * 依赖：swagger-ui-dist（devDependency）
 */
function swaggerUiPlugin() {
  let swaggerUiDistPath: string;
  try {
    swaggerUiDistPath = path.dirname(
      require.resolve('swagger-ui-dist/swagger-ui-bundle.js'),
    );
  } catch {
    // swagger-ui-dist 未安装 · 插件降级为空操作，避免阻塞 dev server
    return { name: 'swagger-ui-disabled' };
  }

  const MIME: Record<string, string> = {
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.map': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.html': 'text/html; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.yaml': 'application/yaml; charset=utf-8',
    '.yml': 'application/yaml; charset=utf-8',
  };

  return {
    name: 'swagger-ui-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];

        // 1. /api-docs 或 /api-docs/ → Swagger UI 入口 HTML
        if (url === '/api-docs' || url === '/api-docs/') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Y.Mine API Docs</title>
  <link rel="stylesheet" href="/api-docs/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/api-docs/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/docs/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout',
      });
    };
  </script>
</body>
</html>`);
          return;
        }

        // 2. /api-docs/* → swagger-ui-dist 静态资源
        if (url.startsWith('/api-docs/')) {
          const assetName = url.replace('/api-docs/', '');
          // 防路径穿越
          if (assetName.includes('..')) {
            res.statusCode = 400;
            res.end('Bad Request');
            return;
          }
          const filePath = path.join(swaggerUiDistPath, assetName);
          if (existsSync(filePath)) {
            const ext = path.extname(filePath);
            res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
            res.end(readFileSync(filePath));
            return;
          }
          // 资源未命中 · 交给下一个中间件（可能是 vite 自己的资源）
        }

        // 3. /docs/openapi.{yaml,json} → OpenAPI 规范文件
        //    让 Swagger UI 与外部工具能直接 fetch
        if (url === '/docs/openapi.yaml' || url === '/docs/openapi.json') {
          const fileName = path.basename(url);
          const filePath = path.resolve(__dirname, 'docs', fileName);
          if (existsSync(filePath)) {
            const ext = path.extname(filePath);
            res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
            res.end(readFileSync(filePath));
            return;
          }
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), swaggerUiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        // 工程化降债 · 拆分大依赖独立 chunk · 首屏不再背负 echarts
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-echarts': ['echarts'],
          // 隔离 Three.js 生态 · 非 3D 页面不再加载 776KB 无用 chunk
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
    // 按依赖图自动拆分 >500kB 的内部模块
    chunkSizeWarningLimit: 600,
  },
});
