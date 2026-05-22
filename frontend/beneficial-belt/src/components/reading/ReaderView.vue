<template>
  <div class="reader-root">

    
    <div v-if="reader.loading.value" class="status-msg">加载中...</div>
    <div v-else-if="reader.error.value" class="status-msg error">{{ reader.error.value }}</div>

    <template v-else>
      <div class="toolbar">
        <button class="tb-btn" @click="back">← 书架</button>
        <span class="tb-title">{{ reader.title.value }}</span>
        <div class="tb-actions">
          <button class="tb-btn" @click="toggleBookmarkAtCurrentPage">
  <Icon :icon="isCurrentPageBookmarked ? 'ph:bookmark-simple-fill' : 'ph:bookmark-simple'" width="18" />
</button>
          <button class="tb-btn" @click="reader.changeFont()">{{ reader.fontSize.value }}px</button>
          <button class="tb-btn" @click="showOutline = !showOutline">
            <Icon icon="ph:list-bullets" width="18" />
          </button>
        </div>
      </div>

      <div class="reader-body">
       <div class="left-spacer"></div>
        <div class="reader-card">
          
          <div class="three-reader-wrapper">
            <ThreeReader ref="threeReaderRef" :reader="reader" />
          </div>
        </div>

        <div class="right-panels">
    <NotesPanel />
        <div class="side-panel">
          <SidePanel :threeReaderRef="threeReaderRef" />
        </div>
         </div>
      </div>

     <!-- 替换原来的目录浮层部分 -->
<transition name="outline-fade">
  <div v-if="showOutline" class="outline-overlay" @click.self="showOutline = false">
    <div class="outline-panel">
      <div class="outline-header">
        <div class="outline-tabs">
          <button :class="['tab-btn', { active: outlineTab === 'outline' }]" @click="outlineTab = 'outline'">目录</button>
          <button :class="['tab-btn', { active: outlineTab === 'bookmarks' }]" @click="outlineTab = 'bookmarks'">书签</button>
        </div>
        <button class="tb-btn" @click="showOutline = false">
          <Icon icon="ph:x" width="18" />
        </button>
      </div>

      <!-- 目录列表 -->
      <div v-show="outlineTab === 'outline'" class="outline-list">
        <div v-for="(item, idx) in outline" :key="idx" class="outline-item" @click="jumpToChapter(item)">
          {{ item.title }}
        </div>
        <div v-if="outline.length === 0" class="outline-empty">未识别到章节标题</div>
      </div>

      <!-- 书签列表 -->
      <div v-show="outlineTab === 'bookmarks'" class="outline-list">
        <div v-for="(bm, idx) in reader.bookmarks.value" :key="idx" class="outline-item" @click="jumpToBookmark(bm.page)">
          <span class="bm-text">{{ bm.text }}</span>
          <span class="bm-page">第{{ bm.page + 1 }}页</span>
        </div>
        <div v-if="reader.bookmarks.value.length === 0" class="outline-empty">暂无书签</div>
      </div>
    </div>
  </div>
</transition>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick ,computed} from 'vue'
import { Icon } from '@iconify/vue'
import { useReader } from './useReader.js'
import ThreeReader from './ThreeReader.vue'
import SidePanel from './SidePanel.vue'
import NotesPanel from './NotesPanel.vue'
const reader = useReader()
const threeReaderRef = ref(null)
const showOutline = ref(false)
const outline = ref([])

const outlineTab = ref('outline') // 'outline' | 'bookmarks'

function parseOutline(fullText) {
  const lines = fullText.split('\n')
  const chapterPattern = /^(第[一二三四五六七八九十百千\d]+[卷章节回部篇]|序章|尾声|楔子|前言|后记|[Pp]art\s+\d+|Chapter\s+\d+|第[0-9]+[章節回]|[零壹贰叁肆伍陆柒捌玖拾佰仟\d]+[、．.]\s*)([ 　\t].*)?$/u
  const result = []
  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (chapterPattern.test(trimmed)) {
      result.push({ title: trimmed, lineIndex: idx })
    }
  })
  return result
}
// 当前页码（来自 ThreeReader）
const currentPage = computed(() => threeReaderRef.value?.currentPage ?? 0)

// 当前页是否为书签
const isCurrentPageBookmarked = computed(() => {
  return reader.isBookmarked(currentPage.value)
})

// 添加或删除书签
const toggleBookmarkAtCurrentPage = () => {
  const page = currentPage.value
  const text = threeReaderRef.value?.getCurrentPageText?.() || `第${page + 1}页`
  reader.toggleBookmark(page, text)
}

// 书签跳转
const jumpToBookmark = (page) => {
  if (threeReaderRef.value?.flipToPage) {
    threeReaderRef.value.flipToPage(page)
  }
  showOutline.value = false
}

const jumpToChapter = (item) => {
  if (threeReaderRef.value && threeReaderRef.value.jumpToChapter) {
    threeReaderRef.value.jumpToChapter(item.title)
  }
  showOutline.value = false
}

const back = () => window.location.href = '/reading-hut'

onMounted(async () => {
  try {
    const params = new URLSearchParams(window.location.search)
    const file = params.get('book')
    if (!file) throw new Error('未指定书籍')
    reader.title.value = file.replace(/\.txt$/i, '')

    const res = await fetch(`/api/book/content?bookId=${encodeURIComponent(file)}`)
    if (!res.ok) throw new Error('书籍加载失败')
    const text = await res.text()
    reader.fullText.value = text
    await nextTick()
    outline.value = parseOutline(text)
    reader.restoreProgress()
  } catch (e) {
    reader.error.value = e.message
  } finally {
    reader.loading.value = false
  }
})
</script>

<style>
@import './ReaderView.css';
</style>