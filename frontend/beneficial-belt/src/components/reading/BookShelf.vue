<template>
  <div class="shelf-root">
    <div class="shelf-toolbar">
      <button class="clear-btn" @click="clearAllCache">
        <Icon icon="ph:trash" width="16" />
        <span>清除缓存</span>
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept=".txt"
        style="display: none"
        @change="handleFileUpload"
      />
      <button class="upload-btn" @click="fileInputRef.click()">
        <Icon icon="ph:plus" width="18" />
        <span>添加书籍</span>
      </button>
    </div>

    <div v-if="books.length === 0 && !uploading" class="empty-shelf">
      <p>书架空空，点击上方按钮添加一本 TXT 书籍</p>
    </div>

    <div v-else class="book-grid">
      <div v-for="book in books" :key="book.id" class="book-card">
        <div class="book-cover-placeholder" @click="openBook(book)">
          <span class="book-icon">📖</span>
        </div>
        <div class="book-info">
          <h3 @click="openBook(book)">{{ book.title }}</h3>
          <button class="delete-btn" @click.stop="deleteBook(book.id)">删除</button>
        </div>
      </div>

      <div v-if="uploading" class="book-card uploading">
        <div class="book-cover-placeholder">
          <span class="book-icon">⏳</span>
        </div>
        <div class="book-info">
          <h3>上传中...</h3>
        </div>
      </div>
    </div>

    <div v-if="uploadSuccess" class="upload-toast">上传成功，书籍已加入书架</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const books = ref([])
const fileInputRef = ref(null)
const uploading = ref(false)
const uploadSuccess = ref(false)

async function loadBooks() {
  try {
    const res = await fetch('/api/book/list')
    if (!res.ok) throw new Error('获取列表失败')
    const data = await res.json()
    books.value = data.books || []
  } catch (e) {
    console.error('加载书架失败:', e)
    books.value = []
  }
}

onMounted(async () => {
  await loadBooks()
  uploadSuccess.value = false
})

const openBook = (book) => {
  window.location.href = `/read?book=${encodeURIComponent(book.id)}`
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.name.toLowerCase().endsWith('.txt')) {
    alert('仅支持 TXT 文本文件')
    return
  }

  uploading.value = true
  uploadSuccess.value = false

  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/book/upload', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '上传失败')
    }

    const data = await res.json()
    books.value = data.books || []
    uploadSuccess.value = true
    setTimeout(() => { uploadSuccess.value = false }, 3000)
  } catch (e) {
    console.error('上传失败:', e)
    alert('上传失败: ' + e.message)
  } finally {
    uploading.value = false
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

async function deleteBook(bookId) {
  if (!confirm('确定删除这本书吗？')) return
  try {
    const res = await fetch(`/api/book/delete?bookId=${encodeURIComponent(bookId)}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('删除失败')
    await loadBooks()
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败')
  }
}

const clearAllCache = async () => {
  try {
    await fetch('/api/admin/clear-redis')
  } catch (e) {
    console.warn('Redis 清除失败', e)
  }
  indexedDB.deleteDatabase('reading-hut-pages')
  alert('缓存已清除，请刷新页面')
  window.location.reload()
}
</script>

<style scoped>
.shelf-root { padding: 20px 0; }
.shelf-toolbar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 20px; }
.clear-btn {
  display: flex; align-items: center; gap: 4px;
  background: var(--bg-card, #ffffff); border: 1px solid var(--border, #e2e8f0);
  padding: 8px 12px; border-radius: 8px; color: var(--text-secondary, #64748b);
  font-size: 0.85rem; cursor: pointer; transition: background 0.2s;
}
.clear-btn:hover { background: #fee2e2; color: #ef4444; border-color: #ef4444; }
.upload-btn {
  display: flex; align-items: center; gap: 6px;
  background: var(--bg-card, #ffffff); border: 1px solid var(--border, #e2e8f0);
  padding: 8px 16px; border-radius: 8px; color: var(--text-primary, #0f172a);
  font-size: 0.9rem; cursor: pointer; transition: background 0.2s, box-shadow 0.2s;
}
.upload-btn:hover { background: #f8fafc; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.empty-shelf { text-align: center; color: var(--text-secondary, #64748b); padding: 40px; font-size: 0.95rem; }
.book-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
.book-card { cursor: pointer; transition: transform 0.2s; text-align: center; }
.book-card:hover { transform: translateY(-4px); }
.book-card.uploading { opacity: 0.6; pointer-events: none; }
.book-cover-placeholder {
  width: 100%; aspect-ratio: 2/3; background: var(--bg-card, #f8fafc);
  border: 1px solid var(--border, #e2e8f0); border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 2rem;
}
.book-info h3 { font-size: 0.85rem; margin: 8px 0 0; color: var(--text-primary, #0f172a); }
.delete-btn {
  background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem; margin-top: 4px;
}
.delete-btn:hover { text-decoration: underline; }
.upload-toast {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: #333; color: #fff; padding: 10px 20px; border-radius: 8px;
  font-size: 0.9rem; z-index: 1000;
}
</style>