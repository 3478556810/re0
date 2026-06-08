// src/components/class/classData.js

export const CLASS_DEFS = {
  wanderer: { id: 'wanderer', name: '流浪者', icon: 'mdi:account', desc: '初始职业', tier: 0, parent: null, mechanism: null },
  warrior:   { id: 'warrior', name: '战士', icon: 'mdi:sword-cross', desc: '近战攻守兼备', tier: 1, parent: 'wanderer', reqLevel: 1, mechanism: 'toughness' },
  mage:      { id: 'mage', name: '法师', icon: 'mdi:magic-staff', desc: '元素与奥术大师', tier: 1, parent: 'wanderer', reqLevel: 1, mechanism: 'mana_flow' },
  ranger:    { id: 'ranger', name: '游侠', icon: 'mdi:bow-arrow', desc: '敏捷的远程猎手', tier: 1, parent: 'wanderer', reqLevel: 1, mechanism: 'swift_strike' },
  berserker: { id: 'berserker', name: '狂战士', icon: 'mdi:axe-battle', desc: '血怒狂暴', tier: 2, parent: 'warrior', reqLevel: 15, mechanism: 'blood_rage' },
  paladin:   { id: 'paladin', name: '圣骑士', icon: 'mdi:shield-cross', desc: '神圣守护', tier: 2, parent: 'warrior', reqLevel: 15, mechanism: 'holy_aura' },
  archmage:  { id: 'archmage', name: '大魔导', icon: 'mdi:fire-circle', desc: '元素掌控者', tier: 2, parent: 'mage', reqLevel: 15, mechanism: 'elemental_mastery' },
  elemental: { id: 'elemental', name: '元素使', icon: 'mdi:creation', desc: '混乱元素', tier: 2, parent: 'mage', reqLevel: 15, mechanism: 'elemental_overload' },
  sniper:    { id: 'sniper', name: '神射手', icon: 'mdi:target', desc: '一击必杀', tier: 2, parent: 'ranger', reqLevel: 15, mechanism: 'weakness_sniping' },
  shadow:    { id: 'shadow', name: '暗影猎手', icon: 'mdi:ninja', desc: '暗影收割', tier: 2, parent: 'ranger', reqLevel: 15, mechanism: 'assassination' },
  // 在 CLASS_DEFS 中修改 oracle
oracle: {
  id: 'oracle',
  name: '织光者',
  icon: 'majesticons:shooting-star-line',
  desc: '放弃攻击，全心守护。每一个治疗都能让伙伴变得更强',
  tier: 1,          // 从 2 改为 1
  parent: 'wanderer',  // 从 'mage' 改为 'wanderer'
  reqLevel: 1,       // 从 25 改为 10
  mechanism: 'soul_link'
},
seer: {
  id: 'seer',
  name: '神谕者',
  icon: 'mdi:star-shooting',
  desc: '聆听神谕，以圣光之名赋予伙伴无上之力。',
  tier: 2,
  parent: 'oracle',
  reqLevel: 15,
  mechanism: 'divine_inspiration'
}
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
    // 起点
    { id: 'm_start', x: 50, y: 85, type: 'small', icon: 'mdi:circle-outline', name: '奥术起源', effect: '魔法之路', cost: 0, connections: [] },

    // 元素强化路线（数值翻倍）
    { id: 'm_ele1', x: 44, y: 78, type: 'small', icon: 'mdi:fire', name: '元素亲和', effect: '元素伤害 +15%', cost: 1, connections: ['m_start'] },
    { id: 'm_ele2', x: 38, y: 71, type: 'small', icon: 'mdi:water', name: '元素精通', effect: '元素伤害 +15%', cost: 1, connections: ['m_ele1'] },
    { id: 'm_ele3', x: 32, y: 63, type: 'small', icon: 'mdi:lightning-bolt', name: '元素过载', effect: '元素伤害 +25%', cost: 2, connections: ['m_ele2'] },
    { id: 'm_ele4', x: 26, y: 55, type: 'small', icon: 'mdi:creation', name: '元素共鸣', effect: '元素伤害 +20%', cost: 2, connections: ['m_ele3'] },
    { id: 'm_notable_ele', x: 18, y: 47, type: 'notable', icon: 'mdi:magic-staff', name: '大魔导之印', effect: '元素伤害 +60%<br/>最大MP +20%', cost: 3, connections: ['m_ele4'] },
    { id: 'm_keystone_ele', x: 10, y: 39, type: 'keystone', icon: 'mdi:creation', name: '元素主宰', effect: '攻击力 +20%<br/>元素伤害 +50%', cost: 5, connections: ['m_notable_ele'], reqClass: 'archmage' },
    { id: 'm_ele_overload', x: 14, y: 31, type: 'small', icon: 'mdi:flash', name: '过载增幅', effect: '元素伤害 +30%', cost: 2, connections: ['m_keystone_ele'], reqClass: 'archmage' },
    { id: 'm_ele_overload2', x: 20, y: 25, type: 'notable', icon: 'mdi:flash-triangle', name: '元素崩解', effect: '元素伤害 +45%', cost: 4, connections: ['m_ele_overload'], reqClass: 'archmage' },

    // 法力与续航
    { id: 'm_mp1', x: 56, y: 78, type: 'small', icon: 'mdi:water', name: '冥想', effect: '最大MP +15%', cost: 1, connections: ['m_start'] },
    { id: 'm_mp2', x: 62, y: 71, type: 'small', icon: 'mdi:water', name: '启迪', effect: '最大MP +15%', cost: 1, connections: ['m_mp1'] },
    { id: 'm_mp3', x: 68, y: 63, type: 'small', icon: 'mdi:brain', name: '清醒', effect: 'MP消耗 -10%', cost: 1, connections: ['m_mp2'] },
    { id: 'm_notable_mp', x: 76, y: 55, type: 'notable', icon: 'mdi:brain', name: '智慧之源', effect: '最大MP +40%<br/>MP消耗 -20%', cost: 3, connections: ['m_mp3'] },
    { id: 'm_mp_keystone', x: 84, y: 47, type: 'keystone', icon: 'mdi:brain-freeze', name: '奥术风暴', effect: '最大MP +35%<br/>MP消耗 -20%', cost: 5, connections: ['m_notable_mp'], reqClass: 'archmage' },
    { id: 'm_mp_surge', x: 80, y: 39, type: 'notable', icon: 'mdi:pulse', name: '法力涌动', effect: '最大MP +30%', cost: 3, connections: ['m_mp_keystone'], reqClass: 'archmage' },

    // 暴击强化（对标宝石）
    { id: 'm_crit1', x: 48, y: 76, type: 'small', icon: 'mdi:target', name: '奥术精准', effect: '暴击率 +10%', cost: 1, connections: ['m_start'] },
    { id: 'm_crit2', x: 46, y: 68, type: 'small', icon: 'mdi:target', name: '法术暴击', effect: '暴击率 +10%', cost: 1, connections: ['m_crit1'] },
    { id: 'm_crit3', x: 42, y: 60, type: 'small', icon: 'mdi:flash-circle', name: '致命法术', effect: '暴击伤害 +40%', cost: 2, connections: ['m_crit2'] },
    { id: 'm_notable_crit', x: 38, y: 52, type: 'notable', icon: 'mdi:star-circle', name: '奥术升华', effect: '暴击伤害 +100%<br/>暴击率 +15%', cost: 3, connections: ['m_crit3'] },
    { id: 'm_keystone_crit', x: 34, y: 44, type: 'keystone', icon: 'mdi:creation', name: '完美施法', effect: '暴击伤害 +200%', cost: 5, connections: ['m_notable_crit'], reqClass: 'archmage' },
    { id: 'm_crit_mastery', x: 30, y: 38, type: 'notable', icon: 'mdi:magic-staff', name: '法术穿心', effect: '暴击伤害 +150%', cost: 4, connections: ['m_keystone_crit'], reqClass: 'archmage' },

    // 生存与防御
    { id: 'm_def1', x: 44, y: 92, type: 'small', icon: 'mdi:shield', name: '魔法护盾', effect: '防御 +15%', cost: 1, connections: ['m_start'] },
    { id: 'm_def2', x: 38, y: 98, type: 'small', icon: 'mdi:shield-star', name: '元素之盾', effect: '最大HP +15%', cost: 2, connections: ['m_def1'] },
    { id: 'm_def_notable', x: 32, y: 105, type: 'notable', icon: 'mdi:shield-cross', name: '水晶屏障', effect: '最大HP +30%<br/>防御 +25%', cost: 3, connections: ['m_def2'] },
    { id: 'm_keystone_def', x: 26, y: 113, type: 'keystone', icon: 'mdi:shield-moon', name: '奥术之躯', effect: '最大HP +40%<br/>防御 +35%', cost: 5, connections: ['m_def_notable'], reqClass: 'archmage' },
    { id: 'm_def_regen', x: 32, y: 120, type: 'small', icon: 'mdi:heart-pulse', name: '再生魔印', effect: '最大HP +20%', cost: 2, connections: ['m_keystone_def'], reqClass: 'archmage' }
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
  },
  oracle: {
  nodes: [
    // 起点
    { id: 'o_start', x: 50, y: 85, type: 'small', icon: 'mdi:circle-outline', name: '织光之源', effect: '治愈之路', cost: 0, connections: [] },

    // ========== 左路：伙伴强化（织光者基础） ==========
    { id: 'o_companion1', x: 42, y: 78, type: 'small', icon: 'mdi:account-heart', name: '灵魂羁绊', effect: '伙伴继承属性 +10%', cost: 1, connections: ['o_start'] },
    { id: 'o_companion2', x: 34, y: 72, type: 'small', icon: 'mdi:account-heart', name: '灵魂共鸣', effect: '伙伴攻击力 +10%', cost: 1, connections: ['o_companion1'] },
    { id: 'o_companion3', x: 26, y: 65, type: 'small', icon: 'mdi:account-heart', name: '灵魂同调', effect: '伙伴暴击伤害 +15%', cost: 2, connections: ['o_companion2'] },
    { id: 'o_life_convert', x: 18, y: 58, type: 'notable', icon: 'mdi:heart', name: '生命转化', effect: '每500点生命值<br/>伙伴攻击力 +2%', cost: 3, connections: ['o_companion3'] },
    { id: 'o_def_convert', x: 12, y: 52, type: 'notable', icon: 'mdi:shield', name: '钢铁意志', effect: '每300点防御值<br/>伙伴暴击伤害 +3%', cost: 3, connections: ['o_life_convert'] },
   { id: 'o_keystone_link', x: 5, y: 44, type: 'keystone', icon: 'mdi:link', name: '灵魂链接', effect: '伙伴额外继承玩家<br/>40% 攻击/防御/生命', cost: 5, connections: ['o_def_convert'] },
    // ========== 左路延伸：神谕者专属伙伴强化 ==========
    { id: 's_companion4', x: 30, y: 42, type: 'small', icon: 'mdi:account-heart', name: '圣约', effect: '伙伴继承属性 +15%', cost: 1, connections: ['o_keystone_link'], reqClass: 'seer' },
    { id: 's_companion5', x: 22, y: 36, type: 'small', icon: 'mdi:account-heart', name: '圣灵共鸣', effect: '伙伴攻击力 +15%', cost: 1, connections: ['s_companion4'], reqClass: 'seer' },
    { id: 's_companion6', x: 14, y: 30, type: 'small', icon: 'mdi:account-heart', name: '圣灵同调', effect: '伙伴暴击伤害 +20%', cost: 2, connections: ['s_companion5'], reqClass: 'seer' },
    { id: 's_notable_life', x: 8, y: 24, type: 'notable', icon: 'mdi:heart', name: '生命礼赞', effect: '每500点生命值<br/>伙伴攻击力 +3%', cost: 3, connections: ['s_companion6'], reqClass: 'seer' },
    { id: 's_notable_steel', x: 2, y: 18, type: 'notable', icon: 'mdi:shield', name: '钢铁圣歌', effect: '每300点防御值<br/>伙伴暴击伤害 +4%', cost: 3, connections: ['s_notable_life'], reqClass: 'seer' },
   { id: 's_keystone_link', x: -4, y: 12, type: 'keystone', icon: 'mdi:link', name: '灵魂共鸣', effect: '伙伴额外继承玩家<br/>80% 攻击/防御/生命', cost: 5, connections: ['s_notable_steel'], reqClass: 'seer' },

    // ========== 右路：治疗强化（织光者基础） ==========
    { id: 'o_heal1', x: 58, y: 78, type: 'small', icon: 'mdi:heart', name: '治愈之光', effect: '治疗效果 +12%', cost: 1, connections: ['o_start'] },
    { id: 'o_heal2', x: 66, y: 72, type: 'small', icon: 'mdi:heart', name: '温暖之光', effect: '治疗效果 +12%', cost: 1, connections: ['o_heal1'] },
    { id: 'o_heal3', x: 74, y: 65, type: 'small', icon: 'mdi:heart', name: '守护之光', effect: '治疗时额外附加护盾', cost: 2, connections: ['o_heal2'] },
    { id: 'o_notable_heal', x: 82, y: 58, type: 'notable', icon: 'mdi:heart-pulse', name: '圣光灌注', effect: '治疗时目标获得<br/>攻击力 +40%<br/>暴击伤害 +100%', cost: 3, connections: ['o_heal3'] },
    { id: 'o_keystone_heal', x: 90, y: 50, type: 'keystone', icon: 'mdi:brightness-5', name: '生命之泉', effect: '每回合自动治疗<br/>血量最低的友方', cost: 5, connections: ['o_notable_heal'] },

    // ========== 右路延伸：神谕者专属治疗与增益 ==========
    { id: 's_heal4', x: 70, y: 42, type: 'small', icon: 'mdi:heart', name: '治愈祷言', effect: '治疗效果 +15%', cost: 1, connections: ['o_keystone_heal'], reqClass: 'seer' },
    { id: 's_heal5', x: 78, y: 36, type: 'small', icon: 'mdi:heart', name: '光明礼赞', effect: '治疗效果 +15%', cost: 1, connections: ['s_heal4'], reqClass: 'seer' },
    { id: 's_heal6', x: 86, y: 30, type: 'small', icon: 'mdi:heart', name: '圣佑术', effect: '治疗时附加护盾', cost: 2, connections: ['s_heal5'], reqClass: 'seer' },
    { id: 's_notable_heal', x: 92, y: 24, type: 'notable', icon: 'mdi:heart-pulse', name: '神圣赞美诗', effect: '治疗时目标获得<br/>攻击力 +50%<br/>暴击伤害 +120%', cost: 3, connections: ['s_heal6'], reqClass: 'seer' },
    { id: 's_keystone_heal', x: 98, y: 18, type: 'keystone', icon: 'mdi:brightness-5', name: '天赐恩典', effect: '每回合自动治疗<br/>血量最低的友方<br/>并附加神圣赞美诗效果', cost: 5, connections: ['s_notable_heal'], reqClass: 'seer' },
{ id: 's_exp_boost', x: 50, y: 48, type: 'notable', icon: 'mdi:star-circle', name: '灵魂导师', effect: '伙伴获得的经验翻倍', cost: 3, connections: ['s_hp3'], reqClass: 'seer' },
    // ========== 中路：生存与续航（织光者基础） ==========
    { id: 'o_hp1', x: 50, y: 76, type: 'small', icon: 'mdi:shield', name: '坚韧信仰', effect: '最大HP +10%', cost: 1, connections: ['o_start'] },
    { id: 'o_hp2', x: 50, y: 68, type: 'small', icon: 'mdi:shield', name: '不屈信仰', effect: '最大HP +10%', cost: 1, connections: ['o_hp1'] },
    { id: 'o_notable_hp', x: 50, y: 60, type: 'notable', icon: 'mdi:shield-star', name: '圣光护体', effect: '防御力 +20%<br/>受击时回复 5% HP', cost: 3, connections: ['o_hp2'] },

    // ========== 中路延伸：神谕者专属防御 ==========
    { id: 's_hp3', x: 50, y: 52, type: 'small', icon: 'mdi:shield', name: '虔诚信仰', effect: '最大HP +12%', cost: 1, connections: ['o_notable_hp'], reqClass: 'seer' },
    { id: 's_hp4', x: 50, y: 44, type: 'small', icon: 'mdi:shield', name: '神圣加护', effect: '最大HP +12%', cost: 1, connections: ['s_hp3'], reqClass: 'seer' },
    { id: 's_notable_hp', x: 50, y: 36, type: 'notable', icon: 'mdi:shield-star', name: '圣光屏障', effect: '防御力 +25%<br/>受击时回复 6% HP', cost: 3, connections: ['s_hp4'], reqClass: 'seer' },

    // ========== 下路：MP续航（织光者基础） ==========
    { id: 'o_mp1', x: 44, y: 92, type: 'small', icon: 'mdi:water', name: '祈愿', effect: '最大MP +15%', cost: 1, connections: ['o_start'] },
    { id: 'o_mp2', x: 38, y: 98, type: 'small', icon: 'mdi:water', name: '神恩', effect: 'MP消耗 -10%', cost: 1, connections: ['o_mp1'] },
    { id: 'o_notable_mp', x: 32, y: 104, type: 'notable', icon: 'mdi:brain', name: '智慧之泉', effect: '最大MP +30%<br/>治疗时回复 3% MP', cost: 2, connections: ['o_mp2'] },

    // ========== 下路延伸：神谕者专属MP与光环 ==========
    { id: 's_mp3', x: 24, y: 98, type: 'small', icon: 'mdi:water', name: '虔诚祈祷', effect: '最大MP +18%', cost: 1, connections: ['o_notable_mp'], reqClass: 'seer' },
    { id: 's_mp4', x: 18, y: 104, type: 'small', icon: 'mdi:water', name: '圣光灌注', effect: 'MP消耗 -12%', cost: 1, connections: ['s_mp3'], reqClass: 'seer' },
    { id: 's_notable_mp', x: 12, y: 110, type: 'notable', icon: 'mdi:brain', name: '神启', effect: '最大MP +35%<br/>治疗时回复 4% MP', cost: 2, connections: ['s_mp4'], reqClass: 'seer' },

    // ========== 新增：上方光环路线（神谕者专属） ==========
    { id: 's_aura1', x: 50, y: 40, type: 'small', icon: 'mdi:brightness-7', name: '圣光光环', effect: '全队攻击力 +8%', cost: 2, connections: ['o_notable_hp'], reqClass: 'seer' },
    { id: 's_aura2', x: 50, y: 32, type: 'small', icon: 'mdi:brightness-7', name: '勇气光环', effect: '全队防御力 +10%', cost: 2, connections: ['s_aura1'], reqClass: 'seer' },
    { id: 's_notable_aura', x: 50, y: 24, type: 'notable', icon: 'mdi:brightness-5', name: '天佑光环', effect: '全队伤害提升12%<br/>受击伤害降低8%', cost: 4, connections: ['s_aura2'], reqClass: 'seer' }
  ]
}
};