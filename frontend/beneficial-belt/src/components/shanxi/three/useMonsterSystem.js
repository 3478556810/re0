// src/components/shanxi/three/useMonsterSystem.js
import * as THREE from 'three'

export class Monster {
  constructor(pos, scene) {
    this.scene = scene
    this.mesh = new THREE.Group()
    // 身体
    const bodyGeo = new THREE.SphereGeometry(0.5, 8, 8)
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#ff4444', roughness: 0.6 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.6
    body.castShadow = true
    this.mesh.add(body)
    // 眼睛
    const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8)
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffffff' })
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(-0.2, 0.7, 0.4)
    this.mesh.add(leftEye)
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(0.2, 0.7, 0.4)
    this.mesh.add(rightEye)
    const pupilGeo = new THREE.SphereGeometry(0.07, 8, 8)
    const pupilMat = new THREE.MeshBasicMaterial({ color: '#000000' })
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat)
    leftPupil.position.set(-0.2, 0.7, 0.5)
    this.mesh.add(leftPupil)
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat)
    rightPupil.position.set(0.2, 0.7, 0.5)
    this.mesh.add(rightPupil)

    this.mesh.position.copy(pos)
    scene.add(this.mesh)

    this.hp = 30
    this.maxHp = 30
    this.speed = 1.8
    this.attackDamage = 10
    this.attackCooldown = 1.5
    this.lastAttackTime = 0
    this.radius = 0.6
    this.isDead = false
  }

  // 击退效果
  knockback(fromPos, power = 3) {
    const dx = this.mesh.position.x - fromPos.x
    const dz = this.mesh.position.z - fromPos.z
    const dist = Math.sqrt(dx * dx + dz * dz) || 1
    const dirX = dx / dist
    const dirZ = dz / dist

    // 移动目标位置，检测障碍物
    const targetX = this.mesh.position.x + dirX * power
    const targetZ = this.mesh.position.z + dirZ * power
    const obstacles = this.scene.userData.obstacles || []
    let blocked = false
    for (const obs of obstacles) {
      const ox = targetX - obs.x
      const oz = targetZ - obs.z
      if (Math.sqrt(ox * ox + oz * oz) < this.radius + obs.radius) {
        blocked = true
        break
      }
    }
    if (!blocked) {
      this.mesh.position.x = targetX
      this.mesh.position.z = targetZ
    }
  }

  update(delta, playerPos, obstacles) {
    if (!playerPos || this.hp <= 0) return false

    const dx = playerPos.x - this.mesh.position.x
    const dz = playerPos.z - this.mesh.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    // 向玩家移动
    if (dist > 0.5) {
      const dirX = dx / dist
      const dirZ = dz / dist
      const newX = this.mesh.position.x + dirX * this.speed * delta
      const newZ = this.mesh.position.z + dirZ * this.speed * delta
      let blocked = false
      if (obstacles) {
        for (const obs of obstacles) {
          const ox = newX - obs.x
          const oz = newZ - obs.z
          if (Math.sqrt(ox * ox + oz * oz) < this.radius + obs.radius) {
            blocked = true
            break
          }
        }
      }
      if (!blocked) {
        this.mesh.position.x = newX
        this.mesh.position.z = newZ
      }
      this.mesh.lookAt(new THREE.Vector3(playerPos.x, this.mesh.position.y, playerPos.z))
    }

    // 攻击玩家
    if (dist < 1.2) {
      const now = performance.now() / 1000
      if (now - this.lastAttackTime > this.attackCooldown) {
        this.lastAttackTime = now
        return true
      }
    }
    return false
  }

  takeDamage(amount, attackerPos) {
    this.hp -= amount
    // 击退
    if (attackerPos) {
      this.knockback(attackerPos, 2.5)
    }
    // 受伤闪烁（简单处理：改变颜色）
    const body = this.mesh.children[0]
    if (body) {
      body.material.color.set('#ff8888')
      setTimeout(() => {
        if (body && body.material) body.material.color.set('#ff4444')
      }, 150)
    }

    if (this.hp <= 0) {
      this.scene.remove(this.mesh)
      this.isDead = true
      return true
    }
    return false
  }

  getPosition() {
    return this.mesh.position
  }
}

export function useMonsterSystem(scene) {
  const monsters = []
  let spawnTimer = 0
  const spawnInterval = 4.0

  function spawnMonster(playerPos) {
    let x, z, valid
    for (let tries = 0; tries < 20; tries++) {
      x = (Math.random() - 0.5) * 20
      z = (Math.random() - 0.5) * 20
      valid = true
      if (playerPos && Math.hypot(x - playerPos.x, z - playerPos.z) < 8) valid = false
      const obstacles = scene.userData.obstacles || []
      for (const obs of obstacles) {
        if (Math.hypot(x - obs.x, z - obs.z) < obs.radius + 0.8) {
          valid = false
          break
        }
      }
      if (valid) break
    }
    if (!valid) return
    const monster = new Monster(new THREE.Vector3(x, 0.5, z), scene)
    monsters.push(monster)
  }

  function update(delta, playerPos, obstacles) {
    spawnTimer += delta
    if (spawnTimer >= spawnInterval && playerPos) {
      spawnTimer = 0
      spawnMonster(playerPos)
    }

    let totalAttackDamage = 0
    for (let i = monsters.length - 1; i >= 0; i--) {
      const m = monsters[i]
      if (m.isDead) {
        monsters.splice(i, 1)
        continue
      }
      const attacked = m.update(delta, playerPos, obstacles)
      if (attacked) totalAttackDamage += m.attackDamage
    }
    return totalAttackDamage
  }

  function getMonsters() { return monsters }

  return { update, getMonsters, spawnMonster }
}