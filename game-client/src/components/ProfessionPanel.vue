<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <h2><Icon icon="mdi:shield-account" /> 职业与天赋</h2>

      <div class="tabs">
        <button :class="['tab-btn', { active: activeTab === 'tree' }]" @click="activeTab = 'tree'">
          <Icon icon="mdi:family-tree" /> 职业树
        </button>
        <button :class="['tab-btn', { active: activeTab === 'talent' }]" @click="activeTab = 'talent'">
          <Icon icon="mdi:star-circle" /> 天赋盘
        </button>
      </div>

      <!-- 职业树标签页 -->
      <div v-if="activeTab === 'tree'" class="tab-content">
        <div class="current-class">
          <div class="class-icon"><Icon :icon="classIcon" /></div>
          <div class="class-info">
            <div class="class-name">{{ className }}</div>
            <div class="class-desc">{{ classDesc }}</div>
          </div>
        </div>

        <div class="class-tree">
          <h3><Icon icon="mdi:family-tree" /> 转职路线</h3>
          <div class="tree-container">
            <div class="tree-root">
              <div class="tree-node base-node active">
                <Icon icon="mdi:account" class="node-icon" />
                <span class="node-label">流浪者</span>
              </div>
            </div>
            <div class="tree-line"></div>
            <div class="tree-branch">
              <div
                v-for="cls in firstJobs"
                :key="cls.id"
                class="tree-node"
                :class="{ active: store.player.class === cls.id, unlocked: cls.unlocked }"
                @click="selectClass(cls.id)"
              >
                <Icon :icon="cls.icon" class="node-icon" />
                <span class="node-label">{{ cls.name }}</span>
                
              </div>
            </div>
            <div class="tree-line"></div>
            <div class="tree-branch">
              <div
                v-for="cls in secondJobs"
                :key="cls.id"
                class="tree-node advanced"
                :class="{ active: store.player.class === cls.id, unlocked: cls.unlocked }"
                @click="selectClass(cls.id)"
              >
                <Icon :icon="cls.icon" class="node-icon" />
                <span class="node-label">{{ cls.name }}</span>
                <span class="node-req" v-if="!cls.unlocked">Lv.{{ cls.reqLevel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 天赋盘标签页 -->
      <div v-if="activeTab === 'talent'" class="tab-content">
        <div class="class-bonus">
          <h3><Icon icon="mdi:plus-circle" /> 职业加成</h3>
          <div class="bonus-grid">
            <div class="bonus-item" v-for="b in classBonuses" :key="b.label">
              <span class="bonus-label">{{ b.label }}</span>
              <span class="bonus-value" :style="{ color: b.color }">{{ b.value }}</span>
            </div>
          </div>
        </div>

        <div class="talent-grid">
          <h3>
            <Icon icon="mdi:star-circle" /> 天赋盘
            <span class="talent-points">剩余：{{ talentPoints }} 点</span>
          </h3>
          <div class="talent-nodes">
            <div
              v-for="talent in talents"
              :key="talent.key"
              class="talent-node"
              :class="{ maxed: talent.level >= talent.maxLevel }"
              @click="upgradeTalent(talent)"
            >
              <div class="talent-icon"><Icon :icon="talent.icon" /></div>
              <div class="talent-info">
                <span class="talent-name">{{ talent.name }}</span>
                <span class="talent-effect">{{ talent.effectDesc }} +{{ talent.getValue() }}</span>
              </div>
              <div class="talent-level">
                <span class="level-text">{{ talent.level }}/{{ talent.maxLevel }}</span>
                <span class="level-cost" v-if="talent.level < talent.maxLevel">-{{ talent.cost }}点</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close'])

const activeTab = ref('tree')

// ==================== 职业定义 ====================
const CLASS_DEFS = {
  wanderer: { name: '流浪者', icon: 'mdi:account', desc: '初始职业，均衡成长', tier: 0, bonuses: [] },
  warrior: {
    name: '战士', icon: 'mdi:sword-cross', desc: '攻守兼备的近战专家', tier: 1, parent: 'wanderer',
    bonuses: [
      { label: '攻击力', value: '+8', color: '#ff4444' },
      { label: '防御力', value: '+10', color: '#3498db' },
      { label: '生命值', value: '+200', color: '#2ecc71' }
    ]
  },
  mage: {
    name: '法师', icon: 'mdi:magic-staff', desc: '元素掌控者，MP充沛', tier: 1, parent: 'wanderer',
    bonuses: [
      { label: '攻击力', value: '+12', color: '#ff4444' },
      { label: '防御力', value: '+2', color: '#3498db' },
      { label: '生命值', value: '+100', color: '#2ecc71' },
      { label: '魔法值', value: '+30', color: '#9b59b6' }
    ]
  },
  ranger: {
    name: '游侠', icon: 'mdi:bow-arrow', desc: '迅捷的远程猎手', tier: 1, parent: 'wanderer',
    bonuses: [
      { label: '攻击力', value: '+8', color: '#ff4444' },
      { label: '防御力', value: '+4', color: '#3498db' },
      { label: '生命值', value: '+150', color: '#2ecc71' },
      { label: '速度', value: '+5', color: '#f1c40f' }
    ]
  },
  berserker: {
    name: '狂战士', icon: 'mdi:axe-battle', desc: '放弃防御的狂暴战士', tier: 2, parent: 'warrior', reqLevel: 25,
    bonuses: [
      { label: '攻击力', value: '+20', color: '#ff4444' },
      { label: '生命值', value: '+300', color: '#2ecc71' },
      { label: '暴击伤害', value: '+25%', color: '#e74c3c' }
    ]
  },
  paladin: {
    name: '圣骑士', icon: 'mdi:shield-cross', desc: '神圣的守护者', tier: 2, parent: 'warrior', reqLevel: 25,
    bonuses: [
      { label: '防御力', value: '+20', color: '#3498db' },
      { label: '生命值', value: '+500', color: '#2ecc71' },
      { label: '攻击力', value: '+5', color: '#ff4444' }
    ]
  },
  archmage: {
    name: '大魔导', icon: 'mdi:magic-staff', desc: '终极元素掌控者', tier: 2, parent: 'mage', reqLevel: 25,
    bonuses: [
      { label: '攻击力', value: '+25', color: '#ff4444' },
      { label: '魔法值', value: '+50', color: '#9b59b6' },
      { label: '暴击率', value: '+5%', color: '#f39c12' }
    ]
  }
}

const currentClass = computed(() => CLASS_DEFS[store.player.class] || CLASS_DEFS.wanderer)
const className = computed(() => currentClass.value.name)
const classIcon = computed(() => currentClass.value.icon)
const classDesc = computed(() => currentClass.value.desc)
const classBonuses = computed(() => currentClass.value.bonuses)

const firstJobs = computed(() => {
  return Object.entries(CLASS_DEFS)
    .filter(([_, def]) => def.tier === 1)
    .map(([id, def]) => ({ id, ...def, unlocked: store.player.level >= 10 }))
})

const secondJobs = computed(() => {
  return Object.entries(CLASS_DEFS)
    .filter(([_, def]) => def.tier === 2)
    .map(([id, def]) => ({ id, ...def, unlocked: store.player.level >= def.reqLevel }))
})

function selectClass(id) {
  const def = CLASS_DEFS[id]
  if (!def) return
  if (def.tier === 1 && store.player.level < 10) return
  if (def.tier === 2 && store.player.level < def.reqLevel) return
  if (def.parent && store.player.class !== def.parent && store.player.class !== id) return
  store.player.class = id
  store.save()
}

// ==================== 天赋系统 ====================
const talentPoints = computed(() => {
  return 5 + store.player.level - (store.player.talentSpent || 0)
})

const talents = reactive([
  {
    key: 'atk', name: '强击', icon: 'mdi:sword', maxLevel: 10, cost: 1,
    effectDesc: '攻击力',
    getValue() { return this.level * 3 },
    get level() { return store.player.talents?.atk || 0 },
    set level(v) { if (!store.player.talents) store.player.talents = {}; store.player.talents.atk = v }
  },
  {
    key: 'def', name: '坚韧', icon: 'mdi:shield', maxLevel: 10, cost: 1,
    effectDesc: '防御力',
    getValue() { return this.level * 2 },
    get level() { return store.player.talents?.def || 0 },
    set level(v) { if (!store.player.talents) store.player.talents = {}; store.player.talents.def = v }
  },
  {
    key: 'hp', name: '活力', icon: 'mdi:heart', maxLevel: 10, cost: 1,
    effectDesc: '生命值',
    getValue() { return this.level * 50 },
    get level() { return store.player.talents?.hp || 0 },
    set level(v) { if (!store.player.talents) store.player.talents = {}; store.player.talents.hp = v }
  },
  {
    key: 'speed', name: '疾风', icon: 'mdi:run-fast', maxLevel: 10, cost: 1,
    effectDesc: '速度',
    getValue() { return this.level * 1 },
    get level() { return store.player.talents?.speed || 0 },
    set level(v) { if (!store.player.talents) store.player.talents = {}; store.player.talents.speed = v }
  },
  {
    key: 'critRate', name: '鹰眼', icon: 'mdi:target', maxLevel: 5, cost: 2,
    effectDesc: '暴击率',
    getValue() { return this.level * 1 + '%' },
    get level() { return store.player.talents?.critRate || 0 },
    set level(v) { if (!store.player.talents) store.player.talents = {}; store.player.talents.critRate = v }
  },
  {
    key: 'critDmg', name: '致命', icon: 'mdi:skull', maxLevel: 5, cost: 2,
    effectDesc: '暴击伤害',
    getValue() { return this.level * 5 + '%' },
    get level() { return store.player.talents?.critDmg || 0 },
    set level(v) { if (!store.player.talents) store.player.talents = {}; store.player.talents.critDmg = v }
  }
])

function upgradeTalent(talent) {
  if (talent.level >= talent.maxLevel) return
  if (talentPoints.value < talent.cost) return
  talent.level = talent.level + 1
  store.player.talentSpent = (store.player.talentSpent || 0) + talent.cost
  store.save()
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(10px);
  display: flex; justify-content: center; align-items: center;
  z-index: 200;
}

.panel {
  width: 100vw; height: 100vh;
  background: rgba(15,25,45,0.95);
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  display: flex; flex-direction: column;
  padding: 12px 20px;
  box-sizing: border-box;
  position: relative;
}

.close-btn {
  position: absolute; top: 12px; right: 16px;
  background: none; border: none; color: #ffd; font-size: 22px; cursor: pointer; z-index: 10;
}

h2 { font-size: 14px; color: #ffd700; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
h3 { font-size: 10px; color: #ccc; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }

.tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-shrink: 0; }
.tab-btn {
  background: rgba(0,0,0,0.5); border: 1px solid #5a5a7a; border-radius: 12px;
  padding: 6px 18px; font-size: 9px; color: #ccc; cursor: pointer;
  display: flex; align-items: center; gap: 6px; transition: 0.2s;
}
.tab-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

/* 当前职业卡片 */
.current-class {
  display: flex; gap: 14px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,215,0,0.2);
  border-radius: 14px; padding: 12px; margin-bottom: 16px;
}
.class-icon { font-size: 44px; color: #ffd700; flex-shrink: 0; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: rgba(255,215,0,0.1); border-radius: 14px; }
.class-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.class-name { font-size: 13px; font-weight: bold; color: #ffd; }
.class-desc { font-size: 7px; color: #ccc; line-height: 1.4; }

/* 职业树 */
.class-tree { margin-top: 8px; }
.tree-container { display: flex; flex-direction: column; align-items: center; gap: 0; }
.tree-root { display: flex; justify-content: center; }
.tree-branch { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
.tree-line { width: 2px; height: 18px; background: rgba(255,215,0,0.3); margin: 4px 0; }

.tree-node {
  background: rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.15);
  border-radius: 10px; padding: 6px 10px; min-width: 80px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: pointer; transition: all 0.2s; position: relative;
}
.tree-node.unlocked:hover { border-color: #ffd700; }
.tree-node.active { border-color: #ffd700; background: rgba(255,215,0,0.15); box-shadow: 0 0 10px rgba(255,215,0,0.3); }
.tree-node:not(.unlocked) { opacity: 0.5; cursor: not-allowed; }
.tree-node.advanced { border-color: rgba(255,100,0,0.4); }
.tree-node.advanced.active { border-color: #ff6600; background: rgba(255,100,0,0.2); }

.node-icon { font-size: 24px; color: #ffd700; }
.node-label { font-size: 7px; color: #ccc; text-align: center; line-height: 1.2; }
.node-lock { font-size: 14px; position: absolute; top: -4px; right: -4px; }
.node-req { font-size: 6px; color: #ff9800; }

/* 属性加成 */
.class-bonus { margin-bottom: 16px; }
.bonus-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.bonus-item { display: flex; justify-content: space-between; padding: 5px 8px; background: rgba(0,0,0,0.3); border-radius: 7px; font-size: 7px; }
.bonus-label { color: #aaa; }
.bonus-value { font-weight: bold; }

/* 天赋列表 */
.talent-grid { margin-top: 8px; }
.talent-points { font-size: 8px; color: #ffd700; margin-left: auto; }

.talent-nodes { display: flex; flex-direction: column; gap: 6px; }

.talent-node {
  display: flex; align-items: center; gap: 8px;
  background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; padding: 8px 10px;
  cursor: pointer; transition: all 0.2s;
}
.talent-node:hover { border-color: #ffd700; }
.talent-node.maxed { opacity: 0.5; cursor: default; border-color: rgba(255,215,0,0.3); }

.talent-icon { font-size: 22px; color: #ffd700; width: 36px; text-align: center; flex-shrink: 0; }

.talent-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.talent-name { font-size: 8px; color: #ffd; }
.talent-effect { font-size: 7px; color: #aaa; }

.talent-level { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.level-text { font-size: 7px; color: #ffd700; }
.level-cost { font-size: 6px; color: #ff9800; }
</style>