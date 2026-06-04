<template>
  <div class="boss-healthbar-global" v-if="bossData">
    <div class="boss-info">
      <div class="boss-name">{{ bossData.name }}</div>
      <div class="boss-phase" :style="{ color: phaseColor }">{{ phaseText }}</div>
      <div class="boss-hp-numbers">{{ bossData.currentHp }} / {{ bossData.maxHp }}</div>
    </div>
    <div class="boss-hp-bg">
      <div class="boss-hp-fill" :style="{ width: hpPercent + '%', background: phaseBarGradient }"></div>
    </div>
    <div class="phase-tip" v-if="phaseTip"><Icon :icon="phaseIcon" /> {{ phaseTip }}</div>

    <!-- 效果图标区域：位于血条左下角，显示所有印记、buff、debuff -->
    <div class="boss-effect-icons" v-if="enemyEffects && enemyEffects.length">
      <div
        v-for="eff in sortedEffects"
        :key="eff.type"
        class="effect-badge"
        :class="getEffectClass(eff)"
        :title="getEffectTooltip(eff, bossData.maxHp)"
      >
        <Icon :icon="getEffectIcon(eff.type)" />
        <div class="effect-info">
          <span class="effect-dur">{{ eff.duration }}</span>
          <span class="effect-stacks" v-if="eff.stacks > 1">x{{ eff.stacks }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { getEffectIcon, getEffectTooltip, getSortedEffects } from '@/composables/useBattleHelpers'

const props = defineProps({
  bossData: Object,
  phaseThresholds: {
    type: Array,
    default: () => [
      { threshold: 0.7, name: 'P1', tip: '暗影形态', color: '#f59e0b', icon: 'mdi:shield-moon' },
      { threshold: 0.4, name: 'P2', tip: '狂怒爆发', color: '#ef4444', icon: 'mdi:fire' },
      { threshold: 0.1, name: 'P3', tip: '终焉降临', color: '#8b5cf6', icon: 'mdi:skull' }
    ]
  },
  enemyEffects: Array   // 当前敌人的效果列表
})

const emit = defineEmits(['phaseChange'])

const currentPhase = ref(0)
const hpPercent = computed(() => (props.bossData.currentHp / props.bossData.maxHp) * 100)

// 更新阶段
const updatePhase = () => {
  const percent = hpPercent.value
  let newPhase = 0
  for (let i = props.phaseThresholds.length - 1; i >= 0; i--) {
    if (percent <= props.phaseThresholds[i].threshold * 100) {
      newPhase = i
      break
    }
  }
  if (newPhase !== currentPhase.value) {
    currentPhase.value = newPhase
    emit('phaseChange', currentPhase.value, props.phaseThresholds[currentPhase.value])
  }
}
watch(() => props.bossData?.currentHp, () => updatePhase(), { immediate: true })

const phaseConfig = computed(() => props.phaseThresholds[currentPhase.value] || props.phaseThresholds[0])
const phaseText = computed(() => phaseConfig.value.name)
const phaseTip = computed(() => phaseConfig.value.tip)
const phaseColor = computed(() => phaseConfig.value.color)
const phaseIcon = computed(() => phaseConfig.value.icon)
const phaseBarGradient = computed(() => {
  const colors = {
    '#f59e0b': 'linear-gradient(90deg, #d97706, #fbbf24)',
    '#ef4444': 'linear-gradient(90deg, #dc2626, #f87171)',
    '#8b5cf6': 'linear-gradient(90deg, #7c3aed, #a78bfa)'
  }
  return colors[phaseColor.value] || 'linear-gradient(90deg, #c2410c, #f97316)'
})

// 效果排序（印记置顶）
const sortedEffects = computed(() => getSortedEffects({ effects: props.enemyEffects || [] }))

// 效果样式类
const getEffectClass = (eff) => {
  if (eff.type === 'dragonMark' || eff.type === 'shadowMark' || eff.type === 'holyMark') return 'effect-mark'
  if (eff.type === 'atkUp' || eff.type === 'defUp' || eff.type === 'spdUp' || eff.type === 'regen') return 'effect-buff'
  return 'effect-debuff'
}
</script>

<style scoped>
.boss-healthbar-global {
  position: fixed;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  min-width: 400px;
  z-index: 40;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 8px 16px;
  border: 2px solid #dbb42c;
  box-shadow: 0 0 20px rgba(0,0,0,0.6);
  font-family: 'Press Start 2P', monospace;
}
.boss-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  text-shadow: 1px 1px 0 #000;
}
.boss-name { color: #ffd966; }
.boss-phase { font-weight: bold; text-shadow: 0 0 4px currentColor; }
.boss-hp-numbers { color: #ffaa66; }
.boss-hp-bg {
  background: #3a1f1f;
  border-radius: 4px;
  height: 20px;
  overflow: hidden;
}
.boss-hp-fill {
  height: 100%;
  transition: width 0.2s ease, background 0.3s;
}
.phase-tip {
  margin-top: 6px;
  text-align: center;
  font-size: 9px;
  color: #ffecb3;
  background: rgba(0,0,0,0.5);
  border-radius: 12px;
  padding: 2px 8px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}
/* 效果图标区域 */
.boss-effect-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(219,180,44,0.3);
}
.effect-badge {
  background: rgba(0,0,0,0.6);
  border-radius: 4px;
  padding: 2px 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #ffd;
}
.effect-mark { border-left: 3px solid #f1c40f; background: #2c2418; }
.effect-buff { border-left: 3px solid #2ecc71; }
.effect-debuff { border-left: 3px solid #e74c3c; }
.effect-dur { font-size: 8px; color: #ccc; }
.effect-stacks { font-size: 8px; color: #f1c40f; margin-left: 2px; }
</style>