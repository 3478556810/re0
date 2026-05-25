<template>
  <TresGroup ref="characterGroup" :position="position" :scale="[finalScale, finalScale, finalScale]">
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
  scale: { type: Number, default: 1.0 }
})

const { scene: tresScene } = useTres()
const model = shallowRef(null)
const mixer = ref(null)
const actions = {}
const finalScale = ref(1)

const emit = defineEmits(['ready'])

onMounted(() => {
  const loader = new GLTFLoader()
  loader.load('/models/shanxi_animated.glb', (gltf) => {
    const scene = gltf.scene
    model.value = scene

    // 自动缩放：如果模型尺寸异常小，放大到约2米高
    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    if (maxDim > 0 && maxDim < 0.1) {
      finalScale.value = 2 / maxDim
    }
    console.log('模型原始尺寸:', size, '最终缩放:', finalScale.value)

    const newMixer = new THREE.AnimationMixer(scene)
    mixer.value = newMixer

    // 注册动画（idle 和 walk）
    const clipCache = new Map()
    gltf.animations.forEach((clip, index) => {
      const name = index === 0 ? 'idle' : (index === 1 ? 'walk' : clip.name.toLowerCase())
      if (!clipCache.has(name)) {
        const action = newMixer.clipAction(clip)
        clipCache.set(name, action)
      }
      actions[name] = clipCache.get(name)
    })

    // 默认播放 idle
    if (actions.idle) {
      actions.idle.play()
    } else if (Object.values(actions).length > 0) {
      Object.values(actions)[0].play()
    }

    // 🔒 锁定垂直位置，防止动画位移
    const fixedY = props.position[1] || 0.5
    const originalUpdate = newMixer.update.bind(newMixer)
    newMixer.update = (delta) => {
      originalUpdate(delta)
      scene.position.y = fixedY
    }

    tresScene.value.add(scene)

    emit('ready', {
      model: scene,
      mixer: newMixer,
      actions
    })
    console.log('角色就绪，可用动画:', Object.keys(actions))
  }, undefined, (error) => {
    console.error('模型加载失败:', error)
  })
})

onUnmounted(() => {
  if (mixer.value) mixer.value.stopAllAction()
  if (model.value && tresScene.value) tresScene.value.remove(model.value)
})
</script>