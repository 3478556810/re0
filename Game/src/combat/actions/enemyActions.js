import { calculateDamage } from '../damageCalculator'
import { EFFECT_TYPES } from '../effectDefs'
import { applySkillEffects } from '../effects/skillEffects'

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
    const { damage, crit, multiplier } = calculateDamage(a, { defense: engine.player.getEffectiveDefense(), element: engine.player.element }, skill)
    engine.player.takeDamage(damage, enemy)

    let msg = `${enemy.name} 使用 ${skill.name}，造成 ${damage} 伤害`
    if (crit) msg += ' (暴击)'

    const res = { type: 'enemy_action', enemy: enemy.name, damage, crit, multiplier, messages: [msg] }

    if (skill.effects?.length) {
      for (const effDef of skill.effects) {
        if (effDef.target === 'self') {
          res.messages.push(...applySkillEffects(enemy, enemy, [effDef]), engine)
        } else if (effDef.target === 'aoe') {
          const aoeTargets = [engine.player]
          if (engine.companion?.hp > 0) aoeTargets.push(engine.companion)
          for (const t of aoeTargets) res.messages.push(...applySkillEffects(enemy, t, [effDef], engine))
        } else {
          // 单体：此处没有显式目标，默认取玩家
          res.messages.push(...applySkillEffects(enemy, engine.player, [effDef], engine))
        }
      }
    }

    results.push(res)
    if (engine.player.hp <= 0) { engine.battleOver = true; engine.winner = 'enemy'; res.messages.push('玩家倒下了...'); break }
  }
  return results
}

export function executeSingleEnemyAction(engine, enemy) {
  if (enemy.isStunned()) {
    const freeze = enemy.effects.find(e => e.type === EFFECT_TYPES.FREEZE)
    enemy.removeEffect(freeze ? EFFECT_TYPES.FREEZE : EFFECT_TYPES.STUN)
    return { type: 'enemy_action', enemy: enemy.name, messages: [freeze ? `${enemy.name} 被冻结，无法行动！` : `${enemy.name} 被眩晕，无法行动！`], damage: 0, crit: false, multiplier: 1 }
  }

  let skill = enemy.skills?.length ? enemy.skills[Math.floor(Math.random() * enemy.skills.length)] : { name: '攻击', baseMul: 1, element: enemy.element, mpCost: 0, target: 'single' }

  let target = null
  if (skill.target === 'self') target = enemy
  else if (skill.target !== 'aoe') {
    const targets = [engine.player]
    if (engine.companion?.hp > 0) targets.push(engine.companion)
    target = targets[Math.floor(Math.random() * targets.length)]
  }

  let damage = 0, crit = false, multiplier = 1
  if (skill.baseMul > 0 && target && target !== enemy) {
    const a = { attack: enemy.getEffectiveAttack(), critRate: enemy.critRate, critDmg: enemy.critDmg, trueDmg: enemy.trueDmg }
    if (skill.element) a[skill.element + 'Dmg'] = enemy.elemDmg[skill.element] || 0
    const calc = calculateDamage(a, { defense: target.getEffectiveDefense(), element: target.element }, skill)
    damage = calc.damage; crit = calc.crit; multiplier = calc.multiplier
    target.takeDamage(damage, enemy)
  }

  let msg = `${enemy.name} 使用 ${skill.name}`
  if (damage > 0) { msg += `，对 ${target.name} 造成 ${damage} 伤害`; if (crit) msg += ' (暴击)'; if (multiplier > 1) msg += ' 效果拔群！'; if (multiplier < 1) msg += ' 效果不理想...' }
  else msg += '，为自己施加了效果'

  const res = { type: 'enemy_action', enemy: enemy.name, damage, crit, multiplier, messages: [msg] }

  if (skill.effects?.length) {
    for (const effDef of skill.effects) {
      if (effDef.target === 'self') res.messages.push(...applySkillEffects(enemy, enemy, [effDef], engine))
      else if (effDef.target === 'aoe') {
        const aoeTargets = [engine.player]
        if (engine.companion?.hp > 0) aoeTargets.push(engine.companion)
        for (const t of aoeTargets) res.messages.push(...applySkillEffects(enemy, t, [effDef], engine))
      } else if (target?.hp > 0) res.messages.push(...applySkillEffects(enemy, target, [effDef], engine))
    }
  }

  if (target === engine.player && engine.player.hp <= 0) { engine.player.hp = 0; engine.battleOver = true; engine.winner = 'enemy'; res.messages.push('玩家倒下了...') }
  else if (target === engine.companion && engine.companion.hp <= 0) { engine.companion.hp = 0; res.messages.push(`${engine.companion.name} 倒下了！`) }

  return res
}