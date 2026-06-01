<template>
  <div class="section">
    <h3><Icon icon="mdi:package-variant-closed" /> 材料管理</h3>

    <!-- 材料列表 -->
    <div v-for="(mat, idx) in store.config.materialDefinitions" :key="mat.id" class="material-card">
      <div class="row">
        <label>ID</label>
        <input v-model="mat.id" class="pixel-input" />
      </div>
      <div class="row">
        <label>名称</label>
        <input v-model="mat.name" class="pixel-input" />
      </div>
      <div class="row">
        <label>价格</label>
        <input v-model.number="store.config.materialPrices[mat.id]" type="number" min="1" class="pixel-input" />
      </div>
      <div class="row">
        <label>用途</label>
        <select v-model="mat.type" class="pixel-input">
          <option value="forge">锻造材料</option>
            <option value="ore">矿石</option>   
          <option value="enchant">附魔材料</option>
          <option value="upgrade">强化材料</option>
          <option value="breakthrough">突破材料</option>
          <option value="affix">词条更换</option>
          <option value="other">其他</option>
        </select>
      </div>
<div class="row">
  <label>矿石掉率</label>
  <input v-model.number="mat.dropRate" type="number" min="0" max="100" class="pixel-input" />
</div>


      <button class="pixel-btn small danger" @click="removeMaterial(idx)">删除</button>
    </div>

    <!-- 新增材料 -->
    <button class="pixel-btn small" @click="addMaterial">+ 添加材料</button>

    <!-- 导入 / 导出 JSON -->
    <div class="json-tools">
      <button class="pixel-btn small" @click="showImport = !showImport">
        <Icon icon="mdi:code-json" /> {{ showImport ? '关闭' : '导入 / 导出' }}
      </button>
      <div v-if="showImport" class="import-area">
        <textarea v-model="jsonImport" class="pixel-textarea" rows="6" placeholder="粘贴材料定义 JSON 数组..."></textarea>
        <div class="import-actions">
          <button class="pixel-btn small" @click="importMaterials">导入覆盖</button>
          <button class="pixel-btn small" @click="exportMaterials">导出 JSON</button>
        </div>
      </div>
    </div>

    <!-- 全局保存按钮 -->
    <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存到存档</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../../store/gameStore'

const store = useGameStore()
const showImport = ref(false)
const jsonImport = ref('')

function addMaterial() {
  const id = 'mat_' + Date.now()
  store.config.materialDefinitions.push({
    id,
    name: '新材料',
    type: 'other',
      dropRate: 0       // 新增字段
  })
  if (!store.config.materialPrices[id]) {
    store.config.materialPrices[id] = 1
  }
}

function removeMaterial(idx) {
  const id = store.config.materialDefinitions[idx].id
  store.config.materialDefinitions.splice(idx, 1)
  delete store.config.materialPrices[id]
}

function saveConfig() {
  store.save()
  showToast('材料配置已保存')
}

function exportMaterials() {
  const json = JSON.stringify(store.config.materialDefinitions, null, 2)
  navigator.clipboard.writeText(json).then(() => showToast('已复制到剪贴板'))
}

function importMaterials() {
  try {
    const arr = JSON.parse(jsonImport.value)
    if (!Array.isArray(arr)) throw new Error()
    store.config.materialDefinitions = arr
    // 同步清理价格表（保留导入材料中已有的 ID，清除旧的不再使用的价格？简单处理：保留所有价格，但导入的材料可能不带价格，只需确保价格对象有对应 ID）
    store.save()
    jsonImport.value = ''
    showImport.value = false
    showToast('导入成功')
  } catch (e) {
    showToast('JSON 格式错误，需要数组')
  }
}
</script>

<style scoped>
.section { margin-bottom: 15px; }
h3 { font-size: 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }

.material-card {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(184,154,106,0.3);
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 10px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 10px;
}
.row label { width: 80px; text-align: right; }

.pixel-input {
  background: #1a2a3a;
  border: 1px solid #b89a6a;
  color: #ffd;
  padding: 6px 10px;
  font-family: 'Press Start 2P';
  font-size: 10px;
  width: 120px;
  border-radius: 8px;
}

.pixel-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.1);
  border: 1px solid #b89a6a;
  color: #ffd;
  font-family: 'Press Start 2P';
  font-size: 9px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}
.pixel-btn:hover { background: rgba(255,215,0,0.15); }
.pixel-btn.small { padding: 6px 10px; font-size: 7px; }
.pixel-btn.danger { background: rgba(244,67,54,0.2); border-color: #f44336; }
.pixel-btn.danger:hover { background: rgba(244,67,54,0.4); }

.json-tools { margin-top: 15px; }
.import-area { margin-top: 8px; }
.pixel-textarea {
  width: 100%;
  background: #1a2a3a;
  border: 1px solid #b89a6a;
  color: #ffd;
  padding: 10px;
  font-family: monospace;
  font-size: 10px;
  border-radius: 8px;
  resize: vertical;
  box-sizing: border-box;
}
.import-actions { display: flex; gap: 8px; margin-top: 8px; }
</style>