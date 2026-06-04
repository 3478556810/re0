<template>
  <div class="explore-overlay" @click.self="$emit('close')">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="status-item">
        <Icon icon="mdi:map-marker" />
        <span>{{ config.floorLabel }} {{ floor }}</span>
      </div>
      <div class="status-item">
        <Icon icon="mdi:clock-outline" />
        <span>{{ timeStr }}</span>
      </div>
      <slot name="header-actions">
        <!-- 电梯、出口等按钮 -->
      </slot>
      <button class="leave-btn" @click="$emit('close')">离开</button>
    </div>

    <!-- 自定义信息面板（收获筐等） -->
    <slot name="info-panel" />

    <!-- 地图容器 -->
    <div class="map-container" ref="mapContainer">
      <div class="explore-grid" :style="gridStyle">
        <div
          v-for="(tile, idx) in flatGrid"
          :key="idx"
          class="explore-cell"
          :class="[tile, { 'player-cell': idx === playerPos }]"
          @click="onCellClick(tile, idx)"
        >
          <template v-if="idx === playerPos">
            <img v-if="playerImage" :src="playerImage" class="player-head-icon" />
            <Icon v-else icon="mdi:account-circle" class="player-full-icon" />
          </template>
          <template v-else>
            <Icon v-if="getTileIcon(tile)" :icon="getTileIcon(tile)" class="cell-icon" />
          </template>
        </div>
      </div>
    </div>

    <!-- 方向键（可关闭） -->
    <slot name="controls">
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
      <div class="action-right" @touchstart.prevent="interact" @click="interact">
        <Icon icon="mdi:hand-back-right" class="action-icon" />
        <span>交互</span>
      </div>
    </slot>

    <!-- Toast 提示 -->
    <Transition name="fade">
      <div v-if="toastMessage" class="material-toast">{{ toastMessage }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close', 'interact', 'move'])

const props = defineProps({
  config: {
    type: Object,
    required: true,
    // config 结构：
    // {
    //   rows: 20, cols: 20, cellSize: 90,
    //   floor: 1, floorLabel: '层',
    //   getGrid: () => string[][],           // 生成地图的函数
    //   onDig: (row, col) => void,           // 挖掘行为
    //   onLadder: () => void,                // 下楼/进入下一区域
    //   onMonster: (row, col) => string[],   // 返回怪物ID数组
    //   onMove: (row, col) => void,          // 移动到某格的回调
    //   tileIcons: { rock: 'mdi:stone', ... }, // 自定义图标
    //   showControls: true,                  // 是否显示方向键
    // }
  }
})

const rows = computed(() => props.config.rows || 20)
const cols = computed(() => props.config.cols || 20)
const cellSize = computed(() => props.config.cellSize || 90)
const floor = computed(() => props.config.floor || 1)

const playerRow = ref(0)
const playerCol = ref(0)
const playerPos = computed(() => playerRow.value * cols.value + playerCol.value)

const grid = ref([])
const flatGrid = computed(() => grid.value.flat())

const toastMessage = ref('')
let toastTimer = null

const mapContainer = ref(null)
const containerWidth = ref(0)
const containerHeight = ref(0)
const ready = ref(false)

const playerImage = computed(() => {
  const imgs = store.config?.customImages
  if (!imgs) return null
  return imgs.player || imgs.hero || Object.values(imgs)[0] || null
})

const cameraStyle = computed(() => {
  if (!ready.value) return { left: '0px', top: '0px' }
  const px = playerCol.value * cellSize.value + cellSize.value / 2
  const py = playerRow.value * cellSize.value + cellSize.value / 2
  let left = containerWidth.value / 2 - px
  let top = containerHeight.value / 2 - py
  left = Math.min(0, Math.max(containerWidth.value - cols.value * cellSize.value, left))
  top = Math.min(0, Math.max(containerHeight.value - rows.value * cellSize.value, top))
  return { left: `${left}px`, top: `${top}px` }
})

const gridStyle = computed(() => ({
  ...cameraStyle.value,
  width: `${cols.value * cellSize.value}px`,
  height: `${rows.value * cellSize.value}px`,
  gridTemplateColumns: `repeat(${cols.value}, ${cellSize.value}px)`,
  gridTemplateRows: `repeat(${rows.value}, ${cellSize.value}px)`,
}))

const timeStr = computed(() => {
  const t = store.world.gameTime
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
})

function showToast(text) {
  toastMessage.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, 1500)
}

function getTileIcon(tile) {
  const icons = props.config.tileIcons || {}
  return icons[tile] || ''
}

function newFloor() {
  if (props.config.getGrid) {
    grid.value = props.config.getGrid(floor.value)
  } else {
    grid.value = []
  }
  const cr = Math.floor(rows.value / 2)
  const cc = Math.floor(cols.value / 2)
  if (grid.value[cr]?.[cc] === 'empty') {
    playerRow.value = cr
    playerCol.value = cc
    return
  }
  for (let r = 1; r < rows.value - 1; r++) {
    for (let c = 1; c < cols.value - 1; c++) {
      if (grid.value[r]?.[c] === 'empty') {
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
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', updateContainerSize)
})

watch(() => props.config.floor, () => {
  newFloor()
  nextTick(() => ready.value = true)
})

function tryMove(dr, dc) {
  const nr = playerRow.value + dr
  const nc = playerCol.value + dc
  if (nr < 0 || nr >= rows.value || nc < 0 || nc >= cols.value) return

  const tile = grid.value[nr]?.[nc] || 'empty'
  playerRow.value = nr
  playerCol.value = nc

  if (props.config.onMove) {
    props.config.onMove(nr, nc, tile)
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

function onCellClick(tile, idx) {
  const cr = Math.floor(idx / cols.value)
  const cc = idx % cols.value
  if (Math.abs(cr - playerRow.value) + Math.abs(cc - playerCol.value) !== 1) return
  if (tile === 'rock' && props.config.onDig) {
    props.config.onDig(cr, cc)
  } else if (tile === 'ladder' && props.config.onLadder) {
    props.config.onLadder()
  } else if (tile === 'monster' && props.config.onMonster) {
    const ids = props.config.onMonster(cr, cc)
    if (ids?.length) emit('interact', { type: 'battle', enemies: ids })
  }
}

function interact() {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  for (const [dr, dc] of dirs) {
    const nr = playerRow.value + dr
    const nc = playerCol.value + dc
    if (nr < 0 || nr >= rows.value || nc < 0 || nc >= cols.value) continue
    const tile = grid.value[nr]?.[nc]
    if (tile === 'rock' && props.config.onDig) {
      props.config.onDig(nr, nc)
      return
    } else if (tile === 'ladder' && props.config.onLadder) {
      props.config.onLadder()
      return
    }
  }
}
</script>

<style scoped>
/* 与 MinePanel.css 相同，后面可以单独抽出共用样式 */
.explore-overlay { position: fixed; inset: 0; background: #0a0a0a; z-index: 350; display: flex; flex-direction: column; overflow: hidden; }
.status-bar { /* 同矿洞 */ }
.map-container { flex: 1; position: relative; overflow: hidden; }
.explore-grid { position: absolute; display: grid; gap: 2px; background: rgba(0,0,0,0.3); }
.explore-cell { aspect-ratio: 1; border: 1px solid #222; display: flex; align-items: center; justify-content: center; }
/* 其他样式从 MinePanel.css 迁移 */
</style>