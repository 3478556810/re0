<template>
  <div class="gallery-container">
    <!-- 上传区域 -->
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

    <!-- 标签筛选栏（多选 OR 逻辑） -->
    <div class="filter-bar" v-if="allTags.length">
      <span class="filter-label">筛选标签：</span>
      <div class="filter-tags">
        <button
          v-for="tag in allTags"
          :key="tag"
          class="filter-tag"
          :class="{ active: selectedFilters.includes(tag) }"
          @click="toggleFilter(tag)"
        >{{ tag }}</button>
      </div>
      <button v-if="selectedFilters.length" class="clear-filter" @click="clearFilters">清除</button>
    </div>

    <!-- 图片瀑布流 -->
    <div class="masonry" v-if="filteredImages.length">
      <div class="masonry-item" v-for="img in filteredImages" :key="img.url">
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

        <!-- 标签编辑区（显示已有标签+添加新标签） -->
        <div class="tags-edit">
          <div class="tag-list">
            <span v-for="tag in img.tags" :key="tag" class="tag-badge">
              {{ tag }}
              <span class="remove-tag" @click="removeTag(img, tag)">×</span>
            </span>
            <input
              v-model="img.newTagInput"
              @keyup.enter="addTag(img, img.newTagInput)"
              @blur="addTag(img, img.newTagInput)"
              placeholder="添加标签"
              class="tag-input-small"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <Icon icon="mdi:image-outline" width="48" color="#ccc" />
      <p>没有图片</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const isLoggedIn = ref(!!localStorage.getItem('token'))
const images = ref([])
const selectedFilters = ref([])   // 选中的标签数组（OR 逻辑）
const fileInput = ref(null)

// 获取所有标签
const allTags = computed(() => {
  const tags = new Set()
  images.value.forEach(img => {
    if (img.tags) img.tags.forEach(t => tags.add(t))
  })
  return Array.from(tags).sort()
})

// 筛选后的图片（OR：包含任意选中标签）
const filteredImages = computed(() => {
  if (selectedFilters.value.length === 0) return images.value
  return images.value.filter(img => {
    if (!img.tags || img.tags.length === 0) return false
    return selectedFilters.value.some(filterTag => img.tags.includes(filterTag))
  })
})

// 切换筛选标签
function toggleFilter(tag) {
  const index = selectedFilters.value.indexOf(tag)
  if (index === -1) {
    selectedFilters.value.push(tag)
  } else {
    selectedFilters.value.splice(index, 1)
  }
}

function clearFilters() {
  selectedFilters.value = []
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
      if (res.ok) await loadImages()
    } catch (e) { console.error('上传失败:', e) }
  }
  fileInput.value.value = ''
}

async function loadImages() {
  try {
    const res = await fetch('/api/images')
    if (res.ok) {
      const raw = await res.json()
      // 为每张图片添加临时编辑字段
      images.value = raw.map(img => ({
        ...img,
        newTagInput: ''
      }))
    }
  } catch (e) { console.error('加载图片列表失败:', e) }
}

// 添加标签
async function addTag(img, inputValue) {
  if (!inputValue || !inputValue.trim()) {
    img.newTagInput = ''
    return
  }
  const newTags = [...(img.tags || []), inputValue.trim()]
  const uniqueTags = [...new Set(newTags)]
  await updateTags(img, uniqueTags)
  img.newTagInput = ''
}

// 删除标签
async function removeTag(img, tagToRemove) {
  const newTags = (img.tags || []).filter(t => t !== tagToRemove)
  await updateTags(img, newTags)
}

// 通用标签更新函数
async function updateTags(img, newTags) {
  try {
    const res = await fetch('/api/images/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rel_path: img.rel_path,
        tags: newTags
      })
    })
    if (res.ok) {
      img.tags = newTags
    } else {
      console.error('标签更新失败')
    }
  } catch (err) {
    console.error('标签更新异常', err)
  }
}

async function deleteImage(img) {
  if (!confirm('确定删除这张图片吗？')) return
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
  navigator.clipboard.writeText(window.location.origin + url).then(() => alert('链接已复制'))
}

onMounted(() => {
  loadImages()
})
</script>

<style scoped>
/* 样式基本沿用原来，新增标签列表样式 */
.gallery-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}
.upload-area { margin-bottom: 30px; text-align: center; }
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
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.filter-label { font-size: 14px; color: #666; }
.filter-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-tag {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  font-size: 13px;
}
.filter-tag.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}
.clear-filter {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 13px;
}
.masonry {
  columns: 3 300px;
  column-gap: 16px;
}
.masonry-item {
  break-inside: avoid;
  margin-bottom: 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.image-wrapper {
  position: relative;
}
.image-wrapper img {
  width: 100%;
  display: block;
  border-radius: 12px 12px 0 0;
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
  border-radius: 12px 12px 0 0;
}
.image-wrapper:hover .image-overlay {
  opacity: 1;
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
}
.delete-btn { color: #dc2626; }
.tags-edit {
  padding: 12px;
  border-top: 1px solid #eee;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.tag-badge {
  background: #eef2ff;
  color: #1d4ed8;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.remove-tag {
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  color: #666;
}
.remove-tag:hover { color: #dc2626; }
.tag-input-small {
  border: 1px solid #ddd;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  width: 100px;
  outline: none;
}
.tag-input-small:focus { border-color: #2563eb; }
.empty-state { text-align: center; padding: 80px; color: #999; }
</style>