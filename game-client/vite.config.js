import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'   // 需要安装 @types/node 或直接使用 path

export default defineConfig({
  base: '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
})