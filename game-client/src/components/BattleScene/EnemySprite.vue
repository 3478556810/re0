<template>
  <div
    class="enemy-unit"
    :class="{
      'target-unit': isSelected,
      'flash-white': isHit,
      'boss-entrance': isBoss && !bossEntrancePlayed,
      'boss-phase-anim': isBoss && bossPhaseAnim,
      'boss-low-hp': isBoss && isLowHp
    }"
    @click="$emit('select')"
  >
    <!-- 说话气泡 -->
    <div v-if="speech" class="speech-bubble">
      {{ speech }}
    </div>

    <!-- 状态图标行 -->
    <div class="unit-status-icons">
      <div
        v-for="eff in visibleEffects"
        :key="eff.type"
        class="effect-badge enemy-effect"
        :class="[eff.animClass || '', eff.isElementMark ? getElementMarkClass(eff.raw) : '']"
        :title="eff.tooltip"
        @click.stop="$emit('show-bubble', eff.raw, enemy.maxHp, $event)"
      >
        <Icon :icon="eff.icon" />
        <div class="eff-meta">
          <span class="eff-dur" v-if="eff.duration > 0">T{{ eff.duration }}</span>
          <span class="eff-stacks" v-if="eff.stacks > 1">×{{ eff.stacks }}</span>
        </div>
      </div>
    </div>

    <!-- 立绘 -->
    <div class="unit-portrait">
      <img
        v-if="!imageError"
        :src="currentPortrait"
        class="big-sprite-img"
        :class="{ damaged: isHurt, attacking: isAttacking }"
        @error="onImageError"
      />
      <Icon v-else :icon="enemy.icon || 'mdi:help-circle'" class="big-sprite-icon" />
    </div>

    <!-- 底部区域：元素标签 + 血条 -->
    <div class="unit-bottom">
      <div class="bottom-content">
        <div v-if="enemy.element" class="element-tag" :style="{ background: elementColor }">
          <Icon :icon="elementIcon" class="element-icon" />{{ elementLabel }}
        </div>
        <div class="hp-bar">
          <div v-if="enemy.shield > 0" class="shield-fill" :style="{ width: shieldPercent }"></div>
          <div class="hp-fill" :style="{ width: hpPercent }"></div>
          <span>{{ formatHp(enemy.hp) }} / {{ formatHp(enemy.maxHp) }}</span>
        </div>
      </div>
    </div>

    <!-- 浮动伤害数字 -->
    <div class="floating-damage-container" v-if="floatingNumbers.length">
      <div
        v-for="num in floatingNumbers"
        :key="num.id"
        class="float-damage"
        :class="'dmg-type-' + num.type"
        :style="{ marginTop: num.offsetY ? num.offsetY + 'px' : '0' }"
      >-{{ num.amount }}</div>
    </div>

    <!-- Boss 阶段特效闪光层 -->
    <div v-if="isBoss && bossPhaseAnim" class="boss-phase-flash"></div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import {
  getEffectIcon,
  getEffectTooltip,
  getSortedEffects,
  getElementMarkClass,
} from '@/composables/useBattleHelpers'
import { getElementColor, getElementLabel, getElementIcon } from '@/utils/elementUtils.js'

const props = defineProps({
  speech: { type: String, default: '' },
  enemy: { type: Object, required: true },
  isSelected: Boolean,
  isHit: Boolean,
  isAttacking: Boolean,
  floatingNumbers: { type: Array, default: () => [] },
  bossPhaseAnimTrigger: { type: Number, default: 0 }
})

defineEmits(['select', 'show-bubble'])

const imageError = ref(false)

const hpPercentVal = computed(() => props.enemy.hp / props.enemy.maxHp)
const isHurt = computed(() => hpPercentVal.value < 0.4)
const isLowHp = computed(() => hpPercentVal.value < 0.2)

const isBoss = computed(() => props.enemy.isBoss === true)
const bossEntrancePlayed = ref(false)
const bossPhaseAnim = ref(false)

// 入场动画
if (isBoss.value && !bossEntrancePlayed.value) {
  nextTick(() => { bossEntrancePlayed.value = true })
}

// 阶段动画
watch(() => props.bossPhaseAnimTrigger, (newVal, oldVal) => {
  if (isBoss.value && newVal !== oldVal && newVal > 0) {
    bossPhaseAnim.value = true
    setTimeout(() => { bossPhaseAnim.value = false }, 500)
  }
})

function formatHp(value) {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
  if (value >= 10000) return (value / 1000).toFixed(1) + 'k'
  return Math.floor(value)
}

const currentPortrait = computed(() => {
  const portraitId = props.enemy.portraitId || props.enemy.id
  const base = `/images/monsters/${portraitId}/`
  if (props.isAttacking) return base + 'attack.png'
  if (hpPercentVal.value < 0.2) return base + 'defeated.png'
  if (hpPercentVal.value < 0.4) return base + 'damaged.png'
  return base + 'normal.png'
})

function onImageError() { imageError.value = true }

const hpPercent = computed(() => (props.enemy.hp / props.enemy.maxHp) * 100 + '%')
const shieldPercent = computed(() => (props.enemy.shield / props.enemy.maxHp) * 100 + '%')

const elementColor = computed(() => getElementColor(props.enemy.element))
const elementIcon = computed(() => getElementIcon(props.enemy.element))
const elementLabel = computed(() => getElementLabel(props.enemy.element))

const visibleEffects = computed(() => {
  return getSortedEffects(props.enemy).slice(0, 3).map(eff => ({
    type: eff.type,
    icon: getEffectIcon(eff.type === 'element_mark' ? eff.element : eff.type),
    tooltip: getEffectTooltip(eff, props.enemy.maxHp),
    duration: eff.duration,
    stacks: eff.stacks,
    animClass: eff.animClass || '',
    isElementMark: eff.type === 'element_mark',
    raw: eff
  }))
})
</script>

<style scoped>
.enemy-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  width: 140px;
  position: relative;
}

.unit-status-icons {
  display: flex;
  gap: 3px;
  justify-content: center;
  margin-bottom: 4px;
  min-height: 20px;
}

.effect-badge {
  padding: 1px 3px;
  font-size: 8px;
  gap: 2px;
  display: flex;
  align-items: center;
}
.effect-badge .iconify {
  font-size: 10px;
}
.eff-meta {
  line-height: 1;
}
.eff-dur,
.eff-stacks {
  font-size: 5px;
}

.unit-portrait {
  width: 120px;
  height: 220px;
  background: transparent;
  border: none;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.1s ease;
  margin-bottom: 4px;
}

.big-sprite-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.big-sprite-img.damaged {
  animation: hurtShake 0.5s;
}
.big-sprite-img.attacking {
  animation: attackLunge 0.8s ease-in-out;
}
.big-sprite-icon {
  font-size: 48px;
  color: #ffd;
}

.unit-bottom {
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 22px;
}
.bottom-content {
  display: flex;
  align-items: center;
  gap: 6px;
}
.element-tag {
  font-size: 7px;
  padding: 2px 4px;
  white-space: nowrap;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 42px;
  justify-content: center;
}
.element-icon {
  font-size: 10px;
}

.hp-bar {
  width: 85px;
  height: 10px;
  background: #1e1a10;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.6), 0 0 3px rgba(0,0,0,0.5);
}
.hp-bar .hp-fill {
  background: linear-gradient(90deg, #c92a2a, #e06c2e);
  height: 100%;
  transition: width 0.2s;
}
.hp-bar .shield-fill {
  background: rgba(0, 150, 255, 0.7);
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.hp-bar span {
  position: absolute;
  top: 50%;
  left: 4px;
  transform: translateY(-50%);
  font-size: 6px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 0 #000;
  white-space: nowrap;
  z-index: 3;
  display: block;
}

.enemy-unit.target-unit .unit-portrait {
  filter: drop-shadow(0 0 8px gold);
  transform: scale(1.05);
  transition: all 0.1s ease;
}

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

.floating-damage-container {
  position: relative;
}
.float-damage {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  animation: floatUp 0.5s ease-out forwards;
}
@keyframes floatUp {
  0% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-30px); }
}

.speech-bubble {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  font-size: 9px;
  padding: 4px 10px;
  border: 2px solid #ffd700;
  border-radius: 12px;
  font-family: 'Press Start 2P', cursive;
  z-index: 20;
  pointer-events: none;
  margin-bottom: 4px;
  animation: bubblePop 0.2s ease-out;
}
@keyframes bubblePop {
  0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
  100% { transform: translateX(-50%) scale(1); opacity: 1; }
}

@keyframes hurtShake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
@keyframes attackLunge {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.15) translateX(-8px); }
  60%  { transform: scale(1.1) translateX(-4px); }
  100% { transform: scale(1); }
}

/* ========== Boss 专属特效 ========== */
.boss-entrance {
  animation: bossEntrance 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}
@keyframes bossEntrance {
  0% { transform: scale(0.8); opacity: 0; filter: blur(4px); }
  70% { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; filter: blur(0); }
}

.boss-phase-anim {
  animation: bossPhaseFlash 0.5s ease-out;
  position: relative;
}
@keyframes bossPhaseFlash {
  0% { filter: brightness(1); transform: scale(1); }
  30% { filter: brightness(2) drop-shadow(0 0 20px gold); transform: scale(1.08); }
  100% { filter: brightness(1); transform: scale(1); }
}
.boss-phase-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255,215,0,0.5), transparent);
  pointer-events: none;
  animation: phaseFlashOverlay 0.5s ease-out;
}
@keyframes phaseFlashOverlay {
  0% { opacity: 0; }
  30% { opacity: 1; }
  100% { opacity: 0; }
}

/* 低血量特效：仅一次短暂警告，不循环 */
.boss-low-hp {
  animation: bossLowHpWarning 0.4s ease-out;
}
@keyframes bossLowHpWarning {
  0% { filter: drop-shadow(0 0 0px red); transform: scale(1); }
  50% { filter: drop-shadow(0 0 12px #ff4444); transform: scale(1.02); }
  100% { filter: drop-shadow(0 0 0px red); transform: scale(1); }
}
</style>