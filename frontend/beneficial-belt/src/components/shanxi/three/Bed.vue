<template>
  <TresGroup :position="[-2, 0.25, 2.5]">
    <TresMesh cast-shadow>
      <TresBoxGeometry :args="[0.9, 0.25, 1.8]" />
      <TresMeshStandardMaterial color="#d4c5b9" :roughness="0.6" />
    </TresMesh>
    <TresMesh :position="[0, 0.15, 0.7]" cast-shadow>
      <TresBoxGeometry :args="[0.7, 0.06, 0.3]" />
      <TresMeshStandardMaterial color="#ffffff" :roughness="0.9" />
    </TresMesh>
  </TresGroup>
</template>