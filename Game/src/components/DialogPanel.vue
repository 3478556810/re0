<template>
  <!-- 对话框覆盖层 -->
  <div class="dialog-overlay" v-if="visible" @click="handleOverlayClick">
    <!-- 背景场景（可选，以后可传入背景图） -->
    <div class="dialog-background"></div>

    <!-- 角色立绘区域 - 左侧/右侧 -->
    <Transition name="speaker-fade">
      <div
        v-if="currentSpeaker"
        class="speaker-container"
        :class="speakerPosition === 'right' ? 'speaker-right' : 'speaker-left'"
        :key="currentSpeaker"
      >
        <img v-if="speakerImage" :src="speakerImage" class="speaker-img" />
        <Icon v-else :icon="speakerIcon" class="speaker-icon" />
      </div>
    </Transition>

    <!-- 主对话框 -->
    <div class="dialog-box" >
      <!-- 说话者名字 + 跳过按钮 -->
      <div class="dialog-header">
        <span v-if="currentSpeaker" class="speaker-name">{{ speakerData?.name || '???' }}</span>
        <span v-else class="speaker-name">旁白</span>
        <button class="skip-btn" @click="closeDialog">
          <Icon icon="mdi:close" /> 跳过
        </button>
      </div>

      <!-- 对话文本区域（支持打字机效果） -->
      <div class="dialog-text-area">
        <p class="dialog-text">{{ displayedText }}</p>
        <span v-if="isTyping" class="typing-cursor">|</span>
      </div>

      <!-- 选项分支 -->
      <div v-if="showChoices" class="dialog-choices">
        <button
          v-for="(choice, idx) in currentChoices"
          :key="idx"
          class="pixel-btn choice-btn"
          @click.stop="selectChoice(idx)"
        >
          {{ choice.text }}
        </button>
      </div>

      <!-- 继续指示器（无选项且打字完成时） -->
      <div class="dialog-indicator" v-if="!showChoices && !isTyping">
        <span>点击任意处继续</span>
        <Icon icon="mdi:gesture-tap" class="tap-icon" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { defaultCharacters } from '../config/characters'

const emit = defineEmits(['close', 'update'])
const store = useGameStore()

// ─── 状态定义 ───
const visible = ref(false)
const currentNodeId = ref('start')
const isTyping = ref(false)           // 正在逐字显示
const displayedText = ref('')         // 当前展示的文本（部分或全部）
const typingTimer = ref(null)

// ─── 当前节点数据 ───
const currentNode = computed(() => store.config.storyScript[currentNodeId.value] || null)
const currentChoices = computed(() => currentNode.value?.choices || [])
const currentSpeaker = computed(() => currentNode.value?.speaker || null)
const speakerPosition = computed(() => currentNode.value?.speakerPosition || 'left')

// 角色信息
const speakerData = computed(() => (currentSpeaker.value ? defaultCharacters[currentSpeaker.value] : null))
const speakerIcon = computed(() => speakerData.value?.icon || 'mdi:account')
const speakerImage = computed(() => {
  if (!currentSpeaker.value) return null
  return store.config?.customImages?.[currentSpeaker.value] || null
})

// 是否显示选项（必须在打字完成后才显示）
const showChoices = computed(() => {
  return currentChoices.value.length > 0 && !isTyping.value
})

// ─── 节点切换时启动打字机 ───
watch(currentNodeId, () => {
  startTyping()
})

// ─── 打字机效果 ───
function startTyping() {
  if (typingTimer.value) clearTimeout(typingTimer.value)

  const fullText = currentNode.value?.text || '...'
  displayedText.value = ''
  isTyping.value = true

  let index = 0
  const speed = 30 // 每字间隔 ms

  const typeNext = () => {
    if (index < fullText.length) {
      displayedText.value += fullText.charAt(index)
      index++
      typingTimer.value = setTimeout(typeNext, speed)
    } else {
      isTyping.value = false
    }
  }
  typeNext()
}

// ─── 交互逻辑 ───
function handleOverlayClick(event) {
  // 如果点击的是选项按钮，不处理（由按钮自身的事件处理）
  if (event.target.closest('.choice-btn') || event.target.closest('.skip-btn')) return

  if (showChoices.value) return

  if (isTyping.value) {
    finishTyping()
    return
  }
  nextDialog()
}
function finishTyping() {
  if (typingTimer.value) clearTimeout(typingTimer.value)
  displayedText.value = currentNode.value?.text || '...'
  isTyping.value = false
}

function nextDialog() {
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
  emit('close')
}

// ─── 对外暴露开始接口 ───
function startScene(nodeId = 'start') {
  currentNodeId.value = nodeId
  visible.value = true
  // 重置并开始打字
  startTyping()
}

defineExpose({ startScene })
</script>

<style scoped>
/* ========== 整体覆盖层 ========== */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 10, 30, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 300;
  cursor: pointer;
  overflow: hidden;
}

/* 背景层（可之后扩展为场景图） */
.dialog-background {
  position: absolute;
  inset: 0;
  z-index: -1;
}

/* ========== 立绘容器 ========== */
.speaker-container {
  position: absolute;
    bottom: 38vh;                 /* 对话框预留高度，立绘不会沉到底部 */
  top: auto;
  
  width: 25vw;                  /* 宽度增大，更显眼 */
  height: auto;
  max-height: calc(100vh - 180px);  /* 不超过对话框上方空间 */
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
  z-index: 150;
  overflow: hidden;         /* 防止超出 */
}

.speaker-left {
  left: 20%;
}
.speaker-right {
  right: 0;
}

.speaker-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom;
  /* 可添加轻微阴影强化立体感 */
  filter: drop-shadow(0 0 20px rgba(255, 200, 220, 0.3));
}

.speaker-icon {
  font-size: min(55vw, 450px);   /* 图标也相应增大 */
  color: #d87292;
  opacity: 0.8;
  filter: drop-shadow(0 6px 15px rgba(220, 100, 140, 0.5));
}


/* 立绘淡入淡出动画 */
.speaker-fade-enter-active,
.speaker-fade-leave-active {
  transition: opacity 0.4s ease;
}
.speaker-fade-enter-from,
.speaker-fade-leave-to {
  opacity: 0;
}

/* ========== 对话框 ========== */
.dialog-box {
  width: 88%;
  max-width: 700px;
  margin-bottom: 35px;
  padding: 20px 28px;
  background: rgba(255, 248, 252, 0.92);
  border: 1px solid #f0c8d4;
  border-radius: 28px;
  box-shadow: 0 10px 30px rgba(180, 100, 120, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 100;
  color: #2c1a3a;
  font-family: 'Press Start 2P', cursive;
}

/* 对话框头部：名字 + 跳过按钮 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px dashed #eacdd2;
  padding-bottom: 8px;
}
.speaker-name {
  font-size: 12px;
  font-weight: bold;
  color: #9c4d6a;
  letter-spacing: 1px;
}
.skip-btn {
  background: none;
  border: none;
  color: #b89aa5;
  font-size: 9px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  transition: background 0.2s;
}
.skip-btn:hover {
  background: rgba(200, 100, 130, 0.1);
}

/* 文本区域 */
.dialog-text-area {
  min-height: 60px;
  display: flex;
  align-items: flex-start;
}
.dialog-text {
  font-size: 13px;
  line-height: 2;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.typing-cursor {
  font-size: 13px;
  color: #d87292;
  animation: blink 0.8s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 选项按钮 */
.dialog-choices {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.choice-btn {
  background: #ffffff;
  border: 1px solid #e0a0b0;
  color: #4a2a3a;
  padding: 10px 20px;
  font-size: 10px;
  border-radius: 20px;
  transition: all 0.2s;
  cursor: pointer;
}
.choice-btn:hover {
  background: #ffe0e8;
  border-color: #d87292;
}

/* 继续指示器 */
.dialog-indicator {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 12px;
  font-size: 9px;
  color: #b89aa5;
}
.tap-icon {
  font-size: 14px;
}

/* ========== 移动端适配 ========== */
/* 手机横屏适配（宽度 ≤ 900px，高度 ≤ 500px 的典型横屏手机） */
/* 手机横屏适配（宽度 ≤ 900px，高度 ≤ 500px） */
@media (max-width: 900px) and (max-height: 500px) {
  /* 立绘进一步缩小并抬高 */
  .speaker-container {
    width: 30vw !important;
    height: 60vh !important;
    bottom: 80px !important;
  }
  .speaker-img {
    max-height: 50vh;
  }
  .speaker-icon {
    font-size: 20vw !important;
  }

  /* 对话框大幅缩小 */
  .dialog-box {
    width: 92% !important;
    max-width: 400px !important;
    max-height: 18vh !important;
    padding: 8px 12px !important;
    margin-bottom: 6px !important;
    border-radius: 16px !important;
  }

  /* 文字缩小 */
  .dialog-text {
    font-size: 9px !important;
    line-height: 1.4 !important;
    margin-bottom: 8px !important;
  }

  /* 说话者名字 */
  .dialog-header .speaker-name {
    font-size: 8px !important;
  }

  /* 跳过按钮 */
  .skip-btn {
    font-size: 7px !important;
    padding: 2px 6px !important;
  }

  /* 继续指示器 */
  .dialog-indicator {
    font-size: 7px !important;
    margin-top: 4px !important;
  }
}
</style>