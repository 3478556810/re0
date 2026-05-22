<template>
  <div class="side-panel">
    <div class="search-section">
      <div class="search-box">
        <Icon icon="ph:magnifying-glass" width="16" />
        <input v-model="keyword" placeholder="问问杉汐..." @keyup.enter="doSearch" />
      </div>
      <div v-if="searchLoading" class="search-status">杉汐正在查...</div>
      <div v-else-if="displayedText" class="result-card">
        {{ displayedText }}
        <span v-if="isTyping" class="cursor">|</span>
      </div>
      <div v-else-if="keyword && searchDone && !displayedText" class="search-status">无结果</div>
    </div>

    <div class="annotations-section">
      <h4>杉汐的痕迹</h4>
      <div v-for="(item, idx) in dynamicAnnotations" :key="idx" class="annotation-item" @click="jumpToPage(item.page)">
        <Icon icon="ph:chat-centered-text" width="16" />
        <span class="text">{{ item.comment }}</span>
        <span class="quote">“{{ item.text }}”</span>
        <span class="page">p.{{ item.page }}</span>
      </div>
      <div v-if="dynamicAnnotations.length === 0" class="outline-empty">暂无批注，选中文本即可生成</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({ threeReaderRef: Object })

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
  let i = 0
  typingTimer = setInterval(() => {
    if (i < text.length) {
      displayedText.value += text[i]
      i++
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
      body: JSON.stringify({ message: `帮我搜索一下“${kw}”` })
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

const STORAGE_KEY = 'shanxi_annotations'
const dynamicAnnotations = ref([])

function loadAnnotations() {
  dynamicAnnotations.value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
}

onMounted(() => {
  loadAnnotations()
  window.addEventListener('annotations-updated', loadAnnotations)
})

onBeforeUnmount(() => {
  window.removeEventListener('annotations-updated', loadAnnotations)
})

function jumpToPage(pageIndex) {
  if (props.threeReaderRef?.flipToPhysicalPage) {
    props.threeReaderRef.flipToPhysicalPage(pageIndex)
  }
}
</script>

<style scoped>
.side-panel { display: flex; flex-direction: column; gap: 20px; padding: 16px; }
.search-box { display: flex; align-items: center; background: #f1f5f9; border-radius: 8px; padding: 6px 10px; }
.search-box input { border: none; background: transparent; outline: none; flex: 1; margin-left: 6px; font-size: 0.9rem; }
.search-status { font-size: 0.8rem; color: #64748b; margin-top: 8px; }
.result-card { margin-top: 8px; background: #fff; border-radius: 12px; padding: 12px 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); font-size: 0.9rem; line-height: 1.6; color: #1e293b; white-space: pre-wrap; word-wrap: break-word; }
.cursor { color: #60a5fa; animation: blink 0.8s infinite; }
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
.annotation-item { display: flex; align-items: center; gap: 6px; padding: 8px; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
.annotation-item:hover { background: #f1f5f9; }
.text { flex: 1; font-size: 0.85rem; color: #334155; }
.quote { font-size: 0.8rem; color: #64748b; font-style: italic; margin-right: 4px; }
.page { font-size: 0.75rem; color: #94a3b8; }
.outline-empty { padding: 20px; text-align: center; color: var(--text-secondary); }
</style>