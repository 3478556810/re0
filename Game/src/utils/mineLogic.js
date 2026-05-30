// src/utils/mineLogic.js

export const TILE = {
  WALL: 'wall',
  ROCK: 'rock',
  JUNK: 'junk',
  EMPTY: 'empty',
  LADDER: 'ladder',
  MONSTER: 'monster'
}

// 洞穴式生成：大部分是空地，随机分布墙壁、岩石、垃圾、楼梯和怪物
export function generateCave(rows, cols) {
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(TILE.EMPTY))

  // 四周加墙（边界）
  for (let r = 0; r < rows; r++) {
    grid[r][0] = TILE.WALL
    grid[r][cols - 1] = TILE.WALL
  }
  for (let c = 0; c < cols; c++) {
    grid[0][c] = TILE.WALL
    grid[rows - 1][c] = TILE.WALL
  }

  // 随机散落墙壁、岩石、垃圾（但保持大部分区域可通行）
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const rand = Math.random()
      if (rand < 0.08) grid[r][c] = TILE.WALL       // 少量独立墙壁
      else if (rand < 0.20) grid[r][c] = TILE.ROCK
      else if (rand < 0.30) grid[r][c] = TILE.JUNK
    }
  }

  // 放置怪物（2~3只）
  let monsterCount = 0
  while (monsterCount < 3) {
    const r = 1 + Math.floor(Math.random() * (rows - 2))
    const c = 1 + Math.floor(Math.random() * (cols - 2))
    if (grid[r][c] === TILE.EMPTY && !(r === 1 && c === 1)) { // 避免堵住出生点
      grid[r][c] = TILE.MONSTER
      monsterCount++
    }
  }

  return grid
}

// 怪物随机移动
export function moveMonsters(grid, rows, cols) {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]]
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === TILE.MONSTER) {
        const moves = []
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc
          if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && grid[nr][nc] === TILE.EMPTY) {
            moves.push([nr, nc])
          }
        }
        if (moves.length > 0) {
          const [nr, nc] = moves[Math.floor(Math.random() * moves.length)]
          grid[r][c] = TILE.EMPTY
          grid[nr][nc] = TILE.MONSTER
        }
      }
    }
  }
}

/**
 * 根据材料定义中的 dropRate 权重随机选择矿石
 * @param {Array} materialDefs 所有材料定义（包含 type 和 dropRate 字段）
 * @returns {string} 矿石 ID
 */
export function rollOreDynamic(materialDefs) {
  const ores = materialDefs.filter(m => m.type === 'ore' && (m.dropRate || 0) > 0)
  if (ores.length === 0) return 'iron_ore' // 兜底

  const totalWeight = ores.reduce((sum, ore) => sum + (ore.dropRate || 0), 0)
  let roll = Math.random() * totalWeight

  for (const ore of ores) {
    roll -= ore.dropRate || 0
    if (roll <= 0) return ore.id
  }

  return ores[0].id // 保险
}

/**
 * 根据楼层获取可能的怪物列表（从怪物模板筛选）
 * @param {number} floor 当前楼层
 * @param {Array} allMonsters 所有怪物模板
 * @returns {Array} 符合条件的怪物 ID 数组
 */
export function getMonstersForFloor(floor, allMonsters) {
  // 楼层与怪物标签对应关系
  const tagByFloor = [
    { maxFloor: 3, tags: ['weak'] },
    { maxFloor: 7, tags: ['weak', 'normal'] },
    { maxFloor: 15, tags: ['weak', 'normal', 'strong'] },
    { maxFloor: Infinity, tags: ['weak', 'normal', 'strong', 'boss'] }
  ]

  const rule = tagByFloor.find(r => floor <= r.maxFloor) || tagByFloor[tagByFloor.length - 1]
  const allowedTags = rule.tags

  return allMonsters
    .filter(m => allowedTags.includes(m.tag))
    .map(m => m.id)
}

// 相邻判断
export function isAdjacent(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1
}

// 材料图标（静态映射，可扩展）
export function getMaterialIcon(id) {
  const map = {
    iron_ore: 'mdi:mine',
    dragon_scale: 'mdi:shield-sun',
    goblin_fang: 'mdi:tooth',
    wolf_fang: 'mdi:tooth-outline',
    slime_gel: 'mdi:water',
    waste_stone: 'mdi:delete-empty',
  }
  return map[id] || 'mdi:circle'
}