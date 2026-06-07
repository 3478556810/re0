// src/store/modules/player.js
import { reactive, computed } from 'vue'

// 职业初始属性及成长配置
const CLASS_BASE_STATS = {
  wanderer: {
    hp: 800, mp: 80, attack: 30, defense: 18, speed: 12,
    growth: { hp: 150, mp: 15, attack: 6, defense: 6, speed: 1 }
  },
  warrior: {
    hp: 1000, mp: 60, attack: 35, defense: 25, speed: 10,
    growth: { hp: 200, mp: 10, attack: 8, defense: 8, speed: 1 }
  },
  mage: {
    hp: 600, mp: 150, attack: 40, defense: 12, speed: 12,
    growth: { hp: 100, mp: 30, attack: 10, defense: 3, speed: 2 }
  },
  ranger: {
    hp: 700, mp: 90, attack: 30, defense: 15, speed: 18,
    growth: { hp: 120, mp: 15, attack: 7, defense: 4, speed: 3 }
  },
  oracle: {
    hp: 900, mp: 120, attack: 20, defense: 20, speed: 10,
    growth: { hp: 180, mp: 25, attack: 4, defense: 8, speed: 1 }
  }
}

// 二转职业 → 对应一转（用于继承成长）
const ADVANCED_PARENT = {
  berserker: 'warrior',
  paladin: 'warrior',
  archmage: 'mage',
  elemental: 'mage',
  sniper: 'ranger',
  shadow: 'ranger'
}

function getClassConfig(className) {
  // 直接匹配
  if (CLASS_BASE_STATS[className]) return CLASS_BASE_STATS[className]
  // 二转继承父职业
  const parent = ADVANCED_PARENT[className]
  return parent ? CLASS_BASE_STATS[parent] : CLASS_BASE_STATS.wanderer
}

export function usePlayer() {
  // 初始职业默认为流浪者，因此用流浪者配置初始化
  const initCfg = getClassConfig('wanderer')
  
  const player = reactive({
    name: '冒险者', emoji: '',
    level: 1, exp: 0, gold: 500,
    class: 'wanderer', // 默认流浪者
    hp: initCfg.hp,
    maxHp: initCfg.hp,
    mp: initCfg.mp,
    maxMp: initCfg.mp,
    attack: initCfg.attack,
    defense: initCfg.defense,
    speed: initCfg.speed,
    luck: 5,
    critRate: 5, critDmg: 150,
    trueDmg: 0, lifesteal: 0,
    rank: '黑铁', rankExp: 0,
    stamina: 100, maxStamina: 100,
    waterDmg: 0, fireDmg: 0, thunderDmg: 0, windDmg: 0,
    grassDmg: 0, iceDmg: 0, holyDmg: 0, darkDmg: 0,
    steelDmg: 0, rockDmg: 0,
    skillPoints: 5,
    equippedSkills: ['normal_attack', 'fire_slash'],
    skills: {
      normal_attack: { unlocked: true, level: 1 },
      fire_slash: { unlocked: true, level: 1 }
    },
    tripodChoices: {},
    gems: {}
  })

  const worldLevel = computed(() => {
    const lv = player.level
    if (lv < 5) return 1
    if (lv < 10) return 2
    if (lv < 15) return 3
    if (lv < 20) return 4
    if (lv < 30) return 5
    return 6
  })

  function addExperience(exp, saveFn) {
    if (exp === 0) return
    player.exp += exp
    if (player.exp < 0) player.exp = 0
    let needExp = player.level * 100
    while (player.level > 0 && player.exp >= needExp) {
      player.exp -= needExp
      player.level++
      
      // 根据当前职业获取成长配置
      const cfg = getClassConfig(player.class)
      const g = cfg.growth
      player.maxHp += g.hp
      player.hp = player.maxHp
      player.maxMp += g.mp
      player.mp = player.maxMp
      player.attack += g.attack
      player.defense += g.defense
      player.speed += g.speed
      player.skillPoints = (player.skillPoints || 0) + 3
      
      needExp = player.level * 100
      if (player.exp < 0) player.exp = 0
    }
    if (saveFn) saveFn()
  }

  function addGold(amount, saveFn) {
    player.gold += amount
    if (saveFn) saveFn()
  }

  // 技能相关方法保持不变
  function getSkillById(skillPool, id) {
    return skillPool.find(s => s.id === id) || null
  }

  function getPlayerSkills(skillPool) {
    return player.equippedSkills
      .map(id => getSkillById(skillPool, id))
      .filter(Boolean)
  }

  function equipSkill(skillPool, skillId, saveFn) {
    if (player.equippedSkills.length >= 4) return false
    if (player.equippedSkills.includes(skillId)) return false
    const skill = getSkillById(skillPool, skillId)
    if (!skill) return false
    player.equippedSkills.push(skillId)
    if (saveFn) saveFn()
    return true
  }

  function unequipSkill(skillId, saveFn) {
    const idx = player.equippedSkills.indexOf(skillId)
    if (idx === -1) return false
    player.equippedSkills.splice(idx, 1)
    if (saveFn) saveFn()
    return true
  }

  function moveSkillUp(skillId, saveFn) {
    const idx = player.equippedSkills.indexOf(skillId)
    if (idx <= 0) return false
    const temp = player.equippedSkills[idx - 1]
    player.equippedSkills[idx - 1] = skillId
    player.equippedSkills[idx] = temp
    if (saveFn) saveFn()
    return true
  }

  function moveSkillDown(skillId, saveFn) {
    const idx = player.equippedSkills.indexOf(skillId)
    if (idx === -1 || idx >= player.equippedSkills.length - 1) return false
    const temp = player.equippedSkills[idx + 1]
    player.equippedSkills[idx + 1] = skillId
    player.equippedSkills[idx] = temp
    if (saveFn) saveFn()
    return true
  }

  return { player, worldLevel, addExperience, addGold, getPlayerSkills, equipSkill, unequipSkill, moveSkillUp, moveSkillDown }
}