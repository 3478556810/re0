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
          <ShanxiAvatar :emotion="currentEmotion" :size="40" />
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
            :size="28"
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

const messagesContainer = ref(null)



/* ----- 状态 ----- */
const isOpen = ref(false)
const userInput = ref('')
const messages = ref([])   // 纯 JS 数组，无需泛型
let msgId = 0

// 自动滚动到底部
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })

/* 情绪（后续接引擎动态化） */
const currentEmotion = ref({
  current: 'calm',
  color: '#f0a040',
  speed: 3.5,
  intensity: 1.0,
  glowColor: 'rgba(255, 140, 100, 0.4)',
})

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

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question }),
    })
    if (!res.ok) throw new Error('Network error')
    const data = await res.json()
    // 杉汐回复
    messages.value.push({ id: msgId++, content: data.reply, sender: 'bot' })
  } catch {
    messages.value.push({
      id: msgId++,
      content: '杉汐：抱歉，我的灵魂好像被风吹散了…稍等片刻可好？',
      sender: 'bot',
    })
  }
}
</script>
<style scoped>
@import '../../styles/shanxi/chat-widget.css';
</style>