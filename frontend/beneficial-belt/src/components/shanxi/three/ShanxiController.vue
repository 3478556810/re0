<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTres } from '@tresjs/core'
import * as THREE from 'three'

const props = defineProps({
  target: { type: Object, required: true },
  mixer: { type: Object, default: null },
  actions: { type: Object, default: () => ({}) },
  moveSpeed: { type: Number, default: 5.5 }
})

const { camera } = useTres()

const keys = { w: false, a: false, s: false, d: false }
let animFrameId = null
let currentAnim = 'idle'

function switchAnimation(name) {
  const actions = props.actions
  if (!actions || Object.keys(actions).length === 0) return
  const newAction = actions[name]
  if (!newAction || newAction.isRunning()) return

  // 停止其他所有动作
  Object.values(actions).forEach(act => {
    if (act.isRunning()) act.stop()
  })
  newAction.reset().play()
  currentAnim = name
}

function updateMovement() {
  if (!camera.value || !props.target) {
    animFrameId = requestAnimationFrame(updateMovement)
    return
  }

  const delta = 0.016
  let dx = 0, dz = 0
  if (keys.w) dz -= 1
  if (keys.s) dz += 1
  if (keys.a) dx -= 1
  if (keys.d) dx += 1

  const moving = dx !== 0 || dz !== 0

  if (moving) {
    // 基于摄像机方向计算移动向量
    const forward = new THREE.Vector3()
    camera.value.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(camera.value.up, forward).normalize()

    const moveDir = new THREE.Vector3()
      .addScaledVector(forward, dz)
      .addScaledVector(right, dx)
    moveDir.normalize()

    props.target.position.x += moveDir.x * props.moveSpeed * delta
    props.target.position.z += moveDir.z * props.moveSpeed * delta
    props.target.rotation.y = Math.atan2(moveDir.x, moveDir.z) + Math.PI

    if (props.actions.walk) {
      switchAnimation('walk')
    } else {
      const first = Object.keys(props.actions)[0]
      if (first) switchAnimation(first)
    }
  } else {
    if (props.actions.idle) {
      switchAnimation('idle')
    }
  }

  if (props.mixer) props.mixer.update(delta)
}

function animate() {
  updateMovement()
  animFrameId = requestAnimationFrame(animate)
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
  if (props.actions.idle) switchAnimation('idle')
  animate()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  cancelAnimationFrame(animFrameId)
})
</script>