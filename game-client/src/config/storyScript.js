export const storyTree = {
  start: {
    id: 'start',
    speaker: 'oldman',
    text: '你站在城镇广场，一位老者向你招手。',
    choices: [
      { text: '上前交谈', nextId: 'talk_oldman' },
      { text: '无视他', nextId: 'ignore' }
    ]
  },
  forest_entry: {
    id: 'forest_entry',
    speaker: 'hero',
    text: '你踏入了阴森的森林，空气中弥漫着不安...',
    nextId: null   // 点击后关闭，返回地下城面板
  },
  forest_mid: {
    id: 'forest_mid',
    speaker: 'oldman',
    text: '小心，前方的魔力波动越来越强烈了。',
    nextId: null
  }
}