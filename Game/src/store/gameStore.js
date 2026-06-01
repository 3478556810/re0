import { defineStore } from 'pinia'
import { reactive, ref, computed } from 'vue'
import { MATERIAL_PRICES, DEFAULT_STOCKS, DAILY_EVENTS } from '../config/gameConfig'
import { rollAccessoryDrop } from '../utils/lootGenerator'
import { defaultCharacters } from '../config/characters'
import { DUNGEONS } from '../config/dungeonConfig'
import { loadContentPacks } from '../utils/contentLoader'
import { storyTree as defaultStoryTree } from '../config/storyScript'
import { defaultSkillDatabase } from '../config/skillDatabase'
import { AFFIX_EFFECTS, QUALITY_RULES, QUALITY_WEIGHTS, getLootTable } from '../config/accessoryConfig'
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
    stamina: 100,   // 体力
maxStamina: 100,
    waterDmg: 0, fireDmg: 0, thunderDmg: 0, windDmg: 0,
    grassDmg: 0, iceDmg: 0, holyDmg: 0, darkDmg: 0,
    steelDmg: 0, rockDmg: 0,skillPoints: 5,   // 技能点数
equippedSkills: ['normal_attack', 'fire_slash'],
skills: {
  normal_attack: { unlocked: true, level: 1 },
  fire_slash: { unlocked: true, level: 1 }
},
tripodChoices: {},
skillPoints: 5
  // ... 其他
      // { [skillId]: { unlocked: true, level: 1 } }
   
  })



 const activeHuntQuest = ref(null)

function acceptHuntQuest(quest) {
  activeHuntQuest.value = {
    id: quest.id,
    desc: quest.desc,
    target: quest.target,      // 怪物ID
    count: quest.count,        // 需要讨伐数量
    killed: 0,                 // 已讨伐数量
    rewardExp: quest.rewardExp
  }
  save()
}

function updateHuntProgress(enemyIds) {
  const quest = activeHuntQuest.value
  if (!quest) return false

  for (const id of enemyIds) {
    if (id === quest.target) {
      quest.killed++
    }
  }

  if (quest.killed >= quest.count) {
    addExperience(quest.rewardExp)
    activeHuntQuest.value = null
    save()
    return true   // 任务完成
  }
  save()
  return false    // 未完成
}

  // ========== 背包 & 装备 ==========
  const inventory = reactive([])
  const materials = reactive({})  // { id: { qty, name } }
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
  currentBiome: 'town', 
    playerX: 5, playerY: 4,
    day: 1,
    gameTime: 360,
    timeLimit: 365,
    respawnPoint: { biome: 'town', x: 5, y: 4 }
  })

  // ========== 天气状态 ==========
  const weather = reactive({
    type: 'clear',       // 'clear', 'rain', 'snow', 'cloudy'
    intensity: 0,        // 0~1 强度
    nextChangeHour: 0    // 下次变化的世界小时
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
  // 完整的中文名映射（所有可能掉落的材料）


// 获取图片（异步）
const worldLevel = computed(() => {
  const lv = player.level
  if (lv < 5) return 1
  if (lv < 10) return 2
  if (lv < 15) return 3
  if (lv < 20) return 4
  if (lv < 30) return 5
  return 6
})

  const builtInMaterialNames = {
    slime_gel: '史莱姆凝露',
    goblin_fang: '哥布林之牙',
    scorpion_tail: '蝎尾针',
    iron_ore: '铁矿石',
    dragon_scale: '龙鳞',
    dungeon_token: '地下城徽记',
    golem_core: '魔像核心',
    wolf_fang: '狼牙',
    wolf_heart: '狼王之心',
    scorpion_heart: '蝎皇之心',
    // 可继续添加
  }

  const config = reactive({
// 在 config 的初始定义中添加（找到 config 对象的定义位置）
forgeRecipes: [
  {
    id: 'iron_sword', name: '铁剑',
    materials: [
      { id: 'iron_ore', qty: 3 },
      { id: 'slime_gel', qty: 2 }
    ],
    goldCost: 80,
    result: { type: 'weapon', part: 'weapon', name: '铁剑', atk: 15, def: 0, affixSlots: 1, icon: 'mdi:sword' }
  },
  {
    id: 'leather_armor', name: '皮革甲',
    materials: [
      { id: 'wolf_fang', qty: 4 },
      { id: 'iron_ore', qty: 2 }
    ],
    goldCost: 120,
    result: { type: 'armor', part: 'armor', name: '皮革甲', atk: 0, def: 12, affixSlots: 1, icon: 'mdi:shield' }
  }
],

    affixEffects: JSON.parse(JSON.stringify(AFFIX_EFFECTS)),   // 深拷贝词条效果表
tokenShopItems: [
  { id: 't1', name: '龙鳞 x3', desc: '稀有锻造材料', type: 'material', cost: 5, rewardId: 'dragon_scale', rewardName: '龙鳞', rewardQty: 3 },
  { id: 't2', name: '随机饰品', desc: '获得一件随机品质饰品', type: 'accessory', cost: 10 },
  { id: 't3', name: '经验药水', desc: '获得 100 经验', type: 'material', cost: 3, rewardId: 'exp_potion', rewardName: '经验药水', rewardQty: 1 }
],
    storyScript: JSON.parse(JSON.stringify(defaultStoryTree)),  // 可编辑的剧情树
    materialPrices: { ...MATERIAL_PRICES },
    // 材料定义（自动从 builtInMaterialNames + MATERIAL_PRICES 生成）
 materialDefinitions: Object.keys(builtInMaterialNames).map(id => ({
  id,
  name: builtInMaterialNames[id] || id,
  type: 'forge'
})),
skillPool: [
  { id: 'normal_attack', name: '普通攻击', desc: '无属性基础攻击', element: null, mpCost: 0, baseMul: 1.0, icon: 'mdi:sword-cross', upgradeCost: 2 },
  { id: 'fire_slash', name: '火焰斩', desc: '火属性攻击', element: 'fire', mpCost: 5, baseMul: 1.8, icon: 'mdi:fire', upgradeCost: 2 },
  { id: 'ice_bolt', name: '冰冻术', desc: '冰属性攻击', element: 'ice', mpCost: 8, baseMul: 2.0, icon: 'mdi:snowflake', upgradeCost: 3 },
  { id: 'thunder_shock', name: '雷电', desc: '雷属性攻击', element: 'thunder', mpCost: 6, baseMul: 1.6, icon: 'mdi:lightning-bolt', upgradeCost: 2 }
],

tokenShopItems: [
  { id: 't1', name: '龙鳞 x3', desc: '稀有锻造材料', type: 'material', cost: 5, rewardId: 'dragon_scale', rewardName: '龙鳞', rewardQty: 3 },
  { id: 't2', name: '随机饰品', desc: '获得一件随机品质饰品', type: 'accessory', cost: 10 },
  { id: 't3', name: '经验药水', desc: '获得 100 经验', type: 'material', cost: 3, rewardId: 'exp_potion', rewardName: '经验药水', rewardQty: 1 }
],
    stockOverrides: [],
    monsterTemplates: [
      {
        id: 'slime', name: '史莱姆', tag: 'weak', isBoss: false,
        baseHp: 35, baseAtk: 10, baseDef: 6, exp: 20,
        material: { id: 'slime_gel', name: '史莱姆凝露' },
        icon: 'mdi:blur',
        element: '',
  trait: '',
  critRate: 0,
  critDmg: 0,
  fireDmg: 0,
  waterDmg: 0,
  thunderDmg: 0,
  windDmg: 0,
  grassDmg: 0,
  iceDmg: 0,
  holyDmg: 0,
  darkDmg: 0,
  steelDmg: 0,
  rockDmg: 0,
  lifesteal: 0,
  luck: 0,
  skillsText: '[]'
      },
      {
        id: 'goblin', name: '哥布林', tag: 'weak', isBoss: false,
        baseHp: 45, baseAtk: 16, baseDef: 10, exp: 35,
        material: { id: 'goblin_fang', name: '哥布林之牙' },
        icon: 'mdi:alien',
        element: '',
  trait: '',
  critRate: 0,
  critDmg: 0,
  fireDmg: 0,
  waterDmg: 0,
  thunderDmg: 0,
  windDmg: 0,
  grassDmg: 0,
  iceDmg: 0,
  holyDmg: 0,
  darkDmg: 0,
  steelDmg: 0,
  rockDmg: 0,
  lifesteal: 0,
  luck: 0,
  skillsText: '[]'
      },
      {
        id: 'wolf', name: '森林狼', tag: 'normal', isBoss: false,
        baseHp: 50, baseAtk: 22, baseDef: 12, exp: 45,
        material: { id: 'wolf_fang', name: '狼牙' },
        icon: 'mdi:dog',
        element: '',
  trait: '',
  critRate: 0,
  critDmg: 0,
  fireDmg: 0,
  waterDmg: 0,
  thunderDmg: 0,
  windDmg: 0,
  grassDmg: 0,
  iceDmg: 0,
  holyDmg: 0,
  darkDmg: 0,
  steelDmg: 0,
  rockDmg: 0,
  lifesteal: 0,
  luck: 0,
  skillsText: '[]'
      },
      {
        id: 'scorpion', name: '毒蝎', tag: 'normal', isBoss: false,
        baseHp: 40, baseAtk: 22, baseDef: 14, exp: 40,
        material: { id: 'scorpion_tail', name: '蝎尾针' },
        icon: 'mdi:bug',
        element: '',
  trait: '',
  critRate: 0,
  critDmg: 0,
  fireDmg: 0,
  waterDmg: 0,
  thunderDmg: 0,
  windDmg: 0,
  grassDmg: 0,
  iceDmg: 0,
  holyDmg: 0,
  darkDmg: 0,
  steelDmg: 0,
  rockDmg: 0,
  lifesteal: 0,
  luck: 0,
  skillsText: '[]'
      },
      {
        id: 'golem', name: '石魔像', tag: 'strong', isBoss: false,
        baseHp: 80, baseAtk: 30, baseDef: 25, exp: 80,
        material: { id: 'golem_core', name: '魔像核心' },
        icon: 'mdi:robot',
        element: '',
  trait: '',
  critRate: 0,
  critDmg: 0,
  fireDmg: 0,
  waterDmg: 0,
  thunderDmg: 0,
  windDmg: 0,
  grassDmg: 0,
  iceDmg: 0,
  holyDmg: 0,
  darkDmg: 0,
  steelDmg: 0,
  rockDmg: 0,
  lifesteal: 0,
  luck: 0,
  skillsText: '[]'
      },
      {
        id: 'boss_wolfking', name: '狼王', tag: 'boss', isBoss: true,
        baseHp: 120, baseAtk: 35, baseDef: 20, exp: 150,
        material: { id: 'wolf_heart', name: '狼王之心' },
        icon: 'mdi:skull',
        element: '',
  trait: '',
  critRate: 0,
  critDmg: 0,
  fireDmg: 0,
  waterDmg: 0,
  thunderDmg: 0,
  windDmg: 0,
  grassDmg: 0,
  iceDmg: 0,
  holyDmg: 0,
  darkDmg: 0,
  steelDmg: 0,
  rockDmg: 0,
  lifesteal: 0,
  luck: 0,
  skillsText: '[]'
      }
    ],
    characters: { ...defaultCharacters },
    customImages: {},   // 改为对象，存放 base64 图片
    lootMultiplier: 1,
    qualityWeights: JSON.parse(JSON.stringify(QUALITY_WEIGHTS)),
    dungeonConfigs: JSON.parse(JSON.stringify(DUNGEONS)),
    monsterTags: ['weak', 'normal', 'strong', 'boss'],
    skillPool: JSON.parse(JSON.stringify(defaultSkillDatabase))
  })

  // ========== 地下城状态 ==========
  const dungeon = reactive({
      unlockedFloors: [1],        // 已解锁的楼层
  savedFloors: { 1: true },   // 已保存的楼层
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
      storyTriggered: {}  // 新增：记录已触发过的剧情楼层，例如 {1: true, 3: true}
  })
const mine = reactive({
  currentFloor: 1,
  unlockedFloors: [1],          // 必须是数组
  savedFloors: { 1: true },     // 已保存的楼层
  basket: {},                   // 收获筐
  maxBasketSize: 30
})
  
const pendingDungeonPanel = ref(false)
const pendingStoryNodeAfterBattle = ref(null)
  // ========== 地图标记 ==========
  const defeatedEnemies = ref(new Set())
  const exploredTiles = ref(new Set())

  // 好感度存储器
const affection = reactive({})

// 角色称号映射表（策划可配）
const affectionTitles = {
  freyja: [
    { min: 0, title: '冷淡的剑士' },
    { min: 10, title: '毒舌的同伴' },
    { min: 30, title: '只对你笑的人' },
    { min: 50, title: '约定的守护者' },
    { min: 80, title: '命运的伴侣' },
  ],
  ain: [
    { min: 0, title: '迷惘的冒险者' },
    { min: 10, title: '可靠的搭档' },
    { min: 30, title: '默契的战友' },
    { min: 50, title: '心灵的支柱' },
    { min: 80, title: '不可替代之人' },
  ]
}

// 好感度等级计算
function getAffectionLevel(charId) {
  const val = affection[charId] || 0
  if (val >= 80) return 5
  if (val >= 50) return 4
  if (val >= 30) return 3
  if (val >= 10) return 2
  return 1
}

// 获取称号
function getAffectionTitle(charId) {
  const val = affection[charId] || 0
  const titles = affectionTitles[charId] || []
  let result = '？？？'
  for (const t of titles) {
    if (val >= t.min) result = t.title
  }
  return result
}

// 应用好感变化
function applyAffection(changes) {
  for (const [charId, delta] of Object.entries(changes)) {
    if (!affection[charId]) affection[charId] = 0
    affection[charId] = Math.max(0, Math.min(100, affection[charId] + delta))
  }
  save()
}

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
        const effectDef = config.affixEffects[affixId]
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
    for (const slot of Object.values(equipment)) {
      if (!slot) continue
      base.attack += slot.atk || 0
      base.defense += slot.def || 0
    }
    activeAffixEffects.value.forEach(effect => {
      const bonus = effect.bonus || {}
      for (const [key, value] of Object.entries(bonus)) {
        if (key in base) base[key] += value
      }
    })
    return base
  })

  // ========== 天气计算 ==========
  // 根据季节和地形计算天气概率
  function getSeason(day) {
    const d = day % 365
    if (d < 90) return 'spring'
    if (d < 180) return 'summer'
    if (d < 270) return 'autumn'
    return 'winter'
  }

  // 季节->天气概率分布
  const seasonWeatherProb = {
    spring: { clear: 0.4, cloudy: 0.3, rain: 0.25, snow: 0.05 },
    summer: { clear: 0.35, cloudy: 0.2, rain: 0.4, snow: 0.05 },
    autumn: { clear: 0.3, cloudy: 0.3, rain: 0.3, snow: 0.1 },
    winter: { clear: 0.2, cloudy: 0.25, rain: 0.15, snow: 0.4 }
  }

  const terrainWeatherMod = {
    mountain: { snow: 0.15, rain: 0.1 },
    forest: { rain: 0.1 },
    plain: {},
    town: {}
  }

  function rollWeather() {
    const season = getSeason(world.day)
    const probs = { ...seasonWeatherProb[season] }
    // 根据地形修正
    const terrain = world.currentBiome || 'plain'
    const mod = terrainWeatherMod[terrain] || {}
    for (const [key, val] of Object.entries(mod)) {
      if (probs[key] !== undefined) {
        probs[key] = Math.min(1, probs[key] + val)
      }
    }
    // 按概率随机选择
    const rand = Math.random()
    let cumulative = 0
    for (const [type, prob] of Object.entries(probs)) {
      cumulative += prob
      if (rand <= cumulative) {
        weather.type = type
        weather.intensity = 0.3 + Math.random() * 0.7
        break
      }
    }
    weather.nextChangeHour = Math.floor(world.gameTime / 60) + 1
  }

  // 初始化天气
  rollWeather()

  // ========== 天气修正系数 ==========
  const weatherModifiers = computed(() => {
    const mods = { fire: 1.0, water: 1.0, thunder: 1.0, wind: 1.0,
      grass: 1.0, ice: 1.0, holy: 1.0, dark: 1.0, steel: 1.0, rock: 1.0 }
    if (!weather || weather.type === 'clear') return mods
    if (weather.type === 'rain') {
      mods.fire = 0.8
      mods.water = 1.2
      mods.thunder = 1.15
      mods.grass = 1.1
    } else if (weather.type === 'snow') {
      mods.ice = 1.2
      mods.fire = 0.85
      mods.water = 0.9
      mods.wind = 1.1
    } else if (weather.type === 'cloudy') {
      mods.fire = 0.9
      mods.dark = 1.1
      mods.holy = 0.9
    }
    return mods
  })

  // ========== 持久化 ==========
  function save() {
    const cleanEquipment = {}
  for (const slot of Object.keys(equipment)) {
    const item = equipment[slot]
    if (!item) {
      cleanEquipment[slot] = null
    } else {
      // 只保留可序列化的字段
      cleanEquipment[slot] = {
        id: item.id,
        part: item.part,
        name: item.name,
        quality: item.quality,
        atk: item.atk || 0,
        def: item.def || 0,
        affixes: item.affixes ? item.affixes.map(a => ({ id: a.id, level: a.level })) : []
      }
    }
  }
    const state = {
      affection: { ...affection },
        mine: {
    currentFloor: mine.currentFloor,
    unlockedFloors: mine.unlockedFloors,
    floors: { ...mine.floors } // 简单拷贝
  },activeHuntQuest: activeHuntQuest.value ? { ...activeHuntQuest.value } : null,
        equipment: cleanEquipment,
      tokenShopItems: config.tokenShopItems.map(i => ({ ...i })),
      player: { ...player },
      inventory: [...inventory],
      materials: Object.fromEntries(Object.entries(materials).map(([k, v]) => [k, { ...v }])),
      
      world: { ...world },
      weather: { ...weather },
      facilities: {
        bank: { ...facilities.bank },
        stocks: facilities.stocks.map(s => ({ ...s, history: s.history ? [...s.history] : [] })),
        farm: [...facilities.farm]
      },
      config: {

  forgeRecipes: JSON.parse(JSON.stringify(config.forgeRecipes)),

        affixEffects: JSON.parse(JSON.stringify(config.affixEffects)),
tokenShopItems: config.tokenShopItems.map(i => ({ ...i })),
        storyScript: JSON.parse(JSON.stringify(config.storyScript)),
        materialPrices: { ...config.materialPrices },
        materialDefinitions: config.materialDefinitions.map(m => ({ ...m })),
        monsterTemplates: [...config.monsterTemplates],
        stockOverrides: [...config.stockOverrides],
        customImages: { ...config.customImages },
        characters: { ...config.characters },
        lootMultiplier: config.lootMultiplier,
        qualityWeights: JSON.parse(JSON.stringify(config.qualityWeights)),
        dungeonConfigs: JSON.parse(JSON.stringify(config.dungeonConfigs)),
        monsterTags: [...config.monsterTags],
        skillPool: JSON.parse(JSON.stringify(config.skillPool))
      },
      dungeon: {
  ...dungeon,
  unlockedFloors: [...dungeon.unlockedFloors],
  savedFloors: { ...dungeon.savedFloors }
},
      defeated: Array.from(defeatedEnemies.value),
      explored: Array.from(exploredTiles.value),
      currentEvent: currentEvent.value ? { ...currentEvent.value } : null
    }
    localStorage.setItem('star-trails-save', JSON.stringify(state))
  }




// ========== 保存初始默认状态快照（用于重置） ==========
const initialState = {
  player: JSON.parse(JSON.stringify(player)),
  inventory: [],
  materials: {},
  equipment: JSON.parse(JSON.stringify(equipment)),
  world: JSON.parse(JSON.stringify(world)),
  weather: JSON.parse(JSON.stringify(weather)),
  facilities: {
    bank: JSON.parse(JSON.stringify(facilities.bank)),
    stocks: facilities.stocks.map(s => ({ ...s, history: [...s.history] })),
    farm: [...facilities.farm]
  },
  config: JSON.parse(JSON.stringify(config)),
  dungeon: JSON.parse(JSON.stringify(dungeon)),
  defeatedEnemies: new Set(),
  exploredTiles: new Set(),
  currentEvent: { title: '', description: '', effects: [] }
}

function $reset() {
  // 1. 清空持久化存储
  localStorage.removeItem('star-trails-save')
  localStorage.removeItem('tilemap_game_save')
  sessionStorage.clear()

  // 2. 获取完整默认配置
const defaults = JSON.parse(JSON.stringify(initialState))

  // 3. 玩家
  Object.assign(player, defaults.player)

  // 4. 背包、材料、装备
  inventory.splice(0, inventory.length, ...(defaults.inventory || []))
  for (const key of Object.keys(materials)) delete materials[key]
  Object.assign(materials, defaults.materials || {})
  for (const slot of Object.keys(equipment)) {
    equipment[slot] = defaults.equipment?.[slot] || null
  }

  // 5. 世界、天气
  Object.assign(world, defaults.world)
  Object.assign(weather, defaults.weather)

  // 6. 设施（银行、股票、农场）
  Object.assign(facilities.bank, defaults.facilities.bank)
  facilities.stocks.splice(0, facilities.stocks.length,
    ...(defaults.facilities.stocks || []).map(s => ({
      ...s,
      history: [s.price]
    }))
  )
  facilities.farm.splice(0, facilities.farm.length, ...(defaults.facilities.farm || []))

  // 7. 地下城、矿洞
  Object.assign(dungeon, defaults.dungeon)
  Object.assign(mine, defaults.mine || { currentFloor: 1, unlockedFloors: 1, floors: {} })

  // 8. 已击败、已探索、事件
  defeatedEnemies.value = new Set()
  exploredTiles.value = new Set()
  currentEvent.value = { title: '', description: '', effects: [] }

  // 9. config 全部字段完整替换（包括 materialPrices、stockOverrides、skillPool 等）
  for (const key of Object.keys(config)) {
    delete config[key]
  }
  Object.assign(config, JSON.parse(JSON.stringify(defaults.config)))

  // 10. 好感度清空
  for (const key of Object.keys(affection)) {
    delete affection[key]
  }

  // 11. 技能
  player.equippedSkills = defaults.player.equippedSkills || []
  player.skills = defaults.player.skills || {}
  player.tripodChoices = {}

  // 12. 存档并强制刷新
  save()
  location.reload()
}

  function load() {
    const saved = localStorage.getItem('star-trails-save')
    if (!saved) return
    try {
      
      const data = JSON.parse(saved)
if (data.activeHuntQuest) {
  activeHuntQuest.value = data.activeHuntQuest
}
// 先清空现有好感度
for (const key of Object.keys(affection)) {
  delete affection[key]
}
// 再加载存档中的好感度
if (data.affection) {
  for (const [key, val] of Object.entries(data.affection)) {
    affection[key] = val
  }
}
      if (data.config.affixEffects) config.affixEffects = data.config.affixEffects
if (data.config.tokenShopItems) config.tokenShopItems = data.config.tokenShopItems
      if (data.config.tokenShopItems) config.tokenShopItems = data.config.tokenShopItems
      if (data.player) Object.assign(player, data.player)
      inventory.splice(0, inventory.length, ...(data.inventory || []))
      const mats = data.materials || {}
      for (const key in mats) {
        if (typeof mats[key] === 'number') {
          const displayName = builtInMaterialNames[key] || key
          materials[key] = { qty: mats[key], name: displayName }
        } else {
          materials[key] = { qty: mats[key].qty || 0, name: mats[key].name || builtInMaterialNames[key] || key }
        }
      }
      if (data.equipment) Object.assign(equipment, data.equipment)
      // 清理幽灵装备
   
      if (data.world) {
        world.currentBiome = data.world.currentBiome || 'plain'
        world.playerX = data.world.playerX ?? 5
        world.playerY = data.world.playerY ?? 4
        world.day = data.world.day || 1
        world.gameTime = data.world.gameTime ?? 360
        world.timeLimit = data.world.timeLimit || 365
        world.respawnPoint = data.world.respawnPoint || { biome: 'town', x: 5, y: 4 }
      }
      if (data.weather) Object.assign(weather, data.weather)
     if (data.facilities) {
  if (data.facilities.bank) Object.assign(facilities.bank, data.facilities.bank)
  if (data.facilities.stocks) {
    // 完全替换，不合并
    facilities.stocks = data.facilities.stocks.map(s => ({
      ...s,
      history: Array.isArray(s.history) ? [...s.history] : [s.price]
    }))
  }
}



if (data.mine) {
  mine.currentFloor = data.mine.currentFloor || 1
  mine.unlockedFloors = Array.isArray(data.mine.unlockedFloors) ? data.mine.unlockedFloors : [1]
  mine.savedFloors = data.mine.savedFloors || { 1: true }
  mine.basket = data.mine.basket || {}
}
      if (data.config) {





        if (data.config.materialPrices !== undefined) {
  config.materialPrices = { ...data.config.materialPrices }
}
        // 仅当存档中有该字段时才覆盖，否则保留默认（重要！）
 if (data.config.forgeRecipes !== undefined) {
    config.forgeRecipes = data.config.forgeRecipes
  }


        if (data.config.materialDefinitions !== undefined) {
          config.materialDefinitions = data.config.materialDefinitions
        }
        if (data.config.monsterTemplates !== undefined) {
          config.monsterTemplates = data.config.monsterTemplates
        }
        if (data.config?.storyScript) {
  config.storyScript = data.config.storyScript
}
        config.stockOverrides = data.config.stockOverrides || []
 const savedImages = data.config.customImages
if (Array.isArray(savedImages)) {
  config.customImages = {}               // 旧数组格式，丢弃
} else if (savedImages && typeof savedImages === 'object') {
  config.customImages = savedImages
} else {
  config.customImages = {}
}
        if (data.config.characters) Object.assign(config.characters, data.config.characters)
        if (data.config.lootMultiplier != null) config.lootMultiplier = data.config.lootMultiplier
        if (data.config.qualityWeights) config.qualityWeights = data.config.qualityWeights
        if (data.config.dungeonConfigs) config.dungeonConfigs = data.config.dungeonConfigs
        if (data.config.monsterTags) config.monsterTags = data.config.monsterTags
        if (data.config.skillPool) config.skillPool = data.config.skillPool
      }
    if (data.dungeon) {
  Object.assign(dungeon, data.dungeon)
  dungeon.unlockedFloors = Array.isArray(data.dungeon.unlockedFloors) ? data.dungeon.unlockedFloors : [1]
  dungeon.savedFloors = data.dungeon.savedFloors || { 1: true }
}
      defeatedEnemies.value = new Set(data.defeated || [])
      exploredTiles.value = new Set(data.explored || [])
      if (data.currentEvent) currentEvent.value = data.currentEvent

      if (player.skillPoints === undefined || isNaN(player.skillPoints)) {
  player.skillPoints = 5
}
    } catch (e) {
      console.error('存档加载失败', e)
    }
  }

  load()

loadContentPacks().then(packConfig => {
  // 完整覆盖 config 中所有从 JSON 加载的字段
  for (const key of Object.keys(packConfig)) {
    config[key] = packConfig[key]
  }
  save()
})
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

function equipItem(item) {
  if (!item || !item.id) return false

  let slot = item.part
  if (!slot) {
    const typeMap = {
      weapon: 'weapon',
      gauntlet: 'gauntlet',
      helmet: 'helmet',
      armor: 'armor',
      pants: 'pants',
      shoes: 'shoes'
    }
    slot = typeMap[item.type]
  }
  if (!slot) return false

  // 卸下旧装备
  if (equipment[slot]) {
    inventory.push(equipment[slot])
    equipment[slot] = null
  }

  // 直接从背包中找到并移除
  for (let i = 0; i < inventory.length; i++) {
    if (inventory[i] && inventory[i].id === item.id) {
      equipment[slot] = inventory.splice(i, 1)[0]
      save()
      return true
    }
  }

  return false
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
  if (!id) return
  if (!materials[id]) {
    materials[id] = { qty: 0, name: name || id }
  }
  materials[id].qty += qty
  if (materials[id].qty < 0) materials[id].qty = 0 // 防止负数
  save()
}






  function addExperience(exp) {
    player.exp += exp
    while (player.exp >= player.level * 100) {
      player.exp -= player.level * 100
      player.level++
      player.maxHp += 10
      player.maxMp += 5        // 新增
      player.hp = player.maxHp
       player.mp = player.maxMp // 升级时回满 MP
      player.attack += 3
      player.defense += 2
      player.skillPoints = (player.skillPoints || 0) + 2     // ← 新增：每级给 1 技能点
    }
    save()
  }
  function markEnemyDefeated(x, y) { defeatedEnemies.value.add(`${x},${y}`); save() }
  function isEnemyDefeated(x, y) { return defeatedEnemies.value.has(`${x},${y}`) }
  function exploreTile(x, y) { exploredTiles.value.add(`${x},${y}`); save() }
  function isTileExplored(x, y) { return exploredTiles.value.has(`${x},${y}`) }
  function moveTo(biome, x, y) {
     if (biome === 'plain' || biome === 'desert') biome = 'town'
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
    // 检查天气变化（每游戏小时变化一次）
    const currentHour = Math.floor(world.gameTime / 60)
    if (currentHour >= weather.nextChangeHour) {
      rollWeather()
    }
    if (world.gameTime >= 1440) {
      world.gameTime -= 1440
      world.day++
      triggerDailyEvent()
      // 新的一天重新计算天气
      rollWeather()
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

  // ========== 技能相关方法 ==========
  function getSkillById(id) {
    return config.skillPool.find(s => s.id === id) || null
  }

  function getPlayerSkills() {
    // 返回玩家已装备技能的完整信息列表，按排列顺序
    return player.equippedSkills
      .map(id => getSkillById(id))
      .filter(Boolean)
  }

  function equipSkill(skillId) {
    // 装备技能到玩家技能槽
    const slotLimit = 4
    if (player.equippedSkills.length >= slotLimit) return false
    if (player.equippedSkills.includes(skillId)) return false
    const skill = getSkillById(skillId)
    if (!skill) return false
    player.equippedSkills.push(skillId)
    save()
    return true
  }

  function unequipSkill(skillId) {
    const idx = player.equippedSkills.indexOf(skillId)
    if (idx === -1) return false
    player.equippedSkills.splice(idx, 1)
    save()
    return true
  }

  function moveSkillUp(skillId) {
    const idx = player.equippedSkills.indexOf(skillId)
    if (idx <= 0) return false
    const temp = player.equippedSkills[idx - 1]
    player.equippedSkills[idx - 1] = skillId
    player.equippedSkills[idx] = temp
    save()
    return true
  }

  function moveSkillDown(skillId) {
    const idx = player.equippedSkills.indexOf(skillId)
    if (idx === -1 || idx >= player.equippedSkills.length - 1) return false
    const temp = player.equippedSkills[idx + 1]
    player.equippedSkills[idx + 1] = skillId
    player.equippedSkills[idx] = temp
    save()
    return true
  }

  // ========== 地下城方法 ==========
  function startDungeon(dungeonId) {
    const dg = config.dungeonConfigs[dungeonId] || DUNGEONS[dungeonId]
    if (!dg) return false
    // if (dungeon.lastRetreatDay && world.day < dungeon.lastRetreatDay + dg.cooldown) {
    //   return false
    // }
    dungeon.active = true
    dungeon.currentDungeon = dungeonId
    dungeon.currentFloor = 1
    dungeon.maxFloors = dg.maxFloors
    dungeon.floorsCleared = 0
    dungeon.bossDefeated = false
     dungeon.lastDungeonId = dungeonId   // 新增：记住本次选择
    return true
  }

 function clearFloor() {
  dungeon.floorsCleared++
  
  // 每5层自动存档（保存的是下一层，让玩家跳过 Boss）
  if (dungeon.currentFloor % 5 === 0) {
    const nextFloor = dungeon.currentFloor + 1
    if (!dungeon.unlockedFloors.includes(nextFloor)) {
      dungeon.unlockedFloors.push(nextFloor)
    }
    dungeon.savedFloors[nextFloor] = true
  }
  
  if (dungeon.currentFloor >= dungeon.maxFloors) {
    dungeon.bossDefeated = true
    completeDungeon()
  } else {
    dungeon.currentFloor++
  }
  save()
}
function retreat() {
  const dg = config.dungeonConfigs[dungeon.currentDungeon] || DUNGEONS[dungeon.currentDungeon]
  dungeon.lastRetreatDay = world.day
  dungeon.retreatCooldown = dg ? dg.cooldown : 1
  dungeon.lastDungeonId = dungeon.currentDungeon
  // 撤退时也保留已解锁楼层
  if (dungeon.currentFloor % 5 === 0) {
    if (!dungeon.unlockedFloors.includes(dungeon.currentFloor)) {
      dungeon.unlockedFloors.push(dungeon.currentFloor)
    }
    dungeon.savedFloors[dungeon.currentFloor] = true
  }
  dungeon.active = false
  save()
}

function completeDungeon() {
  // 通关时也保存下一层（如果还有的话）
  if (dungeon.currentFloor % 5 === 0) {
    const nextFloor = dungeon.currentFloor + 1
    if (!dungeon.unlockedFloors.includes(nextFloor)) {
      dungeon.unlockedFloors.push(nextFloor)
    }
    dungeon.savedFloors[nextFloor] = true
  }
  
  dungeon.active = false
  dungeon.lastRetreatDay = world.day
  dungeon.lastDungeonId = dungeon.currentDungeon
  save()
}

function getRandomMonsterForFloor() {
  const dg = config.dungeonConfigs[dungeon.currentDungeon] || DUNGEONS[dungeon.currentDungeon]
  if (!dg) return null

  const floor = dungeon.currentFloor
  const maxFloors = dg.maxFloors || 5
  const wLv = worldLevel.value   // 世界等级（确保 worldLevel 已定义并导出）

  // 怪物数量
  let count = 1
if (floor === maxFloors) {
  count = 1  // Boss层只生成1个
} else if (floor >= 4) {
  count = 2 + Math.floor(Math.random() * 2)
} else if (floor >= 2) {
  count = 1 + Math.floor(Math.random() * 2)
} else {
  count = 1 + Math.floor(Math.random() * 2)
}

  const pool = dg.monstersByFloor[floor] || dg.monstersByFloor[1] || ['slime']
  const uniquePool = [...new Set(pool)]

  const selected = []
  for (let i = 0; i < count; i++) {
    const pickId = uniquePool[Math.floor(Math.random() * uniquePool.length)]
    const template = config.monsterTemplates.find(t => t.id === pickId)
    if (!template) continue

    // 基础等级：在怪物模板的 levelRange 内随机
    const minLv = template.levelRange?.[0] ?? template.minLevel ?? 1
    const maxLv = template.levelRange?.[1] ?? template.maxLevel ?? 99
    const baseLevel = Math.floor(Math.random() * (maxLv - minLv + 1)) + minLv

    // 最终等级 = 基础随机 + 世界等级加成 + 楼层加成
    const level = baseLevel + (wLv - 1) + Math.floor((floor - 1) / 2)
    const scale = 1 + (level - 1) * 0.25

    selected.push({
      ...template,
      level,
      hp: Math.floor(template.baseHp * scale),
      maxHp: Math.floor(template.baseHp * scale),
      atk: Math.floor(template.baseAtk * scale),
      def: Math.floor(template.baseDef * scale),
      exp: Math.floor((template.exp || 20) * scale),
    })
  }

  // 调试代码（上线后可删除）
  console.log('生成怪物:', selected.map(m => `${m.name} Lv.${m.level}`).join(', '))

  return selected.length > 0 ? selected : null
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

  // 获取材料显示名称
  function getMaterialName(id, fallbackName) {
    // 1. 查找材料定义
    const def = config.materialDefinitions.find(m => m.id === id)
    if (def?.name) return def.name
    // 2. 查找背包中的名称
    if (materials[id]?.name) return materials[id].name
    // 3. 内置映射
    if (builtInMaterialNames[id]) return builtInMaterialNames[id]
    // 4. 回退
    return fallbackName || id
  }

  return {
    player, inventory, materials, equipment, world, weather, facilities,
    defeatedEnemies, exploredTiles, config, currentEvent,
    totalAffixLevels, activeAffixEffects, playerStats,
    weatherModifiers,
    addGold, addMaterial, addExperience,
    markEnemyDefeated, isEnemyDefeated,
    exploreTile, isTileExplored,
    moveTo, respawn, setRespawnPoint,
    rollAccessoryForEnemy, equipAccessory, unequip,
    advanceTime, totalAssets,
    save, load, fixGhostEquipment,pendingStoryNodeAfterBattle,
    dungeon, pendingDungeonPanel, getMaterialName,equipItem,
    startDungeon, clearFloor, retreat, getRandomMonsterForFloor,
    getSkillById, getPlayerSkills, equipSkill, unequipSkill,
    moveSkillUp, moveSkillDown,  $reset,mine, worldLevel,activeHuntQuest, acceptHuntQuest, updateHuntProgress,affection, applyAffection, getAffectionLevel, getAffectionTitle, affectionTitles
  }
})
