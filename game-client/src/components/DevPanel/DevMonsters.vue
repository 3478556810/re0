<template>
  <div class="section">
    <h3>怪物模板</h3>
    <div v-for="(mon, idx) in store.config.monsterTemplates" :key="idx" class="monster-card">
      <div class="row"><label>ID</label><input v-model="mon.id" class="pixel-input" /></div>
      <div class="row"><label>名称</label><input v-model="mon.name" class="pixel-input" /></div>
      <div class="row"><label>标签</label><select v-model="mon.tag" class="pixel-input">
        <option v-for="t in store.config.monsterTags" :key="t" :value="t">{{ t }}</option>
      </select></div>
      <div class="row"><label>Boss</label><input type="checkbox" v-model="mon.isBoss" /></div>
      <div class="row"><label>等级范围</label>
        <input v-model.number="mon.minLevel" type="number" class="pixel-input" placeholder="最小" />
        <input v-model.number="mon.maxLevel" type="number" class="pixel-input" placeholder="最大" />
      </div>
      <div class="row"><label>生命</label><input v-model.number="mon.baseHp" type="number" class="pixel-input" /></div>
      <div class="row"><label>攻击</label><input v-model.number="mon.baseAtk" type="number" class="pixel-input" /></div>
      <div class="row"><label>防御</label><input v-model.number="mon.baseDef" type="number" class="pixel-input" /></div>
     <div class="row"><label>暴击率%</label><input v-model.number="mon.critRate" type="number" class="pixel-input" /></div>
<div class="row"><label>暴击伤害%</label><input v-model.number="mon.critDmg" type="number" class="pixel-input" /></div>
<div class="row"><label>吸血%</label><input v-model.number="mon.lifesteal" type="number" class="pixel-input" /></div>
<div class="row"><label>幸运</label><input v-model.number="mon.luck" type="number" class="pixel-input" /></div>
<div class="row"><label>属性加成</label>
  <input v-model.number="mon.fireDmg" class="pixel-input small-input" placeholder="火" />
  <input v-model.number="mon.waterDmg" class="pixel-input small-input" placeholder="水" />
  <!-- 其他元素同理，可展开 -->
</div>
      <div class="row"><label>经验</label><input v-model.number="mon.exp" type="number" class="pixel-input" /></div>
      <div class="row"><label>掉落材料ID</label><input v-model="mon.material.id" class="pixel-input" placeholder="ID" /><input v-model="mon.material.name" class="pixel-input" placeholder="名称" /></div>
      <div class="row"><label>立绘</label><img v-if="getImage(mon.id)" :src="getImage(mon.id)" class="thumbnail" /><input type="file" accept="image/*" @change="e => uploadImage(mon.id, e)" class="pixel-input" /></div>
      <div class="row"><label>属性</label>
        <input v-model="mon.element" class="pixel-input" placeholder="fire,water" />
      </div>
<div class="row">
  <label>新特性</label>
  <input :value="mon.traits ? mon.traits.join(',') : ''"
       @input="mon.traits = $event.target.value.split(',').map(s => s.trim())"
       class="pixel-input" placeholder="特性（逗号分隔）" />
</div>
      <div class="row"><label>技能(JSON)</label>
        <textarea v-model="mon.skillsText" class="pixel-textarea" rows="3" placeholder='[{"name":"火球","mpCost":5}]'></textarea>
      </div>
      <button class="pixel-btn small danger" @click="removeMonster(idx)">删除</button>
    </div>
    <button class="pixel-btn small" @click="addMonster">+ 添加怪物</button>
    <button class="pixel-btn small" @click="toggleImport">导入/导出</button>
    <div v-if="showImport" class="import-area">
      <textarea v-model="jsonImport" class="pixel-textarea" rows="8" placeholder="粘贴怪物 JSON 数组..."></textarea>
      <button class="pixel-btn small" @click="importMonsters">导入</button>
      <button class="pixel-btn small" @click="exportMonsters">导出</button>
    </div>
    <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '../../store/gameStore'
import { Icon } from '@iconify/vue'

const store = useGameStore()
const showImport = ref(false)
const jsonImport = ref('')

function getImage(id) { /* 同上 */ }
function uploadImage(id, e) { /* 同上 */ }

function addMonster() {
  if (!store.config.monsterTemplates) store.config.monsterTemplates = []
  const minL = 1, maxL = 5
  store.config.monsterTemplates.push({
    id: 'monster_' + Date.now(),
    name: '新怪物',
    tag: 'normal',
    isBoss: false,
    minLevel: minL, maxLevel: maxL,
    levelRange: [minL, maxL],   // 新增：战斗系统需要的数组格式
    baseHp: 50, baseAtk: 15, baseDef: 10, exp: 30,
    material: { id: 'slime_gel', name: '新材料' },
    icon: 'mdi:help-circle',
    element: '',
    trait: '',
    critRate: 0, critDmg: 0, lifesteal: 0, luck: 0,
    fireDmg: 0, waterDmg: 0, thunderDmg: 0, windDmg: 0,
    grassDmg: 0, iceDmg: 0, holyDmg: 0, darkDmg: 0,
    steelDmg: 0, rockDmg: 0,
    skillsText: '[]'
  })
}

function importMonsters() {
  try {
    const arr = JSON.parse(jsonImport.value)
    // 确保每个模板都有 levelRange
    const fixed = arr.map(m => ({
      ...m,
      levelRange: m.levelRange || [m.minLevel || 1, m.maxLevel || 5]
    }))
    store.config.monsterTemplates = fixed
    store.save()
    showToast('导入成功')
  } catch (e) {
    showToast('JSON 格式错误')
  }
}

function removeMonster(idx) { store.config.monsterTemplates.splice(idx, 1) }

function toggleImport() { showImport.value = !showImport.value }


function exportMonsters() {
  navigator.clipboard.writeText(JSON.stringify(store.config.monsterTemplates, null, 2))
  showToast('已复制到剪贴板')
}

function saveConfig() { store.save(); showToast('配置已保存') }
</script>




<style scoped>
.section { margin-bottom: 15px; }
h3 { font-size: 12px; margin-bottom: 12px; }
.monster-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.3); border-radius: 12px; padding: 10px; margin-bottom: 10px; }
.row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 10px; }
.row label { width: 80px; text-align: right; }
.pixel-input { background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 6px 10px; font-family: 'Press Start 2P'; font-size: 10px; width: 120px; border-radius: 8px; }
.thumbnail { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; border: 1px solid #b89a6a; }
.danger { background: rgba(244,67,54,0.2) !important; border-color: #f44336 !important; }
/* 保留原有样式，新增 */
.import-area { margin-top: 10px; }
.pixel-textarea { width: 100%; background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 10px; font-family: monospace; font-size: 10px; border-radius: 8px; resize: vertical; }
</style>