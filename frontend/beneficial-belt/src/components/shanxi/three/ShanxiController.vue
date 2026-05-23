<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useTres } from '@tresjs/core'
import * as THREE from 'three'
const props = defineProps({
  target: { type: Object, required: true },
  vrm: { type: Object, default: null }
})
const { camera } = useTres()
const MOVE_SPEED = 5.5
const keys = { w: false, a: false, s: false, d: false }
let animFrameId = null
let walkTime = 0

let leftUpperArm, rightUpperArm, leftLowerArm, rightLowerArm
let leftUpperLeg, rightUpperLeg, leftLowerLeg, rightLowerLeg



// 碰撞检测

const wallBound = 3.6;



// 骨骼缓存
function cacheBones() {
  const humanoid = props.vrm?.humanoid;
  if (!humanoid) return;
  leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
  rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
  leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm');
  rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm');

  leftUpperLeg = humanoid.getNormalizedBoneNode('leftUpperLeg');
  rightUpperLeg = humanoid.getNormalizedBoneNode('rightUpperLeg');
  leftLowerLeg = humanoid.getNormalizedBoneNode('leftLowerLeg');
  rightLowerLeg = humanoid.getNormalizedBoneNode('rightLowerLeg');

  humanoid.autoUpdateHumanBones = true;
  console.log('骨骼就绪：Z轴下垂，X轴摆动');
}
watch(() => props.vrm, (val) => { if (val) cacheBones() }, { immediate: true });

// 行走动画
function animateWalk(delta, moving) {
  if (!leftUpperArm || !rightUpperArm || !leftUpperLeg || !rightUpperLeg) return;

  const speed = moving ? 12 : 0;
  walkTime += delta * speed;
  const legSwing = moving ? Math.sin(walkTime) * 0.8 : 0;
  const armSwing = moving ? Math.sin(walkTime + Math.PI) * 0.6 : 0;

  // 实习工的手臂代码：Z轴下垂，X轴摆动
  leftUpperArm.rotation.set(armSwing, 0, Math.PI / 2);
  rightUpperArm.rotation.set(-armSwing, 0, -Math.PI / 2);

  if (leftLowerArm) leftLowerArm.rotation.x = Math.abs(armSwing) * 0.4;
  if (rightLowerArm) rightLowerArm.rotation.x = Math.abs(armSwing) * 0.4;

  leftUpperLeg.rotation.x = legSwing;
  rightUpperLeg.rotation.x = -legSwing;
  if (leftLowerLeg) leftLowerLeg.rotation.x = Math.abs(legSwing) * 0.4;
  if (rightLowerLeg) rightLowerLeg.rotation.x = Math.abs(legSwing) * 0.4;

  if (!moving) {
    leftUpperArm.rotation.set(0, 0, Math.PI / 2);
    rightUpperArm.rotation.set(0, 0, -Math.PI / 2);
    if (leftLowerArm) leftLowerArm.rotation.set(0, 0, 0);
    if (rightLowerArm) rightLowerArm.rotation.set(0, 0, 0);
    leftUpperLeg.rotation.x = 0;
    rightUpperLeg.rotation.x = 0;
    if (leftLowerLeg) leftLowerLeg.rotation.x = 0;
    if (rightLowerLeg) rightLowerLeg.rotation.x = 0;
    walkTime = 0;
  }
}

// 主循环（实习工的核心逻辑）
function update() {
  if (!props.target || !camera.value) {
    animFrameId = requestAnimationFrame(update)
    return
  }

  const delta = 0.016
  const cam = camera.value

  // 1. 获取摄像机前方（看向的方向）
  const forward = new THREE.Vector3()
  cam.getWorldDirection(forward)
  forward.y = 0
  forward.normalize()

  // 2. 计算摄像机右向量（世界Y轴叉乘前方，顺序不能错）
  const worldUp = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize()

  // 3. 移动方向：forward 为前进，right 为右平移
  const moveForward = forward.clone()
  const moveRight = right.clone()

  // 4. 输入映射：W前进，S后退，A左平移，D右平移
  let dz = 0, dx = 0
  if (keys.w) dz += 1   // 前进（屏幕深处）
  if (keys.s) dz -= 1   // 后退
  if (keys.a) dx -= 1   // 左平移
  if (keys.d) dx += 1   // 右平移
  const moving = dx !== 0 || dz !== 0

  if (moving) {
    const moveDir = new THREE.Vector3()
      .addScaledVector(moveForward, dz)
      .addScaledVector(moveRight, dx)
    moveDir.normalize()

    // 移动（暂时关闭碰撞检测）
    props.target.position.x += moveDir.x * MOVE_SPEED * delta
    props.target.position.z += moveDir.z * MOVE_SPEED * delta

    // 5. 角色面朝移动方向
    props.target.rotation.y = Math.atan2(moveDir.x, moveDir.z)+ Math.PI
  }

  animateWalk(delta, moving)
  if (props.vrm) props.vrm.update(delta)
  animFrameId = requestAnimationFrame(update)
}
function onKeyDown(e) {
  if (e.key in keys) { keys[e.key] = true; e.preventDefault(); }
}
function onKeyUp(e) {
  if (e.key in keys) { keys[e.key] = false; e.preventDefault(); }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  update();
});
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  cancelAnimationFrame(animFrameId);
});
</script>