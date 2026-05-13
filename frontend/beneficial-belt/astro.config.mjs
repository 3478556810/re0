import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [
    vue({
      appEntrypoint: '/src/pages/_app',
      ssr: false,  // 禁用SSR，解决hydration问题
      runtimeOptions: {
        compilerOptions: {
          isCustomElement: (tag) => ['particles', 'aplayer'].includes(tag)
        }
      }
    })
  ],
  vite: {
    build: {
      charset: 'utf8',
    },
    esbuild: {
      charset: 'utf8',
    },
    optimizeDeps: {  // 新增：预构建关键依赖
      include: ['particles.vue3', 'tsparticles-slim', '@worstone/vue-aplayer']
    }
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