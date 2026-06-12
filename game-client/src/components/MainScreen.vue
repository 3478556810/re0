
<template>
  <div class="main-screen">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <span class="status-item">Lv.{{ store.player.level }}</span>
      <span class="status-item">{{ store.player.gold }}G</span>
      <span class="status-item">HP {{ store.player.hp }}/{{ store.player.maxHp }}</span>
      <span class="status-item" v-if="storyMode">{{ storyTimerDisplay }}</span>
      <span class="status-item">{{ weather }}</span>
      <span class="version-text" @click="handleVersionClick">v{{ appVersion }}</span>
    </div>

   <!-- 右上角七字形功能区 -->
<div class="corner-layout">
  <!-- 水平行：6个独立按钮 -->
  <div class="corner-top-row">
 
    <button v-if="!storyMode" class="corner-btn" @click="enterStoryMode">
      <Icon icon="mdi:timer" /><span>速通</span>
    </button>
    <button class="corner-btn" @click="openPanel('character')">
      <Icon icon="mdi:account" /><span>角色</span>
    </button>
    <button class="corner-btn" @click="openPanel('profession')">
  <Icon icon="mdi:shield-account" /><span>职业</span>
</button>
    <button class="corner-btn" @click="openPanel('skills')">
      <Icon icon="mdi:star-four-points" /><span>技能</span>
    </button>
    <button class="corner-btn" @click="openPanel('inventory')">
      <Icon icon="mdi:bag-personal" /><span>背包</span>
    </button>
    <button class="corner-btn" @click="openPanel('forge')">
      <Icon icon="mdi:anvil" /><span>锻造</span>
    </button>
       <button class="corner-btn" @click="openPanel('guild')">
      <Icon icon="mdi:town-hall" /><span>协会</span>
    </button>
    <!-- 放在 corner-top-row 最后或 corner-vert-col 合适位置 -->
<button class="corner-btn" @click="openPanel('market')">
  <Icon icon="mdi:store" /><span>交易行</span>
</button>
 <button class="corner-btn" @click="openPanel('companion')">
  <Icon icon="mdi:account-group" /><span>伙伴</span>
</button>
  </div>

  <!-- 竖列：4个独立按钮 -->
  <div class="corner-vert-col">

<button class="corner-btn" @click="enterTower">
  <Icon icon="tabler:tower" /><span>无限塔</span>
</button>
       <button class="corner-btn" @click="triggerDialog">
      <Icon icon="mdi:chat" /><span>剧情</span>
    </button>
    <button class="corner-btn" @click="openPanel('affection')">
      <Icon icon="mdi:heart" /><span>羁绊</span>
    </button>
    <button v-if="!isFullscreen" class="corner-btn" @click="enterFullscreen">
      <Icon icon="mdi:fullscreen" /><span>全屏</span>
    </button>
    <button v-if="!storyMode" class="corner-btn dev-btn" @click="openPanel('dev')">
      <Icon icon="mdi:cog" /><span>开发</span>
    </button>
  </div>
</div>

    <!-- 中央核心入口（地下城） -->
    <div class="center-entrance">
      <button class="main-btn dungeon" @click="openPanel('dungeon')">
        <Icon icon="mdi:castle" class="main-btn-icon" />
        <span class="main-btn-title">地下城</span>
      </button>

  <!-- ✅ 新增：副本入口 -->
  <button class="main-btn raid" @click="openPanel('raid')">
    <Icon icon="mdi:skull-crossbones" class="main-btn-icon" />
    <span class="main-btn-title">副本</span>
  </button>


    </div>
<CompanionPanel v-if="currentPanel === 'companion'" @close="popPanel" />
<ProfessionPanel v-if="currentPanel === 'profession'" @close="popPanel" />
    <!-- 面板组件（保持不变） -->
    <!-- 面板组件 -->
<!-- 放到其他面板的末尾（比如和 CompanionPanel、ProfessionPanel 同级） -->
<MatchRoomPanel
  v-if="showMatchRoom"
  :boss-id="selectedBossId"
  :boss-name="selectedBossName"
  @close="showMatchRoom = false"
/>
    <MarketPanel v-if="currentPanel === 'market'" @close="popPanel" />
<RaidPanel
  v-if="currentPanel === 'raid'"
  @close="popPanel"
  @startBattle="emit('startBattle', $event)"
  @openMatchRoom="onOpenMatchRoom"
/>
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, inject, nextTick,reactive } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import CharacterPanel from './CharacterPanel.vue'
import InventoryPanel from './Inventory/InventoryPanel.vue'
import StockPanel from './StockPanel.vue'
import ForgePanel from './ForgePanel//ForgePanel.vue'
import AdventurerGuild from './AdventurerGuild.vue'
import DevPanel from './DevPanel/DevPanel.vue'
import DungeonPanel from './DungeonPanel.vue'
import DialogPanel from './DialogPanel.vue'
import SkillPanel from './SkillPanel.vue'
import DungeonSelectPanel from './DungeonSelectPanel.vue'
import AffectionPanel from './AffectionPanel.vue'
import RaidPanel from './RaidPanel.vue'
import CompanionPanel from './CompanionPanel/CompanionPanel.vue'
import ProfessionPanel from './class/ClassPanel.vue'
import MarketPanel from './MarketPanel.vue'
import { generateTowerMonsters } from '@/config/towerGenerator'
import MatchRoomPanel from './MatchRoomPanel.vue'
// 速通战斗记录
const speedrunStats = reactive({
  maxDamage: 0,
  maxCrit: 0,
  maxTrueDmg: 0,
  totalDamage: 0
})
function recordDamage(damage, isCrit, trueDmg) {
  if (!store.isStoryMode) return
  speedrunStats.totalDamage += damage
  if (damage > speedrunStats.maxDamage) speedrunStats.maxDamage = damage
  if (isCrit && damage > speedrunStats.maxCrit) speedrunStats.maxCrit = damage
  if (trueDmg > speedrunStats.maxTrueDmg) speedrunStats.maxTrueDmg = trueDmg
}

// 在 enterStoryModeDirect 开头或合适位置重置
function resetSpeedrunStats() {
  speedrunStats.maxDamage = 0
  speedrunStats.maxCrit = 0
  speedrunStats.maxTrueDmg = 0
  speedrunStats.totalDamage = 0
}
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

const inventoryRefreshKey = ref(0)
const dialogRef = ref(null)
const currentPanel = ref(null)
const showDungeonSelect = ref(false)
const panelStack = ref([])
const isFullscreen = ref(false)
const inventorySellMode = ref(false)
const showMatchRoom = ref(false)
const selectedBossId = ref('')
const selectedBossName = ref('')
const forceExit = ref(false) // 强制退出标记
function enterTower() {
  store.towerMode = true      // 必须设置
  store.towerFloor = 1        // 必须设置
  const monsters = generateTowerMonsters(1, store)
  emit('startBattle', monsters)
}



function onOpenMatchRoom(bossId) {
  // 根据副本面板传递的 bossId，获取 boss 名称
  const bossList = [
    { id: 'raid_gladiator', name: '角斗士·血斧' },
    { id: 'raid_lava_core', name: '炎核·熔岩巨像' },
    { id: 'raid_bishop', name: '永夜主教' }
  ]
  const boss = bossList.find(b => b.id === bossId)
  if (boss) {
    selectedBossId.value = bossId
    selectedBossName.value = boss.name
  }
  showMatchRoom.value = true
}
// ========== 速通模式 ==========
function enterStoryMode() {
  sessionStorage.removeItem('story_raid_clears')
  sessionStorage.setItem('story_mode_active', '1')
  sessionStorage.setItem('story_start_time', Date.now().toString())
  localStorage.removeItem('star-trails-save')
  location.reload()
}

function enterStoryModeDirect(clearProgress = false) {
resetSpeedrunStats()

  if (clearProgress) {
    sessionStorage.removeItem('story_raid_clears')
  }
  store.storyEndTime = null    // ✅ 始终重置，保证每次进入速通都能触发通关

  storyMode.value = true
  store.isStoryMode = true

  const savedStart = sessionStorage.getItem('story_start_time')
  if (savedStart) {
    store.startStoryTime = parseInt(savedStart)
  } else {
    store.startStoryTime = Date.now()
    sessionStorage.setItem('story_start_time', store.startStoryTime.toString())
  }

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

function forceExitStoryMode() {
  sessionStorage.removeItem('story_mode_active')
  sessionStorage.removeItem('story_start_time')
  store.isStoryMode = false
  storyMode.value = false
  if (storyTimerInterval) clearInterval(storyTimerInterval)
  storyTimerDisplay.value = '00:00:00'
  store.storyEndTime = null
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
      forceExit.value = true
      store.storyEndTime = Date.now() // 触发 watch，但会被跳过结算
    }
  }
  if (versionClickTimer) clearTimeout(versionClickTimer)
  versionClickTimer = setTimeout(() => { versionClickCount = 0 }, 2000)
}

function enterFullscreen() {
  document.documentElement.requestFullscreen?.().catch(() => {})
}

// ========== 面板管理 ==========
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

// ========== 生命周期 ==========
onMounted(() => {

window.recordDamage = recordDamage

  // 刷新后恢复剧情模式
if (sessionStorage.getItem('story_mode_active') === '1') {
  const savedStart = sessionStorage.getItem('story_start_time')
  if (savedStart) store.startStoryTime = parseInt(savedStart)
  enterStoryModeDirect()  // 不传参数，只重置 storyEndTime，不清除进度
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

// 阻止非正常退出速通模式
watch(() => storyMode.value, (newVal, oldVal) => {
  if (newVal === false && oldVal === true && store.isStoryMode) {
    storyMode.value = true
  }
})

// 速通通关或强制退出
watch(() => store.storyEndTime, async (val) => {
  if (!val || !storyMode.value) return

  // 强制退出（点版本号）
  if (forceExit.value) {
    forceExit.value = false
    store.storyEndTime = null
    forceExitStoryMode()
    showToast('已退出速通模式')
    return
  }

  // 正常通关结算
  const elapsed = Math.floor((val - store.startStoryTime) / 1000)
  const best = store.storyBestTime
  if (!best || elapsed < best) store.storyBestTime = elapsed
const summary = [
  `最高伤害：${speedrunStats.maxDamage}`,
  `最大暴击：${speedrunStats.maxCrit}`,
  `最高真伤：${speedrunStats.maxTrueDmg}`,
  `总伤害：${speedrunStats.totalDamage}`,
  `通关时间：${formatTime(elapsed)}`,
  (best && elapsed >= best) ? '' : '新纪录！'
].filter(Boolean).join('\n')
  store.storyEndTime = null
  await showConfirm(summary)
  forceExitStoryMode()
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

/* ========== 顶部状态栏 ========== */
.status-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 16px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  font-size: 9px;
  flex-shrink: 0;
}
.status-item { display: flex; align-items: center; gap: 4px; }
.version-text {
  font-size: 7px;
  color: rgba(0,0,0,0.2);
  cursor: pointer;
  user-select: none;
  position: relative;
  z-index: 60; /* 确保在所有元素之上 */
  padding: 4px 8px; /* 增大点击区域 */
}
/* ========== 中央核心入口 ========== */
.center-entrance {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.main-btn {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  border: 2px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.9);
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  backdrop-filter: blur(8px);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s ease;
   position: relative;   /* ← 新增 */
  z-index: 60;          /* ← 新增 */
}
.main-btn:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.1); }
.main-btn:active { transform: translateY(0); }

.main-btn-icon { font-size: 48px; }
.main-btn-title { font-size: 12px; letter-spacing: 3px; }

.dungeon .main-btn-icon { color: #ef4444; }
.dungeon:hover { border-color: #ef4444; }
.speedrun .main-btn-icon { color: #3b82f6; }
.speedrun:hover { border-color: #3b82f6; }
.speedrun.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }

/* ========== 底部导航栏 ========== */
.bottom-nav {
  display: flex;
  gap: 4px;
  justify-content: center;
  padding: 10px 16px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(0,0,0,0.05);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: #475569;
  font-size: 7px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Press Start 2P', cursive;
}
.nav-item :first-child { font-size: 24px; }
.nav-item:hover {
  background: #fff;
  color: #1e293b;
  border-color: #ffd700;
  transform: translateY(-2px);
}
.dev-btn { opacity: 0.4; }
.dev-btn:hover { opacity: 1; }

/* ========== 手机横屏适配 ========== */
@media (max-width: 700px) {
  .main-btn { width: 120px; height: 120px; position: relative;   /* ← 新增 */
  z-index: 60;          /* ← 新增 */ }
  .main-btn-icon { font-size: 36px; }
  .main-btn-title { font-size: 10px; }
  .nav-item { padding: 6px 8px; font-size: 6px; }
  .nav-item :first-child { font-size: 20px; }
}


/* ========== 右上角菜单 ========== */
.corner-menu {
  position: absolute;
  top: 60px;
  right: 20px;
  z-index: 100;
  font-family: 'Press Start 2P', cursive;
}

.menu-summary {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  list-style: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: all 0.2s;
}
.menu-summary::-webkit-details-marker {
  display: none;
}
.menu-summary:hover {
  background: #fff;
  transform: scale(1.05);
}
.menu-icon {
  font-size: 24px;
  color: #475569;
}

.menu-dropdown {
  position: absolute;
  top: 56px;
  right: 0;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.1);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 8px;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}
.menu-item:hover {
  background: rgba(0,0,0,0.05);
}
.menu-item :first-child {
  font-size: 18px;
  color: #3b82f6;
}

/* 右上角七字形布局 */
.corner-layout {
  position: absolute;
  top: 60px;
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  z-index: 50;
}

/* 水平行：只负责排列，不添加背景 */
.corner-top-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* 竖列：只负责排列，不添加背景 */
.corner-vert-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 单个按钮：独立方块样式 */
.corner-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 45px;
  height: 45px;
  padding: 8px 4px;
  border-radius: 12px;
  border: 2px solid rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.9);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  backdrop-filter: blur(8px);
  color: #475569;
  font-size: 7px;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.corner-btn:hover {
  background: #fff;
  border-color: #ffd700;
  color: #1e293b;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
}
.corner-btn :first-child {
  font-size: 22px;
}
.dev-btn {
  opacity: 0.5;
}
.dev-btn:hover {
  opacity: 1;
}

/* 调整中央入口，避免被遮挡 */
.center-entrance {
  margin-right: 120px;
}

.raid .main-btn-icon { color: #ff4444; }
.raid:hover { border-color: #ff4444; }
</style>