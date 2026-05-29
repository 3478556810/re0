import { defineStore } from 'pinia'
import { reactive, ref, computed } from 'vue'
import { MATERIAL_PRICES, DEFAULT_STOCKS, DAILY_EVENTS, getMaterialName } from '../config/gameConfig'
import { AFFIX_EFFECTS } from '../config/accessoryConfig'
import { rollAccessoryDrop } from '../utils/lootGenerator'

export const useGameStore = defineStore('game', () => {
  // ========== 玩家 ==========
  const player = reactive({
    name: '冒险者', emoji: '',
    level: 1, exp: 0, gold: 500,
    class: '流浪者',
    hp: 80, maxHp: 80,
    mp: 30, maxMp: 30,
    attack: 28, defense: 15,
    speed: 10, luck: 5,
    critRate: 5,
    critDmg: 150,
    trueDmg: 0,
    lifesteal: 0,
    waterDmg: 0, fireDmg: 0, thunderDmg: 0, windDmg: 0,
    grassDmg: 0, iceDmg: 0, holyDmg: 0, darkDmg: 0,
    steelDmg: 0, rockDmg: 0,
  })

  // ========== 背包 & 装备 ==========
  const inventory = reactive([])
  const materials = reactive({})

  const equipment = reactive({
    weapon: null,
    gauntlet: null,
    helmet: null,
    armor: null,
    pants: null,
    shoes: null,
    necklace: null,
    ring1: null,
    ring2: null,
    earring1: null,
    earring2: null
  })

  // ========== 世界状态 ==========
  const world = reactive({
    currentBiome: 'plain',
    playerX: 5, playerY: 4,
    day: 1,
    gameTime: 360,
    timeLimit: 365,
    respawnPoint: { biome: 'town', x: 5, y: 4 }
  })

  // ========== 设施 ==========
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
    materialPrices: { ...MATERIAL_PRICES },
    stockOverrides: [],
    monsterTemplates: [], // 补充缺失字段
    customImages: {} // 用于头像存储
  })

  // ========== 地图标记 ==========
  const defeatedEnemies = ref(new Set())
  const exploredTiles = ref(new Set())

  // ========== 每日事件 ==========
  const currentEvent = ref({ title: '', description: '', effects: [] })

  // ========== 饰品词条计算 ==========
  const totalAffixLevels = computed(() => {
    const levels = {}
    const slots = ['earring1', 'earring2', 'ring1', 'ring2', 'necklace']
    slots.forEach(slot => {
      const acc = equipment[slot]
      if (acc && acc.affixes) {
        acc.affixes.forEach(affix => {
          if (!levels[affix.id]) levels[affix.id] = 0
          levels[affix.id] += affix.level
        })
      }
    })
    return levels
  })

  const activeAffixEffects = computed(() => {
    const effects = []
    const levels = totalAffixLevels.value
    for (const [affixId, totalLevel] of Object.entries(levels)) {
      const effectDef = AFFIX_EFFECTS[affixId]
      if (!effectDef) continue
      const activeThresholds = effectDef.thresholds.filter(t => t.level <= totalLevel)
      if (activeThresholds.length === 0) continue
      const best = activeThresholds[activeThresholds.length - 1]
      effects.push({
        affixId,
        affixName: effectDef.name,
        icon: effectDef.icon,
        level: totalLevel,
        desc: best.desc,
        bonus: best.bonus
      })
    }
    return effects
  })

  const playerStats = computed(() => {
    const base = { ...player }
    // 装备基础属性加成
    for (const slot of Object.values(equipment)) {
      if (!slot) continue
      base.attack += slot.atk || 0
      base.defense += slot.def || 0
    }
    // 饰品词条加成
    activeAffixEffects.value.forEach(effect => {
      const bonus = effect.bonus || {}
      for (const [key, value] of Object.entries(bonus)) {
        if (key in base) base[key] += value
      }
    })
    return base
  })

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
        stockOverrides: [...config.stockOverrides],
        customImages: { ...config.customImages }
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
      if (data.player) Object.assign(player, data.player)
      inventory.splice(0, inventory.length, ...(data.inventory || []))
      const mats = data.materials || {}
      for (const key in mats) {
        if (typeof mats[key] === 'number') materials[key] = { qty: mats[key], name: key }
        else materials[key] = { qty: mats[key].qty || 0, name: mats[key].name || key }
      }
      if (data.equipment) Object.assign(equipment, data.equipment)

      // 清理幽灵装备
      for (const slot of Object.keys(equipment)) {
        const item = equipment[slot]
        if (!item) continue
        const existsInInv = inventory.some(i => i.id === item.id)
        if (!existsInInv) equipment[slot] = null
      }

      if (data.world) {
        world.currentBiome = data.world.currentBiome || 'plain'
        world.playerX = data.world.playerX ?? 5
        world.playerY = data.world.playerY ?? 4
        world.day = data.world.day || 1
        world.gameTime = data.world.gameTime ?? 360
        world.timeLimit = data.world.timeLimit || 365
        world.respawnPoint = data.world.respawnPoint || { biome: 'town', x: 5, y: 4 }
      }

      if (data.facilities) {
        if (data.facilities.bank) Object.assign(facilities.bank, data.facilities.bank)
        if (data.facilities.stocks) {
          const defaults = DEFAULT_STOCKS.map(s => ({ ...s, price: s.basePrice, holding: 0, costBasis: 0, history: [s.basePrice] }))
          facilities.stocks = defaults.map(def => {
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
      }

      if (data.config) {
        if (data.config.materialPrices) Object.assign(config.materialPrices, data.config.materialPrices)
        config.monsterTemplates = data.config.monsterTemplates || []
        config.stockOverrides = data.config.stockOverrides || []
        config.customImages = data.config.customImages || {}
      }

      defeatedEnemies.value = new Set(data.defeated || [])
      exploredTiles.value = new Set(data.explored || [])
      if (data.currentEvent) currentEvent.value = data.currentEvent
    } catch (e) {
      console.error('存档加载失败', e)
    }
  }

  load()

  // ========== 方法 ==========
  function equipAccessory(accessory, slot) {
    const idx = inventory.findIndex(item => item.id === accessory.id)
    if (idx === -1) return
    if (equipment[slot]) {
      inventory.push(equipment[slot])
    }
    equipment[slot] = accessory
    inventory.splice(idx, 1)
    save()
  }

  function unequip(slot) {
    const item = equipment[slot]
    if (!item) return
    inventory.push(item)
    equipment[slot] = null
    save()
  }

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

  function rollAccessoryForEnemy(enemyName) {
    const acc = rollAccessoryDrop(enemyName)
    if (acc) {
      inventory.push(acc)
      save()
    }
    return acc
  }

  function advanceTime(minutes = 1) {
    if (world.gameTime >= 540 && world.gameTime < 930) {
      facilities.stocks.forEach(s => {
        const volatility = 0.005
        const change = s.price * (Math.random() * volatility * 2 - volatility)
        s.price = Math.max(5, Math.round(s.price + change))
        if (!s.history) s.history = []
        s.history.push(s.price)
        if (s.history.length > 200) s.history.shift()
      })
    }
    world.gameTime += minutes
    if (world.gameTime >= 1440) {
      world.gameTime -= 1440
      world.day++
      triggerDailyEvent()
    }
    save()
  }

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

  const totalAssets = computed(() => {
    let stocksValue = facilities.stocks.reduce((sum, s) => sum + s.price * s.holding, 0)
    return player.gold + facilities.bank.deposit + stocksValue
  })

  function fixGhostEquipment() {
    let fixed = false
    for (const slot of Object.keys(equipment)) {
      const item = equipment[slot]
      if (!item) continue
      if (!inventory.some(i => i.id === item.id)) {
        equipment[slot] = null
        fixed = true
      }
    }
    if (fixed) save()
  }

  return {
    player, inventory, materials, equipment, world, facilities,
    defeatedEnemies, exploredTiles, config, currentEvent,
    totalAffixLevels, activeAffixEffects, playerStats,
    addGold, addMaterial, addExperience,
    markEnemyDefeated, isEnemyDefeated,
    exploreTile, isTileExplored,
    moveTo, respawn, setRespawnPoint,
    rollAccessoryForEnemy, equipAccessory, unequip,
    advanceTime, totalAssets,
    save, load, fixGhostEquipment
  }
})