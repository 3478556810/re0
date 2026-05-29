/**
 * 饰品生成工具
 */
import {
  AFFIX_EFFECTS,
  AFFIX_IDS,
  QUALITY_RULES,
  rollQuality,
  getLootTable
} from '../config/accessoryConfig'
import { useGameStore } from '../store/gameStore' // 在函数内使用

export function generateAccessory(part, quality) {
  const rule = QUALITY_RULES[quality]
  if (!rule) return null

  const qualityBase = {
    white: [1, 3],
    green: [3, 6],
    blue: [5, 10],
    purple: [8, 15],
    red: [12, 20]
  }
  const [atkMin, atkMax] = qualityBase[quality] || [0, 0]
  const atk = Math.floor(Math.random() * (atkMax - atkMin + 1)) + atkMin
  const def = Math.floor(atk * 0.6)

  const [minAffix, maxAffix] = rule.affixCount
  const affixCount = minAffix + Math.floor(Math.random() * (maxAffix - minAffix + 1))

  const selectedAffixes = []
  const availableIds = [...AFFIX_IDS]
  for (let i = 0; i < affixCount && availableIds.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableIds.length)
    const affixId = availableIds.splice(idx, 1)[0]
    const level = 1 + Math.floor(Math.random() * rule.maxLevel)
    selectedAffixes.push({ id: affixId, level })
  }

  const name = generateAccessoryName(part, selectedAffixes)

  return {
    id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    part,
    quality,
    name,
    atk,
    def,
     affixes: selectedAffixes || [] 
  }
}

// 词条中二名映射表（可后续移至 accessoryConfig.js）

function generateAccessoryName(part, affixes) {
  const partNames = {
    earring1: '左耳环',
    earring2: '右耳环',
    ring1: '左戒指',
    ring2: '右戒指',
    necklace: '项链'
  }
  const baseName = partNames[part] || '饰品'
  
  if (affixes.length === 0) return baseName

  const firstAffix = affixes[0]
  const effect = store.config.affixEffects?.[firstAffix.id] || AFFIX_EFFECTS[firstAffix.id]
  const loreName = effect?.loreName || effect?.name || firstAffix.id
  return `${loreName} ${baseName}`
}
export function rollAccessoryDrop(enemyName) {
  const table = getLootTable(enemyName)
  if (Math.random() > table.dropChance) return null
  const quality = rollQuality(table.qualityTier)
  const parts = table.accessories
  const part = parts[Math.floor(Math.random() * parts.length)]
  return generateAccessory(part, quality)
}

export function generateAccessoryLoot(enemy) {
  if (!enemy) return []
  const store = useGameStore()
  const multiplier = store.config.lootMultiplier || 1  // 读取全局倍率
  const dropped = []
  const baseDropChance = Math.min(0.5, 0.1 + (enemy.level || 1) * 0.02)
  const dropChance = Math.min(1, baseDropChance * multiplier)
  const maxDrops = Math.random() < 0.3 ? 2 : 1
  for (let i = 0; i < maxDrops; i++) {
    if (Math.random() < dropChance) {
      const acc = rollAccessoryDrop(enemy.name || 'slime')
      if (acc) dropped.push(acc)
    }
  }
  return dropped
}

export function getAccessoryDescription(accessory) {
  if (!accessory) return ''
  const lines = []
  lines.push(`攻击: ${accessory.atk || 0}`)
  lines.push(`防御: ${accessory.def || 0}`)
  if (accessory.affixes?.length) {
    lines.push('词条:')
    accessory.affixes.forEach(a => {
      const effect = AFFIX_EFFECTS[a.id]
      const desc = effect ? `${effect.name} Lv.${a.level}` : `未知词条 Lv.${a.level}`
      lines.push(`  ${desc}`)
    })
  }
  return lines.join('\n')
}