<template>
  <div id="game-root">
    <MainScreen
      v-if="!inBattle"
      @start-battle="onStartBattle"
    />
<BattleScene
  v-else
  :key="battleKey"
  :enemies="currentEnemies"
  @victory="onVictory"
  @exit="inBattle = false"
  @nextFloor="onNextFloor"
  @retreatToDungeon="() => { inBattle = false; store.pendingDungeonPanel = true }"
/>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import MainScreen from './components/MainScreen.vue'
import BattleScene from './components/BattleScene.vue'
import { useGameStore } from './store/gameStore'
import { spawnEnemy } from './config/biomeConfig'   // 添加导入
const battleKey = ref(0)
const store = useGameStore()
const inBattle = ref(false)
const currentEnemies = ref([])
function onRetreatToDungeon() {
  inBattle.value = false
  store.pendingDungeonPanel = true   // 标志位，通知 MainScreen 打开地下城面板
}
// 简易后备生成函数（防止 spawnEnemy 未定义）
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

// 全局时间流逝
let timeInterval
onMounted(() => {
  //   window.addEventListener('beforeunload', () => {
  //   store.save()
  // })
  //store.fixGhostEquipment()
  timeInterval = setInterval(() => {
    store.advanceTime(1)
  }, 1000)
  window.addEventListener('keydown', onKeyDebug)
})

onUnmounted(() => {
  clearInterval(timeInterval)
  window.removeEventListener('keydown', onKeyDebug)
})

function onKeyDebug(e) {
  if (e.key === 't' || e.key === 'T') {
    store.moveTo('town', 0, 0)
  }
}



function onVictory(reward) {
  // 所有奖励已在 BattleScene 中保存，这里只处理战斗状态
  inBattle.value = false
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



function onStartBattle(monsterIds) {
  const ids = Array.isArray(monsterIds) ? monsterIds : [monsterIds]
  const monsters = []

  const builtin = {
    slime: { id: 'slime', name: '史莱姆', baseHp: 35, baseAtk: 10, baseDef: 6, levelRange: [1,3], material: { id: 'slime_gel', name: '史莱姆凝露' }, icon: 'mdi:blur' },
    goblin: { id: 'goblin', name: '哥布林', baseHp: 45, baseAtk: 16, baseDef: 10, levelRange: [2,5], material: { id: 'goblin_fang', name: '哥布林之牙' }, icon: 'mdi:alien' },
    wolf: { id: 'wolf', name: '森林狼', baseHp: 50, baseAtk: 22, baseDef: 12, levelRange: [3,6], material: { id: 'wolf_fang', name: '狼牙' }, icon: 'mdi:dog' },
    scorpion: { id: 'scorpion', name: '毒蝎', baseHp: 40, baseAtk: 22, baseDef: 14, levelRange: [3,7], material: { id: 'scorpion_tail', name: '蝎尾针' }, icon: 'mdi:bug' },
    golem: { id: 'golem', name: '石魔像', baseHp: 80, baseAtk: 30, baseDef: 25, levelRange: [5,10], material: { id: 'golem_core', name: '魔像核心' }, icon: 'mdi:robot' },
    boss_wolfking: { id: 'boss_wolfking', name: '狼王', baseHp: 120, baseAtk: 35, baseDef: 20, levelRange: [8,12], material: { id: 'wolf_heart', name: '狼王之心' }, icon: 'mdi:skull', isBoss: true },
  }

  for (const item of ids) {
    let monster

    if (typeof item === 'object' && item !== null) {
      // 已经是完整的怪物对象（例如从 getRandomMonsterForFloor 返回）
      monster = { ...item } // 拷贝一份，避免修改原始数据
    } else {
      // 是字符串 ID，需要查找模板
      const id = item
      const template = store.config.monsterTemplates?.find(m => m.id === id) || builtin[id]
      if (!template) {
        console.error('找不到怪物模板:', id)
        continue
      }

      try {
        if (spawnEnemy) {
          monster = spawnEnemy(template, store.player.level)
        } else {
          monster = fallbackSpawnEnemy(template, store.player.level)
        }
        monster.icon = template.icon || 'mdi:help-circle'
        if (template.isBoss) monster.isBoss = true
      } catch (e) {
        console.error('生成怪物失败', e)
        monster = fallbackSpawnEnemy(template, store.player.level)
        monster.icon = template.icon || 'mdi:help-circle'
      }
    }

    // 统一解析技能
    monster.skills = parseMonsterSkills(monster) // 注意：这里需要从 monster 自身取 skillsText，不是从 template
    monsters.push(monster)
  }

  if (monsters.length === 0) {
    console.error('无法生成任何怪物')
    return
  }

  currentEnemies.value = monsters
  battleKey.value++
  inBattle.value = true
}
function onNextFloor() {
  if (!store.dungeon.active) {
    inBattle.value = false
    return
  }
  const monsterId = store.getRandomMonsterForFloor()
  if (!monsterId) {
    inBattle.value = false
    return
  }
  // 直接调用 onStartBattle，它会处理单个字符串
  onStartBattle(monsterId)
}
</script>

<style scoped>
#game-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>