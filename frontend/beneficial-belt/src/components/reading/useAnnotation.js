import { ref } from 'vue'

const STORAGE_KEY = 'shanxi_annotations'

export function useAnnotation(flipContainerRef, currentPage) {
  const showCommentCard = ref(false)
  const commentCardStyle = ref({})
  const displayedComment = ref('')
  const commentTyping = ref(false)
  let typingTimer = null

  // 选择菜单
  const showActionMenu = ref(false)
  const actionMenuStyle = ref({})
  const selectedRange = ref(null)
  const selectedText = ref('')

  const annotations = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

  // 监听选区变化的函数引用（用于移除监听）
  let selectionListener = null

  function clearTypingTimer() {
    if (typingTimer) {
      clearInterval(typingTimer)
      typingTimer = null
    }
  }

  function saveAnnotations() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations.value))
    window.dispatchEvent(new CustomEvent('annotations-updated'))
  }

  // 原地圈红
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

  // 打字机效果
  function typewrite(text) {
    clearTypingTimer()
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

  // 生成批注
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

  // 显示批注卡片（不再自动消失，保留手动关闭）
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

    // 保存批注
    annotations.value.push({
      text: selectedText.value,
      comment: resultText,
      page: currentPage.value,
      time: Date.now()
    })
    saveAnnotations()
  }

  // 关闭批注卡片
  function closeCard() {
    showCommentCard.value = false
    clearTypingTimer()
    commentTyping.value = false
  }

  // 关闭选择菜单（并移除选区监听）
  function closeActionMenu() {
    showActionMenu.value = false
    removeSelectionListener()
  }

  // 添加选区变化监听
  function addSelectionListener() {
    // 避免重复添加
    if (selectionListener) return
    selectionListener = () => {
      const selection = window.getSelection()
      if (!selection || selection.toString().trim().length === 0) {
        closeActionMenu()
      }
    }
    document.addEventListener('selectionchange', selectionListener)
  }

  // 移除选区变化监听
  function removeSelectionListener() {
    if (selectionListener) {
      document.removeEventListener('selectionchange', selectionListener)
      selectionListener = null
    }
  }

  // 用户选择"批注"
  async function chooseComment() {
    const text = selectedText.value
    const range = selectedRange.value
    if (!text || !range) return
    closeActionMenu() // 菜单关闭，移除监听
    highlightText(text, range)
    const comment = await generateComment(text)
    showResultCard(text, range, comment)
  }

  // 用户选择"搜索"
  function chooseSearch() {
    const text = selectedText.value
    if (!text) return
    closeActionMenu()
    window.dispatchEvent(new CustomEvent('search-text', { detail: { text } }))
  }

  // 鼠标抬起事件：弹出选择菜单
  function onMouseUp(event) {
    const selection = window.getSelection()
    const text = selection.toString().trim()
    if (text.length === 0) return

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

    // 监听选区变化：当取消选中时自动关闭菜单
    addSelectionListener()
  }

  return {
    showCommentCard,
    commentCardStyle,
    displayedComment,
    commentTyping,
    annotations,
    showActionMenu,
    actionMenuStyle,
    onMouseUp,
    closeCard,
    chooseComment,
    chooseSearch
  }
}