// 建筑定义
export const BUILDING_POOL = [
  { id: 'tavern', icon: 'mdi:glass-mug-variant', label: '酒馆', action: 'tavern' },
  { id: 'guild', icon: 'mdi:shield-account', label: '公会', action: 'guild' },
  { id: 'forge', icon: 'mdi:anvil', label: '铁匠铺', action: 'forge' },
  { id: 'shop', icon: 'mdi:cart', label: '道具屋', action: 'shop' },
  { id: 'well', icon: 'mdi:water', label: '治愈泉', action: 'heal' },
  { id: 'library', icon: 'mdi:book-open-variant', label: '图书馆', action: 'library' },
  { id: 'tower', icon: 'mdi:tower-beach', label: '法师塔', action: 'enchant' },
  { id: 'mine', icon: 'mdi:pickaxe', label: '矿洞', action: 'mine' },
  { id: 'shrine', icon: 'mdi:church', label: '神殿', action: 'bless' },
  { id: 'dungeon', icon: 'mdi:castle', label: '地下城入口', action: 'dungeon' },
]

// 单元格类型
export const CELL_TYPE = {
  GRASS: 'grass',
  ROAD: 'road',
  BUILDING: 'building',
  CENTER: 'center', // 地下城入口专用
}

/**
 * 生成城镇网格
 * @param {number} rows 行数
 * @param {number} cols 列数
 * @returns {Array<Array<{type: string, building?: Object}>>}
 */
export function generateTownGrid(rows = 8, cols = 10) {
  // 初始化全为草地
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: CELL_TYPE.GRASS }))
  )

  // 中心位置
  const centerR = Math.floor(rows / 2)
  const centerC = Math.floor(cols / 2)

  // 生成道路：从中心向四个方向延伸，然后随机分支
  const roads = new Set() // 用字符串 "row,col" 存储道路格子
  const directions = [[-1,0],[1,0],[0,-1],[0,1]]

  function addRoad(r, c) {
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      roads.add(`${r},${c}`)
    }
  }

  // 主路：中心向四个方向延伸 3~5 格
  for (const [dr, dc] of directions) {
    let steps = 3 + Math.floor(Math.random() * 3)
    let r = centerR, c = centerC
    for (let s = 0; s < steps; s++) {
      r += dr
      c += dc
      if (r < 0 || r >= rows || c < 0 || c >= cols) break
      addRoad(r, c)
    }
  }

  // 额外随机分支：从已有道路格子随机游走
  const roadList = Array.from(roads).map(s => s.split(',').map(Number))
  for (let i = 0; i < 4; i++) {
    const start = roadList[Math.floor(Math.random() * roadList.length)]
    if (!start) continue
    let [r, c] = start
    const [dr, dc] = directions[Math.floor(Math.random() * 4)]
    const steps = 2 + Math.floor(Math.random() * 3)
    for (let s = 0; s < steps; s++) {
      r += dr
      c += dc
      if (r < 0 || r >= rows || c < 0 || c >= cols) break
      addRoad(r, c)
    }
  }

  // 将道路写入网格
  for (const key of roads) {
    const [r, c] = key.split(',').map(Number)
    grid[r][c].type = CELL_TYPE.ROAD
  }

  // 放置建筑：在道路旁边的草地上
  const placedBuildings = []
  const buildingPoolCopy = [...BUILDING_POOL.filter(b => b.id !== 'dungeon')]
  // 随机排序，确保每次不同
  buildingPoolCopy.sort(() => Math.random() - 0.5)

  for (const key of roads) {
    const [r, c] = key.split(',').map(Number)
    // 检查四个相邻格子是否为草地且未占用
    for (const [dr, dc] of directions) {
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (grid[nr][nc].type !== CELL_TYPE.GRASS) continue
      // 避免建筑过于集中，50% 概率放置
      if (Math.random() < 0.5 && buildingPoolCopy.length > 0) {
        const building = buildingPoolCopy.shift()
        grid[nr][nc] = { type: CELL_TYPE.BUILDING, building }
        placedBuildings.push({ r: nr, c: nc, building })
      }
    }
    if (buildingPoolCopy.length === 0) break
  }

  // 中心固定为地下城入口（覆盖中心格子的道路）
  const dungeonBuilding = BUILDING_POOL.find(b => b.id === 'dungeon')
  grid[centerR][centerC] = { type: CELL_TYPE.CENTER, building: dungeonBuilding }

  return grid
}