<template>
  <div class="map-wrapper">
    <div ref="pixiContainer" class="map-canvas"></div>
    <div class="map-hud pixel-panel">
      <span>💰 {{ store.player.gold }}G</span>
      <span>❤️ {{ store.player.hp }}/{{ store.player.maxHp }}</span>
      <span>📅 第 {{ store.world.day }} 天</span>
      <button class="pixel-btn small" @click="openMenu">菜单</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as PIXI from 'pixi.js'
import { useGameStore } from '../store/gameStore'
import { BIOMES, spawnEnemy } from '../config/biomeConfig'

const store = useGameStore()
const emit = defineEmits(['enterBattle', 'enterScene', 'openMenu', 'enterInn', 'enterGuild'])

const VIEW_W = 10, VIEW_H = 8
const MAP_W = 30, MAP_H = 30
let CELL = 48
let currentBiome = store.world.currentBiome
let currentMap = []
let app, mapContainer, entityContainer, fogContainer

const pixiContainer = ref(null)

// 自定义图片纹理缓存
function getTexture(key) {
  const img = store.config?.customImages?.[key]
  if (!img) return null
  if (!getTexture.cache) getTexture.cache = {}
  if (!getTexture.cache[key]) {
    getTexture.cache[key] = PIXI.Texture.from(img)
  }
  return getTexture.cache[key]
}

function drawPlayer() {
  const px = store.world.playerX, py = store.world.playerY
  const startX = Math.max(0, Math.min(MAP_W - VIEW_W, px - Math.floor(VIEW_W/2)))
  const startY = Math.max(0, Math.min(MAP_H - VIEW_H, py - Math.floor(VIEW_H/2)))
  const vx = px - startX, vy = py - startY
  const cell = currentMap[py]?.[px]
  const elev = cell ? cell.elevation : 0

  let playerSpr
  const texture = getTexture('player')
  if (texture) {
    playerSpr = new PIXI.Sprite(texture)
    playerSpr.width = CELL * 0.8
    playerSpr.height = CELL * 0.8
  } else {
    const g = new PIXI.Graphics()
    g.beginFill(0x3366ff)
    g.drawCircle(CELL/2, CELL/2, CELL*0.35)
    g.endFill()
    playerSpr = new PIXI.Sprite(app.renderer.generateTexture(g))
  }
  playerSpr.x = vx * CELL + CELL*0.1
  playerSpr.y = vy * CELL - (elev * 4) + CELL*0.1
  playerSpr.name = 'player'
  entityContainer.addChild(playerSpr)
}

function drawEnemy(mx, my) {
  const cell = currentMap[my][mx]
  if (!cell.enemy) return
  const startX = Math.max(0, Math.min(MAP_W - VIEW_W, store.world.playerX - Math.floor(VIEW_W/2)))
  const startY = Math.max(0, Math.min(MAP_H - VIEW_H, store.world.playerY - Math.floor(VIEW_H/2)))
  const vx = mx - startX, vy = my - startY
  const elev = cell.elevation

  let enemySpr
  const texture = getTexture(cell.enemy.id)
  if (texture) {
    enemySpr = new PIXI.Sprite(texture)
    enemySpr.width = CELL * 0.7
    enemySpr.height = CELL * 0.7
  } else {
    const g = new PIXI.Graphics()
    g.beginFill(0xff3333)
    g.drawCircle(CELL/2, CELL/2, CELL*0.3)
    g.endFill()
    enemySpr = new PIXI.Sprite(app.renderer.generateTexture(g))
  }
  enemySpr.x = vx * CELL + CELL*0.15
  enemySpr.y = vy * CELL - (elev * 4) + CELL*0.15
  enemySpr.name = `enemy_${mx}_${my}`
  entityContainer.addChild(enemySpr)
}

// 像素图标绘制（替代emoji）
function drawTileIcon(g, cell, x, y, size) {
  const s = size * 0.5
  const cx = x + size/2, cy = y + size/2
  switch (cell.name) {
    case '森林':
      g.beginFill(0x1a4d1a)
      g.drawRect(cx - s*0.2, cy - s*0.6, s*0.4, s*1.2)
      g.drawRect(cx - s*0.5, cy - s*0.2, s*1.0, s*0.4)
      g.endFill()
      break
    case '山丘':
      g.beginFill(0x8b5a2b)
      g.moveTo(cx - s*0.6, cy + s*0.5)
      g.lineTo(cx, cy - s*0.6)
      g.lineTo(cx + s*0.6, cy + s*0.5)
      g.closePath()
      g.endFill()
      break
    case '石墙':
      g.beginFill(0x666666)
      g.drawRect(x+2, y+2, size-4, size-4)
      g.endFill()
      g.beginFill(0x999999)
      g.drawRect(x+size*0.2, y+size*0.1, size*0.2, size*0.15)
      g.drawRect(x+size*0.5, y+size*0.3, size*0.2, size*0.15)
      g.endFill()
      break
    case '河流':
      g.beginFill(0x3366cc)
      g.drawRect(x+2, y+2, size-4, size-4)
      g.endFill()
      g.beginFill(0x66aaff)
      g.drawRect(x+size*0.3, y+size*0.5, size*0.4, size*0.15)
      g.endFill()
      break
    case '房屋':
      g.beginFill(0xc9a87b)
      g.drawRect(cx - s*0.4, cy - s*0.2, s*0.8, s*0.8)
      g.endFill()
      g.beginFill(0xaa8855)
      g.moveTo(cx - s*0.5, cy - s*0.2)
      g.lineTo(cx, cy - s*0.6)
      g.lineTo(cx + s*0.5, cy - s*0.2)
      g.closePath()
      g.endFill()
      break
    case '旅馆':
      g.beginFill(0xd4a373)
      g.drawRect(cx - s*0.4, cy - s*0.3, s*0.8, s*0.8)
      g.endFill()
      g.beginFill(0xcc8855)
      g.drawRect(cx - s*0.3, cy - s*0.2, s*0.15, s*0.3)
      g.drawRect(cx + s*0.15, cy - s*0.2, s*0.15, s*0.3)
      g.endFill()
      break
    case '冒险者协会':
      g.beginFill(0xb89a6a)
      g.drawRect(cx - s*0.4, cy - s*0.3, s*0.8, s*0.8)
      g.endFill()
      g.beginFill(0xffd700)
      g.moveTo(cx, cy - s*0.6)
      g.lineTo(cx - s*0.35, cy - s*0.2)
      g.lineTo(cx + s*0.35, cy - s*0.2)
      g.closePath()
      g.endFill()
      break
    case '水井':
      g.beginFill(0x6c9e3f)
      g.drawCircle(cx, cy, s*0.3)
      g.endFill()
      g.beginFill(0x3366cc)
      g.drawCircle(cx, cy, s*0.15)
      g.endFill()
      break
    case '宝箱':
      g.beginFill(0xdaa520)
      g.drawRoundedRect(cx - s*0.4, cy - s*0.2, s*0.8, s*0.5, 4)
      g.endFill()
      g.beginFill(0xffd700)
      g.drawRect(cx - s*0.15, cy - s*0.1, s*0.3, s*0.1)
      g.endFill()
      break
    default: break
  }
}

onMounted(async () => {
  await nextTick()
  const container = pixiContainer.value
  CELL = Math.floor(Math.min(container.clientWidth / VIEW_W, container.clientHeight / VIEW_H))
  app = new PIXI.Application({
    width: CELL * VIEW_W,
    height: CELL * VIEW_H,
    backgroundColor: 0x0a1a2a,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  })
  container.appendChild(app.view)
  app.view.style.position = 'absolute'
  app.view.style.left = '50%'
  app.view.style.top = '50%'
  app.view.style.transform = 'translate(-50%, -50%)'

  mapContainer = new PIXI.Container()
  entityContainer = new PIXI.Container()
  fogContainer = new PIXI.Container()
  app.stage.addChild(mapContainer, entityContainer, fogContainer)

  if (!store._persistentMap || store._persistentMap.biome !== currentBiome) {
    regenerateFullMap()
  } else {
    currentMap = store._persistentMap.data
  }
  updateView()
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  if (app) app.destroy(true)
})

// 马尔可夫链生成地图
function generateMarkovMap(biomeKey, width, height) {
  const biome = BIOMES[biomeKey]
  if (!biome) return []
  const pool = biome.terrainPool
  const map = Array(height).fill().map(() => Array(width).fill(null))
  map[0][0] = weightedRandom(pool)
  for (let x = 1; x < width; x++) map[0][x] = markovNext(map[0][x-1], pool, 'horizontal')
  for (let y = 1; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const above = map[y-1][x]
      const left = x > 0 ? map[y][x-1] : null
      const base = Math.random() < 0.5 ? above : (left || above)
      map[y][x] = markovNext(base, pool, 'vertical')
    }
  }
  // 敌人生成概率降至原来的0.2
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

function regenerateFullMap() {
  currentMap = generateMarkovMap(currentBiome, MAP_W, MAP_H)
  store._persistentMap = { biome: currentBiome, data: currentMap }
}

function updateView() {
  mapContainer.removeChildren()
  entityContainer.removeChildren()
  fogContainer.removeChildren()
  const px = store.world.playerX, py = store.world.playerY
  const startX = Math.max(0, Math.min(MAP_W - VIEW_W, px - Math.floor(VIEW_W/2)))
  const startY = Math.max(0, Math.min(MAP_H - VIEW_H, py - Math.floor(VIEW_H/2)))

  // 绘制地形
  for (let vy = 0; vy < VIEW_H; vy++) {
    for (let vx = 0; vx < VIEW_W; vx++) {
      const mx = startX + vx, my = startY + vy
      if (mx >= MAP_W || my >= MAP_H) continue
      const cell = currentMap[my][mx]
      const g = new PIXI.Graphics()
      const color = parseInt(cell.color.replace('#', ''), 16)
      const elevOffset = cell.elevation * 4
      g.beginFill(color)
      g.drawRect(vx * CELL, vy * CELL - elevOffset, CELL, CELL)
      g.endFill()
      if (cell.elevation > 0) {
        g.beginFill(0x000000, 0.3)
        g.drawRect(vx * CELL, vy * CELL - elevOffset + CELL, CELL, elevOffset)
        g.endFill()
      }
      drawTileIcon(g, cell, vx * CELL, vy * CELL - elevOffset, CELL)
      mapContainer.addChild(g)
    }
  }

  // 绘制敌人
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (x >= startX && x < startX + VIEW_W && y >= startY && y < startY + VIEW_H) {
        drawEnemy(x, y)
      }
    }
  }

  // 绘制玩家
  drawPlayer()

  // 迷雾
  for (let vy = 0; vy < VIEW_H; vy++) {
    for (let vx = 0; vx < VIEW_W; vx++) {
      const mx = startX + vx, my = startY + vy
      if (mx >= MAP_W || my >= MAP_H) continue
      const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2)
      if (dist <= 4) {
        store.exploreTile(mx, my)
        continue
      }
      if (!store.isTileExplored(mx, my)) {
        const fog = new PIXI.Graphics()
        fog.beginFill(0x000000)
        fog.drawRect(vx * CELL, vy * CELL, CELL, CELL)
        fog.endFill()
        fogContainer.addChild(fog)
      } else {
        const fog = new PIXI.Graphics()
        fog.beginFill(0x000000, 0.5)
        fog.drawRect(vx * CELL, vy * CELL, CELL, CELL)
        fog.endFill()
        fogContainer.addChild(fog)
      }
    }
  }
}

function movePlayer(dx, dy) {
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
  const cell = currentMap[ny][nx]
  if (!cell.passable) return
  if (cell.enemy) {
    const monster = spawnEnemy(cell.enemy, store.player.level)
    emit('enterBattle', { monster, x: nx, y: ny })
    return
  }
  store.moveTo(currentBiome, nx, ny)
  store.advanceTime(5)
  updateView()
  if (cell.interact && cell.targetScene) {
    if (cell.targetScene === 'inn') emit('enterInn')
    else if (cell.targetScene === 'guild') emit('enterGuild')
    else emit('enterScene', { biome: cell.targetScene, coord: { x: 0, y: 0 } })
  }
}

function onKey(e) {
  let dx = 0, dy = 0
  if (e.key === 'ArrowUp' || e.key === 'w') dy = -1
  else if (e.key === 'ArrowDown' || e.key === 's') dy = 1
  else if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1
  else if (e.key === 'ArrowRight' || e.key === 'd') dx = 1
  else if (e.key === 'e') {
    const cell = currentMap[store.world.playerY][store.world.playerX]
    if (cell.interact) {
      if (cell.targetScene === 'inn') emit('enterInn')
      else if (cell.targetScene === 'guild') emit('enterGuild')
      else emit('enterScene', { biome: cell.targetScene || currentBiome, coord: { x: 0, y: 0 } })
    }
    e.preventDefault()
    return
  } else return
  if (dx || dy) { movePlayer(dx, dy); e.preventDefault() }
}

function openMenu() { emit('openMenu') }

watch(() => store.world.currentBiome, (newBio) => {
  currentBiome = newBio
  delete store._persistentMap
  regenerateFullMap()
  updateView()
})

defineExpose({ removeEnemy: () => updateView() })
</script>

<style scoped>
.map-wrapper { width: 100%; height: 100%; position: relative; }
.map-canvas { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.map-hud { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 15px; padding: 6px 18px; font-size: 10px; align-items: center; }
</style>