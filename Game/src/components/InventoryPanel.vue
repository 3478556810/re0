<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" />
      </button>

      <div class="layout">
        <!-- 左侧装备栏（保持不变） -->
        <div class="equip-section">
          <h2 class="section-title"><Icon icon="mdi:shield-sword" /> 装备</h2>
          <div class="equip-columns">
            <div class="equip-col">
              <h3><Icon icon="mdi:sword-cross" /> 攻击 / 饰品</h3>
              <div class="equip-slot" v-for="slot in leftSlots" :key="slot.key">
                <div class="slot-label">{{ slot.label }}</div>
                <div
                  class="slot-item"
                  :class="[
                    { empty: !store.equipment[slot.key] },
                    store.equipment[slot.key] ? 'quality-' + store.equipment[slot.key].quality : ''
                  ]"
                  @click="unequip(slot.key)"
                  @mouseenter="showSlotTooltip(slot.key, $event)"
                  @mouseleave="hideTooltip"
                >
                  <template v-if="store.equipment[slot.key]">
                    <Icon :icon="slot.icon" class="item-icon" />
                    <div class="item-name">{{ store.equipment[slot.key].name }}</div>
                    <div class="item-remove"><Icon icon="mdi:close-circle" /></div>
                  </template>
                  <template v-else>
                    <Icon icon="mdi:plus-circle-outline" class="empty-icon" />
                  </template>
                </div>
              </div>
            </div>
            <div class="equip-col">
              <h3><Icon icon="mdi:shield" /> 防具</h3>
              <div class="equip-slot" v-for="slot in rightSlots" :key="slot.key">
                <div class="slot-label">{{ slot.label }}</div>
                <div
                  class="slot-item"
                  :class="[
                    { empty: !store.equipment[slot.key] },
                    store.equipment[slot.key] ? 'quality-' + store.equipment[slot.key].quality : ''
                  ]"
                  @click="unequip(slot.key)"
                  @mouseenter="showSlotTooltip(slot.key, $event)"
                  @mouseleave="hideTooltip"
                >
                  <template v-if="store.equipment[slot.key]">
                    <Icon :icon="slot.icon" class="item-icon" />
                    <div class="item-name">{{ store.equipment[slot.key].name }}</div>
                    <div class="item-remove"><Icon icon="mdi:close-circle" /></div>
                  </template>
                  <template v-else>
                    <Icon icon="mdi:plus-circle-outline" class="empty-icon" />
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧背包 -->
        <div class="mats-section">
          <h2 class="section-title"><Icon icon="mdi:package-variant-closed" /> 背包</h2>

<!-- 武器 / 防具 -->
<h3 class="sub-title"><Icon icon="mdi:sword-cross" /> 武器 / 防具</h3>
<div v-if="equipmentItems.length === 0" class="empty-mats">暂无装备</div>
<div v-else class="acc-grid">
  <div
    v-for="item in equipmentItems"
    :key="item.id"
    class="acc-card"
    :class="'quality-' + item.quality"
   @click="equipItemLocal(item)"
    @mouseenter="showTooltip(item, $event)"
    @mouseleave="hideTooltip"
  >
    <div class="acc-name" :style="{ color: qualityColor(item.quality) }">{{ item.name }}<span v-if="item.level" style="font-size:7px;color:#aaa;">Lv.{{ item.level }}</span></div>
    <div class="tooltip-stats">
      <span>攻击 +{{ item.atk }}</span>
      <span>防御 +{{ item.def }}</span>
    </div>
  
  <button class="pixel-btn small danger" @click.stop="deleteEquipment(item)">删除</button>
  </div>
</div>





          <!-- 饰品背包（不变） -->
          <div class="accessory-inv">
            <h3 class="sub-title"><Icon icon="mdi:gem" /> 饰品</h3>
            <div v-if="accessoryItems.length === 0" class="empty-mats">暂无饰品</div>
            <div v-else class="acc-grid">
              <div
                v-for="acc in accessoryItems"
                :key="acc.id"
                class="acc-card"
                :class="'quality-' + acc.quality"
               @click="equipAccessoryLocal(acc)"
                @mouseenter="showTooltip(acc, $event)"
                @mouseleave="hideTooltip"
              >
                <div class="acc-name" :style="{ color: qualityColor(acc.quality) }">{{ acc.name }}<span v-if="acc.level" class="acc-level">Lv.{{ acc.level }}</span></div>
                <div class="acc-affixes" v-if="acc.affixes?.length">
                  <span v-for="aff in acc.affixes" :key="aff.id" class="acc-affix-tag">
                    {{ getAffixName(aff.id) }} Lv.{{ aff.level }}
                  </span>
                </div>

 <button class="pixel-btn small danger" @click.stop="deleteAccessory(acc)">删除</button>

              </div>
            </div>
          </div>

          <!-- 材料背包（支持贩卖） -->
          <h3 class="sub-title" style="margin-top: 10px;"><Icon icon="mdi:cube-outline" /> 材料</h3>
          <div v-if="sellMode" class="sell-info">
            <Icon icon="mdi:cash-multiple" /> 持有金币：{{ store.player.gold }} G
          </div>
          <div class="materials-grid">
            <div
              v-for="(mat, id) in store.materials"
              :key="id"
              class="material-cell"
              :class="{ clickable: sellMode }"
              @click="sellMode ? openSellDialog(id) : null"
            >
              <Icon :icon="materialIcon(id)" class="mat-icon" />
              <span class="mat-name">{{ store.getMaterialName(id) }}</span>
              <span class="mat-qty">x{{ mat.qty }}</span>
            </div>
            <div v-if="Object.keys(store.materials).length === 0" class="empty-mats">暂无材料</div>
          </div>
        </div>
      </div>

      <!-- 贩卖弹窗 -->
      <div v-if="showSellDialog" class="dialog-overlay" @click.self="showSellDialog = false">
        <div class="sell-dialog pixel-panel">
          <h3>出售 {{ store.getMaterialName(selectedMatId) }}</h3>
          <p class="dialog-price">单价：{{ unitPrice }} G</p>
          <div class="dialog-controls">
            <button class="pixel-btn small" @click="changeSellQty(-1)">-</button>
            <input v-model.number="sellQty" type="number" min="1" :max="maxSellQty" class="pixel-input qty-input" />
            <button class="pixel-btn small" @click="changeSellQty(1)">+</button>
          </div>
          <p class="dialog-total">总价：{{ totalPrice }} G</p>
          <div class="dialog-actions">
            <button class="pixel-btn primary" @click="confirmSell">出售</button>
            <button class="pixel-btn" @click="showSellDialog = false">取消</button>
          </div>
        </div>
      </div>

      <!-- 悬浮提示 -->
      <div v-if="tooltip.visible" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <div class="tooltip-name" :style="{ color: tooltip.qualityColor }">{{ tooltip.name }}<span v-if="tooltip.level" style="font-size:7px;color:#aaa;">Lv.{{ tooltip.level }}</span></div>
        <div class="tooltip-quality" :style="{ color: tooltip.qualityColor }">{{ qualityText(tooltip.quality) }}</div>
        <div class="tooltip-stats">
          <div class="tooltip-stat-row"><Icon icon="mdi:sword" /> 攻击 +{{ tooltip.atk }}</div>
          <div class="tooltip-stat-row"><Icon icon="mdi:shield" /> 防御 +{{ tooltip.def }}</div>
        </div>
        <!-- 套装信息 -->
<div v-if="tooltip.setBonus" class="tooltip-set">
  <div class="tooltip-set-header">
    {{ tooltip.setBonus.name }} ({{ tooltip.setBonus.count }}/{{ tooltip.setBonus.required }})
  </div>
  <div class="tooltip-set-desc">{{ tooltip.setBonus.desc }}</div>
  <div class="tooltip-set-bonuses">
    <span v-for="[key, val] in tooltipFilteredSetBonus" :key="key" class="tooltip-set-stat">
      {{ setStatLabel(key) }} +{{ val }}
    </span>
  </div>
</div>
        <div v-if="tooltip.affixes.length" class="tooltip-affixes">
          <div v-for="aff in tooltip.affixes" :key="aff.id" class="tooltip-affix-line">
            {{ aff.name }} Lv.{{ aff.level }} — {{ aff.desc }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

import '../assets/css/InventoryPanel.css'
import { computed, ref, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { AFFIX_EFFECTS } from '../config/accessoryConfig'
const tooltipFilteredSetBonus = computed(() => {
  if (!tooltip.setBonus || !tooltip.setBonus.bonus) return []
  return Object.entries(tooltip.setBonus.bonus).filter(([key]) => key !== 'desc')
})
const props = defineProps({ sellMode: Boolean })
const emit = defineEmits(['close'])
const store = useGameStore()
import { inject } from 'vue'
// 套装名称映射（中文）
const setNames = {
  iron_set: '铁之意志',
  spider_set: '蛛丝暗影',
  stone_set: '石魔之力'
}

// 套装属性标签映射
function setStatLabel(key) {
  const map = {
    atk: '攻击', def: '防御', hp: '最大生命',
    speed: '速度', critRate: '暴击率', critDmg: '暴击伤害',
    rockDmg: '岩属性'
  }
  return map[key] || key
}
const showConfirm = inject('showConfirm', (msg) => Promise.resolve(confirm(msg)))
// 饰品槽位列表（关键！修复前缺少这个定义）
const accessorySlots = ['necklace', 'ring1', 'ring2', 'earring1', 'earring2']
async function deleteEquipment(item) {
  const ok = await showConfirm(`确定要删除 ${item.name} 吗？`)
  if (!ok) return
  const idx = store.inventory.indexOf(item)
  if (idx > -1) {
    store.inventory.splice(idx, 1)
    store.save()
  }
}
// 武器 / 防具
const equipmentItems = computed(() => {
  return (store.inventory || []).filter(item => {
    if (!item) return false
    // 只要有 part 字段且不是饰品槽位，就视为装备（武器、防具、臂甲等）
    if (item.part && !accessorySlots.includes(item.part)) return true
    // 兜底：没有 part 但 type 是 weapon 或 armor，或者有 atk/def 属性
    if ((item.type === 'weapon' || item.type === 'armor' || item.atk || item.def) && !item.part) return true
    return false
  })
})

// 饰品
const accessoryItems = computed(() => {
  return (store.inventory || []).filter(item => {
    if (!item) return false
    return item.part && accessorySlots.includes(item.part)
  })
})
function equipAccessoryLocal(acc) {
  if (!acc || !acc.part) return
  const slot = acc.part
  const idx = store.inventory.findIndex(i => i.id === acc.id)
  if (idx === -1) return

  if (store.equipment[slot]) {
    if (!showConfirm('该部位已有饰品，是否替换？')) return
    store.inventory.push(store.equipment[slot])
  }

  store.equipment[slot] = store.inventory.splice(idx, 1)[0]
  store.save()
}
// 装备槽定义
const leftSlots = [
  { key: 'weapon', label: '武器', icon: 'mdi:sword' },
  { key: 'gauntlet', label: '臂甲', icon: 'mdi:arm-flex' },
  { key: 'necklace', label: '项链', icon: 'mdi:necklace' },
  { key: 'ring1', label: '左戒指', icon: 'mdi:ring' },
  { key: 'ring2', label: '右戒指', icon: 'mdi:ring' },
  { key: 'earring1', label: '左耳环', icon: 'tabler:rings' },
  { key: 'earring2', label: '右耳环', icon: 'tabler:rings' },
]
const rightSlots = [
  { key: 'helmet', label: '头盔', icon: 'mdi:hat-fedora' },
  { key: 'armor', label: '上衣', icon: 'emojione-monotone:dress' },
  { key: 'pants', label: '下衣', icon: 'game-icons:armored-pants' },
  { key: 'shoes', label: '鞋子', icon: 'mdi:shoe-sneaker' },
]

// 贩卖弹窗
const showSellDialog = ref(false)
const selectedMatId = ref('')
const sellQty = ref(1)
const maxSellQty = computed(() => (store.materials[selectedMatId.value] || {}).qty || 0)
const unitPrice = computed(() => store.config.materialPrices[selectedMatId.value] || 1)
const totalPrice = computed(() => unitPrice.value * sellQty.value)

function openSellDialog(id) {
  if (!props.sellMode) return
  selectedMatId.value = id
  sellQty.value = 1
  showSellDialog.value = true
}
function changeSellQty(delta) {
  const n = sellQty.value + delta
  if (n >= 1 && n <= maxSellQty.value) sellQty.value = n
}
function confirmSell() {
  const mat = store.materials[selectedMatId.value]
  if (!mat || sellQty.value <= 0 || sellQty.value > mat.qty) return
  store.addGold(totalPrice.value)
  mat.qty -= sellQty.value
  if (mat.qty <= 0) delete store.materials[selectedMatId.value]
  store.save()
  showSellDialog.value = false
}

// 工具
function materialIcon(id) {
  const icons = {
    slime_gel: 'mdi:water', goblin_fang: 'mdi:tooth', scorpion_tail: 'mdi:needle',
    iron_ore: 'mdi:mine', dragon_scale: 'mdi:shield-sun',
  }
  return icons[id] || 'mdi:circle'
}
function qualityColor(q) {
  const m = { white: '#ccc', green: '#4caf50', blue: '#2196f3', purple: '#9c27b0', red: '#ff4444' }
  return m[q] || '#ccc'
}
function qualityText(q) {
  const m = { white: '普通', green: '精良', blue: '稀有', purple: '史诗', red: '传说' }
  return m[q] || q
}
function getAffixName(id) {
  const eff = AFFIX_EFFECTS[id]
  return eff ? eff.name : id
}
function getAffixDesc(id, level) {
  const eff = AFFIX_EFFECTS[id]
  if (!eff) return ''
  const t = eff.thresholds.filter(th => th.level <= level).pop()
  return t ? t.desc : ''
}

// 装备/卸载

// 本地装备：武器 / 防具
function equipItemLocal(item) {
  if (!item || !item.part) return
  const slot = item.part
  const idx = store.inventory.findIndex(i => i.id === item.id)
  if (idx === -1) return

  // 如果该部位已有装备，先卸下
  if (store.equipment[slot]) {
    store.inventory.push(store.equipment[slot])
  }

  // 从背包中取出并装上
  store.equipment[slot] = store.inventory.splice(idx, 1)[0]
  store.save()
}


// 装备武器/防具
function equipItemFromInv(item) {
  if (!item) return
  // 直接传入引用
  store.equipItem(item)
}
// 装备饰品
function equipAccessoryFromInv(acc) {
  const realAcc = store.inventory.find(i => i.id === acc.id)
  if (!realAcc || !realAcc.part) return
  const slot = realAcc.part
  if (store.equipment[slot]) {
    if (!showConfirm('该部位已有饰品，是否替换？')) return
  }
  store.equipAccessory(realAcc, slot)
}
function unequip(slot) {
  if (store.equipment[slot]) store.unequip(slot)
}
async function deleteAccessory(acc) {
  const ok = await showConfirm(`确定要删除饰品 ${acc.name} 吗？`)
  if (!ok) return
  const idx = store.inventory.indexOf(acc)
  if (idx > -1) {
    store.inventory.splice(idx, 1)
    store.save()
  }
}

// 悬浮提示
const tooltip = reactive({
  visible: false, x: 0, y: 0,
  name: '', quality: '', atk: 0, def: 0,
  qualityColor: '#fff', affixes: [],
  setBonus: null   // 新增
})
function showTooltip(item, event) {
  if (!item) return
  tooltip.visible = true
  tooltip.x = event.clientX + 10
  tooltip.y = event.clientY + 10
  tooltip.name = item.name || ''
  tooltip.level = item.level || 1
  tooltip.quality = item.quality || ''
  tooltip.qualityColor = qualityColor(item.quality)
  tooltip.atk = item.atk || 0
  tooltip.def = item.def || 0
  tooltip.affixes = (item.affixes || []).map(a => ({
    ...a,
    name: getAffixName(a.id),
    desc: getAffixDesc(a.id, a.level)
  }))

  // 套装信息
  if (item.setId && store.activeSetBonuses?.[item.setId]) {
    const setInfo = store.activeSetBonuses[item.setId]
    tooltip.setBonus = {
      name: setNames[item.setId] || item.setId,
      count: setInfo.count,
      required: setInfo.required,
      bonus: setInfo.bonus,
      desc: setInfo.bonus.desc  // 新增描述
    }
  } else {
    tooltip.setBonus = null
  }
}
function showSlotTooltip(slotKey, event) {
  const item = store.equipment[slotKey]
  if (!item) return
  showTooltip(item, event)
}
function hideTooltip() { tooltip.visible = false }
</script>

<style scoped>
/* 引入外部样式（确保存在 InventoryPanel.css） */
/* 贩卖相关样式 */
.sell-info { margin-bottom: 10px; font-size: 10px; color: #ffd700; }
.clickable { cursor: pointer; }
.clickable:hover { transform: scale(1.05); }

/* 弹窗样式 */
.dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(6px);
  display: flex; justify-content: center; align-items: center;
  z-index: 400;
}
.sell-dialog {
  width: 350px;
  padding: 24px;
  text-align: center;
}
.dialog-price { font-size: 10px; margin: 10px 0; color: #ffd700; }
.dialog-controls {
  display: flex; justify-content: center; align-items: center; gap: 12px; margin: 15px 0;
}
.qty-input { width: 60px; text-align: center; }
.dialog-total { font-size: 11px; color: #4caf50; margin-bottom: 20px; }
.dialog-actions { display: flex; gap: 12px; justify-content: center; }
.pixel-btn.primary { background: rgba(255,215,0,0.2); border-color: #ffd700; }
.acc-card .danger {
  margin-top: 6px;
}
.acc-level {
  font-size: 7px;
  color: #aaa;
  margin-left: 4px;
}
.tooltip-set {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(255,215,0,0.3);
}

.tooltip-set-header {
  font-size: 12px;
  color: #ffd700;
  margin-bottom: 6px;
}

.tooltip-set-bonuses {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tooltip-set-stat {
  font-size: 10px;
  color: #4caf50;
  background: rgba(76,175,80,0.15);
  padding: 4px 10px;
  border-radius: 6px;
}

.tooltip-set-desc {
  font-size: 10px;
  color: #ff9800;
  margin-bottom: 6px;
  font-style: italic;
}
/* 保留原有布局（省略，来自 InventoryPanel.css） */
</style>