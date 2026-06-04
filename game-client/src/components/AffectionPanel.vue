<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      <button class="close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" />
      </button>
      
      <h2><Icon icon="mdi:heart" /> 羁绊</h2>
      
      <div class="char-list">
        <div
          v-for="char in characters"
          :key="char.id"
          class="char-card"
          :class="{ locked: !isUnlocked(char.id) }"
        >
          <!-- 未解锁：剪影 -->
          <div v-if="!isUnlocked(char.id)" class="char-silhouette">
            <Icon icon="mdi:account-question" />
          </div>
          <!-- 已解锁：立绘 -->
          <img v-else :src="'/images/portrait/' + char.portrait" class="char-portrait" />
          
          <div class="char-name">{{ isUnlocked(char.id) ? char.name : '？？？' }}</div>
          
          <!-- 心形：只显示填充数量，不显示数字 -->
          <div class="hearts">
            <span v-for="i in 5" :key="i" class="heart" :class="{ filled: i <= store.getAffectionLevel(char.id) && isUnlocked(char.id) }">
              ♥
            </span>
          </div>
          
          <!-- 模糊称号（已解锁时显示） -->
          <div class="char-title">{{ isUnlocked(char.id) ? store.getAffectionTitle(char.id) : '尚未相遇' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { defaultCharacters } from '../config/characters'

const store = useGameStore()
const emit = defineEmits(['close'])

const characters = computed(() => {
  return Object.values(defaultCharacters).filter(c => c.id !== 'hero')
})
function isUnlocked(charId) {
  const val = store.affection[charId]
  return typeof val === 'number' && val > 0
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; justify-content: center; align-items: center;
  z-index: 200;
}

.panel {
  width: 500px; max-width: 90vw; max-height: 85vh;
  padding: 24px; overflow-y: auto;
}

.close-btn {
  position: absolute; top: 15px; right: 15px;
  background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer;
}

h2 {
  font-size: 14px; margin-bottom: 20px;
  display: flex; align-items: center; gap: 10px;
  color: #ffd700;
}

.char-list {
  display: flex; flex-direction: column; gap: 15px;
}

.char-card {
  display: flex; align-items: center; gap: 15px;
  background: rgba(0,0,0,0.3); border: 1px solid rgba(255,215,0,0.2);
  border-radius: 16px; padding: 12px;
}

.char-card.locked {
  opacity: 0.6;
  border-color: rgba(255,255,255,0.1);
}

.char-portrait {
  width: 80px; height: 100px;
  object-fit: cover; border-radius: 8px;
  border: 2px solid #b89a6a;
}

.char-silhouette {
  width: 80px; height: 100px;
  background: rgba(0,0,0,0.5);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 40px; color: #555;
}

.char-name {
  font-size: 10px; color: #ffd;
  min-width: 60px;
}

.hearts {
  display: flex; gap: 3px;
}

.heart {
  font-size: 16px;
  color: #555;
}

.heart.filled {
  color: #ff4081;
}



.char-title {
  font-size: 7px; color: #b89aa5;
  font-style: italic;
}


.heart {
  font-size: 20px;
  color: #555;          /* 未填充灰色 */
}

.heart.filled {
  color: #ff4081;       /* 填充红色 */
}
</style>