<script setup>
import { onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  target: { type: Object, required: true },
  vrm: { type: Object, default: null }
})

const MOVE_SPEED = 5.5
const keys = { w: false, a: false, s: false, d: false }
let animFrameId = null
let walkTime = 0

let leftUpperArm, rightUpperArm, leftLowerArm, rightLowerArm
let leftUpperLeg, rightUpperLeg, leftLowerLeg, rightLowerLeg

// 碰撞检测
const obstacles = [
  { type: 'box', center: [2, 0, 1.5], half: [0.8, 0.5, 0.4] },
  { type: 'box', center: [-2, 0, 2.5], half: [0.45, 0.3, 0.9] },
  { type: 'box', center: [3, 1, -2], half: [0.5, 1.25, 0.15] },
];
const wallBound = 3.6;

function checkCollision(x, z, radius = 0.4) {
  if (Math.abs(x) > wallBound - radius || Math.abs(z) > wallBound - radius) return true;
  for (const obs of obstacles) {
    const dx = Math.abs(x - obs.center[0]);
    const dz = Math.abs(z - obs.center[2]);
    if (dx < obs.half[0] + radius && dz < obs.half[2] + radius) return true;
  }
  return false;
}

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

// 主循环
function update() {
  if (!props.target) { animFrameId = requestAnimationFrame(update); return; }

  const delta = 0.016;
  let dx = 0, dz = 0;

  if (keys.w) dz -= 1;
  if (keys.s) dz += 1;
  if (keys.a) dx -= 1;
  if (keys.d) dx += 1;
  const moving = dx !== 0 || dz !== 0;

  if (moving) {
    const len = Math.sqrt(dx * dx + dz * dz);
    dx /= len;
    dz /= len;
    const newX = props.target.position.x + dx * MOVE_SPEED * delta;
    const newZ = props.target.position.z + dz * MOVE_SPEED * delta;
    if (!checkCollision(newX, newZ)) {
      props.target.position.x = newX;
      props.target.position.z = newZ;
    }
    props.target.rotation.y = Math.atan2(dx, dz) + Math.PI;
  }

  animateWalk(delta, moving);
  if (props.vrm) props.vrm.update(delta);
  animFrameId = requestAnimationFrame(update);
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