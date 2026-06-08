import { computed } from 'vue'
import { useGameStore } from '@/store/gameStore'
import { CLASS_DEFS, TALENT_TREES } from './classData'

export function useClassSystem() {
  const store = useGameStore()

  // 初始化历史数组（若不存在）
  if (!store.player.talentHistory) {
    store.player.talentHistory = []
  }

  const currentClass = computed(() => CLASS_DEFS[store.player.class] || CLASS_DEFS.wanderer)
  const className = computed(() => currentClass.value.name)
  const classIcon = computed(() => currentClass.value.icon)
  const classDesc = computed(() => currentClass.value.desc)
  const classBonuses = computed(() => currentClass.value.bonuses)

  const firstJobs = computed(() => {
    return Object.values(CLASS_DEFS)
      .filter(c => c.tier === 1)
      .map(c => ({
        ...c,
        unlocked: store.player.level >= (c.reqLevel || 1)
      }))
  })

  const secondJobs = computed(() => {
    const current = store.player.class
    let parentId = current
    const def = CLASS_DEFS[current]
    if (def && def.tier === 2) parentId = def.parent
    else if (def && def.tier === 1) parentId = current
    else parentId = 'warrior'

    return Object.values(CLASS_DEFS)
      .filter(c => c.tier === 2 && c.parent === parentId)
      .map(c => ({
        ...c,
        unlocked: store.player.level >= (c.reqLevel || 15)
      }))
  })

  const isAdvancedClass = computed(() => {
    const def = CLASS_DEFS[store.player.class]
    return def && def.tier === 2
  })

  function selectClass(id) {
    const def = CLASS_DEFS[id]
    if (!def) return
    if (def.tier === 1 && store.player.level < 10) return
    if (def.tier === 2 && store.player.level < (def.reqLevel || 25)) return
    if (def.parent && store.player.class !== def.parent && store.player.class !== id) return
    store.player.class = id
    // 职业切换，清空历史
    store.player.talentHistory = []
    store.save()
  }

  function resetClass() {
    store.player.class = 'wanderer'
    store.player.talentHistory = []
    store.save()
  }

  // 加点和回退的核心方法
  function allocateNode(node) {
    if (store.player.skillPoints < node.cost) return false
    // 记录历史
    if (!store.player.talentHistory) store.player.talentHistory = []
    store.player.talentHistory.push({ nodeId: node.id, cost: node.cost })
    // 执行加点
    store.player.skillPoints -= node.cost
    if (!store.player.talents) store.player.talents = {}
    store.player.talents[node.id] = true
    store.save()
    return true
  }

  function rollbackLastNode() {
    const history = store.player.talentHistory
    if (!history || history.length === 0) return false
    const last = history[history.length - 1]
    const { nodeId, cost } = last
    // 检查节点是否确实已被分配
    if (!store.player.talents || !store.player.talents[nodeId]) {
      // 数据不一致，清空历史
      store.player.talentHistory = []
      store.save()
      return false
    }
    // 执行回退
    store.player.talentHistory.pop()
    delete store.player.talents[nodeId]
    store.player.skillPoints += cost
    store.save()
    return true
  }

  // 初始化免费节点（不产生历史）
  function initStartNodes() {
    const classId = store.player.class
    const def = CLASS_DEFS[classId]
    let series = 'warrior'
    if (def) {
      if (def.tier === 2) series = def.parent
      else if (def.tier === 1) series = classId
    }
    const tree = TALENT_TREES[series]
    if (!tree) return
    const freeNodes = tree.nodes.filter(n => n.cost === 0)
    if (!store.player.talents) store.player.talents = {}
    let changed = false
    freeNodes.forEach(n => {
      if (!store.player.talents[n.id]) {
        store.player.talents[n.id] = true
        changed = true
      }
    })
    if (changed) store.save()
  }
// 在 useClassSystem 中添加以下方法

// 计算当前职业天赋树中，某节点的 cost（根据 node.id 查找）
function getNodeCost(nodeId) {
  const classId = store.player.class
  const def = CLASS_DEFS[classId]
  let series = 'warrior'
  if (def) {
    if (def.tier === 2) series = def.parent
    else if (def.tier === 1) series = classId
  }
  const tree = TALENT_TREES[series]
  if (!tree) return 0
  const node = tree.nodes.find(n => n.id === nodeId)
  return node ? node.cost : 0
}

// 重置所有天赋点（返还所有已消耗的 SP，清空 talents 和 talentHistory）
function resetAllTalents() {
  if (!store.player.talents) {
    store.player.talents = {}
  }
  // 计算总花费
  let totalSpent = 0
  for (const nodeId of Object.keys(store.player.talents)) {
    totalSpent += getNodeCost(nodeId)
  }
  // 返还 SP
  store.player.skillPoints += totalSpent
  // 清空天赋记录
  store.player.talents = {}
  store.player.talentHistory = []
  store.save()
  return totalSpent
}
  return {
    initStartNodes,resetAllTalents,
    currentClass, className, classIcon, classDesc, classBonuses,
    firstJobs, secondJobs, isAdvancedClass,
    selectClass, resetClass,
    allocateNode,
    rollbackLastNode
  }
}