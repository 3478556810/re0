const effectiveness = {
  fire: { grass: 2, ice: 1.5, water: 0.5, fire: 0.5 },
  water: { fire: 2, rock: 2, grass: 0.5, water: 0.5 },
  thunder: { water: 2, wind: 2, grass: 0.5, thunder: 0.5 },
  wind: { grass: 2, rock: 0.5, ice: 1.5, wind: 0.5 },
  grass: { water: 2, rock: 2, fire: 0.5, grass: 0.5 },
  ice: { grass: 1.5, wind: 1.5, fire: 0.5, ice: 0.5 },
  holy: { dark: 2, holy: 0.5 },
  dark: { holy: 2, dark: 0.5 },
  rock: { fire: 2, ice: 1.5, grass: 0.5, rock: 0.5 },
  steel: { ice: 2, rock: 1.5, fire: 0.5, steel: 0.5 },
};

export function getElementMultiplier(atkElem, defElem) {
  if (!atkElem || !defElem) return 1;
  return effectiveness[atkElem]?.[defElem] || 1;
}

export function calculateDamage(attacker, defender, skill, options = {}) {
  const {
    ignoreDef = 0,
    fullHpDmg = 0,
    bossDmg = 0,
    lowHpDmg = 0,            // ← 从 options 解构低血量增伤
    critDmgOnMark = 0,        // ← 从 options 解构印记暴伤
    critForced = null
  } = options;

  const baseDamage = attacker.attack * (skill.baseMul || 1);
  let elemBonus = 0;
  if (skill.element && attacker[skill.element + 'Dmg'] !== undefined) {
    elemBonus = attacker[skill.element + 'Dmg'] || 0;
  }

  // 基础暴击率和暴伤
  let effectiveCritRate = attacker.critRate || 5;
  let effectiveCritDmg = attacker.critDmg || 150;

  // 从攻击者身上的效果中读取暴击增益
  if (attacker.effects) {
    const critRateBuff = attacker.effects.find(e => e.type === 'critRateUp');
    if (critRateBuff) {
      effectiveCritRate += (critRateBuff.value || 0);
    }
    const critDmgBuff = attacker.effects.find(e => e.type === 'critDmgUp');
    if (critDmgBuff) {
      effectiveCritDmg += (critDmgBuff.value || 0);
    }
  }

  // 奇袭大师：对半血以上敌人增加暴率和暴伤
  if (attacker.halfHpCrit && defender.hp > defender.maxHp * 0.5) {
    effectiveCritRate += (attacker.halfHpCrit || 0);
    effectiveCritDmg += (attacker.halfHpCritDmg || 0);
  }

  // 对印记目标额外暴伤
  if (critDmgOnMark && defender.effects?.some(e => e.type === 'holyMark')) {
    effectiveCritDmg += critDmgOnMark;
  }

  const elemMult = getElementMultiplier(skill.element, defender.element);
  const crit = critForced ?? (Math.random() * 100 < effectiveCritRate);
  const critMult = crit ? effectiveCritDmg / 100 : 1;

  // 计算伤害（含暴击）
  let damage = baseDamage * (1 + elemBonus / 100) * elemMult * critMult;

  // 无视防御
  const effectiveDef = defender.defense * (1 - ignoreDef / 100);
  damage = Math.max(1, Math.floor(damage - effectiveDef * 0.5));

  // 真伤
  damage += (attacker.trueDmg || 0);

  // 满血增伤
  if (fullHpDmg && defender.hp === defender.maxHp) {
    damage = Math.floor(damage * (1 + fullHpDmg / 100));
  }

  // Boss增伤
  if (bossDmg && defender.isBoss) {
    damage = Math.floor(damage * (1 + bossDmg / 100));
  }

  // 低血量增伤（目标生命低于30%）
  if (lowHpDmg && defender.hpPercent < 0.3) {
    damage = Math.floor(damage * (1 + lowHpDmg / 100));
  }

  // 光之烙印增伤
  if (defender.effects) {
    const holyMark = defender.effects.find(e => e.type === 'holyMark');
    if (holyMark && holyMark.value > 0) {
      damage = Math.floor(damage * (1 + holyMark.value));
    }
  }  
  
  
  
    let trueDmg = 0;
  // 巫毒娃娃：伤害百分比转为真伤
  if (attacker.trueDmgPercent && damage > 0) {
    trueDmg = Math.floor(damage * attacker.trueDmgPercent / 100);
    damage += trueDmg;
  }

  return { damage: Math.max(0, damage), crit, multiplier: elemMult, trueDmg };
}