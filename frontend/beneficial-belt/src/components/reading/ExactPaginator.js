// ExactPaginator.js
// 基于 OffscreenCanvas 精确字符宽度的极速分页器
// 每个段落首行缩进 + 孤行控制，无留白

function createMeasureContext(fontSize) {
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px 'Inter', system-ui, sans-serif`;
  return ctx;
}

function measureWidth(ctx, text) {
  return ctx.measureText(text).width;
}

/**
 * 将一段文本按指定宽度断行，返回带段落首行标记的行数组
 * @param {OffscreenCanvasRenderingContext2D} ctx 
 * @param {string} text - 段落文本
 * @param {number} maxWidth - 内容区宽度
 * @param {number} indentWidth - 首行缩进宽度
 * @returns {Array<{text: string, isFirst: boolean}>}
 */
function breakParagraph(ctx, text, maxWidth, indentWidth) {
  const lines = [];
  let remaining = text;
  let isFirst = true;

  while (remaining.length > 0) {
    const available = isFirst ? maxWidth - indentWidth : maxWidth;
    const effectiveWidth = available < 0 ? 0 : available;

    let low = 0, high = remaining.length, bestFit = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const w = measureWidth(ctx, remaining.slice(0, mid));
      if (w <= effectiveWidth) {
        bestFit = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // 英文单词边界保护
    if (bestFit < remaining.length && remaining[bestFit] !== ' ' && remaining[bestFit] !== '\u3000') {
      const lastSpace = remaining.slice(0, bestFit).search(/[ \u3000][^ \u3000]*$/);
      if (lastSpace !== -1) {
        bestFit = lastSpace + 1; // 包含空格
      }
    }
    if (bestFit === 0) bestFit = 1; // 至少一个字符

    const lineText = remaining.slice(0, bestFit).trimEnd();
    lines.push({ text: lineText, isFirst });
    remaining = remaining.slice(bestFit).trimStart();
    isFirst = false;
  }
  return lines;
}

/**
 * 精确分页：每个段落首行缩进 + 孤行控制，零留白
 */
export async function exactPaginate(text, fontSize, pageWidth, pageHeight, onProgress) {
  const pad = 24;
  const contentWidth = pageWidth - pad * 2;
  const contentHeight = pageHeight - pad * 2;
  const lineHeight = fontSize * 1.8;
  const maxLinesPerPage = Math.floor(contentHeight / lineHeight);
  if (maxLinesPerPage < 1) maxLinesPerPage = 1;

  const ctx = createMeasureContext(fontSize);
  const indentWidth = fontSize * 2; // 两个全角空格宽度

  const paragraphs = text.split('\n');      // 保留空行
  const total = paragraphs.length;
  const pages = [];

  // 当前页已收集的行（对象数组）
  let currentLines = [];
  
  for (let i = 0; i < total; i++) {
    if (onProgress) {
      const pct = Math.floor((i / total) * 100);
      onProgress(pct);
    }

    const para = paragraphs[i];

    // 处理空行（段落间空行）
    if (para === '') {
      if (currentLines.length + 1 > maxLinesPerPage) {
        pages.push(flushPage(currentLines, fontSize));
        currentLines = [];
      }
      currentLines.push({ text: '', isFirst: false }); // 空行不需要缩进
      continue;
    }

    // 正常段落：断行
    const paraLines = breakParagraph(ctx, para, contentWidth, indentWidth);
    
    // 逐行加入当前页，同时进行孤行控制
    let lineIdx = 0;
    while (lineIdx < paraLines.length) {
      // 如果当前页已满，则分页
      if (currentLines.length >= maxLinesPerPage) {
        // 孤行控制：如果当前页最后一行是段落的开始（isFirst）且不是最后一行，则将其推到下一页
        if (currentLines[currentLines.length - 1].isFirst && lineIdx > 0 && paraLines[lineIdx - 1]?.isFirst === false) {
          // 将当前页的最后一行（即上一段的最后一行）挪到下一页？更简单的做法：将这一行（段首）放到下一页，当前页缩短一行
          const lastLine = currentLines.pop();
          pages.push(flushPage(currentLines, fontSize));
          currentLines = [lastLine]; // 新页以该行开始
        } else {
          pages.push(flushPage(currentLines, fontSize));
          currentLines = [];
        }
        continue; // 不增加 lineIdx，重新尝试放入该行
      }

      // 放入当前行
      currentLines.push(paraLines[lineIdx]);
      lineIdx++;
    }
  }

  // 处理最后一页
  if (currentLines.length > 0) {
    pages.push(flushPage(currentLines, fontSize));
  }

  if (onProgress) onProgress(100);
  return pages;
}

/**
 * 将收集的行数组生成一页 HTML
 */
function flushPage(lines, fontSize) {
  // 给每个需要缩进的行加上两个全角空格
  const indented = lines.map(l => {
    if (l.isFirst && l.text !== '') {
      return `\u3000\u3000${l.text}`;
    }
    return l.text;
  });
  const pageText = indented.join('\n');
  const escaped = pageText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<div style="width:100%;height:100%;padding:24px;box-sizing:border-box;font-family:'Inter',system-ui,sans-serif;font-size:${fontSize}px;line-height:1.8;white-space:pre-wrap;word-wrap:break-word;text-align:justify;overflow:hidden;">${escaped}</div>`;
}