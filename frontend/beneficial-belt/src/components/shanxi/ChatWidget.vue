<template>
  <div>
    <!-- 悬浮按钮（保留情绪光晕） -->
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
          <div class="header-user-info">
            <span class="header-name">杉汐</span>
            <div class="status-wrapper">
              <span class="status-dot" :style="{ background: statusDotColor }"></span>
              <span class="status-text">{{ currentStatus }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="ds-btn" @click="toggleExpand" :title="isExpanded ? '还原' : '放大'">
            <Icon :icon="isExpanded ? 'mdi:arrow-collapse' : 'mdi:arrow-expand'" width="16" color="#666" />
          </button>
          <button class="ds-btn" @click="toggleChat">
            <Icon icon="heroicons:x-mark-20-solid" width="16" color="#666" />
          </button>
        </div>
      </div>

      <!-- 消息区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="messages.length === 0 && !welcomeLoading" class="message bot">{{ welcomeMessage }}</div>
        <div v-if="messages.length === 0 && welcomeLoading" class="message bot" style="opacity:0.6">杉汐正在想起你...</div>

        <div v-for="msg in messages" :key="msg.id" class="message-row" :class="msg.sender">
  <!-- 图片消息：直接展示图片卡片 -->
  <div v-if="msg.type === 'image'" class="image-card">
    <img :src="msg.image" style="max-width: 240px; border-radius: 12px;" />
  </div>
  <!-- 普通文字消息：动态绑定样式类，区分用户和杉汐 -->
  <div v-else class="message" :class="msg.sender">
    {{ msg.content }}
    <!-- 语音按钮：只给杉汐的消息 -->
    <button v-if="isLoggedIn && msg.sender === 'bot'" class="ds-btn ds-btn-msg" @click="playVoice(msg.content)" title="播放语音">
      <Icon icon="mdi:microphone" width="14" color="#666" />
    </button>
  </div>
</div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <input type="file" accept="image/*" ref="imageInput" style="display:none" v-if="isLoggedIn"
          @change="handleImageUpload" />
        <button v-if="isLoggedIn" class="ds-btn" @click="imageInput.click()" title="上传图片">
          <Icon icon="heroicons:photo-20-solid" width="18" color="#666" />
        </button>
        <input type="text" class="chat-input" v-model="userInput" placeholder="输入你的问题..."
          @keypress.enter="sendMessage" />
        <button class="ds-btn ds-btn-send" @click="sendMessage" :disabled="!userInput.trim()">
          <Icon icon="heroicons:paper-airplane-20-solid" width="18" color="#fff" />
        </button>
      </div>

      <details class="debug-panel" v-if="isLoggedIn">
        <summary>调试参数</summary>
        <div class="debug-controls">
          <label>T: <input type="range" min="0" max="2" step="0.1" v-model.number="debugTemp" @change="updateParams" />
            <span>{{ debugTemp }}</span>
          </label>
          <label>TopP: <input type="range" min="0" max="1" step="0.05" v-model.number="debugTopP"
              @change="updateParams" />
            <span>{{ debugTopP }}</span>
          </label>
          <label>MaxTokens: <input type="number" v-model.number="debugMaxTokens" min="100" max="4096" step="100"
              @change="updateParams" /></label>
          <label>
            深度思考:
            <select v-model="debugReasoning" @change="updateParams">
              <option value="">关闭</option>
              <option value="high">开启（高）</option>
              <option value="max">开启（最强）</option>
            </select>
          </label>
          <div class="debug-stats">
            <span>Token: {{ lastTokenUsage || '--' }}</span>
            <span>延迟: {{ lastLatency || '--' }}ms</span>
            <span>余额: {{ balance || '--' }}</span>
            <button class="debug-refresh-btn" @click="fetchBalance">刷新余额</button>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import LightPulse from './LightPulse.vue'
import { Icon } from '@iconify/vue'
import { useSession } from './composables/useSession.js'
import { useEmotion } from './composables/useEmotion.js'
import { useMemory } from './composables/useMemory.js'
import { useWelcome } from './composables/useWelcome.js'
import { useChatLogic } from './composables/useChatLogic.js'
import { useImageUpload } from './composables/useImageUpload.js'
import { useVoicePlay } from './composables/useVoicePlay.js'
import { useStatusPolling } from './composables/useStatusPolling.js'

/* ========== 基础状态 ========== */
const isOpen = ref(false)
const isExpanded = ref(false)
const toggleExpand = () => { isExpanded.value = !isExpanded.value }
const toggleChat = () => { isOpen.value = !isOpen.value }
const userInput = ref('')
const messages = ref([])

/* ========== 登录状态 ========== */
const isLoggedIn = ref(!!localStorage.getItem('token'))

/* ========== 调试参数（绑定到调试面板） ========== */
const debugTemp = ref(localStorage.getItem('debugTemp') ? parseFloat(localStorage.getItem('debugTemp')) : 0.7)
const debugTopP = ref(localStorage.getItem('debugTopP') ? parseFloat(localStorage.getItem('debugTopP')) : 0.9)
const debugReasoning = ref(localStorage.getItem('debugReasoning') || '')
const lastTokenUsage = ref('')
const lastLatency = ref('')
const debugMaxTokens = ref(localStorage.getItem('debugMaxTokens') ? parseInt(localStorage.getItem('debugMaxTokens')) : 2000)

const balance = ref('')

function previewImage(url) {
  window.open(url, '_blank')
}

async function fetchBalance() {
  try {
    const res = await fetch('/api/balance')
    if (res.ok) {
      const data = await res.json()
      if (data.is_available && data.balance_infos?.length > 0) {
        const info = data.balance_infos[0]
        balance.value = `${info.total_balance} ${info.currency}`
      } else {
        balance.value = '不可用'
      }
    }
  } catch { }
}

// 在 onMounted 中调用一次
onMounted(() => {
  fetchBalance()
  // ... 其他已有逻辑
})

// 每次修改参数时自动保存到 localStorage
function updateParams() {
  localStorage.setItem('debugTemp', debugTemp.value)
  localStorage.setItem('debugTopP', debugTopP.value)
  localStorage.setItem('debugMaxTokens', debugMaxTokens.value)
  localStorage.setItem('debugReasoning', debugReasoning.value)
}

/* ========== 外部模块 ========== */
const { sessionId } = useSession()
const { currentEmotion, updateEmotion } = useEmotion()
const { saveMemory } = useMemory()
const { welcomeMessage, welcomeLoading } = useWelcome()
const { currentStatus } = useStatusPolling()

/* ========== 聊天核心逻辑（发送消息） ========== */
const { sendMessage } = useChatLogic({
  messages,
  userInput,
  sessionId,
  updateEmotion,
  saveMemory,
  lastTokenUsage,  // 必须传入
  lastLatency      // 必须传入
})

/* ========== 图片上传 ========== */
const { imageInput, handleImageUpload } = useImageUpload({
  messages,
  sessionId,
  saveMemory
})

/* ========== 语音播放 ========== */
const { playVoice } = useVoicePlay()


const statusDotColor = computed(() => {
  const status = currentStatus.value
  if (!status) return '#98a2b3'
  if (status.includes('活跃') || status.includes('在线') || status.includes('帮忙') || status.includes('聊聊天')) return '#12b76a'
  if (status.includes('发呆') || status.includes('思绪') || status.includes('休眠')) return '#f59e0b'
  if (status.includes('忙碌') || status.includes('整理') || status.includes('写文章')) return '#ef4444'
  return '#98a2b3'
})

/* ========== 自动滚动 ========== */
const messagesContainer = ref(null)
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })
</script>

<script>
export default {}
</script>

<style scoped>
@import '../../styles/shanxi/chat-widget.css';
</style>