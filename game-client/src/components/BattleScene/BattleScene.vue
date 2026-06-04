<template>
  <div class="battle-container">



    <!-- Boss 独立血条（仅在 Boss 战时显示） -->
<BossHealthBar
  v-if="isBossBattle && bossData"
  :boss-data="bossData"
  :phase-thresholds="bossPhaseThresholds"
  :enemy-effects="currentEnemyEffects"
  @phase-change="onBossPhaseChange"
/>

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

    <!-- 敌人区域子组件 -->
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

    <!-- 玩家区域子组件 -->
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

    <!-- 浮动消息 -->
    <Transition name="fade">
      <div v-if="floatingMessage.visible" class="floating-message" :class="'msg-' + floatingMessage.type">
        {{ floatingMessage.text }}
      </div>
    </Transition>
    <div v-if="floatingMessage.visible" class="message-overlay" @click="skipMessage"></div>

    <!-- 效果气泡 -->
    <Transition name="fade">
      <div v-if="effectBubble.visible" class="effect-bubble" :style="{ left: effectBubble.x + 'px', top: effectBubble.y + 'px' }">
        {{ effectBubble.text }}
      </div>
    </Transition>

    <!-- 技能栏子组件 -->
    <SkillBar
      v-if="!gameOver && playerTurn && !waiting && !showResult"
      :skills="battleSkills"
      :player-mp="store.player.mp"
      @use-skill="useSkill"
      @show-preview="showSkillPreview"
      @hide-preview="hideSkillPreview"
    />

    <!-- 技能预览浮层 -->
    <div v-if="skillPreview.visible" class="skill-preview" :style="{ left: skillPreview.x + 'px', top: skillPreview.y + 'px' }">
      <div class="preview-name">{{ skillPreview.name }}</div>
      <div class="preview-desc">{{ skillPreview.desc }}</div>
      <div class="preview-dmg">预期伤害：{{ skillPreview.dmg }}</div>
      <div v-if="skillPreview.mul > 1" class="preview-mul">克制倍率：{{ skillPreview.mul }}x</div>
    </div>

    <!-- 游戏结束面板 -->
    <div v-if="gameOver && gameOverMsg === '战斗失败'" class="game-over-panel">
      {{ gameOverMsg }}
      <button class="pixel-btn" @click="gameOverHandler">确定</button>
    </div>

    <!-- 结算面板 -->
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'  // ✅ 一次性导入所有
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


// ✅ 只定义一个 props，包含所有需要的属性
const props = defineProps({
  enemies: Array,
  battleCoord: Object,
  background: String,
  storyBattle: Boolean,
  isBossBattle: Boolean      // 👈 从外部传入是否为 Boss 战
})

const emit = defineEmits(['victory', 'exit', 'nextFloor', 'retreatToDungeon'])

const store = useGameStore()

// 战斗核心逻辑
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

// UI 独立状态（包含 showMessage）
const {
  floatingMessage,
  showMessage,                     // ✅ 解构出 showMessage
  skipMessage,
  effectBubble,
  showEffectBubble: uiShowEffectBubble,
  hideEffectBubbleOnOutsideClick,
  skillPreview,
  showSkillPreview: uiShowSkillPreview,
  hideSkillPreview,
  destroyUI
} = useBattleUI()

// 玩家生命百分比
const playerHpPercent = computed(() => (store.player.hp / store.player.maxHp) * 100)

// ✅ 定义 bossPhaseAnimTrigger（用于触发立绘动画）
const bossPhaseAnimTrigger = ref(0)

// ✅ 判断是否为 Boss 战：优先使用 props 传入，否则根据敌人数量和标志判断
// 自动判断是否为 Boss 战：只要有任意敌人的 isBoss 为 true 即认为 Boss 战
const isBossBattle = computed(() => {
  if (!enemies.value.length) return false
  return enemies.value.some(enemy => enemy.isBoss === true)
})

// Boss 数据
// 修改为（确保取到实际数值，且能响应更新）
const bossData = computed(() => {
  if (!isBossBattle.value || !enemies.value.length) return null
  const boss = enemies.value[0]
  return {
    name: boss.name,
    maxHp: boss.maxHp,
    currentHp: boss.hp,   // 若 boss.hp 是普通数字，则 enemies 整体变化时会更新
    element: boss.element
  }
})


const currentEnemyEffects = computed(() => {
  if (!isBossBattle.value || !enemies.value.length) return []
  const target = enemies.value[currentTargetIndex.value] || enemies.value[0]
  return target.effects || []
})
// 阶段阈值配置
const bossPhaseThresholds = [
  { threshold: 0.75, name: '阶段一', tip: '暗影帷幕',color: '#f59e0b', icon: 'mdi:shield-moon' },
  { threshold: 0.5, name: '阶段二', tip: '狂怒爆发', color: '#ef4444', icon: 'mdi:fire' },
  { threshold: 0.25, name: '阶段三', tip: '终焉降临', color: '#8b5cf6', icon: 'mdi:skull' }
]

// Boss 阶段切换回调
const onBossPhaseChange = (phaseIndex, phaseConfig) => {
  // 1. 全屏微震
  triggerScreenShake(0.5)
  
  // 2. 触发 Boss 立绘动画（通过递增计数器）
  bossPhaseAnimTrigger.value++
  
  // 3. 屏幕边缘光晕
  showEdgeGlow(phaseConfig.color, 0.8)
  
  // 4. 显示浮动提示
  showMessage(`【${phaseConfig.name}】${phaseConfig.tip}`, 2)
}

// 屏幕震动
const triggerScreenShake = (duration = 0.4) => {
  const container = document.querySelector('.battle-container')
  if (container) {
    container.classList.add('screen-shake')
    setTimeout(() => container.classList.remove('screen-shake'), duration * 1000)
  }
}

// 边缘光晕效果
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

// 效果气泡显示
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