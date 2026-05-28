<template>
  <div class="result-overlay" @click.self="$emit('close')">
    <div class="result-panel pixel-panel">
      <h2>🏆 战斗胜利！</h2>
      <div class="exp-bar">
        <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
        <span>{{ expGained }} EXP</span>
      </div>
      <div class="gold">💰 {{ goldGained }} G</div>
      <div v-if="materials.length" class="materials">
        <span v-for="m in materials" :key="m.id">📦 {{ m.name }} x1</span>
      </div>
      <button class="pixel-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({ reward: Object })
const emit = defineEmits(['close'])

const expGained = ref(0)
const expTarget = props.reward.exp || 0
const goldGained = props.reward.gold || 0
const materials = props.reward.materials || []
const expPercent = computed(() => Math.min(100, (expGained.value / expTarget) * 100))

onMounted(() => {
  // 经验值滚动动画
  let step = 0
  const interval = setInterval(() => {
    step += Math.ceil(expTarget / 20)
    if (step >= expTarget) {
      step = expTarget
      clearInterval(interval)
    }
    expGained.value = step
  }, 50)
})
</script>

<style scoped>
.result-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.result-panel {
  padding: 30px; text-align: center; min-width: 300px;
}
.exp-bar {
  background: #603020; height: 24px; border-radius: 12px;
  position: relative; margin: 20px 0;
}
.exp-fill {
  background: #4caf50; height: 100%; border-radius: 12px; transition: width 0.1s linear;
  width: 0;
}
.exp-bar span {
  position: absolute; top: 0; left: 0; right: 0;
  text-align: center; line-height: 24px; font-size: 10px; color: #ffd;
}
.gold { font-size: 12px; margin: 10px 0; }
.materials { margin: 10px 0; font-size: 10px; }
.materials span { display: block; margin: 4px 0; }
</style>