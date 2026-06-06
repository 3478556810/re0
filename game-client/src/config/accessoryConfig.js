import { Icon } from '@iconify/vue'

// ========== 全新词条效果表（机制化设计）==========
export const AFFIX_EFFECTS = {
  // 怨恨：7级质变，10级毕业
  grudge: {
    name: '怨恨', loreName: '怨恨',
    thresholds: [
      { level: 1, desc: '攻+20%，受伤+15%', bonus: { attack: 20, dmgTaken: 15 } },
      { level: 3, desc: '攻+40%，受伤+25%', bonus: { attack: 40, dmgTaken: 25 } },
      { level: 5, desc: '攻+70%，受伤+35%', bonus: { attack: 70, dmgTaken: 35 } },
      { level: 7, desc: '攻+120%，受伤+45%', bonus: { attack: 120, dmgTaken: 45 } },
      { level: 10, desc: '攻+250%，受伤+60%', bonus: { attack: 250, dmgTaken: 60 } }
    ]
  },

  // 巫毒娃娃：7级质变，10级毕业
  voodooDoll: {
    name: '巫毒娃娃', loreName: '巫毒',
    thresholds: [
      { level: 1, desc: '伤害的 15% 转为真伤', bonus: { trueDmgPercent: 15 } },
      { level: 3, desc: '伤害的 30% 转为真伤', bonus: { trueDmgPercent: 30 } },
      { level: 5, desc: '伤害的 50% 转为真伤', bonus: { trueDmgPercent: 50 } },
      { level: 7, desc: '伤害的 70% 转为真伤', bonus: { trueDmgPercent: 70 } },
      { level: 10, desc: '伤害的 120% 转为真伤', bonus: { trueDmgPercent: 120 } }
    ]
  },

  // 钝器：7级质变，10级毕业
  bluntWeapon: {
    name: '钝器', loreName: '钝器',
    thresholds: [
      { level: 1, desc: '暴伤+50%, 暴率-2%', bonus: { critDmg: 50, critRate: -2 } },
      { level: 3, desc: '暴伤+120%, 暴率-4%', bonus: { critDmg: 120, critRate: -4 } },
      { level: 5, desc: '暴伤+240%, 暴率-6%', bonus: { critDmg: 240, critRate: -6 } },
      { level: 7, desc: '暴伤+440%, 暴率-8%', bonus: { critDmg: 440, critRate: -8 } },
      { level: 10, desc: '暴伤+700%, 暴率-10%', bonus: { critDmg: 700, critRate: -10 } }
    ]
  },

  // 破甲：7级质变，10级毕业
  armorBreak: {
    name: '破甲', loreName: '破甲',
    thresholds: [
      { level: 1, desc: '无视防御 24%，对护盾伤害+40%', bonus: { ignoreDef: 24, shieldDmg: 40 } },
      { level: 3, desc: '无视防御 44%，对护盾伤害+60%', bonus: { ignoreDef: 44, shieldDmg: 60 } },
      { level: 5, desc: '无视防御 70%，对护盾伤害+90%', bonus: { ignoreDef: 70, shieldDmg: 90 } },
      { level: 7, desc: '无视防御 100%，对护盾伤害+130%', bonus: { ignoreDef: 100, shieldDmg: 130 } },
      { level: 10, desc: '无视防御 140%，对护盾伤害+180%', bonus: { ignoreDef: 140, shieldDmg: 180 } }
    ]
  },

  // 法力共鸣：7级质变，10级毕业
  manaResonance: {
    name: '法力共鸣', loreName: '法力',
    thresholds: [
      { level: 1, desc: 'MP消耗-10%，伤害回蓝6', bonus: { mpCostReduction: 10, mpOnHit: 6 } },
      { level: 3, desc: 'MP消耗-20%，伤害回蓝10', bonus: { mpCostReduction: 20, mpOnHit: 10 } },
      { level: 5, desc: 'MP消耗-30%，伤害回蓝16，击杀回蓝20', bonus: { mpCostReduction: 30, mpOnHit: 16, mpOnKill: 20 } },
      { level: 7, desc: 'MP消耗-40%，伤害回蓝24，击杀回蓝30', bonus: { mpCostReduction: 40, mpOnHit: 24, mpOnKill: 30 } },
      { level: 10, desc: 'MP消耗-50%，伤害回蓝40，击杀回蓝50', bonus: { mpCostReduction: 50, mpOnHit: 40, mpOnKill: 50 } }
    ]
  },

  // 肾上腺素：7级质变，10级毕业
  adrenaline: {
    name: '肾上腺素', loreName: '肾上腺素',
    thresholds: [
      { level: 1, desc: '每回合攻+6%（基于最终攻击），最多4层', bonus: { stackingAtk: 6, maxStacks: 4 } },
      { level: 3, desc: '每回合攻+8%，最多5层', bonus: { stackingAtk: 8, maxStacks: 5 } },
      { level: 5, desc: '每回合攻+12%，最多6层', bonus: { stackingAtk: 12, maxStacks: 6 } },
      { level: 7, desc: '每回合攻+16%，最多7层', bonus: { stackingAtk: 16, maxStacks: 7 } },
      { level: 10, desc: '每回合攻+24%，最多8层', bonus: { stackingAtk: 24, maxStacks: 8 } }
    ]
  },

  // Boss猎人：7级质变，10级毕业
  bossHunter: {
    name: 'Boss猎人', loreName: '猎王',
    thresholds: [
      { level: 1, desc: '对Boss增伤 20%', bonus: { bossDmg: 20 } },
      { level: 3, desc: '对Boss增伤 40%', bonus: { bossDmg: 40 } },
      { level: 5, desc: '对Boss增伤 70%', bonus: { bossDmg: 70 } },
      { level: 7, desc: '对Boss增伤 110%', bonus: { bossDmg: 110 } },
      { level: 10, desc: '对Boss增伤 160%', bonus: { bossDmg: 160 } }
    ]
  },

  // 属性大师：7级质变，10级毕业
  elementMaster: {
    name: '属性大师', loreName: '元素',
    thresholds: [
      { level: 1, desc: '全元素+16%', bonus: { allElemDmg: 16 } },
      { level: 3, desc: '全元素+36%', bonus: { allElemDmg: 36 } },
      { level: 5, desc: '全元素+64%', bonus: { allElemDmg: 64 } },
      { level: 7, desc: '全元素+100%', bonus: { allElemDmg: 100 } },
      { level: 10, desc: '全元素+150%', bonus: { allElemDmg: 150 } }
    ]
  },

  // 天运：7级质变，10级毕业
  fortune: {
    name: '天运', loreName: '天运',
    thresholds: [
      { level: 1, desc: '暴率+12%，掉落双倍概率+6%', bonus: { critRate: 12, doubleDrop: 6 } },
      { level: 3, desc: '暴率+24%，掉落双倍概率+12%', bonus: { critRate: 24, doubleDrop: 12 } },
      { level: 5, desc: '暴率+40%，掉落双倍概率+20%', bonus: { critRate: 40, doubleDrop: 20 } },
      { level: 7, desc: '暴率+60%，掉落双倍概率+30%', bonus: { critRate: 60, doubleDrop: 30 } },
      { level: 10, desc: '暴率+90%，掉落双倍概率+50%', bonus: { critRate: 90, doubleDrop: 50 } }
    ]
  },

  // 奇袭大师：7级质变，10级毕业
  ambushMaster: {
    name: '奇袭大师', loreName: '奇袭',
    thresholds: [
      { level: 1, desc: '对半血以上敌人暴率+24%', bonus: { halfHpCrit: 24 } },
      { level: 3, desc: '对半血以上敌人暴率+44%', bonus: { halfHpCrit: 44 } },
      { level: 5, desc: '对半血以上敌人暴率+70%，暴伤+30%', bonus: { halfHpCrit: 70, halfHpCritDmg: 30 } },
      { level: 7, desc: '对半血以上敌人暴率+100%，暴伤+50%', bonus: { halfHpCrit: 100, halfHpCritDmg: 50 } },
      { level: 10, desc: '对半血以上敌人暴率+140%，暴伤+80%', bonus: { halfHpCrit: 140, halfHpCritDmg: 80 } }
    ]
  },

  // 顽强：7级质变，10级毕业
  tenacity: {
    name: '顽强', loreName: '顽强',
    thresholds: [
      { level: 1, desc: '受致命伤害时，15%概率锁血，获得10%HP护盾', bonus: { deathSave: 15, deathShield: 10 } },
      { level: 3, desc: '受致命伤害时，30%概率锁血，获得20%HP护盾', bonus: { deathSave: 30, deathShield: 20 } },
      { level: 5, desc: '受致命伤害时，50%概率锁血，获得30%HP护盾', bonus: { deathSave: 50, deathShield: 30 } },
      { level: 7, desc: '受致命伤害时，100%锁血，获得80%HP护盾（触发后3回合冷却）', bonus: { deathSave: 100, deathShield: 80 } },
      { level: 10, desc: '锁血时护盾提升至150%HP（触发后2回合冷却）', bonus: { deathSave: 100, deathShield: 150 } }
    ]
  },

  // 不死鸟：7级质变，10级毕业
  phoenix: {
    name: '不死鸟', loreName: '不死鸟',
    thresholds: [
      { level: 1, desc: '死亡时30%概率复活(35%HP)；火焰伤害+16%，吸血+10%', bonus: { reviveChance: 30, reviveDmg: 15, fireDmg: 16, lifestealPercent: 10 } },
      { level: 3, desc: '死亡时50%概率复活(50%HP)；火焰伤害+36%，吸血+20%', bonus: { reviveChance: 50, reviveDmg: 25, fireDmg: 36, lifestealPercent: 20 } },
      { level: 5, desc: '死亡时75%概率复活(65%HP)；火焰伤害+60%，吸血+36%', bonus: { reviveChance: 75, reviveDmg: 35, fireDmg: 60, lifestealPercent: 36 } },
      { level: 7, desc: '死亡时100%复活(80%HP)，冷却10回合；火焰伤害+90%，吸血+50%', bonus: { reviveChance: 100, reviveCD: 10, reviveDmg: 45, fireDmg: 90, lifestealPercent: 50 } },
      { level: 10, desc: '复活冷却减至5回合；火焰伤害+110%，吸血+64%', bonus: { reviveChance: 100, reviveCD: 5, reviveDmg: 50, fireDmg: 110, lifestealPercent: 64 } }
    ]
  },

  // 疾风：7级质变，10级毕业
  swiftWind: {
    name: '疾风', loreName: '疾风',
    thresholds: [
      { level: 1, desc: '速度+16，闪避率+6%', bonus: { speed: 16, dodge: 6 } },
      { level: 3, desc: '速度+36，闪避率+12%', bonus: { speed: 36, dodge: 12 } },
      { level: 5, desc: '速度+60，闪避率+20%', bonus: { speed: 60, dodge: 20 } },
      { level: 7, desc: '速度+100，闪避率+30%，闪避后下次攻击必暴击', bonus: { speed: 100, dodge: 30, dodgeCounter: true } },
      { level: 10, desc: '速度+200，闪避率+50%，闪避后下次攻击必暴击且伤害+100%', bonus: { speed: 200, dodge: 50, dodgeCounter: true, dodgeCritDmg: 100 } }
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