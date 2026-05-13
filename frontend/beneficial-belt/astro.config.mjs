import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [vue()],
  vite: {
    build: {
      charset: 'utf8',
    },
    esbuild: {
      charset: 'utf8',
    },
    optimizeDeps: {  // 新增：预构建关键依赖
      include: []
    },
ssr: {
      noExternal: ['tsparticles-engine', 'tsparticles-slim'] // 添加这一行


  },
  server: {
    port: 4321,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
});