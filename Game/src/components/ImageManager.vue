<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel pixel-panel" @click.stop>
      <h2>🖼️ 自定义头像</h2>
      <p class="tip">选择类型并上传图片，立即生效。</p>
      <div class="upload-row">
        <select v-model="selectedType" class="pixel-input">
          <option value="player">主角</option>
          <option value="slime">史莱姆</option>
          <option value="goblin">哥布林</option>
          <option value="scorpion">毒蝎</option>
        </select>
        <input type="file" accept="image/*" @change="onFileChange" ref="fileInput" style="display:none" />
        <button class="pixel-btn small" @click="$refs.fileInput.click()">选择文件</button>
      </div>
      <div v-if="customImages[selectedType]" class="preview">
        <img :src="customImages[selectedType]" width="64" height="64" style="object-fit:contain; border:2px solid #b89a6a;" />
      </div>
      <div class="current-images">
        <div v-for="(img, key) in customImages" :key="key" class="image-entry">
          <span>{{ key }}</span>
          <img :src="img" width="32" height="32" />
          <button class="pixel-btn small" @click="deleteImage(key)">删除</button>
        </div>
      </div>
      <button class="pixel-btn" @click="$emit('close')">返回</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const selectedType = ref('player')
const customImages = reactive({})

onMounted(() => {
  const saved = localStorage.getItem('customImages')
  if (saved) {
    Object.assign(customImages, JSON.parse(saved))
  }
})

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    customImages[selectedType.value] = ev.target.result
    saveImages()
  }
  reader.readAsDataURL(file)
}

function deleteImage(key) {
  delete customImages[key]
  saveImages()
}

function saveImages() {
  localStorage.setItem('customImages', JSON.stringify(customImages))
  // 实时同步到 store
  if (!store.config) store.config = {}
  store.config.customImages = { ...customImages }
  store.save()
}
</script>