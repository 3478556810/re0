<!-- src/components/shanxi/ShanxiHome.vue -->
<template>
  <div class="shanxi-home">
    <!-- 状态悬浮条 -->
    <div v-if="statusText && !isFullscreen" class="status-badge">
      <Icon icon="mdi:circle-small" width="16" class="pulse-dot" />
      <span>{{ statusText }}</span>
    </div>

    <!-- 3D 场景容器 -->
    <div class="scene-wrapper" :class="{ fullscreen: isFullscreen }" ref="sceneContainer">
    <ShanxiRoom3D :status="backendStatus" :isNight="isNight" />
      <button v-if="isFullscreen" class="exit-fullscreen-btn" @click="exitFullscreen">
        <Icon icon="mdi:fullscreen-exit" width="24" height="24" />
      </button>
    </div>

    <!-- 控制栏 -->
    <div v-if="!isFullscreen" class="control-bar">
      <button class="control-btn" @click="enterFullscreen">
        <Icon icon="mdi:fullscreen" width="20" height="20" />
        <span>全屏游玩</span>
      </button>
      <button class="control-btn" @click="openChat">
        <Icon icon="mdi:chat-outline" width="20" height="20" />
        <span>对话</span>
      </button>
      <button class="control-btn" @click="toggleDayNight">
        <Icon :icon="isNight ? 'mdi:weather-night' : 'mdi:weather-sunny'" width="20" height="20" />
        <span>{{ isNight ? '夜晚' : '白天' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import ShanxiRoom3D from './ShanxiRoom3D.vue'
const backendStatus = ref('活跃中')
onMounted(() => {
  const states = ['活跃中', '发呆', '休眠', '忙碌']
  let i = 0
  setInterval(() => {
    backendStatus.value = states[i++ % states.length]
  }, 5000)
})


const isFullscreen = ref(false)
const isNight = ref(false)
const weatherIndex = ref(0)

const statusText = computed(() => {
  const s = backendStatus.value || ''
  if (s.includes('活跃')) return '杉汐正在认真工作'
  if (s.includes('发呆')) return '杉汐望着窗外发呆'
  if (s.includes('休眠')) return '杉汐睡着了'
  if (s.includes('忙碌')) return '杉汐在整理书架'
  return ''
})

// 全屏逻辑
const sceneContainer = ref(null)

async function enterFullscreen() {
  const el = sceneContainer.value
  if (!el) return
  if (el.requestFullscreen) {
    await el.requestFullscreen()
  } else if (el.webkitRequestFullscreen) {
    await el.webkitRequestFullscreen()
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) document.exitFullscreen()
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', onFullscreenChange)
})
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
})

function openChat() {
  window.dispatchEvent(new CustomEvent('open-chat', { detail: { message: '嗨，我在呢！' } }))
}

function toggleDayNight() {
  isNight.value = !isNight.value
}

function cycleWeather() {
  weatherIndex.value = (weatherIndex.value + 1) % 3
}
</script>

<style scoped>
.shanxi-home {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #eef3fc 0%, #d9e6f7 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.status-badge {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  padding: 6px 20px;
  border-radius: 24px;
  color: #1a365d;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  z-index: 10;
  pointer-events: none;
}

.pulse-dot {
  color: #4a90e2;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.scene-wrapper {
  width: 400px;
  height: 400px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(28, 52, 84, 0.1);
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.2);
  background: #ffffff;
}

.scene-wrapper.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  box-shadow: none;
  z-index: 100;
}

.exit-fullscreen-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  z-index: 20;
}

.exit-fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}

.control-bar {
  margin-top: 28px;
  display: flex;
  gap: 12px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  padding: 8px 24px;
  border-radius: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #1e3b6b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 18px;
  border-radius: 24px;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(30, 59, 107, 0.06);
}

.control-btn:active {
  transform: scale(0.96);
}
</style>