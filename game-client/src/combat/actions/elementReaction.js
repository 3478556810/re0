import { EFFECT_TYPES } from '../effectDefs'

const ELEMENT_REACTIONS = {
  'fire_water': { name: '蒸发', dmgMul: 2.0 },
  'fire_thunder': { name: '超载', aoeDmgMul: 1.5 },
  'fire_grass': { name: '燃烧', dotValue: 0.8, dotDuration: 3 },
  'thunder_water': { name: '感电', chainDmgMul: 0.8, chainCount: 4 },
  'ice_water': { name: '冻结', dmgMul: 1.8, freezeDuration: 1 },
  'ice_thunder': { name: '超导', dmgMul: 1.5, defReduce: 0.5, defDuration: 3 },
  'grass_water': { name: '生长', healPercent: 0.30 },
  'dark_holy': { name: '湮灭', dmgMul: 2.0 },
  'fire_rock': { name: '熔岩', dotValue: 0.6, dotDuration: 3 },
  'fire_poison': { name: '毒爆', burstPerStack: 0.08 },
  // 扩散系列
  'fire_wind': { name: '扩散', spread: true },
  'grass_wind': { name: '扩散', spread: true },
  'ice_wind': { name: '扩散', spread: true },
  'dark_wind': { name: '扩散', spread: true },
  'holy_wind': { name: '扩散', spread: true },
  'poison_wind': { name: '扩散', spread: true },
  'rock_wind': { name: '扩散', spread: true },
  'thunder_wind': { name: '扩散', spread: true },
  'water_wind': { name: '扩散', spread: true }
}

function getElementLabel(element) {
  const map = {
    fire: '火', water: '水', thunder: '雷', wind: '风',
    grass: '草', ice: '冰', holy: '圣', dark: '暗',
    rock: '岩', steel: '钢', poison: '毒'
  }
  return map[element] || element
}

/**
 * 通用元素反应检查
 * @param {object} engine - 战斗引擎
 * @param {object} attacker - 攻击者（玩家或伙伴）
 * @param {object} target - 目标（敌人）
 * @param {object} skill - 技能对象
 * @param {object} result - 结果对象（messages在此追加）
 * @param {number} damage - 本次伤害
 * @param {object} options - { skillLevel, masteryMultiplier }
 */
export function checkElementReaction(engine, attacker, target, skill, result, damage, options = {}) {
  const { skillLevel = 0, masteryMultiplier = 1.0 } = options
  if (skillLevel < 10) return
  if (!skill.element) return

  const existingMark = target.effects?.find(e =>
    e.type === 'element_mark' && e.element !== skill.element
  )

  if (existingMark) {
    const key = [existingMark.element, skill.element].sort().join('_')
    const reaction = ELEMENT_REACTIONS[key]
    if (!reaction) return

    const scale = 1 + Math.max(0, skillLevel - 10) * 0.1

    // 扩散
    if (reaction.spread) {
      const allEnemies = engine.getAliveEnemies()
      const spreadElement = existingMark.element === 'wind' ? skill.element : existingMark.element
      let spreadDmg = Math.floor(attacker.getEffectiveAttack() * 0.8 * scale)
      spreadDmg = Math.floor(spreadDmg * masteryMultiplier)
      for (const enemy of allEnemies) {
        enemy.takeDamage(spreadDmg, attacker)
      }
      for (const enemy of allEnemies) {
        const existing = enemy.effects?.find(e => e.type === 'element_mark')
        if (existing) enemy.removeEffect('element_mark')
        enemy.addEffect({ type: 'element_mark', element: spreadElement, duration: 5, stackable: false })
      }
      if (existingMark.element === 'wind') target.removeEffect('element_mark')
      result.messages.push(`触发元素反应：扩散！造成 ${spreadDmg} 伤害，并扩散${getElementLabel(spreadElement)}印记`)
      return
    }

    // 伤害乘算反应
    if (reaction.dmgMul) {
      const markDamage = existingMark.markDamage || damage
      const totalBaseDamage = damage + markDamage
      let reactionDamage = Math.floor(totalBaseDamage * reaction.dmgMul * scale)
      reactionDamage = Math.floor(reactionDamage * masteryMultiplier)
      target.takeDamage(reactionDamage, attacker)
      if (reaction.freezeDuration) {
        target.addEffect({ type: EFFECT_TYPES.FREEZE, duration: reaction.freezeDuration, stackable: false })
        result.messages.push(`触发元素反应：${reaction.name}！造成 ${reactionDamage} 伤害并冻结目标`)
      } else if (reaction.defReduce) {
        target.addEffect({ type: EFFECT_TYPES.DEF_DOWN, value: -reaction.defReduce, duration: reaction.defDuration, stackable: false })
        result.messages.push(`触发元素反应：${reaction.name}！造成 ${reactionDamage} 伤害并降低防御`)
      } else {
        result.messages.push(`触发元素反应：${reaction.name}！造成 ${reactionDamage} 点额外伤害`)
      }
      target.removeEffect('element_mark')
      return
    }

    // 超载
    if (reaction.aoeDmgMul) {
      let aoeDmg = Math.floor(damage * reaction.aoeDmgMul * scale)
      aoeDmg = Math.floor(aoeDmg * masteryMultiplier)
      const aliveEnemies = engine.getAliveEnemies()
      for (const enemy of aliveEnemies) {
        enemy.takeDamage(aoeDmg, attacker)
      }
      result.messages.push(`触发元素反应：${reaction.name}！对所有敌人造成 ${aoeDmg} 伤害`)
      target.removeEffect('element_mark')
      return
    }

    // 感电
    if (reaction.chainDmgMul) {
      let chainDmg = Math.floor(damage * reaction.chainDmgMul * scale)
      chainDmg = Math.floor(chainDmg * masteryMultiplier)
      target.takeDamage(chainDmg, attacker)
      result.messages.push(`触发元素反应：${reaction.name}！额外造成 ${chainDmg} 伤害`)
      const otherEnemies = engine.getAliveEnemies().filter(e => e !== target && e.hp > 0)
      let currentDmg = chainDmg
      for (let i = 0; i < Math.min(reaction.chainCount, otherEnemies.length); i++) {
        const nextTarget = otherEnemies[i % otherEnemies.length]
        currentDmg = Math.floor(currentDmg * 0.7)
        if (currentDmg <= 0) break
        nextTarget.takeDamage(currentDmg, attacker)
        result.messages.push(`感电弹射到 ${nextTarget.name}，造成 ${currentDmg} 伤害`)
      }
      target.removeEffect('element_mark')
      return
    }

    // 持续伤害
    if (reaction.dotValue) {
      target.addEffect({
        type: EFFECT_TYPES.BURN,
        value: reaction.dotValue,
        duration: reaction.dotDuration || 3,
        stackable: true,
        maxStacks: 5,
        casterAttack: attacker.getEffectiveAttack()
      })
      result.messages.push(`触发元素反应：${reaction.name}！目标被灼烧`)
      target.removeEffect('element_mark')
      return
    }

    // 毒爆
    if (reaction.burstPerStack) {
      const poison = target.effects?.find(e => e.type === EFFECT_TYPES.DOT && e.isPercentHp)
      if (poison) {
        const stacks = poison.stacks || 1
        let burstDmg = Math.floor(target.maxHp * reaction.burstPerStack * stacks)
        burstDmg = Math.floor(burstDmg * masteryMultiplier)
        target.takeDamage(burstDmg, attacker)
        target.removeEffect(EFFECT_TYPES.DOT)
        result.messages.push(`触发元素反应：${reaction.name}！引爆中毒造成 ${burstDmg} 伤害`)
      } else {
        result.messages.push(`触发元素反应：${reaction.name}，但目标没有中毒效果`)
      }
      target.removeEffect('element_mark')
      return
    }

    // 生长
    if (reaction.healPercent) {
      const healAmount = Math.floor(attacker.maxHp * reaction.healPercent)
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount)
      result.messages.push(`触发元素反应：${reaction.name}！恢复 ${healAmount} 生命`)
      if (engine.companion && engine.companion.hp > 0) {
        const compHeal = Math.floor(engine.companion.maxHp * reaction.healPercent)
        engine.companion.hp = Math.min(engine.companion.maxHp, engine.companion.hp + compHeal)
        result.messages.push(`同伴恢复 ${compHeal} 生命`)
      }
      target.removeEffect('element_mark')
      return
    }

    target.removeEffect('element_mark')

  } else {
    // 无现有印记，施加印记（AOE 不挂印记）
    if (skill.target !== 'aoe') {
      target.addEffect({
        type: 'element_mark',
        markDamage: damage,
        element: skill.element,
        duration: 5,
        stackable: false
      })
    }
  }
}