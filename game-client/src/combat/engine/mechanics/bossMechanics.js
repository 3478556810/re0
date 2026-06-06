import { UnitState } from '../../UnitState'
import { EFFECT_TYPES } from '../../effectDefs'

export const bossMechanics = {
  // ---------- 召唤暗影分身 ----------
  summon_shadow_clones: {
    onCast(skill, caster, engine) {
      const count = skill.mechanicParams?.count || 2
      const hpRatio = skill.mechanicParams?.hpRatio || 0.3
      const atkRatio = skill.mechanicParams?.atkRatio || 0.3
      const cloneName = skill.mechanicParams?.cloneName || '暗影分身'

      // Boss进入无敌
      caster._invulnerable = true
      caster._invulnerableSource = 'clones'
      caster._cloneDeathTimer = 3

      for (let i = 0; i < count; i++) {
        const clone = new UnitState({
          id: `clone_${Date.now()}_${i}`,
          name: cloneName,
          hp: Math.floor(caster.maxHp * hpRatio),
          maxHp: Math.floor(caster.maxHp * hpRatio),
          attack: Math.floor(caster.attack * atkRatio),
          defense: caster.defense,
          speed: caster.speed,
          element: caster.element || 'dark',
          icon: 'mdi:ghost',
          isClone: true,
          masterId: caster.id || caster.name
        })
        engine.enemies.push(clone)
      }
      engine._pendingMessages = engine._pendingMessages || []
      engine._pendingMessages.push(`${caster.name} 召唤了 ${count} 个${cloneName}！本体进入无敌状态！`)
    }
  },

  // ---------- 鲜血图腾 ----------
  blood_ritual: {
    onCast(skill, caster, engine) {
      const totemHp = skill.mechanicParams?.totemHp || Math.floor(caster.maxHp * 0.1)
      const totem = new UnitState({
        id: 'totem_' + Date.now(),
        name: '鲜血图腾',
        hp: totemHp,
        maxHp: totemHp,
        attack: 0,
        defense: 0,
        speed: 0,
        element: '',
        icon: 'mdi:holy-water',
        isTotem: true,
        masterId: caster.id || caster.name,
        _deathTimer: 3
      })
      engine.enemies.push(totem)

      // Boss进入无敌
      caster._invulnerable = true
      caster._invulnerableSource = 'totem'

      engine._pendingMessages = engine._pendingMessages || []
      engine._pendingMessages.push('鲜血仪式！图腾存在期间角斗士无敌！')
    }
  },

  // ---------- 熔岩护盾 ----------
  lava_shield: {
    onCast(skill, caster, engine) {
      const shieldValue = Math.floor(caster.maxHp * (skill.mechanicParams?.shieldPercent || 0.5))
      caster.addEffect({
        type: EFFECT_TYPES.SHIELD,
        value: shieldValue,
        duration: 99,
        stackable: false
      })
      caster._invulnerable = true
      caster._invulnerableSource = 'shield'
      caster._lavaShieldActive = true
      caster._lavaShieldWeakness = 'water'

      engine._pendingMessages = engine._pendingMessages || []
      engine._pendingMessages.push('熔岩护盾激活！必须用水属性技能打破！')
    }
  },

  // ---------- 虚空诅咒（延迟真伤）----------
  void_curse: {
    onTick(effect, unit, engine) {
      effect.duration--
      if (effect.duration <= 0) {
        const percent = effect.extra?.hpPercent || 0.5
        const dmg = Math.floor(unit.maxHp * percent)
        unit.hp -= dmg
        if (unit.hp < 0) unit.hp = 0
        unit.removeEffect(effect.type)
        engine._pendingMessages = engine._pendingMessages || []
        engine._pendingMessages.push(`${unit.name} 被虚空诅咒吞没，受到 ${dmg} 点真实伤害！`)
      }
    }
  },

  // ---------- 分身死亡给主人上易伤 ----------
  clone_death_mark: {
    onDeath(deadUnit, killer, engine) {
      const master = engine.enemies.find(e => (e.id || e.name) === deadUnit.masterId)
      if (master) {
        master.addEffect({
          type: EFFECT_TYPES.HOLY_MARK,
          value: 0.15,
          duration: 5,
          stackable: true,
          maxStacks: 99
        })
        engine._pendingMessages = engine._pendingMessages || []
        engine._pendingMessages.push(`${master.name} 因分身被击破而受到易伤！`)
      }
    }
  },

  // ---------- 龙骸印记计算公式（可扩展）----------
  dragon_mark: {
    computeBonus(stacks, value) {
      const expMultiplier = Math.pow(1.5, stacks - 1)
      return 1 + value * expMultiplier
    }
  },

  // ---------- 暗蚀印记百分比真伤计算 ----------
  shadow_mark: {
    computeTrueDamage(stacks, maxHp) {
      const maxHpPercent = 0.01 * stacks * Math.pow(1.3, stacks - 1)
      return Math.floor(maxHp * maxHpPercent)
    }
  }
}