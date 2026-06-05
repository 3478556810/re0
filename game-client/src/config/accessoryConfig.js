import { Icon } from '@iconify/vue'

// ========== 全新词条效果表（机制化设计）==========
export const AFFIX_EFFECTS = {
  // ========== T0 输出核心 ==========
  
  // 1. 怨恨：风险换高攻击
  grudge: {
    name: '怨恨', loreName: '怨恨',
    thresholds: [
      { level: 1, desc: '攻+10%，受伤+8%', bonus: { attack: 10, dmgTaken: 8 } },
      { level: 3, desc: '攻+20%，受伤+15%', bonus: { attack: 20, dmgTaken: 15 } },
      { level: 5, desc: '攻+35%，受伤+22%', bonus: { attack: 35, dmgTaken: 22 } },
      { level: 7, desc: '攻+55%，受伤+28%', bonus: { attack: 55, dmgTaken: 28 } },
      { level: 10, desc: '攻+80%，受伤+35%', bonus: { attack: 80, dmgTaken: 35 } }
    ]
  },

  // 2. 巫毒娃娃：真伤转化（基于最终伤害的百分比，收益极高）
  voodooDoll: {
    name: '巫毒娃娃', loreName: '巫毒',
    thresholds: [
      { level: 1, desc: '伤害的 8% 转为真伤', bonus: { trueDmgPercent: 8 } },
      { level: 3, desc: '伤害的 15% 转为真伤', bonus: { trueDmgPercent: 15 } },
      { level: 5, desc: '伤害的 25% 转为真伤', bonus: { trueDmgPercent: 25 } },
      { level: 7, desc: '伤害的 35% 转为真伤', bonus: { trueDmgPercent: 35 } },
      { level: 10, desc: '伤害的 50% 转为真伤', bonus: { trueDmgPercent: 50 } }
    ]
  },

  // 3. 钝器：暴伤特化，暴率惩罚降低
  bluntWeapon: {
    name: '钝器', loreName: '钝器',
    thresholds: [
      { level: 1, desc: '暴伤+25%, 暴率-2%', bonus: { critDmg: 25, critRate: -2 } },
      { level: 3, desc: '暴伤+60%, 暴率-4%', bonus: { critDmg: 60, critRate: -4 } },
      { level: 5, desc: '暴伤+120%, 暴率-6%', bonus: { critDmg: 120, critRate: -6 } },
      { level: 7, desc: '暴伤+220%, 暴率-8%', bonus: { critDmg: 220, critRate: -8 } },
      { level: 10, desc: '暴伤+350%, 暴率-10%', bonus: { critDmg: 350, critRate: -10 } }
    ]
  },

  // ========== T1 稳定输出/辅助 ==========

  // 4. 破甲：无视防御，对护盾特攻
  armorBreak: {
    name: '破甲', loreName: '破甲',
    thresholds: [
      { level: 1, desc: '无视防御 12%，对护盾伤害+20%', bonus: { ignoreDef: 12, shieldDmg: 20 } },
      { level: 3, desc: '无视防御 22%，对护盾伤害+30%', bonus: { ignoreDef: 22, shieldDmg: 30 } },
      { level: 5, desc: '无视防御 35%，对护盾伤害+45%', bonus: { ignoreDef: 35, shieldDmg: 45 } },
      { level: 7, desc: '无视防御 50%，对护盾伤害+65%', bonus: { ignoreDef: 50, shieldDmg: 65 } },
      { level: 10, desc: '无视防御 70%，对护盾伤害+90%', bonus: { ignoreDef: 70, shieldDmg: 90 } }
    ]
  },

  // 5. 法力共鸣：大幅提高续航
  manaResonance: {
    name: '法力共鸣', loreName: '法力',
    thresholds: [
      { level: 1, desc: 'MP消耗-5%，伤害回蓝3', bonus: { mpCostReduction: 5, mpOnHit: 3 } },
      { level: 3, desc: 'MP消耗-10%，伤害回蓝5', bonus: { mpCostReduction: 10, mpOnHit: 5 } },
      { level: 5, desc: 'MP消耗-15%，伤害回蓝8，击杀回蓝10', bonus: { mpCostReduction: 15, mpOnHit: 8, mpOnKill: 10 } },
      { level: 7, desc: 'MP消耗-20%，伤害回蓝12，击杀回蓝15', bonus: { mpCostReduction: 20, mpOnHit: 12, mpOnKill: 15 } },
      { level: 10, desc: 'MP消耗-25%，伤害回蓝20，击杀回蓝25', bonus: { mpCostReduction: 25, mpOnHit: 20, mpOnKill: 25 } }
    ]
  },

  // 6. 肾上腺素：基于最终攻击力百分比成长
  adrenaline: {
    name: '肾上腺素', loreName: '肾上腺素',
    thresholds: [
      { level: 1, desc: '每回合攻+3%（基于最终攻击），最多4层', bonus: { stackingAtk: 3, maxStacks: 4 } },
      { level: 3, desc: '每回合攻+4%，最多5层', bonus: { stackingAtk: 4, maxStacks: 5 } },
      { level: 5, desc: '每回合攻+6%，最多6层', bonus: { stackingAtk: 6, maxStacks: 6 } },
      { level: 7, desc: '每回合攻+8%，最多7层', bonus: { stackingAtk: 8, maxStacks: 7 } },
      { level: 10, desc: '每回合攻+12%，最多8层', bonus: { stackingAtk: 12, maxStacks: 8 } }
    ]
  },

  // 7. Boss猎人：大幅提高对Boss伤害
  bossHunter: {
    name: 'Boss猎人', loreName: '猎王',
    thresholds: [
      { level: 1, desc: '对Boss增伤 10%', bonus: { bossDmg: 10 } },
      { level: 3, desc: '对Boss增伤 20%', bonus: { bossDmg: 20 } },
      { level: 5, desc: '对Boss增伤 35%', bonus: { bossDmg: 35 } },
      { level: 7, desc: '对Boss增伤 55%', bonus: { bossDmg: 55 } },
      { level: 10, desc: '对Boss增伤 80%', bonus: { bossDmg: 80 } }
    ]
  },

  // 8. 属性大师：全元素加成提升
  elementMaster: {
    name: '属性大师', loreName: '元素',
    thresholds: [
      { level: 1, desc: '全元素+8%', bonus: { allElemDmg: 8 } },
      { level: 3, desc: '全元素+18%', bonus: { allElemDmg: 18 } },
      { level: 5, desc: '全元素+32%', bonus: { allElemDmg: 32 } },
      { level: 7, desc: '全元素+50%', bonus: { allElemDmg: 50 } },
      { level: 10, desc: '全元素+75%', bonus: { allElemDmg: 75 } }
    ]
  },

  // 9. 天运：暴击率与掉落双倍概率
  fortune: {
    name: '天运', loreName: '天运',
    thresholds: [
      { level: 1, desc: '暴率+6%，掉落双倍概率+3%', bonus: { critRate: 6, doubleDrop: 3 } },
      { level: 3, desc: '暴率+12%，掉落双倍概率+6%', bonus: { critRate: 12, doubleDrop: 6 } },
      { level: 5, desc: '暴率+20%，掉落双倍概率+10%', bonus: { critRate: 20, doubleDrop: 10 } },
      { level: 7, desc: '暴率+30%，掉落双倍概率+15%', bonus: { critRate: 30, doubleDrop: 15 } },
      { level: 10, desc: '暴率+45%，掉落双倍概率+25%', bonus: { critRate: 45, doubleDrop: 25 } }
    ]
  },

  // ========== T2 机制/生存刻印（全面强化） ==========

  // 10. 奇袭大师：半血以上敌人特攻
  ambushMaster: {
    name: '奇袭大师', loreName: '奇袭',
    thresholds: [
      { level: 1, desc: '对半血以上敌人暴率+12%', bonus: { halfHpCrit: 12 } },
      { level: 3, desc: '对半血以上敌人暴率+22%', bonus: { halfHpCrit: 22 } },
      { level: 5, desc: '对半血以上敌人暴率+35%，暴伤+15%', bonus: { halfHpCrit: 35, halfHpCritDmg: 15 } },
      { level: 7, desc: '对半血以上敌人暴率+50%，暴伤+25%', bonus: { halfHpCrit: 50, halfHpCritDmg: 25 } },
      { level: 10, desc: '对半血以上敌人暴率+70%，暴伤+40%', bonus: { halfHpCrit: 70, halfHpCritDmg: 40 } }
    ]
  },

  // 11. 顽强：锁血带护盾，冷却减半
tenacity: {
  name: '顽强', loreName: '顽强',
  thresholds: [
    { level: 1, desc: '受致命伤害时，15%概率锁血，获得10%HP护盾', bonus: { deathSave: 15, deathShield: 10 } },
    { level: 3, desc: '受致命伤害时，30%概率锁血，获得20%HP护盾', bonus: { deathSave: 30, deathShield: 20 } },
    { level: 5, desc: '受致命伤害时，50%概率锁血，获得30%HP护盾', bonus: { deathSave: 50, deathShield: 30 } },
    { level: 7, desc: '受致命伤害时，100%锁血，获得40%HP护盾（触发后1回合冷却）', bonus: { deathSave: 100, deathShield: 40 } },
    { level: 10, desc: '锁血时护盾提升至60%HP（触发后1回合冷却）', bonus: { deathSave: 100, deathShield: 60 } }
  ]
},

  // 12. 不死鸟：强力复活，附带爆发
 phoenix: {
  name: '不死鸟', loreName: '不死鸟',
  thresholds: [
    { level: 1, desc: '死亡时30%概率复活(35%HP)；火焰伤害+8%，吸血+5%', bonus: { reviveChance: 30, reviveDmg: 15, fireDmg: 8, lifestealPercent: 5 } },
    { level: 3, desc: '死亡时50%概率复活(50%HP)；火焰伤害+18%，吸血+10%', bonus: { reviveChance: 50, reviveDmg: 25, fireDmg: 18, lifestealPercent: 10 } },
    { level: 5, desc: '死亡时75%概率复活(65%HP)；火焰伤害+30%，吸血+18%', bonus: { reviveChance: 75, reviveDmg: 35, fireDmg: 30, lifestealPercent: 18 } },
    { level: 7, desc: '死亡时100%复活(80%HP)，冷却10回合；火焰伤害+45%，吸血+25%', bonus: { reviveChance: 100, reviveCD: 10, reviveDmg: 45, fireDmg: 45, lifestealPercent: 25 } },
    { level: 10, desc: '复活冷却减至5回合；火焰伤害+55%，吸血+32%', bonus: { reviveChance: 100, reviveCD: 5, reviveDmg: 50, fireDmg: 55, lifestealPercent: 32 } }
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