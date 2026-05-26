<template>
  <div ref="container" style="width: 100vw; height: 100vh; overflow: hidden; position: relative;" @click="lockPointer">
    <!-- HUD -->
    <div style="position: absolute; top: 20px; left: 20px; color: white; background: rgba(0,0,0,0.7); padding: 12px; border-radius: 12px; font-family: sans-serif;">
      <div>❤️ {{ combat.playerHp }} / {{ combat.playerMaxHp }}</div>
      <div>⭐ Lv.{{ combat.playerLevel }} | {{ combat.playerExp }}/{{ combat.expToNext }}</div>
      <div>⚔️ {{ combat.playerAttack }}</div>
    </div>
    <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: white; background: rgba(0,0,0,0.6); padding: 8px 16px; border-radius: 20px;">
      WASD移动 | 鼠标旋转 | 左键攻击 | 点击锁定鼠标
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { buildVillage } from './VillageScene.js'
import { usePlayerController } from './usePlayerController.js'
import { useMonsterSystem } from './useMonsterSystem.js'
import { useCharacter } from './useCharacter.js'
import { useCombat } from './useCombat.js'

const container = ref(null)
let scene, camera, renderer, animFrameId
let controller, monsterSystem, character
let attackCooldown = 0

// ✅ 提前初始化，确保模板渲染时已存在
const combat = useCombat()

onMounted(async () => {
  const el = container.value
  if (!el) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#87CEEB')
  scene.userData.obstacles = []

  camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100)
  camera.position.set(0, 2, 4)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(el.clientWidth, el.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  el.appendChild(renderer.domElement)

  // 光照
  scene.add(new THREE.AmbientLight(0xffffff, 1.2))
  const dir = new THREE.DirectionalLight(0xffe8d0, 1.2)
  dir.position.set(4, 6, 3)
  scene.add(dir)
  scene.add(new THREE.HemisphereLight('#87CEEB', '#4a7c59', 0.6))

  buildVillage(scene)

  controller = usePlayerController(camera, renderer, el)
  controller.attachEvents()
  controller.setObstacles(scene.userData.obstacles)

  monsterSystem = useMonsterSystem(scene)

  character = useCharacter()
  await character.loadModel('/models/shanxi.glb', scene)

  controller.setAttackCallback(() => {
    if (attackCooldown > 0 || !character.getModel()) return
    const playerPos = character.getModel().position
    const forward = controller.getPlayerForward()
    for (const m of monsterSystem.getMonsters()) {
      if (m.isDead) continue
      const dx = m.getPosition().x - playerPos.x
      const dz = m.getPosition().z - playerPos.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist > controller.getAttackRange()) continue
      const angle = forward.angleTo(new THREE.Vector3(dx, 0, dz).normalize())
      if (angle < controller.getAttackAngle() / 2) {
        const died = m.takeDamage(combat.playerAttack.value, playerPos)
        if (died) {
          combat.playerExp.value += 10
          combat.checkLevelUp()
        }
        attackCooldown = 0.6
        break
      }
    }
  })

  animate()
})

function animate() {
  animFrameId = requestAnimationFrame(animate)
  const delta = Math.min(character.getClock()?.getDelta() || 0.016, 0.1)

  if (character.getModel() && controller) {
    const moving = controller.applyMovement(character.getModel(), delta)

    if (moving) {
      character.switchAnimation('walk')
    } else {
      character.switchAnimation('idle')
    }

    controller.followTarget(character.getModel())

    const damage = monsterSystem.update(delta, character.getModel().position, scene.userData.obstacles)
    if (damage > 0 && combat.takeDamage(damage)) {
      alert('你被怪物打倒了！重新开始。')
      combat.reset()
      monsterSystem.getMonsters().forEach(m => scene.remove(m.mesh))
    }
  }

  character.update(delta)
  if (attackCooldown > 0) attackCooldown -= delta
  renderer.render(scene, camera)
}

const lockPointer = () => controller?.lockPointer()

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
  controller?.detachEvents()
  renderer.dispose()
})
</script>