<template>
  <div class="avatar-container" :style="containerStyle">
    <DissolveTransition :duration="1000">
      <img
        :key="displaySrc"
        :src="displaySrc"
        alt="杉汐"
        class="avatar-image"
        @error="onImageError"
      />
    </DissolveTransition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { DissolveTransition } from '@noction/vue-bezier'
import '@noction/vue-bezier/styles'

const props = defineProps({
  emotion: { type: Object, default: () => ({ current: 'calm' }) },
  size: { type: Number, default: 128 },
  glowColor: { type: String, default: 'rgba(240, 160, 64, 0.5)' }
})

const imageFailed = ref(false)
const displaySrc = ref('/avatars/calm.png')

const containerStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
  boxShadow: `
    0 0 20px ${props.glowColor},
    0 0 40px ${props.glowColor},
    0 0 60px ${props.glowColor.replace(/[\d.]+\)$/, '0.4)')}
  `
}))

// 预加载：新图片完全加载后才更新 displaySrc
async function preloadAndSwitch(emotion) {
  const src = `/avatars/${emotion}.png`
  const img = new Image()
  img.onload = () => {
    displaySrc.value = src
    imageFailed.value = false
  }
  img.onerror = () => {
    imageFailed.value = true
  }
  img.src = src
}

watch(() => props.emotion?.current, (newEmotion) => {
  if (newEmotion) preloadAndSwitch(newEmotion)
}, { immediate: true })

function onImageError() {
  imageFailed.value = true
}
</script>

<style scoped>
.avatar-container {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(15, 10, 20, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 1s ease;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>