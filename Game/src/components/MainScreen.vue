<template>
  <div class="main-screen">
    <!-- 状态栏（增高） -->
    <div class="status-bar">
      <span class="status-item">Lv.{{ store.player.level }}</span>
      <span class="status-item">{{ store.player.gold }}G</span>
      <span class="status-item">{{ store.player.hp }}/{{ store.player.maxHp }}</span>
      <span v-if="storyMode" class="story-timer">{{ storyTimerDisplay }}</span>
      <span class="status-item bgm-btn" @click="showBgmPanel = !showBgmPanel">
        <Icon icon="mdi:music" />
      </span>
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
        <button class="icon-btn" @click="openPanel('affection')">
          <Icon icon="mdi:heart" /><span>羁绊</span>
        </button>
        <button v-if="!isFullscreen" class="icon-btn" @click="enterFullscreen">
          <Icon icon="mdi:fullscreen" /><span>全屏</span>
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
    <DialogPanel ref="dialogRef" @close="onDialogClose" @update="onStoryUpdate" @startBattle="(config, nodeId) => emit('startBattle', config, nodeId)" />
    <DungeonPanel v-if="currentPanel === 'dungeon'" @close="popPanel" @startBattle="emit('startBattle', $event)" @triggerStory="startStory" @openInventory="openInventory" @switchDungeon="showDungeonSelect = true" />

    <!-- BGM -->
    <div v-if="showBgmPanel" class="bgm-panel" @click.self="showBgmPanel = false">
      <div class="bgm-list">
        <h3>音乐选择</h3>
        <button v-for="(name, idx) in bgmFiles" :key="idx" class="pixel-btn small" :class="{ active: idx === currentBgmIndex }" @click="selectBgm(idx)">{{ name.replace('.mp3', '') }}</button>
        <button class="pixel-btn small" @click="resumeRandomBgm">随机播放</button>
        <button class="pixel-btn small" @click="showBgmPanel = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, inject, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import CharacterPanel from './CharacterPanel.vue'
import InventoryPanel from './InventoryPanel.vue'
import BankPanel from './BankPanel.vue'
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

const store = useGameStore()   // ← 必须放在最前面，所有使用 store 的代码之前
const emit = defineEmits(['startBattle'])

const showToast = inject('showToast', (msg) => alert(msg))
const showConfirm = inject('showConfirm', async (msg) => {
  showToast(msg + ' (需要确认)')
  return false
})
const appVersion = window.__APP_VERSION__ || '0.0.0'
const storyMode = ref(false)
const showDevButton = ref(false)
const storyTimerDisplay = ref('00:00:00')
let storyTimerInterval = null
let versionClickTimer = null
let versionClickCount = 0

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
const previousPanel = ref(null)

function pauseBgm() {
  const audio = document.querySelector('#game-root audio')
  if (audio) audio.pause()
}

function resumeBgm() {
  const audio = document.querySelector('#game-root audio')
  if (audio && audio.paused) {
    audio.play().catch(() => {})
  }
}
function enterStoryMode() {
  pauseBgm()
  
  showDevButton.value = false
  storyMode.value = true
  store.isStoryMode = true
  store.startStoryTime = Date.now()
  
  // 直接开始计时
  storyTimerDisplay.value = '00:00:00'
  const start = store.startStoryTime
  if (storyTimerInterval) clearInterval(storyTimerInterval)
  storyTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - start) / 1000)
    const h = Math.floor(elapsed / 3600)
    const m = Math.floor((elapsed % 3600) / 60)
    const s = elapsed % 60
    storyTimerDisplay.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, 1000)
  
  // 不再强制触发剧情，玩家自己选
}

function exitStoryMode() {
  resumeBgm()
  storyMode.value = false
  showDevButton.value = false          // 不要恢复 showDevButton，保持隐藏
  // 如果用户通过点击版本号退出，才恢复开发者按钮。因此这里不改变 showDevButton
  store.isStoryMode = false
  if (storyTimerInterval) clearInterval(storyTimerInterval)
  storyTimerDisplay.value = '00:00:00'
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function selectBgm(index) {
  const audioEl = document.querySelector('#game-root audio')
  if (audioEl) {
    audioEl.src = '/audio/' + bgmFiles[index]
    audioEl.play().catch(() => {})
    currentBgmIndex.value = index
  }
}

function resumeRandomBgm() {
  const audioEl = document.querySelector('#game-root audio')
  if (audioEl) {
    const idx = Math.floor(Math.random() * bgmFiles.length)
    audioEl.src = '/audio/' + bgmFiles[idx]
    audioEl.play().catch(() => {})
    currentBgmIndex.value = idx
  }
}

function handleVersionClick() {
  versionClickCount++
  if (versionClickTimer) clearTimeout(versionClickTimer)
  if (versionClickCount >= 5) {
    versionClickCount = 0
    showDevButton.value = true         // 只有这里才恢复
    localStorage.setItem('dev_mode', '1')
    if (storyMode.value) {
      storyMode.value = false
      store.isStoryMode = false
    }
    showToast('已恢复开发者面板')
  } else {
    versionClickTimer = setTimeout(() => { versionClickCount = 0 }, 4000)
  }
}

function enterFullscreen() {
  document.documentElement.requestFullscreen?.().catch(() => {})
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
  previousPanel.value = currentPanel.value
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

function handleAction(action) { if (action.type === 'panel') openPanel(action.id) }

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
    const firstDungeonId = Object.keys(store.config.dungeonConfigs)[0]
    if (firstDungeonId && store.startDungeon(firstDungeonId)) {
      pushPanel('dungeon')
      return
    }
    showDungeonSelect.value = true
    return
  }
  pushPanel(name)
}

// ========== 天气/日期 ==========
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

const sceneTitle = computed(() => '城镇')
const sceneDesc = computed(() => '你身处热闹的城镇，地下城入口就在附近。')

const availableActions = computed(() => [
  { id: 'inn', name: '旅馆休息', icon: 'mdi:bed', type: 'panel' },
  { id: 'guild', name: '冒险者协会', icon: 'mdi:town-hall', type: 'panel' },
  { id: 'bank', name: '银行', icon: 'mdi:bank', type: 'panel' },
  { id: 'stock', name: '股市', icon: 'mdi:chart-line', type: 'panel' },
  { id: 'forge', name: '铁匠铺', icon: 'mdi:anvil', type: 'panel' },
  { id: 'dungeon', name: '地下城', icon: 'mdi:castle', type: 'panel' }
])

const SimplePanel = {
  props: { title: String, icon: String },
  template: `<div class="overlay" @click.self="$emit('close')"><div class="panel pixel-panel" @click.stop><h3><Icon :icon="icon" /> {{ title }}</h3><slot /><button class="pixel-btn" @click="$emit('close')">关闭</button></div></div>`,
  components: { Icon }
}

// ========== Watchers ==========
watch(() => storyMode.value, (val) => {
  if (val) {
    const start = store.startStoryTime
    storyTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000)
      const h = Math.floor(elapsed / 3600)
      const m = Math.floor((elapsed % 3600) / 60)
      const s = elapsed % 60
      storyTimerDisplay.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }, 1000)
  } else {
    if (storyTimerInterval) clearInterval(storyTimerInterval)
    storyTimerDisplay.value = '00:00:00'
  }
})

watch(() => store.storyEndTime, async (val) => {
  if (!val || !storyMode.value) return

  const elapsed = Math.floor((val - store.startStoryTime) / 1000)
  const best = store.storyBestTime
  const isNewRecord = !best || elapsed < best

  if (isNewRecord) {
    store.storyBestTime = elapsed
  }

  const playerLv = store.player.level
  const floorsCleared = store.dungeon.floorsCleared || 0
  const bossKills = Math.floor(floorsCleared / 5)

  const summary = [
    `通关时间：${formatTime(elapsed)}`,
    isNewRecord ? '新纪录！' : '',
    `等级：Lv.${playerLv}`,
    `到达层数：${floorsCleared}`,
    `击败Boss：${bossKills}`,
  ].filter(Boolean).join('\n')

  store.storyEndTime = null

  await showConfirm(summary )
  exitStoryMode()
})

watch(() => store.pendingStoryNodeAfterBattle, (nodeId) => {
  if (nodeId && store.config.storyScript[nodeId]) {
    currentPanel.value = null
    panelStack.value = []
    nextTick(() => {
      dialogRef.value?.startScene(nodeId)
      store.pendingStoryNodeAfterBattle = null
    })
  } else if (nodeId && !store.config.storyScript[nodeId]) {
    store.pendingStoryNodeAfterBattle = null
  }
}, { immediate: true })

// ========== 生命周期 ==========
onMounted(() => {

  // 如果处于剧情模式，强制隐藏
  if (store.isStoryMode) {
    storyMode.value = true
    showDevButton.value = false
  } else {
    showDevButton.value = localStorage.getItem('dev_mode') === '1'
  }
  
  if (store.pendingDungeonPanel) {
    store.pendingDungeonPanel = false
    pushPanel('dungeon')
  }
  const syncFullscreen = () => {
    isFullscreen.value = !!document.fullscreenElement
  }
  document.addEventListener('fullscreenchange', syncFullscreen)
  document.addEventListener('webkitfullscreenchange', syncFullscreen)
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
</style>