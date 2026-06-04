<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="result-panel pixel-panel">
      <!-- 标题 -->
      <h2 class="title">
        <Icon icon="mdi:trophy" />
        战斗胜利！
        <span class="exp-inline">经验 +{{ displayedExp }}</span>
      </h2>

      <!-- 奖励区域（紧凑竖向排列） -->
      <div class="reward-list">
        <!-- 材料 -->
        <div class="reward-row" v-if="reward.materials && reward.materials.length">
          <div class="section-label"><Icon icon="mdi:package-variant-closed" /> 材料</div>
          <div class="grid-area">
            <div v-for="(m, idx) in reward.materials" :key="m.id + idx" class="material-card">
              <Icon :icon="materialIcon(m.id)" class="mat-icon" />
              <span class="mat-name">{{ getMaterialName(m.id) }}</span>
              <span class="mat-qty" v-if="m.qty > 1">x{{ m.qty }}</span>
            </div>
          </div>
        </div>

        <!-- 饰品 -->
        <div class="reward-row" v-if="reward.accessories && reward.accessories.length">
          <div class="section-label"><Icon icon="mdi:gem" /> 饰品</div>
          <div class="grid-area">
            <div v-for="acc in reward.accessories" :key="acc.id" class="acc-card">
              <Icon :icon="acc.icon || 'mdi:ring'" class="mat-icon" />
              <span class="mat-name" :style="{ color: qualityColor(acc.quality) }">{{ acc.name }}</span>
            </div>
          </div>
        </div>

        <!-- 装备（无属性详情） -->
        <div class="reward-row" v-if="reward.equipments && reward.equipments.length">
          <div class="section-label"><Icon icon="mdi:sword" /> 装备</div>
          <div class="grid-area">
            <div v-for="eq in reward.equipments" :key="eq.id" class="acc-card">
              <Icon :icon="equipmentIcon(eq.part)" class="mat-icon" />
              <span class="mat-name" :style="{ color: qualityColor(eq.quality) }">{{ eq.name }}</span>
            </div>
          </div>
        </div>

        <!-- 完全无掉落时显示 -->
        <div v-if="!hasAnyReward" class="empty-row">无战利品</div>
      </div>

      <!-- 底部按钮 -->
      <div class="buttons">
        <button class="pixel-btn primary" @click="$emit('next')" v-if="showDungeon">
          <Icon icon="mdi:arrow-down-bold" /> 下一层
        </button>
        <button class="pixel-btn warning" @click="$emit('retreat')" v-if="showDungeon">
          <Icon icon="mdi:exit-run" /> 撤退
        </button>
        <button class="pixel-btn primary" @click="$emit('close')" v-if="!showDungeon">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const props = defineProps({
  reward: Object,
  showDungeon: Boolean
})
const emit = defineEmits(['close', 'next', 'retreat'])
const store = useGameStore()

const displayedExp = ref(0)
let animFrame = null

watch(() => props.reward?.exp, (newExp) => {
  if (!newExp || newExp <= 0) return
  const target = newExp
  const duration = 800
  const startTime = performance.now()
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    displayedExp.value = Math.floor(progress * target)
    if (progress < 1) {
      animFrame = requestAnimationFrame(animate)
    }
  }
  requestAnimationFrame(animate)
}, { immediate: true })

const hasAnyReward = computed(() => {
  const r = props.reward
  return (r.materials?.length || r.accessories?.length || r.equipments?.length) > 0
})

function getMaterialName(id) {
  return store.getMaterialName(id)
}

function materialIcon(id) {
  const icons = {
    slime_gel: 'mdi:water',
    goblin_fang: 'mdi:tooth',
    spider_silk: 'mdi:spider-web',
    bat_wing: 'mdi:bat',
    small_magic_stone: 'mdi:magic-staff',
    iron_ore: 'mdi:mine',
    silver_ore: 'memory:coin-silver',
    gold_ore: 'mdi:gold',
    crystal_shard: 'mdi:diamond-stone',
    obsidian: 'mdi:circle-multiple',
    dragon_ore: 'mdi:dragon',
    dungeon_token: 'mdi:castle',
  }
  return icons[id] || 'mdi:circle'
}

function qualityColor(q) {
  const map = { white: '#ccc', green: '#4caf50', blue: '#2196f3', purple: '#9c27b0', red: '#ff4444' }
  return map[q] || '#ccc'
}

function equipmentIcon(part) {
  const map = {
    weapon: 'mdi:sword',
    armor: 'mdi:shield-outline',
    helmet: 'mdi:hard-hat',
    pants: 'mdi:jeans',
    shoes: 'mdi:shoe-print',
    gauntlet: 'mdi:hand-back-right'
  }
  return map[part] || 'mdi:sword'
}
</script>

<style scoped>
/* ========== 遮罩 ========== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  padding: 12px;
}

/* ========== 面板：自适应高度，宽度正方形比例 ========== */
.result-panel {
  background: rgba(15, 25, 45, 0.95);
  border: 2px solid #b89a6a;
  border-radius: 20px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  box-shadow: 0 0 40px rgba(0,0,0,0.6);
  width: min(85vw, 85vh, 450px);
  max-width: 450px;
  height: auto;                     /* 高度由内容决定 */
  max-height: 90vh;                 /* 防止过高 */
  display: flex;
  flex-direction: column;
  padding: 12px 10px 10px;
  box-sizing: border-box;
  text-align: center;
}

/* ========== 标题 ========== */
.title {
  font-size: clamp(12px, 2.5vw, 16px);
  color: #ffd700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}
.exp-inline {
  font-size: 0.8em;
  background: rgba(255,215,0,0.1);
  padding: 2px 8px;
  border-radius: 14px;
}

/* ========== 奖励列表（紧凑） ========== */
.reward-list {
  flex-shrink: 0;                   /* 不拉伸 */
  display: flex;
  flex-direction: column;
  gap: 6px;                         /* 类别间距小 */
  margin-bottom: 8px;
}

.reward-row {
  margin-bottom: 0;
}

/* 分类标题 */
.section-label {
  font-size: clamp(8px, 1.5vw, 10px);
  color: #ccc;
  margin-bottom: 4px;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 网格内容区（自动填满横向，无多余空白） */
.grid-area {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
  gap: 4px;
}

/* 材料卡片 */
.material-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 4px 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.mat-icon { font-size: 16px; color: #ffd700; }
.mat-name { font-size: clamp(5px, 0.9vw, 7px); color: #ddd; text-align: center; word-break: break-all; line-height: 1.2; }
.mat-qty { font-size: 5px; color: #aaa; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 8px; }

/* 饰品 / 装备卡片（极简） */
.acc-card {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(184,154,106,0.3);
  border-radius: 8px;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

/* 空状态 */
.empty-row {
  text-align: center;
  color: #666;
  font-size: 8px;
  padding: 12px 0;
}

/* ========== 按钮区 ========== */
.buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-shrink: 0;
}
.pixel-btn {
  background: #2a2a3a;
  border: 2px solid #b89a6a;
  color: #ffd;
  font-family: inherit;
  padding: 5px 12px;
  font-size: clamp(7px, 1.2vw, 9px);
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: 0.2s;
}
.pixel-btn:hover { background: #3a3a5a; }
.pixel-btn.primary { background: rgba(255,215,0,0.15); border-color: #ffd700; }
.pixel-btn.warning { background: rgba(255,165,0,0.15); border-color: #ffa500; }
</style>