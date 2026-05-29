<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel" @click.stop>
      <!-- 右上角独立关闭按钮 -->
      <button class="close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" />
      </button>

      <h2><Icon icon="mdi:image-multiple" /> 自定义头像</h2>
      <p class="tip">选择类型并上传图片，立即生效。</p>

      <div class="upload-row">
        <select v-model="selectedType" class="pixel-input">
          <option value="player">主角</option>
          <option value="slime">史莱姆</option>
          <option value="goblin">哥布林</option>
          <option value="scorpion">毒蝎</option>
        </select>
        <input
          type="file"
          accept="image/*"
          @change="onFileChange"
          ref="fileInput"
          style="display:none"
        />
        <button class="pixel-btn small" @click="fileInput.click()">
          <Icon icon="mdi:folder-open" /> 选择文件
        </button>
      </div>

      <div v-if="customImages[selectedType]" class="preview">
        <img :src="customImages[selectedType]" width="64" height="64"
             style="object-fit:contain; border:2px solid #b89a6a; border-radius:8px;" />
      </div>

      <div class="current-images">
        <div v-for="(img, key) in customImages" :key="key" class="image-entry">
          <span class="image-key">{{ key }}</span>
          <img :src="img" width="32" height="32" />
          <button class="pixel-btn small" @click="deleteImage(key)">
            <Icon icon="mdi:delete" />
          </button>
        </div>
        <p v-if="Object.keys(customImages).length === 0" class="tip">暂无自定义图片</p>
      </div>

      <button class="pixel-btn" @click="$emit('close')">
        <Icon icon="mdi:arrow-left" /> 返回
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const selectedType = ref('player')
const customImages = reactive({})
const fileInput = ref(null)

onMounted(() => {
  try {
    const saved = localStorage.getItem('customImages')
    if (saved) Object.assign(customImages, JSON.parse(saved))
  } catch (e) {
    console.warn('读取自定义图片失败', e)
  }
})

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const reader = new FileReader()
    reader.onload = (ev) => {
      customImages[selectedType.value] = ev.target.result
      saveImages()
    }
    reader.onerror = () => alert('图片读取失败，请重试')
    reader.readAsDataURL(file)
  } catch (err) {
    alert('文件处理失败')
  }
  e.target.value = '' // 允许重复选择同一文件
}

function deleteImage(key) {
  delete customImages[key]
  saveImages()
}

function saveImages() {
  try {
    localStorage.setItem('customImages', JSON.stringify(customImages))
    if (!store.config) store.config = {}
    store.config.customImages = { ...customImages }
    store.save()  // 这行必须存在
  } catch (e) {
    alert('保存失败，可能图片太大')
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(10px);
  display: flex; justify-content: center; align-items: center;
  z-index: 300;
}
.panel {
  width: 440px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  position: relative; /* 为了定位关闭按钮 */
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #ffd;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 10;
}
.close-btn:hover {
  transform: scale(1.2);
}

h2 {
  font-size: 14px;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.tip {
  font-size: 8px;
  color: #aaa;
  margin-bottom: 15px;
  line-height: 1.5;
}
.upload-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
}
.pixel-input {
  background: #1a2a3a;
  border: 1px solid #b89a6a;
  color: #ffd;
  padding: 6px 10px;
  font-family: 'Press Start 2P';
  font-size: 10px;
  border-radius: 8px;
}
.preview {
  margin: 15px 0;
  text-align: center;
}
.current-images {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.image-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 9px;
  background: rgba(0,0,0,0.3);
  padding: 6px 10px;
  border-radius: 8px;
}
.image-key {
  width: 70px;
  text-transform: capitalize;
}
.image-entry img {
  border-radius: 4px;
  border: 1px solid #b89a6a;
}
</style>