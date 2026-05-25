<template>
  <TresGroup>
    <!-- 后墙踢脚线 -->
    <TresMesh :position="[0, 0.03, -2.49]" receive-shadow>
      <TresBoxGeometry :args="[5.0, 0.06, 0.02]" />
      <TresMeshStandardMaterial color="#c4b8a8" :roughness="0.5" :metalness="0.1" />
    </TresMesh>
    <!-- 左墙踢脚线 -->
    <TresMesh :position="[-2.49, 0.03, 0]" :rotation="[0, Math.PI / 2, 0]" receive-shadow>
      <TresBoxGeometry :args="[5.0, 0.06, 0.02]" />
      <TresMeshStandardMaterial color="#c4b8a8" :roughness="0.5" :metalness="0.1" />
    </TresMesh>
    <!-- 右墙踢脚线（如果有右墙） -->
    <TresMesh :position="[2.49, 0.03, 0]" :rotation="[0, Math.PI / 2, 0]" receive-shadow>
      <TresBoxGeometry :args="[5.0, 0.06, 0.02]" />
      <TresMeshStandardMaterial color="#c4b8a8" :roughness="0.5" :metalness="0.1" />
    </TresMesh>
  </TresGroup>
</template>