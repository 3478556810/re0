<template>
  <div class="avatar-container" :style="containerStyle">
    <img :src="avatarSrc" alt="杉汐" class="avatar-image" @error="onImageError" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  emotion: { type: Object, default: () => ({ current: 'calm' }) },
  size: { type: Number, default: 128 },
  glowColor: { type: String, default: 'rgba(240, 160, 64, 0.5)' }
})

const imageFailed = ref(false)

// 动态样式：包含尺寸和动态光晕颜色
const containerStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
  boxShadow: `
    0 0 20px ${props.glowColor},
    0 0 40px ${props.glowColor},
    0 0 60px ${props.glowColor.replace(/[\d\.]+\)$/, '0.4)')}
  `
}))

const avatarSrc = computed(() => {
  if (imageFailed.value) return ''
  const emotion = props.emotion?.current || 'calm'
  return `/avatars/${emotion}.png`
})

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
  background: linear-gradient(135deg, #f0a040, #f5c070);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: avatar-glow 3s ease-in-out infinite;
  transition: box-shadow 1s ease; /* 从 0.5s 改为 1s */
}

@keyframes avatar-glow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>