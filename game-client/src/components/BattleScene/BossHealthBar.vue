<template>
  <div class="boss-healthbar-global" v-if="bossData">
    <div class="boss-info">
      <div class="boss-name">{{ bossData.name }}</div>
      <div class="boss-phase" :style="{ color: phaseColor }">{{ phaseText }}</div>
     <div class="boss-hp-numbers">{{ Math.floor(displayHp) }} / {{ bossData.maxHp }}</div>
    </div>
    <div class="boss-hp-bg">
     <div class="boss-hp-fill" :style="{ width: (displayHp / bossData.maxHp) * 100 + '%', background: phaseBarGradient }"></div>
    </div>
    <div class="phase-tip" v-if="phaseTip"><Icon :icon="phaseIcon" /> {{ phaseTip }}</div>

    <!-- 效果图标区域（保持不动） -->
    <div class="boss-effect-icons" v-if="enemyEffects && enemyEffects.length">
      <div
        v-for="eff in sortedEffects"
        :key="eff.type"
        class="effect-badge"
        :class="[getEffectClass(eff), eff.animClass || '', eff.type === 'element_mark' ? getElementMarkClass(eff) : '']"
        @click.stop="$emit('showEffectBubble', eff, bossData.maxHp, $event)"
      >
        <Icon :icon="getEffectIcon(eff.type === 'element_mark' ? eff.element : eff.type)" />
        <div class="eff-meta">
          <span class="eff-dur" v-if="eff.duration > 0">T{{ eff.duration }}</span>
          <span class="eff-stacks" v-if="eff.stacks > 1">×{{ eff.stacks }}</span>
        </div>
      </div>
    </div>

   
  </div>
</template>
<script setup>
import { computed, ref, watch , onBeforeUnmount} from 'vue'
import { Icon } from '@iconify/vue'
import { getEffectIcon, getEffectTooltip, getSortedEffects ,
  getElementMarkClass,       // ✅ 新增
  getElementMarkTooltip      // ✅ 新增


} from '@/composables/useBattleHelpers'

const props = defineProps({
  bossData: Object,
  phaseThresholds: {
    type: Array,
    default: () => [
      { threshold: 0.75, name: 'P1', tip: '暗影形态', color: '#f59e0b', icon: 'mdi:shield-moon' },
      { threshold: 0.5, name: 'P2', tip: '狂怒爆发', color: '#ef4444', icon: 'mdi:fire' },
      { threshold: 0.25, name: 'P3', tip: '终焉降临', color: '#8b5cf6', icon: 'mdi:skull' }
    ]
  },
  enemyEffects: Array,
   minionList: {          // ← 新增
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['phaseChange', 'showEffectBubble'])  // ✅ 添加了 showEffectBubble

const currentPhase = ref(0)
const hpPercent = computed(() => (props.bossData.currentHp / props.bossData.maxHp) * 100)

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

const sortedEffects = computed(() => getSortedEffects({ effects: props.enemyEffects || [] }))

const getEffectClass = (eff) => {
  if (eff.type === 'dragonMark' || eff.type === 'shadowMark' || eff.type === 'holyMark') return 'effect-mark'
  if (eff.type === 'atkUp' || eff.type === 'defUp' || eff.type === 'spdUp' || eff.type === 'regen') return 'effect-buff'
  return 'effect-debuff'
}

const displayHp = ref(props.bossData.currentHp)
let hpAnimTimer = null

watch(() => props.bossData.currentHp, (newHp, oldHp) => {
  if (newHp < oldHp) {
    // 血量减少时，启动平滑动画（3秒过渡）
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
</script>


<style scoped>
/* ===== 原有样式保留（不动） ===== */
.boss-healthbar-global {
  position: fixed;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  min-width: 400px;
  z-index: 40;

  /* 深色半透明磨砂感，稍微提亮一点，让暗部细节可见 */
  background: rgba(10, 15, 25, 0.72);
  backdrop-filter: blur(8px);  /* 保留轻微模糊，配合暗底仍有磨砂感 */

  border-radius: 12px;
  padding: 8px 16px;

  /* 关键：明显的玻璃边框 + 多层高光/阴影 */
  border: 1px solid rgba(255, 215, 0, 0.35);
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.6),          /* 外部深阴影 */
    inset 0 1px 2px rgba(255, 255, 255, 0.2), /* 顶部内高光（玻璃边缘反光） */
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);     /* 底部内阴影增加厚度 */

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
.boss-effect-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(219,180,44,0.3);
}
.effect-badge {
  background: transparent;   /* 或者直接删掉 background 这一行 */
  border-radius: 4px;
  padding: 2px 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #ffd;
  position: relative;
}
.effect-mark { border-left: 3px solid #f1c40f; background: #2c2418; }
.effect-buff { border-left: 3px solid #2ecc71; }
.effect-debuff { border-left: 3px solid #e74c3c; }
.effect-dur { font-size: 8px; color: #ccc; }
.effect-stacks { font-size: 8px; color: #f1c40f; margin-left: 2px; }

/* ===== 补全印记动画样式（复制自全局，确保在 scoped 中生效） ===== */
.dragon-mark-glow {
  border-color: rgba(255, 100, 0, 0.6) !important;
  background: linear-gradient(135deg, rgba(255,60,0,0.15) 0%, rgba(255,120,0,0.5) 25%, rgba(255,60,0,0.15) 50%, rgba(255,100,0,0.5) 75%, rgba(255,60,0,0.15) 100%);
  background-size: 300% 300%;
  animation: dragonVeil 3s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(255,80,0,0.6), inset 0 0 8px rgba(255,120,0,0.3);
}
@keyframes dragonVeil {
  0% { background-position: 0% 50%; box-shadow: 0 0 10px rgba(255,80,0,0.5); }
  25% { background-position: 100% 0%; box-shadow: 0 0 18px rgba(255,120,0,0.8); }
  50% { background-position: 100% 100%; box-shadow: 0 0 10px rgba(255,80,0,0.5); }
  75% { background-position: 0% 100%; box-shadow: 0 0 18px rgba(255,100,0,0.8); }
  100% { background-position: 0% 50%; box-shadow: 0 0 10px rgba(255,80,0,0.5); }
}

.shadow-mark-glow {
  position: relative;
  border-color: rgba(130, 0, 220, 0.6) !important;
  background: linear-gradient(135deg, rgba(80,0,160,0.15) 0%, rgba(140,0,240,0.5) 25%, rgba(80,0,160,0.15) 50%, rgba(120,0,220,0.5) 75%, rgba(80,0,160,0.15) 100%);
  background-size: 300% 300%;
  animation: shadowAppear 0.8s ease-out forwards, starTwinkle 2s ease-in-out infinite 0.8s;
  box-shadow: 0 0 12px rgba(130,0,220,0.6), inset 0 0 8px rgba(160,0,255,0.3);
  overflow: visible;
}
.shadow-mark-glow::before,
.shadow-mark-glow::after {
  content: '';
  position: absolute;
  width: 6px; height: 6px;
  background: #c084fc;
  border-radius: 50%;
  box-shadow: 0 0 8px #a855f7, 0 0 16px #7c3aed;
  animation: starOrbit 3s linear infinite;
}
.shadow-mark-glow::before { top: -8px; left: 50%; animation-delay: 0s; }
.shadow-mark-glow::after { bottom: -8px; right: 50%; animation-delay: 1.5s; }
@keyframes shadowAppear {
  0% { background-position: 0% 50%; box-shadow: 0 0 0px rgba(130,0,220,0); transform: scale(0.8); opacity: 0; }
  50% { box-shadow: 0 0 24px rgba(160,0,255,0.9); transform: scale(1.2); opacity: 1; }
  100% { background-position: 100% 100%; box-shadow: 0 0 12px rgba(130,0,220,0.6), inset 0 0 8px rgba(160,0,255,0.4); transform: scale(1); opacity: 1; }
}
@keyframes starTwinkle {
  0%, 100% { box-shadow: 0 0 12px rgba(130,0,220,0.6), 0 0 0px transparent; }
  50% { box-shadow: 0 0 20px rgba(160,0,255,0.8), 0 0 28px rgba(160,0,255,0.4); }
}
@keyframes starOrbit {
  0% { transform: translate(0,0) scale(1); opacity: 0.6; }
  25% { transform: translate(10px,-10px) scale(1.6); opacity: 1; }
  50% { transform: translate(0,-14px) scale(1); opacity: 0.6; }
  75% { transform: translate(-10px,-10px) scale(1.6); opacity: 1; }
  100% { transform: translate(0,0) scale(1); opacity: 0.6; }
}

.holy-mark-glow {
  animation: holyPulse 1.2s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255,215,0,0.7);
}
@keyframes holyPulse {
  0% { filter: drop-shadow(0 0 3px gold); }
  50% { filter: drop-shadow(0 0 16px #ffd966); }
  100% { filter: drop-shadow(0 0 3px gold); }
}


/* 强制应用元素印记动画（穿透 scoped） */
:deep(.element-mark-fire),
:deep(.element-mark-water),
:deep(.element-mark-thunder),
:deep(.element-mark-wind),
:deep(.element-mark-grass),
:deep(.element-mark-ice),
:deep(.element-mark-holy),
:deep(.element-mark-dark),
:deep(.element-mark-rock),
:deep(.element-mark-steel),
:deep(.element-mark-poison) {
  /* 从全局样式复制对应的属性，或者直接留空，因为全局已经定义了 */
}



</style>