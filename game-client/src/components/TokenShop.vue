<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <h2><Icon icon="mdi:castle" /> 徽记兑换</h2>
      <p class="tip">当前徽记：{{ tokenCount }} 个</p>
      <p class="discount-tip" v-if="discountPercent > 0">段位折扣：{{ discountPercent }}% off</p>

      <div class="shop-list">
        <div v-for="item in store.config.tokenShopItems" :key="item.id" class="shop-card">
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-desc">{{ item.desc }}</div>
          </div>
          <div class="item-cost">
            <Icon icon="mdi:castle" />
            <span v-if="discount < 1">
              <s>{{ item.cost }}</s> {{ actualCost(item) }}
            </span>
            <span v-else>{{ item.cost }}</span>
            徽记
          </div>
          <button
            class="pixel-btn small"
            :disabled="tokenCount < actualCost(item)"
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
import { computed, inject } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { rollAccessoryDrop } from '../utils/lootGenerator'

const store = useGameStore()
const emit = defineEmits(['close'])
const showToast = inject('showToast', (msg) => alert(msg))

const tokenCount = computed(() => store.materials['dungeon_token']?.qty || 0)

// 从段位配置获取当前折扣
const currentRankConfig = computed(() => {
  const rankName = store.player.rank
  return store.rankConfig?.find(r => r.name === rankName) || store.rankConfig?.[0] || { discount: 0 }
})

const discountPercent = computed(() => currentRankConfig.value.discount || 0)
const discount = computed(() => 1 - discountPercent.value / 100)

function actualCost(item) {
  return Math.max(1, Math.floor(item.cost * discount.value))
}

function buy(item) {
  const token = store.materials['dungeon_token']
  const cost = actualCost(item)

  if (!token || token.qty < cost) {
    showToast('徽记不足！')
    return
  }

  token.qty -= cost
  if (token.qty <= 0) delete store.materials['dungeon_token']

  let success = false

  switch (item.type) {
    case 'material':
      if (item.rewardId) {
        store.addMaterial(item.rewardId, item.rewardName || item.rewardId, item.rewardQty || 1)
        success = true
      }
      break
    case 'accessory':
      const acc = rollAccessoryDrop('normal')
      if (acc) {
        store.inventory.push(acc)
        success = true
      }
      break
    case 'skillPoint':
      store.player.skillPoints = (store.player.skillPoints || 0) + (item.rewardQty || 1)
      success = true
      break
    case 'exp':
      store.addExperience(item.rewardQty || 100)
      success = true
      break
    case 'consumable':
      if (item.rewardId) {
        store.addMaterial(item.rewardId, item.rewardName || item.rewardId, item.rewardQty || 1)
        success = true
      }
      break
  }

  if (success) {
    store.save()
    showToast(`成功兑换 ${item.name}！`)
  } else {
    token.qty = (token.qty || 0) + cost
    if (!store.materials['dungeon_token']) {
      store.materials['dungeon_token'] = { qty: cost, name: '地下城徽记' }
    }
    store.save()
  }
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { 
  width: 500px; 
  max-width: 95vw; 
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px; 
}
.tip { font-size: 10px; color: #ffd700; margin-bottom: 15px; }
.discount-tip { font-size: 8px; color: #4caf50; margin-bottom: 10px; }

.shop-list { 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}

.shop-card { 
  background: rgba(0,0,0,0.3); 
  border: 1px solid rgba(184,154,106,0.3); 
  border-radius: 12px; 
  padding: 12px; 
  display: flex; 
  flex-wrap: wrap;
  justify-content: space-between; 
  align-items: center; 
  font-size: 10px; 
  gap: 8px;
}

.item-info {
  flex: 1;
  min-width: 150px;
}

.item-name { font-weight: bold; color: #ffd; margin-bottom: 4px; }
.item-desc { color: #aaa; font-size: 8px; }
.item-cost { color: #ffd700; font-size: 8px; white-space: nowrap; }
.item-cost s { color: #999; margin-right: 4px; }
.pixel-btn.small:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 500px) {
  .panel { padding: 16px; }
  .shop-card { 
    flex-direction: column; 
    align-items: flex-start;
  }
  .item-info { min-width: auto; width: 100%; }
  .item-cost { margin-right: 0; }
}
</style>