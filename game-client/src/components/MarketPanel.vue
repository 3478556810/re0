<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      <!-- 顶部标题栏 -->
      <div class="top-bar">
        <h2><Icon icon="mdi:store" /> 交易行</h2>
        <div class="gold-display">
          <Icon icon="mdi:gold" /> {{ store.player.gold }}G
        </div>
        <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      </div>

      <!-- 标签切换 -->
      <div class="tabs">
        <button :class="['tab', { active: activeTab === 'browse' }]" @click="activeTab = 'browse'; fetchMarket()">
          <Icon icon="mdi:store-search" /> 市场
        </button>
        <button :class="['tab', { active: activeTab === 'list' }]" @click="activeTab = 'list'">
          <Icon icon="mdi:package-variant-closed" /> 上架
        </button>
        <button :class="['tab', { active: activeTab === 'mine' }]" @click="activeTab = 'mine'; fetchMyListings()">
          <Icon icon="mdi:clipboard-list" /> 我的
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="tab-content">
        <!-- 浏览市场 -->
        <div v-if="activeTab === 'browse'" class="market-list">
          <div class="search-bar">
            <input v-model="searchKeyword" placeholder="搜索物品名称..." @keyup.enter="fetchMarket" />
            <select v-model="sortBy" @change="fetchMarket">
              <option value="price_asc">价格 ↑</option>
              <option value="price_desc">价格 ↓</option>
              <option value="newest">最新</option>
            </select>
            <button class="pixel-btn small" @click="fetchMarket">搜索</button>
          </div>
          <div v-if="marketItems.length" class="grid-list">
            <div v-for="item in marketItems" :key="item.id" class="item-card">
              <div class="item-header">
              <Icon :icon="getItemIcon(item.item_data || null)" class="item-icon" />
                <div class="item-info">
               <span class="item-name">{{ item.item_data?.name || item.item_id }}</span>
                  <span class="item-seller">卖家: {{ item.seller_id }}</span>
                  <span class="item-qty">库存: {{ item.quantity }}</span>
                </div>
              </div>
              <div class="item-footer">
                <span class="item-price">{{ item.price }}G</span>
                <button class="pixel-btn small" @click="buyItem(item)">购买</button>
              </div>
            </div>
          </div>
          <div v-else class="empty">暂无商品</div>
          <div class="pagination" v-if="totalPages > 1">
            <button :disabled="page <= 1" @click="page--; fetchMarket()">上一页</button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button :disabled="page >= totalPages" @click="page++; fetchMarket()">下一页</button>
          </div>
        </div>

        <!-- 上架物品 -->
        <div v-if="activeTab === 'list'" class="sell-area">
          <div class="bag-list" v-if="inventory.length > 0">
            <div v-for="item in inventory" :key="item.id" class="item-card" @click="selectItem(item)">
              <div class="item-info">
                <Icon :icon="getItemIcon(item)" class="item-icon" />
                <div class="item-detail">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-sub" v-if="item.level">Lv.{{ item.level }}</span>
                  <span class="item-quality" :style="{ color: qualityColor(item.quality) }">{{ item.quality }}</span>
                  <span class="item-qty" v-if="item.qty">x{{ item.qty }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty">背包空空如也</div>

          <!-- 定价弹窗 -->
          <div v-if="selectedItem" class="modal-overlay" @click.self="cancelListing">
            <div class="modal-box">
              <h3>上架物品</h3>
              <div class="modal-content">
                <p><strong>{{ selectedItem.name }}</strong></p>
                <label>单价 <input v-model="price" type="number" min="1" /></label>
                <label>数量 <input v-model="quantity" type="number" :max="maxQuantity" min="1" /></label>
                <p>总价：{{ totalPrice }}G</p>
              </div>
              <div class="modal-actions">
                <button class="pixel-btn" @click="confirmList">上架</button>
                <button class="pixel-btn cancel" @click="cancelListing">取消</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 我的订单 -->
        <div v-if="activeTab === 'mine'" class="my-listings">
          <div v-if="myItems.length" class="grid-list">
            <div v-for="item in myItems" :key="item.id" class="item-card">
              <div class="item-header">
                <Icon :icon="getItemIcon(item.item_data)" class="item-icon" />
                <div class="item-info">
                  <span class="item-name">{{ item.item_data.name || item.item_id }}</span>
                  <span class="item-qty">库存: {{ item.quantity }}</span>
                </div>
              </div>
              <div class="item-footer">
                <span class="item-price">{{ item.price }}G</span>
                <button class="pixel-btn small danger" @click="cancelListingById(item.id)">下架</button>
              </div>
            </div>
          </div>
          <div v-else class="empty">没有已上架物品</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'

const emit = defineEmits(['close'])
const store = useGameStore()
const showToast = inject('showToast', (msg) => alert(msg))

const activeTab = ref('browse')
const userId = computed(() => store.player.id || 'test-user')

// 市场浏览
const searchKeyword = ref('')
const sortBy = ref('price_asc')
const page = ref(1)
const limit = ref(20)
const marketItems = ref([])
const totalPages = ref(1)

// 我的列表
const myItems = ref([])

// 上架状态
const selectedItem = ref(null)
const price = ref(1)
const quantity = ref(1)

const inventory = computed(() => store.inventory || [])

// ---------- 市场浏览逻辑 ----------
async function fetchMarket() {
  try {
    const params = new URLSearchParams({
      page: page.value,
      limit: limit.value,
      sort: sortBy.value,
    })
    if (searchKeyword.value) params.set('keyword', searchKeyword.value)

    const res = await fetch(`/api/market/search?${params.toString()}`)
    const data = await res.json()
    marketItems.value = data.listings || []
    // 修复分页计算：用后端返回的 total
    totalPages.value = Math.ceil((data.total || 0) / limit.value) || 1
  } catch (err) {
    console.error('获取市场列表失败', err)
    showToast('加载市场失败')
  }
}

async function buyItem(item) {
  if (!confirm(`确定购买 ${item.item_data?.name || item.item_id} x1，花费 ${item.price}G 吗？`)) return

  try {
    const res = await fetch('/api/market/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId.value },
      body: JSON.stringify({ listingId: item.id, quantity: 1 })
    })
    const data = await res.json()
    if (data.success) {
      showToast('购买成功')
      store.player.gold -= data.paid
      store.save()
      fetchMarket()
      fetchMyListings()
    } else {
      showToast(data.error || '购买失败')
    }
  } catch (err) {
    console.error(err)
    showToast('购买请求失败')
  }
}

// ---------- 我的物品 ----------
async function fetchMyListings() {
  try {
    // 直接通过后端过滤卖家
    const res = await fetch(`/api/market/search?limit=200&sort=newest&sellerId=${userId.value}`)
    const data = await res.json()
    myItems.value = data.listings || []
  } catch (err) {
    console.error('获取我的物品失败', err)
  }
}

async function cancelListingById(listingId) {
  if (!confirm('确定下架该物品吗？')) return
  try {
    const res = await fetch('/api/market/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId.value },
      body: JSON.stringify({ listingId })
    })
    const data = await res.json()
    if (data.success) {
      showToast('已下架')
      fetchMyListings()
      fetchMarket()
    } else {
      showToast(data.error || '下架失败')
    }
  } catch (err) {
    console.error(err)
    showToast('下架请求失败')
  }
}

// ---------- 上架逻辑 ----------
function selectItem(item) {
  selectedItem.value = item
  price.value = 1
  quantity.value = Math.min(item.qty || 1, 1)
}

const maxQuantity = computed(() => {
  if (!selectedItem.value) return 1
  return selectedItem.value.qty || 1
})

const totalPrice = computed(() => price.value * quantity.value)

async function confirmList() {
  if (!selectedItem.value || price.value <= 0 || quantity.value <= 0) return

  const payload = {
    itemId: selectedItem.value.id,
    itemData: {
      name: selectedItem.value.name,
      type: selectedItem.value.type || '',
      level: selectedItem.value.level || 1,
      quality: selectedItem.value.quality || ''
    },
    price: price.value,
    quantity: quantity.value
  }

  try {
    const res = await fetch('/api/market/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId.value
      },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (data.success) {
      showToast('上架成功')
      // 本地扣除物品
      const invItem = store.inventory.find(i => i.id === selectedItem.value.id)
      if (invItem) {
        invItem.qty -= quantity.value
        if (invItem.qty <= 0) {
          store.inventory = store.inventory.filter(i => i.id !== invItem.id)
        }
        store.save()
      }
      cancelListing()
      fetchMarket()
      if (activeTab.value === 'mine') fetchMyListings()
    } else {
      showToast(data.error || '上架失败')
    }
  } catch (err) {
    console.error(err)
    showToast('无法连接交易行服务')
  }
}

function cancelListing() {
  selectedItem.value = null
  price.value = 1
  quantity.value = 1
}

// ---------- 辅助函数 ----------
function getItemIcon(item) {
  if (!item) return 'mdi:circle'              // 防止 null 报错
  if (item.icon) return item.icon
  if (item.type === 'weapon') return 'mdi:sword'
  if (item.type === 'armor') return 'mdi:shield'
  return 'mdi:circle'
}

function qualityColor(q) {
  const map = { white:'#ccc', green:'#4caf50', blue:'#2196f3', purple:'#9c27b0', red:'#ff4444' }
  return map[q] || '#fff'
}

onMounted(() => {
  if (activeTab.value === 'browse') fetchMarket()
})
</script>

<style scoped>
.overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:200; }
.panel { width:95vw; max-width:600px; max-height:85vh; overflow-y:auto; padding:16px; background:rgba(15,25,45,0.95); border:2px solid #b89a6a; color:#ffd; font-family:'Press Start 2P', cursive; }
.top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.gold-display { display:flex; align-items:center; gap:4px; font-size:10px; color:#ffd700; background:rgba(255,215,0,0.1); padding:4px 8px; border-radius:6px; }
.close-btn { background:none; border:none; color:#ffd; font-size:20px; cursor:pointer; }

.tabs { display:flex; gap:6px; margin-bottom:12px; }
.tab { flex:1; padding:8px; background:rgba(0,0,0,0.4); border:1px solid rgba(184,154,106,0.4); color:#aaa; font-family:inherit; font-size:9px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; border-radius:6px; }
.tab.active { background:rgba(255,215,0,0.15); border-color:#ffd700; color:#ffd700; }
.tab-content { min-height:200px; }

.search-bar { display:flex; gap:6px; margin-bottom:10px; }
.search-bar input { flex:2; padding:6px; background:#2a2a3a; border:1px solid #5a5a7a; color:#fff; font-family:inherit; font-size:9px; }
.search-bar select { padding:6px; background:#2a2a3a; border:1px solid #5a5a7a; color:#fff; font-family:inherit; font-size:9px; }
.grid-list { display:flex; flex-direction:column; gap:6px; }
.item-card { background:rgba(255,255,255,0.05); border:1px solid rgba(255,215,0,0.2); padding:10px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; }
.item-header { display:flex; align-items:center; gap:8px; }
.item-icon { font-size:24px; color:#ffd700; }
.item-info { display:flex; flex-direction:column; }
.item-name { font-size:9px; }
.item-seller, .item-qty { font-size:7px; color:#aaa; }
.item-footer { display:flex; align-items:center; gap:10px; }
.item-price { font-size:9px; color:#ffd700; }
.pagination { display:flex; justify-content:center; align-items:center; gap:10px; margin-top:10px; font-size:9px; }

.sell-area .bag-list { display:flex; flex-direction:column; gap:6px; }
.sell-area .item-card { cursor:pointer; }
.item-detail { display:flex; flex-direction:column; }
.item-sub { font-size:7px; color:#aaa; }
.item-quality { font-size:7px; }
.item-qty { font-size:7px; color:#aaa; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; z-index:300; }
.modal-box { background:#1e2a3a; border:2px solid #b89a6a; padding:20px; min-width:280px; border-radius:12px; }
.modal-box h3 { font-size:12px; color:#ffd700; margin-bottom:12px; }
.modal-content p { font-size:9px; margin-bottom:10px; }
.modal-content label { display:block; margin-bottom:8px; font-size:9px; }
.modal-content input { margin-left:8px; width:80px; background:#2a2a3a; border:1px solid #b89a6a; color:#ffd; padding:4px; font-family:inherit; font-size:9px; }
.modal-actions { display:flex; gap:8px; justify-content:center; margin-top:12px; }

.pixel-btn { background:#2a2a3a; border:2px solid #b89a6a; color:#ffd; font-family:inherit; padding:6px 12px; font-size:8px; cursor:pointer; border-radius:6px; }
.pixel-btn.small { padding:4px 10px; font-size:7px; }
.pixel-btn.cancel { border-color:#666; color:#aaa; }
.pixel-btn.danger { border-color:#f44; background:rgba(255,100,100,0.2); }
.empty { text-align:center; color:#888; padding:20px; font-size:9px; }
</style>