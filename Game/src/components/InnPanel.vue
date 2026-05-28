<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <div class="icon-wrapper">
        <Icon icon="mdi:bed" class="main-icon" />
      </div>
      <h2>旅馆</h2>
      <p class="desc">休息一晚，完全恢复体力，并将此地设为重生点。</p>
      <div class="price-tag">
        <Icon icon="mdi:cash-multiple" /> 50 G
      </div>
      <div class="actions">
        <button class="pixel-btn primary" @click="rest">
          <Icon icon="mdi:bed" /> 休息至次日早晨
        </button>
        <button class="pixel-btn" @click="$emit('close')">
          <Icon icon="mdi:exit-to-app" /> 离开
        </button>
      </div>
      <p v-if="successMsg" class="success-msg">{{ successMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close'])
const successMsg = ref('')

function rest() {
  if (store.player.gold < 50) {
    successMsg.value = '金币不足！'
    setTimeout(() => successMsg.value = '', 2000)
    return
  }
  
  store.addGold(-50)
  store.player.hp = store.player.maxHp
  store.player.mp = store.player.maxMp
  
  // 计算从当前时间到次日早晨6:00需要经过的分钟数
  const currentMinutes = store.world.gameTime
  const minutesUntil6am = (24 * 60 - currentMinutes) + 6 * 60
  store.advanceTime(minutesUntil6am)
  
  store.setRespawnPoint(store.world.currentBiome, store.world.playerX, store.world.playerY)
  
  successMsg.value = '你睡了一觉，精力充沛！'
  setTimeout(() => {
    successMsg.value = ''
    emit('close')
  }, 1500)
}
</script>

<style scoped>
/* 样式保持不变，之前已提供 */
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(10px);
  display: flex; justify-content: center; align-items: center;
  z-index: 300;
}
.panel {
  background: rgba(15,25,45,0.9);
  backdrop-filter: blur(20px);
  border: 2px solid #b89a6a;
  border-radius: 24px;
  padding: 30px;
  text-align: center;
  min-width: 300px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
}
.icon-wrapper {
  background: rgba(255,215,0,0.1);
  width: 80px; height: 80px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.main-icon { font-size: 40px; color: #ffd700; }
.desc { font-size: 10px; line-height: 1.6; margin-bottom: 20px; opacity: 0.9; }
.price-tag {
  font-size: 12px;
  background: rgba(255,255,255,0.1);
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pixel-btn.primary {
  background: rgba(255,215,0,0.2);
}
.success-msg {
  margin-top: 15px;
  font-size: 10px;
  color: #4caf50;
}
</style>