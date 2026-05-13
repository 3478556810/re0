// src/pages/_app.ts
import type { App } from 'vue';
// 移除：import Particles from 'particles.vue3';

export default async (app: App) => {
  // 移除：app.use(Particles);
  
  // 如果之前有 Aplayer 的动态导入，可以保留
  if (typeof window !== 'undefined') {
    try {
      const Aplayer = (await import('@worstone/vue-aplayer')).default;
      // 或者之前安装的包名，按实际来
      app.use(Aplayer);
    } catch (e) {
      console.warn('Aplayer 加载失败，音乐播放器可能不可用');
    }
  }
};