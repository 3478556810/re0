<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" />
      </button>

      <!-- 顶部：标题 + 时间 + 资金 -->
      <div class="top-bar">
        <h2><Icon icon="mdi:chart-line" /> 股市</h2>
        <div class="market-time">
          <span><Icon icon="mdi:calendar" /> 第 {{ store.world.day }} 天</span>
          <span><Icon icon="mdi:clock-outline" /> {{ formatTime(store.world.gameTime) }}</span>
          <span :class="isOpen ? 'open' : 'closed'">
            <Icon :icon="isOpen ? 'mdi:circle' : 'mdi:circle-outline'" />
            {{ isOpen ? '开市' : '休市' }}
          </span>
        </div>
        <div class="funds-row">
          <div class="fund-item"><Icon icon="mdi:cash-multiple" /> 现金 {{ store.player.gold }} G</div>
          <div class="fund-item"><Icon icon="mdi:chart-bell-curve" /> 股票市值 {{ totalStockValue }} G</div>
          <div class="fund-item"><Icon icon="mdi:wallet" /> 总资产 {{ store.player.gold + totalStockValue }} G</div>
          <div class="fund-item" :class="totalProfit >= 0 ? 'up' : 'down'">
            <Icon icon="mdi:finance" /> 盈亏 {{ totalProfit >= 0 ? '+' : '' }}{{ totalProfit }} G ({{ totalProfitPercent >= 0 ? '+' : '' }}{{ totalProfitPercent.toFixed(1) }}%)
          </div>
        </div>
      </div>

      <!-- 主体：左侧列表 + 右侧详情 -->
      <div class="main-content">
        <!-- 左侧股票列表 -->
        <div class="stock-sidebar">
          <div
            v-for="stock in store.facilities.stocks"
            :key="stock.id"
            class="stock-item"
            :class="{ active: selectedStock?.id === stock.id }"
            @click="selectStock(stock)"
          >
            <div class="stock-item-name">{{ stock.name }}</div>
            <div class="stock-item-price">{{ stock.price }} G</div>
            <div class="stock-item-change" :class="stockChange(stock) >= 0 ? 'up' : 'down'">
              {{ stockChange(stock) >= 0 ? '+' : '' }}{{ stockChange(stock).toFixed(1) }}%
            </div>
            <div v-if="stock.holding > 0" class="stock-item-hold">
              {{ stock.holding }} 股
            </div>
          </div>
        </div>

        <!-- 右侧选中股票详情 -->
        <div class="stock-detail" v-if="selectedStock">
          <div class="detail-header">
            <h3>{{ selectedStock.name }}</h3>
            <div class="price-row">
              <span class="current-price">{{ selectedStock.price }} G</span>
              <span class="change-tag" :class="stockChange(selectedStock) >= 0 ? 'up' : 'down'">
                {{ stockChange(selectedStock) >= 0 ? '+' : '' }}{{ stockChange(selectedStock).toFixed(2) }}%
              </span>
            </div>
          </div>

          <!-- 曲线图 -->
          <div class="chart-container">
            <canvas :ref="el => setChartCanvas(el, selectedStock.id)" width="300" height="100"></canvas>
          </div>

          <!-- 持仓信息 -->
          <div class="position" v-if="selectedStock.holding > 0">
            <div class="pos-row">
              <span>持仓</span>
              <span>{{ selectedStock.holding }} 股</span>
            </div>
            <div class="pos-row">
              <span>成本</span>
              <span>{{ selectedStock.costBasis }} G/股</span>
            </div>
            <div class="pos-row">
              <span>市值</span>
              <span>{{ selectedStock.price * selectedStock.holding }} G</span>
            </div>
            <div class="pos-row">
              <span>盈亏</span>
              <span :class="stockProfit(selectedStock) >= 0 ? 'up' : 'down'">
                {{ stockProfit(selectedStock) >= 0 ? '+' : '' }}{{ stockProfit(selectedStock).toFixed(2) }}%
              </span>
            </div>
          </div>
          <div v-else class="no-position">
            暂无持仓
          </div>

          <!-- 买卖按钮 -->
          <div class="trade-buttons">
            <button class="pixel-btn" :disabled="!isOpen" @click="buy(selectedStock)">
              <Icon icon="mdi:cart-plus" /> 买入
            </button>
            <button class="pixel-btn" :disabled="!isOpen || selectedStock.holding === 0" @click="sell(selectedStock)">
              <Icon icon="mdi:cart-minus" /> 卖出
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const selectedStock = ref(null)

const isOpen = computed(() => {
  const t = store.world.gameTime
  return t >= 540 && t < 930
})

function formatTime(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}:${m.toString().padStart(2, '0')}`
}

// 资金计算
const totalStockValue = computed(() => {
  return store.facilities.stocks.reduce((sum, s) => sum + s.price * s.holding, 0)
})
const totalCost = computed(() => {
  return store.facilities.stocks.reduce((sum, s) => sum + s.costBasis * s.holding, 0)
})
const totalProfit = computed(() => totalStockValue.value - totalCost.value)
const totalProfitPercent = computed(() => {
  if (totalCost.value === 0) return 0
  return (totalProfit.value / totalCost.value) * 100
})

// 股票涨跌（基于上市价）
function stockChange(stock) {
  if (!stock.history || stock.history.length === 0) return 0
  const base = stock.history[0]
  return ((stock.price - base) / base) * 100
}

// 持仓盈亏
function stockProfit(stock) {
  if (!stock.holding || !stock.costBasis) return 0
  return ((stock.price - stock.costBasis) / stock.costBasis) * 100
}

// 图表相关
const chartCanvases = {}
function setChartCanvas(el, stockId) {
  if (el) chartCanvases[stockId] = el
}

function drawCharts() {
  if (!selectedStock.value) return
  const canvas = chartCanvases[selectedStock.value.id]
  if (!canvas) return
  const hist = selectedStock.value.history || [selectedStock.value.price]
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (hist.length < 2) return
  const w = canvas.width
  const h = canvas.height
  const max = Math.max(...hist)
  const min = Math.min(...hist)
  const range = max - min || 1
  ctx.beginPath()
  ctx.strokeStyle = '#4caf50'
  ctx.lineWidth = 2
  for (let i = 0; i < hist.length; i++) {
    const x = (i / (hist.length - 1)) * w
    const y = h - ((hist[i] - min) / range) * h
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

watch(() => store.world.gameTime, () => {
  nextTick(() => drawCharts())
})

watch(selectedStock, () => {
  nextTick(() => drawCharts())
})

onMounted(() => {
  // 默认选中第一支股票
  if (store.facilities.stocks.length > 0) {
    selectStock(store.facilities.stocks[0])
  }
})

function selectStock(stock) {
  selectedStock.value = stock
}

function buy(stock) {
  if (!isOpen.value) return
  if (store.player.gold >= stock.price) {
    store.player.gold -= stock.price
    if (stock.holding === 0) {
      stock.costBasis = stock.price
    } else {
      const totalCost = stock.costBasis * stock.holding + stock.price
      stock.holding++
      stock.costBasis = totalCost / stock.holding
      store.save()
      return
    }
    stock.holding++
    store.save()
  }
}

function sell(stock) {
  if (!isOpen.value) return
  if (stock.holding > 0) {
    stock.holding--
    store.player.gold += stock.price
    if (stock.holding === 0) stock.costBasis = 0
    store.save()
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(10px);
  display: flex; justify-content: center; align-items: center;
  z-index: 200;
}
.panel {
  width: 900px;
  max-width: 95vw;
  height: 85vh;
  background: rgba(15, 25, 45, 0.95);
  backdrop-filter: blur(25px);
  border: 2px solid #b89a6a;
  border-radius: 24px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  padding: 0;
  position: relative;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  overflow: hidden;
}
.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #ffd;
  font-size: 22px;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s;
}
.close-btn:hover { transform: scale(1.2); }

.top-bar {
  padding: 20px 25px;
  border-bottom: 1px solid rgba(255,215,0,0.2);
}
.top-bar h2 {
  font-size: 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.market-time {
  display: flex;
  gap: 20px;
  font-size: 10px;
  margin-bottom: 12px;
}
.open { color: #4caf50; }
.closed { color: #f44336; }
.funds-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 9px;
}
.fund-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.up { color: #f44336; }
.down { color: #4caf50; }

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.stock-sidebar {
  width: 200px;
  background: rgba(0,0,0,0.3);
  border-right: 1px solid rgba(255,215,0,0.2);
  overflow-y: auto;
  padding: 5px 0;
}
.stock-item {
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 9px;
}
.stock-item:hover {
  background: rgba(255,215,0,0.1);
}
.stock-item.active {
  background: rgba(255,215,0,0.15);
  border-left: 3px solid #ffd700;
}
.stock-item-name {
  font-size: 10px;
  margin-bottom: 4px;
}
.stock-item-price {
  font-size: 9px;
  color: #ccc;
}
.stock-item-change {
  font-size: 8px;
}
.stock-item-hold {
  font-size: 8px;
  color: #aaa;
}

.stock-detail {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.detail-header h3 {
  font-size: 14px;
  margin-bottom: 10px;
}
.price-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}
.current-price {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
}
.change-tag {
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(255,255,255,0.1);
}
.chart-container {
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 20px;
}
.chart-container canvas {
  width: 100%;
  height: 100px;
}

.position {
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 10px;
}
.pos-row {
  display: flex;
  gap: 10px;
  width: calc(50% - 12px);
}
.no-position {
  font-size: 10px;
  opacity: 0.6;
  margin: 15px 0;
}

.trade-buttons {
  display: flex;
  gap: 15px;
  margin-top: auto;
}
</style>