<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel" @click.stop>
      <!-- 标题栏：标题和关闭按钮同行 -->
      <div class="panel-header">
        <h2><Icon icon="mdi:cog" /> 开发者配置</h2>
        <button class="close-btn" @click="$emit('close')">
          <Icon icon="mdi:close" />
        </button>
      </div>

      <div class="tabs">
        <button v-for="t in tabs" :key="t.key" class="pixel-btn small"
          :class="{ active: tab === t.key }" @click="tab = t.key">
          <Icon :icon="t.icon" /> {{ t.label }}
        </button>
        <button class="pixel-btn small danger" @click="resetConfig">
          <Icon icon="mdi:restore" /> 重置
        </button>
      </div>

      <div class="config-area">
        <DevInit v-if="tab === 'init'" />
        <DevStory v-if="tab === 'story'" />
<DevDungeon v-if="tab === 'dungeons'" />
<DevSkills v-if="tab === 'skills'" />
<DevAffixPool v-if="tab === 'affixPool'" />
<DevTokenShop v-if="tab === 'tokenShop'" />

        <!-- 怪物管理 -->
        <DevMonsters v-if="tab === 'monsters'" />

        <!-- 角色管理 -->
        <DevCharacters v-if="tab === 'characters'" />

        <!-- 饰品配置 -->
        <div v-if="tab === 'accessories'" class="section">
          <h3>饰品掉率</h3>
          <div class="edit-row">
            <label>全局倍率</label>
            <input v-model.number="store.config.lootMultiplier" type="number" min="0.1" step="0.1" class="pixel-input" />
          </div>
          <h3>品质权重</h3>
          <div v-for="(weights, tier) in store.config.qualityWeights" :key="tier" class="edit-row">
            <span class="label">{{ tier }}</span>
            <input v-for="(w, q) in weights" :key="q" v-model.number="store.config.qualityWeights[tier][q]"
              class="pixel-input small-input" :placeholder="q" />
          </div>
          <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存</button>
        </div>

        <!-- 材料价格 -->
     <DevMaterials v-if="tab === 'materials'" />
<DevForge v-if="tab === 'forge'" />   <!-- 新增 -->
        <!-- 股票管理 -->
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

        <!-- 时间快进 -->
        <div v-if="tab === 'time'" class="section">
          <h3>时间控制</h3>
          <div class="time-info">
            <p><Icon icon="mdi:calendar" /> 第 {{ store.world.day }} 天</p>
            <p><Icon icon="mdi:clock-outline" /> {{ formatTime(store.world.gameTime) }}</p>
          </div>
          <div class="time-buttons">
            <button class="pixel-btn" @click="addTime(60)"><Icon icon="mdi:plus" /> 1小时</button>
            <button class="pixel-btn" @click="addTime(360)"><Icon icon="mdi:plus" /> 6小时</button>
            <button class="pixel-btn" @click="addDays(1)"><Icon icon="mdi:calendar-plus" /> 1天</button>
            <button class="pixel-btn" @click="setMarketOpen">跳到开市</button>
            <button class="pixel-btn" @click="setMarketClose">跳到收市</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../../store/gameStore'
import { getMaterialDisplay } from '../../config/materials'
import DevMonsters from './DevMonsters.vue'
import DevCharacters from './DevCharacters.vue'
import DevDungeon from './DevDungeon.vue'
import DevStory from './DevStory.vue'
import DevMaterials from './DevMaterials.vue'
import DevAffixPool from './DevAffixPool.vue'
import DevTokenShop from './DevTokenShop.vue'
import DevSkills from './DevSkills.vue'
import DevForge from './DevForge.vue'   // 新增导入
import DevInit from './DevInit.vue'

const store = useGameStore()
const tab = ref('init')

const tabs = [
// tabs 数组最前面加
{ key: 'init', label: '导入初始', icon: 'mdi:database-import' },
{ key: 'skills', label: '技能', icon: 'mdi:star-four-points' },
{ key: 'affixPool', label: '词条池', icon: 'mdi:star-box' },
{ key: 'tokenShop', label: '兑换', icon: 'mdi:store' },
{ key: 'story', label: '剧情', icon: 'mdi:script-text-outline' },
{ key: 'dungeons', label: '地下城', icon: 'mdi:castle' },
  { key: 'monsters', label: '怪物', icon: 'mdi:skull' },
  { key: 'characters', label: '角色', icon: 'mdi:account-group' },
  { key: 'accessories', label: '饰品', icon: 'mdi:gem' },
  { key: 'materials', label: '材料', icon: 'mdi:package-variant-closed' },
  { key: 'stocks', label: '股票', icon: 'mdi:chart-line' },
  { key: 'time', label: '时间', icon: 'mdi:clock-fast' },
   { key: 'forge', label: '锻造配方', icon: 'mdi:anvil' }   // 新增
]

function formatTime(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}:${m.toString().padStart(2, '0')}`
}

function addTime(minutes) { store.advanceTime(minutes) }
function addDays(d) { store.advanceTime(d * 1440) }
function setMarketOpen() {
  let diff = 540 - store.world.gameTime
  if (diff < 0) diff += 1440
  store.advanceTime(diff)
}
function setMarketClose() {
  let diff = 930 - store.world.gameTime
  if (diff < 0) diff += 1440
  store.advanceTime(diff)
}

function saveConfig() { store.save(); showToast('配置已保存') }

 
async function resetConfig() {
  if (!confirm('⚠️ 这将永久删除所有进度和配置！确定吗？')) return

  // 清空所有持久化存储
  localStorage.clear()
  sessionStorage.clear()

  // 删除 IndexedDB
  if (window.indexedDB) {
    try {
      const dbs = await window.indexedDB.databases()
      for (const db of dbs) {
        window.indexedDB.deleteDatabase(db.name)
      }
    } catch (e) {}
  }

  // 注销 Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const reg of registrations) {
        await reg.unregister()
      }
    } catch (e) {}
  }

  // 清除 Cache Storage
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys()
      for (const name of cacheNames) {
        await caches.delete(name)
      }
    } catch (e) {}
  }

  // 重置游戏状态到默认值
  store.$reset()

  showToast('✅ 已重置为初始状态')
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
function removeStock(idx) { store.facilities.stocks.splice(idx, 1) }
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 300; }
.panel { width: 650px; max-height: 85vh; overflow-y: auto; padding: 20px; color: #ffd; font-family: 'Press Start 2P', cursive; }

/* 新标题栏 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.panel-header h2 {
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 右上角关闭按钮（小巧） */
.close-btn {
  background: none;
  border: none;
  color: #ffd;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover {
  transform: scale(1.2);
  color: #f44336;
}

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
.small-input { width: 60px; }
.time-info { font-size: 11px; margin-bottom: 15px; display: flex; gap: 20px; }
.time-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
</style>