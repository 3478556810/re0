<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>

      <div class="layout">
        <!-- 左侧装备栏（无按钮，点击查看详情） -->
        <div class="equip-section">
          <h2 class="section-title"><Icon icon="mdi:shield-sword" /> 装备</h2>
          <div class="equip-columns">
            <div class="equip-col">
              <h3><Icon icon="mdi:sword-cross" /> 武器 / 防具</h3>
              <div class="equip-slot" v-for="slot in leftSlots" :key="slot.key">
                <div class="slot-label">{{ slot.label }}</div>
                <div
                  class="slot-item"
                  :class="{ empty: !store.equipment[slot.key] }"
                  @mouseenter="showSlotTooltip(slot.key, $event)"
                  @mouseleave="hideTooltip"
                  @click.stop="openSlotDetail(slot.key)"
                >
                  <template v-if="store.equipment[slot.key]">
                    <Icon :icon="slot.icon" class="item-icon" />
                    <div class="item-name">{{ store.equipment[slot.key].name }}</div>
                  </template>
                  <template v-else>
                    <Icon icon="mdi:plus-circle-outline" class="empty-icon" />
                  </template>
                </div>
              </div>
            </div>
            <div class="equip-col">
              <h3><Icon icon="mdi:gem" /> 饰品</h3>
              <div class="equip-slot" v-for="slot in rightSlots" :key="slot.key">
                <div class="slot-label">{{ slot.label }}</div>
                <div
                  class="slot-item"
                  :class="{ empty: !store.equipment[slot.key] }"
                  @mouseenter="showSlotTooltip(slot.key, $event)"
                  @mouseleave="hideTooltip"
                  @click.stop="openSlotDetail(slot.key)"
                >
                  <template v-if="store.equipment[slot.key]">
                    <Icon :icon="slot.icon" class="item-icon" />
                    <div class="item-name">{{ store.equipment[slot.key].name }}</div>
                  </template>
                  <template v-else>
                    <Icon icon="mdi:plus-circle-outline" class="empty-icon" />
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧背包（标签切换） -->
        <div class="mats-section">
          <h2 class="section-title"><Icon icon="mdi:package-variant-closed" /> 背包</h2>
          <div class="tab-bar">
            <button :class="['tab-btn', { active: activeTab === 'equip' }]" @click="activeTab = 'equip'">
              <Icon icon="mdi:sword-cross" /> 装备
            </button>
            <button :class="['tab-btn', { active: activeTab === 'accessory' }]" @click="activeTab = 'accessory'">
              <Icon icon="mdi:gem" /> 饰品
            </button>
            <button :class="['tab-btn', { active: activeTab === 'material' }]" @click="activeTab = 'material'">
              <Icon icon="mdi:cube-outline" /> 材料
            </button>

            <!-- 品质筛选（仅装备/饰品时显示） -->
            <template v-if="activeTab === 'equip' || activeTab === 'accessory'">
              <span class="quality-spacer"></span>
              <button
                v-for="q in qualityOptions"
                :key="q.value"
                :class="['quality-chip', { active: qualityFilter === q.value }]"
                @click="qualityFilter = q.value"
                :title="q.label"
              >
                {{ q.label }}
              </button>
              <button
                class="quality-chip danger"
                @click="batchDelete"
                :disabled="currentFilteredItems.length === 0"
                title="一键删除当前显示装备"
              >
                <Icon icon="mdi:delete-sweep" />
              </button>
            </template>
          </div>

          <!-- 装备卡片（品质筛选生效） -->
          <div v-if="activeTab === 'equip'" class="tab-content">
            <div v-if="filteredEquipmentItems.length === 0" class="empty-mats">暂无装备</div>
            <div v-else class="acc-grid">
              <div
                v-for="item in filteredEquipmentItems"
                :key="item.id"
                class="acc-card"
                :class="'quality-' + item.quality"
                @mouseenter="showTooltip(item, $event)"
                @mouseleave="hideTooltip"
              >
                <div class="acc-body" @click.stop="openItemDetail(item)">
                  <div class="acc-name" :style="{ color: qualityColor(item.quality) }">
                    {{ item.name }}<span class="acc-level">Lv.{{ item.level || 1 }}</span>
                  </div>
                  <div class="acc-stats">
                    <span>攻 +{{ item.atk || 0 }}</span>
                    <span>防 +{{ item.def || 0 }}</span>
                  </div>
                </div>
                <div class="acc-actions">
                  <button class="pixel-btn primary small" @click.stop="equipItemLocal(item)">装备</button>
                  <button class="pixel-btn danger small" @click.stop="deleteEquipment(item)">删除</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 饰品卡片（品质筛选生效） -->
          <div v-if="activeTab === 'accessory'" class="tab-content">
            <div v-if="filteredAccessoryItems.length === 0" class="empty-mats">暂无饰品</div>
            <div v-else class="acc-grid">
              <div
                v-for="acc in filteredAccessoryItems"
                :key="acc.id"
                class="acc-card"
                :class="'quality-' + acc.quality"
                @mouseenter="showTooltip(acc, $event)"
                @mouseleave="hideTooltip"
              >
                <div class="acc-body" @click.stop="openItemDetail(acc)">
                  <div class="acc-name" :style="{ color: qualityColor(acc.quality) }">
                    {{ acc.name }}<span class="acc-level">Lv.{{ acc.level || 1 }}</span>
                  </div>
                  <div class="acc-stats">
                    <span>攻 +{{ acc.atk || 0 }}</span>
                    <span>防 +{{ acc.def || 0 }}</span>
                  </div>
                </div>
                <div class="acc-actions">
                  <button class="pixel-btn primary small" @click.stop="equipAccessoryLocal(acc)">装备</button>
                  <button class="pixel-btn danger small" @click.stop="deleteAccessory(acc)">删除</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 材料标签 -->
          <div v-if="activeTab === 'material'" class="tab-content">
            <div v-if="sellMode" class="sell-info">
              <Icon icon="mdi:cash-multiple" /> 金币：{{ store.player.gold }} G
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
      </div>

      <!-- 贩卖弹窗 -->
      <div v-if="showSellDialog" class="dialog-overlay" @click.self="showSellDialog = false">
        <div class="sell-dialog pixel-panel">
          <h3>出售 {{ store.getMaterialName(selectedMatId) }}</h3>
          <p class="dialog-price">单价：{{ unitPrice }} G</p>

          <!-- 在贩卖弹窗 dialog-controls 中加入“最大”按钮 -->
          <div class="dialog-controls">
            <button class="pixel-btn small" @click="changeSellQty(-10)">-10</button>
            <input v-model.number="sellQty" type="number" min="1" :max="maxSellQty" class="pixel-input qty-input" />
            <button class="pixel-btn small" @click="changeSellQty(10)">+10</button>
            <button class="pixel-btn small primary" @click="sellQty = maxSellQty">最大</button>
          </div>
          <p class="dialog-total">总价：{{ totalPrice }} G</p>
          <div class="dialog-actions">
            <button class="pixel-btn primary" @click="confirmSell">出售</button>
            <button class="pixel-btn" @click="showSellDialog = false">取消</button>
          </div>
        </div>
      </div>

      <!-- 轻量详情浮层（装备栏/背包卡片点击弹出） -->
      <div v-if="detailTip.visible" class="detail-tip" :style="{ left: detailTip.x + 'px', top: detailTip.y + 'px' }" @click.stop>
        <div class="detail-tip-content">
          <!-- 左侧：已装备对比卡片 -->
          <div v-if="detailTip.compareItem" class="compare-card">
            <div class="compare-title">当前装备</div>
            <div class="compare-name" :style="{ color: qualityColor(detailTip.compareItem.quality) }">
              {{ detailTip.compareItem.name }}<span class="acc-level">Lv.{{ detailTip.compareItem.level || 1 }}</span>
            </div>
            <div class="tip-stats">
              <span>攻 +{{ detailTip.compareItem.atk || 0 }}</span>
              <span>防 +{{ detailTip.compareItem.def || 0 }}</span>
            </div>
      <div v-if="detailTip.compareItem.affixes?.length" class="tip-affixes">
          <!-- 在 v-for 循环显示 affix 的地方 -->
<!-- 在 v-for 循环显示 affix 的地方 -->
  <div v-for="aff in detailTip.compareItem.affixes" :key="aff.id" class="affix-tag" :class="{ fixed: aff.fixed }">
  <!-- 固定词条：空心圆 + 固定文本 -->
  <template v-if="aff.fixed">
    <span class="fixed-circle"></span>
  <span class="fixed-text">对Boss增伤 +{{ detailTip.compareItem.bossDmgBonus || 0 }}%</span>
  </template>
  <!-- 普通词条：显示中文名 + 等级 -->
  <template v-else>
    <span>{{ getAffixName(aff.id) }} Lv.{{ aff.level }}</span>
  </template>
</div>
            </div>
          </div>

          <!-- 右侧：背包物品详情 -->
          <div class="detail-info">
            <div class="tip-name" :style="{ color: detailTip.qualityColor }">
              {{ detailTip.name }}<span class="acc-level">Lv.{{ detailTip.level }}</span>
            </div>
            <div class="tip-quality" :style="{ color: detailTip.qualityColor }">{{ qualityText(detailTip.quality) }}</div>
            <div class="tip-stats">
              <div class="tip-stat-row"><Icon icon="mdi:sword" /> 攻击 +{{ detailTip.atk }}</div>
              <div class="tip-stat-row"><Icon icon="mdi:shield" /> 防御 +{{ detailTip.def }}</div>
            </div>
         <div v-if="detailTip.affixes?.length" class="tip-affixes">
  <div
    v-for="aff in detailTip.affixes"
    :key="aff.id"
    class="affix-tag"
    :class="{ fixed: aff.fixed }"
  >
    <template v-if="aff.fixed">
      <span class="fixed-circle"></span>
      <span class="fixed-text">对Boss增伤 +{{ detailTip.bossDmgBonus }}%</span>
    </template>
    <template v-else>
      <span>{{ getAffixName(aff.id) }} Lv.{{ aff.level }}</span>
    </template>
  </div>
</div>
            <div v-if="detailTip.setBonus" class="tip-set">
              <div class="tip-set-header">{{ detailTip.setBonus.name }} ({{ detailTip.setBonus.count }}/{{ detailTip.setBonus.required }})</div>
              <div class="tip-set-desc">{{ detailTip.setBonus.desc }}</div>
            </div>
          </div>
        </div>
        <div class="tip-actions" v-if="detailTip.showUnequip">
          <button class="pixel-btn danger small" @click="unequipSlot(detailTip.slot); detailTip.visible=false">卸下</button>
        </div>
      </div>

      <!-- 桌面端悬浮提示（仅信息展示） -->
      <div v-if="tooltip.visible" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <div class="tooltip-name" :style="{ color: tooltip.qualityColor }">
          {{ tooltip.name }}<span class="acc-level">Lv.{{ tooltip.level }}</span>
        </div>
        <div class="tooltip-quality" :style="{ color: tooltip.qualityColor }">{{ qualityText(tooltip.quality) }}</div>
        <div class="tooltip-stats">
          <div class="tooltip-stat-row"><Icon icon="mdi:sword" /> 攻击 +{{ tooltip.atk }}</div>
          <div class="tooltip-stat-row"><Icon icon="mdi:shield" /> 防御 +{{ tooltip.def }}</div>
        </div>
        <div v-if="tooltip.affixes?.length" class="tooltip-affixes">
          <div v-for="aff in tooltip.affixes" :key="aff.id" class="tooltip-affix-line">
            {{ aff.name }} Lv.{{ aff.level }} — {{ aff.desc }}
          </div>
        </div>
        <div v-if="tooltip.setBonus" class="tooltip-set">
          <div class="tooltip-set-header">{{ tooltip.setBonus.name }} ({{ tooltip.setBonus.count }}/{{ tooltip.setBonus.required }})</div>
          <div class="tooltip-set-desc">{{ tooltip.setBonus.desc }}</div>
          <div class="tooltip-set-bonuses">
            <span v-for="[key, val] in tooltipFilteredSetBonus" :key="key" class="tooltip-set-stat">
              {{ setStatLabel(key) }} +{{ val }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import '../assets/css/InventoryPanel.css'
import { computed, ref, reactive, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { AFFIX_EFFECTS } from '../config/accessoryConfig'
import { inject } from 'vue'

const showConfirm = inject('showConfirm', (msg) => Promise.resolve(confirm(msg)))
const store = useGameStore()
const props = defineProps({ sellMode: Boolean })
const emit = defineEmits(['close'])

const activeTab = ref(props.sellMode ? 'material' : 'equip')
const accessorySlots = ['necklace', 'ring1', 'ring2', 'earring1', 'earring2']

const qualityFilter = ref('all')
const qualityOptions = [
  { label: '全部', value: 'all' },
  { label: '普通', value: 'white' },
  { label: '优秀', value: 'green' },
  { label: '精良', value: 'blue' },
  { label: '史诗', value: 'purple' },
  { label: '传说', value: 'red' }
]

const equipmentItems = computed(() =>
  (store.inventory || []).filter(item => {
    if (!item) return false
    if (item.part && !accessorySlots.includes(item.part)) return true
    if ((item.type === 'weapon' || item.type === 'armor' || item.atk || item.def) && !item.part) return true
    return false
  })
)
const accessoryItems = computed(() =>
  (store.inventory || []).filter(item => item?.part && accessorySlots.includes(item.part))
)

const filteredEquipmentItems = computed(() => {
  if (qualityFilter.value === 'all') return equipmentItems.value
  return equipmentItems.value.filter(item => item.quality === qualityFilter.value)
})
const filteredAccessoryItems = computed(() => {
  if (qualityFilter.value === 'all') return accessoryItems.value
  return accessoryItems.value.filter(item => item.quality === qualityFilter.value)
})

const currentFilteredItems = computed(() => {
  if (activeTab.value === 'equip') return filteredEquipmentItems.value
  if (activeTab.value === 'accessory') return filteredAccessoryItems.value
  return []
})

async function batchDelete() {
  const items = currentFilteredItems.value
  if (items.length === 0) return

  let confirmMsg = `确定要删除当前显示的 ${items.length} 件装备/饰品吗？`
  if (qualityFilter.value !== 'all') {
    const qualityName = qualityOptions.find(q => q.value === qualityFilter.value)?.label || qualityFilter.value
    confirmMsg = `确定要删除所有 ${qualityName} 品质的装备/饰品吗？`
  }
  const ok = await showConfirm(confirmMsg)
  if (!ok) return

  for (const item of items) {
    const idx = store.inventory.indexOf(item)
    if (idx > -1) store.inventory.splice(idx, 1)
  }
  store.save()
}

function unequipSlot(slot) {
  const item = store.equipment[slot]
  if (!item) return
  store.inventory.push(item)
  store.equipment[slot] = null
  store.save()
  
  if (item.part && accessorySlots.includes(item.part)) {
    activeTab.value = 'accessory'
  } else {
    activeTab.value = 'equip'
  }
}

function equipItemLocal(item) {
  if (!item?.part) return
  const slot = item.part
  const idx = store.inventory.findIndex(i => i.id === item.id)
  if (idx === -1) return
  if (store.equipment[slot]) store.inventory.push(store.equipment[slot])
  store.equipment[slot] = store.inventory.splice(idx, 1)[0]
  store.save()
  detailTip.visible = false
}

function equipAccessoryLocal(acc) {
  if (!acc?.part) return
  const slot = acc.part
  const idx = store.inventory.findIndex(i => i.id === acc.id)
  if (idx === -1) return
  if (store.equipment[slot]) store.inventory.push(store.equipment[slot])
  store.equipment[slot] = store.inventory.splice(idx, 1)[0]
  store.save()
  detailTip.visible = false
}

async function deleteEquipment(item) {
  const ok = await showConfirm(`确定要删除「${item.name}」吗？`)
  if (!ok) return
  const idx = store.inventory.indexOf(item)
  if (idx > -1) store.inventory.splice(idx, 1)
  store.save()
}

async function deleteAccessory(acc) {
  const ok = await showConfirm(`确定要删除饰品「${acc.name}」吗？`)
  if (!ok) return
  const idx = store.inventory.indexOf(acc)
  if (idx > -1) store.inventory.splice(idx, 1)
  store.save()
  detailTip.visible = false
}

const leftSlots = [
  { key: 'weapon', label: '武器', icon: 'mdi:sword' },
  { key: 'gauntlet', label: '臂甲', icon: 'mdi:arm-flex' },
  { key: 'helmet', label: '头盔', icon: 'mdi:hat-fedora' },
  { key: 'armor', label: '上衣', icon: 'emojione-monotone:dress' },
  { key: 'pants', label: '下衣', icon: 'game-icons:armored-pants' },
  { key: 'shoes', label: '鞋子', icon: 'mdi:shoe-sneaker' },
]
const rightSlots = [
  { key: 'necklace', label: '项链', icon: 'mdi:necklace' },
  { key: 'ring1', label: '左戒指', icon: 'mdi:ring' },
  { key: 'ring2', label: '右戒指', icon: 'mdi:ring' },
  { key: 'earring1', label: '左耳环', icon: 'tabler:rings' },
  { key: 'earring2', label: '右耳环', icon: 'tabler:rings' },
]

const showSellDialog = ref(false)
const selectedMatId = ref('')
const sellQty = ref(1)
const maxSellQty = computed(() => store.materials[selectedMatId.value]?.qty || 0)
const unitPrice = computed(() => store.config.materialDefinitions.find(m => m.id === selectedMatId.value)?.price || 1)
const totalPrice = computed(() => unitPrice.value * sellQty.value)
function openSellDialog(id) { if (props.sellMode) { selectedMatId.value = id; sellQty.value = 1; showSellDialog.value = true } }
function changeSellQty(d) { const n = sellQty.value + d; if (n >= 1 && n <= maxSellQty.value) sellQty.value = n }
function confirmSell() {
  const mat = store.materials[selectedMatId.value]; if (!mat || sellQty.value <= 0) return
  store.addGold(totalPrice.value); mat.qty -= sellQty.value
  if (mat.qty <= 0) delete store.materials[selectedMatId.value]
  store.save(); showSellDialog.value = false
}

function materialIcon(id) { return ({ slime_gel: 'mdi:water', goblin_fang: 'mdi:tooth', scorpion_tail: 'mdi:needle', iron_ore: 'mdi:mine', dragon_scale: 'mdi:shield-sun' })[id] || 'mdi:circle' }
function qualityColor(q) { return ({ white: '#ccc', green: '#4caf50', blue: '#2196f3', purple: '#9c27b0', red: '#ff4444' })[q] || '#ccc' }
function qualityText(q) { return ({ white: '普通', green: '精良', blue: '稀有', purple: '史诗', red: '传说' })[q] || q }
function getAffixName(id) {
  if (id === 'bossDmgFix') return '对Boss增伤';
  return AFFIX_EFFECTS[id]?.name || id;
}
function getAffixDesc(id, level) { const eff = AFFIX_EFFECTS[id]; if (!eff) return ''; const t = eff.thresholds.filter(th => th.level <= level).pop(); return t?.desc || '' }
const setNames = { iron_set: '铁之意志', spider_set: '蛛丝暗影', stone_set: '石魔之力' }
function setStatLabel(key) { return ({ atk:'攻击', def:'防御', hp:'最大生命', speed:'速度', critRate:'暴击率', critDmg:'暴击伤害', rockDmg:'岩属性' })[key] || key }

const tooltip = reactive({ visible: false, x:0, y:0, name:'', level:1, quality:'', atk:0, def:0, qualityColor:'#fff', affixes:[], setBonus:null })
const tooltipFilteredSetBonus = computed(() => tooltip.setBonus?.bonus ? Object.entries(tooltip.setBonus.bonus).filter(([k]) => k!=='desc') : [])

function showTooltip(item, event) {
  if (!item || isTouchDevice()) return
  tooltip.visible = true
  tooltip.x = event.clientX + 10; tooltip.y = event.clientY + 10
  tooltip.name = item.name || ''; tooltip.level = item.level || 1; tooltip.quality = item.quality || ''; tooltip.qualityColor = qualityColor(item.quality)
  tooltip.atk = item.atk || 0; tooltip.def = item.def || 0
  tooltip.affixes = (item.affixes || []).map(a => ({ ...a, name: getAffixName(a.id), desc: getAffixDesc(a.id, a.level) }))
  if (item.setId && store.activeSetBonuses?.[item.setId]) {
    const info = store.activeSetBonuses[item.setId]
    tooltip.setBonus = { name: setNames[item.setId]||item.setId, count: info.count, required: info.required, bonus: info.bonus, desc: info.bonus.desc }
  } else tooltip.setBonus = null
}
function showSlotTooltip(slotKey, event) { const item = store.equipment[slotKey]; if (item) showTooltip(item, event) }
function hideTooltip() { tooltip.visible = false }

const detailTip = reactive({
   compareItem: null,
  visible: false, x:0, y:0,
  name:'', level:1, quality:'', qualityColor:'#fff', atk:0, def:0, affixes:[], setBonus:null,
  showUnequip: false, showEquip: false, showDelete: false,
  slot: null, item: null
})

function openSlotDetail(slotKey) {
  const item = store.equipment[slotKey]
  if (!item) return
  fillDetailTip(item, { showUnequip: true, slot: slotKey })
}
function openItemDetail(item) {
  fillDetailTip(item, { showEquip: false, showDelete: true, item })
}
function fillDetailTip(item, { showUnequip=false, showEquip=false, showDelete=false, slot=null, item: refItem=null } = {}) {
  detailTip.visible = true
  detailTip.name = item.name || '未知'
  detailTip.level = item.level || 1
  detailTip.quality = item.quality || ''
  detailTip.qualityColor = qualityColor(item.quality)
  detailTip.atk = item.atk || 0
  detailTip.def = item.def || 0
    // ✅ 直接复制整个 affixes 数组（保留 fixed 属性）
  detailTip.affixes = (item.affixes || []).map(a => ({ ...a }))
  // ✅ 传递 bossDmgBonus
  detailTip.bossDmgBonus = item.bossDmgBonus || 0
  detailTip.affixes = (item.affixes || []).map(a => ({ ...a, name: getAffixName(a.id), desc: getAffixDesc(a.id, a.level) }))
  if (item.setId && store.activeSetBonuses?.[item.setId]) {
    const info = store.activeSetBonuses[item.setId]
    detailTip.setBonus = { name: setNames[item.setId]||item.setId, count: info.count, required: info.required, bonus: info.bonus, desc: info.bonus.desc }
  } else detailTip.setBonus = null

  const equipSlot = item.part
  if (equipSlot && store.equipment[equipSlot]) {
    detailTip.compareItem = store.equipment[equipSlot]
  } else {
    detailTip.compareItem = null
  }
if (detailTip.compareItem && detailTip.compareItem.bossDmgBonus === undefined) {
    detailTip.compareItem.bossDmgBonus = detailTip.compareItem.bossDmgBonus || 0;
}
  detailTip.showUnequip = showUnequip
  detailTip.showEquip = showEquip
  detailTip.showDelete = showDelete
  detailTip.slot = slot
  detailTip.item = refItem
  // 智能定位浮层，防止超出屏幕
  const event = window.event;
  if (event) {
    const tipWidth = 400;
    const tipHeight = 300;
    let left = event.clientX + 10;
    let top = event.clientY + 10;
    
    // 防止右侧溢出
    if (left + tipWidth > window.innerWidth - 10) {
      left = event.clientX - tipWidth - 10;
    }
    // 防止底部溢出
    if (top + tipHeight > window.innerHeight - 10) {
      top = event.clientY - tipHeight - 10;
    }
    // 防止左侧和顶部溢出
    detailTip.x = Math.max(10, left);
    detailTip.y = Math.max(10, top);
  }
}
function equipFromDetail() {
  if (detailTip.item) { equipItemLocal(detailTip.item); detailTip.visible = false }
}
function deleteFromDetail() {
  if (detailTip.item) { deleteEquipment(detailTip.item); detailTip.visible = false }
}
function handleClickOutside(e) {
  if (!detailTip.visible) return
  const el = document.querySelector('.detail-tip')
  if (el && !el.contains(e.target)) detailTip.visible = false
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

function isTouchDevice() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0 }
</script>

<style scoped>
.overlay { background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); }
.panel {
  background: rgba(15,25,45,0.92); backdrop-filter: blur(20px);
  border: 2px solid #b89a6a; border-radius: 24px;
  color: #ffd; font-family: 'Press Start 2P', cursive;
  padding: 24px; position: relative; max-height: 90vh; overflow-y: auto;
}
.close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer; z-index: 10; }
.layout { display: flex; gap: 24px; }
.equip-section, .mats-section { flex: 1; }
.section-title { font-size: 12px; color: #ffd700; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
.equip-col h3 { font-size: 9px; color: #e0c080; margin: 10px 0 6px; display: flex; align-items: center; gap: 4px; }
.equip-slot { margin-bottom: 10px; }
.slot-label { font-size: 8px; color: #aaa; margin-bottom: 4px; }
.slot-item {
  background: rgba(0,0,0,0.5); border: 1px solid rgba(184,154,106,0.4);
  border-radius: 10px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;
  cursor: pointer; transition: 0.2s;
}
.slot-item:hover { border-color: #ffd700; background: rgba(255,215,0,0.1); }
.slot-item.empty { background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.1); }
.item-icon { font-size: 22px; color: #ffd700; }
.item-name { font-size: 9px; flex: 1; color: #ffe4b5; }
.empty-icon { font-size: 22px; color: rgba(255,255,255,0.3); margin: 0 auto; }

.tab-bar { display: flex; gap: 4px; margin-bottom: 14px; }
.tab-btn {
  background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.5);
  border-radius: 12px 12px 0 0; padding: 8px 16px; font-size: 9px;
  color: #ccc; cursor: pointer; display: flex; align-items: center; gap: 4px;
}
.tab-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd700; font-weight: bold; }

.acc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.acc-card {
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(184,154,106,0.3);
  border-radius: 12px;
  padding: 10px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: auto;
}

.acc-body {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 0 0 auto;
}

.acc-name {
  font-size: 10px;
  font-weight: bold;
  color: #ffe4b5;
  line-height: 1.4;
  word-break: break-word;
}

.acc-level {
  font-size: 7px;
  color: #aaa;
  margin-left: 4px;
}

.acc-stats {
  font-size: 8px;
  color: #ccc;
  display: flex;
  gap: 12px;
  line-height: 1.3;
}

.acc-actions {
  display: flex;
  gap: 5px;
  margin-top: 6px;
}

.pixel-btn.small {
  padding: 3px 8px;
  font-size: 7px;
  border-radius: 6px;
  line-height: 1;
}

.pixel-btn {
  background: #2a2a3a; border: 2px solid #b89a6a; color: #ffd;
  font-family: inherit; padding: 6px 14px; font-size: 9px; cursor: pointer; border-radius: 8px;
}
.pixel-btn.primary { background: rgba(255,215,0,0.2); border-color: #ffd700; }
.pixel-btn.danger { background: rgba(180,0,0,0.3); border-color: #ff5555; color: #ffaaaa; }
.pixel-input { background: #1a1a2e; border: 2px solid #b89a6a; color: #ffd; padding: 4px 8px; border-radius: 6px; font-family: inherit; }

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 6px;
}
.material-cell {
  background: rgba(0,0,0,0.4); border: 1px solid rgba(184,154,106,0.3);
  border-radius: 8px; padding: 8px; display: flex; align-items: center; gap: 6px; font-size: 9px;
}
.material-cell.clickable:hover { background: rgba(255,215,0,0.1); border-color: #ffd700; }

.tooltip {
  position: fixed; background: rgba(0,0,0,0.95); border: 2px solid #b89a6a; border-radius: 12px;
  padding: 14px; box-shadow: 0 0 20px rgba(0,0,0,0.9); z-index: 300; pointer-events: none;
  font-size: 10px; max-width: 240px; color: #ffd;
}
.detail-tip {
  position: fixed;
  background: rgba(0,0,0,0.95);
  border: 2px solid #ffd700;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 0 30px rgba(0,0,0,0.9);
  z-index: 500;
  max-width: 400px;
  font-size: 10px;
  color: #ffd;
  line-height: 1.6;
}
.compare-card {
  width: 140px;
  flex-shrink: 0;
  background: rgba(0,0,0,0.7);
  border: 2px solid #ffd700;
  border-radius: 10px;
  padding: 10px;
  font-size: 8px;
  color: #ffe4b5;
}
.compare-title {
  font-size: 9px;
  color: #ffd700;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(255,215,0,0.5);
  padding-bottom: 4px;
}
.tip-name { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
.tip-quality { font-size: 9px; margin-bottom: 8px; }
.tip-stats { display: flex; gap: 16px; margin: 6px 0; font-size: 9px; }
.tip-affixes { margin-top: 8px; border-top: 1px solid rgba(255,215,0,0.3); padding-top: 6px; }
.tip-affix-line { font-size: 8px; color: #ccc; margin: 3px 0; }
.tip-set { margin-top: 8px; border-top: 1px solid rgba(255,215,0,0.3); padding-top: 6px; }
.tip-set-header { font-size: 9px; color: #ffd700; font-weight: bold; }
.tip-set-desc { font-size: 8px; color: #aaa; margin: 4px 0; }
.tip-actions { margin-top: 10px; display: flex; gap: 8px; }
.empty-mats { color: #666; font-size: 9px; text-align: center; padding: 20px; }
@media (max-width: 700px) { .layout { flex-direction: column; } }
.quality-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.filter-btn {
  background: rgba(0,0,0,0.5);
  border: 1px solid #5a5a7a;
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 8px;
  color: #ccc;
  cursor: pointer;
  transition: 0.2s;
}
.filter-btn.active {
  background: rgba(255,215,0,0.2);
  border-color: #ffd700;
  color: #ffd;
}
.batch-delete-btn {
  margin-left: auto;
  font-size: 8px;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(180,0,0,0.3);
  border-color: #ff5555;
  color: #ffaaaa;
}
.batch-delete-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.quality-spacer {
  width: 8px;
  flex-shrink: 0;
}
.quality-chip {
  background: rgba(0,0,0,0.4);
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 7px;
  color: #888;
  cursor: pointer;
  line-height: 1;
  white-space: nowrap;
}
.quality-chip.active {
  background: rgba(255,215,0,0.2);
  border-color: #ffd700;
  color: #ffd700;
}
.quality-chip.danger {
  color: #ffaaaa;
  border-color: #8b0000;
  padding: 2px 4px;
}
.quality-chip.danger:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.detail-tip-content {
  display: flex;
  gap: 12px;
}

.compare-card {
  width: 130px;
  flex-shrink: 0;
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255,215,0,0.3);
  border-radius: 8px;
  padding: 8px;
  font-size: 8px;
  color: #ccc;
}
.compare-title {
  font-size: 9px;
  color: #ffd700;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(255,215,0,0.3);
  padding-bottom: 4px;
}
.compare-name {
  font-size: 10px;
  font-weight: bold;
  margin-bottom: 4px;
}

.detail-info {
  flex: 1;
  min-width: 0;
}

.affix-tag {
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(184,154,106,0.3);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 8px;
  color: #ccc;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 4px;
}
.affix-tag.fixed {
  border-color: #f0c060;
  background: rgba(240,192,96,0.12);
  box-shadow: 0 0 6px rgba(240,192,96,0.3);
}
.fixed-circle {
  width: 8px; height: 8px;
  border-radius: 50%;
  border: 2px solid #f0c060;
  background: transparent;
  flex-shrink: 0;
}
.fixed-text {
  color: #f0c060;
  font-weight: bold;
}

/* 词条标签基础 */
.affix-tag {
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(184, 154, 106, 0.35);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 8px;
  color: #ccc;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 4px;
}

/* 固定词条特殊样式 */
.affix-tag.fixed {
  border-color: #f0c060;
  background: rgba(240, 192, 96, 0.15);
  box-shadow: 0 0 6px rgba(240, 192, 96, 0.3);
}

/* 空心圆点 */
.fixed-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #f0c060;
  background: transparent;
  flex-shrink: 0;
  animation: pulse-gold 2s infinite;
}

@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(240, 192, 96, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(240, 192, 96, 0); }
}

/* 固定文本 */
.fixed-text {
  color: #f0c060;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(240, 192, 96, 0.5);
}
</style>