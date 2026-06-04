
<template>
 <div class="battle-container" >
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

    <!-- 敌人区域 -->
    <div class="enemy-area">
      <div class="enemy-cards">
        <div
          v-for="(enemy, idx) in enemies"
          :key="enemy.id"
          class="enemy-card"
          :class="{ 'target-selected': idx === currentTargetIndex }"
          @click="selectTarget(idx)"
        >
          <div class="enemy-info">
            <div style="display: flex; align-items: center; gap: 6px;">
              <div class="name-box">{{ enemy.name }}</div>



              
 <div class="effect-icons" v-if="enemy.effects && enemy.effects.length">
<div v-for="eff in getSortedEffects(enemy)"
  :key="eff.type + '_' + (eff.animKey || 0)"
  class="effect-badge enemy-effect"
  :class="eff.animClass || ''"
  :title="getEffectTooltip(eff, enemy.maxHp)"
  @touchstart.prevent="showEffectBubble(eff, enemy.maxHp, $event)"
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
                          <div v-if="enemy.element" class="element-tag" :style="{ background: getElementColor(enemy.element) }">
  <Icon :icon="getElementIcon(enemy.element)" class="element-icon" />
  {{ getElementLabel(enemy.element) }}
</div>
              <span class="bar-text">HP</span>
              <div class="hp-bar">
                 <!-- 护盾条（蓝色，在血条上方） -->
  <div v-if="enemy.shield > 0" class="shield-fill" :style="{ width: (enemy.shield / enemy.maxHp) * 100 + '%' }"></div>
                <div class="hp-fill" :style="{ width: (enemy.hp / enemy.maxHp) * 100 + '%' }"></div>
                <span>{{ enemy.hp }} / {{ enemy.maxHp }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="enemy-sprites">
      <div
  v-for="(enemy, idx) in enemies"
  :key="'sprite-' + enemy.id"
  class="enemy-sprite"
  :class="{
    'target-sprite': idx === currentTargetIndex,
    'flash-white': idx === hitEnemyIndex      // ← 加上这一行
  }"
  @click="selectTarget(idx)"
>
          <img
            v-if="getCustomImage(enemy.id)"
            :src="getCustomImage(enemy.id)"
            class="big-sprite-img"
          />
          <Icon
            v-else
            :icon="enemy.icon || 'mdi:help-circle'"
            class="big-sprite-icon"
          />







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

    <!-- 玩家区域 -->
    <div class="player-wrapper">
       <!-- 新增：委托完成左侧提示 -->

       <div class="player-sprite" :class="{ 'player-hit': playerHit, 'flash-white': playerFlash }"
           :style="{ transform: `translateX(${playerShakeX}px)` }">
        <img v-if="playerStats.customImg" :src="playerStats.customImg" class="big-sprite-img" />
        <Icon v-else icon="mdi:account" class="big-sprite" />
      </div>

        <!-- 状态卡和伙伴卡横向排列 -->
  <div class="player-bottom-area">
      <div class="player-status-card">
        <div class="name-box">{{ playerStats.name }}</div>

        <div class="effect-icons" v-if="playerEffectsDisplay.length">
<div v-for="eff in playerEffectsDisplay" :key="eff.type" class="effect-badge"
     :title="getEffectTooltip(eff, store.player.maxHp)"
     @touchstart.prevent="showEffectBubble(eff, store.player.maxHp, $event)">
  <Icon :icon="getEffectIcon(eff.type)" />
  <div class="effect-info">
    <span class="effect-dur">{{ eff.duration }}</span>
    <span class="effect-stacks" v-if="eff.stacks > 1">x{{ eff.stacks }}</span>
  </div>
</div>
   
</div>

        <div class="level-tag">Lv.{{ playerStats.level }}</div>
        <div class="bar-row">
          <span class="bar-text">HP</span>
          <div class="hp-bar">
             <div v-if="playerShield > 0" class="shield-fill" :style="{ width: (playerShield / store.player.maxHp) * 100 + '%' }"></div>
            <div class="hp-fill" :style="{ width: playerHpPercent + '%' }"></div>
            <span>{{ Math.ceil(store.player.hp) }} / {{ store.player.maxHp }}</span>
          </div>
        </div>
        <div class="bar-row">
          <span class="bar-text">MP</span>
          <div class="mp-bar">
            <div class="mp-fill" :style="{ width: (store.player.mp / store.player.maxMp) * 100 + '%' }"></div>
            <span>{{ store.player.mp }} / {{ store.player.maxMp }}</span>
          </div>
        </div>
        <div class="bar-row">
          <span class="bar-text">EXP</span>
          <div class="exp-bar">
            <div class="exp-fill" :style="{ width: displayExpPercent + '%' }"></div>
            <span>{{ displayExp }} / {{ nextLevelExp }}</span>
          </div>
        </div>
      </div>


 <!-- 伙伴卡片：紧挨玩家右侧 -->
      <div v-if="companion" class="companion-card">
        <img
          v-if="getCompanionImage()"
          :src="getCompanionImage()"
          class="companion-portrait"
        />
        <Icon v-else :icon="companion.icon || 'mdi:account-heart'" class="companion-icon" />
        <div class="companion-info">
          <div class="companion-name">{{ companion.name }}</div>
          <div class="bar-row">
            <span class="bar-text">HP</span>
            <div class="hp-bar small-bar">
              <div class="hp-fill" :style="{ width: companionHpPercent + '%' }"></div>
              <span>{{ companion.hp }} / {{ companion.maxHp }}</span>
            </div>
          </div>
        </div>
      </div>


      <!-- 逃跑按钮（与技能栏同时显示） -->
<div class="flee-btn-area" v-if="!gameOver && playerTurn && !waiting && !showResult">
  <button class="pixel-btn warning" @click="fleeBattle">
    <Icon icon="streamline-freehand:safety-fire-exit" /> 逃跑
  </button>
</div>


     </div>
    </div>

    <!-- 浮动消息（可点击跳过） -->
 <!-- 浮动消息（可点击跳过） -->
<Transition name="fade">
<div v-if="floatingMessage.visible" class="floating-message" :class="'msg-' + floatingMessage.type">
  {{ floatingMessage.text }}
</div>
</Transition>

<!-- 移动端状态详情弹窗 -->
<!-- 移动端效果浮动气泡 -->
<Transition name="fade">
  <div v-if="effectBubble.visible" class="effect-bubble" :style="{ left: effectBubble.x + 'px', top: effectBubble.y + 'px' }">
    {{ effectBubble.text }}
  </div>
</Transition>


<!-- 透明遮罩，用于点击任意位置跳过消息 -->
<div v-if="floatingMessage.visible" class="message-overlay" ></div>
    

   
    <!-- 底部技能栏：常驻显示，美化版 -->
      <!-- 底部技能栏：悬浮显示详情 -->
    <div class="skill-bar" v-if="!gameOver && playerTurn && !waiting && !showResult">
<div
  v-for="skill in battleSkills"
  :key="skill.id"
  class="skill-card"
  :class="{ 'skill-disabled': skill.mpCost > store.player.mp }"
  @click="useSkill(skill)"
  @mouseenter="showSkillPreview(skill, $event)"
  @mouseleave="hideSkillPreview"
>
        <Icon :icon="skill.icon" class="skill-icon" />
        <div class="skill-info">
          <span class="skill-name">{{ skill.name }}</span>
         <span class="skill-mp">
  <span v-if="skill.element" class="skill-element-tag" :style="{ background: getElementColor(skill.element) }">
    {{ getElementLabel(skill.element) }}
  </span>
  MP {{ skill.mpCost }}
</span>
        </div>
      </div>
    </div>

    <!-- 技能预览浮层 -->
    <!-- 技能预览浮层（精简版） -->
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { useBattleState } from '../composables/useBattleState'
import { useBattleUI } from '../composables/useBattleUI'
import BattleResultPanel from './BattleResultPanel.vue'
import '../assets/css/BattleScene.css'

const props = defineProps({
  enemies: Array,
  battleCoord: Object,
  background: String,
  storyBattle: Boolean
})
const emit = defineEmits(['victory', 'exit', 'nextFloor', 'retreatToDungeon'])

const store = useGameStore()

// —— 战斗逻辑 ——
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
  showSkillPanel,
  showResult,
  totalReward,
  questCompleteHint,
  questHintText,
  initEngine,
  useSkill: battleUseSkill,
  handleGameOver,
  saveRewards,    // 👈 加上这一行
 onResultClose: _onResultClose,   // 先不移除，也可以直接不写
  onNextFloor: _onNextFloor,
  onRetreat: _onRetreat,
  selectTarget,
  getCustomImage,
  getCompanionImage,  floatingNumbers,
  destroy: destroyState,
  hitEnemyIndex,
} = useBattleState()

// —— UI 状态 ——
const {
  floatingMessage,
  showMessage,
  skipMessage,
  effectBubble,
  showEffectBubble: uiShowEffectBubble,
  hideEffectBubbleOnOutsideClick,
  skillPreview,
  showSkillPreview: uiShowSkillPreview,
  hideSkillPreview,   // ✅ 直接用，不重定义
  destroyUI
} = useBattleUI()

// 玩家生命百分比
const playerHpPercent = computed(() => (store.player.hp / store.player.maxHp) * 100)

// 动画
const playerHit = ref(false)
const playerFlash = ref(false)
const playerShakeX = ref(0)


function animatePlayerHit() {
  playerHit.value = true
  playerFlash.value = true
  playerShakeX.value = -8
  setTimeout(() => { playerHit.value = false; playerShakeX.value = 8 }, 100)
  setTimeout(() => { playerShakeX.value = 0; playerFlash.value = false }, 300)
}

// 工具函数

// 根据消息文本返回对应的 CSS 类名

function fleeBattle() {
  emit('exit')
}
function getElementIcon(e) {
  const map = { fire: 'mdi:fire', water: 'mdi:water', thunder: 'mdi:lightning-bolt', wind: 'mdi:weather-windy', grass: 'mdi:leaf', ice: 'mdi:snowflake', holy: 'mdi:brightness-7', dark: 'mdi:moon-waning-crescent', rock: 'mdi:terrain', steel: 'mdi:cube-outline' }
  return map[e] || 'mdi:help-circle'
}
function getElementLabel(e) {
  const map = { fire: '火', water: '水', thunder: '雷', wind: '风', grass: '草', ice: '冰', holy: '圣', dark: '暗', rock: '岩', steel: '钢' }
  return map[e] || e
}
function getElementColor(e) {
  const map = { fire: '#e74c3c', water: '#3498db', thunder: '#f1c40f', wind: '#2ecc71', grass: '#27ae60', ice: '#81ecec', holy: '#ffeaa7', dark: '#6c5ce7', rock: '#brown', steel: '#bdc3c7' }
  return map[e] || '#888'
}
function getEffectIcon(type) {
  const map = {
    dot: 'mdi:skull-crossbones', hot: 'mdi:heart-plus', atkUp: 'mdi:sword-cross', defUp: 'mdi:shield-star',
    spdUp: 'mdi:run-fast', atkDown: 'pepicons-print:sword-off', defDown: 'mdi:shield-off', spdDown: 'mdi:walk',
    shield: 'mdi:shield', stun: 'mdi:lightning-bolt', silence: 'mdi:microphone-off', reflect: 'mdi:mirror',
    freeze: 'mdi:snowflake', bleed: 'mdi:blood-bag', weak: 'mdi:emoticon-cry', regen: 'mdi:heart-circle',
    taunt: 'mdi:account-voice', lifestealBuff: 'mdi:blood-saver', critRateUp: 'noto:heart-on-fire', holyMark: 'mdi:star-shooting',
      dragonMark: 'simple-icons:redragon',        // ✅ 龙骸印记
    shadowMark: 'line-md:moon'  // ✅ 暗蚀印记
  }
  return map[type] || 'mdi:circle-small'
}
function getEffectTooltip(eff, maxHp) {
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
}
function showEffectBubble(eff, maxHp, event) {
  uiShowEffectBubble(eff, maxHp, event, getEffectTooltip)
}

// 模板需要的方法
// 删除以下代码
// function getMessageType(text) { ... }
// const showMessageWithType = (msg, duration) => { ... }
function getMessageType(text) {
  if (text.includes('(暴击)')) return 'crit'
  if (text.includes('效果拔群') || text.includes('效果不理想')) return 'special'
  if (text.includes('提升') || text.includes('恢复') || text.includes('护盾')) return 'buff'
  if (text.includes('损失') || text.includes('中毒') || text.includes('流血') || text.includes('眩晕') || text.includes('冻结')) return 'debuff'
  if (text.includes('造成') || text.includes('伤害')) return 'dmg'
  return 'info'
}


// 修改 useSkill 为：
// 在 <script setup> 中
async function useSkill(skill) {
  await battleUseSkill(skill, showMessage);   // 不再使用 showMessageWithType
}
const showSkillPreview = (skill, event) => {
  uiShowSkillPreview(skill, event, store, enemies, currentTargetIndex)
}
// hideSkillPreview 直接使用解构出来的

function gameOverHandler() {
  handleGameOver()
  if (gameOverMsg.value === '战斗失败') emit('exit')
}

onMounted(() => {
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


// 覆盖 onResultClose 等，加入 emit
function onResultClose() {
  saveRewards()
  showResult.value = false
  emit('victory', totalReward.value)
}

function onNextFloor() {
  saveRewards()
  showResult.value = false
  store.clearFloor()
  emit('nextFloor')
}

function onRetreat() {
  saveRewards()
  showResult.value = false
  store.retreat()
  emit('retreatToDungeon')
}


// 在 <script setup> 中添加
function getSortedEffects(enemy) {
  if (!enemy?.effects) return []
  const marks = ['dragonMark', 'shadowMark', 'holyMark']
  return [...enemy.effects].sort((a, b) => {
    const aIs = marks.includes(a.type)
    const bIs = marks.includes(b.type)
    if (aIs && !bIs) return -1
    if (!aIs && bIs) return 1
    return 0
  })
}
</script>



