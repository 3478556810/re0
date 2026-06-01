<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      <h2><Icon icon="mdi:castle" /> 选择地下城</h2>

      <div v-if="dungeonList.length === 0" class="empty">
        暂无可用地下城，请在开发者面板配置
      </div>

      <div
        v-for="dg in dungeonList"
        :key="dg.id"
        class="dungeon-card"
        @click="selectDungeon(dg.id)"
      >
        <div class="name">{{ dg.name }}</div>
        <div class="info">
          <Icon icon="mdi:stairs" /> {{ dg.maxFloors }} 层
          <span v-if="isCoolingDown(dg.id)" class="cooldown">
            · 冷却中 ({{ cooldownDays(dg.id) }}天)
          </span>
        </div>
      </div>

      <button class="pixel-btn" @click="$emit('close')">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close', 'select'])

const dungeonList = computed(() => {
  const configs = store.config.dungeonConfigs || {}
  return Object.keys(configs).map(id => ({
    id,
    ...configs[id]
  }))
})

function isCoolingDown(dungeonId) {
  const dg = store.config.dungeonConfigs[dungeonId]
  if (!dg || !store.dungeon.lastRetreatDay) return false
  const cooldown = dg.cooldown || 0
  return store.world.day < store.dungeon.lastRetreatDay + cooldown
}

function cooldownDays(dungeonId) {
  const dg = store.config.dungeonConfigs[dungeonId]
  if (!dg) return 0
  const nextDay = (store.dungeon.lastRetreatDay || 0) + (dg.cooldown || 0)
  return nextDay - store.world.day
}

function selectDungeon(id) {
  // 尝试开始地下城，失败则提示
  if (store.startDungeon(id)) {
    emit('select', id)
  } else {
    showToast('地下城冷却中或无法进入')
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; justify-content: center; align-items: center;
  z-index: 250;
}

.panel {
  width: 380px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  background: rgba(20,28,40,0.95);
  border: 2px solid #b89a6a;
  border-radius: 20px;
  padding: 20px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
}

h2 {
  font-size: 14px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dungeon-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,215,0,0.3);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.dungeon-card:hover {
  background: rgba(255,215,0,0.15);
}

.name {
  font-size: 11px;
  margin-bottom: 6px;
  color: #ffd;
}

.info {
  font-size: 9px;
  color: #b89aa5;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cooldown {
  color: #f44336;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #888;
  font-size: 10px;
}

.pixel-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.1);
  border: 1px solid #b89a6a;
  color: #ffd;
  font-family: 'Press Start 2P';
  font-size: 9px;
  cursor: pointer;
  border-radius: 8px;
  margin-top: 10px;
}
.pixel-btn:hover { background: rgba(255,215,0,0.15); }
</style>