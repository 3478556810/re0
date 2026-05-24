import { ref } from 'vue'

const STORAGE_KEY = 'shanxi_annotations'

export function useAnnotation(flipContainerRef, currentPage) {
  const showCommentCard = ref(false)
  const commentCardStyle = ref({})
  const displayedComment = ref('')
  const commentTyping = ref(false)
  let typingTimer = null

  const showActionMenu = ref(false)
  const actionMenuStyle = ref({})
  const selectedRange = ref(null)
  const selectedText = ref('')

  const annotations = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

  let selectionListener = null

  function saveAnnotations() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations.value))
    window.dispatchEvent(new CustomEvent('annotations-updated'))
  }

  function highlightText(text, range) {
    const span = document.createElement('span')
    span.className = 'shanxi-highlight selected'
    span.textContent = text
    Object.assign(span.style, {
      outline: '2px solid rgba(180, 80, 50, 0.6)',
      outlineOffset: '1px',
      borderRadius: '6px',
      boxShadow: '0 0 0 3px rgba(180, 80, 50, 0.2)',
      display: 'inline',
      lineHeight: 'inherit',
      padding: '0',
      margin: '0'
    })
    range.deleteContents()
    range.insertNode(span)
  }

  function typewrite(text) {
    clearInterval(typingTimer)
    displayedComment.value = ''
    commentTyping.value = true
    let i = 0
    typingTimer = setInterval(() => {
      if (i < text.length) {
        displayedComment.value += text[i]
        i++
      } else {
        clearInterval(typingTimer)
        commentTyping.value = false
      }
    }, 40)
  }

  async function generateComment(text) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `请用一句话批注以下文字：“${text}”，语气像脂砚斋，直接给出批语，不要多余解释。`
        })
      })
      const data = await response.json()
      return data.reply || data.message || data.content || '此处妙极，值得细品。'
    } catch (e) {
      return '杉汐暂时无法批注，但此句确有深意。'
    }
  }

  function showResultCard(text, range, resultText) {
    const containerRect = flipContainerRef.value.getBoundingClientRect()
    const rect = range.getBoundingClientRect()
    const cardWidth = 240
    let left = rect.left - containerRect.left + rect.width / 2 - cardWidth / 2
    left = Math.max(8, Math.min(left, containerRect.width - cardWidth - 8))
    const top = rect.bottom - containerRect.top + 8
    commentCardStyle.value = {
      left: `${left}px`,
      top: `${Math.min(top, containerRect.height - 120)}px`,
      maxWidth: `${cardWidth}px`
    }
    showCommentCard.value = true
    displayedComment.value = ''
    commentTyping.value = true
    typewrite(resultText)

    annotations.value.push({
      text: selectedText.value,
      comment: resultText,
      page: currentPage.value,
      time: Date.now()
    })
    saveAnnotations()
  }

  function closeCard() {
    showCommentCard.value = false
    clearInterval(typingTimer)
    commentTyping.value = false
  }

  function closeActionMenu() {
    showActionMenu.value = false
  }

  // ★ 核心：监听选区变化，弹出/关闭菜单
  function initSelectionListener() {
    if (selectionListener) return
    selectionListener = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()

      if (!text || text.length === 0) {
        if (showActionMenu.value) closeActionMenu()
        return
      }

      const range = selection.getRangeAt(0).cloneRange()
      selectedText.value = text
      selectedRange.value = range

      const containerRect = flipContainerRef.value.getBoundingClientRect()
      const rect = range.getBoundingClientRect()
      const menuWidth = 140
      let left = rect.left - containerRect.left + rect.width / 2 - menuWidth / 2
      left = Math.max(8, Math.min(left, containerRect.width - menuWidth - 8))
      const top = rect.bottom - containerRect.top + 8

      actionMenuStyle.value = {
        left: `${left}px`,
        top: `${Math.min(top, containerRect.height - 60)}px`,
        width: `${menuWidth}px`
      }
      showActionMenu.value = true
    }
    document.addEventListener('selectionchange', selectionListener)
  }

  function removeSelectionListener() {
    if (selectionListener) {
      document.removeEventListener('selectionchange', selectionListener)
      selectionListener = null
    }
  }

  async function chooseComment() {
    const text = selectedText.value
    const range = selectedRange.value
    if (!text || !range) return
    showActionMenu.value = false
    highlightText(text, range)
    const comment = await generateComment(text)
    showResultCard(text, range, comment)
    window.getSelection()?.removeAllRanges()
  }

  function chooseSearch() {
    const text = selectedText.value
    if (!text) return
    showActionMenu.value = false
    window.dispatchEvent(new CustomEvent('search-text', { detail: { text } }))
    window.getSelection()?.removeAllRanges()
  }

  // 不再自动调用 initSelectionListener，由组件主动调用

  return {
    showCommentCard,
    commentCardStyle,
    displayedComment,
    commentTyping,
    annotations,
    showActionMenu,
    actionMenuStyle,
    closeCard,
    chooseComment,
    chooseSearch,
    initSelectionListener,   // ★ 暴露启动函数
    removeSelectionListener
  }
}