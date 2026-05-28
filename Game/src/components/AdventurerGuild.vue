<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
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

      <!-- 贩卖按钮（留白） -->
      <div class="sell-area">
        <button class="pixel-btn" @click="openBackpack">
          <Icon icon="mdi:bag-personal" /> 打开背包贩卖
        </button>
        <p class="hint">打开背包后，点击材料即可出售给协会。</p>
      </div>

      <button class="pixel-btn close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" /> 离开
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close', 'openBackpack'])

const quests = ref([])
refreshQuests()

// 段位计算
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

const currentStage = computed(() => {
  const rank = currentRank.value
  const expInRank = store.player.exp % rank.maxExp
  return Math.min(3, Math.floor((expInRank / rank.maxExp) * 3) + 1)
})

const nextRankExp = computed(() => currentRank.value.maxExp)
const expPercent = computed(() => {
  const rank = currentRank.value
  const expInRank = store.player.exp % rank.maxExp
  return Math.min(100, (expInRank / rank.maxExp) * 100)
})

function refreshQuests() {
  quests.value = [
    { id: 1, desc: '讨伐史莱姆 x3', rewardExp: 30, target: 'slime', count: 3 },
    { id: 2, desc: '收集哥布林之牙 x5', rewardExp: 50, targetMat: 'goblin_fang', count: 5 }
  ]
}

function acceptQuest(quest) {
  // 原有逻辑不变
  if (quest.target) {
    store.addExperience(quest.rewardExp)
    alert('委托完成！')
  } else if (quest.targetMat) {
    const mat = store.materials[quest.targetMat]
    if (mat && mat.qty >= quest.count) {
      mat.qty -= quest.count
      if (mat.qty === 0) delete store.materials[quest.targetMat]
      store.addExperience(quest.rewardExp)
      store.save()
      alert('委托完成！')
    } else {
      alert('材料不足！')
    }
  }
}

function openBackpack() {
  emit('openBackpack')   // 通知父组件打开背包
  emit('close')          // 同时关闭协会面板，让玩家在背包中贩卖
}
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
}

.rank-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}
.rank-badge {
  width: 70px; height: 70px;
  background: rgba(255,215,0,0.15);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.rank-icon { font-size: 36px; color: #ffd700; }
.rank-info h2 { font-size: 16px; margin-bottom: 5px; }
.rank-stage { font-size: 10px; opacity: 0.8; }

.exp-section { margin-bottom: 25px; }
.exp-label {
  display: flex; justify-content: space-between;
  font-size: 9px; margin-bottom: 5px;
}
.exp-bar {
  height: 12px; background: #2a2a3a;
  border-radius: 6px; overflow: hidden;
}
.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 6px; transition: width 0.3s;
}

.section {
  margin: 20px 0;
  padding-top: 15px;
  border-top: 1px solid rgba(255,215,0,0.3);
}
.section h3 {
  font-size: 10px; margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
}
.quest {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 10px; font-size: 9px;
  background: rgba(0,0,0,0.3);
  padding: 8px; border-radius: 8px;
}
.quest-desc { flex: 1; }
.quest-reward { color: #ffd700; white-space: nowrap; }

.sell-area {
  margin: 20px 0; text-align: center;
  padding: 15px 0;
  border-top: 1px solid rgba(255,215,0,0.3);
}
.hint { font-size: 8px; opacity: 0.7; margin-top: 8px; }

.close-btn { width: 100%; margin-top: 10px; }
</style>