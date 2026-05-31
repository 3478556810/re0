<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <!-- 关闭按钮移到右上角 -->
      <button class="close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" />
      </button>

      <!-- 段位头部 -->
      <div class="rank-header">
        <div class="rank-badge">
          <Icon :icon="rankIcon" class="rank-icon" />
        </div>
        <div class="rank-info">
          <h2>{{ rankName }}</h2>
          <div class="rank-stage">阶段 {{ currentStage }}/3</div>
        </div>
      </div>

      <!-- 经验条 -->
      <div class="exp-section">
        <div class="exp-label">
          <span>冒险者经验</span>
          <span>{{ store.player.exp }} / {{ nextRankExp }}</span>
        </div>
        <div class="exp-bar">
          <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
        </div>
      </div>
<div v-if="store.activeHuntQuest" class="active-quest">
  <Icon icon="mdi:sword-cross" />
  <span>{{ store.activeHuntQuest.desc }}</span>
  <span>({{ store.activeHuntQuest.killed }}/{{ store.activeHuntQuest.count }})</span>
</div>
      <!-- 委托列表 -->
      <div class="section">
        <h3><Icon icon="mdi:script-text-outline" /> 委托任务</h3>
        <div v-for="quest in quests" :key="quest.id" class="quest">
          <div class="quest-desc">{{ quest.desc }}</div>
          <div class="quest-reward">
            <Icon icon="mdi:star" /> {{ quest.rewardExp }} 经验
          </div>
          <button class="pixel-btn small" @click="acceptQuest(quest)">接受</button>
        </div>
        <button class="pixel-btn small" @click="refreshQuests">
          <Icon icon="mdi:refresh" /> 刷新委托
        </button>
      </div>

      <!-- 徽记兑换入口 -->
      <div class="section">
        <button class="pixel-btn" @click="showTokenShop = true">
          <Icon icon="mdi:castle" /> 徽记兑换
        </button>
      </div>

      <!-- 贩卖按钮 -->
      <div class="sell-area">
        <button class="pixel-btn" @click="openBackpack">
          <Icon icon="mdi:bag-personal" /> 打开背包贩卖
        </button>
        <p class="hint">打开背包后，点击材料即可出售给协会。</p>
      </div>
    </div>

    <!-- 徽记兑换商店 -->
    <TokenShop v-if="showTokenShop" @close="showTokenShop = false" />
  </div>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import TokenShop from './TokenShop.vue'

const showTokenShop = ref(false)
const store = useGameStore()
const emit = defineEmits(['close', 'openBackpack'])

const ranks = [
  { name: '黑铁', minLevel: 1, maxExp: 300, icon: 'mdi:circle-small' },
  { name: '青铜', minLevel: 5, maxExp: 600, icon: 'mdi:circle-double' },
  { name: '白银', minLevel: 10, maxExp: 1000, icon: 'mdi:brightness-5' },
  { name: '黄金', minLevel: 15, maxExp: 1500, icon: 'mdi:star-four-points' },
  { name: '白金', minLevel: 20, maxExp: 2200, icon: 'mdi:diamond' },
  { name: '钻石', minLevel: 25, maxExp: 3200, icon: 'mdi:rhombus-split' },
  { name: '大师', minLevel: 30, maxExp: 4500, icon: 'mdi:shield-crown' },
  { name: '王者', minLevel: 35, maxExp: 6000, icon: 'mdi:crown' }
]

const currentRankIndex = computed(() => {
  let idx = 0
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (store.player.level >= ranks[i].minLevel) {
      idx = i
      break
    }
  }
  return idx
})

const currentRank = computed(() => ranks[currentRankIndex.value])
const rankName = computed(() => currentRank.value.name)
const rankIcon = computed(() => currentRank.value.icon)

const expInRank = computed(() => store.player.exp % currentRank.value.maxExp)
const expPercent = computed(() => Math.min(100, (expInRank.value / currentRank.value.maxExp) * 100))
const nextRankExp = computed(() => currentRank.value.maxExp)
const canRankUp = computed(() => expInRank.value >= currentRank.value.maxExp)

const activeBossQuest = ref(null)
const quests = ref([])


function acceptQuest(quest) {
  if (quest.target === 'boss') {
    // Boss 任务也通过 store 接受
    store.acceptHuntQuest({
      ...quest,
      killed: 0,
      target: quest.bossId  // Boss 的怪物 ID
    })
    alert(`已接受升段讨伐：${quest.desc}。去地下城击败 Boss！`)
    return
  }

  if (quest.target) {
    // 怪物讨伐：调用 store 方法
    store.acceptHuntQuest({ ...quest, killed: 0 })
    alert(`已接受委托：${quest.desc}。去地下城讨伐吧！`)
    return
  }

  if (quest.targetMat) {
    const mat = store.materials[quest.targetMat]
    if (mat && mat.qty >= quest.count) {
      mat.qty -= quest.count
      if (mat.qty <= 0) delete store.materials[quest.targetMat]
      store.addExperience(quest.rewardExp)
      store.save()
      quests.value = quests.value.filter(q => q.id !== quest.id)
      addRandomQuest()
      alert('委托完成！')
    } else {
      alert('材料不足！')
    }
  }
}
// 安全获取怪物模板数组
const monsterTemplates = computed(() => {
  const templates = store.config.monsterTemplates
  return Array.isArray(templates) ? templates : []
})

// 安全获取材料定义数组
const materialDefs = computed(() => {
  const defs = store.config.materialDefinitions
  return Array.isArray(defs) ? defs : []
})

function generateRandomQuest() {
  const types = ['hunt', 'collect']
  const type = types[Math.floor(Math.random() * types.length)]

  if (type === 'hunt') {
    const normalMonsters = monsterTemplates.value.filter(m => !m.isBoss)
    if (normalMonsters.length === 0) return null
    const monster = normalMonsters[Math.floor(Math.random() * normalMonsters.length)]
    const count = Math.floor(Math.random() * 3) + 1
    return {
      id: Date.now() + Math.random(),
      desc: `讨伐 ${monster.name} x${count}`,
      rewardExp: 30 + count * 10,
      target: monster.id,
      count
    }
  } else {
    const materials = materialDefs.value
    if (materials.length === 0) return null
    const mat = materials[Math.floor(Math.random() * materials.length)]
    const count = Math.floor(Math.random() * 5) + 2
    return {
      id: Date.now() + Math.random(),
      desc: `收集 ${mat.name} x${count}`,
      rewardExp: 20 + count * 5,
      targetMat: mat.id,
      count
    }
  }
}

function spawnBossQuest() {
  if (activeBossQuest.value) return

  const allBosses = monsterTemplates.value.filter(m => m.isBoss)
  if (allBosses.length === 0) return

  const playerLevel = store.player.level
  const eligibleBosses = allBosses.filter(boss => {
    const minLv = boss.levelRange?.[0] || boss.minLevel || 1
    const maxLv = boss.levelRange?.[1] || boss.maxLevel || 99
    return minLv <= playerLevel + 3 && maxLv >= playerLevel - 2
  })

  const pool = eligibleBosses.length > 0 ? eligibleBosses : allBosses
  const boss = pool[Math.floor(Math.random() * pool.length)]

  const quest = {
    id: 'boss_' + Date.now(),
    desc: `[升段讨伐] 击败 ${boss.name}`,
    rewardExp: 0,
    target: 'boss',
    bossId: boss.id,
    bossName: boss.name
  }

  quests.value.push(quest)
  activeBossQuest.value = quest.id
}

function refreshQuests() {
  const bossQuest = quests.value.find(q => q.target === 'boss')
  quests.value = bossQuest ? [bossQuest] : []
  for (let i = 0; i < 3; i++) {
    const q = generateRandomQuest()
    if (q) quests.value.push(q)
  }
}

function addRandomQuest() {
  const q = generateRandomQuest()
  if (q) quests.value.push(q)
}

watch(canRankUp, (val) => {
  if (val && !activeBossQuest.value) {
    spawnBossQuest()
  }
})



function openBackpack() {
  emit('openBackpack')
}

refreshQuests()
</script>



<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(10px);
  display: flex; justify-content: center; align-items: center;
  z-index: 200;
}
.panel {
  width: 450px;
  max-width: 90vw;
  max-height: 90vh;
  background: rgba(15,25,45,0.9);
  backdrop-filter: blur(20px);
  border: 2px solid #b89a6a;
  border-radius: 24px;
  padding: 24px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  overflow-y: auto;
  position: relative; /* 新增，用于定位关闭按钮 */
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #ffd;
  font-size: 20px;
  cursor: pointer;
  z-index: 10;
}
.close-btn:hover { transform: scale(1.2); }

/* 其他样式保持不变 */
.rank-header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
.rank-badge { width: 70px; height: 70px; background: rgba(255,215,0,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.rank-icon { font-size: 36px; color: #ffd700; }
.rank-info h2 { font-size: 16px; margin-bottom: 5px; }
.rank-stage { font-size: 10px; opacity: 0.8; }
.exp-section { margin-bottom: 25px; }
.exp-label { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 5px; }
.exp-bar { height: 12px; background: #2a2a3a; border-radius: 6px; overflow: hidden; }
.exp-fill { height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); border-radius: 6px; transition: width 0.3s; }
.section { margin: 20px 0; padding-top: 15px; border-top: 1px solid rgba(255,215,0,0.3); }
.section h3 { font-size: 10px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.quest { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 9px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px; }
.quest-desc { flex: 1; }
.quest-reward { color: #ffd700; white-space: nowrap; }
.sell-area { margin: 20px 0; text-align: center; padding: 15px 0; border-top: 1px solid rgba(255,215,0,0.3); }
.hint { font-size: 8px; opacity: 0.7; margin-top: 8px; }
</style>
