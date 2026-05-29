<template>
  <div class="main-screen">
    <div class="status-bar">
      <span class="status-item"><Icon icon="mdi:cash-multiple" /> {{ store.player.gold }}G</span>
      <span class="status-item"><Icon icon="mdi:heart" /> {{ store.player.hp }}/{{ store.player.maxHp }}</span>
      <span class="status-item"><Icon icon="mdi:weather-partly-cloudy" /> {{ weather }}</span>
      <span class="status-item"><Icon icon="mdi:calendar-range" /> {{ dateStr }}</span>
      <span class="status-item"><Icon icon="mdi:clock-outline" /> {{ timeStr }}</span>
    </div>

    <div class="content-wrapper">
      <div class="main-card">
        <div class="scene-section">
          <h2 class="scene-title">{{ sceneTitle }}</h2>
          <p class="scene-desc">{{ sceneDesc }}</p>
        </div>
        <div class="core-menu">
          <button class="pixel-btn" @click="openPanel('character')"><Icon icon="mdi:account" /> 角色</button>
          <button class="pixel-btn" @click="openPanel('inventory')"><Icon icon="mdi:bag-personal" /> 背包</button>
          <button class="pixel-btn" @click="openPanel('party')"><Icon icon="mdi:account-group" /> 伙伴</button>
          <button class="pixel-btn" @click="openPanel('pet')"><Icon icon="mdi:paw" /> 宠物</button>
          <button class="pixel-btn dev-btn" @click="openPanel('dev')"><Icon icon="mdi:cog" /> 开发者</button>
        </div>
        <div class="action-buttons">
          <button v-for="action in availableActions" :key="action.id" class="pixel-btn action-btn" @click="handleAction(action)"><Icon :icon="action.icon" /> {{ action.name }}</button>
          <button class="pixel-btn action-btn" @click="triggerDialog"><Icon icon="mdi:chat" /> 探索剧情</button>
        </div>
      </div>
    </div>

    <DevPanel v-if="currentPanel === 'dev'" @close="currentPanel = null" />
    <CharacterPanel v-if="currentPanel === 'character'" @close="currentPanel = null" />
<InventoryPanel
  v-if="currentPanel === 'inventory'"
  :key="'inv-' + inventoryRefreshKey"
  :sellMode="inventorySellMode"
  @close="currentPanel = null; inventorySellMode = false"
/>
    <SimplePanel v-if="currentPanel === 'party'" title="伙伴" icon="mdi:account-group" @close="currentPanel = null"><p class="text-sm text-center py-8">伙伴系统即将上线，敬请期待！</p></SimplePanel>
    <SimplePanel v-if="currentPanel === 'pet'" title="宠物" icon="mdi:paw" @close="currentPanel = null"><p class="text-sm text-center py-8">宠物系统开发中，很快就能见面啦！</p></SimplePanel>
    <BankPanel v-if="currentPanel === 'bank'" @close="currentPanel = null" />
    <StockPanel v-if="currentPanel === 'stock'" @close="currentPanel = null" />
    <ForgePanel v-if="currentPanel === 'forge'" @close="currentPanel = null" />
   <AdventurerGuild
  v-if="currentPanel === 'guild'"
  @close="currentPanel = null"
  @open-backpack="openSellBackpack"
/>
<InventoryPanel
  v-if="currentPanel === 'inventory'"
  :key="'inv-' + inventoryRefreshKey"
  :sellMode="inventorySellMode"
  @close="onCloseInventory"
/>
    <InnPanel v-if="currentPanel === 'inn'" @close="currentPanel = null" />
    <DialogPanel ref="dialogRef" @close="onDialogClose" @update="onStoryUpdate" />
   <DungeonPanel
  v-if="currentPanel === 'dungeon'"
  @close="currentPanel = null"
  @startBattle="emit('startBattle', $event)"
  @triggerStory="startStory"
  @openInventory="openInventory"
/>
  </div>
</template>

<script setup>
import { ref, computed, watch,onMounted } from 'vue'
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
const inventoryRefreshKey = ref(0)
const dialogRef = ref(null)
const store = useGameStore()
const emit = defineEmits(['startBattle'])
const currentPanel = ref(null)


const inventorySellMode = ref(false)
const previousPanel = ref(null)

function openSellBackpack() {
  inventorySellMode.value = true
  previousPanel.value = currentPanel.value   // 记录当前面板（如 guild）
  currentPanel.value = 'inventory'
}

function onCloseInventory() {
  inventorySellMode.value = false
  currentPanel.value = previousPanel.value || null   // 返回协会
  previousPanel.value = null
}
// 删除原来的 onDialogClose 函数，替换为：
function onDialogClose() {
  
}

// 添加一个方法用来打开背包
function openInventory() {
  currentPanel.value = 'inventory'
}

onMounted(() => {
  if (store.pendingDungeonPanel) {
    store.pendingDungeonPanel = false
    currentPanel.value = 'dungeon'
  }
})
function onStoryUpdate(data) { console.log('剧情选择:', data) }
function triggerDialog() { dialogRef.value.startScene('start') }

function startStory(storyId) {
  currentPanel.value = null
  store.pendingDungeonPanel = true
  dialogRef.value.startScene(storyId)
}

const SimplePanel = {
  props: { title: String, icon: String },
  template: `<div class="overlay" @click.self="$emit('close')"><div class="panel pixel-panel" @click.stop><h3><Icon :icon="icon" /> {{ title }}</h3><slot /><button class="pixel-btn" @click="$emit('close')">关闭</button></div></div>`,
  components: { Icon }
}

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

function openPanel(name) {
    if (name === 'inventory') {
    inventoryRefreshKey.value++   // 每次打开背包，key 变化，组件重新渲染
  }
  if (name === 'dungeon') {
    if (!store.startDungeon('forest_depths')) { alert('地下城冷却中，明天再来吧！'); return }
  }
  currentPanel.value = name
}

function handleAction(action) { if (action.type === 'panel') openPanel(action.id) }
</script>



<style scoped>
  .dev-btn {
    background: rgba(255, 105, 180, 0.15);
    border-color: #ff6b9d;
  }
  .dev-btn:hover {
    background: rgba(255, 105, 180, 0.3);
  }
  .main-screen {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #fef0f4 0%, #fde2e8 100%);
    font-family: 'Press Start 2P', cursive;
    color: #4a3a5a;
    overflow: hidden;
  }
  .status-bar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-wrap: wrap;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(15px);
    border-bottom: 1px solid rgba(245, 160, 180, 0.35);
    font-size: 9px;
    flex-shrink: 0;
    gap: 10px;
  }
  .status-item {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #5e4a5a;
    white-space: nowrap;
  }
  .content-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .main-card {
    width: 100%;
    max-width: 800px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(245, 160, 180, 0.5);
    border-radius: 24px;
    padding: 30px 25px;
    box-shadow: 0 15px 35px rgba(255, 180, 200, 0.4);
    display: flex;
    flex-direction: column;
    gap: 25px;
  }
  .scene-section {
    text-align: center;
  }
  .scene-title {
    font-size: 18px;
    margin-bottom: 10px;
    color: #e0678a;
    text-shadow: none;
  }
  .scene-desc {
    font-size: 10px;
    opacity: 0.9;
    line-height: 1.8;
    color: #5e4a5a;
  }
  .core-menu {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  .pixel-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 18px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(245, 140, 170, 0.5);
    border-radius: 14px;
    color: #4a2a3a;
    font-family: 'Press Start 2P', cursive;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    white-space: nowrap;
  }
  .pixel-btn:hover {
    background: rgba(255, 200, 215, 0.4);
    box-shadow: 0 6px 16px rgba(255, 140, 170, 0.3);
  }
  .pixel-btn:active {
    transform: translateY(1px);
    box-shadow: none;
  }
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(255, 240, 235, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }
  .panel {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 2px solid #ffaacc;
    border-radius: 24px;
    padding: 25px;
    min-width: 280px;
    text-align: center;
    color: #4a3a5a;
    font-family: 'Press Start 2P', cursive;
    font-size: 12px;
  }
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255, 105, 180, 0.1);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 105, 180, 0.5);
    border-radius: 3px;
  }
</style>