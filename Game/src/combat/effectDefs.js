export const EFFECT_TYPES = {
  DOT: 'dot',
  HOT: 'hot',
  ATK_UP: 'atkUp',
  DEF_UP: 'defUp',
  SPD_UP: 'spdUp',
  ATK_DOWN: 'atkDown',
  DEF_DOWN: 'defDown',
  SPD_DOWN: 'spdDown',
  CRIT_UP: 'critUp',
  CRIT_DOWN: 'critDown',
  SHIELD: 'shield',
  STUN: 'stun',
  SILENCE: 'silence',
  REFLECT: 'reflect',
};

export const effectDefaults = {
  [EFFECT_TYPES.DOT]: { duration: 3, stackable: true, maxStacks: 3, value: 0.15 },
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
};

export function isBuff(type) {
  return [EFFECT_TYPES.HOT, EFFECT_TYPES.ATK_UP, EFFECT_TYPES.DEF_UP,
    EFFECT_TYPES.SPD_UP, EFFECT_TYPES.CRIT_UP, EFFECT_TYPES.SHIELD].includes(type);
}