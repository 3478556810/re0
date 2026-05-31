<template>
  <div class="dialog-overlay" v-if="visible" @click="handleOverlayClick">
    <!-- 背景图（清晰） -->
    <div
      class="dialog-background"
      :style="{
        backgroundImage: currentNode?.background
          ? `url('/images/bg/${currentNode.background}')`
          : 'none'
      }"
    ></div>

    <!-- 立绘（基于 portrait 字段显示） -->
    <Transition name="speaker-fade">
      <div
        v-if="currentPortrait"
        class="speaker-container"
        :class="speakerPosition === 'right' ? 'speaker-right' : 'speaker-left'"
        :key="currentPortrait"
      >
        <img v-if="speakerImage" :src="speakerImage" class="speaker-img" @error="speakerImage = null" />
        <Icon v-else :icon="speakerIcon" class="speaker-icon" />
      </div>
    </Transition>

    <!-- 对话框（半透明黑底） -->
    <div class="dialog-box">
      <div class="dialog-header">
        <span v-if="currentSpeaker" class="speaker-name">{{ speakerData?.name || currentSpeaker }}</span>
        <span v-else class="speaker-name">旁白</span>
        <div class="header-buttons">
          <button class="auto-btn" :class="{ active: autoPlay }" @click.stop="toggleAutoPlay">
            <Icon :icon="autoPlay ? 'mdi:stop' : 'mdi:play'" />
            {{ autoPlay ? '停止' : '自动' }}
          </button>
          <button class="skip-btn" @click.stop="skipToChoices">
            <Icon icon="mdi:close" /> 跳过
          </button>
        </div>
      </div>

      <div class="dialog-text-area">
        <p class="dialog-text">{{ displayedText }}<span v-if="isTyping" class="typing-cursor">|</span></p>
      </div>

      <div class="dialog-indicator" v-if="!showChoices && !isTyping && !autoPlay">
        <span>点击任意处继续</span>
        <Icon icon="mdi:gesture-tap" class="tap-icon" />
      </div>
    </div>

    <!-- 选项：独立浮层，在对话框上方 -->
    <div v-if="showChoices" class="floating-choices">
      <button
        v-for="(choice, idx) in currentChoices"
        :key="idx"
        class="pixel-btn choice-btn"
        :class="{ 'key-choice': choice.keyChoice }"
        @click.stop="selectChoice(idx)"
      >
        {{ choice.text }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { defaultCharacters } from '../config/characters'

const emit = defineEmits(['close', 'update', 'startBattle'])
const store = useGameStore()

// ========== 基础状态 ==========
const visible = ref(false)
const currentNodeId = ref('start')
const isTyping = ref(false)
const displayedText = ref('')
const typingTimer = ref(null)
const autoPlay = ref(false)
const autoPlayTimer = ref(null)

// ========== 当前节点信息 ==========
const currentNode = computed(() => store.config.storyScript[currentNodeId.value] || null)
const currentChoices = computed(() => currentNode.value?.choices || [])
const currentSpeaker = computed(() => currentNode.value?.speaker || null)
const currentPortrait = computed(() => currentNode.value?.portrait || null)
const speakerPosition = computed(() => currentNode.value?.speakerPosition || 'left')

const speakerData = computed(() => (currentSpeaker.value ? defaultCharacters[currentSpeaker.value] : null))
const speakerIcon = computed(() => speakerData.value?.icon || 'mdi:account')
const speakerImage = ref(null)

// 加载立绘
watch(currentPortrait, (portrait) => {
  speakerImage.value = portrait ? `/images/portrait/${portrait}.png` : null
}, { immediate: true })

const showChoices = computed(() => currentChoices.value.length > 0 && !isTyping.value)

// ========== 本地音频播放（日语配音） ==========
let currentAudio = null

function playVoice(speaker, nodeId) {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if (!speaker || !nodeId) return

  const voicePath = `/voice/${speaker}_${nodeId}.wav`
  const audio = new Audio(voicePath)
  currentAudio = audio

  audio.onended = () => {
    currentAudio = null
    // 自动播放且无选项时，语音结束后自动下一句
    if (autoPlay.value && currentChoices.value.length === 0) {
      autoPlayTimer.value = setTimeout(() => nextDialog(), 300)
    }
  }
  audio.onerror = () => {
    currentAudio = null
    // 文件不存在时静默，不影响游戏
  }
  audio.play().catch(() => {})
}

function stopVoice() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

// ========== 打字机 + 自动播放 ==========
watch(currentNodeId, () => startTyping())

// 播放语音（跳过旁白）
function startTyping() {
  if (!currentNode.value) {
    store.pendingStoryNodeAfterBattle = null
    closeDialog()
    return
  }
  if (typingTimer.value) clearTimeout(typingTimer.value)
  if (autoPlayTimer.value) clearTimeout(autoPlayTimer.value)

  const fullText = currentNode.value?.text || '...'
  displayedText.value = ''
  isTyping.value = true

  // 背景过渡
  const bgEl = document.querySelector('.dialog-background')
  if (bgEl) {
    bgEl.style.opacity = '0.6'
    setTimeout(() => { bgEl.style.opacity = '1' }, 150)
  }

  // 播放当前节点的日语配音（speaker + nodeId）
 const speaker = currentSpeaker.value
  if (speaker && speaker !== 'narrator') {
    const nodeId = currentNode.value?.id || ''
    playVoice(speaker, nodeId)
  }

  let index = 0
  const speed = 25
  const typeNext = () => {
    if (index < fullText.length) {
      displayedText.value += fullText.charAt(index)
      index++
      typingTimer.value = setTimeout(typeNext, speed)
    } else {
      isTyping.value = false
      // 如果没有自动播放、且语音已结束，这里不需额外处理（语音回调会处理）
    }
  }
  typeNext()
}

// ========== 自动播放按钮 ==========
function toggleAutoPlay() {
  autoPlay.value = !autoPlay.value
  if (!autoPlay.value && autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
  if (autoPlay.value && !isTyping.value && currentChoices.value.length === 0) {
    autoPlayTimer.value = setTimeout(() => nextDialog(), 300)
  }
}

// ========== 点击对话框 ==========
function handleOverlayClick(event) {
  if (event.target.closest('.skip-btn') || event.target.closest('.choice-btn') || event.target.closest('.auto-btn')) return
  if (showChoices.value) return

  if (isTyping.value) {
    finishTyping()
    return
  }
  nextDialog()
}

// ========== 完成打字 ==========
function finishTyping() {
  if (typingTimer.value) clearTimeout(typingTimer.value)
  displayedText.value = currentNode.value?.text || '...'
  isTyping.value = false

  if (autoPlay.value && currentChoices.value.length === 0) {
    autoPlayTimer.value = setTimeout(() => nextDialog(), 1500)
  }
}

// ========== 下一句 ==========
function nextDialog() {
  stopVoice()
  if (autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
  const node = currentNode.value
  if (!node) return closeDialog()
  const next = node.nextId || node.next
  if (next) {
    currentNodeId.value = next
  } else {
    closeDialog()
  }
}

// ========== 选择选项 ==========
function selectChoice(idx) {
  const choice = currentChoices.value[idx]
  if (!choice) return

  if (choice.affection) store.applyAffection(choice.affection)

  if (choice.keyChoice && !confirm('这个选择会影响后续剧情，确定吗？')) return

  // 触发剧情战斗
  if (choice.battle) {
    emit('startBattle', choice.battle, currentNodeId.value, choice.nextId)
    closeDialog()
    return
  }

  const next = choice.nextId || choice.next
  if (next) currentNodeId.value = next
  else closeDialog()
}

// ========== 关闭对话框 ==========
function closeDialog() {
  stopVoice()
  if (autoPlayTimer.value) clearTimeout(autoPlayTimer.value)
  autoPlay.value = false
  visible.value = false
  emit('close')
}

// ========== 跳过到选项 ==========
function skipToChoices() {
  if (currentChoices.value.length > 0) {
    finishTyping()
    return
  }

  let node = currentNode.value
  let safety = 0
  while (node && !node.choices && node.nextId && safety < 50) {
    safety++
    currentNodeId.value = node.nextId
    node = store.config.storyScript[node.nextId]
  }

  if (node && node.choices) {
    finishTyping()
    return
  }
  closeDialog()
}

// ========== 外部调用入口 ==========
function startScene(nodeId = 'start') {
  currentNodeId.value = nodeId
  visible.value = true
  startTyping()
}

defineExpose({ startScene })
</script>

<style scoped>
/* ========== 整体覆盖层 ========== */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 10, 30, 0.6);   /* 去掉 blur，仅保留半透明遮罩 */
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 300;
  cursor: pointer;
  overflow: visible;
}

/* 背景图（清晰无模糊） */
.dialog-background {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 1;
  transition: opacity 0.6s ease;    /* 加上这行 */
}

/* ========== 立绘容器（加大尺寸） ========== */
.speaker-container {
  position: absolute;
  bottom: 28vh;
  height: 70vh;           /* 固定高度，宽度由图片比例自动决定 */
  max-height: 85vh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
  z-index: 150;
  overflow: visible;      /* 不裁剪 */
}

.speaker-img {
  height: 100%;           /* 撑满容器高度 */
  width: auto;            /* 宽度自动，保持原图比例 */
  max-width: none;        /* 不限制最大宽度 */
  filter: drop-shadow(0 0 25px rgba(255, 200, 220, 0.4));
}

.speaker-left {
  left: 5%;               /* 画面左侧 5% 处 */
}
.speaker-right {
  right: 5%;              /* 画面右侧 5% 处 */
}


.speaker-icon {
  font-size: min(40vw, 350px);
  color: #d87292;
  opacity: 0.8;
  filter: drop-shadow(0 6px 15px rgba(220, 100, 140, 0.5));
}

/* 立绘淡入淡出 */
.speaker-fade-enter-active,
.speaker-fade-leave-active {
  transition: opacity 0.4s ease;
}
.speaker-fade-enter-from,
.speaker-fade-leave-to {
  opacity: 0;
}

/* ========== 对话框（半透明黑底） ========== */
.dialog-box {
  width: 650px;
  max-width: 90vw;
  height: 180px;          /* 固定高度 */
  margin-bottom: 30px;
  padding: 18px 24px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 100;
  color: #fff;
  font-family: 'Press Start 2P', cursive;
  overflow: hidden;       /* 防止内容溢出 */
}
/* 头部 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px dashed rgba(255,255,255,0.2);
  padding-bottom: 6px;
}

.speaker-name {
  font-size: 11px;
  font-weight: bold;
  color: #ffd700;                      /* 金色名字 */
  letter-spacing: 1px;
}

.header-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.skip-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.6);
  font-size: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  transition: background 0.2s;
}
.skip-btn:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.auto-btn {
  background: none;
  border: 1px solid #d87292;
  color: #d87292;
  font-size: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
}
.auto-btn.active {
  background: rgba(216, 114, 146, 0.3);
  color: #fff;
}

/* 文本 */
.dialog-text-area {
  min-height: 40px;
  display: flex;
  align-items: flex-start;
}

.dialog-text {
  font-size: 18px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #fff;                         /* 白色文字 */
}

.typing-cursor {
  font-size: 12px;
  color: #d87292;
  animation: blink 0.8s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 选项 */
.dialog-choices {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.choice-btn {
  min-width: 280px;
  max-width: 90vw;
  padding: 14px 24px;
  font-size: 14px;
  text-align: center;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  border-radius: 18px;
  transition: all 0.2s;
  cursor: pointer;
  font-family: 'Press Start 2P', cursive;
  white-space: nowrap;
}
.choice-btn:hover {
  background: rgba(255,255,255,0.3);
  border-color: #ffd700;
}

/* 继续指示器 */
.dialog-indicator {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 10px;
  font-size: 8px;
  color: rgba(255,255,255,0.6);
}

.tap-icon {
  font-size: 12px;
}
.floating-choices {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  z-index: 200;
}






.key-choice {
  border-color: #ffd700 !important;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
  animation: keyGlow 2s infinite alternate;
}

@keyframes keyGlow {
  from { box-shadow: 0 0 8px rgba(255, 215, 0, 0.3); }
  to { box-shadow: 0 0 16px rgba(255, 215, 0, 0.6); }
}
</style>