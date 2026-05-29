<template>
  <div class="section">
    <h3>怪物模板</h3>
    <div v-for="(mon, idx) in store.config.monsterTemplates" :key="idx" class="monster-card">
      <div class="row">
        <label>名称</label>
        <input v-model="mon.name" class="pixel-input" />
      </div>
      <div class="row">
        <label>生命</label>
        <input v-model.number="mon.baseHp" type="number" class="pixel-input" />
      </div>
      <div class="row">
        <label>攻击</label>
        <input v-model.number="mon.baseAtk" type="number" class="pixel-input" />
      </div>
      <div class="row">
        <label>防御</label>
        <input v-model.number="mon.baseDef" type="number" class="pixel-input" />
      </div>
      <div class="row">
        <label>经验</label>
        <input v-model.number="mon.exp" type="number" class="pixel-input" />
      </div>
      <div class="row">
        <label>掉落材料ID</label>
        <input v-model="mon.material.id" class="pixel-input" placeholder="ID" />
        <input v-model="mon.material.name" class="pixel-input" placeholder="名称" />
      </div>
      <div class="row">
        <label>立绘</label>
        <img v-if="getImage(mon.id)" :src="getImage(mon.id)" class="thumbnail" />
        <input type="file" accept="image/*" @change="e => uploadImage(mon.id, e)" class="pixel-input" />
      </div>
      <button class="pixel-btn small danger" @click="removeMonster(idx)">删除此怪物</button>
    </div>
    <button class="pixel-btn small" @click="addMonster">+ 添加怪物</button>
    <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存</button>
  </div>
</template>

<script setup>
import { useGameStore } from '../../store/gameStore'

const store = useGameStore()

function getImage(id) {
  return store.config?.customImages?.[id] || null
}

function uploadImage(id, e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 64; canvas.height = 64
      canvas.getContext('2d').drawImage(img, 0, 0, 64, 64)
      const compressed = canvas.toDataURL('image/jpeg', 0.6)
      if (!store.config.customImages) store.config.customImages = {}
      store.config.customImages[id] = compressed
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
}

function addMonster() {
  if (!store.config.monsterTemplates) store.config.monsterTemplates = []
  store.config.monsterTemplates.push({
    id: 'monster_' + Date.now(),
    name: '新怪物',
    baseHp: 50, baseAtk: 15, baseDef: 10, exp: 30,
    material: { id: 'slime_gel', name: '新材料' }
  })
}

function removeMonster(idx) { store.config.monsterTemplates.splice(idx, 1) }

function saveConfig() { store.save(); alert('配置已保存') }
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
</style>