import {
  AFFIX_EFFECTS,
  QUALITY_RULES,
  QUALITY_WEIGHTS,
  rollQuality as originalRollQuality
} from '../config/accessoryConfig'
import { useGameStore } from '../store/gameStore'

// 生成一件饰品
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

  const store = useGameStore()
  // 从 store 中读取当前可用的词条ID列表，若未配置则回退到静态 AFFIX_EFFECTS 的键
  const affixPool = store.config?.affixPool || Object.keys(AFFIX_EFFECTS)
  const availableIds = [...affixPool.map(a => a.id || a)]
  
  const selectedAffixes = []
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

// 名称生成（已修复依赖 store）
function generateAccessoryName(part, affixes) {
  const store = useGameStore()
  const partNames = {
    earring1: '左耳环',
    earring2: '右耳环',
    ring1: '左戒指',
    ring2: '右戒指',
    necklace: '项链'
  }
  const baseName = partNames[part] || '耳环' // 默认左耳环，避免“饰品”
  if (affixes.length === 0) return baseName

  const firstAffix = affixes[0]
  const effect = store.config?.affixEffects?.[firstAffix.id] || AFFIX_EFFECTS[firstAffix.id]
  const loreName = effect?.loreName || effect?.name || firstAffix.id
  return `${loreName} ${baseName}`
}

// 单次掉落判定
export function rollAccessoryDrop(enemyName, enemyTag) {
  const store = useGameStore()
  // 根据怪物标签决定品质权重层级，未提供标签默认为 normal
  const tier = enemyTag || 'normal'
  // 直接使用 qualityWeights 中的对应权重来随机品质
  const quality = rollQuality(tier)
  // 饰品部位池：所有五件饰品
  const parts = ['earring1', 'earring2', 'necklace', 'ring1', 'ring2']
  const part = parts[Math.floor(Math.random() * parts.length)]
  return generateAccessory(part, quality)
}

// 生成多次掉落
export function generateAccessoryLoot(enemy) {
  if (!enemy) return []
  const store = useGameStore()
  const multiplier = store.config.lootMultiplier || 1
  const dropped = []
  // 基础掉率根据等级微调，最高50%
  const baseDropChance = Math.min(0.5, 0.1 + (enemy.level || 1) * 0.02)
  const dropChance = Math.min(1, baseDropChance * multiplier)
  const maxDrops = Math.random() < 0.3 ? 2 : 1
  for (let i = 0; i < maxDrops; i++) {
    if (Math.random() < dropChance) {
      // 传递怪物的标签
      const acc = rollAccessoryDrop(enemy.name || 'slime', enemy.tag)
      if (acc) dropped.push(acc)
    }
  }
  return dropped
}

// 根据品质权重随机品质（复用原函数逻辑，但优先使用 store 中的权重）
function rollQuality(tier) {
  const store = useGameStore()
  const weights = store.config?.qualityWeights?.[tier] || QUALITY_WEIGHTS[tier] || QUALITY_WEIGHTS.normal
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (const [quality, weight] of Object.entries(weights)) {
    roll -= weight
    if (roll <= 0) return quality
  }
  return 'white'
}

// 饰品描述工具（无变化）
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