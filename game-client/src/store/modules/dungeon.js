import { reactive } from 'vue'
import { DUNGEONS } from '../../config/dungeonConfig'

export function useDungeon(configRef) { // configRef 是 config reactive 的引用
  const dungeon = reactive({
    completed: false,
    unlockedFloors: [1],
    savedFloors: { 1: true },
    active: false,
    currentDungeon: null,
    currentFloor: 1,
    maxFloors: 5,
    floorsCleared: 0,
    lastRetreatDay: 0,
    retreatCooldown: 1,
    bossDefeated: false,
    isDungeonBattle: false,
    lastDungeonId: null,
    storyTriggered: {}
  })

  function startDungeon(dungeonId) {
    const dg = configRef.dungeonConfigs[dungeonId] || DUNGEONS[dungeonId]
    if (!dg) return false
    dungeon.active = true
    dungeon.currentDungeon = dungeonId
    dungeon.currentFloor = 1
    dungeon.maxFloors = dg.maxFloors
    dungeon.floorsCleared = 0
    dungeon.bossDefeated = false
    dungeon.lastDungeonId = dungeonId
    return true
  }

  function clearFloor() {
    dungeon.floorsCleared++
    if (dungeon.currentFloor % 5 === 0) {
      const nextFloor = dungeon.currentFloor + 1
      if (!dungeon.unlockedFloors.includes(nextFloor)) dungeon.unlockedFloors.push(nextFloor)
      dungeon.savedFloors[nextFloor] = true
    }
    if (dungeon.currentFloor >= dungeon.maxFloors) {
      dungeon.bossDefeated = true
      dungeon.completed = true
    } else {
      dungeon.currentFloor++
    }
  }

  function retreat(worldDay) {
    const dg = configRef.dungeonConfigs[dungeon.currentDungeon] || DUNGEONS[dungeon.currentDungeon]
    dungeon.lastRetreatDay = worldDay
    dungeon.retreatCooldown = dg?.cooldown || 1
    dungeon.lastDungeonId = dungeon.currentDungeon
    if (dungeon.currentFloor % 5 === 0) {
      if (!dungeon.unlockedFloors.includes(dungeon.currentFloor)) dungeon.unlockedFloors.push(dungeon.currentFloor)
      dungeon.savedFloors[dungeon.currentFloor] = true
    }
    dungeon.active = false
  }

 function getRandomMonsterForFloor(worldLevel) {
  const dg = configRef.dungeonConfigs[dungeon.currentDungeon] || DUNGEONS[dungeon.currentDungeon]
  if (!dg) return null

  const floor = dungeon.currentFloor
  const wLv = worldLevel

  // 怪物数量：Boss层1只，普通层2~3只
  const count = floor % 5 === 0 ? 1 : 2 + Math.floor(Math.random() * 2)

  const pool = dg.monstersByFloor[floor] || dg.monstersByFloor[1] || ['slime']
  const uniquePool = [...new Set(pool)]
  const selected = []

  for (let i = 0; i < count; i++) {
    const pickId = uniquePool[Math.floor(Math.random() * uniquePool.length)]
    const template = configRef.monsterTemplates.find(t => t.id === pickId)
    if (!template) continue

    // 等级：基于世界等级（每级+7级）和楼层（每层+0.8级），确保高世界等级怪物远超玩家
    // 世界等级2时基础等级 = 2*7 = 14，加上楼层偏移可达15+
    const baseLevel = Math.max(1, Math.floor(wLv * 7 + floor * 0.8))
    const randomOffset = Math.floor(Math.random() * 3) - 1  // -1,0,1
    let level = baseLevel + randomOffset

    // 等级限制（若模板有上限则不能超过，若无则放宽到99）
    const minLv = template.levelRange?.[0] ?? template.minLevel ?? 1
    const maxLv = template.levelRange?.[1] ?? template.maxLevel ?? 99
    level = Math.max(minLv, Math.min(maxLv, level))

    // 属性缩放：攻击力与世界等级强相关（每级+40%），生命/防御中等（每级+20%）
    const worldAtkBonus = wLv * 0.4
    const worldDefHpBonus = wLv * 0.2
    const floorBonus = floor * 0.06    // 楼层每层+6%
    const atkScale = 1 + worldAtkBonus + floorBonus
    const defHpScale = 1 + worldDefHpBonus + floorBonus

    selected.push({
      ...template,
      level,
      hp: Math.floor(template.baseHp * defHpScale),
      maxHp: Math.floor(template.baseHp * defHpScale),
      atk: Math.floor(template.baseAtk * atkScale),
      def: Math.floor(template.baseDef * defHpScale),
      exp: Math.floor((template.exp || 20) * atkScale * 1.2),
    })
  }

  return selected.length > 0 ? selected : null
}

  return { dungeon, startDungeon, clearFloor, retreat, getRandomMonsterForFloor }
}