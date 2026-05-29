<template>
  <div class="section">
    <h3>材料管理</h3>
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
          <option value="enchant">附魔材料</option>
          <option value="upgrade">强化材料</option>
          <option value="breakthrough">突破材料</option>
          <option value="affix">词条更换</option>
          <option value="other">其他</option>
        </select>
      </div>
      <button class="pixel-btn small danger" @click="removeMaterial(idx)">删除</button>
    </div>
    <button class="pixel-btn small" @click="addMaterial">+ 添加材料</button>
    <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存</button>
  </div>
</template>

<script setup>
import { useGameStore } from '../../store/gameStore'
import { Icon } from '@iconify/vue'

const store = useGameStore()

function addMaterial() {
  const id = 'mat_' + Date.now()
  store.config.materialDefinitions.push({
    id,
    name: '新材料',
    type: 'other'
  })
  // 初始化价格
  if (!store.config.materialPrices[id]) {
    store.config.materialPrices[id] = 1
  }
}

function removeMaterial(idx) {
  const id = store.config.materialDefinitions[idx].id
  store.config.materialDefinitions.splice(idx, 1)
  // 也可选择删除价格
  delete store.config.materialPrices[id]
}

function saveConfig() { store.save(); alert('配置已保存') }
</script>

<style scoped>
.material-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.3); border-radius: 12px; padding: 10px; margin-bottom: 10px; }
.row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 10px; }
.row label { width: 80px; text-align: right; }
.pixel-input { background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 6px 10px; font-family: 'Press Start 2P'; font-size: 10px; width: 120px; border-radius: 8px; }
</style>