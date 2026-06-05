<template>
  <div class="enemy-area">
    <!-- 非 Boss 模式才显示卡片（含血条、标签等） -->
    <div class="enemy-cards" v-if="!hideHpBar">
      <div
        v-for="(enemy, idx) in enemies"
        :key="enemy.id"
        class="enemy-card"
        :class="{ 'target-selected': idx === currentTargetIndex }"
        @click="$emit('select-target', idx)"
      >
        <div class="enemy-info">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div class="name-box">{{ enemy.name }}</div>
            <div class="effect-icons" v-if="enemy.effects && enemy.effects.length">
              <!-- 效果图标 -->
              <div
                v-for="eff in getSortedEffects(enemy)"
                :key="eff.type"
                class="effect-badge enemy-effect"
                @touchstart.prevent="$emit('show-effect-bubble', eff, enemy.maxHp, $event)"
              >
                <Icon :icon="getEffectIcon(eff.type)" />
                <div class="effect-info">
                  <span class="effect-dur">{{ eff.duration }}</span>
                  
                  <span class="effect-stacks" v-if="eff.stacks > 1">x{{ eff.stacks }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="level-tag">Lv.{{ enemy.level }}</div>
          <div class="bar-row">
            <div
              v-if="enemy.element"
              class="element-tag"
              :style="{ background: getElementColor(enemy.element) }"
            >
              <Icon :icon="getElementIcon(enemy.element)" class="element-icon" />
              {{ getElementLabel(enemy.element) }}
            </div>
            <span class="bar-text">HP</span>
            <div class="hp-bar">
              <div
                v-if="enemy.shield > 0"
                class="shield-fill"
                :style="{ width: (enemy.shield / enemy.maxHp) * 100 + '%' }"
              ></div>
              <div class="hp-fill" :style="{ width: (enemy.hp / enemy.maxHp) * 100 + '%' }"></div>
              <span>{{ enemy.hp }} / {{ enemy.maxHp }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 立绘区域（始终显示） -->
    <div class="enemy-sprites">
      <div
        v-for="(enemy, idx) in enemies"
        :key="'sprite-' + enemy.id"
        class="enemy-sprite"
        :class="{
          'target-sprite': idx === currentTargetIndex,
          'flash-white': idx === hitEnemyIndex
        }"
        @click="$emit('select-target', idx)"
      >
        <img
          v-if="getCustomImage && getCustomImage(enemy.id)"
          :src="getCustomImage(enemy.id)"
          class="big-sprite-img"
        />
        <Icon v-else :icon="enemy.icon || 'mdi:help-circle'" class="big-sprite-icon" />
        <div class="floating-damage-container" v-if="floatingNumbers.length">
          <div
            v-for="floatNum in floatingNumbers.filter(f => f.targetIndex === idx)"
            :key="floatNum.id"
            class="float-damage"
            :class="'dmg-type-' + floatNum.type"
            :style="{ marginTop: floatNum.offsetY ? floatNum.offsetY + 'px' : '0' }"
          >
            -{{ floatNum.amount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import {
  getElementIcon,
  getElementLabel,
  getElementColor,
  getEffectIcon,
  getEffectTooltip,
  getSortedEffects
} from '@/composables/useBattleHelpers'

const props = defineProps({
  enemies: Array,
  currentTargetIndex: Number,
  hitEnemyIndex: Number,
  floatingNumbers: Array,
  getCustomImage: Function,
  hideHpBar: { type: Boolean, default: false },   // Boss 战由父组件传入 true
  bossPhaseAnimTrigger: Number
})

defineEmits(['select-target', 'show-effect-bubble'])

const isBossPhaseAnim = ref(false)
watch(
  () => props.bossPhaseAnimTrigger,
  () => {
    isBossPhaseAnim.value = true
    setTimeout(() => { isBossPhaseAnim.value = false }, 600)
  }
)
</script>

<style scoped>
/* 你的原有样式完全不动，印记动画等相关样式依然在全局或本文件其他地方生效 */
/* 这里保持为空或保留你之前的样式即可 */
</style>