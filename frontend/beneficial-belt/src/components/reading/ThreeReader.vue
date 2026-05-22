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
import { Icon } from '@iconify/vue'
import EmotionGlow from './EmotionGlow.vue'
import { usePageFlip } from './usePageFlip.js'
import { useReadingStats } from './useReadingStats.js'
import { useBookmarks } from './useBookmarks.js'
import { useAnnotation } from './useAnnotation.js'

const props = defineProps({ reader: Object })
const flipContainerRef = ref(null)
const statusMsg = ref('正在准备...')
const progressPercent = ref(0)
let currentFontSize = null

const width = ref(550)
const height = ref(700)

// 翻页核心
const {
  currentPage,
  totalPages,
  pageFlip,
  initFlip,
  destroyFlip,
  flipToPage,
  flipToPhysicalPage,
  jumpToChapter,
  flipToCoverAnimated,
  flipPrev,
  flipNext,
} = usePageFlip(flipContainerRef, props.reader, width, height)

// 阅读统计
const textProvider = () => props.reader.fullText.value || ''
const stats = useReadingStats(textProvider, currentPage, totalPages, flipContainerRef)
const { currentTime, remainingTime, markPageEnter, recordPageTurn, startClock, destroy: destroyStats } = stats

// 书签
const { isCurrentPageBookmarked, getCurrentPageText, removeCurrentBookmark } = useBookmarks(
  props.reader, currentPage, flipContainerRef, pageFlip
)

// 选中批注
const {
  showCommentCard,
  commentCardStyle,
  displayedComment,
  commentTyping,
  showActionMenu,
  actionMenuStyle,
  onMouseUp,
  closeCard,
  chooseComment,
  chooseSearch,
} = useAnnotation(flipContainerRef, currentPage)

// 高亮函数（内部实现）
function highlightOnPage(text, targetIndex) {
  if (!flipContainerRef.value || !text) return
  const pages = flipContainerRef.value.querySelectorAll('.flip-page')
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

// 将高亮函数注入到 flipToPage 调用中（侧边栏跳转时使用）
function handleSidebarFlip(pageIndex, quote) {
  flipToPage(pageIndex, quote, highlightOnPage)
}

// 绑定翻页事件以更新阅读统计
function bindFlipEvent(flip) {
  if (!flip) return
  flip.on('flip', (e) => {
    currentPage.value = e.data ?? flip.getCurrentPageIndex()
    recordPageTurn()
  })
}

function onKeyDown(e) {
  if (!pageFlip) return
  if (e.key === 'ArrowRight') pageFlip.flipNext()
  else if (e.key === 'ArrowLeft') pageFlip.flipPrev()
}

async function reInit() {
  destroyFlip()
  statusMsg.value = '正在准备...'
  try {
    const flip = await initFlip()
    if (flip) {
      bindFlipEvent(flip)
      statusMsg.value = ''
    } else {
      statusMsg.value = '暂无内容'
    }
  } catch (e) {
    console.error('重新初始化失败:', e)
    statusMsg.value = '加载失败，请重试'
  }
}

watch(() => props.reader.fontSize.value, (v) => {
  if (v !== currentFontSize) reInit()
})
watch(() => props.reader.fullText.value, () => reInit())

onMounted(async () => {
  startClock()
  await nextTick()
  try {
    const flip = await initFlip()
    if (flip) {
      bindFlipEvent(flip)
      statusMsg.value = ''
    } else {
      statusMsg.value = '暂无内容'
    }
  } catch (e) {
    console.error('初始化翻页失败:', e)
    statusMsg.value = '加载失败，请重试'
  }
  flipContainerRef.value?.addEventListener('mouseup', onMouseUp)
  document.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => {
  flipContainerRef.value?.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('keydown', onKeyDown)
  destroyFlip()
  destroyStats()
})

defineExpose({
  flipToPage: handleSidebarFlip, // 侧边栏跳转使用带高亮的版本
  flipToPhysicalPage,
  jumpToChapter,
  currentPage,
  getCurrentPageText,
  flipToCoverAnimated,
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