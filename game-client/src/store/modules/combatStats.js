import { computed } from 'vue'
import { TALENT_TREES, CLASS_DEFS } from '@/components/class/classData'

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
    for (const slot of Object.values(equipment)) {
      if (!slot) continue
      base.attack += slot.atk || 0
      base.defense += slot.def || 0
      if (slot.bossDmgBonus) {
        base.specialBossDmg = (base.specialBossDmg || 0) + slot.bossDmgBonus
      }
    }

    // ========== 2. 装备副词条 + 鞋子速度 ==========
    const pctBonuses = {}
    for (const slot of Object.values(equipment)) {
      if (!slot) continue
      if (slot.speed && slot.speed > 0) {
        base.speed = (base.speed || 0) + slot.speed
      }
      if (!slot.extraStats) continue
      for (const [key, val] of Object.entries(slot.extraStats)) {
        if (key.endsWith('Percent')) {
          pctBonuses[key] = (pctBonuses[key] || 0) + val
        } else {
          if (typeof base[key] === 'number') {
            base[key] += val
          } else {
            base[key] = val
          }
        }
      }
    }

    // ========== 3. 普通百分比加成 ==========
    if (pctBonuses.atkPercent) {
      base.attack += Math.floor(base.attack * pctBonuses.atkPercent / 100)
    }
    if (pctBonuses.defPercent) {
      base.defense += Math.floor(base.defense * pctBonuses.defPercent / 100)
    }
    if (pctBonuses.hpPercent) {
      base.maxHp += Math.floor((base.maxHp || 100) * pctBonuses.hpPercent / 100)
    }

    // ========== 4. 百分比元素伤害 ==========
    const elemPercentKeys = [
      'fireDmgPercent', 'iceDmgPercent', 'thunderDmgPercent',
      'windDmgPercent', 'grassDmgPercent', 'holyDmgPercent',
      'darkDmgPercent', 'rockDmgPercent', 'steelDmgPercent'
    ]
    for (const key of elemPercentKeys) {
      if (pctBonuses[key]) {
        const elem = key.replace('DmgPercent', '')
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

    // ========== 8. 特殊刻印加成 ==========
    applySpecialAffixBonuses(base, activeAffixEffects.value)

    // ========== 9. 宝石属性 ==========
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

    // ========== 10. 天赋盘百分比加成 ==========
    applyTalentBonuses(base, player.talents || {}, player.class)

    // ========== 11. 神谕者治疗加成 & 光环（合并，只声明一次 talents）==========
    const talents = player.talents || {}
    const isOracle = ['oracle', 'seer'].includes(player.class)
    let healBonus = 0

    if (isOracle || ['paladin'].includes(player.class)) {
      // 治疗节点
      if (talents['o_heal1']) healBonus += 12
      if (talents['o_heal2']) healBonus += 12
      if (talents['s_heal4']) healBonus += 15
      if (talents['s_heal5']) healBonus += 15

      // 光环节点
      if (talents['s_aura1']) base.attack += Math.floor(base.attack * 0.08)
      if (talents['s_aura2']) base.defense += Math.floor(base.defense * 0.10)
      if (talents['s_notable_aura']) {
        base.attack += Math.floor(base.attack * 0.12)
        base.dmgTaken = (base.dmgTaken || 0) - 8
      }
    }

    base.healBonus = healBonus

    // ========== 12. 职业机制 ==========
    applyClassMechanism(base, player.class)

    // ========== 最终取整 ==========
    base.attack = Math.floor(base.attack || 0)
    base.defense = Math.floor(base.defense || 0)
    base.maxHp = Math.floor(base.maxHp || 0)
    base.hp = Math.min(Math.floor(base.hp || 0), base.maxHp)
    base.maxMp = Math.floor(base.maxMp || 0)
    base.mp = Math.min(Math.floor(base.mp || 0), base.maxMp)
    base.speed = Math.floor(base.speed || 0)
    base.critRate = Math.floor(base.critRate || 0)
    base.critDmg = Math.floor(base.critDmg || 0)
    base.dodge = Math.floor(base.dodge || 0)
    base.trueDmg = Math.floor(base.trueDmg || 0)
    base.lifesteal = Math.floor(base.lifesteal || 0)

    const elems = ['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel']
    for (const e of elems) {
      const key = e + 'Dmg'
      if (typeof base[key] === 'number') base[key] = Math.floor(base[key])
    }

    return base
})

  return { totalAffixLevels, activeAffixEffects, activeSetBonuses, playerStats }
}

// ==================== 天赋盘百分比加成 ====================
function applyTalentBonuses(stats, allocatedTalents, classId) {
  const def = CLASS_DEFS[classId]
  let series = 'warrior'
  if (def) {
    if (def.tier === 2) series = def.parent
    else if (def.tier === 1) series = classId
  }
  const tree = TALENT_TREES[series]
  if (!tree || !tree.nodes) return

  let atkPct = 0, defPct = 0, hpPct = 0, spdPct = 0
  let critRate = 0, critDmg = 0, dodge = 0
  let allElemDmgPct = 0, maxMpPct = 0, mpCostReduction = 0

  for (const node of tree.nodes) {
    if (!allocatedTalents[node.id]) continue
    const effect = node.effect
    const match = (regex) => {
      const m = effect.match(regex)
      return m ? parseFloat(m[1]) : 0
    }

    // 攻击/防御/生命/速度
    atkPct += match(/攻击力?\s*[+]\s*(\d+(?:\.\d+)?)\s*%/i)
    defPct += match(/防御\s*[+]\s*(\d+(?:\.\d+)?)\s*%/i)
    hpPct  += match(/(?:最大HP|生命值?)\s*[+]\s*(\d+(?:\.\d+)?)\s*%/i)
    spdPct += match(/速度\s*[+]\s*(\d+(?:\.\d+)?)\s*%/i)

    // 暴击/闪避
    critRate += match(/暴击率\s*[+]\s*(\d+(?:\.\d+)?)\s*%/i)
    critDmg  += match(/暴击伤害\s*[+]\s*(\d+(?:\.\d+)?)\s*%/i)
    dodge    += match(/闪避\s*[+]\s*(\d+(?:\.\d+)?)\s*%/i)

    // 元素伤害（核心：识别「元素伤害」「全元素伤害」）
    allElemDmgPct += match(/(?:全)?元素伤害\s*[+]\s*(\d+(?:\.\d+)?)\s*%/i)

    // MP 和 MP消耗
    maxMpPct += match(/最大MP\s*[+]\s*(\d+(?:\.\d+)?)\s*%/i)
    mpCostReduction += match(/MP消耗\s*[降低\-]\s*(\d+(?:\.\d+)?)\s*%/i)
  }

  // 应用加成
  if (atkPct > 0) stats.attack += Math.floor(stats.attack * atkPct / 100)
  if (defPct > 0) stats.defense += Math.floor(stats.defense * defPct / 100)
  if (hpPct > 0)  stats.maxHp += Math.floor(stats.maxHp * hpPct / 100)
  if (spdPct > 0) stats.speed += Math.floor(stats.speed * spdPct / 100)
  if (critRate > 0) stats.critRate = (stats.critRate || 0) + critRate
  if (critDmg > 0)  stats.critDmg = (stats.critDmg || 0) + critDmg
  if (dodge > 0)    stats.dodge = (stats.dodge || 0) + dodge

  // 元素伤害（写入所有元素键）
  if (allElemDmgPct > 0) {
    const elems = ['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel']
    for (const elem of elems) {
      const key = elem + 'Dmg'
      if (typeof stats[key] !== 'number') stats[key] = 0
      stats[key] += allElemDmgPct
    }
  }

  // MP相关
  if (maxMpPct > 0) {
    stats.maxMp = Math.floor((stats.maxMp || 0) * (1 + maxMpPct / 100))
    stats.mp = Math.min(stats.mp || 0, stats.maxMp)
  }
  if (mpCostReduction > 0) {
    stats.mpCostReduction = Math.min(50, (stats.mpCostReduction || 0) + mpCostReduction)
  }
}
// ==================== 职业机制 ====================
function applyClassMechanism(stats, classId) {
  stats.classMechanism = CLASS_DEFS[classId]?.mechanism || null
  // 具体机制效果在战斗引擎中实时处理，这里仅标记
}

function applySpecialAffixBonuses(stats, affixEffects) {
  let speedToAtk = 0, trueDmgPercent = 0, bossDmg = 0, fullHpDmg = 0
  let ignoreDef = 0, allElemDmg = 0, lifestealPercent = 0, mpLifestealPercent = 0
  let stackingAtk = 0, mpOnHit = 0, mpOnKill = 0, mpCostReduction = 0
  let dmgTaken = 0, doubleDrop = 0, shieldDmg = 0, halfHpCrit = 0
  let halfHpCritDmg = 0, deathSave = 0, deathShield = 0, reviveChance = 0
  let reviveCD = 0, reviveDmg = 0, bossDmgBonus = 0
  let dodge = 0, dodgeCounter = false, dodgeCritDmg = 0

  for (const eff of affixEffects) {
    const b = eff.bonus || {}
    if (b.dodge) dodge += b.dodge
    if (b.dodgeCounter) dodgeCounter = true
    if (b.dodgeCritDmg) dodgeCritDmg = Math.max(dodgeCritDmg, b.dodgeCritDmg)
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
    if (b.bossDmgBonus) bossDmgBonus += b.bossDmgBonus
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

  const speedDodge = (stats.speed || 0) * 0.05
  stats.dodge = dodge + speedDodge
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