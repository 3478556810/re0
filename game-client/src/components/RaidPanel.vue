<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>

      <h2><Icon icon="mdi:skull-crossbones" /> 深渊副本</h2>

      <!-- 顶部标签页 -->
      <div class="raid-tabs">
        <button
          v-for="(boss, index) in bossList"
          :key="boss.id"
          :class="['raid-tab', { active: activeTab === index }]"
          @click="activeTab = index"
        >
          <Icon :icon="boss.icon" class="tab-icon" />
          <span class="tab-name">{{ boss.shortName }}</span>
          <span v-if="raidClears[boss.id]" class="tab-cleared">✓</span>
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <div class="raid-card">
          <div class="raid-header">
            <Icon :icon="bossList[activeTab].icon" class="raid-icon" />
            <div class="raid-info">
              <h3 class="raid-boss-name">{{ bossList[activeTab].name }}</h3>
              <span class="raid-level">{{ bossList[activeTab].level }}</span>
            </div>
            <span v-if="raidClears[bossList[activeTab].id]" class="clear-badge">已通关</span>
          </div>
          <div class="raid-desc">
            {{ bossList[activeTab].desc }}
          </div>
          <div class="raid-rewards">
            <span v-for="reward in bossList[activeTab].rewards" :key="reward" class="reward-tag">
              {{ reward }}
            </span>
          </div>
          <div class="raid-actions">
            <button class="pixel-btn primary raid-btn" @click="enterRaid(bossList[activeTab].id)">
              <Icon icon="mdi:sword-cross" /> 单人战斗
            </button>
            <button class="pixel-btn multiplayer raid-btn" @click="openMatchRoom">
              <Icon icon="mdi:account-group" /> 多人匹配
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 多人匹配面板（悬浮层） -->
    <MultiplayerPanel
      v-if="showMatchRoom"
      :boss-id="bossList[activeTab]?.id"
      :boss-name="bossList[activeTab]?.name"
      @close="showMatchRoom = false"
      @start-battle="onMultiplayerBattle"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { createRaidMonster } from '@/config/raidHelpers'
import MultiplayerPanel from './Multiplayer/MultiplayerPanel.vue'

const store = useGameStore()
const emit = defineEmits(['close', 'startBattle'])

const activeTab = ref(0)
const showMatchRoom = ref(false)

const bossList = [
  {
    id: 'raid_gladiator',
    name: '角斗士·血斧',
    shortName: '角斗士',
    icon: 'mdi:axe-battle',
    level: '10层难度 | 推荐等级 10+',
    desc: '竞技场的霸主，击败可获得角斗士勋章和随机宝石。',
    rewards: ['角斗士勋章', '随机宝石']
  },
  {
    id: 'raid_lava_core',
    name: '炎核·熔岩巨像',
    shortName: '熔岩巨像',
    icon: 'mdi:lava-lamp',
    level: '15层难度 | 推荐等级 15+',
    desc: '熔岩之心的守护者，击败可获得冷却水晶和随机宝石。',
    rewards: ['冷却水晶', '随机宝石']
  },
  {
    id: 'raid_bishop',
    name: '永夜主教',
    shortName: '永夜主教',
    icon: 'mdi:ghost',
    level: '20层难度 | 推荐等级 20+',
    desc: '暗影圣殿的主宰，击败可获得圣光碎片和随机宝石。',
    rewards: ['圣光碎片', '随机宝石']
  }
]

const raidClears = computed(() => {
  if (!store.isStoryMode) {
    return { raid_gladiator: false, raid_lava_core: false, raid_bishop: false }
  }
  const saved = sessionStorage.getItem('story_raid_clears')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      return {
        raid_gladiator: !!data.raid_gladiator,
        raid_lava_core: !!data.raid_lava_core,
        raid_bishop: !!data.raid_bishop
      }
    } catch (e) {}
  }
  return { raid_gladiator: false, raid_lava_core: false, raid_bishop: false }
})

function enterRaid(bossId) {
  const monster = createRaidMonster(bossId)
  if (!monster) return

  store.dungeon.isRaidBattle = true
  store.dungeon.currentRaidBoss = bossId

  emit('startBattle', [monster])
  emit('close')
}

function openMatchRoom() {
  const currentBoss = bossList[activeTab.value]
  if (!currentBoss) {
    console.error('未找到当前Boss，activeTab:', activeTab.value)
    return
  }
  showMatchRoom.value = true
}

function onMultiplayerBattle(roomData) {
  // 多人战斗开始（这里可以根据房间数据生成战斗敌人）
  console.log('多人战斗开始', roomData)
  // 示例：根据房间信息生成 Boss 战斗
  const monster = createRaidMonster(roomData.bossId || bossList[activeTab.value]?.id)
  if (monster) {
    store.dungeon.isRaidBattle = true
    store.dungeon.currentRaidBoss = roomData.bossId
    emit('startBattle', [monster])
  }
  showMatchRoom.value = false
  emit('close')
}
</script>

<style scoped>
/* 原有样式保持不变 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel {
  width: 90vw; height: 85vh; max-width: 600px;
  background: rgba(15,25,45,0.95); border: 2px solid #b89a6a; border-radius: 24px;
  color: #ffd; font-family: 'Press Start 2P', cursive;
  padding: 24px; display: flex; flex-direction: column; position: relative;
}
.close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer; }
h2 { font-size: 18px; color: #ffd700; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }

/* 标签栏 */
.raid-tabs {
  display: flex; gap: 4px; margin-bottom: 16px;
  background: rgba(0,0,0,0.3); border-radius: 12px; padding: 4px;
}
.raid-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 8px 6px; border-radius: 10px; border: none;
  background: transparent; color: #888; font-family: inherit; font-size: 8px;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.raid-tab.active { background: rgba(255,215,0,0.2); color: #ffd700; }
.raid-tab:hover:not(.active) { color: #ccc; }
.tab-icon { font-size: 16px; }
.tab-name { font-size: 7px; }
.tab-cleared { color: #4caf50; font-size: 10px; margin-left: 2px; }

/* 标签内容 */
.tab-content { flex: 1; overflow-y: auto; }
.raid-card {
  background: rgba(0,0,0,0.4); border: 1px solid rgba(184,154,106,0.3);
  border-radius: 16px; padding: 16px;
}
.raid-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.raid-icon { font-size: 36px; color: #ff4444; }
.raid-info { flex: 1; }
.raid-boss-name { font-size: 14px; color: #ff4444; margin: 0 0 4px 0; }
.raid-level { font-size: 9px; color: #ff9800; }
.clear-badge {
  background: rgba(76, 175, 80, 0.2); border: 1px solid #4caf50;
  border-radius: 6px; padding: 3px 8px; font-size: 8px; color: #4caf50; white-space: nowrap;
}
.raid-desc { font-size: 9px; color: #ccc; margin-bottom: 10px; line-height: 1.5; }
.raid-rewards { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
.reward-tag {
  background: rgba(255,215,0,0.15); border: 1px solid rgba(255,215,0,0.3);
  border-radius: 6px; padding: 3px 8px; font-size: 8px; color: #ffd700;
}

/* 操作按钮 */
.raid-actions { display: flex; gap: 10px; }
.raid-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; }
.pixel-btn {
  background: #2a2a3a; border: 2px solid #b89a6a; color: #ffd;
  font-family: inherit; padding: 10px 16px; font-size: 9px;
  cursor: pointer; border-radius: 8px; transition: 0.2s;
}
.pixel-btn:hover { background: #3a3a5a; }
.pixel-btn.primary { background: rgba(255,215,0,0.15); border-color: #ffd700; }
.pixel-btn.multiplayer { background: rgba(100,149,237,0.15); border-color: #6495ed; color: #6495ed; }

/* 手机横屏全屏适配 */
@media (max-width: 750px) and (orientation: landscape) {
  .panel {
    width: 100vw; height: 100vh; max-width: none; border-radius: 0; border: none; padding: 12px;
  }
  .raid-tab { font-size: 7px; }
  .raid-boss-name { font-size: 12px; }
  .pixel-btn { padding: 8px 12px; font-size: 8px; }
}
</style>