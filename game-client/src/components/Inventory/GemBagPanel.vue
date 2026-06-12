<template>
  <div class="tab-content">
    <!-- 顶部筛选标签：等级 -->
    <div class="gem-filter-bar">
      <button
        v-for="f in levelFilters"
        :key="f.value"
        :class="['gem-filter-chip', { active: activeLevelFilter === f.value }]"
        @click="activeLevelFilter = f.value"
      >
        {{ f.label }}
      </button>
    </div>
    <!-- 顶部筛选标签：类别 -->
    <div class="gem-filter-bar">
      <button
        v-for="f in gemTypeFilters"
        :key="f.value"
        :class="['gem-filter-chip', { active: activeGemTypeFilter === f.value }]"
        @click="activeGemTypeFilter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- 宝石网格 -->
    <div class="materials-grid">
      <div v-if="filteredGems.length === 0" class="empty-mats">暂无宝石</div>
      <div
        v-for="gem in filteredGems"
        :key="gem.id"
        class="material-cell gem-cell"
        :style="{ '--gem-color': gem.color }"
        @click="openGemDetail(gem)"
      >
        <div class="gem-bag-icon">
          <div
            class="gem-bag-icon-inner"
            :class="'gem-tier-' + gem.level"
            :style="{ '--gem-color': gem.color }"
          ></div>
        </div>
        <span class="mat-name">{{ gem.name }}</span>
        <span class="mat-qty">x{{ gem.qty }}</span>
      </div>
    </div>

    <!-- 右下角合成按钮 -->
    <button v-if="backpackGems.length > 0" class="gem-auto-merge-btn" @click="showMergePanel = true">
      <Icon icon="mdi:auto-fix" /> 合成
    </button>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <div v-if="detailVisible" class="gem-detail-overlay" @click.self="detailVisible = false">
        <div class="gem-detail-card" :style="{ '--gem-color': detailGem?.color }">
          <div class="gem-detail-icon">
            <div
              class="gem-bag-icon-inner"
              :class="'gem-tier-' + detailGem.level"
              :style="{ '--gem-color': detailGem?.color }"
            ></div>
          </div>
          <div class="gem-detail-type">类型：{{ gemTypeLabel(detailGem?.type) }}</div>
          <div class="gem-detail-effect">效果：+{{ detailGem?.value }} {{ detailGem?.type === 'critDmg' ? '%' : '' }}</div>
          <div class="gem-detail-actions">
            <button class="pixel-btn primary" @click="equipGemFromDetail">装备</button>
            <button class="pixel-btn danger" @click="deleteGemFromDetail">删除</button>
          </div>
          <button class="pixel-btn close-detail-btn" @click="detailVisible = false">关闭</button>
        </div>
      </div>
    </Teleport>

    <!-- 合成全屏弹窗 -->
    <Teleport to="body">
      <div v-if="showMergePanel" class="merge-fullscreen" @click.self="showMergePanel = false">
        <div class="merge-panel-horizontal">
          <div class="merge-left">
            <div class="merge-type-filters">
              <button
                v-for="t in typeFilters"
                :key="t.value"
                :class="['gem-filter-chip', { active: activeTypeFilter === t.value }]"
                @click="activeTypeFilter = t.value"
              >
                {{ t.label }}
              </button>
            </div>
            <div class="merge-scroll-list" v-if="filteredMergeList.length > 0">
              <div
                v-for="item in filteredMergeList"
                :key="item.fromId"
                class="merge-row"
                :class="{ selected: activeMergeId === item.fromId }"
                @click="toggleMergeRow(item.fromId)"
              >
                <div class="merge-from">
                  <div class="gem-bag-icon small">
                    <div
                      class="gem-bag-icon-inner"
                      :class="'gem-tier-' + item.fromLevel"
                      :style="{ '--gem-color': item.color }"
                    ></div>
                  </div>
                  <span>{{ item.fromName }} x3</span>
                </div>
                <Icon icon="mdi:arrow-right" class="merge-arrow" />
                <div class="merge-to">
                  <div class="gem-bag-icon small">
                    <div
                      class="gem-bag-icon-inner"
                      :class="'gem-tier-' + item.toLevel"
                      :style="{ '--gem-color': item.color }"
                    ></div>
                  </div>
                  <span>{{ item.toName }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-mats">没有可合成的宝石</div>
          </div>

          <div class="merge-right" :class="{ active: activeMergeId !== null }">
            <div class="merge-right-inner" v-if="activeMergeItem">
              <div class="merge-preview-row">
                <div class="gem-bag-icon small">
                  <div
                    class="gem-bag-icon-inner"
                    :class="'gem-tier-' + activeMergeItem.fromLevel"
                    :style="{ '--gem-color': activeMergeItem.color }"
                  ></div>
                </div>
                <span>x3</span>
                <Icon icon="mdi:arrow-right-bold" class="merge-preview-arrow" />
                <div class="gem-bag-icon small">
                  <div
                    class="gem-bag-icon-inner"
                    :class="'gem-tier-' + activeMergeItem.toLevel"
                    :style="{ '--gem-color': activeMergeItem.color }"
                  ></div>
                </div>
              </div>
              <p class="merge-preview-text">合成 {{ activeMergeItem.toName }}</p>
              <p class="merge-preview-cost">费用：{{ activeMergeItem.cost }}G</p>
              <button class="pixel-btn primary merge-confirm-btn" @click="confirmSingleMerge(activeMergeItem)">
                确认合成
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'

const store = useGameStore()
const emit = defineEmits(['refresh'])
const showToast = inject('showToast', (msg) => alert(msg))

const activeLevelFilter = ref('all')
const activeGemTypeFilter = ref('all')
const activeTypeFilter = ref('all')
const detailVisible = ref(false)
const detailGem = ref(null)
const showMergePanel = ref(false)
const activeMergeId = ref(null)

const levelFilters = [
  { label: '全部', value: 'all' },
  { label: 'Lv.1~3', value: '1-3' },
  { label: 'Lv.4~6', value: '4-6' },
  { label: 'Lv.7~10', value: '7-10' }
]

// 背包类别筛选
const gemTypeFilters = [
  { label: '全部', value: 'all' },
  { label: '攻击', value: 'atk' },
  { label: '防御', value: 'def' },
  { label: '生命', value: 'hp' },
  { label: '暴伤', value: 'critDmg' },
  { label: '速度', value: 'speed' }
]

// 合成类别筛选
const typeFilters = gemTypeFilters

const gemDefs = computed(() => store.config.gemDefinitions || [])

function findGem(gemId) {
  return gemDefs.value.find(g => g.id === gemId)
}

const backpackGems = computed(() => {
  const counts = {}
  for (const item of store.inventory) {
    if (item?.id?.startsWith('gem_')) {
      const qty = item.qty ?? 1   // 若 qty 不存在则默认为 1
      counts[item.id] = (counts[item.id] || 0) + qty
    }
  }
  return Object.entries(counts).map(([gemId, qty]) => {
    const def = findGem(gemId)
    return {
      id: gemId, name: def?.name || gemId, color: def?.color || '#888',
      type: def?.type || '?', value: def?.value || 0, level: def?.level || 1,
      qty: Number.isFinite(qty) ? qty : 0   // 最终确保数字
    }
  })
})
// 同时按等级和类别筛选背包
const filteredGems = computed(() => {
  let list = backpackGems.value
  if (activeLevelFilter.value !== 'all') {
    const [min, max] = activeLevelFilter.value.split('-').map(Number)
    list = list.filter(g => g.level >= min && g.level <= max)
  }
  if (activeGemTypeFilter.value !== 'all') {
    list = list.filter(g => g.type === activeGemTypeFilter.value)
  }
  return list
})

// 可合成列表
const mergeList = computed(() => {
  const list = []
  const seen = new Set()
  for (const gem of backpackGems.value) {
    if (gem.qty < 3 || gem.level >= 10) continue
    const parts = gem.id.split('_')
    if (parts.length < 3) continue
    const nextId = `gem_${parts[1]}_${gem.level + 1}`
    if (seen.has(nextId)) continue
    seen.add(nextId)
    const nextDef = findGem(nextId)
    if (!nextDef) continue
    list.push({
      fromId: gem.id, fromName: gem.name,
      toId: nextId, toName: nextDef.name,
      color: gem.color, type: gem.type, cost: gem.level * 500
    })
  }
  list.sort((a, b) => b.toId.localeCompare(a.toId))
  return list
})

const filteredMergeList = computed(() => {
  if (activeTypeFilter.value === 'all') return mergeList.value
  return mergeList.value.filter(item => item.type === activeTypeFilter.value)
})

const activeMergeItem = computed(() => {
  if (!activeMergeId.value) return null
  return mergeList.value.find(item => item.fromId === activeMergeId.value) || null
})

function toggleMergeRow(fromId) {
  activeMergeId.value = activeMergeId.value === fromId ? null : fromId
}

function confirmSingleMerge(item) {
  if (!item) return
  if (store.player.gold < item.cost) {
    showToast(`金币不足（需${item.cost}G）`)
    return
  }
  let removed = 0
  for (let i = store.inventory.length - 1; i >= 0; i--) {
    if (store.inventory[i]?.id === item.fromId) {
      const qty = store.inventory[i].qty
      if (qty >= 3 - removed) {
        store.inventory[i].qty = qty - (3 - removed)
        if (store.inventory[i].qty <= 0) store.inventory.splice(i, 1)
        removed = 3
        break
      } else {
        removed += qty
        store.inventory.splice(i, 1)
      }
      if (removed >= 3) break
    }
  }
  store.player.gold -= item.cost
  const existing = store.inventory.find(i => i.id === item.toId)
  if (existing) {
    existing.qty = (existing.qty || 1) + 1
  } else {
    store.inventory.push({ id: item.toId, qty: 1 })
  }
  store.save()
  activeMergeId.value = null
  showToast(`合成完成：${item.toName}`)
  emit('refresh')
}

function gemTypeLabel(type) {
  const map = { atk: '攻击', def: '防御', hp: '生命', critDmg: '暴击伤害', speed: '速度' }
  return map[type] || type
}

function openGemDetail(gem) {
  detailGem.value = gem
  detailVisible.value = true
}

function equipGemFromDetail() {
  if (!detailGem.value) return
  equipGem(detailGem.value)
  detailVisible.value = false
}

function deleteGemFromDetail() {
  if (!detailGem.value) return
  deleteGem(detailGem.value)
  detailVisible.value = false
}

function equipGem(gem) {
  const totalSlots = 7
  const usedSlots = Object.keys(store.player.gems || {}).length
  if (usedSlots >= totalSlots) {
    showToast('宝石槽位已满（最多7个）')
    return
  }
  let emptySlot = null
  for (let i = 1; i <= totalSlots; i++) {
    if (!store.player.gems?.['slot' + i]) {
      emptySlot = 'slot' + i
      break
    }
  }
  if (!emptySlot) {
    showToast('宝石槽位已满')
    return
  }
  for (let i = store.inventory.length - 1; i >= 0; i--) {
    if (store.inventory[i]?.id === gem.id) {
      store.inventory[i].qty = (store.inventory[i].qty || 1) - 1
      if (store.inventory[i].qty <= 0) store.inventory.splice(i, 1)
      break
    }
  }
  if (!store.player.gems) store.player.gems = {}
  store.player.gems[emptySlot] = gem.id
  store.save()
  showToast('宝石已镶嵌')
  emit('refresh')
}

function deleteGem(gem) {
  for (let i = store.inventory.length - 1; i >= 0; i--) {
    if (store.inventory[i]?.id === gem.id) {
      store.inventory[i].qty = (store.inventory[i].qty || 1) - 1
      if (store.inventory[i].qty <= 0) store.inventory.splice(i, 1)
      break
    }
  }
  store.save()
  showToast('已删除')
  emit('refresh')
}
</script>

<style scoped>
/* 材料网格 */
.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  align-content: start;
  padding-right: 5px;
}
.material-cell {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,215,0,0.2);
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  transition: transform 0.2s;
}
.mat-name {
  font-size: 7px;
  color: #ccc;
  word-break: break-all;
}
.mat-qty {
  font-size: 8px;
  font-weight: bold;
  color: #ffd;
  background: rgba(0,0,0,0.5);
  padding: 2px 8px;
  border-radius: 10px;
}
.empty-mats {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 10px;
  color: #888;
  padding: 30px;
}

/* 宝石图标尺寸（核心动画由全局 gem-common.css 提供） */
.gem-bag-icon {
  width: 36px; height: 36px;
  flex-shrink: 0;
}
.gem-bag-icon.small {
  width: 28px; height: 28px;
}
.gem-bag-icon-inner {
  width: 100%; height: 100%;
  /* 背景、动画、伪元素均已在全局定义，此处不再重复 */
}

/* 顶部筛选标签 */
.gem-filter-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.gem-filter-chip {
  background: rgba(0,0,0,0.5);
  border: 1px solid #5a5a7a;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 8px;
  color: #ccc;
  cursor: pointer;
  font-family: 'Press Start 2P', cursive;
  transition: 0.2s;
}
.gem-filter-chip.active {
  background: rgba(255,215,0,0.2);
  border-color: #ffd700;
  color: #ffd;
}

/* 合成按钮 */
.gem-auto-merge-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(255,215,0,0.2);
  border: 2px solid #ffd700;
  border-radius: 50px;
  padding: 10px 20px;
  font-size: 10px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
}
.gem-auto-merge-btn:hover {
  background: rgba(255,215,0,0.4);
}

/* 详情弹窗 */
.gem-detail-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex; justify-content: center; align-items: center;
  z-index: 350;
}
.gem-detail-card {
  background: rgba(15,25,45,0.95);
  border: 2px solid var(--gem-color, #888);
  border-radius: 20px;
  padding: 24px;
  display: flex; flex-direction: column;
  align-items: center; gap: 14px;
  min-width: 200px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
}
.gem-detail-icon {
  width: 48px; height: 48px;
  flex-shrink: 0;
}
.gem-detail-icon .gem-bag-icon-inner {
  width: 100%; height: 100%;
}
.gem-detail-type {
  font-size: 12px; color: #ffd700; font-weight: bold;
}
.gem-detail-effect {
  font-size: 10px; color: #ccc; margin-top: 4px;
}
.gem-detail-actions {
  display: flex; gap: 8px;
}
.close-detail-btn {
  margin-top: 4px;
}

/* 合成全屏弹窗 */
.merge-fullscreen {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  display: flex; justify-content: center; align-items: center;
  z-index: 400;
}
.merge-panel-horizontal {
  width: 95vw;
  max-width: 900px;
  height: 80vh;
  background: rgba(15,25,45,0.95);
  border: 2px solid #b89a6a;
  border-radius: 16px;
  display: flex;
  overflow: hidden;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
}
.merge-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}
.merge-type-filters {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.merge-scroll-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 8px;
}
.merge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.merge-row:hover {
  border-color: #ffd700;
}
.merge-row.selected {
  border-color: #ffd700;
  background: rgba(255,215,0,0.1);
  box-shadow: 0 0 8px rgba(255,215,0,0.3);
}
.merge-from, .merge-to {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 8px;
}
.merge-arrow {
  font-size: 16px;
  color: #ffd700;
  flex-shrink: 0;
}
.merge-right {
  width: 0;
  overflow: hidden;
  transition: width 0.3s ease;
  background: rgba(0,0,0,0.3);
  border-left: 1px solid rgba(255,215,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.merge-right.active {
  width: 240px;
}
.merge-right-inner {
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.merge-preview-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.merge-preview-arrow {
  font-size: 20px;
  color: #ffd700;
}
.merge-preview-text {
  font-size: 9px;
  color: #ffd;
}
.merge-preview-cost {
  font-size: 8px;
  color: #ffd700;
}
.merge-confirm-btn {
  font-size: 10px;
  padding: 10px 20px;
  margin-top: 8px;
}

/* 按钮复用 */
.pixel-btn {
  background: #2a2a3a; border: 2px solid #b89a6a; color: #ffd;
  font-family: inherit; padding: 4px 12px; font-size: 8px; cursor: pointer;
  border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;
}
.pixel-btn.primary {
  background: rgba(255,215,0,0.2); border-color: #ffd700;
}
.pixel-btn.danger {
  background: rgba(180,0,0,0.3); border-color: #ff5555; color: #ffaaaa;
}
.close-btn {
  background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer;
}
</style>