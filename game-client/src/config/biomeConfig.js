import { materialNames } from './materials'

export const BIOMES = {
  plain: {
    name: '平原',
    exits: { up: 'town', down: 'desert', left: 'plain', right: 'plain' },
    terrainPool: [
      { name: '草地', icon: '🌿', color: '#6c9e3f', passable: true, elevation: 0, weight: 50 },
      { name: '森林', icon: '🌲', color: '#3c6e1f', passable: true, elevation: 1, weight: 25 },
      { name: '山丘', icon: '⛰️', color: '#b98c46', passable: true, elevation: 2, weight: 10 },
      { name: '石墙', icon: '🧱', color: '#7a6a5a', passable: false, elevation: 3, weight: 10 },
      { name: '河流', icon: '💧', color: '#4a9fd8', passable: false, elevation: -1, weight: 5 }
    ],
    enemyRate: 0.08,
   // biomeConfig.js 中怪物定义示例
enemies: [
  { id: 'slime', name: '史莱姆', emoji: '🟢', baseHp: 35, baseAtk: 10, baseDef: 6, levelRange: [1,3],
    materialId: 'slime_gel' },
  // ...
]
  },
  desert: {
    name: '沙漠',
    exits: { up: 'plain', down: 'plain', left: 'plain', right: 'plain' },
    terrainPool: [
      { name: '沙地', icon: '🏜️', color: '#e8b87a', passable: true, elevation: 0, weight: 60 },
      { name: '仙人掌', icon: '🌵', color: '#c0a060', passable: false, elevation: 0, weight: 20 },
      { name: '沙丘', icon: '🏜️', color: '#d4a96a', passable: true, elevation: 2, weight: 20 }
    ],
    enemyRate: 0.12,
    enemies: [
      { id: 'scorpion', name: '毒蝎', emoji: '🦂', baseHp: 40, baseAtk: 22, baseDef: 14, levelRange: [3, 7],
        material: { id: 'scorpion_tail', name: materialNames.scorpion_tail } }
    ]
  },
  town: {
    name: '城镇',
    exits: { down: 'plain', up: 'plain', left: 'plain', right: 'plain' },
    terrainPool: [
      { name: '石板路', icon: '🛤️', color: '#b0a070', passable: true, elevation: 0, weight: 40 },
      { name: '房屋', icon: '🏠', color: '#c9a87b', passable: true, elevation: 0, weight: 25,
        interact: false, interactIcon: '🚪', targetScene: 'house_interior' },
      { name: '水井', icon: '🚰', color: '#6c9e3f', passable: true, elevation: 0, weight: 10 },
      { name: '旅馆', icon: '🏨', color: '#d4a373', passable: true, elevation: 0, weight: 10,
        interact: true, interactIcon: '🛎️', targetScene: 'inn' },
      { name: '冒险者协会', icon: '🏢', color: '#b89a6a', passable: true, elevation: 0, weight: 10,
        interact: true, interactIcon: '📜', targetScene: 'guild' }
    ],
    enemyRate: 0,
    enemies: []
  },
house_interior: {
  name: '室内',
  exits: {},
  terrainPool: [
    { name: '地板', icon: '🟫', color: '#8b5a2b', passable: true, elevation: 0, weight: 80 },
    { name: '宝箱', icon: '🎁', color: '#daa520', passable: true, elevation: 0, weight: 10,
      interact: true, interactIcon: '🔑' },
    { name: '出口', icon: '🚪', color: '#8b5a2b', passable: true, elevation: 0, weight: 10,
      interact: true, interactIcon: '🚶', targetScene: 'town' }
  ],
  enemyRate: 0,
  enemies: []
}
}

export function spawnEnemy(template, playerLevel) {
  if (!template) {
    template = {
      name: '史莱姆', baseHp: 30, baseAtk: 10, baseDef: 5,
      levelRange: [1, 3], material: { id: 'slime_gel', name: '史莱姆凝露' }
    }
  }
  // 优先取 levelRange，否则从 minLevel/maxLevel 构建
  let range = template.levelRange
  if (!range) {
    const min = template.minLevel || 1
    const max = template.maxLevel || 5
    range = [min, max]
  }
  const lv = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]
  const hp = Math.floor((template.baseHp || 30) + lv * 4)
  const atk = Math.floor((template.baseAtk || 10) + lv * 2)
  const def = Math.floor((template.baseDef || 5) + lv * 1.5)
  const exp = template.exp || (20 + lv * 10)
  return {
    ...template,
    level: lv,
    hp, maxHp: hp,
    atk, def,
    exp,
    material: template.material || { id: 'slime_gel', name: '史莱姆凝露' }
  }
}




export function generateBiomeMap(biomeKey, width, height, defeatedSet) {
  const biome = BIOMES[biomeKey]
  if (!biome) return []
  const map = []
  for (let y = 0; y < height; y++) {
    const row = []
    for (let x = 0; x < width; x++) {
      let rand = Math.random() * biome.terrainPool.reduce((s, t) => s + t.weight, 0)
      let cum = 0
      let chosen = biome.terrainPool[0]
      for (const t of biome.terrainPool) {
        cum += t.weight
        if (rand < cum) { chosen = t; break }
      }
      const cell = { ...chosen }
      if (biome.enemies?.length > 0 && Math.random() < biome.enemyRate && cell.passable && !cell.interact) {
        const key = `${x},${y}`
        if (!defeatedSet.has(key)) {
          cell.enemy = biome.enemies[Math.floor(Math.random() * biome.enemies.length)]
        }
      }
      row.push(cell)
    }
    map.push(row)
  }
  return map
}