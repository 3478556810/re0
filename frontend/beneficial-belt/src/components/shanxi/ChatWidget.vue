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
import { ref, watch, nextTick, onMounted } from 'vue'
import LightPulse from './LightPulse.vue'
import ShanxiAvatar from './ShanxiAvatar.vue'
import AdminLogin from './AdminLogin.vue'
import { shouldSave } from '../../utils/memoryFilter'
import { emotionMap, defaultEmotion } from '../../config/emotions'
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



  // 构造请求体
  const requestBody = {
    message: question,
    sessionId: sessionId.value
  }

  // 如果用户说了切歌关键词，附加上下一首歌曲信息
  // 检测是否为切歌指令（更全面的模式）
const musicPattern = /(换首歌|切歌|下一首|来首|放点|放一首|切换|换一首|切一下|切个歌|换歌|换一个)/;
if (musicPattern.test(question)) {
    const musicState = window.__musicState;
    if (musicState) {
        const nextIndex = (musicState.currentIndex + 1) % musicState.playlist.length;
        const nextSong = musicState.playlist[nextIndex];
        requestBody.nextSong = {
            name: nextSong.title,
            src: nextSong.src
        };
    }
}
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
   // 收到后端返回的 data.emotion 时：
if (data.emotion) {
  const emo = emotionMap[data.emotion] || defaultEmotion
  currentEmotion.value = { current: data.emotion, ...emo }
}
// 新增：处理控制指令
if (data.action) {
    window.dispatchEvent(new CustomEvent('shanxi-action', {
        detail: { action: data.action }
    }))
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
// 监听杉汐的控制指令
window.addEventListener('shanxi-action', (event) => {
    const { action } = event.detail
    // 切歌指令由 MusicPlayer 处理，这里不需要额外逻辑
    // 未来如果有其他需要 ChatWidget 处理的动作，可以在这里扩展
})

}
)


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