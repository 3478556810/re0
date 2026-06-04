<template>
  <div class="dialog-overlay" v-if="visible" @click="handleOverlayClick">
    <!-- 背景图（清晰） -->
 <!-- 当前背景（淡出） -->
<div class="dialog-background current" :style="currentBgStyle"></div>
<!-- 下一个背景（预加载后淡入） -->
<div class="dialog-background next" :class="{ active: bgTransitioning }" :style="nextBgStyle"></div>

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

watch(currentPortrait, (portrait) => {
  speakerImage.value = portrait ? `/images/portrait/${portrait}.png` : null
}, { immediate: true })

const showChoices = computed(() => currentChoices.value.length > 0 && !isTyping.value)
const currentBg = ref('')
const nextBg = ref('')
const bgTransitioning = ref(false)

const currentBgStyle = computed(() => ({
  backgroundImage: currentBg.value ? `url('/images/bg/${currentBg.value}')` : 'none'
}))

const nextBgStyle = computed(() => ({
  backgroundImage: nextBg.value ? `url('/images/bg/${nextBg.value}')` : 'none'
}))

// 预加载图片
function preloadImage(name) {
  return new Promise((resolve) => {
    if (!name) return resolve()
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve() // 失败也继续
    img.src = `/images/bg/${name}`
  })
}

// 监听节点变化，平滑切换背景
watch(currentNode, async (newNode) => {
  const newBg = newNode?.background || ''
  if (newBg === currentBg.value) return

  // 预加载新图
  await preloadImage(newBg)

  // 设置下一层背景并开始淡入
  nextBg.value = newBg
  bgTransitioning.value = true

  // 等待过渡完成后，将新层切换为当前层，并关闭过渡状态
  setTimeout(() => {
    currentBg.value = newBg
    bgTransitioning.value = false
    nextBg.value = ''
  }, 600) // 与 CSS transition 时间一致
})
// ========== 音频上下文激活 ==========
function activateAudioContext() {
  const tempAudio = new Audio()
  tempAudio.volume = 0.01
  tempAudio.play().then(() => {
    tempAudio.pause()
    tempAudio.remove()
  }).catch(() => {})
}

// ========== 本地音频播放 ==========
let currentAudio = null

function playVoice(speaker, nodeId) {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  // 跳过旁白
  if (!speaker || speaker === 'narrator' || !nodeId) return

  const voicePath = `/voice/${speaker}_${nodeId}.wav`
  console.log(`🎵 尝试播放语音: ${voicePath}`)
  
  const audio = new Audio(voicePath)
  currentAudio = audio

  audio.onloadeddata = () => {
    console.log(`✅ 语音文件加载成功: ${voicePath}`)
    audio.play().then(() => {
      console.log(`🔊 正在播放: ${voicePath}`)
    }).catch(e => {
      console.warn(`❌ 播放失败: ${voicePath}`, e)
    })
  }

  audio.onended = () => {
    currentAudio = null
    console.log(`⏹️ 语音播放结束: ${voicePath}`)
    if (autoPlay.value && currentChoices.value.length === 0) {
      autoPlayTimer.value = setTimeout(() => nextDialog(), 300)
    }
  }

  audio.onerror = () => {
    console.warn(`🚫 语音文件不存在或无法加载: ${voicePath}`)
    currentAudio = null
  }
}

function stopVoice() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

// ========== 打字机 + 自动播放 ==========
watch(currentNodeId, () => startTyping())

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

  

  // 只给有说话人的节点播放语音（旁白跳过）
  const speaker = currentSpeaker.value
  if (speaker && speaker !== 'narrator') {
    const nodeId = currentNode.value?.id || ''
    if (nodeId) playVoice(speaker, nodeId)
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
  // 如果没有语音文件（旁白或语音缺失），自动跳转
  if (autoPlay.value && currentChoices.value.length === 0 && !currentAudio) {
    autoPlayTimer.value = setTimeout(() => nextDialog(), 1500)
  }
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
import { inject } from 'vue'
const showConfirm = inject('showConfirm', (msg) => Promise.resolve(confirm(msg)))
// ========== 选择选项 ==========
function selectChoice(idx) {
  const choice = currentChoices.value[idx]
  if (!choice) return

  if (choice.affection) store.applyAffection(choice.affection)
  if (choice.keyChoice && !showConfirm('这个选择会影响后续剧情，确定吗？')) return

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
  activateAudioContext()
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
  background: #000;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 300;
  cursor: pointer;
  overflow: visible;
  
  /* 彻底消除移动端点击高亮和透明遮罩 */
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  outline: none;
}

/* 背景图（清晰无模糊） */
.dialog-background {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: opacity 1s ease;   /* 核心：1秒渐变 */
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


.dialog-background,
.dialog-background-next {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 1;
}

.dialog-background-next {
  opacity: 0;
  transition: opacity 0.6s ease;
}

.dialog-background-next.active {
  opacity: 1;
}

.dialog-background {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.dialog-background.current {
  opacity: 1;
  transition: opacity 0.6s ease;
}

.dialog-background.next {
  opacity: 0;
  transition: opacity 0.6s ease;
}

.dialog-background.next.active {
  opacity: 1;
}

.dialog-box,
.floating-choices {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}
</style>