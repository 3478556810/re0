export function useChatLogic({ messages, userInput, sessionId, updateEmotion, saveMemory, lastTokenUsage, lastLatency }) {
  let msgId = 0

  const sendMessage = async () => {
    const question = userInput.value.trim()
  if (!question) return

  // 1. 立即添加用户消息
  messages.value.push({ 
    id: msgId++, 
    content: question, 
    sender: 'user'  // 明确标记发送者
  })
  userInput.value = ''

  // 构造请求体...（后续代码保持不变）
  const requestBody = {
    message: question,
    sessionId: sessionId.value,
      temperature: parseFloat(localStorage.getItem('debugTemp') || 0.7),
      top_p: parseFloat(localStorage.getItem('debugTopP') || 0.9),
      max_tokens: parseInt(localStorage.getItem('debugMaxTokens') || 2000),
      reasoning_effort: localStorage.getItem('debugReasoning') || undefined
    }

    // 切歌关键词检测
    const musicPattern = /(换首歌|切歌|下一首|来首|放点|放一首|切换|换一首|切一下|切个歌|换歌|换一个)/
    if (musicPattern.test(question)) {
      const musicState = window.__musicState
      if (musicState) {
        const nextIndex = (musicState.currentIndex + 1) % musicState.playlist.length
        requestBody.nextSong = {
          name: musicState.playlist[nextIndex].title,
          src: musicState.playlist[nextIndex].src
        }
      }
    }

    try {
      const token = localStorage.getItem('token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })
      if (!res.ok) throw new Error('Network error')
      const data = await res.json()
      console.log('📩 收到后端数据:', data) // 调试用，确认数据结构

      // 检查回复是否存在
      if (!data.reply) {
        console.error('❌ 后端没有返回 reply 字段', data)
        messages.value.push({ id: msgId++, content: '杉汐：抱歉，后端返回的数据格式有误…', sender: 'bot' })
        return
      }

      messages.value.push({ id: msgId++, content: data.reply, sender: 'bot' })
// 在 push 用户消息之后，加上这两行调试代码
console.log('🔍 [调试] messages 数组内容:', JSON.parse(JSON.stringify(messages.value)));
console.log('🔍 [调试] 最新一条消息:', messages.value[messages.value.length - 1]);
      // 更新 Token 消耗和延迟到调试面板
      if (lastTokenUsage) {
        lastTokenUsage.value = data.token_usage || '--'
      }
      if (lastLatency) {
        lastLatency.value = data.latency || '--'
      }

      if (data.emotion) updateEmotion(data.emotion)

      if (data.action) {
        window.dispatchEvent(new CustomEvent('shanxi-action', {
          detail: { action: data.action }
        }))
      }

      if (data.blog) {
        messages.value.push({
          id: msgId++,
          content: data.blog,
          sender: 'bot'
        })
        saveMemory('shanshi', data.blog)
      }

      saveMemory('leader', question)
      saveMemory('shanshi', data.reply)
    } catch (e) {
      console.error('❌ 杉汐回复失败:', e)
      messages.value.push({
        id: msgId++,
        content: '杉汐：抱歉，我的灵魂好像被风吹散了…稍等片刻可好？',
        sender: 'bot'
      })
    }
  }

  return { sendMessage }
}