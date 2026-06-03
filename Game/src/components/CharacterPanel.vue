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

        <!-- 基础属性 (完整显示) -->
        <div class="section">
          <h3><Icon icon="mdi:shield-account" /> 基础属性</h3>
          <div class="stat-list">
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:heart" /> HP</span>
              <span class="stat-value">{{ store.player.hp }} / {{ store.player.maxHp }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:water" /> MP</span>
              <span class="stat-value">{{ store.player.mp }} / {{ store.player.maxMp }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:sword-cross" /> 攻击力</span>
              <span class="stat-value">{{ store.playerStats.attack }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:shield" /> 防御力</span>
              <span class="stat-value">{{ store.playerStats.defense }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:speedometer" /> 速度</span>
              <span class="stat-value">{{ store.playerStats.speed }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:dice-multiple" /> 幸运</span>
              <span class="stat-value">{{ store.playerStats.luck }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:alert-circle" /> 暴击率</span>
              <span class="stat-value">{{ store.playerStats.critRate }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:flash-circle" /> 暴击伤害</span>
              <span class="stat-value">{{ store.playerStats.critDmg }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:sword" /> 真实伤害</span>
              <span class="stat-value">{{ store.playerStats.trueDmg }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label"><Icon icon="mdi:blood-bag" /> 吸血</span>
              <span class="stat-value">{{ store.playerStats.lifesteal }}%</span>
            </div>
          </div>
        </div>

        <!-- 元素属性 -->
        <div class="section">
          <h3><Icon icon="mdi:creation" /> 元素加成</h3>
          <div class="stat-list">
            <div v-for="elem in elements" :key="elem.key" class="stat-item">
              <span class="stat-label"><Icon :icon="elem.icon" /> {{ elem.name }}</span>
              <span class="stat-value">{{ store.playerStats[elem.key] || 0 }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 刻印效果页 -->
      <div v-if="activeTab === 'engrave'" class="tab-content">
        <div class="section">
          <h3><Icon icon="mdi:gem" /> 激活的刻印</h3>
          <div v-if="store.activeAffixEffects.length === 0" class="empty">未激活任何刻印</div>
          <div class="engrave-list">
            <div v-for="effect in store.activeAffixEffects" :key="effect.affixId" class="engrave-card">
              <div class="engrave-icon">
                <Icon :icon="effect.icon || 'mdi:circle'" />
              </div>
              <div class="engrave-info">
                <div class="engrave-name">{{ effect.affixName }}</div>
                <div class="engrave-level">
                <span v-for="i in 10" :key="i" class="level-dot" :class="{ filled: i <= effect.level }"></span>
                </div>
                <div class="engrave-desc">{{ effect.desc }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const activeTab = ref('stats')
const fileInput = ref(null)

const playerImage = computed(() => {
  const imgs = store.config?.customImages
  if (imgs?.hero) return imgs.hero
  if (imgs?.player) return imgs.player
  // ✅ 默认立绘
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
  width: 95vw;
  height: 90vh;
  max-width: 800px;
  background: rgba(15,25,45,0.95);
  border: 2px solid #b89a6a;
  border-radius: 24px;
  padding: 24px 20px 20px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.close-btn {
  position: absolute; top: 12px; right: 12px;
  background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer;
}

.tabs {
  display: flex; gap: 8px; margin-bottom: 16px;
}
.tab {
  flex: 1;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(184,154,106,0.4);
  border-radius: 12px 12px 0 0;
  padding: 10px;
  font-size: 10px;
  color: #aaa;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  cursor: pointer;
  transition: 0.2s;
}
.tab.active {
  background: rgba(255,215,0,0.15);
  border-color: #ffd700;
  color: #ffd700;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.header {
  display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
}
.avatar-wrapper {
  width: 80px; height: 80px; border-radius: 16px;
  border: 2px solid #b89a6a; overflow: hidden;
  background: rgba(0,0,0,0.4); cursor: pointer;
  flex-shrink: 0;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { color: #b89a6a; display: flex; align-items: center; justify-content: center; }
.class-tag { font-size: 8px; background: rgba(255,215,0,0.2); padding: 2px 10px; border-radius: 12px; color: #ffd700; display: inline-block; }
.name { font-size: 16px; margin: 4px 0; }
.level { font-size: 9px; opacity: 0.8; }

.section {
  margin-bottom: 20px;
}
.section h3 {
  font-size: 11px; color: #ffd700; margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
  border-bottom: 1px solid rgba(255,215,0,0.2); padding-bottom: 4px;
}

.stat-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
}
.stat-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 9px;
}
.stat-label { color: #ccc; display: flex; align-items: center; gap: 6px; }
.stat-value { color: #ffd; font-weight: bold; }

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
.level-text { font-size: 8px; color: #ffd700; margin-left: 4px; }
.engrave-desc { font-size: 8px; color: #aaa; line-height: 1.5; }

.empty { text-align: center; color: #888; font-size: 9px; padding: 30px; }

@media (max-width: 500px) {
  .stat-list { grid-template-columns: 1fr; }
}
</style>