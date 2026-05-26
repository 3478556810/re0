// src/components/shanxi/three/useShanxiCharacter.js
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

export function useShanxiCharacter(scene) {
  let vrmModel = null
  let mixer = null
  let clock = null
  let walkTime = 0

  async function loadModel(path = '/models/shanxi.vrm') {
    const loader = new GLTFLoader()
    loader.register(parser => new VRMLoaderPlugin(parser))

    return new Promise((resolve, reject) => {
      loader.load(path, (gltf) => {
        const vrm = gltf.userData.vrm
        if (!vrm) return reject(new Error('VRM数据为空'))

        vrmModel = vrm.scene
        vrmModel.position.set(0, 0.5, 0)
        scene.add(vrmModel)

        mixer = new THREE.AnimationMixer(vrmModel)
        clock = new THREE.Clock()
        window.__vrm = vrm

        if (vrm.humanoid) {
          vrm.humanoid.autoUpdateHumanBones = true
        }
        resolve({ model: vrmModel, mixer, clock, vrm })
      }, undefined, reject)
    })
  }

  // 程序化行走动画
  function updateWalkAnimation(moving, delta) {
    if (!window.__vrm?.humanoid) return

    if (moving) walkTime += delta * 12
    const swing = moving ? Math.sin(walkTime) * 0.8 : 0
    const h = window.__vrm.humanoid

    const la = h.getNormalizedBoneNode('leftUpperArm')
    const ra = h.getNormalizedBoneNode('rightUpperArm')
    const ll = h.getNormalizedBoneNode('leftUpperLeg')
    const rl = h.getNormalizedBoneNode('rightUpperLeg')

    if (la && ra) {
      la.rotation.set(swing, 0, Math.PI / 2)
      ra.rotation.set(-swing, 0, -Math.PI / 2)
    }
    if (ll && rl) {
      ll.rotation.x = swing
      rl.rotation.x = -swing
    }
  }

  function updateVrm(delta) {
    if (window.__vrm) window.__vrm.update(delta)
  }

  function getModel() { return vrmModel }
  function getMixer() { return mixer }
  function getClock() { return clock }

  return { loadModel, updateWalkAnimation, updateVrm, getModel, getMixer, getClock }
}