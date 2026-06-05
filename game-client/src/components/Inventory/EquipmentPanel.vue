<template>
  <div>
    <h2 class="section-title"><Icon icon="mdi:shield-sword" /> 装备</h2>
    <div class="equip-columns">
      <!-- 左列：武器/防具 -->
      <div class="equip-col">
        <h3><Icon icon="mdi:sword-cross" /> 武器 / 防具</h3>
        <div class="equip-slot" v-for="slot in leftSlots" :key="slot.key">
          <div class="slot-label">{{ slot.label }}</div>
          <div
            class="slot-item"
            :class="[{ empty: !store.equipment[slot.key] }, equipQualityClass(slot.key)]"
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

      <!-- 右列：饰品 -->
      <div class="equip-col">
        <h3><Icon icon="mdi:gem" /> 饰品</h3>
        <div class="equip-slot" v-for="slot in rightSlots" :key="slot.key">
          <div class="slot-label">{{ slot.label }}</div>
          <div
            class="slot-item"
            :class="[{ empty: !store.equipment[slot.key] }, equipQualityClass(slot.key)]"
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
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'

const store = useGameStore()
const emit = defineEmits(['open-detail'])

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

function equipQualityClass(slotKey) {
  const item = store.equipment[slotKey]
  return item ? `quality-${item.quality || 'white'}` : ''
}

function openSlotDetail(slotKey) {
  const item = store.equipment[slotKey]
  if (item) emit('open-detail', { item, slotKey, showUnequip: true })
}
</script>