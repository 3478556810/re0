import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 暂时禁用 PWA，避免 SW 缓存干扰开发测试
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    // VitePWA({ ... })   // 注释掉整个 PWA 配置
  ]
})