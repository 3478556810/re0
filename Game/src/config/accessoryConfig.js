import { Icon } from '@iconify/vue'

// ========== 全新词条效果表（机制化设计）==========
export const AFFIX_EFFECTS = {
  // ========== T1 输出核心（大幅削弱） ==========

  // 1. 怨恨：攻击加成砍半
  grudge: {
    name: '怨恨', loreName: '怨恨',
    thresholds: [
      { level: 1, desc: '攻+8%，受伤+10%', bonus: { attack: 8, dmgTaken: 10 } },
      { level: 3, desc: '攻+15%，受伤+20%', bonus: { attack: 15, dmgTaken: 20 } },
      { level: 5, desc: '攻+25%，受伤+30%', bonus: { attack: 25, dmgTaken: 30 } },
      { level: 7, desc: '攻+40%，受伤+35%', bonus: { attack: 40, dmgTaken: 35 } },
      { level: 10, desc: '攻+60%，受伤+40%', bonus: { attack: 60, dmgTaken: 40 } }
    ]
  },

  // 2. 巫毒娃娃：真伤转化减半
  voodooDoll: {
    name: '巫毒娃娃', loreName: '巫毒',
    thresholds: [
      { level: 1, desc: '攻击的 5% 转真伤', bonus: { trueDmgPercent: 5 } },
      { level: 3, desc: '攻击的 10% 转真伤', bonus: { trueDmgPercent: 10 } },
      { level: 5, desc: '攻击的 18% 转真伤', bonus: { trueDmgPercent: 18 } },
      { level: 7, desc: '攻击的 28% 转真伤', bonus: { trueDmgPercent: 28 } },
      { level: 10, desc: '攻击的 40% 转真伤', bonus: { trueDmgPercent: 40 } }
    ]
  },

  // 3. 钝器：暴伤加成砍半
  bluntWeapon: {
    name: '钝器', loreName: '钝器',
    thresholds: [
      { level: 1, desc: '暴伤+15%, 暴率-3%', bonus: { critDmg: 15, critRate: -3 } },
      { level: 3, desc: '暴伤+40%, 暴率-6%', bonus: { critDmg: 40, critRate: -6 } },
      { level: 5, desc: '暴伤+90%, 暴率-10%', bonus: { critDmg: 90, critRate: -10 } },
      { level: 7, desc: '暴伤+180%, 暴率-13%', bonus: { critDmg: 180, critRate: -13 } },
      { level: 10, desc: '暴伤+300%, 暴率-15%', bonus: { critDmg: 300, critRate: -15 } }
    ]
  },

  // ========== T1.5 辅助刻印（削弱） ==========

  // 4. 破甲：无视防御减半
  armorBreak: {
    name: '破甲', loreName: '破甲',
    thresholds: [
      { level: 1, desc: '无视防御 8%', bonus: { ignoreDef: 8 } },
      { level: 3, desc: '无视防御 15%', bonus: { ignoreDef: 15 } },
      { level: 5, desc: '无视防御 22%', bonus: { ignoreDef: 22 } },
      { level: 7, desc: '无视防御 32%，对护盾伤害+15%', bonus: { ignoreDef: 32, shieldDmg: 15 } },
      { level: 10, desc: '无视防御 45%，对护盾伤害+30%', bonus: { ignoreDef: 45, shieldDmg: 30 } }
    ]
  },

  // 5. 法力共鸣：减耗和回蓝削弱
  manaResonance: {
    name: '法力共鸣', loreName: '法力',
    thresholds: [
      { level: 1, desc: '技能MP消耗 -5%，伤害回1蓝', bonus: { mpCostReduction: 5, mpOnHit: 1 } },
      { level: 3, desc: '技能MP消耗 -10%，伤害回2蓝', bonus: { mpCostReduction: 10, mpOnHit: 2 } },
      { level: 5, desc: '技能MP消耗 -15%，伤害回3蓝', bonus: { mpCostReduction: 15, mpOnHit: 3 } },
      { level: 7, desc: '技能MP消耗 -20%，伤害回5蓝，击杀回10蓝', bonus: { mpCostReduction: 20, mpOnHit: 5, mpOnKill: 10 } },
      { level: 10, desc: '技能MP消耗 -25%，伤害回7蓝，击杀回15蓝', bonus: { mpCostReduction: 25, mpOnHit: 7, mpOnKill: 15 } }
    ]
  },

  // ========== T2 对策刻印（保持机制，削弱数值） ==========

  // 6. 肾上腺素：成长速度减半
  adrenaline: {
    name: '肾上腺素', loreName: '肾上腺素',
    thresholds: [
      { level: 1, desc: '每回合攻+2% (最多12%)', bonus: { stackingAtk: 2, maxStacks: 5 } },
      { level: 3, desc: '每回合攻+3% (最多24%)', bonus: { stackingAtk: 3, maxStacks: 6 } },
      { level: 5, desc: '每回合攻+5% (最多40%)', bonus: { stackingAtk: 5, maxStacks: 8 } },
      { level: 7, desc: '每回合攻+8% (最多65%)', bonus: { stackingAtk: 8, maxStacks: 10 } },
      { level: 10, desc: '每回合攻+10% (最多100%)', bonus: { stackingAtk: 10, maxStacks: 12 } }
    ]
  },

  // 7. Boss猎人：削弱约60%
  bossHunter: {
    name: 'Boss猎人', loreName: '猎王',
    thresholds: [
      { level: 1, desc: '对Boss增伤 5%', bonus: { bossDmg: 5 } },
      { level: 3, desc: '对Boss增伤 10%', bonus: { bossDmg: 10 } },
      { level: 5, desc: '对Boss增伤 18%', bonus: { bossDmg: 18 } },
      { level: 7, desc: '对Boss增伤 28%', bonus: { bossDmg: 28 } },
      { level: 10, desc: '对Boss增伤 40%', bonus: { bossDmg: 40 } }
    ]
  },

  // 8. 属性大师：数值减半
  elementMaster: {
    name: '属性大师', loreName: '元素',
    thresholds: [
      { level: 1, desc: '全元素+5%', bonus: { allElemDmg: 5 } },
      { level: 3, desc: '全元素+12%', bonus: { allElemDmg: 12 } },
      { level: 5, desc: '全元素+22%', bonus: { allElemDmg: 22 } },
      { level: 7, desc: '全元素+38%', bonus: { allElemDmg: 38 } },
      { level: 10, desc: '全元素+60%', bonus: { allElemDmg: 60 } }
    ]
  },

  // 9. 天运：暴击率加成减半
  fortune: {
    name: '天运', loreName: '天运',
    thresholds: [
      { level: 1, desc: '幸运+15, 暴率+4%', bonus: { luck: 15, critRate: 4 } },
      { level: 3, desc: '幸运+30, 暴率+8%', bonus: { luck: 30, critRate: 8 } },
      { level: 5, desc: '幸运+50, 暴率+13%', bonus: { luck: 50, critRate: 13 } },
      { level: 7, desc: '幸运+80, 暴率+20%', bonus: { luck: 80, critRate: 20 } },
      { level: 10, desc: '幸运+120, 暴率+28%，掉落双倍概率+5%', bonus: { luck: 120, critRate: 28, doubleDrop: 5 } }
    ]
  },

  // ========== T2.5 机制刻印（保持相对强度） ==========

  // 10. 奇袭大师：保持机制，略微削弱
  ambushMaster: {
    name: '奇袭大师', loreName: '奇袭',
    thresholds: [
      { level: 1, desc: '对半血以上敌人暴率+6%', bonus: { halfHpCrit: 6 } },
      { level: 3, desc: '对半血以上敌人暴率+12%', bonus: { halfHpCrit: 12 } },
      { level: 5, desc: '对半血以上敌人暴率+20%', bonus: { halfHpCrit: 20 } },
      { level: 7, desc: '对半血以上敌人暴率+32%，且暴伤+12%', bonus: { halfHpCrit: 32, halfHpCritDmg: 12 } },
      { level: 10, desc: '对半血以上敌人暴率+48%，且暴伤+25%', bonus: { halfHpCrit: 48, halfHpCritDmg: 25 } }
    ]
  },

  // 11. 顽强：免死概率下调
  tenacity: {
    name: '顽强', loreName: '顽强',
    thresholds: [
      { level: 1, desc: '受致命伤害时，8%概率锁血1点', bonus: { deathSave: 8 } },
      { level: 3, desc: '受致命伤害时，18%概率锁血1点', bonus: { deathSave: 18 } },
      { level: 5, desc: '受致命伤害时，35%概率锁血1点', bonus: { deathSave: 35 } },
      { level: 7, desc: '受致命伤害时，锁血1点，并立即获得20%HP护盾', bonus: { deathSave: 100, deathShield: 20 } },
      { level: 10, desc: '锁血时，护盾提升至40%HP，且冷却减半', bonus: { deathSave: 100, deathShield: 40 } }
    ]
  },

  // 12. 不死鸟：复活概率下调
  phoenix: {
    name: '不死鸟', loreName: '不死鸟',
    thresholds: [
      { level: 1, desc: '死亡时20%概率复活(25%HP)', bonus: { reviveChance: 20 } },
      { level: 3, desc: '死亡时35%概率复活(35%HP)', bonus: { reviveChance: 35 } },
      { level: 5, desc: '死亡时55%概率复活(50%HP)', bonus: { reviveChance: 55 } },
      { level: 7, desc: '死亡时100%复活(65%HP)，冷却12回合', bonus: { reviveChance: 100, reviveCD: 12 } },
      { level: 10, desc: '复活冷却减至7回合，且复活后伤害+20%', bonus: { reviveChance: 100, reviveCD: 7, reviveDmg: 20 } }
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
  green: 2.5,
  blue: 4,
  purple: 6.5,
  red: 10
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