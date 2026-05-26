// src/components/shanxi/three/VillageScene.js
import * as THREE from 'three'

export function buildVillage(scene) {
  if (!scene) return
  const obstacles = [] // 碰撞数据

  // 草地
  const grassGeo = new THREE.PlaneGeometry(30, 30)
  const grassMat = new THREE.MeshStandardMaterial({ color: '#4a7c59', roughness: 0.9 })
  const grass = new THREE.Mesh(grassGeo, grassMat)
  grass.rotation.x = -Math.PI / 2
  grass.position.y = -0.01
  grass.receiveShadow = true
  scene.add(grass)

  // 小木屋
  const houseGroup = new THREE.Group()
  const wallGeo = new THREE.BoxGeometry(3, 2.5, 3)
  const wallMat = new THREE.MeshStandardMaterial({ color: '#a0724a', roughness: 0.7 })
  const walls = new THREE.Mesh(wallGeo, wallMat)
  walls.position.y = 1.25
  walls.castShadow = true; walls.receiveShadow = true
  houseGroup.add(walls)

  const roofGeo = new THREE.ConeGeometry(2.5, 1.2, 4)
  const roofMat = new THREE.MeshStandardMaterial({ color: '#8b3a3a', roughness: 0.6 })
  const roof = new THREE.Mesh(roofGeo, roofMat)
  roof.position.y = 3.1; roof.rotation.y = Math.PI / 4
  roof.castShadow = true
  houseGroup.add(roof)

  const doorGeo = new THREE.BoxGeometry(0.8, 1.5, 0.1)
  const doorMat = new THREE.MeshStandardMaterial({ color: '#5c3a1e' })
  const door = new THREE.Mesh(doorGeo, doorMat)
  door.position.set(0, 0.75, 1.55)
  houseGroup.add(door)
  houseGroup.position.set(5, 0, 5)
  scene.add(houseGroup)
  obstacles.push({ x: 5, z: 5, radius: 2.0 }) // 房子碰撞半径

  // 树
  function createTree() {
    const tree = new THREE.Group()
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 8)
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c3a1e' })
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.y = 1; trunk.castShadow = true
    tree.add(trunk)
    const leafGeo = new THREE.ConeGeometry(0.8, 1.5, 8)
    const leafMat = new THREE.MeshStandardMaterial({ color: '#3a5c3a' })
    const leaf = new THREE.Mesh(leafGeo, leafMat)
    leaf.position.y = 2.5; leaf.castShadow = true
    tree.add(leaf)
    return tree
  }

  const treePositions = [[-6, 0, -4], [7, 0, -5], [-7, 0, 6], [-4, 0, -8], [8, 0, 2]]
  treePositions.forEach(([x, , z]) => {
    const tree = createTree()
    tree.position.set(x, 0, z)
    scene.add(tree)
    obstacles.push({ x, z, radius: 0.6 }) // 树干碰撞
  })

  // 石头
  const rockPositions = [[3, 0, -4], [-5, 0, -3], [0, 0, -7], [6, 0, 7]]
  rockPositions.forEach(([x, , z]) => {
    const rockGeo = new THREE.IcosahedronGeometry(0.4 + Math.random() * 0.3, 1)
    const rockMat = new THREE.MeshStandardMaterial({ color: '#808080', roughness: 0.8 })
    const rock = new THREE.Mesh(rockGeo, rockMat)
    rock.position.set(x, 0.2, z)
    rock.castShadow = true; rock.receiveShadow = true
    scene.add(rock)
    obstacles.push({ x, z, radius: 0.5 })
  })

  // 栅栏
  for (let i = -6; i <= 6; i++) {
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 6)
    const postMat = new THREE.MeshStandardMaterial({ color: '#8b7355' })
    const post = new THREE.Mesh(postGeo, postMat)
    post.position.set(i, 0.5, -9)
    post.castShadow = true
    scene.add(post)
    obstacles.push({ x: i, z: -9, radius: 0.3 })
  }
  const railGeo = new THREE.BoxGeometry(12.4, 0.1, 0.1)
  const railMat = new THREE.MeshStandardMaterial({ color: '#8b7355' })
  const rail = new THREE.Mesh(railGeo, railMat)
  rail.position.set(0, 0.9, -9)
  rail.castShadow = true
  scene.add(rail)
  // 横梁不单独加碰撞，栅栏柱子已足够

  scene.userData.obstacles = obstacles
}