<template>
  <div class="player-wrapper">
    <!-- 玩家立绘 -->
    <div class="player-sprite" :class="{ 'player-hit': playerHit, 'flash-white': playerFlash }" :style="{ transform: `translateX(${playerShakeX}px)` }">
      <img v-if="playerStats.customImg" :src="playerStats.customImg" class="big-sprite-img" />
      <Icon v-else icon="mdi:account" class="big-sprite" />
    </div>

    <!-- 底部横向区域（状态卡 + 伙伴卡 + 逃跑按钮） -->
    <div class="player-bottom-area">
      <!-- 玩家状态卡片 -->
      <div class="player-status-card">
        <div class="name-box">{{ playerStats.name }}</div>

        <div class="effect-icons" v-if="playerEffects.length">
          <div
            v-for="eff in playerEffects"
            :key="eff.type"
            class="effect-badge"
            :title="getEffectTooltip(eff, playerStats.maxHp)"
            @touchstart.prevent="$emit('show-effect-bubble', eff, playerStats.maxHp, $event)"
          >
            <Icon :icon="getEffectIcon(eff.type)" />
            <div class="effect-info">
              <span class="effect-dur">{{ eff.duration }}</span>
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

      <!-- 伙伴卡片 -->
      <div v-if="companion" class="companion-card">
        <img v-if="getCompanionImage && getCompanionImage()" :src="getCompanionImage()" class="companion-portrait" />
        <Icon v-else :icon="companion.icon || 'mdi:account-heart'" class="companion-icon" />
        <div class="companion-info">
          <div class="companion-name">{{ companion.name }}</div>
          <div class="bar-row">
            <span class="bar-text">HP</span>
            <div class="hp-bar small-bar">
              <div class="hp-fill" :style="{ width: companionHpPercent + '%' }"></div>
              <span>{{ companion.hp }} / {{ companion.maxHp }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 逃跑按钮 -->
      <div class="flee-btn-area" v-if="!gameOver && playerTurn && !waiting && !showResult">
        <button class="pixel-btn warning" @click="$emit('flee')">
          <Icon icon="streamline-freehand:safety-fire-exit" /> 逃跑
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { getEffectIcon, getEffectTooltip } from '@/composables/useBattleHelpers'

defineProps({
  playerStats: Object,
  playerShield: Number,
  playerEffects: Array,
  companion: Object,
  companionHpPercent: Number,
  playerHpPercent: Number,
  playerMp: Number,
  playerMaxMp: Number,
  displayExp: Number,
  nextLevelExp: Number,
  displayExpPercent: Number,
  gameOver: Boolean,
  playerTurn: Boolean,
  waiting: Boolean,
  showResult: Boolean,
  getCompanionImage: Function
})

defineEmits(['flee', 'show-effect-bubble'])

// 受击动画内部状态（可选，实际可由父组件通过 props 控制，这里简化）
const playerHit = ref(false)
const playerFlash = ref(false)
const playerShakeX = ref(0)
</script>