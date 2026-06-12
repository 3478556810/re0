<template>
  <div v-if="visible" class="modal-mask" @click.self="$emit('update:visible', false)">
    <div class="modal-panel">
      <h3><Icon icon="mdi:plus-circle" /> 创建房间</h3>
      <div class="form-item">
        <label>副本</label>
        <select v-model="form.bossId" class="pixel-input">
          <option v-for="boss in bossList" :key="boss.id" :value="boss.id">{{ boss.name }}</option>
        </select>
      </div>
      <div class="form-item">
        <label>人数</label>
        <select v-model="form.maxPlayers" class="pixel-input">
          <option :value="2">2人</option>
          <option :value="3">3人</option>
          <option :value="4">4人</option>
        </select>
      </div>
      <div class="form-item">
        <label>难度</label>
        <div class="radio-group">
          <button
            v-for="diff in difficulties"
            :key="diff.value"
            :class="['radio-btn', { active: form.difficulty === diff.value }]"
            @click="form.difficulty = diff.value"
          >
            {{ diff.label }}
          </button>
        </div>
      </div>
      <div class="form-item">
        <label>密码（可选）</label>
        <input v-model="form.password" type="text" class="pixel-input" placeholder="留空则无密码" />
      </div>
      <div class="form-item">
        <label>最低装等（可选）</label>
        <input v-model.number="form.minGearScore" type="number" class="pixel-input" min="0" placeholder="无限制" />
      </div>
      <div class="modal-actions">
        <button class="pixel-btn primary" @click="submit">
          <Icon icon="mdi:check" /> 创建
        </button>
        <button class="pixel-btn" @click="$emit('update:visible', false)">
          <Icon icon="mdi:close" /> 取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  visible: Boolean,
  bossId: String
})
const emit = defineEmits(['update:visible', 'create'])

const bossList = [
  { id: 'raid_gladiator', name: '角斗士·血斧' },
  { id: 'raid_lava_core', name: '炎核·熔岩巨像' },
  { id: 'raid_bishop', name: '永夜主教' }
]
const difficulties = [
  { label: '普通', value: 'normal' },
  { label: '困难', value: 'hard' },
  { label: '噩梦', value: 'nightmare' }
]

const form = reactive({
  bossId: props.bossId,
  maxPlayers: 2,
  difficulty: 'normal',
  password: '',
  minGearScore: 0
})

function submit() {
  emit('create', { ...form })
  emit('update:visible', false)
  // 重置表单
  form.bossId = props.bossId
  form.maxPlayers = 2
  form.difficulty = 'normal'
  form.password = ''
  form.minGearScore = 0
}
</script>

<style scoped>
/* 复用原弹窗样式，略（已在全局或此处定义） */
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 300; }
.modal-panel { width: 90vw; max-width: 400px; background: rgba(15,25,45,0.98); border: 2px solid #b89a6a; border-radius: 28px; padding: 20px; color: #ffd; font-family: 'Press Start 2P', cursive; }
.modal-panel h3 { font-size: 12px; color: #ffd700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; justify-content: center; }
.form-item { margin-bottom: 14px; }
.form-item label { display: block; font-size: 8px; color: #aaa; margin-bottom: 6px; }
.pixel-input { width: 100%; padding: 8px 10px; background: #1a1a2e; border: 2px solid #5a5a7a; border-radius: 14px; color: #fff; font-family: inherit; font-size: 8px; }
.pixel-input:focus { border-color: #ffd700; outline: none; }
.radio-group { display: flex; gap: 8px; }
.radio-btn { background: #1a1a2e; border: 2px solid #5a5a7a; color: #aaa; padding: 5px 12px; border-radius: 20px; font-size: 7px; cursor: pointer; }
.radio-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd700; }
.modal-actions { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }
.pixel-btn { background: #2a2a3a; border: 2px solid #b89a6a; color: #ffd; padding: 8px 16px; font-size: 8px; cursor: pointer; border-radius: 40px; display: flex; align-items: center; gap: 6px; }
.pixel-btn.primary { background: rgba(255,215,0,0.15); border-color: #ffd700; color: #ffd700; }
</style>