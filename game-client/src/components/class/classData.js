// src/components/class/classData.js

export const CLASS_DEFS = {
  wanderer: { id: 'wanderer', name: '流浪者', icon: 'mdi:account', desc: '初始职业', tier: 0, parent: null, mechanism: null },
  warrior:   { id: 'warrior', name: '战士', icon: 'mdi:sword-cross', desc: '近战攻守兼备', tier: 1, parent: 'wanderer', reqLevel: 10, mechanism: 'toughness' },
  mage:      { id: 'mage', name: '法师', icon: 'mdi:magic-staff', desc: '元素与奥术大师', tier: 1, parent: 'wanderer', reqLevel: 10, mechanism: 'mana_flow' },
  ranger:    { id: 'ranger', name: '游侠', icon: 'mdi:bow-arrow', desc: '敏捷的远程猎手', tier: 1, parent: 'wanderer', reqLevel: 10, mechanism: 'swift_strike' },
  berserker: { id: 'berserker', name: '狂战士', icon: 'mdi:axe-battle', desc: '血怒狂暴', tier: 2, parent: 'warrior', reqLevel: 25, mechanism: 'blood_rage' },
  paladin:   { id: 'paladin', name: '圣骑士', icon: 'mdi:shield-cross', desc: '神圣守护', tier: 2, parent: 'warrior', reqLevel: 25, mechanism: 'holy_aura' },
  archmage:  { id: 'archmage', name: '大魔导', icon: 'mdi:fire-circle', desc: '元素掌控者', tier: 2, parent: 'mage', reqLevel: 25, mechanism: 'elemental_mastery' },
  elemental: { id: 'elemental', name: '元素使', icon: 'mdi:creation', desc: '混乱元素', tier: 2, parent: 'mage', reqLevel: 25, mechanism: 'elemental_overload' },
  sniper:    { id: 'sniper', name: '神射手', icon: 'mdi:target', desc: '一击必杀', tier: 2, parent: 'ranger', reqLevel: 25, mechanism: 'weakness_sniping' },
  shadow:    { id: 'shadow', name: '暗影猎手', icon: 'mdi:ninja', desc: '暗影收割', tier: 2, parent: 'ranger', reqLevel: 25, mechanism: 'assassination' }
};

export const TALENT_TREES = {
  warrior: {
    nodes: [
      { id: 'w_start', x: 50, y: 85, type: 'small', icon: 'mdi:circle-outline', name: '战士之心', effect: '战士之路', cost: 0, connections: [] },
      { id: 'w_atk1', x: 42, y: 78, type: 'small', icon: 'mdi:sword', name: '强攻', effect: '攻击 +5%', cost: 1, connections: ['w_start'] },
      { id: 'w_atk2', x: 34, y: 72, type: 'small', icon: 'mdi:sword', name: '猛攻', effect: '攻击 +5%', cost: 1, connections: ['w_atk1'] },
      { id: 'w_atk3', x: 25, y: 65, type: 'small', icon: 'mdi:sword', name: '狂暴', effect: '攻击 +8%', cost: 2, connections: ['w_atk2'] },
      { id: 'w_notable_atk', x: 18, y: 58, type: 'notable', icon: 'mdi:axe-battle', name: '武器大师', effect: '攻击 +20%<br/>暴击伤害 +25%', cost: 3, connections: ['w_atk3'] },
      { id: 'w_keystone_atk', x: 10, y: 50, type: 'keystone', icon: 'mdi:skull', name: '血之狂怒', effect: '攻击 +60%<br/>暴击伤害 +80%<br/>每秒失去2%生命', cost: 5, connections: ['w_notable_atk'] },
      { id: 'w_def1', x: 58, y: 78, type: 'small', icon: 'mdi:shield', name: '坚韧', effect: '防御 +8%', cost: 1, connections: ['w_start'] },
      { id: 'w_def2', x: 66, y: 72, type: 'small', icon: 'mdi:shield', name: '铁壁', effect: '防御 +8%', cost: 1, connections: ['w_def1'] },
      { id: 'w_def3', x: 75, y: 65, type: 'small', icon: 'mdi:shield', name: '要塞', effect: '防御 +10%', cost: 2, connections: ['w_def2'] },
      { id: 'w_notable_def', x: 82, y: 58, type: 'notable', icon: 'mdi:shield-star', name: '守护者', effect: '防御 +25%<br/>生命 +20%', cost: 3, connections: ['w_def3'] },
      { id: 'w_keystone_def', x: 90, y: 50, type: 'keystone', icon: 'mdi:shield-cross', name: '绝对防御', effect: '受伤害降低30%<br/>攻击力降低15%', cost: 5, connections: ['w_notable_def'] },
      { id: 'w_util1', x: 50, y: 72, type: 'small', icon: 'mdi:run-fast', name: '疾步', effect: '速度 +5%', cost: 1, connections: ['w_start'] },
      { id: 'w_util2', x: 50, y: 64, type: 'small', icon: 'mdi:run-fast', name: '迅捷', effect: '速度 +5%', cost: 1, connections: ['w_util1'] },
      { id: 'w_notable_util', x: 50, y: 56, type: 'notable', icon: 'mdi:weather-windy', name: '战意', effect: '速度 +15%<br/>闪避 +10%', cost: 2, connections: ['w_util2'] }
    ]
  },
mage: {
  nodes: [
    // 起点（中央靠下）
    { id: 'm_start', x: 50, y: 85, type: 'small', icon: 'mdi:circle-outline', name: '奥术起源', effect: '魔法之路', cost: 0, connections: [] },

    // ========== 向上左路：元素强化 ==========
    { id: 'm_ele1', x: 44, y: 78, type: 'small', icon: 'mdi:fire', name: '元素亲和', effect: '全元素伤害 +6%', cost: 1, connections: ['m_start'] },
    { id: 'm_ele2', x: 38, y: 71, type: 'small', icon: 'mdi:water', name: '元素精通', effect: '全元素伤害 +6%', cost: 1, connections: ['m_ele1'] },
    { id: 'm_ele3', x: 32, y: 63, type: 'small', icon: 'mdi:lightning-bolt', name: '元素过载', effect: '全元素伤害 +10%', cost: 2, connections: ['m_ele2'] },
    { id: 'm_ele4', x: 26, y: 55, type: 'small', icon: 'mdi:creation', name: '元素共鸣', effect: '全元素伤害 +8%', cost: 2, connections: ['m_ele3'] },
    { id: 'm_notable_ele', x: 18, y: 47, type: 'notable', icon: 'mdi:magic-staff', name: '大魔导之印', effect: '元素伤害 +25%<br/>最大MP +20%', cost: 3, connections: ['m_ele4'] },
    { id: 'm_keystone_ele', x: 10, y: 39, type: 'keystone', icon: 'mdi:creation', name: '元素主宰', effect: '释放技能后全队元素伤害+20%，持续2回合', cost: 5, connections: ['m_notable_ele'], reqClass: 'archmage' },
    { id: 'm_ele_overload', x: 14, y: 31, type: 'small', icon: 'mdi:flash', name: '过载增幅', effect: '元素反应伤害 +15%', cost: 2, connections: ['m_keystone_ele'], reqClass: 'archmage' },
    { id: 'm_ele_overload2', x: 20, y: 25, type: 'notable', icon: 'mdi:flash-triangle', name: '元素崩解', effect: '无视敌人 20% 元素抗性', cost: 4, connections: ['m_ele_overload'], reqClass: 'archmage' },

    // ========== 向右路：法力与续航 ==========
    { id: 'm_mp1', x: 56, y: 78, type: 'small', icon: 'mdi:water', name: '冥想', effect: '最大MP +10%', cost: 1, connections: ['m_start'] },
    { id: 'm_mp2', x: 62, y: 71, type: 'small', icon: 'mdi:water', name: '启迪', effect: '最大MP +10%', cost: 1, connections: ['m_mp1'] },
    { id: 'm_mp3', x: 68, y: 63, type: 'small', icon: 'mdi:brain', name: '清醒', effect: 'MP消耗 -5%', cost: 1, connections: ['m_mp2'] },
    { id: 'm_notable_mp', x: 76, y: 55, type: 'notable', icon: 'mdi:brain', name: '智慧之源', effect: '最大MP +30%<br/>MP消耗降低15%', cost: 3, connections: ['m_mp3'] },
    { id: 'm_mp_keystone', x: 84, y: 47, type: 'keystone', icon: 'mdi:brain-freeze', name: '奥术风暴', effect: '每次施法回复 5% 最大MP', cost: 5, connections: ['m_notable_mp'], reqClass: 'archmage' },
    { id: 'm_mp_surge', x: 80, y: 39, type: 'notable', icon: 'mdi:pulse', name: '法力涌动', effect: 'MP回复速度 +30%', cost: 3, connections: ['m_mp_keystone'], reqClass: 'archmage' },

    // ========== 正中偏左：暴击强化 ==========
    { id: 'm_crit1', x: 48, y: 76, type: 'small', icon: 'mdi:target', name: '奥术精准', effect: '暴击率 +4%', cost: 1, connections: ['m_start'] },
    { id: 'm_crit2', x: 46, y: 68, type: 'small', icon: 'mdi:target', name: '法术暴击', effect: '暴击率 +4%', cost: 1, connections: ['m_crit1'] },
    { id: 'm_crit3', x: 42, y: 60, type: 'small', icon: 'mdi:flash-circle', name: '致命法术', effect: '暴击伤害 +8%', cost: 2, connections: ['m_crit2'] },
    { id: 'm_notable_crit', x: 38, y: 52, type: 'notable', icon: 'mdi:star-circle', name: '奥术升华', effect: '暴击伤害 +20%<br/>暴击时回复 2% MP', cost: 3, connections: ['m_crit3'] },
    { id: 'm_keystone_crit', x: 34, y: 44, type: 'keystone', icon: 'mdi:creation', name: '完美施法', effect: '暴击伤害 +60%', cost: 5, connections: ['m_notable_crit'], reqClass: 'archmage' },
    { id: 'm_crit_mastery', x: 30, y: 38, type: 'notable', icon: 'mdi:magic-staff', name: '法术穿心', effect: '暴击无视敌人 15% 防御', cost: 4, connections: ['m_keystone_crit'], reqClass: 'archmage' },

    // ========== 向下左路：生存与防御 ==========
    { id: 'm_def1', x: 44, y: 92, type: 'small', icon: 'mdi:shield', name: '魔法护盾', effect: '防御 +8%', cost: 1, connections: ['m_start'] },
    { id: 'm_def2', x: 38, y: 98, type: 'small', icon: 'mdi:shield-star', name: '元素之盾', effect: '受击时 15% 概率获得 5% 生命护盾', cost: 2, connections: ['m_def1'] },
    { id: 'm_def_notable', x: 32, y: 105, type: 'notable', icon: 'mdi:shield-cross', name: '水晶屏障', effect: '最大HP +20%<br/>被暴击时伤害降低 30%', cost: 3, connections: ['m_def2'] },
    // 魔导专属继续向下
    { id: 'm_keystone_def', x: 26, y: 113, type: 'keystone', icon: 'mdi:shield-moon', name: '奥术之躯', effect: '生命低于 50% 时，消耗 MP 代替部分伤害', cost: 5, connections: ['m_def_notable'], reqClass: 'archmage' },
    { id: 'm_def_regen', x: 32, y: 120, type: 'small', icon: 'mdi:heart-pulse', name: '再生魔印', effect: '每回合恢复 2% 最大HP', cost: 2, connections: ['m_keystone_def'], reqClass: 'archmage' },

    // ========== 向下右路：召唤 / 奥术仆从 ==========
    { id: 'm_summon1', x: 56, y: 92, type: 'small', icon: 'mdi:ghost', name: '魔宠契约', effect: '战斗开始时召唤一只小精灵', cost: 2, connections: ['m_start'] },
    { id: 'm_summon2', x: 62, y: 98, type: 'small', icon: 'mdi:ghost', name: '强化魔宠', effect: '魔宠生命 +30%', cost: 1, connections: ['m_summon1'] },
    { id: 'm_notable_summon', x: 56, y: 105, type: 'notable', icon: 'mdi:creation', name: '奥术军团', effect: '可多召唤一只魔宠', cost: 3, connections: ['m_summon2'] },
    { id: 'm_keystone_summon', x: 50, y: 113, type: 'keystone', icon: 'mdi:robot', name: '魔像大师', effect: '魔宠死亡时爆炸，造成范围伤害', cost: 5, connections: ['m_notable_summon'], reqClass: 'archmage' }
  ]
},
  ranger: {
    nodes: [
      { id: 'r_start', x: 50, y: 85, type: 'small', icon: 'mdi:circle-outline', name: '猎手本能', effect: '狩猎之路', cost: 0, connections: [] },
      { id: 'r_spd1', x: 40, y: 78, type: 'small', icon: 'mdi:run-fast', name: '疾风', effect: '速度 +8%', cost: 1, connections: ['r_start'] },
      { id: 'r_spd2', x: 30, y: 72, type: 'small', icon: 'mdi:run-fast', name: '电光石火', effect: '速度 +8%', cost: 1, connections: ['r_spd1'] },
      { id: 'r_spd3', x: 20, y: 65, type: 'small', icon: 'mdi:weather-windy', name: '迅捷如风', effect: '速度 +10%', cost: 2, connections: ['r_spd2'] },
      { id: 'r_notable_spd', x: 12, y: 58, type: 'notable', icon: 'mdi:bow-arrow', name: '神射手', effect: '攻击 +20%<br/>暴击率 +10%', cost: 3, connections: ['r_spd3'] },
      { id: 'r_keystone_spd', x: 5, y: 50, type: 'keystone', icon: 'mdi:target', name: '弱点洞察', effect: '对满血敌人伤害+100%', cost: 5, connections: ['r_notable_spd'] },
      { id: 'r_dodge1', x: 60, y: 78, type: 'small', icon: 'mdi:shoe-print', name: '灵巧', effect: '闪避 +6%', cost: 1, connections: ['r_start'] },
      { id: 'r_dodge2', x: 70, y: 72, type: 'small', icon: 'mdi:shoe-print', name: '幻影步', effect: '闪避 +6%', cost: 1, connections: ['r_dodge1'] },
      { id: 'r_notable_dodge', x: 82, y: 65, type: 'notable', icon: 'mdi:ninja', name: '暗影步', effect: '闪避 +20%<br/>速度 +15%', cost: 2, connections: ['r_dodge2'] },
      { id: 'r_crit1', x: 50, y: 72, type: 'small', icon: 'mdi:target', name: '鹰眼', effect: '暴击率 +5%', cost: 1, connections: ['r_start'] },
      { id: 'r_crit2', x: 50, y: 62, type: 'small', icon: 'mdi:crosshairs', name: '致命射击', effect: '暴击伤害 +15%', cost: 1, connections: ['r_crit1'] },
      { id: 'r_keystone_crit', x: 50, y: 52, type: 'keystone', icon: 'mdi:flash-circle', name: '死亡标记', effect: '暴击使目标防御降低30%，持续2回合', cost: 5, connections: ['r_crit2'] }
    ]
  }
};