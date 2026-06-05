<template>
  <div class="overlay">
    <div class="panel">
      <!-- 顶部栏 -->
      <div class="top-bar">
        <h2><Icon icon="mdi:castle" /> 徽记兑换</h2>
        <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      </div>

      <!-- 余额信息 -->
      <div class="balance-row">
        <div class="balance-card">
          <Icon icon="mdi:castle" class="balance-icon" />
          <div class="balance-info">
            <div class="balance-label">当前徽记</div>
            <div class="balance-value">{{ tokenCount }} 个</div>
          </div>
        </div>
        <div class="discount-badge" v-if="discountPercent > 0">
          <Icon icon="mdi:brightness-percent" />
          段位折扣 {{ discountPercent }}%
        </div>
      </div>

      <!-- 商品列表 -->
      <div class="shop-list">
        <div v-for="item in store.config.tokenShopItems" :key="item.id" class="shop-card" :class="{ 'card-gacha': item.type === 'gacha' }">
          <div class="card-top">
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-desc">{{ item.desc }}</div>
              <!-- 抽奖包预览 -->
              <div v-if="item.type === 'gacha' && item.gachaPool" class="gacha-preview">
                <span class="gacha-label">可能获得：</span>
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
              徽记
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
  width: 95vw;
  height: 92vh;
  max-width: 700px;
  background: rgba(15,25,45,0.95);
  border: 2px solid #b89a6a;
  border-radius: 24px;
  padding: 20px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.top-bar h2 {
  font-size: 16px;
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}
.close-btn {
  background: none; border: none;
  color: #ffd; font-size: 24px;
  cursor: pointer; padding: 4px;
}

/* 余额行 */
.balance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.balance-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,215,0,0.1);
  border: 1px solid rgba(255,215,0,0.3);
  border-radius: 16px;
  padding: 12px 18px;
}
.balance-icon {
  font-size: 32px;
  color: #ffd700;
}
.balance-label {
  font-size: 9px;
  color: #ccc;
  margin-bottom: 2px;
}
.balance-value {
  font-size: 20px;
  color: #ffd700;
  font-weight: bold;
}
.discount-badge {
  font-size: 11px;
  background: rgba(76,175,80,0.2);
  border: 1px solid #4caf50;
  border-radius: 10px;
  padding: 8px 14px;
  color: #4caf50;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 商品列表 */
.shop-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

/* 商品卡片 */
.shop-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(184,154,106,0.3);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.2s;
}
.shop-card.card-gacha {
  border-color: rgba(147,112,219,0.4);
  background: rgba(147,112,219,0.08);
}
.card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.item-info {
  flex: 1;
}
.item-name {
  font-size: 14px;
  font-weight: bold;
  color: #ffd;
  margin-bottom: 6px;
}
.item-desc {
  font-size: 10px;
  color: #ccc;
  line-height: 1.5;
}

/* 抽奖预览 */
.gacha-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.gacha-label {
  font-size: 8px;
  color: #aaa;
}
.gacha-tag {
  font-size: 9px;
  background: rgba(255,215,0,0.15);
  border: 1px solid rgba(255,215,0,0.3);
  border-radius: 6px;
  padding: 3px 8px;
  color: #ffd700;
}

/* 卡片底部 */
.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.item-cost {
  font-size: 13px;
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 6px;
}
.item-cost s {
  color: #888;
  font-size: 11px;
}
.buy-btn {
  background: rgba(255,215,0,0.15);
  border: 1px solid #ffd700;
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 13px;
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
  width: 4px;
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