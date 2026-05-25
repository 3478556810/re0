<template>
  <div style="width: 100vw; height: 100vh;">
    <TresCanvas>
      <TresPerspectiveCamera :position="[0, 2, 3]" />
      <TresAmbientLight :intensity="1" />
      <TresMesh>
        <TresSphereGeometry :args="[0.5, 16, 16]" />
        <TresMeshBasicMaterial color="red" />
      </TresMesh>
    </TresCanvas>
  </div>
</template>

<script setup>
import { TresCanvas } from '@tresjs/core'
</script>