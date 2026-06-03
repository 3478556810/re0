import { ref, reactive, computed, shallowRef } from 'vue'
import { useGameStore } from '../store/gameStore'
import { CombatEngine } from '../combat/CombatEngine'
import { generateAccessoryLoot } from '../utils/lootGenerator'
import { generateAccessoryName } from '../config/accessoryConfig'

export function useBattleState() {
  const store = useGameStore()
  const engine = shallowRef(null)
const floatingNumbers = ref([]);
let floatId = 0;
  const enemies = ref([])
  const currentTargetIndex = ref(0)
  const playerEffectsDisplay = ref([])
  const playerShield = ref(0)
  const hitEnemyIndex = ref(-1)   // 敌人受击闪白

  const companion = ref(null)
  const companionHpPercent = computed(() => {
    if (!companion.value) return 0
    return (companion.value.hp / companion.value.maxHp) * 100
  })

  const playerStats = computed(() => {
    const base = store.player || {}
    const stats = store.playerStats || {}
    const customImg = store.config?.customImages?.hero 
      || store.config?.customImages?.player 
      || '/images/portrait/hero.png'
    return {
      name: base.name || '勇者',
      level: base.level || 1,
      attack: stats.attack || 10,
      defense: stats.defense || 5,
      customImg: customImg || null,
      ...stats,
    }
  })

  const battleSkills = computed(() => {
    return (store.player.equippedSkills || [])
      .map(id => store.config?.skillPool?.find(s => s.id === id))
      .filter(Boolean)
  })

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
  let questHintTimer = null

  // ---------- 引擎初始化 ----------
  function initEngine(enemiesInput) {
    if (!enemiesInput || enemiesInput.length === 0) {
      console.warn('没有敌人数据')
      return
    }

    const companionId = store.player.currentCompanion || 'freyja'
    const companionData = store.config.characters?.[companionId]
    const baseAttack = companionData?.baseAttack || 40
    const playerLevel = store.player.level || 1
    let comp = null
    if (companionData) {
      comp = {
        id: companionData.id,
        name: companionData.name,
        attack: Math.floor(baseAttack + playerLevel * 3 + store.getAffectionLevel(companionId) * 8),
        defense: Math.floor(store.playerStats.defense * 0.8),
        hp: Math.floor(store.playerStats.maxHp * 0.8) + store.getAffectionLevel(companionId) * 50,
        maxHp: Math.floor(store.playerStats.maxHp * 0.8) + store.getAffectionLevel(companionId) * 50,
        mp: Math.floor(store.playerStats.maxMp * 0.6),
        maxMp: Math.floor(store.playerStats.maxMp * 0.6),
        speed: store.playerStats.speed + 5,
        critRate: store.playerStats.critRate * 0.8,
        critDmg: store.playerStats.critDmg * 0.8,
        icon: companionData.icon || 'mdi:account-heart',
        isCompanion: true,
      }
    }

    let stackingAtk = 0
    for (const aff of store.activeAffixEffects) {
      if (aff.bonus?.stackingAtk) stackingAtk += aff.bonus.stackingAtk
    }

    const fullPlayerStats = {
      ...store.playerStats,
      stackingAtk: stackingAtk,
    }

    const enrichedEnemies = enemiesInput.map(e => {
      const isBoss = e.isBoss ?? (e.base?.isBoss) ?? false
      const level = e.level ?? (e.base?.level) ?? 1
      return {
        ...e,
        isBoss,
        level,
        exp: e.exp ?? (level * 10 + 5),
      }
    })

    engine.value = new CombatEngine(fullPlayerStats, enrichedEnemies, comp)
    window.__engine = engine.value
    syncStateFromEngine()
  }
function addFloatingNumber(targetIndex, amount, type = 'normal') {
  const id = ++floatId;
  floatingNumbers.value.push({ id, targetIndex, amount, type });
  setTimeout(() => {
    const idx = floatingNumbers.value.findIndex(f => f.id === id);
    if (idx !== -1) floatingNumbers.value.splice(idx, 1);
  }, 1200); // 1.2秒后移除
}
  function syncStateFromEngine() {
    if (!engine.value) return
    store.player.hp = engine.value.player.hp
    store.player.mp = engine.value.player.mp
    playerShield.value = engine.value.player.getShield()

    enemies.value = engine.value.enemies.map(enemy => {
      const shield = enemy.getShield() || 0
      return {
        ...enemy,
        id: enemy.id,
        name: enemy.name || '未知敌人',
        hp: Math.max(0, enemy.hp),
        maxHp: enemy.maxHp,
        shield,
        element: enemy.element || '',
        icon: enemy.icon || 'mdi:help-circle',
        level: enemy.level || 1,
        atk: enemy.attack,
        def: enemy.defense,
        effects: enemy.effects || [],
      }
    })

    if (engine.value && engine.value.companion) {
      companion.value = {
        id: engine.value.companion.id,
        name: engine.value.companion.name,
        hp: Math.max(0, engine.value.companion.hp),
        maxHp: engine.value.companion.maxHp,
        icon: engine.value.companion.icon,
      }
    } else {
      companion.value = null
    }

    playerEffectsDisplay.value = engine.value.player.effects.filter(e => e.duration > 0)

    if (!engine.value.battleOver && engine.value.getAliveEnemies().length === 0) {
      engine.value.battleOver = true
      engine.value.winner = 'player'
    }

    if (engine.value.battleOver && engine.value.winner === 'player' && !gameOver.value) {
      victory()
    } else if (engine.value.battleOver && engine.value.winner === 'enemy' && !gameOver.value) {
      gameOver.value = true
      gameOverMsg.value = '战斗失败'
      waiting.value = false
      playerTurn.value = false
      showSkillPanel.value = false
    }

    if (enemies.value.length > 0) {
      const current = enemies.value[currentTargetIndex.value]
      if (!current || current.hp <= 0) {
        const nextAliveIdx = enemies.value.findIndex(e => e.hp > 0)
        if (nextAliveIdx !== -1) {
          currentTargetIndex.value = nextAliveIdx
        }
      }
    }
  }

  // ---------- 玩家使用技能（不带玩家受击动画，稳定消息版） ----------
  async function useSkill(skill, showMessage) {
    if (!playerTurn.value || gameOver.value || waiting.value || !engine.value) return

    const mpCostReduction = store.playerStats.mpCostReduction || 0
    const actualMpCost = Math.max(1, Math.floor(skill.mpCost * (1 - mpCostReduction / 100)))
    if (actualMpCost > store.player.mp) {
      await showMessage('MP 不足！')
      return
    }

    const targetIdx = currentTargetIndex.value

    const skillLevel = store.player.skills[skill.id]?.level || 1
    const scaling = skill.levelScaling || { baseMul: 0 }
    const currentMul = (skill.baseMul || 0) + (skillLevel - 1) * (scaling.baseMul || 0)

    const tripodChoices = store.player.tripodChoices[skill.id] || {}
    const extraEffects = []
    const extraActions = []
    if (skill.tripods) {
      skill.tripods.forEach((tripod, tIdx) => {
        const choiceIdx = tripodChoices[tIdx]
        if (choiceIdx !== undefined && choiceIdx !== '' && tripod.effects && tripod.effects[choiceIdx]) {
          const chosenEffect = tripod.effects[choiceIdx]
          if (chosenEffect.note === '追加攻击' || chosenEffect.type === 'extraAction') {
            extraActions.push(chosenEffect)
          } else {
            extraEffects.push(chosenEffect)
          }
        }
      })
    }

    const effectiveSkill = {
      ...skill,
      baseMul: currentMul,
      effects: [...(skill.effects || []), ...extraEffects],
      extraActions,
      mpCost: actualMpCost,
    }

    const result = engine.value.executePlayerAction(effectiveSkill, targetIdx, { noMpCost: isTrainingRoom.value })
    if (!result) return
// 处理浮动伤害数字
if (result.hitDetails && result.hitDetails.length > 0) {
  result.hitDetails.forEach(hit => {
    let type = 'normal';
    if (hit.crit) type = 'crit';
    else if (hit.multiplier > 1) type = 'effective';   // 效果拔群
    else if (hit.multiplier < 1) type = 'resisted';     // 效果不理想
    addFloatingNumber(hit.targetIndex, hit.damage, type);
  });
}
    // 敌人受击闪白
    if (result.damage > 0 && targetIdx >= 0) {
      hitEnemyIndex.value = targetIdx
      setTimeout(() => {
        if (hitEnemyIndex.value === targetIdx) hitEnemyIndex.value = -1
      }, 300)
    }

    waiting.value = true
    showSkillPanel.value = false

    for (const msg of result.messages) {
      await showMessage(msg, 5000)
      syncStateFromEngine()
      if (engine.value.battleOver) break
    }

    if (engine.value.battleOver) {
      gameOver.value = true
      gameOverMsg.value = engine.value.winner === 'player' ? '战斗胜利！' : '战斗失败'
      if (engine.value.winner === 'player') victory()
      waiting.value = false
      return
    }

    syncStateFromEngine()
    playerTurn.value = false
    await enemyTurn(showMessage)

    const anyAlive = engine.value.enemies.findIndex(e => e.hp > 0)
    if (anyAlive !== -1) {
      const current = engine.value.enemies[currentTargetIndex.value]
      if (!current || current.hp <= 0) {
        currentTargetIndex.value = anyAlive
      }
    }
  }

  // ---------- 敌人回合（无玩家动画回调，稳定版） ----------
  async function enemyTurn(showMessage) {
    if (gameOver.value || !engine.value) return

    const dotResult = engine.value.executePlayerDotTick()
    if (dotResult.messages.length > 0) {
      for (const msg of dotResult.messages) {
        await showMessage(msg, 5000)
        syncStateFromEngine()
        if (engine.value.battleOver) break
      }
      if (engine.value.battleOver) {
        gameOver.value = true
        gameOverMsg.value = '战斗失败'
        waiting.value = false
        return
      }
      if (engine.value.getAliveEnemies().length === 0) {
        engine.value.battleOver = true
        engine.value.winner = 'player'
        gameOver.value = true
        gameOverMsg.value = '战斗胜利！'
        victory()
        waiting.value = false
        return
      }
    }

    const alive = engine.value.getAliveEnemies()
    for (const enemy of alive) {
      if (enemy.isEnraged && !enemy._enrageNotified) {
        await showMessage(`${enemy.name} 进入狂暴状态！攻击力大幅提升！`, 3000)
        enemy._enrageNotified = true
      }
    }

    for (const enemy of alive) {
      if (engine.value.battleOver || engine.value.getAliveEnemies().length === 0) break
      const res = engine.value.executeSingleEnemyAction(enemy)
      syncStateFromEngine()

      // 敌人攻击后，玩家可以在此处增加动画，但现在先省略，确保消息正常
      // 你可以在后续安全地加入，不会影响消息

      for (const msg of res.messages) {
        await showMessage(msg, 5000)
        syncStateFromEngine()
        if (engine.value.battleOver) break
      }
      await new Promise(r => setTimeout(r, 300))
      if (engine.value.battleOver || engine.value.getAliveEnemies().length === 0) break
    }

    syncStateFromEngine()
    if (engine.value.battleOver) {
      gameOver.value = true
      gameOverMsg.value = '战斗失败'
      waiting.value = false
      return
    }
    if (engine.value.getAliveEnemies().length === 0) {
      engine.value.battleOver = true
      engine.value.winner = 'player'
      gameOver.value = true
      gameOverMsg.value = '战斗胜利！'
      victory()
      waiting.value = false
      return
    }

    const compResult = engine.value.executeCompanionAction()
    for (const msg of compResult.messages) {
      await showMessage(msg, 5000)
      syncStateFromEngine()
    }

    if (engine.value.getAliveEnemies().length === 0) {
      engine.value.battleOver = true
      engine.value.winner = 'player'
      gameOver.value = true
      gameOverMsg.value = '战斗胜利！'
      victory()
      waiting.value = false
      return
    }

    engine.value.endTurn()
    syncStateFromEngine()

    if (engine.value.battleOver || engine.value.getAliveEnemies().length === 0) {
      engine.value.battleOver = true
      engine.value.winner = engine.value.getAliveEnemies().length === 0 ? 'player' : 'enemy'
      gameOver.value = true
      gameOverMsg.value = engine.value.winner === 'player' ? '战斗胜利！' : '战斗失败'
      if (engine.value.winner === 'player') victory()
      waiting.value = false
      return
    }

    playerTurn.value = true
    waiting.value = false
    showSkillPanel.value = true
  }

  // ---------- 胜利、奖励等函数（保持不变） ----------
  function victory() {
    if (victory._called) return
    victory._called = true

    gameOver.value = true
    gameOverMsg.value = '战斗胜利！'

    if (engine.value) {
      engine.value.battleOver = true
      engine.value.winner = 'player'
    }

    const enemyIds = (store.battleEnemies || []).map(e => e.id || e.template?.id).filter(Boolean)
    try {
      const result = store.updateHuntProgress(enemyIds)
      if (result && result.anyCompleted) {
        const names = result.completedQuests.map(q => q.desc).join('、')
        questHintText.value = names
        questCompleteHint.value = true
        if (questHintTimer) clearTimeout(questHintTimer)
        questHintTimer = setTimeout(() => { questCompleteHint.value = false }, 3000)
      }
    } catch (e) { console.error('更新讨伐任务失败:', e) }

    let engineRewards = { exp: 0, materials: [], accessories: [], equipments: [] }
    if (engine.value) {
      try { engineRewards = engine.value.getRewards() } catch (e) { console.error('获取战斗奖励失败:', e) }
    }

    const totalMats = engineRewards.materials || []
    const totalAccs = []
    const worldLv = store.worldLevel || 1
    for (const enemy of (store.battleEnemies || [])) {
      const dropChance = Math.min(0.05 + worldLv * 0.05, 0.35)
      if (Math.random() < dropChance) {
        try {
          const acc = generateAccessoryLoot(enemy, worldLv)
          if (acc) {
            acc.name = generateAccessoryName(acc.part, acc.affixes)
            totalAccs.push(acc)
          }
        } catch (e) {}
      }
    }

    totalReward.value = {
      exp: engineRewards.exp || 0,
      materials: totalMats,
      accessories: totalAccs,
      equipments: engineRewards.equipments || []
    }

    const mpOnKill = store.playerStats.mpOnKill || 0
    if (mpOnKill > 0) {
      store.player.mp = Math.min(store.player.maxMp, store.player.mp + mpOnKill)
    }

    waiting.value = false
    playerTurn.value = false
    showSkillPanel.value = false
    setTimeout(() => {
      showResult.value = true
    }, 100)
  }

  function resetVictoryFlag() { victory._called = false }

  function handleGameOver() {
    if (gameOverMsg.value === '战斗失败') {
      store.player.hp = store.player.maxHp
      store.player.mp = store.player.maxMp
      store.save()
    }
  }

  function saveRewards() {
    if (totalReward.value.exp) store.addExperience(totalReward.value.exp)
    if (totalReward.value.materials?.length) {
      totalReward.value.materials.forEach(m => store.addMaterial(m.id, m.name))
    }
    if (totalReward.value.accessories?.length) {
      totalReward.value.accessories.forEach(acc => {
        acc.name = generateAccessoryName(acc.part, acc.affixes)
        store.inventory.push(acc)
      })
    }
    if (totalReward.value.equipments?.length) {
      totalReward.value.equipments.forEach(eq => store.inventory.push(eq))
    }
    const tokenQty = Math.random() < 0.2 ? 2 : 1
    store.addMaterial('dungeon_token', '地下城徽记', tokenQty)
    store.save()
  }

  function onResultClose() { saveRewards(); showResult.value = false }
  function onNextFloor() { saveRewards(); showResult.value = false; store.clearFloor() }
  function onRetreat() { saveRewards(); showResult.value = false; store.retreat() }

  function selectTarget(idx) {
    if (idx >= 0 && idx < enemies.value.length) {
      currentTargetIndex.value = idx
    }
  }

  function getCustomImage(type) {
    const val = store.config?.customImages?.[type]
    return val && val.trim() !== '' ? val : null
  }

  function getCompanionImage() {
    const comp = companion.value
    if (!comp) return null
    const char = store.config.characters?.[comp.id]
    if (char?.portrait) return `/images/portrait/${char.portrait}`
    return null
  }

  function destroy() {
    if (engine.value) engine.value.battleOver = true
    if (questHintTimer) clearTimeout(questHintTimer)
    resetVictoryFlag()
  }

  return {
    engine, enemies, currentTargetIndex, playerEffectsDisplay, playerShield,
    companion, companionHpPercent, playerStats, battleSkills,
    displayExp, nextLevelExp, displayExpPercent,
    playerTurn, gameOver, gameOverMsg, waiting, showSkillPanel, showResult, totalReward,
    questCompleteHint, questHintText, isTrainingRoom,
    hitEnemyIndex,  floatingNumbers,
  addFloatingNumber,  // 可选，便于外部使用
    initEngine, syncStateFromEngine, useSkill, enemyTurn, victory,
    handleGameOver, saveRewards, onResultClose, onNextFloor, onRetreat,
    selectTarget, getCustomImage, getCompanionImage, destroy, resetVictoryFlag,
  }
}