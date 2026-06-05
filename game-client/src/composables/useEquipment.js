export function qualityColor(q) {
  const map = { white: '#ccc', green: '#4caf50', blue: '#2196f3', purple: '#9c27b0', red: '#ff4444' }
  return map[q] || '#ccc'
}
export function qualityText(q) {
  const map = { white: '普通', green: '精良', blue: '稀有', purple: '史诗', red: '传说' }
  return map[q] || q
}
export function getExtraStatName(key) {
  const map = {
    atk: '攻击力', atkPercent: '攻击力%', def: '防御力', defPercent: '防御力%',
    hp: '生命值', hpPercent: '生命值%', mp: '魔法值',
    critRate: '暴击率', critDmg: '暴击伤害', trueDmg: '真实伤害',
    speed: '速度', dodge: '闪避',
    fireDmgPercent: '火属性攻击%', iceDmgPercent: '冰属性攻击%',
    thunderDmgPercent: '雷属性攻击%', holyDmgPercent: '圣属性攻击%',
    darkDmgPercent: '暗属性攻击%', windDmgPercent: '风属性攻击%',
    grassDmgPercent: '草属性攻击%', rockDmgPercent: '岩属性攻击%',
    steelDmgPercent: '钢属性攻击%'
  }
  return map[key] || key
}