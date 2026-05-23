<script setup>
import { watch, onMounted, onUnmounted } from 'vue'
import { useTres } from '@tresjs/core'
import * as THREE from 'three'

const props = defineProps({
  target: { type: Object, default: null }
})

const { camera } = useTres()
let animFrameId = null

function update() {
  if (!props.target || !camera.value) {
    animFrameId = requestAnimationFrame(update)
    return
  }

  const pos = props.target.position
  const rotY = props.target.rotation.y

  // 计算角色身后的偏移（世界坐标系）
  const backDir = new THREE.Vector3(0, 0, 1)  // 假设角色默认面朝 +Z
  const rotatedBack = backDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY)
  const offset = rotatedBack.multiplyScalar(2.5).add(new THREE.Vector3(0, 1.5, 0))
  const targetCamPos = pos.clone().add(offset)

  // 平滑移动摄像机
  camera.value.position.lerp(targetCamPos, 0.1)

  // 注视角色腰部
  const lookTarget = pos.clone().add(new THREE.Vector3(0, 0.8, 0))
  camera.value.lookAt(lookTarget)

  animFrameId = requestAnimationFrame(update)
}

onMounted(() => {
  update()
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
})
</script>