<template>
  <div class="player-wrapper">
    <!-- 玩家立绘（绝对定位，自由移动） -->
    <div class="player-sprite-container">
      <div
        class="player-sprite"
        :class="{ 'player-hit': playerHit, 'flash-white': playerFlash }"
        :style="{ transform: `translateX(${playerShakeX}px)` }"
      >
        <!-- ★ 直接渲染立绘，不再依赖 customImg -->
        <img
          v-if="!imageError"
          :src="currentPlayerPortrait"
          class="big-sprite-img"
          :class="{ damaged: isHurt, attacking: isPlayerAttacking }"
          @error="onImageError"
        />
        <Icon v-else icon="mdi:account" class="big-sprite" />
      </div>
    </div>

    <!-- 底部横向区域（状态卡） -->
    <div class="player-bottom-area">
      <div class="player-status-card">
        <div class="name-box">{{ playerStats.name }}</div>

        <div class="effect-icons" v-if="playerEffects.length">
          <div
            v-for="eff in playerEffects"
            :key="eff.type"
            class="effect-badge"
            :title="getEffectTooltip(eff, playerStats.maxHp)"
            @click="$emit('show-effect-bubble', eff, playerStats.maxHp, $event)"
            @touchstart.prevent="$emit('show-effect-bubble', eff, playerStats.maxHp, $event)"
          >
            <Icon :icon="getEffectIcon(eff.type)" />
            <div class="effect-info">
              <span class="effect-dur">T{{ eff.duration }}</span>
              <span class="effect-stacks" v-if="eff.stacks > 1">x{{ eff.stacks }}</span>
            </div>
          </div>
        </div>

        <div class="level-tag">Lv.{{ playerStats.level }}</div>

        <div class="bar-row">
          <span class="bar-text">HP</span>
          <div class="hp-bar">
            <div v-if="playerShield > 0" class="shield-fill" :style="{ width: (playerShield / playerStats.maxHp) * 100 + '%' }"></div>
          <div class="hp-fill" :style="{ width: (displayHp / playerStats.maxHp) * 100 + '%' }"></div>
          <span>{{ Math.floor(displayHp) }} / {{ playerStats.maxHp }}</span>
          </div>
        </div>

        <div class="bar-row">
          <span class="bar-text">MP</span>
          <div class="mp-bar">
            <div class="mp-fill" :style="{ width: (playerMp / playerMaxMp) * 100 + '%' }"></div>
            <span>{{ playerMp }} / {{ playerMaxMp }}</span>
          </div>
        </div>

        <div class="bar-row">
          <span class="bar-text">EXP</span>
          <div class="exp-bar">
            <div class="exp-fill" :style="{ width: displayExpPercent + '%' }"></div>
            <span>{{ displayExp }} / {{ nextLevelExp }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 伙伴卡片（固定右下角，不变） -->
    <div v-if="companion" class="companion-card">
      <div class="companion-strategy">
<button 
  class="pixel-btn micro" 
  @click="toggleCompanionStrategy"
>
  <Icon :icon="strategyIcon" /> {{ strategyLabel }}
</button>
</div>
      <img
        v-if="getCompanionImage && getCompanionImage()"
        :src="getCompanionImage()"
        class="companion-portrait"
      />
      <Icon v-else :icon="companion.icon || 'mdi:account-heart'" class="companion-icon" />
      <div class="companion-info">
        <div class="companion-name">{{ companion.name }} Lv.{{ companion.level }}</div>

        <div class="companion-effects" v-if="companionEffects.length">
          <div
            v-for="eff in companionEffects"
            :key="eff.type + '-' + (eff.animKey || 0)"
            class="effect-badge"
            :title="getEffectTooltip(eff, companion.maxHp)"
            @click="$emit('show-effect-bubble', eff, companion.maxHp, $event)"
            @touchstart.prevent="$emit('show-effect-bubble', eff, companion.maxHp, $event)"
          >
            <Icon :icon="getEffectIcon(eff.type)" />
            <div class="effect-info">
              <span class="effect-dur">T{{ eff.duration }}</span>
              <span class="effect-stacks" v-if="eff.stacks > 1">x{{ eff.stacks }}</span>
            </div>
          </div>
        </div>

        <div class="bar-row">
          <span class="bar-text">HP</span>
          <div class="hp-bar small-bar">
            <div class="hp-fill" :style="{ width: companionHpPercent + '%' }"></div>
          <span>{{ Math.floor(companion.hp) }} / {{ Math.floor(companion.maxHp) }}</span>
          </div>
        </div>

        <div class="bar-row">
          <span class="bar-text">MP</span>
          <div class="mp-bar small-bar">
            <div class="mp-fill" :style="{ width: companionMpPercent + '%' }"></div>
            <span>{{ companionMp }} / {{ companionMaxMp }}</span>
          </div>
        </div>

        <div class="bar-row" v-if="companionExpPercent !== undefined">
          <span class="bar-text">EXP</span>
          <div class="exp-bar small-bar">
            <div class="exp-fill" :style="{ width: companionExpPercent + '%' }"></div>
            <span>{{ companionExp }} / {{ companionNextExp }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { getEffectIcon, getEffectTooltip } from '@/composables/useBattleHelpers'
import { onBeforeUnmount } from 'vue'  // 如果顶部没有导入，需要加上

import { useGameStore } from '@/store/gameStore'

const store = useGameStore()


const props = defineProps({
  playerStats: Object,
  playerShield: Number,
  playerEffects: Array,
  companion: Object,
  companionHpPercent: Number,
  companionMp: { type: Number, default: 0 },
  companionMaxMp: { type: Number, default: 0 },
  companionExp: { type: Number, default: 0 },
  companionNextExp: { type: Number, default: 0 },
  companionExpPercent: { type: Number, default: 0 },
  playerHpPercent: Number,
  playerMp: Number,
  playerMaxMp: Number,
  displayExp: Number,
  nextLevelExp: Number,
  displayExpPercent: Number,
  getCompanionImage: Function,
  isPlayerAttacking: { type: Boolean, default: false },  // ★ 必须声明
})

defineEmits(['show-effect-bubble'])

const imageError = ref(false)

function onImageError() {
  imageError.value = true
}

// 伙伴MP百分比
const companionMpPercent = computed(() => {
  if (!props.companionMaxMp || props.companionMaxMp === 0) return 0
  return (props.companionMp / props.companionMaxMp) * 100
})

// 伙伴效果过滤
const companionEffects = computed(() => {
  const comp = props.companion
  if (!comp || !comp.effects) return []
  return comp.effects.filter(e => e.duration > 0)
})

// 玩家血量百分比
const playerHpPercentVal = computed(() => {
  return props.playerStats.hp / props.playerStats.maxHp
})

// 是否残血
const isHurt = computed(() => playerHpPercentVal.value < 0.5)

// 当前玩家立绘路径（攻击优先 > 残血 > 战损 > 正常）
const currentPlayerPortrait = computed(() => {
  if (props.isPlayerAttacking) return '/images/player/attack.png'
  if (playerHpPercentVal.value < 0.2) return '/images/player/defeated.png'
  if (playerHpPercentVal.value < 0.5) return '/images/player/damaged.png'
  return '/images/player/normal.png'
})

// 受击动画状态
const playerHit = ref(false)
const playerFlash = ref(false)
const playerShakeX = ref(0)




const displayHp = ref(props.playerStats.hp)
let hpAnimTimer = null

watch(() => props.playerStats.hp, (newHp, oldHp) => {
  if (newHp < oldHp) {
    // 血量减少时，启动平滑动画
    const duration = 3000
    const startHp = oldHp
    const endHp = newHp
    const startTime = Date.now()
    if (hpAnimTimer) clearInterval(hpAnimTimer)
    hpAnimTimer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      displayHp.value = Math.floor(startHp + (endHp - startHp) * progress)
      if (progress >= 1) {
        clearInterval(hpAnimTimer)
        hpAnimTimer = null
        displayHp.value = endHp
      }
    }, 16)
  } else {
    // 血量增加或不变时，立即更新
    displayHp.value = newHp
    if (hpAnimTimer) { clearInterval(hpAnimTimer); hpAnimTimer = null }
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (hpAnimTimer) clearInterval(hpAnimTimer)
})

const companionStrategy = computed({
  get: () => store.companionStrategy,
  set: (val) => { store.companionStrategy = val }
})

const strategyLabel = computed(() => {
  switch (companionStrategy.value) {
    case 'free': return '自由行动'
    case 'heal': return '优先治疗'
    case 'attack': return '全力输出'
  }
})

const strategyIcon = computed(() => {
  switch (companionStrategy.value) {
    case 'free': return 'mdi:auto-fix'
    case 'heal': return 'mdi:heart-pulse'
    case 'attack': return 'mdi:sword-cross'
  }
})

function toggleCompanionStrategy() {
  if (store.companionStrategy === 'free') store.companionStrategy = 'heal'
  else if (store.companionStrategy === 'heal') store.companionStrategy = 'attack'
  else store.companionStrategy = 'free'
  store.save()
  // 不需要手动同步引擎，因为 useBattleState 中的 sync 会自动应用新策略
}

let lastHp = props.playerStats.hp
watch(() => props.playerStats.hp, (newHp, oldHp) => {
  if (newHp < oldHp) {
    playerHit.value = true
    playerFlash.value = true
    playerShakeX.value = -6
    setTimeout(() => {
      playerHit.value = false
      playerFlash.value = false
      playerShakeX.value = 0
    }, 200)
  }
  lastHp = newHp
}, { immediate: false })




</script>

<style scoped>
/* ========== 玩家容器 ========== */
.player-wrapper {
  position: absolute;
  bottom: 5%;
  left: 2%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  z-index: 20;
}

/* ========== 玩家立绘容器（绝对定位，自由移动） ========== */
.player-sprite-container {
  position: absolute;
  /* 移动立绘：修改 bottom 和 left 的值 */
  bottom: 28vh;   /* 立绘向上偏移，可根据需要调整 */
  left: 15vh;      /* 立绘向右偏移 */
width: 120px;
  height: 220px;
  pointer-events: none; /* 点击穿透，不影响下方按钮 */
}

.player-sprite {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5));
  transition: filter 0.2s;
}

.big-sprite-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.big-sprite {
  font-size: 280px;
  color: #ffd;
}

/* 战损立绘抖动效果 */
.big-sprite-img.damaged {
  animation: hurtPulse 1s infinite alternate;
}

@keyframes hurtPulse {
  0% { filter: brightness(1) saturate(1); }
  100% { filter: brightness(0.8) saturate(0.5); }
}

/* ========== 底部状态卡（保持原样） ========== */
.player-bottom-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-top: 30px; /* 让状态卡与立绘拉开距离 */
}

/* 以下样式保持你原来的 player-status-card、effect-badge 等不变，省略以节省篇幅 */
/* ... */

/* ========== 伙伴卡片（固定右下角） ========== */
.companion-card {
  position: fixed;
  bottom: 2%;
  right: 20px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  border: 2px solid #b89a6a;
  border-radius: 12px;
  padding: 8px 14px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  min-width: 170px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

/* 伙伴头像等样式保持不变 */
.companion-portrait {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffd700;
}

.companion-icon {
  font-size: 32px;
  color: #ffd700;
}

.companion-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.companion-name {
  font-size: 9px;
  color: #ffd966;
  margin-bottom: 2px;
  text-shadow: 1px 1px 0 #000;
}

.small-bar {
  height: 10px;
  width: 100px;
}

/* 受击动画 */
.flash-white {
  animation: hitFlashShake 0.2s ease-out;
}

@keyframes hitFlashShake {
  0% { filter: brightness(1); transform: translateX(0); }
  20% { filter: brightness(2.5); transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
  100% { filter: brightness(1); transform: translateX(0); }
}

/* 玩家攻击动画（与怪物完全一致） */
.big-sprite-img.attacking {
  animation: playerAttackLunge 0.8s ease-in-out;
}

@keyframes playerAttackLunge {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.15) translateX(-8px); }
  60%  { transform: scale(1.1) translateX(-4px); }
  100% { transform: scale(1); }
}
</style>