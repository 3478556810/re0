<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" />
      </button>

      <div class="layout">
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

        <div class="mats-section">
          <h2 class="section-title"><Icon icon="mdi:package-variant-closed" /> 背包</h2>
          <div class="accessory-inv">
            <h3 class="sub-title"><Icon icon="mdi:gem" /> 饰品</h3>
            <div v-if="accessoryItems.length === 0" class="empty-mats">暂无饰品</div>
            <div v-else class="acc-grid">
              <div
                v-for="acc in accessoryItems"
                :key="acc.id"
                class="acc-card"
                :class="'quality-' + acc.quality"
                @click="equipAccessoryFromInv(acc)"
                @mouseenter="showTooltip(acc, $event)"
                @mouseleave="hideTooltip"
              >
                <div class="acc-name" :style="{ color: qualityColor(acc.quality) }">{{ acc.name }}</div>
                <div class="acc-affixes" v-if="acc.affixes?.length">
                  <span v-for="aff in acc.affixes" :key="aff.id" class="acc-affix-tag">
                    {{ getAffixName(aff.id) }} Lv.{{ aff.level }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <h3 class="sub-title" style="margin-top: 10px;"><Icon icon="mdi:cube-outline" /> 材料</h3>
          <div class="materials-grid">
            <div v-for="(mat, id) in store.materials" :key="id" class="material-cell">
              <Icon :icon="materialIcon(id)" class="mat-icon" />
              <span class="mat-name">{{ getMaterialDisplay(id) }}</span>
              <span class="mat-qty">x{{ mat.qty }}</span>
            </div>
            <div v-if="Object.keys(store.materials).length === 0" class="empty-mats">暂无材料</div>
          </div>
        </div>
      </div>

      <!-- 悬浮提示 -->
      <div v-if="tooltip.visible" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <div class="tooltip-name" :style="{ color: tooltip.qualityColor }">{{ tooltip.name }}</div>
        <div class="tooltip-quality" :style="{ color: tooltip.qualityColor }">
          {{ qualityText(tooltip.quality) }}
        </div>
        <div class="tooltip-stats">
          <div class="tooltip-stat-row">
            <Icon icon="mdi:sword" /> 攻击 +{{ tooltip.atk }}
          </div>
          <div class="tooltip-stat-row">
            <Icon icon="mdi:shield" /> 防御 +{{ tooltip.def }}
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
import { computed, ref, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { getMaterialDisplay } from '../config/materials'
import { AFFIX_EFFECTS } from '../config/accessoryConfig'
import '../assets/css/InventoryPanel.css'
const store = useGameStore()

const leftSlots = [
  { key: 'weapon', label: '武器', icon: 'mdi:sword' },
  { key: 'gauntlet', label: '臂甲', icon: 'mdi:arm-flex' },
  { key: 'necklace', label: '项链', icon: 'mdi:necklace' },
  { key: 'ring1', label: '左戒指', icon: 'mdi:ring' },
  { key: 'ring2', label: '右戒指', icon: 'mdi:ring' },
  { key: 'earring1', label: '左耳环', icon: 'mdi:ear-hearing' },
  { key: 'earring2', label: '右耳环', icon: 'mdi:ear-hearing' },
]

const rightSlots = [
  { key: 'helmet', label: '头盔', icon: 'mdi:hat-fedora' },
  { key: 'armor', label: '上衣', icon: 'mdi:tshirt-crew' },
  { key: 'pants', label: '下衣', icon: 'mdi:pants' },
  { key: 'shoes', label: '鞋子', icon: 'mdi:shoe-sneaker' },
]

const tooltip = reactive({
  visible: false,
  x: 0, y: 0,
  name: '', quality: '', atk: 0, def: 0,
  qualityColor: '#ffffff',
  affixes: []
})

function showTooltip(acc, event) {
  tooltip.visible = true
  tooltip.x = event.clientX + 10
  tooltip.y = event.clientY + 10
  tooltip.name = acc.name
  tooltip.quality = acc.quality
  tooltip.qualityColor = qualityColor(acc.quality)
  tooltip.atk = acc.atk || 0
  tooltip.def = acc.def || 0
  tooltip.affixes = (acc.affixes || []).map(a => ({
    ...a,
    name: getAffixName(a.id),
    desc: getAffixDesc(a.id, a.level)
  }))
}

function showSlotTooltip(slotKey, event) {
  const item = store.equipment[slotKey]
  if (!item) return
  tooltip.visible = true
  tooltip.x = event.clientX + 10
  tooltip.y = event.clientY + 10
  tooltip.name = item.name
  tooltip.quality = item.quality
  tooltip.qualityColor = qualityColor(item.quality)
  tooltip.atk = item.atk || 0
  tooltip.def = item.def || 0
  tooltip.affixes = (item.affixes || []).map(a => ({
    ...a,
    name: getAffixName(a.id),
    desc: getAffixDesc(a.id, a.level)
  }))
}

function hideTooltip() { tooltip.visible = false }

function getAffixDesc(affixId, level) {
  const effect = AFFIX_EFFECTS[affixId]
  if (!effect) return ''
  const threshold = effect.thresholds.filter(t => t.level <= level).pop()
  return threshold ? threshold.desc : ''
}

function getAffixName(affixId) {
  const effect = AFFIX_EFFECTS[affixId]
  return effect ? effect.name : affixId
}

function partIcon(part) {
  const icons = {
    earring1: 'mdi:ear-hearing',
    earring2: 'mdi:ear-hearing',
    necklace: 'mdi:necklace',
    ring1: 'mdi:ring',
    ring2: 'mdi:ring'
  }
  return icons[part] || 'mdi:gem'
}

function materialIcon(id) {
  const icons = {
    slime_gel: 'mdi:water',
    goblin_fang: 'mdi:tooth',
    scorpion_tail: 'mdi:needle',
    iron_ore: 'mdi:mine',
    dragon_scale: 'mdi:shield-sun',
  }
  return icons[id] || 'mdi:circle'
}

function qualityColor(quality) {
  const colors = { white: '#ffffff', green: '#4caf50', blue: '#2196f3', purple: '#9c27b0', red: '#ff4444' }
  return colors[quality] || '#ffffff'
}

function qualityText(quality) {
  const texts = { white: '普通', green: '精良', blue: '稀有', purple: '史诗', red: '传说' }
  return texts[quality] || quality
}

const accessoryItems = computed(() => {
  return store.inventory.filter(item => item.affixes && Array.isArray(item.affixes))
})

function equipAccessoryFromInv(acc) {
  if (!acc || !acc.part) return
  const slot = acc.part
  if (store.equipment[slot]) {
    if (!confirm(`该部位已有饰品，是否替换？`)) return
  }
  store.equipAccessory(acc, slot)
}

function unequip(slot) {
  if (store.equipment[slot]) {
    store.unequip(slot)
  }
}
</script>

