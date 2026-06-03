import { EFFECT_TYPES } from './effectDefs'

export class UnitState {
  constructor(baseStats, isPlayer = false) {
    this.isCompanion = baseStats.isCompanion || false
    this.id = baseStats.id || 'unit'
    this.name = baseStats.name || ''
    this.isPlayer = isPlayer
    this.isBoss = baseStats.isBoss || false
    this.traits = baseStats.traits || []
    if (typeof baseStats.trait === 'string' && baseStats.trait) {
      this.traits.push(baseStats.trait)
    }
    this.hasRevived = false
    this.enrageTurn = baseStats.enrageTurn || 0
    this.isEnraged = false
this.dmgTaken = baseStats.dmgTaken || 0;
    this.attack = baseStats.attack || baseStats.atk || 10
    this.baseAttack = this.attack   // 用于肾上腺素等百分比计算
    this.defense = baseStats.defense || baseStats.def || 5
    this.speed = baseStats.speed || 10
    this.critRate = baseStats.critRate || 5
    this.critDmg = baseStats.critDmg || 150
    this.trueDmg = baseStats.trueDmg || 0
    this.icon = baseStats.icon || 'mdi:help-circle'
    this.hp = baseStats.hp ?? baseStats.maxHp
    this.maxHp = baseStats.maxHp || 100
    this.mp = baseStats.mp ?? baseStats.maxMp
    this.maxMp = baseStats.maxMp || 30
    this.level = baseStats.level || 1
    this.element = baseStats.element || ''
this.deathSave = baseStats.deathSave || 0;
this.deathShield = baseStats.deathShield || 0;
this.reviveChance = baseStats.reviveChance || 0;
this.reviveCD = baseStats.reviveCD || 0;
this.reviveDmg = baseStats.reviveDmg || 0;
this._reviveCooldown = 0;
this._reviveUsedThisBattle = false;
    this.lifesteal = baseStats.lifesteal || 0
    this.mpLifesteal = baseStats.mpLifesteal || 0

    this.elemDmg = {}
    const elems = ['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel']
    elems.forEach(e => { this.elemDmg[e] = baseStats[e + 'Dmg'] || 0 })

    this.effects = []

    this.skills = []
    if (!isPlayer && baseStats.skillsText) {
      try {
        const parsed = typeof baseStats.skillsText === 'string'
          ? JSON.parse(baseStats.skillsText)
          : baseStats.skillsText
        this.skills = Array.isArray(parsed) ? parsed : []
      } catch (e) {
        console.warn('解析怪物技能失败:', baseStats.skillsText, e)
        this.skills = []
      }
    }

    this.base = { ...baseStats }
    this.isCompanion = baseStats.isCompanion || false

    // 特殊词条字段
 // 特殊词条字段
const specialFields = [
  'specialBossDmg',
  'specialFullHpDmg',
  'specialIgnoreDef',
  'specialLifestealPercent',
  'specialMpLifestealPercent',
    'mpOnHit',       // ← 新增：法力共鸣·伤害回蓝
  'mpOnKill',       // ← 新增：法力共鸣·击杀回蓝
  'specialLowHpDmg',        // 新增
  'holyMarkOnHit',          // 新增
  'lowHpLifestealOnMark',   // 新增
  'critDmgOnMark'           // 新增
];
specialFields.forEach(field => {
  this[field] = baseStats[field] || 0;
});
    this.stackingAtk = baseStats.stackingAtk || 0
    this._adrenalineStacks = 0
    this._tenacityTriggered = false   // 顽强词条触发器
  }

  getEffectiveAttack() {
    let atk = this.attack
    this.effects.forEach(eff => {
      if (eff.type === EFFECT_TYPES.ATK_UP) atk *= (1 + eff.value)
      else if (eff.type === EFFECT_TYPES.ATK_DOWN) atk *= (1 + eff.value)
      else if (eff.type === EFFECT_TYPES.WEAK) atk *= (1 + eff.value)
    })
    return Math.max(1, Math.floor(atk))
  }

  getEffectiveDefense() {
    let def = this.defense
    this.effects.forEach(eff => {
      if (eff.type === EFFECT_TYPES.DEF_UP) def *= (1 + eff.value)
      else if (eff.type === EFFECT_TYPES.DEF_DOWN) def *= (1 + eff.value)
    })
    return Math.max(0, Math.floor(def))
  }

  isStunned() {
    return this.effects.some(e => e.type === EFFECT_TYPES.STUN || e.type === EFFECT_TYPES.FREEZE)
  }

  isSilenced() {
    return this.effects.some(e => e.type === EFFECT_TYPES.SILENCE)
  }

  getShield() {
    let shield = 0
    this.effects.forEach(e => { if (e.type === EFFECT_TYPES.SHIELD) shield += e.value })
    return shield
  }

addEffect(effectDef) {
  const { type, duration, value, stackable, maxStacks, noRefresh } = effectDef;

  // 查找是否已存在同类型效果
  const existing = this.effects.find(e => e.type === type);

  if (existing && noRefresh) return false;

  if (existing) {
    if (stackable) {
      // 叠加型效果：增加层数，但不超过上限
      if (existing.stacks < (maxStacks || 99)) {
        existing.stacks += 1;
      }
      // 刷新持续时间
      existing.duration = duration;
      // ✅ 对于护盾，新值直接累加
      if (type === EFFECT_TYPES.SHIELD) {
        existing.value += value;
      } else {
        existing.value = value || existing.value;
      }
      return true;
    } else {
      // 非叠加型效果：先移除旧的
      this.removeEffect(type);
      // 然后往下走，添加新的
    }
  }

  // 添加全新效果
  this.effects.push({
    type,
    duration: duration || 0,
    value: value || 0,
    stacks: 1,
    noRefresh: !!noRefresh,
  });
  return true;
}

  removeEffect(type) {
    this.effects = this.effects.filter(e => e.type !== type)
  }

  onTurnEnd() {
    if (this._reviveCooldown > 0) this._reviveCooldown--;
    // 再生
    this.effects.filter(e => e.type === EFFECT_TYPES.REGEN).forEach(e => {
      const heal = Math.floor(this.maxHp * (e.value || 0.08))
      this.hp = Math.min(this.maxHp, this.hp + heal)
    })

    // 流血
    this.effects.filter(e => e.type === EFFECT_TYPES.BLEED).forEach(e => {
      const dmg = Math.floor(this.maxHp * (e.value || 0.05))
      this.hp -= dmg
      if (this.hp < 0) this.hp = 0
    })

    // ✅ 中毒 / DOT：每层独立造成一次伤害，层数越高总伤害越高
// ✅ 中毒伤害 = 单层伤害 × (2 ^ (层数 - 1))
// ✅ 中毒伤害指数增长：单层伤害 × 2^(层数-1)
// ✅ 中毒伤害指数增长
// ✅ DOT 结算：如果敌人死亡，立即通知引擎
this.effects.filter(e => e.type === EFFECT_TYPES.DOT).forEach(e => {
  const totalDmg = (e.value || 0) * (e.stacks || 1);  // 线性叠加
  this.hp -= totalDmg;
  if (this.hp < 0) this.hp = 0;
});

    // 减少持续回合
    this.effects.forEach(e => e.duration--)
    this.effects = this.effects.filter(e => e.duration > 0)
  }

  takeDamage(rawDamage, attacker) {

 // ✅ 怨恨：受到伤害增加
  if (this.dmgTaken && this.dmgTaken > 0) {
    rawDamage = Math.floor(rawDamage * (1 + this.dmgTaken / 100));
  }

    // 冻结额外伤害
    if (this.effects.some(e => e.type === EFFECT_TYPES.FREEZE) && attacker) {
      rawDamage = Math.floor(rawDamage * 1.3)
      this.removeEffect(EFFECT_TYPES.FREEZE)
    }

    // ✅ 顽强词条：低血量自动护盾
    if (this.specialLowHpShield && !this._tenacityTriggered && this.hp / this.maxHp <= 0.5) {
      this._tenacityTriggered = true
      const shieldValue = Math.floor(this.maxHp * this.specialLowHpShield / 100)
      this.addEffect({ type: EFFECT_TYPES.SHIELD, value: shieldValue, duration: 99, stackable: true, maxStacks: 99 })
    }

let shield = this.getShield();
    let damage = rawDamage;

    // ✅ 破甲：对护盾额外伤害（在扣护盾之前处理）
    if (shield > 0 && attacker && attacker.shieldDmg) {
        const extraShieldDmg = Math.floor(damage * (attacker.shieldDmg || 0) / 100);
        this.reduceShield(extraShieldDmg);
        shield = this.getShield(); // 重新获取护盾值
    }

    if (shield > 0) {
        if (shield >= damage) {
            this.reduceShield(damage);
            damage = 0;
        } else {
            damage -= shield;
            this.removeEffect(EFFECT_TYPES.SHIELD);
        }
    }

    this.hp -= damage


    // ✅ 顽强：免死锁血
if (this.deathSave && this.hp <= 0) {
  if (this.deathSave >= 100 || Math.random() * 100 < this.deathSave) {
    this.hp = 1;
    if (this.deathShield) {
      this.addEffect({
        type: EFFECT_TYPES.SHIELD,
        value: Math.floor(this.maxHp * this.deathShield / 100),
        duration: 3,
        stackable: true,
        maxStacks: 99
      });
    }
    return { damage, deathSaved: true };
  }
}
    if (this.hp < 0) this.hp = 0

    if (this.hp <= 0) {
   // ✅ 不死鸟：复活
if (this.reviveChance && !this._reviveUsedThisBattle && this._reviveCooldown <= 0) {
  if (Math.random() * 100 < this.reviveChance) {
    this.hp = Math.floor(this.maxHp * 0.5);
    this._reviveUsedThisBattle = true;
    this._reviveCooldown = this.reviveCD || 10;
    if (this.reviveDmg) {
      this.addEffect({
        type: EFFECT_TYPES.ATK_UP,
        value: this.reviveDmg / 100,
        duration: 3,
        stackable: false
      });
    }
    return { damage, revived: true };
  }
}
      // 原有复活特性
      if (this.traits.includes('revive') && !this.hasRevived) {
        this.hasRevived = true
        this.hp = Math.floor(this.maxHp * 0.3)
        return { damage, revived: true }
      }
    }

    // 反伤
let reflectDmg = 0
this.effects.forEach(e => {
  if (e.type === EFFECT_TYPES.REFLECT) {
    // ✅ 基于攻击力反弹，而非受到伤害
    reflectDmg += this.getEffectiveAttack() * e.value
  }
})
    if (reflectDmg > 0 && attacker) {
      attacker.takeDamage(Math.floor(reflectDmg))
    }
    return damage
  }

reduceShield(amount) {
    let remaining = amount
    this.effects.forEach(e => {
      if (e.type === EFFECT_TYPES.SHIELD && remaining > 0) {
        if (e.value >= remaining) { e.value -= remaining; remaining = 0 }
        else { remaining -= e.value; e.value = 0 }
      }
    })
    this.effects = this.effects.filter(e => e.value > 0 || e.type !== EFFECT_TYPES.SHIELD)
}
}