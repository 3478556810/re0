<template>
  <div>
    <h2 class="section-title"><Icon icon="mdi:package-variant-closed" /> 背包</h2>

    <!-- 标签栏 + 品质筛选 + 删除/多选全部挤在一行 -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <Icon :icon="tab.icon" /> {{ tab.label }}
      </button>
      <template v-if="activeTab === 'equip' || activeTab === 'accessory'">
        <span class="quality-spacer"></span>
        <button
          v-for="q in qualityOptions"
          :key="q.value"
          :class="['quality-chip', { active: qualityFilter === q.value }]"
          @click="qualityFilter = q.value"
        >{{ q.label }}</button>
        <button
          class="quality-chip danger"
          @click="batchDelete"
          :disabled="currentFilteredItems.length === 0"
        ><Icon icon="mdi:delete-sweep" /></button>

        <!-- 多选按钮（靠右） -->
        <button
          class="quality-chip"
          style="margin-left: auto;"
          @click="toggleMultiSelect"
        >
          <Icon :icon="multiSelectMode ? 'mdi:close-circle' : 'mdi:checkbox-multiple-blank'" />
          {{ multiSelectMode ? '取消' : '多选' }}
        </button>
        <button
          v-if="multiSelectMode && selectedItems.size > 0"
          class="quality-chip danger"
          @click="deleteSelected"
        >删除选中({{ selectedItems.size }})</button>
      </template>
    </div>

    <!-- 装备 / 饰品网格 -->
    <div class="tab-content" v-if="activeTab === 'equip' || activeTab === 'accessory'">
      <div v-if="filteredItems.length === 0" class="empty-mats">暂无物品</div>
      <div v-else class="acc-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="acc-card"
          :class="[ 'quality-' + item.quality, { selected: multiSelectMode && selectedItems.has(item.id) } ]"
          @click="onItemClick(item)"
        >
          <input
            v-if="multiSelectMode"
            type="checkbox"
            :checked="selectedItems.has(item.id)"
            @click.stop
            class="select-checkbox"
          />
          <div class="acc-body">
            <div class="acc-name" :style="{ color: qualityColor(item.quality) }">
              {{ item.name }}<span class="acc-level">Lv.{{ item.level || 1 }}</span>
            </div>
            <div class="acc-stats">
              <span v-if="item.atk > 0">攻+{{ item.atk }}</span>
              <span v-if="item.def > 0">防+{{ item.def }}</span>
              <span v-for="(val, key) in item.extraStats" :key="key" class="acc-extra-stat">
                {{ getExtraStatName(key) }}+{{ val }}
              </span>
            </div>
          </div>
          <div class="acc-actions" v-if="!multiSelectMode">
            <button class="pixel-btn primary small" @click.stop="equipItem(item)">装备</button>
            <button class="pixel-btn danger small" @click.stop="deleteItem(item)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 材料 -->
    <MaterialGrid v-if="activeTab === 'material'" :sell-mode="sellMode" />


<!-- 宝石（解耦为独立组件） -->
<GemBagPanel v-if="activeTab === 'gem'" @refresh="emit('refresh')" />
  </div>
</template>

<script setup>
import { ref, computed, inject, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'
import { qualityColor, getExtraStatName } from '@/composables/useEquipment'
import MaterialGrid from './MaterialGrid.vue'
import GemBagPanel from './GemBagPanel.vue'

const showToast = inject('showToast', (msg) => alert(msg))

const store = useGameStore()
const emit = defineEmits(['open-detail', 'refresh'])
const props = defineProps({ sellMode: Boolean })
const showConfirm = inject('showConfirm', (msg) => Promise.resolve(confirm(msg)))

const activeTab = ref(props.sellMode ? 'material' : 'equip')
const tabs = [
  { key: 'equip', label: '装备', icon: 'mdi:sword-cross' },
  { key: 'accessory', label: '饰品', icon: 'mdi:gem' },
  { key: 'material', label: '材料', icon: 'mdi:cube-outline' },
  { key: 'gem', label: '宝石', icon: 'mdi:rhombus-split' }
]

const qualityFilter = ref('all')
const qualityOptions = [
  { label: '全部', value: 'all' },
  { label: '普通', value: 'white' },
  { label: '优秀', value: 'green' },
  { label: '精良', value: 'blue' },
  { label: '史诗', value: 'purple' },
  { label: '传说', value: 'red' }
]

const multiSelectMode = ref(false)
const selectedItems = reactive(new Set())





function toggleMultiSelect() {
  multiSelectMode.value = !multiSelectMode.value
  if (!multiSelectMode.value) selectedItems.clear()
}

const accessorySlotKeys = ['necklace','ring1','ring2','earring1','earring2']
const equipmentItems = computed(() =>
  (store.inventory || []).filter(item => {
    if (!item) return false
    if (item.part && !accessorySlotKeys.includes(item.part)) return true
    if ((item.type === 'weapon' || item.type === 'armor' || item.atk || item.def) && !item.part) return true
    return false
  })
)
const accessoryItems = computed(() =>
  (store.inventory || []).filter(item => item?.part && accessorySlotKeys.includes(item.part))
)

const filteredItems = computed(() => {
  const list = activeTab.value === 'equip' ? equipmentItems.value : accessoryItems.value
  if (qualityFilter.value === 'all') return list
  return list.filter(item => item.quality === qualityFilter.value)
})
const currentFilteredItems = computed(() => filteredItems.value)




function onItemClick(item) {
  if (multiSelectMode.value) {
    if (selectedItems.has(item.id)) selectedItems.delete(item.id)
    else selectedItems.add(item.id)
  } else {
    emit('open-detail', { item })
  }
}

async function equipItem(item) {
  if (!item?.part) return
  const idx = store.inventory.findIndex(i => i.id === item.id)
  if (idx === -1) return
  if (store.equipment[item.part]) store.inventory.push(store.equipment[item.part])
  store.equipment[item.part] = store.inventory.splice(idx, 1)[0]
  store.save()
  emit('refresh')
}

async function deleteItem(item) {
  const ok = await showConfirm(`确定要删除「${item.name}」吗？`)
  if (!ok) return
  const idx = store.inventory.indexOf(item)
  if (idx > -1) store.inventory.splice(idx, 1)
  store.save()
  emit('refresh')
}

async function batchDelete() {
  const items = currentFilteredItems.value
  if (items.length === 0) return
  const ok = await showConfirm(`确定要删除当前显示的 ${items.length} 件物品吗？`)
  if (!ok) return
  for (const item of items) {
    const idx = store.inventory.indexOf(item)
    if (idx > -1) store.inventory.splice(idx, 1)
  }
  store.save()
  emit('refresh')
}

async function deleteSelected() {
  if (selectedItems.size === 0) return
  const ok = await showConfirm(`确定要删除选中的 ${selectedItems.size} 件物品吗？`)
  if (!ok) return
  for (const id of selectedItems) {
    const idx = store.inventory.findIndex(i => i.id === id)
    if (idx > -1) store.inventory.splice(idx, 1)
  }
  store.save()
  selectedItems.clear()
  multiSelectMode.value = false
  emit('refresh')
}




</script>