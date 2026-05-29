<template>
  <div class="section">
    <h3>徽记兑换商店</h3>
    <div v-for="(item, idx) in store.config.tokenShopItems" :key="item.id" class="card">
      <div class="row">
        <label>名称</label><input v-model="item.name" class="pixel-input" />
      </div>
      <div class="row">
        <label>描述</label><input v-model="item.desc" class="pixel-input" />
      </div>
      <div class="row">
        <label>类型</label>
        <select v-model="item.type" class="pixel-input">
          <option value="material">材料</option>
          <option value="accessory">饰品</option>
        </select>
      </div>
      <div class="row">
        <label>价格(徽记)</label><input v-model.number="item.cost" type="number" class="pixel-input" />
      </div>
      <div v-if="item.type === 'material'" class="row">
        <label>奖励ID</label><input v-model="item.rewardId" class="pixel-input" />
        <label>名称</label><input v-model="item.rewardName" class="pixel-input" />
        <label>数量</label><input v-model.number="item.rewardQty" type="number" class="pixel-input" />
      </div>
      <button class="pixel-btn small danger" @click="removeItem(idx)">删除</button>
    </div>
    <button class="pixel-btn small" @click="addItem">+ 添加商品</button>
    <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存</button>
  </div>
</template>

<script setup>
import { useGameStore } from '../../store/gameStore'
import { Icon } from '@iconify/vue'

const store = useGameStore()

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

function saveConfig() { store.save(); alert('兑换商店已保存') }
</script>

<style scoped>
.card { background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.3); border-radius: 12px; padding: 10px; margin-bottom: 10px; }
.row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 10px; }
.row label { width: 70px; text-align: right; }
.pixel-input { background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 4px 8px; font-family: 'Press Start 2P'; font-size: 9px; width: 100px; border-radius: 6px; }
</style>