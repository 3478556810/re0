<template>
  <div class="side-panel">
    <!-- ========== 搜索杉汐 ========== -->
    <div class="search-section">
      <div class="search-box">
        <Icon icon="ph:magnifying-glass" width="16" />
        <input
          v-model="keyword"
          placeholder="问问杉汐..."
          @keyup.enter="doSearch"
        />
      </div>

      <!-- 加载动画 -->
      <div v-if="searchLoading" class="search-status">
        <span class="dot-flashing"></span> 杉汐正在查...
      </div>

      <!-- 打字机结果卡片 -->
      <div v-if="displayedText" class="result-card">
        <div class="result-content">{{ displayedText }}</div>
        <span v-if="isTyping" class="cursor">|</span>
      </div>

      <!-- 无结果 -->
      <div v-else-if="keyword && searchDone && !displayedText" class="search-status">
        暂无搜索结果
      </div>
    </div>

    <!-- ========== 阅读痕迹 ========== -->
   <div
  v-for="ann in annotations"
  :key="ann.quote"
  class="annotation-item"
  @click="goToPage(ann.page, ann.quote)"
>
  <Icon :icon="ann.icon" width="16" class="anno-icon" />
  <span class="text">{{ ann.text }}</span>
  <span class="page">p.{{ ann.page }}</span>
</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  threeReaderRef: Object
})

// ----- 搜索相关 -----
const keyword = ref('')
const searchLoading = ref(false)
const searchDone = ref(false)
const displayedText = ref('')
const isTyping = ref(false)
let typingTimer = null

const typewriter = (text) => {
  clearInterval(typingTimer)
  displayedText.value = ''
  isTyping.value = true
  let index = 0
  typingTimer = setInterval(() => {
    if (index < text.length) {
      displayedText.value += text[index]
      index++
    } else {
      clearInterval(typingTimer)
      isTyping.value = false
    }
  }, 30)
}

const doSearch = async () => {
  const kw = keyword.value.trim()
  if (!kw) return

  clearInterval(typingTimer)
  isTyping.value = false
  searchLoading.value = true
  searchDone.value = false
  displayedText.value = ''

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `帮我搜索一下“${kw}”`
      })
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    const reply = data.reply || data.message || data.content || '杉汐暂时没有回复'
    typewriter(reply)
  } catch (e) {
    console.error('搜索失败:', e)
    typewriter('搜索失败，请稍后重试')
  } finally {
    searchLoading.value = false
    searchDone.value = true
  }
}

// ----- 阅读痕迹 -----
// SidePanel.vue 中的 annotations 數組修改
const annotations = [
  { page: 2, icon: 'ph:heart-straight', text: '这里男主第一次说出真心话', quote: '微微' },
  { page: 5, icon: 'ph:sparkle', text: '这个比喻实在太妙了', quote: '她的笑容像晨曦中的露珠' },
  { page: 8, icon: 'ph:question', text: '为什么她要离开？', quote: '她转身离去' },
]

// 修改 goToPage
const goToPage = (pageIndex, quote) => {
  if (props.threeReaderRef?.flipToPage) {
    props.threeReaderRef.flipToPage(pageIndex, quote)
  }
}

</script>

<style scoped>
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 6px 10px;
}
.search-box input {
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  margin-left: 6px;
  font-size: 0.9rem;
}

/* 加载状态 */
.search-status {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot-flashing {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #60a5fa;
  animation: dot-flash 1s infinite alternate;
}
@keyframes dot-flash {
  0% { opacity: 0.2; }
  100% { opacity: 1; }
}

/* 结果卡片 */
.result-card {
  margin-top: 8px;
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  font-size: 0.9rem;
  line-height: 1.6;
  color: #1e293b;
  white-space: pre-wrap;
  word-wrap: break-word;
  position: relative;
}
.result-content {
  margin-bottom: 4px;
}
.cursor {
  color: #60a5fa;
  animation: blink 0.8s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 痕迹部分 */
.annotations-section h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #475569;
}
.annotation-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.annotation-item:hover {
  background: #f1f5f9;
}
.emoji { font-size: 1.2rem; }
.text { flex: 1; font-size: 0.85rem; color: #334155; }
.page {
  font-size: 0.75rem;
  color: #94a3b8;
}

.anno-icon {
  color: var(--emotion-color, #60a5fa);
  flex-shrink: 0;
}
</style>