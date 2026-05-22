<template>
  <ul class="nav-links">
    <li><a href="/shanxi-hut">杉汐小屋</a></li>
    <li><a href="/blog">日记</a></li>
    <li><a href="/timeline">生命线</a></li>
    <li v-if="isLoggedIn"><a href="/image-bed">杉汐图库</a></li>
  </ul>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isLoggedIn = ref(false)

function updateLoginState() {
  isLoggedIn.value = !!localStorage.getItem('token')
}

onMounted(() => {
  updateLoginState()
  window.addEventListener('auth-change', updateLoginState)
})

onUnmounted(() => {
  window.removeEventListener('auth-change', updateLoginState)
})
</script>

<style scoped>
/* 完全复刻你 NavBar.astro 中的导航链接样式，确保权重足够 */
.nav-links {
  list-style: none;
  display: flex;
  gap: 32px;
  margin: 0;
  padding: 0;
}

.nav-links a,
.nav-links a:visited,
.nav-links a:focus,
.nav-links a:active {
  color: #334155 !important;          /* 强制覆盖浏览器默认紫色 */
  text-decoration: none !important;   /* 强制移除下划线 */
  font-size: 0.9rem;
  font-weight: 450;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
  padding: 6px 0;
  outline: none;
}

.nav-links a:hover {
  color: #0066cc;
  border-bottom-color: #0066cc;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
}
</style>