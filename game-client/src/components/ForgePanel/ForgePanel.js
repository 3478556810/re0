import { ref, computed } from 'vue'
import { useGameStore } from '@/store/gameStore'
import { AFFIX_EFFECTS, QUALITY_STATS_MULTIPLIER, QUALITY_AFFIX_LEVEL_MIN } from '@/config/accessoryConfig'

export function useForgePanel() {
  const store = useGameStore()

  const forgeMode = ref('craft')
  const currentSetFilter = ref('all')
  const selectedUpgradeItem = ref(null)
  const equipFilter = ref('all')

  // ========== 副词条池（制作时随机生成一个） ==========
  const ATTACK_AFFIX_POOL = [
    { id: 'atk', name: '攻击力', type: 'flat', min: 5, max: 25 },
    { id: 'atkPercent', name: '攻击百分比', type: 'percent', min: 3, max: 15 },
    { id: 'critRate', name: '暴击率', type: 'flat', min: 3, max: 12 },
    { id: 'critDmg', name: '暴击伤害', type: 'flat', min: 8, max: 35 },
    { id: 'trueDmg', name: '真伤', type: 'flat', min: 5, max: 20 },
    { id: 'fireDmgPercent', name: '火属性攻击%', type: 'percent', min: 3, max: 12 },
    { id: 'iceDmgPercent', name: '冰属性攻击%', type: 'percent', min: 3, max: 12 },
    { id: 'thunderDmgPercent', name: '雷属性攻击%', type: 'percent', min: 3, max: 12 },
    { id: 'holyDmgPercent', name: '圣属性攻击%', type: 'percent', min: 3, max: 12 },
    { id: 'darkDmgPercent', name: '暗属性攻击%', type: 'percent', min: 3, max: 12 },
  ]
  const DEFENSE_AFFIX_POOL = [
    { id: 'def', name: '防御力', type: 'flat', min: 8, max: 40 },
    { id: 'defPercent', name: '防御百分比', type: 'percent', min: 3, max: 15 },
    { id: 'hp', name: '生命值', type: 'flat', min: 30, max: 150 },
    { id: 'hpPercent', name: '生命百分比', type: 'percent', min: 3, max: 12 },
    { id: 'mp', name: '魔法值', type: 'flat', min: 15, max: 60 },
    { id: 'speed', name: '速度', type: 'flat', min: 4, max: 18 },
    { id: 'dodge', name: '闪避', type: 'flat', min: 2, max: 8 },
  ]
  const OFFENSIVE_PARTS = ['weapon', 'gauntlet']
  const DEFENSIVE_PARTS = ['armor', 'helmet', 'pants', 'shoes']

  function generateExtraStat(part, quality, equipLevel) {
    if (quality === 'white') return {}
    const isOffensive = OFFENSIVE_PARTS.includes(part)
    const pool = isOffensive ? ATTACK_AFFIX_POOL : DEFENSE_AFFIX_POOL
    const affix = pool[Math.floor(Math.random() * pool.length)]
    const extraStats = {}
    if (affix.type === 'percent') {
      const base = affix.min + Math.floor(Math.random() * (affix.max - affix.min + 1))
      const bonus = Math.floor(equipLevel / 10) * 2
      extraStats[affix.id] = Math.min(affix.max + 5, base + bonus)
    } else {
      const base = affix.min + Math.floor(Math.random() * (affix.max - affix.min + 1))
      const multiplier = 1 + equipLevel / 20
      extraStats[affix.id] = Math.max(1, Math.floor(base * multiplier))
    }
    return extraStats
  }

  function getExtraStatName(key) {
    const map = {
      atk: '攻击力', atkPercent: '攻击力%',
      def: '防御力', defPercent: '防御力%',
      hp: '生命值', hpPercent: '生命值%', mp: '魔法值',
      critRate: '暴击率', critDmg: '暴击伤害', trueDmg: '真实伤害',
      speed: '速度', dodge: '闪避',
      fireDmgPercent: '火属性攻击%', iceDmgPercent: '冰属性攻击%',
      thunderDmgPercent: '雷属性攻击%', holyDmgPercent: '圣属性攻击%',
      darkDmgPercent: '暗属性攻击%',
    }
    return map[key] || key
  }

  // ========== 成功率计算 ==========
  function getLevelSuccessRate(item) {
    const config = store.config.enhanceConfig?.levelUp?.perLevel(item.level, item.quality)
    if (!config) return 0
    const base = config.successRate || 0.5
    const failCount = item.levelFailCount || 0
    return Math.min(1, base + failCount * 0.1)
  }

  // ========== 套装筛选 ==========
  const setFilterOptions = computed(() => {
    const sets = new Set(store.config.forgeRecipes.map(r => r.setId).filter(Boolean))
    const options = [{ label: '全部', value: 'all' }]
    const setNames = {
      dragon_set: '龙骸', shadow_set: '暗影咒装', crimson_set: '血怒',
      iron_set: '铁之意志', spider_set: '蛛丝暗影', stone_set: '石魔之力',
    }
    sets.forEach(id => options.push({ label: setNames[id] || id, value: id }))
    return options
  })

  const filteredRecipes = computed(() => {
    if (currentSetFilter.value === 'all') return store.config.forgeRecipes
    return store.config.forgeRecipes.filter(r => r.setId === currentSetFilter.value)
  })

  // ========== 强化装备列表（合并背包 + 已装备） ==========
  const equippedItems = computed(() => {
    const eq = store.equipment || {}
    return Object.values(eq)
      .filter(item => item && item.id && (item.part || item.type))
      .map(item => ({ ...item, part: item.part || item.type, quality: item.quality || 'white', equipped: true }))
  })

  const inventoryItems = computed(() => {
    return (store.inventory || [])
      .filter(item => item && (item.part || item.type))
      .map(item => ({ ...item, part: item.part || item.type, quality: item.quality || 'white', equipped: false }))
  })

  const allUpgradeable = computed(() => {
    const map = new Map()
    for (const item of equippedItems.value) map.set(item.id, { ...item, equipped: true })
    for (const item of inventoryItems.value) {
      if (!map.has(item.id)) map.set(item.id, { ...item, equipped: false })
    }
    return Array.from(map.values())
  })

  const equipFilterOptions = [
    { label: '全部', value: 'all' },
    { label: '已装备', value: 'equipped' },
    { label: '未装备', value: 'unequipped' }
  ]

  const filteredUpgradeableItems = computed(() => {
    let items = allUpgradeable.value
    if (equipFilter.value === 'equipped') items = items.filter(item => item.equipped === true)
    else if (equipFilter.value === 'unequipped') items = items.filter(item => !item.equipped)
    return items.filter(item => item.part && item.quality)
  })

  // ========== 同步工具 ==========
  function syncItemEverywhere(item) {
    const equipment = store.equipment
    if (equipment) {
      for (const slot in equipment) {
        if (equipment[slot]?.id === item.id) { equipment[slot] = { ...item }; break }
      }
    }
    const invIndex = store.inventory.findIndex(i => i?.id === item.id)
    if (invIndex !== -1) store.inventory.splice(invIndex, 1, { ...item })
    if (selectedUpgradeItem.value?.id === item.id) selectedUpgradeItem.value = { ...item }
  }

  function materialIcon(id) {
    const icons = {
      slime_gel: 'mdi:water', goblin_fang: 'mdi:tooth', iron_ore: 'mdi:mine',
      dragon_scale: 'mdi:shield-sun', wolf_fang: 'mdi:tooth-outline',
      wolf_heart: 'mdi:heart-pulse', golem_core: 'mdi:creation',
      spider_silk: 'mdi:spider-web', bat_wing: 'mdi:bat',
      small_magic_stone: 'mdi:magic-staff', gold_ore: 'mdi:gold',
      silver_ore: 'mdi:silver-fork-spoon', copper_ore: 'mdi:copper',
      mithril_ore: 'mdi:star-four-points', crystal_shard: 'mdi:diamond-stone',
      obsidian: 'mdi:circle-multiple', dragon_ore: 'mdi:dragon',
    }
    return icons[id] || 'mdi:circle'
  }

  function hasMaterial(id, need) { const mat = store.materials[id]; return mat && mat.qty >= need }

  function qualityColor(q) {
    const map = { white: '#ccc', green: '#4caf50', blue: '#2196f3', purple: '#9c27b0', red: '#ff4444' }
    return map[q] || '#ccc'
  }

  function qualityLabel(q) {
    const map = { white: '普通', green: '优秀', blue: '精良', purple: '史诗', red: '传说' }
    return map[q] || q
  }

  function getAffixName(id) {
    if (id === 'bossDmgFix') return '对Boss增伤'
    return AFFIX_EFFECTS[id]?.name || id
  }

  // ========== 制作系统（80%成功率，25%跳品） ==========
  function canCraft(recipe) {
    if (store.player.gold < recipe.goldCost) return false
    return recipe.materials.every(mat => hasMaterial(mat.id, mat.qty))
  }

  function rollQualityForCraft(baseQuality) {
    if (Math.random() < 0.25) {
      const qualities = ['white', 'green', 'blue', 'purple', 'red']
      const idx = qualities.indexOf(baseQuality)
      if (idx < qualities.length - 1) return qualities[idx + 1]
    }
    return baseQuality
  }

  function generateAffixesForCraft(quality, itemLevel) {
    const affixKeys = Object.keys(AFFIX_EFFECTS)
    if (affixKeys.length === 0) return []
    const count = Math.min(2, 1 + Math.floor(Math.random() * 2))
    const result = []
    const used = new Set()
    const minLevel = QUALITY_AFFIX_LEVEL_MIN[quality] || 1
    for (let i = 0; i < count; i++) {
      const key = affixKeys[Math.floor(Math.random() * affixKeys.length)]
      if (used.has(key)) continue
      used.add(key)
      const level = Math.min(5, Math.max(minLevel, Math.floor(itemLevel / 10) + 1))
      result.push({ id: key, level })
    }
    return result
  }

  function craft(recipe) {
    if (!canCraft(recipe)) return window.showToast('材料不足或金币不够！')
    store.addGold(-recipe.goldCost)
    for (const mat of recipe.materials) store.addMaterial(mat.id, '', -mat.qty)

    // 成功率 80%
    if (Math.random() >= 0.8) {
      window.showToast('制作失败，材料已消耗')
      store.save()
      return
    }

    const quality = rollQualityForCraft(recipe.quality || 'white')
    const playerLv = store.player.level
    const itemLevel = Math.max(1, playerLv + Math.floor(Math.random() * 5) - 2)
    const baseAtk = recipe.baseAtk || 10
    const baseDef = recipe.baseDef || 5
    const qualityMult = QUALITY_STATS_MULTIPLIER[quality] || 1
    const craftedMultiplier = 1.3
    const progressLevel = Math.min(itemLevel, 20)
    const levelBonus = 1 + (progressLevel - 1) * 0.05

    const part = recipe.type || 'armor'
    const isOffensivePart = ['weapon', 'gauntlet'].includes(part)
    const isDefensivePart = ['armor', 'helmet', 'pants', 'shoes'].includes(part)

    const atk = isOffensivePart ? Math.floor(baseAtk * qualityMult * levelBonus * craftedMultiplier) : 0
    const def = isDefensivePart ? Math.floor(baseDef * qualityMult * levelBonus * craftedMultiplier) : 0

    const affixes = generateAffixesForCraft(quality, itemLevel)
    const extraStats = generateExtraStat(part, quality, itemLevel)
    if (part === 'shoes') extraStats.speed = (extraStats.speed || 0) + 2 + Math.floor(Math.random() * 5)

    const fixedAffix = { id: 'bossDmgFix', level: 15, desc: '对Boss伤害 +18%', fixed: true }

    const item = {
      id: `equip_${Date.now()}_${Math.random()}`,
      name: recipe.name,
      icon: recipe.icon || (recipe.type === 'weapon' ? 'mdi:sword' : 'mdi:shield'),
      type: recipe.type,
      part: part,
      level: itemLevel,
      levelFailCount: 0,
      qualityFailCount: 0,
      quality: quality,
      atk, def,
      baseAtk: recipe.baseAtk || 10,
      baseDef: recipe.baseDef || 5,
      qualityMult,
      extraStats,
      affixes,
      fixedAffix,
      bossDmgBonus: 18,
      levelRequired: recipe.levelRequired || 1,
      gemSlots: recipe.gemSlots || 0,
      setId: recipe.setId || '',
    }

    store.inventory.push(item)
    store.save()
    const jumpMsg = quality !== recipe.quality ? '（品质提升！）' : ''
    window.showToast(`成功制作 ${item.name}！${jumpMsg}已放入背包。`)
  }

  // ========== 强化系统（仅等级强化） ==========
  function selectForUpgrade(item) { selectedUpgradeItem.value = item }

  function normalizeMaterials(cost) {
    if (!cost.materials) return []
    if (Array.isArray(cost.materials)) return cost.materials
    return Object.entries(cost.materials).map(([id, qty]) => ({ id, qty }))
  }

  function levelUpgradeCost(item) {
    const config = store.config.enhanceConfig?.levelUp?.perLevel(item.level, item.quality)
    if (!config) return { gold: 99999, materials: [] }
    return { gold: config.gold || 99999, materials: normalizeMaterials(config) }
  }

 function canUpgradeLevel(item) {
    if (!item) return false
    if (item.level >= 100) {
        // 返回 false，但在调用处提示满级
        return false
    }
    const cost = levelUpgradeCost(item)
    if (store.player.gold < cost.gold) return false
    return cost.materials.every(mat => hasMaterial(mat.id, mat.qty))
}

function upgradeLevel(item) {
    if (!item) return
    if (item.level >= 100) {
        window.showToast('装备已达到最高等级')
        return
    }
    if (!canUpgradeLevel(item)) {
        // 再区分一下是满级还是资源不足
        if (item.level >= 100) {
            window.showToast('装备已达到最高等级')
        } else {
            window.showToast('材料或金币不足！')
        }
        return
    }
    const cost = levelUpgradeCost(item);
    store.addGold(-cost.gold);
    for (const mat of cost.materials) store.addMaterial(mat.id, '', -mat.qty);

    const successRate = getLevelSuccessRate(item);
    if (Math.random() < successRate) {
      item.level += 1;

      const growthFixed = 5;
      const growthPercent = 0.04;
      const atkGrowth = Math.floor(growthFixed + item.atk * growthPercent);
      const defGrowth = Math.floor(3 + item.def * 0.04);

      const part = item.part || item.type || 'armor';
      const isOffensive = ['weapon', 'gauntlet'].includes(part);
      const isDefensive = ['armor', 'helmet', 'pants', 'shoes'].includes(part);

      if (isOffensive) {
        item.atk += atkGrowth;
      } else if (isDefensive) {
        item.def += defGrowth;
      } else {
        item.atk += Math.floor(3 + item.atk * 0.03);
        item.def += Math.floor(2 + item.def * 0.03);
      }

      if (item.extraStats) {
        const limitedKeys = ['critRate', 'critDmg', 'dodge', 'lifesteal', 'speed'];
        const limitedPercentKeys = ['critRatePercent', 'dodgePercent'];
        if (!item._initialExtraStats) item._initialExtraStats = {};
        for (const key of Object.keys(item.extraStats)) {
          const val = item.extraStats[key];
          if (!item._initialExtraStats[key]) item._initialExtraStats[key] = val;
          const initial = item._initialExtraStats[key];
          const maxVal = initial * 3;
          if (limitedPercentKeys.includes(key)) {
            item.extraStats[key] = Math.min(15, val + 0.5);
          } else if (limitedKeys.includes(key)) {
            const hardMax = key === 'critRate' ? 30 : key === 'critDmg' ? 200 : 40;
            item.extraStats[key] = Math.min(hardMax, Math.floor(val + 0.5));
          } else if (key.endsWith('Percent')) {
            item.extraStats[key] = Math.min(50, val + 1);
          } else {
            item.extraStats[key] = Math.min(maxVal, Math.floor(val * 1.03));
          }
        }
      }

      item.levelFailCount = 0;
      syncItemEverywhere(item);
      store.save();
      window.showToast(`${item.name} 强化成功！当前 Lv.${item.level}`);
    } else {
      item.levelFailCount = (item.levelFailCount || 0) + 1;
      syncItemEverywhere(item);
      store.save();
      window.showToast(`强化失败！下次成功率 ${Math.floor(getLevelSuccessRate(item) * 100)}%`);
    }
  }

  // ========== 导出 ==========
  return {
    store,
    forgeMode,
    currentSetFilter,
    setFilterOptions,
    filteredRecipes,
    equipFilter,
    equipFilterOptions,
    filteredUpgradeableItems,
    selectedUpgradeItem,
    materialIcon,
    hasMaterial,
    qualityColor,
    qualityLabel,
    getExtraStatName,
    getAffixName,
    getLevelSuccessRate,
    canCraft,
    craft,
    levelUpgradeCost,
    canUpgradeLevel,
    upgradeLevel,
    selectForUpgrade
  }
}