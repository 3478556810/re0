<template>
  <TresGroup :position="[2, 0, 1.5]">
    <TresMesh cast-shadow>
      <TresBoxGeometry :args="[1.6, 0.06, 0.8]" />
      <TresMeshStandardMaterial color="#e8c396" :roughness="0.4" />
    </TresMesh>
    <TresMesh v-for="p in legPos" :key="p.join()" :position="p" cast-shadow>
      <TresCylinderGeometry :args="[0.05, 0.05, 0.7, 8]" />
      <TresMeshStandardMaterial color="#8b5a2b" :roughness="0.7" />
    </TresMesh>
  </TresGroup>
</template>
<script setup>
const legPos = [
  [0.6, -0.35, 0.25],
  [1.4, -0.35, 0.25],
  [0.6, -0.35, 0.55],
  [1.4, -0.35, 0.55]
]
</script>