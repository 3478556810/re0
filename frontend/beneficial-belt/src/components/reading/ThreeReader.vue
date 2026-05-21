<template>
  <div class="three-reader" ref="flipContainerRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { PageFlip } from 'page-flip'

const props = defineProps({
  reader: Object
})

const flipContainerRef = ref(null)
let pageFlip = null

// 生成演示页面（只取前2000字，分成两页）
// 生成演示页面（取前2000字，分成4页）
const createDemoPages = () => {
  const text = props.reader.fullText.value || ''
  const sampleText = text.slice(0, 2000)
  const charsPerPage = Math.ceil(sampleText.length / 4) // 分成4页
  
  const pages = []
  for (let i = 0; i < 4; i++) {
    const start = i * charsPerPage
    const end = start + charsPerPage
    const content = sampleText.slice(start, end)
    if (content.length === 0) break
    const div = document.createElement('div')
    div.className = 'flip-page'
    div.innerHTML = `<div style="padding: 24px; font-size: ${props.reader.fontSize.value}px; line-height: 1.8; white-space: pre-wrap; word-wrap: break-word;">${content}</div>`
    pages.push(div)
  }
  return pages
}
// 初始化翻页器
const initFlip = () => {
  if (!flipContainerRef.value) return

  const pages = createDemoPages()
  if (pages.length === 0) return

  pageFlip = new PageFlip(flipContainerRef.value, {
    width: 550,
    height: 700,
    size: 'stretch',
    maxShadowOpacity: 0.3,
    showCover: false,
    flippingTime: 600,
    usePortrait: false,
    autoSize: true,
    swipeDistance: 30,
  })

  pageFlip.loadFromHTML(pages)

  // 翻页事件（可在此同步页码）
  pageFlip.on('flip', (e) => {
    console.log('当前页:', e.data)
  })
}

// 键盘翻页
const onKeyDown = (e) => {
  if (!pageFlip) return
  if (e.key === 'ArrowRight') pageFlip.flipNext()
  else if (e.key === 'ArrowLeft') pageFlip.flipPrev()
}

onMounted(async () => {
  await nextTick()
  setTimeout(() => {
    initFlip()
  }, 100)
  document.addEventListener('keydown', onKeyDown)
})

watch(() => props.reader.fullText.value, () => {
  if (pageFlip) {
    pageFlip.destroy()
    pageFlip = null
  }
  initFlip()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  if (pageFlip) pageFlip.destroy()
})
</script>

<style scoped>
.three-reader {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a2e;
}
:deep(.flip-page) {
  background: #fafafa;
}
</style>