import { ref } from 'vue'
import { generateAccessoryLoot } from '@/utils/lootGenerator'
import { generateAccessoryName } from '@/config/accessoryConfig'

export function useBattleResult(store, totalReward, questHintText, questCompleteHint, questHintTimer) {
  const showRaidResult = ref(false)
  const raidResultStats = ref({})
  const raidDefeated = ref(false)

  // ★ 改为 ref，统一用 .value 访问
  const totalDamageDealt = ref(0)
  const maxDamageDealt = ref(0)
  const battleStartTime = ref(0)
  const totalTurns = ref(0)

  function initStats() {
    battleStartTime.value = Date.now()
    totalDamageDealt.value = 0
    maxDamageDealt.value = 0
    totalTurns.value = 0
  }

  function recordDamage(damage) {
    totalDamageDealt.value += damage
    if (damage > maxDamageDealt.value) maxDamageDealt.value = damage
  }

  function recordTurn() {
    totalTurns.value++
  }

  function handleVictory(engine) {
    // 普通奖励逻辑（保持不变）
    const enemyIds = (store.battleEnemies || []).map(e => e.id || e.template?.id).filter(Boolean)
    try {
      const result = store.updateHuntProgress(enemyIds)
      if (result && result.anyCompleted) {
        const names = result.completedQuests.map(q => q.desc).join('、')
        questHintText.value = names
        questCompleteHint.value = true
        if (questHintTimer.value) clearTimeout(questHintTimer.value)
        questHintTimer.value = setTimeout(() => { questCompleteHint.value = false }, 3000)
      }
    } catch (e) { console.error('更新讨伐任务失败:', e) }

    let engineRewards = { exp: 0, materials: [], accessories: [], equipments: [], gems: [], companionExp: 0 }
    if (engine) {
      try { engineRewards = engine.getRewards() } catch (e) { console.error('获取战斗奖励失败:', e) }
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
  }

  function handleDefeat(isRaid, engine) {
    // 副本失败不在这里处理，保持空函数
  }

  function saveRewards() {
    if (totalReward.value.exp) store.addExperience(totalReward.value.exp)
    if (totalReward.value.companionExp && store.activeCompanionId) {
      store.addCompanionExp?.(store.activeCompanionId, totalReward.value.companionExp)
    }
    if (totalReward.value.materials?.length) {
      totalReward.value.materials.forEach(m => store.addMaterial(m.id, m.name, m.qty || 1))
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
    if (totalReward.value.gems?.length) {
 for (const gem of totalReward.value.gems) {
  const existing = store.inventory.find(i => i.id === gem.id)
  if (existing) {
    existing.qty = (existing.qty || 1) + (gem.qty || 1)
  } else {
    store.inventory.push({ id: gem.id, name: gem.name, qty: gem.qty || 1 })
  }
}
    }
    const tokenQty = Math.random() < 0.3 ? 3 : 2
    store.addMaterial('dungeon_token', '地下城徽记', tokenQty)
    store.save()
  }

  return {
    showRaidResult, raidResultStats, raidDefeated,
    initStats, recordDamage, recordTurn,
    handleVictory, handleDefeat, saveRewards,
    totalDamageDealt, maxDamageDealt, totalTurns, battleStartTime  // 直接返回 ref
  }
}