// src/combat/actions/enemyActions.js
import { calculateDamage } from '../damageCalculator'
import { EFFECT_TYPES } from '../effectDefs'
import { applySkillEffects } from '../effects/skillEffects'
import { UnitState } from '../UnitState'
import { bossMechanics } from '../engine/mechanics/bossMechanics'

// ==================== 旧版 enemyTurn（保留不变） ====================
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
    engine.player.takeDamage(damage, enemy)

    // 吸血结算
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

    results.push(res)
    if (engine.player.hp <= 0) { engine.battleOver = true; engine.winner = 'enemy'; res.messages.push('玩家倒下了...'); break }
  }
  return results
}

// ==================== 新版单个敌人行动（智能AI + 阶段 + 冷却） ====================
export function executeSingleEnemyAction(engine, enemy) {
  // 1. 晕眩/冻结检查
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

  // 2. 初始化冷却与阶段记忆
  if (!enemy._skillCooldowns) enemy._skillCooldowns = {}
  if (!enemy._lastPhase) enemy._lastPhase = 0

  // 3. 减少所有冷却
  for (const key of Object.keys(enemy._skillCooldowns)) {
    if (enemy._skillCooldowns[key] > 0) enemy._skillCooldowns[key]--
  }

  // 4. 没有技能则普攻
  if (!enemy.skills?.length) {
    return buildAttackResult(engine, enemy, engine.player, {
      name: '攻击',
      baseMul: 1,
      element: enemy.element,
      mpCost: 0,
      target: 'single'
    })
  }

  // 5. 根据血量确定当前阶段
  const hpPercent = enemy.hp / enemy.maxHp
  let currentPhase = 1
  if (hpPercent <= 0.75) currentPhase = 2
  if (hpPercent <= 0.50) currentPhase = 3
  if (hpPercent <= 0.25) currentPhase = 4

  // 6. 阶段切换时，清空冷却
  if (currentPhase !== enemy._lastPhase) {
    enemy._skillCooldowns = {}
    enemy._lastPhase = currentPhase
  }

  // 7. 筛选满足当前阶段的技能
  const phaseSkills = enemy.skills.filter(skill => {
    const unlock = skill.unlockPhase || 1
    return unlock <= currentPhase
  })

  // 8. 从阶段技能中筛选冷却已完成的
  const availableSkills = phaseSkills.filter(skill => {
    const cd = enemy._skillCooldowns[skill.name] || 0
    return cd <= 0
  })

  if (availableSkills.length === 0 && phaseSkills.length > 0) {
    for (const skill of phaseSkills) {
      enemy._skillCooldowns[skill.name] = 0
    }
    availableSkills.push(...phaseSkills)
  }

  const finalPool = availableSkills.length > 0 ? availableSkills : enemy.skills

  // 9. 分类技能
  const attackSkills = finalPool.filter(s => (s.baseMul || 0) > 0)
  const buffSkills = finalPool.filter(s => (s.baseMul || 0) === 0)

  // 10. 智能选择：80%攻击，20%Buff（但不能重复上同类型）
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
    if (safeBuffs.length > 0) {
      chosenSkill = safeBuffs[Math.floor(Math.random() * safeBuffs.length)]
    } else if (attackSkills.length > 0) {
      chosenSkill = attackSkills[Math.floor(Math.random() * attackSkills.length)]
    }
  }

  if (!chosenSkill) {
    chosenSkill = finalPool[Math.floor(Math.random() * finalPool.length)]
  }

  // 11. 设置冷却
  if (chosenSkill.cooldown) {
    enemy._skillCooldowns[chosenSkill.name] = chosenSkill.cooldown
  }

  // 12. 执行技能
  return executeSkill(engine, enemy, chosenSkill)
}

// ==================== 辅助函数 ====================

function buildAttackResult(engine, enemy, target, skill) {
  const a = { attack: enemy.getEffectiveAttack(), critRate: enemy.critRate, critDmg: enemy.critDmg, trueDmg: enemy.trueDmg }
  if (skill.element) a[skill.element + 'Dmg'] = enemy.elemDmg[skill.element] || 0
  const { damage, crit, multiplier } = calculateDamage(
    a,
    { defense: target.getEffectiveDefense(), element: target.element, hpPercent: target.hp / target.maxHp, maxHp: target.maxHp },
    skill,
    { ignoreDef: skill.ignoreDef || 0 }
  )
  target.takeDamage(damage, enemy)

  // 吸血
  applyEnemyLifesteal(enemy, target, damage)

  let msg = `${enemy.name} 使用 ${skill.name}，对 ${target.name} 造成 ${damage} 伤害`
  if (crit) msg += ' (暴击)'

  return { type: 'enemy_action', enemy: enemy.name, damage, crit, multiplier, messages: [msg] }
}

function executeSkill(engine, enemy, skill) {
  let target = null

  if (skill.target === 'self') {
    target = enemy
  } else if (skill.target === 'aoe' || skill.target === 'all') {
    target = 'aoe'
  } else {
    const targets = [engine.player]
    if (engine.companion?.hp > 0) targets.push(engine.companion)
    target = targets[Math.floor(Math.random() * targets.length)]
  }

  let damage = 0, crit = false, multiplier = 1
  const res = { type: 'enemy_action', enemy: enemy.name, damage: 0, crit: false, multiplier: 1, messages: [] }

  const a = { attack: enemy.getEffectiveAttack(), critRate: enemy.critRate, critDmg: enemy.critDmg, trueDmg: enemy.trueDmg }
  if (skill.element) a[skill.element + 'Dmg'] = enemy.elemDmg[skill.element] || 0

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
        t.takeDamage(calc.damage, enemy)
        applyEnemyLifesteal(enemy, t, calc.damage)
        res.messages.push(`暗影弹幕对 ${t.name} 造成 ${calc.damage} 伤害`)
        if (calc.crit) res.messages.push('(暴击)')
      }
    } else if (target && target !== enemy) {
      const calc = calculateDamage(
        a,
        { defense: target.getEffectiveDefense(), element: target.element, hpPercent: target.hp / target.maxHp, maxHp: target.maxHp },
        skill,
        { ignoreDef: skill.ignoreDef || 0 }
      )
      damage = calc.damage; crit = calc.crit; multiplier = calc.multiplier
      target.takeDamage(damage, enemy)
      applyEnemyLifesteal(enemy, target, damage)
      let msg = `${enemy.name} 使用 ${skill.name}，对 ${target.name} 造成 ${damage} 伤害`
      if (crit) msg += ' (暴击)'
      res.messages.push(msg)
    }
  } else {
    res.messages.push(`${enemy.name} 使用 ${skill.name}`)
  }

  // 效果应用
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

  // 机制钩子：召唤分身等
  if (skill.mechanic && bossMechanics[skill.mechanic]?.onCast) {
    bossMechanics[skill.mechanic].onCast(skill, enemy, engine)
  }

  // 分身死亡标记处理（已在 UnitState.takeDamage 中返回 cloneDeath）
  // 这里不需要额外代码

  // 死亡判定
  if (target === engine.player && engine.player.hp <= 0) {
    engine.player.hp = 0; engine.battleOver = true; engine.winner = 'enemy'
    res.messages.push('玩家倒下了...')
  } else if (target === engine.companion && engine.companion?.hp <= 0) {
    engine.companion.hp = 0; res.messages.push(`${engine.companion.name} 倒下了！`)
  }

  return res
}

// 敌人吸血通用函数
function applyEnemyLifesteal(enemy, target, damage) {
  if (!damage || damage <= 0 || target.hp <= 0) return
  let totalLifesteal = enemy.lifesteal || 0
  enemy.effects?.forEach(eff => {
    if (eff.type === EFFECT_TYPES.LIFESTEAL_BUFF) {
      totalLifesteal += (eff.value || 0)
    }
  })
  if (totalLifesteal > 0) {
    const drain = Math.floor(damage * totalLifesteal / 100)
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + drain)
  }
}

// 根据效果定义推断最终效果类型（用于判断是否重复上Buff）
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