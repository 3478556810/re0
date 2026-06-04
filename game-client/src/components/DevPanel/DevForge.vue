<template>
  <div class="section">
    <h3><Icon icon="mdi:anvil" /> 锻造配方</h3>

    <div v-for="(recipe, idx) in store.config.forgeRecipes" :key="idx" class="recipe-card">
      <div class="recipe-header">
        <span class="recipe-name">{{ recipe.name || '未命名配方' }}</span>
        <button class="pixel-btn small danger" @click="store.config.forgeRecipes.splice(idx,1)">删除</button>
      </div>

      <div class="row"><label>名称</label><input v-model="recipe.name" class="pixel-input" /></div>
      <div class="row"><label>图标</label><input v-model="recipe.icon" class="pixel-input" /></div>
      <div class="row">
        <label>类型</label>
        <select v-model="recipe.type" class="pixel-input">
          <option value="weapon">武器</option>
          <option value="armor">防具</option>
        </select>
      </div>
      <div class="row"><label>等级要求</label><input v-model.number="recipe.levelRequired" type="number" min="1" class="pixel-input micro" /></div>
      <div class="row">
        <label>品质</label>
        <select v-model="recipe.quality" class="pixel-input">
          <option value="white">普通</option>
          <option value="green">优秀</option>
          <option value="blue">精良</option>
          <option value="purple">史诗</option>
          <option value="red">传说</option>
        </select>
      </div>

      <!-- 根据类型显示不同主属性 -->
      <div class="row" v-if="recipe.type === 'weapon'">
        <label>基础攻击</label>
        <input v-model.number="recipe.baseAtk" type="number" class="pixel-input micro" />
      </div>
      <div class="row" v-else>
        <label>基础防御</label>
        <input v-model.number="recipe.baseDef" type="number" class="pixel-input micro" />
      </div>

      <div class="row"><label>宝石孔</label><input v-model.number="recipe.gemSlots" type="number" min="0" max="3" class="pixel-input micro" /></div>
      <div class="row"><label>套装 ID</label><input v-model="recipe.setId" class="pixel-input" placeholder="例如 hellfire" /></div>

      <!-- 所需材料 -->
      <div class="row materials-section">
        <label>所需材料</label>
        <div class="materials-list">
          <div v-for="(mat, mIdx) in recipe.materials" :key="mIdx" class="material-row">
            <select v-model="mat.id" class="pixel-input micro">
              <option value="">选择材料</option>
              <option v-for="def in store.config.materialDefinitions" :key="def.id" :value="def.id">
                {{ def.name || def.id }}
              </option>
            </select>
            <input v-model.number="mat.qty" type="number" min="1" class="pixel-input micro" placeholder="数量" />
            <button class="pixel-btn micro danger" @click="recipe.materials.splice(mIdx,1)">✕</button>
          </div>
          <button class="pixel-btn micro" @click="recipe.materials.push({ id: '', qty: 1 })">+ 添加材料</button>
        </div>
      </div>

      <!-- 随机副词条池 -->
      <div class="row materials-section">
        <label>副词条池</label>
        <div class="materials-list">
          <div v-for="(affixId, aIdx) in recipe.affixPool" :key="aIdx" class="material-row">
            <select v-model="recipe.affixPool[aIdx]" class="pixel-input micro">
              <option value="">不选择</option>
              <option v-for="(def, key) in store.config.affixEffects" :key="key" :value="key">
                {{ def.loreName || def.name }}
              </option>
            </select>
            <button class="pixel-btn micro danger" @click="recipe.affixPool.splice(aIdx,1)">✕</button>
          </div>
          <button class="pixel-btn micro" @click="recipe.affixPool.push('')">+ 添加词条</button>
        </div>
      </div>

      <div class="row"><label>金币费用</label><input v-model.number="recipe.goldCost" type="number" class="pixel-input micro" /></div>
    </div>

    <button class="pixel-btn small" @click="addRecipe">+ 新增配方</button>

    <div class="json-tools">
      <button class="pixel-btn small" @click="showImport = !showImport">
        <Icon icon="mdi:code-json" /> {{ showImport ? '关闭' : '导入 / 导出' }}
      </button>
      <div v-if="showImport" class="import-area">
        <textarea v-model="jsonImport" class="pixel-textarea" rows="6" placeholder="粘贴配方 JSON 数组..."></textarea>
        <div class="import-actions">
          <button class="pixel-btn small" @click="importRecipes">导入覆盖</button>
          <button class="pixel-btn small" @click="exportRecipes">导出 JSON</button>
        </div>
      </div>
    </div>

    <button class="pixel-btn" @click="saveConfig"><Icon icon="mdi:content-save" /> 保存到存档</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../../store/gameStore'

const store = useGameStore()
const showImport = ref(false)
const jsonImport = ref('')

function addRecipe() {
  store.config.forgeRecipes.push({
    id: 'recipe_' + Date.now(),
    name: '新配方',
    icon: 'mdi:sword',
    type: 'weapon',
    levelRequired: 1,
    quality: 'white',
    baseAtk: 10,
    baseDef: 0,
    gemSlots: 0,
    setId: '',
    affixPool: [],
    materials: [],
    goldCost: 50
  })
}

function saveConfig() {
  store.save()
  showToast('锻造配方已保存')
}

function exportRecipes() {
  navigator.clipboard.writeText(JSON.stringify(store.config.forgeRecipes, null, 2))
  showToast('已复制到剪贴板')
}

function importRecipes() {
  try {
    const arr = JSON.parse(jsonImport.value)
    if (!Array.isArray(arr)) throw new Error()
    store.config.forgeRecipes = arr
    store.save()
    jsonImport.value = ''
    showImport.value = false
    showToast('导入成功')
  } catch (e) {
    showToast('JSON 格式错误')
  }
}
</script>

<style scoped>
/* 保留原有样式，无变化 */
.section { margin-bottom: 15px; }
h3 { font-size: 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.recipe-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.3); border-radius: 12px; padding: 10px; margin-bottom: 10px; }
.recipe-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.recipe-name { font-size: 11px; color: #ffd700; }
.row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 10px; flex-wrap: wrap; }
.row label { width: 80px; text-align: right; flex-shrink: 0; }
.pixel-input { background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 6px 10px; font-family: 'Press Start 2P'; font-size: 10px; width: 120px; border-radius: 8px; }
.pixel-input.micro { width: 60px; padding: 4px 6px; font-size: 8px; }
.pixel-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(255,255,255,0.1); border: 1px solid #b89a6a; color: #ffd; font-family: 'Press Start 2P'; font-size: 9px; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
.pixel-btn:hover { background: rgba(255,215,0,0.15); }
.pixel-btn.small { padding: 6px 10px; font-size: 7px; }
.pixel-btn.micro { padding: 4px 6px; font-size: 6px; }
.pixel-btn.danger { background: rgba(244,67,54,0.2); border-color: #f44336; }
.pixel-btn.danger:hover { background: rgba(244,67,54,0.4); }
.materials-section { align-items: flex-start; }
.materials-list { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.material-row { display: flex; gap: 5px; align-items: center; }
.json-tools { margin-top: 15px; }
.import-area { margin-top: 8px; }
.pixel-textarea { width: 100%; background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 10px; font-family: monospace; font-size: 10px; border-radius: 8px; resize: vertical; }
.import-actions { display: flex; gap: 8px; margin-top: 8px; }
</style>