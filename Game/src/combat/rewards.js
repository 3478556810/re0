// src/combat/rewards.js
import { rollQuality, QUALITY_STATS_MULTIPLIER } from '../config/accessoryConfig'
import { AFFIX_EFFECTS, QUALITY_AFFIX_LEVEL_MIN } from '../config/accessoryConfig'

function generateRandomEquipment(tag, worldLevel) {
  try {
    const parts = ['weapon', 'armor', 'helmet', 'pants', 'shoes', 'gauntlet']
    const part = parts[Math.floor(Math.random() * parts.length)]
    const quality = rollQuality(tag)
    const level = Math.max(1, worldLevel + Math.floor(Math.random() * 5) - 2)

    const baseAtk = (part === 'weapon' || part === 'gauntlet') ? 8 + worldLevel * 2 : 0
    const baseDef = part !== 'weapon' ? 5 + worldLevel * 2 : 0
    const qualityMult = QUALITY_STATS_MULTIPLIER[quality] || 1
    const atk = Math.floor((baseAtk || 1) * qualityMult * (1 + (level - 1) * 0.1))
    const def = Math.floor((baseDef || 0) * qualityMult * (1 + (level - 1) * 0.1))

    // 刻印词条（来自 AFFIX_EFFECTS）
    const affixKeys = Object.keys(AFFIX_EFFECTS)
    const affixCount = Math.min(2, 1 + Math.floor(Math.random() * 2))
    const affixes = []
    const used = new Set()
    const minLevel = QUALITY_AFFIX_LEVEL_MIN[quality] || 1
    for (let i = 0; i < affixCount; i++) {
      const key = affixKeys[Math.floor(Math.random() * affixKeys.length)]
      if (used.has(key)) continue
      used.add(key)
      const affixLevel = Math.min(5, Math.max(minLevel, Math.floor(level / 10) + 1))
      affixes.push({ id: key, level: affixLevel })
    }

    const namePrefix = quality === 'white' ? '破旧的' : quality === 'green' ? '普通' : '精良'
    const nameMap = {
      weapon: '剑', armor: '铠', helmet: '盔', pants: '护腿', shoes: '靴', gauntlet: '臂甲'
    }

    return {
      id: `random_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: `${namePrefix}${nameMap[part]}`,
      type: part, part,
      level,
      quality,
      atk, def,
      affixes,
      levelRequired: 1,
      gemSlots: 0
    }
  } catch (e) {
    console.error('生成随机装备失败', e)
    // 保底：返回一件最基础的白装，防止中断
    return {
      id: `fallback_${Date.now()}`,
      name: '破旧的剑',
      type: 'weapon', part: 'weapon',
      level: 1, quality: 'white',
      atk: 5, def: 0,
      affixes: [],
      levelRequired: 1,
      gemSlots: 0
    }
  }
}

export function getRewards(engine) {
  if (engine.winner !== 'player') {
    return { exp: 0, materials: [], accessories: [], equipments: [] }
  }

  let exp = 0
  const materials = []
  const equipments = []

  const doubleDrop = engine.player?.doubleDrop || 0
  const playerLevel = engine.player?.level || 1   // 玩家等级

  for (const e of engine.enemies) {
    try {
      const level = e.level || (e.base?.level) || 1
      
      // ✅ 等级差经验计算
      const levelDiff = level - playerLevel
      let expMultiplier = 1.0
      if (levelDiff >= 5) expMultiplier = 2.0
      else if (levelDiff >= 3) expMultiplier = 1.5
      else if (levelDiff >= 1) expMultiplier = 1.2
      else if (levelDiff === 0) expMultiplier = 1.0
      else if (levelDiff <= -5) expMultiplier = 0.3
      else expMultiplier = 0.6

      const baseExp = level * 15
      exp += Math.floor(baseExp * expMultiplier)

      // 材料（此逻辑不变，Boss 的必掉材料已在 monsters.json 中配置）
      const mats = e.base?.materials || (e.base?.material ? [e.base.material] : [])
      for (const matDef of mats) {
        const dropRate = matDef.dropRate ?? 100
        if (Math.random() * 100 < dropRate) {
          let qty = matDef.qty || 1
          if (doubleDrop > 0 && Math.random() * 100 < doubleDrop) {
            qty *= 2
          }
          materials.push({
            id: matDef.id,
            name: matDef.name || matDef.id,
            qty: qty
          })
        }
      }

      // 装备掉落
      const isBoss = e.isBoss === true || (e.base && e.base.isBoss === true)
      if (!isBoss) {
        const dropRate = 0.2 + level * 0.01
        if (Math.random() < dropRate) {
          const eq = generateRandomEquipment(e.base?.tag || 'normal', level)
          if (eq) equipments.push(eq)
        }
      }
    } catch (err) {
      console.error('处理敌人掉落出错:', e, err)
    }
  }

  return { exp, materials, accessories: [], equipments }
}