<template>
  <div class="dev-skills">
    <h3>技能数据库管理</h3>
    <p class="hint">管理所有可用技能，玩家通过角色面板装备技能。</p>

    <!-- 添加新技能 -->
    <div class="add-section">
      <input v-model="newSkill.name" placeholder="技能名称" class="input-sm" />
      <input v-model="newSkill.desc" placeholder="描述" class="input-sm" />
      <input v-model="newSkill.icon" placeholder="图标 (如 mdi:fire)" class="input-sm" />
      <select v-model="newSkill.element" class="input-sm">
        <option value="">无属性</option>
        <option value="fire">火</option>
        <option value="water">水</option>
        <option value="thunder">雷</option>
        <option value="wind">风</option>
        <option value="grass">草</option>
        <option value="ice">冰</option>
        <option value="holy">圣</option>
        <option value="dark">暗</option>
        <option value="rock">岩</option>
        <option value="steel">钢</option>
      </select>
      <input v-model.number="newSkill.mpCost" type="number" placeholder="MP消耗" class="input-sm input-num" />
      <input v-model.number="newSkill.baseMul" type="number" step="0.1" placeholder="倍率" class="input-sm input-num" />
      <button class="pixel-btn btn-sm" @click="addSkill">添加</button>
    </div>

    <!-- 技能列表 -->
    <div class="skill-list">
      <div v-for="(skill, idx) in store.config.skillPool" :key="skill.id" class="skill-item">
        <Icon :icon="skill.icon || 'mdi:sword'" class="skill-icon" />
        <div class="skill-info">
          <strong>{{ skill.name }}</strong>
          <span class="skill-meta">
            {{ skill.element ? getElementLabel(skill.element) : '物理' }}
            | MP {{ skill.mpCost || 0 }}
            | 倍率 {{ skill.baseMul || 1 }}x
          </span>
          <span class="skill-desc">{{ skill.desc || skill.description || '' }}</span>
        </div>
        <button class="pixel-btn btn-danger btn-sm" @click="removeSkill(idx)">删除</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../../store/gameStore'

const store = useGameStore()

const newSkill = ref({
  name: '',
  desc: '',
  icon: 'mdi:sword',
  element: '',
  mpCost: 0,
  baseMul: 1.0
})

function addSkill() {
  if (!newSkill.value.name.trim()) return
  const id = 'skill_' + Date.now()
  store.config.skillPool.push({
    id,
    name: newSkill.value.name.trim(),
    desc: newSkill.value.desc || '',
    icon: newSkill.value.icon || 'mdi:sword',
    element: newSkill.value.element || null,
    mpCost: newSkill.value.mpCost || 0,
    baseMul: newSkill.value.baseMul || 1.0
  })
  newSkill.value = { name: '', desc: '', icon: 'mdi:sword', element: '', mpCost: 0, baseMul: 1.0 }
  store.save()
}

function removeSkill(idx) {
  if (!confirm('确认删除该技能？')) return
  store.config.skillPool.splice(idx, 1)
  store.save()
}

function getElementLabel(el) {
  const map = { fire: '火', water: '水', thunder: '雷', wind: '风', grass: '草', ice: '冰', holy: '圣', dark: '暗', rock: '岩', steel: '钢' }
  return map[el] || el
}
</script>

<style scoped>
.dev-skills { padding: 12px; }
.hint { font-size: 11px; color: #b89aa5; margin-bottom: 12px; }
.add-section { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.input-sm {
  padding: 6px 10px; font-size: 12px;
  background: #1a1a2a; border: 1px solid #c9a87b; border-radius: 12px; color: #ffd;
  flex: 1; min-width: 80px;
}
.input-num { max-width: 70px; }
.btn-sm { padding: 6px 14px; font-size: 11px; border-radius: 14px; white-space: nowrap; }
.skill-list { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; }
.skill-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px; background: rgba(255,255,255,0.06); border-radius: 14px;
  border: 1px solid rgba(200, 170, 130, 0.2);
}
.skill-icon { font-size: 28px; color: #f0c8a0; flex-shrink: 0; }
.skill-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.skill-meta { font-size: 10px; color: #b89aa5; }
.skill-desc { font-size: 10px; color: #8a7a7a; }
.btn-danger { background: #4a1a1a; border-color: #8a3a3a; color: #fcc; }
.btn-danger:hover { background: #6a2a2a; }
</style>
