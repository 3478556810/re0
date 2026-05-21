export function paginate(text, pageWidth, pageHeight, fontSize) {
  const sample = text.slice(0, 2000)
  if (!sample) return ['']

  const testEl = document.createElement('div')
  testEl.style.cssText = `
    position: absolute; visibility: hidden;
    width: ${pageWidth}px;
    padding: 24px; box-sizing: border-box;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: ${fontSize}px;
    line-height: 1.8;
    white-space: pre-wrap;
    word-wrap: break-word;
  `
  document.body.appendChild(testEl)

  const pages = []
  let start = 0

  while (start < sample.length) {
    // 二分查找能容纳的最大字符数
    let low = 1, high = sample.length - start, best = 1
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      testEl.textContent = sample.slice(start, start + mid)
      if (testEl.scrollHeight <= pageHeight) {
        best = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    let end = start + best
    // ★ 段落保护：回退到最近的换行符，避免段落被截断
    if (end < sample.length) {
      const segment = sample.slice(start, end)
      const lastNewline = segment.lastIndexOf('\n')
      // 如果换行符位于后半段（说明这一页大部分内容都在同一段落），则回退
      if (lastNewline > best * 0.5) {
        end = start + lastNewline + 1
      }
    }

    const pageText = sample.slice(start, end)
    const pageHtml = `
      <div style="
        width: 100%; height: 100%;
        padding: 24px; box-sizing: border-box;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: ${fontSize}px;
        line-height: 1.8;
        white-space: pre-wrap;
        word-wrap: break-word;
        text-align: justify;
        text-indent: ${fontSize * 2}px;
      ">${pageText}</div>
    `
    pages.push(pageHtml)
    start = end
  }

  document.body.removeChild(testEl)
  return pages
}