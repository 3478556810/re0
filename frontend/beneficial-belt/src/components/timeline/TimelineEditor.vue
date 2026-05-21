<template>
  <div class="editor-overlay" @click.self="$emit('close')">
    <div class="editor-panel">
      <div class="editor-header">
        <h3>编辑生命线</h3>
        <button class="tb-btn" @click="$emit('close')">
          <Icon icon="ph:x" width="20" />
        </button>
      </div>

      <div class="editor-list">
        <div
          v-for="(node, index) in editableData"
          :key="index"
          class="editor-node"
        >
          <div class="node-summary" @click="toggleExpand(index)">
            <span class="node-name">{{ node.name || '新节点' }}</span>
            <span class="node-date">{{ node.date }}</span>
            <span class="node-type">{{ node.type === 'major' ? '重大' : '小更新' }}</span>
            <div class="node-actions">
              <button class="tb-btn" @click.stop="removeNode(index)">删除</button>
            </div>
          </div>
          <div v-if="expandedIndex === index" class="node-edit">
            <label>
              名称 <input v-model="node.name" @change="autoSave" />
            </label>
            <label>
              日期 <input v-model="node.date" @change="autoSave" type="date" />
            </label>
            <label>
              类型
              <select v-model="node.type" @change="autoSave">
                <option value="major">重大更新</option>
                <option value="minor">小更新</option>
              </select>
            </label>
            <div class="changes-editor">
              <p>更新内容</p>
              <div
                v-for="(change, ci) in node.changes"
                :key="ci"
                class="change-row"
              >
                <input
                  v-model="node.changes[ci]"
                  @change="autoSave"
                  @keydown.enter="autoSave"
                />
                <button class="tb-btn" @click="removeChange(index, ci)">✕</button>
              </div>
              <button class="tb-btn" @click="addChange(index)">+ 添加一行</button>
            </div>
          </div>
        </div>
      </div>

      <button class="tb-btn add-btn" @click="addNode">+ 新增节点</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  initialData: Array,
  onClose: Function,
  onSaved: Function,
})

const editableData = ref([])
const expandedIndex = ref(-1)

onMounted(() => {
  editableData.value = JSON.parse(JSON.stringify(props.initialData || []))
})

const toggleExpand = (index) => {
  expandedIndex.value = expandedIndex.value === index ? -1 : index
}

const autoSave = () => {
  localStorage.setItem('shanxi-timeline-data', JSON.stringify(editableData.value))
  if (props.onSaved) {
    props.onSaved(editableData.value)
  }
}

const addNode = () => {
  const newNode = {
    name: '新版本',
    date: new Date().toISOString().slice(0, 10),
    type: 'minor',
    changes: ['']
  }
  editableData.value.unshift(newNode)
  expandedIndex.value = 0
  autoSave()
}

const removeNode = (index) => {
  if (confirm('确定删除这个节点吗？')) {
    editableData.value.splice(index, 1)
    autoSave()
  }
}

const addChange = (nodeIndex) => {
  editableData.value[nodeIndex].changes.push('')
}

const removeChange = (nodeIndex, changeIndex) => {
  editableData.value[nodeIndex].changes.splice(changeIndex, 1)
  autoSave()
}
</script>

<style scoped>
.editor-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 50;
  display: flex;
  justify-content: center;
  align-items: center;
}
.editor-panel {
  background: #fff;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.editor-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; border-bottom: 1px solid var(--border);
}
.editor-header h3 { margin: 0; }
.editor-list {
  flex: 1; overflow-y: auto; padding: 12px;
}
.editor-node {
  border: 1px solid var(--border); border-radius: 8px;
  margin-bottom: 8px; overflow: hidden;
}
.node-summary {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; cursor: pointer;
  background: var(--bg-card);
}
.node-summary:hover { background: var(--primary-glow); }
.node-name { font-weight: 600; flex: 1; }
.node-date { color: var(--text-secondary); font-size: 0.85rem; }
.node-type { font-size: 0.8rem; color: var(--primary); }
.node-actions { display: flex; gap: 6px; }
.node-edit {
  padding: 12px; display: flex; flex-direction: column; gap: 8px;
}
.node-edit label { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
.node-edit input, .node-edit select {
  padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px;
}
.changes-editor { display: flex; flex-direction: column; gap: 6px; }
.change-row { display: flex; gap: 6px; }
.change-row input { flex: 1; }
.tb-btn {
  background: var(--bg-card); border: 1px solid var(--border);
  padding: 4px 10px; border-radius: 6px; cursor: pointer;
  font-size: 0.85rem;
}
.add-btn { width: 100%; margin-top: 8px; padding: 10px; }
</style>