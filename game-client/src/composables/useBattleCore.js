import { shallowRef, ref } from 'vue'
import { CombatEngine } from '@/combat/CombatEngine'
import { buildCompanionUnit } from './useBattleCompanion'
import { preloadMonsterVoices } from './useBattleAudio'
import { useGameStore } from '@/store/gameStore'

export function useBattleCore() {
  const store = useGameStore()
  const engine = shallowRef(null)
  const floatingNumbers = ref([])
  let floatId = 0

  function initEngine(enemiesInput) {
      // ★ 强制清理上一次战斗的全局引擎引用
if (engine.value) {
  engine.value.battleOver = true
  engine.value = null
}
if (window.__engine) {
  window.__engine.battleOver = true
  window.__engine = null
}
    if (!enemiesInput?.length) return false

    const companionActive = store.player.companionActive !== false
    const companionId = store.activeCompanionId || store.player.currentCompanion
    let companionUnit = null

    if (companionActive && companionId) {
      companionUnit = buildCompanionUnit(store, {
        attack: store.playerStats.attack || 10,
        defense: store.playerStats.defense || 5,
        maxHp: store.playerStats.maxHp || 100,
        maxMp: store.playerStats.maxMp || 30,
        speed: store.playerStats.speed || 10,
        critRate: store.playerStats.critRate || 5,
        critDmg: store.playerStats.critDmg || 150,
      strategy: store.companionStrategy,  // 从全局读取
      })
    }

    let stackingAtk = 0
    for (const aff of store.activeAffixEffects) {
      if (aff.bonus?.stackingAtk) stackingAtk += aff.bonus.stackingAtk
    }

    const fullPlayerStats = {
      ...store.playerStats,
      stackingAtk,
      isPlayer: true,
      talents: store.player.talents || {},
      mpCostReduction: store.playerStats.mpCostReduction || 0,
      mpOnHit: store.playerStats.mpOnHit || 0,
      mpOnKill: store.playerStats.mpOnKill || 0
    }

    const enrichedEnemies = enemiesInput.map(e => ({
      ...e,
      isBoss: e.isBoss ?? (e.base?.isBoss) ?? false,
      isRaidBoss: e.isRaidBoss ?? (e.base?.isRaidBoss) ?? false,
      level: e.level ?? (e.base?.level) ?? 1,
      exp: e.exp ?? ((e.level ?? (e.base?.level) ?? 1) * 10 + 5)
    }))

    engine.value = new CombatEngine(fullPlayerStats, enrichedEnemies, companionUnit, store.player.skills || {}, store.config)
    window.__engine = engine.value

    preloadMonsterVoices(enrichedEnemies.map(e => e.id))
    return true
  }

  function addFloatingNumber(targetIndex, amount, type = 'normal', offsetY = 0) {
    const id = ++floatId
    floatingNumbers.value.push({ id, targetIndex, amount, type, offsetY })
    setTimeout(() => {
      const idx = floatingNumbers.value.findIndex(f => f.id === id)
      if (idx !== -1) floatingNumbers.value.splice(idx, 1)
    }, 3000)
  }

  function syncStateFromEngine(store, enemiesRef, playerShieldRef, companionRef, playerEffectsRef) {
    

    const e = engine.value
    if (!e) return
    store.player.hp = e.player.hp
    store.player.mp = e.player.mp
    playerShieldRef.value = e.player.getShield()

    const originalEnemies = store.battleEnemies || []
    enemiesRef.value = e.enemies.map((enemy, idx) => {
      const original = originalEnemies[idx] || {}
      const shield = enemy.getShield ? enemy.getShield() : 0
      return {
        ...enemy,
        id: enemy.id,
        name: enemy.name || original.name || '未知敌人',
        hp: Math.max(0, enemy.hp),
        maxHp: enemy.maxHp,
        shield,
        element: enemy.element || original.element || '',
        icon: enemy.icon || original.icon || 'mdi:help-circle',
        level: enemy.level || original.level || 1,
        atk: enemy.attack,
        def: enemy.defense,
        effects: enemy.effects || [],
        isBoss: original.isBoss === true,
        isRaidBoss: original.isRaidBoss === true,
        speech: enemy.speech || ''
      }
    })

    if (e.companion) {
      const comp = e.companion
      const companionSave = store.companions?.find(c => c.id === store.activeCompanionId)
      const companionExp = companionSave?.exp || 0
      const companionLevel = companionSave?.level || 1
      const companionNextExp = Math.floor(100 * Math.pow(1.1, companionLevel - 1))
      const companionExpPercent = companionNextExp > 0 ? (companionExp / companionNextExp) * 100 : 0
      companionRef.value = {
        id: comp.id,
        name: comp.name,
        level: companionLevel,
        hp: Math.max(0, comp.hp),
        maxHp: comp.maxHp,
        mp: comp.mp || 0,
        maxMp: comp.maxMp || 0,
        exp: companionExp,
        nextExp: companionNextExp,
        expPercent: companionExpPercent,
        icon: comp.icon,
        effects: comp.effects || []
      }
    } else {
      companionRef.value = null
    }

    const EFFECT_NAMES = {
      atkUp: '攻击力', defUp: '防御力', spdUp: '速度',
      atkDown: '攻击力', defDown: '防御力', spdDown: '速度',
      critRateUp: '暴击率', critDmgUp: '暴击伤害',
      maxHpUp: '最大生命', dodgeUp: '闪避率',
      shield: '护盾', regen: '再生', dot: '中毒', bleed: '流血',
      stun: '眩晕', freeze: '冻结', silence: '沉默',
      reflect: '反伤', lifestealBuff: '吸血强化', holyAnthem: '神圣赞美诗',
      weak: '虚弱', taunt: '嘲讽',
      holyMark: '光之烙印', dragonMark: '龙焰印记', shadowMark: '暗蚀印记',
      element_mark: '元素印记'
    }

    playerEffectsRef.value = e.player.effects
      .filter(eff => eff.duration > 0)
      .map(eff => {
        const isDebuff = ['atkDown', 'defDown', 'spdDown', 'stun', 'freeze', 'silence', 'weak', 'dot', 'bleed'].includes(eff.type)
        const isMark = ['holyMark', 'dragonMark', 'shadowMark', 'element_mark'].includes(eff.type)
        const name = EFFECT_NAMES[eff.type] || eff.type
        let displayValue = ''
        if (eff.type === 'shield') displayValue = Math.floor(eff.value) + ' 点'
        else if (eff.type === 'stun' || eff.type === 'freeze' || eff.type === 'silence') displayValue = '控制'
        else if (eff.type === 'dot' || eff.type === 'bleed') {
          displayValue = Math.floor(eff.value * Math.pow(2, (eff.stacks || 1) - 1)) + ' 点/回合'
        } else {
          const val = eff.value || 0
          const percent = Math.abs(val * 100).toFixed(0)
          displayValue = (val >= 0 ? '+' : '-') + percent + '%'
        }
        return { ...eff, name, displayValue, isBuff: !isDebuff && !isMark, isDebuff, isMark }
      })

    store._refreshSetBonuses?.()
  }

function destroyEngine() {
    if (engine.value) {
        engine.value.battleOver = true
        engine.value = null  // ★ 关键：释放引用
    }
}

  return { engine, floatingNumbers, addFloatingNumber, initEngine, syncStateFromEngine, destroyEngine }
}