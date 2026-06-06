// src/combat/rewards.js
import { rollQuality, QUALITY_STATS_MULTIPLIER, QUALITY_WEIGHTS } from '../config/accessoryConfig'
import { AFFIX_EFFECTS, QUALITY_AFFIX_LEVEL_MIN } from '../config/accessoryConfig'

/* ==================== 攻击/防御词条分类 ==================== */
const OFFENSIVE_AFFIX_KEYS = ['grudge','voodooDoll','bluntWeapon','elementMaster','ambushMaster','fortune']
const DEFENSIVE_AFFIX_KEYS = ['armorBreak','manaResonance','adrenaline','tenacity','phoenix','bossHunter']
const OFFENSIVE_PARTS = ['weapon', 'gauntlet']
const DEFENSIVE_PARTS = ['armor', 'helmet', 'pants', 'shoes']

/* ==================== 副词条池（每种品质随机抽1个） ==================== */
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

/* ==================== 生成随机装备 ==================== */
function generateRandomEquipment(tag, monsterLevel, playerLevel) {
  try {
    let baseWeights = QUALITY_WEIGHTS[tag] || QUALITY_WEIGHTS.normal
    let qualityWeights = { ...baseWeights }

    if (playerLevel <= 5) {
      qualityWeights = { white: 70, green: 25, blue: 5, purple: 0, red: 0 }
    } else if (playerLevel <= 10) {
      qualityWeights = { white: 55, green: 30, blue: 13, purple: 2, red: 0 }
    } else if (playerLevel <= 15) {
      qualityWeights = { white: 40, green: 32, blue: 22, purple: 5, red: 1 }
    } else {
      if (tag !== 'boss' && tag !== 'strong') {
        qualityWeights = { ...baseWeights, red: 0.2, purple: 2, blue: 15, green: 30, white: 52.8 }
      } else if (tag === 'strong') {
        qualityWeights = { ...baseWeights, red: 1, purple: 10, blue: 30, green: 35, white: 24 }
      }
      if (tag === 'boss') {
        qualityWeights = { white: 0, green: 20, blue: 35, purple: 30, red: 15 }
      }
    }

    let quality = 'white'
    const total = Object.values(qualityWeights).reduce((a, b) => a + b, 0)
    let roll = Math.random() * total
    for (const [q, w] of Object.entries(qualityWeights)) {
      roll -= w
      if (roll <= 0) { quality = q; break }
    }

    let equipLevel = Math.min(monsterLevel, playerLevel + 2)
    equipLevel = Math.max(monsterLevel - 5, equipLevel)
    if (quality === 'purple') equipLevel = Math.min(monsterLevel + 1, playerLevel + 3)
    if (quality === 'red') equipLevel = Math.min(monsterLevel + 2, playerLevel + 4)
    equipLevel = Math.max(1, equipLevel + Math.floor(Math.random() * 3) - 1)

    const part = ['weapon', 'armor', 'helmet', 'pants', 'shoes', 'gauntlet'][Math.floor(Math.random() * 6)]
    const isOffensive = OFFENSIVE_PARTS.includes(part)

    let baseAtk = 0, baseDef = 0
    if (part === 'weapon')      baseAtk = 6 + Math.floor(equipLevel * 1.4)
    else if (part === 'gauntlet') baseAtk = 4 + Math.floor(equipLevel * 1.0)
    else if (part === 'armor')   baseDef = 6 + Math.floor(equipLevel * 0.8)
    else if (part === 'helmet')  baseDef = 4 + Math.floor(equipLevel * 0.6)
    else if (part === 'pants')   baseDef = 5 + Math.floor(equipLevel * 0.7)
    else if (part === 'shoes')   baseDef = 3 + Math.floor(equipLevel * 0.5)

    let qualityMult = { white: 1, green: 1.5, blue: 2, purple: 3, red: 4 }[quality] || 1
    if (!isOffensive && quality === 'red') qualityMult = 3
    if (!isOffensive && quality === 'purple') qualityMult = 2.5

    const atk = Math.floor(baseAtk * qualityMult)
    const def = Math.floor(baseDef * qualityMult)

    const extraStats = {}
    if (quality !== 'white') {
      const pool = isOffensive ? ATTACK_AFFIX_POOL : DEFENSE_AFFIX_POOL
      const affix = pool[Math.floor(Math.random() * pool.length)]
      if (affix.type === 'percent') {
        const base = affix.min + Math.floor(Math.random() * (affix.max - affix.min + 1))
        const bonus = Math.floor(equipLevel / 10) * 2
        extraStats[affix.id] = Math.min(affix.max + 5, base + bonus)
      } else {
        const base = affix.min + Math.floor(Math.random() * (affix.max - affix.min + 1))
        const multiplier = 1 + equipLevel / 20
        extraStats[affix.id] = Math.max(1, Math.floor(base * multiplier))
      }
    }

    let shoeSpeed = 0
    if (part === 'shoes') {
      shoeSpeed = 2 + Math.floor(Math.random() * 5)
    }

    const affixKeys = isOffensive ? OFFENSIVE_AFFIX_KEYS : DEFENSIVE_AFFIX_KEYS
    const affixCount = quality === 'white' ? 0 : quality === 'green' ? 1 : quality === 'blue' ? 1 : quality === 'purple' ? 2 : 2
    const affixes = []
    const used = new Set()
    let maxAffixLevel = 1
    if (quality === 'purple') maxAffixLevel = 2
    if (quality === 'red') maxAffixLevel = 3
    const minLevel = QUALITY_AFFIX_LEVEL_MIN[quality] || 1
    for (let i = 0; i < affixCount; i++) {
      const key = affixKeys[Math.floor(Math.random() * affixKeys.length)]
      if (used.has(key)) continue
      used.add(key)
      let affixLevel = Math.min(maxAffixLevel, Math.max(minLevel, Math.floor(equipLevel / 15) + 1))
      affixes.push({ id: key, level: affixLevel })
    }

    const nameMap = { weapon: '剑', armor: '铠', helmet: '盔', pants: '护腿', shoes: '靴', gauntlet: '臂甲' }
    const qualityName = { white: '破旧的', green: '普通的', blue: '精良的', purple: '史诗的', red: '传说的' }[quality]

    return {
      id: `drop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: `${qualityName}${nameMap[part]}`,
      type: part, part,
      level: equipLevel,
      quality,
      atk, def,
      baseAtk: baseAtk,
      baseDef: baseDef,
      qualityMult: qualityMult,
      speed: shoeSpeed,
      extraStats,
      affixes,
      levelRequired: equipLevel,
      gemSlots: quality === 'red' ? 1 : 0
    }
  } catch (e) {
    console.error('生成随机装备失败', e)
    return null
  }
}

/* ==================== 战斗奖励 ==================== */
export function getRewards(engine) {
  if (engine.winner !== 'player') {
    return { exp: 0, materials: [], accessories: [], equipments: [], gems: [] }
  }

  let exp = 0
  const materials = []
  const equipments = []
  const gems = []

  const doubleDrop = engine.player?.doubleDrop || 0
  const playerLevel = engine.player?.level || 1

  for (const e of engine.enemies) {
    try {
      const monsterLevel = e.level || (e.base?.level) || 1

      // 经验值（等级差修正）
      const levelDiff = monsterLevel - playerLevel
      let expMultiplier = 1.0
      if (levelDiff >= 5) expMultiplier = 2.0
      else if (levelDiff >= 3) expMultiplier = 1.5
      else if (levelDiff >= 1) expMultiplier = 1.2
      else if (levelDiff === 0) expMultiplier = 1.0
      else if (levelDiff <= -5) expMultiplier = 0.3
      else expMultiplier = 0.6
      exp += Math.floor(monsterLevel * 15 * expMultiplier)

      // 材料掉落
     // 材料掉落
const mats = e.base?.materials || (e.base?.material ? [e.base.material] : [])
for (const matDef of mats) {
    const dropRate = matDef.dropRate ?? 100
    if (Math.random() * 100 < dropRate) {
        let qty = matDef.qty || 1
        if (doubleDrop > 0 && Math.random() * 100 < doubleDrop) qty *= 2

        // ✅ 关键：如果是 gem_random，跳过并触发随机宝石逻辑
        if (matDef.id === 'gem_random') {
            const gemDefs = engine.config?.gemDefinitions || []
            if (gemDefs.length > 0) {
                const eligible = gemDefs.filter(g => g.level === 7)
                if (eligible.length > 0) {
                    const gem = eligible[Math.floor(Math.random() * eligible.length)]
                    gems.push({ id: gem.id, name: gem.name, qty: 1 })
                }
            }
            continue; // 跳过普通材料处理
        }

        // 其他宝石类掉落
        if (matDef.id?.startsWith('gem_')) {
            gems.push({ id: matDef.id, name: matDef.name || matDef.id, qty })
        } else {
            materials.push({ id: matDef.id, name: matDef.name || matDef.id, qty })
        }
    }
}

      // 副本Boss特殊掉落（品质魔石 + 专属材料 + 7级宝石）
// 副本Boss特殊掉落（品质魔石 + 专属材料 + 7级宝石）
if (e.isRaidBoss || e.base?.isRaidBoss) {
    const bossId = e.id || e.base?.id

    // 品质魔石
    let qualityStoneQty = 2
    if (bossId === 'raid_bishop') qualityStoneQty = 5
    else if (bossId === 'raid_lava_core') qualityStoneQty = 4
    else if (bossId === 'raid_gladiator') qualityStoneQty = 3
    materials.push({ id: 'quality_stone', name: '品质魔石', qty: qualityStoneQty })

    // ✅ 核心：在这里硬编码 7 级宝石掉落
    const gemDefs = engine.config?.gemDefinitions || []
    if (gemDefs.length > 0) {
        const eligible = gemDefs.filter(g => g.level === 7)
        if (eligible.length > 0) {
            const gem = eligible[Math.floor(Math.random() * eligible.length)]
            gems.push({ id: gem.id, name: gem.name, qty: 1 })
          
        }
    } 

    // 概率掉落装备
    if (Math.random() < 0.4) {
        const eq = generateRandomEquipment('boss', 21, playerLevel)
        if (eq) equipments.push(eq)
    }
}

      // 塔Boss掉落套装材料 + 宝石
      if (e.isBoss && !e.isRaidBoss && !(e.base?.isRaidBoss)) {
        const bossId = e.id || e.base?.id

        if (bossId === 'boss_shadow_lord') {
          materials.push({ id: 'dungeon_token', name: '地下城徽记', qty: 3, dropRate: 100 })
          materials.push(
            { id: 'obsidian', name: '黑曜石', qty: 8, dropRate: 100 },
            { id: 'crystal_shard', name: '晶簇碎片', qty: 5, dropRate: 100 }
          )
        }
        if (bossId === 'boss_fire_dragon') {
          materials.push({ id: 'dungeon_token', name: '地下城徽记', qty: 3, dropRate: 100 })
          materials.push({ id: 'dragon_ore', name: '龙鳞矿', qty: 8, dropRate: 100 })
        }

        const gemDefs = engine.config?.gemDefinitions || []
        if (gemDefs.length > 0) {
          let minLevel = 1, maxLevel = 1, gemQty = 0

          if (bossId === 'boss_goblin_king') {
            minLevel = 3; maxLevel = 5; gemQty = 2
          } else if (bossId === 'boss_shadow_lord') {
            minLevel = 4; maxLevel = 6; gemQty = 3
          } else if (bossId === 'boss_fire_dragon') {
            minLevel = 5; maxLevel = 7; gemQty = 4
          }

          for (let i = 0; i < gemQty; i++) {
            const eligible = gemDefs.filter(g => g.level >= minLevel && g.level <= maxLevel)
            if (eligible.length > 0) {
              const gem = eligible[Math.floor(Math.random() * eligible.length)]
              gems.push({ id: gem.id, name: gem.name, qty: 1 })
            }
          }
        }
      }

      // 普通小怪装备掉落 + 宝石掉落
      if (!e.isBoss && !(e.base && e.base.isBoss)) {
        // 宝石掉落（6%概率掉落1~2级）
        const gemDefs = engine.config?.gemDefinitions || []
        if (Math.random() < 0.06) {
          const eligible = gemDefs.filter(g => g.level >= 1 && g.level <= 2)
          if (eligible.length > 0) {
            const gem = eligible[Math.floor(Math.random() * eligible.length)]
            gems.push({ id: gem.id, name: gem.name, qty: 1 })
          }
        }

        // 装备掉落
        let dropRate = 0.12
        if (playerLevel <= 5) dropRate = 0.30
        else if (playerLevel <= 10) dropRate = 0.22
        else if (playerLevel <= 15) dropRate = 0.18
        if (e.base?.tag === 'strong') dropRate *= 1.2
        if (monsterLevel < playerLevel - 5) dropRate *= 0.5
        else if (monsterLevel < playerLevel) dropRate *= 0.8
        else if (monsterLevel > playerLevel + 3) dropRate *= 1.2

        if (Math.random() < dropRate) {
          const eq = generateRandomEquipment(e.base?.tag || 'normal', monsterLevel, playerLevel)
          if (eq) equipments.push(eq)
        }
      }
    } catch (err) {
      console.error('处理敌人掉落出错:', e, err)
    }
  }

  return { exp, materials, accessories: [], equipments, gems }
}