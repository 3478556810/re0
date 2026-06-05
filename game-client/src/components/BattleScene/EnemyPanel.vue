<template>
  <div class="enemy-area">
    <!-- 非 Boss 模式才显示卡片 -->
    <div class="enemy-cards" v-if="!hideHpBar">
      <div v-for="(enemy, idx) in enemies" :key="enemy.id" class="enemy-card" :class="{ 'target-selected': idx === currentTargetIndex }" @click="$emit('select-target', idx)">
        <div class="enemy-info">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div class="name-box">{{ enemy.name }}</div>
         <div
  v-for="eff in getSortedEffects(enemy)"
  :key="eff.type + '_' + (eff.animKey || 0)"
  class="effect-badge enemy-effect"
  :class="[eff.animClass || '', eff.type === 'element_mark' ? getElementMarkClass(eff) : '']"
  :title="eff.type === 'element_mark' ? getElementMarkTooltip(eff) : getEffectTooltip(eff, enemy.maxHp)"
    @click.stop="$emit('show-effect-bubble', eff, enemy.maxHp, $event)"
  @touchstart.prevent="$emit('show-effect-bubble', eff, enemy.maxHp, $event)"
>
  <Icon :icon="getEffectIcon(eff.type === 'element_mark' ? eff.element : eff.type)" />
  <div class="eff-meta">
    <span class="eff-dur" v-if="eff.duration > 0">T{{ eff.duration }}</span>
    <span class="eff-stacks" v-if="eff.stacks > 1">×{{ eff.stacks }}</span>
  </div>
</div>

          </div>
          <div class="level-tag">Lv.{{ enemy.level }}</div>
          <div class="bar-row">
            <div v-if="enemy.element" class="element-tag" :style="{ background: getElementColor(enemy.element) }">
              <Icon :icon="getElementIcon(enemy.element)" class="element-icon" />{{ getElementLabel(enemy.element) }}
            </div>
            <span class="bar-text">HP</span>
            <div class="hp-bar">
              <div v-if="enemy.shield > 0" class="shield-fill" :style="{ width: (enemy.shield / enemy.maxHp) * 100 + '%' }"></div>
              <div class="hp-fill" :style="{ width: (enemy.hp / enemy.maxHp) * 100 + '%' }"></div>
           <span>{{ Math.floor(enemy.hp) }} / {{ enemy.maxHp }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 立绘区域 -->
    <div class="enemy-sprites">
      <div v-for="(enemy, idx) in enemies" :key="'sprite-'+enemy.id" class="enemy-sprite" :class="{ 'target-sprite': idx === currentTargetIndex, 'flash-white': idx === hitEnemyIndex }" @click="$emit('select-target', idx)">
        <img v-if="getCustomImage && getCustomImage(enemy.id)" :src="getCustomImage(enemy.id)" class="big-sprite-img" />
        <Icon v-else :icon="enemy.icon || 'mdi:help-circle'" class="big-sprite-icon" />
        <div class="floating-damage-container" v-if="floatingNumbers.length">
          <div v-for="floatNum in floatingNumbers.filter(f => f.targetIndex === idx)" :key="floatNum.id" class="float-damage" :class="'dmg-type-' + floatNum.type" :style="{ marginTop: floatNum.offsetY ? floatNum.offsetY + 'px' : '0' }">-{{ floatNum.amount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
// 从 useBattleHelpers 导入效果相关函数
import {
  getEffectIcon,
  getEffectTooltip,
  getSortedEffects,
  getElementMarkClass,
  getElementMarkTooltip
} from '@/composables/useBattleHelpers'
// ✅ 补充导入元素工具函数（getElementColor, getElementLabel, getElementIcon）
import { getElementColor, getElementLabel, getElementIcon } from '@/utils/elementUtils.js'

const props = defineProps({
  enemies: Array,
  currentTargetIndex: Number,
  hitEnemyIndex: Number,
  floatingNumbers: Array,
  getCustomImage: Function,
  hideHpBar: { type: Boolean, default: false },
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
/* 你的所有原有样式都不要动，保持原样即可 */
</style>