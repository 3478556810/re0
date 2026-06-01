<template>
  <div class="section">
    <h3>徽记兑换商店</h3>
    <!-- 商品列表（保持不变） -->
    <div v-for="(item) in store.config.tokenShopItems" :key="item.id" class="card">
      <!-- ... 你的原有输入框 ... -->
    </div>
    <button class="pixel-btn small" @click="addItem">+ 添加商品</button>

    <!-- 导入 / 导出 JSON -->
    <div class="json-tools">
      <button class="pixel-btn small" @click="showImport = !showImport">
        <Icon icon="mdi:code-json" /> {{ showImport ? '关闭' : '导入 / 导出' }}
      </button>
      <div v-if="showImport" class="import-area">
        <textarea v-model="jsonImport" class="pixel-textarea" rows="6" placeholder="粘贴商品 JSON 数组..."></textarea>
        <div class="import-actions">
          <button class="pixel-btn small" @click="importItems">导入覆盖</button>
          <button class="pixel-btn small" @click="exportItems">导出 JSON</button>
        </div>
      </div>
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

function addItem() {
  store.config.tokenShopItems.push({
    id: 't_' + Date.now(),
    name: '新商品',
    desc: '',
    type: 'material',
    cost: 1,
    rewardId: 'dungeon_token',
    rewardName: '地下城徽记',
    rewardQty: 1
  })
}

function removeItem(idx) {
  store.config.tokenShopItems.splice(idx, 1)
}

function saveConfig() { store.save(); showToast('兑换商店已保存') }

function exportItems() {
  const json = JSON.stringify(store.config.tokenShopItems, null, 2)
  navigator.clipboard.writeText(json).then(() => showToast('已复制到剪贴板'))
}

function importItems() {
  try {
    const arr = JSON.parse(jsonImport.value)
    if (!Array.isArray(arr)) throw new Error()
    store.config.tokenShopItems = arr
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
/* 原有样式保持不变，新增以下内容 */
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