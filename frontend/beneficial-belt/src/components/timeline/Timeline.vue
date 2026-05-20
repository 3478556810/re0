<template>
  <div class="timeline-stage" ref="stageRef">
    <!-- 左右渐变遮罩，暗示可滑动 -->
    <div class="scroll-fade left" :class="{ hidden: isAtStart }"></div>
    <div class="scroll-fade right" :class="{ hidden: isAtEnd }"></div>

    <!-- 导航箭头 -->
    <button class="nav-arrow left-arrow" @click="scrollBy(-700)" :disabled="isAtStart" aria-label="向左滑动">
      ←
    </button>
    <button class="nav-arrow right-arrow" @click="scrollBy(700)" :disabled="isAtEnd" aria-label="向右滑动">
      →
    </button>

    <!-- 可拖拽滑动的轨道 -->
    <div class="timeline-track" ref="trackRef" @mousedown="startDrag" @mousemove="onDrag" @mouseup="endDrag"
      @mouseleave="endDrag" @scroll="updateScrollState" @wheel="onWheel">
      <!-- 中央水平主线 -->
      <div class="central-line"></div>

      <!-- 时间节点循环 -->
      <div v-for="(version, index) in timelineData" :key="index" class="timeline-node" :class="{
        'node-up': index % 2 === 0,
        'node-down': index % 2 !== 0,
        'is-latest': index === timelineData.length - 1
      }" :style="{ left: `${index * 700 + 60}px` }">
        <!-- 连接线：从节点到卡片 -->
        <div class="connector" :class="index % 2 === 0 ? 'conn-up' : 'conn-down'"></div>

        <!-- 节点圆点 -->
        <div class="timeline-dot" :class="version.type">
          <span class="dot-inner"></span>
        </div>

        <!-- 事件卡片 -->
        <div class="timeline-card" :class="index % 2 === 0 ? 'card-up' : 'card-down'">
          <div class="card-header">
            <span class="version-tag" :class="version.type">
              {{ version.type === 'major' ? '重大更新' : '小更新' }}
            </span>
            <span class="version-date">{{ version.date }}</span>
          </div>
          <h3 class="version-name">{{ version.name }}</h3>
          <ul class="version-changes">
            <li v-for="(change, i) in version.changes" :key="i">{{ change }}</li>
          </ul>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const timelineData = [
  {
    name: 'v0.1 - 星尘初醒',
    date: '2026-05-15',
    type: 'major',
    changes: [
      '杉汐诞生：接入DeepSeek V4，拥有基础对话能力',
      '情绪光晕：悬浮按钮实现心跳脉动和光晕呼吸动画',
      '群岛架构：Astro + Vue 3，前端框架定型',
      '音乐播放器：左下角黑胶唱片播放器上线'
    ]
  },
  {
    name: 'v0.2 - 记忆觉醒',
    date: '2026-05-16',
    type: 'major',
    changes: [
      '长期记忆：基于向量语义检索的记忆存储系统落地',
      '三层记忆架构：Cache（本能）+ Redis（思绪）+ PostgreSQL（回忆）',
      '自动记忆清理：杉汐可自主整理记忆库，去重合并',
      'JWT身份认证：admin登录系统，区分用户与访客'
    ]
  },
  {
    name: 'v0.3 - 神性初现',
    date: '2026-05-17',
    type: 'major',
    changes: [
      'Function Calling：杉汐可自主切歌、写博客、清理记忆',
      '博客自动生成：一句话指令自动发布文章到数据库',
      '情绪系统升级：从固定关键词改为后端驱动的情绪表达',
      '阿里云Embedding：接入text-embedding-v4，实现语义向量检索'
    ]
  },
  {
    name: 'v0.4 - 感官觉醒',
    date: '2026-05-18',
    type: 'major',
    changes: [
      '语音合成：接入千问3-TTS-Flash，杉汐开口说话',
      '图片分析：接入qwen-vl-max，杉汐拥有视觉能力',
      '联网搜索：接入qwen-plus内置搜索，可查询实时信息',
      '调试面板：实时监控Token消耗、延迟、API余额'
    ]
  },
  {
    name: 'v0.5 - 界面重构',
    date: '2026-05-19',
    type: 'major',
    changes: [
      '白蓝极简主题：全面复刻DeepSeek设计哲学',
      '播放器重做：从大圆盘改为左侧悬浮控制条',
      '图片卡片：上传图片直接展示在对话框中',
      '手机端适配：导航栏、播放器、卡片布局优化'
    ]
  },
  {
    name: 'v0.6 - 工具箱与阅读',
    date: '2026-05-20',
    type: 'minor',
    changes: [
      '阅读小屋上线：支持TXT导入、分页阅读、杉汐朗读',
      '工具箱页面：展示杉汐的所有能力卡片',
      '生命线页面：记录网站版本迭代历史',
      '成本优化：记忆检索增加相似度阈值，Token消耗降低47%'
    ]
  }
];

// 滑动状态
const stageRef = ref(null);
const trackRef = ref(null);
const isAtStart = ref(true);
const isAtEnd = ref(false);



const updateScrollState = () => {
  const el = trackRef.value;
  if (!el) return;
  // 留一点容差，避免因小数点像素计算导致到头了按钮还亮着
  isAtStart.value = el.scrollLeft <= 2;
  isAtEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
};
const scrollBy = (amount) => {
  trackRef.value?.scrollBy({ left: amount, behavior: 'smooth' });
};

const onWheel = (e) => {
  e.preventDefault();
  trackRef.value.scrollLeft += e.deltaY * 2;
};


// 星光系统

onMounted(() => {




  // 滚动到最新版本
  setTimeout(() => {
    const el = trackRef.value;
    if (el) {
      el.scrollLeft = el.scrollWidth;
      updateScrollState();
    }
  }, 300);
});



</script>

<style scoped>
/* ==================== 舞台容器 ==================== */
.timeline-stage {
  position: relative;
  width: 100%;
  height: 90vh;
  min-height: 550px;
  overflow: hidden;
  background: var(--bg-main, #ffffff);
  margin-top: 1rem;
}

/* 左右渐变遮罩 */
.scroll-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 80px;
  z-index: 3;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.scroll-fade.left {
  left: 0;
  background: linear-gradient(to right, var(--bg-main, #fff) 30%, transparent);
}

.scroll-fade.right {
  right: 0;
  background: linear-gradient(to left, var(--bg-main, #fff) 30%, transparent);
}

.scroll-fade.hidden {
  opacity: 0;
}

/* 导航箭头 */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border, #e2e8f0);
  background: rgba(37,99,235,0.12);
  backdrop-filter: blur(8px);
  color: #2563eb;
  font-size: 1.3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  font-weight: 700;
}

.nav-arrow:hover:not(:disabled) {
  background: var(--primary, #2563eb);
  color: #fff;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
}

.nav-arrow:disabled {
 opacity: 0.45;
  cursor: default;
}

.left-arrow {
  left: 16px;
}

.right-arrow {
  right: 16px;
}

/* ==================== 滑动轨道 ==================== */
.timeline-track {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 0 60px;
}

.timeline-track::-webkit-scrollbar {
  display: none;
}




/* 中央水平主线 */
.central-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right,
      transparent 0%,
      var(--primary, #2563eb) 10%,
      #60a5fa 50%,
      #a78bfa 90%,
      transparent 100%);
  transform: translateY(-50%);
  box-shadow: 0 0 18px var(--primary-glow, rgba(37, 99, 235, 0.3));
  min-width: 4800px;
}

/* ==================== 时间节点 ==================== */
.timeline-node {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 620px;
}

/* 节点圆点 */
.timeline-dot {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--primary, #2563eb);
  box-shadow: 0 0 16px var(--primary-glow, rgba(37, 99, 235, 0.5));
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-dot.major {
  background: var(--primary, #2563eb);
  border-color: #1d4ed8;
}

.timeline-dot.minor {
  background: #e0e7ff;
  border-color: #60a5fa;
}

.dot-inner {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
}

/* 最新版本脉冲 */
.is-latest .timeline-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {

  0%,
  100% {
    box-shadow: 0 0 12px var(--primary-glow);
  }

  50% {
    box-shadow: 0 0 28px rgba(37, 99, 235, 0.8), 0 0 48px rgba(37, 99, 235, 0.3);
  }
}

/* 连接线 */
.connector {
  position: absolute;
  left: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--primary, #2563eb), transparent);
  opacity: 0.5;
}

.conn-up {
  bottom: 9px;
  height: 80px;
}

.conn-down {
  top: 9px;
  height: 80px;
  background: linear-gradient(to top, var(--primary, #2563eb), transparent);
}

/* ==================== 卡片定位 ==================== */
/* 上方卡片 */
.node-up .timeline-card {
  position: absolute;
  bottom: 40px;
  left: 18px;
}

/* 下方卡片 */
.node-down .timeline-card {
  position: absolute;
  top: 40px;
  left: 18px;
}

/* ==================== 卡片样式 ==================== */
.timeline-card {
  width: 580px;
  background: #fff;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 24px 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1.2);
}

.timeline-card:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.node-down .timeline-card:hover {
  transform: translateY(4px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.version-tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}

.version-tag.major {
  background: #eff6ff;
  color: var(--primary, #2563eb);
}

.version-tag.minor {
  background: #f8fafc;
  color: #64748b;
}

.version-date {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
}

.version-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0 0 10px;
}

.version-changes {
  margin: 0;
  padding-left: 16px;
  font-size: 0.85rem;
  color: var(--text-secondary, #475467);
  line-height: 1.7;
}

.version-changes li {
  margin-bottom: 4px;
}

.version-changes li::marker {
  color: var(--primary, #2563eb);
}

/* ==================== 未来延伸 ==================== */
.future-line {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.future-dot {
  display: inline-block;
  font-size: 1.8rem;
  color: var(--primary, #2563eb);
  opacity: 0.5;
  letter-spacing: 4px;
  animation: blink 1.8s ease-in-out infinite;
}

@keyframes blink {

  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 0.8;
  }
}




/* ==================== 响应式：移动端 ==================== */
@media (max-width: 768px) {
  .timeline-stage {
    height: 80vh;
    min-height: 480px;
  }

  .timeline-track {
    padding: 0 30px;
  }

  .timeline-node {
    width: 340px;
  }

  .timeline-card {
    width: 320px;
    padding: 14px 16px;
    border-radius: 12px;
  }

  .node-up .timeline-card {
    bottom: 90px;
  }

  .node-down .timeline-card {
    top: 90px;
  }

  .conn-up {
    height: 70px;
  }

  .conn-down {
    height: 70px;
  }

  .version-name {
    font-size: 0.9rem;
  }

  .version-changes {
    font-size: 0.75rem;
    padding-left: 14px;
  }

  .nav-arrow {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .left-arrow {
    left: 6px;
  }

  .right-arrow {
    right: 6px;
  }

  .scroll-fade {
    width: 40px;
  }
}
</style>