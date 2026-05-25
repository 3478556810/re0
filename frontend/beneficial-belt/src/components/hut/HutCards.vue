<template>
  <div class="cards-grid">
    <!-- 阅读小屋卡片 -->
    <div class="tool-card" @click="goReading">
      <div class="card-icon"><Icon icon="ph:books-duotone" width="32" color="var(--primary)" /></div>
      <div class="card-content">
        <h3>阅读小屋</h3>
        <p>上传一本书，杉汐陪你一起读，随时讨论书中内容，还能为你朗读。</p>
      </div>
      <button class="card-btn" @click.stop="goReading">开启</button>
    </div>

    <!-- 3D 小屋卡片（新增） -->
    <div class="tool-card" @click="go3DRoom">
      <div class="card-icon"><Icon icon="ph:cube-duotone" width="32" color="var(--primary)" /></div>
      <div class="card-content">
        <h3>3D 小屋</h3>
        <p>走进杉汐的立体世界，自由探索，与她共处一室，体验沉浸式陪伴。</p>
      </div>
      <button class="card-btn" @click.stop="go3DRoom">进入</button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

const goReading = () => {
  window.location.href = '/reading-hut';
};

const go3DRoom = () => {
  window.location.href = '/shanxi-room';
};
</script>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--bg-card, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-card:hover {
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.1);
  transform: translateY(-2px);
  border-color: var(--primary, #2563eb);
}

.card-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  margin: 0 0 6px;
}

.card-content p {
  font-size: 0.85rem;
  color: var(--text-secondary, #64748b);
  margin: 0;
  line-height: 1.5;
}

.card-btn {
  flex-shrink: 0;
  padding: 8px 20px;
  background: var(--primary, #2563eb);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.card-btn:hover {
  background: var(--primary-hover, #1d4ed8);
}
</style>