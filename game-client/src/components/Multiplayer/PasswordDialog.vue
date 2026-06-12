<template>
  <div v-if="visible" class="modal-mask" @click.self="$emit('update:visible', false)">
    <div class="modal-panel small">
      <h3><Icon icon="mdi:lock" /> 输入房间密码</h3>
      <input v-model="password" type="password" class="pixel-input" placeholder="请输入密码" @keyup.enter="submit" />
      <div class="modal-actions">
        <button class="pixel-btn primary" @click="submit">
          <Icon icon="mdi:check" /> 进入
        </button>
        <button class="pixel-btn" @click="$emit('update:visible', false)">
          <Icon icon="mdi:close" /> 取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['update:visible', 'confirm'])
const password = ref('')

function submit() {
  emit('confirm', password.value)
  password.value = ''
  emit('update:visible', false)
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 400;
}
.modal-panel {
  background: rgba(15,25,45,0.98);
  border: 2px solid #b89a6a;
  border-radius: 16px;
  padding: 24px;
  min-width: 300px;
  max-width: 90vw;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
}
.modal-panel h3 {
  font-size: 12px;
  color: #ffd700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.pixel-input {
  width: 100%;
  padding: 8px 12px;
  background: #1a1a2e;
  border: 2px solid #5a5a7a;
  border-radius: 8px;
  color: #fff;
  font-family: inherit;
  font-size: 9px;
  margin-bottom: 16px;
  box-sizing: border-box;
}
.pixel-input:focus { border-color: #ffd700; outline: none; }
.modal-actions { display: flex; gap: 10px; justify-content: center; }
.pixel-btn {
  background: #2a2a3a; border: 2px solid #b89a6a; color: #ffd;
  padding: 8px 16px; font-size: 9px; cursor: pointer; border-radius: 8px;
  display: flex; align-items: center; gap: 4px; transition: 0.2s;
}
.pixel-btn:hover { background: #3a3a5a; }
.pixel-btn.primary { background: rgba(255,215,0,0.15); border-color: #ffd700; }
</style>