<template>
  <TresCanvas window-size>
    <TresPerspectiveCamera :position="[0, 2, 5]" :lookAt="[0, 1, 0]" />

    <!-- 环境光 + 方向光 -->
    <TresAmbientLight :intensity="1" />
    <TresDirectionalLight :position="[3, 5, 2]" :intensity="1.5" />

    <!-- 白色方块占位（确认场景渲染正常） -->
    <TresMesh :position="[0, 0.5, 0]">
      <TresBoxGeometry :args="[0.5, 0.5, 0.5]" />
      <TresMeshStandardMaterial color="white" />
    </TresMesh>

    <!-- 杉汐模型 -->
    <primitive v-if="model" :object="model" />
  </TresCanvas>
</template>

<script setup>
import { shallowRef, onMounted } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

const model = shallowRef(null)

onMounted(() => {
  const loader = new GLTFLoader()
  loader.load('/models/shanxi_animated.glb', (gltf) => {
    const scene = gltf.scene  // 先定义 scene

    // 检查网格数量
    let meshCount = 0
    scene.traverse((node) => {
      if (node.isMesh) {
        meshCount++
        console.log('网格:', node.name, '顶点:', node.geometry?.attributes?.position?.count)
      }
    })
    console.log('网格总数:', meshCount)
    if (meshCount === 0) {
      console.warn('⚠️ 模型中没有任何网格！请回到 Blender 重新导出，确保包含身体网格。')
      // 我们仍然显示场景，但可能为空
    }

    // 包围盒计算与缩放
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    console.log('包围盒中心:', center, '尺寸:', size, '最大维度:', maxDim)

    // 重置变换并缩放
    scene.position.set(0, 0, 0)
    scene.rotation.set(0, 0, 0)
    scene.scale.set(1, 1, 1)

    if (maxDim > 0 && maxDim < 1) {
      const factor = 2 / maxDim
      scene.scale.set(factor, factor, factor)
      console.log('缩放因子:', factor)
    }

    model.value = scene

    // 播放动画
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene)
      const clip = gltf.animations[0]
      mixer.clipAction(clip).play()
      console.log('动画播放:', clip.name)
    }
  }, undefined, (error) => {
    console.error('模型加载失败:', error)
  })
})
</script>