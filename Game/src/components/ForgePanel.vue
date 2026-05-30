<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <h2><Icon icon="mdi:anvil" /> 锻造</h2>

      <div class="forge-layout">
        <div class="recipes-section">
          <div class="recipe-card" v-for="recipe in store.config.forgeRecipes" :key="recipe.id">
            <div class="recipe-header">
              <Icon :icon="recipe.icon || 'mdi:sword'" />
              <span class="recipe-name">{{ recipe.name }}</span>
              <span class="recipe-quality" :style="{ color: qualityColor(recipe.quality) }">
                {{ qualityLabel(recipe.quality) }}
              </span>
            </div>
            <div class="recipe-mats">
              <div v-for="mat in recipe.materials" :key="mat.id" class="mat-requirement">
                <Icon :icon="materialIcon(mat.id)" class="mat-icon-small" />
                <span>{{ store.getMaterialName(mat.id) }}</span>
                <span class="mat-qty">x{{ mat.qty }}</span>
                <span v-if="hasMaterial(mat.id, mat.qty)" class="check">✔️</span>
                <span v-else class="cross">✖️</span>
              </div>
              <div class="mat-requirement gold">
                <Icon icon="mdi:cash-multiple" class="mat-icon-small" />
                <span>{{ recipe.goldCost }}G</span>
                <span v-if="store.player.gold >= recipe.goldCost" class="check">✔️</span>
                <span v-else class="cross">✖️</span>
              </div>
            </div>
            <button class="pixel-btn primary" :disabled="!canCraft(recipe)" @click="craft(recipe)">
              <Icon icon="mdi:hammer" /> 制作
            </button>
          </div>
          <div v-if="store.config.forgeRecipes.length === 0" class="empty-mats">
            暂无配方，请在开发者面板添加
          </div>
        </div>

        <div class="materials-section">
          <h3><Icon icon="mdi:package-variant-closed" /> 我的材料</h3>
          <div class="materials-grid">
            <div v-for="(mat, id) in store.materials" :key="id" class="material-cell" :class="{ low: mat.qty < 5 }">
              <Icon :icon="materialIcon(id)" class="mat-icon" />
              <span class="mat-name">{{ store.getMaterialName(id) }}</span>
              <span class="mat-qty">{{ mat.qty }}</span>
            </div>
            <div v-if="Object.keys(store.materials).length === 0" class="empty-mats">暂无材料</div>
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

function materialIcon(id) {
  const icons = {
    slime_gel: 'mdi:water', goblin_fang: 'mdi:tooth', scorpion_tail: 'mdi:needle',
    iron_ore: 'mdi:mine', dragon_scale: 'mdi:shield-sun', wolf_fang: 'mdi:tooth-outline',
    wolf_heart: 'mdi:heart-pulse', golem_core: 'mdi:creation',
  }
  return icons[id] || 'mdi:circle'
}

function hasMaterial(id, need) {
  const mat = store.materials[id]
  return mat && mat.qty >= need
}

function canCraft(recipe) {
  if (store.player.gold < recipe.goldCost) return false
  return recipe.materials.every(mat => hasMaterial(mat.id, mat.qty))
}

function craft(recipe) {
  if (!canCraft(recipe)) return alert('材料不足或金币不够！')
  store.addGold(-recipe.goldCost)
  for (const mat of recipe.materials) store.addMaterial(mat.id, '', -mat.qty)

  // 随机附加副词条（从词条池中选1~2个，每个等级1）
  const affixes = []
  const pool = (recipe.affixPool || []).filter(Boolean)
  if (pool.length) {
    const count = Math.min(2, pool.length)
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    for (let i = 0; i < count; i++) {
      affixes.push({ id: shuffled[i], level: 1 })
    }
  }

  // 生成装备对象
 const item = {
    id: `equip_${Date.now()}`,
    name: recipe.name,
    icon: recipe.icon || (recipe.type === 'weapon' ? 'mdi:sword' : 'mdi:shield'),
    type: recipe.type,
    part: recipe.type === 'weapon' ? 'weapon' : 'armor', // 新增：装备槽位
    levelRequired: recipe.levelRequired || 1,
    quality: recipe.quality || 'white',
    atk: recipe.baseAtk || 0,   // 改用 baseAtk
    def: recipe.baseDef || 0,   // 改用 baseDef
    gemSlots: recipe.gemSlots || 0,
    setId: recipe.setId || '',
    affixes,  // 已有
  }

  store.inventory.push(item)
  store.save()
  alert(`成功制作 ${item.name}！已放入背包。`)
}
function qualityColor(q) {
  const map = { white: '#ccc', green: '#4caf50', blue: '#2196f3', purple: '#9c27b0', red: '#ff4444' }
  return map[q] || '#ccc'
}
function qualityLabel(q) {
  const map = { white: '普通', green: '优秀', blue: '精良', purple: '史诗', red: '传说' }
  return map[q] || q
}
</script>

<style scoped>
/* 保持原有精美样式，无变化 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 850px; max-width: 95vw; height: 85vh; background: rgba(15,25,45,0.95); backdrop-filter: blur(20px); border: 2px solid #b89a6a; border-radius: 24px; padding: 24px; color: #ffd; font-family: 'Press Start 2P', cursive; display: flex; flex-direction: column; position: relative; }
.close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; color: #ffd; font-size: 22px; cursor: pointer; }
.close-btn:hover { transform: scale(1.2); }
h2 { font-size: 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.forge-layout { display: flex; gap: 20px; flex: 1; overflow: hidden; }
.recipes-section { width: 45%; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; padding-right: 10px; }
.recipe-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.3); border-radius: 16px; padding: 15px; }
.recipe-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.recipe-name { font-size: 12px; flex: 1; }
.recipe-quality { font-size: 8px; padding: 2px 10px; border-radius: 20px; background: rgba(255,255,255,0.1); text-transform: uppercase; }
.recipe-mats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.mat-requirement { display: flex; align-items: center; gap: 4px; font-size: 8px; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 8px; }
.mat-requirement.gold { background: rgba(255,215,0,0.15); }
.mat-icon-small { font-size: 14px; }
.mat-qty { font-weight: bold; }
.check { color: #4caf50; } .cross { color: #f44336; }
.pixel-btn.primary { background: rgba(255,215,0,0.15); display: flex; align-items: center; gap: 6px; }
.materials-section { flex: 1; background: rgba(0,0,0,0.2); border-radius: 16px; padding: 15px; overflow-y: auto; }
.materials-section h3 { font-size: 12px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
.materials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; }
.material-cell { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,215,0,0.2); border-radius: 12px; padding: 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 5px; transition: transform 0.2s; }
.material-cell:hover { transform: translateY(-2px); background: rgba(255,215,0,0.1); }
.material-cell.low { opacity: 0.6; }
.mat-icon { font-size: 28px; color: #ffd700; }
.mat-name { font-size: 7px; color: #ccc; word-break: break-all; }
.mat-qty { font-size: 8px; font-weight: bold; color: #ffd; background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 10px; }
.empty-mats { grid-column: 1 / -1; text-align: center; font-size: 10px; opacity: 0.6; padding: 30px; }
</style>