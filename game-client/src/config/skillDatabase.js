/**
 * 默认技能数据库
 * 所有技能定义集中管理，怪物/玩家通过 ID 引用
 */
export const defaultSkillDatabase = [
  {
    id: 'normal_attack',
    name: '普通攻击',
    desc: '无属性基础攻击',
    element: null,
    mpCost: 0,
    baseMul: 1.0,
    icon: 'mdi:sword-cross',
    order: 0
  },
  {
    id: 'fire_slash',
    name: '火焰斩',
    desc: '凝聚火焰之力斩击敌人，造成火属性伤害',
    element: 'fire',
    mpCost: 5,
    baseMul: 1.8,
    icon: 'mdi:fire',
    order: 1
  },
  {
    id: 'water_cannon',
    name: '水炮',
    desc: '召唤水弹轰击目标，造成水属性伤害',
    element: 'water',
    mpCost: 6,
    baseMul: 1.7,
    icon: 'mdi:water',
    order: 2
  },
  {
    id: 'thunder_bolt',
    name: '雷击',
    desc: '引雷劈向敌人，造成雷属性伤害',
    element: 'thunder',
    mpCost: 7,
    baseMul: 2.0,
    icon: 'mdi:lightning-bolt',
    order: 3
  },
  {
    id: 'wind_blade',
    name: '风刃',
    desc: '挥出锐利的风之刃，造成风属性伤害',
    element: 'wind',
    mpCost: 5,
    baseMul: 1.6,
    icon: 'mdi:weather-windy',
    order: 4
  },
  {
    id: 'power_strike',
    name: '全力一击',
    desc: '蓄力后发动强力一击，造成大量无属性伤害',
    element: null,
    mpCost: 8,
    baseMul: 2.5,
    icon: 'mdi:arm-flex',
    order: 5
  },
  {
    id: 'heal',
    name: '治愈术',
    desc: '恢复自身 HP，回复量为攻击力的 1.5 倍',
    element: null,
    mpCost: 8,
    baseMul: 0, // 治疗技能特殊处理
    healMul: 1.5,
    icon: 'mdi:heart-plus',
    order: 6
  },
  {
    id: 'ice_lance',
    name: '冰枪',
    desc: '凝结冰晶刺向敌人，造成冰属性伤害',
    element: 'ice',
    mpCost: 6,
    baseMul: 1.9,
    icon: 'mdi:snowflake',
    order: 7
  },
  {
    id: 'dark_claw',
    name: '暗影爪',
    desc: '从暗影中伸出利爪，造成暗属性伤害',
    element: 'dark',
    mpCost: 7,
    baseMul: 2.1,
    icon: 'mdi:claw',
    order: 8
  },
  {
    id: 'holy_light',
    name: '圣光术',
    desc: '释放神圣光芒，造成圣属性伤害',
    element: 'holy',
    mpCost: 9,
    baseMul: 2.2,
    icon: 'mdi:brightness-7',
    order: 9
  },
  {
    id: 'rock_smash',
    name: '岩碎',
    desc: '操纵岩石砸向敌人，造成岩属性伤害',
    element: 'rock',
    mpCost: 6,
    baseMul: 1.8,
    icon: 'mdi:terrain',
    order: 10
  },
  {
    id: 'steel_blade',
    name: '钢刃斩',
    desc: '以钢铁意志挥出斩击，造成钢属性伤害',
    element: 'steel',
    mpCost: 7,
    baseMul: 1.9,
    icon: 'mdi:cube-outline',
    order: 11
  },
  {
    id: 'grass_vine',
    name: '藤蔓缠绕',
    desc: '召唤荆棘藤蔓束缚并伤害敌人，造成草属性伤害',
    element: 'grass',
    mpCost: 5,
    baseMul: 1.5,
    icon: 'mdi:leaf',
    order: 12
  },
  {
    id: 'dual_strike',
    name: '二连击',
    desc: '快速连击两次，每次造成 70% 伤害',
    element: null,
    mpCost: 4,
    baseMul: 0.7,
    hitCount: 2,
    icon: 'mdi:sword-cross',
    order: 13
  }
]
