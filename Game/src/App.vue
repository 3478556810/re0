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
  :storyBattle="!!storyBattleConfig"
  @victory="onVictory"
  @defeat="onBattleDefeat"
  @flee="onBattleExit"
  @exit="onBattleExit"
  @nextFloor="onNextFloor"
  @retreatToDungeon="() => { inBattle = false; store.pendingDungeonPanel = true }"
/>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import MainScreen from './components/MainScreen.vue'
import BattleScene from './components/BattleScene.vue'
import { useGameStore } from './store/gameStore'
import { spawnEnemy } from './config/biomeConfig'

const battleKey = ref(0)
const store = useGameStore()
const inBattle = ref(false)
const currentEnemies = ref([])

// 剧情战斗相关
const storyBattleConfig = ref(null)    // { enemies, winNext, loseNext, fleeNext }
const storyNodeBeforeBattle = ref(null) // 触发战斗前的剧情节点ID（保留，未用但可记录）

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
  // 请求全屏（需在用户手势中触发）
document.addEventListener('click', () => {
  if (document.fullscreenElement) return
  document.documentElement.requestFullscreen?.().catch(() => {})
}, { once: true })
    // 页面刷新后，清理可能残留的战斗状态
  if (!inBattle.value) {
    storyBattleConfig.value = null
    storyNodeBeforeBattle.value = null
    store.pendingStoryNodeAfterBattle = null
    sessionStorage.removeItem('storyBattleConfig')
  }
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

// 战斗结束处理
function onVictory(reward) {
  inBattle.value = false
  if (storyBattleConfig.value) {
    // 剧情战斗胜利：跳转到 winNext
    const nextNode = storyBattleConfig.value.winNext
    storyBattleConfig.value = null
    startStoryAfterBattle(nextNode)
  }
}

function onBattleExit() {
  inBattle.value = false
  if (storyBattleConfig.value) {
    // 逃跑或手动退出：跳转到 fleeNext
    const nextNode = storyBattleConfig.value.fleeNext || storyBattleConfig.value.loseNext
    storyBattleConfig.value = null
    startStoryAfterBattle(nextNode)
  }
}

// 战斗失败（由 BattleScene 发出 defeat 事件）
function onBattleDefeat() {
  inBattle.value = false
  if (storyBattleConfig.value) {
    const nextNode = storyBattleConfig.value.loseNext
    storyBattleConfig.value = null
    startStoryAfterBattle(nextNode)
  } else {
    // 普通战斗失败：重生
    store.respawn()
  }
}

// 战斗结束后继续剧情
function startStoryAfterBattle(nodeId) {
  if (!nodeId) return
  // 通过 store 设置待处理的剧情节点，MainScreen 会检测并启动
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

// 开始战斗（统一入口）
function onStartBattle(monstersOrConfig, storyNodeId = null) {
  // 如果是剧情触发的战斗：参数为一个对象 { enemies, winNext, loseNext, fleeNext }
  if (typeof monstersOrConfig === 'object' && monstersOrConfig.enemies) {
    storyBattleConfig.value = monstersOrConfig
    storyNodeBeforeBattle.value = storyNodeId

    // 根据配置生成怪物
    const enemyIds = storyBattleConfig.value.enemies
    const monsters = []
    for (const id of enemyIds) {
      const template = store.config.monsterTemplates?.find(m => m.id === id) || builtin[id]
      if (!template) {
        console.error('找不到怪物模板:', id)
        continue
      }
      // 简单生成，不使用世界等级，固定等级以匹配剧情难度
      const monster = fallbackSpawnEnemy(template, store.player.level)
      monster.icon = template.icon || 'mdi:help-circle'
      if (template.isBoss) monster.isBoss = true
      monster.skills = parseMonsterSkills(monster)
      monsters.push(monster)
    }
    currentEnemies.value = monsters
  } else {
    // 普通战斗（地下城或野外）
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
    // 清除剧情配置
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
</script>

<style scoped>
#game-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>