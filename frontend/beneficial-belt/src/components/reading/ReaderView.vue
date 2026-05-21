<template>
  <div class="reader-root">
    <div v-if="reader.loading.value" class="status-msg">加载中...</div>
    <div v-else-if="reader.error.value" class="status-msg error">{{ reader.error.value }}</div>

    <template v-else>
      <div class="toolbar">
        <button class="tb-btn" @click="back">← 书架</button>
        <span class="tb-title">{{ reader.title.value }}</span>
        <div class="tb-actions">
          <!-- 书签 -->
          <button class="tb-btn" @click="reader.toggleBookmark()">
            {{ reader.isBookmarked.value ? '🔖' : '☆' }}
          </button>
          <!-- 字体大小 -->
          <button class="tb-btn" @click="reader.changeFont()">{{ reader.fontSize.value }}px</button>
          <!-- 目录 -->
          <button class="tb-btn" @click="showOutline = !showOutline">
            <Icon icon="ph:list-bullets" width="18" />
          </button>
        </div>
      </div>

      <!-- 主体区域：3D 阅读 + 侧边栏 -->
      <div class="reader-body">
        <div class="reader-card">
          <div class="three-reader-wrapper">
            <ThreeReader ref="threeReaderRef" :reader="reader" />
          </div>
        </div>
        <div class="side-panel">
          <SidePanel :threeReaderRef="threeReaderRef" />
        </div>
      </div>

      <!-- 目录浮层（保留） -->
      <transition name="outline-fade">
        <div v-if="showOutline" class="outline-overlay" @click.self="showOutline = false">
          <div class="outline-panel">
            <div class="outline-header">
              <h3>目录</h3>
              <button class="tb-btn" @click="showOutline = false">
                <Icon icon="ph:x" width="18" />
              </button>
            </div>
            <div class="outline-list">
              <div v-for="(item, idx) in outline" :key="idx" class="outline-item" @click="jumpToChapter(item.blockIndex)">
                {{ item.title }}
              </div>
              <div v-if="outline.length === 0" class="outline-empty">未识别到章节标题</div>
            </div>
          </div>
        </div>
      </transition>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useReader } from './useReader.js'
import ThreeReader from './ThreeReader.vue'
import SidePanel from './SidePanel.vue'

const reader = useReader()
const threeReaderRef = ref(null)
const showOutline = ref(false)
const outline = ref([])

// 简单的章节提取（从全文中解析）
const parseOutline = (text) => {
  const lines = text.split('\n')
  const chapterPattern = /^(第[一二三四五六七八九十百千\d]+[卷章节回]|序章|尾声|楔子|[Pp]art\s+\d+|Chapter\s+\d+)[ 　\t].*$/
  const result = []
  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (chapterPattern.test(trimmed)) {
      result.push({ title: trimmed, blockIndex: idx })
    }
  })
  return result
}

// 跳转到章节（通过翻页模拟，可改为精确跳转页数）
const jumpToChapter = (blockIndex) => {
  // 简单实现：计算出大致页码并翻页（需根据分页情况优化）
  // 暂时用 blockIndex 除以估算行数来计算页码，然后调用 threeReader 跳转
  if (threeReaderRef.value) {
    const approxPage = Math.floor(blockIndex / 10) // 假设每页10行
    threeReaderRef.value.flipToPage(approxPage)
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
    const res = await fetch(`/books/${encodeURIComponent(file)}`)
    if (!res.ok) throw new Error('书籍加载失败')
    const buffer = await res.arrayBuffer()
    let text = new TextDecoder('utf-8').decode(buffer)
    if (text.includes('\ufffd')) text = new TextDecoder('gbk').decode(buffer)
    reader.fullText.value = text

    await nextTick()
    reader.restoreProgress()
    outline.value = parseOutline(text)
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