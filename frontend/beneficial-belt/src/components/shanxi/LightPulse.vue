<!-- src/components/shanxi/LightPulse.vue -->
<template>
  <div class="pulse-wrapper">
    <div class="pulse-ring" />
  </div>
</template>

<script setup lang="ts">
// 心跳组件不需要任何 props 或逻辑
// 它是纯粹的生命体征，用 CSS 动画表达杉汐的呼吸
</script>



<style scoped>
.pulse-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* 让鼠标事件穿透，不影响交互 */
}

.pulse-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(96, 165, 250, 0.15) 0%,
    rgba(96, 165, 250, 0.05) 60%,
    transparent 100%
  );
  box-shadow:
    0 0 20px rgba(96, 165, 250, 0.3),
    0 0 40px rgba(96, 165, 250, 0.1);
  animation: heartbeat 2s ease-in-out infinite;
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.15);
    opacity: 1;
  }
}
</style>
