<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="dungeon-panel">
      <!-- Boss 快速挑战卡片栏：只显示已通关的Boss楼层，卡片式标签 -->
      <div class="boss-sidebar" v-if="defeatedBossFloors.length > 0">
        <div
          v-for="bossFloor in defeatedBossFloors"
          :key="bossFloor"
          class="boss-card"
          @click="goToDungeonFloor(bossFloor)"
        >
          <div class="boss-card-icon">
            <Icon icon="mdi:skull" />
          </div>
          <div class="boss-card-info">
            <span class="boss-floor">{{ bossFloor }}F</span>
            <span class="boss-label">首领</span>
          </div>
        </div>
      </div>
      <div v-else class="boss-sidebar-empty">
        <!-- 无通关Boss时的占位（可选） -->
      </div>

      <div class="main-area">
        <div class="top-bar">
          <h2 class="title">{{ dungeonName }}</h2>
          <button class="close-btn" @click="$emit('close')">
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div class="info-row">
          <span>{{ weather }} · {{ dateStr }}</span>
          <span>第 {{ store.dungeon.currentFloor }} / {{ store.dungeon.maxFloors }} 层</span>
        </div>

        <div class="progress-bar">
          <div class="fill" :style="{ width: progressPercent + '%' }"></div>
        </div>

        <div class="content">
          <div class="companions">
            <div v-for="c in companions" :key="c.id" class="companion-item" @click="talkToCompanion(c)">
              <img v-if="c.image" :src="c.image" class="companion-img" />
              <Icon v-else :icon="c.icon || 'mdi:account-heart'" class="companion-icon" />
              <span class="companion-name">{{ c.name }}</span>
            </div>
          </div>

          <div class="actions">
            <div class="main-actions">
              <button class="pixel-btn primary" @click="explore">
                探索
              </button>
              <button class="pixel-btn" @click="rest">
                休息 (50G)
              </button>
              <button class="pixel-btn" @click="retreat" v-if="canRetreat">
                撤退
              </button>
            </div>
            <div class="sub-actions">
              <button class="pixel-btn small" @click="showDungeonElevator = true" v-if="elevatorFloors.length > 0">
                电梯
              </button>
              <button class="pixel-btn small" @click="showLocalDungeonSelect = true">
                切换
              </button>
              <button class="pixel-btn small" @click="$emit('openInventory')">
                背包
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内置地下城选择面板 -->
    <div v-if="showLocalDungeonSelect" class="modal-overlay" @click.self="showLocalDungeonSelect = false">
      <div class="modal-box">
        <h2>选择地下城</h2>
        <div v-for="dg in availableDungeons" :key="dg.id" class="dungeon-card" @click="switchToDungeon(dg.id)">
          <div class="name">{{ dg.name }}</div>
          <div class="info">{{ dg.maxFloors }} 层</div>
        </div>
        <button class="pixel-btn" @click="showLocalDungeonSelect = false">关闭</button>
      </div>
    </div>

    <!-- 电梯面板 -->
    <div v-if="showDungeonElevator" class="modal-overlay" @click.self="showDungeonElevator = false">
      <div class="modal-box">
        <h3>快速跳层</h3>
        <div class="elevator-list">
          <button
            v-for="floor in elevatorFloors"
            :key="floor"
            class="pixel-btn elevator-btn"
            @click="goToDungeonFloor(floor)"
          >
            第 {{ floor }} 层
          </button>
        </div>
        <button class="pixel-btn" @click="showDungeonElevator = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { DUNGEONS } from '../config/dungeonConfig'
import { defaultCharacters } from '../config/characters'

const store = useGameStore()
const emit = defineEmits(['close', 'startBattle', 'triggerStory', 'openInventory'])
const showToast = inject('showToast', (msg) => alert(msg))

const showLocalDungeonSelect = ref(false)
const showDungeonElevator = ref(false)

// 可用地下城列表
const availableDungeons = computed(() => {
  const configs = store.config.dungeonConfigs || {}
  return Object.keys(configs).map(id => ({ id, ...configs[id] }))
})

function switchToDungeon(id) {
  if (store.startDungeon(id)) {
    showLocalDungeonSelect.value = false
  } else {
    showToast('该地下城暂时无法进入')
  }
}

const dungeonName = computed(() => {
  const id = store.dungeon.currentDungeon || store.dungeon.lastDungeonId
  return DUNGEONS[id]?.name || '神秘地下城'
})
const canRetreat = computed(() => store.dungeon.active && store.dungeon.currentFloor > 1)
const progressPercent = computed(() => Math.round((store.dungeon.currentFloor / store.dungeon.maxFloors) * 100))

// 电梯楼层：6/11/16/21... 降序
const elevatorFloors = computed(() => {
  const unlocked = store.dungeon.unlockedFloors || []
  return unlocked
    .filter(f => f % 5 === 1 && f > 5)
    .sort((a, b) => b - a)
})

// ✅ 已通关的Boss楼层（用于左侧卡片栏）
// 需要依赖 store.dungeon.defeatedBossFloors 数组，在战斗胜利时记录
// 已通关的Boss楼层（用于左侧卡片栏）
const defeatedBossFloors = computed(() => {
  const unlocked = store.dungeon.unlockedFloors || []
  const maxFloor = Math.max(...unlocked, 1)
  const result = []
  for (let i = 5; i < maxFloor; i += 5) {
    result.push(i)
  }
  return result
})

const weatherPool = ['晴', '阴', '小雨', '雾', '微风']
const weather = computed(() => weatherPool[Math.floor(Math.random() * weatherPool.length)])
const dateStr = computed(() => `第${store.world.day}天 ${formatTime(store.world.gameTime)}`)
function formatTime(min) { const h = Math.floor(min / 60), m = min % 60; return `${h}:${m.toString().padStart(2, '0')}` }

const companions = computed(() => {
  const chars = store.config?.characters || defaultCharacters
  return Object.values(chars).filter(c => c.id !== 'hero' && c.name)
})

function goToDungeonFloor(floor) {
  store.dungeon.currentFloor = floor
  showDungeonElevator.value = false
  explore()
}

function explore() {
  if (store.player.hp <= 0) {
    store.player.hp = store.player.maxHp
    store.player.mp = store.player.maxMp
  }
  store.dungeon.lastDungeonId = store.dungeon.currentDungeon
  store.save()
  const floor = store.dungeon.currentFloor
  const dg = DUNGEONS[store.dungeon.currentDungeon]
  const storyId = dg?.storyByFloor?.[floor]
  if (storyId && !store.dungeon.storyTriggered?.[floor]) {
    if (!store.dungeon.storyTriggered) store.dungeon.storyTriggered = {}
    store.dungeon.storyTriggered[floor] = true
    emit('triggerStory', storyId)
    return
  }
  const monsters = store.getRandomMonsterForFloor()
  if (monsters && monsters.length > 0) {
    store.dungeon.isDungeonBattle = true
    emit('startBattle', monsters)
  }
}

function rest() {
  if (store.player.gold >= 50) {
    store.addGold(-50)
    store.player.hp = store.player.maxHp
    store.player.mp = store.player.maxMp
    store.save()
    showToast('在篝火旁小憩片刻，体力恢复了。')
  } else showToast('金币不足。')
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
    showToast(`与${char.name}简短交谈，她微笑着鼓励你继续前进。`)
  }
}
</script>

<style scoped>
/* ========== 全屏覆盖层 ========== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 0;
}

/* ========== 地下城面板 —— 手机横屏全屏 ========== */
.dungeon-panel {
  width: 100vw;
  height: 100vh;
  background: rgba(20, 28, 40, 0.95);
  backdrop-filter: blur(15px);
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  display: flex;
  flex-direction: row;
  position: relative;
  overflow: hidden;
}

/* ========== Boss 卡片栏（左侧，卡片式美观标签） ========== */
.boss-sidebar {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
  max-height: 80vh;
  overflow-y: auto;
  padding: 4px 0;
  scrollbar-width: thin;
}
.boss-sidebar::-webkit-scrollbar {
  width: 3px;
}
.boss-sidebar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.3);
  border-radius: 3px;
}
.boss-sidebar::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 3px;
}

.boss-card {
  width: 70px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 100, 100, 0.4);
  border-radius: 16px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.boss-card:hover {
  transform: scale(1.05);
  border-color: #ff5555;
  background: rgba(255, 80, 80, 0.2);
}
.boss-card:active {
  transform: scale(0.98);
}

.boss-card-icon {
  font-size: 28px;
  color: #ff7777;
  filter: drop-shadow(0 0 4px #ff0000);
}

.boss-card-info {
  text-align: center;
}
.boss-floor {
  display: block;
  font-size: 12px;
  font-weight: bold;
  color: #ffd700;
}
.boss-label {
  display: block;
  font-size: 7px;
  color: #ffaaaa;
  margin-top: 2px;
}

.boss-sidebar-empty {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 70px;
  text-align: center;
  font-size: 7px;
  color: #888;
  pointer-events: none;
}

/* ========== 主区域 ========== */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 16px 16px 90px; /* 左侧留白，容纳卡片 */
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.title {
  font-size: clamp(14px, 4vw, 20px);
  color: #ffd700;
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  color: #ffd;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: clamp(8px, 2vw, 10px);
  color: #b89aa5;
  margin-bottom: 6px;
}
.progress-bar {
  height: 6px;
  background: #3a2a2a;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 16px;
}
.fill {
  height: 100%;
  background: #ffd700;
  transition: width 0.3s;
}
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
}
.companions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}
.companion-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.1s;
}
.companion-item:active {
  transform: scale(0.95);
}
.companion-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid #b89a6a;
  object-fit: cover;
}
.companion-icon {
  font-size: 36px;
  color: #ffd700;
}
.companion-name {
  font-size: clamp(8px, 2vw, 10px);
  margin-top: 4px;
  color: #ffd;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.main-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.sub-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pixel-btn {
  font-family: inherit;
  padding: clamp(6px, 1.5vh, 12px) clamp(12px, 4vw, 24px);
  background: #2a2a3a;
  border: 2px solid #b89a6a;
  color: #ffd;
  cursor: pointer;
  border-radius: 8px;
  font-size: clamp(8px, 2vw, 11px);
  white-space: nowrap;
}
.pixel-btn.small {
  font-size: clamp(7px, 1.8vw, 9px);
  padding: 5px 10px;
}
.pixel-btn.primary {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
}

/* 模态弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}
.modal-box {
  width: 90vw;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  background: rgba(20, 28, 40, 0.95);
  border: 2px solid #b89a6a;
  border-radius: 16px;
  padding: 20px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
}
.dungeon-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
}
.dungeon-card:active {
  background: rgba(255, 215, 0, 0.15);
}
.name {
  font-size: 12px;
  margin-bottom: 6px;
}
.info {
  font-size: 9px;
  color: #b89aa5;
}
.elevator-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
}
.elevator-btn {
  width: 100%;
}

/* 横屏适配 */
@media (max-width: 750px) and (orientation: landscape) {
  .boss-card {
    width: 60px;
    padding: 6px 2px;
  }
  .boss-card-icon {
    font-size: 24px;
  }
  .boss-floor {
    font-size: 10px;
  }
  .boss-label {
    font-size: 6px;
  }
  .main-area {
    padding-left: 80px;
  }
}
</style>