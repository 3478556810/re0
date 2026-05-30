import { calculateDamage } from './damageCalculator';
import { EFFECT_TYPES } from './effectDefs';

class UnitState {
  constructor(baseStats, isPlayer = false) {
    this.id = baseStats.id || 'unit';
    this.name = baseStats.name || '';
    this.isPlayer = isPlayer;

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
  }

  getEffectiveAttack() {
    let atk = this.attack;
    this.effects.forEach(eff => {
      if (eff.type === EFFECT_TYPES.ATK_UP) atk *= (1 + eff.value);
      else if (eff.type === EFFECT_TYPES.ATK_DOWN) atk *= (1 + eff.value);
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

  isStunned() { return this.effects.some(e => e.type === EFFECT_TYPES.STUN); }
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
    this.effects.forEach(e => e.duration--);
    this.effects = this.effects.filter(e => e.duration > 0);
  }

  takeDamage(rawDamage, attacker) {
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
    if (this.hp < 0) this.hp = 0;
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
  constructor(playerStats, enemies) {
    this.player = new UnitState({ ...playerStats, isPlayer: true });
    this.enemies = enemies.map(e => new UnitState({ ...e }));
    this.battleOver = false;
    this.winner = null;
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
     case 'dot': {
  const dotDamage = Math.floor(source.getEffectiveAttack() * (value || 0.1));
  const added = target.addEffect({
    type: EFFECT_TYPES.DOT,
    value: dotDamage,
    duration: duration,          // 直接使用，不要修改
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
    const target = this.enemies[targetIndex];
    if (!target || target.hp <= 0) return null;

    const result = {
      type: 'player_action',
      skill: skill.name,
      target: target.name,
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

    // 治疗技能
    if (skill.healMul) {
      const heal = Math.floor(this.player.getEffectiveAttack() * skill.healMul);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      result.healing = heal;
      result.messages.push(`${this.player.name} 恢复了 ${heal} HP`);
      return result;
    }

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
    target.takeDamage(damage, this.player);
    result.damage = damage;
    result.crit = crit;
    result.multiplier = multiplier;

    let msg = `${this.player.name} 使用${skill.name}，造成 ${damage} 伤害`;
    if (crit) msg += ' (暴击)';
    if (multiplier > 1) msg += ' 效果拔群！';
    if (multiplier < 1) msg += ' 效果不理想...';
    result.messages.push(msg);

    // 吸血吸蓝（基于实际扣血量）
    const actualHpLoss = Math.min(target.hp + damage, damage);
    if (this.player.lifesteal > 0) {
      const drain = Math.floor(actualHpLoss * this.player.lifesteal / 100);
      if (drain > 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + drain);
        result.hpDrain = drain;
        result.messages.push(`吸取了 ${drain} HP`);
      }
    }
    if (this.player.mpLifesteal > 0) {
      const drain = Math.floor(actualHpLoss * this.player.mpLifesteal / 100);
      if (drain > 0) {
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + drain);
        result.mpDrain = drain;
        result.messages.push(`吸取了 ${drain} MP`);
      }
    }

    // 应用技能自带效果（例如 dot、buff 等）
    if (skill.effects && skill.effects.length > 0) {
      const effectMsgs = this.applySkillEffects(this.player, target, skill.effects);
      result.messages.push(...effectMsgs);
    }

    if (target.hp <= 0) result.messages.push(`${target.name} 被击败！`);
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
        const effectMsgs = this.applySkillEffects(enemy, this.player, skill.effects);
        res.messages.push(...effectMsgs);
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

  endTurn() {
    this.player.onTurnEnd();
    this.enemies.forEach(e => e.onTurnEnd());
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

  if (skill.effects && skill.effects.length > 0) {
    const effectMsgs = this.applySkillEffects(enemy, this.player, skill.effects);
    res.messages.push(...effectMsgs);
  }



  // 检查玩家是否死亡
  if (this.player.hp <= 0) {
    this.player.hp = 0;
    this.battleOver = true;
    this.winner = 'enemy';
    res.messages.push('玩家倒下了...');
  }

  return res;
}
}


