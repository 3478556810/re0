<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      
      <!-- 顶部栏 -->
      <div class="top-bar">
        <h2 class="top-title"><Icon icon="mdi:star-four-points" /> 技能</h2>
        <div class="top-actions">
          <span class="top-sp">技能点：<strong>{{ skillPoints }}</strong></span>
          <button class="pixel-btn danger reset-btn" @click="handleResetSkills">重置</button>
        </div>
        <button v-if="mode !== 'companion'" class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      </div>

      <!-- 主标签栏 -->
      <div class="main-tabs">
        <button :class="['main-tab', { active: activeTab === 'learn' }]" @click="activeTab = 'learn'">
          <Icon icon="mdi:book-open" /> 学习
        </button>
        <button :class="['main-tab', { active: activeTab === 'equipped' }]" @click="activeTab = 'equipped'">
          <Icon icon="mdi:shield-account" /> 装备
        </button>
        <button :class="['main-tab', { active: activeTab === 'tripod' }]" @click="activeTab = 'tripod'">
          <Icon icon="mdi:star-four-points" /> 三脚架
        </button>
      </div>

    

<!-- ================= 技能学习页（分页版） ================= -->
<div v-if="activeTab === 'learn'" class="tab-content">
  <div class="element-filter">
    <!-- 原有的元素过滤栏不变 -->
    <button
      v-for="tag in elementTags"
      :key="tag.value"
      :class="['filter-btn', { active: selectedElement === tag.value }]"
      @click="selectedElement = tag.value"
    >
      <Icon v-if="tag.icon" :icon="tag.icon" />
      <span class="filter-label">{{ tag.label }}</span>
    </button>
  </div>

  <!-- 分页区域 -->
  <div class="pagination-area">
    <button
      class="page-btn prev"
      :disabled="currentPage <= 1"
      @click="currentPage--"
    >
      <Icon icon="mdi:chevron-left" />
    </button>

    <div class="skill-list-pages">
      <div
        v-for="skill in paginatedSkills"
        :key="skill.id"
        class="skill-card"
        :class="{ locked: !isUnlocked(skill.id) }"
        @click="openSkillDetail(skill)"
      >
        <div class="skill-top">
          <Icon :icon="skill.icon" class="skill-icon" />
          <div class="skill-name-level">
            <span class="skill-name">{{ skill.name }}</span>
            <span class="skill-cost" v-if="isUnlocked(skill.id)">Lv.{{ getSkillLevel(skill.id) }}</span>
            <span v-if="skill.element" class="skill-element" :style="{ color: getElementColor(skill.element) }">
              {{ getElementLabel(skill.element) }}
            </span>
          </div>
          <div class="skill-mp">MP {{ skill.mpCost }}</div>
        </div>
        <div class="skill-desc">{{ skill.desc }}</div>
      </div>
      <div v-if="paginatedSkills.length === 0" class="empty">暂无技能</div>
    </div>

    <button
      class="page-btn next"
      :disabled="currentPage >= totalPages"
      @click="currentPage++"
    >
      <Icon icon="mdi:chevron-right" />
    </button>
  </div>
</div>



      <!-- 已装备页 -->
      <div v-if="activeTab === 'equipped'" class="tab-content">
        <div v-if="equippedSkills.length === 0" class="empty">尚未装备任何技能</div>
        <div class="equipped-list-vertical">
          <div v-for="(skill, idx) in equippedSkills" :key="skill.id" class="equipped-card" @click="openSkillDetail(skill)">
            <Icon :icon="skill.icon" class="skill-icon" />
            <div class="skill-info">
              <span class="skill-name">{{ skill.name }} (Lv.{{ getSkillLevel(skill.id) }})</span>
              <span class="skill-mp">MP {{ skill.mpCost }}</span>
            </div>
            <div class="order-btns" @click.stop>
              <button class="pixel-btn micro" @click="moveUp(idx)" :disabled="idx === 0">↑</button>
              <button class="pixel-btn micro" @click="moveDown(idx)" :disabled="idx === equippedSkills.length - 1">↓</button>
              <button class="pixel-btn micro danger" @click="unequipSkill(skill.id)">卸下</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 三脚架配置页 -->
      <div v-if="activeTab === 'tripod'" class="tripod-full">
        <div v-if="equippedSkills.length === 0" class="empty">请先装备技能</div>
        <template v-else>
          <div class="tripod-tabs">
            <button
              v-for="(skill, idx) in equippedSkills"
              :key="skill.id"
              :class="['tripod-tab', { active: currentTripodSkillIndex === idx }]"
              @click="currentTripodSkillIndex = idx"
            >
              {{ idx + 1 }}
            </button>
          </div>

          <div class="skill-tripod-card" v-if="equippedSkills[currentTripodSkillIndex]">
            <h3>{{ equippedSkills[currentTripodSkillIndex].name }} (Lv.{{ getSkillLevel(equippedSkills[currentTripodSkillIndex].id) }})</h3>
            <div v-if="equippedSkills[currentTripodSkillIndex].tripods?.length">
              <div v-for="(tripod, tIdx) in equippedSkills[currentTripodSkillIndex].tripods" :key="tIdx" class="tripod-block">
                <div class="tripod-header">
                  <span>{{ tripod.name }}</span>
                  <span class="unlock">
                    <Icon icon="mdi:lock" v-if="getSkillLevel(equippedSkills[currentTripodSkillIndex].id) < tripod.unlockLevel" />
                    <Icon icon="mdi:lock-open" v-else />
                    Lv{{ tripod.unlockLevel }} 解锁
                  </span>
                </div>
                <div class="tripod-choices">
                  <button
                    v-for="(eff, eIdx) in tripod.effects"
                    :key="eIdx"
                    class="choice-btn"
                    :class="{ active: isTripodSelected(equippedSkills[currentTripodSkillIndex].id, tIdx, eIdx) }"
                    :disabled="getSkillLevel(equippedSkills[currentTripodSkillIndex].id) < tripod.unlockLevel"
                    @click="selectTripod(equippedSkills[currentTripodSkillIndex].id, tIdx, eIdx)"
                  >
                    <div class="eff-title">{{ getEffectTitle(eff) }}</div>
                    <div class="eff-desc">{{ getEffectFullDesc(eff) }}</div>
                  </button>
                  <button
                    class="choice-btn none"
                    :class="{ active: !currentTripodChoices[equippedSkills[currentTripodSkillIndex].id]?.[tIdx] }"
                    @click="selectTripod(equippedSkills[currentTripodSkillIndex].id, tIdx, '')"
                  >
                    不选择
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="empty">该技能没有三脚架</div>
          </div>
        </template>
      </div>

      <!-- 技能详情弹窗 -->
      <div v-if="skillDetail" class="skill-detail-overlay" @click.self="skillDetail = null">
        <div class="skill-detail-panel">
          <button class="close-btn" @click="skillDetail = null"><Icon icon="mdi:close" /></button>
          <h3>
            <Icon :icon="skillDetail.icon" /> 
            {{ skillDetail.name }} (Lv.{{ getSkillLevel(skillDetail.id) }})
            <span v-if="getSkillLevel(skillDetail.id) >= 10" style="color: #ffd700; font-size: 10px;">· 觉醒</span>
          </h3>
          <div v-if="getSkillLevel(skillDetail.id) < 10" class="awaken-progress">
            <div class="awaken-label">觉醒进度：{{ getSkillLevel(skillDetail.id) }}/10</div>
            <div class="awaken-bar">
              <div class="awaken-fill" :style="{ width: (getSkillLevel(skillDetail.id) / 10 * 100) + '%' }"></div>
            </div>
          </div>
          <span v-if="getSkillLevel(skillDetail.id) >= 10" style="color: #ffd700; font-size: 10px;">· 觉醒</span>
          <p class="detail-desc">{{ skillDetail.desc }}</p>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">类型</span><span>{{ getTypeLabel(skillDetail.type) }}</span></div>
            <div class="detail-item"><span class="label">目标</span><span>{{ getTargetLabel(skillDetail.target) }}</span></div>
            <div class="detail-item" v-if="skillDetail.element"><span class="label">属性</span><span>{{ getElementLabel(skillDetail.element) }}</span></div>
            <div class="detail-item"><span class="label">MP消耗</span><span>{{ skillDetail.mpCost || 0 }}</span></div>
            <div class="detail-item"><span class="label">当前倍率</span><span>{{ getSkillCurrentMul(skillDetail) }}x</span></div>
            <div class="detail-item" v-if="skillDetail.levelScaling?.baseMul">
              <span class="label">倍率成长</span>
              <span>{{ getGrowthDisplay(skillDetail) }}</span>
            </div>
            <div class="detail-item full-width" v-if="skillDetail.effects?.length"><span class="label">附加效果</span><span>{{ skillDetail.effects.map(e => getEffectFullDesc(e)).join('；') }}</span></div>
          </div>
          <div class="detail-actions">
            <template v-if="isUnlocked(skillDetail.id)">
              <button class="pixel-btn small" @click="upgradeSkill(skillDetail.id)">
                升级 ({{ getUpgradeCost(getSkillLevel(skillDetail.id)) }} SP)
              </button>
              <button class="pixel-btn small" v-if="!isEquipped(skillDetail.id)" @click="equipSkill(skillDetail.id)">装备</button>
              <button class="pixel-btn small danger" v-else @click="unequipSkill(skillDetail.id)">卸下</button>
            </template>
            <button class="pixel-btn small" v-else @click="learnSkill(skillDetail.id)" :disabled="skillPoints < (skillDetail.learnCost || 2)">学习 ({{ skillDetail.learnCost || 2 }} SP)</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject,watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close'])
const showConfirm = inject('showConfirm', (msg) => Promise.resolve(confirm(msg)))
const showToast = inject('showToast', (msg) => alert(msg))

const props = defineProps({
  mode: { type: String, default: 'player' },
  companion: { type: Object, default: null }
})

const activeTab = ref('learn')
const skillDetail = ref(null)
const currentTripodSkillIndex = ref(0)
const selectedElement = ref('all')

// ── 根据模式选择数据源 ──
const skillOwner = computed(() => {
  if (props.mode === 'companion' && props.companion) return props.companion
  return store.player
})

const skillPoints = computed(() => {
  if (props.mode === 'companion' && props.companion) {
    return store.player.skillPoints  // 伙伴模式也使用玩家技能点
  }
  return store.player.skillPoints
})

const skillsData = computed(() => {
  if (props.mode === 'companion' && props.companion) return props.companion.skills || {}
  return store.player.skills || {}
})
// 修改 equippedSkillIds 计算属性
const equippedSkillIds = computed(() => {
  if (props.mode === 'companion' && props.companion) {
    // 优先从 skillSlots 对象读取
    const slots = props.companion.skillSlots || {}
    const idsFromSlots = Object.values(slots).filter(Boolean)
    if (idsFromSlots.length > 0) return idsFromSlots
    // 兼容旧数据：从 equippedSkills 数组读取
    return props.companion.equippedSkills || []
  }
  return store.player.equippedSkills || []
})
const equippedSkills = computed(() =>
  equippedSkillIds.value.map(id => store.config.skillPool.find(s => s.id === id)).filter(Boolean)
)

const currentTripodChoices = computed(() => {
  if (props.mode === 'companion' && props.companion) {
    if (!props.companion.tripodChoices) props.companion.tripodChoices = {}
    return props.companion.tripodChoices
  }
  return store.player.tripodChoices || {}
})

const sortedSkillPool = computed(() =>
  [...(store.config.skillPool || [])].sort((a, b) => (isUnlocked(b.id) ? 1 : 0) - (isUnlocked(a.id) ? 1 : 0))
)

const filteredSkillPool = computed(() => {
  if (selectedElement.value === 'all') return sortedSkillPool.value
  return sortedSkillPool.value.filter(s => {
    if (selectedElement.value === 'none') return !s.element
    return s.element === selectedElement.value
  })
})

onMounted(() => {
  if (props.mode === 'player') {
    if (!store.player.tripodChoices) store.player.tripodChoices = {}
    if (!store.player.equippedSkills) store.player.equippedSkills = []
    if (!store.player.skills) store.player.skills = {}
    if (store.player.skillPoints === undefined) store.player.skillPoints = 5
  }
})

function isUnlocked(skillId) { return !!skillsData.value[skillId]?.unlocked }
function isEquipped(skillId) { return equippedSkillIds.value.includes(skillId) }
function getSkillLevel(skillId) { return skillsData.value[skillId]?.level || 1 }

function openSkillDetail(skill) {
  skillDetail.value = store.config.skillPool.find(s => s.id === skill.id) || skill
}

function getSkillCurrentMul(skill) {
  const level = getSkillLevel(skill.id)
  const base = skill.baseMul || 0
  const basePerLevel = skill.levelScaling?.baseMul || 0.1
  let mul = base
  for (let i = 2; i <= level; i++) {
    const growthAtThisLevel = basePerLevel * (1 + (i - 1) * 0.08)
    mul += growthAtThisLevel
  }
  return mul.toFixed(2)
}

function getGrowthDisplay(skill) {
  const level = getSkillLevel(skill.id)
  const basePerLevel = skill.levelScaling?.baseMul || 0.1
  const nextGrowth = basePerLevel * (1 + level * 0.08)
  return '+' + nextGrowth.toFixed(2) + '/级'
}

function getUpgradeCost(level) {
  if (level < 10) return 2
  if (level < 15) return 2 + (level - 9)
  return 5 + (level - 14)
}

async function handleResetSkills() {
  const ok = await showConfirm('确定要重置所有技能吗？\n所有技能点将返还，已学习技能将被遗忘。')
  if (!ok) return
if (props.mode === 'companion' && props.companion) {
    const comp = props.companion
    let refund = 0
    for (const skill of store.config.skillPool || []) {
      const state = comp.skills?.[skill.id]
      if (!state?.unlocked) continue
      refund += skill.learnCost || 0
      if (state.level > 1) refund += getUpgradeCost(state.level - 1) * (state.level - 1)
    }
    comp.skills = {}
    comp.equippedSkills = []
    comp.tripodChoices = {}
    comp.skillSpent = 0
 comp.skillSlots = {}
    store.player.skillPoints += refund  // 返还给玩家
    store.save()
    
    showToast('伙伴技能已重置，技能点已返还')
    return
}
  let refund = 0
  for (const skill of store.config.skillPool || []) {
    const state = store.player.skills?.[skill.id]
    if (!state?.unlocked) continue
    refund += skill.learnCost || 0
    if (state.level > 1) refund += getUpgradeCost(state.level - 1) * (state.level - 1)
  }
  store.player.skills = {}
  store.player.equippedSkills = []
  store.player.tripodChoices = {}
  store.player.skillPoints += refund
  store.save()
  showToast('技能点已重置！')
}

function learnSkill(skillId) {
  const skill = store.config.skillPool.find(s => s.id === skillId)
  if (!skill) return
  const cost = skill.learnCost || 2
  if (skillPoints.value < cost) return
  if (props.mode === 'companion' && props.companion) {
    const comp = props.companion
    if (!comp.skills) comp.skills = {}
    if (!comp.skills[skillId]) comp.skills[skillId] = { unlocked: true, level: 1 }
    else comp.skills[skillId].unlocked = true
    comp.skillSpent = (comp.skillSpent || 0) + cost
    store.player.skillPoints -= cost   // 关键：消耗玩家技能点
    store.save()
    if (skillDetail.value?.id === skillId) skillDetail.value = store.config.skillPool.find(s => s.id === skillId)
    return
  }
  if (!store.player.skills) store.player.skills = {}
  if (!store.player.skills[skillId]) store.player.skills[skillId] = { unlocked: true, level: 1 }
  else store.player.skills[skillId].unlocked = true
  store.player.skillPoints -= cost
  store.save()
  if (skillDetail.value?.id === skillId) skillDetail.value = store.config.skillPool.find(s => s.id === skillId)
}

function upgradeSkill(skillId) {
  const skill = store.config.skillPool.find(s => s.id === skillId)
  if (!skill) return
  const currentLevel = getSkillLevel(skillId)
  const cost = getUpgradeCost(currentLevel)
  if (!isUnlocked(skillId)) { showToast('尚未学习该技能'); return }
  if (skillPoints.value < cost) { showToast(`技能点不足 (需要${cost}点)`); return }
 if (props.mode === 'companion' && props.companion) {
    const comp = props.companion
    comp.skills[skillId].level += 1
    comp.skillSpent += cost
    store.player.skillPoints -= cost   // 关键：消耗玩家的技能点
    store.save()
}else {
    store.player.skillPoints -= cost
    store.player.skills[skillId].level += 1
    store.save()
  }
  if (skillDetail.value?.id === skillId) skillDetail.value = store.config.skillPool.find(s => s.id === skillId)
  const newLevel = getSkillLevel(skillId)
  showToast(`${skill.name} 升级至 Lv.${newLevel}，消耗 ${cost} 技能点`)
}

function equipSkill(skillId) {
  if (isEquipped(skillId)) return
  if (props.mode === 'companion' && props.companion) {
    const comp = props.companion
    if (!comp.equippedSkills) comp.equippedSkills = []
    if (comp.equippedSkills.length >= 4) {
      showToast('伙伴最多装备4个技能')
      return
    }
    // 写入数组（UI显示用）
    comp.equippedSkills.push(skillId)
    // 写入 slot 对象（战斗引擎用）
    if (!comp.skillSlots) comp.skillSlots = {}
    const slotKeys = ['s1', 's2', 's3', 's4']
    const emptySlot = slotKeys.find(key => !comp.skillSlots[key])
    if (emptySlot) {
      comp.skillSlots[emptySlot] = skillId
    } else {
      // 理论上不会发生，但可以强制覆盖最后一个槽位或报错
      showToast('技能槽位异常，请先卸下一个技能')
      return
    }
    store.save()
    return
  }
  // 玩家模式保持不变
  if (store.player.equippedSkills.length >= 4) { showToast('最多装备4个技能'); return }
  store.player.equippedSkills.push(skillId)
  store.save()
}

function unequipSkill(skillId) {
  if (props.mode === 'companion' && props.companion) {
    const comp = props.companion
    // 从 equippedSkills 中移除
    const idx = comp.equippedSkills?.indexOf(skillId)
    if (idx >= 0) {
      comp.equippedSkills.splice(idx, 1)
    }
    // 从 skillSlots 中清除对应的槽位
    if (comp.skillSlots) {
      for (const slot of Object.keys(comp.skillSlots)) {
        if (comp.skillSlots[slot] === skillId) {
          delete comp.skillSlots[slot]
          // 或者设置为 null，取决于你后续的判断，建议 delete
        }
      }
    }
    store.save()
    return
  }
  // 玩家模式保持原样
  const idx = store.player.equippedSkills.indexOf(skillId)
  if (idx >= 0) {
    store.player.equippedSkills.splice(idx, 1)
    store.save()
  }
}

function moveUp(idx) {
  if (props.mode === 'companion' && props.companion) {
    const arr = props.companion.equippedSkills
    if (idx > 0) { [arr[idx], arr[idx-1]] = [arr[idx-1], arr[idx]]; store.save() }
    return
  }
  const arr = store.player.equippedSkills
  if (idx > 0) { [arr[idx], arr[idx-1]] = [arr[idx-1], arr[idx]]; store.save() }
}

function moveDown(idx) {
  if (props.mode === 'companion' && props.companion) {
    const arr = props.companion.equippedSkills
    if (idx < arr.length - 1) { [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]]; store.save() }
    return
  }
  const arr = store.player.equippedSkills
  if (idx < arr.length - 1) { [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]]; store.save() }
}

function selectTripod(skillId, slotIdx, effIdx) {
  if (props.mode === 'companion' && props.companion) {
    const comp = props.companion
    if (!comp.tripodChoices) comp.tripodChoices = {}
    if (!comp.tripodChoices[skillId]) comp.tripodChoices[skillId] = {}
    comp.tripodChoices[skillId][slotIdx] = String(effIdx)
    store.save()
    return
  }
  if (!store.player.tripodChoices[skillId]) store.player.tripodChoices[skillId] = {}
  store.player.tripodChoices[skillId][slotIdx] = String(effIdx)
  store.save()
}

function isTripodSelected(skillId, slotIdx, effIdx) {
  const choices = props.mode === 'companion'
    ? (props.companion?.tripodChoices || {})
    : (store.player.tripodChoices || {})
  return String(choices[skillId]?.[slotIdx]) === String(effIdx)
}

const elementTags = [
  { value: 'all', label: '全部', icon: null },
  { value: 'none', label: '无', icon: 'mdi:circle' },
  { value: 'fire', label: '火', icon: 'mdi:fire' },
  { value: 'water', label: '水', icon: 'mdi:water' },
  { value: 'thunder', label: '雷', icon: 'mdi:lightning-bolt' },
  { value: 'wind', label: '风', icon: 'mdi:weather-windy' },
  { value: 'grass', label: '草', icon: 'mdi:leaf' },
  { value: 'ice', label: '冰', icon: 'mdi:snowflake' },
  { value: 'holy', label: '圣', icon: 'mdi:brightness-7' },
  { value: 'dark', label: '暗', icon: 'mdi:moon-waning-crescent' },
  { value: 'rock', label: '岩', icon: 'mdi:terrain' },
  { value: 'steel', label: '钢', icon: 'mdi:cube-outline' },
  { value: 'poison', label: '毒', icon: 'mdi:skull-crossbones' }
]

function getElementLabel(e) { return elementTags.find(t => t.value === e)?.label || e }
function getElementColor(e) {
  const map = { fire:'#e74c3c', water:'#3498db', thunder:'#f1c40f', wind:'#2ecc71', grass:'#27ae60', ice:'#81ecec', holy:'#ffeaa7', dark:'#6c5ce7', rock:'#brown', steel:'#bdc3c7', poison:'#a020f0' }
  return map[e] || '#888'
}
function getTypeLabel(t) { return { active:'主动', passive:'被动', reaction:'反应' }[t] || t }
function getTargetLabel(t) { return { single:'单体', aoe:'全体', self:'自身', ally:'队友' }[t] || t }

function getEffectTitle(eff) {
  const titles = {
    dot: '中毒', bleed: '流血', freeze: '冻结', stun: '眩晕',
    shield: '护盾', regen: '再生', heal: '治疗', lifesteal: '吸血',
    buff: '增益', debuff: '减益', reflect: '反伤', cleanse: '净化',
    death: '即死', dotBurst: '毒爆', extraAction: '追加攻击',
    holyMark: '光之烙印', lifestealBuff: '吸血强化'
  }
  return titles[eff.type] || eff.type
}
const currentPage = ref(1)
const pageSize = 6  // 每页显示的技能数量

const totalPages = computed(() => Math.ceil(filteredSkillPool.value.length / pageSize))

const paginatedSkills = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredSkillPool.value.slice(start, start + pageSize)
})

// 切换元素过滤时重置页码
watch(selectedElement, () => {
  currentPage.value = 1
})
function getEffectFullDesc(eff) {
  const dur = eff.duration ? `持续${eff.duration}回合` : ''
  const chance = eff.chance !== undefined && eff.chance !== 100 ? `（${eff.chance}%几率）` : ''
  switch (eff.type) {
    case 'dot': return `每回合造成攻击力×${eff.value}的伤害，${dur}${chance}`
    case 'freeze': return `冻结目标${dur}${chance}`
    case 'stun': return `眩晕目标${dur}${chance}`
    case 'shield': return `获得最大HP ${(eff.value*100).toFixed(0)}% 的护盾，${dur}${chance}`
    case 'buff': {
      const names = { atk:'攻击力', def:'防御力', speed:'速度', critRate:'暴击率', critDmg:'暴击伤害', maxHp:'最大生命', dodge:'闪避率' }
      return `${names[eff.stat] || eff.stat}提升 ${(eff.value*100).toFixed(0)}%，${dur}${chance}`
    }
    case 'debuff': {
      if (eff.stat === 'holyMark') return `目标受到伤害增加 ${(eff.value*100).toFixed(0)}%，${dur}`
      const names = { atk:'攻击力', def:'防御力', speed:'速度' }
      return `${names[eff.stat] || eff.stat}降低 ${Math.abs(eff.value*100).toFixed(0)}%，${dur}${chance}`
    }
    case 'extraAction': return `追加 ${eff.value}% 伤害${chance}`
    case 'lifestealBuff': return `吸血效果 +${eff.value}%，${dur}${chance}`
    case 'cleanse': return '移除自身所有减益效果'
    case 'death': return `即死（对Boss无效）${chance}`
    case 'dotBurst': return `基于中毒层数造成 ${eff.value} 倍伤害，不清除层数`
    case 'reflect': return `反弹 ${(eff.value*100).toFixed(0)}% 伤害，${dur}`
    default: return eff.note || ''
  }
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 90vw; height: 90vh; padding: 16px; background: rgba(15,25,45,0.95); border: 2px solid #b89a6a; color: #ffd; font-family: 'Press Start 2P', cursive; display: flex; flex-direction: column; overflow-y: auto; position: relative; }
.top-bar { display: flex; align-items: center; margin-bottom: 10px; }
.top-title { font-size: 16px; color: #ffd700; display: flex; align-items: center; gap: 10px; margin: 0; white-space: nowrap; }
.top-actions { display: flex; align-items: center; gap: 10px; font-size: 10px; color: #ffd700; margin-left: 16px; }
.top-sp { white-space: nowrap; }
.reset-btn { font-size: 7px; padding: 4px 10px; }
.close-btn { background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer; flex-shrink: 0; margin-left: auto; }
.main-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.main-tab { flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(184,154,106,0.4); padding: 8px; font-size: 9px; color: #aaa; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; }
.main-tab.active { background: rgba(255,215,0,0.15); border-color: #ffd700; color: #ffd700; }
.element-filter { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 8px; }
.filter-btn { border-radius: 6px; background: rgba(0,0,0,0.5); border: 1px solid #5a5a7a; padding: 4px 8px; font-size: 7px; color: #ccc; cursor: pointer; display: flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0; }
.filter-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }
.skill-list { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.skill-card { border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.2); padding: 10px; cursor: pointer; }
.skill-card.locked { opacity: 0.5; }
.skill-top { display: flex; align-items: center; gap: 8px; }
.skill-icon { font-size: 22px; color: #ffd700; flex-shrink: 0; }
.skill-name-level { flex: 1; display: flex; flex-direction: column; }
.skill-name { font-size: 9px; }
.skill-cost { font-size: 7px; color: #aaa; }
.skill-element { font-size: 7px; margin-top: 2px; }
.skill-mp { font-size: 8px; color: #aaa; }
.skill-desc { font-size: 8px; color: #ccc; margin-top: 6px; line-height: 1.3; }
.equipped-list-vertical { display: flex; flex-direction: column; gap: 8px; }
.equipped-card { border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.3); padding: 10px; display: flex; align-items: center; gap: 8px; }
.equipped-card .skill-info { flex: 1; display: flex; flex-direction: column; }
.order-btns { display: flex; gap: 3px; }
.tripod-full { display: flex; flex-direction: column; gap: 12px; }
.tripod-tabs { display: flex; gap: 4px; justify-content: flex-start; margin-bottom: 16px; }
.tripod-tab { border-radius: 6px; width: 28px; height: 28px; background: rgba(0,0,0,0.4); border: 1px solid rgba(184,154,106,0.4); color: #aaa; font-family: inherit; font-size: 9px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.tripod-tab.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd700; }
.skill-tripod-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,215,0,0.2); padding: 12px; }
.skill-tripod-card h3 { font-size: 12px; color: #ffd700; margin-bottom: 10px; }
.tripod-block { margin-bottom: 12px; }
.tripod-header { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 6px; }
.tripod-choices { display: flex; flex-wrap: wrap; gap: 6px; }
.choice-btn { border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); padding: 8px 10px; cursor: pointer; text-align: left; flex: 1 1 150px; font-size: 7px; color: #ccc; }
.choice-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }
.choice-btn.none { border-radius: 6px; flex: 0 0 auto; min-width: 70px; text-align: center; color: #666; }
.eff-title { font-weight: bold; margin-bottom: 3px; }
.eff-desc { font-size: 6px; color: #aaa; line-height: 1.3; }
.choice-btn.active .eff-desc { color: #ffd; }
.skill-detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 600; padding: 20px; }
.skill-detail-panel { border-radius: 6px; background: rgba(15,25,45,0.98); border: 2px solid #b89a6a; padding: 20px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto; color: #ffd; font-family: 'Press Start 2P', cursive; position: relative; }
.skill-detail-panel h3 { font-size: 13px; color: #ffd700; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.detail-desc { font-size: 9px; color: #ccc; margin-bottom: 12px; line-height: 1.4; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px; }
.detail-item { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 8px; }
.detail-item .label { color: #b89aa5; margin-right: 6px; }
.detail-item.full-width { grid-column: span 2; }
.detail-actions { display: flex; gap: 8px; justify-content: center; margin-top: 12px; flex-wrap: wrap; }
.pixel-btn.small { font-size: 8px; padding: 5px 10px; }
.pixel-btn.danger { background: rgba(255,100,100,0.2); border-color: #f44; }
.pixel-btn.micro { font-size: 6px; padding: 3px 5px; min-width: unset; }
.empty { text-align: center; color: #888; padding: 20px; font-size: 9px; }
.awaken-progress { margin: 10px 0; }
.awaken-label { font-size: 8px; color: #aaa; margin-bottom: 4px; }
.awaken-bar { height: 6px; background: #2a2a3a; border-radius: 3px; overflow: hidden; }
.awaken-fill { height: 100%; background: linear-gradient(90deg, #ffd700, #ff8c00);

border-radius: 3px; transition: width 0.3s; }



/* 分页区域 */
.pagination-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: rgba(0,0,0,0.5);
  border: 1px solid #5a5a7a;
  border-radius: 6px;
  color: #ffd700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 18px;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
  background: rgba(255,215,0,0.2);
  border-color: #ffd700;
}

.skill-list-pages {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 原有的 .skill-card 等样式保持不变 */
</style>