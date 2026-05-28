import { defineStore } from 'pinia'
import { reactive, ref, computed } from 'vue'
import { MATERIAL_PRICES, DEFAULT_STOCKS, DAILY_EVENTS, getMaterialName } from '../config/gameConfig'
export const useGameStore = defineStore('game', () => {
  // ========== 玩家 ==========
const player = reactive({
  name: '冒险者', emoji: '', // emoji不再使用
  level: 1, exp: 0, gold: 500,
  class: '流浪者', // 职业
  hp: 80, maxHp: 80,
  mp: 30, maxMp: 30,
  attack: 28, defense: 15,
  speed: 10, luck: 5,
  critRate: 5,       // 暴击率%
  critDmg: 150,      // 暴击伤害%
  trueDmg: 0,        // 真实伤害
  lifesteal: 0,      // 吸血%
  // 元素属性伤害加成
  waterDmg: 0,
  fireDmg: 0,
  thunderDmg: 0,
  windDmg: 0,        // 飞行
  grassDmg: 0,
  iceDmg: 0,
  holyDmg: 0,
  darkDmg: 0,
  steelDmg: 0,       // 钢
  rockDmg: 0,        // 岩
})

  // ========== 背包 & 装备 ==========
  const inventory = reactive([])
  const materials = reactive({})  // { id: { qty, name } }
const equipment = reactive({
  weapon: null,      // 武器
  gauntlet: null,    // 臂甲
  helmet: null,      // 头盔
  armor: null,       // 上衣
  pants: null,       // 下衣
  shoes: null,       // 鞋子
  earring1: null,    // 左耳环
  earring2: null,    // 右耳环
  necklace1: null,   // 左项链
  necklace2: null    // 右项链
})
function unequip(slot) {
  equipment[slot] = null
  save()
}
  // ========== 世界状态 ==========
  const world = reactive({
    currentBiome: 'plain',
    playerX: 5, playerY: 4,
    day: 1,
    gameTime: 360,  // 6:00
    timeLimit: 365,
    respawnPoint: { biome: 'town', x: 5, y: 4 }
  })

  // ========== 设施（银行、股票、农场）==========
 const facilities = reactive({
  bank: { deposit: 0, maturityDay: null, rate: null },
  stocks: DEFAULT_STOCKS.map(s => ({
    ...s,
    price: s.basePrice,
    holding: 0,
    costBasis: 0,
    history: [s.basePrice]
  })),
  farm: []
})

  // ========== 开发者配置 ==========
const config = reactive({
  materialPrices: { ...MATERIAL_PRICES },   // 允许玩家修改
  stockOverrides: []   // 暂未使用
})

  // ========== 地图标记 ==========
  const defeatedEnemies = ref(new Set())
  const exploredTiles = ref(new Set())

  // ========== 每日事件 ==========
  const currentEvent = ref({ title: '', description: '', effects: [] })

  // ========== 持久化 ==========
  function save() {
    const state = {
      player: { ...player },
      inventory: [...inventory],
      materials: Object.fromEntries(Object.entries(materials).map(([k, v]) => [k, { ...v }])),
      equipment: { ...equipment },
      world: { ...world },
      facilities: {
        bank: { ...facilities.bank },
        stocks: facilities.stocks.map(s => ({ ...s, history: s.history ? [...s.history] : [] })),
        farm: [...facilities.farm]
      },
      config: {
        materialPrices: { ...config.materialPrices },
        monsterTemplates: [...config.monsterTemplates],
        stockOverrides: [...config.stockOverrides]
      },
      defeated: Array.from(defeatedEnemies.value),
      explored: Array.from(exploredTiles.value),
      currentEvent: currentEvent.value ? { ...currentEvent.value } : null
    }
    localStorage.setItem('star-trails-save', JSON.stringify(state))
  }

  function load() {
    const saved = localStorage.getItem('star-trails-save')
    if (!saved) return
    try {
      const data = JSON.parse(saved)
      // 恢复玩家
      if (data.player) Object.assign(player, data.player)
      // 恢复背包
      inventory.splice(0, inventory.length, ...(data.inventory || []))
      // 恢复材料
      const mats = data.materials || {}
      for (const key in mats) {
        if (typeof mats[key] === 'number') {
          materials[key] = { qty: mats[key], name: key }
        } else {
          materials[key] = { qty: mats[key].qty || 0, name: mats[key].name || key }
        }
      }
      // 恢复装备
      if (data.equipment) Object.assign(equipment, data.equipment)
      // 恢复世界
      if (data.world) {
        world.currentBiome = data.world.currentBiome || 'plain'
        world.playerX = data.world.playerX ?? 5
        world.playerY = data.world.playerY ?? 4
        world.day = data.world.day || 1
        world.gameTime = data.world.gameTime ?? 360
        world.timeLimit = data.world.timeLimit || 365
        world.respawnPoint = data.world.respawnPoint || { biome: 'town', x: 5, y: 4 }
      }
      // 恢复设施
      if (data.facilities) {
        if (data.facilities.bank) Object.assign(facilities.bank, data.facilities.bank)
        if (data.facilities.stocks) {
          // 保证股票列表完整性（至少6家）
          const defaultStocks = [
            { id: 'royal_forge', name: '皇家锻造厂', price: 120, holding: 0, costBasis: 0, history: [120] },
            { id: 'royal_bond', name: '皇家国债', price: 80, holding: 0, costBasis: 0, history: [80] },
            { id: 'intech', name: '英特厄科技', price: 200, holding: 0, costBasis: 0, history: [200] },
            { id: 'mana_corp', name: '魔能集团', price: 300, holding: 0, costBasis: 0, history: [300] },
            { id: 'air_league', name: '空运联盟', price: 150, holding: 0, costBasis: 0, history: [150] },
            { id: 'potions_inc', name: '药水工坊', price: 95, holding: 0, costBasis: 0, history: [95] }
          ]
          facilities.stocks = defaultStocks.map(def => {
            const old = data.facilities.stocks.find(o => o.id === def.id)
            if (old) {
              return {
                ...def,
                holding: old.holding || 0,
                costBasis: old.costBasis || def.price,
                price: old.price || def.price,
                history: old.history ? [...old.history] : [def.price]
              }
            }
            return { ...def }
          })
        }
        if (data.facilities.farm) facilities.farm = [...data.facilities.farm]
      }
      // 恢复配置
      if (data.config) {
        if (data.config.materialPrices) Object.assign(config.materialPrices, data.config.materialPrices)
        config.monsterTemplates = data.config.monsterTemplates || []
        config.stockOverrides = data.config.stockOverrides || []
      }
      // 恢复探索数据
      defeatedEnemies.value = new Set(data.defeated || [])
      exploredTiles.value = new Set(data.explored || [])
      // 恢复事件
      if (data.currentEvent) {
        currentEvent.value = data.currentEvent
      }
    } catch (e) {
      console.error('存档加载失败', e)
    }
  }

  load()

  // ========== 方法 ==========
  function addGold(amount) { player.gold += amount; save() }
  function addMaterial(id, name, qty = 1) {
    if (!materials[id]) materials[id] = { qty: 0, name }
    materials[id].qty += qty
    save()
  }
  function addExperience(exp) {
    player.exp += exp
    while (player.exp >= player.level * 100) {
      player.exp -= player.level * 100
      player.level++
      player.maxHp += 10
      player.hp = player.maxHp
      player.attack += 3
      player.defense += 2
    }
    save()
  }
  function markEnemyDefeated(x, y) { defeatedEnemies.value.add(`${x},${y}`); save() }
  function isEnemyDefeated(x, y) { return defeatedEnemies.value.has(`${x},${y}`) }
  function exploreTile(x, y) { exploredTiles.value.add(`${x},${y}`); save() }
  function isTileExplored(x, y) { return exploredTiles.value.has(`${x},${y}`) }
  function moveTo(biome, x, y) {
    world.currentBiome = biome; world.playerX = x; world.playerY = y
    exploreTile(x, y); save()
  }
  function respawn() {
    player.hp = player.maxHp
    player.mp = player.maxMp
    world.currentBiome = world.respawnPoint.biome
    world.playerX = world.respawnPoint.x
    world.playerY = world.respawnPoint.y
    save()
  }
  function setRespawnPoint(biome, x, y) {
    world.respawnPoint = { biome, x, y }; save()
  }

  // 时间推进（核心）
  function advanceTime(minutes = 1) {
    // 开市期间股价日常波动
    if (world.gameTime >= 540 && world.gameTime < 930) {
      facilities.stocks.forEach(s => {
        const delta = Math.floor(Math.random() * 5 - 2)
        s.price = Math.max(5, s.price + delta)  // 最低价格5G
        if (!s.history) s.history = []
        s.history.push(s.price)
        if (s.history.length > 200) s.history.shift()
      })
    }

    world.gameTime += minutes
    if (world.gameTime >= 1440) {
      world.gameTime -= 1440
      world.day++
      // 每日事件触发
      triggerDailyEvent()
    }
    save()
  }

  // 随机事件
 function triggerDailyEvent() {
  const event = DAILY_EVENTS[Math.floor(Math.random() * DAILY_EVENTS.length)]
  currentEvent.value = event
  event.effects.forEach(eff => {
    const stock = facilities.stocks.find(s => s.id === eff.stockId)
    if (stock) {
      stock.price = Math.max(5, stock.price + eff.change)
      stock.history.push(stock.price)
    }
  })
}
  // 总资产（用于顶部显示）
  const totalAssets = computed(() => {
    let stocksValue = facilities.stocks.reduce((sum, s) => sum + s.price * s.holding, 0)
    return player.gold + facilities.bank.deposit + stocksValue
  })

  // 导出
  return {
    player, inventory, materials, equipment, world, facilities,
    defeatedEnemies, exploredTiles, config, currentEvent,
    addGold, addMaterial, addExperience,
    markEnemyDefeated, isEnemyDefeated,
    exploreTile, isTileExplored,
    moveTo, respawn, setRespawnPoint,
    advanceTime, totalAssets,
    save, load
  }
})