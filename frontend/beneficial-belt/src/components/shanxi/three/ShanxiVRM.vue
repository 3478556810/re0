<template>
  <TresGroup>
    <TresGroup ref="vrmGroup">
      <!-- 模型由代码添加 -->
    </TresGroup>
    <ShanxiController
      v-if="modelRef && vrmInstance"
      :target="modelRef"
      :vrm="vrmInstance"
    />
  </TresGroup>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import { useTres } from '@tresjs/core'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import ShanxiController from './ShanxiController.vue'

const props = defineProps({
  position: { type: Array, default: () => [0, 1.0, 0] },
  rotation: { type: Array, default: () => [0, 0, 0] },
  scale: { type: Number, default: 1.5 }
})

const { scene: tresScene } = useTres()
const vrmGroup = ref(null)
const modelRef = ref(null)
const vrmInstance = ref(null)

defineExpose({ modelRef, vrmInstance })

onMounted(() => {
  if (!tresScene.value) return

  const loader = new GLTFLoader()
  loader.register(parser => new VRMLoaderPlugin(parser))

  loader.load('/models/shanxi.vrm', (gltf) => {
    const vrm = gltf.userData.vrm
    if (!vrm) return console.error('VRM 数据为空')

    vrmInstance.value = vrm
    const model = vrm.scene

    if (vrm.humanoid) {
      vrm.humanoid.resetNormalizedPose()
    }
// 在 vrm.humanoid.resetNormalizedPose() 之后

// 强制重置手臂骨骼（解决横着的问题）
// 在 vrm.humanoid.resetNormalizedPose() 之后
const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm')
const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm')

// 设置手臂下垂姿态（绕 X 轴旋转 -90° 使手臂贴合身体）
if (leftUpperArm) leftUpperArm.rotation.set(-Math.PI / 2, 0, 0)
if (rightUpperArm) rightUpperArm.rotation.set(-Math.PI / 2, 0, 0)
    // 在 vrmInstance.value = vrm 之后

// 头发飞起修复：强制缩小碰撞体半径，并增大重力感
// 弹簧骨骼修复：清空碰撞体，增大重力
if (vrm.springBoneManager) {
  vrm.springBoneManager.springBones?.forEach((springBone) => {
    // 清空所有碰撞体组（头发不会被顶起）
    springBone.colliderGroups = []
    // 增大重力加速度
    if (springBone.gravity != null) {
      springBone.gravity = { x: 0, y: -9.8 * 5, z: 0 } // 强重力往下
    }
    // 减小刚度，让头发更柔顺
    if (springBone.stiffness != null) {
      springBone.stiffness = 0.1
    }
  })
  console.log('弹簧骨骼碰撞体已清除，重力增强')
}

    model.position.set(props.position[0], props.position[1], props.position[2])
    model.rotation.y = Math.PI
    model.scale.set(props.scale, props.scale, props.scale)

    tresScene.value.add(model)
    modelRef.value = model

    console.log('杉汐就绪，scale:', props.scale)
  }, (p) => console.log(`加载 ${Math.round((p.loaded / p.total) * 100)}%`), (e) => console.error('加载失败', e))
})

onUnmounted(() => {
  if (vrmInstance.value?.scene && tresScene.value) {
    tresScene.value.remove(vrmInstance.value.scene)
  }
})
</script>