import { computed, reactive } from 'vue'
import { useGameStore } from '@/store/gameStore'

import { CLASS_DEFS, TALENT_TREES } from './classData' //
export function useClassSystem() {
  const store = useGameStore()

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
      unlocked: store.player.level >= (c.reqLevel || 1)  // 使用 CLASS_DEFS 中的值
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
      unlocked: store.player.level >= (c.reqLevel || 15)  // 使用 CLASS_DEFS 中的值
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
    store.save()
  }

  function resetClass() {
    store.player.class = 'wanderer'
    store.save()
  }

  // 天赋点相关
  const talentPoints = computed(() => {
    return 5 + store.player.level - (store.player.talentSpent || 0)
  })

  function allocateNode(node) {
    if (store.player.skillPoints < node.cost) return false
    store.player.skillPoints -= node.cost
    if (!store.player.talents) store.player.talents = {}
    store.player.talents[node.id] = true
    store.save()
    return true
  }

// 在 return 之前添加
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

  return { initStartNodes,
    currentClass, className, classIcon, classDesc, classBonuses,
    firstJobs, secondJobs, isAdvancedClass,
    selectClass, resetClass,
    talentPoints, allocateNode
  }
}