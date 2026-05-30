<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="dungeon-panel pixel-panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <div class="dungeon-bg"></div>
      <div class="dungeon-content">
        <div class="view-tabs">
          <button
            class="pixel-btn small"
            :class="{ active: currentView === 'camp' }"
            @click="currentView = 'camp'"
          >
            <Icon icon="mdi:campfire" /> 营地
          </button>
          <button
            class="pixel-btn small"
            :class="{ active: currentView === 'map' }"
            @click="currentView = 'map'"
          >
            <Icon icon="mdi:map" /> 地图
          </button>
        </div>

        <!-- 营地视图（保留关键功能，用篝火替换聊天） -->
        <div v-if="currentView === 'camp'" class="camp-view">
          <div class="top-row">
            <div class="title-area">
              <h2 class="dungeon-title">{{ dungeonName }}</h2>
              <div class="weather-line">
                <Icon icon="mdi:weather-cloudy" /> {{ weather }} · {{ dateStr }}
              </div>
            </div>
            <div class="floor-progress">
              <span>第 {{ store.dungeon.currentFloor }} / {{ store.dungeon.maxFloors }} 层</span>
              <div class="progress-bar">
                <div class="fill" :style="{ width: progressPercent + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- 篝火动画 + 同伴区域（代替原来的聊天框） -->
          <div class="camp-center">
            <div class="campfire-area">
             <div class="campfire">
  <div class="fire">
    <div class="fire-particle"></div>
    <div class="fire-particle"></div>
    <div class="fire-particle"></div>
    <div class="fire-particle"></div>
  </div>
  <div class="logs"></div>
</div>
              <p class="campfire-hint">篝火噼啪作响...</p>
            </div>
            <div class="companions-section">
              <p class="section-label"><Icon icon="mdi:account-group" /> 同行伙伴</p>
              <div class="companion-avatars">
                <div v-for="c in companions" :key="c.id" class="companion-item" @click="talkToCompanion(c)">
                  <img v-if="c.image" :src="c.image" class="companion-img" />
                  <Icon v-else :icon="c.icon || 'mdi:account-heart'" class="companion-icon" />
                  <span class="companion-name">{{ c.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            <div class="main-actions">
              <button class="pixel-btn" @click="currentView = 'mine'">
  🪨 测试矿洞
</button>
              <button class="pixel-btn primary" @click="explore">
                <Icon icon="mdi:sword-cross" /> 深入探索
              </button>
              <button class="pixel-btn" @click="rest">
                <Icon icon="mdi:bed" /> 休息 (50G)
              </button>
              <button class="pixel-btn" @click="retreat" v-if="canRetreat">
                <Icon icon="mdi:exit-run" /> 撤退
              </button>
            </div>
            <div class="sub-actions">
              <button class="pixel-btn" @click="$emit('openInventory')">
                <Icon icon="mdi:bag-personal" /> 背包
              </button>
            </div>
          </div>
          <p v-if="cooldownMsg" class="cooldown">{{ cooldownMsg }}</p>
        </div>

        <!-- 全屏城镇地图（替换旧地图） -->
        <TownMap
           v-else-if="currentView === 'map'"
          :dungeon-name="dungeonName"
          :current-floor="store.dungeon.currentFloor"
          @close="$emit('close')"
          @startBattle="emit('startBattle', $event)"
          @triggerStory="emit('triggerStory', $event)"
           @openMine="currentView = 'mine'"
        />


    
      </div>
    </div>
        <MinePanel
    v-if="currentView === 'mine'"
  @close="currentView = 'map'"
/>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { DUNGEONS } from '../config/dungeonConfig'
import { defaultCharacters } from '../config/characters'
import TownMap from './TownMap.vue'  // 导入新的地图组件
import MinePanel from './MinePanel.vue'
const store = useGameStore()
const emit = defineEmits(['close', 'startBattle', 'triggerStory', 'openInventory'])

const currentView = ref('camp')

// ─── 营地数据 ───
const dungeonName = computed(() => {
  const id = store.dungeon.currentDungeon || store.dungeon.lastDungeonId
  return DUNGEONS[id]?.name || '神秘地下城'
})
const canRetreat = computed(() => store.dungeon.active && store.dungeon.currentFloor > 1)
const progressPercent = computed(() => Math.round((store.dungeon.currentFloor / store.dungeon.maxFloors) * 100))
const cooldownMsg = computed(() => {
  const dg = DUNGEONS[store.dungeon.currentDungeon]
  if (dg?.cooldown && store.dungeon.lastRetreatDay) {
    const nextDay = store.dungeon.lastRetreatDay + dg.cooldown
    if (store.world.day < nextDay) return `撤退冷却中：${nextDay - store.world.day}天后可再进入`
  }
  return ''
})

const weatherPool = ['晴', '阴', '小雨', '雾', '微风']
const weather = computed(() => weatherPool[Math.floor(Math.random() * weatherPool.length)])
const dateStr = computed(() => `第${store.world.day}天 ${formatTime(store.world.gameTime)}`)
function formatTime(min) { const h = Math.floor(min / 60), m = min % 60; return `${h}:${m.toString().padStart(2, '0')}` }

const companions = computed(() => {
  const chars = store.config?.characters || defaultCharacters
  const heroId = 'hero'
  return Object.values(chars).filter(c => c.id !== heroId && c.name)
})

// ─── 探索逻辑 ───
function explore() {
  const floor = store.dungeon.currentFloor
  const dg = DUNGEONS[store.dungeon.currentDungeon]
  const storyId = dg?.storyByFloor?.[floor]

  if (storyId && !store.dungeon.storyTriggered?.[floor]) {
    if (!store.dungeon.storyTriggered) store.dungeon.storyTriggered = {}
    store.dungeon.storyTriggered[floor] = true
    emit('triggerStory', storyId)
    return
  }

  if (floor === 1) {
    emit('startBattle', ['slime', 'slime', 'goblin'])
  } else {
    const monsterId = store.getRandomMonsterForFloor()
    if (monsterId) {
      store.dungeon.isDungeonBattle = true
      emit('startBattle', monsterId)
    }
  }
}

function rest() {
  if (store.player.gold >= 50) {
    store.addGold(-50)
    store.player.hp = store.player.maxHp
    store.player.mp = store.player.maxMp
    store.save()
    alert('在篝火旁小憩片刻，体力恢复了。')
  } else alert('金币不足。')
}

function retreat() {
  store.retreat()
  emit('close')
}

function talkToCompanion(char) {
  const nodeId = `camp_talk_${char.id}`
  if (store.config.storyScript?.[nodeId]) {
    emit('triggerStory', nodeId)
  } else {
    alert(`与${char.name}简短交谈，她微笑着鼓励你继续前进。`)
  }
}
</script>

<style scoped>
/* 防止全局滚动条 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 200; }

.dungeon-panel {
  width: 85vw;
  max-width: 950px;
  height: 85vh;
  background: rgba(20, 28, 40, 0.92);
  backdrop-filter: blur(20px);
  border: 2px solid #b89a6a;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  position: relative;
  overflow: hidden;            /* 面板本身不滚动 */
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
}

.dungeon-bg {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: url('/assets/dungeon_fog.png') center/cover no-repeat;
  opacity: 0.15;
  z-index: 0;
  animation: fog 20s linear infinite;
}
@keyframes fog { 0%{transform:scale(1)} 50%{transform:scale(1.05)} 100%{transform:scale(1)} }

.dungeon-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;            /* 内部滚动区域自行处理 */
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  color: #ffd;
  font-size: 24px;
  cursor: pointer;
  z-index: 20;                 /* 确保在最上层 */
}

.view-tabs { display: flex; gap: 10px; margin-bottom: 15px; }
.view-tabs .pixel-btn.small.active { background: rgba(255,215,0,0.2); }

.camp-view { flex: 1; display: flex; flex-direction: column; gap: 15px; overflow: hidden; }

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  padding-right: 40px;        /* 避免关闭按钮遮挡 */
}

.title-area { }
.dungeon-title { font-size: 22px; color: #ffd700; margin: 0 0 6px 0; }
.weather-line { font-size: 9px; color: #b89aa5; display: flex; align-items: center; gap: 6px; }

.floor-progress { min-width: 180px; text-align: right; }
.floor-progress span { font-size: 10px; }
.progress-bar { height: 8px; background: #3a2a2a; border-radius: 4px; overflow: hidden; margin-top: 5px; width: 100%; }
.fill { height: 100%; background: #ffd700; transition: width 0.3s; }

.main-area { display: flex; gap: 20px; flex: 1; min-height: 0; }

.companions-section {
  width: 200px;
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.tavern-section {
  flex: 1;
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.section-label { font-size: 10px; color: #ffd700; display: flex; align-items: center; gap: 6px; margin: 0; }
.companion-avatars { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.companion-item { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
.companion-item:hover { transform: scale(1.1); }
.companion-img { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #b89a6a; object-fit: cover; }
.companion-icon { font-size: 28px; color: #ffd700; }
.companion-name { font-size: 8px; margin-top: 4px; color: #ffd; }

.chat-box {
  flex: 1;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
  padding: 10px;
  overflow-y: auto;
  font-size: 9px;
  line-height: 1.8;
  max-height: 220px;
}
.chat-msg { margin-bottom: 6px; }
.chat-msg.user { color: #cce5ff; }
.chat-msg.ai { color: #ffd9b3; }

.chat-input-row { display: flex; gap: 8px; margin-top: auto; }
.chat-input {
  flex: 1;
  background: rgba(0,0,0,0.5);
  border: 1px solid #b89a6a;
  color: #ffd;
  padding: 6px 10px;
  font-size: 9px;
  border-radius: 8px;
  font-family: 'Press Start 2P', cursive;
}

.actions { display: flex; flex-direction: column; gap: 12px; }
.main-actions { display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; }
.sub-actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
.pixel-btn.small { font-size: 8px; padding: 6px 12px; }
.pixel-btn.primary { background: rgba(255,215,0,0.2); border-color: #ffd700; }
.cooldown { color: #f44336; font-size: 10px; text-align: center; }

/* 地图视图 */
.map-view { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.map-header { margin-bottom: 20px; }
.map-desc { font-size: 10px; color: #b89aa5; }
.map-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; }
.map-room {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,215,0,0.2);
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s;
}
.map-room:hover { background: rgba(255,215,0,0.1); }
.map-room.explored { border-color: #ffd700; }
.room-label { font-size: 9px; display: block; margin-top: 8px; }
/* 之前的样式保持，额外添加以下 */
.camp-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  flex: 1;
  min-height: 0;
}

.campfire-area {
  text-align: center;
}

/* 篝火动画 */
/* 篝火容器 */
.campfire {
  position: relative;
  width: 80px;
  height: 120px;
  margin: 0 auto 10px;
}

/* 木柴 */
.logs {
  position: absolute;
  bottom: 0;
  left: 10px;
  width: 60px;
  height: 20px;
  background: #5d3a1a;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(255, 120, 0, 0.4);
}
.logs::after {
  content: '';
  position: absolute;
  top: -3px;
  left: 5px;
  width: 50px;
  height: 6px;
  background: #3a1e0a;
  border-radius: 2px;
}

/* 火焰粒子 */
.fire {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 60px;
}

.fire-particle {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 8px;
  height: 20px;
  background: #ff6600;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  transform-origin: center bottom;
  animation: flicker 0.8s infinite alternate;
  opacity: 0.9;
}

.fire-particle:nth-child(1) { margin-left: -12px; animation-delay: 0s; height: 25px; background: #ffaa00; }
.fire-particle:nth-child(2) { margin-left: -4px; animation-delay: 0.2s; height: 30px; background: #ff8800; }
.fire-particle:nth-child(3) { margin-left: 4px; animation-delay: 0.4s; height: 28px; background: #ff6600; }
.fire-particle:nth-child(4) { margin-left: 12px; animation-delay: 0.6s; height: 22px; background: #ff4400; }

@keyframes flicker {
  0% { transform: scaleY(1) translateY(0); opacity: 0.8; }
  100% { transform: scaleY(1.3) translateY(-5px); opacity: 1; }
}

.campfire-hint {
  font-size: 9px;
  color: #b89aa5;
}
</style>