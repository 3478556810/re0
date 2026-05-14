<template>
  <div
    class="avatar-placeholder"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <span class="placeholder-text">杉汐</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 128 })
</script>

<style scoped>
.avatar-placeholder {
  border-radius: 50%;
  background: linear-gradient(135deg, #f0a040, #f5c070);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a2e;
  font-weight: bold;
  font-size: 14px;
}
</style>