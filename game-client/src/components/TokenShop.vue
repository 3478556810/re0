<template>
  <div class="overlay">
    <div class="panel">
      <!-- 顶部栏（极致精简） -->
      <div class="top-bar">
        <div class="token-badge">
          <Icon icon="mdi:castle" />
          <span>{{ tokenCount }}</span>
        </div>
        <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      </div>

      <!-- 商品列表 -->
      <div class="shop-list">
        <div v-for="item in store.config.tokenShopItems" :key="item.id" class="shop-card" :class="{ 'card-gacha': item.type === 'gacha' }">
          <div class="card-top">
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-desc">{{ item.desc }}</div>
              <div v-if="item.type === 'gacha' && item.gachaPool" class="gacha-preview">
                <span v-for="(r, idx) in getGachaPreview(item.gachaPool)" :key="idx" class="gacha-tag">
                  {{ r }}
                </span>
              </div>
            </div>
          </div>
          <div class="card-bottom">
            <div class="item-cost">
              <Icon icon="mdi:castle" />
              <span v-if="discount < 1">
                <s>{{ item.cost }}</s> <strong>{{ actualCost(item) }}</strong>
              </span>
              <span v-else><strong>{{ item.cost }}</strong></span>
            </div>
            <button
              class="buy-btn"
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

const currentRankConfig = computed(() => {
  const rankName = store.player.rank
  return store.rankConfig?.find(r => r.name === rankName) || store.rankConfig?.[0] || { discount: 0 }
})

const discountPercent = computed(() => currentRankConfig.value.discount || 0)
const discount = computed(() => 1 - discountPercent.value / 100)

function actualCost(item) {
  return Math.max(1, Math.floor(item.cost * discount.value))
}

function getGachaPreview(pool) {
  return pool.slice(0, 4).map(r => {
    if (r.type === 'gold') return r.goldQty + 'G'
    if (r.type === 'exp') return r.expQty + '经验'
    if (r.type === 'skillPoint') return '技能点'
    return r.rewardName || r.rewardId
  })
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
  let message = ''

  switch (item.type) {
    case 'material':
      if (item.rewardId) {
        store.addMaterial(item.rewardId, item.rewardName || item.rewardId, item.rewardQty || 1)
        success = true
        message = `获得 ${item.rewardName} x${item.rewardQty}`
      }
      break

    case 'accessory': {
      const acc = rollAccessoryDrop('normal')
      if (acc) {
        store.inventory.push(acc)
        success = true
        message = '获得随机饰品！'
      }
      break
    }

    case 'skillPoint':
      store.player.skillPoints = (store.player.skillPoints || 0) + (item.rewardQty || 1)
      success = true
      message = `获得 ${item.rewardQty} 技能点`
      break

    case 'exp':
      store.addExperience(item.rewardQty || 100)
      success = true
      message = `获得 ${item.rewardQty} 经验`
      break

    case 'gold':
      store.addGold(item.goldQty || 0)
      success = true
      message = `获得 ${item.goldQty}G`
      break

    case 'consumable':
      if (item.rewardId) {
        store.addMaterial(item.rewardId, item.rewardName || item.rewardId, item.rewardQty || 1)
        success = true
        message = `获得 ${item.rewardName}`
      }
      break

    case 'gacha': {
      const pool = item.gachaPool || []
      if (pool.length === 0) break
      const totalWeight = pool.reduce((sum, r) => sum + (r.weight || 0), 0)
      let roll = Math.random() * totalWeight
      for (const reward of pool) {
        roll -= reward.weight || 0
        if (roll <= 0) {
          if (reward.type === 'material') {
            store.addMaterial(reward.rewardId, reward.rewardName, reward.rewardQty || 1)
            message = `抽中了 ${reward.rewardName} x${reward.rewardQty}！`
          } else if (reward.type === 'gold') {
            store.addGold(reward.goldQty || 0)
            message = `抽中了 ${reward.goldQty}G！`
          } else if (reward.type === 'exp') {
            store.addExperience(reward.expQty || 0)
            message = `抽中了 ${reward.expQty} 经验！`
          } else if (reward.type === 'skillPoint') {
            store.player.skillPoints = (store.player.skillPoints || 0) + (reward.rewardQty || 1)
            message = `抽中了 ${reward.rewardQty} 技能点！`
          } else if (reward.type === 'accessory') {
            const acc = rollAccessoryDrop('normal')
            if (acc) {
              store.inventory.push(acc)
              message = `抽中了一件随机饰品！`
            }
          }
          success = true
          break
        }
      }
      break
    }
  }

  if (success) {
    store.save()
    showToast(message || `成功兑换 ${item.name}！`)
  } else {
    token.qty = (token.qty || 0) + cost
    if (!store.materials['dungeon_token']) {
      store.materials['dungeon_token'] = { qty: cost, name: '地下城徽记' }
    }
    store.save()
    showToast('兑换失败')
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(10px);
  display: flex; justify-content: center; align-items: center;
  z-index: 200;
}

.panel {
  width: 100vw;
  height: 100vh;
  background: rgba(15,25,45,0.95);
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  box-sizing: border-box;
}

/* 顶部栏（极简） */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.token-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,215,0,0.15);
  border: 1px solid rgba(255,215,0,0.3);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  color: #ffd700;
}

.close-btn {
  background: rgba(255,100,100,0.15);
  border: 1px solid #ff5555;
  color: #ffaaaa;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
}

/* 商品列表 */
.shop-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 商品卡片 */
.shop-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(184,154,106,0.3);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shop-card.card-gacha {
  border-color: rgba(147,112,219,0.4);
  background: rgba(147,112,219,0.08);
}

.item-name {
  font-size: 11px;
  font-weight: bold;
  color: #ffd;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 8px;
  color: #ccc;
  line-height: 1.4;
}

/* 抽奖预览 */
.gacha-preview {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.gacha-tag {
  font-size: 7px;
  background: rgba(255,215,0,0.15);
  border: 1px solid rgba(255,215,0,0.3);
  border-radius: 4px;
  padding: 2px 6px;
  color: #ffd700;
}

/* 卡片底部 */
.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-cost {
  font-size: 10px;
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-cost s {
  color: #888;
  font-size: 8px;
}

.buy-btn {
  background: rgba(255,215,0,0.15);
  border: 1px solid #ffd700;
  border-radius: 8px;
  padding: 6px 16px;
  font-size: 10px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.buy-btn:hover {
  background: rgba(255,215,0,0.3);
}

.buy-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 滚动条美化 */
.shop-list::-webkit-scrollbar {
  width: 3px;
}

.shop-list::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
}

.shop-list::-webkit-scrollbar-thumb {
  background: rgba(255,215,0,0.3);
  border-radius: 2px;
}
</style>