<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  target: { type: Object, required: true },
  vrm: { type: Object, default: null }
})

const moveSpeed = 3.0
const keys = { w: false, a: false, s: false, d: false }
let animFrameId = null
let walkTime = 0

// 碰撞区域
const obstacles = [
  { type: 'box', center: [2, 0, 1.5], half: [0.8, 0.5, 0.4] },
  { type: 'box', center: [-2, 0, 2.5], half: [0.45, 0.3, 0.9] },
  { type: 'box', center: [3, 1, -2], half: [0.5, 1.25, 0.15] },
]
const wallBound = 3.6

function checkCollision(x, z, radius = 0.4) {
  if (Math.abs(x) > wallBound - radius || Math.abs(z) > wallBound - radius) return true
  for (const obs of obstacles) {
    const dx = Math.abs(x - obs.center[0])
    const dz = Math.abs(z - obs.center[2])
    if (dx < obs.half[0] + radius && dz < obs.half[2] + radius) return true
  }
  return false
}

function animateWalk(delta, moving) {
  const humanoid = props.vrm?.humanoid
  if (!humanoid) return

  const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm')
  const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm')
  const leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm')
  const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm')

  // ... 腿骨骼获取相同 ...

  if (!leftUpperArm || !rightUpperArm) return

  const speed = moving ? 10 : 0
  walkTime += delta * speed
  const legSwing = moving ? Math.sin(walkTime) * 0.8 : 0
  const armSwing = moving ? Math.sin(walkTime + Math.PI) * 0.5 : 0

  // 基础下垂角度
  const armDownAngle = -Math.PI / 2

  // 手臂：基础下垂 + 前后摆动
  leftUpperArm.rotation.x = armDownAngle + armSwing
  rightUpperArm.rotation.x = armDownAngle - armSwing
  if (leftLowerArm) leftLowerArm.rotation.x = Math.abs(armSwing) * 0.3
  if (rightLowerArm) rightLowerArm.rotation.x = Math.abs(armSwing) * 0.3

  // 腿（不变）
  if (leftUpperLeg) leftUpperLeg.rotation.x = legSwing
  if (rightUpperLeg) rightUpperLeg.rotation.x = -legSwing
  if (leftLowerLeg) leftLowerLeg.rotation.x = Math.abs(legSwing) * 0.4
  if (rightLowerLeg) rightLowerLeg.rotation.x = Math.abs(legSwing) * 0.4

  if (!moving) {
    // 静止时手臂保持下垂，腿归零
    [leftUpperLeg, rightUpperLeg, leftLowerLeg, rightLowerLeg].forEach(b => { if (b) b.rotation.x = 0 })
    leftUpperArm.rotation.x = armDownAngle
    rightUpperArm.rotation.x = armDownAngle
    if (leftLowerArm) leftLowerArm.rotation.x = 0
    if (rightLowerArm) rightLowerArm.rotation.x = 0
    walkTime = 0
  }
}

function update() {
  if (!props.target) { animFrameId = requestAnimationFrame(update); return }

  // 每帧调用 vrm.update()，drive spring bones + normalize→raw 同步
  if (props.vrm) props.vrm.update(0.016)

  const delta = 0.016
  let dx = 0, dz = 0
  if (keys.w) dz -= 1
  if (keys.s) dz += 1
  if (keys.a) dx -= 1
  if (keys.d) dx += 1
  const moving = dx !== 0 || dz !== 0

  if (moving) {
    const len = Math.sqrt(dx * dx + dz * dz)
    dx /= len
    dz /= len
    const newX = props.target.position.x + dx * moveSpeed * delta
    const newZ = props.target.position.z + dz * moveSpeed * delta
    if (!checkCollision(newX, newZ)) {
      props.target.position.x = newX
      props.target.position.z = newZ
    }
    props.target.rotation.y = Math.atan2(dx, dz)
  }

  animateWalk(delta, moving)
  animFrameId = requestAnimationFrame(update)
}

function onKeyDown(e) {
  if (e.key in keys) { keys[e.key] = true; e.preventDefault() }
}
function onKeyUp(e) {
  if (e.key in keys) { keys[e.key] = false; e.preventDefault() }
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