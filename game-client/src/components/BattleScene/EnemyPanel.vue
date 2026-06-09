<template>
  <div class="enemy-area">
    <!-- 卡片区域强制隐藏 -->
    <div class="enemy-cards" v-if="false"></div>

    <!-- 立绘区域：横向排列 -->
    <div class="enemy-sprites">
      <div
        v-for="sprite in displaySprites"
        :key="'sprite-' + sprite.enemy.id"
        class="enemy-unit"
        :class="{
          'target-unit': sprite.originalIndex === currentTargetIndex,
          'flash-white': sprite.originalIndex === hitEnemyIndex
        }"
        @click="$emit('select-target', sprite.originalIndex)"
      >
        <!-- 1. 状态栏（效果图标）放在立绘上方，缩小尺寸 -->
        <div class="unit-status-icons">
          <div
            v-for="eff in getSortedEffects(sprite.enemy).slice(0, 3)"
            :key="eff.type"
            class="effect-badge enemy-effect"
            :class="[eff.animClass || '', eff.type === 'element_mark' ? getElementMarkClass(eff) : '']"
            :title="getEffectTooltip(eff, sprite.enemy.maxHp)"
            @click.stop="$emit('show-effect-bubble', eff, sprite.enemy.maxHp, $event)"
          >
            <Icon :icon="getEffectIcon(eff.type === 'element_mark' ? eff.element : eff.type)" />
            <div class="eff-meta">
              <span class="eff-dur" v-if="eff.duration > 0">T{{ eff.duration }}</span>
              <span class="eff-stacks" v-if="eff.stacks > 1">×{{ eff.stacks }}</span>
            </div>
          </div>
        </div>

        <!-- 2. 立绘（正方形，无背景边框） -->
        <div class="unit-portrait">
          <img
            v-if="getCustomImage && getCustomImage(sprite.enemy.id)"
            :src="getCustomImage(sprite.enemy.id)"
            class="big-sprite-img"
          />
          <Icon v-else :icon="sprite.enemy.icon || 'mdi:help-circle'" class="big-sprite-icon" />
        </div>

        <!-- 3. 元素标签 + 血条（同一行） -->
        <div class="unit-bottom">
          <div v-if="sprite.enemy.element" class="element-tag" :style="{ background: getElementColor(sprite.enemy.element) }">
            <Icon :icon="getElementIcon(sprite.enemy.element)" class="element-icon" />{{ getElementLabel(sprite.enemy.element) }}
          </div>
          <div class="hp-bar">
            <div v-if="sprite.enemy.shield > 0" class="shield-fill" :style="{ width: (sprite.enemy.shield / sprite.enemy.maxHp) * 100 + '%' }"></div>
            <div class="hp-fill" :style="{ width: (sprite.enemy.hp / sprite.enemy.maxHp) * 100 + '%' }"></div>
            <span>{{ Math.floor(sprite.enemy.hp) }} / {{ sprite.enemy.maxHp }}</span>
          </div>
        </div>

        <!-- 浮动伤害数字 -->
        <div class="floating-damage-container" v-if="floatingNumbers.length">
          <div
            v-for="floatNum in floatingNumbers.filter(f => f.targetIndex === sprite.originalIndex)"
            :key="floatNum.id"
            class="float-damage"
            :class="'dmg-type-' + floatNum.type"
            :style="{ marginTop: floatNum.offsetY ? floatNum.offsetY + 'px' : '0' }"
          >-{{ floatNum.amount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 脚本部分保持原样
import { ref, watch, computed } from 'vue'
import { Icon } from '@iconify/vue'
import {
  getEffectIcon,
  getEffectTooltip,
  getSortedEffects,
  getElementMarkClass,
  getElementMarkTooltip
} from '@/composables/useBattleHelpers'
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

const displaySprites = computed(() => {
  return props.enemies
    .map((enemy, index) => ({ enemy, originalIndex: index }))
    .filter(({ enemy }) => {
      if (!props.hideHpBar) return true
      return !enemy.isBoss
    })
})
</script>

<style scoped>
/* ========== 布局样式 ========== */

.enemy-cards {
  display: none !important;
}

.enemy-area {
  position: absolute;
  top: 50%;
  right: 2%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 10;
  gap: 12px;
}

.enemy-sprites {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 32px;          /* 加大间距，避免拥挤 */
  justify-content: flex-end;
  align-items: flex-start;
}

/* 每个敌人单元宽度增加到 110px，给血条数字留空间 */
.enemy-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  width: 110px;
}

/* 状态图标行：进一步缩小 */
.unit-status-icons {
  display: flex;
  gap: 3px;
  justify-content: center;
  margin-bottom: 4px;
  min-height: 20px;
}
.unit-status-icons .effect-badge {
  padding: 1px 3px;
  font-size: 8px;
  gap: 2px;
}
.unit-status-icons .effect-badge .iconify {
  font-size: 10px;
}
.unit-status-icons .eff-meta {
  line-height: 1;
}
.unit-status-icons .eff-dur,
.unit-status-icons .eff-stacks {
  font-size: 5px;
}

/* 立绘容器 */
.unit-portrait {
  width: 70px;
  height: 70px;
  background: transparent;
  border: none;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.1s ease;
  margin-bottom: 6px;
}
.big-sprite-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.big-sprite-icon {
  font-size: 48px;
  color: #ffd;
}

/* 元素 + 血条行 */
.unit-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
}

/* 血条样式：红色渐变，数字可见 */
.unit-bottom .hp-bar {
  width: 70px;
  height: 8px;
  background: #603020;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.4);
}
.unit-bottom .hp-bar .hp-fill {
  background: linear-gradient(135deg, #a03333, #6e1e1e) !important;
  height: 100%;
  transition: width 0.2s;
}
.unit-bottom .hp-bar .shield-fill {
  background: rgba(0,150,255,0.6);
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.unit-bottom .hp-bar span {
  position: absolute;
  top: 70%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 5px;
  color: white;
  text-shadow: 1px 1px 0 #000;
  white-space: nowrap;
  z-index: 3;
  display: block;
}

/* 元素标签保持圆角 */
.element-tag {
  font-size: 7px;
  padding: 2px 4px;
  white-space: nowrap;
  border-radius: 6px;
}

/* 选中效果：只给立绘加光晕 */
.enemy-unit.target-unit .unit-portrait {
  filter: drop-shadow(0 0 8px gold);
  transform: scale(1.05);
  transition: all 0.1s ease;
}

/* 受击闪光 + 左右晃动（合并动画） */
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

/* 浮动伤害数字 */
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
</style>