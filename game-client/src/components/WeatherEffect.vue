<template>
  <div v-if="weather.type !== 'clear'" class="weather-overlay" :class="weather.type">
    <!-- 雨 -->
    <div v-if="weather.type === 'rain'" class="rain-container">
      <div v-for="i in 80" :key="'rain' + i" class="rain-drop" :style="getRainStyle(i)"></div>
    </div>
    <!-- 雪 -->
    <div v-if="weather.type === 'snow'" class="snow-container">
      <div v-for="i in 60" :key="'snow' + i" class="snow-flake" :style="getSnowStyle(i)"></div>
    </div>
    <!-- 阴天 -->
    <div v-if="weather.type === 'cloudy'" class="cloudy-overlay"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const weather = computed(() => store.weather)

function getRainStyle(i) {
  const intensity = weather.value.intensity || 0.5
  return {
    left: `${(i * 1.237 + 31) % 100}%`,
    animationDelay: `${(i * 0.137) % 1}s`,
    animationDuration: `${0.5 + (i % 3) * 0.1}s`,
    opacity: 0.3 + intensity * 0.5
  }
}

function getSnowStyle(i) {
  const intensity = weather.value.intensity || 0.5
  return {
    left: `${(i * 3.14 + 17) % 100}%`,
    animationDelay: `${(i * 0.237) % 2}s`,
    animationDuration: `${3 + (i % 5) * 0.5}s`,
    opacity: 0.3 + intensity * 0.5,
    width: `${4 + (i % 3) * 2}px`,
    height: `${4 + (i % 3) * 2}px`
  }
}
</script>

<style scoped>
.weather-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  overflow: hidden;
}

/* ===== 雨 ===== */
.rain-container {
  position: absolute;
  inset: 0;
}

.rain-drop {
  position: absolute;
  top: -10px;
  width: 2px;
  height: 15px;
  background: linear-gradient(transparent, rgba(174, 194, 224, 0.6));
  animation: rainFall linear infinite;
}

@keyframes rainFall {
  0% { transform: translateY(-20px); }
  100% { transform: translateY(100vh); }
}

/* ===== 雪 ===== */
.snow-container {
  position: absolute;
  inset: 0;
}

.snow-flake {
  position: absolute;
  top: -10px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: snowFall ease-in-out infinite;
}

@keyframes snowFall {
  0% { transform: translateY(-10px) translateX(0); }
  50% { transform: translateY(50vh) translateX(20px); }
  100% { transform: translateY(100vh) translateX(-10px); }
}

/* ===== 阴天 ===== */
.cloudy-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(180, 180, 200, 0.3) 0%,
    rgba(160, 160, 180, 0.15) 50%,
    transparent 100%
  );
}
</style>
