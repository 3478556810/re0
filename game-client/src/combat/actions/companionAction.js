import { calculateDamage } from '../damageCalculator'
import { applySkillEffects } from '../effects/skillEffects'
import { checkElementReaction } from './elementReaction'
import { EFFECT_TYPES } from '../effectDefs'

export function executeCompanionAction(engine) {
  const { companion, player } = engine
  if (!companion || companion.hp <= 0) return { messages: [] }
  // ★ 策略优先
const skills = companion.skills || []
  const aliveEnemies = engine.getAliveEnemies()
  if (aliveEnemies.length === 0) return { messages: [] }

  // ★ 策略优先
  if (companion.strategy === 'attack') {
    // 全力输出：只选攻击技能
    const attackSkills = skills.filter(s => (s.baseMul || 0) > 0 && companion.mp >= (s.mpCost || 0))
    if (attackSkills.length > 0) {
      const chosen = attackSkills[Math.floor(Math.random() * attackSkills.length)]
      return executeCompanionSkill(engine, companion, chosen, aliveEnemies[0])
    }
    // 没有可用攻击技能，就发呆
    return { messages: [`${companion.name} 没有可用的攻击技能`] }
  }

  if (companion.strategy === 'heal') {
    // 优先治疗：只选治疗技能，没人受伤就发呆
    const healSkills = skills.filter(s =>
      s.effects?.some(e => e.type === 'heal') && companion.mp >= (s.mpCost || 0)
    )
    const needHeal = player.hp < player.maxHp || companion.hp < companion.maxHp
    if (healSkills.length > 0 && needHeal) {
      const chosen = healSkills[Math.floor(Math.random() * healSkills.length)]
      return executeCompanionSkill(engine, companion, chosen, null)
    }
    // 没人受伤或没有治疗技能，发呆（不攻击）
    return { messages: [`${companion.name} 等待治疗时机`] }
  }
  if (companion.isStunned()) {
    companion.removeEffect(EFFECT_TYPES.STUN)
    companion.removeEffect(EFFECT_TYPES.FREEZE)
    return { messages: [`${companion.name} 无法行动！`] }
  }



  const playerHpPercent = player.hp / player.maxHp
  const companionHpPercent = companion.hp / companion.maxHp

  // 辅助函数：从列表中随机选一个
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

  // 1. 治疗：玩家血量低于 50% 或伙伴血量低于 30%
  const healSkills = skills.filter(s =>
    s.effects?.some(e => e.type === 'heal') &&
    companion.mp >= (s.mpCost || 0)
  )
  if (healSkills.length > 0 && (playerHpPercent < 0.5 || companionHpPercent < 0.3)) {
    return executeCompanionSkill(engine, companion, pickRandom(healSkills), null)
  }

  // 2. 防护：玩家血量低于 70% 时套盾或加防御
  const shieldSkills = skills.filter(s =>
    s.effects?.some(e => e.type === 'shield' || (e.type === 'buff' && (e.stat === 'def' || e.stat === 'maxHp'))) &&
    companion.mp >= (s.mpCost || 0)
  )
  if (shieldSkills.length > 0 && playerHpPercent < 0.7) {
    return executeCompanionSkill(engine, companion, pickRandom(shieldSkills), null)
  }

  // 3. 控制：敌人数量 ≥2 且有控制技能
  const controlSkills = skills.filter(s =>
    s.effects?.some(e => e.type === 'freeze' || e.type === 'stun') &&
    companion.mp >= (s.mpCost || 0)
  )
  if (controlSkills.length > 0 && aliveEnemies.length >= 2) {
    return executeCompanionSkill(engine, companion, pickRandom(controlSkills), aliveEnemies[0])
  }

  // 4. 攻击：优先选带伤害倍率且 MP 足够的技能
  const attackSkills = skills.filter(s => (s.baseMul || 0) > 0 && companion.mp >= (s.mpCost || 0))
  if (attackSkills.length > 0) {
    return executeCompanionSkill(engine, companion, pickRandom(attackSkills), aliveEnemies[0])
  }

  // 5. 如果以上都没有，选任意 MP 足够的技能
  const anySkills = skills.filter(s => companion.mp >= (s.mpCost || 0))
  if (anySkills.length > 0) {
    return executeCompanionSkill(engine, companion, pickRandom(anySkills), aliveEnemies[0])
  }

  // 6. 兜底普通攻击
  return companionBasicAttack(engine, companion, aliveEnemies[0])
}

function executeCompanionSkill(engine, companion, skill, target) {
  const result = { messages: [], damage: 0 }

  // 智能目标选择
  if (!target) {
    const hasHeal = skill.effects?.some(e => e.type === 'heal')
    const hasShield = skill.effects?.some(e => e.type === 'shield')
    const hasBuff = skill.effects?.some(e => e.type === 'buff')

    if (hasHeal || hasShield || hasBuff) {
      const playerHpPct = engine.player.hp / engine.player.maxHp
      const companionHpPct = companion.hp / companion.maxHp
      if (playerHpPct < 0.4) target = engine.player
      else if (companionHpPct < 0.3) target = companion
      else if (skill.target === 'all' || skill.effects?.some(e => e.target === 'all')) target = 'all'
      else target = engine.player
    } else if (skill.target === 'self') {
      target = companion
    } else if (skill.target === 'aoe' || skill.target === 'all') {
      target = 'aoe'
    } else {
      const aliveEnemies = engine.getAliveEnemies()
      target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
    }
  }

  if (!target || (target !== 'all' && target !== 'aoe' && target.hp <= 0)) {
    return companionBasicAttack(engine, companion, engine.getAliveEnemies()[0])
  }

  // MP 消耗
  const mpCostReduction = engine.player?.mpCostReduction || 0
  const actualMpCost = Math.max(1, Math.floor((skill.mpCost || 0) * (1 - mpCostReduction / 100)))
  if (companion.mp < actualMpCost) {
    return companionBasicAttack(engine, companion, engine.getAliveEnemies()[0])
  }
  companion.mp -= actualMpCost

  // 伙伴技能等级（用于元素反应）
  const skillLevel = skill.currentLevel || skill.level || 0

  // ========== 伤害处理 ==========
  if (skill.baseMul > 0 && target !== 'all' && target !== 'aoe' && target !== companion) {
    // 单体攻击
    const attackerSnap = buildAttackerSnap(companion, skill)
    const defenderSnap = buildDefenderSnap(target)
    const { damage, crit } = calculateDamage(attackerSnap, defenderSnap, skill)
    target.takeDamage(damage, companion)
    let msg = `${companion.name} 对 ${target.name} 使用【${skill.name}】，造成 ${damage} 伤害`
    if (crit) msg += ' (暴击)'
    result.messages.push(msg)
    result.damage = damage

    // 元素反应
    checkElementReaction(engine, companion, target, skill, result, damage, {
      skillLevel,
      masteryMultiplier: 1.0
    })

  } else if (skill.baseMul > 0 && skill.target === 'aoe') {
    // AOE
    const aliveEnemies = engine.getAliveEnemies()
    for (const enemy of aliveEnemies) {
      const attackerSnap = buildAttackerSnap(companion, skill)
      const defenderSnap = buildDefenderSnap(enemy)
      const { damage, crit } = calculateDamage(attackerSnap, defenderSnap, skill)
      enemy.takeDamage(damage, companion)
      let msg = `${companion.name} 对 ${enemy.name} 使用【${skill.name}】，造成 ${damage} 伤害`
      if (crit) msg += ' (暴击)'
      result.messages.push(msg)

      // 每个敌人单独触发元素反应
      checkElementReaction(engine, companion, enemy, skill, result, damage, {
        skillLevel,
        masteryMultiplier: 1.0
      })
    }
  } else {
    result.messages.push(`${companion.name} 使用【${skill.name}】`)
  }

  // ========== 技能效果 ==========
  if (skill.effects?.length) {
    for (const effDef of skill.effects) {
      if (effDef.target === 'self' || skill.target === 'self') {
        result.messages.push(...applySkillEffects(companion, companion, [effDef], engine))
      } else if (effDef.target === 'aoe' || skill.target === 'aoe') {
        for (const enemy of engine.getAliveEnemies()) {
          result.messages.push(...applySkillEffects(companion, enemy, [effDef], engine))
        }
      } else if (effDef.target === 'all' || skill.target === 'all') {
        result.messages.push(...applySkillEffects(companion, engine.player, [effDef], engine))
        if (companion !== engine.player) {
          result.messages.push(...applySkillEffects(companion, companion, [effDef], engine))
        }
      } else if (target === companion || target === engine.player) {
        result.messages.push(...applySkillEffects(companion, target, [effDef], engine))
      } else if (target !== 'all' && target !== 'aoe' && target !== companion) {
        result.messages.push(...applySkillEffects(companion, target, [effDef], engine))
      }
    }
  }

  // 天赋回蓝
  if (skill.effects?.some(e => e.type === 'heal')) {
    const talents = engine.player?.talents || {}
    const player = engine.player
    if (talents['o_notable_mp']) {
      player.mp = Math.min(player.maxMp, player.mp + Math.floor(player.maxMp * 0.03))
    }
    if (talents['s_notable_mp']) {
      player.mp = Math.min(player.maxMp, player.mp + Math.floor(player.maxMp * 0.04))
    }
  }

  // 击杀检测
  if (target !== 'all' && target !== 'aoe' && target !== companion && target !== engine.player && target.hp <= 0) {
    result.messages.push(`${target.name} 被击败！`)
    if (engine.getAliveEnemies().length === 0) {
      engine.battleOver = true
      engine.winner = 'player'
    }
  }

  return { ...result, type: 'companion_action' }
}

function companionBasicAttack(engine, companion, target) {
  if (!target || target.hp <= 0) return { messages: [] }
  const attackerSnap = buildAttackerSnap(companion, { element: '', baseMul: 0.7 })
  const defenderSnap = buildDefenderSnap(target)
  const { damage, crit } = calculateDamage(attackerSnap, defenderSnap, { baseMul: 0.7 })
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

// 构建攻击快照（通用）
function buildAttackerSnap(unit, skill) {
  const snap = {
    attack: unit.getEffectiveAttack(),
    critRate: unit.critRate || 5,
    critDmg: unit.critDmg || 150,
    trueDmg: unit.trueDmg || 0,
    element: skill.element || '',
      effects: unit.effects || [],   // ← 添加
  }
  const elems = ['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel']
  for (const e of elems) {
    snap[e + 'Dmg'] = unit[e + 'Dmg'] || 0
  }
  return snap
}

function buildDefenderSnap(defender) {
  return {
    defense: defender.getEffectiveDefense(),
    element: defender.element || '',
    hpPercent: defender.hp / defender.maxHp,
    maxHp: defender.maxHp
  }
}