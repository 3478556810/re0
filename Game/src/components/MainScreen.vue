<template>
  <div class="main-screen">
    <!-- 顶部状态栏 - 牧场物语风格 -->
    <div class="status-bar">
      <span class="status-item"><Icon icon="mdi:cash-multiple" /> {{ store.player.gold }}G</span>
      <span class="status-item"><Icon icon="mdi:heart" /> {{ store.player.hp }}/{{ store.player.maxHp }}</span>
      <span class="status-item"><Icon icon="mdi:weather-partly-cloudy" /> {{ weather }}</span>
      <span class="status-item"><Icon icon="mdi:calendar-range" /> {{ dateStr }}</span>
      <span class="status-item"><Icon icon="mdi:clock-outline" /> {{ timeStr }}</span>
    </div>

    <!-- 主内容区域 - 垂直居中 -->
    <div class="content-wrapper">
      <div class="main-card">
        <!-- 场景描述 -->
        <div class="scene-section">
          <h2 class="scene-title">{{ sceneTitle }}</h2>
          <p class="scene-desc">{{ sceneDesc }}</p>
        </div>

        <!-- 核心功能按钮组 -->
        <div class="core-menu">
          <button class="pixel-btn" @click="openPanel('character')">
            <Icon icon="mdi:account" /> 角色
          </button>
          <button class="pixel-btn" @click="openPanel('inventory')">
            <Icon icon="mdi:bag-personal" /> 背包
          </button>
          <button class="pixel-btn" @click="openPanel('party')">
            <Icon icon="mdi:account-group" /> 伙伴
          </button>
          <button class="pixel-btn" @click="openPanel('pet')">
            <Icon icon="mdi:paw" /> 宠物
          </button>
          <button class="pixel-btn dev-btn" @click="openPanel('dev')">
  <Icon icon="mdi:cog" /> 开发者
</button>
        </div>

        <!-- 场景动态操作按钮 -->
        <div class="action-buttons">
          <button
            v-for="action in availableActions"
            :key="action.id"
            class="pixel-btn action-btn"
            @click="handleAction(action)"
          >
            <Icon :icon="action.icon" /> {{ action.name }}
          </button>

          <button class="pixel-btn action-btn" @click="triggerDialog">
  <Icon icon="mdi:chat" /> 探索剧情
</button>
        </div>
      </div>
    </div>

    <!-- 各类弹出面板 -->
    <DevPanel v-if="currentPanel === 'dev'" @close="currentPanel = null" />
    <CharacterPanel v-if="currentPanel === 'character'" @close="currentPanel = null" />
    <InventoryPanel v-if="currentPanel === 'inventory'" @close="currentPanel = null" />
    <SimplePanel v-if="currentPanel === 'party'" title="伙伴" icon="mdi:account-group" @close="currentPanel = null">
      <p class="text-sm text-center py-8">伙伴系统即将上线，敬请期待！</p>
    </SimplePanel>
    <SimplePanel v-if="currentPanel === 'pet'" title="宠物" icon="mdi:paw" @close="currentPanel = null">
      <p class="text-sm text-center py-8">宠物系统开发中，很快就能见面啦！</p>
    </SimplePanel>
    <BankPanel v-if="currentPanel === 'bank'" @close="currentPanel = null" />
    <StockPanel v-if="currentPanel === 'stock'" @close="currentPanel = null" />
    <ForgePanel v-if="currentPanel === 'forge'" @close="currentPanel = null" />
    <AdventurerGuild v-if="currentPanel === 'guild'" @close="currentPanel = null" @open-backpack="openPanel('inventory')" />
    <InnPanel v-if="currentPanel === 'inn'" @close="currentPanel = null" />
<DialogPanel ref="dialogRef" @close="onDialogClose" @update="onStoryUpdate" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import CharacterPanel from './CharacterPanel.vue'
import InventoryPanel from './InventoryPanel.vue'
import BankPanel from './BankPanel.vue'
import StockPanel from './StockPanel.vue'
import ForgePanel from './ForgePanel.vue'
import AdventurerGuild from './AdventurerGuild.vue'
import InnPanel from './InnPanel.vue'
import { spawnEnemy } from '../config/biomeConfig'
import DevPanel from './DevPanel/DevPanel.vue'




import DialogPanel from './DialogPanel.vue'
const dialogRef = ref(null)

function triggerDialog() {
  dialogRef.value.startScene('explore')
}
// 简易占位面板组件
const SimplePanel = {
  props: { title: String, icon: String },
  template: `
    <div class="overlay" @click.self="$emit('close')">
      <div class="panel pixel-panel" @click.stop>
        <h3><Icon :icon="icon" /> {{ title }}</h3>
        <slot />
        <button class="pixel-btn" @click="$emit('close')">关闭</button>
      </div>
    </div>
  `,
  components: { Icon }
}

const store = useGameStore()
const emit = defineEmits(['startBattle'])
const currentPanel = ref(null)

// ---------- 日期与天气系统 ----------
const weekNames = ['月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜']
const seasonNames = ['春', '夏', '秋', '冬']
const weatherPool = ['晴', '晴', '阴', '雨', '雪', '大风'] // 晴概率略高

const dateInfo = computed(() => {
  const day = store.world.day
  const year = Math.floor((day - 1) / 120) + 1
  const seasonIndex = Math.floor((day - 1) / 30) % 4
  const dayOfSeason = ((day - 1) % 30) + 1
  const week = weekNames[(day - 1) % 7]
  return { year, season: seasonNames[seasonIndex], day: dayOfSeason, week }
})

const weather = computed(() => {
  // 基于天数+时间的伪随机天气，保持变化
  const idx = (store.world.day * 7 + Math.floor(store.world.gameTime / 60)) % weatherPool.length
  return weatherPool[idx]
})

const dateStr = computed(() => {
  const d = dateInfo.value
  return `${d.year}年 ${d.season}${d.day}日 ${d.week}`
})

const timeStr = computed(() => {
  const minutes = store.world.gameTime
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
})

// ---------- 场景逻辑 ----------
const currentBiome = computed(() => store.world.currentBiome)
const sceneTitle = computed(() => {
  const titles = { town: '城镇', plain: '平原', desert: '沙漠' }
  return titles[currentBiome.value] || '未知'
})
const sceneDesc = computed(() => {
  const descs = {
    town: '你身处热闹的城镇，周围有旅馆、协会和商店。',
    plain: '广袤的平原，偶尔能遇到一些低级的怪物。',
    desert: '炎热的沙漠，毒蝎潜伏在沙丘之中。'
  }
  return descs[currentBiome.value] || '你在这里探索...'
})

const availableActions = computed(() => {
  const actions = []
  if (currentBiome.value === 'town') {
    actions.push({ id: 'inn', name: '旅馆休息', icon: 'mdi:bed', type: 'panel' })
    actions.push({ id: 'guild', name: '冒险者协会', icon: 'mdi:town-hall', type: 'panel' })
    actions.push({ id: 'bank', name: '银行', icon: 'mdi:bank', type: 'panel' })
    actions.push({ id: 'stock', name: '股市', icon: 'mdi:chart-line', type: 'panel' })
    actions.push({ id: 'forge', name: '铁匠铺', icon: 'mdi:anvil', type: 'panel' })
    actions.push({ id: 'plain', name: '前往平原', icon: 'mdi:grass', type: 'travel' })
    actions.push({ id: 'desert', name: '前往沙漠', icon: 'mdi:weather-sunny', type: 'travel' })
  } else {
    actions.push({ id: 'search', name: '搜索怪物', icon: 'mdi:sword-cross', type: 'battle' })
    actions.push({ id: 'town', name: '返回城镇', icon: 'mdi:home-city', type: 'travel' })
  }
  return actions
})

function openPanel(name) {
  currentPanel.value = name
}

function handleAction(action) {
  console.log('[MainScreen] 处理动作:', action)
  if (action.type === 'travel') {
    store.moveTo(action.id, 0, 0)
    store.advanceTime(30)
  } else if (action.type === 'battle') {
    console.log('当前地形:', currentBiome.value)
    let monsterPool = []
    if (currentBiome.value === 'plain') {
      monsterPool = [
        { id: 'slime', name: '史莱姆', baseHp: 35, baseAtk: 10, baseDef: 6, levelRange: [1,3], material: { id: 'slime_gel', name: '史莱姆凝露' }, icon: 'mdi:blur' },
        { id: 'goblin', name: '哥布林', baseHp: 45, baseAtk: 16, baseDef: 10, levelRange: [2,5], material: { id: 'goblin_fang', name: '哥布林之牙' }, icon: 'mdi:alien' }
      ]
    } else if (currentBiome.value === 'desert') {
      monsterPool = [
        { id: 'scorpion', name: '毒蝎', baseHp: 40, baseAtk: 22, baseDef: 14, levelRange: [3,7], material: { id: 'scorpion_tail', name: '蝎尾针' }, icon: 'mdi:bug' }
      ]
    } else {
      monsterPool = [
        { id: 'slime', name: '史莱姆', baseHp: 30, baseAtk: 9, baseDef: 5, levelRange: [1,2], material: { id: 'slime_gel', name: '史莱姆凝露' }, icon: 'mdi:blur' }
      ]
    }
    console.log('怪物池长度:', monsterPool.length)
    const template = monsterPool[Math.floor(Math.random() * monsterPool.length)]
    console.log('选中模板:', template)

    // 生成怪物
    let monster
    try {
      if (spawnEnemy) {
        monster = spawnEnemy(template, store.player.level)
      } else {
        monster = fallbackSpawnEnemy(template, store.player.level)
      }
      monster.icon = template.icon
      console.log('生成的怪物对象:', monster)
      if (!monster || !monster.hp) throw new Error('怪物对象无效')
      
      // 发出事件
      emit('startBattle', monster)
    } catch (e) {
      console.error('生成怪物失败', e)
      alert('生成怪物失败: ' + (e.message || '未知错误'))
    }
  } else if (action.type === 'panel') {
    openPanel(action.id)
  }
}


function fallbackSpawnEnemy(template, playerLevel) {
  const lv = Math.floor(Math.random() * 3) + 1
  const material = template.material ? { ...template.material } : { id: 'unknown', name: '未知材料' }
  if (!material.name) material.name = material.id
  return {
    ...template,
    level: lv,
    hp: template.baseHp + lv * 5,
    maxHp: template.baseHp + lv * 5,
    atk: template.baseAtk + lv * 2,
    def: template.baseDef + lv,
    exp: 20 + lv * 10,
    gold: 0,
    material: material
  }
}
</script>

<style scoped>
  .dev-btn {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
}
.dev-btn:hover {
  background: rgba(255, 215, 0, 0.3);
}
/* 全局背景与基础样式 */
.main-screen {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0a0f1e 0%, #1a1f2e 100%);
  font-family: 'Press Start 2P', cursive;
  color: #ffd;
  overflow: hidden;
}

/* 顶部状态栏 */
.status-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 20px;
  background: rgba(10, 20, 40, 0.75);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  font-size: 9px;
  flex-shrink: 0;
  gap: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #eed;
  white-space: nowrap;
}

/* 主内容区 - 垂直居中 */
.content-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* 主卡片 - 玻璃态 */
.main-card {
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 24px;
  padding: 30px 25px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* 场景文字 */
.scene-section {
  text-align: center;
}

.scene-title {
  font-size: 18px;
  margin-bottom: 10px;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.scene-desc {
  font-size: 10px;
  opacity: 0.85;
  line-height: 1.8;
}

/* 核心按钮组 */
.core-menu {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 动态按钮组 */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

/* 通用按钮样式 - 玻璃态，动效 */
.pixel-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 14px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  white-space: nowrap;
}

.pixel-btn:hover {
  background: rgba(255, 215, 0, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);
}

.pixel-btn:active {
  transform: translateY(1px);
  box-shadow: none;
}

/* 覆盖层（占位面板使用） */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.panel {
  background: rgba(10, 20, 40, 0.9);
  backdrop-filter: blur(20px);
  border: 2px solid #b89a6a;
  border-radius: 24px;
  padding: 25px;
  min-width: 280px;
  text-align: center;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  font-size: 12px;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.4);
  border-radius: 3px;
}
</style>