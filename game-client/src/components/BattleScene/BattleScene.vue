<template>
  <div class="battle-container">

    <!-- Boss 独立血条（仅在 Boss 战时显示） -->
    <BossHealthBar
      v-if="isBossBattle && bossData"
      :boss-data="bossData"
      :phase-thresholds="bossPhaseThresholds"
      :enemy-effects="currentEnemyEffects"
      @phase-change="onBossPhaseChange"
      @show-effect-bubble="(eff, maxHp, event) => showEffectBubble(eff, maxHp, event)"
    />

    <!-- 其余内容完全不变... -->
    <Transition name="fade">
      <div v-if="questCompleteHint" class="quest-hint-fixed">
        <Icon icon="mdi:check-circle" /> {{ questHintText }}
      </div>
    </Transition>

    <div class="sky"></div>
    <div class="ground"></div>
    <div class="decoration tree1"></div>
    <div class="decoration tree2"></div>
    <div class="decoration rock"></div>

    <EnemyPanel
      :hide-hp-bar="isBossBattle"
      :boss-phase-anim-trigger="bossPhaseAnimTrigger"
      :enemies="enemies"
      :current-target-index="currentTargetIndex"
      :hit-enemy-index="hitEnemyIndex"
      :floating-numbers="floatingNumbers"
      @select-target="selectTarget"
      @show-effect-bubble="showEffectBubble"
    />

    <PlayerPanel
      :player-stats="playerStats"
      :player-shield="playerShield"
      :player-effects="playerEffectsDisplay"
      :companion="companion"
      :companion-hp-percent="companionHpPercent"
      :player-hp-percent="playerHpPercent"
      :player-mp="store.player.mp"
      :player-max-mp="store.player.maxMp"
      :display-exp="displayExp"
      :next-level-exp="nextLevelExp"
      :display-exp-percent="displayExpPercent"
      :game-over="gameOver"
      :player-turn="playerTurn"
      :waiting="waiting"
      :show-result="showResult"
      @flee="fleeBattle"
      @show-effect-bubble="showEffectBubble"
    />

    <Transition name="fade">
      <div v-if="floatingMessage.visible" class="floating-message" :class="'msg-' + floatingMessage.type">
        {{ floatingMessage.text }}
      </div>
    </Transition>
    <div v-if="floatingMessage.visible" class="message-overlay" @click="skipMessage"></div>

    <Transition name="fade">
      <div v-if="effectBubble.visible" class="effect-bubble" :style="{ left: effectBubble.x + 'px', top: effectBubble.y + 'px' }">
        {{ effectBubble.text }}
      </div>
    </Transition>

    <SkillBar
      v-if="!gameOver && playerTurn && !waiting && !showResult"
      :skills="battleSkills"
      :player-mp="store.player.mp"
      @use-skill="useSkill"
      @show-preview="showSkillPreview"
      @hide-preview="hideSkillPreview"
    />

    <div v-if="skillPreview.visible" class="skill-preview" :style="{ left: skillPreview.x + 'px', top: skillPreview.y + 'px' }">
      <div class="preview-name">{{ skillPreview.name }}</div>
      <div class="preview-desc">{{ skillPreview.desc }}</div>
      <div class="preview-dmg">预期伤害：{{ skillPreview.dmg }}</div>
      <div v-if="skillPreview.mul > 1" class="preview-mul">克制倍率：{{ skillPreview.mul }}x</div>
    </div>

    <div v-if="gameOver && gameOverMsg === '战斗失败'" class="game-over-panel">
      {{ gameOverMsg }}
      <button class="pixel-btn" @click="gameOverHandler">确定</button>
    </div>

    <BattleResultPanel
      v-if="showResult"
      :reward="totalReward"
      :showDungeon="store.dungeon.active && !props.storyBattle"
      @close="onResultClose"
      @next="onNextFloor"
      @retreat="onRetreat"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'
import { useBattleState } from '@/composables/useBattleState'
import { useBattleUI } from '@/composables/useBattleUI'
import EnemyPanel from './EnemyPanel.vue'
import PlayerPanel from './PlayerPanel.vue'
import SkillBar from './SkillBar.vue'
import BattleResultPanel from './BattleResultPanel.vue'
import BossHealthBar from './BossHealthBar.vue'
import '@/assets/css/BattleScene.css'
import { getSortedEffects } from '@/composables/useBattleHelpers'

const props = defineProps({
  enemies: Array,
  battleCoord: Object,
  background: String,
  storyBattle: Boolean,
  isBossBattle: Boolean
})

const emit = defineEmits(['victory', 'exit', 'nextFloor', 'retreatToDungeon'])

const store = useGameStore()

const {
  enemies,
  currentTargetIndex,
  playerEffectsDisplay,
  playerShield,
  companion,
  companionHpPercent,
  playerStats,
  battleSkills,
  displayExp,
  nextLevelExp,
  displayExpPercent,
  playerTurn,
  gameOver,
  gameOverMsg,
  waiting,
  showResult,
  totalReward,
  questCompleteHint,
  questHintText,
  initEngine,
  useSkill: battleUseSkill,
  handleGameOver,
  saveRewards,
  selectTarget,
  getCustomImage,
  getCompanionImage,
  floatingNumbers,
  destroy: destroyState,
  hitEnemyIndex,
} = useBattleState()

const {
  floatingMessage,
  showMessage,
  skipMessage,
  effectBubble,
  showEffectBubble: uiShowEffectBubble,
  hideEffectBubbleOnOutsideClick,
  skillPreview,
  showSkillPreview: uiShowSkillPreview,
  hideSkillPreview,
  destroyUI
} = useBattleUI()

const playerHpPercent = computed(() => (store.player.hp / store.player.maxHp) * 100)

const bossPhaseAnimTrigger = ref(0)

const isBossBattle = computed(() => {
  if (!enemies.value.length) return false
  return enemies.value.some(enemy => enemy.isBoss === true)
})

const bossData = computed(() => {
  if (!isBossBattle.value || !enemies.value.length) return null
  const boss = enemies.value[0]
  return {
    name: boss.name,
    maxHp: boss.maxHp,
    currentHp: boss.hp,
    element: boss.element
  }
})

const currentEnemyEffects = computed(() => {
  if (!isBossBattle.value || !enemies.value.length) return []
  const target = enemies.value[currentTargetIndex.value] || enemies.value[0]
  return target.effects || []
})

const bossPhaseThresholds = [
  { threshold: 0.75, name: '阶段一', tip: '暗影帷幕', color: '#f59e0b', icon: 'mdi:shield-moon' },
  { threshold: 0.5, name: '阶段二', tip: '狂怒爆发', color: '#ef4444', icon: 'mdi:fire' },
  { threshold: 0.25, name: '阶段三', tip: '终焉降临', color: '#8b5cf6', icon: 'mdi:skull' }
]

const onBossPhaseChange = (phaseIndex, phaseConfig) => {
  triggerScreenShake(0.5)
  bossPhaseAnimTrigger.value++
  showEdgeGlow(phaseConfig.color, 0.8)
  showMessage(`【${phaseConfig.name}】${phaseConfig.tip}`, 2)
}

const triggerScreenShake = (duration = 0.4) => {
  const container = document.querySelector('.battle-container')
  if (container) {
    container.classList.add('screen-shake')
    setTimeout(() => container.classList.remove('screen-shake'), duration * 1000)
  }
}

const showEdgeGlow = (color, duration = 0.5) => {
  const glow = document.createElement('div')
  glow.className = 'dynamic-edge-glow'
  glow.style.cssText = `position:fixed; inset:0; pointer-events:none; z-index:45; box-shadow:inset 0 0 100px 50px ${color}; transition:opacity 0.2s;`
  document.body.appendChild(glow)
  setTimeout(() => {
    glow.style.opacity = '0'
    setTimeout(() => glow.remove(), 300)
  }, duration * 1000)
}

// 通用的 showEffectBubble，会被 BossHealthBar 和其他组件调用
const showEffectBubble = (effect, maxHp, event) => {
  uiShowEffectBubble(effect, maxHp, event, (eff, maxHp) => {
    let desc = ''
    switch (eff.type) {
      case 'dot': desc = `每回合损失 ${Math.floor(eff.value * Math.pow(2, (eff.stacks || 1) - 1))} 点生命 (${eff.stacks || 1}层)`; break
      case 'bleed': desc = `每回合损失 ${Math.floor(maxHp * eff.value)} 点生命`; break
      case 'freeze': desc = '冻结中'; break
      case 'stun': desc = '眩晕中'; break
      case 'shield': desc = `护盾 ${eff.value}`; break
      case 'regen': desc = `每回合恢复 ${Math.floor(maxHp * eff.value)} 点生命`; break
      case 'atkUp': case 'defUp': case 'spdUp': case 'critUp': desc = `提升 ${Math.floor(eff.value * 100)}%`; break
      case 'atkDown': case 'defDown': case 'spdDown': case 'critDown': desc = `降低 ${Math.floor(-eff.value * 100)}%`; break
      default: desc = eff.type
    }
    return `${eff.type}：${desc}，剩余 ${eff.duration} 回合`
  })
}

const fleeBattle = () => emit('exit')

const useSkill = async (skill) => {
  
  await battleUseSkill(skill, showMessage)
}

const showSkillPreview = (skill, event) => {
  uiShowSkillPreview(skill, event, store, enemies, currentTargetIndex)
}

const gameOverHandler = () => {
  handleGameOver()
  if (gameOverMsg.value === '战斗失败') emit('exit')
}

const onResultClose = () => {
  saveRewards()
  showResult.value = false
  emit('victory', totalReward.value)
}

const onNextFloor = () => {
  saveRewards()
  showResult.value = false
  store.clearFloor()
  emit('nextFloor')
}

const onRetreat = () => {
  saveRewards()
  showResult.value = false
  store.retreat()
  emit('retreatToDungeon')
}

onMounted(() => {
  console.log('onMounted, store.battleEnemies 已设置:', props.enemies);
  store.battleEnemies = props.enemies
  initEngine(props.enemies)
  showMessage('敌人出现了！')
  document.addEventListener('click', hideEffectBubbleOnOutsideClick)
})

onUnmounted(() => {
  destroyUI()
  destroyState()
  document.removeEventListener('click', hideEffectBubbleOnOutsideClick)
})
</script>