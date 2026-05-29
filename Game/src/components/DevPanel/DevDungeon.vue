<template>
  <div class="section">
    <h3>地下城管理</h3>
    <div v-for="(dg, id) in store.config.dungeonConfigs" :key="id" class="dungeon-card">
      <div class="row">
        <label>名称</label>
        <input v-model="dg.name" class="pixel-input" />
      </div>
      <div class="row">
        <label>图标</label>
        <input v-model="dg.icon" class="pixel-input" placeholder="mdi:xxx" />
      </div>
      <div class="row">
        <label>层数</label>
        <input v-model.number="dg.maxFloors" type="number" min="1" class="pixel-input" />
      </div>
      <div class="row">
        <label>冷却(天)</label>
        <input v-model.number="dg.cooldown" type="number" min="0" class="pixel-input" />
      </div>
      <div class="floor-config">
        <h4>楼层怪物池</h4>
        <div v-for="floor in dg.maxFloors" :key="floor" class="floor-row">
          <span>第{{ floor }}层</span>
          <!-- 用逗号分隔的怪物ID，例如: slime,goblin,boss_wolfking -->
          <input
            v-model="dg.monstersByFloor[floor]"
            class="pixel-input"
            placeholder="slime,goblin"
            @change="updateFloorPool(dg, floor, $event.target.value)"
          />
        </div>
      </div>
      <button class="pixel-btn small danger" @click="deleteDungeon(id)">删除地下城</button>
    </div>
    <button class="pixel-btn small" @click="addDungeon">+ 添加地下城</button>
    <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存</button>
  </div>
</template>

<script setup>
import { useGameStore } from '../../store/gameStore'
import { Icon } from '@iconify/vue'

const store = useGameStore()

// 把用户输入的字符串转成数组
function updateFloorPool(dg, floor, value) {
  const ids = value.split(',').map(s => s.trim()).filter(Boolean)
  dg.monstersByFloor = { ...dg.monstersByFloor, [floor]: ids }
}

function addDungeon() {
  const id = 'dungeon_' + Date.now()
  store.config.dungeonConfigs[id] = {
    name: '新地下城',
    icon: 'mdi:castle',
    maxFloors: 3,
    cooldown: 1,
    monstersByFloor: { 1: ['slime'], 2: ['goblin'], 3: ['boss_test'] }
  }
}

function deleteDungeon(id) {
  delete store.config.dungeonConfigs[id]
}

function saveConfig() {
  store.save()
  alert('地下城配置已保存')
}
</script>

<style scoped>
.section { margin-bottom: 15px; }
h3 { font-size: 12px; margin-bottom: 12px; }
.dungeon-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.3); border-radius: 12px; padding: 10px; margin-bottom: 10px; }
.row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 10px; }
.row label { width: 80px; text-align: right; }
.pixel-input { background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 6px 10px; font-family: 'Press Start 2P'; font-size: 10px; width: 120px; border-radius: 8px; }
.floor-config { margin-top: 10px; }
.floor-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; font-size: 9px; }
.danger { background: rgba(244,67,54,0.2) !important; border-color: #f44336 !important; }
</style>