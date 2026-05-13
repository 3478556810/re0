<template>
  <div id="tsparticles-container">
    <div id="tsparticles"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { loadSlim } from 'tsparticles-slim'

let container = null

onMounted(async () => {
  // 动态导入引擎，确保只在浏览器环境执行
  const { tsParticles } = await import('tsparticles-engine')
  
  await loadSlim(tsParticles)
  
  container = await tsParticles.load('tsparticles', {
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: { enable: true, mode: 'push' },
        onHover: { enable: true, mode: 'grab', parallax: { enable: true, force: 60 } },
        resize: true
      },
      modes: {
        push: { quantity: 4 },
        grab: { distance: 200, links: { opacity: 0.5 } }
      }
    },
    particles: {
      number: { value: 80, density: { enable: true, area: 800 } },
      color: { value: ['#60a5fa', '#a78bfa', '#38bdf8'] },
      links: { enable: true, distance: 150, color: '#8b5cf6', opacity: 0.4, width: 2 },
      move: {
        enable: true,
        speed: 1.5,
        direction: 'none',
        random: true,
        straight: false,
        outModes: 'bounce'
      },
      size: { value: 4, random: true, anim: { enable: true, speed: 2, size_min: 1 } },
      opacity: { value: 0.7, random: true, anim: { enable: true, speed: 0.5, opacity_min: 0.2 } }
    },
    detectRetina: true
  })
})

onBeforeUnmount(() => {
  if (container) {
    container.destroy()
    container = null
  }
})
</script>

<style scoped>
#tsparticles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

#tsparticles {
  width: 100%;
  height: 100%;
}
</style>