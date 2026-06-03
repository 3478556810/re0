<template>
  <div class="main-screen">
   <div class="status-bar">
  <span class="status-item">世界等级 {{ store.worldLevel }}</span>
  <span class="status-item">Lv.{{ store.player.level }}</span>
  <span class="status-item">{{ store.player.gold }}G</span>
  <span class="status-item">HP {{ store.player.hp }}/{{ store.player.maxHp }}</span>
  <span class="status-item"><Icon icon="mdi:weather-partly-cloudy" /> {{ weather }}</span>
  <span v-if="storyMode" class="story-timer">{{ storyTimerDisplay }}</span>
  <span class="version-text" @click="handleVersionClick">ver {{ appVersion }}</span>
</div>

    <!-- 全屏内容区 -->
    <div class="fullscreen-area">
      <div class="title-section">
        <h1 class="game-title">星痕物语</h1>
        <p class="game-subtitle">选择你的冒险</p>
      </div>

      <div class="main-entrance">
        <button class="entrance-card dungeon" @click="openPanel('dungeon')">
          <Icon icon="mdi:castle" class="entrance-icon" />
          <div class="entrance-text">
            <span class="entrance-title">地下城</span>
            <span class="entrance-desc">进入迷宫战斗</span>
          </div>
        </button>

        <button v-if="!storyMode" class="entrance-card story" @click="enterStoryMode">
          <Icon icon="mdi:timer" class="entrance-icon" />
          <div class="entrance-text">
            <span class="entrance-title">剧情模式</span>
            <span class="entrance-desc">速通计时挑战</span>
          </div>
        </button>

        <button class="entrance-card dialog" @click="triggerDialog">
          <Icon icon="mdi:chat" class="entrance-icon" />
          <div class="entrance-text">
            <span class="entrance-title">探索剧情</span>
            <span class="entrance-desc">序章故事开始</span>
          </div>
        </button>
      </div>

      <!-- 底部工具栏（放大） -->
      <div class="bottom-toolbar">
        <button class="icon-btn" @click="openPanel('character')">
          <Icon icon="mdi:account" /><span>角色</span>
        </button>
        <button class="icon-btn" @click="openPanel('skills')">
          <Icon icon="mdi:star-four-points" /><span>技能</span>
        </button>
        <button class="icon-btn" @click="openPanel('inventory')">
          <Icon icon="mdi:bag-personal" /><span>背包</span>
        </button>
        <button class="icon-btn" @click="openPanel('forge')">
          <Icon icon="mdi:anvil" /><span>锻造</span>
        </button>
        <button class="icon-btn" @click="openPanel('guild')">
          <Icon icon="mdi:town-hall" /><span>协会</span>
        </button>
        <button class="icon-btn" @click="openPanel('stock')">
  <Icon icon="mdi:chart-line" /><span>股市</span>
</button>
        <button class="icon-btn" @click="openPanel('affection')">
          <Icon icon="mdi:heart" /><span>羁绊</span>
        </button>
        <button v-if="!isFullscreen" class="icon-btn" @click="enterFullscreen">
          <Icon icon="mdi:fullscreen" /><span>全屏</span>
        </button>

<button v-if="!storyMode" class="icon-btn" @click="openPanel('dev')">
    <Icon icon="mdi:cog" /><span>开发</span>
  </button>
      </div>
    </div>

    <!-- 面板组件 -->
    <DungeonSelectPanel v-if="showDungeonSelect" @close="showDungeonSelect = false" @select="onDungeonSelected" />
    <DevPanel v-if="currentPanel === 'dev'" @close="popPanel" />
    <CharacterPanel v-if="currentPanel === 'character'" @close="popPanel" />
    <SkillPanel v-if="currentPanel === 'skills'" @close="popPanel" />
    <ForgePanel v-if="currentPanel === 'forge'" @close="popPanel" />
    <AdventurerGuild v-if="currentPanel === 'guild'" @close="popPanel" @open-backpack="openSellBackpack" />
    <InventoryPanel v-if="currentPanel === 'inventory'" :key="'inv-' + inventoryRefreshKey" :sellMode="inventorySellMode" @close="onCloseInventory" />
    <AffectionPanel v-if="currentPanel === 'affection'" @close="popPanel" />
    <StockPanel v-if="currentPanel === 'stock'" @close="popPanel" />
    <DialogPanel ref="dialogRef" @close="onDialogClose" @update="onStoryUpdate" @startBattle="(config, nodeId) => emit('startBattle', config, nodeId)" />
    <DungeonPanel v-if="currentPanel === 'dungeon'" @close="popPanel" @startBattle="emit('startBattle', $event)" @triggerStory="startStory" @openInventory="openInventory" @switchDungeon="showDungeonSelect = true" />




  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, inject, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import CharacterPanel from './CharacterPanel.vue'
import InventoryPanel from './InventoryPanel.vue'

import StockPanel from './StockPanel.vue'
import ForgePanel from './ForgePanel.vue'
import AdventurerGuild from './AdventurerGuild.vue'
import InnPanel from './InnPanel.vue'
import DevPanel from './DevPanel/DevPanel.vue'
import DungeonPanel from './DungeonPanel.vue'
import DialogPanel from './DialogPanel.vue'
import SkillPanel from './SkillPanel.vue'
import DungeonSelectPanel from './DungeonSelectPanel.vue'
import AffectionPanel from './AffectionPanel.vue'

const store = useGameStore()
const emit = defineEmits(['startBattle'])

const showToast = inject('showToast', (msg) => alert(msg))
const showConfirm = inject('showConfirm', async (msg) => { alert(msg); return true })

const appVersion = window.__APP_VERSION__ || '0.0.0'
const storyMode = ref(false)
const storyTimerDisplay = ref('00:00:00')
let storyTimerInterval = null
let versionClickCount = 0
let versionClickTimer = null

const showBgmPanel = ref(false)
const bgmFiles = ['AspiralMoon.mp3', 'Bamboo.mp3', 'CopyMemory.mp3']
const currentBgmIndex = ref(0)

const inventoryRefreshKey = ref(0)
const dialogRef = ref(null)
const currentPanel = ref(null)
const showDungeonSelect = ref(false)
const panelStack = ref([])
const isFullscreen = ref(false)
const inventorySellMode = ref(false)
function stopBgm() {
  const audio = document.querySelector('#game-root audio')
  if (audio) audio.pause()
  bgmPlaying.value = false
  showBgmPanel.value = false
  // 设置全局静音标记
  const bgmMuted = inject('bgmMuted', ref(false))
   bgmMuted.value = true
  sessionStorage.setItem('bgm_muted', '1')


}
function pauseBgm() {
  const a = document.querySelector('#game-root audio')
  if (a) a.pause()
}
function resumeBgm() {
  if (bgmMuted.value) return
  const a = document.querySelector('#game-root audio')
  if (a?.paused) a.play().catch(() => {})
}

function enterStoryModeDirect() {
  pauseBgm()
  storyMode.value = true
  store.isStoryMode = true

  // 如果 sessionStorage 中已有开始时间（刷新后恢复），使用它
  const savedStart = sessionStorage.getItem('story_start_time')
  if (savedStart) {
    store.startStoryTime = parseInt(savedStart)
  } else {
    store.startStoryTime = Date.now()
    sessionStorage.setItem('story_start_time', store.startStoryTime.toString())
  }

  // 立即计算并显示当前时间（不等 setInterval）
  const elapsed = Math.floor((Date.now() - store.startStoryTime) / 1000)
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  storyTimerDisplay.value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`

  if (storyTimerInterval) clearInterval(storyTimerInterval)
  storyTimerInterval = setInterval(() => {
    const e = Math.floor((Date.now() - store.startStoryTime) / 1000)
    const hh = Math.floor(e / 3600), mm = Math.floor((e % 3600) / 60), ss = e % 60
    storyTimerDisplay.value = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  }, 1000)
}

function enterStoryMode() {
  sessionStorage.setItem('story_mode_active', '1')
  sessionStorage.setItem('story_start_time', Date.now().toString())
  localStorage.removeItem('star-trails-save')
  location.reload()
}

function forceExitStoryMode() {
  sessionStorage.removeItem('story_mode_active')
  sessionStorage.removeItem('story_start_time')
  resumeBgm()
  storyMode.value = false
  store.isStoryMode = false
  if (storyTimerInterval) clearInterval(storyTimerInterval)
  storyTimerDisplay.value = '00:00:00'
}



function formatTime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function handleVersionClick() {
  versionClickCount++
  if (versionClickCount >= 5) {
    versionClickCount = 0
    if (storyMode.value) {
      forceExitStoryMode()
      showToast('已退出剧情模式')
    }
  }
  // 重置计数定时器
  if (versionClickTimer) clearTimeout(versionClickTimer)
  versionClickTimer = setTimeout(() => { versionClickCount = 0 }, 2000)
}

function enterFullscreen() {
  document.documentElement.requestFullscreen?.().catch(() => {})
}

function selectBgm(index) {
  const bgmMuted = inject('bgmMuted', ref(false))
 bgmMuted.value = false
  sessionStorage.removeItem('bgm_muted')
  const audioEl = document.querySelector('#game-root audio')
  if (audioEl) {
    audioEl.src = '/audio/' + bgmFiles[index]
    audioEl.play().catch(() => {})
    currentBgmIndex.value = index
    bgmPlaying.value = true
  }
}


function resumeRandomBgm() {
  const bgmMuted = inject('bgmMuted', ref(false))
  bgmMuted.value = false  // 恢复随机播放时取消静音
  const audioEl = document.querySelector('#game-root audio')
  if (audioEl) {
    const idx = Math.floor(Math.random() * bgmFiles.length)
    audioEl.src = '/audio/' + bgmFiles[idx]
    audioEl.play().catch(() => {})
    currentBgmIndex.value = idx
  }
}

function pushPanel(panelName) {
  if (currentPanel.value && currentPanel.value !== panelName) {
    panelStack.value.push(currentPanel.value)
  }
  currentPanel.value = panelName
}

function popPanel() {
  
  if (panelStack.value.length > 0) {
    currentPanel.value = panelStack.value.pop()
  } else {
    currentPanel.value = null
  }
}

function openSellBackpack() {
  inventorySellMode.value = true
  pushPanel('inventory')
}

function onCloseInventory() {
  inventorySellMode.value = false
  popPanel()
}

function openInventory() {
  panelStack.value = []
  currentPanel.value = 'inventory'
  inventoryRefreshKey.value++
}

function onDialogClose() { }
function onStoryUpdate(data) { console.log('剧情选择:', data) }

function triggerDialog() {
  if (dialogRef.value && typeof dialogRef.value.startScene === 'function') {
    dialogRef.value.startScene('start')
  } else {
    console.warn('DialogPanel 尚未就绪')
  }
}

function startStory(storyId) {
  currentPanel.value = null
  panelStack.value = []
  store.pendingDungeonPanel = true
  dialogRef.value.startScene(storyId)
}

function onDungeonSelected(dungeonId) {
  showDungeonSelect.value = false
  pushPanel('dungeon')
}

function openPanel(name) {
  if (name === 'inventory') {
    panelStack.value = []
    currentPanel.value = 'inventory'
    inventoryRefreshKey.value++
    return
  }
  if (name === 'dungeon') {
    const lastId = store.dungeon.lastDungeonId
    if (lastId && store.startDungeon(lastId)) {
      pushPanel('dungeon')
      return
    }
    const firstId = Object.keys(store.config.dungeonConfigs)[0]
    if (firstId && store.startDungeon(firstId)) {
      pushPanel('dungeon')
      return
    }
    showDungeonSelect.value = true
    return
  }
  pushPanel(name)
}

// 天气/日期
const weekNames = ['月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜']
const seasonNames = ['春', '夏', '秋', '冬']
const weatherPool = ['晴', '晴', '阴', '雨', '雪', '大风']
const dateInfo = computed(() => {
  const day = store.world.day
  const year = Math.floor((day - 1) / 120) + 1
  const seasonIndex = Math.floor((day - 1) / 30) % 4
  const dayOfSeason = ((day - 1) % 30) + 1
  const week = weekNames[(day - 1) % 7]
  return { year, season: seasonNames[seasonIndex], day: dayOfSeason, week }
})
const weather = computed(() => weatherPool[(store.world.day * 7 + Math.floor(store.world.gameTime / 60)) % weatherPool.length])
const dateStr = computed(() => `${dateInfo.value.year}年 ${dateInfo.value.season}${dateInfo.value.day}日 ${dateInfo.value.week}`)
const timeStr = computed(() => {
  const h = Math.floor(store.world.gameTime / 60)
  const m = store.world.gameTime % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
})

onMounted(() => {
   // 刷新后恢复剧情模式
// 刷新后恢复剧情模式
  if (sessionStorage.getItem('story_mode_active') === '1') {
    const savedStart = sessionStorage.getItem('story_start_time')
    if (savedStart) {
      store.startStoryTime = parseInt(savedStart)
    }
    enterStoryModeDirect()
    return
  }
  if (localStorage.getItem('start_story_mode') === '1') {
    localStorage.removeItem('start_story_mode')
    setTimeout(() => enterStoryModeDirect(), 200)
    return
  }
  if (store.pendingDungeonPanel) {
    store.pendingDungeonPanel = false
    pushPanel('dungeon')
  }
  document.addEventListener('fullscreenchange', () => isFullscreen.value = !!document.fullscreenElement)
  document.addEventListener('webkitfullscreenchange', () => isFullscreen.value = !!document.fullscreenElement)
})

watch(() => storyMode.value, (newVal, oldVal) => {
  if (newVal === false && oldVal === true && !store.storyEndTime) {
    // 非正常退出（不是通关），强制恢复
    storyMode.value = true
  }
})

watch(() => store.storyEndTime, async (val) => {
  if (!val || !storyMode.value) return
  const elapsed = Math.floor((val - store.startStoryTime) / 1000)
  const best = store.storyBestTime
  if (!best || elapsed < best) store.storyBestTime = elapsed
  const summary = [
    `通关时间：${formatTime(elapsed)}`,
    (best && elapsed >= best) ? '' : '新纪录！',
    `等级：Lv.${store.player.level}`,
    `层数：${store.dungeon.floorsCleared}`,
    `Boss：${Math.floor(store.dungeon.floorsCleared / 5)}`
  ].filter(Boolean).join('\n')
  store.storyEndTime = null
  await showConfirm(summary)
  exitStoryMode()
})
</script>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }

.main-screen {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', cursive;
  overflow: hidden;
  background: linear-gradient(180deg, #e8f0fe 0%, #ffffff 100%);
  color: #1e293b;
}

/* ========== 状态栏（加高） ========== */
.status-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  font-size: 10px;
  flex-shrink: 0;
}
.status-item { display: flex; align-items: center; gap: 6px; }
.story-timer { color: #e0678a; font-size: 11px; }
.version-text { font-size: 7px; color: rgba(0,0,0,0.2); cursor: default; user-select: none; }
.bgm-btn { cursor: pointer; color: #666; }

/* ========== 全屏内容区 ========== */
.fullscreen-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 50px;
}

/* ========== 标题 ========== */
.title-section { text-align: center; }
.game-title { font-size: 32px; color: #1e293b; letter-spacing: 6px; margin-bottom: 10px; }
.game-subtitle { font-size: 10px; color: #64748b; }

/* ========== 三个核心入口 ========== */
.main-entrance {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.entrance-card {
  width: 240px;
  padding: 36px 24px;
  border-radius: 28px;
  border: 2px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.9);
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  backdrop-filter: blur(8px);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  transition: all 0.3s ease;
}
.entrance-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 36px rgba(0,0,0,0.1);
}
.entrance-icon { font-size: 56px; }
.entrance-text { text-align: center; display: flex; flex-direction: column; gap: 8px; }
.entrance-title { font-size: 15px; letter-spacing: 3px; color: #1e293b; }
.entrance-desc { font-size: 8px; color: #94a3b8; }

.dungeon .entrance-icon { color: #ef4444; }
.dungeon:hover { border-color: #ef4444; }
.story .entrance-icon { color: #3b82f6; }
.story:hover { border-color: #3b82f6; }
.dialog .entrance-icon { color: #8b5cf6; }
.dialog:hover { border-color: #8b5cf6; }

/* ========== 底部工具栏（放大） ========== */
.bottom-toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 16px 28px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  border-radius: 24px;
  border: 1px solid rgba(0,0,0,0.05);
}

.icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 18px;
  border-radius: 18px;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.8);
  color: #475569;
  font-size: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Press Start 2P', cursive;
}
.icon-btn :first-child { font-size: 28px; }
.icon-btn:hover {
  background: #fff;
  color: #1e293b;
  border-color: #ffd700;
  transform: translateY(-3px);
}

/* BGM 面板（不变） */
.bgm-panel {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; justify-content: center; align-items: center;
  z-index: 500;
}
.bgm-list {
  background: #fff;
  border: 2px solid #ffd700;
  border-radius: 16px;
  padding: 20px;
  min-width: 250px;
  text-align: center;
  color: #1e293b;
}
.bgm-list h3 { margin-bottom: 15px; font-size: 12px; color: #1e293b; }
.bgm-list button { display: block; width: 100%; margin: 5px 0; }
.bgm-list button.active { background: rgba(255,215,0,0.2); border-color: #ffd700; }


/* ========== 全屏内容区（压缩版） ========== */
.fullscreen-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  gap: 16px;
  overflow-y: auto;
}

/* ========== 标题（缩小） ========== */
.title-section { text-align: center; }
.game-title {
  font-size: 20px;
  letter-spacing: 4px;
  margin-bottom: 4px;
}
.game-subtitle { font-size: 7px; }

/* ========== 三个核心入口（缩小） ========== */
.main-entrance {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  flex-shrink: 0;
}

.entrance-card {
  width: 160px;
  padding: 16px 12px;
  border-radius: 16px;
  gap: 8px;
}
.entrance-icon { font-size: 32px; }
.entrance-title { font-size: 10px; letter-spacing: 2px; }
.entrance-desc { font-size: 6px; }

/* ========== 底部工具栏（缩小 + 固定不溢出） ========== */
.bottom-toolbar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 8px 16px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.05);
  flex-shrink: 0;
  max-width: 100%;
}

.icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 6px;
}
.icon-btn :first-child { font-size: 18px; }

/* ========== 状态栏（缩小） ========== */
.status-bar {
  padding: 6px 16px;
  font-size: 7px;
}
</style>