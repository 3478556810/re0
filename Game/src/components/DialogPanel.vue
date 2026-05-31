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


function skipToChoices() {
  // 1. 如果当前节点已经有选项，立刻完成打字显示选项
  if (currentChoices.value.length > 0) {
    finishTyping()
    return
  }

  // 2. 循环跳转，直到找到有选项的节点或到达末尾
  let node = currentNode.value
  let safety = 0  // 防止死循环
  while (node && !node.choices && node.nextId && safety < 50) {
    safety++
    currentNodeId.value = node.nextId
    node = store.config.storyScript[node.nextId]
  }

  // 3. 如果找到了有选项的节点，完成打字
  if (node && node.choices) {
    finishTyping()
    return
  }

  // 4. 没找到选项，关闭对话框
  closeDialog()
}
// 朗读功能（默认开启）
const speechEnabled = ref(true)

let onSpeechEnd = null  // 放在所有 ref 和函数外面，<script setup> 内顶部

function speak(text, callback) {
  if (!text) return
  window.speechSynthesis.cancel()

  if (onSpeechEnd) onSpeechEnd = null

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.9
  utterance.pitch = 1.0

  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => v.name === 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)')
  
  if (preferred) {
    utterance.voice = preferred
  } else {
    // 语音列表未加载，延迟重试
    const retry = () => {
      const retryVoices = window.speechSynthesis.getVoices()
      const retryPreferred = retryVoices.find(v => v.name === 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)')
      if (retryPreferred) utterance.voice = retryPreferred
      window.speechSynthesis.speak(utterance)
    }
    
    if (voices.length === 0) {
      speechSynthesis.onvoiceschanged = () => {
        retry()
        speechSynthesis.onvoiceschanged = null
      }
      return  // 等待语音列表加载完成
    } else {
      const anyChinese = voices.find(v => v.lang.startsWith('zh'))
      if (anyChinese) utterance.voice = anyChinese
    }
  }

  if (callback) {
    onSpeechEnd = callback
    utterance.onend = () => {
      if (onSpeechEnd) {
        const cb = onSpeechEnd
        onSpeechEnd = null
        cb()
      }
    }
  }

  window.speechSynthesis.speak(utterance)
}
const emit = defineEmits(['close', 'update', 'startBattle'])
const store = useGameStore()

const visible = ref(false)
const currentNodeId = ref('start')
const isTyping = ref(false)
const displayedText = ref('')
const typingTimer = ref(null)
const autoPlay = ref(false)
const autoPlayTimer = ref(null)

const currentNode = computed(() => store.config.storyScript[currentNodeId.value] || null)
const currentChoices = computed(() => currentNode.value?.choices || [])
const currentSpeaker = computed(() => currentNode.value?.speaker || null)
const currentPortrait = computed(() => currentNode.value?.portrait || null)
const speakerPosition = computed(() => currentNode.value?.speakerPosition || 'left')

const speakerData = computed(() => (currentSpeaker.value ? defaultCharacters[currentSpeaker.value] : null))
const speakerIcon = computed(() => speakerData.value?.icon || 'mdi:account')
const speakerImage = ref(null)
import { defaultCharacters } from '../config/characters'
import {  onMounted } from 'vue'
const charColors = {
  freyja: '#C4A3D4',
  ain: '#5B8DEF',
  liz: '#F7A8B8',
  sela: '#7EC8A0',
  noel: '#F5E6CA'
}
onMounted(() => {
  // 预加载语音列表
  if ('speechSynthesis' in window) {
    speechSynthesis.getVoices()
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices()
    }
  }
})
function getAffectionColor(charId, val) {
  if (val > 0) return '#4caf50'
  if (val < 0) return '#f44336'
  return charColors[charId] || '#ccc'
}

function getCharName(charId) {
  const char = defaultCharacters[charId]
  return char?.name || charId
}
// 根据 portrait 字段加载立绘
watch(currentPortrait, (portrait) => {
  speakerImage.value = portrait ? `/images/portrait/${portrait}.png` : null
}, { immediate: true })

const showChoices = computed(() => currentChoices.value.length > 0 && !isTyping.value)

watch(currentNodeId, () => startTyping())

// ========== 打字机 ==========
// 修改 startTyping，在打字开始时就朗读整句
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

  // 背景淡出再淡入
  const bgEl = document.querySelector('.dialog-background')
  if (bgEl) {
    bgEl.style.opacity = '0.3'
    setTimeout(() => {
      bgEl.style.opacity = '1'
    }, 200)
  }
 
  if (typingTimer.value) clearTimeout(typingTimer.value)
  if (autoPlayTimer.value) clearTimeout(autoPlayTimer.value)

  displayedText.value = ''
  isTyping.value = true

  // 朗读（如果有语音）
  if (speechEnabled.value) {
    speak(fullText, () => {
      // 语音读完回调：如果开启了自动播放且无选项，自动下一句
      if (autoPlay.value && currentChoices.value.length === 0) {
        autoPlayTimer.value = setTimeout(() => nextDialog(), 300)
      }
    })
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
      // 如果没有语音，打字完成后按原来的自动跳转逻辑
      if (!speechEnabled.value && autoPlay.value && currentChoices.value.length === 0) {
        autoPlayTimer.value = setTimeout(() => nextDialog(), 1500)
      }
    }
  }
  typeNext()
}


// ========== 自动播放开关 ==========
function toggleAutoPlay() {
  autoPlay.value = !autoPlay.value
  if (!autoPlay.value && autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
  if (autoPlay.value && !isTyping.value && currentChoices.value.length === 0) {
    autoPlayTimer.value = setTimeout(() => nextDialog(), 1500)
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

// ========== 立刻完成打字 ==========
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
  // 取消语音结束回调，防止冲突
  if (onSpeechEnd) {
    onSpeechEnd = null
  }
  window.speechSynthesis.cancel()
  
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
  
  // 应用好感变化
  if (choice.affection) store.applyAffection(choice.affection)
  
  // 关键选择确认
  if (choice.keyChoice && !confirm('这个选择会影响后续剧情，确定吗？')) return

  // 触发战斗
  if (choice.battle) {
    emit('startBattle', choice.battle, currentNodeId.value, choice.nextId)
    closeDialog()
    return
  }

  const next = choice.nextId || choice.next
  if (next) currentNodeId.value = next
  else closeDialog()
}
// 修改 closeDialog，关闭时停止语音
function closeDialog() {
  
  window.speechSynthesis.cancel()
  if (autoPlayTimer.value) clearTimeout(autoPlayTimer.value)
  autoPlay.value = false
  visible.value = false
  emit('close')
}

// 如果以后想加控制台开关，可以留一个方法
function toggleSpeech() {
  speechEnabled.value = !speechEnabled.value
}

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
/* ========== 移动端适配 ========== */
@media (max-width: 600px) {
  .speaker-container {
    width: 45vw;
    max-width: 100%;
    bottom: 25vh;
    height: 60vh;
    max-height: 70vh;
  }
  .speaker-left { left: 1%; }
  .speaker-right { right: 1%; }
  .speaker-icon { font-size: 35vw; }

  .dialog-box {
    width: 94%;
    padding: 12px 14px;
    margin-bottom: 12px;
    border-radius: 18px;
  }
  .speaker-name { font-size: 9px; }
  .dialog-text { font-size: 10px; line-height: 1.6; }
  .skip-btn, .auto-btn { font-size: 7px; padding: 2px 6px; }
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
  .dialog-indicator { font-size: 7px; }
}

@media (max-width: 900px) and (max-height: 500px) {
  .speaker-container {
    width: 40vw;
    max-width: 300px;
    bottom: 18vh;
    height: 60vh;
    max-height: 70vh;
  }
  .speaker-icon { font-size: 28vw; }

  .dialog-box {
    max-width: 500px;
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 16px;
  }
  .dialog-text { font-size: 9px; line-height: 1.4; }
  .speaker-name { font-size: 8px; }
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