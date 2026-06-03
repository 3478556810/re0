import { EFFECT_TYPES } from '../effectDefs'

/**
 * 应用技能效果（纯函数，不修改引擎状态）
 * @param {UnitState} source - 施放者
 * @param {UnitState} target - 目标
 * @param {Array} effects - 效果定义数组
 * @returns {Array<string>} 消息列表
 */
export function applySkillEffects(source, target, effects, engine) {
  const messages = []
  if (!effects || !Array.isArray(effects)) return messages
  if (!source || !target) return messages

  effects.forEach(effDef => {
    const chance = effDef.chance ?? 100
    if (Math.random() * 100 > chance) return

    const value = effDef.value || 0
    const duration = effDef.duration || 0
    // 目标已死且效果不是自身增益则跳过
    if (target.hp <= 0 && !['shield', 'buff', 'heal', 'regen', 'lifestealBuff'].includes(effDef.type)) return

    switch (effDef.type) {



case 'reflect':
  // 为目标（可以是自己或全体）附加反伤效果
  source.addEffect({
    type: EFFECT_TYPES.REFLECT,
    value: value,
    duration: duration,
    stackable: false
  });
  messages.push(`${source.name} 获得反伤效果`);
  break;

case 'trueDmg':
  // ✅ 基于最近一次造成的伤害（需要从外部传入）
  const baseTrueDmg = source._lastDamageDealt || source.getEffectiveAttack()
  const trueDmgAmount = Math.floor(baseTrueDmg * (value || 0.15))
  target.hp = Math.max(0, target.hp - trueDmgAmount)
  messages.push(`造成 ${trueDmgAmount} 点真实伤害`)
  break

      case 'cleanseEnemy':
  // 清除敌人所有增益效果
  const buffTypes = [
    EFFECT_TYPES.ATK_UP, EFFECT_TYPES.DEF_UP, EFFECT_TYPES.SPD_UP,
    EFFECT_TYPES.SHIELD, EFFECT_TYPES.REGEN, EFFECT_TYPES.LIFESTEAL_BUFF
  ];
  buffTypes.forEach(type => source.removeEffect(type));
  messages.push(`${target.name} 的增益效果被清除了！`);
  break;
      case 'death':
  // 对非Boss敌人有概率即死
  if (!target.isBoss && !target.traits?.includes('revive')) {
    const deathChance = value || 20;
    if (Math.random() * 100 < deathChance) {
      target.hp = 0;
      messages.push(`${target.name} 被即死效果击杀！`);
    }
  } else {
    messages.push(`即死对Boss无效`);
  }
  break;
      case 'cleanse':
  // 移除所有减益效果
  const debuffTypes = [
    EFFECT_TYPES.ATK_DOWN, EFFECT_TYPES.DEF_DOWN, EFFECT_TYPES.SPD_DOWN,
    EFFECT_TYPES.DOT, EFFECT_TYPES.BLEED, EFFECT_TYPES.WEAK,
    EFFECT_TYPES.STUN, EFFECT_TYPES.FREEZE
  ];
  debuffTypes.forEach(type => source.removeEffect(type));
  messages.push(`${source.name} 的所有减益效果被净化了！`);
  break;
        case 'dotBurst': {
  // 基于目标当前中毒层数造成额外伤害，不清除层数
  const dotEffect = target.effects.find(e => e.type === EFFECT_TYPES.DOT);
  if (dotEffect) {
    const burstMultiplier = value; // 例如2.0表示每层2倍攻击力的伤害
    const burstDmg = Math.floor(source.getEffectiveAttack() * burstMultiplier * (dotEffect.stacks || 1));
    target.takeDamage(burstDmg, source);
    messages.push(`${target.name} 的毒素被引爆，造成 ${burstDmg} 点伤害！`);
  }
  break;
}
      case 'freeze':
        target.addEffect({ type: EFFECT_TYPES.FREEZE, duration: duration || 1, value: 0, stackable: false })
        messages.push(`${target.name} 被冻结了！`)
        break
      case 'stun':
        target.addEffect({ type: EFFECT_TYPES.STUN, duration: duration || 1, value: 0, stackable: false })
        messages.push(`${target.name} 被眩晕了！`)
        break
      case 'defDown':
        target.addEffect({ type: EFFECT_TYPES.DEF_DOWN, value, duration, stackable: false })
        messages.push(`${target.name} 的防御力降低了！`)
        break
      case 'bleed': {
        const bleedPercent = value || 0.05
        const bleedDamage = Math.floor(target.maxHp * bleedPercent)
        target.addEffect({ type: EFFECT_TYPES.BLEED, value: bleedPercent, duration: duration || 3, stackable: true, maxStacks: 5 })
        messages.push(`${target.name} 开始流血，每回合损失 ${bleedDamage} 点生命`)
        break
      }
      case 'weak':
        target.addEffect({ type: EFFECT_TYPES.WEAK, value: value || -0.3, duration: duration || 2, stackable: false })
        messages.push(`${target.name} 陷入虚弱状态`)
        break
      case 'taunt':
        target.addEffect({ type: EFFECT_TYPES.TAUNT, duration: duration || 2, stackable: false })
        messages.push(`${target.name} 被嘲讽了！`)
        break
      case 'regen':
        source.addEffect({ type: EFFECT_TYPES.REGEN, value: value || 0.08, duration: duration || 3, stackable: false })
        messages.push(`${source.name} 获得再生效果`)
        break
      case 'lifestealBuff':
        source.addEffect({ type: EFFECT_TYPES.LIFESTEAL_BUFF, value: value || 0.15, duration: duration || 3, stackable: false })
        messages.push(`${source.name} 的吸血效果增强了`)
        break
    case 'dot': {
  const dotDamage = Math.floor(source.getEffectiveAttack() * Math.min(value || 0.1, 1.0));
  const added = target.addEffect({
    type: EFFECT_TYPES.DOT,
    value: dotDamage,
    duration: duration,
    stackable: true,        // 强制叠加
    maxStacks: 9,           // 最大层数
    noRefresh: effDef.noRefresh ?? false,
  });
  if (added) {
    messages.push(`${target.name} 中毒加深，每回合损失 ${dotDamage} 点生命，持续 ${duration} 回合`);
  }
  break;
}
case 'heal':
  const healAmount = Math.floor(source.getEffectiveAttack() * value);
  if (effDef.target === 'all' && engine) {
    // 治疗施法者
    source.hp = Math.min(source.maxHp, source.hp + healAmount);
    messages.push(`${source.name} 恢复了 ${healAmount} HP`);
    // 治疗伙伴
    if (engine.companion && engine.companion.hp > 0) {
      engine.companion.hp = Math.min(engine.companion.maxHp, engine.companion.hp + healAmount);
      messages.push(`${engine.companion.name} 恢复了 ${healAmount} HP`);
    }
  } else {
    source.hp = Math.min(source.maxHp, source.hp + healAmount);
    messages.push(`${source.name} 恢复了 ${healAmount} HP`);
  }
  break;
case 'buff':
  if (effDef.stat) {
    let buffType = null;
    let statName = '';
    
    // 识别各种属性增益
    if (effDef.stat === 'atk') { buffType = EFFECT_TYPES.ATK_UP; statName = '攻击力'; }
    else if (effDef.stat === 'def') { buffType = EFFECT_TYPES.DEF_UP; statName = '防御力'; }
    else if (effDef.stat === 'speed') { buffType = EFFECT_TYPES.SPD_UP; statName = '速度'; }
    else if (effDef.stat === 'critRate') { buffType = 'critRateUp'; statName = '暴击率'; }
    else if (effDef.stat === 'critDmg') { buffType = 'critDmgUp'; statName = '暴击伤害'; }
     else if (effDef.stat === 'maxHp') { buffType = EFFECT_TYPES.MAXHP_UP; statName = '最大生命'; }   // 新增
    else if (effDef.stat === 'dodge') { buffType = EFFECT_TYPES.DODGE_UP; statName = '闪避率'; }       // 新增
    if (buffType) {
      // ✅ 如果目标是施法者自己，将增益加给自己
      const actualTarget = (effDef.target === 'self') ? source : target;
      actualTarget.addEffect({
        type: buffType,
        value: value,
        duration: duration,
        stackable: false
      });
      messages.push(`${actualTarget.name} 的${statName}提升了`);
    }
  }
  break;
case 'debuff':
  if (effDef.stat) {
    // ✅ 光之烙印单独处理
    if (effDef.stat === 'holyMark') {
      target.addEffect({
        type: 'holyMark',
        value: value,
        duration: duration,
        stackable: false
      });
      messages.push(`${target.name} 被光之烙印标记，受到伤害增加！`);
      break; // 跳出 switch
    }

    // 原有的 atk/def/speed 降益处理
    let statName = '', debuffType = null;
    if (effDef.stat === 'atk') { statName = '攻击力'; debuffType = EFFECT_TYPES.ATK_DOWN; }
    else if (effDef.stat === 'def') { statName = '防御力'; debuffType = EFFECT_TYPES.DEF_DOWN; }
    else if (effDef.stat === 'speed') { statName = '速度'; debuffType = EFFECT_TYPES.SPD_DOWN; }
    
    if (debuffType) {
      target.addEffect({ type: debuffType, value, duration, stackable: false });
      messages.push(`${target.name} 的${statName}降低了`);
    }
  }
  break;
  // 护盾改为叠加型：新护盾值加到已有护盾上
case 'shield':
  const shieldPercent = value || 0.15;
  const shieldValue = Math.floor(source.maxHp * shieldPercent);
  source.addEffect({
    type: EFFECT_TYPES.SHIELD,
    value: shieldValue,
    duration: duration,
    stackable: true,
    maxStacks: 99
  });
  messages.push(`${source.name} 获得了 ${shieldValue} 点护盾`);
  break;
      default: break
    }
  })
  return messages
}