<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <h2><Icon icon="mdi:castle" /> 徽记兑换</h2>
      <p class="tip">当前徽记：{{ tokenCount }} 个</p>
      <p class="discount-tip" v-if="discount < 1">段位折扣：{{ Math.floor((1 - discount) * 100) }}% off</p>

      <div class="shop-list">
        <div v-for="item in store.config.tokenShopItems" :key="item.id" class="shop-card">
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-desc">{{ item.desc }}</div>
          </div>
          <div class="item-cost">
            <Icon icon="mdi:castle" />
            <span v-if="discount < 1">
              <s>{{ item.cost }}</s> {{ Math.max(1, Math.floor(item.cost * discount)) }}
            </span>
            <span v-else>{{ item.cost }}</span>
            徽记
          </div>
          <button
            class="pixel-btn small"
            :class="{ disabled: tokenCount < actualCost(item) }"
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

const ranks = [
  { minLevel: 1, discount: 0 },
  { minLevel: 5, discount: 5 },
  { minLevel: 10, discount: 10 },
  { minLevel: 15, discount: 15 },
  { minLevel: 20, discount: 20 },
  { minLevel: 25, discount: 25 },
  { minLevel: 30, discount: 30 },
  { minLevel: 35, discount: 35 }
]

const currentRank = computed(() => {
  let idx = 0
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (store.player.level >= ranks[i].minLevel) {
      idx = i
      break
    }
  }
  return ranks[idx]
})

const discount = computed(() => 1 - currentRank.value.discount / 100)

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
  max-height: 85vh;       /* 限制面板高度 */
  overflow-y: auto;       /* 面板整体可滚动 */
  padding: 24px; 
}
.tip { font-size: 10px; color: #ffd700; margin-bottom: 15px; }
.discount-tip { font-size: 8px; color: #4caf50; margin-bottom: 10px; }

.shop-list { 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
  max-height: 60vh;       /* 列表最大高度，超出滚动 */
  overflow-y: auto;
  padding-right: 4px;     /* 为滚动条留空间 */
}

.shop-card { 
  background: rgba(0,0,0,0.3); 
  border: 1px solid rgba(184,154,106,0.3); 
  border-radius: 12px; 
  padding: 12px; 
  display: flex; 
  flex-wrap: wrap;        /* 小屏幕换行 */
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
.pixel-btn.small.disabled { opacity: 0.4; cursor: not-allowed; }

/* 手机端优化 */
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