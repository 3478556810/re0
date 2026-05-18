<!-- src/components/shanxi/ChatWidget.vue -->
<template>
  <div>
    <!-- 悬浮按钮 -->
    <div class="chat-toggle-button" v-if="!isOpen" @click="toggleChat">
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


<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import LightPulse from './LightPulse.vue'
import ShanxiAvatar from './ShanxiAvatar.vue'
import AdminLogin from './AdminLogin.vue'
import { useSession } from './composables/useSession.js'
import { useEmotion } from './composables/useEmotion.js'
import { useMemory } from './composables/useMemory.js'
import { useWelcome } from './composables/useWelcome.js'




/* 基础状态 */
const isOpen = ref(false)
const isExpanded = ref(false)
const toggleExpand = () => { isExpanded.value = !isExpanded.value }
const userInput = ref('')
const messages = ref([])
let msgId = 0

/* 会话 */
const { sessionId } = useSession()

/* 情绪 */
const { currentEmotion, updateEmotion } = useEmotion()

/* 记忆 */
const { saveMemory } = useMemory()




/* 欢迎语 */
const { welcomeMessage, welcomeLoading } = useWelcome()



/* 自动滚动 */
const messagesContainer = ref(null)
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })

/* 方法 */
const toggleChat = () => { isOpen.value = !isOpen.value }

const sendMessage = async () => {
  const question = userInput.value.trim()
  if (!question) return

  messages.value.push({ id: msgId++, content: question, sender: 'user' })
  userInput.value = ''

  const requestBody = { message: question, sessionId: sessionId.value }

  const musicPattern = /(换首歌|切歌|下一首|来首|放点|放一首|切换|换一首|切一下|切个歌|换歌|换一个)/
  if (musicPattern.test(question)) {
    const musicState = window.__musicState
    if (musicState) {
      const nextIndex = (musicState.currentIndex + 1) % musicState.playlist.length
      requestBody.nextSong = {
        name: musicState.playlist[nextIndex].title,
        src: musicState.playlist[nextIndex].src
      }
    }
  }

  try {
    const token = localStorage.getItem('token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })
    if (!res.ok) throw new Error('Network error')
    const data = await res.json()

    messages.value.push({ id: msgId++, content: data.reply, sender: 'bot' })

    if (data.emotion) updateEmotion(data.emotion)

    if (data.action) {
      window.dispatchEvent(new CustomEvent('shanxi-action', {
        detail: { action: data.action }
      }))
    }
// 新增：处理博客内容
if (data.blog) {
    messages.value.push({
        id: msgId++,
        content: data.blog,
        sender: 'bot'
    })
    saveMemory('shanshi', data.blog)
}
    saveMemory('leader', question)
    saveMemory('shanshi', data.reply)
  }  catch (e) {
    console.error('杉汐回复失败:', e)
    messages.value.push({
        id: msgId++,
        content: '杉汐：抱歉，我的灵魂好像被风吹散了…稍等片刻可好？',
        sender: 'bot'
    })
}
}

</script>

<script>
export default {}
</script>
<style scoped>
@import '../../styles/shanxi/chat-widget.css';
</style>