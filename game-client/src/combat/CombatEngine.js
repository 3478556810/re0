import { UnitState } from './UnitState'
import { executePlayerAction } from './actions/playerAction'
import { executeEnemyTurn, executeSingleEnemyAction } from './actions/enemyActions'
import { executeCompanionAction } from './actions/companionAction'
import { getRewards } from './rewards'
import { executePlayerDotTick } from './dotTick'
import { bossMechanics } from './engine/mechanics/bossMechanics'
import { EFFECT_TYPES } from './effectDefs'

export class CombatEngine {
  constructor(playerStats, enemies, companion = null, playerSkills = {}, config = {}) {
    this.config = config

    this.player = new UnitState({
      ...playerStats,
      isPlayer: true,
    })

    this.companion = companion
      ? new UnitState({ ...companion, isCompanion: true })
      : null

    // 动态初始化敌人，保留原始配置中的 phaseTransitions
    this.enemies = enemies.map(e => {
      const unit = new UnitState({ ...e })
      if (unit.isBoss) {
        unit.triggeredPhases = []
        // 直接从原始配置复制阶段数据，如果没有则为空数组
        unit.phaseTransitions = e.phaseTransitions || []
        unit.currentPhase = 1
      }
      return unit
    })

    this.battleOver = false
    this.winner = null
    this.turnCount = 0
    this.playerSkills = playerSkills

    // 外部回调：用于通知 UI 阶段变化
    this.onPhaseChange = null
  }

  // ========== 阶段检测与触发 ==========
  checkBossPhases() {
    for (const boss of this.enemies) {
      if (!boss.isBoss || boss.hp <= 0) continue

      const hpRatio = boss.hp / boss.maxHp
      const transitions = boss.phaseTransitions || []
      if (!transitions.length) continue

      for (let i = 0; i < transitions.length; i++) {
        const pt = transitions[i]
        if (hpRatio <= pt.atHpPercent && !boss.triggeredPhases.includes(i)) {
          boss.triggeredPhases.push(i)

          // 更新当前阶段（影响技能池，1->2, 2->3...）
          boss.currentPhase = i + 2

          // 播放阶段特效（通过 UI 回调）
          if (typeof this.onPhaseChange === 'function') {
            const colorMap = ['#f59e0b', '#ef4444', '#8b5cf6']
            this.onPhaseChange(i, {
              name: `阶段${i + 1}`,
              tip: pt.message || '',
              color: colorMap[i] || '#f59e0b',
              icon: 'mdi:skull'
            })
          }

          // 处理阶段 Buff
          if (pt.buffSelf) {
            const stat = pt.buffSelf.stat
            const typeMap = {
              atk: EFFECT_TYPES.ATK_UP,
              def: EFFECT_TYPES.DEF_UP,
              speed: EFFECT_TYPES.SPD_UP
            }
            const effectType = typeMap[stat] || stat
            boss.addEffect({
              type: effectType,
              value: pt.buffSelf.value,
              duration: 99,
              stackable: true
            })
          }

          // 处理狂暴
          if (pt.enrageNow) {
            boss.isEnraged = true
            boss.attack = Math.floor(boss.attack * 1.5)
          }

          // 设置下一行动强制释放机制技能或直接触发机制
          if (pt.mechanic) {
            // 优先寻找具有相同 mechanic 字段的技能
            const mechSkill = boss.skills?.find(s => s.mechanic === pt.mechanic)
            if (mechSkill) {
              boss._pendingMechanicSkill = mechSkill.name
            } else {
              // 无匹配技能，将直接调用 bossMechanics
              boss._pendingMechanicDirect = pt.mechanic
            }
          }
        }
      }
    }
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

    const player = this.player
    if (player.stackingAtk > 0) {
      player._adrenalineStacks = (player._adrenalineStacks || 0) + 1
      if (player._adrenalineStacks <= 10) {
        if (!player.baseAttack) player.baseAttack = player.attack
        const increase = Math.floor(player.baseAttack * player.stackingAtk / 100)
        player.attack += increase
      }
    }

    // 玩家效果结算
    this.player.onTurnEnd(this)



    // 生命之泉 / 天赐恩典 自动治疗
const talents = this.player.talents || {}
if (talents['o_keystone_heal'] || talents['s_keystone_heal']) {
  const targets = [this.player]
  if (this.companion && this.companion.hp > 0) targets.push(this.companion)
  const lowest = targets.reduce((min, t) => t.hp / t.maxHp < min.hp / min.maxHp ? t : min, targets[0])
  
  const healPercent = talents['s_keystone_heal'] ? 0.20 : 0.15
  const healAmount = Math.floor(lowest.maxHp * healPercent)
  lowest.hp = Math.min(lowest.maxHp, lowest.hp + healAmount)
  
  this._pendingMessages = this._pendingMessages || []
  this._pendingMessages.push(`生命之泉为 ${lowest.name} 恢复了 ${healAmount} HP`)

  if (talents['s_keystone_heal']) {
    // 附加神圣赞美诗效果
    const atkUp = { type: EFFECT_TYPES.ATK_UP, value: 0.5, duration: 1 }
    const critDmgUp = { type: 'critDmgUp', value: 120, duration: 1 }
    lowest.addEffect(atkUp)
    lowest.addEffect(critDmgUp)
    this._pendingMessages.push('天赐恩典：附加神圣赞美诗效果')
  }
}

    // ★ 伙伴效果结算（新增）
    if (this.companion && this.companion.hp > 0) {
      this.companion.onTurnEnd(this)
    }

    // 敌人效果结算
    this.enemies.forEach(e => e.onTurnEnd(this))

    // ===== 无敌机制倒计时和解除判定 =====
    const enemiesCopy = [...this.enemies]
    for (const enemy of enemiesCopy) {
      if (enemy.isTotem && enemy._deathTimer !== undefined) {
        enemy._deathTimer--
        if (enemy._deathTimer <= 0) {
          const master = this.enemies.find(e => (e.id || e.name) === enemy.masterId)
          if (master) {
            this.player.takeDamage(999999, master)
            if (this.companion?.hp > 0) {
              this.companion.takeDamage(999999, master)
            }
            master._invulnerable = false
            this._pendingMessages = this._pendingMessages || []
            this._pendingMessages.push('鲜血仪式完成！角斗士释放毁灭一击！')
          }
          this.enemies = this.enemies.filter(e => e !== enemy)
        }
      }

      if (enemy.isClone && enemy.masterId && enemy._deathTimer !== undefined) {
        enemy._deathTimer--
        if (enemy._deathTimer <= 0) {
          const master = this.enemies.find(e => (e.id || e.name) === enemy.masterId)
          if (master?._invulnerable) {
            this.player.takeDamage(999999, master)
            if (this.companion?.hp > 0) {
              this.companion.takeDamage(999999, master)
            }
            master._invulnerable = false
            this._pendingMessages = this._pendingMessages || []
            this._pendingMessages.push('永夜降临！主教释放了毁灭性的暗影能量！')
          }
          this.enemies = this.enemies.filter(e => e !== enemy)
        }
      }

      if (enemy._invulnerableSource === 'clones') {
        const clonesAlive = this.enemies.filter(e => e.isClone && e.masterId === (enemy.id || enemy.name))
        if (clonesAlive.length === 0) {
          enemy._invulnerable = false
          enemy._cloneDeathTimer = undefined
          this._pendingMessages = this._pendingMessages || []
          this._pendingMessages.push('所有分身被消灭！主教的无敌解除了！')
        }
      }

      if (enemy._invulnerableSource === 'totem') {
        const totemsAlive = this.enemies.filter(e => e.isTotem && e.masterId === (enemy.id || enemy.name))
        if (totemsAlive.length === 0) {
          enemy._invulnerable = false
          this._pendingMessages = this._pendingMessages || []
          this._pendingMessages.push('鲜血图腾被破坏！角斗士的无敌解除了！')
        }
      }
    }

    // ★ 阶段检测
    this.checkBossPhases()

    // 战斗结束判定
    if (this.player.hp <= 0) {
      this.player.hp = 0
      this.battleOver = true
      this.winner = 'enemy'
    } else if (this.enemies.every(e => e.hp <= 0)) {
      this.battleOver = true
      this.winner = 'player'
    }
}

  getAliveEnemies() {
    return this.enemies.filter(e => e.hp > 0)
  }

  executePlayerAction(skill, targetIndex, options) {
    const result = executePlayerAction(this, skill, targetIndex, options)
    this.checkBossPhases()
    return result
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