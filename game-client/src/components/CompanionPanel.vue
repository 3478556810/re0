<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <h2><Icon icon="mdi:account-group" /> 伙伴</h2>

      <!-- 当前伙伴详情 -->
      <div v-if="currentCompanion" class="companion-hero">
        <div class="companion-avatar">
          <img v-if="companionImage" :src="companionImage" class="avatar-img" />
          <Icon v-else icon="mdi:account-heart" class="avatar-placeholder" />
        </div>
        <div class="companion-main">
          <div class="companion-name">{{ currentCompanion.name }}</div>
          <div class="affection-bar">
            <span class="affection-label">好感度</span>
            <div class="affection-fill-bg">
              <div class="affection-fill" :style="{ width: affectionPercent + '%' }"></div>
            </div>
            <span class="affection-text">{{ affectionTitle }}</span>
          </div>
          <!-- 出战开关 -->
          <div class="companion-toggle">
            <span class="toggle-label">出战状态</span>
            <button
              :class="['toggle-btn', { active: companionActive }]"
              @click="toggleCompanionActive"
            >
              <Icon :icon="companionActive ? 'mdi:check-circle' : 'mdi:close-circle'" />
              {{ companionActive ? '出战中' : '休息中' }}
            </button>
          </div>
          <div class="companion-stats">
            <div class="stat-row"><span>攻击</span><span>{{ companionStats.attack }}</span></div>
            <div class="stat-row"><span>防御</span><span>{{ companionStats.defense }}</span></div>
            <div class="stat-row"><span>生命</span><span>{{ companionStats.hp }}</span></div>
            <div class="stat-row"><span>速度</span><span>{{ companionStats.speed }}</span></div>
          </div>
        </div>
      </div>
      <div v-else class="empty">尚未选择伙伴</div>

      <!-- 伙伴列表 -->
      <div class="section" v-if="companionList.length > 0">
        <h3><Icon icon="mdi:swap-horizontal" /> 切换伙伴</h3>
        <div class="companion-grid">
          <div
            v-for="comp in companionList"
            :key="comp.id"
            class="companion-card"
            :class="{ active: comp.id === store.player.currentCompanion, inactive: !companionActive && comp.id === store.player.currentCompanion }"
            @click="selectCompanion(comp.id)"
          >
            <Icon :icon="comp.icon || 'mdi:account'" class="comp-icon" />
            <span class="comp-name">{{ comp.name }}</span>
            <span v-if="comp.id === store.player.currentCompanion" class="current-tag">当前</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close'])

const companionList = computed(() => {
  const chars = store.config.characters || {}
  return Object.values(chars).filter(c => c.id !== 'player')
})

const currentCompanion = computed(() => {
  const id = store.player.currentCompanion
  if (!id) return null
  return store.config.characters?.[id] || null
})

const companionActive = computed(() => store.player.companionActive !== false)

const affectionLevel = computed(() => store.getAffectionLevel(currentCompanion.value?.id || ''))
const affectionTitle = computed(() => store.getAffectionTitle(currentCompanion.value?.id || ''))
const affectionPercent = computed(() => Math.min(100, affectionLevel.value * 20))

const companionStats = computed(() => {
  const comp = currentCompanion.value
  if (!comp) return { attack: 0, defense: 0, hp: 0, speed: 0 }
  const stats = store.playerStats
  const lv = affectionLevel.value
  return {
    attack: Math.floor(stats.attack * 0.7 + lv * 20),
    defense: Math.floor(stats.defense * 0.8),
    hp: Math.floor(stats.maxHp * 0.8 + lv * 50),
    speed: stats.speed + 5
  }
})

const companionImage = computed(() => {
  const comp = currentCompanion.value
  if (!comp?.portrait) return null
  return `/images/portrait/${comp.portrait}`
})

function selectCompanion(id) {
  store.player.currentCompanion = id
  store.player.companionActive = true  // 切换伙伴时默认出战
  store.save()
}

function toggleCompanionActive() {
  store.player.companionActive = !(store.player.companionActive !== false)
  store.save()
}
</script>

<style scoped>
/* 保留原有所有样式不变，新增以下样式 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 90vw; max-width: 480px; max-height: 85vh; background: rgba(15,25,45,0.95); border: 2px solid #b89a6a; border-radius: 20px; padding: 20px; color: #ffd; font-family: 'Press Start 2P', cursive; overflow-y: auto; position: relative; }
.close-btn { position: absolute; top: 12px; right: 12px; background: none; border: none; color: #ffd; font-size: 18px; cursor: pointer; }
h2 { font-size: 14px; color: #ffd700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

.companion-hero { display: flex; gap: 16px; margin-bottom: 20px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,215,0,0.2); border-radius: 16px; padding: 16px; }
.companion-avatar { width: 80px; height: 80px; border-radius: 16px; border: 2px solid #b89a6a; overflow: hidden; background: rgba(0,0,0,0.4); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { font-size: 40px; color: #b89a6a; }
.companion-main { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.companion-name { font-size: 12px; color: #ffd; font-weight: bold; }

.affection-bar { display: flex; align-items: center; gap: 8px; font-size: 7px; }
.affection-label { color: #aaa; }
.affection-fill-bg { flex: 1; height: 8px; background: #2a2a3a; border-radius: 4px; overflow: hidden; }
.affection-fill { height: 100%; background: linear-gradient(90deg, #ff69b4, #ff1493); border-radius: 4px; transition: width 0.3s; }
.affection-text { color: #ff69b4; font-size: 7px; white-space: nowrap; }

/* 出战开关 */
.companion-toggle { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.toggle-label { font-size: 8px; color: #aaa; }
.toggle-btn { display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.5); border: 1px solid #555; border-radius: 8px; padding: 6px 12px; color: #aaa; font-size: 8px; font-family: 'Press Start 2P', cursive; cursor: pointer; transition: all 0.2s; }
.toggle-btn.active { background: rgba(76,175,80,0.2); border-color: #4caf50; color: #4caf50; }
.toggle-btn:hover { border-color: #ffd700; }

.companion-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 8px; }
.stat-row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.stat-row span:first-child { color: #aaa; }
.stat-row span:last-child { color: #ffd; }

.section { margin-top: 16px; }
.section h3 { font-size: 10px; color: #ccc; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.companion-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
.companion-card { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: border-color 0.2s; font-size: 8px; position: relative; }
.companion-card:hover { border-color: #ffd700; }
.companion-card.active { border-color: #ffd700; background: rgba(255,215,0,0.1); }
.companion-card.inactive { border-color: #888; opacity: 0.6; }
.comp-icon { font-size: 28px; color: #ffd700; }
.current-tag { font-size: 6px; background: #ffd700; color: #000; padding: 2px 6px; border-radius: 4px; position: absolute; top: 4px; right: 4px; }

.empty { text-align: center; color: #888; font-size: 9px; padding: 30px; }
</style>