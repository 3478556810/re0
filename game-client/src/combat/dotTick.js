import { EFFECT_TYPES } from './effectDefs'

/**
 * 执行玩家身上的持续伤害结算（DOT Tick）
 * @param {CombatEngine} engine
 * @returns {{ type: string, messages: string[] }}
 */
export function executePlayerDotTick(engine) {
  const messages = []
  const player = engine.player

  player.effects.forEach(eff => {
    if (eff.type === EFFECT_TYPES.DOT) {
      const dmg = eff.value || 0
      player.takeDamage(dmg)
      messages.push(`持续伤害使 ${player.name} 损失了 ${dmg} 点生命`)
    }
  })

  // 检查玩家是否被 DOT 杀死
  if (player.hp <= 0) {
    player.hp = 0
    engine.battleOver = true
    engine.winner = 'enemy'
    messages.push('玩家倒下了...')
  }

  return { type: 'dot_tick', messages }
}