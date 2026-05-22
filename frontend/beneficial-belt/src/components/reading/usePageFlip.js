import { ref } from 'vue'
import { PageFlip } from 'page-flip'
import { exactPaginate } from './ExactPaginator.js'
import { getCachedPages, setCachedPages } from './cachePagination.js'

export function usePageFlip(flipContainerRef, reader, width, height) {
  const currentPage = ref(0)
  const totalPages = ref(0)
  let pageFlip = null
  let taskId = 0

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

  async function initFlip() {
    if (!flipContainerRef.value) return

    const id = ++taskId
    destroyFlip()
    const w = width.value
    const h = height.value
    flipContainerRef.value.style.width = w + 'px'
    flipContainerRef.value.style.height = h + 'px'

    const fontSize = reader.fontSize.value
    const text = reader.fullText.value || ''
    const bookId = reader.title.value || 'unknown'

    try {
      let htmlPages = await getCachedPages(bookId, fontSize, w, h)

      if (!htmlPages) {
        const bodyPages = await exactPaginate(text, fontSize, w, h, () => {})
        if (id !== taskId) return
        if (!bodyPages || bodyPages.length === 0) {
          console.warn('分页结果为空')
          htmlPages = [createCoverHTML(reader.title.value), `<div style="padding:24px;white-space:pre-wrap;">${escapeHtml(text)}</div>`, createBackHTML()]
        } else {
          const cover = createCoverHTML(reader.title.value)
          const back = createBackHTML()
          htmlPages = [cover, ...bodyPages, back]
        }
        await setCachedPages(bookId, fontSize, w, h, htmlPages)
      }

      if (id !== taskId) return

      const pageElements = htmlPages.map(html => {
        const div = document.createElement('div')
        div.className = 'flip-page'
        div.style.width = w + 'px'
        div.style.height = h + 'px'
        div.innerHTML = html
        return div
      })

      if (id !== taskId || !flipContainerRef.value) return

      pageFlip = new PageFlip(flipContainerRef.value, {
        width: w,
        height: h,
        size: 'fixed',
        autoSize: false,
        usePortrait: true,
        showCover: true,
        maxShadowOpacity: 0.1,
        flippingTime: 400,
        swipeDistance: 30,
        useMouseEvents: false,
        mobileScrollSupport: false,
        renderWhileFlipping: false,
      })
      pageFlip.loadFromHTML(pageElements)
      totalPages.value = Math.max(0, htmlPages.length - 2)

      return pageFlip // 返回实例，供外部绑定事件
    } catch (err) {
      console.error('分页失败:', err)
      throw err
    }
  }

  function flipToPage(pageIndex, highlightText = null, highlightFn = null) {
    if (!pageFlip) return
    const target = pageIndex + 1
    if (typeof pageFlip.turnToPage === 'function') {
      pageFlip.turnToPage(target)
    } else if (typeof pageFlip.flip === 'function') {
      pageFlip.flip(target)
    } else {
      const current = pageFlip.getCurrentPageIndex()
      const diff = target - current
      const fn = diff > 0 ? () => pageFlip.flipNext() : () => pageFlip.flipPrev()
      for (let i = 0; i < Math.abs(diff); i++) setTimeout(fn, i * 100)
    }
    if (highlightText && highlightFn) {
      setTimeout(() => requestAnimationFrame(() => highlightFn(highlightText, target)), 450)
    }
  }

  function flipToPhysicalPage(pageIndex) {
    if (!pageFlip) return
    if (typeof pageFlip.turnToPage === 'function') {
      pageFlip.turnToPage(pageIndex)
    } else if (typeof pageFlip.flip === 'function') {
      pageFlip.flip(pageIndex)
    } else {
      const current = pageFlip.getCurrentPageIndex()
      const diff = pageIndex - current
      const fn = diff > 0 ? () => pageFlip.flipNext() : () => pageFlip.flipPrev()
      for (let i = 0; i < Math.abs(diff); i++) setTimeout(fn, i * 100)
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

  async function flipToCoverAnimated() {
    if (!pageFlip) return
    const STEP_DELAY = 180
    const COVER_PAUSE = 1000
    const current = pageFlip.getCurrentPageIndex()

    if (current === 0) {
      await new Promise(r => setTimeout(r, COVER_PAUSE))
      return
    }

    if (current > 5) {
      pageFlip.turnToPage?.(5) ?? pageFlip.flip?.(5)
      await new Promise(r => requestAnimationFrame(r))
    }

    for (let i = 0; i < 5; i++) {
      if (pageFlip.getCurrentPageIndex() <= 0) break
      pageFlip.flipPrev()
      await new Promise(resolve => {
        const onFlip = () => { pageFlip.off('flip', onFlip); resolve() }
        pageFlip.on('flip', onFlip)
        setTimeout(() => { pageFlip.off('flip', onFlip); resolve() }, 1000)
      })
      await new Promise(r => setTimeout(r, STEP_DELAY))
    }
    await new Promise(r => setTimeout(r, COVER_PAUSE))
  }

  // 左右翻页快捷方法
  function flipPrev() { if (pageFlip) pageFlip.flipPrev() }
  function flipNext() { if (pageFlip) pageFlip.flipNext() }

  return {
    currentPage,
    totalPages,
    pageFlip,  // 暴露实例
    initFlip,
    destroyFlip,
    flipToPage,
    flipToPhysicalPage,
    jumpToChapter,
    flipToCoverAnimated,
    flipPrev,
    flipNext,
  }
}