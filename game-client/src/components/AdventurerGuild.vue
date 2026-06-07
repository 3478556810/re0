<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>

      <!-- 段位信息 -->
      <div class="rank-header">
        <div class="rank-badge"><Icon :icon="rankIcon" class="rank-icon" /></div>
        <div class="rank-info">
          <h2>{{ rankName }}</h2>
          <div class="rank-stage">
            委托倍率 x{{ currentRank.rewardMult }} | 商店折扣 {{ discountPercent }}%
          </div>
        </div>
      </div>

      <!-- 经验条 -->
      <div class="exp-section">
        <div class="exp-label">
          <span>冒险者经验</span>
          <span>{{ displayExp }} / {{ currentRankRequiredExp }}</span>
        </div>
        <div class="exp-bar">
          <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
        </div>
      </div>

      <!-- 升段讨伐提示 -->
      <div v-if="store.pendingRankUp" class="rank-up-banner">
        <Icon icon="mdi:sword-cross" />
        <span>升段讨伐已自动接受，击败Boss晋升后可获大量金币！</span>
      </div>

      <!-- 已接委托 -->
      <div class="section" v-if="acceptedQuests.length">
        <h3><Icon icon="mdi:clipboard-check" /> 进行中 ({{ acceptedQuests.length }}/3)</h3>
        <div v-for="q in acceptedQuests" :key="q.id" class="quest-card accepted" :class="{ 'boss-quest': q.isBossQuest }">
          <div class="quest-desc">
            <span v-if="q.isBossQuest" class="boss-tag">升段</span>
            {{ q.desc }}
          </div>
          <div class="quest-reward">
            <Icon icon="mdi:star" /> {{ q.rewardExp }}
            <Icon icon="mdi:cash-multiple" /> {{ q.goldReward }}G
            <span v-if="q.isBossQuest" class="skill-bonus">+1SP</span>
          </div>
          <div class="quest-progress" v-if="q.target">
            击杀 {{ q.killed || 0 }}/{{ q.count }}
          </div>
          <button v-if="!q.isBossQuest" class="pixel-btn small danger" @click="abandonQuest(q.id)">放弃</button>
        </div>
      </div>

      <!-- 委托列表 -->
      <div class="section">
        <h3><Icon icon="mdi:sword-cross" /> 狩猎委托</h3>
        <div class="quest-list">
          <div v-for="q in huntQuests" :key="q.id" class="quest-card">
            <div class="quest-desc">{{ q.desc }}</div>
            <div class="quest-reward">
              <Icon icon="mdi:star" /> {{ q.rewardExp }}
              <Icon icon="mdi:cash-multiple" /> {{ q.goldReward }}G
            </div>
            <button class="pixel-btn small" @click="acceptQuest(q)" :disabled="acceptedQuests.length >= 3">接受</button>
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
            <button class="pixel-btn small" @click="acceptQuest(q)">完成</button>
          </div>
          <div v-if="!collectQuests.length" class="empty-hint">暂无收集委托</div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="actions">
        <button class="pixel-btn" @click="showTokenShop = true"><Icon icon="mdi:castle" /> 徽记兑换</button>
        <button class="pixel-btn" @click="openBackpack"><Icon icon="mdi:bag-personal" /> 背包贩卖</button>
      </div>
      <p class="hint">狩猎委托需实际击杀目标，收集委托可直接消耗材料完成</p>
    </div>
    <TokenShop v-if="showTokenShop" @close="showTokenShop = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import TokenShop from './TokenShop.vue'

const showTokenShop = ref(false)
const store = useGameStore()
const emit = defineEmits(['close', 'openBackpack'])
const showToast = inject('showToast', (msg) => alert(msg))

const rankConfig = store.rankConfig

const currentRank = computed(() => {
  return rankConfig.find(r => r.name === store.player.rank) || rankConfig[0]
})
const rankName = computed(() => currentRank.value.name)
const rankIcon = computed(() => currentRank.value.icon)
const discountPercent = computed(() => currentRank.value.discount)
const currentRankRequiredExp = computed(() => currentRank.value.requiredExp)

const displayExp = computed(() => Math.min(store.player.rankExp || 0, currentRankRequiredExp.value))

const expPercent = computed(() => {
  if (store.pendingRankUp) return 100
  const exp = store.player.rankExp || 0
  const max = currentRankRequiredExp.value
  return max <= 0 ? 0 : Math.min(100, (exp / max) * 100)
})

const acceptedQuests = computed(() => {
  return [...store.activeHuntQuests].sort((a, b) => (b.isBossQuest ? 1 : 0) - (a.isBossQuest ? 1 : 0))
})

const quests = ref([])
const huntQuests = computed(() => quests.value.filter(q => q.target === 'monster' || q.target === 'boss'))
const collectQuests = computed(() => quests.value.filter(q => q.targetMat))

const monsterTemplates = computed(() => store.config.monsterTemplates || [])
const materialDefs = computed(() => store.config.materialDefinitions || [])
const dungeonConfigs = computed(() => store.config.dungeonConfigs || {})
const nextBossFloor = computed(() => {
  // 当前段位的下一个升段 Boss 在几层
  const currentIdx = rankConfig.findIndex(r => r.name === store.player.rank)
  if (currentIdx === -1 || currentIdx >= rankConfig.length - 1) return 999
  return (currentIdx + 1) * 5  // 青铜→5F，白银→10F，黄金→15F...
})

const currentStageMaxFloor = computed(() => {
  // 当前阶段能接触到的最高楼层 = 下一个 Boss 层 - 1
  // 例如下个 Boss 在 5F，则你只能在 1~4F 活动
  return nextBossFloor.value - 1
})
const availableMonsterIds = computed(() => {
  const ids = new Set()
  for (const dg of Object.values(dungeonConfigs.value)) {
    if (dg.monstersByFloor) {
      for (const floorMonsters of Object.values(dg.monstersByFloor)) {
        floorMonsters.forEach(id => ids.add(id))
      }
    }
  }
  return ids
})
const availableMonsters = computed(() => {
  const { minFloor, maxFloor } = getFloorRangeForCurrentRank();
  const dungeon = dungeonConfigs.value['shadow_abyss'];
  if (!dungeon || !dungeon.monstersByFloor) return [];

  const monsterIdsInRange = new Set();
  for (let floor = minFloor; floor <= maxFloor; floor++) {
    const floorMonsters = dungeon.monstersByFloor[String(floor)] || [];
    // 排除 Boss 层（5、10、15、20 等）
    if (floor % 5 === 0) continue;
    floorMonsters.forEach(id => monsterIdsInRange.add(id));
  }

  return monsterTemplates.value.filter(m => {
    if (!monsterIdsInRange.has(m.id)) return false;
    if (m.isBoss) return false;
    if (m.isRaidBoss) return false;
    if (m.id === 'training_dummy') return false;
    return true;
  });
});

function getFloorRangeForCurrentRank() {
  const rankIndex = rankConfig.findIndex(r => r.name === store.player.rank);
  if (rankIndex === -1) return { minFloor: 1, maxFloor: 4 };
  
  const maxFloor = (rankIndex + 1) * 5 - 1;  // 黄金→19F
  const minFloor = rankIndex === 0 ? 1 : rankIndex * 5;  // 黑铁→1F，青铜→5F，白银→10F，黄金→15F...
  
  return { minFloor, maxFloor };
}
// 新增：根据段位获取最高楼层
function getMaxFloorForCurrentRank() {
  const rankIndex = rankConfig.findIndex(r => r.name === store.player.rank);
  if (rankIndex === -1) return 4; // 默认1-4层
  return (rankIndex + 1) * 5 - 1; // 黑铁→4F，青铜→9F，白银→14F...
}

function getMonsterFloor(monsterId) {
  const floors = [];
  for (const dg of Object.values(dungeonConfigs.value)) {
    for (const [floor, monsters] of Object.entries(dg.monstersByFloor || {})) {
      if (monsters.includes(monsterId)) {
        floors.push(floor );
      }
    }
  }
  return floors.length > 0 ? `${floors.join('、')}` : '';
}

function getRankExpMultiplier() {
  // 段位经验倍率：黑铁1.0，青铜1.1，白银1.2，黄金1.3...王者1.7
  const rankIndex = rankConfig.findIndex(r => r.name === store.player.rank)
  return 1 + rankIndex * 0.1
}

function getMonsterReward(monster) {
  const mult = { weak: 1, normal: 2, strong: 4, boss: 8 }[monster.tag] || 1
  const baseLv = monster.levelRange?.[0] || monster.minLevel || 1
  const rankMult = currentRank.value.rewardMult || 1.0
  return {
    exp: Math.floor((25 + baseLv * 6) * mult * rankMult),
    gold: Math.floor((40 + baseLv * 6) * mult * rankMult)
  }
}

function getMaterialReward(mat) {
  const price = mat.price || 15
  const rankMult = currentRank.value.rewardMult || 1.0
  return {
    exp: Math.floor((25 + price / 3) * rankMult),
    gold: Math.floor((30 + price / 3) * rankMult)
  }
}

function generateQuestOfType(type) {
  if (type === 'hunt') {
    const monsters = availableMonsters.value
    if (!monsters.length) return null
    const mon = monsters[Math.floor(Math.random() * monsters.length)]
    const floor = getMonsterFloor(mon.id)
    const floorHint = floor ? `（${floor}F可遇）` : ''
    const count = Math.floor(Math.random() * 5) + 2
    const reward = getMonsterReward(mon)
    return {
      id: Date.now() + Math.random(),
      desc: `讨伐 ${mon.name} x${count} ${floorHint}`,
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
    const count = Math.floor(Math.random() * 8) + 3
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

function generateBossQuestForRank() {
  const bossInfo = store.getBossForRank()
  if (!bossInfo || !bossInfo.template) return null
  const reward = getMonsterReward(bossInfo.template)
  return {
    id: 'boss_' + Date.now(),
    desc: `[升段讨伐] ${bossInfo.dungeonName} ${bossInfo.floor}F · ${bossInfo.template.name}`,
    rewardExp: reward.exp * 5,
    goldReward: reward.gold * 5 + 500,
    target: bossInfo.bossId,
    count: 1,
    isBossQuest: true,
    floor: bossInfo.floor,
    dungeonId: bossInfo.dungeonId,
    skillPointReward: 1
  }
}

function ensureBossQuestAccepted() {
  if (!store.pendingRankUp) return
  const hasBossQuest = store.activeHuntQuests.some(q => q.isBossQuest)
  if (hasBossQuest) return
  const bossQuest = generateBossQuestForRank()
  if (!bossQuest) return
  if (store.activeHuntQuests.length >= 3) {
    const nonBossIndex = store.activeHuntQuests.findIndex(q => !q.isBossQuest)
    if (nonBossIndex !== -1) store.abandonHuntQuest(store.activeHuntQuests[nonBossIndex].id)
  }
  store.acceptHuntQuest({ ...bossQuest, killed: 0, skillPointReward: 1 })
  showToast(`升段讨伐已自动接受：${bossQuest.desc}`)
}

function abandonQuest(questId) {
  store.abandonHuntQuest(questId)
  showToast('已放弃委托')
}

function acceptQuest(quest) {
  if (quest.targetMat) {
    completeCollectQuest(quest)
    return
  }
  if (acceptedQuests.value.length >= 3) {
    showToast('最多同时接受3个委托')
    return
  }
  store.acceptHuntQuest({ ...quest, killed: 0, target: quest.monsterId })
  quests.value = quests.value.filter(q => q.id !== quest.id)
  const newQ = generateQuestOfType('hunt')
  if (newQ) quests.value.push(newQ)
  showToast('已接受委托：' + quest.desc)
}

onMounted(() => {
  refreshQuests()
  if (store.pendingRankUp) ensureBossQuestAccepted()
})

function openBackpack() { emit('openBackpack') }
</script>

<style scoped>
/* 样式不变，与原来完全一致 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 620px; max-width: 92vw; max-height: 90vh; background: rgba(15,25,45,0.9); backdrop-filter: blur(20px); border: 2px solid #b89a6a; border-radius: 24px; padding: 24px; color: #ffd; font-family: 'Press Start 2P', cursive; overflow-y: auto; position: relative; }
.close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer; z-index: 10; }
.rank-header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
.rank-badge { width: 70px; height: 70px; background: rgba(255,215,0,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.rank-icon { font-size: 36px; color: #ffd700; }
.rank-info h2 { font-size: 16px; margin-bottom: 5px; }
.rank-stage { font-size: 10px; opacity: 0.8; }
.exp-section { margin-bottom: 15px; }
.exp-label { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 5px; }
.exp-bar { height: 12px; background: #2a2a3a; border-radius: 6px; overflow: hidden; }
.exp-fill { height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); border-radius: 6px; transition: width 0.3s; }
.rank-up-banner { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(255,165,0,0.15); border: 1px solid #ffa500; border-radius: 10px; margin-bottom: 15px; font-size: 9px; color: #ffa500; }
.section { margin-bottom: 20px; }
.section h3 { font-size: 10px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; color: #ffd700; }
.quest-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
.quest-card { display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(184,154,106,0.3); border-radius: 10px; font-size: 9px; }
.quest-card.accepted { border-color: #ffd700; background: rgba(255,215,0,0.08); }
.quest-card.boss-quest { border-color: #ffa500; background: rgba(255,165,0,0.1); }
.quest-desc { flex: 1; display: flex; align-items: center; gap: 6px; }
.boss-tag { background: #ffa500; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 7px; font-weight: bold; }
.quest-reward { color: #ffd700; white-space: nowrap; display: flex; gap: 8px; align-items: center; }
.skill-bonus { color: #00ffcc; font-size: 8px; }
.quest-progress { font-size: 8px; color: #aaa; min-width: 60px; text-align: right; }
.empty-hint { font-size: 8px; color: #888; text-align: center; padding: 15px; }
.actions { display: flex; gap: 10px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }
.hint { font-size: 7px; opacity: 0.6; text-align: center; margin-top: 10px; }
.pixel-btn.small { font-size: 8px; padding: 6px 12px; }
.danger { background: rgba(255,60,60,0.2); border-color: #ff5555; }
</style>