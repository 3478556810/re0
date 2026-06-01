<template>
  <div class="section">
    <h3>角色列表</h3>
    <div v-for="(char, id) in store.config.characters" :key="id" class="character-card">
      <div class="row"><label>ID</label><span>{{ id }}</span></div>
      <div class="row"><label>显示名</label><input v-model="char.name" class="pixel-input" /></div>
      <div class="row"><label>默认图标</label><input v-model="char.icon" class="pixel-input" placeholder="mdi:xxx" /></div>
      <div class="row">
        <label>立绘</label>
        <img v-if="store.config.customImages?.[id]" :src="store.config.customImages[id]" class="thumbnail" />
        <input type="file" accept="image/*" @change="e => uploadImage(id, e)" class="pixel-input" />
      </div>
      <button class="pixel-btn small danger" @click="deleteCharacter(id)">删除</button>
    </div>
    <button class="pixel-btn small" @click="addCharacter">+ 添加角色</button>
    <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存</button>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useGameStore } from '../../store/gameStore'

const store = useGameStore()

function uploadImage(id, e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    if (!store.config.customImages) store.config.customImages = {}
    store.config.customImages[id] = ev.target.result   // 直接存入对象
    store.save()
  }
  reader.readAsDataURL(file)
  console.log('图片已存储，当前 customImages keys:', Object.keys(store.config.customImages))
}
function addCharacter() {
  const id = 'char_' + Date.now()
  store.config.characters[id] = { name: '新角色', icon: 'mdi:account' }
}

function deleteCharacter(id) {
  delete store.config.characters[id]
  if (store.config.customImages?.[id]) {
    delete store.config.customImages[id]
    store.save()
  }
}

function saveConfig() { store.save(); showToast('配置已保存') }
</script>



<style scoped>
.section { margin-bottom: 15px; }
h3 { font-size: 12px; margin-bottom: 12px; }
.character-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.3); border-radius: 12px; padding: 10px; margin-bottom: 10px; }
.row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 10px; }
.row label { width: 80px; text-align: right; }
.pixel-input { background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 6px 10px; font-family: 'Press Start 2P'; font-size: 10px; width: 120px; border-radius: 8px; }
.thumbnail { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; border: 1px solid #b89a6a; }
.danger { background: rgba(244,67,54,0.2) !important; border-color: #f44336 !important; }
</style>