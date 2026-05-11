<!-- frontend/beneficial-belt/src/components/PostList.vue -->
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

const posts = ref([]);

onMounted(async () => {
  const res = await fetch('/api/posts');
  if (res.ok) {
    posts.value = await res.json();
  }
});
</script>
<style scoped>
.post-item { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
.meta { color: #666; font-size: 0.9rem; }
</style>