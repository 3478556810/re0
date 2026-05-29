<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" />
      </button>

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
          <div class="fund-item"><Icon icon="mdi:cash-multiple" /> {{ store.player.gold }}G</div>
          <div class="fund-item"><Icon icon="mdi:chart-bell-curve" /> 市值 {{ totalStockValue }}G</div>
          <div class="fund-item" :class="totalProfit >= 0 ? 'up' : 'down'">
            <Icon icon="mdi:finance" /> {{ totalProfit >= 0 ? '+' : '' }}{{ totalProfitPercent.toFixed(1) }}%
          </div>
        </div>
      </div>

      <div class="main-content">
        <!-- 左侧股票列表（重构为卡片式） -->
        <div class="stock-sidebar">
          <div
            v-for="stock in store.facilities.stocks"
            :key="stock.id"
            class="stock-item"
            :class="{ active: selectedStock?.id === stock.id }"
            @click="selectStock(stock)"
          >
            <div class="stock-item-name">{{ stock.name.slice(0,4) }}</div>
            <div class="stock-item-change" :class="stockChange(stock) >= 0 ? 'up' : 'down'">
              {{ stockChange(stock) >= 0 ? '+' : '' }}{{ stockChange(stock).toFixed(1) }}%
            </div>
            <div class="stock-item-sub">
              <span>{{ stock.price }}G</span>
              <span v-if="stock.holding > 0">{{ stock.holding }}股</span>
            </div>
          </div>
        </div>

        <!-- 右侧详情 -->
        <div class="stock-detail" v-if="selectedStock">
          <div class="detail-header">
            <h3>{{ selectedStock.name }}</h3>
            <div class="price-row">
              <span class="current-price">{{ selectedStock.price }}G</span>
              <span class="change-tag" :class="stockChange(selectedStock) >= 0 ? 'up' : 'down'">
                {{ stockChange(selectedStock) >= 0 ? '+' : '' }}{{ stockChange(selectedStock).toFixed(2) }}%
              </span>
            </div>
          </div>

          <!-- K线周期切换 -->
          <div class="chart-tabs">
            <button class="pixel-btn small" :class="{ active: chartMode === 'day' }" @click="chartMode = 'day'">日K</button>
            <button class="pixel-btn small" :class="{ active: chartMode === 'week' }" @click="chartMode = 'week'">7日K</button>
          </div>
          <div class="chart-container">
            <canvas :ref="el => setChartCanvas(el, selectedStock.id)" width="400" height="120"></canvas>
          </div>

          <!-- 持仓信息 -->
          <div class="position" v-if="selectedStock.holding > 0">
            <div class="pos-row"><span>持仓</span><span>{{ selectedStock.holding }} 股</span></div>
            <div class="pos-row"><span>成本</span><span>{{ selectedStock.costBasis }}G/股</span></div>
            <div class="pos-row"><span>市值</span><span>{{ selectedStock.price * selectedStock.holding }}G</span></div>
            <div class="pos-row">
              <span>盈亏</span>
              <span :class="stockProfit(selectedStock) >= 0 ? 'up' : 'down'">
                {{ stockProfit(selectedStock) >= 0 ? '+' : '' }}{{ stockProfit(selectedStock).toFixed(2) }}%
              </span>
            </div>
          </div>
          <div v-else class="no-position">暂无持仓</div>

          <!-- 交易区域 -->
          <div class="trade-area">
            <div class="trade-row">
              <span>数量</span>
              <input v-model.number="tradeQty" type="number" min="1" class="pixel-input" />
              <button class="pixel-btn small" @click="tradeQty = Math.max(1, tradeQty + 1)">+1</button>
              <button class="pixel-btn small" @click="tradeQty = Math.max(1, tradeQty + 10)">+10</button>
              <button class="pixel-btn small" @click="tradeQty = Math.max(1, tradeQty + 100)">+100</button>
              <button class="pixel-btn small" @click="tradeQty = maxAffordable">最大</button>
            </div>
            <div class="trade-buttons">
              <button class="pixel-btn" :disabled="!isOpen || tradeQty <= 0 || tradeQty * selectedStock.price > store.player.gold" @click="buy(selectedStock, tradeQty)">
                <Icon icon="mdi:cart-plus" /> 买入 {{ tradeQty }}股 ({{ tradeQty * selectedStock.price }}G)
              </button>
              <button class="pixel-btn" :disabled="!isOpen || selectedStock.holding <= 0" @click="sell(selectedStock, tradeQty)">
                <Icon icon="mdi:cart-minus" /> 卖出 {{ Math.min(tradeQty, selectedStock.holding) }}股
              </button>
              <button class="pixel-btn" :disabled="!isOpen || selectedStock.holding <= 0" @click="sellAll(selectedStock)">
                <Icon icon="mdi:cart-remove" /> 全部卖出
              </button>
            </div>
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
const tradeQty = ref(1)
const chartMode = ref('day')

const isOpen = computed(() => {
  const t = store.world.gameTime
  return t >= 540 && t < 930
})

const maxAffordable = computed(() => {
  if (!selectedStock.value) return 1
  return Math.floor(store.player.gold / selectedStock.value.price) || 1
})

function formatTime(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}:${m.toString().padStart(2, '0')}`
}

const totalStockValue = computed(() => store.facilities.stocks.reduce((s, st) => s + st.price * st.holding, 0))
const totalCost = computed(() => store.facilities.stocks.reduce((s, st) => s + st.costBasis * st.holding, 0))
const totalProfit = computed(() => totalStockValue.value - totalCost.value)
const totalProfitPercent = computed(() => totalCost.value ? (totalProfit.value / totalCost.value) * 100 : 0)

function stockChange(stock) {
  if (!stock.history?.length) return 0
  return ((stock.price - stock.history[0]) / stock.history[0]) * 100
}
function stockProfit(stock) {
  if (!stock.holding || !stock.costBasis) return 0
  return ((stock.price - stock.costBasis) / stock.costBasis) * 100
}

// 图表相关
const chartCanvases = {}
function setChartCanvas(el, stockId) { if (el) chartCanvases[stockId] = el }

function drawCharts() {
  const stock = selectedStock.value
  if (!stock) return
  const canvas = chartCanvases[stock.id]
  if (!canvas) return
  const hist = stock.history || [stock.price]
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  // 根据周期过滤数据
  const points = chartMode.value === 'week' ? hist.slice(-140) : hist.slice(-20)
  if (points.length < 2) return

  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1

  // 绘制曲线（留出边距）
  const paddingX = 20
  const drawWidth = w - paddingX * 2
  ctx.beginPath()
  ctx.strokeStyle = '#4caf50'
  ctx.lineWidth = 2
  for (let i = 0; i < points.length; i++) {
    const x = paddingX + (i / (points.length - 1)) * drawWidth
    const y = h - ((points[i] - min) / range) * (h - 10) - 5
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // 绘制买卖标记
  const trades = stock.trades || []
  const offset = hist.length - points.length
  trades.forEach(t => {
    const localIdx = t.historyIndex - offset
    if (localIdx < 0 || localIdx >= points.length) return
    const x = paddingX + (localIdx / (points.length - 1)) * drawWidth
    const price = t.price
    const y = h - ((price - min) / range) * (h - 10) - 5
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fillStyle = t.type === 'buy' ? '#4caf50' : '#f44336'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.stroke()
  })
}

watch(() => store.world.gameTime, () => nextTick(drawCharts))
watch(selectedStock, () => nextTick(drawCharts))
watch(chartMode, () => nextTick(drawCharts))

onMounted(() => {
  if (store.facilities.stocks.length) selectStock(store.facilities.stocks[0])
})

function selectStock(stock) {
  selectedStock.value = stock
  tradeQty.value = 1
}

function buy(stock, qty) {
  if (!isOpen.value || qty <= 0) return
  const cost = qty * stock.price
  if (store.player.gold < cost) return
  store.player.gold -= cost
  if (stock.holding === 0) stock.costBasis = stock.price
  else stock.costBasis = (stock.costBasis * stock.holding + cost) / (stock.holding + qty)
  stock.holding += qty
  if (!stock.trades) stock.trades = []
  stock.trades.push({ type: 'buy', price: stock.price, historyIndex: stock.history.length - 1 })
  store.save()
}

function sell(stock, qty) {
  if (!isOpen.value) return
  qty = Math.min(qty, stock.holding)
  if (qty <= 0) return
  stock.holding -= qty
  store.player.gold += qty * stock.price
  if (stock.holding === 0) stock.costBasis = 0
  if (!stock.trades) stock.trades = []
  stock.trades.push({ type: 'sell', price: stock.price, historyIndex: stock.history.length - 1 })
  store.save()
}

function sellAll(stock) {
  sell(stock, stock.holding)
}
</script>

<style scoped>
.overlay { position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); display:flex; justify-content:center; align-items:center; z-index:200; }
.panel { width:900px; max-width:95vw; height:85vh; background:rgba(15,25,45,0.95); backdrop-filter:blur(25px); border:2px solid #b89a6a; border-radius:24px; box-shadow:0 25px 60px rgba(0,0,0,0.6); display:flex; flex-direction:column; padding:0; position:relative; color:#ffd; font-family:'Press Start 2P',cursive; overflow:hidden; }
.close-btn { position:absolute; top:15px; right:15px; background:none; border:none; color:#ffd; font-size:22px; cursor:pointer; z-index:10; }
.close-btn:hover { transform:scale(1.2); }
.top-bar { padding:20px 25px; border-bottom:1px solid rgba(255,215,0,0.2); }
.top-bar h2 { font-size:16px; margin-bottom:10px; display:flex; align-items:center; gap:10px; }
.market-time { display:flex; gap:20px; font-size:10px; margin-bottom:12px; }
.open { color:#4caf50; } .closed { color:#f44336; }
.funds-row { display:flex; flex-wrap:wrap; gap:15px; font-size:9px; }
.fund-item { display:flex; align-items:center; gap:6px; }
.up { color:#f44336; } .down { color:#4caf50; }

.main-content { flex:1; display:flex; overflow:hidden; }
.stock-sidebar { width:160px; background:rgba(0,0,0,0.3); border-right:1px solid rgba(255,215,0,0.2); overflow-y:auto; padding:8px 0; }
.stock-item { padding:12px 10px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); transition:0.2s; display:flex; flex-direction:column; gap:4px; }
.stock-item:hover { background:rgba(255,215,0,0.1); }
.stock-item.active { background:rgba(255,215,0,0.15); border-left:3px solid #ffd700; }
.stock-item-name { font-size:9px; font-weight:bold; }
.stock-item-change { font-size:8px; }
.stock-item-sub { display:flex; justify-content:space-between; font-size:7px; color:#888; }

.stock-detail { flex:1; padding:20px; display:flex; flex-direction:column; overflow-y:auto; }
.detail-header h3 { font-size:14px; margin-bottom:10px; }
.price-row { display:flex; align-items:center; gap:15px; margin-bottom:20px; }
.current-price { font-size:18px; font-weight:bold; color:#ffd700; }
.change-tag { font-size:11px; padding:4px 12px; border-radius:20px; background:rgba(255,255,255,0.1); }

.chart-tabs { display:flex; gap:8px; margin-bottom:8px; }
.chart-tabs .pixel-btn.active { background:rgba(255,215,0,0.3); }
.chart-container { background:rgba(0,0,0,0.3); border-radius:12px; padding:10px; margin-bottom:15px; }
.chart-container canvas { width:100%; height:120px; }

.position { background:rgba(0,0,0,0.2); border-radius:12px; padding:15px; margin-bottom:15px; display:flex; flex-wrap:wrap; gap:12px; font-size:10px; }
.pos-row { display:flex; gap:10px; width:calc(50% - 12px); }
.no-position { font-size:10px; opacity:0.6; margin:15px 0; }

.trade-area { margin-top:auto; }
.trade-row { display:flex; align-items:center; gap:8px; margin-bottom:10px; font-size:9px; flex-wrap:wrap; }
.pixel-input { background:#1a2a3a; border:1px solid #b89a6a; color:#ffd; padding:6px 8px; font-family:'Press Start 2P'; font-size:10px; width:80px; border-radius:6px; }
.trade-buttons { display:flex; gap:10px; flex-wrap:wrap; }
</style>