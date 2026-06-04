export const DUNGEONS = {
  forest_depths: {
    name: '森林深处',
    icon: 'mdi:pine-tree',
    maxFloors: 5,
    cooldown: 1,
    monstersByFloor: {
      1: ['slime', 'goblin'],
      2: ['wolf', 'goblin'],
      3: ['scorpion', 'wolf'],
      4: ['golem', 'scorpion'],
      5: ['boss_wolfking']
    },
    storyByFloor: {
      1: 'forest_entry',   // 第一层触发剧情
      3: 'forest_mid'      // 第三层触发剧情
    }
  }
}