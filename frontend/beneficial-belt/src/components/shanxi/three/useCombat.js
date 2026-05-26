// src/components/shanxi/three/useCombat.js
import { ref, computed } from 'vue'

export function useCombat() {
  const playerHp = ref(100)
  const playerMaxHp = ref(100)
  const playerLevel = ref(1)
  const playerExp = ref(0)
  const playerAttack = ref(25)
  const expToNext = computed(() => playerLevel.value * 100)
  let invincible = false

  function checkLevelUp() {
    while (playerExp.value >= expToNext.value) {
      playerExp.value -= expToNext.value
      playerLevel.value++
      playerMaxHp.value += 20
      playerHp.value = playerMaxHp.value
      playerAttack.value += 5
    }
  }

  function takeDamage(damage) {
    if (invincible) return false
    playerHp.value = Math.max(0, playerHp.value - damage)
    invincible = true
    setTimeout(() => { invincible = false }, 1000)
    return playerHp.value <= 0
  }

  function reset() {
    playerHp.value = playerMaxHp.value
    playerExp.value = 0
  }

  return { playerHp, playerMaxHp, playerLevel, playerExp, playerAttack, expToNext, checkLevelUp, takeDamage, reset }
}