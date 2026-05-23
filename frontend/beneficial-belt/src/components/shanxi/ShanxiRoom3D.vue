<!-- src/components/shanxi/ShanxiRoom3D.vue -->
<template>
  <TresCanvas :shadows="true" window-size>
    <!-- ✅ 移除 OrbitControls，改成手动控制相机 -->
    <TresPerspectiveCamera ref="cameraRef" :position="[0, 2.5, 4]" />

    <TresAmbientLight :intensity="0.8" color="#fff5ee" />
    <TresDirectionalLight :position="[2, 5, 3]" :intensity="1.2" color="#fffaf0" cast-shadow />
    <TresPointLight :position="[2, 1.8, 1.5]" :intensity="lampIntensity" :color="lampColor" cast-shadow />

    <RoomStructure />
    <Desk />
    <Bed />
    <Bookshelf />
    <Window />

    <ShanxiVRM ref="shanxiRef" :position="[0, 0, 0]" :scale="1" />
  </TresCanvas>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { TresCanvas } from '@tresjs/core'
// ❌ 移除 OrbitControls
// import { OrbitControls } from '@tresjs/cientos'
import RoomStructure from './three/RoomStructure.vue'
import Desk from './three/Desk.vue'
import Bed from './three/Bed.vue'
import Bookshelf from './three/Bookshelf.vue'
import Window from './three/Window.vue'
import ShanxiVRM from './three/ShanxiVRM.vue'

const props = defineProps({
  status: { type: String, default: '活跃中' },
  isNight: { type: Boolean, default: false }
})

const lampIntensity = computed(() => props.isNight ? 1.8 : 1.2)
const lampColor = computed(() => props.isNight ? '#aaccff' : '#ffe4b5')

const shanxiRef = ref(null)
const cameraRef = ref(null)
let animFrameId = null

// 相机相对偏移
const cameraOffset = new THREE.Vector3(0, 1.8, 3.5)
const lookAtOffset = new THREE.Vector3(0, 0.9, 0) // 注视腰部

// ✅ 手动的摄像机跟随逻辑
function updateCamera() {
  if (!cameraRef.value || !shanxiRef.value?.modelRef) {
    animFrameId = requestAnimationFrame(updateCamera)
    return
  }

  const model = shanxiRef.value.modelRef
  const targetPos = model.position.clone().add(cameraOffset)
  const lookAtPos = model.position.clone().add(lookAtOffset)

  // 平滑移动摄像机
  cameraRef.value.position.lerp(targetPos, 0.08)
  
  // 注视杉汐腰部
  cameraRef.value.lookAt(lookAtPos)

  animFrameId = requestAnimationFrame(updateCamera)
}

onMounted(() => {
  updateCamera()
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
})
</script>