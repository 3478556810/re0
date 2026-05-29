/**
 * 饰品词条系统配置
 * 词条效果表、品质规则、掉落表
 */
import { Icon } from '@iconify/vue'

// ========== 词条效果表 ==========
export const AFFIX_EFFECTS = {
  fireAttack: {
    name: '火属性强化',
    loreName: '地狱焰',
    icon: 'mdi:fire',
    thresholds: [
      { level: 1, desc: '火伤+5%', bonus: { fireDmg: 5 } },
      { level: 3, desc: '火伤+10%', bonus: { fireDmg: 10 } },
      { level: 5, desc: '火伤+20%', bonus: { fireDmg: 20 } },
      { level: 7, desc: '火伤+40%, 灼烧', bonus: { fireDmg: 40 } }
    ]
  },
  waterAttack: {
    name: '水属性强化',
    loreName: '深渊寒',
    icon: 'mdi:water',
    thresholds: [
      { level: 1, desc: '水伤+5%', bonus: { waterDmg: 5 } },
      { level: 3, desc: '水伤+10%', bonus: { waterDmg: 10 } },
      { level: 5, desc: '水伤+20%', bonus: { waterDmg: 20 } },
      { level: 7, desc: '水伤+40%, 冰冻', bonus: { waterDmg: 40 } }
    ]
  },
  thunderAttack: {
    name: '雷属性强化',
    loreName: '雷神怒',
    icon: 'mdi:lightning-bolt',
    thresholds: [
      { level: 1, desc: '雷伤+5%', bonus: { thunderDmg: 5 } },
      { level: 3, desc: '雷伤+10%', bonus: { thunderDmg: 10 } },
      { level: 5, desc: '雷伤+20%', bonus: { thunderDmg: 20 } },
      { level: 7, desc: '雷伤+40%, 麻痹', bonus: { thunderDmg: 40 } }
    ]
  },
  windAttack: {
    name: '风属性强化',
    loreName: '风暴眼',
    icon: 'mdi:weather-windy',
    thresholds: [
      { level: 1, desc: '风伤+5%', bonus: { windDmg: 5 } },
      { level: 3, desc: '风伤+10%', bonus: { windDmg: 10 } },
      { level: 5, desc: '风伤+20%', bonus: { windDmg: 20 } },
      { level: 7, desc: '风伤+40%, 加速', bonus: { windDmg: 40 } }
    ]
  },
  iceAttack: {
    name: '冰属性强化',
    loreName: '永冻霜',
    icon: 'mdi:snowflake',
    thresholds: [
      { level: 1, desc: '冰伤+5%', bonus: { iceDmg: 5 } },
      { level: 3, desc: '冰伤+10%', bonus: { iceDmg: 10 } },
      { level: 5, desc: '冰伤+20%', bonus: { iceDmg: 20 } },
      { level: 7, desc: '冰伤+40%, 冻结', bonus: { iceDmg: 40 } }
    ]
  },
  holyAttack: {
    name: '圣属性强化',
    loreName: '圣光裁',
    icon: 'mdi:brightness-7',
    thresholds: [
      { level: 1, desc: '圣伤+5%', bonus: { holyDmg: 5 } },
      { level: 3, desc: '圣伤+10%', bonus: { holyDmg: 10 } },
      { level: 5, desc: '圣伤+20%', bonus: { holyDmg: 20 } },
      { level: 7, desc: '圣伤+40%, 净化', bonus: { holyDmg: 40 } }
    ]
  },
  darkAttack: {
    name: '暗属性强化',
    loreName: '暗影灭',
    icon: 'mdi:moon-waning-crescent',
    thresholds: [
      { level: 1, desc: '暗伤+5%', bonus: { darkDmg: 5 } },
      { level: 3, desc: '暗伤+10%', bonus: { darkDmg: 10 } },
      { level: 5, desc: '暗伤+20%', bonus: { darkDmg: 20 } },
      { level: 7, desc: '暗伤+40%, 诅咒', bonus: { darkDmg: 40 } }
    ]
  },
  steelAttack: {
    name: '钢属性强化',
    loreName: '钢铁魂',
    icon: 'mdi:cube-outline',
    thresholds: [
      { level: 1, desc: '钢伤+5%', bonus: { steelDmg: 5 } },
      { level: 3, desc: '钢伤+10%', bonus: { steelDmg: 10 } },
      { level: 5, desc: '钢伤+20%', bonus: { steelDmg: 20 } },
      { level: 7, desc: '钢伤+40%, 破甲', bonus: { steelDmg: 40 } }
    ]
  },
  rockAttack: {
    name: '岩属性强化',
    loreName: '大地怒',
    icon: 'mdi:terrain',
    thresholds: [
      { level: 1, desc: '岩伤+5%', bonus: { rockDmg: 5 } },
      { level: 3, desc: '岩伤+10%', bonus: { rockDmg: 10 } },
      { level: 5, desc: '岩伤+20%', bonus: { rockDmg: 20 } },
      { level: 7, desc: '岩伤+40%, 眩晕', bonus: { rockDmg: 40 } }
    ]
  },
  critBoost: {
    name: '暴击强化',
    loreName: '致命',
    icon: 'mdi:alert-circle',
    thresholds: [
      { level: 1, desc: '暴击率+3%', bonus: { critRate: 3 } },
      { level: 3, desc: '暴击率+6%', bonus: { critRate: 6 } },
      { level: 5, desc: '暴击率+12%', bonus: { critRate: 12 } },
      { level: 7, desc: '暴击率+20%', bonus: { critRate: 20 } }
    ]
  },
  critDmgBoost: {
    name: '暴伤强化',
    loreName: '毁灭',
    icon: 'mdi:flash-circle',
    thresholds: [
      { level: 1, desc: '暴击伤害+10%', bonus: { critDmg: 10 } },
      { level: 3, desc: '暴击伤害+20%', bonus: { critDmg: 20 } },
      { level: 5, desc: '暴击伤害+40%', bonus: { critDmg: 40 } },
      { level: 7, desc: '暴击伤害+60%', bonus: { critDmg: 60 } }
    ]
  },
  lifestealBoost: {
    name: '吸血强化',
    loreName: '嗜血',
    icon: 'mdi:blood-bag',
    thresholds: [
      { level: 1, desc: '吸血+2%', bonus: { lifesteal: 2 } },
      { level: 3, desc: '吸血+4%', bonus: { lifesteal: 4 } },
      { level: 5, desc: '吸血+8%', bonus: { lifesteal: 8 } },
      { level: 7, desc: '吸血+15%', bonus: { lifesteal: 15 } }
    ]
  },
  trueDmgBoost: {
    name: '真实伤害',
    loreName: '穿透',
    icon: 'mdi:sword',
    thresholds: [
      { level: 1, desc: '真实伤害+3', bonus: { trueDmg: 3 } },
      { level: 3, desc: '真实伤害+6', bonus: { trueDmg: 6 } },
      { level: 5, desc: '真实伤害+12', bonus: { trueDmg: 12 } },
      { level: 7, desc: '真实伤害+20', bonus: { trueDmg: 20 } }
    ]
  },
  hpBoost: {
    name: '生命强化',
    loreName: '不朽',
    icon: 'mdi:heart',
    thresholds: [
      { level: 1, desc: '最大HP+10', bonus: { maxHp: 10 } },
      { level: 3, desc: '最大HP+25', bonus: { maxHp: 25 } },
      { level: 5, desc: '最大HP+50', bonus: { maxHp: 50 } },
      { level: 7, desc: '最大HP+100', bonus: { maxHp: 100 } }
    ]
  },
  defenseBoost: {
    name: '防御强化',
    loreName: '坚壁',
    icon: 'mdi:shield',
    thresholds: [
      { level: 1, desc: '防御+5', bonus: { defense: 5 } },
      { level: 3, desc: '防御+10', bonus: { defense: 10 } },
      { level: 5, desc: '防御+20', bonus: { defense: 20 } },
      { level: 7, desc: '防御+35', bonus: { defense: 35 } }
    ]
  },
  speedBoost: {
    name: '速度强化',
    loreName: '疾风',
    icon: 'mdi:speedometer',
    thresholds: [
      { level: 1, desc: '速度+3', bonus: { speed: 3 } },
      { level: 3, desc: '速度+6', bonus: { speed: 6 } },
      { level: 5, desc: '速度+10', bonus: { speed: 10 } },
      { level: 7, desc: '速度+15', bonus: { speed: 15 } }
    ]
  },
  luckBoost: {
    name: '幸运强化',
    loreName: '天命',
    icon: 'mdi:dice-multiple',
    thresholds: [
      { level: 1, desc: '幸运+3', bonus: { luck: 3 } },
      { level: 3, desc: '幸运+6', bonus: { luck: 6 } },
      { level: 5, desc: '幸运+10', bonus: { luck: 10 } },
      { level: 7, desc: '幸运+15', bonus: { luck: 15 } }
    ]
  }
}
export const AFFIX_IDS = Object.keys(AFFIX_EFFECTS)

// ========== 品质规则 ==========
export const QUALITY_RULES = {
  white:  { affixCount: [0, 1], maxLevel: 1, label: '普通', color: '#ffffff' },
  green:  { affixCount: [1, 1], maxLevel: 2, label: '优秀', color: '#4caf50' },
  blue:   { affixCount: [1, 2], maxLevel: 3, label: '精良', color: '#2196f3' },
  purple: { affixCount: [2, 2], maxLevel: 4, label: '史诗', color: '#9c27b0' },
  red:    { affixCount: [2, 3], maxLevel: 5, label: '传说', color: '#ff4444' }
}

export const QUALITY_ORDER = ['white', 'green', 'blue', 'purple', 'red']

// ========== 品质概率分布（根据怪物强度）==========
export const QUALITY_WEIGHTS = {
  weak:   { white: 50, green: 30, blue: 15, purple: 4, red: 1 },
  normal: { white: 30, green: 35, blue: 25, purple: 8, red: 2 },
  strong: { white: 15, green: 30, blue: 35, purple: 15, red: 5 },
  boss:   { white: 5,  green: 20, blue: 35, purple: 30, red: 10 }
}


// 根据怪物标签获取掉落配置（不再使用硬编码怪物名）
export function getLootConfig(tag) {
  const tags = ['weak', 'normal', 'strong', 'boss']
  const tier = tags.includes(tag) ? tag : 'normal'
  // 所有怪物都掉落全套饰品
  const accessories = ['earring1', 'earring2', 'necklace', 'ring1', 'ring2']
  return {
    dropChance: 0.3,       // 基础掉率，可在生成时再乘倍率
    qualityTier: tier,
    accessories
  }
}

// 兼容旧函数名（若无其他引用可删除）
export function getLootTable(enemyName) {
  // 不再使用名字，仅保留占位
  return getLootConfig('normal')
}

// 根据品质权重随机选择品质
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

// 根据品质获取名称前缀
export function getQualityLabel(quality) {
  return QUALITY_RULES[quality]?.label || '普通'
}

// 获取品质颜色
export function getQualityColor(quality) {
  return QUALITY_RULES[quality]?.color || '#ffffff'
}
