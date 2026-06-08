import { Icon } from '@iconify/vue'

// ========== 全新词条效果表（全面加强）==========
export const AFFIX_EFFECTS = {
  grudge: {
    name: '怨恨', loreName: '怨恨',
    thresholds: [
      { level: 1, bonus: { attack: 30, dmgTaken: 12 } },
      { level: 3, bonus: { attack: 55, dmgTaken: 18 } },
      { level: 5, bonus: { attack: 85, dmgTaken: 25 } },
      { level: 7, bonus: { attack: 120, dmgTaken: 30 } },
      { level: 10, bonus: { attack: 180, dmgTaken: 40 } }
    ]
  },
  voodooDoll: {
    name: '巫毒娃娃', loreName: '巫毒',
    thresholds: [
      { level: 1, bonus: { trueDmgPercent: 15 } },
      { level: 3, bonus: { trueDmgPercent: 30 } },
      { level: 5, bonus: { trueDmgPercent: 50 } },
      { level: 7, bonus: { trueDmgPercent: 70 } },
      { level: 10, bonus: { trueDmgPercent: 100 } }
    ]
  },
  bluntWeapon: {
    name: '钝器', loreName: '钝器',
    thresholds: [
      { level: 1, bonus: { critDmg: 45, critRate: -2 } },
      { level: 3, bonus: { critDmg: 90, critRate: -4 } },
      { level: 5, bonus: { critDmg: 150, critRate: -5 } },
      { level: 7, bonus: { critDmg: 220, critRate: -6 } },
      { level: 10, bonus: { critDmg: 320, critRate: -8 } }
    ]
  },
  armorBreak: {
    name: '破甲', loreName: '破甲',
    thresholds: [
      { level: 1, bonus: { ignoreDef: 30, shieldDmg: 40 } },
      { level: 3, bonus: { ignoreDef: 50, shieldDmg: 70 } },
      { level: 5, bonus: { ignoreDef: 80, shieldDmg: 100 } },
      { level: 7, bonus: { ignoreDef: 120, shieldDmg: 150 } },
      { level: 10, bonus: { ignoreDef: 180, shieldDmg: 200 } }
    ]
  },
  manaResonance: {
    name: '法力共鸣', loreName: '法力',
    thresholds: [
      { level: 1, bonus: { mpCostReduction: 15, mpOnHit: 8 } },
      { level: 3, bonus: { mpCostReduction: 25, mpOnHit: 12 } },
      { level: 5, bonus: { mpCostReduction: 35, mpOnHit: 18, mpOnKill: 20 } },
      { level: 7, bonus: { mpCostReduction: 45, mpOnHit: 40, mpOnKill: 45 } },
      { level: 10, bonus: { mpCostReduction: 50, mpOnHit: 60, mpOnKill: 80 } }
    ]
  },
  adrenaline: {
    name: '肾上腺素', loreName: '肾上腺素',
    thresholds: [
      { level: 1, bonus: { stackingAtk: 8, maxStacks: 4 } },
      { level: 3, bonus: { stackingAtk: 12, maxStacks: 5 } },
      { level: 5, bonus: { stackingAtk: 18, maxStacks: 6 } },
      { level: 7, bonus: { stackingAtk: 25, maxStacks: 7 } },
      { level: 10, bonus: { stackingAtk: 35, maxStacks: 8 } }
    ]
  },
  bossHunter: {
    name: 'Boss猎人', loreName: '猎王',
    thresholds: [
      { level: 1, bonus: { bossDmg: 25 } },
      { level: 3, bonus: { bossDmg: 45 } },
      { level: 5, bonus: { bossDmg: 75 } },
      { level: 7, bonus: { bossDmg: 120 } },
      { level: 10, bonus: { bossDmg: 180 } }
    ]
  },
  elementMaster: {
    name: '属性大师', loreName: '元素',
    thresholds: [
      { level: 1, bonus: { allElemDmg: 20 } },
      { level: 3, bonus: { allElemDmg: 45 } },
      { level: 5, bonus: { allElemDmg: 75 } },
      { level: 7, bonus: { allElemDmg: 110 } },
      { level: 10, bonus: { allElemDmg: 160 } }
    ]
  },
  fortune: {
    name: '天运', loreName: '天运',
    thresholds: [
      { level: 1, bonus: { critRate: 12, doubleDrop: 8 } },
      { level: 3, bonus: { critRate: 25, doubleDrop: 15 } },
      { level: 5, bonus: { critRate: 40, doubleDrop: 22 } },
      { level: 7, bonus: { critRate: 60, doubleDrop: 35 } },
      { level: 10, bonus: { critRate: 85, doubleDrop: 50 } }
    ]
  },
  ambushMaster: {
    name: '奇袭大师', loreName: '奇袭',
    thresholds: [
      { level: 1, bonus: { halfHpCrit: 25 } },
      { level: 3, bonus: { halfHpCrit: 50 } },
      { level: 5, bonus: { halfHpCrit: 80, halfHpCritDmg: 40 } },
      { level: 7, bonus: { halfHpCrit: 120, halfHpCritDmg: 65 } },
      { level: 10, bonus: { halfHpCrit: 170, halfHpCritDmg: 100 } }
    ]
  },
  tenacity: {
    name: '顽强', loreName: '顽强',
    thresholds: [
      { level: 1, bonus: { deathSave: 30, deathShield: 25 } },
      { level: 3, bonus: { deathSave: 50, deathShield: 40 } },
      { level: 5, bonus: { deathSave: 75, deathShield: 60 } },
      { level: 7, bonus: { deathSave: 100, deathShield: 90 } },
      { level: 10, bonus: { deathSave: 100, deathShield: 150 } }
    ]
  },
  phoenix: {
    name: '不死鸟', loreName: '不死鸟',
    thresholds: [
      { level: 1, bonus: { reviveChance: 35, reviveDmg: 15, fireDmg: 20, lifestealPercent: 8 } },
      { level: 3, bonus: { reviveChance: 55, reviveDmg: 30, fireDmg: 40, lifestealPercent: 15 } },
      { level: 5, bonus: { reviveChance: 80, reviveDmg: 50, fireDmg: 70, lifestealPercent: 22 } },
      { level: 7, bonus: { reviveChance: 100, reviveCD: 6, reviveDmg: 70, fireDmg: 110, lifestealPercent: 30 } },
      { level: 10, bonus: { reviveChance: 100, reviveCD: 3, reviveDmg: 100, fireDmg: 160, lifestealPercent: 40 } }
    ]
  },
  swiftWind: {
    name: '疾风', loreName: '疾风',
    thresholds: [
      { level: 1, bonus: { speed: 20, dodge: 8 } },
      { level: 3, bonus: { speed: 45, dodge: 15 } },
      { level: 5, bonus: { speed: 80, dodge: 25 } },
      { level: 7, bonus: { speed: 130, dodge: 40 } },
      { level: 10, bonus: { speed: 200, dodge: 60 } }
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

// ========== 品质概率分布（大幅降低小怪高品质掉率）==========
export const QUALITY_WEIGHTS = {
  weak:   { white: 70, green: 25, blue: 4,  purple: 1,  red: 0 },
  normal: { white: 50, green: 35, blue: 13, purple: 2,  red: 0 },
  strong: { white: 20, green: 35, blue: 30, purple: 12, red: 3 },
  boss:   { white: 0,  green: 20, blue: 35, purple: 30, red: 15 }
}

export function getLootConfig(tag) {
  const tags = ['weak', 'normal', 'strong', 'boss']
  const tier = tags.includes(tag) ? tag : 'normal'
  const accessories = ['earring1', 'earring2', 'necklace', 'ring1', 'ring2']
  // 普通怪物掉率整体降低 40%
  let dropChance = tier === 'weak' || tier === 'normal' ? 0.3 : 0.6
  return { dropChance, qualityTier: tier, accessories }
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