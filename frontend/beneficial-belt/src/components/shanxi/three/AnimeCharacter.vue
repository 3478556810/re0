<!-- src/components/shanxi/three/AnimeCharacter.vue -->
<template>
  <TresGroup v-if="model" :position="position" :rotation="rotation">
    <TresGroup ref="breatheGroup">
      <primitive :object="model" />
    </TresGroup>
  </TresGroup>
  <TresMesh v-else :position="position">
    <TresSphereGeometry :args="[0.3, 16, 16]" />
    <TresMeshBasicMaterial color="yellow" />
  </TresMesh>
</template>

<script setup>
import { ref, markRaw, onMounted, onUnmounted } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const props = defineProps({
  position: { type: Array, default: () => [0, 0, 0] },
  rotation: { type: Array, default: () => [0, 0, 0] },
  breathing: { type: Boolean, default: false }
})

const model = ref(null)
const breatheGroup = ref(null)
let animFrameId = null

onMounted(() => {
  const loader = new GLTFLoader()
  loader.load(
    '/models/model.glb',
    (gltf) => {
      model.value = markRaw(gltf.scene)
      console.log('杉汐模型就绪')
      // 开始呼吸动画
      if (props.breathing) startBreathing()
    },
    undefined,
    (error) => {
      console.error('模型加载失败', error)
    }
  )
})

function startBreathing() {
  const animate = () => {
    if (breatheGroup.value && props.breathing) {
      const t = performance.now() * 0.001
      breatheGroup.value.position.y = Math.sin(t * 2) * 0.03
    }
    animFrameId = requestAnimationFrame(animate)
  }
  animate()
}

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
})
</script>