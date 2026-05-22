<template>
  <div class="three-reader" ref="flipContainerRef">
    <EmotionGlow />
    <div v-if="isCurrentPageBookmarked" class="paper-bookmark" @click="removeCurrentBookmark">
      <div class="bookmark-body"><span class="bookmark-char">签</span></div>
      <div class="bookmark-tassel"></div>
    </div>

    <div class="footer-info" v-if="pageFlip">
      <span class="time">{{ currentTime }}</span>
      <span class="page-num">{{ currentPage + 1 }} / {{ totalPages }}</span>
      <span class="remain">剩余约 {{ remainingTime }} 分钟</span>
    </div>

    <!-- 选中批注卡片 -->
    <div v-if="showCommentCard" class="comment-card" :style="commentCardStyle" @click.stop>
      <div class="comment-text">{{ displayedComment }}</div>
      <span v-if="commentTyping" class="typing-cursor">|</span>
      <button class="close-card" @click="closeCard">
        <Icon icon="ph:x" width="14" />
      </button>
    </div>

    <!-- 左右翻页点击区域（桌面端用） -->
    <div class="flip-tap-area left" @click.stop="flipPrev"></div>
    <div class="flip-tap-area right" @click.stop="flipNext"></div>

    <div v-if="statusMsg" class="status-overlay">
      <div class="status-box">
        <span class="status-text">{{ statusMsg }}</span>
        <div v-if="statusMsg.includes('排版')" class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 选择菜单：批注 or 搜索 -->
<div v-if="showActionMenu" class="action-menu" :style="actionMenuStyle" @click.stop>
  <div class="menu-item" @click="chooseComment">
    <Icon icon="ph:pen" width="16" />
    <span>批注</span>
  </div>
  <div class="menu-item" @click="chooseSearch">
    <Icon icon="ph:magnifying-glass" width="16" />
    <span>搜索</span>
  </div>
</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { PageFlip } from 'page-flip'
import { Icon } from '@iconify/vue'
import { getCachedPages, setCachedPages } from './cachePagination.js'
import EmotionGlow from './EmotionGlow.vue'
import { exactPaginate } from './ExactPaginator.js'
import { useReadingStats } from './useReadingStats.js'
import { useBookmarks } from './useBookmarks.js'
import { useAnnotation } from './useAnnotation.js'

const props = defineProps({ reader: Object })
const flipContainerRef = ref(null)
const statusMsg = ref('正在准备...')
const progressPercent = ref(0)
let pageFlip = null
let currentFontSize = null
let taskId = 0

const currentPage = ref(0)
const totalPages = ref(0)

// 书签
const { isCurrentPageBookmarked, getCurrentPageText, removeCurrentBookmark } = useBookmarks(
  props.reader, currentPage, flipContainerRef, pageFlip
)

// 阅读统计
const textProvider = () => props.reader.fullText.value || ''
const stats = useReadingStats(textProvider, currentPage, totalPages, flipContainerRef)
const { currentTime, remainingTime, markPageEnter, recordPageTurn, startClock, destroy: destroyStats } = stats

// 选中批注
const {   showCommentCard, commentCardStyle, displayedComment, commentTyping, 
  showActionMenu, actionMenuStyle, onMouseUp, closeCard, 
  chooseComment, chooseSearch  } =useAnnotation(flipContainerRef, currentPage)  

// ---- HTML 辅助 ----
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

// ---- 翻页管理 ----
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

// 左右点击翻页
function flipPrev() { if (pageFlip) pageFlip.flipPrev() }
function flipNext() { if (pageFlip) pageFlip.flipNext() }

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
      div.style.width = '550px'; div.style.height = '700px'
      div.innerHTML = html
      return div
    })

    if (id !== taskId || !flipContainerRef.value) return

    pageFlip = new PageFlip(flipContainerRef.value, {
      width: 550, height: 700,
      size: 'fixed', autoSize: false,
      usePortrait: true, showCover: true,
      maxShadowOpacity: 0.1, flippingTime: 400,
      swipeDistance: 30,
      useMouseEvents: false,    // 禁用鼠标交互，完全由我们自定义的左右区域负责点击
      mobileScrollSupport: false,
      renderWhileFlipping: false,
    })
    pageFlip.loadFromHTML(pageElements)

    nextTick(() => {
      const allPages = flipContainerRef.value.querySelectorAll('.flip-page')
      totalPages.value = Math.max(0, allPages.length - 2)
      markPageEnter()
    })

    statusMsg.value = ''
    progressPercent.value = 0
    currentFontSize = fontSize

    pageFlip.on('flip', (e) => {
      currentPage.value = e.data ?? pageFlip.getCurrentPageIndex()
      recordPageTurn()
    })
  } catch (err) {
    console.error('分页失败:', err)
    if (id === taskId) statusMsg.value = '加载失败，请重试'
  }
}

// 翻页与高亮（保持原样，用于侧边栏跳转）
function flipToPage(pageIndex, highlightText = null) {
  if (!pageFlip) return
  const targetIndex = pageIndex + 1
  try {
    pageFlip.turnToPage?.(targetIndex) ?? pageFlip.flip?.(targetIndex)
  } catch {
    const current = pageFlip.getCurrentPageIndex()
    const diff = targetIndex - current
    const fn = diff > 0 ? () => pageFlip.flipNext() : () => pageFlip.flipPrev()
    for (let i = 0; i < Math.abs(diff); i++) setTimeout(fn, i * 100)
  }
  if (highlightText) {
    setTimeout(() => requestAnimationFrame(() => highlightOnPage(highlightText, targetIndex)), 450)
  }
}

function highlightOnPage(text, targetIndex) {
  const container = flipContainerRef.value
  if (!container || !text) return
  const pages = container.querySelectorAll('.flip-page')
  if (targetIndex >= pages.length) return
  const page = pages[targetIndex]
  if (!page?.textContent.includes(text)) return
  if (page.querySelector(`span.shanxi-highlight[data-quote="${text}"]`)) return

  const innerDiv = page.querySelector('div:first-child')
  if (!innerDiv) return

  const walker = document.createTreeWalker(innerDiv, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walker.nextNode())) {
    const idx = node.textContent.indexOf(text)
    if (idx !== -1) {
      const before = document.createTextNode(node.textContent.slice(0, idx))
      const after = document.createTextNode(node.textContent.slice(idx + text.length))
      const span = document.createElement('span')
      span.className = 'shanxi-highlight'
      span.setAttribute('data-quote', text)
      span.textContent = text
      span.title = '杉汐批：此句妙极。'
      Object.assign(span.style, {
        outline: '2px solid rgba(180,80,50,0.6)',
        outlineOffset: '1px',
        borderRadius: '6px',
        boxShadow: '0 0 0 3px rgba(180,80,50,0.2)',
        display: 'inline',
        lineHeight: 'inherit',
        padding: '0',
        margin: '0'
      })
      const parent = node.parentNode
      parent.insertBefore(before, node)
      parent.insertBefore(span, node)
      parent.insertBefore(after, node)
      parent.removeChild(node)
      break
    }
  }
}

function jumpToChapter(title) {
  if (!flipContainerRef.value || !pageFlip) return
  const pages = flipContainerRef.value.querySelectorAll('.flip-page')
  for (let i = 1; i < pages.length - 1; i++) {
    if (pages[i].textContent.includes(title)) {
      pageFlip.turnToPage?.(i) ?? pageFlip.flip?.(i)
      return
    }
  }
}

// 直接翻到物理页码（不偏移）
function flipToPhysicalPage(pageIndex) {
  if (!pageFlip) return
  try {
    pageFlip.turnToPage?.(pageIndex) ?? pageFlip.flip?.(pageIndex)
  } catch {
    // 回退手动翻页
    const current = pageFlip.getCurrentPageIndex()
    const diff = pageIndex - current
    const fn = diff > 0 ? () => pageFlip.flipNext() : () => pageFlip.flipPrev()
    for (let i = 0; i < Math.abs(diff); i++) setTimeout(fn, i * 100)
  }
}

function flipToCover() {
  if (!pageFlip) return
  const current = pageFlip.getCurrentPageIndex()
  if (current === 0) return // 已经在封面，无需翻页
  // 直接跳转到索引 0（封面），使用 turnToPage 触发动画
  if (typeof pageFlip.turnToPage === 'function') {
    pageFlip.turnToPage(0)
  } else {
    // 回退手动翻页
    pageFlip.flip(0)
  }
}
// 在 defineExpose 之前添加
// 在 defineExpose 之前添加
async function flipToCoverAnimated() {
  if (!pageFlip) return

  const stepDelay = 50                    // 每步翻页间隔 200ms（可根据需要调整）
  const coverPause = 1000                 // 封面停留 1s
  const current = pageFlip.getCurrentPageIndex()

  if (current === 0) {
    // 已经在封面，直接停留 1s
    await new Promise(r => setTimeout(r, coverPause))
    return
  }

  // 等待一次翻页完成的辅助函数（监听 flip 事件）
  const waitForFlip = () => new Promise(resolve => {
    const handler = () => {
      pageFlip.off('flip', handler)
      resolve()
    }
    pageFlip.on('flip', handler)
  })

  // 快速往前翻页，每次翻一页，直到封面（索引 0）
  while (pageFlip.getCurrentPageIndex() > 0) {
    pageFlip.flipPrev()
    await waitForFlip()                     // 等待本次翻页动画完成
    await new Promise(r => setTimeout(r, stepDelay))  // 额外停顿，制造“唰唰”效果
  }

  // 封面停留 1 秒
  await new Promise(r => setTimeout(r, coverPause))
}



// 暴露给父组件


defineExpose({ flipToPage, flipToPhysicalPage,flipToCover,  flipToCoverAnimated,jumpToChapter, currentPage, getCurrentPageText })


// 生命周期
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

watch(() => props.reader.fontSize.value, (v) => { if (v !== currentFontSize) reInit() })
watch(() => props.reader.fullText.value, () => reInit())

onMounted(async () => {
  startClock()
  await nextTick()
  await initFlip()
  // 只监听选中文字事件，不再拦截全局点击
  flipContainerRef.value?.addEventListener('mouseup', onMouseUp)
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  flipContainerRef.value?.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('keydown', onKeyDown)
  taskId = 0
  destroyFlip()
  destroyStats()
})

</script>

<style src="./ThreeReader.css"></style>
<style scoped>
.three-reader { width: 550px; height: 700px; margin: 0 auto; border-radius: 12px; overflow: visible; background: #fafafa; position: relative; }
.progress-bar { width: 200px; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden; margin-top: 10px; }
.progress-fill { height: 100%; background: #60a5fa; border-radius: 2px; transition: width 0.3s ease; }
.paper-bookmark { position: absolute; top: -2px; right: -4px; z-index: 15; cursor: pointer; filter: drop-shadow(1px 2px 4px rgba(0,0,0,0.2)); transition: transform 0.2s ease; }
.paper-bookmark:hover { transform: translateY(-2px) rotate(-2deg); }
.bookmark-body { width: 20px; height: 50px; background: linear-gradient(135deg, #f7e9d0 0%, #e7d2b5 100%); border: 1px solid #b8977a; border-radius: 2px 8px 2px 2px; writing-mode: vertical-rl; display: flex; align-items: center; justify-content: center; }
.bookmark-char { font-size: 11px; color: #8b5e3c; font-family: 'KaiTi', '楷体', 'Noto Serif SC', serif; letter-spacing: 2px; }
.bookmark-tassel { width: 2px; height: 10px; background: #c4493e; margin: 0 auto; position: relative; }
.bookmark-tassel::after { content: ''; position: absolute; bottom: -4px; left: -4px; width: 10px; height: 8px; background: radial-gradient(circle, #c4493e 20%, transparent 80%); border-radius: 50%; }
.footer-info { position: absolute; bottom: 8px; left: 24px; right: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: rgba(0,0,0,0.4); pointer-events: none; z-index: 5; font-family: 'PingFang SC', 'Microsoft YaHei', 'SimHei', sans-serif; }
.footer-info .time { text-align: left; flex: 1; }
.footer-info .page-num { text-align: center; flex: 1; }
.footer-info .remain { text-align: right; flex: 1; }
/* 批注卡片 */
.comment-card {
  position: absolute; z-index: 50; background: #f7e9d0; border: 1px solid #b8977a; border-radius: 8px;
  padding: 10px 14px; box-shadow: 2px 2px 12px rgba(0,0,0,0.15);
  font-family: 'KaiTi', '楷体', 'Noto Serif SC', serif; font-size: 13px; color: #3a2c1c;
  line-height: 1.6; word-break: break-word;
}
.comment-card .typing-cursor { color: #b8977a; animation: blink 0.8s infinite; }
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
.close-card { position: absolute; top: 4px; right: 6px; background: transparent; border: none; cursor: pointer; color: #8b5e3c; padding: 2px; }
/* 左右点击翻页区域 */
.flip-tap-area {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8%;           /* 两侧各占 25% 宽度 */
  z-index: 10;          /* 高于内容，低于卡片 */
  cursor: pointer;
  /* 调试时可临时加背景色查看区域：background: rgba(255,0,0,0.1); */
}
.flip-tap-area.left {
  left: 0;
}
.flip-tap-area.right {
  right: 0;
}

.action-menu {
  position: absolute;
  z-index: 60;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 4px;
  display: flex;
  flex-direction: column;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: background 0.2s;
}
.menu-item:hover {
  background: #f1f5f9;
}
</style>