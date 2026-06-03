import { computed } from 'vue'

export function useCombatStats(equipment, config, player) {
  const totalAffixLevels = computed(() => {
    const levels = {}
    for (const slot of Object.values(equipment)) {
      if (!slot || !slot.affixes) continue
      slot.affixes.forEach(affix => {
        if (!levels[affix.id]) levels[affix.id] = 0
        levels[affix.id] += affix.level
      })
    }
    return levels
  })

  const activeAffixEffects = computed(() => {
    const effects = []
    const levels = totalAffixLevels.value
    for (const [affixId, totalLevel] of Object.entries(levels)) {
      const effectDef = config.affixEffects[affixId]
      if (!effectDef) continue
      const activeThresholds = effectDef.thresholds.filter(t => t.level <= totalLevel)
      if (activeThresholds.length === 0) continue
      const best = activeThresholds[activeThresholds.length - 1]
      effects.push({
        affixId,
        affixName: effectDef.name,
        icon: effectDef.icon,
        level: totalLevel,
        desc: best.desc,
        bonus: best.bonus
      })
    }
    return effects
  })

  const activeSetBonuses = computed(() => {
    const counts = {}
    for (const slot of Object.values(equipment)) {
      if (!slot || !slot.setId) continue
      counts[slot.setId] = (counts[slot.setId] || 0) + 1
    }
    const bonuses = {}
    for (const [setId, count] of Object.entries(counts)) {
      const setConfig = config.setBonuses?.[setId] || {}
      let best = null
      for (const [required, bonus] of Object.entries(setConfig)) {
        if (count >= Number(required)) best = { count, bonus, required: Number(required) }
      }
      if (best) bonuses[setId] = best
    }
    return bonuses
  })

  const playerStats = computed(() => {
    const base = { ...player }
    for (const slot of Object.values(equipment)) {
      if (!slot) continue
      base.attack += slot.atk || 0
      base.defense += slot.def || 0
    }
    activeAffixEffects.value.forEach(effect => {
      const bonus = effect.bonus || {}
      for (const [key, value] of Object.entries(bonus)) {
        if (key in base) base[key] += value
      }
    })
    for (const [, set] of Object.entries(activeSetBonuses.value)) {
      for (const [key, val] of Object.entries(set.bonus)) {
        if (key in base) base[key] += val
      }
    }
    applySpecialAffixBonuses(base, activeAffixEffects.value)
    // 应用套装特殊效果（与刻印加成类似）
for (const set of Object.values(activeSetBonuses.value)) {
  const bonus = set.bonus || {};
  if (bonus.critRate) base.critRate = (base.critRate || 0) + bonus.critRate;
  if (bonus.specialFullHpDmg) base.specialFullHpDmg = (base.specialFullHpDmg || 0) + bonus.specialFullHpDmg;
  if (bonus.specialBossDmg) base.specialBossDmg = (base.specialBossDmg || 0) + bonus.specialBossDmg;
  if (bonus.specialLowHpDmg) base.specialLowHpDmg = (base.specialLowHpDmg || 0) + bonus.specialLowHpDmg;
  if (bonus.holyMarkOnHit) base.holyMarkOnHit = Math.max(base.holyMarkOnHit || 0, bonus.holyMarkOnHit);
  if (bonus.lowHpLifestealOnMark) base.lowHpLifestealOnMark = bonus.lowHpLifestealOnMark;
  if (bonus.critDmgOnMark) base.critDmgOnMark = bonus.critDmgOnMark;
}
    return base
  })

  return { totalAffixLevels, activeAffixEffects, activeSetBonuses, playerStats }
}

function applySpecialAffixBonuses(stats, affixEffects) {
  let speedToAtk = 0
  let trueDmgPercent = 0
  let bossDmg = 0
  let fullHpDmg = 0
  let ignoreDef = 0
  let allElemDmg = 0
  let lifestealPercent = 0
  let mpLifestealPercent = 0
  let stackingAtk = 0
  let mpOnHit = 0
  let mpOnKill = 0
  let mpCostReduction = 0
  let dmgTaken = 0
  let doubleDrop = 0
  let shieldDmg = 0
  let halfHpCrit = 0
  let halfHpCritDmg = 0
  let deathSave = 0
  let deathShield = 0
  let reviveChance = 0
  let reviveCD = 0
  let reviveDmg = 0

  for (const eff of affixEffects) {
    const b = eff.bonus || {}
    if (b.speedToAtk) speedToAtk += b.speedToAtk
    if (b.trueDmgPercent) trueDmgPercent += b.trueDmgPercent
    if (b.bossDmg) bossDmg += b.bossDmg
    if (b.fullHpDmg) fullHpDmg += b.fullHpDmg
    if (b.ignoreDef) ignoreDef += b.ignoreDef
    if (b.allElemDmg) allElemDmg += b.allElemDmg
    if (b.lifestealPercent) lifestealPercent += b.lifestealPercent
    if (b.mpLifestealPercent) mpLifestealPercent += b.mpLifestealPercent
    if (b.stackingAtk) stackingAtk += b.stackingAtk
    if (b.mpOnHit) mpOnHit += b.mpOnHit
    if (b.mpOnKill) mpOnKill += b.mpOnKill
    if (b.mpCostReduction) mpCostReduction += b.mpCostReduction
    if (b.dmgTaken) dmgTaken += b.dmgTaken
    if (b.doubleDrop) doubleDrop += b.doubleDrop
    if (b.shieldDmg) shieldDmg += b.shieldDmg
    if (b.halfHpCrit) halfHpCrit += b.halfHpCrit
    if (b.halfHpCritDmg) halfHpCritDmg += b.halfHpCritDmg
    if (b.deathSave) deathSave += b.deathSave
    if (b.deathShield) deathShield += b.deathShield
    if (b.reviveChance) reviveChance += b.reviveChance
    if (b.reviveCD) reviveCD += b.reviveCD
    if (b.reviveDmg) reviveDmg += b.reviveDmg
  }

  if (speedToAtk > 0) stats.attack += Math.floor(stats.speed * speedToAtk / 100)
  if (trueDmgPercent > 0) stats.trueDmg += Math.floor(stats.attack * trueDmgPercent / 100)
  if (allElemDmg > 0) {
    const elems = ['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel']
    for (const elem of elems) {
      const key = elem + 'Dmg'
      if (typeof stats[key] === 'number') stats[key] += allElemDmg
    }
  }

  stats.stackingAtk = stackingAtk
  stats.specialBossDmg = bossDmg
  stats.specialFullHpDmg = fullHpDmg
  stats.specialIgnoreDef = ignoreDef
  stats.specialLifestealPercent = lifestealPercent
  stats.specialMpLifestealPercent = mpLifestealPercent
  stats.mpOnHit = mpOnHit
  stats.mpOnKill = mpOnKill
  stats.mpCostReduction = Math.min(mpCostReduction, 50)
  stats.dmgTaken = dmgTaken
  stats.doubleDrop = doubleDrop
  stats.shieldDmg = shieldDmg
  stats.halfHpCrit = halfHpCrit
  stats.halfHpCritDmg = halfHpCritDmg
  stats.deathSave = Math.min(deathSave, 100)
  stats.deathShield = deathShield
  stats.reviveChance = Math.min(reviveChance, 100)
  stats.reviveCD = reviveCD
  stats.reviveDmg = reviveDmg
}