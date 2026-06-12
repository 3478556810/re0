<template>
  <div class="overlay">
    <div class="result-panel pixel-panel">
      <!-- 标题 + 经验 -->
      <h2 class="title">
        <Icon :icon="defeated ? 'mdi:skull-crossbones' : 'mdi:trophy'" />
        {{ defeated ? '战斗失败' : '战斗胜利！' }}
        <span class="exp-inline" v-if="!defeated">经验 +{{ displayedExp }}</span>
        <span class="exp-inline companion-exp" v-if="!defeated && reward.companionExp > 0">
          伙伴经验 +{{ reward.companionExp }}
        </span>
      </h2>

      <!-- 奖励内容仅在胜利时显示 -->
      <template v-if="!defeated">
        <!-- 标签栏（仅当存在多个页面时显示） -->
        <div class="tabs" v-if="pages.length > 1">
          <button
            v-for="(page, index) in pages"
            :key="index"
            :class="{ active: currentPage === index }"
            @click="goToPage(index)"
          >
            {{ page.label }}
          </button>
        </div>

        <!-- 滑动容器 -->
        <div
          class="swiper-container"
          ref="swiperRef"
          @scroll="onScroll"
          v-if="pages.length"
        >
          <div
            class="swiper-page"
            v-for="(page, pageIndex) in pages"
            :key="pageIndex"
          >
            <div v-for="(item, idx) in page.items" :key="idx">
              <!-- 材料区块 -->
              <div class="reward-row" v-if="item.type === 'materials'">
                <div class="section-label"><Icon icon="mdi:package-variant-closed" /> 材料</div>
                <div class="grid-area">
                  <div v-for="(m, idx2) in item.data.slice(0, maxVisible)" :key="m.id + idx2" class="material-card">
                    <Icon :icon="materialIcon(m.id)" class="mat-icon" />
                    <span class="mat-name">{{ getMaterialName(m.id) }}</span>
                    <span class="mat-qty" v-if="m.qty > 1">x{{ m.qty }}</span>
                  </div>
                  <div v-if="item.data.length > maxVisible" class="material-card more-card">
                    <Icon icon="mdi:dots-horizontal" class="mat-icon" />
                    <span class="mat-name">还有 +{{ item.data.length - maxVisible }} 种</span>
                  </div>
                </div>
              </div>

              <!-- 装备区块 -->
              <div class="reward-row" v-if="item.type === 'equipments'">
                <div class="section-label"><Icon icon="mdi:sword" /> 装备</div>
                <div class="grid-area">
                  <div v-for="eq in item.data.slice(0, maxVisible)" :key="eq.id" class="acc-card">
                    <Icon :icon="equipmentIcon(eq.part)" class="mat-icon" />
                    <span class="mat-name" :style="{ color: qualityColor(eq.quality) }">{{ eq.name }}</span>
                  </div>
                  <div v-if="item.data.length > maxVisible" class="acc-card more-card">
                    <Icon icon="mdi:dots-horizontal" class="mat-icon" />
                    <span class="mat-name">还有 +{{ item.data.length - maxVisible }} 件</span>
                  </div>
                </div>
              </div>

              <!-- 饰品区块 -->
              <div class="reward-row" v-if="item.type === 'accessories'">
                <div class="section-label"><Icon icon="mdi:gem" /> 饰品</div>
                <div class="grid-area">
                  <div v-for="acc in item.data.slice(0, maxVisible)" :key="acc.id" class="acc-card">
                    <Icon :icon="acc.icon || 'mdi:ring'" class="mat-icon" />
                    <span class="mat-name" :style="{ color: qualityColor(acc.quality) }">{{ acc.name }}</span>
                  </div>
                  <div v-if="item.data.length > maxVisible" class="acc-card more-card">
                    <Icon icon="mdi:dots-horizontal" class="mat-icon" />
                    <span class="mat-name">还有 +{{ item.data.length - maxVisible }} 件</span>
                  </div>
                </div>
              </div>

              <!-- 宝石 -->
              <div v-if="item.type === 'gems'">
                <div class="section-label"><Icon icon="mdi:rhombus-split" /> 宝石</div>
                <div class="grid-area">
                  <div v-for="(g, idx) in item.data.slice(0, maxVisible)" :key="g.id + idx" class="material-card">
                    <div
                      class="gem-core"
                      :class="'gem-tier-' + getGemTier(g.id)"
                      :style="{ '--gem-color': gemColor(g.id), width: '28px', height: '28px' }"
                    ></div>
                    <span class="mat-name">{{ g.name }}</span>
                    <span class="mat-qty" v-if="g.qty > 1">x{{ g.qty }}</span>
                  </div>
                  <div v-if="item.data.length > maxVisible" class="material-card more-card">
                    <Icon icon="mdi:dots-horizontal" class="mat-icon" />
                    <span class="mat-name">还有 +{{ item.data.length - maxVisible }} 颗</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 完全无掉落提示 -->
        <div v-if="!hasAnyReward" class="empty-row">无战利品</div>
      </template>

      <!-- ★★★ 底部按钮逻辑优化 ★★★ -->
      <div class="buttons">
  <!-- 无限塔胜利：继续 / 撤退 -->
  <template v-if="isTower && !defeated">
    <button class="pixel-btn primary" @click="$emit('next')">
      <Icon icon="mdi:arrow-down-bold" /> 继续
    </button>
    <button class="pixel-btn warning" @click="$emit('retreat')">
      <Icon icon="mdi:exit-run" /> 撤退
    </button>
  </template>

  <!-- 普通地下城胜利：下一层 / 撤退 -->
  <template v-if="!isTower && !defeated && showDungeon">
    <button class="pixel-btn primary" @click="$emit('next')">
      <Icon icon="mdi:arrow-down-bold" /> 下一层
    </button>
    <button class="pixel-btn warning" @click="$emit('retreat')">
      <Icon icon="mdi:exit-run" /> 撤退
    </button>
  </template>

  <!-- 普通/失败/非地下城：确定 -->
  <button v-if="!isTower && (defeated || !showDungeon)" class="pixel-btn primary" @click="$emit('close')">
    <Icon icon="mdi:check" /> 确定
  </button>
</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'

const props = defineProps({
  reward: Object,
  showDungeon: Boolean,
    isTower: { type: Boolean, default: false },
  defeated: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['close', 'next', 'retreat'])
const store = useGameStore()

const displayedExp = ref(0)
const maxVisible = 5

const gemColors = {
  atk: '#e74c3c',
  def: '#3498db',
  hp: '#2ecc71',
  critDmg: '#9b59b6',
  speed: '#f1c40f'
}

const visibleMaterials = computed(() => (props.reward?.materials || []).slice(0, maxVisible))
const visibleAccessories = computed(() => (props.reward?.accessories || []).slice(0, maxVisible))
const visibleEquipments = computed(() => (props.reward?.equipments || []).slice(0, maxVisible))
const visibleGems = computed(() => (props.reward?.gems || []).slice(0, maxVisible))

function gemColor(gemId) {
  const parts = gemId?.split('_')
  const type = parts?.[1]
  return gemColors[type] || '#888'
}

function getGemTier(gemId) {
  const parts = gemId?.split('_')
  const level = parseInt(parts?.[2]) || 1
  return level
}

watch(() => props.reward?.exp, (newExp) => {
  if (!newExp || newExp <= 0) return
  const target = newExp
  const duration = 800
  const startTime = performance.now()
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    displayedExp.value = Math.floor(progress * target)
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  requestAnimationFrame(animate)
}, { immediate: true })

const swiperRef = ref(null)
const currentPage = ref(0)

const pages = computed(() => {
  const result = []
  const page1Items = []
  const page2Items = []

  if (props.reward?.materials?.length) page1Items.push({ type: 'materials', data: props.reward.materials })
  if (props.reward?.equipments?.length) page1Items.push({ type: 'equipments', data: props.reward.equipments })

  if (props.reward?.accessories?.length) page2Items.push({ type: 'accessories', data: props.reward.accessories })
  if (props.reward?.gems?.length) page2Items.push({ type: 'gems', data: props.reward.gems })

  if (page1Items.length) result.push({ label: '装备材料', items: page1Items })
  if (page2Items.length) result.push({ label: '饰品宝石', items: page2Items })
  return result
})

const hasAnyReward = computed(() => pages.value.length > 0)

const onScroll = () => {
  if (!swiperRef.value) return
  const scrollLeft = swiperRef.value.scrollLeft
  const width = swiperRef.value.offsetWidth
  const page = Math.round(scrollLeft / width)
  if (page !== currentPage.value) {
    currentPage.value = page
  }
}

const goToPage = (index) => {
  currentPage.value = index
  swiperRef.value?.scrollTo({
    left: index * swiperRef.value.offsetWidth,
    behavior: 'smooth'
  })
}

function getMaterialName(id) {
  return store.getMaterialName(id)
}

function materialIcon(id) {
  const icons = {
    slime_gel: 'mdi:water',
    goblin_fang: 'mdi:tooth',
    spider_silk: 'mdi:spider-web',
    bat_wing: 'mdi:bat',
    small_magic_stone: 'mdi:magic-staff',
    iron_ore: 'mdi:mine',
    silver_ore: 'memory:coin-silver',
    gold_ore: 'mdi:gold',
    crystal_shard: 'mdi:diamond-stone',
    obsidian: 'mdi:circle-multiple',
    dragon_ore: 'mdi:dragon',
    dungeon_token: 'mdi:castle',
    quality_stone: 'mdi:star-circle',
    gladiator_medal: 'mdi:medal',
    cooling_crystal: 'mdi:snowflake',
  }
  return icons[id] || 'mdi:circle'
}

function qualityColor(q) {
  const map = { white: '#ccc', green: '#4caf50', blue: '#2196f3', purple: '#9c27b0', red: '#ff4444' }
  return map[q] || '#ccc'
}

function equipmentIcon(part) {
  const map = {
    weapon: 'mdi:sword',
    armor: 'mdi:shield-outline',
    helmet: 'mdi:hard-hat',
    pants: 'mdi:jeans',
    shoes: 'mdi:shoe-print',
    gauntlet: 'mdi:hand-back-right'
  }
  return map[part] || 'mdi:sword'
}
</script>

<style scoped>
/* ========== 遮罩（移除点击关闭） ========== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  padding: 12px;
}

/* ========== 面板：自适应高度，宽度正方形比例 ========== */
.result-panel {
  background: rgba(15, 25, 45, 0.95);
  border: 2px solid #b89a6a;
  border-radius: 20px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  box-shadow: 0 0 40px rgba(0,0,0,0.6);
  width: min(85vw, 85vh, 450px);
  max-width: 450px;
  height: auto;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 12px 10px 10px;
  box-sizing: border-box;
  text-align: center;
}

/* ========== 标题 ========== */
.title {
  font-size: clamp(12px, 2.5vw, 16px);
  color: #ffd700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}
.exp-inline {
  font-size: 0.8em;
  background: rgba(255,215,0,0.1);
  padding: 2px 8px;
  border-radius: 14px;
}
.companion-exp {
  background: rgba(255,105,180,0.2);
  color: #ff69b4;
}

/* ========== 奖励列表（紧凑） ========== */
.reward-list {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.reward-row {
  margin-bottom: 0;
}

/* 分类标题 */
.section-label {
  font-size: clamp(8px, 1.5vw, 10px);
  color: #ccc;
  margin-bottom: 4px;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 网格内容区 */
.grid-area {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
  gap: 4px;
}

/* 材料卡片 */
.material-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 4px 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.mat-icon { font-size: 16px; color: #ffd700; }
.mat-name { font-size: clamp(5px, 0.9vw, 7px); color: #ddd; text-align: center; word-break: break-all; line-height: 1.2; }
.mat-qty { font-size: 5px; color: #aaa; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 8px; }

/* 更多占位卡片 */
.more-card {
  opacity: 0.6;
  border-style: dashed;
}
.more-card .mat-name {
  color: #888;
}

/* 饰品 / 装备卡片 */
.acc-card {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(184,154,106,0.3);
  border-radius: 8px;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

/* 空状态 */
.empty-row {
  text-align: center;
  color: #666;
  font-size: 8px;
  padding: 12px 0;
}

/* ========== 按钮区 ========== */
.buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-shrink: 0;
}
.pixel-btn {
  background: #2a2a3a;
  border: 2px solid #b89a6a;
  color: #ffd;
  font-family: inherit;
  padding: 5px 12px;
  font-size: clamp(7px, 1.2vw, 9px);
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: 0.2s;
}
.pixel-btn:hover { background: #3a3a5a; }
.pixel-btn.primary { background: rgba(255,215,0,0.15); border-color: #ffd700; }
.pixel-btn.warning { background: rgba(255,165,0,0.15); border-color: #ffa500; }


/* 标签栏 */
.tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}
.tabs button {
  background: transparent;
  border: 2px solid rgba(184,154,106,0.5);
  color: #ccc;
  font-family: inherit;
  font-size: clamp(7px, 1.2vw, 9px);
  padding: 4px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: 0.2s;
}
.tabs button.active {
  background: rgba(255,215,0,0.15);
  border-color: #ffd700;
  color: #ffd700;
}

/* 滑动容器 */
.swiper-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE/Edge */
  flex: 1;
  margin-bottom: 8px;
}
.swiper-container::-webkit-scrollbar {
  display: none;
}

/* 每一页 */
.swiper-page {
  min-width: 100%;
  scroll-snap-align: start;
  padding: 0 4px;
  box-sizing: border-box;
}


</style>