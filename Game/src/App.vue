<template>
  <div id="game-root">
    <MainScreen
      v-if="!inBattle"
      @start-battle="onStartBattle"
    />
    <BattleScene
      v-else
      :enemy="currentEnemy"
      @victory="onVictory"
      @exit="inBattle = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import MainScreen from './components/MainScreen.vue'
import BattleScene from './components/BattleScene.vue'
import { useGameStore } from './store/gameStore'

const store = useGameStore()
const inBattle = ref(false)
const currentEnemy = ref(null)

// 全局时间流逝
let timeInterval
onMounted(() => {
  timeInterval = setInterval(() => {
    store.advanceTime(1)
  }, 1000)
  // 按 T 回到城镇（调试用）
  window.addEventListener('keydown', onKeyDebug)
})

onUnmounted(() => {
  clearInterval(timeInterval)
  window.removeEventListener('keydown', onKeyDebug)
})

function onKeyDebug(e) {
  if (e.key === 't' || e.key === 'T') {
    store.moveTo('town', 0, 0)
  }
}

function onStartBattle(monster) {
  currentEnemy.value = monster
  inBattle.value = true
}

function onVictory(reward) {
  store.addExperience(reward.exp)
  if (reward.materials) {
    reward.materials.forEach(m => store.addMaterial(m.id, m.name))
  }
  store.advanceTime(30)
  inBattle.value = false
}
</script>

<style scoped>
#game-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>