import { calculateDamage } from '../damageCalculator'
import { EFFECT_TYPES } from '../effectDefs'

/**
 * 执行同伴行动
 * @param {CombatEngine} engine
 * @returns {{ messages: string[] }}
 */
export function executeCompanionAction(engine) {
  const { companion, player } = engine
  if (!companion || companion.hp <= 0) return { messages: [] }

  const messages = []

  // 同伴被眩晕/冻结时跳过
  if (companion.isStunned()) {
    companion.removeEffect(EFFECT_TYPES.STUN)
    companion.removeEffect(EFFECT_TYPES.FREEZE)
    return { messages: [`${companion.name} 无法行动！`] }
  }

  const playerHpPercent = player.hp / player.maxHp
  // 玩家血量低于 40% 时尝试治疗
  if (playerHpPercent < 0.4 && companion.mp >= 5) {
    const heal = Math.floor(companion.getEffectiveAttack() * 0.5)
    player.hp = Math.min(player.maxHp, player.hp + heal)
    companion.mp -= 5
    return { messages: [`${companion.name} 为你治疗了 ${heal} HP`] }
  }

  const aliveEnemies = engine.getAliveEnemies()
  if (aliveEnemies.length === 0) return { messages: [] }

  const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]

const attackerSnap = {
  attack: companion.getEffectiveAttack(),   // ✅ 同伴自己的攻击力
  critRate: companion.critRate || 5,
  critDmg: companion.critDmg || 150,
  trueDmg: companion.trueDmg || 0,
  element: companion.element || ''         // ✅ 同伴的元素
};

// 复制同伴的元素伤害加成
['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel'].forEach(elem => {
  attackerSnap[elem + 'Dmg'] = companion.elemDmg[elem] || 0;
});
  const defenderSnap = {
    defense: target.getEffectiveDefense(),
    element: target.element || ''
  }

  const { damage, crit } = calculateDamage(attackerSnap, defenderSnap, {
    baseMul: 0.7,
    element: companion.element || ''
  })

  target.takeDamage(damage, companion)
  let msg = `${companion.name} 攻击了 ${target.name}，造成 ${damage} 伤害`
  if (crit) msg += ' (暴击)'
  messages.push(msg)

  if (target.hp <= 0) {
    messages.push(`${target.name} 被击败！`)
    if (engine.getAliveEnemies().length === 0) {
      engine.battleOver = true
      engine.winner = 'player'
    }
  }

  return { messages }
}