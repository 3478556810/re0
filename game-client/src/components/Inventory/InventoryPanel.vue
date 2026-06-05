<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>

      <div class="layout">
        <!-- 左侧装备区（使用原始CSS的 .equip-section 容器） -->
        <div class="equip-section">
          <EquipmentPanel @open-detail="openDetail" />
        </div>

        <!-- 右侧背包区（使用原始CSS的 .mats-section 容器） -->
        <div class="mats-section">
          <BackpackPanel
            :sell-mode="sellMode"
            @open-detail="openDetail"
            @refresh="refreshKey++"
          />
        </div>
      </div>

      <!-- 详情浮层 -->
      <ItemDetailTip
        v-if="detail.visible"
        :item="detail.item"
        :slot-key="detail.slotKey"
        :show-unequip="detail.showUnequip"
        @close="detail.visible = false"
        @unequip="unequipSlot"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'
import EquipmentPanel from './EquipmentPanel.vue'
import BackpackPanel from './BackpackPanel.vue'
import ItemDetailTip from './ItemDetailTip.vue'
import './InventoryPanel.css'

const store = useGameStore()
const props = defineProps({ sellMode: Boolean })
const emit = defineEmits(['close'])

const refreshKey = ref(0)

const detail = reactive({
  visible: false,
  item: null,
  slotKey: null,
  showUnequip: false
})

function openDetail({ item, slotKey, showUnequip = false }) {
  detail.visible = true
  detail.item = item
  detail.slotKey = slotKey || item?.part
  detail.showUnequip = showUnequip
}

function unequipSlot(slotKey) {
  const item = store.equipment[slotKey]
  if (!item) return
  store.inventory.push(item)
  store.equipment[slotKey] = null
  store.save()
  detail.visible = false
  refreshKey.value++
}
</script>