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
                <span v-if="item.atk > 0">攻 +{{ item.atk }}</span>
                <span v-if="item.def > 0">防 +{{ item.def }}</span>
                <span v-for="(val, key) in item.extraStats" :key="key" class="upgrade-extra-stat">
                  {{ getExtraStatName(key) }}+{{ val }}
                </span>
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
              
              <!-- 副词条显示 -->
              <div v-if="selectedUpgradeItem.extraStats && Object.keys(selectedUpgradeItem.extraStats).length" class="upgrade-extra-section">
                <div class="upgrade-extra-title">附加属性</div>
                <div v-for="(val, key) in selectedUpgradeItem.extraStats" :key="key" class="upgrade-extra-row">
                  {{ getExtraStatName(key) }} +{{ val }}
                </div>
              </div>

              <div v-if="selectedUpgradeItem.affixes?.length" class="upgrade-affixes">
                词条：
                <div class="affix-tags">
                  <div v-if="selectedUpgradeItem.fixedAffix" class="affix-tag fixed">
                    <span class="fixed-circle"></span>
                    <span class="fixed-text">对Boss增伤 +{{ selectedUpgradeItem.bossDmgBonus }}%</span>
                  </div>
                  <div v-for="aff in selectedUpgradeItem.affixes" :key="aff.id" class="affix-tag">
                    <span>{{ getAffixName(aff.id) }} Lv.{{ aff.level }}</span>
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

// ========== 副词条生成函数 ==========
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

// ========== 成功率计算 ==========
function getLevelSuccessRate(item) {
  const config = store.config.enhanceConfig?.levelUp?.perLevel(item.level, item.quality)
  if (!config) return 0
  const base = config.successRate || 0.5
  const failCount = item.levelFailCount || 0
  return Math.min(1, base + failCount * 0.1)
}

function getQualitySuccessRate(item) {
  const config = store.config.enhanceConfig?.qualityUpgrade?.[item.quality]
  if (!config) return 0
  const base = config.successRate || 0.5
  const failCount = item.qualityFailCount || 0
  return Math.min(1, base + failCount * 0.15)
}

// ========== 套装筛选 ==========
const setFilterOptions = computed(() => {
  const sets = new Set(store.config.forgeRecipes.map(r => r.setId).filter(Boolean))
  const options = [{ label: '全部', value: 'all' }]
  const setNames = {
    dragon_set: '龙骸', shadow_set: '暗影咒装', crimson_set: '血怒',
    iron_set: '铁之意志', spider_set: '蛛丝暗影', stone_set: '石魔之力',
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

const upgradeableItems = computed(() => {
  return (store.inventory || []).filter(item => {
    if (!item || !item.part) return false
    const validParts = ['weapon','gauntlet','helmet','armor','pants','shoes','necklace','ring1','ring2','earring1','earring2']
    return validParts.includes(item.part) && item.quality
  })
})

// ========== 工具函数 ==========
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

// ========== 制作系统 ==========
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

  // ✅ 调整后的制作系数与等级成长
  const craftedMultiplier = 1.3
  const progressLevel = Math.min(itemLevel, 20)
  const levelBonus = 1 + (progressLevel - 1) * 0.12

  const part = recipe.type || 'armor'
  const isOffensivePart = ['weapon', 'gauntlet'].includes(part)
  const isDefensivePart = ['armor', 'helmet', 'pants', 'shoes'].includes(part)

  // ✅ 使用新的 levelBonus 替换旧的硬编码 0.15
  const atk = isOffensivePart 
    ? Math.floor(baseAtk * qualityMult * levelBonus * craftedMultiplier)
    : 0

  const def = isDefensivePart
    ? Math.floor(baseDef * qualityMult * levelBonus * craftedMultiplier)
    : 0

  const affixes = generateAffixesForCraft(quality, itemLevel)
  const extraStats = generateExtraStat(recipe.type || 'weapon', quality, itemLevel)

  // 鞋子额外速度
  if (part === 'shoes') {
    extraStats.speed = (extraStats.speed || 0) + 2 + Math.floor(Math.random() * 5)
  }

  const fixedAffix = {
    id: 'bossDmgFix',
    level: 15,
    desc: '对Boss伤害 +18%',   // ✅ 小幅提升增伤，与 bossDmgBonus 同步
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
    bossDmgBonus: 18,            // ✅ 从 15 提升至 18
    levelRequired: recipe.levelRequired || 1,
    gemSlots: recipe.gemSlots || 0,
    setId: recipe.setId || '',
  }

  store.inventory.push(item)
  store.save()
  window.showToast(`成功制作 ${item.name}！已放入背包。`)
}

// ========== 强化系统 ==========
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
  const levelRequirements = { white: 10, green: 20, blue: 30, purple: 40 }
  const requiredLevel = levelRequirements[item.quality] || 0
  if (item.level < requiredLevel) return false
  const cost = qualityUpgradeCost(item)
  if (!cost || !cost.materials) return false
  if (store.player.gold < cost.gold) return false
  return cost.materials.every(mat => hasMaterial(mat.id, mat.qty))
}

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

    // ===== 使用与制作完全相同的计算公式 =====
    const mult = QUALITY_STATS_MULTIPLIER[item.quality] || 1;
    const craftedMultiplier = 1.3;                    // 和 craft 一样
    const progressLevel = Math.min(item.level, 20);    // 封顶20级
    const levelBonus = 1 + (progressLevel - 1) * 0.12; // 和 craft 一样

    // 使用物品自带的 baseAtk/baseDef（制作时已固化）
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
      // 饰品（双属性）
      item.atk = Math.floor(baseAtk * mult * levelBonus * craftedMultiplier);
      item.def = Math.floor(baseDef * mult * levelBonus * craftedMultiplier);
    }
    // ==========================================

    // 副词条成长（保持不变）
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
    syncEquippedItem(item);
    store.save();
    window.showToast(`${item.name} 升级为 Lv.${item.level}！`);
  } else {
    item.levelFailCount = (item.levelFailCount || 0) + 1;
    syncEquippedItem(item);
    store.save();
    window.showToast(`升级失败！下次成功率 ${Math.floor(getLevelSuccessRate(item) * 100)}%`);
  }
}

function reforgeCost(item) {
  const config = store.config.enhanceConfig?.affixReroll
  return config || { gold: 99999, materials: {} }
}

function canReforge(item) {
  const cost = reforgeCost(item)
  if (!cost || store.player.gold < cost.gold) return false
  const mats = cost.materials || cost.mats || []
  for (const mat of mats) {
    if (!hasMaterial(mat.id, mat.qty)) return false
  }
  return true
}

function reforgeAffixes(item) {
  if (!canReforge(item)) return window.showToast('材料或金币不足！')
  const cost = reforgeCost(item)
  store.addGold(-cost.gold)
  for (const [id, qty] of Object.entries(cost.materials)) store.addMaterial(id, '', -qty)
  const affixKeys = Object.keys(AFFIX_EFFECTS)
  const minLevel = QUALITY_AFFIX_LEVEL_MIN[item.quality] || 1
  const randomCount = Math.min(2, 1 + Math.floor(Math.random() * 2))
  const newRandomAffixes = []
  const used = new Set()
  for (let i = 0; i < randomCount; i++) {
    const key = affixKeys[Math.floor(Math.random() * affixKeys.length)]
    if (used.has(key)) continue
    used.add(key)
    const level = Math.min(5, Math.max(minLevel, Math.floor(item.level / 10) + 1))
    newRandomAffixes.push({ id: key, level })
  }
  item.affixes = newRandomAffixes
  store.save()
  window.showToast(`${item.name} 的词条已重铸！`)
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 90vw; height: 90vh; background: rgba(15,25,45,0.95); border: 2px solid #b89a6a; border-radius: 24px; padding: 24px; color: #ffd; font-family: 'Press Start 2P', cursive; display: flex; flex-direction: column; position: relative; overflow-y: auto; }
.close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer; }
h2 { font-size: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }

.mode-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.mode-btn { background: rgba(0,0,0,0.5); border: 1px solid #5a5a7a; border-radius: 8px; padding: 8px 20px; font-size: 10px; color: #ccc; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
.mode-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }

.forge-filter { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.filter-btn { background: rgba(0,0,0,0.5); border: 1px solid #5a5a7a; border-radius: 8px; padding: 4px 12px; font-size: 8px; color: #ccc; cursor: pointer; transition: 0.2s; }
.filter-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }

.forge-layout { display: flex; gap: 20px; flex: 1; overflow: hidden; }
.recipes-section { flex: 1; overflow-y: auto; padding-right: 10px; }
.materials-section { width: 260px; flex-shrink: 0; background: rgba(0,0,0,0.2); border-radius: 16px; padding: 15px; overflow-y: auto; }

.recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.recipe-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.3); border-radius: 16px; padding: 15px; display: flex; flex-direction: column; gap: 8px; }
.recipe-header { display: flex; align-items: center; gap: 10px; }
.recipe-name { font-size: 11px; flex: 1; }
.recipe-quality { font-size: 8px; padding: 2px 10px; border-radius: 20px; background: rgba(255,255,255,0.1); }
.recipe-mats { display: flex; flex-wrap: wrap; gap: 6px; }
.mat-requirement { display: flex; align-items: center; gap: 4px; font-size: 8px; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 8px; }
.mat-requirement.gold { background: rgba(255,215,0,0.15); }
.mat-icon-small { font-size: 14px; }
.mat-qty { font-weight: bold; }

.check-icon { color: #4caf50; }
.cross-icon { color: #f44336; }

.pixel-btn.primary { background: rgba(255,215,0,0.15); display: flex; align-items: center; gap: 6px; margin-top: auto; border: 1px solid #ffd700; padding: 6px 12px; font-size: 9px; border-radius: 8px; cursor: pointer; color: #ffd; }

.materials-section h3 { font-size: 11px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.materials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 8px; }
.material-cell { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,215,0,0.2); border-radius: 10px; padding: 8px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.material-cell.low { opacity: 0.6; }
.mat-icon { font-size: 22px; color: #ffd700; }
.mat-name { font-size: 7px; color: #ccc; word-break: break-all; }
.mat-qty { font-size: 8px; font-weight: bold; color: #ffd; background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 10px; }

.empty-mats { text-align: center; font-size: 10px; opacity: 0.6; padding: 30px; }

/* 强化模式布局 */
.upgrade-layout { display: flex; gap: 20px; flex: 1; overflow: hidden; }
.upgrade-equip-list { width: 45%; overflow-y: auto; padding-right: 10px; }
.upgrade-detail { flex: 1; background: rgba(0,0,0,0.3); border-radius: 16px; padding: 20px; overflow-y: auto; }
.upgrade-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: 0.2s; }
.upgrade-card:hover { background: rgba(255,215,0,0.1); }
.upgrade-name { font-size: 10px; color: #ffe4b5; }
.upgrade-quality { font-size: 8px; margin: 4px 0; }
.upgrade-stats { font-size: 8px; color: #ccc; display: flex; gap: 12px; flex-wrap: wrap; }
.upgrade-info { font-size: 9px; color: #ddd; line-height: 1.8; margin-bottom: 20px; }
.upgrade-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.pixel-btn.warning { background: rgba(255,165,0,0.15); border: 1px solid #ffa500; }
.pixel-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* 副词条样式 */
.upgrade-extra-stat { color: #aaa; font-size: 7px; }
.upgrade-extra-section { margin-top: 8px; border-top: 1px solid rgba(255,215,0,0.2); padding-top: 6px; }
.upgrade-extra-title { font-size: 8px; color: #ffd700; margin-bottom: 4px; }
.upgrade-extra-row { font-size: 8px; color: #ccc; margin: 2px 0; }
.upgrade-stats-row { margin: 4px 0; }

/* 词条样式 */
.affix-tag { background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(184, 154, 106, 0.3); border-radius: 6px; padding: 2px 8px; font-size: 8px; color: #ccc; display: inline-flex; align-items: center; gap: 4px; margin-right: 4px; }
.affix-tag.fixed { border-color: #f0c060; background: rgba(240, 192, 96, 0.12); box-shadow: 0 0 6px rgba(240, 192, 96, 0.3); }
.affix-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.fixed-circle { width: 8px; height: 8px; border-radius: 50%; border: 2px solid #f0c060; background: transparent; flex-shrink: 0; animation: pulse-gold 2s infinite; }
.fixed-text { color: #f0c060; font-weight: bold; text-shadow: 0 0 4px rgba(240, 192, 96, 0.5); }

@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(240, 192, 96, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(240, 192, 96, 0); }
}

/* 移动端适配 */
@media (max-width: 700px) {
  .panel { width: 95vw; height: 95vh; }
  .forge-layout { flex-direction: column; }
  .materials-section { width: 100%; max-height: 30vh; }
  .recipe-grid { grid-template-columns: 1fr; }
  .upgrade-layout { flex-direction: column; }
  .upgrade-equip-list { width: 100%; max-height: 40vh; }
}
</style>