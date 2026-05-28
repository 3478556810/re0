// 材料中文名映射表
export const materialNames = {
  slime_gel: '史莱姆凝露',
  goblin_fang: '哥布林之牙',
  scorpion_tail: '蝎尾针',
  iron_ore: '铁矿石',
  dragon_scale: '龙鳞',
  // 未来可扩展
}

export function getMaterialDisplay(id) {
  return materialNames[id] || id
}