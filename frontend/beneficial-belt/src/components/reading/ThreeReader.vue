<template>
  <div class="three-reader" ref="flipContainerRef">
    <EmotionGlow />
    <div v-if="statusMsg" class="status-overlay">
      <div class="status-box">
        <span class="status-text">{{ statusMsg }}</span>
        <div v-if="statusMsg === '正在分页...'" class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { PageFlip } from 'page-flip';
import { paginate, terminateWorker } from './pagination.js';
import { getCachedPages, setCachedPages } from './cachePagination.js';
import EmotionGlow from './EmotionGlow.vue';
import { useEmotion } from '../shanxi/composables/useEmotion.js';
const { currentEmotion } = useEmotion();

const props = defineProps({ reader: Object });
const flipContainerRef = ref(null);
const statusMsg = ref('正在准备...');
let pageFlip = null;
let currentFontSize = null;
let taskId = 0;

const destroyFlip = () => {
  if (pageFlip) {
    try { pageFlip.destroy(); } catch (e) { /* ignore */ }
    pageFlip = null;
  }
  if (flipContainerRef.value) {
    const pages = flipContainerRef.value.querySelectorAll('.flip-page');
    pages.forEach(p => p.remove());
  }
};

const initFlip = async () => {
  if (!flipContainerRef.value) return;
  const id = ++taskId;
  destroyFlip();
  flipContainerRef.value.style.width = '550px';
  flipContainerRef.value.style.height = '700px';

  const fontSize = props.reader.fontSize.value;
  const text = props.reader.fullText.value || '';
  const bookId = props.reader.title.value || 'unknown';

  statusMsg.value = '正在准备...';
  try {
    let htmlPages = await getCachedPages(bookId, fontSize);
    if (!htmlPages) {
      statusMsg.value = '正在分页...';
      htmlPages = await paginate(text, 550 - 48, 700 - 48, fontSize);
      if (id !== taskId) return;
      await setCachedPages(bookId, fontSize, htmlPages);
    }
    if (id !== taskId) return;
    if (!htmlPages || htmlPages.length === 0) {
      statusMsg.value = '暂无内容';
      return;
    }

    const pageElements = htmlPages.map(html => {
      const div = document.createElement('div');
      div.className = 'flip-page';
      div.style.width = '550px';
      div.style.height = '700px';
      div.innerHTML = html;
      return div;
    });

    if (id !== taskId || !flipContainerRef.value) return;

    pageFlip = new PageFlip(flipContainerRef.value, {
      width: 550, height: 700,
      size: 'fixed', autoSize: false,
      usePortrait: true,
      maxShadowOpacity: 0.3, showCover: false,
      flippingTime: 600, swipeDistance: 30,
    });
    pageFlip.loadFromHTML(pageElements);
    statusMsg.value = '';
    currentFontSize = fontSize;
  } catch (err) {
    console.error('分页失败:', err);
    if (id === taskId) statusMsg.value = '加载失败，请重试';
  }
};

// ========== 核心功能：根据文本自动定位并高亮 ==========
// 删除 searchAndFlip，恢复 flipToPage（基于索引，带高亮文本）
// 翻页到 pageIndex + 1 对应的页，并高亮指定文本
const flipToPage = (pageIndex, highlightText = null) => {
  if (!pageFlip) return;

  // ★ 实际目标页索引 = 传入索引 + 1
  const targetIndex = pageIndex + 1;

  // 使用 page-flip 内置翻页（更稳定）
  if (typeof pageFlip.turnToPage === 'function') {
    pageFlip.turnToPage(targetIndex);
  } else if (typeof pageFlip.flip === 'function') {
    pageFlip.flip(targetIndex);
  } else {
    // 手动计算（备用）
    const current = pageFlip.getCurrentPageIndex();
    const diff = targetIndex - current;
    const fn = diff > 0 ? () => pageFlip.flipNext() : () => pageFlip.flipPrev();
    for (let i = 0; i < Math.abs(diff); i++) {
      setTimeout(fn, i * 100);
    }
  }

  // 翻页完成后高亮（等待动画 600ms）
  if (highlightText) {
    setTimeout(() => highlightOnPage(highlightText, targetIndex), 600);
  }
};

// 在指定索引页中高亮文本（内部 div）
// 句子级荧光笔高亮（精确到 quote 文本）
// 句子级高亮 + 情绪色光影
const highlightOnPage = (text, targetIndex) => {
  const container = flipContainerRef.value;
  if (!container || !text) return;

  const pages = container.querySelectorAll('.flip-page');
  if (targetIndex >= pages.length) return;
  const page = pages[targetIndex];
  if (!page || !page.textContent.includes(text)) return;

  // 防止重复高亮
  if (page.querySelector(`mark.shanxi-highlight[data-quote="${text}"]`)) return;

  const innerDiv = page.querySelector('div:first-child');
  if (!innerDiv) return;

  // 获取当前情绪颜色，默认使用 calm 淡橙
  const emotion = currentEmotion.value || {};
  const glowColor = emotion.glowColor || '#f0a040';
  const intensity = emotion.intensity || 1.0;

  // 将 hex 转为 rgba
  const rgba = hexToRgba(glowColor, 0.25);
  const glowRgba = hexToRgba(glowColor, 0.5 * intensity);

  const walker = document.createTreeWalker(innerDiv, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const idx = node.textContent.indexOf(text);
    if (idx !== -1) {
      const before = document.createTextNode(node.textContent.slice(0, idx));
      const after = document.createTextNode(node.textContent.slice(idx + text.length));
      const mark = document.createElement('mark');
      mark.className = 'shanxi-highlight';
      mark.setAttribute('data-quote', text);
      mark.textContent = text;

      // 光影样式
      mark.style.backgroundColor = rgba;
      mark.style.boxShadow = `0 0 12px ${glowRgba}`;
      mark.style.borderRadius = '4px';
      mark.style.padding = '2px 4px';
      mark.style.color = 'inherit';
      mark.style.transition = 'all 0.3s ease';

      const parent = node.parentNode;
      parent.insertBefore(before, node);
      parent.insertBefore(mark, node);
      parent.insertBefore(after, node);
      parent.removeChild(node);
      break;
    }
  }
};

// hex 转 rgba 工具
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(240,160,100,${alpha})`;
  if (hex.startsWith('rgba')) return hex.replace(/[\d.]+\)$/, `${alpha})`);
  if (hex.startsWith('rgb')) return hex.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  if (isNaN(r)) return `rgba(240,160,100,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}
defineExpose({ flipToPage });




// ========== 辅助功能 ==========
const reInit = () => {
  destroyFlip();
  statusMsg.value = '正在准备...';
  nextTick().then(initFlip);
};

const onKeyDown = (e) => {
  if (!pageFlip) return;
  if (e.key === 'ArrowRight') pageFlip.flipNext();
  else if (e.key === 'ArrowLeft') pageFlip.flipPrev();
};

watch(() => props.reader.fontSize.value, (v) => {
  if (v !== currentFontSize) reInit();
});
watch(() => props.reader.fullText.value, () => reInit());

onMounted(async () => {
  await nextTick();
  initFlip();
  document.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown);
  taskId = 0;
  destroyFlip();
  terminateWorker();
});
</script>

<style>
.flip-page {
  overflow: hidden;
  background: #fafafa;
}
.status-overlay {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
}
.status-box {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 16px;
  padding: 24px 32px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.status-text {
  font-size: 1rem;
  color: #333;
  display: block;
  margin-bottom: 12px;
}
.progress-bar {
  width: 200px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  width: 60%;
  height: 100%;
  background: #60a5fa;
  border-radius: 2px;
  animation: progress-slide 1.5s ease-in-out infinite;
}
@keyframes progress-slide {
  0% { transform: translateX(-60%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(-60%); }
}
</style>

<style scoped>
.three-reader {
  width: 550px; height: 700px; margin: 0 auto;
  border-radius: 12px; overflow: visible; background: #fafafa; position: relative;
}
</style>