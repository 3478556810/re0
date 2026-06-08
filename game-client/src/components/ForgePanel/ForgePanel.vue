<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <h2><Icon icon="mdi:anvil" /> 锻造</h2>

      <div class="mode-tabs">
        <button :class="['mode-btn', { active: forgeMode === 'craft' }]" @click="forgeMode = 'craft'">
          <Icon icon="mdi:hammer" /> 制作装备
        </button>
        <button :class="['mode-btn', { active: forgeMode === 'upgrade' }]" @click="forgeMode = 'upgrade'">
          <Icon icon="mdi:star-four-points" /> 强化装备
        </button>
      </div>

      <!-- 制作模式（不变） -->
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
        <div class="equip-filter">
          <button v-for="opt in equipFilterOptions" :key="opt.value"
            :class="['filter-btn', { active: equipFilter === opt.value }]"
            @click="equipFilter = opt.value">
            {{ opt.label }}
          </button>
        </div>

        <div class="upgrade-layout">
          <div class="upgrade-equip-list">
            <div v-if="filteredUpgradeableItems.length === 0" class="empty-mats">没有可强化的装备</div>
            <div v-for="item in filteredUpgradeableItems" :key="item.id"
              class="upgrade-card" :class="['quality-' + item.quality, { equipped: item.equipped }]"
              @click="selectForUpgrade(item)">
              <div class="upgrade-name">
                {{ item.name }}
                <span class="acc-level">Lv.{{ item.level }}</span>
                <!-- 根据等级显示多个菱形 -->
                <span class="diamond-group" v-if="Math.floor(item.level / 20) > 0">
                  <span v-for="n in Math.floor(item.level / 20)" :key="n" class="golden-diamond">
                    <Icon icon="mdi:rhombus" />
                  </span>
                </span>
              </div>
              <div class="upgrade-quality" :style="{ color: qualityColor(item.quality) }">{{ qualityLabel(item.quality) }}</div>
              <div class="upgrade-stats">
                <span v-if="item.atk > 0">攻 +{{ item.atk }}</span>
                <span v-if="item.def > 0">防 +{{ item.def }}</span>
                <span v-for="(val, key) in item.extraStats" :key="key" class="upgrade-extra-stat">
                  {{ getExtraStatName(key) }}+{{ val }}
                </span>
              </div>
              <div v-if="item.equipped" class="equipped-badge">已装备</div>
            </div>
          </div>

          <div class="upgrade-detail" v-if="selectedUpgradeItem">
            <h3>
              强化 {{ selectedUpgradeItem.name }}
              <span class="diamond-group" v-if="Math.floor(selectedUpgradeItem.level / 20) > 0">
                <span v-for="n in Math.floor(selectedUpgradeItem.level / 20)" :key="n" class="golden-diamond">
                  <Icon icon="mdi:rhombus" />
                </span>
              </span>
            </h3>
            <div class="upgrade-info">
              <div>品质：<span :style="{ color: qualityColor(selectedUpgradeItem.quality) }">{{ qualityLabel(selectedUpgradeItem.quality) }}</span></div>
              <div>等级：Lv.{{ selectedUpgradeItem.level }}</div>
              <div class="upgrade-stats-row">
                <span v-if="selectedUpgradeItem.atk > 0">攻击 +{{ selectedUpgradeItem.atk }}</span>
                <span v-if="selectedUpgradeItem.atk > 0 && selectedUpgradeItem.def > 0"> | </span>
                <span v-if="selectedUpgradeItem.def > 0">防御 +{{ selectedUpgradeItem.def }}</span>
              </div>
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
              <button class="pixel-btn primary" @click="upgradeLevel(selectedUpgradeItem)">
                <Icon icon="mdi:arrow-up-bold" /> 强化 ({{ levelUpgradeCost(selectedUpgradeItem).gold }}G) - {{ Math.floor(getLevelSuccessRate(selectedUpgradeItem) * 100) }}%
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useForgePanel } from './ForgePanel.js'
const {
  store,
  forgeMode,
  currentSetFilter,
  setFilterOptions,
  filteredRecipes,
  equipFilter,
  equipFilterOptions,
  filteredUpgradeableItems,
  selectedUpgradeItem,
  materialIcon,
  hasMaterial,
  qualityColor,
  qualityLabel,
  canCraft,
  craft,
  getExtraStatName,
  getAffixName,
  getLevelSuccessRate,
  levelUpgradeCost,
  canUpgradeLevel,
  upgradeLevel,
  selectForUpgrade
} = useForgePanel()
</script>

<style src="./ForgePanel.css" scoped></style>