<template>
  <div class="battle-container">
    <div class="sky"></div>
    <div class="ground"></div>
    <div class="decoration tree1"></div>
    <div class="decoration tree2"></div>
    <div class="decoration rock"></div>

    <!-- 敌人区域（右上）：状态栏 + 立绘在右下 -->
    <div class="enemy-wrapper">
      <div class="enemy-status-card">
        <div class="name-box">{{ enemy.name }}</div>
        <div class="level-tag">Lv.{{ enemy.level }}</div>
        <div class="bar-row">
          <span class="bar-text">HP</span>
          <div class="hp-bar">
            <div class="hp-fill" :style="{ width: enemyHpPercent + '%' }"></div>
            <span>{{ Math.ceil(enemyHp) }} / {{ enemy.maxHp }}</span>
          </div>
        </div>
      </div>
     <div class="enemy-sprite" :class="{ 'enemy-hit': enemyHit, 'flash-white': enemyFlash }"
     :style="{ transform: `translateX(${enemyShakeX}px)` }">
  <img v-if="getCustomImage(enemy.id)" :src="getCustomImage(enemy.id)" class="big-sprite-img" />
  <Icon v-else :icon="enemy.icon || 'mdi:help-circle'" class="big-sprite" />
</div>
    </div>

    <!-- 玩家区域（左下）：状态栏 + 立绘在左上 -->
    <div class="player-wrapper">
      <div class="player-status-card">
        <div class="buff-area"></div>
        <div class="name-box">{{ playerStats.name }}</div>
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
    <!-- 浮动消息、行动菜单、技能面板等保持不变 -->
    <Transition name="fade">
      <div v-if="floatingMessage.visible" class="floating-message">
        {{ floatingMessage.text }}
      </div>
    </Transition>

    <div class="action-menu" v-if="!gameOver && playerTurn && !waiting && !showResult">
      <button class="action-btn" @click="showSkillPanel = true"><Icon icon="mdi:sword-cross" /> 技能</button>
      <button class="action-btn" @click="useItem('potion')"><Icon icon="mdi:bottle-tonic-plus" /> 物品</button>
    </div>

    <div v-if="showSkillPanel && !gameOver && playerTurn && !waiting" class="popup-panel">
      <div class="skill-list">
        <button v-for="skill in skills" :key="skill.name" class="skill-btn" @click="useSkill(skill)">
          <Icon :icon="skill.icon" /> {{ skill.name }} ({{ skill.desc }})
        </button>
      </div>
      <button class="close-btn" @click="showSkillPanel = false">取消</button>
    </div>

    <div v-if="gameOver && gameOverMsg === '战斗失败'" class="game-over-panel">
      {{ gameOverMsg }}
      <button class="pixel-btn" @click="handleGameOver">确定</button>
    </div>

    <BattleResultPanel v-if="showResult" :reward="reward" @close="onResultClose" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { generateAccessoryLoot } from '../utils/lootGenerator'
import BattleResultPanel from './BattleResultPanel.vue'
import '../assets/css/BattleScene.css'

const props = defineProps({ enemy: Object, battleCoord: Object })
const emit = defineEmits(['victory', 'exit'])

const store = useGameStore()

function getCustomImage(type) {
  return store.config?.customImages?.[type] || null
}

const playerStats = computed(() => {
  const customImg = getCustomImage('player')
  return {
    ...store.player,
    ...store.playerStats,
    customImg,
    level: store.player.level,
    name: store.player.name
  }
})

const skills = [
  { name: '火焰斩', desc: '火属性攻击', element: 'fire', baseMul: 1.8, mpCost: 5, icon: 'mdi:fire' },
  { name: '普通攻击', desc: '无属性', element: null, baseMul: 1.0, mpCost: 0, icon: 'mdi:sword-cross' }
]

const enemyHp = ref(props.enemy.hp)
const playerTurn = ref(true)
const gameOver = ref(false)
const gameOverMsg = ref('')
const waiting = ref(false)
const showSkillPanel = ref(true)
const showResult = ref(false)
const reward = ref({ exp: 0, materials: [], accessories: [] })

const displayExp = ref(store.player.exp)
const animatingExp = ref(false)

const playerHit = ref(false)
const enemyHit = ref(false)
const playerFlash = ref(false)
const enemyFlash = ref(false)
const playerShakeX = ref(0)
const enemyShakeX = ref(0)

const floatingMessage = reactive({ visible: false, text: '' })
let messageTimeout = null

const enemyHpPercent = computed(() => (enemyHp.value / props.enemy.maxHp) * 100)
const playerHpPercent = computed(() => (store.player.hp / store.player.maxHp) * 100)

const nextLevelExp = computed(() => store.player.level * 100)
const displayExpPercent = computed(() => (displayExp.value / nextLevelExp.value) * 100)

function showMessage(text) {
  if (messageTimeout) clearTimeout(messageTimeout)
  floatingMessage.text = text
  floatingMessage.visible = true
  messageTimeout = setTimeout(() => { floatingMessage.visible = false }, 1800)
}

const effectiveness = {
  fire: { bug: 2, grass: 2, fire: 0.5, water: 0.5 },
  grass: { water: 2, bug: 1.5, fire: 0.5 },
  bug: { grass: 2, fire: 0.5, bug: 1 },
}
function getEffectiveness(attackerElem, defenderElem) {
  if (!attackerElem || !defenderElem) return 1
  return effectiveness[attackerElem]?.[defenderElem] || 1
}

function calculateDamage(baseDamage, skillElement = null) {
  const stats = playerStats.value
  let damage = baseDamage
  if (skillElement === 'fire') damage *= (1 + (stats.fireDmg || 0) / 100)
  damage += stats.trueDmg || 0
  const elem = skillElement || 'fire'
  const mult = getEffectiveness(elem, props.enemy.element || 'bug')
  damage *= mult
  if (mult > 1) showMessage('效果拔群！')
  if (mult < 1) showMessage('效果不理想...')
  let isCrit = false
  if (Math.random() * 100 < (stats.critRate || 5)) {
    damage *= (stats.critDmg || 150) / 100
    isCrit = true
    showMessage('会心一击！')
  }
  const defenseReduce = props.enemy.def / (props.enemy.def + 50)
  damage = Math.max(1, Math.floor(damage * (1 - defenseReduce)))
  return { damage, isCrit }
}

function enemyDamage() {
  const stats = playerStats.value
  let damage = props.enemy.atk - stats.defense * 0.5
  damage = Math.max(5, Math.floor(damage))
  return damage
}

async function useSkill(skill) {
  if (!playerTurn.value || gameOver.value || waiting.value) return
  waiting.value = true
  showSkillPanel.value = false
  if (skill.mpCost > 0 && store.player.mp < skill.mpCost) {
    showMessage('MP不足！')
    waiting.value = false
    return
  }
  if (skill.mpCost > 0) store.player.mp -= skill.mpCost
  const baseDamage = playerStats.value.attack * skill.baseMul
  const { damage } = calculateDamage(baseDamage, skill.element)
  showMessage(`${playerStats.value.name} 使用了${skill.name}！`)
  enemyHp.value -= damage
  showMessage(`造成 ${damage} 点伤害！`)
  animateEnemyHit()
  if (enemyHp.value <= 0) {
    enemyHp.value = 0
    victory()
    return
  }
  playerTurn.value = false
  setTimeout(() => enemyTurn(), 800)
}

function useItem(item) {
  if (!playerTurn.value || gameOver.value || waiting.value) return
  if (item === 'potion') {
    if (store.player.hp >= store.player.maxHp) {
      showMessage('HP已满！')
      return
    }
    store.player.hp = Math.min(store.player.maxHp, store.player.hp + 30)
    showMessage('使用了恢复药水，恢复了 30HP！')
    playerTurn.value = false
    setTimeout(() => enemyTurn(), 800)
  }
}

async function enemyTurn() {
  if (gameOver.value) return
  showMessage(`${props.enemy.name} 的回合！`)
  const damage = enemyDamage()
  store.player.hp -= damage
  showMessage(`受到 ${damage} 点伤害！`)
  animatePlayerHit()
  if (store.player.hp <= 0) {
    store.player.hp = 0
    showMessage('你倒下了...')
    gameOver.value = true
    gameOverMsg.value = '战斗失败'
    waiting.value = false
    return
  }
  playerTurn.value = true
  waiting.value = false
  showSkillPanel.value = true   // ← 添加这一行，自动弹出技能框
}

async function animateExp(targetExp) {
  if (animatingExp.value) return
  animatingExp.value = true

  const startExp = displayExp.value
  const duration = 800
  const startTime = performance.now()

  function update() {
    const now = performance.now()
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    displayExp.value = Math.round(startExp + (targetExp - startExp) * progress)

    if (progress < 1) {
      requestAnimationFrame(update)
    } else {
      displayExp.value = targetExp
      store.addExperience(targetExp - startExp)
      animatingExp.value = false
      showResult.value = true   // 直接弹出结算面板，无需确认
    }
  }
  requestAnimationFrame(update)
}

function victory() {
  if (animatingExp.value || gameOver.value) return

  const exp = props.enemy.exp || 30
  const mats = props.enemy.material ? [props.enemy.material] : []
  const droppedAccessories = generateAccessoryLoot(props.enemy)
  reward.value = { exp, materials: mats, accessories: droppedAccessories }

  const targetExp = displayExp.value + exp
  animateExp(targetExp)
}

function handleGameOver() {
  if (gameOverMsg.value === '战斗失败') {
    store.respawn()
    emit('exit')
  }
}

function onResultClose() {
  reward.value.materials.forEach(m => store.addMaterial(m.id, m.name))
  if (reward.value.accessories?.length) {
    reward.value.accessories.forEach(acc => {
      store.inventory.push(acc)
    })
    store.save()
  }
  if (props.battleCoord) store.markEnemyDefeated(props.battleCoord.x, props.battleCoord.y)
  emit('victory', reward.value)
  showResult.value = false
}

function animateEnemyHit() {
  enemyHit.value = true; enemyFlash.value = true; enemyShakeX.value = 5
  setTimeout(() => { enemyHit.value = false; enemyShakeX.value = 0 }, 200)
  setTimeout(() => { enemyFlash.value = false }, 100)
}
function animatePlayerHit() {
  playerHit.value = true; playerFlash.value = true; playerShakeX.value = -5
  setTimeout(() => { playerHit.value = false; playerShakeX.value = 0 }, 200)
  setTimeout(() => { playerFlash.value = false }, 100)
}

onMounted(() => {
  showMessage('野生 ' + props.enemy.name + ' 出现了！')
  displayExp.value = store.player.exp
  animatingExp.value = false
})

onUnmounted(() => {
  if (messageTimeout) clearTimeout(messageTimeout)
})
</script>