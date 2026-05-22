// useReadingStats.js
// 阅读统计与页脚数据，基于最近页滑动窗口计算速度

import { ref, computed, onBeforeUnmount } from 'vue'

export function useReadingStats(textProvider, currentPage, totalPages, flipContainerRef) {
  // 时间
  const currentTime = ref('')
  let timeTimer = null

  // 阅读速度记录：每页的阅读秒数（最近5页）
  const recentPageDurations = []
  const MAX_SAMPLES = 5
  let pageEnterTime = null    // 进入当前页的时间戳

  // 计算结果
  const readingSpeed = ref(0) // 字/分钟（基于最近页平均时长和平均每页字数）
  const remainingTime = ref(0)

  // 更新时钟
  function updateCurrentTime() {
    const now = new Date()
    currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 记录进入页面时间
  function markPageEnter() {
    pageEnterTime = Date.now()
  }

  // 翻页时调用：计算上一页阅读时长并加入窗口
  function recordPageTurn() {
    if (pageEnterTime) {
      const duration = (Date.now() - pageEnterTime) / 1000 // 秒
      if (duration > 0.5 && duration < 1800) { // 过滤异常值（<0.5秒可能未读，>30分钟视为挂机）
        recentPageDurations.push(duration)
        if (recentPageDurations.length > MAX_SAMPLES) {
          recentPageDurations.shift()
        }
      }
    }
    // 更新进入时间
    markPageEnter()

    // 计算平均每页秒数
    if (recentPageDurations.length > 0) {
      const avgSecondsPerPage = recentPageDurations.reduce((a, b) => a + b, 0) / recentPageDurations.length
      // 估算每页平均字数（基于全书和当前总页数）
      const fullText = textProvider()
      const totalPagesVal = totalPages.value || 1
      const avgCharsPerPage = fullText.length / totalPagesVal
      // 阅读速度（字/分钟）
      readingSpeed.value = Math.round((avgCharsPerPage / avgSecondsPerPage) * 60)
      // 剩余页数
      const remainingPages = totalPagesVal - (currentPage.value || 0)
      // 剩余时间（分钟）
      remainingTime.value = Math.ceil((remainingPages * avgSecondsPerPage) / 60)
    } else {
      // 无样本，默认速度
      readingSpeed.value = 300
      const remainingPages = (totalPages.value || 1) - (currentPage.value || 0)
      remainingTime.value = Math.ceil(remainingPages / (300 / 100)) // 粗略
    }
  }

  // 启动时钟
  function startClock() {
    updateCurrentTime()
    timeTimer = setInterval(updateCurrentTime, 60000)
  }

  // 销毁
  function destroy() {
    clearInterval(timeTimer)
  }

  return {
    currentTime,
    readingSpeed,
    remainingTime,
    markPageEnter,
    recordPageTurn,
    startClock,
    destroy
  }
}