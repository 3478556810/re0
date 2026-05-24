// src/components/reading/useMobileReader.js
import { ref, nextTick } from 'vue'

export function useMobileReader(flipContainerRef, reader, statusMsg, progressPercent, totalPages, currentPage) {
  const htmlPages = ref([])
  const mobilePageIndex = ref(0)
  const mobileSelectedText = ref('')
  const mobileSelectedRange = ref(null)
  const mobileSelectionStyle = ref({})

  // 封面/底页生成（与桌面端保持一致）
  function escapeHtml(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }
  function createCoverHTML(title) {
    const safe = escapeHtml(title)
    return `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1e2a3a,#2c3e50);display:flex;flex-direction:column;justify-content:center;align-items:center;color:#e8d5b7;font-family:Georgia,serif;"><h1>${safe}</h1><p>杉汐注</p></div>`
  }
  function createBackHTML() {
    return `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1e2a3a,#2c3e50);display:flex;justify-content:center;align-items:center;color:#e8d5b7;">封底</div>`
  }

  // 翻页
  function mobileFlipPrev() {
    if (mobilePageIndex.value > 0) {
      mobilePageIndex.value--
      currentPage.value = mobilePageIndex.value

    }
  }
  function mobileFlipNext() {
    if (mobilePageIndex.value < htmlPages.value.length - 1) {
      mobilePageIndex.value++
      currentPage.value = mobilePageIndex.value

    }
  }

  // 选中文字后的按钮显示
  function updateMobileSelection() {
    const selection = window.getSelection()
    const text = selection.toString().trim()
    if (text.length === 0) {
      mobileSelectedText.value = ''
      mobileSelectedRange.value = null
      return
    }
    const range = selection.getRangeAt(0).cloneRange()
    mobileSelectedText.value = text
    mobileSelectedRange.value = range

    const rect = range.getBoundingClientRect()
    mobileSelectionStyle.value = {
      position: 'fixed',
      left: `${rect.left + rect.width / 2 - 80}px`,
      top: `${rect.bottom + 4}px`,
      display: 'flex',
      gap: '8px',
      zIndex: 100
    }
  }

  // 触摸事件处理（不阻止默认行为，保证翻页正常）
  function onMobileTouchEnd() {
    setTimeout(() => {
      updateMobileSelection()
    }, 0)
  }

  // 移动端初始化：获取分页 HTML
  async function initMobileView() {
    const text = reader.fullText.value || ''
    const fontSize = reader.fontSize.value

    await nextTick()
    const w = flipContainerRef.value?.clientWidth
    const h = flipContainerRef.value?.clientHeight
    if (!w || !h) {
      setTimeout(initMobileView, 100)
      return
    }

    statusMsg.value = '正在排版... 0%'
    progressPercent.value = 0

    const { exactPaginate } = await import('./ExactPaginator.js')
    const bodyPages = await exactPaginate(text, fontSize, w, h, (pct) => {
      progressPercent.value = pct
    })

    const coverHTML = createCoverHTML(reader.title.value)
    const backHTML = createBackHTML()
    htmlPages.value = [coverHTML, ...bodyPages, backHTML]
    totalPages.value = htmlPages.value.length
    mobilePageIndex.value = 1
    currentPage.value = 1
    statusMsg.value = ''
    progressPercent.value = 0
  }

  return {
    htmlPages,
    mobilePageIndex,
    mobileSelectedText,
    mobileSelectionStyle,
    mobileFlipPrev,
    mobileFlipNext,
    onMobileTouchEnd,
    updateMobileSelection,
    initMobileView,
     mobileSelectedRange,   
    // 以下两个函数将在 ThreeReader 中与桌面端函数绑定
    handleMobileComment: null,
    handleMobileSearch: null
  }
}