import { useGameStore } from '@/store/gameStore'

export function buildCompanionUnit(store, originalStats) {
  const companionActive = store.player.companionActive !== false
  const companionId = store.activeCompanionId || store.player.currentCompanion
  if (!companionActive || !companionId) return null

  const companions = store.companions || []
  if (companions.length === 0) return null

  const companionSave = companions.find(c => c.id === companionId)
  if (!companionSave) return null

  const affectionLevel = store.getAffectionLevel?.(companionId) || 1
  const companionLevel = companionSave.level || 1
  const affectionBonusLv = Math.floor(affectionLevel / 200)

  const isHealer = ['archmage', 'elemental', 'paladin', 'oracle', 'seer'].includes(store.player.class)
  const isOracle = ['oracle', 'seer'].includes(store.player.class)
  const talents = store.player.talents || {}
  const hasSoulLink = isOracle && talents['o_keystone_link']
  const hasSoulResonance = isOracle && talents['s_keystone_link']
  const hasLifeConvert = isOracle && talents['o_life_convert']
  const hasDefConvert = isOracle && talents['o_def_convert']
  const hasLifePraise = isOracle && talents['s_notable_life']
  const hasSteelSong = isOracle && talents['s_notable_steel']

  let atkRate = isHealer ? 0.9 : 0.6
  let defRate = isHealer ? 0.7 : 0.4
  let hpRate = isHealer ? 0.9 : 0.6

  if (hasSoulLink) { atkRate += 0.1; defRate += 0.1; hpRate += 0.1 }
  if (hasSoulResonance) { atkRate += 0.2; defRate += 0.2; hpRate += 0.2 }
  if (talents['o_companion1']) { atkRate += 0.1; defRate += 0.1; hpRate += 0.1 }
  if (talents['s_companion4']) { atkRate += 0.15; defRate += 0.15; hpRate += 0.15 }

  const selfBaseAtk = (companionSave.baseAtk || 25) + companionLevel * 3
  const selfBaseDef = (companionSave.baseDef || 12) + companionLevel * 2
  const selfBaseHp = (companionSave.baseHp || 200) + companionLevel * 20

  const inheritedAtk = Math.floor(originalStats.attack * atkRate)
  const inheritedDef = Math.floor(originalStats.defense * defRate)
  const inheritedHp = Math.floor(originalStats.maxHp * hpRate)

  let attack = selfBaseAtk + inheritedAtk + affectionBonusLv * 20
  let defense = selfBaseDef + inheritedDef + affectionBonusLv * 10
  let hp = selfBaseHp + inheritedHp + affectionBonusLv * 50
  let speed = originalStats.speed + 5 + affectionBonusLv * 2
  let critRate = Math.floor(originalStats.critRate * 0.8)
  let critDmg = Math.floor(originalStats.critDmg * 0.8)

  if (isOracle) {
    let extraAtkRate = 0, extraDefRate = 0, extraHpRate = 0
    if (hasSoulLink) { extraAtkRate += 0.4; extraDefRate += 0.4; extraHpRate += 0.4 }
    if (hasSoulResonance) { extraAtkRate += 0.8; extraDefRate += 0.8; extraHpRate += 0.8 }
    attack += Math.floor(originalStats.attack * extraAtkRate)
    defense += Math.floor(originalStats.defense * extraDefRate)
    hp += Math.floor(originalStats.maxHp * extraHpRate)
  }

  let finalAtkMult = 1.0
  if (talents['o_companion2']) finalAtkMult += 0.1
  if (talents['s_companion5']) finalAtkMult += 0.15
  attack = Math.floor(attack * finalAtkMult)

  if (talents['o_companion3']) critDmg += 15
  if (talents['s_companion6']) critDmg += 20

  if (hasLifeConvert) {
    const bonusAtkPct = Math.floor(originalStats.maxHp / 500) * 2
    attack += Math.floor(attack * bonusAtkPct / 100)
  }
  if (hasLifePraise) {
    const bonusAtkPct = Math.floor(originalStats.maxHp / 500) * 3
    attack += Math.floor(attack * bonusAtkPct / 100)
  }
  if (hasDefConvert) {
    critDmg += Math.floor(originalStats.defense / 300) * 3
  }
  if (hasSteelSong) {
    critDmg += Math.floor(originalStats.defense / 300) * 4
  }

  // 构建技能数组
  const skillSlots = companionSave.skillSlots || {}
  const companionSkillsData = companionSave.skills || {}
  const companionSkillDefs = []
  for (const slotKey of Object.keys(skillSlots)) {
    const skillId = skillSlots[slotKey]
    if (!skillId) continue
    const skillDef = store.config?.skillPool?.find(s => s.id === skillId)
    if (!skillDef) continue
    const skillLevel = companionSkillsData[skillId]?.level || 1
    const levelScaling = skillDef.levelScaling?.baseMul || 0.1
    let currentMul = skillDef.baseMul || 0
    for (let i = 2; i <= skillLevel; i++) {
      const growth = levelScaling * (1 + (i - 1) * 0.08)
      currentMul += growth
    }
    companionSkillDefs.push({
      ...skillDef,
      currentLevel: skillLevel,
      baseMul: currentMul,
      element: skillDef.element || '',
      mpCost: skillDef.mpCost || 0,
      effects: skillDef.effects || []
    })
  }

  return {
    id: companionId,
    level: companionLevel,
    dmgTaken: store.playerStats.dmgTaken || 0,
    name: companionSave.name || '伙伴',
    icon: companionSave.icon || 'mdi:account-heart',
    isCompanion: true,
    attack, defense, hp, maxHp: hp,
    mp: Math.max(Math.floor(originalStats.maxMp * 0.6), 50),
    maxMp: Math.max(Math.floor(originalStats.maxMp * 0.6), 50),
    speed, critRate, critDmg,
    skills: companionSkillDefs,
    specialBossDmg: store.playerStats.specialBossDmg || 0,
    specialFullHpDmg: store.playerStats.specialFullHpDmg || 0,
    specialIgnoreDef: store.playerStats.specialIgnoreDef || 0,
    fireDmg: store.playerStats.fireDmg || 0,
    waterDmg: store.playerStats.waterDmg || 0,
    thunderDmg: store.playerStats.thunderDmg || 0,
    lifesteal: store.playerStats.lifesteal || 0
  }
}