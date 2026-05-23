<!-- src/components/shanxi/three/ShanxiVRM.vue -->
<template>
  <TresGroup>
    <TresGroup ref="vrmGroup" />
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
  position: { type: Array, default: () => [0, 0, 0] },
  scale: { type: Number, default: 1 }
})

const { scene: tresScene } = useTres()
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

    // [参考] 物理修复：缩小碰撞体半径 50%，这是社区验证过的黄金比例
  // 物理修正：缩小碰撞体半径 + 调整重力
if (vrm.springBoneManager) {
  const joints = vrm.springBoneManager.joints;
  if (joints) {
    joints.forEach(joint => {
      // 1. 缩小碰撞体半径到 20%
      joint.colliderGroups?.forEach(group => {
        group.colliders?.forEach(c => {
          if (c.shape?.radius) c.shape.radius *= 0.2;
        });
      });
      // 2. 设置物理参数
      if (joint.settings) {
        joint.settings.gravityPower = 0.1;
        joint.settings.gravityDir?.set(0, -1, 0);
        joint.settings.stiffness = 0.001;
        joint.settings.dragForce = 0.001;
      }
    });
  }
  console.log('物理已修正：碰撞体缩小80%，重力增强');
}
    model.position.set(props.position[0], props.position[1], props.position[2])
    model.rotation.y = 0
    model.scale.set(props.scale, props.scale, props.scale)

    tresScene.value.add(shallowRef(model).value)
    modelRef.value = model
    window.__vrm = vrm
  })
})

onUnmounted(() => {
  if (vrmInstance.value?.scene && tresScene.value) {
    tresScene.value.remove(vrmInstance.value.scene)
  }
})
</script>