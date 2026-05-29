<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel" @click.stop>
      <h2><Icon icon="mdi:cog" /> 开发者配置</h2>
      
      <!-- 标签切换 -->
      <div class="tabs">
        <button class="pixel-btn small" :class="{ active: tab === 'materials' }" @click="tab = 'materials'">
          <Icon icon="mdi:package-variant-closed" /> 材料
        </button>
        <button class="pixel-btn small" :class="{ active: tab === 'stocks' }" @click="tab = 'stocks'">
          <Icon icon="mdi:chart-line" /> 股票
        </button>
        <button class="pixel-btn small" :class="{ active: tab === 'monsters' }" @click="tab = 'monsters'">
          <Icon icon="mdi:skull" /> 怪物
        </button>
        <button class="pixel-btn small" :class="{ active: tab === 'time' }" @click="tab = 'time'">
          <Icon icon="mdi:clock-fast" /> 时间
        </button>
        <button class="pixel-btn small" :class="{ active: tab === 'images' }" @click="tab = 'images'">
          <Icon icon="mdi:image" /> 头像
        </button>
        <button class="pixel-btn small danger" @click="resetConfig">
          <Icon icon="mdi:restore" /> 重置
        </button>
      </div>

      <!-- 内容区 -->
      <div class="config-area">
        <!-- 材料价格编辑 -->
        <div v-if="tab === 'materials'" class="section">
          <h3>材料价格 (G)</h3>
          <div v-for="(price, id) in store.config.materialPrices" :key="id" class="edit-row">
            <span class="label">{{ getMaterialDisplay(id) }}</span>
            <input v-model.number="store.config.materialPrices[id]" type="number" min="1" class="pixel-input" />
          </div>
          <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存</button>
        </div>

        <!-- 股票编辑 -->
        <div v-if="tab === 'stocks'" class="section">
          <h3>股票公司</h3>
          <div v-for="(stock, idx) in store.facilities.stocks" :key="stock.id" class="edit-row">
            <input v-model="stock.name" class="pixel-input" placeholder="名称" />
            <input v-model.number="stock.price" type="number" min="1" class="pixel-input" placeholder="价格" />
            <button class="pixel-btn small danger" @click="removeStock(idx)">
              <Icon icon="mdi:delete" />
            </button>
          </div>
          <button class="pixel-btn small" @click="addStock"><Icon icon="mdi:plus" /> 添加股票</button>
          <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存</button>
        </div>

        <!-- 怪物模板编辑 -->
        <div v-if="tab === 'monsters'" class="section">
          <h3>怪物模板 (JSON)</h3>
          <textarea v-model="monsterJson" class="pixel-textarea" rows="12" placeholder="在此编辑怪物JSON数组..."></textarea>
          <button class="pixel-btn" @click="applyMonsterJson"><Icon icon="mdi:check" /> 应用并保存</button>
        </div>

        <!-- 时间快进 -->
        <div v-if="tab === 'time'" class="section">
          <h3>时间控制</h3>
          <div class="time-info">
            <p>📅 第 {{ store.world.day }} 天</p>
            <p>🕘 {{ formatTime(store.world.gameTime) }}</p>
          </div>
          <div class="time-buttons">
            <button class="pixel-btn" @click="addTime(60)"><Icon icon="mdi:plus" /> 1小时</button>
            <button class="pixel-btn" @click="addTime(360)"><Icon icon="mdi:plus" /> 6小时</button>
            <button class="pixel-btn" @click="addDays(1)"><Icon icon="mdi:calendar-plus" /> 1天</button>
            <button class="pixel-btn" @click="setMarketOpen">跳到开市 (9:00)</button>
            <button class="pixel-btn" @click="setMarketClose">跳到收市 (15:30)</button>
          </div>
        </div>

        <!-- 头像管理 -->
       <ImageManager v-if="tab === 'images'" @close="tab = 'materials'" />
      </div>

      <button class="pixel-btn close-btn" @click="$emit('close')"><Icon icon="mdi:close" /> 关闭</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { getMaterialDisplay } from '../config/materials'
import ImageManager from './ImageManager.vue'

const store = useGameStore()
const tab = ref('materials')
const monsterJson = ref(JSON.stringify(store.config.monsterTemplates || [], null, 2))

function formatTime(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}:${m.toString().padStart(2, '0')}`
}

function addTime(minutes) {
  store.advanceTime(minutes)
}
function addDays(d) {
  store.advanceTime(d * 1440)
}
function setMarketOpen() {
  const target = 540
  let diff = target - store.world.gameTime
  if (diff < 0) diff += 1440
  store.advanceTime(diff)
}
function setMarketClose() {
  const target = 930
  let diff = target - store.world.gameTime
  if (diff < 0) diff += 1440
  store.advanceTime(diff)
}

function saveConfig() {
  store.save()
  alert('配置已保存')
}

function resetConfig() {
  if (confirm('确定重置所有配置到默认值吗？此操作不可恢复！')) {
    // 材料价格重置
    store.config.materialPrices = {
      slime_gel: 2,
      goblin_fang: 3,
      scorpion_tail: 4,
      iron_ore: 2,
      dragon_scale: 10
    }
    // 股票重置
    const defaultStocks = [
      { id: 'royal_forge', name: '皇家锻造厂', price: 120, holding: 0, costBasis: 0, history: [120] },
      { id: 'royal_bond', name: '皇家国债', price: 80, holding: 0, costBasis: 0, history: [80] },
      { id: 'intech', name: '英特厄科技', price: 200, holding: 0, costBasis: 0, history: [200] },
      { id: 'mana_corp', name: '魔能集团', price: 300, holding: 0, costBasis: 0, history: [300] },
      { id: 'air_league', name: '空运联盟', price: 150, holding: 0, costBasis: 0, history: [150] },
      { id: 'potions_inc', name: '药水工坊', price: 95, holding: 0, costBasis: 0, history: [95] }
    ]
    store.facilities.stocks = defaultStocks.map(d => ({ ...d, holding: 0, costBasis: 0, history: [d.price] }))
    store.config.monsterTemplates = []
    monsterJson.value = '[]'
    store.save()
    alert('配置已重置')
  }
}

function addStock() {
  store.facilities.stocks.push({
    id: 'stock_' + Date.now(),
    name: '新股',
    price: 100,
    holding: 0,
    costBasis: 0,
    history: [100]
  })
}

function removeStock(idx) {
  store.facilities.stocks.splice(idx, 1)
}

function applyMonsterJson() {
  try {
    store.config.monsterTemplates = JSON.parse(monsterJson.value)
    store.save()
    alert('怪物模板已更新')
  } catch (e) {
    alert('JSON 格式错误: ' + e.message)
  }
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 300; }
.panel { width: 650px; max-height: 85vh; overflow-y: auto; padding: 24px; color: #ffd; font-family: 'Press Start 2P', cursive; }
h2 { font-size: 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.tabs .pixel-btn.small { font-size: 8px; padding: 6px 12px; }
.tabs .pixel-btn.small.active { background: rgba(255,215,0,0.3); }
.danger { background: rgba(244,67,54,0.2) !important; border-color: #f44336 !important; }
.config-area { min-height: 300px; }
.section { margin-bottom: 15px; }
.section h3 { font-size: 12px; margin-bottom: 12px; }
.edit-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 10px; }
.label { width: 100px; }
.pixel-input { background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 6px 10px; font-family: 'Press Start 2P'; font-size: 10px; width: 100px; border-radius: 8px; }
.pixel-textarea { width: 100%; background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 10px; font-family: monospace; font-size: 10px; border-radius: 8px; resize: vertical; }
.time-info { font-size: 11px; margin-bottom: 15px; display: flex; gap: 20px; }
.time-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
.close-btn { width: 100%; margin-top: 15px; }
</style>