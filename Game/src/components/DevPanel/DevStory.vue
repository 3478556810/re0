<template>
  <div class="section">
    <h3>剧情脚本</h3>
    <textarea v-model="jsonText" class="pixel-textarea" rows="15" placeholder="粘贴 JSON 字符串..."></textarea>
    <div class="actions">
      <button class="pixel-btn" @click="importJson">导入 JSON</button>
      <button class="pixel-btn" @click="exportJson">导出 JSON</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '../../store/gameStore'

const store = useGameStore()
const jsonText = ref(JSON.stringify(store.config.storyScript, null, 2))

function importJson() {
  try {
    const parsed = JSON.parse(jsonText.value)
    store.config.storyScript = parsed
    store.save()
    alert('剧情导入成功！')
  } catch (e) {
    alert('JSON 格式错误: ' + e.message)
  }
}

function exportJson() {
  navigator.clipboard.writeText(jsonText.value)
  alert('已复制到剪贴板')
}
</script>

<style scoped>
.pixel-textarea {
  width: 100%; background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd;
  padding: 10px; font-family: monospace; font-size: 10px; border-radius: 8px;
  resize: vertical; min-height: 200px;
}
.actions { display: flex; gap: 10px; margin-top: 10px; }
</style>