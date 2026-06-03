<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <h2><Icon icon="mdi:star-four-points" /> 技能</h2>
      <div class="sp-info-row">
        <span>可用技能点：<strong>{{ store.player.skillPoints }}</strong></span>
        <button class="pixel-btn danger reset-btn" @click="handleResetSkills">重置技能点</button>
      </div>

      <!-- 标签切换 -->
      <div class="tabs">
        <button :class="['tab', { active: activeTab === 'learn' }]" @click="activeTab = 'learn'">
          <Icon icon="mdi:book-open" /> 技能学习
        </button>
        <button :class="['tab', { active: activeTab === 'tripod' }]" @click="activeTab = 'tripod'">
          <Icon icon="mdi:star-four-points" /> 三脚架配置
        </button>
      </div>

      <!-- ================= 技能学习页 ================= -->
      <div v-if="activeTab === 'learn'" class="tab-content">
        <div class="element-filter">
          <button
            v-for="tag in elementTags"
            :key="tag.value"
            :class="['filter-btn', { active: selectedElement === tag.value }]"
            @click="selectedElement = tag.value; currentPage = 1"
          >
            <Icon v-if="tag.icon" :icon="tag.icon" />
            {{ tag.label }}
          </button>
        </div>

        <div class="skill-layout">
          <!-- 左侧技能池（分页） -->
          <div class="skill-pool">
            <h3>技能池 ({{ filteredSkillPool.length }})</h3>
            <!-- 分页控制 -->
       
            <div class="skill-grid">
              <div
              v-for="skill in filteredSkillPool"
                :key="skill.id"
                class="skill-card"
                :class="{ locked: !isUnlocked(skill.id) }"
                @click="openSkillDetail(skill)"
              >
                <div class="skill-header">
                  <Icon :icon="skill.icon" class="skill-icon" />
                  <span class="skill-name">{{ skill.name }}</span>
                  <span class="skill-cost" v-if="isUnlocked(skill.id)">Lv.{{ getSkillLevel(skill.id) }}</span>
                </div>
                <div class="skill-desc">{{ skill.desc }}</div>
              </div>
            </div>
          </div>

          <!-- 右侧装备栏（可点击弹窗） -->
          <div class="equip-bar">
            <h3>已装备 ({{ equippedSkills.length }}/4)</h3>
            <div v-if="equippedSkills.length === 0" class="empty">点击左侧技能进行装备</div>
            <div class="equipped-list">
              <div v-for="(skill, idx) in equippedSkills" :key="skill.id" class="equipped-skill">
                <div class="skill-row" @click="openSkillDetail(skill)">
                  <Icon :icon="skill.icon" class="skill-icon" />
                  <span class="skill-name">{{ skill.name }} (Lv.{{ getSkillLevel(skill.id) }})</span>
                  <div class="order-btns" @click.stop>
                    <button class="pixel-btn micro" @click="moveUp(idx)" :disabled="idx === 0">↑</button>
                    <button class="pixel-btn micro" @click="moveDown(idx)" :disabled="idx === equippedSkills.length - 1">↓</button>
                    <button class="pixel-btn micro danger" @click="unequipSkill(skill.id)">卸下</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- 三脚架配置页（单技能切换） -->
<div v-if="activeTab === 'tripod'" class="tripod-full">
  <div v-if="equippedSkills.length === 0" class="empty">请先在“技能学习”页装备技能</div>
  <template v-else>
    <!-- 顶部数字标签 -->
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

    <!-- 当前选中技能的三脚架 -->
    <div class="skill-tripod-card" v-if="equippedSkills[currentTripodSkillIndex]">
      <h3>{{ equippedSkills[currentTripodSkillIndex].name }} (Lv.{{ getSkillLevel(equippedSkills[currentTripodSkillIndex].id) }})</h3>
      <div v-if="equippedSkills[currentTripodSkillIndex].tripods && equippedSkills[currentTripodSkillIndex].tripods.length">
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
              :class="{ active: !tripodChoices[equippedSkills[currentTripodSkillIndex].id]?.[tIdx] || tripodChoices[equippedSkills[currentTripodSkillIndex].id]?.[tIdx] === '' }"
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

      <!-- ================= 移动端技能详情弹窗 ================= -->
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

// 打开详情弹窗（同时更新技能数据）
function openSkillDetail(skill) {
  skillDetail.value = store.config.skillPool.find(s => s.id === skill.id) || skill
}
function getSkillCurrentMul(skill) {
  const level = getSkillLevel(skill.id)
  const scaling = skill.levelScaling || {}
  return ((skill.baseMul || 0) + (level - 1) * (scaling.baseMul || 0)).toFixed(2)
}

// 重置技能点
async function handleResetSkills() {
  const ok = await showConfirm('确定要重置所有技能吗？\n所有技能点将返还，已学习技能将被遗忘。')
  if (!ok) return
  let refund = 0
  const skillPool = store.config.skillPool || []
  for (const skill of skillPool) {
    const state = store.player.skills?.[skill.id]
    if (!state || !state.unlocked) continue
    refund += skill.learnCost || 0
    const currentLevel = state.level || 1
    if (currentLevel > 1) {
      refund += (skill.upgradeCost || 2) * (currentLevel - 1)
    }
  }
  store.player.skills = {}
  store.player.equippedSkills = []
  store.player.tripodChoices = {}
  store.player.skillPoints = (store.player.skillPoints || 0) + refund
  store.save()
  showToast('技能点已重置！')
}

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

const equippedSkills = computed(() => {
  return (store.player.equippedSkills || [])
    .map(id => store.config.skillPool.find(s => s.id === id))
    .filter(Boolean)
})

const elementTags = [
  { label: '全部', value: 'all', icon: null },
  { label: '无属性', value: 'none', icon: 'mdi:circle' },
  { label: '火', value: 'fire', icon: 'mdi:fire' },
  { label: '水', value: 'water', icon: 'mdi:water' },
  { label: '雷', value: 'thunder', icon: 'mdi:lightning-bolt' },
  { label: '风', value: 'wind', icon: 'mdi:weather-windy' },
  { label: '草', value: 'grass', icon: 'mdi:leaf' },
  { label: '冰', value: 'ice', icon: 'mdi:snowflake' },
  { label: '圣', value: 'holy', icon: 'mdi:brightness-7' },
  { label: '暗', value: 'dark', icon: 'mdi:moon-waning-crescent' },
  { label: '岩', value: 'rock', icon: 'mdi:terrain' },
  { label: '钢', value: 'steel', icon: 'mdi:cube-outline' },
]
const selectedElement = ref('all')

const sortedSkillPool = computed(() => {
  return [...store.config.skillPool].sort((a, b) => (isUnlocked(b.id) ? 1 : 0) - (isUnlocked(a.id) ? 1 : 0))
})
const filteredSkillPool = computed(() => {
  if (selectedElement.value === 'all') return sortedSkillPool.value
  return sortedSkillPool.value.filter(skill => {
    if (selectedElement.value === 'none') return !skill.element
    return skill.element === selectedElement.value
  })
})

watch(equippedSkills, (skills) => {
  if (!store.player.tripodChoices) store.player.tripodChoices = {}
  for (const skill of skills) {
    if (!store.player.tripodChoices[skill.id]) {
      store.player.tripodChoices[skill.id] = {}
    }
  }
}, { immediate: true })

function isUnlocked(skillId) { return store.player.skills?.[skillId]?.unlocked }
function isEquipped(skillId) { return store.player.equippedSkills?.includes(skillId) }
function getSkillLevel(skillId) { return store.player.skills?.[skillId]?.level || 1 }
function canUpgrade(skillId) {
  const skill = store.config.skillPool.find(s => s.id === skillId)
  if (!skill) return false
  const cost = skill.upgradeCost ?? 2
  return store.player.skillPoints >= cost && getSkillLevel(skillId) < (skill.maxLevel || 10)
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
  if (store.player.equippedSkills.length >= 4) {
    showToast('最多装备4个技能')
    return
  }
  store.player.equippedSkills.push(skillId)
  store.save()
}
function unequipSkill(skillId) {
  const idx = store.player.equippedSkills.indexOf(skillId)
  if (idx === -1) return
  store.player.equippedSkills.splice(idx, 1)
  store.save()
}
function moveUp(idx) {
  if (idx <= 0) return
  const arr = store.player.equippedSkills
  const temp = arr[idx]
  arr[idx] = arr[idx - 1]
  arr[idx - 1] = temp
  store.save()
}
function moveDown(idx) {
  const arr = store.player.equippedSkills
  if (idx >= arr.length - 1) return
  const temp = arr[idx]
  arr[idx] = arr[idx + 1]
  arr[idx + 1] = temp
  store.save()
}

// ========== 三脚架相关（与之前相同） ==========
function selectTripod(skillId, slotIdx, effIdx) {
  if (!store.player.tripodChoices[skillId]) store.player.tripodChoices[skillId] = {}
  store.player.tripodChoices[skillId][slotIdx] = String(effIdx)
  store.save()
}
function isTripodSelected(skillId, slotIdx, effIdx) {
  const choices = store.player.tripodChoices[skillId] || {}
  return String(choices[slotIdx]) === String(effIdx)
}
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

// 辅助标签函数
function getTypeLabel(t) { const map = { active:'主动', passive:'被动', reaction:'反应' }; return map[t] || t }
function getTargetLabel(t) { const map = { single:'单体', aoe:'全体', self:'自身', ally:'队友' }; return map[t] || t }
function getElementLabel(e) { const map = { fire:'火', water:'水', thunder:'雷', wind:'风', grass:'草', ice:'冰', holy:'圣', dark:'暗', rock:'岩', steel:'钢' }; return map[e] || e }
</script>

<style scoped>
/* 保留原有所有样式不变，仅添加/修改分页相关 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 90vw; height: 90vh; overflow-y: auto; padding: 24px; background: rgba(15,25,45,0.95); border: 2px solid #b89a6a; border-radius: 24px; color: #ffd; font-family: 'Press Start 2P', cursive; }
.close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer; }
h2 { font-size: 16px; color: #ffd700; display: flex; align-items: center; gap: 10px; }
.sp-info-row { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; font-size: 12px; color: #ffd700; }
.reset-btn { font-size: 7px; padding: 4px 10px; margin-left: auto; white-space: nowrap; }
.tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.tab { flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(184,154,106,0.4); border-radius: 12px 12px 0 0; padding: 10px; font-size: 10px; color: #aaa; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; }
.tab.active { background: rgba(255,215,0,0.15); border-color: #ffd700; color: #ffd700; }
.element-filter { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.filter-btn { background: rgba(0,0,0,0.5); border: 1px solid #5a5a7a; border-radius: 8px; padding: 4px 12px; font-size: 8px; color: #ccc; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.filter-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }
.skill-layout { display: flex; gap: 20px; flex: 1; min-height: 0; }
.skill-pool { flex: 1; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; }
.skill-pool h3 { font-size: 12px; margin-bottom: 10px; color: #ffd700; }
.skill-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; flex: 1; align-content: start; }
.skill-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.2); border-radius: 10px; padding: 12px; transition: background 0.2s; cursor: pointer; }
.skill-card.locked { opacity: 0.6; }
.skill-card:hover { background: rgba(255,255,255,0.1); }
.skill-header { display: flex; align-items: center; gap: 8px; }
.skill-icon { font-size: 24px; color: #ffd700; flex-shrink: 0; }
.skill-name { font-size: 11px; flex: 1; }
.skill-cost { font-size: 9px; color: #aaa; }
.skill-desc { font-size: 9px; color: #ccc; margin-top: 8px; }
.equip-bar { width: 320px; flex-shrink: 0; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; }
.equip-bar h3 { font-size: 12px; margin-bottom: 10px; color: #ffd700; }
.equipped-list { flex: 1; min-height: 0; }
.equipped-skill { margin-bottom: 12px; }
.skill-row { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; cursor: pointer; }
.order-btns { display: flex; gap: 4px; margin-left: auto; }
.pixel-btn.micro { font-size: 7px; padding: 4px 6px; min-width: unset; }
.empty { font-size: 10px; color: #888; text-align: center; padding: 20px; }

/* 分页 */
.pagination { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 10px; }
.page-info { font-size: 9px; color: #ffd; min-width: 60px; text-align: center; }

/* 三脚架配置页（无变化） */
.tripod-full {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px;
}
.skill-tripod-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,215,0,0.2); border-radius: 12px; padding: 16px; }
.skill-tripod-card h3 { font-size: 14px; color: #ffd700; margin-bottom: 12px; }
.tripod-block { margin-bottom: 16px; }
.tripod-header { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 8px; color: #b89a6a; }
.unlock { font-size: 8px; color: #888; }
.tripod-choices { display: flex; flex-wrap: wrap; gap: 8px; }
.choice-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 14px; cursor: pointer; text-align: left; flex: 1 1 200px; transition: 0.2s; font-family: inherit; font-size: 8px; color: #ccc; }
.choice-btn:hover:not(:disabled) { background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.4); }
.choice-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }
.choice-btn.none { flex: 0 0 auto; min-width: 80px; text-align: center; color: #666; }
.eff-title { font-weight: bold; margin-bottom: 4px; }
.eff-desc { font-size: 7px; color: #aaa; }
.choice-btn.active .eff-desc { color: #ffd; }

/* 移动端详情弹窗 */
.skill-detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 600; padding: 20px; }
.skill-detail-panel { background: rgba(15,25,45,0.98); border: 2px solid #b89a6a; border-radius: 20px; padding: 24px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto; color: #ffd; font-family: 'Press Start 2P', cursive; position: relative; }
.skill-detail-panel h3 { font-size: 16px; color: #ffd700; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
.detail-desc { font-size: 10px; color: #ccc; margin-bottom: 16px; line-height: 1.5; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
.detail-item { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 9px; }
.detail-item .label { color: #b89aa5; margin-right: 8px; }
.detail-item.full-width { grid-column: span 2; }
.detail-actions { display: flex; gap: 10px; justify-content: center; margin-top: 16px; }
.pixel-btn.small { font-size: 9px; padding: 6px 12px; }
.pixel-btn.danger { background: rgba(255,100,100,0.2); border-color: #f44; }


.tripod-tabs {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}
.tripod-tab {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(184,154,106,0.4);
  color: #aaa;
  font-family: 'Press Start 2P', cursive;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}
.tripod-tab.active {
  background: rgba(255,215,0,0.2);
  border-color: #ffd700;
  color: #ffd700;
}
</style>