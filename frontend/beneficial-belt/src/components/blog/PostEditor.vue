<template>
  <div class="editor">
    <h2>✍️ 撰写新文章</h2>
    <input v-model="title" placeholder="文章标题" class="title-input" />
    <textarea ref="textareaRef" v-model="content"></textarea>
    <button @click="publish" :disabled="!title || !content">🚀 发布</button>
    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import EasyMDE from 'easymde'
import 'easymde/dist/easymde.min.css'
import { POSTS_API } from '../../config.js'

const title = ref('')
const content = ref('')
const message = ref('')
const textareaRef = ref(null)

let mde = null

onMounted(() => {
  mde = new EasyMDE({
    element: textareaRef.value,
    spellChecker: false,
    autosave: {
      enabled: false,
    },
    toolbar: [
      'bold', 'italic', 'heading', '|',
      'quote', 'unordered-list', 'ordered-list', '|',
      'link', 'image', '|',
      'preview', 'side-by-side', 'fullscreen', '|',
      'guide'
    ]
  })
  
  // 双向绑定
  mde.codemirror.on('change', () => {
    content.value = mde.value()
  })
})

watch(content, (val) => {
  if (mde && mde.value() !== val) {
    mde.value(val)
  }
})

const publish = async () => {
  const res = await fetch(POSTS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title.value, content: content.value }),
  })

  if (res.ok) {
    message.value = '✅ 文章已发布！'
    title.value = ''
    content.value = ''
    mde.value('')
  } else {
    message.value = '❌ 发布失败，请检查权限。'
  }
}
</script>

<style scoped>
.editor {
  max-width: 800px;
  margin: 30px auto;
  background: rgba(30, 20, 40, 0.6);
  border: 1px solid rgba(244, 114, 182, 0.2);
  border-radius: 16px;
  padding: 30px;
}

h2 {
  font-size: 24px;
  font-weight: 600;
  color: #fce4ec;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f472b6, #f0a0c0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-input {
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 20px;
  background: rgba(26, 16, 37, 0.8);
  border: 1px solid rgba(244, 114, 182, 0.3);
  border-radius: 8px;
  color: #fce4ec;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.title-input:focus {
  border-color: rgba(244, 114, 182, 0.6);
}

button {
  margin-top: 15px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #f472b6, #ec4899);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 15px rgba(244, 114, 182, 0.4);
}

.message {
  margin-top: 15px;
  font-size: 14px;
  color: #fce4ec;
}
</style>