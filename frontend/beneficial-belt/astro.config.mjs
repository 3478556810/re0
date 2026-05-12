import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [vue()],
  vite: {
    build: {
      // 强制所有生成的文件使用 UTF-8 编码
      charset: 'utf8',
    },
    esbuild: {
      // 在更底层，强制 esbuild 也遵循 UTF-8 规则
      charset: 'utf8',
    }
  }
});