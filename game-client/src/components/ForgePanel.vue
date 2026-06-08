<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <!-- 顶部栏精简版 -->
      <div class="top-bar">
        <h2><Icon icon="mdi:anvil" /> 锻造</h2>
        <div class="mode-tabs">
          <button :class="['mode-btn', { active: forgeMode === 'craft' }]" @click="forgeMode = 'craft'">
            <Icon icon="mdi:hammer" /> 制作
          </button>
          <button :class="['mode-btn', { active: forgeMode === 'upgrade' }]" @click="forgeMode = 'upgrade'">
            <Icon icon="mdi:arrow-up-bold" /> 强化
          </button>
        </div>
        <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      </div>

      <!-- 内容区域（滚动） -->
      <div class="content">
        <!-- 制作模式 -->
        <template v-if="forgeMode === 'craft'">
          <div class="forge-filter">
            <button v-for="set in setFilterOptions" :key="set.value"
              :class="['filter-btn', { active: currentSetFilter === set.value }]"
              @click="currentSetFilter = set.value">
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
                  <div class="craft-info">
                    <span class="success-rate">成功率 80%</span>
                    <span class="rare-rate">跳级率 25%</span>
                  </div>
                  <button class="pixel-btn primary" @click="craft(recipe)" :disabled="!canCraft(recipe)">
                    <Icon icon="mdi:hammer" /> 制作
                  </button>
                </div>
              </div>
            </div>

            <div class="materials-section">
              <h3><Icon icon="mdi:package-variant-closed" /> 材料</h3>
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

        <!-- 强化模式（仅强化等级） -->
        <template v-if="forgeMode === 'upgrade'">
          <div class="upgrade-layout">
            <div class="upgrade-equip-list">
              <div v-if="upgradeableItems.length === 0" class="empty-mats">无可强化的装备</div>
              <div v-for="item in upgradeableItems" :key="item.id"
                class="upgrade-card" :class="'quality-' + item.quality"
                @click="selectedUpgradeItem = item">
                <div class="upgrade-name">{{ item.name }} <span class="acc-level">Lv.{{ item.level }}</span></div>
                <div class="upgrade-quality" :style="{ color: qualityColor(item.quality) }">{{ qualityLabel(item.quality) }}</div>
                <div class="upgrade-stats">
                  <span v-if="item.atk > 0">攻 +{{ item.atk }}</span>
                  <span v-if="item.def > 0">防 +{{ item.def }}</span>
                </div>
              </div>
            </div>

            <div class="upgrade-detail" v-if="selectedUpgradeItem">
              <h3>强化 {{ selectedUpgradeItem.name }}</h3>
              <div class="upgrade-info">
                <div>品质：<span :style="{ color: qualityColor(selectedUpgradeItem.quality) }">{{ qualityLabel(selectedUpgradeItem.quality) }}</span></div>
                <div>等级：Lv.{{ selectedUpgradeItem.level }}</div>
                <div class="upgrade-stats-row">
                  <span v-if="selectedUpgradeItem.atk > 0">攻击 +{{ selectedUpgradeItem.atk }}</span>
                  <span v-if="selectedUpgradeItem.atk > 0 && selectedUpgradeItem.def > 0"> | </span>
                  <span v-if="selectedUpgradeItem.def > 0">防御 +{{ selectedUpgradeItem.def }}</span>
                </div>
              </div>
              <div class="upgrade-actions">
                <button class="pixel-btn primary" @click="upgradeLevel(selectedUpgradeItem)"
                  :disabled="!canUpgradeLevel(selectedUpgradeItem)">
                  <Icon icon="mdi:arrow-up-bold" /> 强化 ({{ levelUpgradeCost(selectedUpgradeItem).gold }}G)
                  - {{ Math.floor(getLevelSuccessRate(selectedUpgradeItem) * 100) }}%
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
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

// 副词条池（制作时随机生成一个）
const ATTACK_AFFIX_POOL = [
  { id: 'atk', name: '攻击力', type: 'flat', min: 5, max: 25 },
  { id: 'atkPercent', name: '攻击百分比', type: 'percent', min: 3, max: 15 },
  { id: 'critRate', name: '暴击率', type: 'flat', min: 3, max: 12 },
  { id: 'critDmg', name: '暴击伤害', type: 'flat', min: 8, max: 35 },
  { id: 'trueDmg', name: '真伤', type: 'flat', min: 5, max: 20 },
  { id: 'fireDmgPercent', name: '火属性攻击%', type: 'percent', min: 3, max: 12 },
  { id: 'iceDmgPercent', name: '冰属性攻击%', type: 'percent', min: 3, max: 12 },
  { id: 'thunderDmgPercent', name: '雷属性攻击%', type: 'percent', min: 3, max: 12 },
  { id: 'holyDmgPercent', name: '圣属性攻击%', type: 'percent', min: 3, max: 12 },
  { id: 'darkDmgPercent', name: '暗属性攻击%', type: 'percent', min: 3, max: 12 },
]

const DEFENSE_AFFIX_POOL = [
  { id: 'def', name: '防御力', type: 'flat', min: 8, max: 40 },
  { id: 'defPercent', name: '防御百分比', type: 'percent', min: 3, max: 15 },
  { id: 'hp', name: '生命值', type: 'flat', min: 30, max: 150 },
  { id: 'hpPercent', name: '生命百分比', type: 'percent', min: 3, max: 12 },
  { id: 'mp', name: '魔法值', type: 'flat', min: 15, max: 60 },
  { id: 'speed', name: '速度', type: 'flat', min: 4, max: 18 },
  { id: 'dodge', name: '闪避', type: 'flat', min: 2, max: 8 },
]

const OFFENSIVE_PARTS = ['weapon', 'gauntlet']
const DEFENSIVE_PARTS = ['armor', 'helmet', 'pants', 'shoes']

function generateExtraStat(part, quality, equipLevel) {
  if (quality === 'white') return {}
  const isOffensive = OFFENSIVE_PARTS.includes(part)
  const pool = isOffensive ? ATTACK_AFFIX_POOL : DEFENSE_AFFIX_POOL
  const affix = pool[Math.floor(Math.random() * pool.length)]
  const extraStats = {}
  if (affix.type === 'percent') {
    const base = affix.min + Math.floor(Math.random() * (affix.max - affix.min + 1))
    const bonus = Math.floor(equipLevel / 10) * 2
    extraStats[affix.id] = Math.min(affix.max + 5, base + bonus)
  } else {
    const base = affix.min + Math.floor(Math.random() * (affix.max - affix.min + 1))
    const multiplier = 1 + equipLevel / 20
    extraStats[affix.id] = Math.max(1, Math.floor(base * multiplier))
  }
  return extraStats
}

function getExtraStatName(key) {
  const map = {
    atk: '攻击力', atkPercent: '攻击力%',
    def: '防御力', defPercent: '防御力%',
    hp: '生命值', hpPercent: '生命值%', mp: '魔法值',
    critRate: '暴击率', critDmg: '暴击伤害', trueDmg: '真实伤害',
    speed: '速度', dodge: '闪避',
    fireDmgPercent: '火属性攻击%', iceDmgPercent: '冰属性攻击%',
    thunderDmgPercent: '雷属性攻击%', holyDmgPercent: '圣属性攻击%',
    darkDmgPercent: '暗属性攻击%',
  }
  return map[key] || key
}

function getLevelSuccessRate(item) {
  const config = store.config.enhanceConfig?.levelUp?.perLevel(item.level, item.quality)
  if (!config) return 0
  const base = config.successRate || 0.5
  const failCount = item.levelFailCount || 0
  return Math.min(1, base + failCount * 0.1)
}

// 套装筛选
const setFilterOptions = computed(() => {
  const sets = new Set(store.config.forgeRecipes.map(r => r.setId).filter(Boolean))
  const options = [{ label: '全部', value: 'all' }]
  const setNames = {
    dragon_set: '龙骸', shadow_set: '暗影咒装', crimson_set: '血怒',
    iron_set: '铁之意志', spider_set: '蛛丝暗影', stone_set: '石魔之力',
  }
  sets.forEach(id => options.push({ label: setNames[id] || id, value: id }))
  return options
})

const filteredRecipes = computed(() => {
  if (currentSetFilter.value === 'all') return store.config.forgeRecipes
  return store.config.forgeRecipes.filter(r => r.setId === currentSetFilter.value)
})

const upgradeableItems = computed(() => {
  return (store.inventory || []).filter(item => {
    if (!item || !item.part) return false
    const validParts = ['weapon','gauntlet','helmet','armor','pants','shoes','necklace','ring1','ring2','earring1','earring2']
    return validParts.includes(item.part) && item.quality
  })
})

function materialIcon(id) {
  const icons = {
    slime_gel: 'mdi:water', goblin_fang: 'mdi:tooth', iron_ore: 'mdi:mine',
    dragon_scale: 'mdi:shield-sun', wolf_fang: 'mdi:tooth-outline',
    wolf_heart: 'mdi:heart-pulse', golem_core: 'mdi:creation',
    spider_silk: 'mdi:spider-web', bat_wing: 'mdi:bat',
    small_magic_stone: 'mdi:magic-staff', gold_ore: 'mdi:gold',
    silver_ore: 'mdi:silver-fork-spoon', copper_ore: 'mdi:copper',
    mithril_ore: 'mdi:star-four-points', crystal_shard: 'mdi:diamond-stone',
    obsidian: 'mdi:circle-multiple', dragon_ore: 'mdi:dragon',
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
  if (id === 'bossDmgFix') return '对Boss增伤'
  return AFFIX_EFFECTS[id]?.name || id
}

function canCraft(recipe) {
  if (store.player.gold < recipe.goldCost) return false
  return recipe.materials.every(mat => hasMaterial(mat.id, mat.qty))
}

function rollQualityForCraft(baseQuality) {
  // 跳级几率 25%
  if (Math.random() < 0.25) {
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
  
  // 消耗材料
  store.addGold(-recipe.goldCost)
  for (const mat of recipe.materials) store.addMaterial(mat.id, '', -mat.qty)

  // 成功率 80%
  if (Math.random() >= 0.8) {
    window.showToast('制作失败，材料已消耗')
    store.save()
    return
  }

  // 成功制作
  const quality = rollQualityForCraft(recipe.quality || 'white')
  const playerLv = store.player.level
  const itemLevel = Math.max(1, playerLv + Math.floor(Math.random() * 5) - 2)
  const baseAtk = recipe.baseAtk || 10
  const baseDef = recipe.baseDef || 5
  const qualityMult = QUALITY_STATS_MULTIPLIER[quality] || 1

  const craftedMultiplier = 1.3
  const progressLevel = Math.min(itemLevel, 20)
  const levelBonus = 1 + (progressLevel - 1) * 0.12

  const part = recipe.type || 'armor'
  const isOffensivePart = ['weapon', 'gauntlet'].includes(part)
  const isDefensivePart = ['armor', 'helmet', 'pants', 'shoes'].includes(part)

  const atk = isOffensivePart 
    ? Math.floor(baseAtk * qualityMult * levelBonus * craftedMultiplier)
    : 0
  const def = isDefensivePart
    ? Math.floor(baseDef * qualityMult * levelBonus * craftedMultiplier)
    : 0

  const affixes = generateAffixesForCraft(quality, itemLevel)
  const extraStats = generateExtraStat(part, quality, itemLevel)

  if (part === 'shoes') {
    extraStats.speed = (extraStats.speed || 0) + 2 + Math.floor(Math.random() * 5)
  }

  const fixedAffix = {
    id: 'bossDmgFix',
    level: 15,
    desc: '对Boss伤害 +18%',
    fixed: true
  }

  const item = {
    id: `equip_${Date.now()}`,
    name: recipe.name,
    icon: recipe.icon || (recipe.type === 'weapon' ? 'mdi:sword' : 'mdi:shield'),
    type: recipe.type,
    part: part,
    level: itemLevel,
    levelFailCount: 0,
    qualityFailCount: 0,
    quality: quality,
    atk: atk,
    def: def,
    baseAtk: recipe.baseAtk || 10,
    baseDef: recipe.baseDef || 5,
    extraStats: extraStats,
    affixes: affixes,
    fixedAffix: fixedAffix,
    bossDmgBonus: 18,
    levelRequired: recipe.levelRequired || 1,
    gemSlots: recipe.gemSlots || 0,
    setId: recipe.setId || '',
  }

  store.inventory.push(item)
  store.save()
  const jumpMsg = quality !== recipe.quality ? '（品质提升！）' : ''
  window.showToast(`成功制作 ${item.name}！${jumpMsg}已放入背包。`)
}

// 强化系统（仅等级强化）
function levelUpgradeCost(item) {
  const config = store.config.enhanceConfig?.levelUp
  if (!config || !config.perLevel) return { gold: 99999, materials: [] }
  return config.perLevel(item.level, item.quality) || { gold: 99999, materials: [] }
}

function canUpgradeLevel(item) {
  if (!item || item.level >= 99) return false
  const cost = levelUpgradeCost(item)
  if (!cost || !cost.materials) return false
  if (store.player.gold < cost.gold) return false
  return cost.materials.every(mat => hasMaterial(mat.id, mat.qty))
}

function upgradeLevel(item) {
  if (!canUpgradeLevel(item)) return window.showToast('材料或金币不足！');
  const cost = levelUpgradeCost(item);
  store.addGold(-cost.gold);
  for (const mat of cost.materials) store.addMaterial(mat.id, '', -mat.qty);

  const successRate = getLevelSuccessRate(item);
  if (Math.random() < successRate) {
    item.level += 1;

    const mult = QUALITY_STATS_MULTIPLIER[item.quality] || 1;
    const craftedMultiplier = 1.3;
    const progressLevel = Math.min(item.level, 20);
    const levelBonus = 1 + (progressLevel - 1) * 0.12;

    const baseAtk = item.baseAtk || 10;
    const baseDef = item.baseDef || 5;

    const part = item.part || item.type || 'armor';
    const isOffensive = ['weapon', 'gauntlet'].includes(part);
    const isDefensive = ['armor', 'helmet', 'pants', 'shoes'].includes(part);

    if (isOffensive) {
      item.atk = Math.floor(baseAtk * mult * levelBonus * craftedMultiplier);
      item.def = 0;
    } else if (isDefensive) {
      item.atk = 0;
      item.def = Math.floor(baseDef * mult * levelBonus * craftedMultiplier);
    } else {
      item.atk = Math.floor(baseAtk * mult * levelBonus * craftedMultiplier);
      item.def = Math.floor(baseDef * mult * levelBonus * craftedMultiplier);
    }

    // 副词条成长
    if (item.extraStats) {
      const limitedKeys = ['critRate', 'critDmg', 'dodge', 'lifesteal', 'speed'];
      const limitedPercentKeys = ['critRatePercent', 'dodgePercent'];
      if (!item._initialExtraStats) item._initialExtraStats = {};
      for (const key of Object.keys(item.extraStats)) {
        const val = item.extraStats[key];
        if (!item._initialExtraStats[key]) item._initialExtraStats[key] = val;
        const initial = item._initialExtraStats[key];
        const maxVal = initial * 3;
        if (limitedPercentKeys.includes(key)) {
          item.extraStats[key] = Math.min(15, val + 0.8);
        } else if (limitedKeys.includes(key)) {
          const hardMax = key === 'critRate' ? 30 : key === 'critDmg' ? 200 : 40;
          item.extraStats[key] = Math.min(hardMax, Math.floor(val * 1.02));
        } else if (key.endsWith('Percent')) {
          item.extraStats[key] = Math.min(50, val + 1.5);
        } else {
          item.extraStats[key] = Math.min(maxVal, Math.floor(val * 1.06));
        }
      }
    }

    item.levelFailCount = 0;
    // 若装备在身上，同步属性（如有需要可调用 store 方法，此处省略）
    store.save();
    window.showToast(`${item.name} 强化成功！当前 Lv.${item.level}`);
  } else {
    item.levelFailCount = (item.levelFailCount || 0) + 1;
    store.save();
    window.showToast(`强化失败！下次成功率 ${Math.floor(getLevelSuccessRate(item) * 100)}%`);
  }
}
</script>

<style scoped>
/* 全屏面板，无圆角，占满视口 */
.overlay { position: fixed; inset: 0; z-index: 200; }
.panel { width: 100vw; height: 100vh; display: flex; flex-direction: column; background: rgba(15,25,45,0.95); color: #ffd; font-family: 'Press Start 2P', cursive; }

/* 顶部栏压缩 */
.top-bar { display: flex; align-items: center; gap: 10px; padding: 6px 12px; background: rgba(0,0,0,0.4); border-bottom: 1px solid #b89a6a; flex-shrink: 0; }
.top-bar h2 { font-size: 14px; margin: 0; display: flex; align-items: center; gap: 6px; }
.mode-tabs { display: flex; gap: 6px; margin-left: auto; }
.mode-btn { background: rgba(0,0,0,0.5); border: 1px solid #5a5a7a; border-radius: 6px; padding: 4px 12px; font-size: 9px; color: #ccc; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.mode-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }
.close-btn { background: none; border: none; color: #ffd; font-size: 18px; cursor: pointer; }

/* 内容区域滚动 */
.content { flex: 1; overflow-y: auto; padding: 10px; }

/* 制作模式 */
.forge-filter { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.filter-btn { background: rgba(0,0,0,0.5); border: 1px solid #5a5a7a; border-radius: 6px; padding: 3px 10px; font-size: 8px; color: #ccc; cursor: pointer; }
.filter-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }

.forge-layout { display: flex; gap: 12px; }
.recipes-section { flex: 1; }
.materials-section { width: 230px; flex-shrink: 0; background: rgba(0,0,0,0.2); border-radius: 10px; padding: 10px; max-height: calc(100vh - 120px); overflow-y: auto; }
.recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; }
.recipe-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.3); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.recipe-header { display: flex; align-items: center; gap: 8px; }
.recipe-name { font-size: 10px; flex: 1; }
.recipe-quality { font-size: 7px; padding: 1px 8px; border-radius: 10px; background: rgba(255,255,255,0.1); }
.recipe-mats { display: flex; flex-wrap: wrap; gap: 4px; }
.mat-requirement { display: flex; align-items: center; gap: 3px; font-size: 7px; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 6px; }
.mat-requirement.gold { background: rgba(255,215,0,0.15); }
.mat-icon-small { font-size: 12px; }
.mat-qty { font-weight: bold; }
.craft-info { display: flex; justify-content: space-between; font-size: 7px; color: #aaa; margin: 4px 0; }
.success-rate { color: #4caf50; }
.rare-rate { color: #ff9800; }

.check-icon { color: #4caf50; }
.cross-icon { color: #f44336; }
.pixel-btn.primary { background: rgba(255,215,0,0.15); display: flex; align-items: center; gap: 4px; border: 1px solid #ffd700; padding: 5px 10px; font-size: 8px; border-radius: 6px; cursor: pointer; color: #ffd; }
.pixel-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* 强化模式 */
.upgrade-layout { display: flex; gap: 12px; }
.upgrade-equip-list { width: 45%; overflow-y: auto; max-height: calc(100vh - 120px); padding-right: 5px; }
.upgrade-detail { flex: 1; background: rgba(0,0,0,0.3); border-radius: 10px; padding: 15px; }
.upgrade-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.3); border-radius: 8px; padding: 10px; margin-bottom: 6px; cursor: pointer; }
.upgrade-card:hover { background: rgba(255,215,0,0.1); }
.upgrade-name { font-size: 9px; }
.upgrade-quality { font-size: 7px; }
.upgrade-stats { font-size: 7px; color: #ccc; }
.upgrade-info { font-size: 8px; line-height: 1.6; margin-bottom: 12px; }
.upgrade-actions { display: flex; gap: 8px; }

.empty-mats { text-align: center; font-size: 10px; opacity: 0.6; padding: 30px; }

/* 移动端横屏优化 */
@media (max-width: 700px) {
  .top-bar h2 { font-size: 12px; }
  .mode-btn { padding: 4px 8px; font-size: 8px; }
  .forge-layout { flex-direction: column; }
  .materials-section { width: 100%; max-height: 30vh; }
  .recipe-grid { grid-template-columns: 1fr; }
  .upgrade-layout { flex-direction: column; }
  .upgrade-equip-list { width: 100%; max-height: 35vh; }
}
</style>