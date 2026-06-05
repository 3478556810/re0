import { UnitState } from './UnitState'
import { executePlayerAction } from './actions/playerAction'
import { executeEnemyTurn, executeSingleEnemyAction } from './actions/enemyActions'
import { executeCompanionAction } from './actions/companionAction'
import { getRewards } from './rewards'
import { executePlayerDotTick } from './dotTick'

export class CombatEngine {
  constructor(playerStats, enemies, companion = null, playerSkills = {}) {
  // ✅ 直接展开 playerStats，让 UnitState 接收所有已计算好的属性
this.player = new UnitState({
  ...playerStats,
  isPlayer: true,

});

  this.companion = companion
    ? new UnitState({ ...companion, isCompanion: true })
    : null;

  this.enemies = enemies.map(e => new UnitState({ ...e }));

  this.battleOver = false;
  this.winner = null;
  this.turnCount = 0;

    this.playerSkills = playerSkills; // 玩家技能状态表 { skillId: { unlocked, level } }
}
  endTurn() {
    this.turnCount++
    this.enemies.forEach(enemy => {
      if (enemy.isBoss && !enemy.isEnraged) {
        const triggerTurn = enemy.enrageTurn || 4
        if (this.turnCount >= triggerTurn) {
          enemy.isEnraged = true
          enemy.attack = Math.floor(enemy.attack * 1.5)
        }
      }
    })

    // 肾上腺素（保持不变）
    const player = this.player;
    if (player.stackingAtk > 0) {
      player._adrenalineStacks = (player._adrenalineStacks || 0) + 1;
      if (player._adrenalineStacks <= 10) {
        if (!player.baseAttack) player.baseAttack = player.attack;
        const increase = Math.floor(player.baseAttack * player.stackingAtk / 100);
        player.attack += increase;
      }
    }

  this.player.onTurnEnd(this)
this.enemies.forEach(e => e.onTurnEnd(this))

    // ✅ 新增：DOT 结算后立即检查战斗是否结束
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.battleOver = true;
      this.winner = 'enemy';
    } else if (this.enemies.every(e => e.hp <= 0)) {
      this.battleOver = true;
      this.winner = 'player';
    }
}

  getAliveEnemies() {
    return this.enemies.filter(e => e.hp > 0)
  }

  executePlayerAction(skill, targetIndex, options) {
    return executePlayerAction(this, skill, targetIndex, options)
  }

  executeEnemyTurn() {
    return executeEnemyTurn(this)
  }

  executeSingleEnemyAction(enemy) {
    return executeSingleEnemyAction(this, enemy)
  }

  executeCompanionAction() {
    return executeCompanionAction(this)
  }

  getRewards() {
    return getRewards(this)
  }

  executePlayerDotTick() {
    return executePlayerDotTick(this)
  }

  
}