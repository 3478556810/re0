export const EFFECT_TYPES = {
  DOT: 'dot',
  HOT: 'hot',
  ATK_UP: 'atkUp',
  DEF_UP: 'defUp',
  SPD_UP: 'spdUp',
  ATK_DOWN: 'atkDown',
  DEF_DOWN: 'defDown',
  SPD_DOWN: 'spdDown',
  REFLECT: 'reflect',           // ← 新增
  SHIELD: 'shield',
  STUN: 'stun',
  MAXHP_UP: 'maxHpUp',          // ← 新增
  DODGE_UP: 'dodgeUp',          // ← 新增
  TRUE_DMG: 'trueDmg',           // ← 新增
  SILENCE: 'silence',
  REFLECT: 'reflect',
      // ... 其他效果类型 ...
  CRIT_UP: 'critRateUp',
  CRIT_DOWN: 'critDown',
  // 新增
  FREEZE: 'freeze',        // 冻结：无法行动，受到物理攻击时额外伤害
  BLEED: 'bleed',          // 流血：每回合损失固定比例生命
  TAUNT: 'taunt',          // 嘲讽：强制敌人攻击自己
  WEAK: 'weak',            // 虚弱：造成的伤害降低
  REGEN: 'regen',          // 再生：每回合恢复固定生命
  LIFESTEAL_BUFF: 'lifestealBuff',  // 吸血强化：攻击时额外吸血
   HOLY_MARK: 'holyMark',
   DRAGON_MARK: 'dragonMark',
SHADOW_MARK: 'shadowMark',
BURN: 'burn',
  holyAnthem: 'holyAnthem',
};

export const effectDefaults = {
  [EFFECT_TYPES.BURN]: { duration: 3, stackable: true, maxStacks: 5, value: 0.2 },
   [EFFECT_TYPES.DOT]: { duration: 3, stackable: true, maxStacks: 99, value: 0.15 },
  [EFFECT_TYPES.HOT]: { duration: 3, stackable: false, value: 0.1 },
  [EFFECT_TYPES.ATK_UP]: { duration: 3, stackable: false, value: 0.2 },
  [EFFECT_TYPES.DEF_UP]: { duration: 3, stackable: false, value: 0.2 },
  [EFFECT_TYPES.SPD_UP]: { duration: 3, stackable: false, value: 0.15 },
  [EFFECT_TYPES.ATK_DOWN]: { duration: 2, stackable: false, value: -0.2 },
  [EFFECT_TYPES.DEF_DOWN]: { duration: 2, stackable: false, value: -0.2 },
  [EFFECT_TYPES.SPD_DOWN]: { duration: 2, stackable: false, value: -0.15 },
  [EFFECT_TYPES.CRIT_UP]: { duration: 3, stackable: false, value: 0.1 },
  [EFFECT_TYPES.CRIT_DOWN]: { duration: 2, stackable: false, value: -0.1 },
  [EFFECT_TYPES.SHIELD]: { duration: 3, stackable: false, value: 0 },
  [EFFECT_TYPES.STUN]: { duration: 1, stackable: false },
  [EFFECT_TYPES.SILENCE]: { duration: 2, stackable: false },
  [EFFECT_TYPES.REFLECT]: { duration: 3, stackable: false, value: 0.2 },

 
  [EFFECT_TYPES.FREEZE]: { duration: 1, stackable: false },
  [EFFECT_TYPES.BLEED]: { duration: 3, stackable: true, maxStacks: 5, value: 0.05 },
  [EFFECT_TYPES.TAUNT]: { duration: 2, stackable: false },
  [EFFECT_TYPES.WEAK]: { duration: 2, stackable: false, value: -0.3 },
  [EFFECT_TYPES.REGEN]: { duration: 3, stackable: false, value: 0.08 },
  [EFFECT_TYPES.LIFESTEAL_BUFF]: { duration: 3, stackable: false, value: 0.15 },

};

export function isBuff(type) {
  return [EFFECT_TYPES.HOT, EFFECT_TYPES.ATK_UP, EFFECT_TYPES.DEF_UP,
    EFFECT_TYPES.SPD_UP, EFFECT_TYPES.CRIT_UP, EFFECT_TYPES.SHIELD].includes(type);
}