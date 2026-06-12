<template>
  <div class="enemy-area">
    <div class="enemy-cards" v-if="false"></div>

    <div class="enemy-sprites">
      <template v-for="(sprite, idx) in displaySprites">
        <EnemySprite
          v-if="sprite.enemy"
          :key="'sprite-' + sprite.enemy.id"
          :speech="sprite.enemy.speech || ''"
          :enemy="sprite.enemy"
          :isSelected="sprite.originalIndex === currentTargetIndex"
          :isHit="sprite.originalIndex === hitEnemyIndex"
          :isAttacking="sprite.originalIndex === attackingEnemyIndex"
          :floatingNumbers="floatingNumbers.filter(f => f.targetIndex === sprite.originalIndex)"
          :boss-phase-anim-trigger="bossPhaseAnimTrigger" 
          @select="$emit('select-target', sprite.originalIndex)"
          @show-bubble="(eff, maxHp, event) => $emit('show-effect-bubble', eff, maxHp, event)"
        />
        <div v-else :key="'empty-' + idx" class="enemy-placeholder"></div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import EnemySprite from './EnemySprite.vue'

const props = defineProps({
  enemies: Array,
  currentTargetIndex: Number,
  hitEnemyIndex: Number,
  attackingEnemyIndex: { type: Number, default: -1 },
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

const MAX_SLOTS = 3
const displaySprites = computed(() => {
  // 始终显示所有敌人（不过滤 Boss）
  const actual = props.enemies.map((enemy, index) => ({ enemy, originalIndex: index }))
  // 补齐占位符
  const slots = []
  for (let i = 0; i < MAX_SLOTS; i++) {
    if (i < actual.length) {
      slots.push(actual[i])
    } else {
      slots.push({ enemy: null, originalIndex: -1 })  // 占位符
    }
  }
  return slots
})
</script>

<style scoped>
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
  gap: 32px;
  justify-content: flex-end;
  align-items: flex-start;
}

/* 占位符：与真实敌人同宽，不可见，保持布局整齐 */
.enemy-placeholder {
  width: 140px;   /* 与 EnemySprite 中 .enemy-unit 宽度一致 */
  height: 0;
  visibility: hidden;
  pointer-events: none;
}
</style>