import { calculateDamage } from './damageCalculator';
import { EFFECT_TYPES } from './effectDefs';

class UnitState {
  constructor(baseStats, isPlayer = false) {
    this.isCompanion = baseStats.isCompanion || false;
    this.id = baseStats.id || 'unit';
    this.name = baseStats.name || '';
    this.isPlayer = isPlayer;
 this.isBoss = baseStats.isBoss || false;
  this.traits = baseStats.traits || [];
  // 向后兼容旧的字符串 trait
  if (typeof baseStats.trait === 'string' && baseStats.trait) {
    this.traits.push(baseStats.trait);
  }
  // 复活相关
  this.hasRevived = false;
  // 狂暴相关
  this.enrageTurn = baseStats.enrageTurn || 0;   // 可手动覆盖狂暴回合
  this.isEnraged = false;
    // 基础面板
    this.attack = baseStats.attack || baseStats.atk || 10;
    this.defense = baseStats.defense || baseStats.def || 5;
    this.speed = baseStats.speed || 10;
    this.critRate = baseStats.critRate || 5;
    this.critDmg = baseStats.critDmg || 150;
    this.trueDmg = baseStats.trueDmg || 0;
    this.icon = baseStats.icon || 'mdi:help-circle';   // 保留怪物图标
    this.hp = baseStats.hp ?? baseStats.maxHp;
    this.maxHp = baseStats.maxHp || 100;
    this.mp = baseStats.mp ?? baseStats.maxMp;
    this.maxMp = baseStats.maxMp || 30;
  this.level = baseStats.level || 1;
    // 吸血/吸蓝
    this.lifesteal = baseStats.lifesteal || 0;
    this.mpLifesteal = baseStats.mpLifesteal || 0;

    // 元素伤害加成映射
    this.elemDmg = {};
    const elems = ['fire','water','thunder','wind','grass','ice','holy','dark','rock','steel'];
    elems.forEach(e => { this.elemDmg[e] = baseStats[e + 'Dmg'] || 0; });

    // 效果列表
    this.effects = [];

    // 怪物专用：技能池解析
    this.skills = [];
    if (!isPlayer && baseStats.skillsText) {
      try {
        const parsed = typeof baseStats.skillsText === 'string'
          ? JSON.parse(baseStats.skillsText)
          : baseStats.skillsText;
        this.skills = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('解析怪物技能失败:', baseStats.skillsText, e);
        this.skills = [];
      }
    }

    // 保留原始模板信息用于奖励计算
    this.base = { ...baseStats };
  this.isCompanion = baseStats.isCompanion || false;
  }

  getEffectiveAttack() {
  let atk = this.attack;
  this.effects.forEach(eff => {
    if (eff.type === EFFECT_TYPES.ATK_UP) atk *= (1 + eff.value);
    else if (eff.type === EFFECT_TYPES.ATK_DOWN) atk *= (1 + eff.value);
    else if (eff.type === EFFECT_TYPES.WEAK) atk *= (1 + eff.value);  // 新增
  });
  return Math.max(1, Math.floor(atk));
}

  getEffectiveDefense() {
    let def = this.defense;
    this.effects.forEach(eff => {
      if (eff.type === EFFECT_TYPES.DEF_UP) def *= (1 + eff.value);
      else if (eff.type === EFFECT_TYPES.DEF_DOWN) def *= (1 + eff.value);
    });
    return Math.max(0, Math.floor(def));
  }
isStunned() { 
  return this.effects.some(e => e.type === EFFECT_TYPES.STUN || e.type === EFFECT_TYPES.FREEZE); 
}
  isSilenced() { return this.effects.some(e => e.type === EFFECT_TYPES.SILENCE); }

  getShield() {
    let shield = 0;
    this.effects.forEach(e => { if (e.type === EFFECT_TYPES.SHIELD) shield += e.value; });
    return shield;
  }
addEffect(effectDef) {
  const { type, duration, value, stackable, maxStacks, noRefresh } = effectDef;

  // 查找是否已存在同类型效果
  const existing = this.effects.find(e => e.type === type);

  // 如果设置了 noRefresh 且效果已存在，直接拒绝
  if (existing && noRefresh) {
    return false;
  }

  // 如果效果已存在（但没有 noRefresh 限制）
  if (existing) {
    if (stackable) {
      // 叠加型效果：增加层数，但不超过上限
      if (existing.stacks < (maxStacks || 99)) {
        existing.stacks += 1;
      }
      // 刷新持续时间
      existing.duration = duration;
      // 刷新效果值（新值覆盖旧值）
      existing.value = value || existing.value;
      return true;
    } else {
      // 非叠加型效果：先移除旧的
      this.removeEffect(type);
      // 然后往下走，添加新的
    }
  }

  // 添加全新效果
  this.effects.push({
    type,
    duration: duration || 0,
    value: value || 0,
    stacks: 1,
    noRefresh: !!noRefresh,
  });
  return true;
}




  
  removeEffect(type) { this.effects = this.effects.filter(e => e.type !== type); }

 onTurnEnd() {
  // 再生：每回合恢复生命
  this.effects.filter(e => e.type === EFFECT_TYPES.REGEN).forEach(e => {
    const heal = Math.floor(this.maxHp * (e.value || 0.08));
    this.hp = Math.min(this.maxHp, this.hp + heal);
  });

  // 流血：每回合损失生命
  this.effects.filter(e => e.type === EFFECT_TYPES.BLEED).forEach(e => {
    const dmg = Math.floor(this.maxHp * (e.value || 0.05));
    this.hp -= dmg;
    if (this.hp < 0) this.hp = 0;
  });

  // 原有逻辑
  this.effects.forEach(e => e.duration--);
  this.effects = this.effects.filter(e => e.duration > 0);
}

  takeDamage(rawDamage, attacker) {
      // 如果被冻结且受到攻击，额外伤害
  if (this.effects.some(e => e.type === EFFECT_TYPES.FREEZE) && attacker) {
    rawDamage = Math.floor(rawDamage * 1.3);  // 额外30%伤害
    this.removeEffect(EFFECT_TYPES.FREEZE);   // 冻结解除
  }
    let shield = this.getShield();
    let damage = rawDamage;
    if (shield > 0) {
      if (shield >= damage) {
        this.reduceShield(damage);
        damage = 0;
      } else {
        damage -= shield;
        this.removeEffect(EFFECT_TYPES.SHIELD);
      }
    }
  



    this.hp -= damage;
  if (this.hp <= 0) {
    // 检查复活特性
    if (this.traits.includes('revive') && !this.hasRevived) {
      this.hasRevived = true;
      this.hp = Math.floor(this.maxHp * 0.3);  // 复活 30% 血量
      return { damage, revived: true };  // 返回特殊标记
    }
  }
  
    // 反伤
    let reflectDmg = 0;
    this.effects.forEach(e => {
      if (e.type === EFFECT_TYPES.REFLECT) reflectDmg += damage * e.value;
    });
    if (reflectDmg > 0 && attacker) {
      attacker.takeDamage(Math.floor(reflectDmg));
    }
    return damage;
  }

  reduceShield(amount) {
    let remaining = amount;
    this.effects.forEach(e => {
      if (e.type === EFFECT_TYPES.SHIELD && remaining > 0) {
        if (e.value >= remaining) { e.value -= remaining; remaining = 0; }
        else { remaining -= e.value; e.value = 0; }
      }
    });
    this.effects = this.effects.filter(e => e.value > 0 || e.type !== EFFECT_TYPES.SHIELD);
  }
}

export class CombatEngine {

constructor(playerStats, enemies, companion = null) {
  this.player = new UnitState({ ...playerStats, isPlayer: true });
  this.companion = companion ? new UnitState({ ...companion, isCompanion: true }) : null;
  this.enemies = enemies.map(e => new UnitState({ ...e }));
  this.battleOver = false;
  this.winner = null;
 this.turnCount = 0;

}

endTurn() {
  this.turnCount++;
  
  // Boss 自动狂暴（默认第 4 回合，如果怪物有 enrageTurn 则优先）
  this.enemies.forEach(enemy => {
    if (enemy.isBoss && !enemy.isEnraged) {
      const triggerTurn = enemy.enrageTurn || 4;
      if (this.turnCount >= triggerTurn) {
        enemy.isEnraged = true;
        enemy.attack = Math.floor(enemy.attack * 1.5);
        // 战斗消息会由 BattleScene 在下次行动时显示
      }
    }
  });

  this.player.onTurnEnd();
  this.enemies.forEach(e => e.onTurnEnd());
}
executeCompanionAction() {
  if (!this.companion || this.companion.hp <= 0) return { messages: [] };

  const companion = this.companion;
  const messages = [];

  // 同伴被眩晕/冻结时跳过
  if (companion.isStunned()) {
    companion.removeEffect(EFFECT_TYPES.STUN);
    companion.removeEffect(EFFECT_TYPES.FREEZE);
    return { messages: [`${companion.name} 无法行动！`] };
  }

  // 简单的同伴 AI：优先治疗，然后攻击
  const playerHpPercent = this.player.hp / this.player.maxHp;
  
  // 玩家血量低于 40% 时尝试治疗
  if (playerHpPercent < 0.4 && companion.mp >= 5) {
    const heal = Math.floor(companion.getEffectiveAttack() * 0.5);
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    companion.mp -= 5;
    return { messages: [`${companion.name} 为你治疗了 ${heal} HP`] };
  }

  // 选择一个存活的敌人攻击
  const aliveEnemies = this.getAliveEnemies();
  if (aliveEnemies.length === 0) return { messages: [] };

  const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  
  // 同伴普攻
  const attackerSnap = {
    attack: companion.getEffectiveAttack(),
    critRate: companion.critRate || 5,
    critDmg: companion.critDmg || 150,
    trueDmg: companion.trueDmg || 0,
    element: companion.element || '',
  };
  const defenderSnap = {
    defense: target.getEffectiveDefense(),
    element: target.element || '',
  };

  const { damage, crit } = calculateDamage(attackerSnap, defenderSnap, {
    baseMul: 0.7,  // 同伴攻击倍率较低
    element: companion.element || '',
  });

  target.takeDamage(damage, companion);
  let msg = `${companion.name} 攻击了 ${target.name}，造成 ${damage} 伤害`;
  if (crit) msg += ' (暴击)';
  messages.push(msg);

  if (target.hp <= 0) {
    messages.push(`${target.name} 被击败！`);
    if (this.getAliveEnemies().length === 0) {
      this.battleOver = true;
      this.winner = 'player';
    }
  }

  return { messages };
}
  getAliveEnemies() { return this.enemies.filter(e => e.hp > 0); }

  // 技能效果应用
  applySkillEffects(source, target, effects) {
    const messages = [];
    if (!effects || !Array.isArray(effects)) return messages;

    effects.forEach(effDef => {
      const chance = effDef.chance ?? 100;
      if (Math.random() * 100 > chance) return;

      const value = effDef.value || 0;
      const duration = effDef.duration || 0;

      switch (effDef.type) {
case 'freeze':
  target.addEffect({
    type: EFFECT_TYPES.FREEZE,
    duration: duration || 1,
    value: value || 0,
    stackable: false,
  });
  messages.push(`${target.name} 被冻结了！`);
  break;
case 'bleed': 
  // 流血基于目标最大生命值的百分比，这里 value 是百分比（如 0.05 = 5%）
  const bleedPercent = value || 0.05
  const bleedDamage = Math.floor(target.maxHp * bleedPercent)
  target.addEffect({
    type: EFFECT_TYPES.BLEED,
    value: bleedPercent,        // 存储百分比，用于 onTurnEnd 计算
    duration: duration || 3,
    stackable: true,
    maxStacks: 5,
  })
  messages.push(`${target.name} 开始流血，每回合损失 ${bleedDamage} 点生命`)
  break;

case 'weak':
  target.addEffect({
    type: EFFECT_TYPES.WEAK,
    value: value || -0.3,
    duration: duration || 2,
    stackable: false,
  });
  messages.push(`${target.name} 陷入虚弱状态`);
  break;

case 'taunt':
  target.addEffect({
    type: EFFECT_TYPES.TAUNT,
    duration: duration || 2,
    stackable: false,
  });
  messages.push(`${target.name} 被嘲讽了！`);
  break;

case 'regen':
  source.addEffect({
    type: EFFECT_TYPES.REGEN,
    value: value || 0.08,
    duration: duration || 3,
    stackable: false,
  });
  messages.push(`${source.name} 获得再生效果`);
  break;

case 'lifestealBuff':
  source.addEffect({
    type: EFFECT_TYPES.LIFESTEAL_BUFF,
    value: value || 0.15,
    duration: duration || 3,
    stackable: false,
  });
  messages.push(`${source.name} 的吸血效果增强了`);
case 'dot': {
  // value 现在是倍率（如 0.3 表示攻击力×30%），不再是直接数值
  const dotDamage = Math.floor(source.getEffectiveAttack() * Math.min(value || 0.1, 1.0));
  const added = target.addEffect({
    type: EFFECT_TYPES.DOT,
    value: dotDamage,
    duration: duration,
    stackable: true,
    maxStacks: 3,
    noRefresh: effDef.noRefresh ?? false,
  });
  if (added) {
    messages.push(`${target.name} 被附加了持续伤害，每回合损失 ${dotDamage} 点生命，持续 ${duration} 回合`);
  }
  break;
}
        case 'heal':
          const healAmount = Math.floor(source.getEffectiveAttack() * value);
          source.hp = Math.min(source.maxHp, source.hp + healAmount);
          messages.push(`${source.name} 恢复了 ${healAmount} HP`);
          break;
        case 'buff':
          if (effDef.stat) {
            const buffType = effDef.stat + 'Up';
            if (EFFECT_TYPES[buffType]) {
              target.addEffect({
                type: EFFECT_TYPES[buffType],
                value: value,
                duration: duration,
                stackable: false,
              });
              messages.push(`${target.name} 的${effDef.stat}提升了`);
            }
          }
          break;
        case 'debuff':
          if (effDef.stat) {
            const debuffType = effDef.stat + 'Down';
            if (EFFECT_TYPES[debuffType]) {
              target.addEffect({
                type: EFFECT_TYPES[debuffType],
                value: value,
                duration: duration,
                stackable: false,
              });
              messages.push(`${target.name} 的${effDef.stat}降低了`);
            }
          }
          break;
        case 'shield':
          target.addEffect({
            type: EFFECT_TYPES.SHIELD,
            value: value,
            duration: duration,
            stackable: false,
          });
          messages.push(`${target.name} 获得了护盾`);
          break;
        default:
          break;
      }
    });

    return messages;
  }

executePlayerAction(skill, targetIndex) {
  if (this.battleOver) return null;

  const isAoeDamage = skill.target === 'aoe';
  const targets = isAoeDamage
    ? this.getAliveEnemies()
    : [this.enemies[targetIndex]].filter(t => t && t.hp > 0);

  if (targets.length === 0) return null;

  const result = {
    type: 'player_action',
    skill: skill.name,
    target: isAoeDamage ? '全体敌人' : targets[0].name,
    damage: 0,
    healing: 0,
    mpDrain: 0,
    hpDrain: 0,
    messages: [],
    crit: false,
    multiplier: 1,
  };

  if (this.player.isStunned()) {
    result.messages.push(`${this.player.name} 被眩晕，无法行动！`);
    this.player.removeEffect(EFFECT_TYPES.STUN);
    return result;
  }

  if (skill.mpCost > 0 && this.player.mp < skill.mpCost) {
    result.messages.push('MP不足！');
    return result;
  }
  this.player.mp -= skill.mpCost;

  if (skill.healMul) {
    const heal = Math.floor(this.player.getEffectiveAttack() * skill.healMul);
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    result.healing = heal;
    result.messages.push(`${this.player.name} 恢复了 ${heal} HP`);
    return result;
  }

  // 伤害计算
  let totalDamage = 0;
  for (const target of targets) {
    const attackerSnap = {
      attack: this.player.getEffectiveAttack(),
      critRate: this.player.critRate,
      critDmg: this.player.critDmg,
      trueDmg: this.player.trueDmg,
      element: skill.element || '',
    };
    if (skill.element) attackerSnap[skill.element + 'Dmg'] = this.player.elemDmg[skill.element] || 0;

    const defenderSnap = {
      defense: target.getEffectiveDefense(),
      element: target.element,
    };

    const { damage, crit, multiplier } = calculateDamage(attackerSnap, defenderSnap, skill);
    
    // 记录伤害前血量
    const hpBefore = target.hp;
    target.takeDamage(damage, this.player);
    totalDamage += damage;

    // 复活检查（每个目标独立）
    if (target.traits?.includes('revive') && !target.hasRevived && target.hp <= 0) {
      target.hasRevived = true;
      target.hp = Math.floor(target.maxHp * 0.3);
      result.messages.push(`${target.name} 复活了！`);
    }

    // 吸血吸蓝
    const actualHpLoss = Math.min(hpBefore + damage, damage);
    if (this.player.lifesteal > 0) {
      const drain = Math.floor(actualHpLoss * this.player.lifesteal / 100);
      if (drain > 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + drain);
        result.hpDrain += drain;
      }
    }
    if (this.player.mpLifesteal > 0) {
      const drain = Math.floor(actualHpLoss * this.player.mpLifesteal / 100);
      if (drain > 0) {
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + drain);
        result.mpDrain += drain;
      }
    }

    let msg;
    if (isAoeDamage) {
      msg = `${this.player.name} 使用${skill.name}，对 ${target.name} 造成 ${damage} 伤害`;
    } else {
      msg = `${this.player.name} 使用${skill.name}，造成 ${damage} 伤害`;
    }
    if (crit) msg += ' (暴击)';
    if (multiplier > 1) msg += ' 效果拔群！';
    if (multiplier < 1) msg += ' 效果不理想...';
    result.messages.push(msg);

    if (target === targets[0]) {
      result.crit = crit;
      result.multiplier = multiplier;
    }

    if (target.hp <= 0) result.messages.push(`${target.name} 被击败！`);
    if (this.getAliveEnemies().length === 0) {
      this.battleOver = true;
      this.winner = 'player';
      break;
    }
  }

  result.damage = totalDamage;

  // 追加攻击（三脚架效果，只对主目标一次）
  // 通用三脚架特殊动作处理（追加攻击、溅射等）
if (skill.extraActions && skill.extraActions.length > 0 && !this.battleOver) {
  for (const action of skill.extraActions) {
    if (action.note === '追加攻击') {
      const mainTarget = targets[0]
      if (!mainTarget || mainTarget.hp <= 0) continue
      const chance = action.chance || 100
      if (Math.random() * 100 < chance) {
        const mul = (action.value || 50) / 100
        const attackerSnap = {
          attack: this.player.getEffectiveAttack(),
          critRate: this.player.critRate,
          critDmg: this.player.critDmg,
          trueDmg: this.player.trueDmg,
          element: skill.element || '',
        }
        if (skill.element) attackerSnap[skill.element + 'Dmg'] = this.player.elemDmg[skill.element] || 0
        const defenderSnap = {
          defense: mainTarget.getEffectiveDefense(),
          element: mainTarget.element,
        }
        const { damage: extraDmg } = calculateDamage(attackerSnap, defenderSnap, {
          baseMul: skill.baseMul * mul,
          element: skill.element || ''
        })
        mainTarget.takeDamage(extraDmg, this.player)
        result.damage += extraDmg
        result.messages.push(`追加攻击造成 ${extraDmg} 点伤害`)
        if (mainTarget.hp <= 0) {
          result.messages.push(`${mainTarget.name} 被击败！`)
          if (this.getAliveEnemies().length === 0) {
            this.battleOver = true
            this.winner = 'player'
          }
        }
      }
    }
    // 未来可扩展：溅射（对相邻敌人造成伤害）、额外回合等
  }
}
  

  if (result.hpDrain > 0) result.messages.push(`合计吸取了 ${result.hpDrain} HP`);
  if (result.mpDrain > 0) result.messages.push(`合计吸取了 ${result.mpDrain} MP`);

  // 技能效果（AOE 与单体）
  if (skill.effects && skill.effects.length > 0) {
    for (const effDef of skill.effects) {
      if (effDef.target === 'aoe' || isAoeDamage) {
        for (const enemy of this.getAliveEnemies()) {
          const msgs = this.applySkillEffects(this.player, enemy, [effDef]);
          result.messages.push(...msgs);
        }
      } else {
        if (targets[0]) {
          const msgs = this.applySkillEffects(this.player, targets[0], [effDef]);
          result.messages.push(...msgs);
        }
      }
    }
  }

  // 最终检查
  for (const t of targets) {
    if (t.hp <= 0) result.messages.push(`${t.name} 被击败！`);
  }
  if (this.getAliveEnemies().length === 0) {
    this.battleOver = true;
    this.winner = 'player';
  }

  return result;
}
  executeEnemyTurn() {
    const results = [];


  // ---- 处理玩家身上的 DOT 效果 ----
  // 玩家 DOT 结算（只读，不改 duration）
  this.player.effects.forEach(eff => {
    if (eff.type === EFFECT_TYPES.DOT) {
      const dmg = eff.value || 0;
      this.player.takeDamage(dmg);
     results.push({ type: 'dot_tick', messages: [`持续伤害使 ${this.player.name} 损失了 ${dmg} 点生命`] });
    }
  });






    const alive = this.getAliveEnemies();
    for (const enemy of alive) {
      if (this.battleOver) break;
      if (enemy.isStunned()) {
        results.push({
          type: 'enemy_action',
          enemy: enemy.name,
          messages: [`${enemy.name} 被眩晕，无法行动！`],
        });
        enemy.removeEffect(EFFECT_TYPES.STUN);
        continue;
      }

      // ---- 怪物技能选择 ----
      let skill;
      if (enemy.skills && enemy.skills.length > 0) {
        const randomIdx = Math.floor(Math.random() * enemy.skills.length);
        skill = enemy.skills[randomIdx];
      } else {
        skill = { name: '攻击', baseMul: 1, element: enemy.element, mpCost: 0 };
      }

      const attackerSnap = {
        attack: enemy.getEffectiveAttack(),
        critRate: enemy.critRate,
        critDmg: enemy.critDmg,
        trueDmg: enemy.trueDmg,
      };
      if (skill.element) attackerSnap[skill.element + 'Dmg'] = enemy.elemDmg[skill.element] || 0;
      const defenderSnap = {
        defense: this.player.getEffectiveDefense(),
        element: this.player.element,
      };

      const { damage, crit, multiplier } = calculateDamage(attackerSnap, defenderSnap, skill);
      this.player.takeDamage(damage, enemy);

      let msg = `${enemy.name} 使用 ${skill.name}，造成 ${damage} 伤害`;
      if (crit) msg += ' (暴击)';

      const res = {
        type: 'enemy_action',
        enemy: enemy.name,
        damage,
        crit,
        multiplier,
        messages: [msg],
      };

      // 敌人技能效果
     if (skill.effects && skill.effects.length > 0) {
  for (const effDef of skill.effects) {
    if (effDef.target === 'aoe') {
      // 怪物全体效果：对玩家和同伴施加
      const targets = [this.player];
      if (this.companion && this.companion.hp > 0) targets.push(this.companion);
      for (const t of targets) {
        const msgs = this.applySkillEffects(enemy, t, [effDef]);
        res.messages.push(...msgs);
      }
    } else {
      const msgs = this.applySkillEffects(enemy, this.player, [effDef]);
      res.messages.push(...msgs);
    }
  }
}

      results.push(res);

      if (this.player.hp <= 0) {
        this.battleOver = true;
        this.winner = 'enemy';
        res.messages.push('玩家倒下了...');
        break;
      }
    }
    return results;
  }



  getRewards() {
    if (this.winner !== 'player') return { exp: 0, materials: [], accessories: [] };
    let exp = 0;
    const materials = [];
    this.enemies.forEach(e => {
      exp += e.base.exp || 30;
      if (e.base.material) materials.push(e.base.material);
    });
    return { exp, materials, accessories: [] };
  }




  
executePlayerDotTick() {
  const messages = [];
  this.player.effects.forEach(eff => {
    if (eff.type === EFFECT_TYPES.DOT) {
      const dmg = eff.value || 0;
      this.player.takeDamage(dmg);
      messages.push(`持续伤害使 ${this.player.name} 损失了 ${dmg} 点生命`);
    }
  });

  // 检查玩家是否被 DOT 杀死
  if (this.player.hp <= 0) {
    this.player.hp = 0;
    this.battleOver = true;
    this.winner = 'enemy';
    messages.push('玩家倒下了...');
  }

  return { type: 'dot_tick', messages };
}

// 执行单个敌人的行动（返回结果）
executeSingleEnemyAction(enemy) {
  if (enemy.isStunned()) {
    enemy.removeEffect(EFFECT_TYPES.STUN);
    return {
      type: 'enemy_action',
      enemy: enemy.name,
      messages: [`${enemy.name} 被眩晕，无法行动！`],
    };
  }

  // 随机选择攻击目标：玩家 或 存活的同伴
  const targets = [this.player];
  if (this.companion && this.companion.hp > 0) {
    targets.push(this.companion);
  }
  const target = targets[Math.floor(Math.random() * targets.length)];

  // 技能选择
  let skill;
  if (enemy.skills && enemy.skills.length > 0) {
    const randomIdx = Math.floor(Math.random() * enemy.skills.length);
    skill = enemy.skills[randomIdx];
  } else {
    skill = { name: '攻击', baseMul: 1, element: enemy.element, mpCost: 0 };
  }

  const attackerSnap = {
    attack: enemy.getEffectiveAttack(),
    critRate: enemy.critRate,
    critDmg: enemy.critDmg,
    trueDmg: enemy.trueDmg,
  };
  if (skill.element) attackerSnap[skill.element + 'Dmg'] = enemy.elemDmg[skill.element] || 0;
  const defenderSnap = {
    defense: target.getEffectiveDefense(),
    element: target.element,
  };

  const { damage, crit, multiplier } = calculateDamage(attackerSnap, defenderSnap, skill);
  target.takeDamage(damage, enemy);

  let msg = `${enemy.name} 使用 ${skill.name}，对 ${target.name} 造成 ${damage} 伤害`;
  if (crit) msg += ' (暴击)';

  const res = {
    type: 'enemy_action',
    enemy: enemy.name,
    damage,
    crit,
    multiplier,
    messages: [msg],
  };

   if (skill.effects && skill.effects.length > 0) {
    for (const effDef of skill.effects) {
      if (effDef.target === 'aoe') {
        // 敌人 AOE：对我方全体（玩家 + 存活的同伴）
        const targets = [this.player];
        if (this.companion && this.companion.hp > 0) targets.push(this.companion);
        for (const t of targets) {
          const msgs = this.applySkillEffects(enemy, t, [effDef]);
          res.messages.push(...msgs);
        }
      } else {
        // 单体效果
        const msgs = this.applySkillEffects(enemy, target, [effDef]);
        res.messages.push(...msgs);
      }
    }
  }

  // 检查目标死亡
  if (target === this.player && this.player.hp <= 0) {
    this.player.hp = 0;
    this.battleOver = true;
    this.winner = 'enemy';
    res.messages.push('玩家倒下了...');
  } else if (target === this.companion && this.companion.hp <= 0) {
    this.companion.hp = 0;
    res.messages.push(`${this.companion.name} 倒下了！`);
  }

  return res;
}
}


