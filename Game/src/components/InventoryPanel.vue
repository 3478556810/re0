<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" />
      </button>

      <div class="layout">
        <!-- 左侧：装备栏 -->
        <div class="equip-section">
          <h2 class="section-title"><Icon icon="mdi:shield-sword" /> 装备</h2>
          <div class="equip-columns">
            <!-- 攻击列 -->
            <div class="equip-col">
              <h3><Icon icon="mdi:sword-cross" /> 攻击</h3>
              <div class="equip-slot" v-for="slot in leftSlots" :key="slot.key">
                <div class="slot-label">{{ slot.label }}</div>
                <div
                  class="slot-item"
                  :class="{ empty: !store.equipment[slot.key] }"
                  @click="unequip(slot.key)"
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
            <!-- 防御/饰品列 -->
            <div class="equip-col">
              <h3><Icon icon="mdi:shield" /> 防御 / 饰品</h3>
              <div class="equip-slot" v-for="slot in rightSlots" :key="slot.key">
                <div class="slot-label">{{ slot.label }}</div>
                <div
                  class="slot-item"
                  :class="{ empty: !store.equipment[slot.key] }"
                  @click="unequip(slot.key)"
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

        <!-- 右侧：材料背包 -->
        <div class="mats-section">
          <h2 class="section-title"><Icon icon="mdi:package-variant-closed" /> 背包</h2>
          <div class="materials-grid">
            <div
              v-for="(mat, id) in store.materials"
              :key="id"
              class="material-cell"
            >
              <Icon :icon="materialIcon(id)" class="mat-icon" />
              <span class="mat-name">{{ getMaterialDisplay(id) }}</span>
              <span class="mat-qty">x{{ mat.qty }}</span>
            </div>
            <div v-if="Object.keys(store.materials).length === 0" class="empty-mats">
              暂无材料
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { getMaterialDisplay } from '../config/materials'

const store = useGameStore()

// 左侧攻击装备槽
// 左侧攻击装备（含武器、臂甲、耳环、项链）
const leftSlots = [
  { key: 'weapon', label: '武器', icon: 'mdi:sword' },
  { key: 'gauntlet', label: '臂甲', icon: 'mdi:arm-flex' },
  { key: 'earring1', label: '左耳环', icon: 'mdi:ear-hearing' },
  { key: 'earring2', label: '右耳环', icon: 'mdi:ear-hearing' },
  { key: 'necklace1', label: '左项链', icon: 'mdi:necklace' },
  { key: 'necklace2', label: '右项链', icon: 'mdi:necklace' },
]

// 右侧防御装备（仅头盔、上衣、下衣、鞋子）
const rightSlots = [
  { key: 'helmet', label: '头盔', icon: 'mdi:hat-fedora' },
  { key: 'armor', label: '上衣', icon: 'mdi:tshirt-crew' },
  { key: 'pants', label: '下衣', icon: 'mdi:pants' },
  { key: 'shoes', label: '鞋子', icon: 'mdi:shoe-sneaker' },
]
function unequip(slot) {
  if (store.equipment[slot]) {
    store.unequip(slot)
  }
}

// 材料图标映射
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
</script>

<style scoped>
/* 全屏覆盖 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(15px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

/* 主面板 - 几乎满屏 */
.panel {
  width: 95vw;
  height: 90vh;
  background: rgba(15, 25, 45, 0.95);
  backdrop-filter: blur(25px);
  border: 2px solid #b89a6a;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  padding: 20px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #ffd;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 10;
}
.close-btn:hover {
  transform: scale(1.2);
}

/* 左右布局 */
.layout {
  display: flex;
  gap: 20px;
  height: 100%;
  overflow: hidden;
}

.equip-section {
  width: 45%;
  display: flex;
  flex-direction: column;
}

.mats-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 14px;
  margin-bottom: 15px;
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 装备双列 */
.equip-columns {
  display: flex;
  gap: 15px;
  flex: 1;
  overflow-y: auto;
}

.equip-col {
  flex: 1;
  background: rgba(255,255,255,0.03);
  border-radius: 16px;
  padding: 12px;
}

.equip-col h3 {
  font-size: 10px;
  margin-bottom: 12px;
  color: #ccc;
  display: flex;
  align-items: center;
  gap: 6px;
}

.equip-slot {
  margin-bottom: 10px;
}

.slot-label {
  font-size: 7px;
  color: #aaa;
  margin-bottom: 4px;
}

.slot-item {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,215,0,0.25);
  border-radius: 10px;
  padding: 8px;
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.slot-item:hover {
  background: rgba(255,215,0,0.15);
}

.slot-item.empty {
  justify-content: center;
}

.empty-icon {
  font-size: 20px;
  opacity: 0.3;
}

.item-icon {
  font-size: 18px;
  color: #ffd700;
  flex-shrink: 0;
}

.item-name {
  font-size: 8px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-remove {
  font-size: 14px;
  color: #ff4444;
  opacity: 0;
  transition: opacity 0.2s;
  position: absolute;
  right: 4px;
  top: 4px;
}
.slot-item:hover .item-remove {
  opacity: 1;
}

/* 材料网格 */
.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  align-content: start;
  padding-right: 5px;
}

.material-cell {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,215,0,0.2);
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  transition: transform 0.2s;
}
.material-cell:hover {
  transform: translateY(-2px);
  background: rgba(255,215,0,0.1);
}

.mat-icon {
  font-size: 28px;
  color: #ffd700;
}

.mat-name {
  font-size: 7px;
  color: #ccc;
  word-break: break-all;
}

.mat-qty {
  font-size: 8px;
  font-weight: bold;
  color: #ffd;
  background: rgba(0,0,0,0.5);
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-mats {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 10px;
  color: #888;
  padding: 30px;
}

/* 滚动条美化 */
.equip-columns::-webkit-scrollbar,
.materials-grid::-webkit-scrollbar {
  width: 5px;
}
.equip-columns::-webkit-scrollbar-track,
.materials-grid::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.05);
}
.equip-columns::-webkit-scrollbar-thumb,
.materials-grid::-webkit-scrollbar-thumb {
  background: rgba(255,215,0,0.4);
  border-radius: 3px;
}
</style>