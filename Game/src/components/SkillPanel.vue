<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      <h2><Icon icon="mdi:star-four-points" /> 技能</h2>
      <p class="sp-info">可用技能点：<strong>{{ store.player.skillPoints }}</strong></p>

      <div class="skill-layout">
        <!-- 左侧技能池 -->
        <div class="skill-pool">
          <h3>技能池</h3>
          <div v-for="skill in unlockedSkills" :key="skill.id" class="skill-card">
            <div class="skill-header">
              <Icon :icon="skill.icon" class="skill-icon" />
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-cost">Lv.{{ getSkillLevel(skill.id) }}</span>
            </div>
            <div class="skill-desc">{{ skill.desc }}</div>
            <div class="skill-actions">
              <button class="pixel-btn small" @click="upgradeSkill(skill.id)" :disabled="!canUpgrade(skill.id)">
                升级 ({{ skill.upgradeCost }} SP)
              </button>
              <button class="pixel-btn small" @click="equipSkill(skill.id)" :disabled="isEquipped(skill.id)">
                {{ isEquipped(skill.id) ? '已装备' : '装备' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧装备栏 -->
        <div class="equip-bar">
          <h3>已装备 ({{ equippedSkills.length }}/4)</h3>
          <div v-if="equippedSkills.length === 0" class="empty">拖拽技能到此处或点击“装备”</div>
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close'])

// 已装备的技能列表（按顺序）
const equippedSkills = computed(() => {
  return store.player.equippedSkills
    .map(id => store.config.skillPool.find(s => s.id === id))
    .filter(Boolean)
})

// 已解锁的技能（根据 player.skills 判断）
const unlockedSkills = computed(() => {
  return store.config.skillPool.filter(s => store.player.skills[s.id]?.unlocked)
})

function isEquipped(skillId) {
  return store.player.equippedSkills.includes(skillId)
}

function getSkillLevel(skillId) {
  return store.player.skills[skillId]?.level || 1
}

function canUpgrade(skillId) {
  const skill = store.config.skillPool.find(s => s.id === skillId)
  if (!skill) return false
  const currentLevel = getSkillLevel(skillId)
  return store.player.skillPoints >= skill.upgradeCost && currentLevel < 10
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
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 700px; max-width: 90vw; max-height: 85vh; overflow-y: auto; padding: 24px; }
.sp-info { font-size: 12px; margin-bottom: 15px; color: #ffd700; }
.skill-layout { display: flex; gap: 20px; }
.skill-pool { flex: 1; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; max-height: 60vh; overflow-y: auto; }
.skill-pool h3, .equip-bar h3 { font-size: 12px; margin-bottom: 10px; color: #ffd700; }
.skill-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.2); border-radius: 10px; padding: 10px; margin-bottom: 10px; }
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
</style>