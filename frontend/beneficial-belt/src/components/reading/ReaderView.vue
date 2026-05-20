<template>
  <div class="reader-root">
    <div v-if="reader.loading.value" class="status-msg">加载中...</div>
    <div v-else-if="reader.error.value" class="status-msg error">{{ reader.error.value }}</div>

    <template v-else>
      <div class="toolbar">
        <button class="tb-btn" @click="back">← 书架</button>
        <span class="tb-title">{{ reader.title.value }}</span>
        <div class="tb-actions">
          <button class="tb-btn" @click="reader.toggleBookmark()">
            {{ reader.isBookmarked.value ? '🔖' : '☆' }}
          </button>
          <button class="tb-btn" @click="reader.changeFont()">{{ reader.fontSize.value }}px</button>
          <button class="tb-btn" @click="showOutline = !showOutline">
            <Icon icon="ph:list-bullets" width="18" />
          </button>
        </div>
      </div>

      <div class="reader-card">
        <DynamicScroller
          ref="scrollerRef"
          class="reader-scroller"
          :items="textBlocks"
          :min-item-size="40"
          key-field="id"
          :size-dependencies="[reader.fontSize.value]"
          v-slot="{ item, active }"
        >
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[reader.fontSize.value]"
            :data-index="item.id"
          >
            <div
              class="text-block"
              :style="{ fontSize: reader.fontSize.value + 'px', lineHeight: '1.8', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }"
            >
              {{ item.text }}
            </div>
          </DynamicScrollerItem>
        </DynamicScroller>
      </div>

      <!-- 目录浮层 -->
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
              <div
                v-for="(item, idx) in outline"
                :key="idx"
                class="outline-item"
                @click="jumpToChapter(item.blockIndex)"
              >
                {{ item.title }}
              </div>
              <div v-if="outline.length === 0" class="outline-empty">
                未识别到章节标题
              </div>
            </div>
          </div>
        </div>
      </transition>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { Icon } from '@iconify/vue'
import { useReader } from './useReader.js'

const reader = useReader()
const scrollerRef = ref(null)
const showOutline = ref(false)
const outline = ref([])

// 按固定行数切割文本，保证每块高度可控
const LINES_PER_BLOCK = 80

const textBlocks = computed(() => {
  const text = reader.fullText.value || ''
  const lines = text.split('\n')
  const blocks = []
  outline.value = []

  const chapterPattern = /^(第[一二三四五六七八九十百千\d]+[卷章节回]|序章|尾声|楔子|[Pp]art\s+\d+|Chapter\s+\d+)[ 　\t].*$/

  for (let i = 0; i < lines.length; i += LINES_PER_BLOCK) {
    const slice = lines.slice(i, Math.min(i + LINES_PER_BLOCK, lines.length))
    let blockText = slice.join('\n')
    const firstLine = slice[0]?.trim()

    // 检测章节标题
    if (firstLine && chapterPattern.test(firstLine)) {
      blocks.push({ id: i, text: blockText })
      outline.value.push({ title: firstLine, blockIndex: blocks.length - 1 })
    } else {
      // 检查内部是否有章节标题
      let foundChapter = false
      for (let j = 1; j < slice.length; j++) {
        const line = slice[j].trim()
        if (chapterPattern.test(line)) {
          // 切分成两个块
          const prevText = slice.slice(0, j).join('\n')
          blocks.push({ id: i, text: prevText })

          const chapterText = slice.slice(j).join('\n')
          const newId = i + j
          blocks.push({ id: newId, text: chapterText })
          outline.value.push({ title: line, blockIndex: blocks.length - 1 })
          foundChapter = true
          break
        }
      }
      if (!foundChapter) {
        blocks.push({ id: i, text: blockText })
      }
    }
  }
  return blocks
})

const jumpToChapter = (index) => {
  if (scrollerRef.value) {
    scrollerRef.value.scrollToItem(index)
    showOutline.value = false
  }
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

    // 恢复阅读位置
    if (scrollerRef.value) {
      const progress = reader.currentProgress.value || 0
      const totalItems = textBlocks.value.length
      const targetIndex = Math.floor((progress / 100) * totalItems)
      if (targetIndex > 0) {
        scrollerRef.value.scrollToItem(targetIndex)
      }
    }
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