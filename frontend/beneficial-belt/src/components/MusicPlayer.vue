<!-- src/components/MusicPlayer.vue -->
<template>
  <div class="vinyl-player">
    <div class="vinyl-disc" :class="{ 'is-spinning': isPlaying }">
      <div class="vinyl-grooves"></div>
      <div class="vinyl-label" v-if="currentCover">
        <img :src="currentCover" alt="封面" />
      </div>
      <div class="vinyl-label-placeholder" v-else>
        <span>🎵</span>
      </div>
    </div>

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

    <audio
      ref="audioRef"
      :src="currentSrc"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="onSongEnded"
      @error="onError"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {  onMounted } from 'vue'  // 如果没有 onMounted，加上它
const playlist = [
  { title: 'CopyMemory', src: '/music/CopyMemory.mp3', cover: '/images/CopyMemory.png', theme: '#60a5fa' },
  { title: 'Bamboo', src: '/music/Bamboo.mp3', cover: '/images/Bamboo.jpg', theme: '#10b981' },
  { title: 'AspiralMoon', src: '/music/AspiralMoon.mp3', cover: '/images/AspiralMoon.jpg', theme: '#c084fc' },
]

const audioRef = ref(null)
const currentIndex = ref(0)
const isPlaying = ref(false)
let canAutoPlay = false

const currentTrack = computed(() => playlist[currentIndex.value])
const currentSrc = computed(() => currentTrack.value.src)
const currentTitle = computed(() => currentTrack.value.title)
const currentCover = computed(() => currentTrack.value.cover)

// ========== 辅助函数：等待音频准备好 ==========
const waitForCanPlay = () => {
  return new Promise((resolve, reject) => {
    const audio = audioRef.value
    if (!audio) return reject(new Error('音频元素未初始化'))

    const timeout = setTimeout(() => {
      audio.removeEventListener('canplay', handler)
      reject(new Error('音频加载超时'))
    }, 5000)

    const handler = () => {
      clearTimeout(timeout)
      audio.removeEventListener('canplay', handler)
      resolve()
    }

    audio.addEventListener('canplay', handler)
  })
}

// ========== 播放当前音轨（修复竞态） ==========
const playCurrentTrack = async () => {
  const audio = audioRef.value
  if (!audio) return

  audio.load()
  
  try {
    await waitForCanPlay()
    await audio.play()
    canAutoPlay = true
    isPlaying.value = true
  } catch (err) {
    console.warn('播放失败:', err.message || err)
  }
}

// ========== 用户点击播放按钮 ==========
const togglePlay = () => {
  const audio = audioRef.value
  if (!audio) return
  if (audio.paused) {
    playCurrentTrack()
  } else {
    audio.pause()
  }
}

// ========== 歌曲结束时的自动切歌 ==========
const onSongEnded = () => {
  if (canAutoPlay) {
    nextTrack()
  }
}

// ========== 手动切歌 ==========
const nextTrack = () => {
  currentIndex.value = (currentIndex.value + 1) % playlist.length
  const nextColor = playlist[currentIndex.value].theme
  console.log('⏭ 切歌, 主题色:', nextColor)
  window.dispatchEvent(new CustomEvent('theme-switch', { detail: nextColor }))
  playCurrentTrack()
}

const prevTrack = () => {
  currentIndex.value = (currentIndex.value - 1 + playlist.length) % playlist.length
  const prevColor = playlist[currentIndex.value].theme
  console.log('⏮ 切歌, 主题色:', prevColor)
  window.dispatchEvent(new CustomEvent('theme-switch', { detail: prevColor }))
  playCurrentTrack()
}

const onError = () => {
  console.warn('音频加载失败:', currentSrc.value)
}



onMounted(() => {
    window.addEventListener('shanxi-action', (event) => {
        const { action } = event.detail
        if (action.startsWith('switch_music:')) {
            const songName = action.split(':')[1]
            switchToSong(songName)
        } else if (action === 'play_music_calm') {
            switchToSong('CopyMemory')
        } else if (action === 'play_music_happy') {
            switchToSong('Bamboo')
        }
    })
})

// 根据歌名切换到对应歌曲
function switchToSong(songName) {
    const index = playlist.findIndex(s => s.title === songName || s.src.includes(songName))
    if (index !== -1) {
        currentIndex.value = index
        playCurrentTrack()
    } else {
        nextTrack() // 找不到就随机切一首
    }
}
// 暴露播放器状态给 ChatWidget
window.__musicState = {
  get currentIndex() { return currentIndex.value },
  playlist
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

.vinyl-disc.is-spinning {
  animation: vinyl-spin 4s linear infinite;
}

@keyframes vinyl-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

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