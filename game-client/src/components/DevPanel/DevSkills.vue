<template>
  <div class="dev-skills">
    <h3>技能数据库管理</h3>
    <p class="hint">按属性分类编辑，保存后直接写入服务器 JSON 文件，刷新游戏生效。</p>

    <!-- 属性分类标签 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="pixel-btn btn-sm"
        :class="{ active: activeCat === cat.key }"
        @click="activeCat = cat.key"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- 技能列表 -->
    <div class="skill-list">
      <div v-for="skill in currentSkills" :key="skill.id" class="skill-item" @click="openEdit(skill)">
        <Icon :icon="skill.icon || 'mdi:sword'" class="skill-icon" />
        <div class="skill-info">
          <strong>{{ skill.name }}</strong>
          <span class="skill-meta">
            {{ getTypeLabel(skill.type) }} | {{ getTargetLabel(skill.target) }}
            | {{ skill.element ? getElementLabel(skill.element) : '无属性' }}
            | 倍率 {{ skill.baseMul }}x | MP{{ skill.mpCost }}
          </span>
        </div>
        <div class="skill-actions" @click.stop>
          <button class="pixel-btn btn-sm" @click="openEdit(skill)">编辑</button>
          <button class="pixel-btn btn-danger btn-sm" @click="removeSkill(skill)">删除</button>
        </div>
      </div>
    </div>

    <div class="bottom-actions">
      <button class="pixel-btn" @click="createNew">新增技能</button>
      <button class="pixel-btn" @click="saveToServer" :disabled="saving">
        <Icon icon="mdi:cloud-upload" /> {{ saving ? '保存中...' : '保存到服务器' }}
      </button>
      <button class="pixel-btn" @click="importSkills">导入 JSON</button>
      <button class="pixel-btn" @click="exportSkills">导出 JSON</button>
    </div>

    <p v-if="saveMsg" :class="saveOk ? 'msg-ok' : 'msg-err'">{{ saveMsg }}</p>

    <!-- 编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content pixel-panel">
        <button class="close-btn" @click="closeModal"><Icon icon="mdi:close" /></button>
        <h3>{{ isNew ? '新增技能' : '编辑技能' }}</h3>

        <div class="modal-body">
          <div class="row">
            <label>名称</label>
            <input v-model="editSkill.name" class="pixel-input" />
          </div>
          <div class="row">
            <label>描述</label>
            <input v-model="editSkill.desc" class="pixel-input" />
          </div>
          <div class="row">
            <label>图标</label>
            <input v-model="editSkill.icon" class="pixel-input" placeholder="mdi:fire" />
          </div>
          <div class="row">
            <label>类型</label>
            <select v-model="editSkill.type" class="pixel-input">
              <option value="active">主动</option>
              <option value="passive">被动</option>
              <option value="reaction">反应</option>
            </select>
          </div>
          <div class="row">
            <label>目标</label>
            <select v-model="editSkill.target" class="pixel-input">
              <option value="single">单体</option>
              <option value="aoe">全体</option>
              <option value="self">自身</option>
              <option value="ally">队友</option>
            </select>
          </div>
          <div class="row">
            <label>元素</label>
            <select v-model="editSkill.element" class="pixel-input">
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
          </div>
          <div class="row">
            <label>MP消耗</label>
            <input v-model.number="editSkill.mpCost" type="number" class="pixel-input" />
          </div>
          <div class="row">
            <label>基础倍率</label>
            <input v-model.number="editSkill.baseMul" type="number" step="0.1" class="pixel-input" />
          </div>
          <div class="row">
            <label>最大等级</label>
            <input v-model.number="editSkill.maxLevel" type="number" min="1" class="pixel-input" />
          </div>
          <div class="row">
            <label>升级消耗 (SP)</label>
            <input v-model.number="editSkill.upgradeCost" type="number" class="pixel-input" />
          </div>

          <!-- 升级成长 -->
          <div class="section">
            <h4>升级成长</h4>
            <div class="row">
              <label>倍率成长 (+/级)</label>
              <input v-model.number="editSkill.levelScaling.baseMul" type="number" step="0.1" class="pixel-input" />
            </div>
          </div>

          <!-- 附加效果 -->
          <div class="section">
            <h4>附加效果</h4>
            <div v-for="(eff, i) in editSkill.effects" :key="i" class="effect-row">
              <select v-model="eff.type" class="pixel-input small">
                <option value="lifesteal">吸血</option>
                <option value="mpDrain">吸蓝</option>
                <option value="dot">持续伤害</option>
                <option value="heal">治疗</option>
                <option value="buff">增益</option>
                <option value="debuff">减益</option>
                <option value="shield">护盾</option>
                <option value="freeze">冻结</option>
                <option value="stun">眩晕</option>
                <option value="regen">再生</option>
                <option value="cleanse">净化</option>
                <option value="death">即死</option>
                <option value="reflect">反伤</option>
                <option value="trueDmg">真伤</option>
              </select>
              <input v-model.number="eff.value" type="number" placeholder="值" class="pixel-input micro" />
              <input v-model.number="eff.duration" type="number" placeholder="回合" class="pixel-input micro" />
              <input v-model.number="eff.chance" type="number" placeholder="触发%" class="pixel-input micro" />
              <input v-model="eff.stat" placeholder="属性" class="pixel-input micro" v-if="['buff','debuff'].includes(eff.type)" />
              <input v-model="eff.note" placeholder="备注" class="pixel-input micro" />
              <button class="pixel-btn btn-danger btn-sm" @click="editSkill.effects.splice(i,1)">删除</button>
            </div>
            <button class="pixel-btn btn-sm" @click="editSkill.effects.push({ type: 'buff', value: 0, duration: 0, chance: 100, stat: '' })">添加效果</button>
          </div>

          <!-- 三脚架 -->
          <div class="section">
            <h4>🔺 三角架 (最多3个)</h4>
            <div v-for="(tripod, tIdx) in editSkill.tripods" :key="tIdx" class="tripod-block">
              <div class="row">
                <label>名称</label>
                <input v-model="tripod.name" class="pixel-input" placeholder="槽位名称" />
              </div>
              <div class="row">
                <label>解锁等级</label>
                <input v-model.number="tripod.unlockLevel" type="number" min="1" max="10" class="pixel-input micro" />
              </div>
              <div class="effect-list">
                <div v-for="(eff, eIdx) in tripod.effects" :key="eIdx" class="effect-row">
                  <select v-model="eff.type" class="pixel-input small">
                    <option value="lifesteal">吸血</option>
                    <option value="dot">持续伤害</option>
                    <option value="heal">治疗</option>
                    <option value="buff">增益</option>
                    <option value="debuff">减益</option>
                    <option value="shield">护盾</option>
                    <option value="freeze">冻结</option>
                    <option value="stun">眩晕</option>
                    <option value="extraAction">追加攻击</option>
                    <option value="cleanse">净化</option>
                    <option value="death">即死</option>
                    <option value="reflect">反伤</option>
                    <option value="trueDmg">真伤</option>
                    <option value="dotBurst">毒爆</option>
                  </select>
                  <input v-model.number="eff.value" type="number" placeholder="值" class="pixel-input micro" />
                  <input v-model.number="eff.duration" type="number" placeholder="回合" class="pixel-input micro" />
                  <input v-model.number="eff.chance" type="number" placeholder="触发%" class="pixel-input micro" />
                  <input v-model="eff.stat" placeholder="属性" class="pixel-input micro" v-if="['buff','debuff'].includes(eff.type)" />
                  <input v-model="eff.note" placeholder="备注" class="pixel-input micro" />
                  <button class="pixel-btn btn-danger btn-sm" @click="tripod.effects.splice(eIdx,1)">删除</button>
                </div>
                <button class="pixel-btn btn-sm" @click="tripod.effects.push({ type: 'buff', value: 0, duration: 0, chance: 100, stat: '' })">添加效果</button>
              </div>
              <button class="pixel-btn btn-danger btn-sm" @click="editSkill.tripods.splice(tIdx,1)">删除此槽位</button>
            </div>
            <button
              v-if="editSkill.tripods.length < 3"
              class="pixel-btn btn-sm"
              @click="editSkill.tripods.push({ name: `三角架${editSkill.tripods.length+1}`, unlockLevel: [4,7,10][editSkill.tripods.length], effects: [] })"
            >添加三角架</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="pixel-btn" @click="saveSkill">保存</button>
          <button class="pixel-btn" @click="closeModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../../store/gameStore'

const store = useGameStore()
const showModal = ref(false)
const isNew = ref(false)
const editIndex = ref(-1)

const categories = [
  { key: 'neutral', label: '无属性' },
  { key: 'fire', label: '火' },
  { key: 'water', label: '水' },
  { key: 'thunder', label: '雷' },
  { key: 'wind', label: '风' },
  { key: 'ice', label: '冰' },
  { key: 'rock', label: '岩' },
  { key: 'grass', label: '草' },
  { key: 'steel', label: '钢' },
  { key: 'holy', label: '圣' },
  { key: 'dark', label: '暗' },
  { key: 'poison', label: '毒' }
]
const activeCat = ref('fire')
const saving = ref(false)
const saveMsg = ref('')
const saveOk = ref(true)

const currentSkills = computed(() => {
  const pool = store.config.skillPool || []
  return pool.filter(s => {
    const elem = s.element || 'neutral'
    return elem === activeCat.value
  })
})

function getGlobalIndex(skill) {
  return store.config.skillPool.findIndex(s => s.id === skill.id)
}

function openEdit(skill) {
  const copy = JSON.parse(JSON.stringify(skill))
  if (!copy.levelScaling) copy.levelScaling = { baseMul: 0.1, mpCost: 0 }
  if (!copy.effects) copy.effects = []
  if (!copy.tripods) copy.tripods = []
  Object.assign(editSkill, copy)
  editIndex.value = getGlobalIndex(skill)
  isNew.value = false
  showModal.value = true
}

function createNew() {
  Object.assign(editSkill, defaultSkill())
  editSkill.id = 'skill_' + Date.now()
  editSkill.element = activeCat.value === 'neutral' ? '' : activeCat.value
  editIndex.value = -1
  isNew.value = true
  showModal.value = true
}

function saveSkill() {
  if (!editSkill.name.trim()) return
  const data = JSON.parse(JSON.stringify(editSkill))
  if (isNew.value) {
    store.config.skillPool.push(data)
  } else {
    store.config.skillPool[editIndex.value] = data
  }
  store.save()
  showModal.value = false
}

function removeSkill(skill) {
  if (!confirm('确认删除该技能？')) return
  const idx = getGlobalIndex(skill)
  if (idx !== -1) {
    store.config.skillPool.splice(idx, 1)
    store.save()
  }
}

function closeModal() {
  showModal.value = false
}

async function saveToServer() {
  saving.value = true
  saveMsg.value = ''
  try {
    const data = currentSkills.value
    const pack = 'default' // 可根据需要切换
    const filename = activeCat.value === 'neutral'
      ? `${pack}/skills/_neutral.json`
      : `${pack}/skills/_${activeCat.value}.json`

    const response = await fetch('http://localhost:3002/api/admin/save-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-secret-token'
      },
      body: JSON.stringify({ filename, data })
    })

    const result = await response.json()
    if (result.success) {
      saveMsg.value = `✅ 已保存到 ${filename}，刷新游戏后生效`
      saveOk.value = true
    } else {
      saveMsg.value = '❌ ' + (result.error || '保存失败')
      saveOk.value = false
    }
  } catch (e) {
    saveMsg.value = '❌ 无法连接后端服务，请确认 admin-api 已启动'
    saveOk.value = false
  } finally {
    saving.value = false
  }
}

function exportSkills() {
  navigator.clipboard.writeText(JSON.stringify(currentSkills.value, null, 2))
  window.showToast?.('已复制到剪贴板') || alert('已复制到剪贴板')
}

function importSkills() {
  const json = prompt('粘贴技能 JSON（将替换当前分类）:')
  if (!json) return
  try {
    const data = JSON.parse(json)
    if (!Array.isArray(data)) {
      window.showToast?.('必须是数组格式') || alert('必须是数组格式')
      return
    }
    const otherSkills = store.config.skillPool.filter(s => {
      const elem = s.element || 'neutral'
      return elem !== activeCat.value
    })
    store.config.skillPool = [...otherSkills, ...data]
    store.save()
    window.showToast?.('导入成功') || alert('导入成功')
  } catch (e) {
    window.showToast?.('JSON 格式错误') || alert('JSON 格式错误')
  }
}

const defaultSkill = () => ({
  id: '',
  name: '',
  desc: '',
  icon: 'mdi:sword',
  type: 'active',
  target: 'single',
  element: '',
  mpCost: 0,
  baseMul: 1.0,
  maxLevel: 10,
  upgradeCost: 2,
  learnCost: 0,
  levelScaling: { baseMul: 0.1 },
  effects: [],
  tripods: []
})

const editSkill = reactive(defaultSkill())

function getTypeLabel(t) {
  const map = { active: '主动', passive: '被动', reaction: '反应' }
  return map[t] || t
}
function getTargetLabel(t) {
  const map = { single: '单体', aoe: '全体', self: '自身', ally: '队友' }
  return map[t] || t
}
function getElementLabel(e) {
  const map = { fire: '火', water: '水', thunder: '雷', wind: '风', grass: '草', ice: '冰', holy: '圣', dark: '暗', rock: '岩', steel: '钢' ,poison: '毒' }
  return map[e] || e
}
</script>

<style scoped>
.dev-skills { padding: 12px; position: relative; }
.hint { font-size: 11px; color: #b89aa5; margin-bottom: 12px; }
.skill-list { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; }
.skill-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px; background: rgba(255,255,255,0.06); border-radius: 14px;
  border: 1px solid rgba(200, 170, 130, 0.2); cursor: pointer;
  transition: background 0.2s;
}
.skill-item:hover { background: rgba(255,215,0,0.08); }
.skill-icon { font-size: 28px; color: #f0c8a0; flex-shrink: 0; }
.skill-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.skill-meta { font-size: 10px; color: #b89aa5; }
.skill-actions { display: flex; gap: 6px; }
.btn-sm { padding: 6px 14px; font-size: 11px; border-radius: 14px; white-space: nowrap; }
.btn-danger { background: #4a1a1a; border-color: #8a3a3a; color: #fcc; }
.btn-danger:hover { background: #6a2a2a; }
.bottom-actions { display: flex; gap: 10px; margin-top: 15px; }

/* 弹窗 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
  display: flex; justify-content: center; align-items: center; z-index: 500;
}
.modal-content {
  width: 600px; max-width: 90vw; max-height: 85vh; overflow-y: auto;
  padding: 24px; position: relative;
}
.close-btn { position: absolute; top: 12px; right: 12px; background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer; }
.modal-body { margin: 15px 0; }
.row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 10px; }
.row label { width: 90px; text-align: right; flex-shrink: 0; }
.pixel-input {
  background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd;
  padding: 6px 10px; font-family: 'Press Start 2P'; font-size: 9px; flex: 1; border-radius: 6px;
}
.pixel-input.small { max-width: 100px; }
.pixel-input.micro { max-width: 70px; }
.section { margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,215,0,0.2); }
.section h4 { font-size: 11px; margin-bottom: 10px; color: #ffd700; }
.effect-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
.tripod-block {
  background: rgba(0,0,0,0.3); border: 1px solid rgba(255,215,0,0.2);
  border-radius: 8px; padding: 10px; margin-bottom: 10px;
}
.modal-footer { display: flex; gap: 12px; justify-content: flex-end; margin-top: 15px; }

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.category-tabs .btn-sm {
  font-size: 9px;
  padding: 4px 10px;
}
.category-tabs .btn-sm.active {
  background: rgba(255, 215, 0, 0.3);
  border-color: #ffd700;
}
.msg-ok { color: #4caf50; font-size: 10px; margin-top: 8px; }
.msg-err { color: #f44336; font-size: 10px; margin-top: 8px; }
</style>