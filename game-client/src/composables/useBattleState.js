import { ref, computed } from 'vue'
import { useGameStore } from '@/store/gameStore'
import { useBattleCore } from './useBattleCore'
import { useBattleResult } from './useBattleResult'
import { playVoice } from '@/utils/audio'
import { monsterSpeech } from '@/config/monsterSpeech'
import { generateTowerMonsters } from '@/config/towerGenerator'
export function useBattleState() {
  const store = useGameStore()

  const {
    engine, floatingNumbers, addFloatingNumber,
    initEngine, syncStateFromEngine, destroyEngine
  } = useBattleCore()

  const isRaidBattle = ref(false)
  let _handlingDefeat = false
  let _victoryCalled = false

  const enemies = ref([])
  const currentTargetIndex = ref(0)
  const playerEffectsDisplay = ref([])
  const playerShield = ref(0)
  const hitEnemyIndex = ref(-1)
  const attackingEnemyIndex = ref(-1)
  const isPlayerAttacking = ref(false)
  const companion = ref(null)
  const companionHpPercent = computed(() => {
    if (!companion.value) return 0
    return (companion.value.hp / companion.value.maxHp) * 100
  })

  const playerStats = computed(() => {
    const base = store.player || {}
    const stats = store.playerStats || {}
    const customImg = store.config?.customImages?.hero || store.config?.customImages?.player || '/images/portrait/hero.png'
    return { name: base.name || '勇者', level: base.level || 1, attack: stats.attack || 10, defense: stats.defense || 5, customImg: customImg || null, ...stats }
  })

  const battleSkills = computed(() => (store.player.equippedSkills || []).map(id => store.config?.skillPool?.find(s => s.id === id)).filter(Boolean))

  const displayExp = ref(store.player.exp)
  const nextLevelExp = computed(() => store.player.level * 100)
  const displayExpPercent = computed(() => (displayExp.value / nextLevelExp.value) * 100)

  const playerTurn = ref(true)
  const gameOver = ref(false)
  const gameOverMsg = ref('')
  const waiting = ref(false)
  const showSkillPanel = ref(true)
  const showResult = ref(false)
  const totalReward = ref({ exp: 0, materials: [], accessories: [] })
  const isTrainingRoom = computed(() => store.dungeon.currentDungeon === 'training_room')
  const questCompleteHint = ref(false)
  const questHintText = ref('委托完成')
  const questHintTimer = ref(null)

  const {
    showRaidResult, raidResultStats, raidDefeated,
    initStats, recordDamage, recordTurn,
    saveRewards,
    totalDamageDealt, maxDamageDealt, totalTurns, battleStartTime
  } = useBattleResult(store, totalReward, questHintText, questCompleteHint, questHintTimer)

  function handleVictory(engine) {
    const clearTime = Math.floor((Date.now() - battleStartTime.value) / 1000)
    const remainingHp = store.player.hp
    const maxHp = store.player.maxHp

    let engineRewards = { exp: 0, materials: [], accessories: [], equipments: [], gems: [], companionExp: 0 }
    if (engine) {
      try { engineRewards = engine.getRewards() } catch (e) {}
    }
    totalReward.value = {
      exp: engineRewards.exp || 0,
      materials: engineRewards.materials || [],
      accessories: [],
      gems: engineRewards.gems || [],
      equipments: engineRewards.equipments || [],
      companionExp: engineRewards.companionExp || 0
    }

    if (isRaidBattle.value) {
      raidResultStats.value = {
        totalDamage: totalDamageDealt.value,
        maxDamage: maxDamageDealt.value,
        clearTime,
        totalTurns: totalTurns.value,
        remainingHp,
        maxHp
      }
      raidDefeated.value = false
      showRaidResult.value = true
    }
  }

function sync() {
  // 无论如何都要同步血量，让 0 血显示出来，不能提前 return
  syncStateFromEngine(store, enemies, playerShield, companion, playerEffectsDisplay)
  
  // ★ 同步伙伴策略（保留原有功能）
  if (engine.value && engine.value.companion && store.companionStrategy) {
    engine.value.companion.strategy = store.companionStrategy
  }
}

function _initEngine(enemiesInput) {
    _victoryCalled = false
    _handlingDefeat = false
    destroyEngine()
    if (window.__engine) window.__engine = null

    const ok = initEngine(enemiesInput)
    if (!ok) return false

    // ★ 直接从当前 store 状态锁定副本标记
    isRaidBattle.value = store.dungeon.isRaidBattle === true

    if (engine.value && engine.value.companion && store.companionStrategy) {
        engine.value.companion.strategy = store.companionStrategy
    }

    initStats()
    sync()
    return true
}

  // ================== 玩家技能 ==================
  async function useSkill(skill, showMessage) {
    if (!playerTurn.value || gameOver.value || waiting.value || !engine.value) return

    const mpCostReduction = store.playerStats.mpCostReduction || 0
    const actualMpCost = skill.mpCost > 0 ? Math.max(1, Math.floor(skill.mpCost * (1 - mpCostReduction / 100))) : 0
    if (actualMpCost > store.player.mp) {
      await showMessage('MP 不足！')
      return
    }
    const targetIdx = currentTargetIndex.value

    const skillLevel = store.player.skills[skill.id]?.level || 1
    const base = skill.baseMul || 0
    const basePerLevel = skill.levelScaling?.baseMul || 0.1
    let currentMul = base
    for (let i = 2; i <= skillLevel; i++) currentMul += basePerLevel * (1 + (i - 1) * 0.08)

    let mergedEffects = [...(skill.effects || [])]
    const effectiveSkill = { ...skill, baseMul: currentMul, effects: mergedEffects, mpCost: actualMpCost }

    const result = engine.value.executePlayerAction(effectiveSkill, targetIdx, { noMpCost: isTrainingRoom.value })
    if (!result) return

    if (result.hitDetails?.length) {
      result.hitDetails.forEach(hit => {
        if (hit.isShadowTrue) addFloatingNumber(hit.targetIndex, hit.damage, 'shadowTrue')
        if (!hit.crit && hit.multiplier === 1 && !hit.trueDmg && !hit.isShadowTrue) return
        let type = 'normal'
        if (hit.crit) type = 'crit'
        else if (hit.multiplier > 1) type = 'effective'
        else if (hit.multiplier < 1) type = 'resisted'
        addFloatingNumber(hit.targetIndex, hit.damage, type)
        if (hit.trueDmg > 0) addFloatingNumber(hit.targetIndex, hit.trueDmg, 'trueDmg', -20)
      })
    }

    if (result.damage > 0) {
      recordDamage(result.damage)
      isPlayerAttacking.value = true
      setTimeout(() => { isPlayerAttacking.value = false }, 800)
      hitEnemyIndex.value = targetIdx
      const target = engine.value.enemies[targetIdx]
      if (target) {
        const hitSpeech = monsterSpeech[target.id]?.hit
        if (target.hp > 0) {
          playVoice(target.id, 'hit')
          if (hitSpeech) { target.speech = hitSpeech; setTimeout(() => { target.speech = ''; sync() }, 2000) }
        } else if (!target._playedDefeatVoice) {
          playVoice(target.id, 'defeat')
          target._playedDefeatVoice = true
          const deathSpeech = monsterSpeech[target.id]?.defeat
          if (deathSpeech) { target.speech = deathSpeech; setTimeout(() => { target.speech = ''; sync() }, 2000) }
        }
        sync()
      }
      setTimeout(() => { if (hitEnemyIndex.value === targetIdx) hitEnemyIndex.value = -1 }, 300)
    }

    waiting.value = true
    showSkillPanel.value = false

    for (const msg of result.messages) {
      await showMessage(msg, 5000)
      sync()
      if (engine.value.battleOver) break
    }

    if (engine.value.battleOver) {
      gameOver.value = true
      gameOverMsg.value = engine.value.winner === 'player' ? '战斗胜利！' : '战斗失败'
      if (engine.value.winner === 'player') victory()
      else handleGameOver()
      waiting.value = false
      return
    }

    sync()
    playerTurn.value = false
    await enemyTurn(showMessage)

    const anyAlive = engine.value.enemies.findIndex(e => e.hp > 0)
    if (anyAlive !== -1) {
      const current = engine.value.enemies[currentTargetIndex.value]
      if (!current || current.hp <= 0) currentTargetIndex.value = anyAlive
    }
  }

  // ================== 敌人回合 ==================
  async function enemyTurn(showMessage) {
    if (gameOver.value || !engine.value) return

    const dotResult = engine.value.executePlayerDotTick()
    if (dotResult.messages.length) {
      for (const msg of dotResult.messages) { await showMessage(msg, 5000); sync(); if (engine.value.battleOver) break }
      if (engine.value.battleOver) {
        gameOver.value = true
        gameOverMsg.value = '战斗失败'
        waiting.value = false
        handleGameOver()
        return
      }
    }

    const alive = engine.value.getAliveEnemies()
    for (const enemy of alive) {
      if (enemy.isEnraged && !enemy._enrageNotified) {
        await showMessage(`${enemy.name} 进入狂暴状态！`, 3000)
        enemy._enrageNotified = true
      }
    }

    for (const enemy of alive) {
      if (engine.value.battleOver) break
      const enemyIndex = engine.value.enemies.indexOf(enemy)
      attackingEnemyIndex.value = enemyIndex
      playVoice(enemy.id, 'attack')
      const attackSpeech = monsterSpeech[enemy.id]?.attack
      if (attackSpeech) { enemy.speech = attackSpeech; sync() }
      await new Promise(r => setTimeout(r, 800))
      const res = engine.value.executeSingleEnemyAction(enemy)
      if (res.damage > 0) recordDamage(res.damage)
if (res.messages && res.messages.length > 0) {
  const msgDuration = enemy.isBoss ? 1500 : 500
  showMessage(res.messages[0], msgDuration)
}

      enemy.speech = ''
      attackingEnemyIndex.value = -1

      if (res.damage > 0) {
        const hitTarget = res.target || engine.value.player
        if (hitTarget.hp > 0) {
          playVoice(hitTarget.id, 'hit')
          const hitSpeech = monsterSpeech[hitTarget.id]?.hit
          if (hitSpeech) { hitTarget.speech = hitSpeech; setTimeout(() => { hitTarget.speech = ''; sync() }, 2000) }
        } else if (hitTarget.hp <= 0 && !hitTarget._playedDefeatVoice) {
          playVoice(hitTarget.id, 'defeat')
          hitTarget._playedDefeatVoice = true
          const deathSpeech = monsterSpeech[hitTarget.id]?.defeat
          if (deathSpeech) { hitTarget.speech = deathSpeech; setTimeout(() => { hitTarget.speech = ''; sync() }, 2000) }
        }
      }
      sync()
      await new Promise(r => setTimeout(r, 600))
    }

    attackingEnemyIndex.value = -1
    sync()

    if (engine.value.battleOver) {
      gameOver.value = true
      gameOverMsg.value = '战斗失败'
      waiting.value = false
      handleGameOver()
      return
    }

    if (engine.value.getAliveEnemies().length === 0) { victory(); return }

    const compResult = engine.value.executeCompanionAction()
    for (const msg of compResult.messages) { await showMessage(msg, 5000); sync() }

    engine.value.endTurn()
    recordTurn()
    sync()

    if (engine.value.battleOver) {
      gameOver.value = true
      gameOverMsg.value = engine.value.winner === 'player' ? '战斗胜利！' : '战斗失败'
      if (engine.value.winner === 'player') victory()
      else handleGameOver()
      waiting.value = false
      return
    }

    playerTurn.value = true; waiting.value = false; showSkillPanel.value = true
  }

function victory() {
    if (_victoryCalled) return
    _victoryCalled = true
    gameOver.value = true
    gameOverMsg.value = '战斗胜利！'
    if (engine.value) {
        engine.value.battleOver = true
        engine.value.winner = 'player'
    }
    handleVictory(engine.value)
    waiting.value = false
    playerTurn.value = false
    showSkillPanel.value = false

    // ★ 无限塔模式：胜利后弹出结算面板，宝石随层数增强
    if (store.towerMode) {
        const gems = []
        const gemDefs = store.config.gemDefinitions || []
        if (gemDefs.length > 0) {
            // 根据层数决定宝石等级和数量
            let minLevel = Math.max(1, Math.floor(store.towerFloor / 10))      // 每10层提升最低等级
            let maxLevel = Math.min(10, minLevel + 2)                          // 最高等级 = 最低 + 2
            let gemCount = 1 + Math.floor(store.towerFloor / 5)               // 每5层多掉1个

            // 筛选出符合等级范围的宝石
            const eligibleGems = gemDefs.filter(g => g.level >= minLevel && g.level <= maxLevel)
            if (eligibleGems.length === 0) {
                // 如果没有符合的，就用最接近的
                const fallbackGems = gemDefs.filter(g => g.level <= maxLevel)
                for (let i = 0; i < gemCount; i++) {
                    const gem = fallbackGems[Math.floor(Math.random() * fallbackGems.length)]
                    if (gem) gems.push({ id: gem.id, name: gem.name, qty: 1 })
                }
            } else {
                for (let i = 0; i < gemCount; i++) {
                    const gem = eligibleGems[Math.floor(Math.random() * eligibleGems.length)]
                    gems.push({ id: gem.id, name: gem.name, qty: 1 })
                }
            }
        }

        // 塔内奖励存入临时背包（不直接进主背包）
        if (!store.towerLoot) store.towerLoot = []
        store.towerLoot.push(...gems)

        totalReward.value = {
            exp: store.towerFloor * 30,
            materials: [],
            accessories: [],
            gems: gems,           // 当前层掉落的宝石（仅展示用）
            equipments: [],
            companionExp: 0
        }
        showResult.value = true
        return
    }
  if (isRaidBattle.value) {
        // handleVictory 已经设置了 showRaidResult = true，这里什么都不用做
        return
    }
    // 非塔模式的原逻辑...
    if (!isRaidBattle.value) {
        setTimeout(() => { showResult.value = true }, 100)
    }
}
  function resetVictoryFlag() { _victoryCalled = false }

function handleGameOver() {
    if (gameOverMsg.value === '战斗失败' && !_handlingDefeat) {
        _handlingDefeat = true

        // 1. 立即停止游戏逻辑，但不阻止UI更新
        gameOver.value = true
        waiting.value = false
        playerTurn.value = false
        showSkillPanel.value = false

        // 2. 同步一次血量，此时血条会显示0血并开始过渡动画
        sync()

        // 3. 阻止怪物继续行动（但不影响UI同步）
        if (engine.value) {
            engine.value.battleOver = true
            engine.value.winner = 'enemy'
        }

        // 4. 延迟3秒弹出结算面板（让血条动画和受击效果完整播放）
        setTimeout(() => {
            if (isRaidBattle.value) {
                // 副本Boss失败：弹出评分面板
                const clearTime = Math.floor((Date.now() - battleStartTime.value) / 1000)
                raidResultStats.value = {
                    totalDamage: totalDamageDealt.value,
                    maxDamage: maxDamageDealt.value,
                    clearTime,
                    totalTurns: totalTurns.value,
                    remainingHp:store.player.hp, 
                    maxHp: store.player.maxHp
                }
                raidDefeated.value = true
                showRaidResult.value = true
            } else if (store.towerMode) {
    // 无限塔失败：清空所有塔内积累的掉落
    store.towerLoot = []
    
    totalReward.value = {
        exp: store.towerFloor * 10,  // 失败经验减半
        materials: [],
        accessories: [],
        gems: [],                    // 失败无宝石
        equipments: [],
        companionExp: 0
    }
    showResult.value = true
    store.towerMode = false
    store.towerFloor = 1
}else {
                // 普通战斗失败：显示普通结果面板（奖励为空）
                totalReward.value = { exp: 0, materials: [], accessories: [], gems: [], equipments: [], companionExp: 0 }
                showResult.value = true
            }
            _handlingDefeat = false
        }, 3000)
    }
}
  function selectTarget(idx) { if (idx >= 0 && idx < enemies.value.length) currentTargetIndex.value = idx }
  function getCustomImage(type) { const val = store.config?.customImages?.[type]; return val?.trim() ? val : null }
  function getCompanionImage() { const comp = companion.value; if (!comp) return null; const char = store.config.characters?.[comp.id]; return char?.portrait ? `/images/portrait/${char.portrait}` : null }

  function destroy() { 
    destroyEngine()
    if (questHintTimer.value) clearTimeout(questHintTimer.value)
    resetVictoryFlag()
    _handlingDefeat = false
  }


function resetAndStart(enemiesInput) {
  // 1. 停止当前引擎
  if (engine.value) {
    engine.value.battleOver = true
  }
  // 2. 重置所有 UI 状态
  enemies.value = []
  floatingNumbers.value = []
  gameOver.value = false
  gameOverMsg.value = ''
  playerTurn.value = true
  waiting.value = false
  showSkillPanel.value = true
  showResult.value = false
  showRaidResult.value = false
  hitEnemyIndex.value = -1
  attackingEnemyIndex.value = -1
  isPlayerAttacking.value = false
  _victoryCalled = false
  _handlingDefeat = false
    currentTargetIndex.value = 0   // ★ 强制选中第一个敌人
  // 3. 重新初始化引擎
  return _initEngine(enemiesInput)
}
function onResultClose() {
    saveRewards()
    showResult.value = false
    if (gameOverMsg.value === '战斗失败') {
        store.player.hp = store.player.maxHp
        store.player.mp = store.player.maxMp
        store.save()
        emit('exit')
    } else {
        emit('victory', totalReward.value)
    }
}

  return {
    engine, enemies, currentTargetIndex, playerEffectsDisplay, playerShield, resetAndStart,
    companion, companionHpPercent, playerStats, battleSkills,
    displayExp, nextLevelExp, displayExpPercent,
    playerTurn, gameOver, gameOverMsg, waiting, showSkillPanel, showResult, totalReward,
    questCompleteHint, questHintText, isTrainingRoom,
    hitEnemyIndex, floatingNumbers, showRaidResult, raidResultStats, raidDefeated,
    addFloatingNumber, attackingEnemyIndex, isPlayerAttacking,
    initEngine: _initEngine, syncStateFromEngine: sync, useSkill, enemyTurn, victory,
    handleGameOver, saveRewards,
    onResultClose() { saveRewards(); showResult.value = false },
    onNextFloor() { saveRewards(); showResult.value = false; store.clearFloor() },
    onRetreat() { saveRewards(); showResult.value = false; store.retreat() },
    selectTarget, getCustomImage, getCompanionImage, destroy, resetVictoryFlag
  }
}