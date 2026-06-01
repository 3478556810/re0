/**
 * 饰品词条系统配置
 * 词条效果表、品质规则、掉落表
 */
import { Icon } from '@iconify/vue'

// ========== 词条效果表 ==========
export const AFFIX_EFFECTS = {
  // ========== 10 种属性强化 ==========
  fireAttack: {
    name: '火属性强化', loreName: '地狱焰', icon: 'mdi:fire',
    thresholds: [
      { level: 1, desc: '火伤+3%', bonus: { fireDmg: 3 } },
      { level: 3, desc: '火伤+8%', bonus: { fireDmg: 8 } },
      { level: 5, desc: '火伤+15%', bonus: { fireDmg: 15 } },
      { level: 7, desc: '火伤+25%', bonus: { fireDmg: 25 } },
      { level: 10, desc: '火伤+40%, 灼烧', bonus: { fireDmg: 40 } }
    ]
  },
  waterAttack: {
    name: '水属性强化', loreName: '深渊寒', icon: 'mdi:water',
    thresholds: [
      { level: 1, desc: '水伤+3%', bonus: { waterDmg: 3 } },
      { level: 3, desc: '水伤+8%', bonus: { waterDmg: 8 } },
      { level: 5, desc: '水伤+15%', bonus: { waterDmg: 15 } },
      { level: 7, desc: '水伤+25%', bonus: { waterDmg: 25 } },
      { level: 10, desc: '水伤+40%, 冰冻', bonus: { waterDmg: 40 } }
    ]
  },
  thunderAttack: {
    name: '雷属性强化', loreName: '雷神怒', icon: 'mdi:lightning-bolt',
    thresholds: [
      { level: 1, desc: '雷伤+3%', bonus: { thunderDmg: 3 } },
      { level: 3, desc: '雷伤+8%', bonus: { thunderDmg: 8 } },
      { level: 5, desc: '雷伤+15%', bonus: { thunderDmg: 15 } },
      { level: 7, desc: '雷伤+25%', bonus: { thunderDmg: 25 } },
      { level: 10, desc: '雷伤+40%, 麻痹', bonus: { thunderDmg: 40 } }
    ]
  },
  windAttack: {
    name: '风属性强化', loreName: '风暴眼', icon: 'mdi:weather-windy',
    thresholds: [
      { level: 1, desc: '风伤+3%', bonus: { windDmg: 3 } },
      { level: 3, desc: '风伤+8%', bonus: { windDmg: 8 } },
      { level: 5, desc: '风伤+15%', bonus: { windDmg: 15 } },
      { level: 7, desc: '风伤+25%', bonus: { windDmg: 25 } },
      { level: 10, desc: '风伤+40%, 加速', bonus: { windDmg: 40 } }
    ]
  },
  iceAttack: {
    name: '冰属性强化', loreName: '永冻霜', icon: 'mdi:snowflake',
    thresholds: [
      { level: 1, desc: '冰伤+3%', bonus: { iceDmg: 3 } },
      { level: 3, desc: '冰伤+8%', bonus: { iceDmg: 8 } },
      { level: 5, desc: '冰伤+15%', bonus: { iceDmg: 15 } },
      { level: 7, desc: '冰伤+25%', bonus: { iceDmg: 25 } },
      { level: 10, desc: '冰伤+40%, 冻结', bonus: { iceDmg: 40 } }
    ]
  },
  holyAttack: {
    name: '圣属性强化', loreName: '圣光裁', icon: 'mdi:brightness-7',
    thresholds: [
      { level: 1, desc: '圣伤+3%', bonus: { holyDmg: 3 } },
      { level: 3, desc: '圣伤+8%', bonus: { holyDmg: 8 } },
      { level: 5, desc: '圣伤+15%', bonus: { holyDmg: 15 } },
      { level: 7, desc: '圣伤+25%', bonus: { holyDmg: 25 } },
      { level: 10, desc: '圣伤+40%, 净化', bonus: { holyDmg: 40 } }
    ]
  },
  darkAttack: {
    name: '暗属性强化', loreName: '暗影灭', icon: 'mdi:moon-waning-crescent',
    thresholds: [
      { level: 1, desc: '暗伤+3%', bonus: { darkDmg: 3 } },
      { level: 3, desc: '暗伤+8%', bonus: { darkDmg: 8 } },
      { level: 5, desc: '暗伤+15%', bonus: { darkDmg: 15 } },
      { level: 7, desc: '暗伤+25%', bonus: { darkDmg: 25 } },
      { level: 10, desc: '暗伤+40%, 诅咒', bonus: { darkDmg: 40 } }
    ]
  },
  steelAttack: {
    name: '钢属性强化', loreName: '钢铁魂', icon: 'mdi:cube-outline',
    thresholds: [
      { level: 1, desc: '钢伤+3%', bonus: { steelDmg: 3 } },
      { level: 3, desc: '钢伤+8%', bonus: { steelDmg: 8 } },
      { level: 5, desc: '钢伤+15%', bonus: { steelDmg: 15 } },
      { level: 7, desc: '钢伤+25%', bonus: { steelDmg: 25 } },
      { level: 10, desc: '钢伤+40%, 破甲', bonus: { steelDmg: 40 } }
    ]
  },
  rockAttack: {
    name: '岩属性强化', loreName: '大地怒', icon: 'mdi:terrain',
    thresholds: [
      { level: 1, desc: '岩伤+3%', bonus: { rockDmg: 3 } },
      { level: 3, desc: '岩伤+8%', bonus: { rockDmg: 8 } },
      { level: 5, desc: '岩伤+15%', bonus: { rockDmg: 15 } },
      { level: 7, desc: '岩伤+25%', bonus: { rockDmg: 25 } },
      { level: 10, desc: '岩伤+40%, 眩晕', bonus: { rockDmg: 40 } }
    ]
  },
  grassAttack: {
    name: '草属性强化', loreName: '自然怒', icon: 'mdi:leaf',
    thresholds: [
      { level: 1, desc: '草伤+3%', bonus: { grassDmg: 3 } },
      { level: 3, desc: '草伤+8%', bonus: { grassDmg: 8 } },
      { level: 5, desc: '草伤+15%', bonus: { grassDmg: 15 } },
      { level: 7, desc: '草伤+25%', bonus: { grassDmg: 25 } },
      { level: 10, desc: '草伤+40%, 再生', bonus: { grassDmg: 40 } }
    ]
  },

  // ========== 通用词条（满级数值下调，配合低 maxLevel）==========
  critBoost: {
    name: '暴击强化', loreName: '致命', icon: 'mdi:alert-circle',
    thresholds: [
      { level: 1, desc: '暴击率+2%', bonus: { critRate: 2 } },
      { level: 3, desc: '暴击率+5%', bonus: { critRate: 5 } },
      { level: 5, desc: '暴击率+10%', bonus: { critRate: 10 } },
      { level: 7, desc: '暴击率+18%', bonus: { critRate: 18 } },
      { level: 10, desc: '暴击率+30%', bonus: { critRate: 30 } }
    ]
  },
  critDmgBoost: {
    name: '暴伤强化', loreName: '毁灭', icon: 'mdi:flash-circle',
    thresholds: [
      { level: 1, desc: '暴伤+5%', bonus: { critDmg: 5 } },
      { level: 3, desc: '暴伤+12%', bonus: { critDmg: 12 } },
      { level: 5, desc: '暴伤+25%', bonus: { critDmg: 25 } },
      { level: 7, desc: '暴伤+45%', bonus: { critDmg: 45 } },
      { level: 10, desc: '暴伤+80%', bonus: { critDmg: 80 } }
    ]
  },
  lifestealBoost: {
    name: '吸血强化', loreName: '嗜血', icon: 'mdi:blood-bag',
    thresholds: [
      { level: 1, desc: '吸血+2%', bonus: { lifesteal: 2 } },
      { level: 3, desc: '吸血+5%', bonus: { lifesteal: 5 } },
      { level: 5, desc: '吸血+10%', bonus: { lifesteal: 10 } },
      { level: 7, desc: '吸血+18%', bonus: { lifesteal: 18 } },
      { level: 10, desc: '吸血+30%', bonus: { lifesteal: 30 } }
    ]
  },
  trueDmgBoost: {
    name: '真实伤害', loreName: '穿透', icon: 'mdi:sword',
    thresholds: [
      { level: 1, desc: '真伤+3', bonus: { trueDmg: 3 } },
      { level: 3, desc: '真伤+8', bonus: { trueDmg: 8 } },
      { level: 5, desc: '真伤+18', bonus: { trueDmg: 18 } },
      { level: 7, desc: '真伤+35', bonus: { trueDmg: 35 } },
      { level: 10, desc: '真伤+60', bonus: { trueDmg: 60 } }
    ]
  },
  hpBoost: {
    name: '生命强化', loreName: '不朽', icon: 'mdi:heart',
    thresholds: [
      { level: 1, desc: 'HP+20', bonus: { maxHp: 20 } },
      { level: 3, desc: 'HP+50', bonus: { maxHp: 50 } },
      { level: 5, desc: 'HP+100', bonus: { maxHp: 100 } },
      { level: 7, desc: 'HP+200', bonus: { maxHp: 200 } },
      { level: 10, desc: 'HP+400', bonus: { maxHp: 400 } }
    ]
  },
  defenseBoost: {
    name: '防御强化', loreName: '坚壁', icon: 'mdi:shield',
    thresholds: [
      { level: 1, desc: '防御+5', bonus: { defense: 5 } },
      { level: 3, desc: '防御+12', bonus: { defense: 12 } },
      { level: 5, desc: '防御+25', bonus: { defense: 25 } },
      { level: 7, desc: '防御+45', bonus: { defense: 45 } },
      { level: 10, desc: '防御+80', bonus: { defense: 80 } }
    ]
  },
  speedBoost: {
    name: '速度强化', loreName: '疾风', icon: 'mdi:speedometer',
    thresholds: [
      { level: 1, desc: '速度+3', bonus: { speed: 3 } },
      { level: 3, desc: '速度+8', bonus: { speed: 8 } },
      { level: 5, desc: '速度+15', bonus: { speed: 15 } },
      { level: 7, desc: '速度+25', bonus: { speed: 25 } },
      { level: 10, desc: '速度+45', bonus: { speed: 45 } }
    ]
  },
  luckBoost: {
    name: '幸运强化', loreName: '天命', icon: 'mdi:dice-multiple',
    thresholds: [
      { level: 1, desc: '幸运+3', bonus: { luck: 3 } },
      { level: 3, desc: '幸运+8', bonus: { luck: 8 } },
      { level: 5, desc: '幸运+15', bonus: { luck: 15 } },
      { level: 7, desc: '幸运+25', bonus: { luck: 25 } },
      { level: 10, desc: '幸运+45', bonus: { luck: 45 } }
    ]
  },
  atkBoost: {
    name: '攻击力强化', loreName: '破军', icon: 'mdi:sword-cross',
    thresholds: [
      { level: 1, desc: '攻击+8', bonus: { attack: 8 } },
      { level: 3, desc: '攻击+20', bonus: { attack: 20 } },
      { level: 5, desc: '攻击+40', bonus: { attack: 40 } },
      { level: 7, desc: '攻击+70', bonus: { attack: 70 } },
      { level: 10, desc: '攻击+120', bonus: { attack: 120 } }
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
  strong: { white: 15, green: 30, blue: 35, purple: 15, red: 4 },
  boss:   { white: 5,  green: 20, blue: 35, purple: 30, red: 8 }
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
// 品质属性倍率（白色为基础，红色为100倍）
export const QUALITY_STATS_MULTIPLIER = {
  white: 2,   // 基础两倍
  green: 4,   // 白色翻倍
  blue: 8,    // 绿色翻倍
  purple: 16, // 蓝色翻倍
  red: 32     // 紫色翻倍，最终白装与红装差距约16倍
}

export const QUALITY_AFFIX_LEVEL_MIN = {
  white: 1, green: 1, blue: 1, purple: 2, red: 3
}