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

case 'burn':
  target.addEffect({
    type: EFFECT_TYPES.BURN,
    value: effDef.value || 0.2,
    duration: effDef.duration || 3,
    stackable: effDef.stackable ?? true,
    maxStacks: effDef.maxStacks || 99,
    casterAttack: source.getEffectiveAttack()
  });
  break;

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
  const trueDmg = Math.floor(source.getEffectiveAttack() * (value || 0.1));
  target.takeDamage(trueDmg, source);
  // ✅ 临时存储真伤值，供 playerAction 读取
  if (!source._pendingTrueDmg) source._pendingTrueDmg = 0;
  source._pendingTrueDmg += trueDmg;
  messages.push(`造成 ${trueDmg} 点真实伤害`);
  break;

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
  // 支持引爆中毒(dot)和灼烧(burn)两种持续伤害
  let targetEffect = target.effects.find(e => e.type === EFFECT_TYPES.DOT);
  let effectType = 'dot';
  
  // 如果没有中毒，尝试找灼烧
  if (!targetEffect) {
    targetEffect = target.effects.find(e => e.type === EFFECT_TYPES.BURN);
    effectType = 'burn';
  }
  
  if (targetEffect) {
    const stacks = targetEffect.stacks || 1;
    const burstMultiplier = value; // 技能配置里的 value，如 1.5 或 2.0
    
    let burstDmg = 0;
    if (effectType === 'dot' && targetEffect.isPercentHp) {
      // 中毒引爆：每层造成目标最大生命值 × 配置倍率 的伤害
      burstDmg = Math.floor(target.maxHp * burstMultiplier * stacks / 100);
    } else if (effectType === 'burn') {
      // 灼烧引爆：每层造成施法者攻击力 × 灼烧倍率 × 引爆倍率 的伤害
      const atk = targetEffect.casterAttack || source.getEffectiveAttack();
      burstDmg = Math.floor(atk * (targetEffect.value || 0.2) * burstMultiplier * stacks);
    } else {
      // 旧版 Dot：基于攻击力的固定倍率
      burstDmg = Math.floor(source.getEffectiveAttack() * burstMultiplier * stacks);
    }
    
    target.takeDamage(burstDmg, source);
    
    // 引爆后清除层数
    target.removeEffect(effectType === 'dot' ? EFFECT_TYPES.DOT : EFFECT_TYPES.BURN);
    
    messages.push(`引爆了目标身上的${effectType === 'dot' ? '中毒' : '灼烧'}，造成 ${burstDmg} 点伤害！`);
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



        // ===== 新增三脚架效果 =====

// 斩杀：对低血量目标额外增伤（通过 attacker 字段传递到 damageCalculator）
case 'executioner':
  // 挂载到 source 的临时字段上，damageCalculator 会读取
  if (!source._pendingExecutioner) source._pendingExecutioner = 0
  source._pendingExecutioner = Math.max(source._pendingExecutioner, value || 1.0)
  break



// 碎冰：对冻结目标造成额外伤害（挂载到 source 上，damageCalculator 读取）
case 'shatter':
  if (!source._pendingShatter) source._pendingShatter = 0
  source._pendingShatter = Math.max(source._pendingShatter, value || 1.0)
  break

// 冻结追击：对冻结目标必暴且增伤（挂载到 source 上，damageCalculator 读取）
case 'freezeBonus':
  if (!source._pendingFreezeBonus) source._pendingFreezeBonus = 0
  source._pendingFreezeBonus = Math.max(source._pendingFreezeBonus, value || 0.5)
  break

// 眩晕追击：对眩晕目标增伤（挂载到 source 上，damageCalculator 读取）
case 'stunBonus':
  if (!source._pendingStunBonus) source._pendingStunBonus = 0
  source._pendingStunBonus = Math.max(source._pendingStunBonus, value || 1.0)
  break

// 眩晕必暴：对眩晕目标必定暴击（挂载到 source 上，damageCalculator 读取）
case 'stunCrit':
  if (!source._pendingStunCrit) source._pendingStunCrit = false
  source._pendingStunCrit = true
  break

// 牺牲生命换取 Buff（直接执行）
case 'sacrifice':
  const sacrificeHp = Math.floor(source.maxHp * (value || 0.2))
  source.hp = Math.max(1, source.hp - sacrificeHp)
  messages.push(`${source.name} 牺牲了 ${sacrificeHp} 点生命`)
  break

// 清除所有 DOT 和流血效果
case 'cleanseDot':
  source.removeEffect(EFFECT_TYPES.DOT)
  source.removeEffect(EFFECT_TYPES.BLEED)
  source.removeEffect(EFFECT_TYPES.BURN)
  messages.push(`${source.name} 清除了所有持续伤害效果`)
  break

// 速度转攻击力（刻印已有此逻辑，这里补充技能版本）
case 'speedToAtk':
  const conversionRate = value || 10.0;  // 默认 1000% 转化率
  const extraAtk = Math.floor(source.speed * conversionRate);
  if (!source._speedToAtkBonus) source._speedToAtkBonus = 0;
  source._speedToAtkBonus += extraAtk;
  source.attack += extraAtk;
  messages.push(`${source.name} 的速度转化为 +${extraAtk} 攻击力！`);
  break;
      case 'lifestealBuff':
        source.addEffect({ type: EFFECT_TYPES.LIFESTEAL_BUFF, value: value || 0.15, duration: duration || 3, stackable: false })
        messages.push(`${source.name} 的吸血效果增强了`)
        break
case 'dot':
  const isPercentHp = effDef.note && effDef.note.includes('最大生命值');
  target.addEffect({
    type: EFFECT_TYPES.DOT,
    value: effDef.value || 0.15,
    duration: effDef.duration || 3,
    stackable: effDef.stackable ?? true,
    maxStacks: effDef.maxStacks || 99,
    isPercentHp: isPercentHp,   // ← 只有毒系才会是 true，火焰斩的 note 不含"最大生命值"
    animClass: 'dot-damage'
  });
  break;
case 'heal':
  const healAmount = Math.floor(source.getEffectiveAttack() * value);
  
  if (effDef.target === 'all' && engine) {
    // 治疗施法者
    source.hp = Math.min(source.maxHp, Math.floor(source.hp + healAmount));
    // 治疗伙伴
    if (engine.companion && engine.companion.hp > 0) {
      engine.companion.hp = Math.min(engine.companion.maxHp, Math.floor(engine.companion.hp + healAmount));
    }
  } else {
    source.hp = Math.min(source.maxHp, Math.floor(source.hp + healAmount));
  }
  
  // ========== 关键修复：圣光灌注 + 神圣赞美诗 + 回蓝 ==========
  const talents = source.talents || {};
  const companionTarget = (effDef.target === 'all' && engine?.companion) ? engine.companion : target;
  
  // 检查目标是否是伙伴
  if (companionTarget && companionTarget.isCompanion) {
    // 圣光灌注
companionTarget.addEffect({
  type: 'holyAnthem',
  atkPercent: 40,
  critDmgPercent: 100,
  duration: 4,
  stackable: false
});
    
    // 神圣赞美诗
companionTarget.addEffect({
  type: 'holyAnthem',
  atkPercent: 50,
  critDmgPercent: 120,
  duration: 4,
  stackable: false
});
    
    // 智慧之泉（治疗时回复3% MP）
    if (talents['o_notable_mp']) {
      const regen = Math.floor(source.maxMp * 0.03);
      source.mp = Math.min(source.maxMp, source.mp + regen);
    }
    
    // 神启（治疗时回复4% MP）
    if (talents['s_notable_mp']) {
      const regen = Math.floor(source.maxMp * 0.04);
      source.mp = Math.min(source.maxMp, source.mp + regen);
    }
  }
  
  // ========== 不再播报治疗消息（避免刷屏） ==========
  // 如果需要保留消息但缩短，可以只保留极简提示
  // messages.push(`${source.name} 恢复了 ${healAmount} HP`);
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