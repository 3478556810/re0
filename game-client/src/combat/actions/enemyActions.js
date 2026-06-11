import { calculateDamage } from '../damageCalculator'
import { EFFECT_TYPES } from '../effectDefs'
import { applySkillEffects } from '../effects/skillEffects'
import { bossMechanics } from '../engine/mechanics/bossMechanics'
import { playVoice } from '@/utils/audio'   // ← 新增这一行
import { monsterSpeech } from '@/config/monsterSpeech'
export function executeEnemyTurn(engine) {
  const results = []
  engine.player.effects.forEach(eff => {
    if (eff.type === EFFECT_TYPES.DOT) {
      const dmg = eff.value || 0
      engine.player.takeDamage(dmg)
      results.push({ type: 'dot_tick', messages: [`持续伤害使 ${engine.player.name} 损失了 ${dmg} 点生命`] })
    }
  })

  for (const enemy of engine.getAliveEnemies()) {
    if (engine.battleOver) break
    if (enemy.isStunned()) {
      results.push({ type: 'enemy_action', enemy: enemy.name, messages: [`${enemy.name} 被眩晕，无法行动！`] })
      enemy.removeEffect(EFFECT_TYPES.STUN)
      continue
    }

    let skill = enemy.skills?.length ? enemy.skills[Math.floor(Math.random() * enemy.skills.length)] : { name: '攻击', baseMul: 1, element: enemy.element, mpCost: 0 }

    const a = { attack: enemy.getEffectiveAttack(), critRate: enemy.critRate, critDmg: enemy.critDmg, trueDmg: enemy.trueDmg }
    if (skill.element) a[skill.element + 'Dmg'] = enemy.elemDmg[skill.element] || 0
    const { damage, crit, multiplier } = calculateDamage(
      a,
      { defense: engine.player.getEffectiveDefense(), element: engine.player.element, hpPercent: engine.player.hp / engine.player.maxHp, maxHp: engine.player.maxHp },
      skill,
      { ignoreDef: skill.ignoreDef || 0 }
    )

    const deathResult = engine.player.takeDamage(damage, enemy)
    applyEnemyLifesteal(enemy, engine.player, damage)

    let msg = `${enemy.name} 使用 ${skill.name}，造成 ${damage} 伤害`
    if (crit) msg += ' (暴击)'

    const res = { type: 'enemy_action', enemy: enemy.name, damage, crit, multiplier, messages: [msg] }

    if (skill.effects?.length) {
      for (const effDef of skill.effects) {
        if (effDef.target === 'self') {
          res.messages.push(...applySkillEffects(enemy, enemy, [effDef], engine))
        } else if (effDef.target === 'aoe') {
          const aoeTargets = [engine.player]
          if (engine.companion?.hp > 0) aoeTargets.push(engine.companion)
          for (const t of aoeTargets) res.messages.push(...applySkillEffects(enemy, t, [effDef], engine))
        } else {
          res.messages.push(...applySkillEffects(enemy, engine.player, [effDef], engine))
        }
      }
    }

    if (deathResult?.deathSaved) {
      res.messages.push('玩家顽强地存活下来！')
    } else if (deathResult?.revived) {
      res.messages.push('玩家从死亡中复活！')
    } else if (engine.player.hp <= 0) {
      engine.player.hp = 0
      engine.battleOver = true
      engine.winner = 'enemy'
      res.messages.push('玩家倒下了...')
    }

    results.push(res)
    if (engine.battleOver) break
  }
  return results
}

export function executeSingleEnemyAction(engine, enemy) {
  if (enemy.hp <= 0) return { messages: [] }
  if (enemy.isStunned()) {
    const freeze = enemy.effects.find(e => e.type === EFFECT_TYPES.FREEZE)
    enemy.removeEffect(freeze ? EFFECT_TYPES.FREEZE : EFFECT_TYPES.STUN)
    return {
      type: 'enemy_action',
      enemy: enemy.name,
      messages: [freeze ? `${enemy.name} 被冻结，无法行动！` : `${enemy.name} 被眩晕，无法行动！`],
      damage: 0,
      crit: false,
      multiplier: 1
    }
  }

  if (!enemy._skillCooldowns) enemy._skillCooldowns = {}
  for (const key of Object.keys(enemy._skillCooldowns)) {
    if (enemy._skillCooldowns[key] > 0) enemy._skillCooldowns[key]--
  }

  if (enemy._pendingMechanicSkill) {
    const skillName = enemy._pendingMechanicSkill
    delete enemy._pendingMechanicSkill
    const forcedSkill = enemy.skills?.find(s => s.name === skillName)
    if (forcedSkill) return executeSkill(engine, enemy, forcedSkill)
  }

  if (enemy._pendingMechanicDirect) {
    const mechName = enemy._pendingMechanicDirect
    delete enemy._pendingMechanicDirect
    if (bossMechanics[mechName]?.onCast) {
      bossMechanics[mechName].onCast({}, enemy, engine)
      return {
        type: 'enemy_action',
        enemy: enemy.name,
        messages: [`${enemy.name} 释放了 ${mechName}`],
        damage: 0,
        crit: false,
        multiplier: 1
      }
    }
  }

  if (!enemy.skills?.length) {
    return buildAttackResult(engine, enemy, engine.player, {
      name: '攻击', baseMul: 1, element: enemy.element, mpCost: 0, target: 'single'
    })
  }

  let currentPhase = enemy.currentPhase || 1
  if (!enemy.currentPhase) {
    const hpPercent = enemy.hp / enemy.maxHp
    if (hpPercent <= 0.75) currentPhase = 2
    if (hpPercent <= 0.50) currentPhase = 3
    if (hpPercent <= 0.25) currentPhase = 4
  }

  const phaseSkills = enemy.skills.filter(skill => (skill.unlockPhase || 1) <= currentPhase)
  const availableSkills = phaseSkills.filter(skill => (enemy._skillCooldowns[skill.name] || 0) <= 0)

  if (availableSkills.length === 0 && phaseSkills.length > 0) {
    for (const skill of phaseSkills) enemy._skillCooldowns[skill.name] = 0
    availableSkills.push(...phaseSkills)
  }

  const finalPool = availableSkills.length > 0 ? availableSkills : enemy.skills
  const attackSkills = finalPool.filter(s => (s.baseMul || 0) > 0)
  const buffSkills = finalPool.filter(s => (s.baseMul || 0) === 0)

  let chosenSkill = null
  if (attackSkills.length > 0 && Math.random() < 0.8) {
    chosenSkill = attackSkills[Math.floor(Math.random() * attackSkills.length)]
  } else if (buffSkills.length > 0) {
    const safeBuffs = buffSkills.filter(skill => {
      if (!skill.effects?.length) return true
      for (const effDef of skill.effects) {
        const effectType = getEffectTypeFromDef(effDef)
        if (enemy.effects.some(e => e.type === effectType)) return false
      }
      return true
    })
    if (safeBuffs.length > 0) chosenSkill = safeBuffs[Math.floor(Math.random() * safeBuffs.length)]
    else if (attackSkills.length > 0) chosenSkill = attackSkills[Math.floor(Math.random() * attackSkills.length)]
  }
  if (!chosenSkill) chosenSkill = finalPool[Math.floor(Math.random() * finalPool.length)]

  if (chosenSkill.cooldown) enemy._skillCooldowns[chosenSkill.name] = chosenSkill.cooldown

  return executeSkill(engine, enemy, chosenSkill)
}

// ======================= 辅助函数 =======================

function buildAttackResult(engine, enemy, target, skill) {
  const a = { attack: enemy.getEffectiveAttack(), critRate: enemy.critRate, critDmg: enemy.critDmg, trueDmg: enemy.trueDmg }
  if (skill.element) a[skill.element + 'Dmg'] = enemy.elemDmg[skill.element] || 0
  const { damage, crit, multiplier } = calculateDamage(
    a,
    { defense: target.getEffectiveDefense(), element: target.element, hpPercent: target.hp / target.maxHp, maxHp: target.maxHp },
    skill,
    { ignoreDef: skill.ignoreDef || 0 }
  )
  const deathResult = target.takeDamage(damage, enemy)

  if (deathResult?.dodged) {
    const msg = `${enemy.name} 使用 ${skill.name}，但被 ${target.name} 闪避了！`
    return { type: 'enemy_action', enemy: enemy.name, damage: 0, crit: false, multiplier: 1, messages: [msg] }
  }

  applyEnemyLifesteal(enemy, target, damage)

  let msg = `${enemy.name} 使用 ${skill.name}，对 ${target.name} 造成 ${damage} 伤害`
  if (crit) msg += ' (暴击)'

  if (deathResult?.deathSaved) {
    return { type: 'enemy_action', enemy: enemy.name, damage, crit, multiplier, messages: [`${msg}，但对方顽强存活！`] }
  } else if (deathResult?.revived) {
    return { type: 'enemy_action', enemy: enemy.name, damage, crit, multiplier, messages: [`${msg}，但对方复活了！`] }
  }
  return { type: 'enemy_action', enemy: enemy.name, damage, crit, multiplier, messages: [msg] }
}

function executeSkill(engine, enemy, skill) {
  let target = null
  if (skill.target === 'self') {
    target = enemy
  } else if (skill.target === 'aoe' || skill.target === 'all') {
    target = 'aoe'
  } else {
    // ★ 核心修改：目标池包含伙伴
    const targets = [engine.player]
    if (engine.companion?.hp > 0) targets.push(engine.companion)
    target = targets[Math.floor(Math.random() * targets.length)]
  }

  let damage = 0, crit = false, multiplier = 1
  const res = { type: 'enemy_action', enemy: enemy.name, damage: 0, crit: false, multiplier: 1, messages: [] }
  const a = { attack: enemy.getEffectiveAttack(), critRate: enemy.critRate, critDmg: enemy.critDmg, trueDmg: enemy.trueDmg }
  if (skill.element) a[skill.element + 'Dmg'] = enemy.elemDmg[skill.element] || 0

  let deathResult = null
  if (skill.baseMul > 0) {
    if (skill.target === 'aoe') {
      const aoeTargets = [engine.player]
      if (engine.companion?.hp > 0) aoeTargets.push(engine.companion)
      for (const t of aoeTargets) {
        const defSnap = {
          defense: t.getEffectiveDefense(),
          element: t.element,
          hpPercent: t.hp / t.maxHp,
          maxHp: t.maxHp
        }
        const calc = calculateDamage(a, defSnap, skill, { ignoreDef: skill.ignoreDef || 0 })
        const dResult = t.takeDamage(calc.damage, enemy)

        if (dResult?.dodged) {
          res.messages.push(`${skill.name} 被 ${t.name} 闪避了！`)
        } else {
          applyEnemyLifesteal(enemy, t, calc.damage)
          res.messages.push(`${skill.name} 对 ${t.name} 造成 ${calc.damage} 伤害`)
          if (calc.crit) res.messages.push('(暴击)')
        }
        if (t === engine.player) deathResult = dResult
      }
    } else if (target && target !== enemy) {
      const calc = calculateDamage(
        a,
        { defense: target.getEffectiveDefense(), element: target.element, hpPercent: target.hp / target.maxHp, maxHp: target.maxHp },
        skill,
        { ignoreDef: skill.ignoreDef || 0 }
      )
      damage = calc.damage; crit = calc.crit; multiplier = calc.multiplier
      deathResult = target.takeDamage(damage, enemy)

      if (deathResult?.dodged) {
        res.messages.push(`${enemy.name} 使用 ${skill.name}，但被 ${target.name} 闪避了！`)
        return res
      }

      applyEnemyLifesteal(enemy, target, damage)
      let msg = `${enemy.name} 使用 ${skill.name}，对 ${target.name} 造成 ${damage} 伤害`
      if (crit) msg += ' (暴击)'
      res.messages.push(msg)
    }
  } else {
    res.messages.push(`${enemy.name} 使用 ${skill.name}`)
  }

  if (skill.effects?.length) {
    for (const effDef of skill.effects) {
      if (effDef.target === 'self' || skill.target === 'self') {
        res.messages.push(...applySkillEffects(enemy, enemy, [effDef], engine))
      } else if (effDef.target === 'aoe' || skill.target === 'aoe') {
        const aoeTargets = [engine.player]
        if (engine.companion?.hp > 0) aoeTargets.push(engine.companion)
        for (const t of aoeTargets) {
          res.messages.push(...applySkillEffects(enemy, t, [effDef], engine))
        }
      } else if (target && target !== enemy && target !== 'aoe' && target.hp > 0) {
        res.messages.push(...applySkillEffects(enemy, target, [effDef], engine))
      }
    }
  }

  if (skill.mechanic && bossMechanics[skill.mechanic]?.onCast) {
    bossMechanics[skill.mechanic].onCast(skill, enemy, engine)
  }

  if (deathResult?.deathSaved) {
    res.messages.push('玩家顽强地存活下来！')
  } else if (deathResult?.revived) {
    res.messages.push('玩家从死亡中复活！')
  } else if (target === engine.player && engine.player.hp <= 0) {
    engine.player.hp = 0
    engine.battleOver = true
    engine.winner = 'enemy'
    res.messages.push('玩家倒下了...')
  } else if (target === engine.companion && engine.companion?.hp <= 0) {
    engine.companion.hp = 0
    res.messages.push(`${engine.companion.name} 倒下了！`)
  }

  return res
}

function applyEnemyLifesteal(enemy, target, damage) {
  if (!damage || damage <= 0 || target.hp <= 0) return
  let totalLifesteal = enemy.lifesteal || 0
  enemy.effects?.forEach(eff => {
    if (eff.type === EFFECT_TYPES.LIFESTEAL_BUFF) totalLifesteal += (eff.value || 0)
  })
  totalLifesteal = Math.min(totalLifesteal, 15)
  if (totalLifesteal > 0) {
    const damageDrain = Math.floor(damage * totalLifesteal / 100)
    const hpDrain = Math.floor(enemy.maxHp * totalLifesteal / 100)
    const drain = damageDrain + hpDrain
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + drain)
  }
}

function getEffectTypeFromDef(effDef) {
  const type = effDef.type
  if (type === 'buff') {
    const stat = effDef.stat || ''
    if (stat === 'atk') return EFFECT_TYPES.ATK_UP
    if (stat === 'def') return EFFECT_TYPES.DEF_UP
    if (stat === 'speed') return 'spdUp'
    if (stat === 'critRate') return 'critRateUp'
    if (stat === 'critDmg') return 'critDmgUp'
    if (stat === 'maxHp') return 'maxHpUp'
    if (stat === 'dodge') return 'dodgeUp'
  }
  if (type === 'shield') return EFFECT_TYPES.SHIELD
  if (type === 'regen') return EFFECT_TYPES.REGEN
  if (type === 'lifestealBuff') return EFFECT_TYPES.LIFESTEAL_BUFF
  return type
}