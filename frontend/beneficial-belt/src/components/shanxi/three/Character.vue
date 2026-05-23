<template>
  <TresGroup :position="position" @click="handleClick">
    <!-- 身体 -->
    <TresMesh cast-shadow>
      <TresCapsuleGeometry :args="[0.25, 0.6, 4, 8]" />
      <TresMeshToonMaterial color="#ffccaa" />
    </TresMesh>
    <!-- 头部 -->
    <TresMesh :position="[0, 0.55, 0]" cast-shadow>
      <TresSphereGeometry :args="[0.22, 16, 16]" />
      <TresMeshToonMaterial color="#ffccaa" />
    </TresMesh>
    <!-- 眼睛（两个小球） -->
    <TresMesh :position="[0.08, 0.58, 0.18]" cast-shadow>
      <TresSphereGeometry :args="[0.04, 8, 8]" />
      <TresMeshBasicMaterial color="#333333" />
    </TresMesh>
    <TresMesh :position="[-0.08, 0.58, 0.18]" cast-shadow>
      <TresSphereGeometry :args="[0.04, 8, 8]" />
      <TresMeshBasicMaterial color="#333333" />
    </TresMesh>
  </TresGroup>
</template>

<script setup>
defineProps({
  position: { type: Array, default: () => [0, 0, 0] },
  action: { type: String, default: 'sit' }
})
const emit = defineEmits(['click'])
function handleClick(evt) {
  evt.stopPropagation()
  emit('click', evt)
}
</script>