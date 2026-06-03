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

export const useGameStore = defineStore('game', () => {
  // 初始化所有模块
  const playerModule = usePlayer()
  const inventoryModule = useInventory()
  const worldModule = useWorld()

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
  // 龙骸套装（焚狱炎龙）
  dragon_set: {
    3: { holyMarkOnHit: 0.25 },
    6: { holyMarkOnHit: 0.50, lowHpLifestealOnMark: 30 }
  },
  // 暗影咒装（永夜领主）
  shadow_set: {
    3: { holyMarkOnHit: 0.20, critRate: 10 },
    6: { holyMarkOnHit: 0.40, critDmgOnMark: 80 }
  },
  // 血怒套装（猩红暴君）
  crimson_set: {
    3: { specialFullHpDmg: 30 },
    6: { specialLowHpDmg: 50, specialBossDmg: 20 }
  }
}
const combatModule = useCombatStats(inventoryModule.equipment, config, playerModule.player);

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
      player: { ...playerModule.player },
      inventory: [...inventoryModule.inventory],
      materials: Object.fromEntries(Object.entries(inventoryModule.materials).map(([k,v]) => [k, { ...v }])),
      equipment: Object.fromEntries(Object.entries(inventoryModule.equipment).map(([k,v]) => [k, v ? { id: v.id, part: v.part, name: v.name, quality: v.quality, atk: v.atk || 0, def: v.def || 0, setId: v.setId || '', affixes: v.affixes ? v.affixes.map(a => ({ id: a.id, level: a.level })) : [] } : null])),
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
      currentEvent: currentEvent.value ? { ...currentEvent.value } : null
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
      inventoryModule.inventory.splice(0, inventoryModule.inventory.length, ...(data.inventory || []))
      for (const key of Object.keys(inventoryModule.materials)) delete inventoryModule.materials[key]
      Object.assign(inventoryModule.materials, data.materials || {})
      Object.assign(inventoryModule.equipment, data.equipment || {})
      Object.assign(worldModule.world, data.world || {})
      Object.assign(worldModule.weather, data.weather || {})
      Object.assign(facilities.bank, data.facilities?.bank || {})
      Object.assign(dungeonModule.dungeon, data.dungeon || {})
      huntQuestModule.activeHuntQuests.value = data.activeHuntQuests || []
      Object.assign(affectionModule.affection, data.affection || {})
      storyBestTime.value = data.storyBestTime ?? null
      pendingRankUp.value = data.pendingRankUp ?? false
      pendingTargetRank.value = data.pendingTargetRank ?? null
      defeatedEnemies.value = new Set(data.defeated || [])
      exploredTiles.value = new Set(data.explored || [])
      currentEvent.value = data.currentEvent || { title: '', description: '', effects: [] }
    } catch (e) { console.error('存档加载失败', e) }
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

  // 返回所有属性和方法
  return {
    player: playerModule.player,
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
    config,
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
    facilities,
    addGold: (amount) => playerModule.addGold(amount, save),
    addMaterial: (id, name, qty) => inventoryModule.addMaterial(id, name, qty, save),
    addExperience: (exp) => playerModule.addExperience(exp, save),
    equipItem: (item) => inventoryModule.equipItem(item, save),
    unequip: (slot) => inventoryModule.unequip(slot, save),
    equipAccessory: (acc, slot) => inventoryModule.equipAccessory(acc, slot, save),
    
   respawn: () => {
  // 回满血
  playerModule.player.hp = playerModule.player.maxHp;
  playerModule.player.mp = playerModule.player.maxMp;
  // 可选：重置到某个默认坐标（如果你还有地图的话）
  // world.currentBiome = 'town'; world.playerX = 5; world.playerY = 4;
  save();
},
    setRespawnPoint: worldModule.setRespawnPoint,
    advanceTime: (minutes) => worldModule.advanceTime(minutes, facilities),
    startDungeon: dungeonModule.startDungeon,
    clearFloor: dungeonModule.clearFloor,
    retreat: () => dungeonModule.retreat(worldModule.world.day),
    getRandomMonsterForFloor: () => dungeonModule.getRandomMonsterForFloor(playerModule.worldLevel.value),
    acceptHuntQuest: (quest) => huntQuestModule.acceptHuntQuest(quest, save),
    updateHuntProgress: (enemyIds) => huntQuestModule.updateHuntProgress(enemyIds, rankModule.addRankExperience, (amount) => playerModule.addGold(amount, save), rankModule.completeRankUp, save),
    abandonHuntQuest: (questId) => huntQuestModule.abandonHuntQuest(questId, save),
    getAffectionLevel: affectionModule.getAffectionLevel,
    getAffectionTitle: affectionModule.getAffectionTitle,
    applyAffection: (changes) => affectionModule.applyAffection(changes, save),
    addRankExperience: (exp) => rankModule.addRankExperience(exp, save),
    completeRankUp: () => { const ok = rankModule.completeRankUp(); if (ok) save(); return ok },
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
    rollAccessoryForEnemy: (enemyName) => { /* 可保留空实现或导入原始函数 */ },
    setBonuses
  }
})