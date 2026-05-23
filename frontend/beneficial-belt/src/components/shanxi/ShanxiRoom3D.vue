<template>
  <TresCanvas :shadows="true" window-size>
    <TresPerspectiveCamera ref="cameraRef" :position="[3, 2.5, 4]" />

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

// 摄像机参数
const cameraYaw = ref(0)      // 水平旋转角度（弧度）
const cameraPitch = ref(0.3)  // 俯仰角度（弧度，0.3 略俯视）
const distance = 3.0          // 摄像机距离
const height = 1.8            // 摄像机相对角色的高度

// 鼠标控制相关
let isPointerLocked = false
const MOUSE_SENSITIVITY = 0.0005

// 动画循环ID
let animFrameId = null

function onMouseMove(e) {
  if (!isPointerLocked) return
  cameraYaw.value -= e.movementX * MOUSE_SENSITIVITY
  cameraPitch.value += e.movementY * MOUSE_SENSITIVITY
  // 限制俯仰角度
  cameraPitch.value = Math.max(-Math.PI / 3, Math.min(Math.PI / 2.5, cameraPitch.value))
}

function onPointerLockChange() {
  isPointerLocked = document.pointerLockElement !== null
}

function onClickCanvas() {
  const canvas = document.querySelector('canvas')
  if (canvas) canvas.requestPointerLock()
}

// 摄像机跟随与旋转更新
function updateCamera() {
  const model = shanxiRef.value?.modelRef
  if (!model || !cameraRef.value) {
    animFrameId = requestAnimationFrame(updateCamera)
    return
  }

  // 根据 Yaw/Pitch 计算摄像机在角色身后的偏移
  const yaw = cameraYaw.value
  const pitch = cameraPitch.value

  // 计算摄像机世界位置：从角色位置出发，先绕 Y 轴旋转 Yaw，再绕 X 轴旋转 Pitch
  const offset = new THREE.Vector3(0, 0, distance)  // 初始在角色后方（Z轴正方向？注意角色面朝 +Z）
  // 应用俯仰（绕局部X轴）
 
  // 应用水平旋转（绕世界Y轴）
  const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
  offset.applyQuaternion(yawQuat)


   const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch)
  offset.applyQuaternion(pitchQuat)
  // 摄像机目标位置 = 角色位置 + 偏移 + 高度
  const targetPos = model.position.clone().add(offset).add(new THREE.Vector3(0, height, 0))

  // 平滑移动
  cameraRef.value.position.lerp(targetPos, 0.1)

  // 注视角色腰部
  const lookTarget = model.position.clone().add(new THREE.Vector3(0, 0.8, 0))
  cameraRef.value.lookAt(lookTarget)

  animFrameId = requestAnimationFrame(updateCamera)
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('pointerlockchange', onPointerLockChange)
  document.addEventListener('click', onClickCanvas)

  updateCamera()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('pointerlockchange', onPointerLockChange)
  document.removeEventListener('click', onClickCanvas)
  if (animFrameId) cancelAnimationFrame(animFrameId)
})
</script>