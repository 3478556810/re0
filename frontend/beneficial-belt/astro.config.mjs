import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// 在 ES 模块中手动构建 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  integrations: [vue()],

  vite: {
    build: {
      charset: 'utf8',
    },
    esbuild: {
      charset: 'utf8',
    },

    ssr: {
      noExternal: ['tsparticles-engine', 'tsparticles-slim'],
    },

    server: {
      port: 4321,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
      fs: {
        allow: [
          resolve(__dirname, '.'),
          resolve(__dirname, 'node_modules'),
          resolve(__dirname, 'public'),
        ],
      },
    },

    optimizeDeps: {
      include: [],
    },
  },
});