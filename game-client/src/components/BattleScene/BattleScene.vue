<template>
  <div class="battle-container">
    <!-- Boss 独立血条 -->
    <BossHealthBar
      v-if="isBossBattle && bossData"
      :boss-data="bossData"
      :minion-list="minionList"
      :phase-thresholds="bossPhaseThresholds"
      :enemy-effects="currentEnemyEffects"
      @phase-change="onBossPhaseChange"
      @show-effect-bubble="(eff, maxHp, event) => showEffectBubble(eff, maxHp, event)"
    />

    <!-- Boss 立绘（左上角，可点击选中） -->
    <div
      v-if="isBossBattle && bossEnemy"
      class="boss-sprite-container"
      :class="{ 'target-boss': bossEnemyIndex === currentTargetIndex }"
      @click="selectTarget(bossEnemyIndex)"
    >
      <div class="boss-sprite">
        <img
          v-if="getCustomImage && getCustomImage(bossEnemy.id)"
          :src="getCustomImage(bossEnemy.id)"
          class="big-sprite-img"
        />
        <Icon v-else :icon="bossEnemy.icon || 'mdi:help-circle'" class="big-sprite-icon" />
      </div>
    </div>

    <!-- 任务完成提示 -->
    <Transition name="fade">
      <div v-if="questCompleteHint" class="quest-hint-fixed">
        <Icon icon="mdi:check-circle" /> {{ questHintText }}
      </div>
    </Transition>

    <!-- 背景装饰 -->
    <div class="sky"></div>
    <div class="ground"></div>
    <div class="decoration tree1"></div>
    <div class="decoration tree2"></div>
    <div class="decoration rock"></div>

    <!-- 敌人面板 -->
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
  :companion-mp="companion?.mp || 0"
  :companion-max-mp="companion?.maxMp || 0"
  :companion-exp="companion?.exp || 0"
  :companion-next-exp="companion?.nextExp || 0"
  :companion-exp-percent="companion?.expPercent || 0"
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

    <!-- 浮动消息 -->
    <Transition name="fade">
      <div
        v-if="floatingMessage.visible"
        class="floating-message"
        :class="'msg-' + floatingMessage.type"
      >
        {{ floatingMessage.text }}
      </div>
    </Transition>
    <div v-if="floatingMessage.visible" class="message-overlay" @click="skipMessage"></div>

    <!-- 效果悬浮气泡 -->
    <Transition name="fade">
      <div
        v-if="effectBubble.visible"
        class="effect-bubble"
        :style="{ left: effectBubble.x + 'px', top: effectBubble.y + 'px' }"
      >
        {{ effectBubble.text }}
      </div>
    </Transition>

    <!-- 技能栏和逃跑按钮容器 -->
    <div v-if="!gameOver && playerTurn && !waiting && !showResult" class="skill-flee-row">
      <SkillBar
        :skills="battleSkills"
        :player-mp="store.player.mp"
        @use-skill="handleSkillClick"
      />
      <button class="pixel-btn warning" @click="fleeBattle">
        <Icon icon="streamline-freehand:safety-fire-exit" /> 逃跑
      </button>
    </div>

    <!-- 技能预览浮层（单击显示，双击释放） -->
    <div
      v-if="skillPreview.visible"
      class="skill-preview"
      :style="{ left: skillPreview.x + 'px', top: skillPreview.y + 'px' }"
    >
      <div class="preview-name">{{ skillPreview.name }}</div>
      <div class="preview-desc">{{ skillPreview.desc }}</div>
      <div class="preview-dmg">预期伤害：{{ skillPreview.dmg }}</div>
      <div class="preview-tip">再次点击确认释放</div>
      <div v-if="skillPreview.mul > 1" class="preview-mul">克制倍率：{{ skillPreview.mul }}x</div>
    </div>

    <!-- 战斗失败面板 -->
    <div v-if="gameOver && gameOverMsg === '战斗失败'" class="game-over-panel">
      {{ gameOverMsg }}
      <button class="pixel-btn" @click="gameOverHandler">确定</button>
    </div>

    <!-- 战斗结果面板 -->
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
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'
import { useBattleState } from '@/composables/useBattleState'
import { useBattleUI } from '@/composables/useBattleUI'
import { calculateDamage } from '../../combat/damageCalculator'  // 新增导入
import EnemyPanel from './EnemyPanel.vue'
import PlayerPanel from './PlayerPanel.vue'
import SkillBar from './SkillBar.vue'
import BattleResultPanel from './BattleResultPanel.vue'
import BossHealthBar from './BossHealthBar.vue'
import '@/assets/css/BattleScene.css'
import { getSortedEffects } from '@/composables/useBattleHelpers'
import {
  getEffectDisplayName,
  getEffectDisplayValue,
  getEffectTooltip
} from '@/composables/useBattleHelpers'

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
  engine,
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
  hitEnemyIndex
} = useBattleState()

const {
  floatingMessage,
  showMessage,
  skipMessage,
  effectBubble,
  showEffectBubble: uiShowEffectBubble,
  hideEffectBubbleOnOutsideClick,
  destroyUI
} = useBattleUI()

// ========== 技能预览浮层 ==========
const skillPreview = reactive({
  visible: false,
  name: '',
  desc: '',
  x: 0,
  y: 0,
  dmg: 0,
  mul: 1
})

// 使用引擎真实计算公式计算预览伤害
function calcSkillDamage(skill) {
  const target = enemies.value?.[currentTargetIndex.value]
  if (!target) return { damage: 0, multiplier: 1 }

  const attackerSnap = {
    attack: store.playerStats.attack || 10,
    critRate: store.playerStats.critRate || 5,
    critDmg: store.playerStats.critDmg || 150,
    element: skill.element || '',
    effects: store.playerStats.effects || [],
    fireDmg: store.playerStats.fireDmg || 0,
    waterDmg: store.playerStats.waterDmg || 0,
    thunderDmg: store.playerStats.thunderDmg || 0,
    windDmg: store.playerStats.windDmg || 0,
    grassDmg: store.playerStats.grassDmg || 0,
    iceDmg: store.playerStats.iceDmg || 0,
    holyDmg: store.playerStats.holyDmg || 0,
    darkDmg: store.playerStats.darkDmg || 0,
    rockDmg: store.playerStats.rockDmg || 0,
    steelDmg: store.playerStats.steelDmg || 0,
  }

  const defenderSnap = {
    defense: target.defense || target.getEffectiveDefense?.() || 0,
    element: target.element || '',
    effects: target.effects || [],
    hpPercent: target.hp / target.maxHp,
    maxHp: target.maxHp,
    hp: target.hp
  }

  const { damage, multiplier } = calculateDamage(attackerSnap, defenderSnap, skill)
  return { damage, multiplier }
}

// 修复浮动消息颜色
function showInfo(text, duration = 2000) {
  floatingMessage.value = { visible: true, text, type: 'info' }
  clearTimeout(showInfo._timer)
  showInfo._timer = setTimeout(() => {
    floatingMessage.value = { ...floatingMessage.value, visible: false }
  }, duration)
}

// ========== 单击显示预览，双击释放 ==========
const pendingSkill = ref(null)

async function handleSkillClick(skill) {
  if (skill.mpCost > 0 && store.player.mp < skill.mpCost) {
    showInfo('MP不足！', 1500)
    return
  }

  // 第一次点击：显示预览浮层
  if (!pendingSkill.value || pendingSkill.value.id !== skill.id) {
    pendingSkill.value = skill
    const { damage, multiplier } = calcSkillDamage(skill)
    skillPreview.name = skill.name
    skillPreview.desc = skill.desc || ''
    skillPreview.dmg = damage
    skillPreview.mul = multiplier
    skillPreview.x = Math.min(window.innerWidth - 180, window.innerWidth / 2 - 80)
    skillPreview.y = Math.max(100, window.innerHeight / 2 - 60)
    skillPreview.visible = true

    clearTimeout(pendingSkill._timeout)
    pendingSkill._timeout = setTimeout(() => {
      pendingSkill.value = null
      skillPreview.visible = false
    }, 2500)
    return
  }

  // 第二次点击同一技能：释放
  clearTimeout(pendingSkill._timeout)
  pendingSkill.value = null
  skillPreview.visible = false
  await battleUseSkill(skill, showMessage)
}

// ---------------------- 小怪数据 ----------------------
const minionList = computed(() => {
  if (!enemies.value) return []
  return enemies.value
    .filter(e => {
      if (e.hp <= 0) return false
      return e !== enemies.value[0]
    })
    .map(e => ({
      id: e.id || e.name,
      name: e.name,
      currentHp: e.hp,
      maxHp: e.maxHp,
      isTotem: e.isTotem || false,
      isClone: e.isClone || false
    }))
})

// ---------------------- Boss 相关 ----------------------
const isBossBattle = computed(() => {
  if (!enemies.value.length) return false
  return enemies.value.some(enemy => enemy.isBoss === true)
})

const bossEnemy = computed(() => {
  if (!isBossBattle.value || !enemies.value.length) return null
  return enemies.value.find(e => e.isBoss) || enemies.value[0]
})

const bossEnemyIndex = computed(() => {
  if (!bossEnemy.value) return -1
  return enemies.value.indexOf(bossEnemy.value)
})

const bossData = computed(() => {
  if (!isBossBattle.value || !enemies.value.length) return null
  const boss = bossEnemy.value
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

const playerHpPercent = computed(() => (store.player.hp / store.player.maxHp) * 100)

const bossPhaseAnimTrigger = ref(0)

// ---------------------- 事件处理 ----------------------
const onBossPhaseChange = (phaseIndex, phaseConfig) => {
  triggerScreenShake(0.5)
  bossPhaseAnimTrigger.value++
  showEdgeGlow(phaseConfig.color, 0.8)
  showMessage(`【${phaseConfig.name}】${phaseConfig.tip}`, 2000, 'info')
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

const showEffectBubble = (effect, maxHp, event) => {
  uiShowEffectBubble(effect, maxHp, event, (eff, maxHp) => {
    return getEffectTooltip(eff, maxHp)
  })
}

const fleeBattle = () => emit('exit')

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

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  store.battleEnemies = props.enemies
  initEngine(props.enemies)

  if (engine.value && engine.value.onPhaseChange !== undefined) {
    engine.value.onPhaseChange = onBossPhaseChange
  }

  showMessage('敌人出现了！', 2000, 'info')
  document.addEventListener('click', hideEffectBubbleOnOutsideClick)
})

onUnmounted(() => {
  destroyUI()
  destroyState()
  document.removeEventListener('click', hideEffectBubbleOnOutsideClick)
})
</script>


