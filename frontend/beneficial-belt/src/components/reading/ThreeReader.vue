<template>
  <div class="three-reader" ref="flipContainerRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { PageFlip } from 'page-flip'
import { paginate } from './pagination.js'

const props = defineProps({ reader: Object })
const flipContainerRef = ref(null)
let pageFlip = null
let currentFontSize = null

const destroyFlip = () => {
  if (pageFlip) {
    try { pageFlip.destroy() } catch (e) {}
    pageFlip = null
  }
}

// 同步创建页面，不再异步
const createPages = () => {
  const text = props.reader.fullText.value || ''
  if (!text) return []
  const fontSize = props.reader.fontSize.value
  const htmlPages = paginate(text, 550 - 48, 700 - 48, fontSize)
  return htmlPages.map(html => {
    const div = document.createElement('div')
    div.className = 'flip-page'
    div.innerHTML = html
    return div
  })
}

const initFlip = () => {
  if (!flipContainerRef.value) return
  destroyFlip()
  flipContainerRef.value.innerHTML = ''
  flipContainerRef.value.style.width = '550px'
  flipContainerRef.value.style.height = '700px'

  const pages = createPages()
  if (!pages || pages.length === 0) return

  pageFlip = new PageFlip(flipContainerRef.value, {
    width: 550,
    height: 700,
    size: 'fixed',
    autoSize: false,
    usePortrait: true,
    maxShadowOpacity: 0.3,
    showCover: false,
    flippingTime: 600,
    swipeDistance: 30,
  })

  pageFlip.loadFromHTML(pages)
}

const reInit = () => { destroyFlip(); nextTick().then(initFlip) }
const onKeyDown = e => {
  if (!pageFlip) return
  if (e.key === 'ArrowRight') pageFlip.flipNext()
  else if (e.key === 'ArrowLeft') pageFlip.flipPrev()
}

watch(() => props.reader.fontSize.value, v => {
  if (v !== currentFontSize) { currentFontSize = v; reInit() }
})
watch(() => props.reader.fullText.value, () => reInit())

onMounted(async () => {
  await nextTick()
  setTimeout(() => initFlip(), 200)
  document.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  destroyFlip()
})
</script>

<style>
.flip-page { background: #fafafa; }
</style>
<style scoped>
.three-reader {
  width: 550px; height: 700px; margin: 0 auto;
  border-radius: 12px; overflow: hidden; background: #fafafa; position: relative;
}
</style>