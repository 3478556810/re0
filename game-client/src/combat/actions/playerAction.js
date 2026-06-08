import { calculateDamage } from '../damageCalculator'
import { EFFECT_TYPES } from '../effectDefs'
import { applySkillEffects } from '../effects/skillEffects'
import { checkElementReaction } from './elementReaction'   // ★ 新增导入

export function executePlayerAction(engine, skill, targetIndex, options = {}) {
  const { player, enemies } = engine

  console.log('🔥🔥🔥 playerAction 已执行！技能:', skill.name)
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

if (skill.healMul || skill.effects?.some(e => e.type === 'heal' || e.type === 'healPercent')) {
  // 1. 攻击力加成治疗
  const totalHealMul = (skill.healMul || 0) * (1 + (player.healBonus || 0) / 100)
  const atkHeal = Math.floor(player.getEffectiveAttack() * totalHealMul)
  
  // 2. 生命值百分比治疗
  const percentEffect = skill.effects?.find(e => e.type === 'healPercent')
  const percentHeal = percentEffect ? Math.floor(player.maxHp * percentEffect.value) : 0
  
  // 3. 总治疗量
  const healAmount = Math.max(0, atkHeal + percentHeal)

  // 4. 治疗目标（群体或单体）
  if (skill.target === 'all') {
    player.hp = Math.min(player.maxHp, player.hp + healAmount)
    result.healing = healAmount
    result.messages.push(`${player.name} 恢复了 ${healAmount} HP`)
    
    if (engine.companion && engine.companion.hp > 0) {
      // 伙伴治疗：也享受相同的百分比加成（基于伙伴自身最大生命值）
      const compAtkHeal = Math.floor(player.getEffectiveAttack() * totalHealMul)
      const compPercentHeal = percentEffect ? Math.floor(engine.companion.maxHp * percentEffect.value) : 0
      const compHeal = Math.max(0, compAtkHeal + compPercentHeal)
      engine.companion.hp = Math.min(engine.companion.maxHp, engine.companion.hp + compHeal)
      result.messages.push(`${engine.companion.name} 恢复了 ${compHeal} HP`)
    }
  } else {
    player.hp = Math.min(player.maxHp, player.hp + healAmount)
    result.healing = healAmount
    result.messages.push(`${player.name} 恢复了 ${healAmount} HP`)
  }

  // 5. 治疗附加效果（护盾、攻击力buff等，保持不变）
if (talents['o_heal3'] || talents['s_heal6']) {
    // 护盾值大幅增强：生命值 + 攻击力混合
    const shieldValue = Math.floor(player.maxHp * 0.15) + Math.floor(player.getEffectiveAttack() * 0.5)
    
    if (skill.target === 'all') {
        player.addEffect({ type: EFFECT_TYPES.SHIELD, value: shieldValue, duration: 3 })
        if (engine.companion?.hp > 0) {
            engine.companion.addEffect({ type: EFFECT_TYPES.SHIELD, value: shieldValue, duration: 3 })
        }
    } else {
        player.addEffect({ type: EFFECT_TYPES.SHIELD, value: shieldValue, duration: 3 })
    }
    result.messages.push(`圣光护盾吸收 ${shieldValue} 伤害`)
}

  // 圣光灌注
  if (talents['o_notable_heal']) {
    player.addEffect({
      type: 'holyAnthem',
      value: { atkPercent: 40, critDmgPercent: 100 },
      duration: 4,
      stackable: false
    })
    if (engine.companion?.hp > 0) {
      engine.companion.addEffect({
        type: 'holyAnthem',
        value: { atkPercent: 40, critDmgPercent: 100 },
        duration: 4,
        stackable: false
      })
    }
    result.messages.push('圣光灌注：攻击力+40%，暴击伤害+100%')
  }

  // 神圣赞美诗
  if (talents['s_notable_heal']) {
    const effectValue = { atkPercent: 50, critDmgBonus: 120 }
    player.addEffect({
      type: EFFECT_TYPES.HOLY_ANTHEM,
      value: effectValue,
      duration: 3,
      stackable: false
    })
    if (engine.companion?.hp > 0) {
      engine.companion.addEffect({
        type: EFFECT_TYPES.HOLY_ANTHEM,
        value: effectValue,
        duration: 3,
        stackable: false
      })
    }
    result.messages.push('神圣赞美诗：攻击力+50%，暴击伤害+120%')
  }

  return result
}

  let totalDamage = 0
  for (const target of targets) {
    if (target.hp <= 0) continue

    // 无敌判定
    if (target.isBossInvincible) {
      if (target.invincibleWeakness && skill.element === target.invincibleWeakness) {
        target.isBossInvincible = false
        target.invincibleReason = ''
        target.removeEffect(EFFECT_TYPES.SHIELD)
        result.messages.push(`无敌被${getElementLabel(skill.element)}属性打破！`)
      } else {
        result.messages.push(`${target.name} 免疫了所有伤害！`)
        result.hitDetails.push({
          targetIndex: enemies.indexOf(target),
          damage: 0,
          crit: false,
          multiplier: 1,
          trueDmg: 0
        })
        continue
      }
    }

    // 正常伤害计算
    const attackerSnap = {
      highHpBoost: skill.highHpBoost || 0,
      attack: player.getEffectiveAttack(),
      critRate: player.critRate,
      critDmg: player.critDmg,
      trueDmg: player.trueDmg,
      trueDmgPercent: player.trueDmgPercent || 0,
      element: skill.element || '',
      effects: player.effects || [],
      fireStackBonus: skill.fireStackBonus || 0,
    }
    player._lastSkillElement = skill.element || ''
    ;['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel'].forEach(elem => {
      attackerSnap[elem + 'Dmg'] = player.elemDmg[elem] || 0
    })
    if (skill.element) attackerSnap[skill.element + 'Dmg'] = player.elemDmg[skill.element] || 0

    const defenderSnap = {
      defense: target.getEffectiveDefense(),
      element: target.element,
      effects: target.effects || [],
      hpPercent: target.hp / target.maxHp,
      maxHp: target.maxHp,
      hp: target.hp
    }

    const specialOptions = {
      ignoreDef: player.specialIgnoreDef || 0,
      fullHpDmg: player.specialFullHpDmg || 0,
      bossDmg: player.specialBossDmg || 0,
      lowHpDmg: player.specialLowHpDmg || 0,
      critDmgOnMark: player.critDmgOnMark || 0
    }

    // 条件增伤
    let conditionalBonus = 1.0
    if (skill.effects?.some(e => e.type === 'shatter') && target.effects?.some(e => e.type === 'freeze')) {
      conditionalBonus *= 2.0
      target.removeEffect('freeze')
    }
    if (skill.effects?.some(e => e.type === 'freezeBonus') && target.effects?.some(e => e.type === 'freeze')) {
      conditionalBonus *= 1.5
      player._forceCritNext = true
    }
    if (skill.effects?.some(e => e.type === 'stunBonus') && target.effects?.some(e => e.type === 'stun')) {
      conditionalBonus *= 2.0
    }
    if (skill.effects?.some(e => e.type === 'stunCrit') && target.effects?.some(e => e.type === 'stun')) {
      player._forceCritNext = true
    }
    if (skill.effects?.some(e => e.type === 'executioner') && target.hp / target.maxHp < 0.3) {
      conditionalBonus *= 2.0
    }

    const effectiveMul = skill.baseMul * conditionalBonus
    const effectiveSkill = { ...skill, baseMul: effectiveMul }

    const { damage, crit, multiplier, shadowTrueDmg, trueDmg } = calculateDamage(attackerSnap, defenderSnap, effectiveSkill, specialOptions)
    result.shadowTrueDmg = (result.shadowTrueDmg || 0) + (shadowTrueDmg || 0)

    if (shadowTrueDmg > 0) {
      result.hitDetails.push({
        targetIndex: enemies.indexOf(target),
        damage: shadowTrueDmg,
        crit: false,
        multiplier: 1,
        isShadowTrue: true
      })
    }

    const hpBefore = target.hp
    const deathResult = target.takeDamage(damage, player)

    if (deathResult?.dodged) {
      result.messages.push(`${target.name} 闪避了攻击！`)
    }
    if (deathResult?.invulnerable) {
      result.messages.push(`${target.name} 免疫了所有伤害！`)
    }

    player._lastDamageDealt = damage

    // ★★★ 元素反应调用（已解耦） ★★★
    const skillLevel = (engine.playerSkills[skill.id]?.level) || 0
    const masteryMultiplier = (player.classMechanism === 'elemental_mastery') ? 1.5 : 1.0
    checkElementReaction(engine, player, target, skill, result, damage, {
      skillLevel,
      masteryMultiplier
    })

    if (window.recordDamage) {
      window.recordDamage(damage, crit, shadowTrueDmg || 0)
    }

    // 龙焰印记
    if (player.dragonMarkOnHit) {
      const existing = target.effects.find(e => e.type === EFFECT_TYPES.DRAGON_MARK)
      if (existing) {
        existing.stacks = (existing.stacks || 1) + 1
        existing.duration = 5
        existing.animClass = 'dragon-mark-glow'
      } else {
        target.addEffect({
          type: EFFECT_TYPES.DRAGON_MARK,
          value: player.dragonMarkOnHit,
          duration: 5,
          stackable: true,
          maxStacks: 99,
          animClass: 'dragon-mark-glow'
        })
      }
    }

    // 暗蚀印记
    if (player.shadowMarkOnHit) {
      const effects = target.effects
      const existingIdx = effects.findIndex(e => e.type === EFFECT_TYPES.SHADOW_MARK)
      if (existingIdx !== -1) {
        const old = effects[existingIdx]
        const newStacks = (old.stacks || 1) + 1
        effects.splice(existingIdx, 1)
        effects.push({
          type: EFFECT_TYPES.SHADOW_MARK,
          value: player.shadowMarkOnHit,
          duration: 5,
          stacks: newStacks,
          stackable: true,
          maxStacks: 99,
          animClass: 'shadow-mark-glow',
          animKey: Math.random()
        })
      } else {
        effects.push({
          type: EFFECT_TYPES.SHADOW_MARK,
          value: player.shadowMarkOnHit,
          duration: 5,
          stacks: 1,
          stackable: true,
          maxStacks: 99,
          animClass: 'shadow-mark-glow',
          animKey: Math.random()
        })
      }
      target.effects = [...effects]
    }

    // 低血量印记吸血
    if (player.lowHpLifestealOnMark && player.hp < player.maxHp * 0.5) {
      const hasMark = target.effects.some(e => e.type === 'dragonMark')
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

    totalDamage += deathResult?.invulnerable ? 0 : damage

    // 死亡/复活处理
    if (deathResult?.deathSaved) {
      result.messages.push(`${target.name} 顽强地存活下来！`)
    } else if (deathResult?.revived) {
      result.messages.push(`${target.name} 从死亡中复活！`)
    } else if (target.hp <= 0) {
      if (target.traits?.includes('revive') && !target.hasRevived) {
        target.hasRevived = true
        target.hp = Math.floor(target.maxHp * 0.3)
        result.messages.push(`${target.name} 复活了！`)
      } else {
        target.hp = 0
        result.messages.push(`${target.name} 被击败！`)
      }
    }

    // 吸血
    let buffLifesteal = 0
    player.effects?.forEach(e => {
      if (e.type === EFFECT_TYPES.LIFESTEAL_BUFF) buffLifesteal += (e.value || 0)
    })
    const totalLifesteal = (player.lifesteal || 0) + (player.specialLifestealPercent || 0) + buffLifesteal
    if (totalLifesteal > 0) {
      let drain = Math.floor(player.maxHp * totalLifesteal / 100)
      if (isAoeDamage) drain = Math.floor(drain * 0.3)
      if (player.effects?.some(e => e.type === 'healReduction' || e.type === 'wounded')) drain = Math.floor(drain * 0.3)
      player.hp = Math.min(player.maxHp, player.hp + drain)
      result.hpDrain += drain
    }

    // 吸蓝
    const totalMpLifesteal = (player.mpLifesteal || 0) + (player.specialMpLifestealPercent || 0)
    if (totalMpLifesteal > 0) {
      const drain = Math.floor(player.maxMp * totalMpLifesteal / 100)
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

    if (target.hp <= 0 && !deathResult?.deathSaved && !deathResult?.revived) {
      if (engine.getAliveEnemies().length === 0) {
        engine.battleOver = true
        engine.winner = 'player'
        break
      }
    }
  }

  result.damage = totalDamage

  // 追加攻击（保持不变）
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

          const extraDeathResult = extraTarget.takeDamage(extraDmg, player)
          result.damage += extraDmg
          result.messages.push(`追加攻击造成 ${extraDmg} 伤害`)

          result.hitDetails.push({
            targetIndex: engine.enemies.indexOf(extraTarget),
            damage: extraDmg,
            crit: extraCrit,
            multiplier: 1,
            trueDmg: extraTrueDmg || 0,
          })

          if (extraTarget.hp <= 0 && !extraDeathResult?.deathSaved && !extraDeathResult?.revived) {
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

  // 技能附加效果
  if (skill.effects && skill.effects.length > 0) {
    for (const effDef of skill.effects) {
      const isSelfTarget = skill.target === 'self' || effDef.target === 'self'
      const isAoeTarget = effDef.target === 'aoe' || skill.target === 'aoe'
      const isAllAllies = skill.target === 'all' || effDef.target === 'all'

      if (isAllAllies) {
        const allies = [player]
        if (engine.companion?.hp > 0) allies.push(engine.companion)
        for (const ally of allies) {
          result.messages.push(...applySkillEffects(player, ally, [effDef], engine))
        }
      } else if (isAoeTarget) {
        for (const enemy of engine.getAliveEnemies()) {
          result.messages.push(...applySkillEffects(player, enemy, [effDef], engine))
        }
      } else if (isSelfTarget) {
        result.messages.push(...applySkillEffects(player, player, [effDef], engine))
      } else {
        const mainTarget = targets[0]
        if (mainTarget && mainTarget.hp > 0) {
          result.messages.push(...applySkillEffects(player, mainTarget, [effDef], engine))
        }
      }
    }
  }

  if (engine.getAliveEnemies().length === 0) { engine.battleOver = true; engine.winner = 'player' }

  return result
}