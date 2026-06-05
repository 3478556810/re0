<template>
  <div class="tab-content">
    <div v-if="sellMode" class="sell-info">
      <Icon icon="mdi:cash-multiple" /> 金币：{{ store.player.gold }} G
    </div>
    <div class="materials-grid">
      <div
        v-for="(mat, id) in store.materials" :key="id"
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'

const props = defineProps({ sellMode: Boolean })
const store = useGameStore()

const showSellDialog = ref(false)
const selectedMatId = ref('')
const sellQty = ref(1)

const maxSellQty = computed(() => store.materials[selectedMatId.value]?.qty || 0)
const unitPrice = computed(() => store.config.materialDefinitions.find(m => m.id === selectedMatId.value)?.price || 1)
const totalPrice = computed(() => unitPrice.value * sellQty.value)

function materialIcon(id) {
  const icons = {
    slime_gel: 'mdi:water', goblin_fang: 'mdi:tooth', scorpion_tail: 'mdi:needle',
    iron_ore: 'mdi:mine', dragon_scale: 'mdi:shield-sun'
  }
  return icons[id] || 'mdi:circle'
}

function openSellDialog(id) {
  if (!props.sellMode) return
  selectedMatId.value = id
  sellQty.value = 1
  showSellDialog.value = true
}

function changeSellQty(delta) {
  const newVal = sellQty.value + delta
  if (newVal >= 1 && newVal <= maxSellQty.value) sellQty.value = newVal
}

function confirmSell() {
  const mat = store.materials[selectedMatId.value]
  if (!mat || sellQty.value <= 0) return
  store.addGold(totalPrice.value)
  mat.qty -= sellQty.value
  if (mat.qty <= 0) delete store.materials[selectedMatId.value]
  store.save()
  showSellDialog.value = false
}
</script>