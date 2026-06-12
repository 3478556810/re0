import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import UnoCSS from 'unocss/vite'
import { presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    UnoCSS({
      presets: [presetUno(), presetAttributify()],
      shortcuts: {
        'btn': 'px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 hover:border-yellow-500 transition-colors',
        'btn-primary': 'btn bg-yellow-700/30 border-yellow-600 text-yellow-300 hover:bg-yellow-700/50',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // 改为 Go 服务端口
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',    // WebSocket 也代理到 Go
        ws: true,
      },
    },
  },
})