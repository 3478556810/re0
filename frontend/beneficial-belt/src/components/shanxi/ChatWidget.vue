<!-- src/components/shanxi/ChatWidget.vue -->
<template>
  <div>
<div class="chat-toggle-button" @click="toggleChat">
  <div class="toggle-light-pulse"><LightPulse /></div>
  <div class="toggle-icon"><div class="star-core"></div></div>
</div>

    <!-- 聊天窗口 -->
    <div class="chat-window" :style="{ display: isOpen ? 'flex' : 'none' }">
      <div class="chat-header">
        <div class="header-left">
          <LightPulse />
          <span>杉汐</span>
        </div>
        <button class="chat-close-button" @click="toggleChat">✕</button>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div class="message bot">你好！我是杉汐，你的数字伙伴。</div>
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
import { ref, nextTick } from 'vue'
import LightPulse from './LightPulse.vue'

const isOpen = ref(false)
const userInput = ref('')
const messagesContainer = ref(null)

const toggleChat = () => { isOpen.value = !isOpen.value }

const sendMessage = async () => {
  const question = userInput.value.trim()
  if (!question) return

  addMessage(question, 'user')
  userInput.value = ''

  try {
    const apiUrl = import.meta.env.DEV ? 'http://localhost:8080/api/chat' : '/api/chat'
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question })
    })

    if (!response.ok) throw new Error('Network response was not ok')

    const data = await response.json()
    addMessage(data.reply, 'bot')
  } catch (error) {
    console.error('Error sending message:', error)
    addMessage('杉汐：抱歉，我的灵魂好像被风吹散了…稍等片刻可好？', 'bot')
  }
}

const addMessage = (content, sender) => {
  const messageDiv = document.createElement('div')
  messageDiv.className = `message ${sender}`
  messageDiv.textContent = content
  messagesContainer.value?.appendChild(messageDiv)
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}
</script>

<style scoped>
@import '../../styles/shanxi/chat-widget.css';
</style>