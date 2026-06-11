// src/store/modules/companion.js
import { ref, computed } from 'vue'

export function useCompanion() {
  const companions = ref([])
  const activeCompanionId = ref(null)

  // 伙伴每级属性成长（大幅强化）
  const COMPANION_GROWTH = {
    hp: 120,      // 原 80 → 120
    mp: 15,       // 原 10 → 15
    attack: 6,    // 原 4 → 6
    defense: 5,   // 原 3 → 5
    speed: 3      // 原 2 → 3
  }

  // 初始化：从 config.characters 生成伙伴列表
  function initCompanions(characters) {
    if (!characters) return
    const list = []
    for (const [id, char] of Object.entries(characters)) {
      if (id === 'hero' || id === 'player') continue
      if (!char.isCompanion) continue
      list.push({
        id,
        name: char.name,
        icon: char.icon || 'mdi:account-heart',
        baseHp: char.baseHp || 500,        // 原 200 → 500
        baseMp: char.baseMp || 80,         // 原 30 → 80
        baseAtk: char.baseAttack || 120,    // 原 25 → 35for (const enemy of alive) {
        baseDef: char.baseDefense || 70,   // 原 12 → 20
        baseSpeed: char.baseSpeed || 16,   // 原 14 → 16
        level: 1,
        exp: 0,
        affection: 0,
        skillPoints: 10,                   // 原 5 → 10
        skills: {},
        skillSlots: {},
        skillSpent: 0,
        talents: {},
        talentSpent: 0,
        tripodChoices: {}
      })
    }
    companions.value = list
    if (list.length && !activeCompanionId.value) {
      activeCompanionId.value = list[0].id
    }
  }

  function getSaveData() {
    return companions.value.map(c => ({
      id: c.id, name: c.name, icon: c.icon,
      baseHp: c.baseHp, baseMp: c.baseMp,
      baseAtk: c.baseAtk, baseDef: c.baseDef, baseSpeed: c.baseSpeed,
      level: c.level, exp: c.exp, affection: c.affection,
      skillPoints: c.skillPoints, skills: c.skills, equippedSkills: c.equippedSkills,
      skillSlots: c.skillSlots, skillSpent: c.skillSpent,
      talents: c.talents, talentSpent: c.talentSpent
    }))
  }

  function loadFromSave(data) {
    if (!Array.isArray(data)) return
    companions.value = data.map(c => ({
        ...c,
        baseHp: c.baseHp ?? 500,
        baseMp: c.baseMp ?? 80,
        baseAtk: c.baseAtk ?? 120,
        baseDef: c.baseDef ?? 70,
        baseSpeed: c.baseSpeed ?? 16,
        skillPoints: c.skillPoints ?? 10,
        skillSlots: c.skillSlots || {},
        equippedSkills: c.equippedSkills || [],
        skills: c.skills || {},
        skillSpent: c.skillSpent || 0,
        talents: c.talents || {},
        talentSpent: c.talentSpent || 0,
        tripodChoices: c.tripodChoices || {}
    }))
    if (companions.value.length && !activeCompanionId.value) {
        activeCompanionId.value = companions.value[0].id
    }
  }

  function addAffection(companionId, amount, saveCallback) {
    const comp = companions.value.find(c => c.id === companionId)
    if (!comp) return
    comp.affection = Math.min(comp.affection + amount, 1000)
    if (saveCallback) saveCallback()
  }

  function addCompanionExp(companionId, amount, saveCallback) {
    const comp = companions.value.find(c => c.id === companionId)
    if (!comp) return
    comp.exp += amount
    const needed = Math.floor(100 * Math.pow(1.1, comp.level - 1))
    if (comp.exp >= needed) {
        comp.exp -= needed
        comp.level++
        comp.baseHp += COMPANION_GROWTH.hp
        comp.baseMp += COMPANION_GROWTH.mp
        comp.baseAtk += COMPANION_GROWTH.attack
        comp.baseDef += COMPANION_GROWTH.defense
        comp.baseSpeed += COMPANION_GROWTH.speed
        comp.skillPoints = (comp.skillPoints || 0) + 4
        if (comp.exp >= Math.floor(100 * Math.pow(1.1, comp.level - 1))) {
            addCompanionExp(companionId, 0, saveCallback)
        }
    }
    if (saveCallback) saveCallback()
  }

  return {
    companions,
    activeCompanionId,
    initCompanions,
    getSaveData,
    loadFromSave,
    addAffection,
    addCompanionExp
  }
}