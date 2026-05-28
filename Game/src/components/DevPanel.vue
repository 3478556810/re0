<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel" @click.stop>
      <h2>🛠️ 开发者配置</h2>
      <div class="tabs">
        <button class="pixel-btn small" :class="{ active: tab==='materials' }" @click="tab='materials'">材料价格</button>
        <button class="pixel-btn small" :class="{ active: tab==='stocks' }" @click="tab='stocks'">股票公司</button>
        <button class="pixel-btn small" :class="{ active: tab==='monsters' }" @click="tab='monsters'">怪物模板</button>
        <button class="pixel-btn small" :class="{ active: tab==='images' }" @click="tab='images'">🖼️ 图片</button>
        <button class="pixel-btn small" @click="resetConfig">重置配置</button>
      </div>

      <div class="config-area">
        <template v-if="tab==='materials'">
          <!-- 材料价格编辑 ... 保持不变 -->
        </template>
        <template v-if="tab==='stocks'">
          <!-- 股票编辑 ... -->
        </template>
        <template v-if="tab==='monsters'">
          <!-- 怪物模板 ... -->
        </template>
        <ImageManager v-if="tab==='images'" @close="tab='materials'" />
      </div>
      <button class="pixel-btn" @click="$emit('close')">关闭</button>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useGameStore } from '../store/gameStore'
import { getMaterialDisplay } from '../config/materials'
import ImageManager from './ImageManager.vue'
const store = useGameStore()
const tab = ref('materials')
const monsterJson = ref(JSON.stringify(store.config.monsterTemplates, null, 2))

function saveConfig() {
  store.save()
  alert('配置已保存')
}

function resetConfig() {
  if (confirm('重置所有配置到默认值吗？')) {
    // 恢复默认材料价格
    store.config.materialPrices = {
      slime_gel: 2,
      goblin_fang: 3,
      scorpion_tail: 4,
      iron_ore: 2,
      dragon_scale: 10
    }
    // 股票重置为默认6家（保留玩家持股）
    const defaultStocks = [
      { id: 'royal_forge', name: '皇家锻造厂', price: 120, holding: 0, costBasis: 0, history: [120] },
      { id: 'royal_bond', name: '皇家国债', price: 80, holding: 0, costBasis: 0, history: [80] },
      { id: 'intech', name: '英特厄科技', price: 200, holding: 0, costBasis: 0, history: [200] },
      { id: 'mana_corp', name: '魔能集团', price: 300, holding: 0, costBasis: 0, history: [300] },
      { id: 'air_league', name: '空运联盟', price: 150, holding: 0, costBasis: 0, history: [150] },
      { id: 'potions_inc', name: '药水工坊', price: 95, holding: 0, costBasis: 0, history: [95] }
    ]
    store.facilities.stocks.forEach(s => {
      const def = defaultStocks.find(d => d.id === s.id)
      if (def) {
        s.name = def.name
        s.price = def.price
        s.history = [def.price]
      }
    })
    store.config.monsterTemplates = []
    monsterJson.value = '[]'
    store.save()
    alert('配置已重置')
  }
}

function addStock() {
  const id = 'stock_' + Date.now()
  store.facilities.stocks.push({
    id, name: '新股', price: 100, holding: 0, costBasis: 0, history: [100]
  })
}

function removeStock(idx) {
  store.facilities.stocks.splice(idx, 1)
}

function applyMonsterJson() {
  try {
    const parsed = JSON.parse(monsterJson.value)
    store.config.monsterTemplates = parsed
    store.save()
    alert('怪物模板已更新，重进地图后生效')
  } catch (e) {
    alert('JSON 格式错误')
  }
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 300; }
.panel { width: 600px; max-height: 80vh; overflow-y: auto; padding: 20px; }
.tabs { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.config-area { min-height: 300px; }
.row { display: flex; align-items: center; gap: 15px; margin: 8px 0; font-size: 10px; }
.pixel-input { background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 4px 8px; font-family: 'Press Start 2P'; font-size: 10px; width: 100px; }
.pixel-textarea { width: 100%; background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 8px; font-family: monospace; font-size: 10px; }
.stock-edit { display: flex; gap: 10px; margin: 8px 0; align-items: center; }
</style>