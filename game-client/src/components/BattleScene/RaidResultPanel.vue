<template>
  <div class="overlay">
    <div class="raid-result-panel pixel-panel">
      
      <!-- ========== 失败状态 ========== -->
      <template v-if="defeated">
        <div class="defeat-section">
          <div class="defeat-icon">
            <Icon icon="mdi:skull-crossbones" />
          </div>
          <h2 class="defeat-title">战斗失败</h2>
          <p class="defeat-subtitle">角斗士·血斧 依然屹立在竞技场中</p>
          <div class="defeat-stats">
            <div class="stat-item">
              <span class="stat-label">造成伤害</span>
              <span class="stat-value">{{ formatNumber(stats.totalDamage) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">生存回合</span>
              <span class="stat-value">{{ stats.totalTurns }}</span>
            </div>
          </div>
          <button class="pixel-btn danger" @click="$emit('retry')">
            <Icon icon="mdi:refresh" /> 再次挑战
          </button>
          <button class="pixel-btn" @click="$emit('close')">
            <Icon icon="mdi:exit-run" /> 撤退
          </button>
        </div>
      </template>

      <!-- ========== 胜利状态 ========== -->
      <template v-else>
        <!-- 评分动画区域 -->
        <div class="rating-section" :class="'rating-' + currentRating">
          <div class="rating-glow"></div>
          <div class="rating-content">
            <div class="rating-label">战斗评价</div>
            <div class="rating-value" ref="ratingRef">{{ displayRating }}</div>
            <div class="rating-title">{{ ratingTitle }}</div>
          </div>
          <div class="rating-sparkles">
            <span v-for="i in sparkleCount" :key="i" class="sparkle" :style="sparkleStyle(i)"></span>
          </div>
        </div>

        <!-- 战斗统计 -->
        <div class="stats-row">
          <div class="stat-item">
            <Icon icon="mdi:clock-outline" />
            <span class="stat-value">{{ formatTime(stats.clearTime) }}</span>
          </div>
          <div class="stat-item">
            <Icon icon="mdi:sword-cross" />
            <span class="stat-value">{{ formatNumber(stats.maxDamage) }}</span>
          </div>
       <div class="stat-item">
  <Icon icon="mdi:heart" />
  <span class="stat-value">{{ Math.floor((props.stats.remainingHp / props.stats.maxHp) * 100) }}%</span>
</div>
        </div>

        <!-- 经验奖励 -->
        <div class="exp-section">
          <span class="exp-inline">经验 +{{ displayedExp }}</span>
          <span class="exp-inline companion-exp" v-if="reward.companionExp > 0">
            伙伴经验 +{{ reward.companionExp }}
          </span>
        </div>

        <!-- 战利品标签化展示 -->
        <div class="loot-section" v-if="hasAnyReward">
          <div class="loot-title">
            <Icon icon="mdi:treasure-chest" /> 战利品
          </div>
          <div class="loot-tags">
            <!-- 装备 -->
            <div v-for="eq in (reward.equipments || []).slice(0, 4)" :key="eq.id" class="loot-tag equipment-tag" :style="{ borderColor: qualityColor(eq.quality) }">
              <Icon :icon="equipmentIcon(eq.part)" class="loot-tag-icon" />
              <span class="loot-tag-name" :style="{ color: qualityColor(eq.quality) }">{{ eq.name }}</span>
              <span class="loot-tag-level">Lv.{{ eq.level }}</span>
            </div>
            <!-- 饰品 -->
            <div v-for="acc in (reward.accessories || []).slice(0, 2)" :key="acc.id" class="loot-tag accessory-tag" :style="{ borderColor: qualityColor(acc.quality) }">
              <Icon icon="mdi:ring" class="loot-tag-icon" />
              <span class="loot-tag-name" :style="{ color: qualityColor(acc.quality) }">{{ acc.name }}</span>
            </div>
            <!-- 材料 -->
            <div v-for="mat in (reward.materials || []).slice(0, 6)" :key="mat.id" class="loot-tag material-tag">
              <Icon :icon="materialIcon(mat.id)" class="loot-tag-icon" />
             <span class="loot-tag-name">{{ getMaterialName(mat.id) }}</span>
              <span class="loot-tag-qty">x{{ mat.qty }}</span>
            </div>
            <!-- 宝石 -->
            <div v-for="gem in (reward.gems || []).slice(0, 3)" :key="gem.id" class="loot-tag gem-tag">
              <div class="gem-core" :class="'gem-tier-' + getGemTier(gem.id)" :style="{ '--gem-color': gemColor(gem.id), width: '20px', height: '20px' }"></div>
              <span class="loot-tag-name">{{ gem.name }}</span>
            </div>
          </div>
          <div v-if="totalLootCount > 12" class="more-loot">
            还有 +{{ totalLootCount - 12 }} 件物品
          </div>
        </div>

        <!-- 无掉落 -->
        <div v-if="!hasAnyReward" class="empty-loot">无战利品</div>

        <!-- 按钮 -->
        <div class="buttons">
          <button class="pixel-btn primary" @click="$emit('close')">
            <Icon icon="mdi:check" /> 确定
          </button>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'

const props = defineProps({
  reward: { type: Object, default: () => ({}) },
  stats: { type: Object, default: () => ({}) }, // { totalDamage, maxDamage, clearTime, totalTurns, remainingHp, maxHp }
  defeated: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'retry'])
const store = useGameStore()

// ========== 评分计算 ==========
const ratingRef = ref(null)
const displayRating = ref('')
const sparkleCount = ref(0)

const ratingMap = {
  'B':  { min: 0,   max: 39,  label: 'B', title: '初级冒险者', color: '#9e9e9e', sparkles: 0 },
  'A':  { min: 40,  max: 59,  label: 'A', title: '熟练战士',   color: '#4caf50', sparkles: 3 },
  'S':  { min: 60,  max: 79,  label: 'S', title: '竞技场精英', color: '#2196f3', sparkles: 6 },
  'SS': { min: 80,  max: 94,  label: 'SS', title: '传奇角斗士', color: '#9c27b0', sparkles: 9 },
  'SSS':{ min: 95,  max: 100, label: 'SSS', title: '血斧征服者', color: '#ffd700', sparkles: 12 }
}

function calculateScore() {
  const { totalDamage = 0, maxDamage = 0, clearTime = 999, totalTurns = 99, remainingHp = 1, maxHp = 1 } = props.stats
  
  // 回合评分（越少越好）：20回合及格，5回合满分
  let turnScore = Math.max(0, 100 - (totalTurns - 5) * 5)
  if (totalTurns <= 5) turnScore = 100
  
  // 伤害评分（越高越好）：基于Boss血量百分比
  let damageScore = Math.min(100, (totalDamage / 3500000) * 100)
  
  // 生存评分：剩余血量百分比，确保数值有效
  let survivalScore = 0
  if (maxHp > 0) {
    survivalScore = (remainingHp / maxHp) * 100
  }
  
  // 综合评分
  return Math.floor(turnScore * 0.4 + damageScore * 0.3 + survivalScore * 0.3)
}

const currentRating = computed(() => {
  const score = calculateScore()
  for (const [key, val] of Object.entries(ratingMap)) {
    if (score >= val.min && score <= val.max) return key
  }
  return 'B'
})

const ratingData = computed(() => ratingMap[currentRating.value])
const ratingTitle = computed(() => ratingData.value?.title || '')
const sparkleCountComputed = computed(() => ratingData.value?.sparkles || 0)

// ========== 战利品 ==========
const hasAnyReward = computed(() => {
  const r = props.reward
  return (r?.materials?.length || r?.equipments?.length || r?.accessories?.length || r?.gems?.length) > 0
})

const totalLootCount = computed(() => {
  const r = props.reward
  return (r?.materials?.length || 0) + (r?.equipments?.length || 0) + (r?.accessories?.length || 0) + (r?.gems?.length || 0)
})

// ========== 经验动画 ==========
const displayedExp = ref(0)
watch(() => props.reward?.exp, (newExp) => {
  if (!newExp || newExp <= 0) return
  let current = 0
  const target = newExp
  const step = Math.ceil(target / 60)
  const timer = setInterval(() => {
    current += step
    if (current >= target) {
      displayedExp.value = target
      clearInterval(timer)
    } else {
      displayedExp.value = current
    }
  }, 16)
}, { immediate: true })

// ========== 评分动画 ==========
onMounted(() => {
  if (!props.defeated) {
    // 打字机效果显示评分
    const rating = currentRating.value
    let i = 0
    const timer = setInterval(() => {
      displayRating.value = rating.substring(0, i + 1)
      i++
      if (i >= rating.length) {
        clearInterval(timer)
        sparkleCount.value = sparkleCountComputed.value
      }
    }, 300)
  }
})

// ========== 辅助函数 ==========
function sparkleStyle(i) {
  const angle = (i / sparkleCountComputed.value) * 360
  const distance = 80 + Math.random() * 40
  const x = Math.cos((angle * Math.PI) / 180) * distance
  const y = Math.sin((angle * Math.PI) / 180) * distance
  return {
    '--x': x + 'px',
    '--y': y + 'px',
    animationDelay: (i * 0.1) + 's'
  }
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return String(Math.floor(num))
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function getMaterialName(id) { return store.getMaterialName(id) }

function materialIcon(id) {
  const icons = {
    slime_gel: 'mdi:water', goblin_fang: 'mdi:tooth', gladiator_medal: 'mdi:medal',
    quality_stone: 'mdi:star-circle', cooling_crystal: 'mdi:snowflake', obsidian: 'mdi:circle-multiple',
    dragon_ore: 'mdi:dragon', crystal_shard: 'mdi:diamond-stone', small_magic_stone: 'mdi:magic-staff',
    iron_ore: 'mdi:mine', gold_ore: 'mdi:gold', silver_ore: 'mdi:silver-fork-spoon'
  }
  return icons[id] || 'mdi:circle'
}

function qualityColor(q) {
  const map = { white: '#ccc', green: '#4caf50', blue: '#2196f3', purple: '#9c27b0', red: '#ff4444' }
  return map[q] || '#ccc'
}

function equipmentIcon(part) {
  const map = { weapon: 'mdi:sword', armor: 'mdi:shield-outline', helmet: 'mdi:hard-hat', pants: 'mdi:jeans', shoes: 'mdi:shoe-print', gauntlet: 'mdi:hand-back-right' }
  return map[part] || 'mdi:sword'
}

function gemColor(gemId) {
  const parts = gemId?.split('_')
  return { atk: '#e74c3c', def: '#3498db', hp: '#2ecc71', critDmg: '#9b59b6', speed: '#f1c40f' }[parts?.[1]] || '#888'
}

function getGemTier(gemId) {
  return parseInt(gemId?.split('_')?.[2]) || 1
}
</script>

<style scoped>
/* ========== 遮罩 ========== */
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
  display: flex; justify-content: center; align-items: center;
  z-index: 50; padding: 12px;
}

/* ========== 面板 ========== */
.raid-result-panel {
  background: linear-gradient(135deg, rgba(15,25,45,0.98), rgba(25,15,35,0.98));
  border: 2px solid #b89a6a; border-radius: 20px;
  color: #ffd; font-family: 'Press Start 2P', cursive;
  box-shadow: 0 0 60px rgba(255,100,0,0.3);
  width: min(90vw, 500px); max-width: 500px;
  max-height: 90vh; overflow-y: auto;
  padding: 24px 16px; box-sizing: border-box; text-align: center;
}

/* ========== 失败状态 ========== */
.defeat-section { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.defeat-icon { font-size: 64px; color: #ff4444; animation: defeatPulse 2s infinite; }
@keyframes defeatPulse {
  0%,100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}
.defeat-title { font-size: 20px; color: #ff4444; margin: 0; }
.defeat-subtitle { font-size: 9px; color: #aaa; }
.defeat-stats { display: flex; gap: 24px; margin: 8px 0; }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-label { font-size: 7px; color: #888; }
.stat-value { font-size: 12px; color: #ffd; }

/* ========== 评分区域 ========== */
.rating-section {
  position: relative; padding: 24px 0; margin-bottom: 16px;
  border-radius: 16px; overflow: hidden;
}
.rating-section.rating-B { background: rgba(158,158,158,0.1); }
.rating-section.rating-A { background: rgba(76,175,80,0.1); }
.rating-section.rating-S { background: rgba(33,150,243,0.1); }
.rating-section.rating-SS { background: rgba(156,39,176,0.15); }
.rating-section.rating-SSS { background: rgba(255,215,0,0.15); }

.rating-glow {
  position: absolute; inset: 0;
  background: radial-gradient(circle at center, v-bind('ratingData?.color + "20"') 0%, transparent 70%);
  animation: glowPulse 2s ease-in-out infinite;
}
@keyframes glowPulse {
  0%,100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.rating-content { position: relative; z-index: 2; }
.rating-label { font-size: 9px; color: #aaa; margin-bottom: 8px; }
.rating-value {
  font-size: 72px; font-weight: bold;
  color: v-bind('ratingData?.color || "#ffd700"');
  text-shadow: 0 0 20px v-bind('ratingData?.color || "#ffd700"');
  animation: ratingAppear 0.5s ease-out;
  min-height: 80px;
}
@keyframes ratingAppear {
  0% { transform: scale(0.3); opacity: 0; filter: blur(10px); }
  100% { transform: scale(1); opacity: 1; filter: blur(0); }
}
.rating-title { font-size: 10px; color: #ffd; margin-top: 4px; }

/* 星星粒子 */
.rating-sparkles { position: absolute; top: 50%; left: 50%; z-index: 1; }
.sparkle {
  position: absolute;
  width: 4px; height: 4px;
  background: v-bind('ratingData?.color || "#ffd700"');
  border-radius: 50%;
  animation: sparkleFloat 1.5s ease-out forwards;
}
@keyframes sparkleFloat {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; }
}

/* ========== 统计行 ========== */
.stats-row {
  display: flex; justify-content: center; gap: 20px;
  margin-bottom: 12px; padding: 8px 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.stats-row .stat-item { flex-direction: row; gap: 6px; }
.stats-row .stat-value { font-size: 9px; }

/* ========== 经验 ========== */
.exp-section { margin-bottom: 16px; }
.exp-inline {
  display: inline-block; font-size: 9px;
  background: rgba(255,215,0,0.15); padding: 4px 12px;
  border-radius: 12px; margin: 0 4px;
}

/* ========== 战利品标签 ========== */
.loot-section { margin-bottom: 12px; }
.loot-title { font-size: 10px; color: #ffd700; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; }
.loot-tags { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.loot-tag {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.05); font-size: 7px; white-space: nowrap;
}
.loot-tag-icon { font-size: 14px; }
.loot-tag-name { color: #ddd; }
.loot-tag-qty { color: #aaa; font-size: 6px; }
.equipment-tag { border-left: 3px solid; }
.accessory-tag { border-left: 3px solid #9c27b0; }
.material-tag { background: rgba(0,0,0,0.3); }
.gem-tag { background: rgba(0,0,0,0.4); }
.more-loot { font-size: 7px; color: #666; margin-top: 8px; }
.empty-loot { color: #666; font-size: 8px; padding: 12px 0; }

/* ========== 按钮 ========== */
.buttons { display: flex; gap: 8px; justify-content: center; flex-shrink: 0; }
.pixel-btn {
  background: #2a2a3a; border: 2px solid #b89a6a; color: #ffd;
  font-family: inherit; padding: 8px 16px; font-size: 9px;
  cursor: pointer; border-radius: 8px; display: flex; align-items: center; gap: 4px;
  transition: 0.2s;
}
.pixel-btn:hover { background: #3a3a5a; }
.pixel-btn.primary { background: rgba(255,215,0,0.15); border-color: #ffd700; }
.pixel-btn.danger { background: rgba(255,68,68,0.2); border-color: #ff4444; color: #ff8888; }


/* ========== 评分区域（流光羽衣） ========== */
.rating-section {
  position: relative;
  padding: 24px 0;
  margin-bottom: 16px;
  border-radius: 16px;
  overflow: hidden;
}

.rating-value {
  font-size: 72px;
  font-weight: bold;
  
  /* ★ 流光羽衣核心：渐变背景，背景裁剪到文字，文字颜色透明 */
  background: linear-gradient(
    135deg,
    #ffd700 0%,
    #fff8dc 20%,
    #ffa500 40%,
    #ffd700 60%,
    #fff8dc 80%,
    #ffa500 100%
  );
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  
  /* 文字阴影保持评级颜色光晕 */
  text-shadow: none;
  filter: drop-shadow(0 0 16px v-bind('ratingData?.color || "#ffd700"'));
  
  /* 入场动画 + 羽衣流动动画 */
  animation: ratingAppear 0.5s ease-out, featherShine 3s ease-in-out infinite;
  min-height: 80px;
}

/* 出场动画（保持不变） */
@keyframes ratingAppear {
  0% { transform: scale(0.3); opacity: 0; filter: blur(10px); }
  100% { transform: scale(1); opacity: 1; filter: blur(0); }
}

/* ★ 羽衣流动动画：渐变背景位置移动，让文字上有一道流光滑过 */
@keyframes featherShine {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
/* 光晕：柔和的呼吸效果 */
.rating-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, v-bind('ratingData?.color + "20"') 0%, transparent 70%);
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}


/* 评级文字需要提到上层，不被光环遮挡 */
.rating-content .rating-label,
.rating-content .rating-value,
.rating-content .rating-title {
  position: relative;
  z-index: 2;
}

/* 星星粒子：保持循环爆发 */
.rating-sparkles {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
}

.sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: v-bind('ratingData?.color || "#ffd700"');
  border-radius: 50%;
  animation: sparkleFloat 1.5s ease-out infinite;
}

@keyframes sparkleFloat {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; }
}
</style>