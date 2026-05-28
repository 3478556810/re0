<template>
  <div class="map-screen">
    <!-- 状态栏 -->
    <div class="status-bar pixel-panel">
      <span>💰 {{ store.player.gold }}G</span>
      <span>❤️ {{ store.player.hp }}/{{ store.player.maxHp }}</span>
      <span>📅 第 {{ store.world.day }} 天</span>
      <button class="pixel-btn small" @click="openMenu">菜单</button>
    </div>

    <!-- 地图网格 -->
    <div class="grid-container">
      <div v-for="(row, y) in visibleMap" :key="y" class="grid-row">
        <div
          v-for="(cell, x) in row"
          :key="x"
          class="cell"
          :class="{
            'cell-player': isPlayer(x, y),
            'cell-enemy': cell.enemy,
            'cell-interact': cell.interact,
            'cell-blocked': !cell.passable,
            'cell-hidden': isHidden(cell.realX, cell.realY)
          }"
          :style="{ backgroundColor: isHidden(cell.realX, cell.realY) ? '#000' : cell.color }"
          @click="handleCellClick(cell)"
        >
          <div v-if="!isHidden(cell.realX, cell.realY)" class="cell-content">
            <!-- 敌人按钮 -->
            <button
              v-if="cell.enemy && !isPlayer(x, y)"
              class="pixel-btn enemy-btn"
              @click.stop="startBattle(cell.enemy, cell.realX, cell.realY)"
            >
              👾 {{ cell.enemy.name }}
            </button>

            <!-- 建筑按钮 -->
            <button
              v-else-if="cell.interact && !isPlayer(x, y)"
              class="pixel-btn interact-btn"
              @click.stop="handleInteract(cell)"
            >
              {{ cell.interactIcon }} {{ cell.name }}
            </button>

            <!-- 玩家 -->
            <div v-if="isPlayer(x, y)" class="player-marker">
              <img v-if="playerImage" :src="playerImage" class="player-avatar" />
              <span v-else class="player-icon">🧑</span>
            </div>

            <!-- 普通地形 -->
            <span v-else class="terrain-name">{{ cell.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '../store/gameStore'
import { BIOMES, spawnEnemy } from '../config/biomeConfig'

const store = useGameStore()
const emit = defineEmits(['enterBattle', 'enterScene', 'openMenu', 'enterInn', 'enterGuild'])

const VIEW_W = 10, VIEW_H = 8
const MAP_W = 30, MAP_H = 30
let currentBiome = store.world.currentBiome
let fullMap = ref([]) // 使用 ref 确保响应式

const playerImage = computed(() => store.config?.customImages?.player || null)

// 马尔可夫链生成地图（完整版）
function generateMarkovMap(biomeKey, width, height) {
  const biome = BIOMES[biomeKey]
  if (!biome) return []
  const pool = biome.terrainPool
  const map = Array(height).fill().map(() => Array(width).fill(null))
  map[0][0] = weightedRandom(pool)
  for (let x = 1; x < width; x++) {
    map[0][x] = markovNext(map[0][x-1], pool, 'horizontal')
  }
  for (let y = 1; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const above = map[y-1][x]
      const left = x > 0 ? map[y][x-1] : null
      const base = Math.random() < 0.5 ? above : (left || above)
      map[y][x] = markovNext(base, pool, 'vertical')
    }
  }
  // 放置敌人和交互点
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = { ...map[y][x] }
      if (biome.enemies?.length > 0 && Math.random() < (biome.enemyRate * 0.2) && cell.passable && !cell.interact) {
        if (!store.isEnemyDefeated(x, y)) {
          cell.enemy = biome.enemies[Math.floor(Math.random() * biome.enemies.length)]
        }
      }
      map[y][x] = cell
    }
  }
  return map
}

function weightedRandom(pool) {
  const total = pool.reduce((s, t) => s + t.weight, 0)
  let rand = Math.random() * total
  for (const t of pool) {
    if (rand < t.weight) return t
    rand -= t.weight
  }
  return pool[0]
}

function markovNext(current, pool, direction) {
  if (Math.random() < 0.7) return current
  const candidates = pool.filter(t => !(!current.passable && t.passable))
  return weightedRandom(candidates.length ? candidates : pool)
}

function regenerateMap() {
  fullMap.value = generateMarkovMap(currentBiome, MAP_W, MAP_H)
  // 确保玩家在可行走格子上
  let attempts = 0
  while ((!fullMap.value[store.world.playerY]?.[store.world.playerX]?.passable) && attempts < 100) {
    store.world.playerX = Math.floor(Math.random() * MAP_W)
    store.world.playerY = Math.floor(Math.random() * MAP_H)
    attempts++
  }
}

// 视口切片
const visibleMap = computed(() => {
  if (!fullMap.value || fullMap.value.length === 0) return []
  const px = store.world.playerX, py = store.world.playerY
  const startX = Math.max(0, Math.min(MAP_W - VIEW_W, px - Math.floor(VIEW_W/2)))
  const startY = Math.max(0, Math.min(MAP_H - VIEW_H, py - Math.floor(VIEW_H/2)))
  const slice = []
  for (let y = startY; y < startY + VIEW_H; y++) {
    const row = []
    for (let x = startX; x < startX + VIEW_W; x++) {
      if (x < MAP_W && y < MAP_H) {
        const cell = { ...fullMap.value[y][x], realX: x, realY: y }
        row.push(cell)
      } else {
        row.push({ name: '边界', passable: false, color: '#000', realX: x, realY: y })
      }
    }
    slice.push(row)
  }
  return slice
})

function isPlayer(vx, vy) {
  const px = store.world.playerX, py = store.world.playerY
  const startX = Math.max(0, Math.min(MAP_W - VIEW_W, px - Math.floor(VIEW_W/2)))
  const startY = Math.max(0, Math.min(MAP_H - VIEW_H, py - Math.floor(VIEW_H/2)))
  return (startX + vx === px && startY + vy === py)
}

function isHidden(realX, realY) {
  if (realX === undefined || realY === undefined) return true
  if (store.isTileExplored(realX, realY)) return false
  // 玩家周围3格内可见
  const px = store.world.playerX, py = store.world.playerY
  return Math.abs(realX - px) > 3 || Math.abs(realY - py) > 3
}

function handleCellClick(cell) {
  if (cell.interact) handleInteract(cell)
}

function handleInteract(cell) {
  if (cell.targetScene === 'inn') emit('enterInn')
  else if (cell.targetScene === 'guild') emit('enterGuild')
  else if (cell.targetScene) emit('enterScene', { biome: cell.targetScene, coord: { x: 0, y: 0 } })
}

function startBattle(enemyTemplate, x, y) {
  const monster = spawnEnemy(enemyTemplate, store.player.level)
  emit('enterBattle', { monster, x, y })
}

function move(dx, dy) {
  const nx = store.world.playerX + dx, ny = store.world.playerY + dy
  if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) {
    const biome = BIOMES[currentBiome]
    if (biome.exits) {
      let target = null
      if (dy < 0) target = biome.exits.up
      else if (dy > 0) target = biome.exits.down
      else if (dx < 0) target = biome.exits.left
      else if (dx > 0) target = biome.exits.right
      if (target) {
        emit('enterScene', { biome: target, coord: { x: Math.floor(MAP_W/2), y: Math.floor(MAP_H/2) } })
      }
    }
    return
  }
  const cell = fullMap.value[ny][nx]
  if (!cell.passable) return
  if (cell.enemy) {
    const monster = spawnEnemy(cell.enemy, store.player.level)
    emit('enterBattle', { monster, x: nx, y: ny })
    return
  }
  store.moveTo(currentBiome, nx, ny)
  store.advanceTime(5)
  if (cell.interact && cell.targetScene) {
    handleInteract(cell)
  }
}

function openMenu() { emit('openMenu') }

function onKeyDown(e) {
  const key = e.key
  let dx = 0, dy = 0
  if (key === 'ArrowUp' || key === 'w') dy = -1
  else if (key === 'ArrowDown' || key === 's') dy = 1
  else if (key === 'ArrowLeft' || key === 'a') dx = -1
  else if (key === 'ArrowRight' || key === 'd') dx = 1
  else if (key === 'e' || key === 'E') {
    const cell = fullMap.value[store.world.playerY]?.[store.world.playerX]
    if (cell && cell.interact) handleInteract(cell)
    e.preventDefault()
    return
  } else return
  if (dx || dy) { move(dx, dy); e.preventDefault() }
}

onMounted(() => {
  regenerateMap()
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})

watch(() => store.world.currentBiome, (newBio) => {
  currentBiome = newBio
  regenerateMap()
})
</script>

<style scoped>
.map-screen {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a1a2a;
  font-family: 'Press Start 2P', cursive;
}
.status-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 15px;
  margin: 5px 10px;
  font-size: 10px;
  flex-shrink: 0;
}
.grid-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
}
.grid-row {
  display: flex;
}
.cell {
  width: min(9vw, 9vh);
  height: min(9vw, 9vh);
  border: 1px solid rgba(0,0,0,0.3);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
}
.cell-player {
  border: 2px solid #ffd700;
  box-shadow: 0 0 8px #ffd700;
}
.cell-enemy {
  background: rgba(255,0,0,0.1) !important;
}
.cell-interact {
  background: rgba(255,215,0,0.2) !important;
}
.cell-blocked {
  opacity: 0.7;
}
.cell-hidden {
  background: #000 !important;
  color: transparent;
}
.cell-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.enemy-btn, .interact-btn {
  font-size: 8px;
  padding: 4px 8px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.player-marker {
  width: 80%;
  height: 80%;
  border-radius: 50%;
  background: #3366ff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.player-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.player-icon {
  font-size: 1.5em;
}
.terrain-name {
  font-size: 7px;
  color: white;
  text-shadow: 1px 1px 0 #000;
}
</style>