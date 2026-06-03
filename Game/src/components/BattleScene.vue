
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
<div v-for="eff in enemy.effects" :key="eff.type" class="effect-badge enemy-effect"
     :title="getEffectTooltip(eff, enemy.maxHp)"
     @touchstart.prevent="showEffectBubble(eff, enemy.maxHp, $event)">
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
    taunt: 'mdi:account-voice', lifestealBuff: 'mdi:blood-saver', critRateUp: 'noto:heart-on-fire', holyMark: 'mdi:star-shooting'
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
</script>



<style scoped>
/* 保持你原有的样式，我这里只保留必要的 */
.enemy-area { position: absolute; top: 5%; right: 2%; display: flex; flex-direction: column; align-items: flex-end; z-index: 10; gap: 12px; }
.enemy-cards { display: flex; flex-direction: column; gap: 8px; }
.enemy-card { background: rgba(0,0,0,0.5); border-radius: 16px; padding: 8px 12px; border: 2px solid transparent; cursor: pointer; transition: border-color 0.2s; width: 260px; }
.enemy-card.target-selected { border-color: #ffd700; }
.enemy-info .name-box { background: #f0e0b0; border: 1px solid #a08040; padding: 2px 6px; font-size: 9px; margin-bottom: 2px; display: inline-block; }
.level-tag { font-size: 8px; color: #ffd; }
.bar-row { display: flex; align-items: center; gap: 5px; margin-top: 3px; }
.bar-text { width: 25px; font-size: 8px; color: #fff; }
.hp-bar { flex: 1; background: #603020; height: 12px; border-radius: 6px; position: relative; overflow: hidden; }
.hp-fill { background: #4caf50; height: 100%; transition: width 0.3s; z-index: 2; }
.hp-bar span { position: absolute; top: 0; left: 0; right: 0; text-align: center; font-size: 7px; line-height: 12px; color: white; }
.enemy-sprites { display: flex; flex-direction: row; gap: 15px; justify-content: flex-end; }
.enemy-sprite { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border: 3px solid transparent; border-radius: 12px; background: rgba(0,0,0,0.3); cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
.enemy-sprite.target-sprite { border-color: #ffd700; transform: scale(1.1); }
.enemy-sprite:hover { border-color: rgba(255,255,255,0.6); }
.big-sprite-img { width: 100%; height: 100%; object-fit: contain; }
.big-sprite-icon { font-size: 50px; color: #ffd; }
.effect-icons { display: flex; gap: 4px; flex-wrap: wrap; }
.effect-badge { background: rgba(0,0,0,0.6); border-radius: 8px; padding: 2px 6px; display: flex; align-items: center; gap: 3px; font-size: 12px; color: #ffd; white-space: nowrap; }
.effect-icon { font-size: 16px; }
.effect-dur { font-size: 10px; color: #fff; }
.enemy-effect { background: rgba(200,0,0,0.4); }
.message-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 19;
  background: transparent;
  pointer-events: none;   /* 👈 关键：鼠标事件穿透 */
}
.floating-message {
  z-index: 20; /* 确保消息在遮罩之上 */
}
.companion-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0,0,0,0.7);
  border-radius: 12px;
  padding: 8px 12px;
  color: #fff;
  font-family: 'Press Start 2P', cursive;
  margin-left: 10px;   /* 与玩家卡片保持间距 */
}

.companion-portrait {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffd700;
}

.companion-icon {
  font-size: 28px;
  color: #ffd700;
}

.companion-info {
  flex: 1;
}

.companion-name {
  font-size: 7px;
  color: #ffd;
  margin-bottom: 2px;
}

.small-bar {
  height: 8px;
  width: 100px;
}
.player-wrapper {
  position: absolute;
  bottom: 5%;
  left: 2%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;      /* 👈 改为左对齐 */
  gap: 10px;
  z-index: 20;
}

/* 底部的横向容器 */
/* 底部的横向容器（状态卡 + 伙伴卡） */
.player-bottom-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

/* 确保 companion-card 的 margin-left 可以去掉，依赖 gap */
.companion-card {
  margin-left: 0;   /* 原来的 margin-left: 10px 可移除或保留 */
}


/* 手机横屏适配 */
@media (max-width: 900px) and (max-height: 500px) {
  .enemy-sprite {
    width: 60px !important;
    height: 60px !important;
    font-size: 40px !important;
  }
  .enemy-card {
    width: 180px !important;
    padding: 4px 8px !important;
    font-size: 7px !important;
  }
  .enemy-info .name-box {
    font-size: 7px !important;
  }
.player-sprite {
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
   
  filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5));
  transition: transform 0.1s, filter 0.2s;
}
  .big-sprite, .big-sprite-icon {
    font-size: 80px !important;
  }
  .player-status-card {
    min-width: 100px !important;
    padding: 8px 12px !important;
    font-size: 7px !important;
  }
  .action-btn {
    padding: 6px 14px !important;
    font-size: 10px !important;
  }
  .floating-message {
    font-size: 12px !important;
    padding: 8px 20px !important;
  }
}
/* 底部技能栏 */
.skill-bar {
  position: absolute;
  top: 50%;                    /* 👈 垂直居中 */
  left: 50%;
  transform: translate(-50%, -50%); /* 自身偏移，真正居中 */
  display: flex;
  gap: 8px;                    /* 卡片间距缩小一点 */
  flex-wrap: wrap;
  justify-content: center;
  z-index: 30;
}

/* 单个技能卡片 */
.skill-card {
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #b89a6a;
  border-radius: 16px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  min-width: 140px;
}

.skill-card:hover {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
}

.skill-card:active {
  transform: scale(0.95);
}

.skill-icon {
  font-size: 28px;
  color: #ffd700;
  flex-shrink: 0;
}

.skill-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.skill-name {
  font-size: 9px;
  white-space: nowrap;
}

.skill-mp {
  font-size: 7px;
  color: #aaa;
}

/* 不可用状态 */
.skill-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: #555;
}

.skill-disabled:hover {
  background: rgba(0, 0, 0, 0.7);
  border-color: #555;
}

/* 技能预览浮层 */
.skill-preview {
  position: fixed;
  z-index: 50;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #ffd700;
  border-radius: 12px;
  padding: 10px 14px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  font-size: 8px;
  pointer-events: none;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}

.preview-name {
  font-size: 9px;
  color: #ffd700;
  margin-bottom: 2px;
}

.preview-desc {
  color: #aaa;
  font-size: 7px;
  white-space: normal;
}

.preview-mul {
  color: #4caf50;
}

.preview-dmg {
  color: #ff9800;
  font-size: 9px;
}


.skill-preview {
  position: fixed;
  z-index: 50;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #ffd700;
  border-radius: 12px;
  padding: 10px 14px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  font-size: 8px;
  pointer-events: none;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 160px;
}

.preview-name {
  font-size: 10px;
  color: #ffd700;
}

.preview-desc {
  color: #ccc;
  font-size: 9px;
  white-space: normal;
  line-height: 1.5;
}

.preview-dmg {
  color: #ff9800;
  font-size: 10px;
}
.shield-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(0, 150, 255, 0.6);
  border-radius: 6px;
  z-index: 1;
}
/* 敌人属性标签 */
.element-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 7px;
  color: #fff;
  margin-top: 2px;
}
.element-icon {
  font-size: 10px;
}

/* 技能属性标签 */
.skill-element-tag {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 6px;
  color: #fff;
  margin-right: 4px;
}


/* 独立委托完成提示 */
.quest-hint-fixed {
  position: fixed;
  top: 25%;                  /* 屏幕左侧垂直居中偏上 */
  left: 12px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #ffd700;
  border-radius: 14px;
  padding: 12px 20px;
  color: #ffd;
  font-size: 10px;
  font-family: 'Press Start 2P', cursive;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;             /* 确保高于一切面板、毛玻璃效果 */
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
  pointer-events: none;      /* 不阻挡操作 */
   max-width: 300px;          /* 限制最大宽度 */
  white-space: normal;       /* 允许换行 */
  word-break: break-all;     /* 长单词截断 */
}

.hp-bar {
  position: relative; /* 已有 */
  overflow: hidden;   /* 已有 */
}
.shield-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(0, 150, 255, 0.6); /* 半透明蓝 */
  border-radius: 6px;
  z-index: 1; /* 在血条下方 */
}
.hp-fill {
  z-index: 2; /* 血条覆盖在护盾上 */
}
.hp-bar span {
  z-index: 3; /* 文字在最上层 */
}


/* 移动端效果详情弹窗 */
/* 移动端效果浮动气泡 */
.effect-bubble {
  position: fixed;
  z-index: 100;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #ffd700;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 9px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  pointer-events: none;       /* 不阻挡操作 */
  max-width: 220px;
  word-break: break-all;
  line-height: 1.4;
}

.effect-stacks {
  color: #ffd700;
  margin-left: 3px;
  font-weight: bold;
  font-size: 10px;
}

.effect-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}
.effect-dur {
  font-size: 10px;
  color: #fff;
}
.effect-stacks {
  color: #e7ca08;
  font-size: 6px;
}

/* 逃跑按钮：与伙伴卡/状态卡风格统一 */
.flee-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 165, 0, 0.6);
  border-radius: 12px;
  padding: 10px 14px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  font-size: 8px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 70px;
  min-height: 70px;
}
.flee-btn:hover {
  background: rgba(255, 165, 0, 0.2);
  border-color: #ffa500;
  transform: scale(1.05);
}
.flee-btn:active {
  transform: scale(0.95);
}
.flee-icon {
  font-size: 28px;
  color: #ffa500;
}
.flee-text {
  font-size: 7px;
  color: #ffd;
}


.hp-bar {
  position: relative;
  overflow: hidden;
  height: 12px; /* 或其他你想要的尺寸 */
  background: #603020;
  border-radius: 6px;
}
.shield-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background:  rgba(0, 150, 255, 0.6); /* 蓝色半透明护盾 */
  border-radius: 6px;
  z-index: 2; /* 护盾在血条上方 */
}
.hp-fill {
  position: relative;
  height: 100%;
  background: #4caf50;
  border-radius: 6px;
  z-index: 1;
}
.hp-bar span {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  text-align: center;
  line-height: 12px;
  color: white;
  z-index: 3; /* 文字在最上面 */
}


/* 浮动伤害数字 */
.floating-damage-container {
  position: absolute;
  top: 0;
  left: 50%;
  pointer-events: none;
}
.float-damage {
  position: absolute;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  text-shadow: 2px 2px 0 #000;
  animation: floatUp 1s ease-out forwards;
  white-space: nowrap;
  transform: translateX(-50%);
}
@keyframes floatUp {
  0% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -40px); }
}
.dmg-type-normal { color: #ffffff; }
.dmg-type-crit { color: #ffd700; font-size: 22px; }
.dmg-type-effective { color: #4caf50; }
.dmg-type-resisted { color: #aaa; }
</style>