// src/components/shanxi/three/usePlayerController.js
import * as THREE from 'three'

export function usePlayerController(camera, renderer, container) {
  let isLocked = false
  const keys = { w: false, a: false, s: false, d: false }
  let cameraYaw = Math.PI
  let cameraPitch = 0.3
  const CAMERA_DISTANCE = 3.0
  const CAMERA_HEIGHT = 1.8
  const PLAYER_RADIUS = 0.4
  const ATTACK_RANGE = 1.8
  const ATTACK_ANGLE = Math.PI / 3
  let obstacles = []
  let onAttackCallback = null

  // 鼠标左键处理
  function onMouseDown(e) {
    if (e.button !== 0) return
    if (!isLocked) {
      // 未锁定：锁定指针
      container?.requestPointerLock()
    } else {
      // 已锁定：触发攻击
      if (onAttackCallback) onAttackCallback()
    }
  }

  // 锁定状态监听
  function onPointerLockChange() {
    isLocked = document.pointerLockElement === container
  }

  function lockPointer() {
    if (container && !isLocked) {
      container.requestPointerLock()
    }
  }

  function onKeyDown(e) {
    if (e.key in keys) {
      keys[e.key] = true
      e.preventDefault()
    }
  }
  function onKeyUp(e) {
    if (e.key in keys) {
      keys[e.key] = false
      e.preventDefault()
    }
  }
  function onMouseMove(e) {
    if (!isLocked) return
    cameraYaw -= e.movementX * 0.002
    cameraPitch += e.movementY * 0.002
    cameraPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 2.5, cameraPitch))
  }
  function onResize() {
    if (!container) return
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }

  function attachEvents() {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('resize', onResize)
    window.addEventListener('mousedown', onMouseDown)
    document.addEventListener('pointerlockchange', onPointerLockChange)
  }
  function detachEvents() {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('mousedown', onMouseDown)
    document.removeEventListener('pointerlockchange', onPointerLockChange)
  }

  function setObstacles(obs) { obstacles = obs }
  function setAttackCallback(cb) { onAttackCallback = cb }

  function isColliding(x, z) {
    for (const obs of obstacles) {
      const dx = x - obs.x
      const dz = z - obs.z
      if (Math.sqrt(dx * dx + dz * dz) < PLAYER_RADIUS + obs.radius) return true
    }
    if (Math.abs(x) > 14 || Math.abs(z) > 14) return true
    return false
  }

  function getPlayerForward() {
    if (!camera) return new THREE.Vector3(0, 0, 1)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    forward.y = 0
    forward.normalize()
    return forward
  }

  function applyMovement(model, delta) {
    if (!model) return false
    let dx = 0, dz = 0
    if (keys.w) dz += 1
    if (keys.s) dz -= 1
    if (keys.a) dx -= 1
    if (keys.d) dx += 1
    const moving = dx !== 0 || dz !== 0

    if (moving) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      forward.y = 0; forward.normalize()
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
      right.y = 0; right.normalize()
      const moveDir = new THREE.Vector3()
        .addScaledVector(forward, dz)
        .addScaledVector(right, dx)
        .normalize()

      const newX = model.position.x + moveDir.x * 5.5 * delta
      const newZ = model.position.z + moveDir.z * 5.5 * delta
      if (!isColliding(newX, newZ)) {
        model.position.x = newX
        model.position.z = newZ
      }
      model.rotation.y = Math.atan2(moveDir.x, moveDir.z) + Math.PI
    }
    return moving
  }

  function followTarget(model) {
    if (!model || !camera) return
    const pos = model.position
    const dir = new THREE.Vector3(
      Math.sin(cameraYaw) * Math.cos(cameraPitch),
      Math.sin(cameraPitch),
      Math.cos(cameraYaw) * Math.cos(cameraPitch)
    ).multiplyScalar(CAMERA_DISTANCE)
    const targetPos = pos.clone().add(dir).add(new THREE.Vector3(0, CAMERA_HEIGHT, 0))
    camera.position.lerp(targetPos, 0.1)
    camera.lookAt(pos.x, pos.y + 0.8, pos.z)
  }

  return {
    lockPointer,
    attachEvents,
    detachEvents,
    applyMovement,
    followTarget,
    setObstacles,
    setAttackCallback,
    getPlayerForward,
    getPlayerPosition: () => camera?.position || new THREE.Vector3(),
    isColliding,
    getAttackRange: () => ATTACK_RANGE,
    getAttackAngle: () => ATTACK_ANGLE
  }
}