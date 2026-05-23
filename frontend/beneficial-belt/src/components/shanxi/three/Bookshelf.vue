<template>
  <TresGroup :position="[3, 1, -2]">
    <TresMesh cast-shadow>
      <TresBoxGeometry :args="[1, 2.5, 0.3]" />
      <TresMeshStandardMaterial color="#a0765a" :roughness="0.7" />
    </TresMesh>
    <TresMesh v-for="y in [0.6, 1.6]" :key="y" :position="[0, y - 1.25, 0]" cast-shadow>
      <TresBoxGeometry :args="[0.8, 0.05, 0.25]" />
      <TresMeshStandardMaterial color="#8b5a2b" :roughness="0.6" />
    </TresMesh>
  </TresGroup>
</template>