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

    // ✅ 弹簧骨骼修复：根据官方文档缩小碰撞体半径 50%，解决头发飞起问题[reference:3]
    if (vrm.springBoneManager?.springBones) {
      vrm.springBoneManager.springBones.forEach((springBone) => {
        // 缩小碰撞体半径
        springBone.colliderGroups?.forEach((group) => {
          group.colliders?.forEach((collider) => {
            if (collider.shape && typeof collider.shape.radius === 'number') {
              collider.shape.radius *= 0.5 // 缩小 50%
            }
          })
        })
        // 设置重力方向朝下
        if (springBone.settings?.gravityDir) {
          springBone.settings.gravityDir.set(0, -1, 0)
          springBone.settings.gravityPower = 2.0 // 增强重力
        }
      })
      console.log('弹簧骨骼已修复：碰撞体缩小50%，重力向下')
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