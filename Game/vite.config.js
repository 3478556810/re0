import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS({
      presets: [
        require('@unocss/preset-uno')(),
        require('@unocss/preset-icons')({
          scale: 1.2,
          warn: true
        }),
      ],
      shortcuts: [
        ['btn', 'px-4 py-2 rounded-lg font-pixel text-xs uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95'],
        ['glass', 'backdrop-blur-md bg-white/10 border border-white/20 shadow-lg'],
        ['card', 'glass rounded-2xl p-4'],
        ['stat', 'text-2xl font-bold text-amber-300'],
      ],
    }),
  ],
})