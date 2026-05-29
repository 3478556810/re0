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
    thresholds: [ /* ... */ ]
  },
  waterAttack: {
    name: '水属性强化',
    loreName: '深渊寒',
    icon: 'mdi:water',
    thresholds: [ /* ... */ ]
  },
  thunderAttack: {
    name: '雷属性强化',
    loreName: '雷神怒',
    icon: 'mdi:lightning-bolt',
    thresholds: [ /* ... */ ]
  },
  windAttack: {
    name: '风属性强化',
    loreName: '风暴眼',
    icon: 'mdi:weather-windy',
    thresholds: [ /* ... */ ]
  },
  iceAttack: {
    name: '冰属性强化',
    loreName: '永冻霜',
    icon: 'mdi:snowflake',
    thresholds: [ /* ... */ ]
  },
  holyAttack: {
    name: '圣属性强化',
    loreName: '圣光裁',
    icon: 'mdi:brightness-7',
    thresholds: [ /* ... */ ]
  },
  darkAttack: {
    name: '暗属性强化',
    loreName: '暗影灭',
    icon: 'mdi:moon-waning-crescent',
    thresholds: [ /* ... */ ]
  },
  steelAttack: {
    name: '钢属性强化',
    loreName: '钢铁魂',
    icon: 'mdi:cube-outline',
    thresholds: [ /* ... */ ]
  },
  rockAttack: {
    name: '岩属性强化',
    loreName: '大地怒',
    icon: 'mdi:terrain',
    thresholds: [ /* ... */ ]
  },
  critBoost: {
    name: '暴击强化',
    loreName: '致命',
    icon: 'mdi:alert-circle',
    thresholds: [ /* ... */ ]
  },
  critDmgBoost: {
    name: '暴伤强化',
    loreName: '毁灭',
    icon: 'mdi:flash-circle',
    thresholds: [ /* ... */ ]
  },
  lifestealBoost: {
    name: '吸血强化',
    loreName: '嗜血',
    icon: 'mdi:blood-bag',
    thresholds: [ /* ... */ ]
  },
  trueDmgBoost: {
    name: '真实伤害',
    loreName: '穿透',
    icon: 'mdi:sword',
    thresholds: [ /* ... */ ]
  },
  hpBoost: {
    name: '生命强化',
    loreName: '不朽',
    icon: 'mdi:heart',
    thresholds: [ /* ... */ ]
  },
  defenseBoost: {
    name: '防御强化',
    loreName: '坚壁',
    icon: 'mdi:shield',
    thresholds: [ /* ... */ ]
  },
  speedBoost: {
    name: '速度强化',
    loreName: '疾风',
    icon: 'mdi:speedometer',
    thresholds: [ /* ... */ ]
  },
  luckBoost: {
    name: '幸运强化',
    loreName: '天命',
    icon: 'mdi:dice-multiple',
    thresholds: [ /* ... */ ]
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

// ========== 掉落表 ==========
export const LOOT_TABLES = {
  // 按怪物类型分组
  slime: {
    dropChance: 0.3,
    qualityTier: 'weak',
    accessories: ['earring1', 'earring2']
  },
  goblin: {
    dropChance: 0.35,
    qualityTier: 'weak',
    accessories: ['necklace1', 'necklace2']
  },
  scorpion: {
    dropChance: 0.4,
    qualityTier: 'normal',
    accessories: ['earring1', 'earring2', 'necklace1', 'necklace2']
  },
  wolf: {
    dropChance: 0.45,
    qualityTier: 'normal',
    accessories: ['earring1', 'earring2']
  },
  dragon: {
    dropChance: 0.8,
    qualityTier: 'strong',
    accessories: ['earring1', 'earring2', 'necklace1', 'necklace2']
  },
  boss: {
    dropChance: 1.0,
    qualityTier: 'boss',
    accessories: ['earring1', 'earring2', 'necklace1', 'necklace2']
  }
}

// 根据怪物名称匹配掉落表
export function getLootTable(enemyName) {
  const name = enemyName.toLowerCase()
  if (name.includes('boss') || name.includes('魔王') || name.includes('领主')) {
    return LOOT_TABLES.boss
  }
  if (name.includes('龙') || name.includes('dragon')) {
    return LOOT_TABLES.dragon
  }
  if (name.includes('狼') || name.includes('wolf')) {
    return LOOT_TABLES.wolf
  }
  if (name.includes('蝎') || name.includes('scorpion')) {
    return LOOT_TABLES.scorpion
  }
  if (name.includes('哥布林') || name.includes('goblin')) {
    return LOOT_TABLES.goblin
  }
  if (name.includes('史莱姆') || name.includes('slime')) {
    return LOOT_TABLES.slime
  }
  return LOOT_TABLES.slime // 默认
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
