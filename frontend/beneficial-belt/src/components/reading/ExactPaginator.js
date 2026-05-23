// ExactPaginator.js
// 基于 OffscreenCanvas 精确字符宽度的极速分页器
// 每个段落首行缩进 + 孤行控制 + 中文避头，无留白

function createMeasureContext(fontSize) {
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px 'Inter', system-ui, sans-serif`;
  return ctx;
}

function measureWidth(ctx, text) {
  return ctx.measureText(text).width;
}

// 判断字符是否为中文标点（需要避免出现在行首）
function isChinesePunctuation(char) {
  const punctSet = new Set([
    '，', '。', '！', '？', '”', '’', '》', '】', '）', '、', '：', '；',
    '．', '〉', '」', '』', '〕', '〗', '〙', '〛', '％', '…', '—', '～'
  ]);
  return punctSet.has(char);
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

    // 二分查找最佳截断点
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

    let lineText = remaining.slice(0, bestFit).trimEnd();
    let nextStart = bestFit;

    // ---------- 中文避头处理 ----------
    // 如果下一行开头是中文标点，则从当前行末尾“借”一个字到下一行
    // 循环直到下一行开头不是标点，或当前行已经无法再调整
    while (nextStart < remaining.length && isChinesePunctuation(remaining[nextStart])) {
      if (lineText.length > 0) {
        const lastChar = lineText.slice(-1);
        // 如果最后一个字符是空格或全角空格，则无法移走，跳出循环
        if (lastChar === ' ' || lastChar === '\u3000') {
          break;
        }
        // 将最后一个字符移到下一行
        lineText = lineText.slice(0, -1);
        nextStart--; // 切割点回退
        // 避免死循环：如果 nextStart 退到 0，则停止
        if (nextStart <= 0) break;
      } else {
        // 当前行已经没有字符可以移动，停止调整
        break;
      }
    }

    lines.push({ text: lineText, isFirst });
    remaining = remaining.slice(nextStart).trimStart();
    isFirst = false;
  }
  return lines;
}

/**
 * 精确分页：每个段落首行缩进 + 孤行控制 + 零留白
 */
export async function exactPaginate(text, fontSize, pageWidth, pageHeight, onProgress) {
  const pad = 24;
  const contentWidth = pageWidth - pad * 2;
  const contentHeight = pageHeight - pad * 2;
  const lineHeight = fontSize * 1.8;
  let maxLinesPerPage = Math.floor(contentHeight / lineHeight);
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