<template>
  <Teleport to="body">
    <div class="detail-tip-overlay" @click.self="$emit('close')">
      <div class="detail-tip">
        <div class="detail-tip-content">
          <!-- 当前装备对比 -->
          <!-- 当前装备对比 -->
<div v-if="compareItem" class="compare-card">
  <div class="compare-title">当前装备</div>
  <div class="compare-name" :style="{ color: qualityColor(compareItem.quality) }">
    {{ compareItem.name }}<span class="acc-level">Lv.{{ compareItem.level || 1 }}</span>
  </div>
  <div class="tip-stats">
    <span v-if="compareItem.atk > 0">攻+{{ compareItem.atk }}</span>
    <span v-if="compareItem.def > 0">防+{{ compareItem.def }}</span>
  </div>
  <div v-if="compareItem.extraStats" class="tip-extra-stats">
    <div v-for="(val, key) in compareItem.extraStats" :key="key" class="tip-stat-row">
      {{ getExtraStatName(key) }} +{{ val }}
    </div>
  </div>
  <!-- 固定词条 + 随机词条 -->
  <div v-if="compareItem.affixes?.length || compareItem.fixedAffix" class="tip-affixes">
    <div v-if="compareItem.fixedAffix" class="affix-tag fixed">
      <span class="fixed-circle"></span>
      <span class="fixed-text">对Boss增伤 +{{ compareItem.bossDmgBonus || 18 }}%</span>
    </div>
    <div v-for="aff in compareItem.affixes" :key="aff.id" class="affix-tag">
      <span>{{ getAffixName(aff.id) }} Lv.{{ aff.level }}</span>
    </div>
  </div>
</div>

          <!-- 详情信息 -->
          <div class="detail-info">
            <div class="tip-name" :style="{ color: qualityColor(item.quality) }">
              {{ item.name }}<span class="acc-level">Lv.{{ item.level || 1 }}</span>
            </div>
            <div class="tip-quality" :style="{ color: qualityColor(item.quality) }">{{ qualityText(item.quality) }}</div>
            <div class="tip-stats">
              <div class="tip-stat-row" v-if="item.atk > 0"><Icon icon="mdi:sword" /> 攻击 +{{ item.atk }}</div>
              <div class="tip-stat-row" v-if="item.def > 0"><Icon icon="mdi:shield" /> 防御 +{{ item.def }}</div>
            </div>
            <div v-if="item.extraStats && Object.keys(item.extraStats).length" class="tip-extra-stats">
              <div class="tip-set-header">附加属性</div>
              <div v-for="(val, key) in item.extraStats" :key="key" class="tip-stat-row">
                <span>{{ getExtraStatName(key) }}</span><span>+{{ val }}</span>
              </div>
            </div>
            <div v-if="item.affixes?.length || item.fixedAffix" class="tip-affixes">
  <!-- 固定词条（Boss增伤）独立显示 -->
  <div v-if="item.fixedAffix" class="affix-tag fixed">
    <span class="fixed-circle"></span>
    <span class="fixed-text">对Boss增伤 +{{ item.bossDmgBonus || 18 }}%</span>
  </div>
  <!-- 随机词条 -->
  <div v-for="aff in item.affixes" :key="aff.id" class="affix-tag">
    <span>{{ getAffixName(aff.id) }} Lv.{{ aff.level }}</span>
  </div>
</div>
            <div v-if="setBonus" class="tip-set">
              <div class="tip-set-header">{{ setBonus.name }} ({{ setBonus.count }}/{{ setBonus.required }})</div>
              <div class="tip-set-desc">{{ setBonus.desc }}</div>
            </div>
          </div>
        </div>
        <div class="tip-actions" v-if="showUnequip">
          <button class="pixel-btn danger small" @click="$emit('unequip', slotKey)">卸下</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'
import { qualityColor, qualityText, getExtraStatName } from '@/composables/useEquipment'
import { AFFIX_EFFECTS } from '@/config/accessoryConfig'

const store = useGameStore()
const props = defineProps({
  item: Object,
  slotKey: String,
  showUnequip: Boolean
})
const emit = defineEmits(['close', 'unequip'])

const setNames = { dragon_set: '龙骸', shadow_set: '暗影咒装', crimson_set: '血怒' }

const compareItem = computed(() => {
  const slot = props.item?.part || props.slotKey
  if (slot && store.equipment[slot]) return store.equipment[slot]
  return null
})

const setBonus = computed(() => {
  if (!props.item?.setId) return null
  const info = store.activeSetBonuses?.[props.item.setId]
  if (!info) return null
  return {
    name: setNames[props.item.setId] || props.item.setId,
    count: info.count,
    required: info.required,
    desc: info.bonus?.desc || ''
  }
})

function getAffixName(id) {
  if (id === 'bossDmgFix') return '对Boss增伤'
  return AFFIX_EFFECTS[id]?.name || id
}
</script>