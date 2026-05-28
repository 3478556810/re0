// mapGenerator.js
import { Terrain } from './terrain'

export function generateRandomMap(width, height, seed = null) {
  const map = Array(height).fill().map(() => Array(width).fill(Terrain.GRASS))
  
  // 随机海洋（四周边缘）
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y === 0 || y === height-1 || x === 0 || x === width-1) {
        if (Math.random() < 0.7) map[y][x] = Terrain.WATER
      }
    }
  }
  
  // 随机放置森林、沙漠、墙壁
  for (let i = 0; i < width*height*0.1; i++) {
    const x = Math.floor(Math.random() * width)
    const y = Math.floor(Math.random() * height)
    if (map[y][x] === Terrain.GRASS) {
      const r = Math.random()
      if (r < 0.4) map[y][x] = Terrain.FOREST
      else if (r < 0.6) map[y][x] = Terrain.SAND
      else if (r < 0.7) map[y][x] = Terrain.WALL
    }
  }
  
  // 放置村庄和铁匠铺（确保数量）
  let placed = 0
  while (placed < 2) {
    const x = Math.floor(Math.random() * width)
    const y = Math.floor(Math.random() * height)
    if (map[y][x] === Terrain.GRASS) {
      map[y][x] = placed === 0 ? Terrain.VILLAGE : Terrain.BLACKSMITH
      placed++
    }
  }
  
  return map
}