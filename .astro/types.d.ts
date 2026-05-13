/// <reference types=\"astro/client\" />
/// <reference types=\"vite/client\" />

// 扩展全局类型
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_TITLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Vue组件类型声明
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Astro组件类型
declare module '*.astro' {
  export default any;
}

// 静态资源类型
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.gif' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
declare module '*.mp3' {
  const src: string;
  export default src;
}
declare module '*.wav' {
  const src: string;
  export default src;
}
declare module '*.ogg' {
  const src: string;
  export default src;
}

// 全局变量声明
declare global {
  interface Window {
    particlesJS?: any;
    tsParticles?: any;
    __themeObserver?: MutationObserver;
  }
}

// CSS模块类型
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.module.sass' {
  const classes: Record<string, string>;
  export default classes;
}

export {};
