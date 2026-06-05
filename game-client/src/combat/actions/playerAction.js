// src/combat/actions/playerAction.js
import { calculateDamage } from '../damageCalculator'
import { EFFECT_TYPES } from '../effectDefs'
import { applySkillEffects } from '../effects/skillEffects'

// ======================= 元素反应表 =======================
const ELEMENT_REACTIONS = {
  'fire_water': { name: '蒸发', dmgMul: 1.5 },
  'fire_thunder': { name: '超载', aoeDmgMul: 1.2 },
  'fire_grass': { name: '燃烧', dotValue: 0.6, dotDuration: 3 },
  'thunder_water': { name: '感电', chainDmgMul: 1.0, chainCount: 3 },
  'ice_water': { name: '冻结', dmgMul: 1.3, freeze: true },
  'ice_thunder': { name: '超导', dmgMul: 1.0, defReduce: 0.6, defDuration: 3 },
  'grass_water': { name: '生长', healPercent: 0.25 },
  'dark_holy': { name: '湮灭', maxHpPercent: 0.12 },
  'fire_rock': { name: '熔岩', dotValue: 0.6, dotDuration: 3 },
  'fire_poison': { name: '毒爆', burstPerStack: 0.05 },
  // 扩散系列
  'fire_wind': { name: '扩散', spread: true },
  'grass_wind': { name: '扩散', spread: true },
  'ice_wind': { name: '扩散', spread: true },
  'dark_wind': { name: '扩散', spread: true },
  'holy_wind': { name: '扩散', spread: true },
  'poison_wind': { name: '扩散', spread: true },
  'rock_wind': { name: '扩散', spread: true },
  'thunder_wind': { name: '扩散', spread: true },
  'water_wind': { name: '扩散', spread: true }
};
function getElementLabel(element) {
  const map = {
    fire: '火', water: '水', thunder: '雷', wind: '风',
    grass: '草', ice: '冰', holy: '圣', dark: '暗',
    rock: '岩', steel: '钢', poison: '毒'
  };
  return map[element] || element;
}
function checkElementReaction(engine, attacker, target, skill, result, damage) {
  const skills = engine.playerSkills || {};
  const skillState = skills[skill.id];
  const skillLevel = skillState ? skillState.level : 0;
  if (skillLevel < 10) return;
  if (!skill.element) return;

  const existingMark = target.effects.find(e =>
    e.type === 'element_mark' && e.element !== skill.element
  );

  if (existingMark) {
    const key = [existingMark.element, skill.element].sort().join('_');
    const reaction = ELEMENT_REACTIONS[key];
    if (!reaction) return;

    // 扩散
    if (reaction.spread) {
      const allEnemies = engine.getAliveEnemies();
      const spreadElement = existingMark.element === 'wind' ? skill.element : existingMark.element;
      const scale = 1 + Math.max(0, skillLevel - 10) * 0.1;
      const spreadDmg = Math.floor(attacker.getEffectiveAttack() * 0.8 * scale);
      for (const enemy of allEnemies) {
        enemy.takeDamage(spreadDmg, attacker);
      }
      let spreadCount = 0;
      for (const enemy of allEnemies) {
        const existing = enemy.effects.find(e => e.type === 'element_mark');
        if (existing) enemy.removeEffect('element_mark');
        enemy.addEffect({
          type: 'element_mark',
          element: spreadElement,
          duration: 5,
          stackable: false
        });
        spreadCount++;
      }
      if (existingMark.element === 'wind') {
        target.removeEffect('element_mark');
      }
      result.messages.push(`触发元素反应：扩散！造成 ${spreadDmg} 伤害，并扩散${getElementLabel(spreadElement)}印记`);
      return;
    }

    // 伤害反应
    const scale = 1 + Math.max(0, skillLevel - 10) * 0.1;
    let reactionDamage = 0;

    if (reaction.dmgMul) {
      reactionDamage = Math.floor(damage * reaction.dmgMul * scale);
      target.takeDamage(reactionDamage, attacker);
    } else if (reaction.maxHpPercent) {
      reactionDamage = Math.floor(target.maxHp * reaction.maxHpPercent * scale);
      target.takeDamage(reactionDamage, attacker);
    } else if (reaction.aoeDmgMul) {
      reactionDamage = Math.floor(damage * reaction.aoeDmgMul * scale);
      target.takeDamage(reactionDamage, attacker);
    }

    if (reactionDamage > 0) {
      result.messages.push(`触发元素反应：${reaction.name}！造成 ${reactionDamage} 点额外伤害`);
    } else {
      result.messages.push(`触发元素反应：${reaction.name}！`);
    }
    target.removeEffect('element_mark');

  } else {
    // 只有单体技能可挂印记
    if (skill.target !== 'aoe') {
      target.addEffect({
        type: 'element_mark',
        element: skill.element,
        duration: 5,
        stackable: false
      });
    }
  }
}
// ======================= 原函数结束 =======================

export function executePlayerAction(engine, skill, targetIndex, options = {}) {
  const { player, enemies } = engine
  if (engine.battleOver) return null

  const noMpCost = options.noMpCost === true
  if (!noMpCost) {
    if (skill.mpCost > 0 && player.mp < skill.mpCost) return { messages: ['MP不足！'] }
    player.mp -= skill.mpCost
  }

  const isAoeDamage = skill.target === 'aoe'
  const targets = isAoeDamage
    ? engine.getAliveEnemies()
    : [enemies[targetIndex]].filter(t => t && t.hp > 0)

  if (targets.length === 0) return null

  const result = {
    type: 'player_action', skill: skill.name, target: isAoeDamage ? '全体敌人' : targets[0].name,
    damage: 0, healing: 0, mpDrain: 0, hpDrain: 0, messages: [], crit: false, multiplier: 1,
    hitDetails: []
  }

  if (player.isStunned()) {
    result.messages.push(`${player.name} 被眩晕，无法行动！`)
    player.removeEffect(EFFECT_TYPES.STUN)
    return result
  }

  if (skill.healMul) {
    if (skill.target === 'all') {
      const healAmount = Math.floor(player.getEffectiveAttack() * skill.healMul)
      player.hp = Math.min(player.maxHp, player.hp + healAmount)
      result.healing = healAmount
      result.messages.push(`${player.name} 恢复了 ${healAmount} HP`)
      if (engine.companion && engine.companion.hp > 0) {
        const compHeal = Math.floor(player.getEffectiveAttack() * skill.healMul)
        engine.companion.hp = Math.min(engine.companion.maxHp, engine.companion.hp + compHeal)
        result.messages.push(`${engine.companion.name} 恢复了 ${compHeal} HP`)
      }
    } else {
      const heal = Math.floor(player.getEffectiveAttack() * skill.healMul)
      player.hp = Math.min(player.maxHp, player.hp + heal)
      result.healing = heal
      result.messages.push(`${player.name} 恢复了 ${heal} HP`)
    }
    return result
  }

  let totalDamage = 0
  for (const target of targets) {
    if (target.hp <= 0) continue

    const attackerSnap = {
      highHpBoost: skill.highHpBoost || 0,
      attack: player.getEffectiveAttack(),
      critRate: player.critRate,
      critDmg: player.critDmg,
      trueDmg: player.trueDmg,
      trueDmgPercent: player.trueDmgPercent || 0,
      element: skill.element || '',
      effects: player.effects || [],
        fireStackBonus: skill.fireStackBonus || 0,  // 从技能配置读取
    }

    ;['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel'].forEach(elem => {
      attackerSnap[elem + 'Dmg'] = player.elemDmg[elem] || 0
    })
    if (skill.element) attackerSnap[skill.element + 'Dmg'] = player.elemDmg[skill.element] || 0

    const defenderSnap = {
      defense: target.getEffectiveDefense(),
      element: target.element,
      effects: target.effects || [],
      hpPercent: target.hp / target.maxHp,
      maxHp: target.maxHp,
      hp: target.hp
    }

    const specialOptions = {
      ignoreDef: player.specialIgnoreDef || 0,
      fullHpDmg: player.specialFullHpDmg || 0,
      bossDmg: player.specialBossDmg || 0,
      lowHpDmg: player.specialLowHpDmg || 0,
      critDmgOnMark: player.critDmgOnMark || 0
    }

    // ===== 三脚架状态增伤（冻结/眩晕追击） =====
let conditionalBonus = 1.0

// 碎冰：对冻结目标额外增伤
if (skill.effects?.some(e => e.type === 'shatter') && target.effects?.some(e => e.type === 'freeze')) {
  conditionalBonus *= 2.0
  target.removeEffect('freeze')
}

// 冻结追击：对冻结目标必暴 + 增伤
if (skill.effects?.some(e => e.type === 'freezeBonus') && target.effects?.some(e => e.type === 'freeze')) {
  conditionalBonus *= 1.5
  player._forceCritNext = true
}

// 眩晕追击：对眩晕目标增伤
if (skill.effects?.some(e => e.type === 'stunBonus') && target.effects?.some(e => e.type === 'stun')) {
  conditionalBonus *= 2.0
}

// 眩晕必暴：对眩晕目标必定暴击
if (skill.effects?.some(e => e.type === 'stunCrit') && target.effects?.some(e => e.type === 'stun')) {
  player._forceCritNext = true
}

// 斩杀：对低血量目标增伤
if (skill.effects?.some(e => e.type === 'executioner') && target.hp / target.maxHp < 0.3) {
  conditionalBonus *= 2.0
}

// 应用条件增伤到技能倍率
const effectiveMul = skill.baseMul * conditionalBonus
const effectiveSkill = { ...skill, baseMul: effectiveMul }

    const { damage, crit, multiplier, shadowTrueDmg, trueDmg } = calculateDamage(attackerSnap, defenderSnap, effectiveSkill, specialOptions)
    result.shadowTrueDmg = (result.shadowTrueDmg || 0) + (shadowTrueDmg || 0)

    if (shadowTrueDmg > 0) {
      result.hitDetails.push({
        targetIndex: enemies.indexOf(target),
        damage: shadowTrueDmg,
        crit: false,
        multiplier: 1,
        isShadowTrue: true
      })
    }

    const hpBefore = target.hp
    const deathResult = target.takeDamage(damage, player)


// 闪避提示
if (deathResult?.dodged) {
 result.messages.push(`${target.name} 闪避了攻击！`)
}

    player._lastDamageDealt = damage


    

    // ---------- 元素反应：技能等级 >=15 时触发 ----------
  // 元素反应检测（传入本次伤害）
checkElementReaction(engine, player, target, skill, result, damage);

    if (window.recordDamage) {
      window.recordDamage(damage, crit, shadowTrueDmg || 0)
    }

    // 龙骸、暗蚀等印记逻辑保持不变...
    if (player.dragonMarkOnHit) {
      const existing = target.effects.find(e => e.type === EFFECT_TYPES.DRAGON_MARK)
      if (existing) {
        existing.stacks = (existing.stacks || 1) + 1
        existing.duration = 5
        existing.animClass = 'dragon-mark-glow'
      } else {
        target.addEffect({
          type: EFFECT_TYPES.DRAGON_MARK,
          value: player.dragonMarkOnHit,
          duration: 5,
          stackable: true,
          maxStacks: 99,
          animClass: 'dragon-mark-glow'
        })
      }
    }

    if (player.shadowMarkOnHit) {
      const effects = target.effects
      const existingIdx = effects.findIndex(e => e.type === EFFECT_TYPES.SHADOW_MARK)
      if (existingIdx !== -1) {
        const old = effects[existingIdx]
        const newStacks = (old.stacks || 1) + 1
        effects.splice(existingIdx, 1)
        effects.push({
          type: EFFECT_TYPES.SHADOW_MARK,
          value: player.shadowMarkOnHit,
          duration: 5,
          stacks: newStacks,
          stackable: true,
          maxStacks: 99,
          animClass: 'shadow-mark-glow',
          animKey: Math.random()
        })
      } else {
        effects.push({
          type: EFFECT_TYPES.SHADOW_MARK,
          value: player.shadowMarkOnHit,
          duration: 5,
          stacks: 1,
          stackable: true,
          maxStacks: 99,
          animClass: 'shadow-mark-glow',
          animKey: Math.random()
        })
      }
      target.effects = [...effects]
    }

    if (player.lowHpLifestealOnMark && player.hp < player.maxHp * 0.5) {
      const hasMark = target.effects.some(e => e.type === 'dragonMark')
      if (hasMark) {
        const drain = Math.floor(damage * player.lowHpLifestealOnMark / 100)
        player.hp = Math.min(player.maxHp, player.hp + drain)
        result.hpDrain += drain
      }
    }

    result.hitDetails.push({
      targetIndex: enemies.indexOf(target),
      damage,
      crit,
      multiplier,
      trueDmg: trueDmg || 0
    })

    totalDamage += damage

    if (deathResult?.deathSaved) {
      result.messages.push(`${target.name} 顽强地存活下来！`)
    } else if (deathResult?.revived) {
      result.messages.push(`${target.name} 从死亡中复活！`)
    } else if (target.hp <= 0) {
      if (target.traits?.includes('revive') && !target.hasRevived) {
        target.hasRevived = true
        target.hp = Math.floor(target.maxHp * 0.3)
        result.messages.push(`${target.name} 复活了！`)
      } else {
        target.hp = 0
        result.messages.push(`${target.name} 被击败！`)
      }
    }

    const actualHpLoss = Math.min(damage, hpBefore)
    let buffLifesteal = 0
    player.effects?.forEach(e => {
      if (e.type === EFFECT_TYPES.LIFESTEAL_BUFF) buffLifesteal += (e.value || 0)
    })
    const totalLifesteal = (player.lifesteal || 0) + (player.specialLifestealPercent || 0) + buffLifesteal
    if (totalLifesteal > 0) {
      const drain = Math.floor(actualHpLoss * totalLifesteal / 100)
      if (drain > 0) { player.hp = Math.min(player.maxHp, player.hp + drain); result.hpDrain += drain }
    }
    const totalMpLifesteal = (player.mpLifesteal || 0) + (player.specialMpLifestealPercent || 0)
    if (totalMpLifesteal > 0) {
      const drain = Math.floor(actualHpLoss * totalMpLifesteal / 100)
      if (drain > 0) { player.mp = Math.min(player.maxMp, player.mp + drain); result.mpDrain += drain }
    }
    const mpOnHit = player.mpOnHit || 0
    if (mpOnHit > 0 && totalDamage > 0) {
      player.mp = Math.min(player.maxMp, player.mp + mpOnHit)
    }

    let msg = isAoeDamage
      ? `${player.name} 使用${skill.name}，对 ${target.name} 造成 ${damage} 伤害`
      : `${player.name} 使用${skill.name}，造成 ${damage} 伤害`
    if (crit) msg += ' (暴击)'
    if (multiplier > 1) msg += ' 效果拔群！'
    if (multiplier < 1) msg += ' 效果不理想...'
    result.messages.push(msg)

    if (target === targets[0]) { result.crit = crit; result.multiplier = multiplier }

    if (target.hp <= 0 && !deathResult?.deathSaved && !deathResult?.revived) {
      if (engine.getAliveEnemies().length === 0) {
        engine.battleOver = true
        engine.winner = 'player'
        break
      }
    }
  }

  result.damage = totalDamage

  // 追加攻击逻辑...
  if (skill.extraActions?.length && !engine.battleOver) {
    for (const action of skill.extraActions) {
      if (action.note === '追加攻击' || action.type === 'extraAction') {
        const extraTargets = action.target === 'aoe' ? engine.getAliveEnemies() : [targets[0]]
        for (const extraTarget of extraTargets) {
          if (!extraTarget || extraTarget.hp <= 0) continue
          if (Math.random() * 100 > (action.chance || 100)) continue

          const mul = (action.value || 50) / 100
          const as = {
            attack: player.getEffectiveAttack(), critRate: player.critRate, critDmg: player.critDmg,
            trueDmg: player.trueDmg, trueDmgPercent: player.trueDmgPercent || 0,
            element: skill.element || ''
          }
          if (skill.element) as[skill.element + 'Dmg'] = player.elemDmg[skill.element] || 0
          const specialOptions = {
            ignoreDef: player.specialIgnoreDef || 0,
            fullHpDmg: player.specialFullHpDmg || 0,
            bossDmg: player.specialBossDmg || 0,
            lowHpDmg: player.specialLowHpDmg || 0,
            critDmgOnMark: player.critDmgOnMark || 0
          }
          const { damage: extraDmg, crit: extraCrit, trueDmg: extraTrueDmg } = calculateDamage(
            as,
            { defense: extraTarget.getEffectiveDefense(), element: extraTarget.element, effects: extraTarget.effects || [] },
            { baseMul: skill.baseMul * mul, element: skill.element || '' },
            specialOptions
          )

          const extraDeathResult = extraTarget.takeDamage(extraDmg, player)
          result.damage += extraDmg
          result.messages.push(`追加攻击造成 ${extraDmg} 伤害`)

          result.hitDetails.push({
            targetIndex: engine.enemies.indexOf(extraTarget),
            damage: extraDmg,
            crit: extraCrit,
            multiplier: 1,
            trueDmg: extraTrueDmg || 0,
          })

          if (extraDeathResult?.deathSaved || extraDeathResult?.revived) {
            // 免死
          } else if (extraTarget.hp <= 0) {
            result.messages.push(`${extraTarget.name} 被击败！`)
            if (engine.getAliveEnemies().length === 0) {
              engine.battleOver = true
              engine.winner = 'player'
              break
            }
          }
        }
      }
    }
  }

  if (result.hpDrain > 0) result.messages.push(`合计吸取了 ${result.hpDrain} HP`)
  if (result.mpDrain > 0) result.messages.push(`合计吸取了 ${result.mpDrain} MP`)

  // 技能效果
  if (skill.effects && skill.effects.length > 0) {
    for (const effDef of skill.effects) {
      const isSelfTarget = skill.target === 'self' || effDef.target === 'self'
      const isAoeTarget = effDef.target === 'aoe' || skill.target === 'aoe'
      const isAllAllies = skill.target === 'all' || effDef.target === 'all'

      if (isAllAllies) {
        const allies = [player]
        if (engine.companion?.hp > 0) allies.push(engine.companion)
        for (const ally of allies) {
          result.messages.push(...applySkillEffects(player, ally, [effDef], engine))
        }
      } else if (isAoeTarget) {
        for (const enemy of engine.getAliveEnemies()) {
          result.messages.push(...applySkillEffects(player, enemy, [effDef], engine))
        }
      } else if (isSelfTarget) {
        result.messages.push(...applySkillEffects(player, player, [effDef], engine))
      } else {
        const mainTarget = targets[0]
        if (mainTarget && mainTarget.hp > 0) {
          result.messages.push(...applySkillEffects(player, mainTarget, [effDef], engine))
        }
      }
    }
  }

  if (engine.getAliveEnemies().length === 0) { engine.battleOver = true; engine.winner = 'player' }

  return result
}