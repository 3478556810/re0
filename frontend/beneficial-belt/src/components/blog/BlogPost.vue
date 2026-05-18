<template>
  <div class="blog-container">
    <div v-if="loading" class="post-loading">正在加载文章...</div>
    <div v-else-if="error" class="post-not-found">
      <p>{{ error }}</p>
      <a href="/blog">← 回到杉汐的日记本</a>
    </div>
    <article v-else class="post-article">
      <h1>{{ post.title }}</h1>
      <time class="post-date">{{ formatDate(post.created_at) }}</time>
      <div class="post-content" v-html="renderedContent" />
    </article>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const post = ref(null)
const loading = ref(true)
const error = ref('')

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  return post.value.content.replace(/\n/g, '<br/>')
})

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const slug = params.get('slug') || ''
  if (!slug) {
    error.value = '没有指定文章'
    loading.value = false
    return
  }

  try {
    const res = await fetch('/api/posts')
    if (res.ok) {
      const posts = await res.json()
      const found = posts.find(p => p.slug === slug)
      if (found) {
        post.value = found
      } else {
        error.value = '这篇文章还没有被写出来呢～'
      }
    } else {
      error.value = '暂时无法加载文章，请稍后再试'
    }
  } catch (e) {
    error.value = '暂时无法连接服务器，请稍后再试'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.blog-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}
.post-loading {
  text-align: center;
  color: rgba(252, 228, 236, 0.6);
  padding: 80px 20px;
}
.post-not-found {
  text-align: center;
  padding: 80px 20px;
  color: rgba(252, 228, 236, 0.6);
}
.post-not-found a {
  color: #f472b6;
  text-decoration: none;
}
.post-article h1 {
  font-size: 36px;
  font-weight: 700;
  color: #fce4ec;
  margin-bottom: 12px;
}
.post-date {
  font-size: 14px;
  color: rgba(252, 228, 236, 0.5);
  margin-bottom: 40px;
}
.post-content {
  font-size: 16px;
  line-height: 1.8;
  color: rgba(252, 228, 236, 0.8);
}
</style>
