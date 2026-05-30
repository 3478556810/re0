
<template>
 <div class="battle-container" >
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
       :title="`${eff.type}：每回合 ${eff.value} 点伤害，剩余 ${eff.duration} 回合`">
    <Icon :icon="getEffectIcon(eff.type)" />
    <span class="effect-dur">{{ eff.duration }}</span>
  </div>
</div>
            </div>
            <div class="level-tag">Lv.{{ enemy.level }}</div>
            <div class="bar-row">
              <span class="bar-text">HP</span>
              <div class="hp-bar">
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
          :class="{ 'target-sprite': idx === currentTargetIndex }"
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
        </div>
      </div>
    </div>

    <!-- 玩家区域 -->
    <div class="player-wrapper">
      <div class="player-status-card">
        <div class="name-box">{{ playerStats.name }}</div>

        <div class="effect-icons" v-if="playerEffectsDisplay.length">
          <div v-for="eff in playerEffectsDisplay" :key="eff.type" class="effect-badge"
               :title="`${eff.type}：每回合 ${eff.value} 点伤害，剩余 ${eff.duration} 回合`">
            <Icon :icon="getEffectIcon(eff.type)" class="effect-icon" />
            <span class="effect-dur">{{ eff.duration }}</span>
          </div>
        </div>

        <div class="level-tag">Lv.{{ playerStats.level }}</div>
        <div class="bar-row">
          <span class="bar-text">HP</span>
          <div class="hp-bar">
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
      <div class="player-sprite" :class="{ 'player-hit': playerHit, 'flash-white': playerFlash }"
           :style="{ transform: `translateX(${playerShakeX}px)` }">
        <img v-if="playerStats.customImg" :src="playerStats.customImg" class="big-sprite-img" />
        <Icon v-else icon="mdi:account" class="big-sprite" />
      </div>
    </div>

    <!-- 浮动消息（可点击跳过） -->
    <Transition name="fade">
      <div v-if="floatingMessage.visible" class="floating-message">
        {{ floatingMessage.text }}
      </div>
    </Transition>
<!-- 透明遮罩，用于点击任意位置跳过消息 -->
<div v-if="floatingMessage.visible" class="message-overlay" ></div>
    <div class="action-menu" v-if="!gameOver && playerTurn && !waiting && !showResult">
      <button class="action-btn" @click="showSkillPanel = true"><Icon icon="mdi:sword-cross" /> 技能</button>
      <button class="action-btn" @click="useItem('potion')"><Icon icon="mdi:bottle-tonic-plus" /> 物品</button>
    </div>

    <div v-if="showSkillPanel && !gameOver && playerTurn && !waiting" class="popup-panel">
      <div class="skill-list">
        <button v-for="skill in battleSkills" :key="skill.id" class="skill-btn" @click="useSkill(skill)">
          <Icon :icon="skill.icon" /> {{ skill.name }} ({{ skill.desc }})
        </button>
      </div>
    </div>

    <div v-if="gameOver && gameOverMsg === '战斗失败'" class="game-over-panel">
      {{ gameOverMsg }}
      <button class="pixel-btn" @click="handleGameOver">确定</button>
    </div>

    <BattleResultPanel
      v-if="showResult"
      :reward="totalReward"
      :showDungeon="store.dungeon.active"
      @close="onResultClose"
      @next="onNextFloor"
      @retreat="onRetreat"
    />
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { generateAccessoryLoot } from '../utils/lootGenerator'
import { CombatEngine } from '../combat/CombatEngine'
import BattleResultPanel from './BattleResultPanel.vue'
import '../assets/css/BattleScene.css'

const props = defineProps({ enemies: Array, battleCoord: Object })
const emit = defineEmits(['victory', 'exit', 'nextFloor', 'retreatToDungeon'])

const store = useGameStore()

// ========== 战斗引擎 ==========
let engine = null

const enemies = ref([])
const currentTargetIndex = ref(0)

const playerEffectsDisplay = ref([])


const playerStats = computed(() => {
  const base = store.player || {}
  const stats = store.playerStats || {}
  const customImg = store.config?.customImages?.hero || store.config?.customImages?.player
  return {
    name: base.name || '勇者',
    level: base.level || 1,
    attack: stats.attack || 10,
    defense: stats.defense || 5,
    customImg: customImg || null,
    ...stats,
  }
})

const battleSkills = computed(() => {
  return (store.player.equippedSkills || [])
    .map(id => store.config?.skillPool?.find(s => s.id === id))
    .filter(Boolean)
})

const playerHpPercent = computed(() => (store.player.hp / store.player.maxHp) * 100)
const displayExp = ref(store.player.exp)
const nextLevelExp = computed(() => store.player.level * 100)
const displayExpPercent = computed(() => (displayExp.value / nextLevelExp.value) * 100)

const playerTurn = ref(true)
const gameOver = ref(false)
const gameOverMsg = ref('')
const waiting = ref(false)
const showSkillPanel = ref(true)
const showResult = ref(false)
const totalReward = ref({ exp: 0, materials: [], accessories: [] })

const playerHit = ref(false)
const playerFlash = ref(false)
const playerShakeX = ref(0)

// ========== 浮动消息 ==========
// ========== 浮动消息 ==========
const floatingMessage = reactive({ visible: false, text: '' })
let messageTimeout = null
let messageResolve = null

let globalSkipHandler = null

function showMessage(text, duration = 5000) {
  return new Promise((resolve) => {
    if (messageTimeout) clearTimeout(messageTimeout)
    if (messageResolve) {
      messageResolve()
      messageResolve = null
    }

    floatingMessage.text = text
    floatingMessage.visible = true
    messageResolve = resolve

    if (globalSkipHandler) document.removeEventListener('click', globalSkipHandler)
    globalSkipHandler = () => {
      skipMessage()
    }
    setTimeout(() => {
      document.addEventListener('click', globalSkipHandler)
    }, 0)

    messageTimeout = setTimeout(() => {
      floatingMessage.visible = false
      cleanupMessage()
      if (messageResolve) {
        messageResolve()
        messageResolve = null
      }
    }, duration)
  })
}

function skipMessage() {
  if (messageTimeout) clearTimeout(messageTimeout)
  if (messageResolve) {
    floatingMessage.visible = false
    cleanupMessage()
    messageResolve()
    messageResolve = null
  }
}

function cleanupMessage() {
  if (globalSkipHandler) {
    document.removeEventListener('click', globalSkipHandler)
    globalSkipHandler = null
  }
}
function getEffectIcon(type) {
  const map = {
    dot: 'mdi:skull-crossbones',
    hot: 'mdi:heart-plus',
    atkUp: 'mdi:sword-cross',
    defUp: 'mdi:shield-star',
    spdUp: 'mdi:run-fast',
    atkDown: 'mdi:sword-broken',
    defDown: 'mdi:shield-off',
    spdDown: 'mdi:walk',
    shield: 'mdi:shield',
    stun: 'mdi:lightning-bolt',
    silence: 'mdi:microphone-off',
    reflect: 'mdi:mirror',
  }
  return map[type] || 'mdi:circle-small'
}

function initEngine() {
  if (!props.enemies || props.enemies.length === 0) {
    console.warn('没有敌人数据')
    enemies.value = []
    return
  }
  engine = new CombatEngine(store.playerStats, props.enemies)
  syncStateFromEngine()
}

function syncStateFromEngine() {
  if (!engine) return
  store.player.hp = engine.player.hp
  store.player.mp = engine.player.mp
  enemies.value = engine.enemies.map(e => ({
    ...e,
    id: e.id,
    name: e.name || '未知敌人',
    hp: e.hp,
    maxHp: e.maxHp,
    element: e.element || '',
    icon: e.icon || 'mdi:help-circle',
    level: e.level || 1,
    atk: e.attack,
    def: e.defense,
    effects: e.effects || [],
  }))
  syncEffectsFromEngine()
}

function syncEffectsFromEngine() {
  if (!engine) return
  playerEffectsDisplay.value = engine.player.effects.filter(e => e.duration > 0)
  const target = engine.enemies[currentTargetIndex.value]
 
}

function selectTarget(idx) {
  if (idx >= 0 && idx < enemies.value.length) {
    currentTargetIndex.value = idx
    syncEffectsFromEngine()
  }
}

async function useSkill(skill) {
  if (!playerTurn.value || gameOver.value || waiting.value) return
  const targetIdx = currentTargetIndex.value

  // ① 计算当前等级倍率
  const skillLevel = store.player.skills[skill.id]?.level || 1
  const scaling = skill.levelScaling || { baseMul: 0 }
  const currentMul = (skill.baseMul || 0) + (skillLevel - 1) * (scaling.baseMul || 0)

  // ② 合并激活的三脚架效果
  const tripodChoices = store.player.tripodChoices[skill.id] || {}
  const extraEffects = []
  if (skill.tripods) {
    skill.tripods.forEach((tripod, tIdx) => {
      const choiceIdx = tripodChoices[tIdx]
      if (choiceIdx !== undefined && choiceIdx !== '' && tripod.effects[choiceIdx]) {
        extraEffects.push(tripod.effects[choiceIdx])
      }
    })
  }

  // ③ 组装战斗用的技能对象
  const effectiveSkill = {
    ...skill,
    baseMul: currentMul,
    effects: [...(skill.effects || []), ...extraEffects]
  }

  // ④ 传给引擎（关键：这里之前传错了，传的是 skill 而不是 effectiveSkill）
  const result = engine.executePlayerAction(effectiveSkill, targetIdx)
  if (!result) return

  waiting.value = true
  showSkillPanel.value = false

  for (const msg of result.messages) {
    await showMessage(msg, 5000)
    syncStateFromEngine()
    if (engine.battleOver) break
  }

  if (engine.battleOver) {
    gameOver.value = true
    gameOverMsg.value = engine.winner === 'player' ? '战斗胜利！' : '战斗失败'
    if (engine.winner === 'player') victory()
    waiting.value = false
    return
  }

  const nextAlive = engine.enemies.findIndex(e => e.hp > 0)
  if (nextAlive !== -1) currentTargetIndex.value = nextAlive

  playerTurn.value = false
  await enemyTurn()
}


async function useItem(item) {
  if (!playerTurn.value || gameOver.value || waiting.value) return
  if (item === 'potion') {
    if (store.player.hp >= store.player.maxHp) {
      await showMessage('HP已满！')
      return
    }
    const healAmount = 30
    store.player.hp = Math.min(store.player.maxHp, store.player.hp + healAmount)
    engine.player.hp = store.player.hp
    await showMessage(`使用了恢复药水，恢复了 ${healAmount} HP！`)
    syncStateFromEngine()        // 立刻刷新血条
    playerTurn.value = false
    await enemyTurn()
  }
}

async function enemyTurn() {
  if (gameOver.value) return;

  // 1. 先处理 DOT，每次 DOT 伤害单独显示并同步
  const dotResult = engine.executePlayerDotTick();
  if (dotResult.messages.length > 0) {
    for (const msg of dotResult.messages) {
      await showMessage(msg, 5000);
      syncStateFromEngine();
      if (engine.battleOver) break;
    }
    if (engine.battleOver) {
      gameOver.value = true;
      gameOverMsg.value = '战斗失败';
      waiting.value = false;
      return;
    }
  }

  // 2. 每个敌人逐个行动
  const alive = engine.getAliveEnemies();
  for (const enemy of alive) {
    if (engine.battleOver) break;

    // 执行单个敌人行动
    const res = engine.executeSingleEnemyAction(enemy);
    for (const msg of res.messages) {
      await showMessage(msg, 5000);
      syncStateFromEngine();
      if (engine.battleOver) break;
    }
    animatePlayerHit();
    await new Promise(r => setTimeout(r, 300));

    if (engine.battleOver) break;
  }

  syncStateFromEngine();

  if (engine.battleOver) {
    gameOver.value = true;
    gameOverMsg.value = '战斗失败';
    waiting.value = false;
    return;
  }

  // 回合结束
  engine.endTurn();
  syncStateFromEngine();

  playerTurn.value = true;
  waiting.value = false;
  showSkillPanel.value = true;
}





function victory() {
  gameOver.value = true
  gameOverMsg.value = '战斗胜利！'

  const engineRewards = engine.getRewards()
  const totalMats = engineRewards.materials || []
  const totalAccs = []
  for (const enemy of props.enemies) {
    const accs = generateAccessoryLoot(enemy)
    if (accs) totalAccs.push(...accs)
  }
  totalReward.value = { exp: engineRewards.exp, materials: totalMats, accessories: totalAccs }
  showResult.value = true
}

function handleGameOver() {
  if (gameOverMsg.value === '战斗失败') {
    store.respawn()
    emit('exit')
  }
}

function onResultClose() { saveRewards(); showResult.value = false; emit('victory', totalReward.value) }
function onNextFloor() { saveRewards(); showResult.value = false; store.clearFloor(); emit('nextFloor') }
function onRetreat() { saveRewards(); showResult.value = false; store.retreat(); emit('retreatToDungeon') }

function saveRewards() {
  if (totalReward.value.exp) store.addExperience(totalReward.value.exp)
  if (totalReward.value.materials?.length) {
    totalReward.value.materials.forEach(m => store.addMaterial(m.id, m.name))
  }
  if (totalReward.value.accessories?.length) {
    totalReward.value.accessories.forEach(acc => store.inventory.push(acc))
    store.save()
  }
}

function getCustomImage(type) {
  const val = store.config?.customImages?.[type]
  return val && val.trim() !== '' ? val : null
}

function animatePlayerHit() {
  playerHit.value = true
  playerFlash.value = true
  playerShakeX.value = -8
  setTimeout(() => { playerHit.value = false; playerShakeX.value = 8 }, 100)
  setTimeout(() => { playerShakeX.value = 0; playerFlash.value = false }, 300)
}

onMounted(() => {
  initEngine()
  showMessage('敌人出现了！')
  displayExp.value = store.player.exp
})

onUnmounted(() => {
  if (messageTimeout) clearTimeout(messageTimeout)
  if (globalSkipHandler) document.removeEventListener('click', globalSkipHandler)
})
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
.hp-fill { background: #4caf50; height: 100%; transition: width 0.3s; }
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
    width: 120px !important;
    height: 120px !important;
    top: -280px !important;
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

</style>