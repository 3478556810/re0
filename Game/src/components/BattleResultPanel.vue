<template>
  <div class="overlay" @click.self="hide">
    <div class="result-panel pixel-panel">
      <h2><Icon icon="mdi:trophy" /> 战斗胜利！</h2>
      <div class="reward-list">
        <div class="reward-row"><Icon icon="mdi:star" /> 经验值 +{{ reward.exp }}</div>
        <div v-if="reward.materials.length" class="reward-row">
          <Icon icon="mdi:package-variant-closed" />
          <span v-for="m in reward.materials" :key="m.id">{{ getMaterialName(m.id) }} x1 </span>
        </div>
        <div v-if="reward.accessories && reward.accessories.length" class="reward-row">
          <Icon icon="mdi:ring" /> 获得饰品：
          <span v-for="acc in reward.accessories" :key="acc.id" class="acc-name">{{ acc.name }}</span>
        </div>
      </div>
      <div class="buttons">
        <button class="pixel-btn" @click="$emit('next')" v-if="showDungeon">
          <Icon icon="mdi:arrow-down-bold" /> 下一层
        </button>
        <button class="pixel-btn" @click="$emit('retreat')" v-if="showDungeon">
          <Icon icon="mdi:exit-run" /> 撤退
        </button>
        <button class="pixel-btn" @click="$emit('close')" v-if="!showDungeon">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const props = defineProps({
  reward: Object,
  showDungeon: Boolean
})
const emit = defineEmits(['close', 'next', 'retreat'])

const store = useGameStore()
function getMaterialName(id) {
  return store.getMaterialName(id) // 使用 store 中的方法，确保中文
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; justify-content: center; align-items: center;
  z-index: 50;
}
.result-panel { padding: 30px; text-align: center; min-width: 320px; }
.reward-list { margin: 20px 0; font-size: 10px; display: flex; flex-direction: column; gap: 10px; }
.reward-row { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; }
.acc-name { color: #ffd700; }
.buttons { display: flex; gap: 15px; justify-content: center; }
</style>