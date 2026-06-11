import { useGameStore } from '@/store/gameStore'

export function createRaidMonster(bossId) {
  const store = useGameStore()
  const template = store.config.monsterTemplates?.find(m => m.id === bossId)
  if (!template) {
    console.error('找不到 Boss 模板:', bossId)
    return null
  }

  const raidMultiplier = {
    'raid_gladiator': { hp: 2.0, atk: 2.0, def: 1.3 },
    'raid_lava_core': { hp: 2.0, atk: 2.2, def: 1.5 },
    'raid_bishop': { hp: 2.4, atk: 2.8, def: 1.8 },
  }
  const mult = raidMultiplier[bossId] || { hp: 1.0, atk: 1.0, def: 1.0 }

  return {
    ...template,
    level: 21,
    hp: Math.floor(template.baseHp * mult.hp),
    maxHp: Math.floor(template.baseHp * mult.hp),
    atk: Math.floor(template.baseAtk * mult.atk),
    def: Math.floor(template.baseDef * mult.def),
    icon: template.icon,
    element: template.element,
    isBoss: true,
    isRaidBoss: true,
    skills: JSON.parse(template.skillsText || '[]'),
  }
}