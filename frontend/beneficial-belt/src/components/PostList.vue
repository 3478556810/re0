<!-- frontend/beneficial-belt/src/components/blog/PostList.vue -->
<template>
  <div>
    <h2>📝 最新战报</h2>
    <div v-if="posts.length === 0">暂无文章，速速写下第一篇！</div>
    <article v-for="post in posts" :key="post.id" class="post-item">
      <h3>{{ post.title }}</h3>
      <p class="meta">{{ new Date(post.created_at).toLocaleDateString() }}</p>
      <p>{{ post.content.substring(0, 200) }}...</p>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { POSTS_API } from '../config.js';  // 👈 移到这里

const posts = ref([]);

onMounted(async () => {
  try {
    const res = await fetch(POSTS_API);

    if (res.ok) {
      posts.value = await res.json();
    }
  } catch (error) {
    console.error('获取文章列表失败:', error);
  }
});
</script>

<style scoped>
.post-item { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
.meta { color: #666; font-size: 0.9rem; }
</style>