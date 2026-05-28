<template>
  <div class="battle-wrapper">
    <div class="battle-field pixel-panel">
      <div class="enemy-side">
        <Icon :icon="enemy.icon || 'mdi:help-circle'" width="48" />
        <div class="name">{{ enemy.name }} Lv.{{ enemy.level }}</div>
        <div class="hp-bar">
          <div class="hp-fill" :style="{ width: enemyHpPercent + '%' }"></div>
          <span>{{ Math.ceil(enemyHp) }}/{{ enemy.maxHp }}</span>
        </div>
      </div>
      <div class="vs">VS</div>
      <div class="player-side">
        <Icon icon="mdi:account" width="48" />
        <div class="name">{{ store.player.name }}</div>
        <div class="hp-bar">
          <div class="hp-fill" :style="{ width: playerHpPercent + '%' }"></div>
          <span>{{ Math.ceil(playerHp) }}/{{ store.player.maxHp }}</span>
        </div>
        <div class="mp">MP: {{ store.player.mp }}</div>
      </div>
    </div>

    <div class="action-panel">
      <button class="pixel-btn" @click="attack"><Icon icon="mdi:sword-cross" /> 攻击</button>
      <button class="pixel-btn" @click="skill"><Icon icon="mdi:fire" /> 火焰斩</button>
      <button class="pixel-btn" @click="defend"><Icon icon="mdi:shield" /> 防御</button>
    </div>

    <Transition name="fade">
      <div v-if="message" class="message pixel-panel">{{ message }}</div>
    </Transition>

    <BattleResultPanel v-if="showResult" :reward="reward" @close="onResultClose" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import BattleResultPanel from './BattleResultPanel.vue'

const props = defineProps({ enemy: Object, battleCoord: Object })
const emit = defineEmits(['victory', 'exit'])

const store = useGameStore()
const enemyHp = ref(props.enemy.hp)
const enemyHpTarget = ref(props.enemy.hp)
const playerHp = ref(store.player.hp)
const playerHpTarget = ref(store.player.hp)
const message = ref('')
const showResult = ref(false)
const reward = ref({ exp: 0, materials: [] })
let isDefending = false

const enemyHpPercent = computed(() => (enemyHp.value / props.enemy.maxHp) * 100)
const playerHpPercent = computed(() => (playerHp.value / store.player.maxHp) * 100)

let app

onMounted(async () => {
  await nextTick()
  const container = document.querySelector('.battle-pixi')
  const w = container.clientWidth
  const h = container.clientHeight
  app = new PIXI.Application({
    width: w,
    height: h,
    backgroundColor: 0x87CEEB,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  })
  container.appendChild(app.view)
  app.view.style.position = 'absolute'
  app.view.style.left = '0'
  app.view.style.top = '0'

  const enemySpr = new PIXI.Text(props.enemy.emoji, { fontSize: Math.min(w, h) * 0.2 })
  enemySpr.anchor.set(0.5)
  enemySpr.x = w * 0.7
  enemySpr.y = h * 0.3
  app.stage.addChild(enemySpr)

  const playerSpr = new PIXI.Text(store.player.emoji, { fontSize: Math.min(w, h) * 0.2 })
  playerSpr.anchor.set(0.5)
  playerSpr.x = w * 0.3
  playerSpr.y = h * 0.6
  app.stage.addChild(playerSpr)

  loop()
})

onUnmounted(() => {
  if (app) app.destroy(true)
  if (msgTimeout) clearTimeout(msgTimeout)
})

function loop() {
  if (Math.abs(currentEnemyHp.value - enemyHpTarget) > 0.5) {
    const diff = enemyHpTarget - currentEnemyHp.value
    currentEnemyHp.value += diff * 0.1
  }
  if (Math.abs(currentPlayerHp.value - playerHpTarget) > 0.5) {
    const diff = playerHpTarget - currentPlayerHp.value
    currentPlayerHp.value += diff * 0.1
  }
  requestAnimationFrame(loop)
}

function showMsg(msg) {
  if (msgTimeout) clearTimeout(msgTimeout)
  message.value = msg
  msgTimeout = setTimeout(() => message.value = '', 1500)
}

function calcDmg(atk, def, mult = 1, crit = false) {
  let dmg = atk * mult - def * 0.5
  dmg = Math.max(1, Math.floor(dmg))
  if (crit) dmg = Math.floor(dmg * 1.5)
  return dmg
}

function attack() {
  const crit = Math.random() < 0.1
  const dmg = calcDmg(store.player.attack, props.enemy.def, 1, crit)
  enemyHpTarget -= dmg
  showMsg(`攻击造成 ${dmg} 伤害${crit ? ' (暴击)' : ''}`)
  if (enemyHpTarget <= 0) { enemyHpTarget = 0; victory() }
  else setTimeout(enemyTurn, 800)
}

function skill() {
  if (store.player.mp < 5) { showMsg('MP不足！'); return }
  store.player.mp -= 5
  const crit = Math.random() < 0.1
  const dmg = calcDmg(store.player.attack * 1.8, props.enemy.def, 1, crit)
  enemyHpTarget -= dmg
  showMsg(`火焰斩造成 ${dmg} 伤害${crit ? ' (暴击)' : ''}`)
  if (enemyHpTarget <= 0) { enemyHpTarget = 0; victory() }
  else setTimeout(enemyTurn, 800)
}

function defend() {
  showMsg('防御姿态')
  isDefending = true
  setTimeout(enemyTurn, 800)
}

function enemyTurn() {
  let dmg = calcDmg(props.enemy.atk, store.player.defense)
  if (isDefending) { dmg = Math.floor(dmg / 2); isDefending = false }
  playerHpTarget -= dmg
  showMsg(`${props.enemy.name} 造成 ${dmg} 伤害`)
  if (playerHpTarget <= 0) {
    playerHpTarget = 0
    store.player.hp = 0
    showMsg('你倒下了...')
    setTimeout(() => {
      store.respawn()
      emit('exit')
    }, 2000)
  } else {
    store.player.hp = playerHpTarget
  }
}

function victory() {
  const exp = props.enemy.exp
  const mats = props.enemy.material ? [props.enemy.material] : []
  reward.value = { exp, materials: mats }
  showResult.value = true
}

function onResultClose() {
  store.addExperience(reward.value.exp)
  reward.value.materials.forEach(m => store.addMaterial(m.id, m.name))
  if (props.battleCoord) store.markEnemyDefeated(props.battleCoord.x, props.battleCoord.y)
  emit('victory', reward.value)
  showResult.value = false
}
</script>

<style scoped>
.battle-wrapper { position: fixed; inset: 0; background: #0a1a2a; font-family: 'Press Start 2P', cursive; }
.battle-pixi { position: absolute; top: 0; left: 0; width: 100%; height: 45%; }
.battle-ui { position: absolute; bottom: 0; left: 0; width: 100%; height: 55%; background: linear-gradient(0deg, #1e3a4d, #2a4a5a); padding: 15px; box-sizing: border-box; }
.unit { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
.sprite {
  width: 60px; height: 60px;
  background: #1a2a2a;
  border: 3px solid #b89a6a;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 36px;
  box-shadow: 0 0 0 2px #4a3a1a;
}
.info { flex: 1; }
.name { font-size: 12px; color: #ffd; margin-bottom: 5px; }
.hp-bar { background: #603020; height: 18px; border-radius: 9px; position: relative; overflow: hidden; }
.hp-fill { background: #4caf50; height: 100%; border-radius: 9px; transition: width 0.1s; }
.hp-text { position: absolute; top: 0; left: 10px; font-size: 8px; line-height: 18px; color: white; }
.mp { font-size: 10px; color: #aaccff; margin-top: 4px; }
.actions { display: flex; justify-content: center; gap: 20px; margin-top: 20px; }
.message { position: absolute; bottom: 30%; left: 50%; transform: translateX(-50%); padding: 8px 24px; font-size: 12px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>