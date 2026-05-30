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

  // 放置楼梯（远离玩家出生点，放在右下区域）
  // let ladderPlaced = false
  // for (let r = rows - 2; r >= Math.floor(rows / 2); r--) {
  //   for (let c = cols - 2; c >= Math.floor(cols / 2); c--) {
  //     if (grid[r][c] === TILE.EMPTY) {
  //       grid[r][c] = TILE.LADDER
  //       ladderPlaced = true
  //       break
  //     }
  //   }
  //   if (ladderPlaced) break
  // }

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

// 矿石掉落
export function rollOre(floor) {
  const r = Math.random()
  if (floor >= 5 && r < 0.15) return 'dragon_scale'
  if (floor >= 3 && r < 0.35) return 'goblin_fang'
  return 'iron_ore'
}

// 相邻判断
export function isAdjacent(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1
}

// 材料图标
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