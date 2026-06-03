import { calculateDamage } from '../damageCalculator'
import { EFFECT_TYPES } from '../effectDefs'
import { applySkillEffects } from '../effects/skillEffects'

export function executePlayerAction(engine, skill, targetIndex, options = {}) {
  const { player, enemies } = engine
  if (engine.battleOver) return null

  const noMpCost = options.noMpCost === true
  if (!noMpCost) {
    if (skill.mpCost > 0 && player.mp < skill.mpCost) return { messages: ['MP不足！'] }
    player.mp -= skill.mpCost
  }

  const isAoeDamage = skill.target === 'aoe'
  const targets = isAoeDamage
    ? engine.getAliveEnemies()
    : [enemies[targetIndex]].filter(t => t && t.hp > 0)

  if (targets.length === 0) return null

  const result = {
    type: 'player_action', skill: skill.name, target: isAoeDamage ? '全体敌人' : targets[0].name,
    damage: 0, healing: 0, mpDrain: 0, hpDrain: 0, messages: [], crit: false, multiplier: 1,
    hitDetails: []
  }

  if (player.isStunned()) {
    result.messages.push(`${player.name} 被眩晕，无法行动！`)
    player.removeEffect(EFFECT_TYPES.STUN)
    return result
  }

  if (skill.healMul) {
    if (skill.target === 'all') {
      const healAmount = Math.floor(player.getEffectiveAttack() * skill.healMul)
      player.hp = Math.min(player.maxHp, player.hp + healAmount)
      result.healing = healAmount
      result.messages.push(`${player.name} 恢复了 ${healAmount} HP`)
      if (engine.companion && engine.companion.hp > 0) {
        const compHeal = Math.floor(player.getEffectiveAttack() * skill.healMul)
        engine.companion.hp = Math.min(engine.companion.maxHp, engine.companion.hp + compHeal)
        result.messages.push(`${engine.companion.name} 恢复了 ${compHeal} HP`)
      }
    } else {
      const heal = Math.floor(player.getEffectiveAttack() * skill.healMul)
      player.hp = Math.min(player.maxHp, player.hp + heal)
      result.healing = heal
      result.messages.push(`${player.name} 恢复了 ${heal} HP`)
    }
    return result
  }

  let totalDamage = 0
  for (const target of targets) {
    if (target.hp <= 0) continue

    const attackerSnap = {
      attack: player.getEffectiveAttack(),
      critRate: player.critRate,
      critDmg: player.critDmg,
      trueDmg: player.trueDmg,
      trueDmgPercent: player.trueDmgPercent || 0,
      element: skill.element || '',
      effects: player.effects || []
    }

    ;['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel'].forEach(elem => {
      attackerSnap[elem + 'Dmg'] = player.elemDmg[elem] || 0
    })
    if (skill.element) attackerSnap[skill.element + 'Dmg'] = player.elemDmg[skill.element] || 0

    const defenderSnap = {
      defense: target.getEffectiveDefense(),
      element: target.element,
      effects: target.effects || [],
      hpPercent: target.hp / target.maxHp
    }

    const specialOptions = {
      ignoreDef: player.specialIgnoreDef || 0,
      fullHpDmg: player.specialFullHpDmg || 0,
      bossDmg: player.specialBossDmg || 0,
      lowHpDmg: player.specialLowHpDmg || 0,
      critDmgOnMark: player.critDmgOnMark || 0
    }

    const { damage, crit, multiplier, trueDmg } = calculateDamage(attackerSnap, defenderSnap, skill, specialOptions)

    const hpBefore = target.hp
    target.takeDamage(damage, player)
    player._lastDamageDealt = damage

    if (player.holyMarkOnHit) {
      target.addEffect({
        type: 'holyMark',
        value: player.holyMarkOnHit,
        duration: 3
      })
    }

    if (player.lowHpLifestealOnMark && player.hp < player.maxHp * 0.5) {
      const hasMark = target.effects.some(e => e.type === 'holyMark')
      if (hasMark) {
        const drain = Math.floor(damage * player.lowHpLifestealOnMark / 100)
        player.hp = Math.min(player.maxHp, player.hp + drain)
        result.hpDrain += drain
      }
    }

    result.hitDetails.push({
      targetIndex: enemies.indexOf(target),
      damage,
      crit,
      multiplier,
      trueDmg: trueDmg || 0
    })

    totalDamage += damage

    if (target.traits?.includes('revive') && !target.hasRevived && target.hp <= 0) {
      target.hasRevived = true
      target.hp = Math.floor(target.maxHp * 0.3)
      result.messages.push(`${target.name} 复活了！`)
    }

    const actualHpLoss = Math.min(damage, hpBefore)   // 实际造成的生命损失

    // ✅ 修正：将 Buff 提供的吸血百分比累加入总吸血
    let buffLifesteal = 0
    player.effects?.forEach(e => {
      if (e.type === EFFECT_TYPES.LIFESTEAL_BUFF) buffLifesteal += (e.value || 0)
    })
    const totalLifesteal = (player.lifesteal || 0) + (player.specialLifestealPercent || 0) + buffLifesteal

    if (totalLifesteal > 0) {
      const drain = Math.floor(actualHpLoss * totalLifesteal / 100)
      if (drain > 0) { player.hp = Math.min(player.maxHp, player.hp + drain); result.hpDrain += drain }
    }

    const totalMpLifesteal = (player.mpLifesteal || 0) + (player.specialMpLifestealPercent || 0)
    if (totalMpLifesteal > 0) {
      const drain = Math.floor(actualHpLoss * totalMpLifesteal / 100)
      if (drain > 0) { player.mp = Math.min(player.maxMp, player.mp + drain); result.mpDrain += drain }
    }

    const mpOnHit = player.mpOnHit || 0
    if (mpOnHit > 0 && totalDamage > 0) {
      player.mp = Math.min(player.maxMp, player.mp + mpOnHit)
    }

    let msg = isAoeDamage
      ? `${player.name} 使用${skill.name}，对 ${target.name} 造成 ${damage} 伤害`
      : `${player.name} 使用${skill.name}，造成 ${damage} 伤害`

    if (crit) msg += ' (暴击)'
    if (multiplier > 1) msg += ' 效果拔群！'
    if (multiplier < 1) msg += ' 效果不理想...'

    result.messages.push(msg)

    if (target === targets[0]) { result.crit = crit; result.multiplier = multiplier }
    if (target.hp <= 0) result.messages.push(`${target.name} 被击败！`)
    if (engine.getAliveEnemies().length === 0) { engine.battleOver = true; engine.winner = 'player'; break }
  }

  result.damage = totalDamage

  if (skill.extraActions?.length && !engine.battleOver) {
    for (const action of skill.extraActions) {
      if (action.note === '追加攻击' || action.type === 'extraAction') {
        const extraTargets = action.target === 'aoe' ? engine.getAliveEnemies() : [targets[0]]
        for (const extraTarget of extraTargets) {
          if (!extraTarget || extraTarget.hp <= 0) continue
          if (Math.random() * 100 > (action.chance || 100)) continue

          const mul = (action.value || 50) / 100
          const as = {
            attack: player.getEffectiveAttack(), critRate: player.critRate, critDmg: player.critDmg,
            trueDmg: player.trueDmg, trueDmgPercent: player.trueDmgPercent || 0,
            element: skill.element || ''
          }
          if (skill.element) as[skill.element + 'Dmg'] = player.elemDmg[skill.element] || 0
          const specialOptions = {
            ignoreDef: player.specialIgnoreDef || 0,
            fullHpDmg: player.specialFullHpDmg || 0,
            bossDmg: player.specialBossDmg || 0,
            lowHpDmg: player.specialLowHpDmg || 0,
            critDmgOnMark: player.critDmgOnMark || 0
          }
          const { damage: extraDmg, crit: extraCrit, trueDmg: extraTrueDmg } = calculateDamage(
            as,
            { defense: extraTarget.getEffectiveDefense(), element: extraTarget.element, effects: extraTarget.effects || [] },
            { baseMul: skill.baseMul * mul, element: skill.element || '' },
            specialOptions
          )

          extraTarget.takeDamage(extraDmg, player)
          result.damage += extraDmg
          result.messages.push(`追加攻击造成 ${extraDmg} 伤害`)

          result.hitDetails.push({
            targetIndex: engine.enemies.indexOf(extraTarget),
            damage: extraDmg,
            crit: extraCrit,
            multiplier: 1,
            trueDmg: extraTrueDmg || 0
          })

          if (extraTarget.hp <= 0) {
            result.messages.push(`${extraTarget.name} 被击败！`)
            if (engine.getAliveEnemies().length === 0) {
              engine.battleOver = true
              engine.winner = 'player'
              break
            }
          }
        }
      }
    }
  }

  if (result.hpDrain > 0) result.messages.push(`合计吸取了 ${result.hpDrain} HP`)
  if (result.mpDrain > 0) result.messages.push(`合计吸取了 ${result.mpDrain} MP`)

  if (skill.effects && skill.effects.length > 0) {
    for (const effDef of skill.effects) {
      const isSelfTarget = skill.target === 'self' || effDef.target === 'self'
      const isAoeTarget = effDef.target === 'aoe' || skill.target === 'aoe'

      if (isAoeTarget) {
        for (const enemy of engine.getAliveEnemies()) {
          const msgs = applySkillEffects(player, enemy, [effDef], engine)
          result.messages.push(...msgs)
        }
      } else if (isSelfTarget) {
        const msgs = applySkillEffects(player, player, [effDef], engine)
        result.messages.push(...msgs)
      } else {
        const mainTarget = targets[0]
        if (mainTarget && mainTarget.hp > 0) {
          const msgs = applySkillEffects(player, mainTarget, [effDef], engine)
          result.messages.push(...msgs)
        }
      }
    }
  }

  if (engine.getAliveEnemies().length === 0) { engine.battleOver = true; engine.winner = 'player' }

  return result
}