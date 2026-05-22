<template>
  <div class="three-reader" ref="flipContainerRef">
    <EmotionGlow />
    <!-- 中国传统纸签书签 -->
    <div v-if="isCurrentPageBookmarked" class="paper-bookmark" @click="removeCurrentBookmark">
      <div class="bookmark-body">
        <span class="bookmark-char">签</span>
      </div>
      <div class="bookmark-tassel"></div>
    </div>

    <!-- 页脚信息 -->
    <div class="footer-info" v-if="pageFlip">
      <span class="time">{{ currentTime }}</span>
      <span class="page-num">{{ currentPage + 1 }} / {{ totalPages }}</span>
      <span class="remain">剩余约 {{ remainingTime }} 分钟</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="statusMsg" class="status-overlay">
      <div class="status-box">
        <span class="status-text">{{ statusMsg }}</span>
        <div v-if="statusMsg.includes('排版')" class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { PageFlip } from 'page-flip'
import { getCachedPages, setCachedPages } from './cachePagination.js'
import EmotionGlow from './EmotionGlow.vue'
import { exactPaginate } from './ExactPaginator.js'
import { useReadingStats } from './useReadingStats.js'

const props = defineProps({ reader: Object })
const flipContainerRef = ref(null)
const statusMsg = ref('正在准备...')
const progressPercent = ref(0)
let pageFlip = null
let currentFontSize = null
let taskId = 0

const currentPage = ref(0)
const totalPages = ref(0)

// 书签逻辑（保留简单）
const isCurrentPageBookmarked = computed(() => {
  return props.reader.isBookmarked?.(currentPage.value) ?? false
})
function getCurrentPageText() { /* 不变 */ }
const removeCurrentBookmark = () => { /* 不变 */ }

// ---- 阅读统计模块 ----
const textProvider = () => props.reader.fullText.value || ''
const stats = useReadingStats(textProvider, currentPage, totalPages, flipContainerRef)
// 解构所需
const { currentTime, remainingTime, markPageEnter, recordPageTurn, startClock, destroy: destroyStats } = stats

// 初始化时启动时钟
onMounted(() => {
  startClock()
})

// ---- 封面/底页 HTML 函数（不变） ----
function escapeHtml(str) { /* ... */ }
function createCoverHTML(rawTitle) { /* ... */ }
function createBackHTML() { /* ... */ }

// ---- 翻页实例管理 ----
function destroyFlip() {
  if (pageFlip) {
    try { pageFlip.off('flip'); pageFlip.destroy() } catch (e) {}
    pageFlip = null
  }
  if (flipContainerRef.value) {
    const pages = flipContainerRef.value.querySelectorAll('.flip-page')
    pages.forEach(p => p.remove())
  }
}

// ---- 核心初始化 ----
async function initFlip() {
  if (!flipContainerRef.value) return

  const id = ++taskId
  destroyFlip()
  flipContainerRef.value.style.width = '550px'
  flipContainerRef.value.style.height = '700px'

  const fontSize = props.reader.fontSize.value
  const text = props.reader.fullText.value || ''
  const bookId = props.reader.title.value || 'unknown'

  statusMsg.value = '正在准备...'
  progressPercent.value = 0

  try {
    let htmlPages = await getCachedPages(bookId, fontSize)

    if (!htmlPages) {
      statusMsg.value = '正在精确排版... 0%'
      const bodyPages = await exactPaginate(text, fontSize, 550, 700, (p) => {
        statusMsg.value = `正在精确排版... ${p}%`
        progressPercent.value = p
      })
      if (id !== taskId) return
      if (!bodyPages || bodyPages.length === 0) {
        statusMsg.value = '暂无内容'
        return
      }
      const coverHTML = createCoverHTML(props.reader.title.value)
      const backHTML = createBackHTML()
      htmlPages = [coverHTML, ...bodyPages, backHTML]
      await setCachedPages(bookId, fontSize, htmlPages)
    }

    if (id !== taskId) return
    if (!htmlPages || htmlPages.length === 0) {
      statusMsg.value = '暂无内容'
      return
    }

    const pageElements = htmlPages.map(html => {
      const div = document.createElement('div')
      div.className = 'flip-page'
      div.style.width = '550px'
      div.style.height = '700px'
      div.innerHTML = html
      return div
    })

    if (id !== taskId || !flipContainerRef.value) return

    pageFlip = new PageFlip(flipContainerRef.value, {
      width: 550, height: 700,
      size: 'fixed', autoSize: false,
      usePortrait: true, showCover: true,
      maxShadowOpacity: 0.1, flippingTime: 400,
      swipeDistance: 40, renderWhileFlipping: false,
      mobileScrollSupport: false,
    })
    pageFlip.loadFromHTML(pageElements)

    // 初始化页数据
    nextTick(() => {
      const allPages = flipContainerRef.value.querySelectorAll('.flip-page')
      totalPages.value = Math.max(0, allPages.length - 2) // 减封面/底页
      markPageEnter()  // 标记进入首页时间
    })

    statusMsg.value = ''
    progressPercent.value = 0
    currentFontSize = fontSize

    // 翻页事件
    pageFlip.on('flip', (e) => {
      currentPage.value = e.data ?? pageFlip.getCurrentPageIndex()
      recordPageTurn()      // 记录上一页时长并更新统计
    })
  } catch (err) {
    console.error('分页失败:', err)
    if (id === taskId) statusMsg.value = '加载失败，请重试'
  }
}

// ---- 翻页与高亮（不变） ----
function flipToPage(pageIndex, highlightText = null) { /* 不变 */ }
function highlightOnPage(text, targetIndex) { /* 不变 */ }
function jumpToChapter(title) { /* 不变 */ }

defineExpose({ flipToPage, jumpToChapter, currentPage, getCurrentPageText })

// ---- 生命周期 ----
function reInit() { destroyFlip(); statusMsg.value = '正在准备...'; nextTick().then(initFlip) }
function onKeyDown(e) { /* 键盘翻页 */ }

watch(() => props.reader.fontSize.value, (v) => { if (v !== currentFontSize) reInit() })
watch(() => props.reader.fullText.value, () => reInit())

onMounted(async () => {
  await nextTick()
  initFlip()
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  taskId = 0
  destroyFlip()
  destroyStats() // 清理统计定时器
})
</script>
<style src="./ThreeReader.css"></style>

<style scoped>
.three-reader {
  width: 550px;
  height: 700px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: visible;
  background: #fafafa;
  position: relative;
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 10px;
}

.progress-fill {
  height: 100%;
  background: #60a5fa;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 纸签容器 */
.paper-bookmark {
  position: absolute;
  top: -2px;
  right: -4px;
  z-index: 15;
  cursor: pointer;
  filter: drop-shadow(1px 2px 4px rgba(0, 0, 0, 0.2));
  transition: transform 0.2s ease;
}

.paper-bookmark:hover {
  transform: translateY(-2px) rotate(-2deg);
}

.bookmark-body {
  width: 20px;
  height: 50px;
  background: linear-gradient(135deg, #f7e9d0 0%, #e7d2b5 100%);
  border: 1px solid #b8977a;
  border-radius: 2px 8px 2px 2px;
  writing-mode: vertical-rl;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bookmark-char {
  font-size: 11px;
  color: #8b5e3c;
  font-family: 'KaiTi', '楷体', 'Noto Serif SC', serif;
  letter-spacing: 2px;
}

.bookmark-tassel {
  width: 2px;
  height: 10px;
  background: #c4493e;
  margin: 0 auto;
  position: relative;
}

.bookmark-tassel::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: -4px;
  width: 10px;
  height: 8px;
  background: radial-gradient(circle, #c4493e 20%, transparent 80%);
  border-radius: 50%;
}



.comment-dot:hover::after {
  content: attr(title);
  position: absolute;
  top: -24px;
  right: 0;
  background: #f7e9d0;
  color: #5a3e2b;
  border: 1px solid #b8977a;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 50;
  font-family: 'KaiTi', '楷体', serif;
}

.footer-info {
  position: absolute;
  bottom: 8px;
  left: 24px;
  right: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  z-index: 5;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'SimHei', sans-serif;
}

.footer-info .time {
  text-align: left;
  flex: 1;
}

.footer-info .page-num {
  text-align: center;
  flex: 1;
}

.footer-info .remain {
  text-align: right;
  flex: 1;
}
</style>