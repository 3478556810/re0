<template>
  <div class="gallery-container">
    <!-- 上传区域（仅登录可见） -->
    <div v-if="isLoggedIn" class="upload-area">
      <input
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        ref="fileInput"
        @change="handleUpload"
      />
      <button class="upload-btn" @click="$refs.fileInput.click()">
        <Icon icon="mdi:cloud-upload" width="20" />
        <span>上传图片</span>
      </button>
    </div>

    <!-- 标签筛选栏 -->
    <div class="filter-bar" v-if="allTags.length">
      <button
        class="filter-tag"
        :class="{ active: currentTag === 'all' }"
        @click="filterByTag('all')"
      >全部</button>
      <button
        v-for="tag in allTags"
        :key="tag"
        class="filter-tag"
        :class="{ active: currentTag === tag }"
        @click="filterByTag(tag)"
      >{{ tag }}</button>
    </div>

    <!-- 图片瀑布流 -->
    <div class="masonry" v-if="filteredImages.length">
      <div class="masonry-item" v-for="img in filteredImages" :key="img.rel_path">
        <div class="image-wrapper">
          <img :src="img.url" :alt="img.rel_path" loading="lazy" />
          <div class="image-overlay">
            <button class="overlay-btn" @click="openOriginal(img.url)" title="查看原图">
              <Icon icon="mdi:open-in-new" width="18" />
            </button>
            <button class="overlay-btn" @click="copyUrl(img.url)" title="复制链接">
              <Icon icon="mdi:content-copy" width="18" />
            </button>
            <button v-if="isLoggedIn" class="overlay-btn delete-btn" @click="deleteImage(img)" title="删除">
              <Icon icon="mdi:delete-outline" width="18" />
            </button>
          </div>
        </div>
        <div class="tags-edit" @click.stop>
          <input
            v-model="img.tagInput"
            @blur="updateTag(img)"
            @keyup.enter="updateTag(img)"
            placeholder="输入标签，用英文逗号分隔"
            class="tag-input"
          />
          <div class="tag-preview" v-if="img.tags && img.tags.length">
            <span class="tag-badge" v-for="t in img.tags" :key="t">{{ t }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <Icon icon="mdi:image-outline" width="48" color="#ccc" />
      <p>还没有图片，快去上传吧</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const isLoggedIn = ref(!!localStorage.getItem('token'))
const images = ref([])
const currentTag = ref('all')
const fileInput = ref(null)

const allTags = computed(() => {
  const tags = new Set()
  images.value.forEach(img => {
    if (img.tags) img.tags.forEach(t => tags.add(t))
  })
  return [...tags]
})

const filteredImages = computed(() => {
  if (currentTag.value === 'all') return images.value
  return images.value.filter(img => img.tags && img.tags.includes(currentTag.value))
})

function filterByTag(tag) {
  currentTag.value = tag
}

async function handleUpload(event) {
  const files = event.target.files
  if (!files.length) return

  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })
      if (res.ok) {
        await loadImages()
      }
    } catch (e) {
      console.error('上传失败:', e)
    }
  }
  fileInput.value.value = ''
}

async function loadImages() {
  try {
    const res = await fetch('/api/images')
    if (res.ok) {
      const raw = await res.json()
      images.value = raw.map(img => ({
        ...img,
        tagInput: (img.tags || []).join(', ')
      }))
    }
  } catch (e) {
    console.error('加载图片列表失败:', e)
  }
}

async function updateTag(img) {
   if (!img.rel_path) {
    console.error('更新标签失败: rel_path 为空', img)
    return
  }
  const tagsRaw = img.tagInput.split(',').map(s => s.trim()).filter(s => s !== '')
  const uniqueTags = [...new Set(tagsRaw)]
  if (JSON.stringify(uniqueTags) === JSON.stringify(img.tags || [])) {
    return
  }
  try {
    const res = await fetch('/api/images/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rel_path: img.rel_path,
        tags: uniqueTags
      })
    })
    if (res.ok) {
      img.tags = uniqueTags
      img.tagInput = uniqueTags.join(', ')
    } else {
      img.tagInput = (img.tags || []).join(', ')
    }
  } catch (err) {
    console.error('标签更新失败', err)
    img.tagInput = (img.tags || []).join(', ')
  }
}

async function deleteImage(img) {
  if (!confirm('确定要删除这张图片吗？')) return
  try {
    const res = await fetch('/api/images', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ rel_paths: [img.rel_path] })
    })
    if (res.ok) {
      // 删除成功后重新加载列表，保证数据一致
      await loadImages()
    } else {
      const err = await res.json()
      alert('删除失败：' + (err.error || '未知错误'))
    }
  } catch (e) {
    console.error('删除请求异常', e)
    alert('删除失败')
  }
}

function openOriginal(url) {
  window.open(window.location.origin + url, '_blank')
}

function copyUrl(url) {
  navigator.clipboard.writeText(window.location.origin + url).then(() => {
    alert('链接已复制')
  })
}

onMounted(() => {
  loadImages()
})
</script>

<style scoped>
.gallery-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.upload-area {
  margin-bottom: 30px;
  text-align: center;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}
.upload-btn:hover {
  background: #1d4ed8;
}

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-tag {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid #d0d5dd;
  background: white;
  color: #475467;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.filter-tag.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.masonry {
  columns: 3 300px;
  column-gap: 16px;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.image-wrapper {
  position: relative;
  display: block;
}

.image-wrapper img {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.image-wrapper:hover .image-overlay {
  opacity: 1;
  pointer-events: auto;
}

.overlay-btn {
  background: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  text-decoration: none;
}
.overlay-btn:hover {
  background: #f0f0f0;
}
.delete-btn {
  color: #dc2626;
}
.delete-btn:hover {
  background: #fee2e2;
}

.tags-edit {
  padding: 10px;
  background: #f9fafb;
  border-top: 1px solid #eee;
}
.tag-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  box-sizing: border-box;
  margin-bottom: 6px;
}
.tag-input:focus {
  outline: none;
  border-color: #2563eb;
}
.tag-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag-badge {
  background: #eef2ff;
  color: #1d4ed8;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}
.empty-state p {
  margin-top: 12px;
  font-size: 15px;
}
</style>