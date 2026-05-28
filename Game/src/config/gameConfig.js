// 所有可调数值、静态数据全部集中于此
export const MATERIAL_PRICES = {
  slime_gel: 2,
  goblin_fang: 3,
  scorpion_tail: 4,
  iron_ore: 2,
  dragon_scale: 10
}

export const MATERIAL_NAMES = {
  slime_gel: '史莱姆凝露',
  goblin_fang: '哥布林之牙',
  scorpion_tail: '蝎尾针',
  iron_ore: '铁矿石',
  dragon_scale: '龙鳞'
}

export const DEFAULT_STOCKS = [
  { id: 'royal_forge', name: '皇家锻造厂', basePrice: 120 },
  { id: 'royal_bond', name: '皇家国债', basePrice: 80 },
  { id: 'intech', name: '英特厄科技', basePrice: 200 },
  { id: 'mana_corp', name: '魔能集团', basePrice: 300 },
  { id: 'air_league', name: '空运联盟', basePrice: 150 },
  { id: 'potions_inc', name: '药水工坊', basePrice: 95 }
]

export const DAILY_EVENTS = [
  { title: '王国宣战', desc: '王国向帝国宣战，军需物资需求暴增。', effects: [
    { stockId: 'royal_forge', change: 8 },
    { stockId: 'royal_bond', change: -5 },
    { stockId: 'air_league', change: 6 }
  ]},
  // ... 其他事件
]

// 工具函数
export function getMaterialName(id) {
  return MATERIAL_NAMES[id] || id
}
export function getMaterialPrice(id) {
  return MATERIAL_PRICES[id] || 2
}