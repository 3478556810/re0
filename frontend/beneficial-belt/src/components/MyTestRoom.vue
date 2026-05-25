<template>
  <div ref="container" style="width: 100vw; height: 100vh;"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const container = ref(null)
let renderer, scene, camera, animationId

onMounted(() => {
  // 初始化场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#333333')

  // 相机
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(3, 2, 5)
  camera.lookAt(0, 1, 0)

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.value.appendChild(renderer.domElement)

  // 灯光
  const ambient = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambient)

  // 红色球体（确保场景有东西）
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshBasicMaterial({ color: 'red' })
  )
  sphere.position.set(0, 1, 0)
  scene.add(sphere)
// 增加环境光强度
const ambientLight = new THREE.AmbientLight(0xffffff, 2) // 强度翻倍
scene.add(ambientLight)

// 添加方向光（模拟窗户光）
const dirLight = new THREE.DirectionalLight(0xfff5e6, 3) // 暖色方向光
dirLight.position.set(5, 8, 3)
scene.add(dirLight)

// 添加半球光（天空和地面反射）
const hemiLight = new THREE.HemisphereLight(0xd0d8ff, 0x8d6e63, 1.5)
scene.add(hemiLight)
  // 加载 GLB 文件
  const loader = new GLTFLoader()
// 加载房间
loader.load('/models/room.glb', 
  (gltf) => {
    const model = gltf.scene
    console.log('房间加载成功')
    console.log('模型类型:', model.type) // 应为 "Group"
    console.log('子物体数量:', model.children.length)
    console.log('位置:', model.position)
    console.log('缩放:', model.scale)
    console.log('包围盒:', new THREE.Box3().setFromObject(model))
     
  scene.add(model)
  
  // 计算包围盒，查看模型大小和位置
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  console.log('房间包围盒大小:', size)
  console.log('房间中心位置:', center)
    // 检查是否有可见几何体
    model.traverse((child) => {
      if (child.isMesh) {
        console.log('找到网格:', child.name, '材质:', child.material.type)
      }
    })
    // 强制放大 10 倍（如果模型太小）
model.scale.set(10, 10, 10)

// 临时将所有材质换成白色基本材质，确保可见
model.traverse((child) => {
  if (child.isMesh) {
    child.material = new THREE.MeshBasicMaterial({ color: 0xffffff })
  }
})
    scene.add(model)
  },
  undefined,
  (err) => console.error('房间加载失败:', err)
)

// 加载角色（同样加上调试）
loader.load('/models/shanxi_character.glb', 
  (gltf) => {
    const model = gltf.scene
    console.log('角色加载成功')
    console.log('子物体数量:', model.children.length)
    
    // 如果有动画，打印动画列表
    if (gltf.animations?.length) {
      console.log('动画列表:', gltf.animations.map(c => c.name))
    }
    
    scene.add(model)
  },
  undefined,
  (err) => console.error('角色加载失败:', err)
)

  // 动画循环
  function animate() {
    animationId = requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }
  animate()

  // 窗口大小调整
  window.addEventListener('resize', onResize)
})

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  renderer.dispose()
})
</script>