import { EFFECT_TYPES } from './effectDefs'
import { bossMechanics } from './engine/mechanics/bossMechanics'
import { playVoice } from '@/utils/audio'   // ← 新增
import { monsterSpeech } from '@/config/monsterSpeech'
export class UnitState {
  constructor(baseStats, isPlayer = false) {
    // 在 UnitState 构造函数中，添加以下属性
this.talents = baseStats.talents || {}
this.mpCostReduction = baseStats.mpCostReduction || 0
this.mpOnHit = baseStats.mpOnHit || 0
this.mpOnKill = baseStats.mpOnKill || 0
    this.isCompanion = baseStats.isCompanion || false
    this.id = baseStats.id || 'unit'
    this.name = baseStats.name || ''
    this.isPlayer = isPlayer
    this.isBoss = baseStats.isBoss || false
    this.isRaidBoss = baseStats.isRaidBoss || false
    this.traits = baseStats.traits || []
    if (typeof baseStats.trait === 'string' && baseStats.trait) {
      this.traits.push(baseStats.trait)
    }
    this.hasRevived = false
    this.enrageTurn = baseStats.enrageTurn || 0
    this.isEnraged = false
    this.dmgTaken = baseStats.dmgTaken || 0
    this.attack = baseStats.attack || baseStats.atk || 10
    this.baseAttack = this.attack
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
    this.deathSave = baseStats.deathSave || 0
    this.deathShield = baseStats.deathShield || 0
    this.reviveChance = baseStats.reviveChance || 0
    this.reviveCD = baseStats.reviveCD || 0
    this.reviveDmg = baseStats.reviveDmg || 0
    this._reviveCooldown = 0
    this._reviveUsedThisBattle = false
    this._deathSaveCooldown = 0            // 顽强冷却回合数
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


// 伙伴技能保留（新增）
if (baseStats.isCompanion && Array.isArray(baseStats.skills)) {
    this.skills = baseStats.skills
}

    this.base = { ...baseStats }
    this.isCompanion = baseStats.isCompanion || false

    // 特殊词条字段
    const specialFields = [
      'specialBossDmg', 'specialFullHpDmg', 'specialIgnoreDef',
      'specialLifestealPercent', 'specialMpLifestealPercent',
      'mpOnHit', 'mpOnKill', 'specialLowHpDmg',
      'holyMarkOnHit', 'lowHpLifestealOnMark', 'critDmgOnMark',
      'trueDmgPercent', 'dragonMarkOnHit', 'shadowMarkOnHit',  'dodge',   // ← 必须有
    ]
    specialFields.forEach(field => {
      this[field] = baseStats[field] || 0
    })
    this.stackingAtk = baseStats.stackingAtk || 0
    this._adrenalineStacks = 0
    this._tenacityTriggered = false

    // 分身相关
    this.isClone = baseStats.isClone || false
    this.masterId = baseStats.masterId || ''
  }

  getEffectiveAttack() {
    let atk = this.attack
    this.effects.forEach(eff => {
      if (eff.type === EFFECT_TYPES.ATK_UP) atk *= (1 + eff.value)
      else if (eff.type === EFFECT_TYPES.ATK_DOWN) atk *= (1 + eff.value)
      else if (eff.type === EFFECT_TYPES.WEAK) atk *= (1 + eff.value)
    })
    if (this.stackingAtk && this._adrenalineStacks > 0) {
      atk *= (1 + (this._adrenalineStacks * this.stackingAtk) / 100)
    }
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
    const { type, duration, value, stackable, maxStacks, noRefresh } = effectDef
    const existing = this.effects.find(e => e.type === type)

    if (existing && noRefresh) return false

    if (existing) {
        if (stackable) {
            // 可叠加类型：增加层数，刷新持续时间
            if (existing.stacks < (maxStacks || 99)) {
                existing.stacks += 1
            }
            existing.duration = duration
            existing.animClass = effectDef.animClass || existing.animClass
            
            // 护盾：累加数值
            if (type === EFFECT_TYPES.SHIELD) {
                existing.value += value
            }
            // 中毒、流血：保留原始 value，不覆盖
            else if (type === EFFECT_TYPES.DOT || type === EFFECT_TYPES.BLEED) {
                // 不做任何修改，保留第一次设置的值
            }
            // 其他类型：更新 value
            else {
                existing.value = value || existing.value
            }
            return true
        } else {
            // 不可叠加类型：取最高值，刷新持续时间
            existing.value = Math.max(existing.value || 0, value || 0)
            existing.duration = Math.max(existing.duration, duration)
            return true
        }
    }

    this.effects.push({
        ...effectDef,
        duration: duration || 0,
        value: value || 0,
        stacks: 1,
        noRefresh: !!noRefresh,
    })
    return true
}
  removeEffect(type) {
    this.effects = this.effects.filter(e => e.type !== type)
  }

  onTurnEnd(engine) {
     if (engine && engine.battleOver) return  // ★ 引擎已结束，不再结算任何效果
     if (this.hp <= 0) return  // ★ 死亡单位不再结算任何回合效果
    // 减少冷却
    if (this._reviveCooldown > 0) this._reviveCooldown--;
    if (this._deathSaveCooldown > 0) this._deathSaveCooldown--;

    // 再生
    this.effects.filter(e => e.type === EFFECT_TYPES.REGEN).forEach(e => {
        const heal = Math.floor(this.maxHp * (e.value || 0.08));
        this.hp = Math.min(this.maxHp, this.hp + heal);
    });

    // 收集所有持续伤害
    let totalBleedDmg = 0;
    let totalDotDmg = 0;
    this.effects.filter(e => e.type === EFFECT_TYPES.BLEED).forEach(e => {
        totalBleedDmg += Math.floor(this.maxHp * (e.value || 0.05));
    });
this.effects.filter(e => e.type === EFFECT_TYPES.DOT).forEach(e => {
    if (e.isPercentHp) {
        const hpPercent = (e.value || 0.015) * (e.stacks || 1)
        const rawDmg = Math.floor(this.maxHp * hpPercent)
        totalDotDmg += rawDmg
    } else {
        totalDotDmg += (e.value || 0.15) * (e.stacks || 1)
    }
})

// 灼烧
this.effects.filter(e => e.type === EFFECT_TYPES.BURN).forEach(e => {
  const atk = e.casterAttack || this.attack || 10;
  totalDotDmg += Math.floor(atk * (e.value || 0.2) * (e.stacks || 1));
});
    const pendingDmg = totalBleedDmg + totalDotDmg;

    // 如果会致死，触发生存机制
    if (pendingDmg > 0 && this.hp - pendingDmg <= 0) {
        let survived = false;

        // 1. 顽强锁血（带冷却）
        if (this.deathSave > 0 && this._deathSaveCooldown <= 0) {
            const success = this.deathSave >= 100 || Math.random() * 100 < this.deathSave;
            if (success) {
                this.hp = 1;
                this._deathSaveCooldown = 3;   // 进入冷却
                this.removeEffect(EFFECT_TYPES.BLEED);
                this.removeEffect(EFFECT_TYPES.DOT);
                if (this.deathShield > 0) {
                    this.addEffect({
                        type: EFFECT_TYPES.SHIELD,
                        value: Math.floor(this.maxHp * this.deathShield / 100),
                        duration: 3,
                        stackable: true,
                        maxStacks: 99
                    });
                }
                engine._pendingMessages = engine._pendingMessages || [];
                engine._pendingMessages.push('玩家顽强地存活下来！');
                survived = true;
            }
        }

        // 2. 不死鸟复活
        if (!survived && this.reviveChance > 0 && !this._reviveUsedThisBattle && this._reviveCooldown <= 0) {
            const success = this.reviveChance >= 100 || Math.random() * 100 < this.reviveChance;
            if (success) {
                this.hp = Math.floor(this.maxHp * 0.5);
                this._reviveUsedThisBattle = true;
                this._reviveCooldown = this.reviveCD || 10;
                this.removeEffect(EFFECT_TYPES.BLEED);
                this.removeEffect(EFFECT_TYPES.DOT);
                if (this.reviveDmg > 0) {
                    this.addEffect({
                        type: EFFECT_TYPES.ATK_UP,
                        value: this.reviveDmg / 100,
                        duration: 3,
                        stackable: false
                    });
                }
                engine._pendingMessages = engine._pendingMessages || [];
                engine._pendingMessages.push('玩家从死亡中复活！');
                survived = true;
            }
        }

        // 如果存活，跳过扣血
        if (survived) {
            this.effects.forEach(e => e.duration--);
            this.effects = this.effects.filter(e => e.duration > 0);
            return;
        }
    }

    // 正常结算持续伤害
    if (totalBleedDmg > 0) {
        this.hp -= totalBleedDmg;
        if (this.hp < 0) this.hp = 0;
    }
    if (totalDotDmg > 0) {
        this.hp -= totalDotDmg;
        if (this.hp < 0) this.hp = 0;
    }
if (this.hp <= 0) {
    if (!this._playedDefeatVoice) {
        playVoice(this.id, 'defeat')
        this._playedDefeatVoice = true
        
        const speechText = monsterSpeech[this.id]?.defeat
        if (speechText) {
            const self = this
            self.speech = speechText
            setTimeout(() => { self.speech = '' }, 2000)
        }
    }
}
    // 机制钩子
    this.effects.forEach(eff => {
        if (eff.mechanic && bossMechanics[eff.mechanic]?.onTick) {
            bossMechanics[eff.mechanic].onTick(eff, this, engine)
        }
    });

    // 持续时间衰减
    this.effects.forEach(e => e.duration--);
    this.effects = this.effects.filter(e => e.duration > 0);
  }

   takeDamage(rawDamage, attacker) {
      rawDamage = Math.floor(rawDamage);

    // ===== 副本Boss无敌（硬编码，用名字和场上敌人判定）=====
    if (this.isRaidBoss) {
        const engine = window.__engine
        if (engine) {
            const hasTotem = engine.enemies.some(e => e.name === '鲜血图腾' && e.hp > 0)
            const hasClones = engine.enemies.some(e => e.name === '暗影分身' && e.hp > 0)
            const hasLavaShield = this._lavaShieldActive

            if (hasTotem || hasClones || hasLavaShield) {
                if (hasLavaShield && attacker?._lastSkillElement === 'water') {
                    this._lavaShieldActive = false
                    this.removeEffect(EFFECT_TYPES.SHIELD)
                    if (engine._pendingMessages) {
                        engine._pendingMessages.push('熔岩护盾被水属性技能击破！')
                    }
                    // 继续正常结算
                } else {
                    return { damage: 0, invulnerable: true }
                }
            }
        }
    }
    // ===== 闪避判定 =====
    if (window.__engine && this === window.__engine.player) {
        const speedDodge = this.speed * 0.05;
        const totalDodge = speedDodge + (this.dodge || 0);
        if (Math.random() * 100 < totalDodge) {
            return { damage: 0, dodged: true };
        }
    }
    
    // 怨恨增伤
    if (this.dmgTaken && this.dmgTaken > 0) {
        rawDamage = Math.floor(rawDamage * (1 + this.dmgTaken / 100));
    }

    // 冻结额外伤害
    const frozen = this.effects.find(e => e.type === EFFECT_TYPES.FREEZE);
    if (frozen && attacker) {
        rawDamage = Math.floor(rawDamage * 1.3);
        this.removeEffect(EFFECT_TYPES.FREEZE);
    }

    let shield = this.getShield();
    let damage = rawDamage;

    // 破甲额外盾伤
    if (shield > 0 && attacker && attacker.shieldDmg) {
        const extra = Math.floor(damage * (attacker.shieldDmg || 0) / 100);
        this.reduceShield(extra);
        shield = this.getShield();
    }

    // 护盾吸收
    if (shield > 0) {
        if (shield >= damage) {
            this.reduceShield(damage);
            damage = 0;
        } else {
            damage -= shield;
            this.removeEffect(EFFECT_TYPES.SHIELD);
        }
    }

    const wouldDie = (this.hp - damage) <= 0;

    if (wouldDie) {
        // 1. 顽强锁血（带冷却）
        if (this.deathSave > 0 && this._deathSaveCooldown <= 0) {
            const success = this.deathSave >= 100 || Math.random() * 100 < this.deathSave;
            if (success) {
                this.hp = 1;
                this._deathSaveCooldown = 3;   // 进入冷却
                this.removeEffect(EFFECT_TYPES.BLEED);
                this.removeEffect(EFFECT_TYPES.DOT);
                if (this.deathShield > 0) {
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

        // 2. 不死鸟复活
        if (this.reviveChance > 0 && !this._reviveUsedThisBattle && this._reviveCooldown <= 0) {
            const success = this.reviveChance >= 100 || Math.random() * 100 < this.reviveChance;
            if (success) {
                this.hp = Math.floor(this.maxHp * 0.5);
                this._reviveUsedThisBattle = true;
                this._reviveCooldown = this.reviveCD || 10;
                this.removeEffect(EFFECT_TYPES.BLEED);
                this.removeEffect(EFFECT_TYPES.DOT);
                if (this.reviveDmg > 0) {
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

        // 3. 怪物通用复活
        if (this.traits?.includes('revive') && !this.hasRevived) {
            this.hasRevived = true;
            this.hp = Math.floor(this.maxHp * 0.3);
            return { damage, revived: true };
        }
    }

   // 真正扣血
const actualDamage = Math.min(damage, this.hp);
this.hp -= actualDamage;





    // 反伤
    let reflectDmg = 0;
    this.effects.forEach(e => {
        if (e.type === EFFECT_TYPES.REFLECT) {
            reflectDmg += this.getEffectiveAttack() * e.value;
        }
    });
    if (reflectDmg > 0 && attacker) {
        attacker.takeDamage(Math.floor(reflectDmg));
    }

    // 分身死亡标记
    if (this.hp <= 0 && this.isClone && this.masterId) {
        return { damage, cloneDeath: true, masterId: this.masterId };
    }

    return damage;
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