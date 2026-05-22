<template>
  <div class="three-reader" ref="flipContainerRef">
    <EmotionGlow />
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
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { PageFlip } from 'page-flip'
import { getCachedPages, setCachedPages } from './cachePagination.js'
import EmotionGlow from './EmotionGlow.vue'
import { exactPaginate } from './ExactPaginator.js'

const props = defineProps({ reader: Object })
const flipContainerRef = ref(null)
const statusMsg = ref('正在准备...')
const progressPercent = ref(0)
let pageFlip = null
let currentFontSize = null
let taskId = 0

// ========== HTML 辅助函数 ==========
function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function createCoverHTML(rawTitle) {
  const safeTitle = escapeHtml(rawTitle)
  return `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1e2a3a 0%,#2c3e50 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:'Georgia','Noto Serif SC',serif;box-shadow:inset 0 0 60px rgba(0,0,0,0.4);border-radius:4px;"><div style="width:80px;height:2px;background:rgba(200,160,80,0.6);margin-bottom:2rem;"></div><h1 style="font-size:2.2rem;margin-bottom:0.5rem;color:#e8d5b7;text-shadow:0 2px 6px rgba(0,0,0,0.5);letter-spacing:4px;">${safeTitle}</h1><p style="font-size:1rem;color:rgba(200,160,80,0.8);letter-spacing:2px;">杉汐注</p><div style="margin-top:3rem;font-size:0.8rem;color:rgba(255,255,255,0.4);">—— 脂砚斋风 · 活态传承 ——</div></div>`
}

function createBackHTML() {
  return `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1e2a3a 0%,#2c3e50 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;box-shadow:inset 0 0 40px rgba(0,0,0,0.3);border-radius:4px;"><div style="width:60px;height:60px;border:1px solid rgba(200,160,80,0.4);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;"><span style="color:rgba(200,160,80,0.6);font-size:0.8rem;font-family:'Georgia',serif;">S</span></div><p style="color:rgba(200,160,80,0.6);font-size:0.85rem;letter-spacing:2px;">脂砚斋风 · 活态传承</p><p style="color:rgba(255,255,255,0.3);font-size:0.7rem;margin-top:2rem;">阅读小屋 · 杉汐</p></div>`
}

// ========== 翻页实例管理 ==========
function destroyFlip() {
  if (pageFlip) {
    try { pageFlip.destroy() } catch (e) { /* ignore */ }
    pageFlip = null
  }
  if (flipContainerRef.value) {
    const pages = flipContainerRef.value.querySelectorAll('.flip-page')
    pages.forEach(p => p.remove())
  }
}

// ========== 核心初始化 ==========
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
      
      const bodyPages = await exactPaginate(
        text,
        fontSize,
        550,
        700,
        (progress) => {
          statusMsg.value = `正在精确排版... ${progress}%`
          progressPercent.value = progress
        }
      )
      
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
      usePortrait: true,
      showCover: true,
      maxShadowOpacity: 0.1,
      flippingTime: 400,
      swipeDistance: 40,
      renderWhileFlipping: false,
      mobileScrollSupport: false,
    })
    pageFlip.loadFromHTML(pageElements)
    statusMsg.value = ''
    progressPercent.value = 0
    currentFontSize = fontSize
  } catch (err) {
    console.error('分页失败:', err)
    if (id === taskId) statusMsg.value = '加载失败，请重试'
  }
}

// ========== 翻页与高亮 ==========
function flipToPage(pageIndex, highlightText = null) {
  if (!pageFlip) return
  const targetIndex = pageIndex
  if (typeof pageFlip.turnToPage === 'function') {
    pageFlip.turnToPage(targetIndex)
  } else if (typeof pageFlip.flip === 'function') {
    pageFlip.flip(targetIndex)
  } else {
    const current = pageFlip.getCurrentPageIndex()
    const diff = targetIndex - current
    const fn = diff > 0 ? () => pageFlip.flipNext() : () => pageFlip.flipPrev()
    for (let i = 0; i < Math.abs(diff); i++) setTimeout(fn, i * 100)
  }
  if (highlightText) {
    setTimeout(() => {
      requestAnimationFrame(() => {
        highlightOnPage(highlightText, targetIndex)
      })
    }, 450)
  }
}

function highlightOnPage(text, targetIndex) {
  const container = flipContainerRef.value
  if (!container || !text) return
  const pages = container.querySelectorAll('.flip-page')
  if (targetIndex >= pages.length) return
  const page = pages[targetIndex]
  if (!page || !page.textContent.includes(text)) return
  if (page.querySelector(`mark.shanxi-highlight[data-quote="${text}"]`)) return

  const innerDiv = page.querySelector('div:first-child')
  if (!innerDiv) return

  const walker = document.createTreeWalker(innerDiv, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walker.nextNode())) {
    const idx = node.textContent.indexOf(text)
    if (idx !== -1) {
      const before = document.createTextNode(node.textContent.slice(0, idx))
      const after = document.createTextNode(node.textContent.slice(idx + text.length))
      const mark = document.createElement('mark')
      mark.className = 'shanxi-highlight'
      mark.setAttribute('data-quote', text)
      mark.textContent = text
      mark.style.backgroundColor = 'rgba(96, 165, 250, 0.35)'
      mark.style.boxShadow = '0 0 12px rgba(96, 165, 250, 0.5)'
      mark.style.borderRadius = '4px'
      mark.style.padding = '2px 4px'
      mark.style.color = 'inherit'
      const parent = node.parentNode
      parent.insertBefore(before, node)
      parent.insertBefore(mark, node)
      parent.insertBefore(after, node)
      parent.removeChild(node)
      break
    }
  }
}

// ★ 新增：章节跳转（搜索正文页面标题并翻页）
function jumpToChapter(title) {
  if (!flipContainerRef.value || !pageFlip) return
  const pages = flipContainerRef.value.querySelectorAll('.flip-page')
  // 跳过封面(0)和封底(最后)
  for (let i = 1; i < pages.length - 1; i++) {
    if (pages[i].textContent.includes(title)) {
      if (typeof pageFlip.turnToPage === 'function') {
        pageFlip.turnToPage(i)
      } else if (typeof pageFlip.flip === 'function') {
        pageFlip.flip(i)
      } else {
        const current = pageFlip.getCurrentPageIndex()
        const diff = i - current
        const fn = diff > 0 ? () => pageFlip.flipNext() : () => pageFlip.flipPrev()
        for (let j = 0; j < Math.abs(diff); j++) setTimeout(fn, j * 100)
      }
      return
    }
  }
  console.warn('未找到章节:', title)
}

defineExpose({ flipToPage, jumpToChapter })

// ========== 生命周期 ==========
function reInit() {
  destroyFlip()
  statusMsg.value = '正在准备...'
  nextTick().then(initFlip)
}

function onKeyDown(e) {
  if (!pageFlip) return
  if (e.key === 'ArrowRight') pageFlip.flipNext()
  else if (e.key === 'ArrowLeft') pageFlip.flipPrev()
}

watch(() => props.reader.fontSize.value, (v) => {
  if (v !== currentFontSize) reInit()
})
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
</style>