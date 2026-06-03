import { ref } from 'vue'

export function useHuntQuests() {
  const activeHuntQuests = ref([])

  function acceptHuntQuest(quest, saveFn) {
    if (activeHuntQuests.value.length >= 3) return false
    activeHuntQuests.value.push({
      id: quest.id,
      desc: quest.desc,
      target: quest.target,
      count: quest.count,
      killed: 0,
      rewardExp: quest.rewardExp,
      goldReward: quest.goldReward,
      isBossQuest: quest.isBossQuest || false
    })
    if (saveFn) saveFn()
    return true
  }

  function updateHuntProgress(enemyIds, addRankExperience, addGold, completeRankUp, saveFn) {
    if (!enemyIds || enemyIds.length === 0 || activeHuntQuests.value.length === 0)
      return { anyCompleted: false, completedQuests: [] }
    let anyCompleted = false
    const completedQuests = []
    for (const quest of activeHuntQuests.value) {
      if (quest.killed >= quest.count) continue
      for (const id of enemyIds) {
        if (id === quest.target) quest.killed = Math.min(quest.killed + 1, quest.count)
      }
      if (quest.killed >= quest.count) {
        addRankExperience(quest.rewardExp)
        addGold(quest.goldReward)
        if (quest.isBossQuest) completeRankUp()
        anyCompleted = true
        completedQuests.push(quest)
      }
    }
    activeHuntQuests.value = activeHuntQuests.value.filter(q => q.killed < q.count)
    if (saveFn) saveFn()
    return { anyCompleted, completedQuests }
  }

  function abandonHuntQuest(questId, saveFn) {
    const index = activeHuntQuests.value.findIndex(q => q.id === questId)
    if (index !== -1) {
      activeHuntQuests.value.splice(index, 1)
      if (saveFn) saveFn()
      return true
    }
    return false
  }

  return { activeHuntQuests, acceptHuntQuest, updateHuntProgress, abandonHuntQuest }
}