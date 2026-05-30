<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <h2><Icon icon="mdi:castle" /> 徽记兑换</h2>
      <p class="tip">当前徽记：{{ tokenCount }} 个</p>

      <div class="shop-list">
        <div v-for="item in store.config.tokenShopItems" :key="item.id" class="shop-card">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-desc">{{ item.desc }}</div>
          <div class="item-cost"><Icon icon="mdi:castle" /> {{ item.cost }} 徽记</div>
          <button
            class="pixel-btn small"
            :class="{ disabled: tokenCount < item.cost }"
            :disabled="tokenCount < item.cost"
            @click="buy(item)"
          >
            兑换
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
// 使用你项目中实际的饰品生成函数
import { rollAccessoryDrop } from '../utils/lootGenerator'

const store = useGameStore()
const emit = defineEmits(['close'])

const tokenCount = computed(() => store.materials['dungeon_token']?.qty || 0)

function buy(item) {
  const token = store.materials['dungeon_token']
  if (!token || token.qty < item.cost) {
    alert('徽记不足！')
    return
  }

  // 扣除徽记
  token.qty -= item.cost
  if (token.qty <= 0) delete store.materials['dungeon_token']

  // 给予奖励
  if (item.type === 'material') {
    if (item.rewardId) {
      store.addMaterial(item.rewardId, item.rewardName || item.rewardId, item.rewardQty || 1)
    } else {
      alert('配置错误：材料 ID 为空')
      return
    }
  } else if (item.type === 'accessory') {
    // 随机生成饰品（根据怪物强度标签，这里用 normal 作为基础）
    const acc = rollAccessoryDrop('normal')
    if (acc) {
      store.inventory.push(acc)
    } else {
      alert('饰品生成失败')
      return
    }
  }

  store.save()
  alert(`成功兑换 ${item.name}！`)
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 500px; max-width: 90vw; padding: 24px; }
.tip { font-size: 10px; color: #ffd700; margin-bottom: 15px; }
.shop-list { display: flex; flex-direction: column; gap: 12px; }
.shop-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.3); border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; }
.item-name { font-weight: bold; color: #ffd; width: 120px; }
.item-desc { flex: 1; color: #aaa; font-size: 8px; }
.item-cost { color: #ffd700; margin-right: 10px; }
.pixel-btn.small.disabled { opacity: 0.4; cursor: not-allowed; }
</style>