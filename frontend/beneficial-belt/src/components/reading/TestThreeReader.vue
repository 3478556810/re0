<template>
  <div ref="flipContainer" class="flip-container"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { PageFlip } from 'page-flip'

const flipContainer = ref(null)

onMounted(() => {
  const container = flipContainer.value
  container.style.width = '550px'
  container.style.height = '700px'
  container.style.background = '#fff'

  const pageFlip = new PageFlip(container, {
    width: 550,
    height: 700,
    size: 'fixed',
    autoSize: false,
    display: 'single',
    maxShadowOpacity: 0.3,
    showCover: false,
    flippingTime: 600,
    usePortrait: false,
    swipeDistance: 30,
  })

  // 创建两个测试页
  const page1 = document.createElement('div')
  page1.innerHTML = '<p>第一页内容</p>'
  const page2 = document.createElement('div')
  page2.innerHTML = '<p>第二页内容</p>'

  pageFlip.loadFromHTML([page1, page2])
  console.log('方向:', pageFlip.getOrientation()) // 打印方向
})
</script>

<style scoped>
.flip-container {
  margin: 0 auto;
}
</style>