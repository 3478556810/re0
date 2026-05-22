import { ref } from 'vue'

const STORAGE_KEY = 'shanxi_annotations'

export function useAnnotation(flipContainerRef, currentPage) {
  const showCommentCard = ref(false)
  const commentCardStyle = ref({})
  const displayedComment = ref('')
  const commentTyping = ref(false)
  let typingTimer = null

  // 批注列表（持久化）
  const annotations = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

  function saveAnnotations() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations.value))
    window.dispatchEvent(new CustomEvent('annotations-updated'))
  }

  // 原地圈红（朱笔圈点）
  function highlightSelectedText(text, range) {
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

  // 调用杉汐生成批注
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

  // 弹出卡片
  async function showCard(text, range) {
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

    const comment = await generateComment(text)
    typewrite(comment)

    // 保存批注（包含当前页码）
    annotations.value.push({
      text,
      comment,
      page: currentPage.value,   // ★ 关键：记录当前页码
      time: Date.now()
    })
    saveAnnotations()
  }

  function closeCard() {
    showCommentCard.value = false
    clearInterval(typingTimer)
    commentTyping.value = false
  }

  // 鼠标抬起事件
  function onMouseUp(event) {
    const selection = window.getSelection()
    const text = selection.toString().trim()
    if (text.length === 0) return
    const range = selection.getRangeAt(0).cloneRange()
    // 立即圈红
    highlightSelectedText(text, range)
    // 弹出卡片
    showCard(text, range)
  }

  return {
    showCommentCard,
    commentCardStyle,
    displayedComment,
    commentTyping,
    annotations,
    onMouseUp,
    closeCard
  }
}