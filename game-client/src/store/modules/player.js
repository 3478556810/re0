import { reactive, computed, ref } from 'vue'

export function usePlayer() {
  const player = reactive({
    name: '冒险者', emoji: '',
    level: 1, exp: 0, gold: 500,
    class: '流浪者',
 hp: 500, maxHp: 500,      // 从80提高到500
mp: 80, maxMp: 80,         // 从50提高到80
attack: 30, defense: 18,   // 攻击力微调，防御力上调到18（配合防御系数1.0会有明显减伤）
speed: 12, luck: 5,
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
    tripodChoices: {}
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
  player.maxHp += 80            // 每级+80，配合500基础，20级≈2100 HP
player.maxMp += 15            // 每级+15
player.hp = player.maxHp
player.mp = player.maxMp
player.attack += 6            // 攻击成长稍高，弥补装备差距
player.defense += 6           // 防御成长也提上来，让裸装也有坦度
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

  // 技能相关方法
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