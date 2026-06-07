import { calculateDamage } from '../damageCalculator'
import { applySkillEffects } from '../effects/skillEffects'
import { EFFECT_TYPES } from '../effectDefs'

export function executeCompanionAction(engine) {
  const { companion, player } = engine
  if (!companion || companion.hp <= 0) return { messages: [] }

  // 被控跳过
  if (companion.isStunned()) {
    companion.removeEffect(EFFECT_TYPES.STUN)
    companion.removeEffect(EFFECT_TYPES.FREEZE)
    return { messages: [`${companion.name} 无法行动！`] }
  }

  const skills = companion.skills || []
  const aliveEnemies = engine.getAliveEnemies()
  if (aliveEnemies.length === 0) return { messages: [] }

  const playerHpPercent = player.hp / player.maxHp
  const companionHpPercent = companion.hp / companion.maxHp

  // 1. 治疗：玩家血量低于 50% 或伙伴血量低于 30%
  const healSkill = skills.find(s =>
    s.effects?.some(e => e.type === 'heal') &&
    companion.mp >= (s.mpCost || 0)
  )
  if (healSkill && (playerHpPercent < 0.5 || companionHpPercent < 0.3)) {
    return executeCompanionSkill(engine, companion, healSkill, null)
  }

  // 2. 防护：玩家血量低于 70% 时套盾或加防御
  const shieldSkill = skills.find(s =>
    s.effects?.some(e => e.type === 'shield' || (e.type === 'buff' && (e.stat === 'def' || e.stat === 'maxHp'))) &&
    companion.mp >= (s.mpCost || 0)
  )
  if (shieldSkill && playerHpPercent < 0.7) {
    return executeCompanionSkill(engine, companion, shieldSkill, null)
  }

  // 3. 控制：敌人数量 ≥2 且有控制技能
  const controlSkill = skills.find(s =>
    s.effects?.some(e => e.type === 'freeze' || e.type === 'stun') &&
    companion.mp >= (s.mpCost || 0)
  )
  if (controlSkill && aliveEnemies.length >= 2) {
    return executeCompanionSkill(engine, companion, controlSkill, aliveEnemies[0])
  }

  // 4. 攻击：优先选带伤害倍率的技能
  let chosenSkill = skills.find(s => (s.baseMul || 0) > 0 && companion.mp >= (s.mpCost || 0))
  if (!chosenSkill) {
    chosenSkill = skills.find(s => companion.mp >= (s.mpCost || 0))
  }
  if (chosenSkill) {
    return executeCompanionSkill(engine, companion, chosenSkill, aliveEnemies[0])
  }

  // 5. 兜底普通攻击
  return companionBasicAttack(engine, companion, aliveEnemies[0])
}

function executeCompanionSkill(engine, companion, skill, target) {
  // ========== 智能目标选择 ==========
  if (!target) {
    const hasHeal = skill.effects?.some(e => e.type === 'heal')
    const hasShield = skill.effects?.some(e => e.type === 'shield')
    const hasBuff = skill.effects?.some(e => e.type === 'buff' && (e.stat === 'def' || e.stat === 'maxHp' || e.stat === 'speed'))
    
    if (hasHeal || hasShield || hasBuff) {
      const playerHpPercent = engine.player.hp / engine.player.maxHp
      const companionHpPercent = companion.hp / companion.maxHp
      
      if (playerHpPercent < 0.4) {
        target = engine.player
      } else if (companionHpPercent < 0.3) {
        target = companion
      } else if (skill.target === 'all' || skill.effects?.some(e => e.target === 'all')) {
        target = 'all'
      } else {
        target = engine.player
      }
    } else if (skill.target === 'self') {
      target = companion
    } else if (skill.target === 'aoe' || skill.target === 'all') {
      target = 'aoe'
    } else {
      const aliveEnemies = engine.getAliveEnemies()
      if (aliveEnemies.length === 0) return companionBasicAttack(engine, companion, aliveEnemies[0])
      target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
    }
  }

  // 目标无效时兜底
  if (!target || (target !== 'all' && target !== 'aoe' && target.hp <= 0)) {
    return companionBasicAttack(engine, companion, engine.getAliveEnemies()[0])
  }

  // 消耗 MP（应用玩家 mpCostReduction）
  const mpCostReduction = engine.player?.mpCostReduction || 0
  const actualMpCost = Math.max(1, Math.floor((skill.mpCost || 0) * (1 - mpCostReduction / 100)))
  if (companion.mp < actualMpCost) {
    return companionBasicAttack(engine, companion, target !== 'all' && target !== 'aoe' ? target : engine.getAliveEnemies()[0])
  }
  companion.mp -= actualMpCost

  const messages = []

  // 伤害计算
  let damage = 0, crit = false
  if (skill.baseMul > 0 && target !== 'all' && target !== 'aoe' && target !== companion) {
    const attackerSnap = {
      attack: companion.attack,
      critRate: companion.critRate || 5,
      critDmg: companion.critDmg || 150,
      trueDmg: companion.trueDmg || 0,
      element: skill.element || '',
    }
    const elems = ['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel']
    for (const e of elems) {
      attackerSnap[e + 'Dmg'] = companion[e + 'Dmg'] || 0
    }
    const defenderSnap = {
      defense: target.getEffectiveDefense(),
      element: target.element || ''
    }
    const result = calculateDamage(attackerSnap, defenderSnap, skill)
    damage = result.damage
    crit = result.crit
    target.takeDamage(damage, companion)
    let msg = `${companion.name} 对 ${target.name} 使用【${skill.name}】，造成 ${damage} 伤害`
    if (crit) msg += ' (暴击)'
    messages.push(msg)
  } else if (skill.baseMul > 0 && skill.target === 'aoe') {
    const aliveEnemies = engine.getAliveEnemies()
    for (const enemy of aliveEnemies) {
      const attackerSnap = {
        attack: companion.attack,
        critRate: companion.critRate || 5,
        critDmg: companion.critDmg || 150,
        element: skill.element || '',
      }
      const defenderSnap = {
        defense: enemy.getEffectiveDefense(),
        element: enemy.element || ''
      }
      const result = calculateDamage(attackerSnap, defenderSnap, skill)
      enemy.takeDamage(result.damage, companion)
      messages.push(`${companion.name} 对 ${enemy.name} 使用【${skill.name}】，造成 ${result.damage} 伤害`)
    }
  } else if (skill.target === 'all' || skill.target === 'self') {
    messages.push(`${companion.name} 使用【${skill.name}】`)
  } else if (target === companion || target === engine.player) {
    messages.push(`${companion.name} 对 ${target.name} 使用【${skill.name}】`)
  } else {
    messages.push(`${companion.name} 使用【${skill.name}】`)
  }

  // 处理技能附加效果
  if (skill.effects?.length) {
    for (const effDef of skill.effects) {
      if (effDef.target === 'self' || skill.target === 'self') {
        messages.push(...applySkillEffects(companion, companion, [effDef], engine))
      } else if (effDef.target === 'aoe' || skill.target === 'aoe') {
        for (const enemy of engine.getAliveEnemies()) {
          messages.push(...applySkillEffects(companion, enemy, [effDef], engine))
        }
      } else if (effDef.target === 'all' || skill.target === 'all') {
        // 全体效果：给玩家和伙伴
        messages.push(...applySkillEffects(companion, engine.player, [effDef], engine))
        if (companion !== engine.player) {
          messages.push(...applySkillEffects(companion, companion, [effDef], engine))
        }
      } else if (target === companion || target === engine.player) {
        messages.push(...applySkillEffects(companion, target, [effDef], engine))
      } else if (target !== 'all' && target !== 'aoe' && target !== companion) {
        messages.push(...applySkillEffects(companion, target, [effDef], engine))
      }
    }
  }

  // 伙伴使用治疗技能时，根据玩家天赋回蓝
  if (skill.effects?.some(e => e.type === 'heal')) {
    const talents = engine.player?.talents || {}
    const player = engine.player

    if (talents['o_notable_mp']) {
      const regen = Math.floor(player.maxMp * 0.03)
      player.mp = Math.min(player.maxMp, player.mp + regen)
    }
    if (talents['s_notable_mp']) {
      const regen = Math.floor(player.maxMp * 0.04)
      player.mp = Math.min(player.maxMp, player.mp + regen)
    }
  }

  // 检查目标死亡
  if (target !== 'all' && target !== 'aoe' && target !== companion && target !== engine.player && target.hp <= 0) {
    messages.push(`${target.name} 被击败！`)
    if (engine.getAliveEnemies().length === 0) {
      engine.battleOver = true
      engine.winner = 'player'
    }
  }

  return { messages, type: 'companion_action', damage }
}

function companionBasicAttack(engine, companion, target) {
  if (!target || target.hp <= 0) return { messages: [] }
  const { damage, crit } = calculateDamage(
    { attack: companion.attack, critRate: companion.critRate || 5, critDmg: companion.critDmg || 150 },
    { defense: target.getEffectiveDefense(), element: target.element || '' },
    { baseMul: 0.7 }
  )
  target.takeDamage(damage, companion)
  let msg = `${companion.name} 攻击了 ${target.name}，造成 ${damage} 伤害`
  if (crit) msg += ' (暴击)'
  if (target.hp <= 0) {
    msg += `，${target.name} 被击败！`
    if (engine.getAliveEnemies().length === 0) {
      engine.battleOver = true
      engine.winner = 'player'
    }
  }
  return { messages: [msg], type: 'companion_action', damage }
}