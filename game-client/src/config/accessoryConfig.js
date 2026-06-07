import { Icon } from '@iconify/vue'

// ========== 全新词条效果表（机制化设计）==========
export const AFFIX_EFFECTS = {
  grudge: {
    name: '怨恨', loreName: '怨恨',
    thresholds: [
      { level: 1, bonus: { attack: 15, dmgTaken: 12 } },
      { level: 3, bonus: { attack: 25, dmgTaken: 18 } },
      { level: 5, bonus: { attack: 40, dmgTaken: 25 } },
      { level: 7, bonus: { attack: 60, dmgTaken: 30 } },
      { level: 10, bonus: { attack: 90, dmgTaken: 40 } }
    ]
  },
  voodooDoll: {
    name: '巫毒娃娃', loreName: '巫毒',
    thresholds: [
      { level: 1, bonus: { trueDmgPercent: 10 } },
      { level: 3, bonus: { trueDmgPercent: 20 } },
      { level: 5, bonus: { trueDmgPercent: 35 } },
      { level: 7, bonus: { trueDmgPercent: 50 } },
      { level: 10, bonus: { trueDmgPercent: 80 } }
    ]
  },
  bluntWeapon: {
    name: '钝器', loreName: '钝器',
    thresholds: [
      { level: 1, bonus: { critDmg: 30, critRate: -2 } },
      { level: 3, bonus: { critDmg: 60, critRate: -4 } },
      { level: 5, bonus: { critDmg: 100, critRate: -5 } },
      { level: 7, bonus: { critDmg: 150, critRate: -6 } },
      { level: 10, bonus: { critDmg: 220, critRate: -8 } }
    ]
  },
  armorBreak: {
    name: '破甲', loreName: '破甲',
    thresholds: [
      { level: 1, bonus: { ignoreDef: 20, shieldDmg: 30 } },
      { level: 3, bonus: { ignoreDef: 35, shieldDmg: 50 } },
      { level: 5, bonus: { ignoreDef: 55, shieldDmg: 75 } },
      { level: 7, bonus: { ignoreDef: 80, shieldDmg: 110 } },
      { level: 10, bonus: { ignoreDef: 120, shieldDmg: 150 } }
    ]
  },
  manaResonance: {
    name: '法力共鸣', loreName: '法力',
    thresholds: [
      { level: 1, bonus: { mpCostReduction: 10, mpOnHit: 5 } },
      { level: 3, bonus: { mpCostReduction: 20, mpOnHit: 8 } },
      { level: 5, bonus: { mpCostReduction: 30, mpOnHit: 12, mpOnKill: 15 } },
      { level: 7, bonus: { mpCostReduction: 40, mpOnHit: 30, mpOnKill: 35 } },
      { level: 10, bonus: { mpCostReduction: 50, mpOnHit: 50, mpOnKill: 60 } }
    ]
  },
  adrenaline: {
    name: '肾上腺素', loreName: '肾上腺素',
    thresholds: [
      { level: 1, bonus: { stackingAtk: 5, maxStacks: 3 } },
      { level: 3, bonus: { stackingAtk: 7, maxStacks: 4 } },
      { level: 5, bonus: { stackingAtk: 10, maxStacks: 5 } },
      { level: 7, bonus: { stackingAtk: 14, maxStacks: 6 } },
      { level: 10, bonus: { stackingAtk: 20, maxStacks: 7 } }
    ]
  },
  bossHunter: {
    name: 'Boss猎人', loreName: '猎王',
    thresholds: [
      { level: 1, bonus: { bossDmg: 15 } },
      { level: 3, bonus: { bossDmg: 30 } },
      { level: 5, bonus: { bossDmg: 50 } },
      { level: 7, bonus: { bossDmg: 80 } },
      { level: 10, bonus: { bossDmg: 120 } }
    ]
  },
  elementMaster: {
    name: '属性大师', loreName: '元素',
    thresholds: [
      { level: 1, bonus: { allElemDmg: 12 } },
      { level: 3, bonus: { allElemDmg: 28 } },
      { level: 5, bonus: { allElemDmg: 50 } },
      { level: 7, bonus: { allElemDmg: 80 } },
      { level: 10, bonus: { allElemDmg: 120 } }
    ]
  },
  fortune: {
    name: '天运', loreName: '天运',
    thresholds: [
      { level: 1, bonus: { critRate: 8, doubleDrop: 5 } },
      { level: 3, bonus: { critRate: 18, doubleDrop: 10 } },
      { level: 5, bonus: { critRate: 30, doubleDrop: 15 } },
      { level: 7, bonus: { critRate: 45, doubleDrop: 25 } },
      { level: 10, bonus: { critRate: 65, doubleDrop: 40 } }
    ]
  },
  ambushMaster: {
    name: '奇袭大师', loreName: '奇袭',
    thresholds: [
      { level: 1, bonus: { halfHpCrit: 18 } },
      { level: 3, bonus: { halfHpCrit: 35 } },
      { level: 5, bonus: { halfHpCrit: 55, halfHpCritDmg: 25 } },
      { level: 7, bonus: { halfHpCrit: 80, halfHpCritDmg: 40 } },
      { level: 10, bonus: { halfHpCrit: 110, halfHpCritDmg: 65 } }
    ]
  },
  tenacity: {
    name: '顽强', loreName: '顽强',
    thresholds: [
      { level: 1, bonus: { deathSave: 20, deathShield: 15 } },
      { level: 3, bonus: { deathSave: 35, deathShield: 25 } },
      { level: 5, bonus: { deathSave: 50, deathShield: 35 } },
      { level: 7, bonus: { deathSave: 100, deathShield: 60 } },
      { level: 10, bonus: { deathSave: 100, deathShield: 120 } }
    ]
  },
phoenix: {
    name: '不死鸟', loreName: '不死鸟',
    thresholds: [
      { level: 1, bonus: { reviveChance: 25, reviveDmg: 10, fireDmg: 12, lifestealPercent: 5 } },
      { level: 3, bonus: { reviveChance: 45, reviveDmg: 20, fireDmg: 28, lifestealPercent: 10 } },
      { level: 5, bonus: { reviveChance: 70, reviveDmg: 30, fireDmg: 50, lifestealPercent: 15 } },
      { level: 7, bonus: { reviveChance: 100, reviveCD: 8, reviveDmg: 40, fireDmg: 80, lifestealPercent: 20 } },
      { level: 10, bonus: { reviveChance: 100, reviveCD: 4, reviveDmg: 60, fireDmg: 120, lifestealPercent: 25 } }
    ]
  },
  swiftWind: {
    name: '疾风', loreName: '疾风',
    thresholds: [
      { level: 1, bonus: { speed: 12, dodge: 5 } },
      { level: 3, bonus: { speed: 28, dodge: 10 } },
      { level: 5, bonus: { speed: 50, dodge: 15 } },
      { level: 7, bonus: { speed: 80, dodge: 25 } },
      { level: 10, bonus: { speed: 160, dodge: 40 } }
    ]
  }
}
export const AFFIX_IDS = Object.keys(AFFIX_EFFECTS)

// ========== 品质规则 ==========
export const QUALITY_RULES = {
  white:  { affixCount: [0, 1], maxLevel: 2, label: '普通', color: '#ffffff' },
  green:  { affixCount: [1, 1], maxLevel: 4, label: '优秀', color: '#4caf50' },
  blue:   { affixCount: [1, 2], maxLevel: 6, label: '精良', color: '#2196f3' },
  purple: { affixCount: [2, 2], maxLevel: 8, label: '史诗', color: '#9c27b0' },
  red:    { affixCount: [2, 3], maxLevel: 10, label: '传说', color: '#ff4444' }
}

export const QUALITY_ORDER = ['white', 'green', 'blue', 'purple', 'red']

// ========== 品质概率分布 ==========
export const QUALITY_WEIGHTS = {
  weak:   { white: 45, green: 35, blue: 15, purple: 4,  red: 1 },
  normal: { white: 30, green: 35, blue: 25, purple: 8,  red: 2 },
  strong: { white: 15, green: 30, blue: 30, purple: 18, red: 7 },
  boss:   { white: 5,  green: 20, blue: 30, purple: 30, red: 15 }
}

export function getLootConfig(tag) {
  const tags = ['weak', 'normal', 'strong', 'boss']
  const tier = tags.includes(tag) ? tag : 'normal'
  const accessories = ['earring1', 'earring2', 'necklace', 'ring1', 'ring2']
  return { dropChance: 0.6, qualityTier: tier, accessories }
}

export function rollQuality(tier) {
  const weights = QUALITY_WEIGHTS[tier] || QUALITY_WEIGHTS.normal
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (const [quality, weight] of Object.entries(weights)) {
    roll -= weight
    if (roll <= 0) return quality
  }
  return 'white'
}

export function getQualityLabel(quality) {
  return QUALITY_RULES[quality]?.label || '普通'
}

export function getQualityColor(quality) {
  return QUALITY_RULES[quality]?.color || '#ffffff'
}

export const QUALITY_STATS_MULTIPLIER = {
  white: 1.5,
  green: 2.2,
  blue: 3.5,
  purple: 5.0,
  red: 7.0
}

export const QUALITY_AFFIX_LEVEL_MIN = {
  white: 1, green: 2, blue: 3, purple: 4, red: 5
}

export const ACCESSORY_SLOT_NAMES = {
  necklace: '护符',
  ring1: '左戒',
  ring2: '右戒',
  earring1: '左耳坠',
  earring2: '右耳坠'
}

export function generateAccessoryName(slot, affixes = []) {
  const baseName = ACCESSORY_SLOT_NAMES[slot] || slot
  if (affixes.length > 0) {
    const mainAffix = AFFIX_EFFECTS[affixes[0].id]
    const loreName = mainAffix ? mainAffix.loreName : affixes[0].id
    return `${loreName}${baseName}`
  }
  return `无名${baseName}`
}