<template>
  <div
    class="avatar-container"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <img
      :src="avatarSrc"
      alt="杉汐"
      class="avatar-image"
      @error="onImageError"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  emotion: {
    type: Object,
    default: () => ({
      current: 'calm'
    })
  },
  size: {
    type: Number,
    default: 128
  }
})

const imageFailed = ref(false)

// 根据情绪切换头像图片路径
const avatarSrc = computed(() => {
  if (imageFailed.value) return ''
  const emotion = props.emotion?.current || 'calm'
  return `/avatars/${emotion}.png`
})

// 图片加载失败时回退到占位文字
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
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>