<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <h2><Icon icon="mdi:star-four-points" /> 技能</h2>
      <p class="sp-info">可用技能点：<strong>{{ store.player.skillPoints }}</strong></p>

      <div class="skill-layout">
        <!-- 左侧技能池（所有技能） -->
        <div class="skill-pool">
          <h3>技能池</h3>
          <div
            v-for="skill in store.config.skillPool"
            :key="skill.id"
            class="skill-card"
            :class="{ locked: !isUnlocked(skill.id) }"
            @mouseenter="showTooltip(skill, $event)"
            @mouseleave="hideTooltip"
          >
            <div class="skill-header">
              <Icon :icon="skill.icon" class="skill-icon" />
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-cost" v-if="isUnlocked(skill.id)">Lv.{{ getSkillLevel(skill.id) }}</span>
            </div>
            <div class="skill-desc">{{ skill.desc }}</div>
            <div class="skill-actions">
              <template v-if="isUnlocked(skill.id)">
                <button class="pixel-btn small" @click="upgradeSkill(skill.id)" :disabled="!canUpgrade(skill.id)">
                  升级 ({{ skill.upgradeCost }} SP)
                </button>
                <button class="pixel-btn small" @click="equipSkill(skill.id)" :disabled="isEquipped(skill.id)">
                  {{ isEquipped(skill.id) ? '已装备' : '装备' }}
                </button>
              </template>
              <template v-else>
                <button class="pixel-btn small" @click="learnSkill(skill.id)" :disabled="store.player.skillPoints < (skill.learnCost || 2)">
                  学习 ({{ skill.learnCost || 2 }} SP)
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- 右侧装备栏 -->
        <div class="equip-bar">
          <h3>已装备 ({{ equippedSkills.length }}/4)</h3>
          <div v-if="equippedSkills.length === 0" class="empty">点击左侧技能进行装备</div>
          <div v-for="(skill, idx) in equippedSkills" :key="skill.id" class="equipped-skill">
            <div class="skill-row">
              <Icon :icon="skill.icon" class="skill-icon" />
              <span class="skill-name">{{ skill.name }} (Lv.{{ getSkillLevel(skill.id) }})</span>
              <div class="order-btns">
                <button class="pixel-btn micro" @click="moveUp(idx)" :disabled="idx === 0">↑</button>
                <button class="pixel-btn micro" @click="moveDown(idx)" :disabled="idx === equippedSkills.length - 1">↓</button>
                <button class="pixel-btn micro danger" @click="unequipSkill(skill.id)">卸下</button>
              </div>
            </div>
            <!-- 三角架选择 -->
            <div v-if="skill.tripods && skill.tripods.length" class="tripod-area">
              <div v-for="(tripod, tIdx) in skill.tripods" :key="tIdx" class="tripod-row">
                <span class="tripod-label">{{ tripod.name }} (Lv{{ tripod.unlockLevel }})</span>
                <select
                  v-model="tripodChoices[skill.id][tIdx]"
                  class="pixel-input micro"
                  :disabled="getSkillLevel(skill.id) < tripod.unlockLevel"
                  @change="saveTripod(skill.id, tIdx, $event.target.value)"
                >
                  <option value="">无</option>
                  <option v-for="(eff, eIdx) in tripod.effects" :key="eIdx" :value="eIdx">
                    {{ getEffectShort(eff) }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 技能详情悬浮提示 -->
      <div v-if="tooltip.visible" class="skill-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <div class="tooltip-name">{{ tooltip.skill.name }}</div>
        <div class="tooltip-row">
          <span class="tooltip-label">类型</span>
          <span>{{ getTypeLabel(tooltip.skill.type) }}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">目标</span>
          <span>{{ getTargetLabel(tooltip.skill.target) }}</span>
        </div>
        <div class="tooltip-row" v-if="tooltip.skill.element">
          <span class="tooltip-label">属性</span>
          <span>{{ getElementLabel(tooltip.skill.element) }}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">MP消耗</span>
          <span>{{ tooltip.skill.mpCost || 0 }}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">基础倍率</span>
          <span>{{ tooltip.skill.baseMul }}x</span>
        </div>
        <div class="tooltip-row" v-if="tooltip.skill.levelScaling">
          <span class="tooltip-label">倍率成长</span>
          <span>+{{ tooltip.skill.levelScaling.baseMul || 0 }}/级</span>
        </div>
        <div class="tooltip-row" v-if="tooltip.skill.effects?.length">
          <span class="tooltip-label">附加效果</span>
          <span>{{ tooltip.skill.effects.map(e => getEffectShort(e)).join(', ') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close'])

// 初始化 player 技能相关字段
onMounted(() => {
  if (!store.player.tripodChoices) store.player.tripodChoices = {}
  if (!store.player.equippedSkills) store.player.equippedSkills = []
  if (!store.player.skills) store.player.skills = {}
  if (store.player.skillPoints === undefined) store.player.skillPoints = 5
})

// 三角架选择
const tripodChoices = computed({
  get: () => store.player.tripodChoices || {},
  set: (v) => { store.player.tripodChoices = v; store.save() }
})

// 已装备技能
const equippedSkills = computed(() => {
  return (store.player.equippedSkills || [])
    .map(id => store.config.skillPool.find(s => s.id === id))
    .filter(Boolean)
})

// 监听装备技能变化，初始化三角架选择
watch(equippedSkills, (skills) => {
  if (!store.player.tripodChoices) store.player.tripodChoices = {}
  for (const skill of skills) {
    if (!store.player.tripodChoices[skill.id]) {
      store.player.tripodChoices[skill.id] = {}
    }
  }
}, { immediate: true })

function isUnlocked(skillId) {
  return store.player.skills?.[skillId]?.unlocked
}

function isEquipped(skillId) {
  return store.player.equippedSkills?.includes(skillId)
}

function getSkillLevel(skillId) {
  return store.player.skills?.[skillId]?.level || 1
}

function canUpgrade(skillId) {
  const skill = store.config.skillPool.find(s => s.id === skillId)
  if (!skill) return false
  const currentLevel = getSkillLevel(skillId)
  return store.player.skillPoints >= (skill.upgradeCost || 2) && currentLevel < (skill.maxLevel || 10)
}

function learnSkill(skillId) {
  const skill = store.config.skillPool.find(s => s.id === skillId)
  if (!skill) return
  const cost = skill.learnCost || 2
  if (store.player.skillPoints < cost) return
  if (!store.player.skills) store.player.skills = {}
  if (!store.player.skills[skillId]) {
    store.player.skills[skillId] = { unlocked: true, level: 1 }
  } else {
    store.player.skills[skillId].unlocked = true
  }
  store.player.skillPoints -= cost
  store.save()
}

function upgradeSkill(skillId) {
  if (!canUpgrade(skillId)) return
  const skill = store.config.skillPool.find(s => s.id === skillId)
  store.player.skillPoints -= skill.upgradeCost
  store.player.skills[skillId].level++
  store.save()
}

function equipSkill(skillId) {
  if (isEquipped(skillId)) return
  if (store.player.equippedSkills.length >= 4) {
    alert('最多装备4个技能')
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

function saveTripod(skillId, slotIdx, value) {
  if (!store.player.tripodChoices[skillId]) {
    store.player.tripodChoices[skillId] = {}
  }
  store.player.tripodChoices[skillId][slotIdx] = value
  store.save()
}

// 悬浮提示
const tooltip = reactive({
  visible: false,
  x: 0, y: 0,
  skill: {}
})

function showTooltip(skill, event) {
  const card = event.currentTarget; // 获取 .skill-card 元素
  const rect = card.getBoundingClientRect();
  
  const tooltipWidth = 220;  // 与 .skill-tooltip 的 max-width 一致
  const tooltipHeight = 200; // 预估高度（可根据内容调整）
  const offset = 10;         // 提示框与卡片之间的间距
  
  // 计算提示框的初始位置（卡片上方居中）
  let x = rect.left + rect.width / 2 - tooltipWidth / 2;
  let y = rect.top - tooltipHeight - offset;
  
  // 防止左侧超出屏幕
  if (x < 10) x = 10;
  // 防止右侧超出屏幕
  if (x + tooltipWidth > window.innerWidth - 10) {
    x = window.innerWidth - tooltipWidth - 10;
  }
  
  // 如果上方空间不足，则显示在卡片下方
  if (y < 10) {
    y = rect.bottom + offset;
  }
  
  tooltip.skill = skill;
  tooltip.x = x;
  tooltip.y = y;
  tooltip.visible = true;
}



function hideTooltip() {
  tooltip.visible = false
}

function getTypeLabel(t) { const map = { active: '主动', passive: '被动', reaction: '反应' }; return map[t] || t }
function getTargetLabel(t) { const map = { single: '单体', aoe: '全体', self: '自身', ally: '队友' }; return map[t] || t }
function getElementLabel(e) { const map = { fire:'火', water:'水', thunder:'雷', wind:'风', grass:'草', ice:'冰', holy:'圣', dark:'暗', rock:'岩', steel:'钢' }; return map[e] || e }
function getEffectShort(eff) {
  const typeMap = { lifesteal:'吸血', mpDrain:'吸蓝', dot:'持续伤害', heal:'治疗', buff:'增益', debuff:'减益', shield:'护盾' }
  let text = typeMap[eff.type] || eff.type
  if (eff.value) text += ` ${eff.value}${eff.type === 'lifesteal' || eff.type === 'mpDrain' ? '%' : ''}`
  if (eff.chance < 100) text += `(${eff.chance}%)`
  return text
}
</script>

<style scoped>
/* 保持原有样式，增加三角架和提示样式 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 700px; max-width: 90vw; max-height: 85vh; overflow-y: auto; padding: 24px; }
.sp-info { font-size: 12px; margin-bottom: 15px; color: #ffd700; }
.skill-layout { display: flex; gap: 20px; }
.skill-pool { flex: 1; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; max-height: 60vh; overflow-y: auto; }
.skill-pool h3, .equip-bar h3 { font-size: 12px; margin-bottom: 10px; color: #ffd700; }
.skill-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.2); border-radius: 10px; padding: 10px; margin-bottom: 10px; transition: background 0.2s; }
.skill-card.locked { opacity: 0.6; }
.skill-card:hover { background: rgba(255,255,255,0.1); }
.skill-header { display: flex; align-items: center; gap: 8px; }
.skill-icon { font-size: 24px; color: #ffd700; }
.skill-name { font-size: 11px; flex: 1; }
.skill-cost { font-size: 9px; color: #aaa; }
.skill-desc { font-size: 9px; color: #ccc; margin: 6px 0; }
.skill-actions { display: flex; gap: 6px; margin-top: 8px; }

.equip-bar { flex: 1; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; }
.equipped-skill { margin-bottom: 10px; }
.skill-row { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; }
.order-btns { display: flex; gap: 4px; margin-left: auto; }
.pixel-btn.micro { font-size: 7px; padding: 4px 6px; min-width: unset; }
.empty { font-size: 10px; color: #888; text-align: center; padding: 20px; }

.tripod-area { margin-top: 6px; padding-left: 32px; }
.tripod-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 8px; }
.tripod-label { color: #b89aa5; min-width: 80px; }
.pixel-input.micro { background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 2px 4px; font-family: 'Press Start 2P'; font-size: 7px; max-width: 80px; border-radius: 4px; }

/* 悬浮提示 */
.skill-tooltip {
  position: fixed;
  background: rgba(10,15,30,0.95);
  border: 2px solid #b89a6a;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 9px;
  color: #ffd;
  max-width: 220px;
  z-index: 500;
  pointer-events: none;
  box-shadow: 0 8px 20px rgba(0,0,0,0.7);
}
.tooltip-name { font-size: 11px; font-weight: bold; margin-bottom: 6px; color: #ffd700; }
.tooltip-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
.tooltip-label { color: #b89aa5; margin-right: 10px; }
</style>