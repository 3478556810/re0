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
import { spawnEnemy } from './config/biomeConfig'

const battleKey = ref(0)
const store = useGameStore()
const inBattle = ref(false)
const currentEnemies = ref([])

// 后备生成函数
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

// 内置兜底模板
const builtin = {
  slime: { id: 'slime', name: '史莱姆', baseHp: 35, baseAtk: 10, baseDef: 6, levelRange: [1,3], material: { id: 'slime_gel', name: '史莱姆凝露' }, icon: 'mdi:blur' },
  goblin: { id: 'goblin', name: '哥布林', baseHp: 45, baseAtk: 16, baseDef: 10, levelRange: [2,5], material: { id: 'goblin_fang', name: '哥布林之牙' }, icon: 'mdi:alien' },
  wolf: { id: 'wolf', name: '森林狼', baseHp: 50, baseAtk: 22, baseDef: 12, levelRange: [3,6], material: { id: 'wolf_fang', name: '狼牙' }, icon: 'mdi:dog' },
  scorpion: { id: 'scorpion', name: '毒蝎', baseHp: 40, baseAtk: 22, baseDef: 14, levelRange: [3,7], material: { id: 'scorpion_tail', name: '蝎尾针' }, icon: 'mdi:bug' },
  golem: { id: 'golem', name: '石魔像', baseHp: 80, baseAtk: 30, baseDef: 25, levelRange: [5,10], material: { id: 'golem_core', name: '魔像核心' }, icon: 'mdi:robot' },
  boss_wolfking: { id: 'boss_wolfking', name: '狼王', baseHp: 120, baseAtk: 35, baseDef: 20, levelRange: [8,12], material: { id: 'wolf_heart', name: '狼王之心' }, icon: 'mdi:skull', isBoss: true },
}

function onStartBattle(monstersInput) {
  const inputArray = Array.isArray(monstersInput) ? monstersInput : [monstersInput]
  const monsters = []

  for (const item of inputArray) {
    let monster

    if (typeof item === 'object' && item !== null) {
      // 已经是完整怪物对象（比如从 getRandomMonsterForFloor 返回的）
      monster = { ...item }
      if (!monster.icon) monster.icon = 'mdi:help-circle'
    } else {
      // 字符串 ID，需要生成
      const id = item
      const template = store.config.monsterTemplates?.find(m => m.id === id) || builtin[id]
      if (!template) {
        console.error('找不到怪物模板:', id)
        continue
      }

      try {
        monster = spawnEnemy ? spawnEnemy(template, store.player.level) : fallbackSpawnEnemy(template, store.player.level)
        monster.icon = template.icon || 'mdi:help-circle'
        if (template.isBoss) monster.isBoss = true
      } catch (e) {
        console.error('生成怪物失败', e)
        monster = fallbackSpawnEnemy(template, store.player.level)
        monster.icon = template.icon || 'mdi:help-circle'
      }
    }

    monster.skills = parseMonsterSkills(monster)
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
  const monsters = store.getRandomMonsterForFloor()
  if (!monsters || monsters.length === 0) {
    inBattle.value = false
    return
  }
  onStartBattle(monsters)
}
</script>

<style scoped>
#game-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>