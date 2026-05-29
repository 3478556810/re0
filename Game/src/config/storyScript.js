export const storyTree = {
  start: {
    id: 'start',
    speaker: 'oldman',
    text: '一位老者向你招手：“勇敢的冒险者，请听我说...”',
    nextId: 'talk_oldman'  // 点击后自动跳到下一段
  },
  talk_oldman: {
    id: 'talk_oldman',
    speaker: 'oldman',
    text: '“北方的森林出现了奇怪的雾气，请调查一下。”',
    choices: [
      { text: '接受任务', nextId: 'accept' },
      { text: '拒绝', nextId: 'refuse' }
    ]
  },
  // ... 其他节点
}