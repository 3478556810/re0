import { ref, watch } from 'vue'

export function useRank(player, pendingRankUp, pendingTargetRank, configRef) {
  const rankConfig = [
    { name: '黑铁', requiredExp: 300, discount: 0, icon: 'mdi:circle-small' },
    { name: '青铜', requiredExp: 600, discount: 5, icon: 'mdi:circle-double' },
    { name: '白银', requiredExp: 1000, discount: 10, icon: 'mdi:brightness-5' },
    { name: '黄金', requiredExp: 1500, discount: 15, icon: 'mdi:star-four-points' },
    { name: '白金', requiredExp: 2200, discount: 20, icon: 'mdi:diamond' },
    { name: '钻石', requiredExp: 3200, discount: 25, icon: 'mdi:rhombus-split' },
    { name: '大师', requiredExp: 4500, discount: 30, icon: 'mdi:shield-crown' },
    { name: '王者', requiredExp: 6000, discount: 35, icon: 'mdi:crown' }
  ]

  function checkRankUp(saveFn) {
    if (pendingRankUp.value) return
    const currentIdx = rankConfig.findIndex(r => r.name === player.rank)
    if (currentIdx === -1 || currentIdx >= rankConfig.length - 1) return
    if (player.rankExp >= rankConfig[currentIdx].requiredExp) {
      pendingRankUp.value = true
      pendingTargetRank.value = rankConfig[currentIdx + 1].name
      window.dispatchEvent(new CustomEvent('needBossQuest', { detail: { currentRank: player.rank, nextRank: pendingTargetRank.value } }))
      if (saveFn) saveFn()
    }
  }

  function addRankExperience(exp, saveFn) {
    if (exp <= 0) return
    player.rankExp += exp
    checkRankUp(saveFn)
    if (saveFn) saveFn()
  }

  // 监听
  watch(() => player.rankExp, (newExp) => {
    if (pendingRankUp.value) return
    const currentIdx = rankConfig.findIndex(r => r.name === player.rank)
    if (currentIdx === -1 || currentIdx >= rankConfig.length - 1) return
    if (newExp >= rankConfig[currentIdx].requiredExp) {
      pendingRankUp.value = true
      pendingTargetRank.value = rankConfig[currentIdx + 1].name
      window.dispatchEvent(new CustomEvent('needBossQuest', { detail: { currentRank: player.rank, nextRank: pendingTargetRank.value } }))
    }
  })

  function completeRankUp() {
    if (!pendingRankUp.value) return false
    const currentIdx = rankConfig.findIndex(r => r.name === player.rank)
    if (currentIdx === -1 || currentIdx >= rankConfig.length - 1) return false
    player.rankExp = Math.max(0, player.rankExp - rankConfig[currentIdx].requiredExp)
    player.rank = rankConfig[currentIdx + 1].name
    pendingRankUp.value = false
    pendingTargetRank.value = null
    return true
  }

  function getBossForRank(dungeon) {
    const currentIdx = rankConfig.findIndex(r => r.name === player.rank)
    if (currentIdx === -1) return null
    const targetFloor = (currentIdx + 1) * 5
    const dungeonIds = Object.keys(configRef.dungeonConfigs)
    let dungeonId = dungeon.lastDungeonId
    if (!dungeonId || dungeonId === 'training_room') dungeonId = dungeonIds.find(id => id !== 'training_room')
    if (!dungeonId) return null
    const dg = configRef.dungeonConfigs[dungeonId]
    const maxFloor = dg.maxFloors || 1
    const floor = Math.min(targetFloor, maxFloor)
    const monsterIds = dg.monstersByFloor[floor] || dg.monstersByFloor[1] || []
    const bossId = monsterIds.find(id => configRef.monsterTemplates.find(m => m.id === id)?.isBoss) || monsterIds[0]
    const template = configRef.monsterTemplates.find(m => m.id === bossId)
    return { bossId, template, floor, dungeonId, dungeonName: dg.name || dungeonId }
  }

  return { rankConfig, checkRankUp, addRankExperience, completeRankUp, getBossForRank }
}