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
  poison: {}
};

export function getElementMultiplier(atkElem, defElem) {
  if (!atkElem || !defElem) return 1;
  return effectiveness[atkElem]?.[defElem] || 1;
}

export function calculateDamage(attacker, defender, skill, options = {}) {
    console.log('attacker effects:', attacker.effects);

    if (defender.isRaidBoss || defender.isRaidBoss === true) {
        console.log('🚫 暴力拦截：伤害归零！', defender.name)
        return { damage: 0, crit: false, multiplier: 1, shadowTrueDmg: 0, trueDmg: 0 }
    }

    const {
        ignoreDef = 0,
        fullHpDmg = 0,
        bossDmg = 0,
        lowHpDmg = 0,
        critDmgOnMark = 0,
        critForced = null
    } = options;

    // ========== 提取各种增益（必须在声明 effectiveAttack 之前） ==========
    let holyAnthem = null;
    if (attacker.effects) {
        holyAnthem = attacker.effects.find(e => e.type === 'holyAnthem');
    }

    let genericAtkBuff = 0;
    let genericCritDmgBuff = 0;
    if (attacker.effects) {
        for (const eff of attacker.effects) {
            if (eff.type === 'buff') {
                if (eff.stat === 'atk') {
                    genericAtkBuff += (eff.value || 0);
                } else if (eff.stat === 'critDmg') {
                    genericCritDmgBuff += (eff.value || 0);
                }
            }
        }
    }

    // ========== 声明并初始化 effectiveAttack、effectiveCritDmg ==========
    let effectiveAttack = attacker.attack;
    let effectiveCritDmg = attacker.critDmg || 150;

    // 应用通用攻击 buff（百分比）
    effectiveAttack = Math.floor(effectiveAttack * (1 + genericAtkBuff));

    // 应用神圣赞美诗攻击加成（基于原始攻击力）
    if (holyAnthem) {
        const atkPct = holyAnthem.atkPercent || 0;
        effectiveAttack += Math.floor(attacker.attack * atkPct / 100);
    }

    // 应用通用暴伤 buff（value 为小数，0.5 表示 +50%）
    effectiveCritDmg += genericCritDmgBuff * 100;

    // 应用神圣赞美诗暴伤加成
    if (holyAnthem) {
        const critPct = holyAnthem.critDmgPercent || 0;
        effectiveCritDmg += critPct;
    }

    const baseDamage = effectiveAttack * (skill.baseMul || 1);
    let elemBonus = 0;
    if (skill.element && attacker[skill.element + 'Dmg'] !== undefined) {
        elemBonus = attacker[skill.element + 'Dmg'] || 0;
    }

    // 暴击率处理
    let effectiveCritRate = attacker.critRate || 5;
    if (attacker.effects) {
        const critRateBuff = attacker.effects.find(e => e.type === 'critRateUp');
        if (critRateBuff) effectiveCritRate += (critRateBuff.value || 0);
    }

    if (attacker.halfHpCrit && defender.hp > defender.maxHp * 0.5) {
        effectiveCritRate += (attacker.halfHpCrit || 0);
        effectiveCritDmg += (attacker.halfHpCritDmg || 0);
    }

    if (critDmgOnMark && defender.effects?.some(e => e.type === 'shadowMark')) {
        effectiveCritDmg += critDmgOnMark;
    }

    const elemMult = getElementMultiplier(skill.element, defender.element);
    const crit = critForced ?? (Math.random() * 100 < effectiveCritRate);
    const critMult = crit ? effectiveCritDmg / 100 : 1;

    let damage = baseDamage * (1 + elemBonus / 100) * elemMult * critMult;

    const effectiveDef = defender.defense * (1 - ignoreDef / 100);
    const defRatio = effectiveDef / 3300;
    damage = Math.floor(damage * (1 - defRatio));
    damage = Math.max(1, Math.floor(damage - effectiveDef * 0.5));

    damage += (attacker.trueDmg || 0);

    if (fullHpDmg && defender.hp === defender.maxHp) {
        damage = Math.floor(damage * (1 + fullHpDmg / 100));
    }
    if (bossDmg && defender.isBoss) {
        damage = Math.floor(damage * (1 + bossDmg / 100));
    }

    // 碎冰等特殊处理
    if (attacker._pendingShatter && defender.effects?.some(e => e.type === 'freeze')) {
        damage = Math.floor(damage * (1 + attacker._pendingShatter));
        delete attacker._pendingShatter;
    }
    if (attacker._pendingFreezeBonus && defender.effects?.some(e => e.type === 'freeze')) {
        effectiveCritRate = 100;
        damage = Math.floor(damage * (1 + attacker._pendingFreezeBonus));
        delete attacker._pendingFreezeBonus;
    }
    if (attacker._pendingStunBonus && defender.effects?.some(e => e.type === 'stun')) {
        damage = Math.floor(damage * (1 + attacker._pendingStunBonus));
        delete attacker._pendingStunBonus;
    }
    if (attacker._pendingStunCrit && defender.effects?.some(e => e.type === 'stun')) {
        effectiveCritRate = 100;
        delete attacker._pendingStunCrit;
    }
    if (attacker._pendingExecutioner && defender.hpPercent < 0.3) {
        damage = Math.floor(damage * (1 + attacker._pendingExecutioner));
        delete attacker._pendingExecutioner;
    }
    if (attacker.fireStackBonus && defender.effects) {
        const burnEffect = defender.effects.find(e => e.type === 'burn');
        if (burnEffect) {
            const stacks = burnEffect.stacks || 1;
            damage = Math.floor(damage * (1 + (stacks - 1) * attacker.fireStackBonus));
        }
    }
    if (attacker.highHpBoost && defender.hpPercent !== undefined) {
        const hpPercent = defender.hpPercent;
        const aboveHalf = Math.max(0, hpPercent - 0.5);
        const boost = 1 + aboveHalf * attacker.highHpBoost * 2;
        damage = Math.floor(damage * boost);
    }
    if (lowHpDmg && defender.hpPercent < 0.3) {
        damage = Math.floor(damage * (1 + lowHpDmg / 100));
    }

    // 印记增伤
    if (defender.effects) {
        const holyMark = defender.effects.find(e => e.type === 'holyMark');
        if (holyMark && holyMark.value > 0) {
            damage = Math.floor(damage * (1 + holyMark.value));
        }
    }
    const dragonMark = defender.effects?.find(e => e.type === 'dragonMark');
    if (dragonMark && dragonMark.value > 0) {
        const stacks = dragonMark.stacks || 1;
        const expMultiplier = Math.pow(1.5, stacks - 1);
        damage = Math.floor(damage * (1 + dragonMark.value * expMultiplier));
    }

    let shadowTrueDmg = 0;
    const shadowMark = defender.effects?.find(e => e.type === 'shadowMark');
    if (shadowMark && shadowMark.value > 0) {
        const stacks = shadowMark.stacks || 1;
        const maxHpPercent = 0.01 * stacks * Math.pow(1.3, stacks - 1);
        if (defender.maxHp && defender.maxHp > 0) {
            shadowTrueDmg = Math.floor(defender.maxHp * maxHpPercent);
            damage += shadowTrueDmg;
        }
    }

    let trueDmg = 0;
    if (attacker.trueDmgPercent && damage > 0) {
        trueDmg = Math.floor(damage * attacker.trueDmgPercent / 100);
        damage += trueDmg;
    }

    const baseTrueDmg = attacker.trueDmg || 0;
    damage += baseTrueDmg;

    // 受击减伤
    if (defender.dmgTaken && defender.dmgTaken < 0) {
        damage = Math.floor(damage * (1 + defender.dmgTaken / 100));
    }

    return { damage: Math.floor(Math.max(0, damage)), crit, multiplier: elemMult, shadowTrueDmg, trueDmg: baseTrueDmg };
}