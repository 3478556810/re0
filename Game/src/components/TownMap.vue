<template>
  <div class="town-overlay">
 

    <!-- 标题栏 -->
    <div class="town-header">
      <h2>{{ townName }}</h2>
      <p>{{ weather }} · 第 {{ currentFloor }} 层入口</p>
    </div>

    <!-- 地图网格 -->
    <div class="map-grid" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }">
      <div
        v-for="(cell, idx) in flatCells"
        :key="idx"
        class="map-cell"
        :class="cell.type"
        @click="cell.building && handleClick(cell.building)"
      >
      
        <template v-if="cell.building">
          <Icon :icon="cell.building.icon" class="cell-icon" />
          <span class="cell-label">{{ cell.building.label }}</span>
        </template>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { generateTownGrid, CELL_TYPE } from '../utils/mapGenerator'

const props = defineProps({
  dungeonName: { type: String, default: '神秘地下城' },
  currentFloor: { type: Number, default: 1 }
})

const emit = defineEmits(['close', 'startBattle', 'triggerStory', 'openMine'])
const store = useGameStore()

const rows = 8
const cols = 10
const townName = computed(() => props.dungeonName + ' · 前哨镇')
const weather = ref('晴')

const grid = ref(generateTownGrid(rows, cols))
const flatCells = computed(() => grid.value.flat())
import { inject } from 'vue'
const showToast = inject('showToast', (msg) => alert(msg))
function handleClick(building) {
  console.log('点击了建筑:', building)
  if (!building || !building.action) return
  switch (building.action) {
    case 'mine':
  emit('openMine')
  break
    case 'dungeon':
      emit('startBattle', ['slime', 'goblin'])
      break
    case 'heal':
      store.player.hp = store.player.maxHp
      store.player.mp = store.player.maxMp
      store.save()
      showToast('泉水的恩泽恢复了体力！')
      break
    case 'plaza':
      emit('triggerStory', 'plaza_event')
      break
    default:
      showToast(`${building.label}：功能开发中，敬请期待！`)
  }
}
</script>

<style scoped>
.town-overlay {
  position: fixed;
  inset: 0;
  background: #2d5a27; /* 深绿色背景，模拟草地外缘 */
  z-index: 300;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', cursive;
  color: #ffd;
}
.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  background: rgba(0,0,0,0.5);
  border: none;
  color: #ffd;
  font-size: 28px;
  cursor: pointer;
  z-index: 20;
  border-radius: 8px;
  padding: 4px;
}
.town-header {
  text-align: center;
  padding: 10px;
  background: rgba(0,0,0,0.3);
}
.town-header h2 { font-size: 18px; margin: 0; }
.town-header p { font-size: 9px; color: #b89aa5; }

.map-grid {
  display: grid;
  grid-template-rows: repeat(v-bind(rows), 1fr);
  flex: 1;
  gap: 3px;
  padding: 10px;
  background: #1e3b1e; /* 网格间的深色边框 */
}

.map-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  position: relative;
}

/* 草地 */
.map-cell.grass {
  background: #5a9e4b;
  box-shadow: inset 0 0 4px rgba(0,0,0,0.1);
}

/* 道路 */
.map-cell.road {
  background: #c4a47c;
  box-shadow: inset 0 0 3px rgba(0,0,0,0.2);
}

/* 普通建筑 */
.map-cell.building {
  background: #f5e6d3;
  cursor: pointer;
  border: 2px solid #b89a6a;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.map-cell.building:hover {
  background: #ffe8d6;
  border-color: #ffd700;
}

/* 地下城入口（中心） */
.map-cell.center {
  background: #e74c3c;
  cursor: pointer;
  border: 3px solid #ffd700;
  box-shadow: 0 0 12px rgba(255,215,0,0.5);
}
.map-cell.center:hover {
  background: #f06050;
}

.cell-icon {
  font-size: 28px;
  color: #4a2a2a;
}
.map-cell.center .cell-icon {
  font-size: 34px;
  color: #fff;
}
.cell-label {
  font-size: 7px;
  margin-top: 3px;
  color: #2c1a2a;
  text-align: center;
  line-height: 1.2;
}
</style>