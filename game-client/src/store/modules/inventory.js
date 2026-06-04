import { reactive } from 'vue'

export function useInventory() {
  const inventory = reactive([])
  const materials = reactive({})
  const equipment = reactive({
    weapon: null, gauntlet: null, helmet: null, armor: null,
    pants: null, shoes: null, necklace: null, ring1: null,
    ring2: null, earring1: null, earring2: null
  })

  function addMaterial(id, name, qty = 1, saveFn) {
    if (!id) return
    if (!materials[id]) materials[id] = { qty: 0, name: name || id }
    materials[id].qty += qty
    if (materials[id].qty < 0) materials[id].qty = 0
    if (saveFn) saveFn()
  }

  function unequip(slot, saveFn) {
    const item = equipment[slot]
    if (!item) return
    inventory.push(item)
    equipment[slot] = null
    if (saveFn) saveFn()
  }

  function equipAccessory(accessory, slot, saveFn) {
    const idx = inventory.findIndex(item => item.id === accessory.id)
    if (idx === -1) return
    if (equipment[slot]) inventory.push(equipment[slot])
    equipment[slot] = accessory
    inventory.splice(idx, 1)
    if (saveFn) saveFn()
  }

  function equipItem(item, saveFn) {
    if (!item || !item.id) return false
    let slot = item.part
    if (!slot) {
      const typeMap = { weapon: 'weapon', gauntlet: 'gauntlet', helmet: 'helmet', armor: 'armor', pants: 'pants', shoes: 'shoes' }
      slot = typeMap[item.type]
    }
    if (!slot) return false
    if (equipment[slot]) inventory.push(equipment[slot])
    for (let i = 0; i < inventory.length; i++) {
      if (inventory[i] && inventory[i].id === item.id) {
        equipment[slot] = inventory.splice(i, 1)[0]
        if (saveFn) saveFn()
        return true
      }
    }
    return false
  }

  function fixGhostEquipment() {
    let fixed = false
    for (const slot of Object.keys(equipment)) {
      const item = equipment[slot]
      if (!item) continue
      if (!inventory.some(i => i.id === item.id)) {
        equipment[slot] = null
        fixed = true
      }
    }
    if (fixed) saveFn?.()
  }

  return { inventory, materials, equipment, addMaterial, unequip, equipAccessory, equipItem, fixGhostEquipment }
}