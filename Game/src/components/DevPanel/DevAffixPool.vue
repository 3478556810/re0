<template>
  <div class="section">
    <h3>词条效果管理</h3>
    <div v-for="(affix, id) in store.config.affixEffects" :key="id" class="affix-card">
      <div class="row">
        <label>ID</label>
        <span>{{ id }}</span>
      </div>
      <div class="row">
        <label>名称</label>
        <input v-model="affix.name" class="pixel-input" />
      </div>
      <div class="row">
        <label>图标</label>
        <input v-model="affix.icon" class="pixel-input" placeholder="mdi:xxx" />
      </div>
      <div class="row">
        <label>阈值</label>
        <button class="pixel-btn small" @click="addThreshold(id)">+ 添加阈值</button>
      </div>
      <div v-for="(t, tidx) in affix.thresholds" :key="tidx" class="threshold-row">
        <div class="row">
          <label>等级</label>
          <input v-model.number="t.level" type="number" min="1" class="pixel-input small-input" />
          <label>描述</label>
          <input v-model="t.desc" class="pixel-input" />
        </div>
        <div class="row">
          <label>加成</label>
          <div class="bonus-grid">
            <div v-for="(val, key) in t.bonus" :key="key" class="bonus-item">
              <span>{{ key }}</span>
              <input v-model.number="t.bonus[key]" type="number" class="pixel-input micro-input" />
            </div>
            <button class="pixel-btn small" @click="addBonusField(t)">+ 属性</button>
          </div>
        </div>
        <button class="pixel-btn small danger" @click="removeThreshold(id, tidx)">删除阈值</button>
      </div>
      <button class="pixel-btn small danger" @click="deleteAffix(id)">删除词条</button>
    </div>
    <button class="pixel-btn small" @click="addAffix">+ 添加词条</button>
    <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存</button>
  </div>
</template>

<script setup>
import { useGameStore } from '../../store/gameStore'
import { Icon } from '@iconify/vue'

const store = useGameStore()

function addAffix() {
  const id = 'new_affix_' + Date.now()
  store.config.affixEffects[id] = {
    name: '新词条',
    loreName: '',
    icon: 'mdi:star',
    thresholds: [
      { level: 1, desc: '默认效果', bonus: {} }
    ]
  }
}
import { inject } from 'vue'
const showConfirm = inject('showConfirm', (msg) => Promise.resolve(confirm(msg)))
function deleteAffix(id) {
  if (showConfirm(`删除词条 ${id}？`)) {
    delete store.config.affixEffects[id]
  }
}

function addThreshold(affixId) {
  const affix = store.config.affixEffects[affixId]
  if (!affix) return
  affix.thresholds.push({
    level: (affix.thresholds.length + 1),
    desc: '新阈值',
    bonus: {}
  })
}

function removeThreshold(affixId, idx) {
  store.config.affixEffects[affixId].thresholds.splice(idx, 1)
}

function addBonusField(threshold) {
  const key = prompt('输入属性名（如 fireDmg, critRate）:')
  if (key && !(key in threshold.bonus)) {
    threshold.bonus[key] = 0
  }
}

function saveConfig() { store.save(); showToast('词条效果已保存') }
</script>

<style scoped>
.affix-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.3); border-radius: 12px; padding: 10px; margin-bottom: 15px; }
.row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 9px; }
.row label { width: 60px; text-align: right; }
.pixel-input { background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 4px 8px; font-family: 'Press Start 2P'; font-size: 8px; width: 100px; border-radius: 6px; }
.small-input { width: 60px; }
.micro-input { width: 50px; }
.threshold-row { margin-left: 20px; border-left: 2px solid rgba(255,215,0,0.2); padding-left: 12px; margin-bottom: 10px; }
.bonus-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.bonus-item { display: flex; align-items: center; gap: 4px; font-size: 8px; }
.danger { background: rgba(244,67,54,0.2) !important; border-color: #f44336 !important; }
</style>