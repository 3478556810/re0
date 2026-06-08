<template>
  <div class="class-tree-wrapper">
    <div class="tree-header">
      <h3><Icon icon="mdi:family-tree" /> 转职路线</h3>
      <button class="reset-class-btn" @click="resetClass">↺ 重置</button>
    </div>
    <div class="tree-canvas">
      <VueFlow
        :nodes="flowNodes"
        :edges="flowEdges"
        :default-viewport="{ x: 100, y: 50, zoom: 0.8 }"
        :min-zoom="0.5"
        :max-zoom="2"
        :pan-on-scroll="false"
        :zoom-on-scroll="true"
        :pan-on-drag="true"
        :nodes-draggable="false"
        :edges-updatable="false"
        class="vue-flow-container"
        @node-click="onNodeClick"
      >
        <template #node-custom="nodeProps">
          <div
            class="tree-node"
            :class="{
              active: nodeProps.data.active,
              unlocked: nodeProps.data.unlocked,
              advanced: nodeProps.data.advanced
            }"
          >
            <Icon :icon="nodeProps.data.icon" class="node-icon" />
            <span class="node-label">{{ nodeProps.data.label }}</span>
            <span v-if="!nodeProps.data.unlocked && nodeProps.data.reqLevel" class="node-req">
              Lv.{{ nodeProps.data.reqLevel }}
            </span>
          </div>
        </template>
      </VueFlow>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const store = useGameStore()
const showToast = inject('showToast', (msg) => alert(msg))

const props = defineProps({
  firstJobs: Array,
  secondJobs: Array,
  isAdvanced: Boolean,
  currentClass: String
})

// 从 props 构建职业映射表
const classDefsMap = computed(() => {
  const map = { wanderer: { name: '流浪者', icon: 'mdi:account', tier: 0, parent: null, reqLevel: 0 } }
  for (const job of props.firstJobs) {
    map[job.id] = { ...job, tier: 1, parent: 'wanderer' }
  }
  for (const job of props.secondJobs) {
    map[job.id] = { ...job, tier: 2 }
  }
  return map
})

function getJobDef(id) {
  return classDefsMap.value[id] || null
}

const allNodes = computed(() => {
  const nodes = []
  nodes.push({
    id: 'wanderer',
    type: 'custom',
    data: {
      label: '流浪者',
      icon: 'mdi:account',
      active: store.player.class === 'wanderer',
      unlocked: true,
      advanced: false,
      reqLevel: null
    }
  })
  for (const job of props.firstJobs) {
    const def = getJobDef(job.id)
    nodes.push({
      id: job.id,
      type: 'custom',
      data: {
        label: job.name,
        icon: job.icon,
        active: store.player.class === job.id,
        unlocked: job.unlocked,
        advanced: false,
        reqLevel: def?.reqLevel || 1  // 从 CLASS_DEFS 动态读取
      }
    })
  }
  for (const job of props.secondJobs) {
    const def = getJobDef(job.id)
    nodes.push({
      id: job.id,
      type: 'custom',
      data: {
        label: job.name,
        icon: job.icon,
        active: store.player.class === job.id,
        unlocked: job.unlocked,
        advanced: true,
        reqLevel: def?.reqLevel || 15  // 从 CLASS_DEFS 动态读取
      }
    })
  }
  return nodes
})

const edges = computed(() => {
  const edgeList = []
  for (const node of allNodes.value) {
    const def = getJobDef(node.id)
    if (def && def.parent) {
      edgeList.push({
        id: `${def.parent}-${node.id}`,
        source: def.parent,
        target: node.id,
        type: 'default',
        animated: false,
        style: { stroke: '#ffd700', strokeWidth: 2 }
      })
    }
  }
  return edgeList
})

function computePositions() {
  const positions = {}
  const childrenMap = {}
  for (const node of allNodes.value) {
    const def = getJobDef(node.id)
    if (def && def.parent) {
      if (!childrenMap[def.parent]) childrenMap[def.parent] = []
      childrenMap[def.parent].push(node.id)
    }
  }
  function setPos(id, x, y) {
    positions[id] = { x, y }
    const children = childrenMap[id] || []
    const childCount = children.length
    if (childCount === 0) return
    const startY = y - ((childCount - 1) * 60) / 2
    for (let i = 0; i < childCount; i++) {
      setPos(children[i], x + 180, startY + i * 60)
    }
  }
  setPos('wanderer', 0, 0)
  return positions
}

const layoutPositions = computed(() => computePositions())

const flowNodes = computed(() => {
  return allNodes.value.map(node => ({
    ...node,
    position: layoutPositions.value[node.id] || { x: 0, y: 0 }
  }))
})

const flowEdges = computed(() => edges.value)

// ========== 核心修复：动态读取 reqLevel ==========
function onNodeClick({ node }) {
  const jobId = node.id
  const def = getJobDef(jobId)
  if (!def) return

  const reqLevel = def.reqLevel || 0
  if (store.player.level < reqLevel) {
    showToast(`需要等级 ${reqLevel}`)
    return
  }

  if (def.tier === 2) {
    const currentDef = getJobDef(store.player.class)
    const currentParent = currentDef?.tier === 1 ? store.player.class : currentDef?.parent
    if (def.parent && currentParent && def.parent !== currentParent) {
      const parentName = getJobDef(def.parent)?.name || '对应一转'
      showToast(`需先转职为 ${parentName}`)
      return
    }
  }

  // 原：store.player.class = jobId; store.save()
  store.changeClassWithRecalc(jobId)   // 使用新方法
  showToast(`已转职为 ${def.name}`)
}


function resetClass() {
  store.changeClassWithRecalc('wanderer')   // 重置为流浪者并重算属性
  showToast('已重置为流浪者')
}

const { fitView } = useVueFlow()
function centerActiveNode() {
  const activeNodeId = store.player.class
  const node = flowNodes.value.find(n => n.id === activeNodeId)
  if (node && fitView) {
    fitView({ nodes: [node], duration: 300, padding: 0.3 })
  }
}

onMounted(() => {
  setTimeout(centerActiveNode, 100)
})
</script>

<style scoped>
.class-tree-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.tree-header h3 {
  font-size: 10px;
  color: #ccc;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.reset-class-btn {
  background: rgba(255,100,100,0.15);
  border: 1px solid #ff5555;
  color: #ffaaaa;
  font-family: inherit;
  font-size: 7px;
  padding: 2px 8px;
  border-radius: 8px;
  cursor: pointer;
}
.tree-canvas {
  flex: 1;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  overflow: hidden;
}
.vue-flow-container {
  width: 100%;
  height: 100%;
  background: transparent;
}
.tree-node {
  background: rgba(0,0,0,0.5);
  border: 2px solid rgba(255,255,255,0.15);
  border-radius: 10px;
  padding: 8px 14px;
  min-width: 75px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: 0.2s;
  font-family: 'Press Start 2P', monospace;
}
.tree-node.unlocked:hover { border-color: #ffd700; }
.tree-node.active {
  border-color: #ffd700;
  background: rgba(255,215,0,0.15);
  box-shadow: 0 0 10px rgba(255,215,0,0.3);
}
.tree-node:not(.unlocked) { opacity: 0.5; cursor: not-allowed; }
.tree-node.advanced { border-color: rgba(255,100,0,0.4); }
.tree-node.advanced.active {
  border-color: #ff6600;
  background: rgba(255,100,0,0.2);
}
.node-icon { font-size: 22px; color: #ffd700; }
.node-label {
  font-size: 8px;
  color: #ccc;
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
}
.node-req { font-size: 6px; color: #ff9800; margin-top: 2px; }
:deep(.vue-flow__edge-path) {
  stroke: #ffd700;
  stroke-width: 2;
}
</style>