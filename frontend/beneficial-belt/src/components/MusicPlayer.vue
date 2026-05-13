<!-- src/components/MusicPlayer.vue -->
<template>
  <div class="vinyl-player">
    <!-- 黑胶唱片盘片 -->
    <div class="vinyl-disc" :class="{ 'is-spinning': isPlaying }">
      <div class="vinyl-grooves"></div>
      <div class="vinyl-label" v-if="currentCover">
        <img :src="currentCover" alt="封面" />
      </div>
      <div class="vinyl-label-placeholder" v-else>
        <span>🎵</span>
      </div>
    </div>
    
    <!-- 唱臂 -->
    <div class="tonearm" :class="{ 'is-playing': isPlaying }">
      <div class="tonearm-base"></div>
      <div class="tonearm-arm"></div>
      <div class="tonearm-head"></div>
    </div>

    <!-- 控制面板 -->
    <div class="vinyl-controls">
      <div class="song-info" v-if="currentTitle">
        <div class="song-name">{{ currentTitle }}</div>
      </div>
      <div class="control-buttons">
        <button @click="prevTrack" title="上一首">⏮</button>
        <button @click="togglePlay" class="play-btn" title="播放/暂停">
          {{ isPlaying ? '⏸' : '▶️' }}
        </button>
        <button @click="nextTrack" title="下一首">⏭</button>
      </div>
    </div>

    <!-- 隐藏的原生 audio 元素 -->
    <audio
      ref="audioRef"
      :src="currentSrc"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="nextTrack"
      @error="onError"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// ========== 歌单配置 ==========
const playlist = [
  { title: 'CopyMemory', src: '/music/CopyMemory.mp3', cover: '/images/CopyMemory.png', theme: '#60a5fa' },
  { title: 'Bamboo', src: '/music/Bamboo.mp3', cover: '/images/Bamboo.jpg', theme: '#10b981' },
  { title: 'AspiralMoon', src: '/music/AspiralMoon.mp3', cover: '/images/AspiralMoon.jpg', theme: '#c084fc' },
]

// ========== 状态 ==========
const audioRef = ref(null)
const currentIndex = ref(0)
const isPlaying = ref(false)

// ========== 计算属性 ==========
const currentTrack = computed(() => playlist[currentIndex.value])
const currentSrc = computed(() => currentTrack.value.src)
const currentTitle = computed(() => currentTrack.value.title)
const currentCover = computed(() => currentTrack.value.cover)

// ========== 播放控制 ==========
const togglePlay = () => {
  const audio = audioRef.value
  if (!audio) return
  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
}

const nextTrack = () => {
  currentIndex.value = (currentIndex.value + 1) % playlist.length
  nextTickPlay()
}

const prevTrack = () => {
  currentIndex.value = (currentIndex.value - 1 + playlist.length) % playlist.length
  nextTickPlay()
}

const nextTickPlay = () => {
  const audio = audioRef.value
  if (!audio) return
  audio.load()
  setTimeout(() => {
    if (isPlaying.value) audio.play()
  }, 100)
}

const onError = () => {
  console.warn('音频加载失败:', currentSrc.value)
}
</script>

<style scoped>
.vinyl-player {
  position: fixed;
  left: 30px;
  bottom: 40px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* ========== 唱片盘片 ========== */
.vinyl-disc {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle at center,
    #1a1a2e 0%,
    #1a1a2e 22%,
    #111 22.5%,
    #333 23%,
    #111 23.5%,
    #222 25%,
    #111 25.5%,
    #333 26%,
    #111 26.5%,
    #222 28%,
    #111 28.5%,
    #333 29%,
    #111 29.5%,
    #222 31%,
    #111 31.5%,
    #333 32%,
    #111 32.5%,
    #222 34%,
    #111 34.5%,
    #333 35%,
    #111 35.5%,
    #222 37%,
    #111 37.5%,
    #333 38%
  );
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 旋转动画 */
.vinyl-disc.is-spinning {
  animation: vinyl-spin 4s linear infinite;
}

@keyframes vinyl-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 中心标签 */
.vinyl-label {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

.vinyl-label img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vinyl-label-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  z-index: 1;
}



/* ========== 控制面板 ========== */
.vinyl-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.song-info {
  text-align: center;
}

.song-name {
  color: #e2e8f0;
  font-size: 0.9rem;
  font-weight: 500;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.control-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.control-buttons button {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #e2e8f0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-buttons button:hover {
  background: rgba(255,255,255,0.2);
  border-color: #60a5fa;
}

.play-btn {
  width: 44px !important;
  height: 44px !important;
  font-size: 1.1rem !important;
  background: #2c3e50 !important;
  border-color: #60a5fa !important;
}
</style>