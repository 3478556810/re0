<template>
  <TresGroup ref="characterGroup" :position="position" :scale="[scale, scale, scale]">
    <primitive v-if="model" :object="model" />
  </TresGroup>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import { useTres } from '@tresjs/core'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

const props = defineProps({
  position: { type: Array, default: () => [0, 0.5, 0] },
  scale: { type: Number, default: 1.5 }
})

const { scene: tresScene } = useTres()
const model = shallowRef(null)
const mixer = ref(null)
const actions = {}

const emit = defineEmits(['ready'])

onMounted(() => {
  const loader = new GLTFLoader()
  loader.load('/models/shanxi_unity.glb', (gltf) => {
    const scene = gltf.scene
    model.value = scene

    // 自动缩放
    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    if (maxDim > 0 && maxDim < 1) {
      const factor = 2 / maxDim
      scene.scale.set(factor, factor, factor)
    }

    // 动画混合器
    const newMixer = new THREE.AnimationMixer(scene)
    mixer.value = newMixer

    // 注册所有动画
    gltf.animations.forEach((clip) => {
      const name = clip.name.toLowerCase()
      actions[name] = newMixer.clipAction(clip)
    })

    console.log('可用动画:', Object.keys(actions))

    // 默认播放 idle
    if (actions['idle']) {
      actions['idle'].play()
    } else if (Object.values(actions).length > 0) {
      Object.values(actions)[0].play()
    }

    tresScene.value.add(scene)

    emit('ready', {
      model: scene,
      mixer: newMixer,
      actions
    })
  })
})

function playAnimation(name) {
  const action = actions[name.toLowerCase()]
  if (!action) return
  Object.values(actions).forEach(a => {
    if (a !== action && a.isRunning()) a.fadeOut(0.2)
  })
  action.reset().fadeIn(0.2).play()
}

defineExpose({ playAnimation, model, mixer, actions })

onUnmounted(() => {
  if (mixer.value) mixer.value.stopAllAction()
  if (model.value) tresScene.value?.remove(model.value)
})
</script>