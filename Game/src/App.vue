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
   store.fixGhostEquipment()   // 启动时自动清理一次幽灵装备
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
  inBattle.value = false
  // 经验、材料、饰品已在 BattleScene 内部处理完毕
}
</script>

<style scoped>
#game-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>