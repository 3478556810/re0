// src/components/shanxi/three/useCharacter.js
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export function useCharacter() {
  let model = null, mixer = null, clock = null
  const actions = {}
  let currentAnim = ''

  async function loadModel(url, scene) {
    const loader = new GLTFLoader()
    return new Promise((resolve, reject) => {
      loader.load(url, (gltf) => {
        model = gltf.scene
        model.position.set(0, 0.5, 0)

        // 修复掉色：强制双面渲染、提高材质亮度
        model.traverse(node => {
          if (node.isMesh) {
            const mats = Array.isArray(node.material) ? node.material : [node.material]
            mats.forEach(mat => {
              mat.side = THREE.DoubleSide
              mat.needsUpdate = true
            })
          }
        })

        // 自动缩放
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 0 && maxDim < 1.5) model.scale.setScalar(1.5 / maxDim)

        scene.add(model)

        mixer = new THREE.AnimationMixer(model)
        clock = new THREE.Clock()

        gltf.animations.forEach(clip => {
          actions[clip.name.toLowerCase()] = mixer.clipAction(clip)
        })
        console.log('可用动画:', Object.keys(actions))

        // 默认 idle
        if (actions['idle']) {
          actions['idle'].play()
          currentAnim = 'idle'
        } else if (Object.values(actions).length > 0) {
          const first = Object.values(actions)[0]
          first.play()
          currentAnim = Object.keys(actions)[0]
        }
        resolve()
      }, undefined, reject)
    })
  }

  function switchAnimation(name) {
    const action = actions[name.toLowerCase()]
    if (!action || currentAnim === name) return
    Object.values(actions).forEach(a => a.stop())
    action.reset().play()
    currentAnim = name
  }

  function update(delta) { mixer?.update(delta) }
  function getModel() { return model }
  function getMixer() { return mixer }
  function getClock() { return clock }

  return { loadModel, switchAnimation, update, getModel, getMixer, getClock }
}