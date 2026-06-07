<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" />
      </button>

      <!-- 标签切换 -->
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'stats' }]"
          @click="activeTab = 'stats'"
        >
          <Icon icon="mdi:account" /> 角色属性
        </button>
        <button
          :class="['tab', { active: activeTab === 'engrave' }]"
          @click="activeTab = 'engrave'"
        >
          <Icon icon="mdi:gem" /> 刻印效果
        </button>
        <button
          :class="['tab', { active: activeTab === 'gems' }]"
          @click="activeTab = 'gems'"
        >
          <Icon icon="mdi:rhombus-split" /> 宝石
        </button>
      </div>

      <!-- 角色属性页 -->
      <div v-if="activeTab === 'stats'" class="tab-content">
        <div class="header">
          <div class="avatar-wrapper" @click="triggerUpload">
            <img v-if="playerImage" :src="playerImage" class="avatar-img" />
            <div v-else class="avatar-placeholder">
              <Icon icon="mdi:account" width="48" />
            </div>
            <input type="file" ref="fileInput" accept="image/*" @change="onFileChange" style="display:none" />
          </div>
          <div class="identity">
            <div class="class-tag">{{ store.player.class || '冒险者' }}</div>
            <h2 class="name">{{ store.player.name }}</h2>
            <div class="level">Lv.{{ store.player.level }} · {{ store.player.exp }}/{{ store.player.level * 100 }}</div>
          </div>
        </div>

        <!-- 基础属性 -->
        <div class="section">
          <h3><Icon icon="mdi:shield-account" /> 基础属性</h3>
          <div class="stat-list">
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:heart" /> HP</span>
              <span class="stat-value">
                {{ store.player.hp }} / {{ store.player.maxHp }}
                <span v-if="hpBonus > 0" style="color: #4caf50;"> (+{{ hpBonus }})</span>
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:water" /> MP</span>
              <span class="stat-value">
                {{ store.player.mp }} / {{ store.player.maxMp }}
                <span v-if="mpBonus > 0" style="color: #4caf50;"> (+{{ mpBonus }})</span>
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:sword-cross" /> 攻击力</span>
              <span class="stat-value">
                {{ store.playerStats.attack }}
                <span v-if="attackBonus > 0" style="color: #4caf50;"> (+{{ attackBonus }})</span>
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:shield" /> 防御力</span>
              <span class="stat-value">
                {{ store.playerStats.defense }}
                <span v-if="defenseBonus > 0" style="color: #4caf50;"> (+{{ defenseBonus }})</span>
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:speedometer" /> 速度</span>
              <span class="stat-value">
                {{ store.playerStats.speed }}
                <span v-if="speedBonus > 0" style="color: #4caf50;"> (+{{ speedBonus }})</span>
              </span>
            </div>
            <!-- 闪避率：强制取整 -->
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:shoe-print" /> 闪避率</span>
              <span class="stat-value">
                {{ Math.floor(store.playerStats.dodge || 0) }}%
                <span v-if="dodgeBonus > 0" style="color: #4caf50;"> (+{{ Math.floor(dodgeBonus) }}%)</span>
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:alert-circle" /> 暴击率</span>
              <span class="stat-value">
                {{ store.playerStats.critRate }}%
                <span v-if="critRateBonus > 0" style="color: #4caf50;"> (+{{ critRateBonus }}%)</span>
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:flash-circle" /> 暴击伤害</span>
              <span class="stat-value">
                {{ store.playerStats.critDmg }}%
                <span v-if="critDmgBonus > 0" style="color: #4caf50;"> (+{{ critDmgBonus }}%)</span>
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:target" /> Boss 伤害</span>
              <span class="stat-value">
                {{ store.playerStats.specialBossDmg || 0 }}%
                <span v-if="bossDmgBonus > 0" style="color: #4caf50;"> (+{{ bossDmgBonus }}%)</span>
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:blood-bag" /> 吸血</span>
              <span class="stat-value">
                {{ store.playerStats.lifesteal }}%
                <span v-if="lifestealBonus > 0" style="color: #4caf50;"> (+{{ lifestealBonus }}%)</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 战斗详情（可折叠） -->
        <div class="section">
          <h3 class="collapsible-header" @click="showCombatDetail = !showCombatDetail">
            <Icon icon="mdi:creation" /> 战斗详情
            <Icon :icon="showCombatDetail ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="collapse-icon" />
          </h3>
          <div v-if="showCombatDetail" class="stat-list">
            <!-- 真实伤害 -->
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:sword" /> 真实伤害</span>
              <span class="stat-value">
                {{ store.playerStats.trueDmg }}
                <span v-if="trueDmgBonus > 0" style="color: #4caf50;"> (+{{ trueDmgBonus }})</span>
              </span>
            </div>
            <!-- 分隔横线 -->
            <div class="stat-divider"></div>
            <!-- 元素伤害 -->
            <div v-for="elem in elements" :key="elem.key" class="stat-item">
              <span class="stat-label"><Icon :icon="elem.icon" /> {{ elem.name }}</span>
              <span class="stat-value">
                {{ store.playerStats[elem.key] || 0 }}%
                <span v-if="getElemBonus(elem.key) > 0" style="color: #4caf50;"> (+{{ getElemBonus(elem.key) }}%)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 刻印效果页 -->
      <div v-if="activeTab === 'engrave'" class="tab-content">
        <div class="section">
          <h3><Icon icon="mdi:gem" /> 激活的刻印</h3>
          <div v-if="engraveList.length === 0" class="empty">未激活任何刻印</div>
          <div class="engrave-list">
            <div v-for="eff in engraveList" :key="eff.affixId" class="engrave-card">
              <div class="engrave-icon">
                <Icon :icon="eff.icon" />
              </div>
              <div class="engrave-body">
                <div class="engrave-header">
                  <span class="engrave-name">{{ eff.affixName }}</span>
                  <span class="engrave-level-text" :class="{ overflow: eff.level > 10 }">Lv.{{ eff.level }}</span>
                </div>
                <div class="engrave-dots">
                  <span v-for="i in Math.min(eff.level, 10)" :key="'a' + i" class="dot filled"></span>
                  <span v-for="i in Math.max(0, 10 - eff.level)" :key="'b' + i" class="dot"></span>
                  <span v-if="eff.level > 10" class="overflow-dots">
                    <span class="dot overflow" v-for="i in Math.min(eff.level - 10, 5)" :key="'c' + i"></span>
                    <span v-if="eff.level > 15" class="overflow-text">...</span>
                  </span>
                </div>
                <div class="engrave-desc">{{ eff.desc }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
<!-- 宝石页签（使用独立组件） -->
<div v-if="activeTab === 'gems'" class="tab-content">
  <GemPanel />
</div>

  </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import GemPanel from './GemPanel.vue'
const store = useGameStore()
const showToast = inject('showToast', (msg) => alert(msg))
const activeTab = ref('stats')
const fileInput = ref(null)

// 基础属性（角色自身，不含装备）
const baseStats = computed(() => ({
  hp: store.player.maxHp || 100,
  mp: store.player.maxMp || 30,
  attack: store.player.attack || 10,
  defense: store.player.defense || 5,
  speed: store.player.speed || 10,
  luck: store.player.luck || 0,
  critRate: store.player.critRate || 5,
  critDmg: store.player.critDmg || 150,
  trueDmg: store.player.trueDmg || 0,
  lifesteal: store.player.lifesteal || 0,
}))

// 各属性加成（最终 - 基础）
const hpBonus = computed(() => (store.playerStats.maxHp || 100) - baseStats.value.hp)
const mpBonus = computed(() => (store.playerStats.maxMp || 30) - baseStats.value.mp)
const attackBonus = computed(() => (store.playerStats.attack || 10) - baseStats.value.attack)
const defenseBonus = computed(() => (store.playerStats.defense || 5) - baseStats.value.defense)
const speedBonus = computed(() => (store.playerStats.speed || 10) - baseStats.value.speed)
const luckBonus = computed(() => (store.playerStats.luck || 0) - baseStats.value.luck)
const critRateBonus = computed(() => (store.playerStats.critRate || 5) - baseStats.value.critRate)
const critDmgBonus = computed(() => (store.playerStats.critDmg || 150) - baseStats.value.critDmg)
const trueDmgBonus = computed(() => (store.playerStats.trueDmg || 0) - baseStats.value.trueDmg)
const lifestealBonus = computed(() => (store.playerStats.lifesteal || 0) - baseStats.value.lifesteal)
const dodgeBonus = computed(() => Math.floor((store.playerStats.dodge || 0) - (store.player.dodge || 0)))

import { AFFIX_EFFECTS } from '../config/accessoryConfig'
const showCombatDetail = ref(false)

// 元素列表
const elements = [
  { key: 'fireDmg', name: '火', icon: 'mdi:fire' },
  { key: 'waterDmg', name: '水', icon: 'mdi:water-outline' },
  { key: 'thunderDmg', name: '雷', icon: 'mdi:lightning-bolt' },
  { key: 'windDmg', name: '风', icon: 'mdi:weather-windy' },
  { key: 'grassDmg', name: '草', icon: 'mdi:leaf' },
  { key: 'iceDmg', name: '冰', icon: 'mdi:snowflake' },
  { key: 'holyDmg', name: '圣', icon: 'mdi:brightness-7' },
  { key: 'darkDmg', name: '暗', icon: 'mdi:moon-waning-crescent' },
  { key: 'steelDmg', name: '钢', icon: 'mdi:cube-outline' },
  { key: 'rockDmg', name: '岩', icon: 'mdi:terrain' }
]

const bossDmg = computed(() => store.playerStats.specialBossDmg || 0)
const bossDmgBonus = computed(() => 0)

function getAffixIcon(affixId) {
  const iconMap = {
    grudge: 'mdi:skull',
    voodooDoll: 'mdi:drama-masks',
    bluntWeapon: 'mdi:hammer',
    armorBreak: 'mdi:shield-broken',
    manaResonance: 'mdi:magic-staff',
    adrenaline: 'mdi:lightning-bolt',
    bossHunter: 'mdi:target',
    elementMaster: 'mdi:creation',
    fortune: 'mdi:clover',
    swiftWind: 'mdi:weather-windy',
    ambushMaster: 'mdi:ninja',
    tenacity: 'mdi:shield-star',
    phoenix: 'mdi:phoenix',
  }
  return iconMap[affixId] || 'mdi:circle'
}

const engraveList = computed(() => {
  return store.activeAffixEffects.map(eff => ({
    ...eff,
    icon: eff.icon || getAffixIcon(eff.affixId),
  }))
})

const baseElemDmg = computed(() => {
  const base = {}
  const elems = ['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel']
  elems.forEach(e => { base[e + 'Dmg'] = store.player[e + 'Dmg'] || 0 })
  return base
})

function getElemBonus(key) {
  const final = store.playerStats[key] || 0
  const base = baseElemDmg.value[key] || 0
  return final - base
}



const playerImage = computed(() => {
  const imgs = store.config?.customImages
  if (imgs?.hero) return imgs.hero
  if (imgs?.player) return imgs.player
  return '/images/portrait/hero.png'
})

function triggerUpload() {
  fileInput.value.click()
}
function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    if (!store.config.customImages) store.config.customImages = {}
    store.config.customImages['hero'] = event.target.result
    store.save()
  }
  reader.readAsDataURL(file)
}


</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(10px);
  display: flex; justify-content: center; align-items: center;
  z-index: 200;
}
.panel {
  width: 95vw; height: 90vh; max-width: 800px;
  background: rgba(15,25,45,0.95); border: 2px solid #b89a6a; border-radius: 24px;
  padding: 24px 20px 20px; color: #ffd; font-family: 'Press Start 2P', cursive;
  display: flex; flex-direction: column; overflow: hidden; position: relative;
}
.close-btn { position: absolute; top: 12px; right: 12px; background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer; }
.tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.tab {
  flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(184,154,106,0.4);
  border-radius: 10px; padding: 10px; font-size: 10px; color: #aaa;
  display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: 0.2s;
}
.tab.active { background: rgba(255,215,0,0.15); border-color: #ffd700; color: #ffd700; }
.tab-content { flex: 1; overflow-y: auto; padding-right: 4px; }
.header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.avatar-wrapper {
  width: 80px; height: 80px; border-radius: 16px; border: 2px solid #b89a6a;
  overflow: hidden; background: rgba(0,0,0,0.4); cursor: pointer; flex-shrink: 0;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { color: #b89a6a; display: flex; align-items: center; justify-content: center; }
.class-tag { font-size: 8px; background: rgba(255,215,0,0.2); padding: 2px 10px; border-radius: 12px; color: #ffd700; display: inline-block; }
.name { font-size: 16px; margin: 4px 0; }
.level { font-size: 9px; opacity: 0.8; }
.section { margin-bottom: 20px; }
.section h3 {
  font-size: 11px; color: #ffd700; margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
  border-bottom: 1px solid rgba(255,215,0,0.2); padding-bottom: 4px;
}
.stat-list { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
.stat-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 9px;
}
.stat-label { color: #ccc; display: flex; align-items: center; gap: 6px; }
.stat-value { color: #ffd; font-weight: bold; }
/* 横线分隔 */
.stat-divider {
  grid-column: span 2;
  border-top: 1px solid rgba(255,215,0,0.3);
  margin: 4px 0 6px 0;
}
.engrave-list { display: flex; flex-direction: column; gap: 10px; }
.engrave-card {
  display: flex; gap: 12px;
  background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.3);
  border-radius: 14px; padding: 12px;
}
.engrave-icon { font-size: 28px; color: #ffd700; flex-shrink: 0; }
.engrave-name { font-size: 10px; color: #ffd; }
.engrave-level { display: flex; align-items: center; gap: 6px; margin: 6px 0; }
.level-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: rgba(255,215,0,0.2); border: 1px solid rgba(255,215,0,0.4);
}
.level-dot.filled { background: #ffd700; border-color: #ffd700; }
.engrave-desc { font-size: 8px; color: #aaa; line-height: 1.5; }
.empty { text-align: center; color: #888; font-size: 9px; padding: 30px; }
@media (max-width: 500px) { .stat-list { grid-template-columns: 1fr; } }

/* 刻印卡片 */
.engrave-card {
  display: flex; gap: 14px;
  background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(184, 154, 106, 0.3);
  border-radius: 16px; padding: 14px 16px; transition: border-color 0.2s;
}
.engrave-card:hover { border-color: rgba(255, 215, 0, 0.5); }
.engrave-icon {
  font-size: 32px; color: #ffd700; flex-shrink: 0;
  width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
  background: rgba(255, 215, 0, 0.1); border-radius: 12px;
}
.engrave-body { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.engrave-header { display: flex; align-items: baseline; justify-content: space-between; }
.engrave-name { font-size: 12px; color: #ffd; font-weight: bold; letter-spacing: 1px; }
.engrave-level-text { font-size: 11px; color: #ffd700; font-weight: bold; }
.engrave-level-text.overflow { color: #ff5555; }
.engrave-dots { display: flex; align-items: center; gap: 4px; }
.dot {
  width: 8px; height: 8px; transform: rotate(45deg);
  background: rgba(255, 215, 0, 0.2); border: 1px solid rgba(255, 215, 0, 0.3); transition: background 0.2s;
}
.dot.filled { background: #ffd700; border-color: #ffd700; box-shadow: 0 0 4px rgba(255, 215, 0, 0.6); }
.dot.overflow { background: #ff5555; border-color: #ff5555; }
.overflow-text { font-size: 8px; color: #ff5555; margin-left: 2px; font-weight: bold; }
.engrave-desc {
  font-size: 9px; color: #ccc; line-height: 1.6;
  background: rgba(255, 255, 255, 0.03); padding: 6px 10px; border-radius: 8px;
}
.overflow-warn { font-size: 8px; color: #ff5555; margin-left: 4px; }
.overflow-dots { display: flex; align-items: center; gap: 4px; margin-left: 2px; }
.collapsible-header { cursor: pointer; user-select: none; display: flex; align-items: center; gap: 8px; }
.collapse-icon { margin-left: auto; font-size: 16px; }


</style>