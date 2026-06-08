<template>
  <div class="talent-container">
    <div
      class="talent-canvas"
      ref="canvasRef"
      @wheel.prevent="onWheel"
      @mousedown="onDragStart"
      @mousemove="onDragMove"
      @mouseup="onDragEnd"
      @touchstart="onTouchStartAll"
      @touchmove="onTouchMoveAll"
      @touchend="onTouchEndAll"
    >
      <!-- SP 显示（左上） -->
      <div class="sp-fixed">
        <Icon icon="mdi:star-four-points" />
        <span>SP：<strong>{{ skillPoints }}</strong></span>
      </div>

      <!-- 回退按钮（右上） -->
      <div class="rollback-fixed">
        <button class="rollback-btn" @click.stop="handleRollback" title="撤销最近一次加点">
          <Icon icon="mdi:undo-variant" /> 回退
        </button>
      </div>

      <div
        class="talent-grid"
        :style="{
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: 'center center'
        }"
      >
        <div
          v-for="node in nodes"
          :key="node.id"
          class="talent-node"
          :class="[
            node.type,
            {
              allocated: node.allocated,
              locked: !canAllocate(node) && !node.allocated
            }
          ]"
          :style="{ left: node.x + '%', top: node.y + '%' }"
          @click.stop="handleNodeClick(node)"
        >
          <Icon :icon="node.icon" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'
import { CLASS_DEFS } from './classData'

const store = useGameStore()
const showToast = inject('showToast', (msg) => alert(msg))

const props = defineProps({
  nodes: Array,
  skillPoints: Number
})

const emit = defineEmits(['allocate', 'rollback'])

// 缩放与平移
const scale = ref(0.65)
const panX = ref(0)
const panY = ref(0)
const canvasRef = ref(null)

const GRID_WIDTH = 1000
const GRID_HEIGHT = 700

function initPosition() {
  const startNode = props.nodes.find(n => n.cost === 0)
  if (!startNode) return
  nextTick(() => {
    requestAnimationFrame(() => {
      const canvas = canvasRef.value
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const nodePX = (startNode.x / 100) * GRID_WIDTH
      const nodePY = (startNode.y / 100) * GRID_HEIGHT
      panX.value = rect.width / 2 - nodePX * scale.value
      panY.value = rect.height / 2 - nodePY * scale.value
    })
  })
}
onMounted(() => {
  initPosition()
})

// 节点可用性判断
function canAllocate(node) {
  if (node.reqClass && store.player.class !== node.reqClass) return false
  if (node.cost === 0) return !node.allocated
  if (node.allocated) return false
  if (props.skillPoints < node.cost) return false
  if (node.connections.length === 0) return true
  return node.connections.some(id => props.nodes.find(n => n.id === id)?.allocated)
}

function handleNodeClick(node) {
  if (node.allocated) {
    showToast(`${node.name}：${node.effect.replace(/<br\/>/g, '，')}`)
    return
  }

  let detailMsg = `${node.name}：${node.effect.replace(/<br\/>/g, '，')}`

  if (node.reqClass && store.player.class !== node.reqClass) {
    const className = CLASS_DEFS[node.reqClass]?.name || node.reqClass
    showToast(`${detailMsg}（需要转职为【${className}】才能解锁）`)
    return
  }

  if (!canAllocate(node)) {
    if (node.cost > 0 && props.skillPoints < node.cost) {
      detailMsg += `（需${node.cost}点，当前不足）`
    } else if (node.cost > 0 && node.connections.length > 0) {
      const hasUnlocked = node.connections.some(id => props.nodes.find(n => n.id === id)?.allocated)
      if (!hasUnlocked) detailMsg += '（需先解锁前置节点）'
    }
    showToast(detailMsg)
    return
  }

  if (node.cost === 0) {
    node.allocated = true
    if (!store.player.talents) store.player.talents = {}
    store.player.talents[node.id] = true
    store.save()
    showToast(`${node.name} 已激活`)
    return
  }

  detailMsg += `（需${node.cost}点，再次点击确认）`
  if (node._pendingConfirm) {
    clearTimeout(node._pendingConfirm)
    node._pendingConfirm = null
    emit('allocate', node)
    showToast(`${node.name} 已激活！(-${node.cost} SP)`)
  } else {
    node._pendingConfirm = setTimeout(() => { node._pendingConfirm = null }, 600)
    showToast(detailMsg)
  }
}

// 回退按钮处理
function handleRollback() {
  emit('rollback')
}

// ========== 拖拽/缩放事件（原有逻辑不变） ==========
let isDragging = false, startX, startY, lastPanX, lastPanY
function onDragStart(e) {
  if (e.button !== 0) return
  isDragging = true; startX = e.clientX; startY = e.clientY; lastPanX = panX.value; lastPanY = panY.value
}
function onDragMove(e) {
  if (!isDragging) return
  panX.value = lastPanX + (e.clientX - startX); panY.value = lastPanY + (e.clientY - startY)
}
function onDragEnd() { isDragging = false }
function onWheel(e) {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  scale.value = Math.min(2.5, Math.max(0.35, scale.value + delta))
}

let touchStartDist = 0, touchStartScale = 1
let touchStartX = 0, touchStartY = 0, touchLastPanX = 0, touchLastPanY = 0
let isTouching = false
function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}
function onTouchStartAll(e) {
  if (e.touches.length === 2) {
    touchStartDist = getTouchDist(e.touches); touchStartScale = scale.value
  } else if (e.touches.length === 1) {
    isTouching = true; touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY
    touchLastPanX = panX.value; touchLastPanY = panY.value
  }
}
function onTouchMoveAll(e) {
  if (e.touches.length === 2 && touchStartDist > 0) {
    const dist = getTouchDist(e.touches)
    scale.value = Math.min(2.5, Math.max(0.35, touchStartScale * (dist / touchStartDist)))
  } else if (isTouching && e.touches.length === 1) {
    panX.value = touchLastPanX + (e.touches[0].clientX - touchStartX)
    panY.value = touchLastPanY + (e.touches[0].clientY - touchStartY)
  }
}
function onTouchEndAll() { isTouching = false; touchStartDist = 0 }
</script>

<style scoped>
.talent-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.talent-canvas {
  flex: 1;
  position: relative;
  background: rgba(0,0,0,0.4);
  border-radius: 16px;
  overflow: hidden;
  touch-action: none;
}

.sp-fixed {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  background: rgba(0,0,0,0.7);
  border: 1px solid #ffd700;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 9px;
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}

.rollback-fixed {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
}
.rollback-btn {
  background: rgba(0,0,0,0.7);
  border: 1px solid #ff8888;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 8px;
  color: #ffaaaa;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: 0.2s;
}
.rollback-btn:hover {
  background: rgba(255,136,136,0.2);
  border-color: #ff5555;
  color: #ff8888;
}

.talent-grid {
  position: relative;
  width: 1000px;
  height: 700px;
  background: radial-gradient(circle at 50% 50%, rgba(255,215,0,0.08), transparent 70%);
  transition: transform 0.05s linear;
}

.talent-node {
  position: absolute;
  width: 40px; height: 40px; margin-left: -20px; margin-top: -20px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: #1e2a3a; border: 2px solid #5a6a8a;
  cursor: pointer; transition: all 0.2s; z-index: 1;
}
.talent-node .iconify { font-size: 20px; color: #8a9ab0; }
.talent-node:hover { border-color: #ffd700; transform: scale(1.15); z-index: 5; }
.talent-node.locked { opacity: 0.35; cursor: default; }
.talent-node.allocated { background: #ffd700 !important; border-color: #ffd700 !important; box-shadow: 0 0 14px rgba(255,215,0,0.6); }
.talent-node.allocated .iconify { color: #1a1a2e !important; }
.talent-node.notable { width: 50px; height: 50px; margin-left: -25px; margin-top: -25px; background: #2a1f1f; border-color: #b89a6a; }
.talent-node.notable .iconify { font-size: 24px; }
.talent-node.keystone { width: 60px; height: 60px; margin-left: -30px; margin-top: -30px; background: #1a0a0a; border-color: #ff5555; border-radius: 8px; transform: rotate(45deg); }
.talent-node.keystone .iconify { transform: rotate(-45deg); font-size: 26px; }
</style>