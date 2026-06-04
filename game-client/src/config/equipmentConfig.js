// 品质系数
export const QUALITY = {
  white: 1.0, green: 1.2, blue: 1.5, purple: 2.0, red: 3.0
}

// 词条池
export const AFFIX_POOL = [
  { name: '攻击力+', type: 'atk', min: 1, max: 5, tier: 1 },
  { name: '防御力+', type: 'def', min: 1, max: 5, tier: 1 },
  { name: '暴击率+%', type: 'critRate', min: 1, max: 3, tier: 2 },
  { name: '暴击伤害+%', type: 'critDmg', min: 5, max: 15, tier: 2 },
  { name: '吸血+%', type: 'lifesteal', min: 1, max: 3, tier: 3 },
  { name: '真实伤害+', type: 'trueDmg', min: 1, max: 5, tier: 3 }
]

// 套装定义 (setId => { 2件效果, 4件效果, 6件效果 })
export const SET_EFFECTS = {
  flame_set: {
    name: '炎龙之怒',
    2: { desc: '火属性伤害+15%', effect: { fireDmg: 1.15 } },
    4: { desc: '攻击时有10%几率释放火焰新星', effect: { fireNova: 0.1 } },
    6: { desc: '暴击伤害提高至250%', effect: { critDmgMul: 2.5 } }
  },
  shadow_set: {
    name: '暗影之舞',
    2: { desc: '暗属性伤害+15%', effect: { darkDmg: 1.15 } },
    4: { desc: '击杀敌人回复10%HP', effect: { killHeal: 0.1 } },
    6: { desc: '闪避率+20%', effect: { dodge: 0.2 } }
  }
}

// 装备生成示例：随机词条、打孔数
export function generateEquipment(part, quality, setName = null) {
  const item = {
    id: `${part}_${Date.now()}`,
    part,           // weapon, helmet, shoulder, armor, pants, ring, earring
    name: `${QUALITY[quality] ? quality.toUpperCase() : '白'} ${part}`,
    quality,
    atk: Math.floor(3 * QUALITY[quality]) + Math.floor(Math.random() * 5),
    def: Math.floor(2 * QUALITY[quality]) + Math.floor(Math.random() * 4),
    affixes: [],    // 随机1~3条词条
    sockets: Math.floor(Math.random() * 3), // 0~2孔
    setId: setName,
    setPiece: part   // 部位标记
  }
  // 随机词条
  const affixCount = quality === 'red' ? 3 : quality === 'purple' ? 2 : 1
  for (let i = 0; i < affixCount; i++) {
    const affix = AFFIX_POOL[Math.floor(Math.random() * AFFIX_POOL.length)]
    item.affixes.push({
      ...affix,
      value: Math.floor(Math.random() * (affix.max - affix.min + 1)) + affix.min
    })
  }
  return item
}