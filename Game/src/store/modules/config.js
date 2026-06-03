import { AFFIX_EFFECTS, QUALITY_WEIGHTS } from '../../config/accessoryConfig'
import { DUNGEONS } from '../../config/dungeonConfig'
import { defaultCharacters } from '../../config/characters'
import { storyTree as defaultStoryTree } from '../../config/storyScript'
import { defaultSkillDatabase } from '../../config/skillDatabase'
import { MATERIAL_PRICES } from '../../config/gameConfig'

const builtInMaterialNames = {
  slime_gel: '史莱姆凝露',
  goblin_fang: '哥布林之牙',
  scorpion_tail: '蝎尾针',
  iron_ore: '铁矿石',
  dragon_scale: '龙鳞',
  dungeon_token: '地下城徽记',
  golem_core: '魔像核心',
  wolf_fang: '狼牙',
  wolf_heart: '狼王之心',
  scorpion_heart: '蝎皇之心'
}
const LEVEL_QUALITY_MULT = {
  white: 1,
  green: 1.2,
  blue: 1.8,
  purple: 3,
  red: 6
};
export const defaultConfig = {
    customImages: {
    hero: '/images/portrait/hero.png',
    // 其他角色图片...
  },
  enhanceConfig: {
    qualityUpgrade: {
      white: { gold: 100, materials: [{ id: 'iron_ore', qty: 3 }], successRate: 0.9 },
      green: { gold: 400, materials: [{ id: 'silver_ore', qty: 2 }], successRate: 0.8 },
      blue: { gold: 1200, materials: [{ id: 'gold_ore', qty: 2 }], successRate: 0.7 },
      purple: { gold: 4000, materials: [{ id: 'obsidian', qty: 1 }], successRate: 0.5 },
    },
    levelUp: {
      qualityMult: { white: 1, green: 1.2, blue: 1.8, purple: 3, red: 6 },
      perLevel: (level, quality) => ({
       gold: Math.floor((5 + level * 3) * (LEVEL_QUALITY_MULT[quality] || 1)),
        materials: level <= 20 ? [] : [{ id: 'small_magic_stone', qty: Math.ceil((level - 20) / 10) }],
        successRate: Math.max(0.15, 1.0 - (level * 0.04))
      })
    },
    affixReroll: { gold: 500, materials: [{ id: 'small_magic_stone', qty: 2 }] },
  },
  forgeRecipes: [
    { id: 'iron_sword', name: '铁剑', materials: [{ id: 'iron_ore', qty: 3 }, { id: 'slime_gel', qty: 2 }], goldCost: 80, result: { type: 'weapon', part: 'weapon', name: '铁剑', atk: 15, def: 0, affixSlots: 1, icon: 'mdi:sword' } },
    { id: 'leather_armor', name: '皮革甲', materials: [{ id: 'wolf_fang', qty: 4 }, { id: 'iron_ore', qty: 2 }], goldCost: 120, result: { type: 'armor', part: 'armor', name: '皮革甲', atk: 0, def: 12, affixSlots: 1, icon: 'mdi:shield' } }
  ],
  affixEffects: JSON.parse(JSON.stringify(AFFIX_EFFECTS)),
  tokenShopItems: [
    { id: 't1', name: '龙鳞 x3', desc: '稀有锻造材料', type: 'material', cost: 5, rewardId: 'dragon_scale', rewardName: '龙鳞', rewardQty: 3 },
    { id: 't2', name: '随机饰品', desc: '获得一件随机品质饰品', type: 'accessory', cost: 10 },
    { id: 't3', name: '经验药水', desc: '获得 100 经验', type: 'material', cost: 3, rewardId: 'exp_potion', rewardName: '经验药水', rewardQty: 1 }
  ],
  storyScript: JSON.parse(JSON.stringify(defaultStoryTree)),
  materialPrices: { ...MATERIAL_PRICES },
  materialDefinitions: Object.keys(builtInMaterialNames).map(id => ({
    id,
    name: builtInMaterialNames[id] || id,
    type: 'forge'
  })),
  skillPool: [
    { id: 'normal_attack', name: '普通攻击', desc: '无属性基础攻击', element: null, mpCost: 0, baseMul: 1.0, icon: 'mdi:sword-cross', upgradeCost: 2 },
    { id: 'fire_slash', name: '火焰斩', desc: '火属性攻击', element: 'fire', mpCost: 5, baseMul: 1.8, icon: 'mdi:fire', upgradeCost: 2 },
    { id: 'ice_bolt', name: '冰冻术', desc: '冰属性攻击', element: 'ice', mpCost: 8, baseMul: 2.0, icon: 'mdi:snowflake', upgradeCost: 3 },
    { id: 'thunder_shock', name: '雷电', desc: '雷属性攻击', element: 'thunder', mpCost: 6, baseMul: 1.6, icon: 'mdi:lightning-bolt', upgradeCost: 2 }
  ],
  stockOverrides: [],
  monsterTemplates: [
    { id: 'slime', name: '史莱姆', tag: 'weak', isBoss: false, baseHp: 35, baseAtk: 10, baseDef: 6, exp: 20, material: { id: 'slime_gel', name: '史莱姆凝露' }, icon: 'mdi:blur', element: '', trait: '', critRate: 0, critDmg: 0, fireDmg:0, waterDmg:0, thunderDmg:0, windDmg:0, grassDmg:0, iceDmg:0, holyDmg:0, darkDmg:0, steelDmg:0, rockDmg:0, lifesteal:0, luck:0, skillsText: '[]' },
    { id: 'goblin', name: '哥布林', tag: 'weak', isBoss: false, baseHp: 45, baseAtk: 16, baseDef: 10, exp: 35, material: { id: 'goblin_fang', name: '哥布林之牙' }, icon: 'mdi:alien', element: '', trait: '', critRate:0, critDmg:0, fireDmg:0, waterDmg:0, thunderDmg:0, windDmg:0, grassDmg:0, iceDmg:0, holyDmg:0, darkDmg:0, steelDmg:0, rockDmg:0, lifesteal:0, luck:0, skillsText: '[]' },
    { id: 'wolf', name: '森林狼', tag: 'normal', isBoss: false, baseHp: 50, baseAtk: 22, baseDef: 12, exp: 45, material: { id: 'wolf_fang', name: '狼牙' }, icon: 'mdi:dog', element: '', trait: '', critRate:0, critDmg:0, fireDmg:0, waterDmg:0, thunderDmg:0, windDmg:0, grassDmg:0, iceDmg:0, holyDmg:0, darkDmg:0, steelDmg:0, rockDmg:0, lifesteal:0, luck:0, skillsText: '[]' },
    { id: 'scorpion', name: '毒蝎', tag: 'normal', isBoss: false, baseHp: 40, baseAtk: 22, baseDef: 14, exp: 40, material: { id: 'scorpion_tail', name: '蝎尾针' }, icon: 'mdi:bug', element: '', trait: '', critRate:0, critDmg:0, fireDmg:0, waterDmg:0, thunderDmg:0, windDmg:0, grassDmg:0, iceDmg:0, holyDmg:0, darkDmg:0, steelDmg:0, rockDmg:0, lifesteal:0, luck:0, skillsText: '[]' },
    { id: 'golem', name: '石魔像', tag: 'strong', isBoss: false, baseHp: 80, baseAtk: 30, baseDef: 25, exp: 80, material: { id: 'golem_core', name: '魔像核心' }, icon: 'mdi:robot', element: '', trait: '', critRate:0, critDmg:0, fireDmg:0, waterDmg:0, thunderDmg:0, windDmg:0, grassDmg:0, iceDmg:0, holyDmg:0, darkDmg:0, steelDmg:0, rockDmg:0, lifesteal:0, luck:0, skillsText: '[]' },
    { id: 'boss_wolfking', name: '狼王', tag: 'boss', isBoss: true, baseHp: 120, baseAtk: 35, baseDef: 20, exp: 150, material: { id: 'wolf_heart', name: '狼王之心' }, icon: 'mdi:skull', element: '', trait: '', critRate:0, critDmg:0, fireDmg:0, waterDmg:0, thunderDmg:0, windDmg:0, grassDmg:0, iceDmg:0, holyDmg:0, darkDmg:0, steelDmg:0, rockDmg:0, lifesteal:0, luck:0, skillsText: '[]' }
  ],
  characters: { ...defaultCharacters },
  customImages: {},
  lootMultiplier: 1,
  qualityWeights: JSON.parse(JSON.stringify(QUALITY_WEIGHTS)),
  dungeonConfigs: JSON.parse(JSON.stringify(DUNGEONS)),
  monsterTags: ['weak', 'normal', 'strong', 'boss'],
  skillPool: JSON.parse(JSON.stringify(defaultSkillDatabase))
}