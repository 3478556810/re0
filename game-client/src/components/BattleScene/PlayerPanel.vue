<template>
  <div class="player-wrapper">
    <!-- 玩家立绘 -->
    <div
      class="player-sprite"
      :class="{ 'player-hit': playerHit, 'flash-white': playerFlash }"
      :style="{ transform: `translateX(${playerShakeX}px)` }"
    >
      <img v-if="playerStats.customImg" :src="playerStats.customImg" class="big-sprite-img" />
      <Icon v-else icon="mdi:account" class="big-sprite" />
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
            <div class="hp-fill" :style="{ width: playerHpPercent + '%' }"></div>
            <span>{{ playerStats.hp }} / {{ playerStats.maxHp }}</span>
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

    <!-- 伙伴卡片（固定小矩形，贴底部） -->
    <div v-if="companion" class="companion-card">
      <img
        v-if="getCompanionImage && getCompanionImage()"
        :src="getCompanionImage()"
        class="companion-portrait"
      />
      <Icon v-else :icon="companion.icon || 'mdi:account-heart'" class="companion-icon" />
      <div class="companion-info">
        <div class="companion-name">{{ companion.name }}Lv.{{ companion.level }}</div>

        <!-- 伙伴效果图标 -->
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
            <span>{{ companion.hp }} / {{ companion.maxHp }}</span>
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
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { getEffectIcon, getEffectTooltip } from '@/composables/useBattleHelpers'

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
  getCompanionImage: Function
})

defineEmits(['show-effect-bubble'])

const companionMpPercent = computed(() => {
  if (!props.companionMaxMp || props.companionMaxMp === 0) return 0
  return (props.companionMp / props.companionMaxMp) * 100
})

const companionEffects = computed(() => {
  const comp = props.companion
  if (!comp || !comp.effects) return []
  return comp.effects.filter(e => e.duration > 0)
})

const playerHit = ref(false)
const playerFlash = ref(false)
const playerShakeX = ref(0)
</script>

<style scoped>
/* 伙伴卡片恢复固定小矩形（不动全局样式） */
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

/* 伙伴效果图标横排 */
.companion-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin: 2px 0;
}

/* 所有效果图标兼容电脑点击 */
.effect-badge {
  cursor: pointer;
}
</style>