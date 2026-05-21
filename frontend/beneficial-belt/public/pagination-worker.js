// pagination-worker.js v6 – 所有段落首行统一缩进
console.log('✅ Worker v6 (universal paragraph indent) loaded');

self.onmessage = function(e) {
  const { text, fontSize, pageWidth, pageHeight } = e.data;

  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  const font = `${fontSize}px 'Inter', system-ui, sans-serif`;
  ctx.font = font;
  const lineHeight = fontSize * 1.8;

  const pad = 24;
  const contentWidth = pageWidth - pad * 2;
  const contentHeight = pageHeight - pad * 2;
  const maxLinesPerPage = Math.floor(contentHeight / lineHeight);

  // 缩进宽度（2em）
  const indentWidth = fontSize * 2;
  const indentStr = '　　'; // 两个全角空格，视觉等价于2em

  // ---------- 断行 ----------
  const lines = [];
  const paragraphs = text.split('\n');

  for (let p = 0; p < paragraphs.length; p++) {
    let para = paragraphs[p];

    if (para === '') {
      lines.push({
        text: '',
        width: 0,
        height: lineHeight,
        paragraphId: p,
        indent: false,   // 空行不缩进
        isFirst: true,
        isLast: true
      });
      continue;
    }

    // 清除前导空白
    para = para.trimStart();
    if (para === '') {
      lines.push({ text: '', width: 0, height: lineHeight, paragraphId: p, indent: false, isFirst: true, isLast: true });
      continue;
    }

    let remaining = para;
    let isFirstLine = true;

    while (remaining.length > 0) {
      // 计算当前行最大宽度
      const maxWidth = isFirstLine ? contentWidth - indentWidth : contentWidth;

      let low = 0, high = remaining.length, best = 0;
      while (low <= high) {
        const mid = (low + high) >>> 1;
        if (ctx.measureText(remaining.substring(0, mid)).width <= maxWidth) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      let lineText = remaining.substring(0, best);
      let cutPos = best;

      // 英文单词保护
      if (best < remaining.length && remaining[best] !== ' ') {
        const lastSpace = lineText.lastIndexOf(' ');
        if (lastSpace > 0) {
          lineText = lineText.substring(0, lastSpace);
          cutPos = lastSpace + 1;
        }
      }

      lineText = lineText.trimEnd();
      let nextStart = cutPos;
      while (nextStart < remaining.length && remaining[nextStart] === ' ') {
        nextStart++;
      }

      const isLast = (nextStart >= remaining.length);
      lines.push({
        text: lineText,
        width: ctx.measureText(lineText).width,   // 不含缩进的宽度
        height: lineHeight,
        paragraphId: p,
        indent: isFirstLine,    // 只有段落首行需要缩进
        isFirst: isFirstLine,
        isLast
      });
      isFirstLine = false;
      remaining = remaining.substring(nextStart);
    }
  }

  // 移除开头连续空行
  while (lines.length > 0 && lines[0].text === '') {
    lines.shift();
  }

  // ---------- 分页 + 孤行控制 ----------
  const pages = [];
  let startIdx = 0;

  while (startIdx < lines.length) {
    let maxLines = Math.min(maxLinesPerPage, lines.length - startIdx);
    let endIdx = startIdx + maxLines - 1;

    // 页末孤行控制
    if (lines[endIdx].isFirst && !lines[endIdx].isLast) {
      if (endIdx + 1 < lines.length && (endIdx + 1 - startIdx + 1) <= maxLinesPerPage) {
        endIdx++;
      } else {
        endIdx--;
      }
    }

    // 页首孤行控制
    if (lines[startIdx].isLast && !lines[startIdx].isFirst) {
      if (startIdx > 0 && (endIdx - startIdx + 2) <= maxLinesPerPage) {
        startIdx--;
        maxLines = Math.min(maxLinesPerPage, lines.length - startIdx);
        endIdx = startIdx + maxLines - 1;
        if (lines[endIdx].isFirst && !lines[endIdx].isLast) {
          if (endIdx + 1 < lines.length && (endIdx + 1 - startIdx + 1) <= maxLinesPerPage) {
            endIdx++;
          } else {
            endIdx--;
          }
        }
      }
    }

    if (endIdx < startIdx) endIdx = startIdx;

    // 拼接本页文本，为缩进行添加前缀
    const pageLines = lines.slice(startIdx, endIdx + 1);
    const pageText = pageLines
      .map(l => l.indent ? indentStr + l.text : l.text)
      .join('\n');

    const escaped = pageText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 不再需要 CSS text-indent，因为已用字符缩进
    const html = `<div style="
      width: 100%; height: 100%;
      padding: ${pad}px;
      box-sizing: border-box;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: ${fontSize}px;
      line-height: 1.8;
      white-space: pre-wrap;
      word-wrap: break-word;
      text-align: justify;
      overflow: hidden;
    ">${escaped}</div>`;

    pages.push(html);
    startIdx = endIdx + 1;
  }

  self.postMessage(pages);
};