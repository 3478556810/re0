<!-- src/components/shanxi/ShanxiAvatar.vue -->
<template>
  <div
    class="avatar-container"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <!-- 光晕背景 -->
    <div
      class="avatar-glow"
      :style="{
        background: `radial-gradient(circle, ${emotion.glowColor} 0%, transparent 70%)`,
        animationDuration: emotion.speed + 's'
      }"
    />

    <!-- 动态粒子层 -->
    <div class="particles-layer">
      <span
        v-for="p in particles"
        :key="p.id"
        class="particle"
        :style="getParticleStyle(p)"
      />
    </div>

    <!-- 中心光核 -->
    <div
      class="avatar-core"
      :style="{
        background: `radial-gradient(circle, ${emotion.color} 0%, transparent 70%)`,
        boxShadow: `0 0 20px ${emotion.glowColor}`
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EmotionState } from './EmotionEngine'

const props = withDefaults(defineProps<{
  emotion?: EmotionState
  size?: number
}>(), {
  emotion: () => ({
    current: 'calm',
    color: '#f0a040',
    speed: 3.5,
    intensity: 1.0,
    glowColor: 'rgba(255, 140, 100, 0.4)'
  }),
  size: 128
})

// 粒子定义：根据情绪生成不同数量的粒子，每个粒子有随机初始参数
interface Particle {
  id: number
  baseAngle: number    // 基础角度（分散在圆周上）
  radius: number       // 轨道半径
  delay: number        // 动画延迟
  duration: number     // 动画周期
  size: number         // 粒子大小
}

const particleCounts: Record<string, number> = {
  calm: 12,
  happy: 18,
  thinking: 14,
  sad: 8,
  angry: 20
}

const particles = computed<Particle[]>(() => {
  const count = particleCounts[props.emotion.current] || 12
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    baseAngle: (i / count) * Math.PI * 2,
    radius: 20 + Math.random() * 30,
    delay: Math.random() * 2,
    duration: props.emotion.speed + Math.random() * 2,
    size: 2 + Math.random() * 4
  }))
})

// 根据情绪状态计算每个粒子的动态样式
function getParticleStyle(p: Particle) {
  const { color, glowColor, current, intensity } = props.emotion

  // 基础位置：围绕中心旋转
  const angle = p.baseAngle
  const x = 50 + Math.cos(angle) * p.radius * 0.8
  const y = 50 + Math.sin(angle) * p.radius * 0.8

  // 不同情绪的运动模式
  let transform = ''
  let animationName = 'orbit'
  if (current === 'happy') {
    animationName = 'happy-bounce'
  } else if (current === 'thinking') {
    animationName = 'thinking-rotate'
  } else if (current === 'sad') {
    animationName = 'sad-sink'
  } else if (current === 'angry') {
    animationName = 'angry-shake'
  }

  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${p.size}px`,
    height: `${p.size}px`,
    backgroundColor: color,
    boxShadow: `0 0 ${p.size * 2}px ${glowColor}`,
    animationName,
    animationDuration: `${p.duration}s`,
    animationDelay: `${p.delay}s`,
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
    opacity: 0.7
  }
}
</script>

<style scoped>
.avatar-container {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(10, 10, 20, 0.3);
  backdrop-filter: blur(4px);
}

.avatar-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: pulse-glow 3s ease-in-out infinite;
}

.avatar-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  opacity: 0.9;
}

.particles-layer {
  position: absolute;
  inset: 0;
}

.particle {
  position: absolute;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 情绪关键帧 */

@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

@keyframes orbit {
  0% { transform: translate(-50%, -50%) rotate(0deg) translateX(10px) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg) translateX(10px) rotate(-360deg); }
}

@keyframes happy-bounce {
  0%, 100% { transform: translate(-50%, -50%) translateY(0); }
  50% { transform: translate(-50%, -50%) translateY(-8px); }
}

@keyframes thinking-rotate {
  0% { transform: translate(-50%, -50%) rotate(0deg) translateX(5px) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg) translateX(5px) rotate(-360deg); }
}

@keyframes sad-sink {
  0%, 100% { transform: translate(-50%, -50%) translateY(0); opacity: 0.7; }
  50% { transform: translate(-50%, -50%) translateY(6px); opacity: 0.3; }
}

@keyframes angry-shake {
  0%, 100% { transform: translate(-50%, -50%) translateX(0); }
  10% { transform: translate(-50%, -50%) translateX(-3px); }
  30% { transform: translate(-50%, -50%) translateX(3px); }
  50% { transform: translate(-50%, -50%) translateX(-2px); }
  70% { transform: translate(-50%, -50%) translateX(2px); }
  90% { transform: translate(-50%, -50%) translateX(-1px); }
}
</style>