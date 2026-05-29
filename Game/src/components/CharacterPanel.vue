<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      <button class="close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" />
      </button>
      
      <!-- 头部：头像 + 职业姓名 -->
      <div class="header">
        <div class="avatar-wrapper">
          <img v-if="playerImage" :src="playerImage" class="avatar-img" />
          <div v-else class="avatar-placeholder">
            <Icon icon="mdi:account" width="40" />
          </div>
        </div>
        <div class="identity">
          <div class="class-tag">{{ store.player.class || '冒险者' }}</div>
          <h2 class="name">{{ store.player.name }}</h2>
          <div class="level">Lv.{{ store.player.level }}</div>
        </div>
      </div>

      <!-- 双列属性表 -->
      <div class="stats-grid">
        <!-- 基础属性 -->
        <div class="stat-group">
          <h3><Icon icon="mdi:shield-account" /> 基础</h3>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:heart" /> HP</span>
            <span class="value">
              {{ store.player.hp }} / {{ store.player.maxHp }}
              <span v-if="statBonus.maxHp !== 0" class="bonus">
                ({{ statBonus.maxHp > 0 ? '+' : '' }}{{ statBonus.maxHp }})
              </span>
            </span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:water" /> MP</span>
            <span class="value">
              {{ store.player.mp }} / {{ store.player.maxMp }}
              <span v-if="statBonus.maxMp !== 0" class="bonus">
                ({{ statBonus.maxMp > 0 ? '+' : '' }}{{ statBonus.maxMp }})
              </span>
            </span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:sword-cross" /> 攻击</span>
            <span class="value">
              {{ store.playerStats.attack }}
              <span v-if="statBonus.attack !== 0" class="bonus">({{ statBonus.attack > 0 ? '+' : '' }}{{ statBonus.attack }})</span>
            </span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:shield" /> 防御</span>
            <span class="value">
              {{ store.playerStats.defense }}
              <span v-if="statBonus.defense !== 0" class="bonus">({{ statBonus.defense > 0 ? '+' : '' }}{{ statBonus.defense }})</span>
            </span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:speedometer" /> 速度</span>
            <span class="value">
              {{ store.playerStats.speed }}
              <span v-if="statBonus.speed !== 0" class="bonus">({{ statBonus.speed > 0 ? '+' : '' }}{{ statBonus.speed }})</span>
            </span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:dice-multiple" /> 幸运</span>
            <span class="value">
              {{ store.playerStats.luck }}
              <span v-if="statBonus.luck !== 0" class="bonus">({{ statBonus.luck > 0 ? '+' : '' }}{{ statBonus.luck }})</span>
            </span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:alert-circle" /> 暴击率</span>
            <span class="value">
              {{ store.playerStats.critRate }}%
              <span v-if="statBonus.critRate !== 0" class="bonus">({{ statBonus.critRate > 0 ? '+' : '' }}{{ statBonus.critRate }})</span>
            </span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:flash-circle" /> 暴击伤害</span>
            <span class="value">
              {{ store.playerStats.critDmg }}%
              <span v-if="statBonus.critDmg !== 0" class="bonus">({{ statBonus.critDmg > 0 ? '+' : '' }}{{ statBonus.critDmg }})</span>
            </span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:sword" /> 真实伤害</span>
            <span class="value">
              {{ store.playerStats.trueDmg }}
              <span v-if="statBonus.trueDmg !== 0" class="bonus">({{ statBonus.trueDmg > 0 ? '+' : '' }}{{ statBonus.trueDmg }})</span>
            </span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:blood-bag" /> 吸血</span>
            <span class="value">
              {{ store.playerStats.lifesteal }}%
              <span v-if="statBonus.lifesteal !== 0" class="bonus">({{ statBonus.lifesteal > 0 ? '+' : '' }}{{ statBonus.lifesteal }})</span>
            </span>
          </div>
        </div>

        <!-- 元素属性 -->
        <div class="stat-group">
          <h3><Icon icon="mdi:creation" /> 元素加成</h3>
          <div v-for="elem in elements" :key="elem.key" class="stat-row">
            <span class="label"><Icon :icon="elem.icon" /> {{ elem.name }}</span>
            <span class="value">
              {{ store.playerStats[elem.key] }}%
              <span v-if="statBonus[elem.key] !== 0" class="bonus">({{ statBonus[elem.key] > 0 ? '+' : '' }}{{ statBonus[elem.key] }})</span>
            </span>
          </div>
        </div>
      </div>

      <!-- 饰品词条（激活效果） -->
      <div class="affix-section">
        <h3><Icon icon="mdi:gem" /> 饰品词条效果</h3>
        <div v-if="store.activeAffixEffects.length === 0" class="affix-empty">
          尚未装备饰品或未激活词条效果
        </div>
        <div v-else class="affix-grid">
          <div v-for="effect in store.activeAffixEffects" :key="effect.affixId" class="affix-card">
            <div class="affix-header">
              <Icon :icon="effect.icon" class="affix-icon" />
              <span class="affix-name">{{ effect.affixName }}</span>
              <span class="affix-level">Lv.{{ effect.level }}</span>
            </div>
            <div class="affix-desc">{{ effect.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 经验条 -->
      <div class="exp-section">
        <div class="exp-label">
          <span>经验</span>
          <span>{{ store.player.exp }} / {{ store.player.level * 100 }}</span>
        </div>
        <div class="exp-bar">
          <div class="exp-fill" :style="{ width: (store.player.exp / (store.player.level * 100)) * 100 + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const playerImage = computed(() => store.config?.customImages?.player || null)

// 元素属性列表（用于简化模板）
const elements = [
  { key: 'fireDmg', name: '火', icon: 'mdi:fire' },
  { key: 'waterDmg', name: '水', icon: 'mdi:water-outline' },
  { key: 'thunderDmg', name: '雷', icon: 'mdi:lightning-bolt' },
  { key: 'windDmg', name: '飞行', icon: 'mdi:weather-windy' },
  { key: 'grassDmg', name: '草', icon: 'mdi:leaf' },
  { key: 'iceDmg', name: '冰', icon: 'mdi:snowflake' },
  { key: 'holyDmg', name: '圣', icon: 'mdi:brightness-7' },
  { key: 'darkDmg', name: '暗', icon: 'mdi:moon-waning-crescent' },
  { key: 'steelDmg', name: '钢', icon: 'mdi:cube-outline' },
  { key: 'rockDmg', name: '岩', icon: 'mdi:terrain' }
]

// 计算每项属性的加成（playerStats - player 基础值）
const statBonus = computed(() => {
  const base = store.player
  const stats = store.playerStats || store.player // 若未定义 playerStats 则回退
  return {
    maxHp: stats.maxHp - base.maxHp,
    maxMp: stats.maxMp - base.maxMp,
    attack: stats.attack - base.attack,
    defense: stats.defense - base.defense,
    speed: stats.speed - base.speed,
    luck: stats.luck - base.luck,
    critRate: stats.critRate - base.critRate,
    critDmg: stats.critDmg - base.critDmg,
    trueDmg: stats.trueDmg - base.trueDmg,
    lifesteal: stats.lifesteal - base.lifesteal,
    ...Object.fromEntries(elements.map(e => [e.key, (stats[e.key] || 0) - (base[e.key] || 0)]))
  }
})
</script>



<style scoped>

/* 覆盖层 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

/* 主面板 */
.panel {
  width: 550px;
  max-width: 90vw;
  max-height: 90vh;
  background: rgba(15, 25, 45, 0.9);
  backdrop-filter: blur(20px);
  border: 2px solid #b89a6a;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  padding: 24px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  position: relative;
  overflow-y: auto;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: #ffd;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}
.close-btn:hover {
  transform: scale(1.2);
}

/* 头部 */
.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
}

.avatar-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  border: 2px solid #b89a6a;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: #b89a6a;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.identity {
  flex: 1;
}

.class-tag {
  font-size: 10px;
  background: rgba(255, 215, 0, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 8px;
  color: #ffd700;
}

.name {
  font-size: 18px;
  margin: 5px 0;
}

.level {
  font-size: 12px;
  opacity: 0.8;
}

/* 双列属性 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-group h3 {
  font-size: 11px;
  margin-bottom: 10px;
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ccc;
}

.value {
  color: #ffd;
  font-weight: bold;
}

/* 经验条 */
.exp-section {
  margin-top: 10px;
}

.exp-label {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  margin-bottom: 6px;
}

.exp-bar {
  width: 100%;
  height: 12px;
  background: #2a2a3a;
  border-radius: 6px;
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 6px;
  transition: width 0.3s;
}

/* ========== 饰品词条 ========== */
.affix-section {
  margin: 15px 0;
  padding: 15px;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(184,154,106,0.3);
  border-radius: 16px;
}
.affix-section h3 {
  font-size: 11px;
  margin-bottom: 12px;
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 8px;
}
.affix-empty {
  font-size: 9px;
  color: #888;
  text-align: center;
  padding: 15px;
}
.affix-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.affix-card {
  flex: 1;
  min-width: 140px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(184,154,106,0.2);
  border-radius: 12px;
  padding: 10px 12px;
}
.affix-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.affix-icon {
  font-size: 16px;
  color: #ffd700;
}
.affix-name {
  font-size: 9px;
  color: #ffd;
  flex: 1;
}
.affix-level {
  font-size: 8px;
  background: rgba(255,215,0,0.2);
  color: #ffd700;
  padding: 2px 8px;
  border-radius: 10px;
}
.affix-desc {
  font-size: 8px;
  color: #aaa;
  padding-left: 24px;
}

/* 滚动条美化 */
.panel::-webkit-scrollbar {
  width: 5px;
}
.panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.panel::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.5);
  border-radius: 3px;
}

.bonus {
  font-size: 8px;
  color: #4caf50;
  margin-left: 4px;
}
</style>
