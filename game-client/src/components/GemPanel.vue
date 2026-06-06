<template>
  <div class="tab-content gem-tab-layout">
    <!-- 左侧：宝石插槽圆形布局 -->
    <div class="gem-left">
      <div class="section">
        <h3><Icon icon="mdi:rhombus-split" /> 宝石插槽</h3>
        <div class="gem-slots-circle">
          <div class="gem-circle-center">
            <Icon icon="mdi:rhombus-split" />
          </div>
          <div
            v-for="(slot, index) in gemSlots"
            :key="slot.key"
            class="gem-slot-circle"
            :class="{ filled: slot.gem, empty: !slot.gem }"
            :style="getSlotStyle(index)"
            @click="handleSlotClick(slot)"
          >
            <template v-if="slot.gem">
              <div
                class="slot-gem-img"
                :class="'gem-tier-' + slot.gem.level"
                :style="{ '--gem-color': slot.gem.color }"
              ></div>
            </template>
            <template v-else>
              <Icon icon="mdi:plus-circle-outline" class="slot-empty-icon" />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：宝石类型总效果 -->
    <div class="gem-right">
      <div class="section">
        <h3><Icon icon="mdi:chart-pie" /> 宝石总加成</h3>
        <div class="total-effects">
          <div class="total-row" v-for="(val, type) in totalGemEffects" :key="type">
            <span class="type-label">{{ getTypeLabel(type) }}</span>
            <span class="type-value">+{{ val }}</span>
          </div>
          <div v-if="Object.keys(totalGemEffects).length === 0" class="empty-total">
            尚未镶嵌宝石
          </div>
        </div>
      </div>
    </div>

    <!-- 宝石详情弹窗 -->
    <Teleport to="body">
      <div v-if="detailVisible" class="gem-detail-overlay" @click.self="detailVisible = false">
        <div class="gem-detail-card">
          <div class="detail-header">
            <h3>{{ detailGem.name }}</h3>
            <button class="close-btn" @click="detailVisible = false"><Icon icon="mdi:close" /></button>
          </div>
          <div class="detail-body">
            <div
              class="detail-gem-preview"
              :class="'gem-tier-' + detailGem.level"
              :style="{ '--gem-color': detailGem.color }"
            ></div>
            <div class="detail-info">
              <!-- 移除顶部冗余等级，直接展示类型和效果 -->
                            <div class="info-row"><span>等级</span><span>{{ detailGem.level }}</span></div>
              <div class="info-row"><span>类型</span><span>{{ detailGem.typeText }}</span></div>
              <div class="info-row"><span>效果</span><span class="effect-value">{{ detailGem.effectDesc }}</span></div>

            </div>
          </div>
          <div class="detail-actions">
            <button class="pixel-btn danger" @click="unequipGem(detailSlotKey)">卸下宝石</button>
            <button class="pixel-btn" @click="detailVisible = false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 宝石选择弹窗（不变） -->
    <Teleport to="body">
      <div v-if="gemSelectVisible" class="gem-select-fullscreen" @click.self="gemSelectVisible = false">
        <div class="gem-select-container">
          <div class="gem-select-header">
            <h3>选择宝石</h3>
            <button class="close-btn" @click="gemSelectVisible = false"><Icon icon="mdi:close" /></button>
          </div>
          <div v-if="availableGems.length === 0" class="empty">背包中没有宝石</div>
          <div v-else class="gem-select-grid">
            <div
              v-for="gem in availableGems"
              :key="gem.id"
              class="gem-select-item"
              @click="equipGemToSlot(selectedSlotKey, gem)"
            >
              <div
                class="gem-select-img"
                :class="'gem-tier-' + gem.level"
                :style="{ '--gem-color': gem.color }"
              ></div>
              <div class="gem-select-name" :style="{ color: gem.color }">{{ gem.name }}</div>
              <div class="gem-select-qty">×{{ gem.qty }}</div>
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
const showToast = inject('showToast', (msg) => alert(msg))

const gemSelectVisible = ref(false)
const selectedSlotKey = ref('')
const detailVisible = ref(false)
const detailGem = ref(null)
const detailSlotKey = ref('')

const gemDefs = computed(() => store.config.gemDefinitions || [])

function findGem(gemId) {
  return gemDefs.value.find(g => g.id === gemId)
}

// 类型中文映射
function getTypeLabel(type) {
  const map = {
    atk: '攻击力',
    def: '防御力',
    hp: '生命值',
    critDmg: '暴击伤害',
    speed: '速度'
  }
  return map[type] || type
}

// 宝石效果描述
function getEffectDesc(def) {
  if (!def) return '未知'
  if (def.type === 'atk') return `攻击力 +${def.value}`
  if (def.type === 'def') return `防御力 +${def.value}`
  if (def.type === 'hp') return `生命值 +${def.value}`
  if (def.type === 'critDmg') return `暴击伤害 +${def.value}%`
  if (def.type === 'speed') return `速度 +${def.value}`
  return `${def.type} +${def.value}`
}

// 宝石插槽数据
const gemSlots = computed(() => {
  const slots = []
  for (let i = 1; i <= 7; i++) {
    const key = 'slot' + i
    const gemId = store.player.gems?.[key]
    const def = findGem(gemId)
    slots.push({
      key,
      label: ['壹','贰','叁','肆','伍','陆','柒'][i - 1],
      gem: def ? {
        id: gemId,
        name: def.name,
        color: def.color,
        value: def.value,
        type: def.type,
        level: def.level,
        typeText: getTypeLabel(def.type),      // 预计算类型文本
        effectDesc: getEffectDesc(def)         // 预计算效果描述
      } : null
    })
  }
  return slots
})

// 右侧总效果计算
const totalGemEffects = computed(() => {
  const totals = {}
  for (const slot of gemSlots.value) {
    if (slot.gem) {
      const { type, value } = slot.gem
      if (!totals[type]) totals[type] = 0
      totals[type] += value
    }
  }
  return totals
})

function getSlotStyle(index) {
  const total = 7
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  const radius = 100
  const x = Math.cos(angle) * radius
  const y = Math.sin(angle) * radius
  return { transform: `translate(${x}px, ${y}px)` }
}

const availableGems = computed(() => {
  const counts = {}
  for (const item of store.inventory) {
    if (item?.id?.startsWith('gem_')) {
      counts[item.id] = (counts[item.id] || 0) + item.qty
    }
  }
  return Object.entries(counts).map(([gemId, qty]) => {
    const def = findGem(gemId)
    return {
      id: gemId,
      name: def?.name || gemId,
      color: def?.color || '#888',
      type: def?.type || '?',
      value: def?.value || 0,
      level: def?.level || 1,
      qty
    }
  })
})

function handleSlotClick(slot) {
  if (slot.gem) {
    detailGem.value = slot.gem
    detailSlotKey.value = slot.key
    detailVisible.value = true
  } else {
    selectedSlotKey.value = slot.key
    gemSelectVisible.value = true
  }
}

function equipGemToSlot(slotKey, gem) {
  for (let i = store.inventory.length - 1; i >= 0; i--) {
    if (store.inventory[i]?.id === gem.id) {
      store.inventory[i].qty = (store.inventory[i].qty || 1) - 1
      if (store.inventory[i].qty <= 0) store.inventory.splice(i, 1)
      break
    }
  }
  if (!store.player.gems) store.player.gems = {}
  store.player.gems[slotKey] = gem.id
  store.save()
  gemSelectVisible.value = false
  showToast('宝石已镶嵌')
}

function unequipGem(slotKey) {
  const gemId = store.player.gems[slotKey]
  if (!gemId) return
  delete store.player.gems[slotKey]
  const def = findGem(gemId)
  store.inventory.push({ id: gemId, name: def?.name || gemId, qty: 1 })
  store.save()
  showToast('宝石已卸下')
  detailVisible.value = false
}
</script>



<style scoped>
/* 宝石插槽圆形布局 */
.gem-slots-circle {
  position: relative;
  width: 260px; height: 260px;
  margin: 20px auto;
}
.gem-circle-center {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,215,0,0.1); border: 2px solid rgba(255,215,0,0.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: #ffd700; z-index: 1;
}
.gem-slot-circle {
  position: absolute; top: 50%; left: 50%;
  width: 52px; height: 52px; margin: -26px 0 0 -26px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.15);
  background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; z-index: 2;
}
.gem-slot-circle:hover { border-color: #ffd700; }
.gem-slot-circle.empty { border-style: dashed; }
.slot-empty-icon { font-size: 20px; color: rgba(255,255,255,0.2); }

/* 宝石本体尺寸（背景动画由全局 gem-common.css 提供） */
.slot-gem-img { width: 36px; height: 36px; }
.gem-select-img { width: 40px; height: 40px; }
.detail-gem-preview { width: 60px; height: 60px; }

/* 旋转光晕（仅定位，动画已在全局） */
.gem-glow-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #ffd700;
  border-right-color: #ffd700;
  pointer-events: none;
  z-index: 4;
}
.gem-glow-ring-small { inset: -2px; }

/* 详情弹窗 */
.gem-detail-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex; justify-content: center; align-items: center;
  z-index: 350;
}
.gem-detail-card {
  background: rgba(15,25,45,0.95); border: 2px solid #b89a6a;
  border-radius: 16px; padding: 20px; width: 300px;
  color: #ffd; font-family: 'Press Start 2P', cursive;
}
.detail-header { display: flex; justify-content: space-between; align-items: center; }
.detail-body { display: flex; gap: 16px; margin: 16px 0; }
.detail-info { flex: 1; font-size: 9px; }
.info-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
.effect-value { color: #ffd700; }
.detail-actions { display: flex; gap: 8px; justify-content: flex-end; }

/* 宝石选择弹窗 */
.gem-select-fullscreen {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  display: flex; justify-content: center; align-items: center;
  z-index: 300;
}
.gem-select-container {
  width: 90vw; max-width: 700px; max-height: 80vh;
  background: rgba(15,25,45,0.95); border: 2px solid #b89a6a;
  border-radius: 16px; padding: 20px; overflow-y: auto;
  color: #ffd; font-family: 'Press Start 2P', cursive;
}
.gem-select-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.gem-select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}
.gem-select-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px; padding: 14px 8px;
  cursor: pointer; transition: background 0.2s;
}
.gem-select-item:hover { background: rgba(255,215,0,0.1); border-color: #ffd700; }
.gem-select-name { font-size: 8px; text-align: center; line-height: 1.2; }
.gem-select-qty { font-size: 9px; color: #ffd700; }
.close-btn { background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer; }
.empty { text-align: center; color: #888; font-size: 9px; padding: 30px; }
.pixel-btn {
  background: #2a2a3a; border: 2px solid #b89a6a; color: #ffd;
  font-family: inherit; padding: 4px 12px; font-size: 8px; cursor: pointer;
  border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;
}
.pixel-btn.danger { background: rgba(180,0,0,0.3); border-color: #ff5555; color: #ffaaaa; }
/* 原有样式保留，增加布局和右侧样式 */
.gem-tab-layout {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.gem-left {
  flex: 0 0 300px;
}

.gem-right {
  flex: 0 0 200px;
}

.total-effects {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 12px;
  font-family: 'Press Start 2P', cursive;
  color: #ffd;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 9px;
}

.type-label {
  color: #ccc;
}

.type-value {
  color: #ffd700;
}

.empty-total {
  text-align: center;
  color: #888;
  font-size: 9px;
  padding: 10px 0;
}

/* 原样式微调 */
.gem-slots-circle {
  position: relative;
  width: 260px; height: 260px;
  margin: 20px auto;
}
/* …… 其他样式保持不变 …… */

</style>