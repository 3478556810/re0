<template>
  <div id="game-root">
    <!-- 全局浮动提示 -->
    <Transition name="fade">
      <div v-if="globalToast.visible" class="global-toast">{{ globalToast.message }}</div>
    </Transition>
    <!-- 自定义确认弹窗 -->
    <div v-if="confirmDialog.visible" class="confirm-overlay">
      <div class="confirm-box pixel-panel">
        <p>{{ confirmDialog.message }}</p>
        <div class="confirm-buttons">
          <button class="pixel-btn small primary" @click="onConfirmOk">确定</button>
          <button class="pixel-btn small" @click="onConfirmCancel">取消</button>
        </div>
      </div>
    </div>

    <MainScreen
      v-if="!inBattle"
      @start-battle="onStartBattle"
    />

   <BattleScene
  v-else
  :key="battleKey"
  :enemies="currentEnemies"
  :storyBattle="!!storyBattleConfig"
  @victory="onVictory"
  @defeat="onBattleDefeat"
  @flee="onBattleExit"
  @exit="onBattleExit"
  @next-floor="onNextFloor"   
  @retreatToDungeon="() => { inBattle = false; store.pendingDungeonPanel = true }"
/>
  </div>
</template>


<script setup>
import '@/assets/css/gem-common.css'
import { watch,ref, reactive, provide, onMounted, onUnmounted } from 'vue'
import MainScreen from './components/MainScreen.vue'
import BattleScene from './components/BattleScene/BattleScene.vue'
import { useGameStore } from './store/gameStore'
import { spawnEnemy } from './config/biomeConfig'
import { createRaidMonster } from '@/config/raidHelpers'
import { nextTick } from 'vue' // 确保已导入
import { generateTowerMonsters } from '@/config/towerGenerator'
// ✅ 终极方案：每 1 秒检查一次 story_raid_clears，全通即触发
let raidCheckInterval = null
// 在 onMounted 内部，已有代码之后添加

onMounted(() => {


  if (!store.activeCompanionId && store.companions?.length > 0) {
    store.activeCompanionId = store.companions[0].id
    store.save()
  }

  raidCheckInterval = setInterval(() => {
    if (!store.isStoryMode || store.storyEndTime) return
    const key = 'story_raid_clears'
    const clears = JSON.parse(sessionStorage.getItem(key) || '{}')
   const allBosses = ['raid_gladiator', 'raid_lava_core', 'raid_bishop']
    if (allBosses.every(id => clears[id])) {
      store.storyEndTime = Date.now()
    }
  }, 1000)
})
// ★ 修复后的重试函数


// 删除原来的 handleRaidRetry，换成这个

onUnmounted(() => {
  if (raidCheckInterval) clearInterval(raidCheckInterval)
})
const confirmDialog = reactive({ visible: false, message: '', resolve: null })

function showConfirm(msg) {
  return new Promise((resolve) => {
    confirmDialog.message = msg
    confirmDialog.visible = true
    confirmDialog.resolve = resolve
  })
}

function onConfirmOk() {
  confirmDialog.visible = false
  if (confirmDialog.resolve) confirmDialog.resolve(true)
}

function onConfirmCancel() {
  confirmDialog.visible = false
  if (confirmDialog.resolve) confirmDialog.resolve(false)
}

provide('showConfirm', showConfirm)

const globalToast = reactive({ visible: false, message: '' })
let toastTimer = null

function showToast(msg) {
  globalToast.message = msg
  globalToast.visible = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    globalToast.visible = false
  }, 2000)
}
window.showToast = showToast
provide('showToast', showToast)

const battleKey = ref(0)
const store = useGameStore()
const inBattle = ref(false)
const currentEnemies = ref([])
const storyBattleConfig = ref(null)
const storyNodeBeforeBattle = ref(null)

function fallbackSpawnEnemy(template, playerLevel) {
  const lv = Math.floor(Math.random() * 3) + 1
  const material = template.material ? { ...template.material } : { id: 'unknown', name: '未知材料' }
  if (!material.name) material.name = material.id
  return {
    ...template,
    level: lv,
    hp: (template.baseHp || 30) + lv * 5,
    maxHp: (template.baseHp || 30) + lv * 5,
    atk: (template.baseAtk || 10) + lv * 2,
    def: (template.baseDef || 5) + lv,
    exp: 20 + lv * 10,
    gold: 0,
    material: material
  }
}

// ============ 战斗胜利 ============
function onVictory(reward) {
  inBattle.value = false

  // 剧情战斗跳转
  if (storyBattleConfig.value) {
    const nextNode = storyBattleConfig.value.winNext
    storyBattleConfig.value = null
    startStoryAfterBattle(nextNode)
  }

  // 副本进度保存
  if (store.dungeon.isRaidBattle && store.dungeon.currentRaidBoss) {
    if (store.isStoryMode) {
      const key = 'story_raid_clears'
      const clears = JSON.parse(sessionStorage.getItem(key) || '{}')
      clears[store.dungeon.currentRaidBoss] = true
      sessionStorage.setItem(key, JSON.stringify(clears))
      console.log('✅ 进度已保存:', clears)
    }
   
  }

  // ✅ 全通检测（任何时候，只要剧情模式且全通且未结算就触发）
  if (store.isStoryMode && !store.storyEndTime) {
    const key = 'story_raid_clears'
    const clears = JSON.parse(sessionStorage.getItem(key) || '{}')
    const allBosses = ['boss_goblin_king', 'boss_fire_dragon', 'boss_shadow_lord']
    if (allBosses.every(id => clears[id])) {
      store.storyEndTime = Date.now()
    }
  }

  // 地下城通关检测
  if (store.isStoryMode && store.dungeon.completed) {
    store.storyEndTime = Date.now()
    store.dungeon.completed = false
    store.dungeon.active = false
  }
}

function onBattleExit() {
     store.towerMode = false      // 强制退出无限塔
    store.towerFloor = 1
  inBattle.value = false
  if (storyBattleConfig.value) {
    const nextNode = storyBattleConfig.value.fleeNext || storyBattleConfig.value.loseNext
    storyBattleConfig.value = null
    startStoryAfterBattle(nextNode)
  }
}

function onBattleDefeat() {
  inBattle.value = false
  if (storyBattleConfig.value) {
    const nextNode = storyBattleConfig.value.loseNext
    storyBattleConfig.value = null
    startStoryAfterBattle(nextNode)
  } else {
    store.respawn()
  }
}

function startStoryAfterBattle(nodeId) {
  if (!nodeId) return
  store.pendingStoryNodeAfterBattle = nodeId
}

function parseMonsterSkills(monster) {
  if (!monster || !monster.skillsText) return []
  try {
    const parsed = JSON.parse(monster.skillsText)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

// 内置兜底模板
const builtin = {
  slime: { id: 'slime', name: '史莱姆', baseHp: 35, baseAtk: 10, baseDef: 6, levelRange: [1,3], material: { id: 'slime_gel', name: '史莱姆凝露' }, icon: 'mdi:blur' },
  goblin: { id: 'goblin', name: '哥布林', baseHp: 45, baseAtk: 16, baseDef: 10, levelRange: [2,5], material: { id: 'goblin_fang', name: '哥布林之牙' }, icon: 'mdi:alien' },
  wolf: { id: 'wolf', name: '森林狼', baseHp: 50, baseAtk: 22, baseDef: 12, levelRange: [3,6], material: { id: 'wolf_fang', name: '狼牙' }, icon: 'mdi:dog' },
  scorpion: { id: 'scorpion', name: '毒蝎', baseHp: 40, baseAtk: 22, baseDef: 14, levelRange: [3,7], material: { id: 'scorpion_tail', name: '蝎尾针' }, icon: 'mdi:bug' },
  golem: { id: 'golem', name: '石魔像', baseHp: 80, baseAtk: 30, baseDef: 25, levelRange: [5,10], material: { id: 'golem_core', name: '魔像核心' }, icon: 'mdi:robot' },
  boss_wolfking: { id: 'boss_wolfking', name: '狼王', baseHp: 120, baseAtk: 35, baseDef: 20, levelRange: [8,12], material: { id: 'wolf_heart', name: '狼王之心' }, icon: 'mdi:skull', isBoss: true },
}

function onStartBattle(monstersOrConfig, storyNodeId = null) {
    // 简单判断：如果传入的怪物没有 isRaidBoss 属性，才清除副本标记
    const firstMonster = Array.isArray(monstersOrConfig) ? monstersOrConfig[0] : monstersOrConfig;
    if (firstMonster && !firstMonster.isRaidBoss) {
        store.dungeon.isRaidBattle = false;
    }
  if (typeof monstersOrConfig === 'object' && monstersOrConfig.enemies) {
    storyBattleConfig.value = monstersOrConfig
    storyNodeBeforeBattle.value = storyNodeId
    const enemyIds = storyBattleConfig.value.enemies
    const monsters = []
    for (const id of enemyIds) {
      const template = store.config.monsterTemplates?.find(m => m.id === id) || builtin[id]
      if (!template) continue
      const monster = fallbackSpawnEnemy(template, store.player.level)
      monster.icon = template.icon || 'mdi:help-circle'
      if (template.isBoss) monster.isBoss = true
      monster.skills = parseMonsterSkills(monster)
      monsters.push(monster)
    }
    currentEnemies.value = monsters
  } else {
    const inputArray = Array.isArray(monstersOrConfig) ? monstersOrConfig : [monstersOrConfig]
    const monsters = []
    for (const item of inputArray) {
      let monster
      if (typeof item === 'object' && item !== null) {
        monster = { ...item }
        if (!monster.icon) monster.icon = 'mdi:help-circle'
      } else {
        const id = item
        const template = store.config.monsterTemplates?.find(m => m.id === id) || builtin[id]
        if (!template) continue
        try {
          monster = spawnEnemy ? spawnEnemy(template, store.player.level) : fallbackSpawnEnemy(template, store.player.level)
          monster.icon = template.icon || 'mdi:help-circle'
          if (template.isBoss) monster.isBoss = true
        } catch (e) {
          monster = fallbackSpawnEnemy(template, store.player.level)
          monster.icon = template.icon || 'mdi:help-circle'
        }
      }
      monster.skills = parseMonsterSkills(monster)
      monsters.push(monster)
    }
    if (monsters.length === 0) return
    currentEnemies.value = monsters
    storyBattleConfig.value = null
    storyNodeBeforeBattle.value = null
  }
  battleKey.value++
  inBattle.value = true
}

function onNextFloor() {
    if (!store.dungeon.active) {
        inBattle.value = false
        return
    }
    const monsters = store.getRandomMonsterForFloor()
    if (!monsters || monsters.length === 0) {
        inBattle.value = false
        return
    }
    onStartBattle(monsters)
}



// 键盘调试
function onKeyDebug(e) {
  if (e.key === 't' || e.key === 'T') {
    store.moveTo('town', 0, 0)
  }
}

let timeInterval
// 在 onMounted 内部添加
watch(inBattle, (newVal, oldVal) => {
    // 从战斗中退出（true → false）时，检查并恢复血量
    if (oldVal === true && newVal === false) {
        if (store.player.hp <= 0) {
            console.warn('战斗结束检测到0血，自动恢复')
            store.player.hp = store.player.maxHp
            store.player.mp = store.player.maxMp
            store.save()
        }
    }
})
onMounted(() => {
  if (!import.meta.env.DEV) {
    const setFullscreenState = () => { isFullscreen.value = !!document.fullscreenElement }
    const requestFullscreen = () => { document.documentElement.requestFullscreen?.().catch(() => {}) }
    const onFirstInteraction = () => {
      requestFullscreen()
      document.removeEventListener('click', onFirstInteraction)
      document.removeEventListener('touchstart', onFirstInteraction)
    }
    document.addEventListener('click', onFirstInteraction)
    document.addEventListener('touchstart', onFirstInteraction)
    document.addEventListener('fullscreenchange', setFullscreenState)
    document.addEventListener('webkitfullscreenchange', setFullscreenState)
  }
  if (!inBattle.value) {
    storyBattleConfig.value = null
    storyNodeBeforeBattle.value = null
    store.pendingStoryNodeAfterBattle = null
    sessionStorage.removeItem('storyBattleConfig')
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister()
      }
    })
  }
  timeInterval = setInterval(() => { store.advanceTime(1) }, 1000)
  window.addEventListener('keydown', onKeyDebug)
})

onUnmounted(() => {
  clearInterval(timeInterval)
  window.removeEventListener('keydown', onKeyDebug)
})
</script>
<style scoped>
#game-root { width: 100vw; height: 100vh; overflow: hidden; }
.global-toast {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85); border: 1px solid #ffd700; color: #ffd;
  padding: 12px 24px; border-radius: 12px; font-family: 'Press Start 2P', cursive;
  font-size: 10px; z-index: 9999; pointer-events: none; white-space: nowrap;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.confirm-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7);
  display: flex; justify-content: center; align-items: center; z-index: 9998;
}
.confirm-box {
  background: rgba(20, 28, 40, 0.95); border: 2px solid #ffd700;
  border-radius: 16px; padding: 24px; min-width: 300px; text-align: left;
  color: #ffd; font-family: 'Press Start 2P', cursive; font-size: 9px;
  line-height: 2.0; white-space: pre-wrap;
}
.confirm-box p { margin-bottom: 20px; line-height: 2.0; }
.confirm-buttons { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
</style>