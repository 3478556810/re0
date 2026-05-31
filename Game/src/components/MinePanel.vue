<template>
  <div class="mine-overlay" @click.self="$emit('close')">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="status-item">
        <Icon icon="mdi:pickaxe" />
        <span>{{ store.mine.currentFloor }}F</span>
      </div>
      <div class="status-item">
        <Icon icon="mdi:clock-outline" />
        <span>{{ timeStr }}</span>
      </div>
      <button class="pixel-btn small" @click="showElevator = true">
        <Icon icon="mdi:elevator" /> 电梯 ({{ Array.isArray(store.mine.unlockedFloors) ? store.mine.unlockedFloors.join(', ') : '1' }}F)
      </button>
      <div class="status-item loot-preview" @click="showBasket = !showBasket">
        <Icon icon="mdi:bag-personal" />
        <span class="loot-count">{{ totalInBasket }}</span>
      </div>
      <button class="leave-btn" @click="$emit('close')">离开</button>
    </div>

    <!-- 收获筐 -->
    <div v-if="showBasket" class="loot-detail">
      <div v-for="(qty, id) in store.mine.basket" :key="id" class="loot-item">
        <Icon :icon="getMaterialIcon(id)" />
        <span>{{ store.getMaterialName(id) }} ×{{ qty }}</span>
      </div>
      <div>总计：{{ totalInBasket }} / {{ store.mine.maxBasketSize }}</div>
      <div v-if="Object.keys(store.mine.basket).length === 0" class="loot-empty">筐是空的</div>
    </div>

    <!-- 地图容器 -->
    <div class="map-container" ref="mapContainer">
      <div class="mine-grid" :style="gridStyle">
        <div
          v-for="(tile, idx) in flatGrid"
          :key="idx"
          class="mine-cell"
          :class="[tile, { 'player-cell': idx === playerPos }]"
          @click="handleCellClick(tile, idx)"
        >
          <template v-if="idx === playerPos">
            <img v-if="playerImage" :src="playerImage" class="player-head-icon" />
            <Icon v-else icon="mdi:account-circle" class="player-full-icon" />
          </template>
          <template v-else>
            <Icon v-if="tile === 'rock' || tile === 'junk'" icon="mdi:stone" class="cell-icon" />
            <Icon v-else-if="tile === 'ladder'" icon="mdi:arrow-down-bold-circle" class="cell-icon" />
            <Icon v-else-if="tile === 'monster'" icon="mdi:skull" class="cell-icon" />
          </template>
        </div>
      </div>
    </div>

    <!-- 方向键 -->
    <div class="dpad-left">
      <div class="dpad-row">
        <div class="dpad-btn" @touchstart.prevent="tryMove(-1, 0)" @click="tryMove(-1, 0)">
          <Icon icon="mdi:chevron-up" />
        </div>
      </div>
      <div class="dpad-row">
        <div class="dpad-btn" @touchstart.prevent="tryMove(0, -1)" @click="tryMove(0, -1)">
          <Icon icon="mdi:chevron-left" />
        </div>
        <div class="dpad-btn" @touchstart.prevent="tryMove(1, 0)" @click="tryMove(1, 0)">
          <Icon icon="mdi:chevron-down" />
        </div>
        <div class="dpad-btn" @touchstart.prevent="tryMove(0, 1)" @click="tryMove(0, 1)">
          <Icon icon="mdi:chevron-right" />
        </div>
      </div>
    </div>

    <!-- 交互按钮 -->
    <div class="action-right" @touchstart.prevent="interact" @click="interact">
      <Icon icon="mdi:hand-back-right" class="action-icon" />
      <span>交互</span>
    </div>

    <!-- 获得材料提示 -->
    <Transition name="fade">
      <div v-if="toastMessage" class="material-toast">{{ toastMessage }}</div>
    </Transition>

    <!-- 电梯面板 -->
    <div v-if="showElevator" class="elevator-panel">
      <h3>选择楼层</h3>
      <button v-for="floor in store.mine.unlockedFloors" :key="floor"
        class="pixel-btn small" @click="goToFloor(floor)">
        第 {{ floor }} 层
      </button>
      <button class="pixel-btn small" @click="showElevator = false">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import {
  generateCave,
  moveMonsters,
  rollOreDynamic,
  getMonstersForFloor,
  getMaterialIcon,
  TILE
} from '../utils/mineLogic'

const store = useGameStore()
const emit = defineEmits(['close', 'startBattle'])
const toastMessage = ref('')
let toastTimer = null

const totalInBasket = computed(() =>
  Object.values(store.mine.basket).reduce((sum, q) => sum + q, 0)
)

const rows = 20
const cols = 20
const cellSize = 90

const playerRow = ref(0)
const playerCol = ref(0)
const playerPos = computed(() => playerRow.value * cols + playerCol.value)

const grid = ref([])
const flatGrid = computed(() => grid.value.flat())

const timeStr = computed(() => {
  const total = store.world.gameTime
  const h = Math.floor(total / 60).toString().padStart(2, '0')
  const m = (total % 60).toString().padStart(2, '0')
  return `${h}:${m}`
})

const mapContainer = ref(null)
const containerWidth = ref(0)
const containerHeight = ref(0)
const ready = ref(false)

const showBasket = ref(false)
const showElevator = ref(false)

const playerImage = computed(() => {
  const imgs = store.config?.customImages
  if (!imgs) return null
  return imgs.player || imgs.hero || Object.values(imgs)[0] || null
})

const cameraStyle = computed(() => {
  if (!ready.value) return { left: '0px', top: '0px' }
  const playerX = playerCol.value * cellSize + cellSize / 2
  const playerY = playerRow.value * cellSize + cellSize / 2
  let left = containerWidth.value / 2 - playerX
  let top = containerHeight.value / 2 - playerY

  const maxLeft = 0
  const minLeft = containerWidth.value - cols * cellSize
  const maxTop = 0
  const minTop = containerHeight.value - rows * cellSize

  left = Math.min(maxLeft, Math.max(minLeft, left))
  top = Math.min(maxTop, Math.max(minTop, top))

  return { left: `${left}px`, top: `${top}px` }
})

const gridStyle = computed(() => ({
  ...cameraStyle.value,
  width: `${cols * cellSize}px`,
  height: `${rows * cellSize}px`,
  gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
  gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
}))

function showToast(text) {
  toastMessage.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, 1500)
}

function goToFloor(floor) {
  store.mine.currentFloor = floor
  showElevator.value = false
  newFloor()
  showToast(`电梯直达第 ${floor} 层`)
}

function newFloor() {
  const isNight = store.world.gameTime >= 1080 || store.world.gameTime < 360
  grid.value = generateCave(rows, cols, isNight ? 1.5 : 1)
  const centerR = Math.floor(rows / 2)
  const centerC = Math.floor(cols / 2)

  if (grid.value[centerR]?.[centerC] === TILE.EMPTY) {
    playerRow.value = centerR
    playerCol.value = centerC
    return
  }
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid.value[r][c] === TILE.EMPTY) {
        playerRow.value = r
        playerCol.value = c
        return
      }
    }
  }
}

function updateContainerSize() {
  if (mapContainer.value) {
    containerWidth.value = mapContainer.value.clientWidth
    containerHeight.value = mapContainer.value.clientHeight
  }
}

async function initMap() {
  for (let i = 0; i < 10; i++) {
    updateContainerSize()
    if (containerWidth.value > 0 && containerHeight.value > 0) break
    await new Promise(r => setTimeout(r, 50))
  }
  newFloor()
  ready.value = true
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', updateContainerSize)
  initMap()
  monsterTimer = setInterval(() => {
    if (grid.value.length) moveMonsters(grid.value, rows, cols)
  }, 1500)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', updateContainerSize)
  clearInterval(monsterTimer)
})

let monsterTimer = null

watch(() => store.mine.currentFloor, () => {
  newFloor()
  nextTick(() => ready.value = true)
})

function tryMove(dr, dc) {
  const nr = playerRow.value + dr
  const nc = playerCol.value + dc
  if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return

  const tile = grid.value[nr][nc]
  if (tile === TILE.EMPTY || tile === TILE.LADDER) {
    playerRow.value = nr
    playerCol.value = nc
  } else if (tile === TILE.MONSTER) {
    const monsterIds = getMonstersForFloor(store.mine.currentFloor, store.config.monsterTemplates)
    if (monsterIds.length > 0) {
      const pick = monsterIds[Math.floor(Math.random() * monsterIds.length)]
      emit('startBattle', [pick])
    }
    grid.value[nr][nc] = TILE.EMPTY
    playerRow.value = nr
    playerCol.value = nc
  }
}

function handleKeydown(e) {
  const key = e.key.toLowerCase()
  if (['w', 'a', 's', 'd', 'e'].includes(key)) e.preventDefault()

  if (key === 'e') { interact(); return }

  let dr = 0, dc = 0
  if (key === 'w') dr = -1
  else if (key === 's') dr = 1
  else if (key === 'a') dc = -1
  else if (key === 'd') dc = 1
  else return

  tryMove(dr, dc)
}

function handleCellClick(tile, index) {
  const clickedRow = Math.floor(index / cols)
  const clickedCol = index % cols
  const playerR = playerRow.value
  const playerC = playerCol.value

  if (Math.abs(clickedRow - playerR) + Math.abs(clickedCol - playerC) !== 1) return

  if (tile === TILE.ROCK) {
    dig(clickedRow, clickedCol)
  } else if (tile === TILE.JUNK) {
    digJunk(clickedRow, clickedCol)
  } else if (tile === TILE.LADDER) {
    goDown()
  }
}

function interact() {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  for (const [dr, dc] of dirs) {
    const nr = playerRow.value + dr
    const nc = playerCol.value + dc
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
    const tile = grid.value[nr][nc]
    if (tile === TILE.ROCK) { dig(nr, nc); return }
    else if (tile === TILE.JUNK) { digJunk(nr, nc); return }
    else if (tile === TILE.LADDER) { goDown(); return }
  }
}

function dig(r, c) {
  if (totalInBasket.value >= store.mine.maxBasketSize) {
    showToast('收获筐已满！下到5层存档或离开矿洞')
    return
  }
  const oreId = rollOreDynamic(store.config.materialDefinitions, store.mine.currentFloor)
  if (!store.mine.basket[oreId]) store.mine.basket[oreId] = 0
  store.mine.basket[oreId]++
  showToast(`获得 ${store.getMaterialName(oreId)}`)
  grid.value[r][c] = Math.random() < 0.15 ? TILE.LADDER : TILE.EMPTY
}

function digJunk(r, c) {
  if (totalInBasket.value >= store.mine.maxBasketSize) {
    showToast('收获筐已满！下到5层存档或离开矿洞')
    return
  }
  const junkId = 'waste_stone'
  if (!store.mine.basket[junkId]) store.mine.basket[junkId] = 0
  store.mine.basket[junkId]++
  showToast('获得 废石')
  grid.value[r][c] = TILE.EMPTY
}

function goDown() {
  store.mine.currentFloor++
  if (store.mine.currentFloor % 5 === 0) {
    for (const [id, qty] of Object.entries(store.mine.basket)) {
      store.addMaterial(id, store.getMaterialName(id), qty)
    }
    store.mine.basket = {}
    if (!store.mine.unlockedFloors.includes(store.mine.currentFloor)) {
      store.mine.unlockedFloors.push(store.mine.currentFloor)
    }
    store.mine.savedFloors[store.mine.currentFloor] = true
    store.save()
    showToast(`第 ${store.mine.currentFloor} 层已存档！材料已存入背包`)
  }
  newFloor()
}
</script>

<style src="./MinePanel.css" scoped></style>