<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="menu-panel pixel-panel">
      <h2>📋 菜单</h2>
      <button class="pixel-btn" @click="view='inventory'">🎒 背包</button>
      <button class="pixel-btn" @click="view='character'">🧑 人物</button>
      <button class="pixel-btn" @click="view='bank'">🏦 银行</button>
      <button class="pixel-btn" @click="view='stock'">📈 股市</button>
      <button class="pixel-btn" @click="view='forge'">⚒️ 锻造</button>
     <button class="pixel-btn" @click="view='dev'">🛠️ 开发者面板</button>
      <button class="pixel-btn" @click="$emit('close')">✖️ 关闭</button>
    </div>
    <InventoryPanel v-if="view==='inventory'" @close="view=null" />
    <CharacterPanel v-if="view==='character'" @close="view=null" />
    <BankPanel v-if="view==='bank'" @close="view=null" />
    <StockPanel v-if="view==='stock'" @close="view=null" />
    <ForgePanel v-if="view==='forge'" @close="view=null" />
    <DevPanel v-if="view==='dev'" @close="view=null" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InventoryPanel from './InventoryPanel.vue'
import CharacterPanel from './CharacterPanel.vue'
import BankPanel from './BankPanel.vue'
import StockPanel from './StockPanel.vue'
import ForgePanel from './ForgePanel.vue'
import DevPanel from './DevPanel/DevPanel.vue'
const view = ref(null)

function resetGame() {
  if (confirm('确定完全重置所有进度吗？此操作不可恢复！')) {
    // 清除所有相关 localStorage 键
    localStorage.removeItem('star-trails-save')
    localStorage.removeItem('customImages')
    // 如果还有其他独立存储的键，也一并清除
    // localStorage.removeItem('star-trails-config') 等

    // 强制刷新页面，让游戏加载默认状态
    window.location.reload()
  }
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 100; }
.menu-panel { padding: 30px; text-align: center; display: flex; flex-direction: column; gap: 12px; min-width: 250px; }
</style>