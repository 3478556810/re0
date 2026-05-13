<template>
  <div class="theme-provider">
    <slot></slot> <!-- 只做样式注入，不修改DOM结构 -->
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  // 初始化默认主题（深空蓝）
  document.documentElement.style.setProperty('--theme-bg', 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)');
});
</script>

<style>
:root {
  --theme-bg: linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%); /* 默认 */
}

.theme-provider {
  min-height: 100vh;
  background: var(--theme-bg);
  transition: background 0.8s ease; /* 为后续主题切换预留 */
}
</style>