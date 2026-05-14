<!-- src/components/shanxi/ChatWidget.vue -->
<template>
  <div>
    <!-- 悬浮按钮 -->
    <div class="chat-toggle-button" @click="toggleChat">
      <div class="toggle-light-pulse"><LightPulse /></div>
      <div class="toggle-icon"><div class="star-core"></div></div>
    </div>

    <!-- 聊天窗口 -->
    <div class="chat-window" :style="{ display: isOpen ? 'flex' : 'none' }">
      <div class="chat-header">
        <div class="header-left">
          <ShanxiAvatar :emotion="currentEmotion" :size="64" />
          <span>杉汐</span>
        </div>
        <button class="chat-close-button" @click="toggleChat">✕</button>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-row"
          :class="msg.sender"
        >
          <ShanxiAvatar
            v-if="msg.sender === 'bot'"
            :emotion="currentEmotion"
            :size="40"
            class="msg-avatar"
          />
          <div class="message" :class="msg.sender">
            {{ msg.content }}
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <input
          type="text"
          class="chat-input"
          v-model="userInput"
          placeholder="输入你的问题..."
          @keypress.enter="sendMessage"
        />
        <button class="send-button" @click="sendMessage">
          <span class="send-icon">✈️</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import LightPulse from './LightPulse.vue'
import ShanxiAvatar from './ShanxiAvatar.vue'

/* ----- 状态 ----- */
const isOpen = ref(false)
const userInput = ref('')
const messages = ref([])
let msgId = 0

/* 情绪：前端关键词匹配，无需导入 EmotionEngine */
const currentEmotion = ref({
  current: 'calm',
  color: '#f0a040',
  speed: 3.5,
  intensity: 1.0,
  glowColor: 'rgba(255, 140, 100, 0.4)'
})

/* 关键词映射 */
const emotionMap = [
  [/谢谢|感谢|太棒|厉害|优秀|好棒|开心|哈哈/, 'happy'],
  [/\?$|怎么|如何|为什么|想想|思考/, 'thinking'],
  [/难过|伤心|失败|糟糕|不行|唉/, 'sad'],
  [/可恶|生气|愤怒|别烦/, 'angry']
]

function detectEmotion(text) {
  for (const [regex, emotion] of emotionMap) {
    if (regex.test(text)) {
      return emotion
    }
  }
  return 'calm'
}

/* 自动滚动 */
const messagesContainer = ref(null)
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })

/* ----- 方法 ----- */
const toggleChat = () => {
  isOpen.value = !isOpen.value
}

const sendMessage = async () => {
  const question = userInput.value.trim()
  if (!question) return

  // 用户消息
  messages.value.push({ id: msgId++, content: question, sender: 'user' })
  userInput.value = ''

  // 检测情绪并更新头像
  const emotion = detectEmotion(question)
  currentEmotion.value = {
    ...currentEmotion.value,
    current: emotion
  }

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question })
    })
    if (!res.ok) throw new Error('Network error')
    const data = await res.json()
    messages.value.push({ id: msgId++, content: data.reply, sender: 'bot' })
  } catch {
    messages.value.push({
      id: msgId++,
      content: '杉汐：抱歉，我的灵魂好像被风吹散了…稍等片刻可好？',
      sender: 'bot'
    })
  }
}
</script>
<style scoped>
@import '../../styles/shanxi/chat-widget.css';
</style>