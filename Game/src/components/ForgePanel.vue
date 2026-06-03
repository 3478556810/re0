<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <h2><Icon icon="mdi:anvil" /> 锻造</h2>

      <!-- 模式切换标签 -->
      <div class="mode-tabs">
        <button :class="['mode-btn', { active: forgeMode === 'craft' }]" @click="forgeMode = 'craft'">
          <Icon icon="mdi:hammer" /> 制作装备
        </button>
        <button :class="['mode-btn', { active: forgeMode === 'upgrade' }]" @click="forgeMode = 'upgrade'">
          <Icon icon="mdi:star-four-points" /> 强化装备
        </button>
      </div>

      <!-- 制作模式 -->
      <template v-if="forgeMode === 'craft'">
        <!-- 套装分类标签 -->
        <div class="forge-filter">
          <button
            v-for="set in setFilterOptions"
            :key="set.value"
            :class="['filter-btn', { active: currentSetFilter === set.value }]"
            @click="currentSetFilter = set.value"
          >
            {{ set.label }}
          </button>
        </div>

        <div class="forge-layout">
          <div class="recipes-section">
            <div v-if="filteredRecipes.length === 0" class="empty-mats">暂无配方</div>
            <div class="recipe-grid">
              <div class="recipe-card" v-for="recipe in filteredRecipes" :key="recipe.id">
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
                    <Icon v-if="hasMaterial(mat.id, mat.qty)" icon="mdi:check-circle" class="check-icon" />
                    <Icon v-else icon="mdi:close-circle" class="cross-icon" />
                  </div>
                  <div class="mat-requirement gold">
                    <Icon icon="mdi:cash-multiple" class="mat-icon-small" />
                    <span>{{ recipe.goldCost }}G</span>
                    <Icon v-if="store.player.gold >= recipe.goldCost" icon="mdi:check-circle" class="check-icon" />
                    <Icon v-else icon="mdi:close-circle" class="cross-icon" />
                  </div>
                </div>
                <button class="pixel-btn primary" @click="craft(recipe)" :disabled="!canCraft(recipe)">
                  <Icon icon="mdi:hammer" /> 制作
                </button>
              </div>
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
      </template>

      <!-- 强化模式 -->
      <template v-if="forgeMode === 'upgrade'">
        <div class="upgrade-layout">
          <div class="upgrade-equip-list">
            <div v-if="upgradeableItems.length === 0" class="empty-mats">背包中没有可强化的装备</div>
            <div
              v-for="item in upgradeableItems"
              :key="item.id"
              class="upgrade-card"
              :class="'quality-' + item.quality"
              @click="selectForUpgrade(item)"
            >
              <div class="upgrade-name">{{ item.name }} <span class="acc-level">Lv.{{ item.level }}</span></div>
              <div class="upgrade-quality" :style="{ color: qualityColor(item.quality) }">{{ qualityLabel(item.quality) }}</div>
              <div class="upgrade-stats">
                <span>攻 +{{ item.atk }}</span>
                <span>防 +{{ item.def }}</span>
              </div>
            </div>
          </div>

          <div class="upgrade-detail" v-if="selectedUpgradeItem">
            <h3>强化 {{ selectedUpgradeItem.name }}</h3>
            <div class="upgrade-info">
              <div>品质：<span :style="{ color: qualityColor(selectedUpgradeItem.quality) }">{{ qualityLabel(selectedUpgradeItem.quality) }}</span></div>
              <div>等级：Lv.{{ selectedUpgradeItem.level }}</div>
              <div>攻击：{{ selectedUpgradeItem.atk }} | 防御：{{ selectedUpgradeItem.def }}</div>
              <div v-if="selectedUpgradeItem.affixes?.length" class="upgrade-affixes">
                词条：
    <!-- 强化模式下的词条显示 -->
<div v-if="selectedUpgradeItem" class="upgrade-affixes">
  <div v-for="aff in selectedUpgradeItem.affixes" :key="aff.id" class="affix-tag" :class="{ fixed: aff.fixed }">
    <template v-if="aff.fixed">
      <span class="fixed-circle"></span>
      <span class="fixed-text">对Boss增伤 +{{ selectedUpgradeItem.bossDmgBonus }}%</span>
    </template>
    <template v-else>
      <span>{{ getAffixName(aff.id) }} Lv.{{ aff.level }}</span>
    </template>
  </div>
</div>
              </div>
            </div>
            <div class="upgrade-actions">
              <button class="pixel-btn primary" @click="upgradeLevel(selectedUpgradeItem)" :disabled="!canUpgradeLevel(selectedUpgradeItem)">
  <Icon icon="mdi:arrow-up-bold" /> 升级 ({{ levelUpgradeCost(selectedUpgradeItem).gold }}G) - {{ Math.floor(getLevelSuccessRate(selectedUpgradeItem) * 100) }}%
</button>

<button class="pixel-btn primary" @click="upgradeQuality(selectedUpgradeItem)" :disabled="!canUpgradeQuality(selectedUpgradeItem)">
  <Icon icon="mdi:star" /> 升品 ({{ qualityUpgradeCost(selectedUpgradeItem).gold }}G) - {{ Math.floor(getQualitySuccessRate(selectedUpgradeItem) * 100) }}%
</button>
              <button class="pixel-btn warning" @click="reforgeAffixes(selectedUpgradeItem)" :disabled="!canReforge(selectedUpgradeItem)">
                <Icon icon="mdi:refresh" /> 重铸词条 ({{ reforgeCost(selectedUpgradeItem).gold }}G)
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { AFFIX_EFFECTS, QUALITY_STATS_MULTIPLIER, QUALITY_AFFIX_LEVEL_MIN } from '../config/accessoryConfig'

const store = useGameStore()

const forgeMode = ref('craft')
const currentSetFilter = ref('all')
const selectedUpgradeItem = ref(null)
// 获取升级成功率（包含保底）
function getLevelSuccessRate(item) {
  const config = store.config.enhanceConfig?.levelUp?.perLevel(item.level, item.quality)
  if (!config) return 0
  const base = config.successRate || 0.5
  const failCount = item.levelFailCount || 0
  return Math.min(1, base + failCount * 0.1)
}

// 获取升品成功率（包含保底）
function getQualitySuccessRate(item) {
  const config = store.config.enhanceConfig?.qualityUpgrade?.[item.quality]
  if (!config) return 0
  const base = config.successRate || 0.5
  const failCount = item.qualityFailCount || 0
  return Math.min(1, base + failCount * 0.15) // 每次失败+15%
}
// 套装筛选选项
const setFilterOptions = computed(() => {
  const sets = new Set(store.config.forgeRecipes.map(r => r.setId).filter(Boolean))
  const options = [{ label: '全部', value: 'all' }]
  const setNames = {
    iron_set: '铁之意志',
    spider_set: '蛛丝暗影',
    stone_set: '石魔之力',
    silver_set: '银之套装',
    gold_set: '黄金套装',
    mithril_set: '秘银套装',
  }
  sets.forEach(id => {
    options.push({ label: setNames[id] || id, value: id })
  })
  return options
})

const filteredRecipes = computed(() => {
  if (currentSetFilter.value === 'all') return store.config.forgeRecipes
  return store.config.forgeRecipes.filter(r => r.setId === currentSetFilter.value)
})

// 可强化的装备列表
const upgradeableItems = computed(() => {
  return (store.inventory || []).filter(item => {
    if (!item || !item.part) return false; // 必须有部位
    // 必须是武器、防具（排除饰品？饰品也可以强化，视需求而定）
    const validParts = ['weapon','gauntlet','helmet','armor','pants','shoes','necklace','ring1','ring2','earring1','earring2'];
    return validParts.includes(item.part) && item.quality;
  });
});

// --- 通用工具函数 ---
function materialIcon(id) {
  const icons = {
    slime_gel: 'mdi:water',
    goblin_fang: 'mdi:tooth',
    scorpion_tail: 'mdi:needle',
    iron_ore: 'mdi:mine',
    dragon_scale: 'mdi:shield-sun',
    wolf_fang: 'mdi:tooth-outline',
    wolf_heart: 'mdi:heart-pulse',
    golem_core: 'mdi:creation',
    spider_silk: 'mdi:spider-web',
    bat_wing: 'mdi:bat',
    small_magic_stone: 'mdi:magic-staff',
    gold_ore: 'mdi:gold',
    silver_ore: 'mdi:silver-fork-spoon',
    copper_ore: 'mdi:copper',
    mithril_ore: 'mdi:star-four-points',
    crystal_shard: 'mdi:diamond-stone',
    obsidian: 'mdi:circle-multiple',
    dragon_ore: 'mdi:dragon',
  }
  return icons[id] || 'mdi:circle'
}

function hasMaterial(id, need) {
  const mat = store.materials[id]
  return mat && mat.qty >= need
}

function qualityColor(q) {
  const map = { white: '#ccc', green: '#4caf50', blue: '#2196f3', purple: '#9c27b0', red: '#ff4444' }
  return map[q] || '#ccc'
}

function qualityLabel(q) {
  const map = { white: '普通', green: '优秀', blue: '精良', purple: '史诗', red: '传说' }
  return map[q] || q
}

function getAffixName(id) {
  // 特殊处理固定词条
  if (id === 'bossDmgFix') return '对Boss增伤';
  return AFFIX_EFFECTS[id]?.name || id;
}
// --- 制作系统 ---
function canCraft(recipe) {
  if (store.player.gold < recipe.goldCost) return false
  return recipe.materials.every(mat => hasMaterial(mat.id, mat.qty))
}

function rollQualityForCraft(baseQuality) {
  if (Math.random() < 0.1) {
    const qualities = ['white', 'green', 'blue', 'purple', 'red']
    const currentIdx = qualities.indexOf(baseQuality)
    if (currentIdx < qualities.length - 1) {
      return qualities[currentIdx + 1]
    }
  }
  return baseQuality
}

function generateAffixesForCraft(quality, itemLevel) {
  const affixKeys = Object.keys(AFFIX_EFFECTS)
  if (affixKeys.length === 0) return []
  const count = Math.min(2, 1 + Math.floor(Math.random() * 2))
  const result = []
  const used = new Set()
  const minLevel = QUALITY_AFFIX_LEVEL_MIN[quality] || 1
  for (let i = 0; i < count; i++) {
    const key = affixKeys[Math.floor(Math.random() * affixKeys.length)]
    if (used.has(key)) continue
    used.add(key)
    const level = Math.min(5, Math.max(minLevel, Math.floor(itemLevel / 10) + 1))
    result.push({ id: key, level })
  }
  return result
}

function craft(recipe) {
  if (!canCraft(recipe)) return window.showToast('材料不足或金币不够！')
  store.addGold(-recipe.goldCost)
  for (const mat of recipe.materials) store.addMaterial(mat.id, '', -mat.qty)

  const quality = rollQualityForCraft(recipe.quality || 'white')
  const playerLv = store.player.level
  const itemLevel = Math.max(1, playerLv + Math.floor(Math.random() * 5) - 2)
  const baseAtk = recipe.baseAtk || 10
  const baseDef = recipe.baseDef || 5
  const qualityMult = QUALITY_STATS_MULTIPLIER[quality] || 1
const craftedMultiplier = 1.5; // 手工装基础属性提升20%

 const atk = Math.floor(baseAtk * qualityMult * (1 + (itemLevel - 1) * 0.1) * craftedMultiplier);
const def = Math.floor(baseDef * qualityMult * (1 + (itemLevel - 1) * 0.1) * craftedMultiplier);
  const affixes = generateAffixesForCraft(quality, itemLevel)
// 在 craft 函数中，生成完 affixes 之后

  const item = {
    id: `equip_${Date.now()}`,
    name: recipe.name,
    icon: recipe.icon || (recipe.type === 'weapon' ? 'mdi:sword' : 'mdi:shield'),
    type: recipe.type,
    part: recipe.type || 'armor',
    level: itemLevel,
     levelFailCount: 0,
  qualityFailCount: 0,
    quality: quality,
    atk: atk,
    def: def,
   baseAtk: recipe.baseAtk || 10,
  baseDef: recipe.baseDef || 5,
    affixes: affixes,
  
    levelRequired: recipe.levelRequired || 1,
    gemSlots: recipe.gemSlots || 0,
    setId: recipe.setId || '',
  }

 // ✅ 现在可以安全地使用 item 了
  const bossFixAffix = {
    id: 'bossDmgFix',
    level: 15,
    desc: '对Boss伤害 +15%',
    fixed: true
  }
  item.affixes = [bossFixAffix, ...affixes]
  item.bossDmgBonus = 15
  

const extraAffix = generateAffixesForCraft(quality, itemLevel)[0];
if (extraAffix) item.affixes.push(extraAffix);
  store.inventory.push(item)
  store.save()
  window.showToast(`成功制作 ${item.name}！已放入背包。`)
}
// --- 强化系统 ---
function selectForUpgrade(item) {
  selectedUpgradeItem.value = item
}

function qualityUpgradeCost(item) {
  const config = store.config.enhanceConfig?.qualityUpgrade
  if (!config) return { gold: 99999, materials: {} }
  return config[item.quality] || { gold: 99999, materials: {} }
}

function canUpgradeQuality(item) {
  if (!item || item.quality === 'red') return false
  
  const levelRequirements = {
    white: 10,
    green: 20,
    blue: 30,
    purple: 40,
  }
  const requiredLevel = levelRequirements[item.quality] || 0
  if (item.level < requiredLevel) return false

  const cost = qualityUpgradeCost(item)
  if (!cost || !cost.materials) return false
  if (store.player.gold < cost.gold) return false
  
  return cost.materials.every(mat => hasMaterial(mat.id, mat.qty))
}
// 升品（改为基于 baseAtk/baseDef 重新计算，确保品质间有明显差距）
// 升品（修复属性计算 + 重置等级为 1）
// 升品（重置等级为 1，属性基于基础值 x 新品质倍率）
function upgradeQuality(item) {
  if (!canUpgradeQuality(item)) return window.showToast('材料或金币不足！')

  const cost = qualityUpgradeCost(item)
  store.addGold(-cost.gold)
  for (const [id, qty] of Object.entries(cost.materials)) store.addMaterial(id, '', -qty)

  const successRate = getQualitySuccessRate(item)
  if (Math.random() < successRate) {
    const qualities = ['white', 'green', 'blue', 'purple', 'red']
    const idx = qualities.indexOf(item.quality)
    item.quality = qualities[idx + 1]
    item.level = 1
    const mult = QUALITY_STATS_MULTIPLIER[item.quality] || 1
    // 升品后属性 = 基础值 x 新倍率
    item.atk = Math.floor((item.baseAtk || 10) * mult)
    item.def = Math.floor((item.baseDef || 5) * mult)
    item.qualityFailCount = 0
    store.save()
    window.showToast(`${item.name} 品质提升为 ${qualityLabel(item.quality)}！`)
  } else {
    item.qualityFailCount = (item.qualityFailCount || 0) + 1
    store.save()
    window.showToast(`升品失败！下次成功率 ${Math.floor(getQualitySuccessRate(item) * 100)}%`)
  }
}
function levelUpgradeCost(item) {
  const config = store.config.enhanceConfig?.levelUp;
  if (!config || !config.perLevel) return { gold: 99999, materials: [] };
  return config.perLevel(item.level, item.quality) || { gold: 99999, materials: [] };
}

function canUpgradeLevel(item) {
  if (!item || item.level >= 99) return false
  
  const cost = levelUpgradeCost(item)
  if (!cost || !cost.materials) return false   // 防止 undefined
  if (store.player.gold < cost.gold) return false
  
  return cost.materials.every(mat => hasMaterial(mat.id, mat.qty))
}



// 升级（每次升级属性提升约 10%，基于 baseAtk/baseDef）
// 升级（确保基于 baseAtk/baseDef，且属性提升更显著）
function upgradeLevel(item) {
  if (!canUpgradeLevel(item)) return window.showToast('材料或金币不足！')

  const cost = levelUpgradeCost(item)
  store.addGold(-cost.gold)
  for (const [id, qty] of Object.entries(cost.materials)) store.addMaterial(id, '', -qty)

  const successRate = getLevelSuccessRate(item)
  if (Math.random() < successRate) {
    item.level += 1
    const mult = QUALITY_STATS_MULTIPLIER[item.quality] || 1
    // 每级 +10% 基础属性 (1 + (level-1)*0.1)
    item.atk = Math.floor((item.baseAtk || 10) * mult * (1 + (item.level - 1) * 0.1))
    item.def = Math.floor((item.baseDef || 5) * mult * (1 + (item.level - 1) * 0.1))
    item.levelFailCount = 0
    store.save()
    window.showToast(`${item.name} 升级为 Lv.${item.level}！`)
  } else {
    item.levelFailCount = (item.levelFailCount || 0) + 1
    store.save()
    window.showToast(`升级失败！下次成功率 ${Math.floor(getLevelSuccessRate(item) * 100)}%`)
  }
}


function reforgeCost(item) {
  const config = store.config.enhanceConfig?.affixReroll
  return config || { gold: 99999, materials: {} }
}

function canReforge(item) {
  const cost = reforgeCost(item)
  if (!cost || store.player.gold < cost.gold) return false
  // 手动检查材料，兼容各种数据格式
  const mats = cost.materials || cost.mats || []
  for (const mat of mats) {
    if (!hasMaterial(mat.id, mat.qty)) return false
  }
  return true
}

// 重铸词条（消耗小型魔石）
function reforgeAffixes(item) {
  if (!canReforge(item)) return window.showToast('材料或金币不足！');
  const cost = reforgeCost(item);
  store.addGold(-cost.gold);
  for (const [id, qty] of Object.entries(cost.materials)) store.addMaterial(id, '', -qty);

  const affixKeys = Object.keys(AFFIX_EFFECTS);
  const minLevel = QUALITY_AFFIX_LEVEL_MIN[item.quality] || 1;
  
  // 保留固定词条
  const fixedAffixes = (item.affixes || []).filter(a => a.fixed === true);
  const randomCount = Math.min(2, 1 + Math.floor(Math.random() * 2));
  const newRandomAffixes = [];
  const used = new Set();
  
  for (let i = 0; i < randomCount; i++) {
    const key = affixKeys[Math.floor(Math.random() * affixKeys.length)];
    if (used.has(key)) continue;
    used.add(key);
    const level = Math.min(5, Math.max(minLevel, Math.floor(item.level / 10) + 1));
    newRandomAffixes.push({ id: key, level });
  }

  // 固定词条 + 新随机词条
  item.affixes = [...fixedAffixes, ...newRandomAffixes];
  store.save();
  window.showToast(`${item.name} 的词条已重铸！`);
}
</script>

<style scoped>
/* 全屏优化 + 分类标签 */
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; justify-content: center; align-items: center; z-index: 200;
}
.panel {
  width: 90vw;
  height: 90vh;
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
  position: absolute; top: 16px; right: 16px; background: none; border: none;
  color: #ffd; font-size: 20px; cursor: pointer;
}
h2 { font-size: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }

/* 模式切换标签 */
.mode-tabs {
  display: flex; gap: 8px; margin-bottom: 16px;
}
.mode-btn {
  background: rgba(0,0,0,0.5); border: 1px solid #5a5a7a; border-radius: 8px;
  padding: 8px 20px; font-size: 10px; color: #ccc; cursor: pointer;
  display: flex; align-items: center; gap: 6px; transition: 0.2s;
}
.mode-btn.active {
  background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd;
}

/* 筛选标签 */
.forge-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}
.filter-btn {
  background: rgba(0,0,0,0.5);
  border: 1px solid #5a5a7a;
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 8px;
  color: #ccc;
  cursor: pointer;
  transition: 0.2s;
}
.filter-btn.active {
  background: rgba(255,215,0,0.2);
  border-color: #ffd700;
  color: #ffd;
}

.forge-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}
.recipes-section {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}
.materials-section {
  width: 260px;
  flex-shrink: 0;
  background: rgba(0,0,0,0.2);
  border-radius: 16px;
  padding: 15px;
  overflow-y: auto;
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
.recipe-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,215,0,0.3);
  border-radius: 16px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.recipe-header {
  display: flex; align-items: center; gap: 10px;
}
.recipe-name { font-size: 11px; flex: 1; }
.recipe-quality { font-size: 8px; padding: 2px 10px; border-radius: 20px; background: rgba(255,255,255,0.1); }
.recipe-mats {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.mat-requirement {
  display: flex; align-items: center; gap: 4px; font-size: 8px;
  background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 8px;
}
.mat-requirement.gold { background: rgba(255,215,0,0.15); }
.mat-icon-small { font-size: 14px; }
.mat-qty { font-weight: bold; }

.check-icon { color: #4caf50; }
.cross-icon { color: #f44336; }

.pixel-btn.primary {
  background: rgba(255,215,0,0.15);
  display: flex; align-items: center; gap: 6px;
  margin-top: auto;
  border: 1px solid #ffd700;
  padding: 6px 12px;
  font-size: 9px;
  border-radius: 8px;
  cursor: pointer;
  color: #ffd;
}

.materials-section h3 { font-size: 11px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.materials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 8px; }
.material-cell {
  background: rgba(0,0,0,0.4); border: 1px solid rgba(255,215,0,0.2);
  border-radius: 10px; padding: 8px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.material-cell.low { opacity: 0.6; }
.mat-icon { font-size: 22px; color: #ffd700; }
.mat-name { font-size: 7px; color: #ccc; word-break: break-all; }
.mat-qty { font-size: 8px; font-weight: bold; color: #ffd; background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 10px; }

.empty-mats { text-align: center; font-size: 10px; opacity: 0.6; padding: 30px; }

/* 强化模式布局 */
.upgrade-layout {
  display: flex; gap: 20px; flex: 1; overflow: hidden;
}
.upgrade-equip-list {
  width: 45%; overflow-y: auto; padding-right: 10px;
}
.upgrade-detail {
  flex: 1; background: rgba(0,0,0,0.3); border-radius: 16px; padding: 20px;
  overflow-y: auto;
}
.upgrade-card {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.3);
  border-radius: 12px; padding: 12px; margin-bottom: 8px; cursor: pointer;
  transition: 0.2s;
}
.upgrade-card:hover { background: rgba(255,215,0,0.1); }
.upgrade-name { font-size: 10px; color: #ffe4b5; }
.upgrade-quality { font-size: 8px; margin: 4px 0; }
.upgrade-stats { font-size: 8px; color: #ccc; display: flex; gap: 12px; }
.upgrade-info { font-size: 9px; color: #ddd; line-height: 1.8; margin-bottom: 20px; }
.upgrade-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.acc-affix-tag { font-size: 7px; background: rgba(255,215,0,0.15); padding: 2px 6px; border-radius: 6px; color: #ffd700; }

.pixel-btn.warning { background: rgba(255,165,0,0.15); border: 1px solid #ffa500; }
.pixel-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* 移动端适配 */
@media (max-width: 700px) {
  .panel { width: 95vw; height: 95vh; }
  .forge-layout {
    flex-direction: column;
  }
  .materials-section {
    width: 100%;
    max-height: 30vh;
  }
  .recipe-grid {
    grid-template-columns: 1fr;
  }
  .upgrade-layout { flex-direction: column; }
  .upgrade-equip-list { width: 100%; max-height: 40vh; }
}



.affix-tag.fixed {
  border-color: #f0c060;
  background: rgba(240, 192, 96, 0.12);
  box-shadow: 0 0 6px rgba(240, 192, 96, 0.3);
}

/* 空心圆点 */
.fixed-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #f0c060;
  background: transparent;
  flex-shrink: 0;
  animation: pulse-gold 2s infinite;
}

@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(240, 192, 96, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(240, 192, 96, 0); }
}

/* 固定文本 */
.fixed-text {
  color: #f0c060;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(240, 192, 96, 0.5);
}

.affix-tag {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(184, 154, 106, 0.3);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 8px;
  color: #ccc;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 4px;
}
</style>