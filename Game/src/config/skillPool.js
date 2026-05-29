export const defaultSkillPool = [
  {
    id: 'normal_attack',
    name: '普通攻击',
    desc: '无属性基础攻击',
    element: null,
    mpCost: 0,
    baseMul: 1.0,
    icon: 'mdi:sword-cross',
    order: 0  // 顺序
  },
  {
    id: 'fire_slash',
    name: '火焰斩',
    desc: '火属性攻击',
    element: 'fire',
    mpCost: 5,
    baseMul: 1.8,
    icon: 'mdi:fire',
    order: 1
  }
  // 更多...
]