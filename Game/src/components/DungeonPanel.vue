<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="dungeon-panel pixel-panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <div class="dungeon-bg"></div>
      <div class="dungeon-content">
        <h2 class="dungeon-title">{{ dungeonName }}</h2>
        <div class="dungeon-info">
          <p>层数：{{ store.dungeon.currentFloor }} / {{ store.dungeon.maxFloors }}</p>
          <p>已击败：{{ store.dungeon.floorsCleared }} 只</p>
        </div>

        <!-- 营地功能 -->
        <div class="camp-actions">
          <button class="pixel-btn" @click="$emit('openInventory')">
            <Icon icon="mdi:bag-personal" /> 背包
          </button>
          <button class="pixel-btn" @click="rest">
            <Icon icon="mdi:bed" /> 休息 (50G)
          </button>
        </div>

        <!-- 探索 / 撤退 -->
        <div class="dungeon-actions">
          <button class="pixel-btn primary" @click="explore">
            <Icon icon="mdi:sword-cross" /> 深入探索
          </button>
          <button class="pixel-btn" @click="retreat" v-if="canRetreat">
            <Icon icon="mdi:exit-run" /> 撤退
          </button>
        </div>
        <p v-if="cooldownMsg" class="cooldown">{{ cooldownMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { DUNGEONS } from '../config/dungeonConfig'

const store = useGameStore()
const emit = defineEmits(['close', 'startBattle', 'triggerStory', 'openInventory'])

const dungeonName = computed(() => {
  const id = store.dungeon.currentDungeon || store.dungeon.lastDungeonId
  return DUNGEONS[id]?.name || '地下城'
})

const canRetreat = computed(() => store.dungeon.active && store.dungeon.currentFloor > 1)



function explore() {
  if (!store.dungeon || !store.dungeon.currentFloor) {
    console.error('地下城状态异常，请清除存档后重试')
    return
  }
  const floor = store.dungeon.currentFloor
  const dg = DUNGEONS[store.dungeon.currentDungeon]
  const storyId = dg?.storyByFloor?.[floor]

  // 暂时屏蔽剧情，直接进入战斗

if (storyId && !store.dungeon.storyTriggered?.[floor]) {
  store.dungeon.storyTriggered[floor] = true
  emit('triggerStory', storyId)
  return
}

const monsterId = store.getRandomMonsterForFloor()
if (monsterId) {
  store.dungeon.isDungeonBattle = true
  emit('startBattle', monsterId)
}
}
function rest() {
  if (store.player.gold >= 50) {
    store.addGold(-50)
    store.player.hp = store.player.maxHp
    store.player.mp = store.player.maxMp
    store.save()
    alert('你休息了一会儿，恢复了体力。')
  } else {
    alert('金币不足！')
  }
}

function retreat() {
  store.retreat()
  emit('close')
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 200; }
.dungeon-panel {
  width: 600px; max-width: 90vw;
  padding: 30px; text-align: center;
  position: relative; overflow: hidden;
  background: rgba(15, 25, 45, 0.9); backdrop-filter: blur(20px);
  border: 2px solid #b89a6a; border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  color: #ffd; font-family: 'Press Start 2P', cursive;
}
.dungeon-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: url('/assets/dungeon_fog.png') center/cover no-repeat; opacity: 0.2;
  z-index: 0;
}
.dungeon-content { position: relative; z-index: 1; }
.close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; color: #ffd; font-size: 24px; cursor: pointer; z-index: 10; }
.dungeon-title { font-size: 24px; margin-bottom: 20px; color: #ffd700; }
.dungeon-info { margin: 20px 0; font-size: 14px; }
.dungeon-actions { display: flex; gap: 20px; justify-content: center; margin-top: 20px; }
.pixel-btn.primary { background: rgba(255,215,0,0.15); border-color: #ffd700; }
.cooldown { color: #f44336; font-size: 10px; margin-top: 15px; }
.camp-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 15px 0;
}

</style>