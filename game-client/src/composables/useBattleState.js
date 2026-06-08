// src/composables/useBattleState.js

import { ref, reactive, computed, shallowRef } from 'vue'
import { useGameStore } from '../store/gameStore'
import { CombatEngine } from '../combat/CombatEngine'
import { generateAccessoryLoot } from '../utils/lootGenerator'
import { generateAccessoryName } from '../config/accessoryConfig'

// 效果中文名称映射表
const EFFECT_NAMES = {
  atkUp: '攻击力', defUp: '防御力', spdUp: '速度',
  atkDown: '攻击力', defDown: '防御力', spdDown: '速度',
  critRateUp: '暴击率', critDmgUp: '暴击伤害',
  maxHpUp: '最大生命', dodgeUp: '闪避率',
  shield: '护盾', regen: '再生', dot: '中毒', bleed: '流血',
  stun: '眩晕', freeze: '冻结', silence: '沉默',
  reflect: '反伤', lifestealBuff: '吸血强化',  holyAnthem: '神圣赞美诗',
  weak: '虚弱', taunt: '嘲讽',
  holyMark: '光之烙印', dragonMark: '龙焰印记', shadowMark: '暗蚀印记',
  element_mark: '元素印记'
}

export function useBattleState() {
  const store = useGameStore()
  const engine = shallowRef(null)
  const floatingNumbers = ref([]);
  let floatId = 0;
  const enemies = ref([])
  const currentTargetIndex = ref(0)
  const playerEffectsDisplay = ref([])
  const playerShield = ref(0)
  const hitEnemyIndex = ref(-1)

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
    if (!enemiesInput || !Array.isArray(enemiesInput) || enemiesInput.length === 0) {
      console.warn('initEngine: 没有敌人数据，无法初始化战斗引擎')
      return false
    }

    if (!store.activeCompanionId && store.companions && store.companions.length > 0) {
      store.activeCompanionId = store.companions[0].id
    }

    const companionActive = store.player.companionActive !== false
    const companionId = store.activeCompanionId || store.player.currentCompanion
    let companionUnit = null

    const originalAttack = store.playerStats.attack || 10
    const originalDefense = store.playerStats.defense || 5
    const originalMaxHp = store.playerStats.maxHp || 100
    const originalMaxMp = store.playerStats.maxMp || 30
    const originalSpeed = store.playerStats.speed || 10
    const originalCritRate = store.playerStats.critRate || 5
    const originalCritDmg = store.playerStats.critDmg || 150

    if (companionActive && companionId) {
      const companions = store.companions || []
      if (Array.isArray(companions) && companions.length > 0) {
        const companionSave = companions.find(c => c.id === companionId)

        if (companionSave) {
          const affectionLevel = store.getAffectionLevel?.(companionId) || 1
          const companionLevel = companionSave.level || 1
          const affectionBonusLv = Math.floor(affectionLevel / 200)

          const isHealer = ['archmage', 'elemental', 'paladin', 'oracle', 'seer'].includes(store.player.class)
          const isOracle = ['oracle', 'seer'].includes(store.player.class)
          
          const talents = store.player.talents || {}
          const hasSoulLink = isOracle && talents['o_keystone_link']
          const hasSoulResonance = isOracle && talents['s_keystone_link']
          const hasLifeConvert = isOracle && talents['o_life_convert']
          const hasDefConvert = isOracle && talents['o_def_convert']
          const hasLifePraise = isOracle && talents['s_notable_life']
          const hasSteelSong = isOracle && talents['s_notable_steel']

          let atkRate = isHealer ? 0.9 : 0.6
          let defRate = isHealer ? 0.7 : 0.4
          let hpRate  = isHealer ? 0.9 : 0.6

          // 基石继承率调整（基础部分，额外部分稍后处理）
          if (hasSoulLink) { atkRate += 0.1; defRate += 0.1; hpRate += 0.1 }
          if (hasSoulResonance) { atkRate += 0.2; defRate += 0.2; hpRate += 0.2 }

          // 小节点：继承率提升
          if (talents['o_companion1']) { atkRate += 0.1; defRate += 0.1; hpRate += 0.1 }
          if (talents['s_companion4']) { atkRate += 0.15; defRate += 0.15; hpRate += 0.15 }

          // 自身基础 + 等级成长
          const selfBaseAtk = (companionSave.baseAtk || 25) + companionLevel * 3
          const selfBaseDef = (companionSave.baseDef || 12) + companionLevel * 2
          const selfBaseHp = (companionSave.baseHp || 200) + companionLevel * 20

          const inheritedAtk = Math.floor(originalAttack * atkRate)
          const inheritedDef = Math.floor(originalDefense * defRate)
          const inheritedHp = Math.floor(originalMaxHp * hpRate)

          let attack = selfBaseAtk + inheritedAtk + affectionBonusLv * 20
          let defense = selfBaseDef + inheritedDef + affectionBonusLv * 10
          let hp = selfBaseHp + inheritedHp + affectionBonusLv * 50
          let speed = originalSpeed + 5 + affectionBonusLv * 2
          let critRate = Math.floor(originalCritRate * 0.8)
          let critDmg = Math.floor(originalCritDmg * 0.8)

          // 基石额外继承（不削弱玩家）
          if (isOracle) {
            let extraAtkRate = 0, extraDefRate = 0, extraHpRate = 0
            if (hasSoulLink) { extraAtkRate += 0.4; extraDefRate += 0.4; extraHpRate += 0.4 }
            if (hasSoulResonance) { extraAtkRate += 0.8; extraDefRate += 0.8; extraHpRate += 0.8 }
            attack += Math.floor(originalAttack * extraAtkRate)
            defense += Math.floor(originalDefense * extraDefRate)
            hp += Math.floor(originalMaxHp * extraHpRate)
          }

          // 伙伴攻击力% 直接乘算
          let finalAtkMult = 1.0
          if (talents['o_companion2']) finalAtkMult += 0.1
          if (talents['s_companion5']) finalAtkMult += 0.15
          attack = Math.floor(attack * finalAtkMult)

          // 伙伴暴伤固定值
          if (talents['o_companion3']) critDmg += 15
          if (talents['s_companion6']) critDmg += 20

          // 生命转化 / 生命礼赞
          if (hasLifeConvert) {
            const bonusAtkPct = Math.floor(originalMaxHp / 100) * 3
            attack += Math.floor(attack * bonusAtkPct / 100)
          }
          if (hasLifePraise) {
            const bonusAtkPct = Math.floor(originalMaxHp / 100) * 4
            attack += Math.floor(attack * bonusAtkPct / 100)
          }
          if (hasDefConvert) {
            const bonusCritDmg = Math.floor(originalDefense / 50) * 5
            critDmg += bonusCritDmg
          }
          if (hasSteelSong) {
            const bonusCritDmg = Math.floor(originalDefense / 50) * 6
            critDmg += bonusCritDmg
          }

          // 构建伙伴技能（保持原样）
          const skillSlots = companionSave.skillSlots || {}
          const companionSkillsData = companionSave.skills || {}
          const companionSkillDefs = []

          for (const slotKey of Object.keys(skillSlots)) {
            const skillId = skillSlots[slotKey]
            if (!skillId) continue
            const skillDef = store.config?.skillPool?.find(s => s.id === skillId)
            if (!skillDef) continue
            
            const skillLevel = companionSkillsData[skillId]?.level || 1
            const levelScaling = skillDef.levelScaling?.baseMul || 0.1
            let currentMul = skillDef.baseMul || 0
            for (let i = 2; i <= skillLevel; i++) {
              const growth = levelScaling * (1 + (i - 1) * 0.08)
              currentMul += growth
            }

            companionSkillDefs.push({
              ...skillDef,
              currentLevel: skillLevel,
              baseMul: currentMul,
              element: skillDef.element || '',
              mpCost: skillDef.mpCost || 0,
              effects: skillDef.effects || [],
            })
          }

          companionUnit = {
            id: companionId,
            level: companionLevel,
            dmgTaken: store.playerStats.dmgTaken || 0,
            name: companionSave.name || '伙伴',
            icon: companionSave.icon || 'mdi:account-heart',
            isCompanion: true,
            attack, defense, hp, maxHp: hp,
            mp: Math.max(Math.floor(originalMaxMp * 0.6), 50),
            maxMp: Math.max(Math.floor(originalMaxMp * 0.6), 50),
            speed, critRate, critDmg,
            skills: companionSkillDefs,
            specialBossDmg: store.playerStats.specialBossDmg || 0,
            specialFullHpDmg: store.playerStats.specialFullHpDmg || 0,
            specialIgnoreDef: store.playerStats.specialIgnoreDef || 0,
            fireDmg: store.playerStats.fireDmg || 0,
            waterDmg: store.playerStats.waterDmg || 0,
            thunderDmg: store.playerStats.thunderDmg || 0,
            lifesteal: store.playerStats.lifesteal || 0,
          }
        }
      }
    }

    let stackingAtk = 0
    for (const aff of store.activeAffixEffects) {
      if (aff.bonus?.stackingAtk) stackingAtk += aff.bonus.stackingAtk
    }

    const fullPlayerStats = {
      ...store.playerStats,
      stackingAtk: stackingAtk,
      isPlayer: true,
      talents: store.player.talents || {},
      mpCostReduction: store.playerStats.mpCostReduction || 0,
      mpOnHit: store.playerStats.mpOnHit || 0,
      mpOnKill: store.playerStats.mpOnKill || 0,
    }

    const enrichedEnemies = enemiesInput.map(e => ({
      ...e,
      isBoss: e.isBoss ?? (e.base?.isBoss) ?? false,
      isRaidBoss: e.isRaidBoss ?? (e.base?.isRaidBoss) ?? false,
      level: e.level ?? (e.base?.level) ?? 1,
      exp: e.exp ?? ((e.level ?? (e.base?.level) ?? 1) * 10 + 5),
    }))

    engine.value = new CombatEngine(
      fullPlayerStats,
      enrichedEnemies,
      companionUnit,
      store.player.skills || {},
      store.config
    )
    window.__engine = engine.value
    syncStateFromEngine()
}
  function addFloatingNumber(targetIndex, amount, type = 'normal', offsetY = 0) {
    const id = ++floatId;
    floatingNumbers.value.push({ id, targetIndex, amount, type, offsetY });
    setTimeout(() => {
      const idx = floatingNumbers.value.findIndex(f => f.id === id);
      if (idx !== -1) floatingNumbers.value.splice(idx, 1);
    }, 3000);
  }

  function syncStateFromEngine() {
    if (!engine.value) return
    store.player.hp = engine.value.player.hp
    store.player.mp = engine.value.player.mp
    playerShield.value = engine.value.player.getShield()

    const originalEnemies = store.battleEnemies || []

    enemies.value = engine.value.enemies.map((enemy, idx) => {
      const original = originalEnemies[idx] || {}
      const shield = enemy.getShield ? enemy.getShield() : 0
      return {
        ...enemy,
        id: enemy.id,
        name: enemy.name || original.name || '未知敌人',
        hp: Math.max(0, enemy.hp),
        maxHp: enemy.maxHp,
        shield,
        element: enemy.element || original.element || '',
        icon: enemy.icon || original.icon || 'mdi:help-circle',
        level: enemy.level || original.level || 1,
        atk: enemy.attack,
        def: enemy.defense,
        effects: enemy.effects || [],
        isBoss: original.isBoss === true,
        isRaidBoss: original.isRaidBoss === true,
      }
    })

   // 同步伙伴状态
if (engine.value && engine.value.companion) {
    const comp = engine.value.companion
    // 从 store 中获取当前伙伴的等级和经验值
    const companionSave = store.companions?.find(c => c.id === store.activeCompanionId)
     const companionExp = companionSave?.exp || 0
 const companionLevel = companionSave?.level || 1
const companionNextExp = Math.floor(100 * Math.pow(1.1, companionLevel - 1))
const companionExpPercent = companionNextExp > 0 ? (companionExp / companionNextExp) * 100 : 0
    companion.value = {
        id: comp.id,
        name: comp.name,
        level: companionLevel,          // 同步等级
        hp: Math.max(0, comp.hp),
        maxHp: comp.maxHp,
        mp: comp.mp || 0,
        maxMp: comp.maxMp || 0,
        exp: companionExp,              // 同步经验
        nextExp: companionNextExp,
        expPercent: companionExpPercent,
        icon: comp.icon,
        effects: comp.effects || []
    }
} else {
  companion.value = null
}
   

    playerEffectsDisplay.value = engine.value.player.effects
      .filter(e => e.duration > 0)
      .map(e => {
        const isDebuff = ['atkDown', 'defDown', 'spdDown', 'stun', 'freeze', 'silence', 'weak', 'dot', 'bleed'].includes(e.type)
        const isMark = ['holyMark', 'dragonMark', 'shadowMark', 'element_mark'].includes(e.type)
        const name = EFFECT_NAMES[e.type] || e.type
        let displayValue = ''
        if (e.type === 'shield') {
          displayValue = Math.floor(e.value) + ' 点'
        } else if (e.type === 'stun' || e.type === 'freeze' || e.type === 'silence') {
          displayValue = '控制'
        } else if (e.type === 'dot' || e.type === 'bleed') {
          const totalDmg = Math.floor(e.value * Math.pow(2, (e.stacks || 1) - 1))
          displayValue = totalDmg + ' 点/回合'
        } else {
          const val = e.value || 0
          const percent = Math.abs(val * 100).toFixed(0)
          displayValue = (val >= 0 ? '+' : '-') + percent + '%'
        }
        return {
          ...e,
          name,
          displayValue,
          isBuff: !isDebuff && !isMark,
          isDebuff,
          isMark
        }
      })

    store._refreshSetBonuses?.()

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

  // ---------- 玩家使用技能 ----------
  async function useSkill(skill, showMessage) {
    if (!playerTurn.value || gameOver.value || waiting.value || !engine.value) return

    const mpCostReduction = store.playerStats.mpCostReduction || 0
    const actualMpCost = skill.mpCost > 0 
      ? Math.max(1, Math.floor(skill.mpCost * (1 - mpCostReduction / 100))) 
      : 0
    if (actualMpCost > store.player.mp) {
      await showMessage('MP 不足！')
      return
    }

    const targetIdx = currentTargetIndex.value

    const skillLevel = store.player.skills[skill.id]?.level || 1
    const base = skill.baseMul || 0
    const basePerLevel = skill.levelScaling?.baseMul || 0.1
    let currentMul = base
    for (let i = 2; i <= skillLevel; i++) {
      const growthAtThisLevel = basePerLevel * (1 + (i - 1) * 0.08)
      currentMul += growthAtThisLevel
    }

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

    let mergedEffects = [...(skill.effects || [])];
    for (const extra of extraEffects) {
      if (extra.type === 'buff' && extra.stat) {
        const existing = mergedEffects.find(e => e.type === 'buff' && e.stat === extra.stat);
        if (existing) {
          existing.value = (existing.value || 0) + (extra.value || 0);
        } else {
          mergedEffects.push(extra);
        }
      } else if (extra.type === 'debuff' && extra.stat) {
        const existing = mergedEffects.find(e => e.type === 'debuff' && e.stat === extra.stat);
        if (existing) {
          existing.value = Math.min(existing.value || 0, extra.value || 0);
        } else {
          mergedEffects.push(extra);
        }
      } else if (extra.type === 'dot' || extra.type === 'shield') {
        mergedEffects.push(extra);
      } else {
        mergedEffects = mergedEffects.filter(e => e.type !== extra.type);
        mergedEffects.push(extra);
      }
    }

    const effectiveSkill = {
      ...skill,
      baseMul: currentMul,
      effects: mergedEffects,
      extraActions,
      mpCost: actualMpCost,
    };

    const result = engine.value.executePlayerAction(effectiveSkill, targetIdx, { noMpCost: isTrainingRoom.value })
    if (!result) return

    if (result.hitDetails && result.hitDetails.length > 0) {
      result.hitDetails.forEach(hit => {
        if (hit.isShadowTrue) {
          addFloatingNumber(hit.targetIndex, hit.damage, 'shadowTrue')
        }
        if (!hit.crit && hit.multiplier === 1 && !hit.trueDmg && !hit.isShadowTrue) return;
        if (hit.crit || hit.multiplier !== 1) {
          let type = 'normal';
          if (hit.crit) type = 'crit';
          else if (hit.multiplier > 1) type = 'effective';
          else if (hit.multiplier < 1) type = 'resisted';
          addFloatingNumber(hit.targetIndex, hit.damage, type);
        }
        if (hit.trueDmg && hit.trueDmg > 0) {
          addFloatingNumber(hit.targetIndex, hit.trueDmg, 'trueDmg', -20);
        }
      });
    }

    if (result.damage > 0 && targetIdx >= 0) {
      hitEnemyIndex.value = targetIdx;
      setTimeout(() => {
        if (hitEnemyIndex.value === targetIdx) hitEnemyIndex.value = -1;
      }, 300);
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

  // ---------- 敌人回合 ----------
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

  // ---------- 胜利、奖励等 ----------
// ---------- 胜利、奖励等 ----------
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

    let engineRewards = { exp: 0, materials: [], accessories: [], equipments: [], gems: [], companionExp: 0 }
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
      gems: engineRewards.gems || [],
      equipments: engineRewards.equipments || [],
      companionExp: engineRewards.companionExp || 0
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
  // 玩家经验
  if (totalReward.value.exp) store.addExperience(totalReward.value.exp)
  
  // 新增：伙伴经验
  if (totalReward.value.companionExp && store.activeCompanionId) {
    if (store.addCompanionExp) {
      store.addCompanionExp(store.activeCompanionId, totalReward.value.companionExp)
    }
  }

  // 材料
  if (totalReward.value.materials?.length) {
    totalReward.value.materials.forEach(m => store.addMaterial(m.id, m.name, m.qty || 1))
  }
  
  // 饰品
  if (totalReward.value.accessories?.length) {
    totalReward.value.accessories.forEach(acc => {
      acc.name = generateAccessoryName(acc.part, acc.affixes)
      store.inventory.push(acc)
    })
  }
  
  // 装备
  if (totalReward.value.equipments?.length) {
    totalReward.value.equipments.forEach(eq => store.inventory.push(eq))
  }
  
  // 宝石
  if (totalReward.value.gems?.length) {
    for (const gem of totalReward.value.gems) {
      const existing = store.inventory.find(i => i.id === gem.id)
      if (existing) {
        existing.qty = (existing.qty || 1) + gem.qty
      } else {
        store.inventory.push({ id: gem.id, name: gem.name, qty: gem.qty })
      }
    }
  }
  
  // 徽记掉落
  const tokenQty = Math.random() < 0.3 ? 3 : 2
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
    hitEnemyIndex, floatingNumbers,
    addFloatingNumber,
    initEngine, syncStateFromEngine, useSkill, enemyTurn, victory,
    handleGameOver, saveRewards, onResultClose, onNextFloor, onRetreat,
    selectTarget, getCustomImage, getCompanionImage, destroy, resetVictoryFlag,
  }
}