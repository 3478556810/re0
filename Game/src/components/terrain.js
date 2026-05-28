// terrain.js
export const Terrain = {
  GRASS: { name: '草地', icon: '🌿', color: '#6c9e3f', moveCost: 1, passable: true },
  SAND: { name: '沙漠', icon: '🏜️', color: '#e8b87a', moveCost: 2, passable: true },
  FOREST: { name: '森林', icon: '🌲', color: '#3c6e1f', moveCost: 2, passable: true },
  WATER: { name: '海洋', icon: '🌊', color: '#4a9fd8', moveCost: 0, passable: false },
  WALL: { name: '墙壁', icon: '🧱', color: '#7a6a5a', moveCost: 0, passable: false },
  VILLAGE: { name: '村庄', icon: '🏘️', color: '#c9a87b', moveCost: 1, passable: true, interactable: true },
  BLACKSMITH: { name: '铁匠铺', icon: '⚒️', color: '#a87b51', moveCost: 1, passable: true, interactable: true }
}