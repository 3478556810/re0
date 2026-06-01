<template>
  <div class="section">
    <h3><Icon icon="mdi:database-import" /> 初始配置宏观管理</h3>
    <p class="hint">一键导入默认配置，或清空/导出各模块数据</p>

    <!-- 一键全量操作 -->
    <div class="macro-buttons">
      <button class="pixel-btn primary" @click="importAllDefaults">
        <Icon icon="mdi:download" /> 导入全部默认配置
      </button>
      <button class="pixel-btn danger" @click="clearAllConfigs">
        <Icon icon="mdi:delete-forever" /> 清空全部配置
      </button>
      <button class="pixel-btn" @click="exportAllConfigs">
        <Icon icon="mdi:export" /> 导出全部配置 JSON
      </button>
    </div>

    <!-- 导入全部 JSON -->
    <div class="import-section">
      <h4>从 JSON 批量导入</h4>
      <textarea v-model="allJsonText" class="pixel-textarea" rows="8" placeholder="粘贴包含所有模块的 JSON..."></textarea>
      <button class="pixel-btn" @click="importAllFromJson">导入 JSON</button>
    </div>

    <!-- 各模块独立操作 -->
    <div class="module-list">
      <div v-for="mod in modules" :key="mod.key" class="module-card">
        <div class="module-info">
          <Icon :icon="mod.icon" class="module-icon" />
          <div>
            <strong>{{ mod.label }}</strong>
            <span class="module-count">{{ getCount(mod.key) }} 项</span>
          </div>
        </div>
        <div class="module-actions">
          <button class="pixel-btn small" @click="importModuleDefaults(mod.key)">导入默认</button>
          <button class="pixel-btn small" @click="exportModule(mod.key)">导出</button>
          <button class="pixel-btn small danger" @click="clearModule(mod.key)">清空</button>
        </div>
      </div>
    </div>

    <!-- 提示 -->
    <p class="warn-text"><Icon icon="mdi:alert" /> 操作后记得点「保存到存档」或会自动保存</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../../store/gameStore'

const store = useGameStore()
const allJsonText = ref('')

// ========== 默认配置数据 ==========
// 这些是代码中的初始值，确保结构完整

const defaultConfigs = {
  monsterTemplates: [
    {
      id: 'slime', name: '史莱姆', tag: 'weak', isBoss: false,
      baseHp: 35, baseAtk: 10, baseDef: 6, exp: 20,
      material: { id: 'slime_gel', name: '史莱姆凝露' },
      icon: 'mdi:blur', element: '', trait: '',
      critRate: 0, critDmg: 0, lifesteal: 0, luck: 0,
      fireDmg: 0, waterDmg: 0, thunderDmg: 0, windDmg: 0,
      grassDmg: 0, iceDmg: 0, holyDmg: 0, darkDmg: 0,
      steelDmg: 0, rockDmg: 0, skillsText: '[]',
      minLevel: 1, maxLevel: 3, levelRange: [1, 3]
    },
    {
      id: 'goblin', name: '哥布林', tag: 'weak', isBoss: false,
      baseHp: 45, baseAtk: 16, baseDef: 10, exp: 35,
      material: { id: 'goblin_fang', name: '哥布林之牙' },
      icon: 'mdi:alien', element: '', trait: '',
      critRate: 0, critDmg: 0, lifesteal: 0, luck: 0,
      fireDmg: 0, waterDmg: 0, thunderDmg: 0, windDmg: 0,
      grassDmg: 0, iceDmg: 0, holyDmg: 0, darkDmg: 0,
      steelDmg: 0, rockDmg: 0, skillsText: '[]',
      minLevel: 1, maxLevel: 4, levelRange: [1, 4]
    },
    {
      id: 'wolf', name: '森林狼', tag: 'normal', isBoss: false,
      baseHp: 50, baseAtk: 22, baseDef: 12, exp: 45,
      material: { id: 'wolf_fang', name: '狼牙' },
      icon: 'mdi:dog', element: '', trait: '',
      critRate: 0, critDmg: 0, lifesteal: 0, luck: 0,
      fireDmg: 0, waterDmg: 0, thunderDmg: 0, windDmg: 0,
      grassDmg: 0, iceDmg: 0, holyDmg: 0, darkDmg: 0,
      steelDmg: 0, rockDmg: 0, skillsText: '[]',
      minLevel: 2, maxLevel: 5, levelRange: [2, 5]
    },
    {
      id: 'scorpion', name: '毒蝎', tag: 'normal', isBoss: false,
      baseHp: 40, baseAtk: 22, baseDef: 14, exp: 40,
      material: { id: 'scorpion_tail', name: '蝎尾针' },
      icon: 'mdi:bug', element: '', trait: '',
      critRate: 0, critDmg: 0, lifesteal: 0, luck: 0,
      fireDmg: 0, waterDmg: 0, thunderDmg: 0, windDmg: 0,
      grassDmg: 0, iceDmg: 0, holyDmg: 0, darkDmg: 0,
      steelDmg: 0, rockDmg: 0, skillsText: '[]',
      minLevel: 2, maxLevel: 6, levelRange: [2, 6]
    },
    {
      id: 'golem', name: '石魔像', tag: 'strong', isBoss: false,
      baseHp: 80, baseAtk: 30, baseDef: 25, exp: 80,
      material: { id: 'golem_core', name: '魔像核心' },
      icon: 'mdi:robot', element: '', trait: '',
      critRate: 0, critDmg: 0, lifesteal: 0, luck: 0,
      fireDmg: 0, waterDmg: 0, thunderDmg: 0, windDmg: 0,
      grassDmg: 0, iceDmg: 0, holyDmg: 0, darkDmg: 0,
      steelDmg: 0, rockDmg: 0, skillsText: '[]',
      minLevel: 3, maxLevel: 8, levelRange: [3, 8]
    },
    {
      id: 'boss_wolfking', name: '狼王', tag: 'boss', isBoss: true,
      baseHp: 120, baseAtk: 35, baseDef: 20, exp: 150,
      material: { id: 'wolf_heart', name: '狼王之心' },
      icon: 'mdi:skull', element: '', trait: '',
      critRate: 0, critDmg: 0, lifesteal: 0, luck: 0,
      fireDmg: 0, waterDmg: 0, thunderDmg: 0, windDmg: 0,
      grassDmg: 0, iceDmg: 0, holyDmg: 0, darkDmg: 0,
      steelDmg: 0, rockDmg: 0, skillsText: '[]',
      minLevel: 5, maxLevel: 10, levelRange: [5, 10]
    }
  ],

  skillPool: [
    {
      id: 'normal_attack', name: '普通攻击', desc: '无属性基础攻击',
      type: 'active', target: 'single', element: '', mpCost: 0,
      baseMul: 1.0, maxLevel: 5, upgradeCost: 2,
      icon: 'mdi:sword-cross',
      levelScaling: { baseMul: 0.1, mpCost: 0 },
      effects: [],
      tripods: []
    },
    {
      id: 'fire_slash', name: '火焰斩', desc: '火属性攻击',
      type: 'active', target: 'single', element: 'fire', mpCost: 5,
      baseMul: 1.8, maxLevel: 5, upgradeCost: 2,
      icon: 'mdi:fire',
      levelScaling: { baseMul: 0.15, mpCost: 1 },
      effects: [],
      tripods: []
    },
    {
      id: 'ice_bolt', name: '冰冻术', desc: '冰属性攻击',
      type: 'active', target: 'single', element: 'ice', mpCost: 8,
      baseMul: 2.0, maxLevel: 5, upgradeCost: 3,
      icon: 'mdi:snowflake',
      levelScaling: { baseMul: 0.2, mpCost: 2 },
      effects: [],
      tripods: []
    },
    {
      id: 'thunder_shock', name: '雷电', desc: '雷属性攻击',
      type: 'active', target: 'single', element: 'thunder', mpCost: 6,
      baseMul: 1.6, maxLevel: 5, upgradeCost: 2,
      icon: 'mdi:lightning-bolt',
      levelScaling: { baseMul: 0.12, mpCost: 1 },
      effects: [],
      tripods: []
    }
  ],

 forgeRecipes: [
  {
    id: 'iron_sword', name: '铁剑',
    materials: [
      { id: 'iron_ore', qty: 3 },
      { id: 'slime_gel', qty: 2 }
    ],
    goldCost: 80,
    result: { type: 'weapon', part: 'weapon', name: '铁剑', atk: 15, def: 0, affixSlots: 1, icon: 'mdi:sword' }
  },
  {
    id: 'leather_armor', name: '皮革甲',
    materials: [
      { id: 'wolf_fang', qty: 4 },
      { id: 'iron_ore', qty: 2 }
    ],
    goldCost: 120,
    result: { type: 'armor', part: 'armor', name: '皮革甲', atk: 0, def: 12, affixSlots: 1, icon: 'mdi:shield' }
  }
],

  materialDefinitions: [
    { id: 'slime_gel', name: '史莱姆凝露', type: 'forge', dropRate: 40 },
    { id: 'goblin_fang', name: '哥布林之牙', type: 'forge', dropRate: 35 },
    { id: 'scorpion_tail', name: '蝎尾针', type: 'forge', dropRate: 20 },
    { id: 'iron_ore', name: '铁矿石', type: 'forge', dropRate: 30 },
    { id: 'dragon_scale', name: '龙鳞', type: 'forge', dropRate: 5 },
    { id: 'dungeon_token', name: '地下城徽记', type: 'other', dropRate: 0 },
    { id: 'golem_core', name: '魔像核心', type: 'forge', dropRate: 10 },
    { id: 'wolf_fang', name: '狼牙', type: 'forge', dropRate: 25 },
    { id: 'wolf_heart', name: '狼王之心', type: 'forge', dropRate: 8 },
    { id: 'scorpion_heart', name: '蝎皇之心', type: 'forge', dropRate: 8 }
  ],

  dungeonConfigs: {
    cave_of_slimes: {
      name: '史莱姆洞穴',
      icon: 'mdi:blur',
      maxFloors: 5,
      cooldown: 1,
      monstersByFloor: {
        1: ['slime'],
        2: ['slime', 'slime'],
        3: ['goblin'],
        4: ['goblin', 'slime'],
        5: ['boss_wolfking']
      }
    }
  },

  tokenShopItems: [
    { id: 't1', name: '龙鳞 x3', desc: '稀有锻造材料', type: 'material', cost: 5, rewardId: 'dragon_scale', rewardName: '龙鳞', rewardQty: 3 },
    { id: 't2', name: '随机饰品', desc: '获得一件随机品质饰品', type: 'accessory', cost: 10 },
    { id: 't3', name: '经验药水', desc: '获得 100 经验', type: 'material', cost: 3, rewardId: 'exp_potion', rewardName: '经验药水', rewardQty: 1 }
  ],

  storyScript: {
    start: { id: 'start', text: '欢迎来到星痕大陆...', next: 'node_1', choices: [] },
    node_1: { id: 'node_1', text: '你在城镇中心...', next: null, choices: [] }
  },

  materialPrices: {
    slime_gel: 10, goblin_fang: 15, scorpion_tail: 20, iron_ore: 25,
    dragon_scale: 100, dungeon_token: 50, golem_core: 80, wolf_fang: 18,
    wolf_heart: 60, scorpion_heart: 70
  }
}

// ========== 模块定义 ==========
const modules = [
  { key: 'monsterTemplates', label: '怪物模板', icon: 'mdi:skull' },
  { key: 'skillPool', label: '技能数据库', icon: 'mdi:star-four-points' },
  { key: 'forgeRecipes', label: '锻造配方', icon: 'mdi:anvil' },
  { key: 'materialDefinitions', label: '材料定义', icon: 'mdi:package-variant-closed' },
  { key: 'dungeonConfigs', label: '地下城配置', icon: 'mdi:castle' },
  { key: 'tokenShopItems', label: '兑换商店', icon: 'mdi:store' },
  { key: 'storyScript', label: '剧情脚本', icon: 'mdi:script-text-outline' },
  { key: 'materialPrices', label: '材料价格', icon: 'mdi:cash' }
]

// ========== 方法 ==========

function getCount(key) {
  const val = store.config[key]
  if (!val) return 0
  if (Array.isArray(val)) return val.length
  if (typeof val === 'object') return Object.keys(val).length
  return 0
}

import { loadContentPacks } from '../../utils/contentLoader'
import { inject } from 'vue'
const showToast = inject('showToast', (msg) => alert(msg))
async function importAllDefaults() {
  if (!confirm('将重新加载 public/data/ 中的配置，当前配置将被覆盖。确定？')) return
  const packConfig = await loadContentPacks()
  for (const key of Object.keys(packConfig)) {
    store.config[key] = packConfig[key]
  }
  store.save()
  showToast('✅ 已从文件重新加载配置')
  location.reload()
}

function clearAllConfigs() {
  if (!confirm('⚠️ 将清空所有模块配置（设为空），游戏可能无法正常运行。确定？')) return
  for (const mod of modules) {
    const key = mod.key
    if (Array.isArray(store.config[key])) {
      store.config[key] = []
    } else if (typeof store.config[key] === 'object') {
      store.config[key] = {}
    }
  }
  store.save()
  showToast('✅ 全部配置已清空')
  location.reload()
}

function importModuleDefaults(key) {
  if (!confirm(`将导入 ${modules.find(m => m.key === key)?.label || key} 的默认配置？`)) return
  if (defaultConfigs[key] !== undefined) {
    store.config[key] = JSON.parse(JSON.stringify(defaultConfigs[key]))
    store.save()
    showToast('✅ 已导入默认配置')
  } else {
    showToast('⚠️ 该模块暂无默认配置数据')
  }
}

function exportModule(key) {
  const data = store.config[key]
  if (!data) return
  navigator.clipboard.writeText(JSON.stringify(data, null, 2))
  showToast(`✅ ${modules.find(m => m.key === key)?.label || key} 配置已复制到剪贴板`)
}

function clearModule(key) {
  if (!confirm(`⚠️ 将清空 ${modules.find(m => m.key === key)?.label || key} 的所有数据。确定？`)) return
  if (Array.isArray(store.config[key])) {
    store.config[key] = []
  } else if (typeof store.config[key] === 'object') {
    store.config[key] = {}
  }
  store.save()
  showToast('✅ 已清空')
}

function exportAllConfigs() {
  const allData = {}
  for (const mod of modules) {
    allData[mod.key] = store.config[mod.key]
  }
  navigator.clipboard.writeText(JSON.stringify(allData, null, 2))
  showToast('✅ 全部配置已复制到剪贴板')
}

function importAllFromJson() {
  try {
    const data = JSON.parse(allJsonText.value)
    let importedCount = 0
    for (const mod of modules) {
      if (data[mod.key] !== undefined) {
        store.config[mod.key] = JSON.parse(JSON.stringify(data[mod.key]))
        importedCount++
      }
    }
    store.save()
    allJsonText.value = ''
    showToast(`✅ 已导入 ${importedCount} 个模块的配置`)
  } catch (e) {
    showToast('❌ JSON 格式错误: ' + e.message)
  }
}
</script>

<style scoped>
.section { margin-bottom: 15px; }
h3 { font-size: 12px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
.hint { font-size: 10px; color: #b89aa5; margin-bottom: 15px; }
.warn-text { font-size: 9px; color: #f44336; margin-top: 15px; display: flex; align-items: center; gap: 6px; }

/* 全量按钮区 */
.macro-buttons {
  display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;
}
.pixel-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.1);
  border: 1px solid #b89a6a;
  color: #ffd;
  font-family: 'Press Start 2P'; font-size: 9px;
  cursor: pointer; border-radius: 8px;
  transition: all 0.2s;
}
.pixel-btn:hover { background: rgba(255,215,0,0.15); }
.pixel-btn.small { padding: 6px 10px; font-size: 7px; }
.pixel-btn.primary { background: rgba(0, 150, 136, 0.2); border-color: #009688; }
.pixel-btn.danger { background: rgba(244,67,54,0.2) !important; border-color: #f44336 !important; }

/* 批量导入 */
.import-section { margin-bottom: 20px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 12px; }
.import-section h4 { font-size: 11px; margin-bottom: 8px; }
.pixel-textarea {
  width: 100%; background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd;
  padding: 10px; font-family: monospace; font-size: 10px;
  border-radius: 8px; resize: vertical; box-sizing: border-box; margin-bottom: 8px;
}

/* 模块列表 */
.module-list { display: flex; flex-direction: column; gap: 8px; }
.module-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px; background: rgba(0,0,0,0.3);
  border: 1px solid rgba(184,154,106,0.3); border-radius: 12px;
}
.module-info { display: flex; align-items: center; gap: 10px; }
.module-icon { font-size: 20px; color: #f0c8a0; }
.module-info strong { font-size: 10px; }
.module-count { font-size: 8px; color: #b89aa5; margin-left: 8px; }
.module-actions { display: flex; gap: 6px; }
</style>