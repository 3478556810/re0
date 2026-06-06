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

    // ========== 1. 装备基础攻防 ==========
// ========== 1. 装备基础攻防 ==========
for (const slot of Object.values(equipment)) {
  if (!slot) continue
  base.attack += slot.atk || 0
  base.defense += slot.def || 0
  // 累加装备上的 Boss 增伤词条
  if (slot.bossDmgBonus) {
    base.specialBossDmg = (base.specialBossDmg || 0) + slot.bossDmgBonus
  }
}

    // ========== 2. 装备副词条 (extraStats) + 鞋子速度 ==========
    const pctBonuses = {} // 存储所有百分比加成

    for (const slot of Object.values(equipment)) {
      if (!slot) continue

      // 鞋子基础速度
      if (slot.speed && slot.speed > 0) {
        base.speed = (base.speed || 0) + slot.speed
      }

      // 副词条
      if (!slot.extraStats) continue
      for (const [key, val] of Object.entries(slot.extraStats)) {
        if (key.endsWith('Percent')) {
          // 百分比词条，先累加起来
          pctBonuses[key] = (pctBonuses[key] || 0) + val
        } else {
          // 固定数值直接加到基础属性上
          if (typeof base[key] === 'number') {
            base[key] += val
          } else {
            base[key] = val
          }
        }
      }
    }






    // ========== 3. 应用普通百分比加成（攻击%、防御%、生命%） ==========
    if (pctBonuses.atkPercent) {
      base.attack += Math.floor(base.attack * pctBonuses.atkPercent / 100)
    }
    if (pctBonuses.defPercent) {
      base.defense += Math.floor(base.defense * pctBonuses.defPercent / 100)
    }
    if (pctBonuses.hpPercent) {
      base.maxHp += Math.floor((base.maxHp || 100) * pctBonuses.hpPercent / 100)
    }

    // ========== 4. 应用百分比元素伤害（火%、冰%、雷%...） ==========
    const elemPercentKeys = [
      'fireDmgPercent', 'iceDmgPercent', 'thunderDmgPercent',
      'windDmgPercent', 'grassDmgPercent', 'holyDmgPercent',
      'darkDmgPercent', 'rockDmgPercent', 'steelDmgPercent'
    ]
    for (const key of elemPercentKeys) {
      if (pctBonuses[key]) {
        const elem = key.replace('DmgPercent', '') // 提取元素名，如 fire
        const elemKey = elem + 'Dmg'
        if (!base.elemDmg) base.elemDmg = {}
        base.elemDmg[elemKey] = (base.elemDmg[elemKey] || 0) + Math.floor(base.attack * pctBonuses[key] / 100)
      }
    }

    // ========== 5. 刻印效果 ==========
    activeAffixEffects.value.forEach(effect => {
      const bonus = effect.bonus || {}
      for (const [key, value] of Object.entries(bonus)) {
         base[key] = (base[key] || 0) + value 
      }
    })

    // ========== 6. 套装效果 ==========
    for (const [, set] of Object.entries(activeSetBonuses.value)) {
      for (const [key, val] of Object.entries(set.bonus)) {
        if (key in base) base[key] += val
      }
    }

    // ========== 7. 套装特殊字段 ==========
    for (const set of Object.values(activeSetBonuses.value)) {
      const bonus = set.bonus || {};
      if (bonus.critRate) base.critRate = (base.critRate || 0) + bonus.critRate
      if (bonus.specialFullHpDmg) base.specialFullHpDmg = (base.specialFullHpDmg || 0) + bonus.specialFullHpDmg
      if (bonus.specialBossDmg) base.specialBossDmg = (base.specialBossDmg || 0) + bonus.specialBossDmg
      if (bonus.specialLowHpDmg) base.specialLowHpDmg = (base.specialLowHpDmg || 0) + bonus.specialLowHpDmg
      if (bonus.holyMarkOnHit) base.holyMarkOnHit = Math.max(base.holyMarkOnHit || 0, bonus.holyMarkOnHit)
      if (bonus.lowHpLifestealOnMark) base.lowHpLifestealOnMark = bonus.lowHpLifestealOnMark
      if (bonus.critDmgOnMark) base.critDmgOnMark = bonus.critDmgOnMark
      if (bonus.dragonMarkOnHit) base.dragonMarkOnHit = Math.max(base.dragonMarkOnHit || 0, bonus.dragonMarkOnHit)
      if (bonus.shadowMarkOnHit) base.shadowMarkOnHit = Math.max(base.shadowMarkOnHit || 0, bonus.shadowMarkOnHit)
    }

    // ========== 8. 特殊刻印加成（肾上腺素、巫毒娃娃等） ==========
    applySpecialAffixBonuses(base, activeAffixEffects.value)


// ========== 宝石属性 ==========
const gems = player.gems || {}
const gemDefs = config.gemDefinitions || []
for (const [slot, gemId] of Object.entries(gems)) {
    const gem = gemDefs.find(g => g.id === gemId)
    if (!gem) continue
    if (gem.type === 'atk') base.attack += gem.value
    else if (gem.type === 'def') base.defense += gem.value
    else if (gem.type === 'hp') base.maxHp += gem.value
    else if (gem.type === 'critDmg') base.critDmg += gem.value
    else if (gem.type === 'speed') base.speed += gem.value
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
let bossDmgBonus = 0  // 新增：来自装备的Boss增伤

let dodge = 0;
let dodgeCounter = false;
let dodgeCritDmg = 0;




  for (const eff of affixEffects) {
    const b = eff.bonus || {}

  
    if (b.dodge) dodge += b.dodge;
    if (b.dodgeCounter) dodgeCounter = true;
    if (b.dodgeCritDmg) dodgeCritDmg = Math.max(dodgeCritDmg, b.dodgeCritDmg);
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
    if (b.bossDmgBonus) bossDmgBonus += b.bossDmgBonus  // 新增：累加来自刻印的Boss增伤
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
  
// 速度转闪避：每 20 速度 = 1% 闪避
// 速度转闪避 + 刻印闪避
const speedDodge = (stats.speed || 0) * 0.05;
stats.dodge = dodge + speedDodge;
  stats.stackingAtk = stackingAtk
  stats.specialBossDmg = (stats.specialBossDmg || 0) + bossDmg
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
  stats.trueDmgPercent = trueDmgPercent
  stats.deathSave = Math.min(deathSave, 100)
  stats.deathShield = deathShield
  stats.reviveChance = Math.min(reviveChance, 100)
  stats.reviveCD = reviveCD
  stats.reviveDmg = reviveDmg
  stats.bossDmgBonus = (stats.bossDmgBonus || 0) + bossDmgBonus
}