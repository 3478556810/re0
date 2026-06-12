// 怪物池（按你的怪物ID）
const normalPool = ['slime', 'green_slime', 'goblin', 'goblin_scout', 'giant_bat', 'cave_spider']
const elitePool = ['rock_golem', 'fire_elemental', 'shadow_wraith']
const bossPool = ['boss_goblin_chief', 'boss_goblin_king', 'boss_shadow_lord', 'boss_fire_dragon']

// 简单的马尔可夫转移：根据上一层的“难度标签”决定本层怪物类型
const transition = {
  easy: { easy: 0.5, normal: 0.4, hard: 0.1, boss: 0.0 },
  normal: { easy: 0.2, normal: 0.5, hard: 0.25, boss: 0.05 },
  hard: { easy: 0.1, normal: 0.3, hard: 0.4, boss: 0.2 },
  boss: { easy: 0.3, normal: 0.4, hard: 0.3, boss: 0.0 }
}

let lastTag = 'easy'

function pickWeighted(tags) {
  const rand = Math.random()
  let sum = 0
  for (const tag of Object.keys(tags)) {
    sum += tags[tag]
    if (rand <= sum) return tag
  }
  return 'easy'
}

/**
 * 生成无限塔某一层的怪物数组
 * @param {number} floor - 当前层数
 * @param {object} store - 游戏 store 实例
 * @returns {Array} 怪物对象数组
 */
export function generateTowerMonsters(floor, store) {
  // 每5层出Boss
  if (floor % 5 === 0) {
    const idx = Math.min(Math.floor(floor / 5) - 1, bossPool.length - 1)
    return [scaleMonster(bossPool[idx], floor, true, store)]
  }

  // 决定本层难度标签
  const tag = pickWeighted(transition[lastTag])
  lastTag = tag

  // 根据难度选择怪物池
  let pool
  if (tag === 'hard') pool = elitePool
  else if (tag === 'normal') pool = [...normalPool, ...elitePool]
  else pool = normalPool

  // 随机1-3只
  const count = Math.min(1 + Math.floor(Math.random() * 3), 3)
  const monsters = []
  for (let i = 0; i < count; i++) {
    const id = pool[Math.floor(Math.random() * pool.length)]
    monsters.push(scaleMonster(id, floor, false, store))
  }
  return monsters
}

/**
 * 根据层数缩放单个怪物属性
 * @param {string} id - 怪物ID
 * @param {number} floor - 当前层数
 * @param {boolean} isBoss - 是否为Boss
 * @param {object} store - 游戏 store 实例
 * @returns {object|null} 缩放后的怪物对象
 */
function scaleMonster(id, floor, isBoss, store) {
  const template = store.config.monsterTemplates?.find(m => m.id === id)
  if (!template) return null

  const mult = 1 + (floor - 1) * 0.12 // 每层+12%
  return {
    ...template,
    id: id,
    level: 1 + floor * 2,
    hp: Math.floor(template.baseHp * mult * (isBoss ? 1.5 : 1)),
    maxHp: Math.floor(template.baseHp * mult * (isBoss ? 1.5 : 1)),
    atk: Math.floor(template.baseAtk * mult * (isBoss ? 1.3 : 1)),
    def: Math.floor(template.baseDef * mult * (isBoss ? 1.2 : 1)),
    exp: Math.floor(template.exp * mult),
    icon: template.icon,
    element: template.element,
    skillsText: template.skillsText,
    isBoss: isBoss
  }
}