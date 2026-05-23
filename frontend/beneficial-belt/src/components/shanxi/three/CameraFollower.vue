
<script setup>
import { onMounted, onUnmounted, watch, ref } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  target: { type: Object, required: true },
  vrm: { type: Object, default: null }
})

const moveSpeed = 3.0
const keys = { w: false, a: false, s: false, d: false }
let animFrameId = null
let leftUpperLeg = null, rightUpperLeg = null
let leftLowerLeg = null, rightLowerLeg = null
let walkTime = 0

// 碰撞障碍物定义（与新家具位置匹配）
const obstacles = [
  { type: 'box', center: [2, 0, 1.5], half: [0.8, 0.5, 0.4] },  // 桌子
  { type: 'box', center: [-2, 0, 2.5], half: [0.45, 0.3, 0.9] }, // 床
  { type: 'box', center: [3, 1, -2], half: [0.5, 1.25, 0.15] },   // 书架
]
const wallBound = 3.6  // 墙壁边界

function checkCollision(x, z, radius = 0.4) {
  if (Math.abs(x) > wallBound - radius || Math.abs(z) > wallBound - radius) return true
  for (const obs of obstacles) {
    const dx = Math.abs(x - obs.center[0])
    const dz = Math.abs(z - obs.center[2])
    if (dx < obs.half[0] + radius && dz < obs.half[2] + radius) return true
  }
  return false
}

// 从 humanoid.humanBones 中查找骨骼
function getBoneByName(humanoid, boneName) {
  const bones = humanoid.humanBones
  if (!bones) return null
  const found = bones.find(b => b.bone === boneName)
  return found ? found.node : null
}

function cacheBones() {
  if (!props.vrm?.humanoid) return
  const h = props.vrm.humanoid
  leftUpperLeg = getBoneByName(h, 'leftUpperLeg')
  rightUpperLeg = getBoneByName(h, 'rightUpperLeg')
  leftLowerLeg = getBoneByName(h, 'leftLowerLeg')
  rightLowerLeg = getBoneByName(h, 'rightLowerLeg')
  console.log('骨骼引用获取：', { leftUpperLeg, rightUpperLeg, leftLowerLeg, rightLowerLeg })
}

watch(() => props.vrm, () => {
  cacheBones()
}, { immediate: true })

function onKeyDown(e) {
  if (e.key in keys) { keys[e.key] = true; e.preventDefault() }
}
function onKeyUp(e) {
  if (e.key in keys) { keys[e.key] = false; e.preventDefault() }
}

function animateLegs(delta, isMoving) {
  if (!leftUpperLeg || !rightUpperLeg) return
  const speed = isMoving ? 12 : 0
  walkTime += delta * speed
  const swing = isMoving ? Math.sin(walkTime) * 0.8 : 0
  leftUpperLeg.rotation.x = swing
  rightUpperLeg.rotation.x = -swing
  if (leftLowerLeg) leftLowerLeg.rotation.x = Math.abs(swing) * 0.4
  if (rightLowerLeg) rightLowerLeg.rotation.x = Math.abs(swing) * 0.4
  if (!isMoving) {
    leftUpperLeg.rotation.x = 0
    rightUpperLeg.rotation.x = 0
    if (leftLowerLeg) leftLowerLeg.rotation.x = 0
    if (rightLowerLeg) rightLowerLeg.rotation.x = 0
    walkTime = 0
  }
}

function update() {
  if (!props.target) { animFrameId = requestAnimationFrame(update); return }
  const delta = 0.016
  const dir = new THREE.Vector3()
  if (keys.w) dir.z -= 1
  if (keys.s) dir.z += 1
  if (keys.a) dir.x -= 1
  if (keys.d) dir.x += 1
  const moving = dir.length() > 0
  if (moving) {
    dir.normalize()
    const newX = props.target.position.x + dir.x * moveSpeed * delta
    const newZ = props.target.position.z + dir.z * moveSpeed * delta
    if (!checkCollision(newX, newZ)) {
      props.target.position.x = newX
      props.target.position.z = newZ
    }
    props.target.rotation.y = Math.atan2(dir.x, dir.z)
  }
  animateLegs(delta, moving)
  animFrameId = requestAnimationFrame(update)
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  update()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  cancelAnimationFrame(animFrameId)
})
</script>