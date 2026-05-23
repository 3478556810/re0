<template>
  <TresCanvas :shadows="true" window-size>
    <TresAmbientLight :intensity="0.8" color="#fff5ee" />
    <TresDirectionalLight :position="[2, 5, 3]" :intensity="1.2" color="#fffaf0" cast-shadow />
    <TresPointLight :position="[2, 1.8, 1.5]" :intensity="lampIntensity" :color="lampColor" cast-shadow />

    <RoomStructure />
    <Desk />
    <Bed />
    <Bookshelf />
    <Window />

<ShanxiVRM ref="shanxiRef" :position="[0, 0, 0]" :scale="1.5" />

    <!-- 摄像机跟随（必须在 TresCanvas 内部） -->
    <CameraFollower :target="modelTarget" />
  </TresCanvas>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { TresCanvas } from '@tresjs/core'
import RoomStructure from './three/RoomStructure.vue'
import Desk from './three/Desk.vue'
import Bed from './three/Bed.vue'
import Bookshelf from './three/Bookshelf.vue'
import Window from './three/Window.vue'
import ShanxiVRM from './three/ShanxiVRM.vue'
import CameraFollower from './three/CameraFollower.vue'

const props = defineProps({
  status: { type: String, default: '活跃中' },
  isNight: { type: Boolean, default: false }
})

const lampIntensity = computed(() => {
  if (props.isNight) return 1.8
  return props.status.includes('休眠') ? 0 : 1.2
})
const lampColor = computed(() => props.isNight ? '#aaccff' : '#ffe4b5')

// 获取杉汐模型引用，传给摄像机跟随
const shanxiRef = ref(null)
const modelTarget = ref(null)

watchEffect(() => {
  modelTarget.value = shanxiRef.value?.modelRef
})
</script>