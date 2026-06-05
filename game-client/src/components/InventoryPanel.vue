<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>

      <div class="layout">
        <!-- 左侧装备栏 -->
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

        <!-- 右侧背包 -->
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
              >
                <Icon icon="mdi:delete-sweep" />
              </button>
            </template>
          </div>

          <!-- 装备卡片 -->
          <div v-if="activeTab === 'equip'" class="tab-content">
            <div v-if="filteredEquipmentItems.length === 0" class="empty-mats">暂无装备</div>
            <div v-else class="acc-grid">
              <div
                v-for="item in filteredEquipmentItems"
                :key="item.id"
                class="acc-card"
                :class="'quality-' + item.quality"
                @click.stop="openItemDetail(item)"
              >
                <div class="acc-body">
                  <div class="acc-name" :style="{ color: qualityColor(item.quality) }">
                    {{ item.name }}<span class="acc-level">Lv.{{ item.level || 1 }}</span>
                  </div>
                  <div class="acc-stats">
                    <span v-if="item.atk > 0">攻 +{{ item.atk }}</span>
                    <span v-if="item.def > 0">防 +{{ item.def }}</span>
                    <span v-for="(val, key) in item.extraStats" :key="key" class="acc-extra-stat">
                      {{ getExtraStatName(key) }}+{{ val }}
                    </span>
                  </div>
                </div>
                <div class="acc-actions">
                  <button class="pixel-btn primary small" @click.stop="equipItemLocal(item)">装备</button>
                  <button class="pixel-btn danger small" @click.stop="deleteEquipment(item)">删除</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 饰品卡片 -->
          <div v-if="activeTab === 'accessory'" class="tab-content">
            <div v-if="filteredAccessoryItems.length === 0" class="empty-mats">暂无饰品</div>
            <div v-else class="acc-grid">
              <div
                v-for="acc in filteredAccessoryItems"
                :key="acc.id"
                class="acc-card"
                :class="'quality-' + acc.quality"
                @click.stop="openItemDetail(acc)"
              >
                <div class="acc-body">
                  <div class="acc-name" :style="{ color: qualityColor(acc.quality) }">
                    {{ acc.name }}<span class="acc-level">Lv.{{ acc.level || 1 }}</span>
                  </div>
                  <div class="acc-stats">
                    <span v-if="acc.atk > 0">攻 +{{ acc.atk }}</span>
                    <span v-if="acc.def > 0">防 +{{ acc.def }}</span>
                    <span v-for="(val, key) in acc.extraStats" :key="key" class="acc-extra-stat">
                      {{ getExtraStatName(key) }}+{{ val }}
                    </span>
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

      <!-- 详情浮层 -->
      <div v-if="detailTip.visible" class="detail-tip" :style="{ left: detailTip.x + 'px', top: detailTip.y + 'px' }" @click.stop>
        <div class="detail-tip-content">
          <div v-if="detailTip.compareItem" class="compare-card">
            <div class="compare-title">当前装备</div>
            <div class="compare-name" :style="{ color: qualityColor(detailTip.compareItem.quality) }">
              {{ detailTip.compareItem.name }}<span class="acc-level">Lv.{{ detailTip.compareItem.level || 1 }}</span>
            </div>
            <div class="tip-stats">
              <span v-if="detailTip.compareItem.atk > 0">攻 +{{ detailTip.compareItem.atk }}</span>
              <span v-if="detailTip.compareItem.def > 0">防 +{{ detailTip.compareItem.def }}</span>
            </div>
            <div v-if="detailTip.compareItem.extraStats && Object.keys(detailTip.compareItem.extraStats).length" class="tip-extra-stats">
              <div v-for="(val, key) in detailTip.compareItem.extraStats" :key="key" class="tip-stat-row">
                {{ getExtraStatName(key) }} +{{ val }}
              </div>
            </div>
            <div v-if="detailTip.compareItem.affixes?.length" class="tip-affixes">
              <div v-for="aff in detailTip.compareItem.affixes" :key="aff.id" class="affix-tag" :class="{ fixed: aff.fixed }">
                <template v-if="aff.fixed">
                  <span class="fixed-circle"></span>
                  <span class="fixed-text">对Boss增伤 +{{ detailTip.compareItem.bossDmgBonus || 0 }}%</span>
                </template>
                <template v-else>
                  <span>{{ getAffixName(aff.id) }} Lv.{{ aff.level }}</span>
                </template>
              </div>
            </div>
          </div>

          <div class="detail-info">
            <div class="tip-name" :style="{ color: detailTip.qualityColor }">
              {{ detailTip.name }}<span class="acc-level">Lv.{{ detailTip.level }}</span>
            </div>
            <div class="tip-quality" :style="{ color: detailTip.qualityColor }">{{ qualityText(detailTip.quality) }}</div>
            <div class="tip-stats">
              <div class="tip-stat-row" v-if="detailTip.atk > 0"><Icon icon="mdi:sword" /> 攻击 +{{ detailTip.atk }}</div>
              <div class="tip-stat-row" v-if="detailTip.def > 0"><Icon icon="mdi:shield" /> 防御 +{{ detailTip.def }}</div>
            </div>
            <!-- 副词条 -->
            <div v-if="detailTip.extraStats && Object.keys(detailTip.extraStats).length" class="tip-extra-stats">
              <div class="tip-set-header">附加属性</div>
              <div v-for="(val, key) in detailTip.extraStats" :key="key" class="tip-stat-row">
                <span>{{ getExtraStatName(key) }}</span>
                <span>+{{ val }}</span>
              </div>
            </div>
            <div v-if="detailTip.affixes?.length" class="tip-affixes">
              <div v-for="aff in detailTip.affixes" :key="aff.id" class="affix-tag" :class="{ fixed: aff.fixed }">
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
  const ok = await showConfirm(`确定要删除当前显示的 ${items.length} 件装备/饰品吗？`)
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
  activeTab.value = accessorySlots.includes(slot) ? 'accessory' : 'equip'
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
function getAffixName(id) { if (id === 'bossDmgFix') return '对Boss增伤'; return AFFIX_EFFECTS[id]?.name || id }

const setNames = { dragon_set: '龙骸', shadow_set: '暗影咒装', crimson_set: '血怒' }

const detailTip = reactive({
  compareItem: null,
  visible: false, x: 0, y: 0,
  name: '', level: 1, quality: '', qualityColor: '#fff', atk: 0, def: 0,
  affixes: [], bossDmgBonus: 0, setBonus: null, extraStats: {},
  showUnequip: false, slot: null, item: null
})

function fillDetailTip(item, { showUnequip = false, slot = null } = {}) {
  detailTip.visible = true
  detailTip.name = item.name || '未知'
  detailTip.level = item.level || 1
  detailTip.quality = item.quality || ''
  detailTip.qualityColor = qualityColor(item.quality)
  detailTip.atk = item.atk || 0
  detailTip.def = item.def || 0
  detailTip.affixes = (item.affixes || []).map(a => ({ ...a }))
  detailTip.bossDmgBonus = item.bossDmgBonus || 0
  detailTip.extraStats = item.extraStats || {}

  if (item.setId && store.activeSetBonuses?.[item.setId]) {
    const info = store.activeSetBonuses[item.setId]
    detailTip.setBonus = {
      name: setNames[item.setId] || item.setId,
      count: info.count,
      required: info.required,
      desc: info.bonus?.desc || ''
    }
  } else {
    detailTip.setBonus = null
  }

  const equipSlot = item.part
  detailTip.compareItem = (equipSlot && store.equipment[equipSlot]) || null
  detailTip.showUnequip = showUnequip
  detailTip.slot = slot

  const tipWidth = 400, tipHeight = 300
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2
  detailTip.x = Math.max(10, cx - tipWidth / 2)
  detailTip.y = Math.max(10, cy - tipHeight / 2)
}

function openSlotDetail(slotKey) {
  const item = store.equipment[slotKey]
  if (item) fillDetailTip(item, { showUnequip: true, slot: slotKey })
}

function openItemDetail(item) {
  fillDetailTip(item, {})
}

function handleClickOutside(e) {
  if (!detailTip.visible) return
  const el = document.querySelector('.detail-tip')
  if (el && !el.contains(e.target)) detailTip.visible = false
}

function getExtraStatName(key) {
  const map = {
    atk: '攻击力',
    atkPercent: '攻击力%',
    def: '防御力',
    defPercent: '防御力%',
    hp: '生命值',
    hpPercent: '生命值%',
    mp: '魔法值',
    critRate: '暴击率',
    critDmg: '暴击伤害',
    trueDmg: '真实伤害',
    speed: '速度',
    dodge: '闪避',
    fireDmgPercent: '火属性攻击%',
    iceDmgPercent: '冰属性攻击%',
    thunderDmgPercent: '雷属性攻击%',
    holyDmgPercent: '圣属性攻击%',
    darkDmgPercent: '暗属性攻击%',
    windDmgPercent: '风属性攻击%',
    grassDmgPercent: '草属性攻击%',
    rockDmgPercent: '岩属性攻击%',
    steelDmgPercent: '钢属性攻击%',
  }
  return map[key] || key
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>


<style scoped>
/* 保留原有所有样式，只删除 .tooltip 相关样式 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel {
  width: 90vw; height: 90vh; background: rgba(15,25,45,0.92);
  border: 2px solid #b89a6a; border-radius: 24px;
  color: #ffd; font-family: 'Press Start 2P', cursive;
  padding: 24px; position: relative; overflow-y: auto;
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
  border-radius: 10px; padding: 8px 16px; font-size: 9px;
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
}

.acc-body {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.acc-name {
  font-size: 10px;
  font-weight: bold;
  color: #ffe4b5;
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

/* 详情浮层 */
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
}
.detail-tip-content { display: flex; gap: 12px; }
.compare-card {
  width: 130px; flex-shrink: 0;
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255,215,0,0.3);
  border-radius: 8px;
  padding: 8px;
  font-size: 8px;
  color: #ccc;
}
.compare-title {
  font-size: 9px; color: #ffd700; margin-bottom: 6px;
  border-bottom: 1px solid rgba(255,215,0,0.3); padding-bottom: 4px;
}
.compare-name { font-size: 10px; font-weight: bold; margin-bottom: 4px; }
.detail-info { flex: 1; min-width: 0; }
.tip-name { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
.tip-quality { font-size: 9px; margin-bottom: 8px; }
.tip-stats { display: flex; gap: 16px; margin: 6px 0; font-size: 9px; }
.tip-stat-row { display: flex; align-items: center; gap: 4px; }
.tip-affixes { margin-top: 8px; border-top: 1px solid rgba(255,215,0,0.3); padding-top: 6px; }
.tip-set { margin-top: 8px; border-top: 1px solid rgba(255,215,0,0.3); padding-top: 6px; }
.tip-set-header { font-size: 9px; color: #ffd700; font-weight: bold; }
.tip-set-desc { font-size: 8px; color: #aaa; margin: 4px 0; }
.tip-actions { margin-top: 10px; display: flex; gap: 8px; }

.affix-tag {
  background: rgba(0,0,0,0.5); border: 1px solid rgba(184,154,106,0.3);
  border-radius: 6px; padding: 2px 8px; font-size: 8px; color: #ccc;
  display: inline-flex; align-items: center; gap: 4px; margin-right: 4px;
}
.affix-tag.fixed {
  border-color: #f0c060; background: rgba(240,192,96,0.12);
  box-shadow: 0 0 6px rgba(240,192,96,0.3);
}
.fixed-circle {
  width: 8px; height: 8px; border-radius: 50%;
  border: 2px solid #f0c060; background: transparent; flex-shrink: 0;
}
.fixed-text { color: #f0c060; font-weight: bold; }

.quality-spacer { width: 8px; flex-shrink: 0; }
.quality-chip {
  background: rgba(0,0,0,0.4); border: 1px solid #3a3a5a; border-radius: 6px;
  padding: 2px 6px; font-size: 7px; color: #888; cursor: pointer; white-space: nowrap;
}
.quality-chip.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd700; }
.quality-chip.danger { color: #ffaaaa; border-color: #8b0000; }
.quality-chip.danger:disabled { opacity: 0.3; cursor: not-allowed; }

.empty-mats { color: #666; font-size: 9px; text-align: center; padding: 20px; }

@media (max-width: 700px) {
  .layout { flex-direction: column; }
  .detail-tip { max-width: 90vw; }
}


/* 原有样式保持不变，只追加新样式 */
.acc-extra-stat {
  color: #aaa;
  font-size: 7px;
}
.tip-extra-stats {
  margin-top: 8px;
  border-top: 1px solid rgba(255,215,0,0.3);
  padding-top: 6px;
}
.tip-extra-stats .tip-stat-row {
  justify-content: space-between;
}
</style>