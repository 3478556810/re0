import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '星痕物语',
        short_name: '星痕',
        theme_color: '#fce4ec',
        orientation: 'landscape',  // 强制横屏
        display: 'standalone',    // 全屏无浏览器边框
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})