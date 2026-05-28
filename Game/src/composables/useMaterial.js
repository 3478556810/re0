// composables/useMaterial.js
export function useMaterial() {
  const store = useGameStore()
  const materialName = (id) => getMaterialName(id)
  const materialPrice = (id) => store.config.materialPrices[id] || getMaterialPrice(id)
  return { materialName, materialPrice, materials: store.materials }
}