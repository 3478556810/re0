<!-- frontend/beneficial-belt/src/components/PostEditor.vue -->
<template>
  <div class="editor">
    <h2>✍️ 撰写新战报</h2>
    <input v-model="title" placeholder="文章标题" class="title-input" />
    <textarea v-model="content" placeholder="在此撰写内容..." rows="15"></textarea>
    <button @click="publish" :disabled="!title || !content">🚀 发布</button>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { POSTS_API } from '../../config.js';  // 👈 加上这行

const title = ref('');
const content = ref('');
const message = ref('');

const publish = async () => {
  const res = await fetch(POSTS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title.value, content: content.value }),
  });

  if (res.ok) {
    message.value = '✅ 战报已发布！';
    title.value = '';
    content.value = '';
  } else {
    message.value = '❌ 发布失败，请检查权限。';
  }
};
</script>
<style scoped>
.editor { max-width: 800px; margin: 0 auto; }
input, textarea { width: 100%; margin-bottom: 1rem; padding: 0.5rem; }
button { padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; cursor: pointer; }
</style>