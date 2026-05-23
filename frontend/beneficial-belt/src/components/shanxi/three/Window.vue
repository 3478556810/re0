<template>
  <TresGroup :position="[0, 3.2, -3.7]">
    <TresMesh cast-shadow>
      <TresBoxGeometry :args="[1.6, 1.6, 0.1]" />
      <TresMeshStandardMaterial color="#c0b8a8" :roughness="0.5" />
    </TresMesh>
    <TresMesh :position="[0, 0, 0.06]">
      <TresPlaneGeometry :args="[1.4, 1.4]" />
      <TresMeshStandardMaterial color="#87ceeb" :opacity="0.3" :roughness="0.1" transparent />
    </TresMesh>
  </TresGroup>
</template>