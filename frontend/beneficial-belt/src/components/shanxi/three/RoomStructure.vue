<template>
  <TresGroup>
    <!-- 地板 7.5x7.5 -->
    <TresMesh :position="[0, -0.01, 0]" :rotation="[-Math.PI / 2, 0, 0]" receive-shadow>
      <TresPlaneGeometry :args="[7.5, 7.5]" />
      <TresMeshStandardMaterial color="#e8d5c4" :roughness="0.85" />
    </TresMesh>
    <!-- 后墙 -->
    <TresMesh :position="[0, 3.75, -3.75]" receive-shadow>
      <TresPlaneGeometry :args="[7.5, 7.5]" />
      <TresMeshStandardMaterial color="#fdf5e6" :roughness="0.95" />
    </TresMesh>
    <!-- 左墙 -->
    <TresMesh :position="[-3.75, 3.75, 0]" :rotation="[0, Math.PI / 2, 0]" receive-shadow>
      <TresPlaneGeometry :args="[7.5, 7.5]" />
      <TresMeshStandardMaterial color="#fdf5e6" :roughness="0.95" />
    </TresMesh>
    <!-- 天花板 -->
    <TresMesh :position="[0, 7.5, 0]" :rotation="[Math.PI / 2, 0, 0]">
      <TresPlaneGeometry :args="[7.5, 7.5]" />
      <TresMeshStandardMaterial color="#ffffff" :roughness="0.8" />
    </TresMesh>
  </TresGroup>
</template>