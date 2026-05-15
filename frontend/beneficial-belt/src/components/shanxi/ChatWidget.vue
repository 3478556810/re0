<!-- src/components/shanxi/ChatWidget.vue -->
<template>
  <div>
    <!-- 悬浮按钮 -->
    <div class="chat-toggle-button" @click="toggleChat">
      <div class="toggle-light-pulse">
        <LightPulse />
      </div>
      <div class="toggle-icon">
        <div class="star-core"></div>
      </div>
    </div>

    <!-- 聊天窗口 -->
    <div class="chat-window" :class="{ expanded: isExpanded }" :style="{ display: isOpen ? 'flex' : 'none' }">
      <div class="chat-header">
        <div class="header-left">
          <ShanxiAvatar :emotion="currentEmotion" class="msg-avatar-header" :size="80"
            :glowColor="currentEmotion.glowColor" />
          <span style="font-size: 28px;">杉汐</span>
        </div>
        <AdminLogin />
        <div class="header-actions">
          <button class="chat-expand-button" @click="toggleExpand" :title="isExpanded ? '还原' : '放大'">
            {{ isExpanded ? '🔲' : '🔳' }}
          </button>
          <button class="chat-close-button" @click="toggleChat">✕</button>
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <!-- 欢迎语：只在没有消息时显示 -->
        <div v-if="messages.length === 0 && !welcomeLoading" class="message bot">
          {{ welcomeMessage }}
        </div>
        <div v-if="messages.length === 0 && welcomeLoading" class="message bot" style="opacity:0.6">
          杉汐正在想起你...
        </div>
        <div v-for="msg in messages" :key="msg.id" class="message-row" :class="msg.sender">
          <ShanxiAvatar v-if="msg.sender === 'bot'" :emotion="currentEmotion" :size="60" class="msg-avatar"
            :glowColor="currentEmotion.glowColor" />


          <div class="message bot">
            {{ msg.content }}
          </div>


        </div>
      </div>

      <div class="chat-input-area">
        <input type="text" style="font-size: 18px;" class="chat-input" v-model="userInput" placeholder="输入你的问题..."
          @keypress.enter="sendMessage" />
        <button class="send-button" @click="sendMessage">
          <span class="send-icon">✈️</span>
        </button>
      </div>
    </div>
  </div>
</template>
<script >
export default {}
</script>

<script setup>
import { FluidBubble } from 'vue-fluid'
import { ref, watch, nextTick, onMounted } from 'vue'
import LightPulse from './LightPulse.vue'
import ShanxiAvatar from './ShanxiAvatar.vue'
import AdminLogin from './AdminLogin.vue'
import { shouldSave } from '../../utils/memoryFilter'
/* ----- 状态 ----- */
const isOpen = ref(false)
const isExpanded = ref(false)
const toggleExpand = () => { isExpanded.value = !isExpanded.value }
const userInput = ref('')
const messages = ref([])

const props = defineProps({
  emotion: Object,
  size: Number,
  glowColor: { type: String, default: 'rgba(240, 160, 64, 0.5)' }
})
let msgId = 0
// 生成或恢复会话ID
const sessionId = ref(localStorage.getItem('sessionId') || Date.now().toString(36))
localStorage.setItem('sessionId', sessionId.value)

/* 情绪：前端关键词匹配，无需导入 EmotionEngine */
const currentEmotion = ref({
  current: 'calm',
  color: '#f0a040',
  speed: 3.5,
  intensity: 1.0,
  glowColor: 'rgba(255, 140, 100, 0.4)'
})




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

  // 1. 用户消息
  messages.value.push({ id: msgId++, content: question, sender: 'user' })
  userInput.value = ''

  try {
    const token = localStorage.getItem('token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: question, sessionId: sessionId.value })
    })
    if (!res.ok) throw new Error('Network error')
    const data = await res.json()

    // 2. 杉汐回复
    messages.value.push({ id: msgId++, content: data.reply, sender: 'bot' })

    // 3. 后端驱动情绪更新
    if (data.emotion) {
      const emotionMap = {
        happy: { color: '#f5a623', speed: 2.2, intensity: 1.15, glowColor: 'rgba(255, 180, 50, 0.9)' },
        sad: { color: '#60a5fa', speed: 5.0, intensity: 0.9, glowColor: 'rgba(96, 165, 250, 0.9)' },
        angry: { color: '#ef4444', speed: 1.5, intensity: 1.3, glowColor: 'rgba(239, 68, 68, 0.9)' },
        calm: { color: '#f0a040', speed: 3.5, intensity: 1.0, glowColor: 'rgba(255, 140, 100, 0.8)' },
        thinking: { color: '#a78bfa', speed: 2.8, intensity: 1.05, glowColor: 'rgba(167, 139, 250, 0.9)' },
        loving: { color: '#f472b6', speed: 1.0, intensity: 1.35, glowColor: 'rgba(244, 114, 182, 0.9)' }
      }
      const emo = emotionMap[data.emotion] || emotionMap.calm
      currentEmotion.value = { current: data.emotion, ...emo }
    }

    // 4. 异步归档记忆
    saveMemory('leader', question)
    saveMemory('shanshi', data.reply)
  } catch {
    const fallback = '杉汐：抱歉，我的灵魂好像被风吹散了…稍等片刻可好？'
    messages.value.push({ id: msgId++, content: fallback, sender: 'bot' })
  }
}


const welcomeMessage = ref('你好！我是杉汐，你的数字伙伴。')
const welcomeLoading = ref(false)

const loadWelcome = async () => {
  const token = localStorage.getItem('token')
  if (!token) return // 未登录，使用默认欢迎语

  welcomeLoading.value = true
  try {
    const res = await fetch('/api/memory/welcome', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      welcomeMessage.value = data.message
    }
  } catch { /* 失败则保持默认 */ }
  finally {
    welcomeLoading.value = false
  }
}

onMounted(() => {
  loadWelcome()
})


// 记忆存档（带前端过滤）
function saveMemory(role, content) {
  if (!shouldSave(content)) return  // 无价值内容直接跳过

  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  fetch('/api/memory/save', {
    method: 'POST',
    headers,
    body: JSON.stringify({ role, content })
  }).catch(err => console.error('记忆存档失败:', err))
}



</script>


<style scoped>
@import '../../styles/shanxi/chat-widget.css';
</style>