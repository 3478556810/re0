import {
  rollQuality as originalRollQuality,
  QUALITY_RULES,
  AFFIX_EFFECTS,
  QUALITY_WEIGHTS,
  QUALITY_STATS_MULTIPLIER,
  QUALITY_AFFIX_LEVEL_MIN
} from '../config/accessoryConfig'
import { useGameStore } from '../store/gameStore'

// ========== 核心生成函数 ==========
/**
 * 根据怪物等级、世界等级、怪物标签生成一件饰品
 * @param {Object} enemy - 怪物对象，需包含 level、tag 等字段
 * @param {number} worldLevel - 当前世界等级
 * @returns {Object|null}
 */
export function generateAccessoryLoot(enemy, worldLevel = 1) {
  if (!enemy || !enemy.level) return null

  const itemLevel = enemy.level || 1
  const tag = enemy.tag || 'normal'

  // 1. 随机品质（根据怪物标签 + 世界等级微调）
  const quality = rollQualityForEnemy(tag, worldLevel)

  // 2. 基础属性：饰品等级和品质倍率决定
const baseAtk = 2 + (itemLevel - 1) * 1.0
const baseDef = 1 + (itemLevel - 1) * 0.25
  const qualityMult = QUALITY_STATS_MULTIPLIER[quality] || 1
  const atk = Math.floor(baseAtk * qualityMult)
  const def = Math.floor(baseDef * qualityMult)

  // 3. 随机词条
  const rule = QUALITY_RULES[quality]
  const minAffix = rule?.affixCount?.[0] || 0
  const maxAffix = rule?.affixCount?.[1] || 1
  const affixCount = minAffix + Math.floor(Math.random() * (maxAffix - minAffix + 1))
  const affixes = generateAffixes(affixCount, quality, itemLevel)

  // 4. 随机部位
  const parts = ['necklace', 'ring1', 'ring2', 'earring1', 'earring2']
  const part = parts[Math.floor(Math.random() * parts.length)]

  return {
    id: 'acc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name: `${getQualityLabel(quality)} ${getPartName(part)}`,
    part,
    quality,
    level: itemLevel,
    atk,
    def,
    affixes
  }
}

// 兼容旧调用（用于商店等场景）
export function rollAccessoryDrop(enemyName, enemyTag) {
  const tag = enemyTag || 'normal'
  const quality = rollQualityForEnemy(tag, 1)
  const parts = ['earring1', 'earring2', 'necklace', 'ring1', 'ring2']
  const part = parts[Math.floor(Math.random() * parts.length)]
  return generateAccessoryLegacy(part, quality)
}

// 旧版生成（保留兼容性）
function generateAccessoryLegacy(part, quality) {
  const rule = QUALITY_RULES[quality]
  if (!rule) return null

  const qualityBase = {
    white: [1, 3], green: [3, 6], blue: [5, 10], purple: [8, 15], red: [12, 20]
  }
  const [atkMin, atkMax] = qualityBase[quality] || [0, 0]
  const atk = Math.floor(Math.random() * (atkMax - atkMin + 1)) + atkMin
  const def = Math.floor(atk * 0.6)

  const [minAffix, maxAffix] = rule.affixCount
  const affixCount = minAffix + Math.floor(Math.random() * (maxAffix - minAffix + 1))
  const affixes = generateAffixes(affixCount, quality, 1)

  return {
    id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    part,
    quality,
    name: generateAccessoryName(part, affixes),
    atk,
    def,
    level: 1,
    affixes
  }
}

// ========== 工具函数 ==========

function generateAffixes(count, quality, itemLevel) {
  const affixKeys = Object.keys(AFFIX_EFFECTS)
  if (affixKeys.length === 0) return []

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

function rollQualityForEnemy(tag, worldLevel) {
  const store = useGameStore()
  const weights = store.config?.qualityWeights?.[tag] || QUALITY_WEIGHTS[tag] || QUALITY_WEIGHTS.normal
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (const [quality, weight] of Object.entries(weights)) {
    roll -= weight
    if (roll <= 0) return quality
  }
  return 'white'
}

function getQualityLabel(q) {
  const map = { white: '普通', green: '优秀', blue: '精良', purple: '史诗', red: '传说' }
  return map[q] || q
}

function getPartName(part) {
  const map = {
    necklace: '项链',
    ring1: '戒指',
    ring2: '戒指',
    earring1: '耳环',
    earring2: '耳环'
  }
  return map[part] || '饰品'
}

function generateAccessoryName(part, affixes) {
  const baseName = getPartName(part)
  if (!affixes || affixes.length === 0) return baseName
  const firstAffix = affixes[0]
  const effect = AFFIX_EFFECTS[firstAffix.id]
  const loreName = effect?.loreName || effect?.name || firstAffix.id
  return `${loreName} ${baseName}`
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