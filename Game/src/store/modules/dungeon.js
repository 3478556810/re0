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
    const dg = configRef.dungeonConfigs[dungeon.currentDungeon] || DUNGEONS[dungeon.currentDungeon];
    if (!dg) return null;
    const floor = dungeon.currentFloor;
    const wLv = worldLevel;

    // 怪物数量
    let count = 1;
    if (floor % 5 === 0) count = 1;                 // Boss层
    else if (floor >= 7) count = 2 + Math.floor(Math.random() * 2); // 2~3只
    else if (floor >= 4) count = 1 + Math.floor(Math.random() * 2); // 1~2只
    else count = 1 + Math.floor(Math.random() * 2);   // 1~2只

    const pool = dg.monstersByFloor[floor] || dg.monstersByFloor[1] || ['slime'];
    const uniquePool = [...new Set(pool)];
    const selected = [];

    for (let i = 0; i < count; i++) {
        const pickId = uniquePool[Math.floor(Math.random() * uniquePool.length)];
        const template = configRef.monsterTemplates.find(t => t.id === pickId);
        if (!template) continue;

        // 基础等级 = 楼层×2 + 世界等级
        const baseLevel = floor * 2 + wLv;
        // 上下浮动2级
        const randomOffset = Math.floor(Math.random() * 5) - 2;
        let level = baseLevel + randomOffset;

        // 限制在模板定义的范围内
        const minLv = template.levelRange?.[0] ?? template.minLevel ?? 1;
        const maxLv = template.levelRange?.[1] ?? template.maxLevel ?? 99;
        level = Math.max(minLv, Math.min(maxLv, level));

        // 属性成长系数（比之前的0.25更平缓）
        const scale = 1 + (level - 1) * 0.2;
        selected.push({
            ...template,
            level,
            hp: Math.floor(template.baseHp * scale),
            maxHp: Math.floor(template.baseHp * scale),
            atk: Math.floor(template.baseAtk * scale),
            def: Math.floor(template.baseDef * scale),
            exp: Math.floor((template.exp || 20) * scale * 1.2),
        });
    }

    return selected.length > 0 ? selected : null;
}

  return { dungeon, startDungeon, clearFloor, retreat, getRandomMonsterForFloor }
}