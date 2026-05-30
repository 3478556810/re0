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
  const baseDamage = attacker.attack * (skill.baseMul || 1);
  let elemBonus = 0;
  if (skill.element && attacker[skill.element + 'Dmg'] !== undefined) {
    elemBonus = attacker[skill.element + 'Dmg'] || 0;
  }
  const elemMult = getElementMultiplier(skill.element, defender.element);
  const crit = options.critForced ?? (Math.random() * 100 < (attacker.critRate || 5));
  const critMult = crit ? (attacker.critDmg || 150) / 100 : 1;

  let damage = baseDamage * (1 + elemBonus / 100) * elemMult * critMult;
  damage = Math.max(1, Math.floor(damage - defender.defense * 0.5));
  damage += (attacker.trueDmg || 0);
  return { damage: Math.max(0, damage), crit, multiplier: elemMult };
}