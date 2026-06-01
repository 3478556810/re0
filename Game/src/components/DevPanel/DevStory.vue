<template>
  <div class="section">
    <h3>剧情脚本</h3>
    <p class="hint">当前完整剧情已自动加载。追加导入时，只需粘贴新节点，系统会自动合并。</p>
    <textarea v-model="jsonText" class="pixel-textarea" rows="12" placeholder="当前剧情..."></textarea>
    
    <div class="append-area">
      <h4>追加导入新节点</h4>
      <textarea v-model="appendJsonText" class="pixel-textarea small" rows="6" placeholder="粘贴要追加的节点JSON（例如新章节），不需要包含start节点"></textarea>
      <button class="pixel-btn small" @click="appendJson">追加导入</button>
    </div>

    <div class="actions">
      <button class="pixel-btn small" @click="replaceJson">替换全部</button>
      <button class="pixel-btn small" @click="exportJson">导出 JSON</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '../../store/gameStore'

const store = useGameStore()
const jsonText = ref(JSON.stringify(store.config.storyScript, null, 2))
const appendJsonText = ref('')

function ensureStartNode(tree) {
  if (tree['start']) return tree
  const ids = Object.keys(tree)
  if (ids.length === 0) return tree
  const firstId = ids[0]
  return {
    start: {
      id: 'start',
      text: '',
      nextId: firstId
    },
    ...tree
  }
}

function replaceJson() {
  try {
    const parsed = JSON.parse(jsonText.value)
    const fixed = ensureStartNode(parsed)
    store.config.storyScript = fixed
    store.save()
    jsonText.value = JSON.stringify(fixed, null, 2)
    showToast('剧情已替换！')
  } catch (e) {
    showToast('JSON 格式错误: ' + e.message)
  }
}

function appendJson() {
  if (!appendJsonText.value.trim()) {
    showToast('请先在追加框中粘贴新节点JSON')
    return
  }
  try {
    const newPart = JSON.parse(appendJsonText.value)
    const current = JSON.parse(jsonText.value) // 当前剧情

    // 获取新节点的第一个ID（用于连接）
    const newIds = Object.keys(newPart)
    if (newIds.length > 0) {
      const firstNewId = newIds[0]
      // 找到当前剧情中所有 nextId 为 null 或 undefined 的节点（非 start）
      for (const nodeId of Object.keys(current)) {
        const node = current[nodeId]
        if (node && (node.nextId === null || node.nextId === undefined) && nodeId !== 'start') {
          node.nextId = firstNewId // 自动指向新章节
        }
      }
    }

    // 合并（新节点覆盖同名ID）
    const merged = { ...current, ...newPart }
    const fixed = ensureStartNode(merged)
    store.config.storyScript = fixed
    store.save()
    jsonText.value = JSON.stringify(fixed, null, 2)
    appendJsonText.value = ''
    showToast('新节点已追加！')
  } catch (e) {
    showToast('JSON 格式错误: ' + e.message)
  }
}

function exportJson() {
  navigator.clipboard.writeText(jsonText.value)
  showToast('已复制到剪贴板')
}
</script>

<style scoped>
.pixel-textarea {
  width: 100%; background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd;
  padding: 10px; font-family: monospace; font-size: 10px; border-radius: 8px;
  resize: vertical; min-height: 200px;
}
.pixel-textarea.small { min-height: 100px; }
.append-area { margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,215,0,0.3); }
.append-area h4 { font-size: 11px; color: #ffd700; margin-bottom: 8px; }
.actions { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
.hint { font-size: 10px; color: #b89aa5; margin-bottom: 8px; }
</style>