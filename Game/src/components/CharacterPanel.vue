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
            <span class="value">{{ store.player.hp }} / {{ store.player.maxHp }}</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:water" /> MP</span>
            <span class="value">{{ store.player.mp }} / {{ store.player.maxMp }}</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:sword-cross" /> 攻击</span>
            <span class="value">{{ store.player.attack }}</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:shield" /> 防御</span>
            <span class="value">{{ store.player.defense }}</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:speedometer" /> 速度</span>
            <span class="value">{{ store.player.speed }}</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:dice-multiple" /> 幸运</span>
            <span class="value">{{ store.player.luck }}</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:alert-circle" /> 暴击率</span>
            <span class="value">{{ store.player.critRate }}%</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:flash-circle" /> 暴击伤害</span>
            <span class="value">{{ store.player.critDmg }}%</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:sword" /> 真实伤害</span>
            <span class="value">{{ store.player.trueDmg }}</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:blood-bag" /> 吸血</span>
            <span class="value">{{ store.player.lifesteal }}%</span>
          </div>
        </div>

        <!-- 元素属性 -->
        <div class="stat-group">
          <h3><Icon icon="mdi:creation" /> 元素加成</h3>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:fire" /> 火</span>
            <span class="value">{{ store.player.fireDmg }}%</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:water-outline" /> 水</span>
            <span class="value">{{ store.player.waterDmg }}%</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:lightning-bolt" /> 雷</span>
            <span class="value">{{ store.player.thunderDmg }}%</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:weather-windy" /> 飞行</span>
            <span class="value">{{ store.player.windDmg }}%</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:leaf" /> 草</span>
            <span class="value">{{ store.player.grassDmg }}%</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:snowflake" /> 冰</span>
            <span class="value">{{ store.player.iceDmg }}%</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:brightness-7" /> 圣</span>
            <span class="value">{{ store.player.holyDmg }}%</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:moon-waning-crescent" /> 暗</span>
            <span class="value">{{ store.player.darkDmg }}%</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:cube-outline" /> 钢</span>
            <span class="value">{{ store.player.steelDmg }}%</span>
          </div>
          <div class="stat-row">
            <span class="label"><Icon icon="mdi:terrain" /> 岩</span>
            <span class="value">{{ store.player.rockDmg }}%</span>
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
</style>