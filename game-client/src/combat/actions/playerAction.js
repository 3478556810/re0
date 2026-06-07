// src/combat/actions/playerAction.js
import { calculateDamage } from '../damageCalculator'
import { EFFECT_TYPES } from '../effectDefs'
import { applySkillEffects } from '../effects/skillEffects'

// ======================= 元素反应表 =======================
const ELEMENT_REACTIONS = {
  'fire_water': { name: '蒸发', dmgMul: 1.2 },
  'fire_thunder': { name: '超载', aoeDmgMul: 0.5 },
  'fire_grass': { name: '燃烧', dotValue: 0.4, dotDuration: 3 },
  'thunder_water': { name: '感电', chainDmgMul: 0.3, chainCount: 3 },
  'ice_water': { name: '冻结', dmgMul: 1.0, freezeDuration: 1 },
  'ice_thunder': { name: '超导', dmgMul: 0.6, defReduce: 0.4, defDuration: 3 },
  'grass_water': { name: '生长', healPercent: 0.20 },
  'dark_holy': { name: '湮灭', dmgMul: 0.5 },
  'fire_rock': { name: '熔岩', dotValue: 0.4, dotDuration: 3 },
  'fire_poison': { name: '毒爆', burstPerStack: 0.04 },
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

  // 从玩家对象获取职业机制
  const player = engine.player;
  const masteryMultiplier = (player.classMechanism === 'elemental_mastery') ? 1.5 : 1.0;

  if (existingMark) {
    const key = [existingMark.element, skill.element].sort().join('_');
    const reaction = ELEMENT_REACTIONS[key];
    if (!reaction) return;

    const scale = 1 + Math.max(0, skillLevel - 10) * 0.1;

    // 扩散
    if (reaction.spread) {
      const allEnemies = engine.getAliveEnemies();
      const spreadElement = existingMark.element === 'wind' ? skill.element : existingMark.element;
      let spreadDmg = Math.floor(attacker.getEffectiveAttack() * 0.8 * scale);
      spreadDmg = Math.floor(spreadDmg * masteryMultiplier);
      for (const enemy of allEnemies) {
        enemy.takeDamage(spreadDmg, attacker);
      }
      for (const enemy of allEnemies) {
        const existing = enemy.effects.find(e => e.type === 'element_mark');
        if (existing) enemy.removeEffect('element_mark');
        enemy.addEffect({
          type: 'element_mark',
          element: spreadElement,
          duration: 5,
          stackable: false
        });
      }
      if (existingMark.element === 'wind') {
        target.removeEffect('element_mark');
      }
      result.messages.push(`触发元素反应：扩散！造成 ${spreadDmg} 伤害，并扩散${getElementLabel(spreadElement)}印记`);
      return;
    }

    // 伤害乘算反应（蒸发、湮灭、冻结、超导）
    if (reaction.dmgMul) {
      const markDamage = existingMark.markDamage || damage;
      const totalBaseDamage = damage + markDamage;
      let reactionDamage = Math.floor(totalBaseDamage * reaction.dmgMul * scale);
      reactionDamage = Math.floor(reactionDamage * masteryMultiplier);
      target.takeDamage(reactionDamage, attacker);
      if (reaction.freezeDuration) {
        target.addEffect({ type: EFFECT_TYPES.FREEZE, duration: reaction.freezeDuration, stackable: false });
        result.messages.push(`触发元素反应：${reaction.name}！造成 ${reactionDamage} 伤害并冻结目标`);
      } else if (reaction.defReduce) {
        target.addEffect({ type: EFFECT_TYPES.DEF_DOWN, value: -reaction.defReduce, duration: reaction.defDuration, stackable: false });
        result.messages.push(`触发元素反应：${reaction.name}！造成 ${reactionDamage} 伤害并降低防御`);
      } else {
        result.messages.push(`触发元素反应：${reaction.name}！造成 ${reactionDamage} 点额外伤害`);
      }
      target.removeEffect('element_mark');
      return;
    }

    // 超载 (AOE)
    if (reaction.aoeDmgMul) {
      let aoeDmg = Math.floor(damage * reaction.aoeDmgMul * scale);
      aoeDmg = Math.floor(aoeDmg * masteryMultiplier);
      const aliveEnemies = engine.getAliveEnemies();
      for (const enemy of aliveEnemies) {
        enemy.takeDamage(aoeDmg, attacker);
      }
      result.messages.push(`触发元素反应：${reaction.name}！对所有敌人造成 ${aoeDmg} 伤害`);
      target.removeEffect('element_mark');
      return;
    }

    // 感电 (连锁)
    if (reaction.chainDmgMul) {
      let chainDmg = Math.floor(damage * reaction.chainDmgMul * scale);
      chainDmg = Math.floor(chainDmg * masteryMultiplier);
      target.takeDamage(chainDmg, attacker);
      result.messages.push(`触发元素反应：${reaction.name}！额外造成 ${chainDmg} 伤害`);

      const otherEnemies = engine.getAliveEnemies().filter(e => e !== target && e.hp > 0);
      let currentDmg = chainDmg;
      for (let i = 0; i < Math.min(reaction.chainCount, otherEnemies.length); i++) {
        const nextTarget = otherEnemies[i % otherEnemies.length];
        currentDmg = Math.floor(currentDmg * 0.7);
        if (currentDmg <= 0) break;
        nextTarget.takeDamage(currentDmg, attacker);
        result.messages.push(`感电弹射到 ${nextTarget.name}，造成 ${currentDmg} 伤害`);
      }
      target.removeEffect('element_mark');
      return;
    }

    // DOT 附加（燃烧、熔岩）
    if (reaction.dotValue) {
      const dotDmg = Math.floor(attacker.getEffectiveAttack() * reaction.dotValue);
      target.addEffect({
        type: EFFECT_TYPES.BURN,
        value: reaction.dotValue,
        duration: reaction.dotDuration || 3,
        stackable: true,
        maxStacks: 5,
        casterAttack: attacker.getEffectiveAttack()
      });
      result.messages.push(`触发元素反应：${reaction.name}！目标被灼烧，每回合损失 ${dotDmg} 点生命`);
      target.removeEffect('element_mark');
      return;
    }

    // 毒爆
    if (reaction.burstPerStack) {
      const poison = target.effects.find(e => e.type === EFFECT_TYPES.DOT && e.isPercentHp);
      if (poison) {
        const stacks = poison.stacks || 1;
        let burstDmg = Math.floor(target.maxHp * reaction.burstPerStack * stacks);
        burstDmg = Math.floor(burstDmg * masteryMultiplier);
        target.takeDamage(burstDmg, attacker);
        target.removeEffect(EFFECT_TYPES.DOT);
        result.messages.push(`触发元素反应：${reaction.name}！引爆 ${stacks} 层中毒，造成 ${burstDmg} 伤害`);
      } else {
        result.messages.push(`触发元素反应：${reaction.name}，但目标没有中毒效果`);
      }
      target.removeEffect('element_mark');
      return;
    }

    // 生长（治疗）
    if (reaction.healPercent) {
      const healPlayer = Math.floor(attacker.maxHp * reaction.healPercent);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healPlayer);
      result.messages.push(`触发元素反应：${reaction.name}！恢复 ${healPlayer} 生命`);
      if (engine.companion && engine.companion.hp > 0) {
        const healComp = Math.floor(engine.companion.maxHp * reaction.healPercent);
        engine.companion.hp = Math.min(engine.companion.maxHp, engine.companion.hp + healComp);
        result.messages.push(`同伴恢复 ${healComp} 生命`);
      }
      target.removeEffect('element_mark');
      return;
    }

    target.removeEffect('element_mark');

  } else {
    if (skill.target !== 'aoe') {
      target.addEffect({
        type: 'element_mark',
        markDamage: damage,
        element: skill.element,
        duration: 5,
        stackable: false
      });
    }
  }
}

export function executePlayerAction(engine, skill, targetIndex, options = {}) {
  const { player, enemies } = engine

  console.log('🔥🔥🔥 playerAction 已执行！技能:', skill.name)
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

    // ===== 统一无敌判定（基于标记） =====
    if (target.isBossInvincible) {
      if (target.invincibleWeakness && skill.element === target.invincibleWeakness) {
        target.isBossInvincible = false
        target.invincibleReason = ''
        target.removeEffect(EFFECT_TYPES.SHIELD)
        result.messages.push(`无敌被${getElementLabel(skill.element)}属性打破！`)
      } else {
        result.messages.push(`${target.name} 免疫了所有伤害！`)
        result.hitDetails.push({
          targetIndex: enemies.indexOf(target),
          damage: 0,
          crit: false,
          multiplier: 1,
          trueDmg: 0
        })
        continue
      }
    }

    // 正常伤害计算
    const attackerSnap = {
      highHpBoost: skill.highHpBoost || 0,
      attack: player.getEffectiveAttack(),
      critRate: player.critRate,
      critDmg: player.critDmg,
      trueDmg: player.trueDmg,
      trueDmgPercent: player.trueDmgPercent || 0,
      element: skill.element || '',
      effects: player.effects || [],
      fireStackBonus: skill.fireStackBonus || 0,
    }
    player._lastSkillElement = skill.element || ''
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

    // 条件增伤
    let conditionalBonus = 1.0
    if (skill.effects?.some(e => e.type === 'shatter') && target.effects?.some(e => e.type === 'freeze')) {
      conditionalBonus *= 2.0
      target.removeEffect('freeze')
    }
    if (skill.effects?.some(e => e.type === 'freezeBonus') && target.effects?.some(e => e.type === 'freeze')) {
      conditionalBonus *= 1.5
      player._forceCritNext = true
    }
    if (skill.effects?.some(e => e.type === 'stunBonus') && target.effects?.some(e => e.type === 'stun')) {
      conditionalBonus *= 2.0
    }
    if (skill.effects?.some(e => e.type === 'stunCrit') && target.effects?.some(e => e.type === 'stun')) {
      player._forceCritNext = true
    }
    if (skill.effects?.some(e => e.type === 'executioner') && target.hp / target.maxHp < 0.3) {
      conditionalBonus *= 2.0
    }

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

    if (deathResult?.dodged) {
      result.messages.push(`${target.name} 闪避了攻击！`)
    }
    if (deathResult?.invulnerable) {
      result.messages.push(`${target.name} 免疫了所有伤害！`)
    }

    player._lastDamageDealt = damage

    checkElementReaction(engine, player, target, skill, result, damage);

    if (window.recordDamage) {
      window.recordDamage(damage, crit, shadowTrueDmg || 0)
    }

    // 龙焰印记
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

    // 暗蚀印记
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

    // 低血量印记吸血（保留基于伤害的公式，这是套装效果，不改）
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

    totalDamage += deathResult?.invulnerable ? 0 : damage

    // 死亡/复活处理
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

    // ========== 玩家吸血（基于自身最大生命值） ==========
    let buffLifesteal = 0
    player.effects?.forEach(e => {
      if (e.type === EFFECT_TYPES.LIFESTEAL_BUFF) buffLifesteal += (e.value || 0)
    })

    const totalLifesteal = (player.lifesteal || 0) + (player.specialLifestealPercent || 0) + buffLifesteal

    if (totalLifesteal > 0) {
      let drain = Math.floor(player.maxHp * totalLifesteal / 100)
      
      // AOE 技能吸血效率降低
      if (isAoeDamage) {
        drain = Math.floor(drain * 0.3)
      }
      
      // 重伤惩罚
      if (player.effects?.some(e => e.type === 'healReduction' || e.type === 'wounded')) {
        drain = Math.floor(drain * 0.3)
      }
      
      // 单次吸血上限：不超过最大生命值的 8%
  
      
      player.hp = Math.min(player.maxHp, player.hp + drain)
      result.hpDrain += drain
    }

    // 吸蓝（保持原逻辑）
    const totalMpLifesteal = (player.mpLifesteal || 0) + (player.specialMpLifestealPercent || 0)
    if (totalMpLifesteal > 0) {
      const drain = Math.floor(player.maxMp * totalMpLifesteal / 100)
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

  // 追加攻击
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

          if (extraTarget.hp <= 0 && !extraDeathResult?.deathSaved && !extraDeathResult?.revived) {
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

  // 技能附加效果
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