<template>
  <div class="dialog-overlay" v-if="visible" @click="nextDialog">
    <!-- 角色立绘 - 左侧大尺寸 -->
    <div
      v-if="currentSpeaker"
      class="speaker-container"
      :class="speakerPosition === 'right' ? 'speaker-right' : 'speaker-left'"
    >
      <img v-if="speakerImage" :src="speakerImage" class="speaker-img" />
      <Icon v-else :icon="speakerIcon" class="speaker-icon" />
    </div>

    <!-- 对话框 -->
    <div class="dialog-box">
      <div class="dialog-content">
        <p class="dialog-text">{{ currentNode?.text || '...' }}</p>
        <div v-if="currentChoices.length" class="dialog-choices">
          <button
            v-for="(choice, idx) in currentChoices"
            :key="idx"
            class="pixel-btn choice-btn"
            @click.stop="selectChoice(idx)"
          >
            {{ choice.text }}
          </button>
        </div>
      </div>
      <div class="dialog-indicator" v-if="!currentChoices.length">
        点击任意处继续
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { defaultCharacters } from '../config/characters'
const emit = defineEmits(['close', 'update'])
const store = useGameStore()
const visible = ref(false)
const currentNodeId = ref('start')
const currentNode = computed(() => store.config.storyScript[currentNodeId.value] || null)

const currentChoices = computed(() => currentNode.value?.choices || [])
const currentSpeaker = computed(() => currentNode.value?.speaker || null)
const speakerPosition = computed(() => currentNode.value?.speakerPosition || 'left')
const speakerData = computed(() => (currentSpeaker.value ? defaultCharacters[currentSpeaker.value] : null))
const speakerIcon = computed(() => speakerData.value?.icon || 'mdi:account')
// 同步读取立绘（从 store.config.customImages）
const speakerImage = computed(() => {
  if (!currentSpeaker.value) return null
  return store.config?.customImages?.[currentSpeaker.value] || null
})

function startScene(nodeId = 'start') {
  currentNodeId.value = nodeId
  visible.value = true
}

function nextDialog() {
  if (currentChoices.value.length > 0) return
  const node = currentNode.value
  if (!node) {
    closeDialog()
    return
  }
  if (node.nextId) {
    currentNodeId.value = node.nextId
  } else {
    closeDialog()
  }
}

function selectChoice(idx) {
  const choice = currentChoices.value[idx]
  if (!choice) return
  if (choice.nextId) {
    currentNodeId.value = choice.nextId
  } else {
    closeDialog()
  }
}

function closeDialog() {
  visible.value = false
  emit('close')   // ← 添加这一行，通知父组件对话框已关闭
}
defineExpose({ startScene })
</script>

<style scoped>
/* 覆盖层 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(250, 240, 242, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 300;
  cursor: pointer;
}

/* 立绘容器：左侧大尺寸，底部留空给对话框 */
.speaker-container {
  position: absolute;
  top: 5%;
  left: 0;
  width: 50vw;
  height: 65vh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.speaker-right {
  left: auto;
  right: 0;
}

.speaker-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.speaker-icon {
  font-size: min(40vw, 300px);
  color: #d87292;
  filter: drop-shadow(0 6px 15px rgba(220, 100, 140, 0.5));
}

/* 对话框 */
.dialog-box {
  width: 90%;
  max-width: 600px;
  margin-bottom: 30px;
  padding: 24px 28px;
  background: rgba(255, 252, 252, 0.92);
  border: 1px solid #f0c8d4;
  border-radius: 24px;
  box-shadow: 0 8px 25px rgba(220, 140, 160, 0.25);
  color: #2c1a3a;
  font-family: 'Press Start 2P', cursive;
  position: relative;
  z-index: 100;
}

.dialog-text {
  font-size: 13px;
  line-height: 1.9;
  margin-bottom: 22px;
  color: #2c1a3a;
}

.dialog-choices {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.choice-btn {
  background: #ffffff;
  border: 1px solid #e0a0b0;
  color: #4a2a3a;
  padding: 10px 18px;
  font-size: 10px;
  border-radius: 18px;
  transition: all 0.2s;
}

.choice-btn:hover {
  background: #ffe0e8;
}

.dialog-indicator {
  text-align: right;
  font-size: 8px;
  color: #b89aa5;
  margin-top: 10px;
}
</style>