<template>
  <div>
    <!-- 悬浮切换按钮 -->
    <div 
      class="chat-toggle-button" 
      @click="toggleChat"
    >
      <span>💬</span>
    </div>

    <!-- 聊天窗口 -->
    <div 
      class="chat-window" 
      :style="{ display: isOpen ? 'flex' : 'none' }"
    >
      <div class="chat-header">
        <span>🤖 AI顾问</span>
        <button class="chat-close-button" @click="toggleChat">✕</button>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div class="message bot">你好！我是领袖的AI顾问，有什么想了解的？</div>
        <!-- 消息列表会动态插入到这里 -->
      </div>

      <div class="chat-input-area">
        <input 
          type="text" 
          class="chat-input" 
          v-model="userInput"
          placeholder="输入你的问题..." 
          @keypress.enter="sendMessage"
        />
        <button class="send-button" @click="sendMessage">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

// 状态管理
const isOpen = ref(false)
const userInput = ref('')
const messagesContainer = ref(null)

// 切换聊天窗口
const toggleChat = () => {
  isOpen.value = !isOpen.value
}

// 发送消息
const sendMessage = async () => {
  const question = userInput.value.trim()
  if (!question) return

  // 将用户消息添加到聊天窗口
  addMessage(question, 'user')
  userInput.value = ''

  try {
    // 根据当前环境动态确定API地址
    const apiUrl = import.meta.env.DEV 
      ? 'http://localhost:8080/api/chat' 
      : '/api/chat'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question })
    })

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    const data = await response.json()
    // 将AI回复添加到聊天窗口
    addMessage(data.reply, 'bot')
  } catch (error) {
    console.error('Error sending message:', error)
    addMessage('顾问：抱歉，网络似乎开小差了。', 'bot')
  }
}

// 向聊天窗口添加消息
const addMessage = (content, sender) => {
  const messageDiv = document.createElement('div')
  messageDiv.className = `message ${sender}`
  messageDiv.textContent = content
  messagesContainer.value?.appendChild(messageDiv)
  
  // 自动滚动到底部
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.chat-toggle-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background: #2c3e50;
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  font-size: 22px;
  transition: all 0.3s ease;
}
.chat-toggle-button:hover {
  background: #1a252f;
}

.chat-window {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 350px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  z-index: 9998;
  display: flex;
  flex-direction: column;
  font-family: sans-serif;
  overflow: hidden;
}

.chat-header {
  background: #2c3e50;
  color: white;
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.chat-close-button {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
}

.chat-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
}

.message {
  padding: 8px 12px;
  border-radius: 18px;
  max-width: 85%;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.4;
}
.message.bot {
  background: #e0e0e0;
  color: #333;
  align-self: flex-start;
  border-bottom-left-radius: 5px;
}
.message.user {
  background: #2c3e50;
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 5px;
}

.chat-input-area {
  display: flex;
  padding: 10px;
  border-top: 1px solid #eee;
  background: white;
}
.chat-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 8px 15px;
  outline: none;
}
.send-button {
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  margin-left: 10px;
  cursor: pointer;
  font-weight: bold;
}
</style>