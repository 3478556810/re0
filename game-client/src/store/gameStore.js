import { defineStore } from 'pinia'
import { reactive, ref, computed } from 'vue'
import { usePlayer } from './modules/player'
import { useInventory } from './modules/inventory'
import { useWorld } from './modules/world'
import { useDungeon } from './modules/dungeon'
import { useHuntQuests } from './modules/huntQuests'
import { useAffection } from './modules/affection'
import { useRank } from './modules/rank'
import { useCombatStats } from './modules/combatStats'
import { loadContentPacks } from '../utils/contentLoader'
import { defaultConfig } from './modules/config'
import { useCompanion } from './modules/companion'

// 简单生成饰品（需根据实际实现替换）
function generateAccessoryLoot(params, worldLevel) {
  // 占位实现，实际应调用 config 中的 accessory 生成函数
  return { id: `acc_${Date.now()}`, name: '随机饰品', quality: 'purple', level: params.level || 1, atk: 10, def: 5 }
}

export const useGameStore = defineStore('game', () => {
  // 初始化所有模块
  const playerModule = usePlayer()
  const inventoryModule = useInventory()
  const worldModule = useWorld()
  const companionModule = useCompanion()
const companionStrategy = ref('free') // 伙伴策略记忆
  // config 直接使用 defaultConfig，不要省略
  const config = reactive(defaultConfig)

  // 设施 (原 facilities 保留基本结构，股票功能可忽略)
  const facilities = reactive({
    bank: { deposit: 0, maturityDay: null, rate: null },
    stocks: [],  // 股票已废弃，留空数组
    farm: []
  })

  const dungeonModule = useDungeon(config)
  const huntQuestModule = useHuntQuests()
  const affectionModule = useAffection()

  const pendingRankUp = ref(false)
  const pendingTargetRank = ref(null)
  const rankModule = useRank(playerModule.player, pendingRankUp, pendingTargetRank, config)

  // 套装效果配置（暂时保留在主 store 中）
const setBonuses = {
  // 龙骸套装 —— 强化持续输出与收割
dragon_set: {
  3: { 
    desc: '攻击时为目标附加「龙焰印记」3回合，使其受到伤害+25%', 
    dragonMarkOnHit: 0.25   // 原 0.20 → 0.25
  },
  6: { 
    desc: '龙焰印记增伤+85%；自身生命低于50%时，对印记目标吸血80%', 
    dragonMarkOnHit: 0.60,         // 原 0.60 不变
    lowHpLifestealOnMark: 80       // 原 60 → 80，残局吸血更强
  }
},

  // 暗影套装 —— 平衡暴击与增伤，不再无脑强
  shadow_set: {
    3: { 
      desc: '攻击时为目标附加「暗蚀印记」3回合，使其受到伤害+18%；自身暴击率+10%', 
      shadowMarkOnHit: 0.18,        // 原 0.25 → 0.18（降低初始增伤）
      critRate: 10                  // 暴击率 12% → 10%
    },
    6: { 
      desc: '暗蚀印记增伤+42%；对印记目标暴击伤害+80%', 
      shadowMarkOnHit: 0.42,        // 原 0.50 → 0.42（总增伤从0.75降到0.60）
      critDmgOnMark: 80             // 暴伤加成从100%降到80%
    }
  },

  // 血怒套装 —— 大幅强化满血爆发与斩杀
  crimson_set: {
    3: { 
      desc: '对生命高于70%的敌人伤害+55%', 
      specialFullHpDmg: 55          // 原 35 → 55（满血增伤大幅提高）
    },
    6: { 
      desc: '对生命低于30%的敌人伤害+90%；攻击Boss时额外+45%伤害', 
      specialLowHpDmg: 90,          // 原 60 → 90（斩杀线更恐怖）
      specialBossDmg: 45            // 原 30 → 45（Boss增伤提升）
    }
  }
}
  config.setBonuses = setBonuses

  const combatModule = useCombatStats(inventoryModule.equipment, config, playerModule.player)
const towerLoot = ref([])         // 无限塔临时战利品
const towerMode = ref(false)      // 是否在无限塔中
const towerFloor = ref(1)         // 当前层数
  // 其他 refs
  const pendingDungeonPanel = ref(false)
  const pendingStoryNodeAfterBattle = ref(null)
  const storyBestTime = ref(null)
  const storyEndTime = ref(null)
  const defeatedEnemies = ref(new Set())
  const exploredTiles = ref(new Set())
  const currentEvent = ref({ title: '', description: '', effects: [] })

  // 持久化
  function save() {
    const state = {
towerLoot: towerLoot.value || [],
towerMode: towerMode.value,
towerFloor: towerFloor.value,
companionStrategy: companionStrategy.value,
      player: { ...playerModule.player },
      inventory: inventoryModule.inventory.map(item => {
        if (!item) return null
        return {
          id: item.id, part: item.part || item.type, name: item.name,
          quality: item.quality, level: item.level || 1,
          atk: item.atk || 0, def: item.def || 0,
          baseAtk: item.baseAtk || 10, baseDef: item.baseDef || 5,
          extraStats: item.extraStats ? { ...item.extraStats } : {},
          _initialExtraStats: item._initialExtraStats ? { ...item._initialExtraStats } : {},
          affixes: item.affixes ? item.affixes.map(a => ({ id: a.id, level: a.level })) : [],
          fixedAffix: item.fixedAffix ? { ...item.fixedAffix } : null,
          bossDmgBonus: item.bossDmgBonus || 0,
          setId: item.setId || '',
          levelFailCount: item.levelFailCount || 0,
          qualityFailCount: item.qualityFailCount || 0,
          levelRequired: item.levelRequired || 1,
          gemSlots: item.gemSlots || 0,
          type: item.type || item.part
        }
      }),
      
      materials: Object.fromEntries(Object.entries(inventoryModule.materials).map(([k, v]) => [k, { ...v }])),
      equipment: Object.fromEntries(Object.entries(inventoryModule.equipment).map(([k, v]) => {
        if (!v) return [k, null]
        return [k, {
          id: v.id, part: v.part || v.type, name: v.name, quality: v.quality,
          level: v.level || 1, atk: v.atk || 0, def: v.def || 0,
          baseAtk: v.baseAtk || 10, baseDef: v.baseDef || 5,
          extraStats: v.extraStats ? { ...v.extraStats } : {},
          _initialExtraStats: v._initialExtraStats ? { ...v._initialExtraStats } : {},
          affixes: v.affixes ? v.affixes.map(a => ({ id: a.id, level: a.level })) : [],
          fixedAffix: v.fixedAffix ? { ...v.fixedAffix } : null,
          bossDmgBonus: v.bossDmgBonus || 0,
          setId: v.setId || '', levelFailCount: v.levelFailCount || 0,
          qualityFailCount: v.qualityFailCount || 0,
          levelRequired: v.levelRequired || 1, gemSlots: v.gemSlots || 0
        }]
      })),
      world: { ...worldModule.world },
      weather: { ...worldModule.weather },
      facilities: { bank: { ...facilities.bank }, stocks: [], farm: [] },
      config: { ...config },
      dungeon: { ...dungeonModule.dungeon, unlockedFloors: [...dungeonModule.dungeon.unlockedFloors], savedFloors: { ...dungeonModule.dungeon.savedFloors } },
      activeHuntQuests: JSON.parse(JSON.stringify(huntQuestModule.activeHuntQuests.value)),
      affection: { ...affectionModule.affection },
      storyBestTime: storyBestTime.value,
      pendingRankUp: pendingRankUp.value,
      pendingTargetRank: pendingTargetRank.value,
      defeated: Array.from(defeatedEnemies.value),
      explored: Array.from(exploredTiles.value),
      currentEvent: currentEvent.value ? { ...currentEvent.value } : null,
      companions: companionModule.getSaveData(),
      activeCompanionId: companionModule.activeCompanionId.value
    }
    localStorage.setItem('star-trails-save', JSON.stringify(state))
  }

  function load() {
    const saved = localStorage.getItem('star-trails-save')
    if (!saved) {
      pendingRankUp.value = false
      pendingTargetRank.value = null
      huntQuestModule.activeHuntQuests.value = []
      return
    }
    try {
      const data = JSON.parse(saved)
      Object.assign(playerModule.player, data.player || {})
      const savedInv = (data.inventory || []).map(item => {
        if (!item) return null
        return {
          ...item,
          part: item.part || item.type,
          extraStats: item.extraStats || {},
          _initialExtraStats: item._initialExtraStats || { ...(item.extraStats || {}) },
          affixes: item.affixes || [],
          fixedAffix: item.fixedAffix || null,
          bossDmgBonus: item.bossDmgBonus || 0,
          level: item.level || 1,
          baseAtk: item.baseAtk || 10,
          baseDef: item.baseDef || 5,
          levelFailCount: item.levelFailCount || 0,
          qualityFailCount: item.qualityFailCount || 0
        }
      })
      inventoryModule.inventory.splice(0, inventoryModule.inventory.length, ...savedInv)
      for (const key of Object.keys(inventoryModule.materials)) delete inventoryModule.materials[key]
      Object.assign(inventoryModule.materials, data.materials || {})
      // 恢复装备时确保所有字段完整
      const savedEquipment = data.equipment || {}
      for (const slot of Object.keys(inventoryModule.equipment)) {
        const saved = savedEquipment[slot]
        if (saved) {
          inventoryModule.equipment[slot] = {
            ...saved,
            part: saved.part || saved.type,
            type: saved.type || saved.part,
            extraStats: saved.extraStats || {},
            _initialExtraStats: saved._initialExtraStats || { ...saved.extraStats },
            affixes: saved.affixes || [],
            fixedAffix: saved.fixedAffix || null,
            bossDmgBonus: saved.bossDmgBonus || 0,
            levelFailCount: saved.levelFailCount || 0,
            qualityFailCount: saved.qualityFailCount || 0
          }
        } else {
          inventoryModule.equipment[slot] = null
        }
      }

      Object.assign(worldModule.world, data.world || {})
      Object.assign(worldModule.weather, data.weather || {})
      Object.assign(facilities.bank, data.facilities?.bank || {})
      Object.assign(dungeonModule.dungeon, data.dungeon || {})
      huntQuestModule.activeHuntQuests.value = data.activeHuntQuests || []
      Object.assign(affectionModule.affection, data.affection || {})

      // 遍历背包和装备，补全 baseAtk/baseDef
      function patchItem(item) {
        if (!item) return item
        if (item.baseAtk === undefined) item.baseAtk = 10
        if (item.baseDef === undefined) item.baseDef = 5
        return item
      }
      inventoryModule.inventory.forEach(patchItem)
      Object.values(inventoryModule.equipment).forEach(patchItem)

      storyBestTime.value = data.storyBestTime ?? null
      pendingRankUp.value = data.pendingRankUp ?? false
      pendingTargetRank.value = data.pendingTargetRank ?? null
      defeatedEnemies.value = new Set(data.defeated || [])
      exploredTiles.value = new Set(data.explored || [])
      currentEvent.value = data.currentEvent || { title: '', description: '', effects: [] }
// 恢复塔状态
if (data.companionStrategy) companionStrategy.value = data.companionStrategy
if (data.towerLoot) towerLoot.value = data.towerLoot
else towerLoot.value = []
if (data.towerMode !== undefined) towerMode.value = data.towerMode
if (data.towerFloor !== undefined) towerFloor.value = data.towerFloor
      // 恢复伙伴数据
     // 恢复伙伴数据
if (data.companions) {
  companionModule.loadFromSave(data.companions)
} else {
  // 没有存档时，用 config 初始化
  const chars = config.characters || {}
  companionModule.initCompanions(chars)
}
      if (data.activeCompanionId) {
        companionModule.activeCompanionId.value = data.activeCompanionId
     } else if (companionModule.companions.value.length) {  // 正确
        companionModule.activeCompanionId.value = companionModule.companions[0].id
      }
    } catch (e) {
      console.error('存档加载失败', e)
    }
    if (!pendingRankUp.value) {
      const currentIdx = rankModule.rankConfig.findIndex(r => r.name === playerModule.player.rank)
      if (currentIdx !== -1 && currentIdx < rankModule.rankConfig.length - 1 && playerModule.player.rankExp >= rankModule.rankConfig[currentIdx].requiredExp) {
        pendingRankUp.value = true
        pendingTargetRank.value = rankModule.rankConfig[currentIdx + 1].name
        window.dispatchEvent(new CustomEvent('needBossQuest', { detail: { currentRank: playerModule.player.rank, nextRank: pendingTargetRank.value } }))
      }
    }
  }

  function $reset() {
    localStorage.removeItem('star-trails-save')
    location.reload()
  }

  loadContentPacks().then(packConfig => {
    for (const key of Object.keys(packConfig)) config[key] = packConfig[key]
    save()
  })

  load()

  const _refreshSetBonuses = () => {
    combatModule.activeSetBonuses.value = { ...combatModule.activeSetBonuses.value }
  }
// 在 load() 函数调用之后，添加这两行


// 初始化伙伴（如果没有存档数据，就用 config 生成）
if (!companionModule.companions.value || companionModule.companions.value.length === 0) {
  const chars = config.characters || {}
  companionModule.initCompanions(chars)
}
  // 返回所有属性和方法
  return {
    initCompanions: (chars) => companionModule.initCompanions(chars || config.characters || {}),
    player: playerModule.player,
    _refreshSetBonuses,
    inventory: inventoryModule.inventory,
    materials: inventoryModule.materials,
    equipment: inventoryModule.equipment,
    world: worldModule.world,
    weather: worldModule.weather,
    weatherModifiers: worldModule.weatherModifiers,
    worldLevel: playerModule.worldLevel,
    playerStats: combatModule.playerStats,
    activeAffixEffects: combatModule.activeAffixEffects,
    totalAffixLevels: combatModule.totalAffixLevels,
    activeSetBonuses: combatModule.activeSetBonuses,
    config,towerLoot,
    towerMode,
    towerFloor,
    dungeon: dungeonModule.dungeon,
    activeHuntQuests: huntQuestModule.activeHuntQuests,
    affection: affectionModule.affection,
    pendingRankUp,
    pendingTargetRank,
    pendingDungeonPanel,
    pendingStoryNodeAfterBattle,
    storyBestTime,
    storyEndTime,
    defeatedEnemies,
    exploredTiles,
    currentEvent,
    facilities,companionStrategy,
    companions: companionModule.companions,
    activeCompanion: companionModule.activeCompanion,
    addGold: (amount) => playerModule.addGold(amount, save),
    addMaterial: (id, name, qty) => inventoryModule.addMaterial(id, name, qty, save),
    addExperience: (exp) => playerModule.addExperience(exp, save),
    equipItem: (item) => inventoryModule.equipItem(item, save),
    unequip: (slot) => inventoryModule.unequip(slot, save),
    equipAccessory: (acc, slot) => inventoryModule.equipAccessory(acc, slot, save),
    respawn: () => {
      playerModule.player.hp = playerModule.player.maxHp
      playerModule.player.mp = playerModule.player.maxMp
      save()
    },
    setRespawnPoint: worldModule.setRespawnPoint,
    advanceTime: (minutes) => worldModule.advanceTime(minutes, facilities),
    startDungeon: dungeonModule.startDungeon,
    clearFloor: dungeonModule.clearFloor,
    retreat: () => dungeonModule.retreat(worldModule.world.day),
    getRandomMonsterForFloor: () => dungeonModule.getRandomMonsterForFloor(playerModule.worldLevel.value),
    acceptHuntQuest: (quest) => huntQuestModule.acceptHuntQuest(quest, save),
    updateHuntProgress: (enemyIds) => huntQuestModule.updateHuntProgress(
      enemyIds,
      rankModule.addRankExperience,
      (amount) => playerModule.addGold(amount, save),
      rankModule.completeRankUp,
      (points) => { playerModule.player.skillPoints += points },
      save
    ),
    abandonHuntQuest: (questId) => huntQuestModule.abandonHuntQuest(questId, save),
    getAffectionLevel: affectionModule.getAffectionLevel,
    getAffectionTitle: affectionModule.getAffectionTitle,
    applyAffection: (changes) => affectionModule.applyAffection(changes, save),
    addRankExperience: (exp) => rankModule.addRankExperience(exp, save),
    completeRankUp: () => {
      const ok = rankModule.completeRankUp()
      if (!ok) return false
      const rankIndex = rankModule.rankConfig.findIndex(r => r.name === playerModule.player.rank)
      const bonusGold = 2000 + rankIndex * 1000
      const skillPoints = 3 + rankIndex * 2
      playerModule.addGold(bonusGold, save)
      playerModule.player.skillPoints += skillPoints
      const accLevel = 15 + rankIndex * 2
      const accessory = generateAccessoryLoot({ level: accLevel, tag: 'boss' }, playerModule.worldLevel.value)
      if (accessory) {
        inventoryModule.inventory.push(accessory)
      }
      const gemDefs = config.gemDefinitions || []
      const gemLevel = 3 + rankIndex
      const eligible = gemDefs.filter(g => g.level === gemLevel)
      if (eligible.length > 0) {
        const gem = eligible[Math.floor(Math.random() * eligible.length)]
        inventoryModule.inventory.push({ id: gem.id, name: gem.name, qty: 1 })
      }
      save()
      window.showToast?.(`晋升为 ${playerModule.player.rank}！获得 ${bonusGold}G 和稀有饰品！`)
      return true
    },
    getBossForRank: () => rankModule.getBossForRank(dungeonModule.dungeon),
    rankConfig: rankModule.rankConfig,
    getSkillById: (id) => playerModule.getSkillById(config.skillPool, id),
    getPlayerSkills: () => playerModule.getPlayerSkills(config.skillPool),
    equipSkill: (id) => playerModule.equipSkill(config.skillPool, id, save),
    unequipSkill: (id) => playerModule.unequipSkill(id, save),
    moveSkillUp: (id) => playerModule.moveSkillUp(id, save),
    moveSkillDown: (id) => playerModule.moveSkillDown(id, save),
    save,
    load,
    $reset,
    fixGhostEquipment: inventoryModule.fixGhostEquipment,
    getMaterialName: (id) => {
      const def = config.materialDefinitions.find(m => m.id === id)
      if (def?.name) return def.name
      if (inventoryModule.materials[id]?.name) return inventoryModule.materials[id].name
      return id
    },
    markEnemyDefeated: (x, y) => { defeatedEnemies.value.add(`${x},${y}`); save() },
    isEnemyDefeated: (x, y) => defeatedEnemies.value.has(`${x},${y}`),
    exploreTile: (x, y) => { exploredTiles.value.add(`${x},${y}`); save() },
    isTileExplored: (x, y) => exploredTiles.value.has(`${x},${y}`),
    rollAccessoryForEnemy: (enemyName) => { /* 可保留空实现 */ },
    setBonuses,
    addCompanionExp: companionModule.addCompanionExp,
    restoreCompanion: companionModule.restoreCompanion,
    addAffectionToCompanion: companionModule.addAffection,
    allocateCompanionTalent: companionModule.allocateTalent,
    getCompanionStats: companionModule.getCombatStats,changeClassWithRecalc: (newClass) => {
  playerModule.player.class = newClass
  playerModule.recalculateBaseStats(newClass)
  save()
}
  }
})