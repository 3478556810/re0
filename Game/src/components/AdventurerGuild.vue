<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>

      <div class="rank-header">
        <div class="rank-badge"><Icon :icon="rankIcon" class="rank-icon" /></div>
        <div class="rank-info">
          <h2>{{ rankName }}</h2>
          <div class="rank-stage">折扣 {{ discountPercent }}%</div>
        </div>
      </div>

      <div class="exp-section">
        <div class="exp-label">
          <span>冒险者经验</span>
          <span v-if="!store.pendingRankUp">{{ displayExp }} / {{ currentRankRequiredExp }}</span>
          <span v-else>经验已满 · 请完成升段讨伐</span>
        </div>
        <div class="exp-bar">
          <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
        </div>
        <div v-if="store.pendingRankUp" class="rank-lock-tip">
          ⚠️ 必须完成升段讨伐才能继续获得段位经验
        </div>
      </div>

      <!-- 已接委托（置顶升段任务） -->
      <div class="accepted-section" v-if="acceptedQuests.length">
        <h3><Icon icon="mdi:clipboard-check" /> 进行中 ({{ acceptedQuests.length }}/3)</h3>
        <div v-for="q in acceptedQuests" :key="q.id" class="quest-card" :class="{ 'boss-quest': q.isBossQuest, active: true }">
          <div class="quest-desc">{{ q.desc }}</div>
          <div class="quest-progress" v-if="q.target">击杀 {{ q.killed || 0 }}/{{ q.count }}</div>
          <!-- 升段讨伐任务不可放弃，普通委托可放弃 -->
          <button v-if="!q.isBossQuest" class="pixel-btn small abandon" @click="abandonQuest(q.id)">放弃</button>
          <span v-else class="mandatory-tag">【必须完成】</span>
        </div>
      </div>

      <!-- 委托列表 -->
      <div class="quests-section">
        <h3><Icon icon="mdi:sword-cross" /> 狩猎委托</h3>
        <div class="quest-list">
          <div v-for="q in huntQuests" :key="q.id" class="quest-card">
            <div class="quest-desc">{{ q.desc }}</div>
            <div class="quest-reward">
              <Icon icon="mdi:star" /> {{ q.rewardExp }}
              <Icon icon="mdi:cash-multiple" /> {{ q.goldReward }}G
            </div>
            <button class="pixel-btn small" @click="acceptQuest(q)" :disabled="acceptedQuests.length >= 3 || store.pendingRankUp">接受</button>
          </div>
          <div v-if="!huntQuests.length" class="empty-hint">暂无狩猎委托</div>
        </div>

        <h3><Icon icon="mdi:package-variant-closed" /> 收集委托</h3>
        <div class="quest-list">
          <div v-for="q in collectQuests" :key="q.id" class="quest-card">
            <div class="quest-desc">{{ q.desc }}</div>
            <div class="quest-reward">
              <Icon icon="mdi:star" /> {{ q.rewardExp }}
              <Icon icon="mdi:cash-multiple" /> {{ q.goldReward }}G
            </div>
            <button class="pixel-btn small" @click="acceptQuest(q)" :disabled="store.pendingRankUp">完成</button>
          </div>
          <div v-if="!collectQuests.length" class="empty-hint">暂无收集委托</div>
        </div>
      </div>

      <div class="actions">
        <button class="pixel-btn" @click="showTokenShop = true"><Icon icon="mdi:castle" /> 徽记兑换</button>
        <button class="pixel-btn" @click="openBackpack"><Icon icon="mdi:bag-personal" /> 背包贩卖</button>
      </div>
      <p class="hint">狩猎委托需实际击杀，收集委托可直接消耗材料完成</p>
    </div>
    <TokenShop v-if="showTokenShop" @close="showTokenShop = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import TokenShop from './TokenShop.vue'

const showTokenShop = ref(false)
const store = useGameStore()
const emit = defineEmits(['close', 'openBackpack'])
const showToast = inject('showToast', (msg) => alert(msg))
watch(() => store.pendingRankUp, (val) => {
  console.log('🟢 GuildPanel 监听到 pendingRankUp:', val)
}, { immediate: true })
const rankConfig = store.rankConfig

const currentRank = computed(() => {
  const rankName = store.player.rank
  return rankConfig.find(r => r.name === rankName) || rankConfig[0]
})
const rankName = computed(() => currentRank.value.name)
const rankIcon = computed(() => currentRank.value.icon)
const discountPercent = computed(() => currentRank.value.discount)
const currentRankRequiredExp = computed(() => currentRank.value.requiredExp)

// 显示经验（取实际经验和所需经验的最小值，避免溢出显示）
const displayExp = computed(() => {
  const exp = store.player.rankExp || 0
  const max = currentRankRequiredExp.value
  return Math.min(exp, max)
})

// 经验百分比：锁定期间固定100%，否则正常比例
const expPercent = computed(() => {
  if (store.pendingRankUp) return 100
  const exp = store.player.rankExp || 0
  const max = currentRankRequiredExp.value
  if (max <= 0) return 0
  return Math.min(100, (exp / max) * 100)
})

// 已接委托：升段任务置顶
const acceptedQuests = computed(() => {
  return [...store.activeHuntQuests].sort((a, b) => (b.isBossQuest ? 1 : 0) - (a.isBossQuest ? 1 : 0))
})

const quests = ref([])
const huntQuests = computed(() => quests.value.filter(q => q.target === 'monster' || q.target === 'boss'))
const collectQuests = computed(() => quests.value.filter(q => q.targetMat))

const monsterTemplates = computed(() => store.config.monsterTemplates || [])
const materialDefs = computed(() => store.config.materialDefinitions || [])

function getMonsterReward(monster) {
  const mult = { weak: 1, normal: 1.5, strong: 2, boss: 3 }[monster.tag] || 1
  const baseLv = monster.levelRange?.[0] || 1
  return {
    exp: Math.floor((30 + baseLv * 5) * mult),
    gold: Math.floor((20 + baseLv * 3) * mult)
  }
}

function getMaterialReward(mat) {
  const price = mat.price || 10
  return {
    exp: 20 + Math.floor(price / 5),
    gold: 15 + Math.floor(price / 4)
  }
}

function generateQuestOfType(type) {
  if (type === 'hunt') {
    const monsters = monsterTemplates.value.filter(m => !m.isBoss)
    if (!monsters.length) return null
    const mon = monsters[Math.floor(Math.random() * monsters.length)]
    const count = Math.floor(Math.random() * 3) + 1
    const reward = getMonsterReward(mon)
    return {
      id: Date.now() + Math.random(),
      desc: `讨伐 ${mon.name} x${count}`,
      rewardExp: reward.exp * count,
      goldReward: reward.gold * count,
      target: 'monster',
      monsterId: mon.id,
      count
    }
  } else {
    const mats = materialDefs.value
    if (!mats.length) return null
    const mat = mats[Math.floor(Math.random() * mats.length)]
    const count = Math.floor(Math.random() * 5) + 2
    const reward = getMaterialReward(mat)
    return {
      id: Date.now() + Math.random(),
      desc: `收集 ${mat.name} x${count}`,
      rewardExp: reward.exp * count,
      goldReward: reward.gold * count,
      targetMat: mat.id,
      count
    }
  }
}

function refreshQuests() {
  const newQuests = []
  for (let i = 0; i < 3; i++) {
    const q = generateQuestOfType('hunt')
    if (q) newQuests.push(q)
  }
  for (let i = 0; i < 3; i++) {
    const q = generateQuestOfType('collect')
    if (q) newQuests.push(q)
  }
  quests.value = newQuests
}

function completeCollectQuest(quest) {
  if (store.pendingRankUp) {
    showToast('请先完成升段讨伐！')
    return
  }
  const mat = store.materials[quest.targetMat]
  if (mat && mat.qty >= quest.count) {
    mat.qty -= quest.count
    if (mat.qty <= 0) delete store.materials[quest.targetMat]
    store.addRankExperience(quest.rewardExp)
    store.addGold(quest.goldReward)
    store.save()
    quests.value = quests.value.filter(q => q.id !== quest.id)
    const newQ = generateQuestOfType('collect')
    if (newQ) quests.value.push(newQ)
    showToast(`完成！获得 ${quest.rewardExp} 经验，${quest.goldReward}G`)
  } else {
    showToast('材料不足！')
  }
}

function generateBossQuestForRank(nextRankName) {
  const bossInfo = store.getBossForRank()   // 从 store 获取（需将函数暴露）
  if (!bossInfo || !bossInfo.template) return null

  const reward = getMonsterReward(bossInfo.template)
  const currentRankIndex = rankConfig.findIndex(r => r.name === store.player.rank)
  
  return {
    id: 'boss_' + Date.now(),
    desc: `[升段讨伐] ${bossInfo.dungeonName}${bossInfo.floor}F · ${bossInfo.template.name}`,
    rewardExp: reward.exp * 2,
    goldReward: reward.gold * 2 + 300 * (currentRankIndex + 1),
    target: bossInfo.bossId,
    count: 1,
    isBossQuest: true,
    floor: bossInfo.floor,
    dungeonId: bossInfo.dungeonId
  }
}

function ensureBossQuestAccepted() {
  if (!store.pendingRankUp) return
  const hasBossQuest = store.activeHuntQuests.some(q => q.isBossQuest === true)
  if (hasBossQuest) return
  const nextRank = store.pendingTargetRank
  if (!nextRank) return
  const bossQuest = generateBossQuestForRank(nextRank)
  if (!bossQuest) return
  // 如果任务槽已满，移除最早的非升段任务
 if (store.activeHuntQuests.length >= 3) {
  const nonBossIndex = store.activeHuntQuests.findIndex(q => !q.isBossQuest)
  if (nonBossIndex !== -1) {
    store.abandonHuntQuest(store.activeHuntQuests[nonBossIndex].id)
  } else {
    // 全是升段任务？理论上不会出现，但若出现则放弃最早的一个
    store.abandonHuntQuest(store.activeHuntQuests[0].id)
  }
}
  store.acceptHuntQuest({ ...bossQuest, killed: 0 })
  showToast(`升段讨伐已自动接受：${bossQuest.desc}`)
}

function abandonQuest(questId) {
  store.abandonHuntQuest(questId)
  showToast('已放弃委托')
}

function acceptQuest(quest) {
  if (store.pendingRankUp && !quest.isBossQuest) {
    showToast('请先完成升段讨伐！')
    return
  }
  if (quest.target === 'boss' || quest.target === 'monster') {
    if (acceptedQuests.value.length >= 3) {
      showToast('最多同时接受3个委托')
      return
    }
    store.acceptHuntQuest({
      ...quest,
      killed: 0,
      target: quest.target === 'boss' ? quest.monsterId : quest.monsterId
    })
    // 👇 新增：从列表中移除已接受的委托
    quests.value = quests.value.filter(q => q.id !== quest.id)
    // 👇 新增：补充一个新的狩猎委托
    const newQuest = generateQuestOfType('hunt')
    if (newQuest) quests.value.push(newQuest)
    showToast('已接受委托：' + quest.desc)
    return
}
  if (quest.targetMat) {
    completeCollectQuest(quest)
  }
}

function onNeedBossQuest() {
  ensureBossQuestAccepted()
}

onMounted(() => {
  refreshQuests()
 
  if (store.pendingRankUp) {
    ensureBossQuestAccepted()   // 确保进入面板时如果已锁定则生成任务
  }
})


// 只要锁定状态变为 true，就立刻尝试生成升段任务
// 在 <script setup> 中已有：
watch(() => store.pendingRankUp, (val) => {
  if (val) {
    console.log('[GuildPanel] pendingRankUp 变为 true，尝试生成升段任务')
    ensureBossQuestAccepted()
  }
}, { immediate: true })

// 同时保留 checkRankUp 被调用后触发的事件监听（如果你还需要的话）

function openBackpack() { emit('openBackpack') }
</script>



<style scoped>
/* 样式保持不变，已经包含 .exp-bar 等 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 600px; max-width: 90vw; max-height: 90vh; background: rgba(15,25,45,0.9); backdrop-filter: blur(20px); border: 2px solid #b89a6a; border-radius: 24px; padding: 24px; color: #ffd; font-family: 'Press Start 2P', cursive; overflow-y: auto; position: relative; }
.close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer; z-index: 10; }
.rank-header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
.rank-badge { width: 70px; height: 70px; background: rgba(255,215,0,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.rank-icon { font-size: 36px; color: #ffd700; }
.rank-info h2 { font-size: 16px; margin-bottom: 5px; }
.rank-stage { font-size: 10px; opacity: 0.8; }
.exp-section { margin-bottom: 25px; }
.exp-label { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 5px; }
.exp-bar { height: 12px; background: #2a2a3a; border-radius: 6px; overflow: hidden; }
.exp-fill { height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); border-radius: 6px; transition: width 0.3s; }
.accepted-section { margin-bottom: 20px; padding: 12px; background: rgba(255,215,0,0.05); border: 1px solid rgba(255,215,0,0.2); border-radius: 12px; }
.accepted-section h3 { font-size: 10px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; color: #ffd700; }
.quests-section { margin-bottom: 20px; }
.quests-section h3 { font-size: 10px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; color: #ffd700; }
.quest-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
.quest-card { display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.3); border-radius: 10px; font-size: 9px; }
.quest-card.active { border-color: #ffd700; background: rgba(255,215,0,0.05); }
.quest-desc { flex: 1; }
.quest-reward { color: #ffd700; white-space: nowrap; display: flex; gap: 8px; }
.quest-progress { font-size: 8px; color: #aaa; }
.empty-hint { font-size: 8px; color: #888; text-align: center; padding: 15px; }
.actions { display: flex; gap: 10px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }
.hint { font-size: 7px; opacity: 0.6; text-align: center; margin-top: 10px; }
.pixel-btn.small { font-size: 8px; padding: 6px 12px; }

/* 原有样式保持不变，新增以下 */
.abandon {
  background: #8b0000;
  border-color: #ff5555;
}
.abandon:hover {
  background: #a00000;
}
.rank-lock-tip {
  font-size: 8px;
  color: #ffaa44;
  margin-top: 5px;
  text-align: center;
}

</style>