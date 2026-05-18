<template>
  <div class="post-list">
    <div v-if="loading" class="loading">正在加载杉汐的日记...</div>
    <div v-else-if="posts.length === 0" class="empty">杉汐还没有写过日记呢，去和她聊聊天吧 ✨</div>
    <a v-for="post in posts" :key="post.id" :href="`/blog/post?slug=${post.slug}`" class="post-card">
      <h2>{{ post.title }}</h2>
      <div class="post-date">{{ formatDate(post.created_at) }}</div>
      <div class="post-desc">{{ getExcerpt(post.content) }}</div>
    </a>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const posts = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/api/posts')
    if (res.ok) {
      posts.value = await res.json()
    }
  } catch (e) {
    console.error('加载博客列表失败:', e)
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function getExcerpt(content) {
  if (!content) return ''
  return content.replace(/[#*`>\[\]]/g, '').substring(0, 120) + '...'
}
</script>

<style scoped>
.loading, .empty {
  text-align: center;
  color: rgba(252, 228, 236, 0.6);
  padding: 60px 20px;
  font-size: 16px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.post-card {
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(244, 114, 182, 0.2);
  border-radius: 16px;
  padding: 28px 32px;
  text-decoration: none;
  color: var(--text);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.post-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #f472b6, #f0a0c0, transparent);
}

.post-card:hover {
  border-color: rgba(244, 114, 182, 0.5);
  box-shadow: 0 8px 32px rgba(244, 114, 182, 0.15);
  transform: translateY(-2px);
}

.post-card h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #fce4ec;
}

.post-date {
  font-size: 13px;
  color: rgba(252, 228, 236, 0.5);
  margin-bottom: 12px;
}

.post-desc {
  font-size: 15px;
  color: rgba(252, 228, 236, 0.7);
  line-height: 1.6;
}
</style>
