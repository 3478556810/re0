
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
      :title="getEffectTooltip(eff, enemy.maxHp)">
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
           :title="getEffectTooltip(eff, store.player.maxHp)">
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
        @touchstart="showSkillPreview(skill, $event)"
        @touchend="hideSkillPreview"
      >
        <Icon :icon="skill.icon" class="skill-icon" />
        <div class="skill-info">
          <span class="skill-name">{{ skill.name }}</span>
          <span class="skill-mp">MP {{ skill.mpCost }}</span>
        </div>
      </div>
    </div>

    <!-- 技能预览浮层 -->
    <!-- 技能预览浮层（精简版） -->
    <div v-if="skillPreview.visible" class="skill-preview" :style="{ left: skillPreview.x + 'px', top: skillPreview.y + 'px' }">
      <div class="preview-name">{{ skillPreview.name }}</div>
      <div class="preview-desc">{{ skillPreview.desc }}</div>
      <div class="preview-dmg">预期伤害：{{ skillPreview.dmg }}</div>
    </div>
    <div v-if="gameOver && gameOverMsg === '战斗失败'" class="game-over-panel">
      {{ gameOverMsg }}
      <button class="pixel-btn" @click="handleGameOver">确定</button>
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { generateAccessoryLoot } from '../utils/lootGenerator'
import { CombatEngine } from '../combat/CombatEngine'
import BattleResultPanel from './BattleResultPanel.vue'
import '../assets/css/BattleScene.css'

const props = defineProps({
  enemies: Array,
  battleCoord: Object,
  background: String,
  storyBattle: Boolean  // 新增
})
const emit = defineEmits(['victory', 'exit', 'nextFloor', 'retreatToDungeon'])

const store = useGameStore()
// 技能预览浮层
const skillPreview = reactive({
  visible: false,
  x: 0, y: 0,
  name: '', desc: '', dmg: ''
})

function showSkillPreview(skill, event) {
  const target = enemies.value[currentTargetIndex.value]
  if (!target) return

  const skillLevel = store.player.skills[skill.id]?.level || 1
  const scaling = skill.levelScaling || { baseMul: 0 }
  const currentMul = (skill.baseMul || 0) + (skillLevel - 1) * (scaling.baseMul || 0)

  const atk = store.playerStats?.attack || store.player.attack || 10
  const def = target.def || 0
  const rawDmg = Math.floor(atk * currentMul)
  const estimatedDmg = Math.max(1, rawDmg - Math.floor(def * 0.5))

  skillPreview.visible = true
  skillPreview.name = skill.name
  skillPreview.desc = skill.desc || '无额外效果'
  skillPreview.dmg = `${estimatedDmg}`

  const rect = event.target.getBoundingClientRect()
  skillPreview.x = rect.left + rect.width / 2 - 60
  skillPreview.y = rect.top - 70
}

function hideSkillPreview() {
  skillPreview.visible = false
}
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
const companion = ref(null)
const companionHpPercent = computed(() => {
  if (!companion.value) return 0
  return (companion.value.hp / companion.value.maxHp) * 100
})

function getCompanionImage() {
  const id = companion.value?.id
  if (!id) return null
  const char = store.config.characters?.[id]
  if (char?.portrait) {
    return `/images/portrait/${char.portrait}`
  }
  return null
}
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

function getEffectTooltip(eff, maxHp) {
  let desc = ''
  const type = eff.type
  switch (type) {
    case 'dot': // dot 已经存储了计算好的伤害数值
      desc = `每回合损失 ${Math.floor(eff.value)} 点生命`
      break
    case 'bleed': // 流血存储的是百分比，需要 × 最大生命值
      desc = `每回合损失 ${Math.floor(maxHp * eff.value)} 点生命`
      break
    case 'freeze':
      desc = '冻结中'
      break
    case 'stun':
      desc = '眩晕中'
      break
    case 'shield':
      desc = `护盾 ${eff.value}`
      break
    case 'regen':
      desc = `每回合恢复 ${Math.floor(maxHp * eff.value)} 点生命`
      break
    case 'atkUp':
    case 'defUp':
    case 'spdUp':
    case 'critUp':
      desc = `提升 ${Math.floor(eff.value * 100)}%`
      break
    case 'atkDown':
    case 'defDown':
    case 'spdDown':
    case 'critDown':
      desc = `降低 ${Math.floor(-eff.value * 100)}%`
      break
    default:
      desc = eff.type
  }
  return `${type}：${desc}，剩余 ${eff.duration} 回合`
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
    freeze: 'mdi:snowflake',
    bleed: 'mdi:blood-bag',
    weak: 'mdi:emoticon-cry',
    regen: 'mdi:heart-circle',
    taunt: 'mdi:account-voice',
    lifestealBuff: 'mdi:vampire',
  }
  return map[type] || 'mdi:circle-small'
}

function initEngine() {
  if (!props.enemies || props.enemies.length === 0) {
    console.warn('没有敌人数据')
    enemies.value = []
    return
  }
   // 创建伙伴（从 store 获取当前同行伙伴）
  const companionId = store.player.currentCompanion || 'freyja';
  const companionData = store.config.characters?.[companionId];
  let companion = null;
  if (companionData) {
    companion = {
      id: companionData.id,
      name: companionData.name,
      attack: 20 + store.getAffectionLevel(companionId) * 5,  // 好感越高越强
      defense: 10,
      hp: 60,
      maxHp: 60,
      mp: 20,
      maxMp: 20,
      speed: 12,
      critRate: 5,
      critDmg: 150,
      icon: companionData.icon || 'mdi:account-heart',
      isCompanion: true,
    };
  }

  engine = new CombatEngine(store.playerStats, props.enemies, companion);
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
if (engine && engine.companion) {
  companion.value = {
    id: engine.companion.id,
    name: engine.companion.name,
    hp: engine.companion.hp,
    maxHp: engine.companion.maxHp,
    icon: engine.companion.icon,
  }
} else {
  companion.value = null
}

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

  // MP 检查：不够则提示并阻止行动
  if (skill.mpCost > store.player.mp) {
    showMessage('MP 不足！')
    return
  }

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
  // ⚡ 新增：所有敌人死后立即结束战斗

  syncStateFromEngine();

  if (engine.battleOver) {
    gameOver.value = true;
    gameOverMsg.value = '战斗失败';
    waiting.value = false;
    return;
  }
 // ⚡ 新增：所有敌人死后立即结束战斗
  if (engine.getAliveEnemies().length === 0) {
    engine.battleOver = true;
    engine.winner = 'player';
    gameOver.value = true;
    gameOverMsg.value = '战斗胜利！';
    victory();
    return;
  }

  // 3. 同伴行动（仅在有敌人时执行）
  const compResult = engine.executeCompanionAction();
  for (const msg of compResult.messages) {
    await showMessage(msg, 5000);
    syncStateFromEngine();
  }
// 同伴行动后再次检查
if (engine.getAliveEnemies().length === 0) {
  engine.battleOver = true
  engine.winner = 'player'
  gameOver.value = true
  gameOverMsg.value = '战斗胜利！'
  victory()
  return
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

  // 更新讨伐任务进度
  const enemyIds = props.enemies.map(e => e.id || e.template?.id).filter(Boolean)
  const questCompleted = store.updateHuntProgress(enemyIds)
  if (questCompleted) {
    showMessage('讨伐任务完成！', 2000)
  }

  // 原有胜利结算逻辑
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
    emit('defeat') 
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
  }
  
  // 通用掉落：每场战斗 1~3 个地下城徽记
  // 通用掉落：每场战斗 1~2 个地下城徽记
const tokenQty = Math.random() < 0.2 ? 2 : 1
store.addMaterial('dungeon_token', '地下城徽记', tokenQty)
  
  store.save()
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
  align-items: center;
  gap: 10px;
  z-index: 20;
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
/* 底部技能栏 */
.skill-bar {
  position: absolute;
  bottom:20vh;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
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
</style>