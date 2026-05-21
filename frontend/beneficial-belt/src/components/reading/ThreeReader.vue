<template>
  <div class="three-reader" ref="flipContainerRef">
    <div v-if="statusMsg" class="status-overlay">{{ statusMsg }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { PageFlip } from 'page-flip';
import { paginate, terminateWorker } from './pagination.js';

const props = defineProps({ reader: Object });
const flipContainerRef = ref(null);
const statusMsg = ref('正在分页...');
let pageFlip = null;
let currentFontSize = null;

// ★ 增加任务 ID，用于取消旧请求
let taskId = 0;

const destroyFlip = () => {
  if (pageFlip) {
    try { pageFlip.destroy(); } catch (e) { /* ignore */ }
    pageFlip = null;
  }
  // 清空容器内所有子节点（包括 status-overlay 不会误删）
  if (flipContainerRef.value) {
    // 保留 status-overlay 的引用，只删除 flip-page 等
    const overlay = flipContainerRef.value.querySelector('.status-overlay');
    flipContainerRef.value.innerHTML = '';
    if (overlay) flipContainerRef.value.appendChild(overlay);
  }
};

const initFlip = async () => {
  if (!flipContainerRef.value) return;

  // 生成新任务 ID，并捕获当前 ID
  const id = ++taskId;

  destroyFlip();
  flipContainerRef.value.style.width = '550px';
  flipContainerRef.value.style.height = '700px';

  const fontSize = props.reader.fontSize.value;
  const text = props.reader.fullText.value || '';

  statusMsg.value = '正在分页...';

  try {
    const htmlPages = await paginate(text, 550 - 48, 700 - 48, fontSize);

    // ★ 如果请求期间有更新的任务，丢弃本次结果
    if (id !== taskId) return;

    if (!htmlPages || htmlPages.length === 0) {
      statusMsg.value = '暂无内容';
      return;
    }

    const pageElements = htmlPages.map(html => {
      const div = document.createElement('div');
      div.className = 'flip-page';
      div.innerHTML = html;
      return div;
    });

    // 再次检查容器是否还存在，以及任务是否仍然是最新
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
    // 只有当前任务仍然有效时才显示错误
    if (id === taskId) statusMsg.value = '分页失败，请重试';
  }
};

const reInit = () => {
  destroyFlip();
  statusMsg.value = '正在重新分页...';
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
  // 取消所有进行中的分页任务
  taskId = 0;
  destroyFlip();
  terminateWorker();
});
</script>

<style>
.flip-page { background: #fafafa; }
.status-overlay {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  color: #333;
  font-size: 1.2rem;
  z-index: 5;
  background: rgba(255,255,255,0.8);
  padding: 12px 24px;
  border-radius: 8px;
}
</style>
<style scoped>
.three-reader {
  width: 550px; height: 700px; margin: 0 auto;
  border-radius: 12px; overflow: hidden; background: #fafafa; position: relative;
}
</style>