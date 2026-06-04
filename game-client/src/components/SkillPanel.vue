<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      
   <!-- 顶部栏：左上技能标题，中间技能点+重置，右上关闭 -->
<div class="top-bar">
  <h2 class="top-title"><Icon icon="mdi:star-four-points" /> 技能</h2>
  <div class="top-actions">
    <span class="top-sp">技能点：<strong>{{ store.player.skillPoints }}</strong></span>
    <button class="pixel-btn danger reset-btn" @click="handleResetSkills">重置</button>
  </div>
  <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
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

      <!-- ================= 技能学习页 ================= -->
      <div v-if="activeTab === 'learn'" class="tab-content">
        <div class="element-filter">
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

        <div class="skill-list">
          <div
            v-for="skill in filteredSkillPool"
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
          <div v-if="filteredSkillPool.length === 0" class="empty">暂无技能</div>
        </div>
      </div>

      <!-- ================= 已装备页 ================= -->
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

      <!-- ================= 三脚架配置页 ================= -->
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
                    :class="{ active: !tripodChoices[equippedSkills[currentTripodSkillIndex].id]?.[tIdx] }"
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

      <!-- ================= 技能详情弹窗 ================= -->
      <div v-if="skillDetail" class="skill-detail-overlay" @click.self="skillDetail = null">
        <div class="skill-detail-panel">
          <button class="close-btn" @click="skillDetail = null"><Icon icon="mdi:close" /></button>
          <h3><Icon :icon="skillDetail.icon" /> {{ skillDetail.name }} (Lv.{{ getSkillLevel(skillDetail.id) }})</h3>
          <p class="detail-desc">{{ skillDetail.desc }}</p>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">类型</span><span>{{ getTypeLabel(skillDetail.type) }}</span></div>
            <div class="detail-item"><span class="label">目标</span><span>{{ getTargetLabel(skillDetail.target) }}</span></div>
            <div class="detail-item" v-if="skillDetail.element"><span class="label">属性</span><span>{{ getElementLabel(skillDetail.element) }}</span></div>
            <div class="detail-item"><span class="label">MP消耗</span><span>{{ skillDetail.mpCost || 0 }}</span></div>
            <div class="detail-item"><span class="label">当前倍率</span><span>{{ getSkillCurrentMul(skillDetail) }}x</span></div>
            <div class="detail-item" v-if="skillDetail.levelScaling?.baseMul"><span class="label">倍率成长</span><span>+{{ skillDetail.levelScaling.baseMul }}/级</span></div>
            <div class="detail-item full-width" v-if="skillDetail.effects?.length"><span class="label">附加效果</span><span>{{ skillDetail.effects.map(e => getEffectFullDesc(e)).join('；') }}</span></div>
          </div>
          <div class="detail-actions">
            <template v-if="isUnlocked(skillDetail.id)">
              <button class="pixel-btn small" @click="upgradeSkill(skillDetail.id)" :disabled="!canUpgrade(skillDetail.id)">升级 ({{ skillDetail.upgradeCost }} SP)</button>
              <button class="pixel-btn small" v-if="!isEquipped(skillDetail.id)" @click="equipSkill(skillDetail.id)">装备</button>
              <button class="pixel-btn small danger" v-else @click="unequipSkill(skillDetail.id)">卸下</button>
            </template>
            <button class="pixel-btn small" v-else @click="learnSkill(skillDetail.id)" :disabled="store.player.skillPoints < (skillDetail.learnCost || 2)">学习 ({{ skillDetail.learnCost || 2 }} SP)</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, inject } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close'])
const showConfirm = inject('showConfirm', (msg) => Promise.resolve(confirm(msg)))
const showToast = inject('showToast', (msg) => alert(msg))

const activeTab = ref('learn')
const skillDetail = ref(null)
const currentTripodSkillIndex = ref(0)
const selectedElement = ref('all')

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
const equippedSkills = computed(() =>
  (store.player.equippedSkills || []).map(id => store.config.skillPool.find(s => s.id === id)).filter(Boolean)
)

onMounted(() => {
  if (!store.player.tripodChoices) store.player.tripodChoices = {}
  if (!store.player.equippedSkills) store.player.equippedSkills = []
  if (!store.player.skills) store.player.skills = {}
  if (store.player.skillPoints === undefined) store.player.skillPoints = 5
})

const tripodChoices = computed({
  get: () => store.player.tripodChoices || {},
  set: (v) => { store.player.tripodChoices = v; store.save() }
})

function openSkillDetail(skill) {
  skillDetail.value = store.config.skillPool.find(s => s.id === skill.id) || skill
}
function getSkillCurrentMul(skill) {
  const level = getSkillLevel(skill.id)
  const scaling = skill.levelScaling || {}
  return ((skill.baseMul || 0) + (level - 1) * (scaling.baseMul || 0)).toFixed(2)
}

async function handleResetSkills() {
  const ok = await showConfirm('确定要重置所有技能吗？\n所有技能点将返还，已学习技能将被遗忘。')
  if (!ok) return
  let refund = 0
  for (const skill of store.config.skillPool || []) {
    const state = store.player.skills?.[skill.id]
    if (!state?.unlocked) continue
    refund += skill.learnCost || 0
    if (state.level > 1) refund += (skill.upgradeCost || 2) * (state.level - 1)
  }
  store.player.skills = {}
  store.player.equippedSkills = []
  store.player.tripodChoices = {}
  store.player.skillPoints += refund
  store.save()
  showToast('技能点已重置！')
}

function isUnlocked(skillId) { return !!store.player.skills?.[skillId]?.unlocked }
function isEquipped(skillId) { return store.player.equippedSkills?.includes(skillId) }
function getSkillLevel(skillId) { return store.player.skills?.[skillId]?.level || 1 }
function canUpgrade(skillId) {
  const skill = store.config.skillPool.find(s => s.id === skillId)
  if (!skill) return false
  return store.player.skillPoints >= (skill.upgradeCost ?? 2) && getSkillLevel(skillId) < (skill.maxLevel || 10)
}

function learnSkill(skillId) {
  const skill = store.config.skillPool.find(s => s.id === skillId)
  if (!skill) return
  const cost = skill.learnCost || 2
  if (store.player.skillPoints < cost) return
  if (!store.player.skills) store.player.skills = {}
  if (!store.player.skills[skillId]) store.player.skills[skillId] = { unlocked: true, level: 1 }
  else store.player.skills[skillId].unlocked = true
  store.player.skillPoints -= cost
  store.save()
  if (skillDetail.value?.id === skillId) skillDetail.value = store.config.skillPool.find(s => s.id === skillId)
}

function upgradeSkill(skillId) {
  if (!canUpgrade(skillId)) return
  const skill = store.config.skillPool.find(s => s.id === skillId)
  if (!skill) return
  const cost = skill.upgradeCost ?? 2
  if (store.player.skillPoints < cost) return
  if (!store.player.skills) store.player.skills = {}
  if (!store.player.skills[skillId]) store.player.skills[skillId] = { unlocked: true, level: 1 }
  store.player.skills[skillId].level = (store.player.skills[skillId].level || 1) + 1
  store.save()
  if (skillDetail.value?.id === skillId) skillDetail.value = store.config.skillPool.find(s => s.id === skillId)
}

function equipSkill(skillId) {
  if (isEquipped(skillId)) return
  if (store.player.equippedSkills.length >= 4) { showToast('最多装备4个技能'); return }
  store.player.equippedSkills.push(skillId)
  store.save()
}

function unequipSkill(skillId) {
  const idx = store.player.equippedSkills.indexOf(skillId)
  if (idx >= 0) { store.player.equippedSkills.splice(idx, 1); store.save() }
}

function moveUp(idx) {
  if (idx > 0) {
    const arr = store.player.equippedSkills
    ;[arr[idx], arr[idx-1]] = [arr[idx-1], arr[idx]]
    store.save()
  }
}

function moveDown(idx) {
  if (idx < store.player.equippedSkills.length - 1) {
    const arr = store.player.equippedSkills
    ;[arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]]
    store.save()
  }
}

function selectTripod(skillId, slotIdx, effIdx) {
  if (!store.player.tripodChoices[skillId]) store.player.tripodChoices[skillId] = {}
  store.player.tripodChoices[skillId][slotIdx] = String(effIdx)
  store.save()
}
function isTripodSelected(skillId, slotIdx, effIdx) {
  return String(store.player.tripodChoices[skillId]?.[slotIdx]) === String(effIdx)
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

function getEffectShort(eff) {
  const typeMap = { lifesteal:'吸血', mpDrain:'吸蓝', dot:'持续伤害', heal:'治疗', buff:'增益', debuff:'减益', shield:'护盾' }
  let text = typeMap[eff.type] || eff.type
  if (eff.value) text += ` ${eff.value}${eff.type === 'lifesteal' || eff.type === 'mpDrain' ? '%' : ''}`
  if (eff.chance < 100) text += `(${eff.chance}%)`
  return text
}
</script>

<style scoped>
/* ===== 全局 ===== */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 90vw; height: 90vh; padding: 16px; background: rgba(15,25,45,0.95); border: 2px solid #b89a6a; color: #ffd; font-family: 'Press Start 2P', cursive; display: flex; flex-direction: column; overflow-y: auto; position: relative; }

/* 顶部栏：左标题+技能点/重置，右关闭 */
.top-bar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.top-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.top-title {
  font-size: 16px;
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  white-space: nowrap;
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  color: #ffd700;
  margin-left: 16px;
}
.top-sp {
  white-space: nowrap;
}
.reset-btn {
  font-size: 7px;
  padding: 4px 10px;
}
.close-btn {
  background: none;
  border: none;
  color: #ffd;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: auto;
}

.main-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.main-tab { flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(184,154,106,0.4); padding: 8px; font-size: 9px; color: #aaa; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; }
.main-tab.active { background: rgba(255,215,0,0.15); border-color: #ffd700; color: #ffd700; }

.element-filter { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 8px; }
.filter-btn { border-radius: 6px;background: rgba(0,0,0,0.5); border: 1px solid #5a5a7a; padding: 4px 8px; font-size: 7px; color: #ccc; cursor: pointer; display: flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0; }
.filter-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }

.skill-list { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.skill-card { border-radius: 6px;background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.2); padding: 10px; cursor: pointer; }
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
.equipped-card { border-radius: 6px;background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.3); padding: 10px; display: flex; align-items: center; gap: 8px; }
.equipped-card .skill-info { flex: 1; display: flex; flex-direction: column; }
.order-btns { display: flex; gap: 3px; }

/* 三脚架 */
.tripod-full { display: flex; flex-direction: column; gap: 12px; }
.tripod-tabs { display: flex; gap: 4px; justify-content: flex-start; margin-bottom: 16px; }
.tripod-tab {border-radius: 6px;width: 28px; height: 28px; background: rgba(0,0,0,0.4); border: 1px solid rgba(184,154,106,0.4); color: #aaa; font-family: inherit; font-size: 9px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.tripod-tab.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd700; }
.skill-tripod-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,215,0,0.2); padding: 12px; }
.skill-tripod-card h3 { font-size: 12px; color: #ffd700; margin-bottom: 10px; }
.tripod-block { margin-bottom: 12px; }
.tripod-header { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 6px; }
.tripod-choices { display: flex; flex-wrap: wrap; gap: 6px; }
.choice-btn { border-radius: 6px;background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); padding: 8px 10px; cursor: pointer; text-align: left; flex: 1 1 150px; font-size: 7px; color: #ccc; }
.choice-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }
.choice-btn.none { border-radius: 6px;flex: 0 0 auto; min-width: 70px; text-align: center; color: #666; }
.eff-title { font-weight: bold; margin-bottom: 3px; }
.eff-desc { font-size: 6px; color: #aaa; line-height: 1.3; }
.choice-btn.active .eff-desc { color: #ffd; }

/* 弹窗 */
.skill-detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 600; padding: 20px; }
.skill-detail-panel { border-radius: 6px;background: rgba(15,25,45,0.98); border: 2px solid #b89a6a; padding: 20px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto; color: #ffd; font-family: 'Press Start 2P', cursive; position: relative; }
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
</style>