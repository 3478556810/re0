<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" />
      </button>
      <h2><Icon icon="mdi:anvil" /> 锻造</h2>

      <div class="forge-layout">
        <!-- 左侧配方列表 -->
        <div class="recipes-section">
          <div class="recipe-card" v-for="recipe in recipes" :key="recipe.name">
            <div class="recipe-header">
              <Icon :icon="recipe.part === 'weapon' ? 'mdi:sword' : 'mdi:shield'" />
              <span class="recipe-name">{{ recipe.name }}</span>
              <span class="recipe-quality" :class="recipe.quality">{{ recipe.quality }}</span>
            </div>
            <div class="recipe-mats">
              <div v-for="(qty, matId) in recipe.needs" :key="matId" class="mat-requirement">
                <Icon :icon="materialIcon(matId)" class="mat-icon-small" />
                <span>{{ getMaterialDisplay(matId) }}</span>
                <span class="mat-qty">x{{ qty }}</span>
                <span v-if="hasMaterial(matId, qty)" class="check">✔️</span>
                <span v-else class="cross">✖️</span>
              </div>
            </div>
            <button
              class="pixel-btn primary"
              :disabled="!canCraft(recipe)"
              @click="craft(recipe)"
            >
              <Icon icon="mdi:hammer" /> 制作
            </button>
          </div>
        </div>

        <!-- 右侧玩家材料 -->
        <div class="materials-section">
          <h3><Icon icon="mdi:package-variant-closed" /> 我的材料</h3>
          <div class="materials-grid">
            <div
              v-for="(mat, id) in store.materials"
              :key="id"
              class="material-cell"
              :class="{ low: mat.qty < 5 }"
            >
              <Icon :icon="materialIcon(id)" class="mat-icon" />
            <span class="mat-name">{{ store.getMaterialName(id) }}</span>
              <span class="mat-qty">{{ mat.qty }}</span>
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
import { useGameStore } from '../store/gameStore'

import { Icon } from '@iconify/vue'

const store = useGameStore()

const recipes = [
  { name: '铁剑', needs: { iron_ore: 2 }, part: 'weapon', atk: 10, quality: 'white' },
  { name: '龙鳞甲', needs: { dragon_scale: 3 }, part: 'armor', def: 15, quality: 'blue' }
]

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

function hasMaterial(id, need) {
  const mat = store.materials[id]
  return mat && mat.qty >= need
}

function canCraft(recipe) {
  return Object.entries(recipe.needs).every(([id, qty]) => hasMaterial(id, qty))
}

function craft(recipe) {
  if (!canCraft(recipe)) {
    alert('材料不足！')
    return
  }
  for (const [matId, qty] of Object.entries(recipe.needs)) {
    store.materials[matId].qty -= qty
    if (store.materials[matId].qty === 0) delete store.materials[matId]
  }
  const item = {
    id: `${recipe.part}_${Date.now()}`,
    name: recipe.name,
    part: recipe.part,
    atk: recipe.atk || 0,
    def: recipe.def || 0,
    quality: recipe.quality
  }
  store.equipment[recipe.part] = item
  store.save()
  alert(`成功制作 ${recipe.name}！`)
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(10px);
  display: flex; justify-content: center; align-items: center;
  z-index: 200;
}
.panel {
  width: 850px;
  max-width: 95vw;
  height: 85vh;
  background: rgba(15,25,45,0.95);
  backdrop-filter: blur(20px);
  border: 2px solid #b89a6a;
  border-radius: 24px;
  padding: 24px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  display: flex;
  flex-direction: column;
  position: relative;
}
.close-btn {
  position: absolute;
  top: 15px; right: 15px;
  background: none;
  border: none;
  color: #ffd;
  font-size: 22px;
  cursor: pointer;
  transition: transform 0.2s;
}
.close-btn:hover { transform: scale(1.2); }
h2 {
  font-size: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.forge-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

.recipes-section {
  width: 45%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-right: 10px;
}

.recipe-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,215,0,0.3);
  border-radius: 16px;
  padding: 15px;
}

.recipe-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.recipe-name {
  font-size: 12px;
  flex: 1;
}
.recipe-quality {
  font-size: 8px;
  padding: 2px 10px;
  border-radius: 20px;
  background: rgba(255,255,255,0.1);
  text-transform: uppercase;
}
.recipe-quality.white { color: #ccc; }
.recipe-quality.blue { color: #6ea8fe; }

.recipe-mats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.mat-requirement {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 8px;
  background: rgba(0,0,0,0.3);
  padding: 4px 8px;
  border-radius: 8px;
}
.mat-icon-small {
  font-size: 14px;
}
.mat-qty {
  font-weight: bold;
}
.check { color: #4caf50; }
.cross { color: #f44336; }

.pixel-btn.primary {
  background: rgba(255,215,0,0.15);
  display: flex;
  align-items: center;
  gap: 6px;
}

.materials-section {
  flex: 1;
  background: rgba(0,0,0,0.2);
  border-radius: 16px;
  padding: 15px;
  overflow-y: auto;
}
.materials-section h3 {
  font-size: 12px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
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
.material-cell.low {
  opacity: 0.6;
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
  opacity: 0.6;
  padding: 30px;
}

/* 滚动条美化 */
.recipes-section::-webkit-scrollbar,
.materials-section::-webkit-scrollbar {
  width: 5px;
}
.recipes-section::-webkit-scrollbar-track,
.materials-section::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.05);
}
.recipes-section::-webkit-scrollbar-thumb,
.materials-section::-webkit-scrollbar-thumb {
  background: rgba(255,215,0,0.4);
  border-radius: 3px;
}
</style>