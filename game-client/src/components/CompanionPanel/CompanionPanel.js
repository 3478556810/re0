import { ref, computed, inject, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'
import SkillPanel from '@/components/SkillPanel.vue'
import TalentGrid from '@/components/class/TalentGrid.vue'

export default {
  name: 'CompanionPanel',
  components: { Icon, SkillPanel, TalentGrid },
  emits: ['close'],
  setup(props, { emit }) {
    const store = useGameStore()
    const showToast = inject('showToast', (msg) => alert(msg))
    const activeTab = ref('stats')
    const showSwitch = ref(false)

    const companionList = computed(() => store.companions || [])
    const activeCompanionId = computed(() => store.activeCompanionId)
    const currentCompanion = computed(() => {
      if (!activeCompanionId.value) return null
      return companionList.value.find(c => c.id === activeCompanionId.value)
    })

    // 伙伴技能点（直接读取存储的数值）
const companionSkillPoints = computed(() => {
  return store.player.skillPoints  // 直接使用玩家的技能点
})

    // 升级所需经验（和 companion.js 的公式保持一致）
    const nextExp = computed(() => {
      const level = currentCompanion.value?.level || 1
      return Math.floor(100 * Math.pow(1.1, level - 1))
    })

    const expPercent = computed(() => {
      const exp = currentCompanion.value?.exp || 0
      const max = nextExp.value
      return max > 0 ? (exp / max) * 100 : 0
    })

    const affectionPercent = computed(() => Math.min((currentCompanion.value?.affection || 0) / 1000 * 100, 100))
    const affectionTitle = computed(() => {
      const aff = currentCompanion.value?.affection || 0
      if (aff >= 800) return '誓约'
      if (aff >= 600) return '亲密'
      if (aff >= 400) return '信赖'
      if (aff >= 200) return '熟悉'
      return '相识'
    })
    const affectionBonus = computed(() => {
      const aff = currentCompanion.value?.affection || 0
      const lv = Math.floor(aff / 200)
      return { atk: lv * 5, def: lv * 3, hp: lv * 20, speed: lv * 2 }
    })

    const showCombatDetail = ref(false)

    const elements = [
      { key: 'fireDmg', name: '火', icon: 'mdi:fire' },
      { key: 'waterDmg', name: '水', icon: 'mdi:water-outline' },
      { key: 'thunderDmg', name: '雷', icon: 'mdi:lightning-bolt' },
      { key: 'windDmg', name: '风', icon: 'mdi:weather-windy' },
      { key: 'grassDmg', name: '草', icon: 'mdi:leaf' },
      { key: 'iceDmg', name: '冰', icon: 'mdi:snowflake' },
      { key: 'holyDmg', name: '圣', icon: 'mdi:brightness-7' },
      { key: 'darkDmg', name: '暗', icon: 'mdi:moon-waning-crescent' },
      { key: 'steelDmg', name: '钢', icon: 'mdi:cube-outline' },
      { key: 'rockDmg', name: '岩', icon: 'mdi:terrain' }
    ]

 const companionStats = computed(() => {
  const comp = currentCompanion.value
  if (!comp) return { atk:0, def:0, hp:0, mp:0, speed:0, critRate:5, critDmg:150, dodge:0, trueDmg:0,
    fireDmg:0, waterDmg:0, thunderDmg:0, windDmg:0, grassDmg:0, iceDmg:0, holyDmg:0, darkDmg:0, steelDmg:0, rockDmg:0 }

  const player = store.player
  const playerStats = store.playerStats
  const originalAttack = playerStats.attack || 10
  const originalDefense = playerStats.defense || 5
  const originalMaxHp = playerStats.maxHp || 100
  const originalMaxMp = playerStats.maxMp || 30
  const originalSpeed = playerStats.speed || 10
  const originalCritRate = playerStats.critRate || 5
  const originalCritDmg = playerStats.critDmg || 150

  const companionLevel = comp.level || 1
  const affectionLevel = comp.affection || 0
  const affectionBonusLv = Math.floor(affectionLevel / 200)

  const isHealer = ['archmage', 'elemental', 'paladin', 'oracle', 'seer'].includes(player.class)
  const isOracle = ['oracle', 'seer'].includes(player.class)
  const talents = player.talents || {}
  const hasSoulLink = isOracle && talents['o_keystone_link']
  const hasSoulResonance = isOracle && talents['s_keystone_link']
  const hasLifeConvert = isOracle && talents['o_life_convert']
  const hasDefConvert = isOracle && talents['o_def_convert']
  const hasLifePraise = isOracle && talents['s_notable_life']
  const hasSteelSong = isOracle && talents['s_notable_steel']

  let atkRate = isHealer ? 0.9 : 0.6
  let defRate = isHealer ? 0.7 : 0.4
  let hpRate  = isHealer ? 0.9 : 0.6

  if (hasSoulLink) { atkRate += 0.1; defRate += 0.1; hpRate += 0.1 }
  if (hasSoulResonance) { atkRate += 0.2; defRate += 0.2; hpRate += 0.2 }

  // 小节点：继承率提升
  if (talents['o_companion1']) { atkRate += 0.1; defRate += 0.1; hpRate += 0.1 }
  if (talents['s_companion4']) { atkRate += 0.15; defRate += 0.15; hpRate += 0.15 }

  // 自身基础 + 等级成长
  const selfBaseAtk = (comp.baseAtk || 25) + companionLevel * 3
  const selfBaseDef = (comp.baseDef || 12) + companionLevel * 2
  const selfBaseHp = (comp.baseHp || 200) + companionLevel * 20

  const inheritedAtk = Math.floor(originalAttack * atkRate)
  const inheritedDef = Math.floor(originalDefense * defRate)
  const inheritedHp = Math.floor(originalMaxHp * hpRate)

  let attack = selfBaseAtk + inheritedAtk + affectionBonusLv * 20
  let defense = selfBaseDef + inheritedDef + affectionBonusLv * 10
  let hp = selfBaseHp + inheritedHp + affectionBonusLv * 50
  let speed = originalSpeed + 5 + affectionBonusLv * 2
  let critRate = Math.floor(originalCritRate * 0.8)
  let critDmg = Math.floor(originalCritDmg * 0.8)

  // 基石额外继承
  if (isOracle) {
    let extraAtkRate = 0, extraDefRate = 0, extraHpRate = 0
    if (hasSoulLink) { extraAtkRate += 0.4; extraDefRate += 0.4; extraHpRate += 0.4 }
    if (hasSoulResonance) { extraAtkRate += 0.8; extraDefRate += 0.8; extraHpRate += 0.8 }
    attack += Math.floor(originalAttack * extraAtkRate)
    defense += Math.floor(originalDefense * extraDefRate)
    hp += Math.floor(originalMaxHp * extraHpRate)
  }

  // 伙伴攻击力% 乘算
  let finalAtkMult = 1.0
  if (talents['o_companion2']) finalAtkMult += 0.1
  if (talents['s_companion5']) finalAtkMult += 0.15
  attack = Math.floor(attack * finalAtkMult)

  // 伙伴暴伤固定值
  if (talents['o_companion3']) critDmg += 15
  if (talents['s_companion6']) critDmg += 20

  // 生命转化 / 生命礼赞
  // 生命转化 / 生命礼赞（削弱后）
if (hasLifeConvert) {
  const bonusAtkPct = Math.floor(originalMaxHp / 500) * 2   // 每500血+2%
  attack += Math.floor(attack * bonusAtkPct / 100)
}
if (hasLifePraise) {
  const bonusAtkPct = Math.floor(originalMaxHp / 500) * 3   // 每500血+3%
  attack += Math.floor(attack * bonusAtkPct / 100)
}

// 钢铁意志 / 钢铁圣歌（削弱后）
if (hasDefConvert) {
  const bonusCritDmg = Math.floor(originalDefense / 300) * 3 // 每300防+3%
  critDmg += bonusCritDmg
}
if (hasSteelSong) {
  const bonusCritDmg = Math.floor(originalDefense / 300) * 4 // 每300防+4%
  critDmg += bonusCritDmg
}
  return {
    atk: attack,
    def: defense,
    hp: hp,
    mp: Math.max(Math.floor(originalMaxMp * 0.6), 50),
    speed: speed,
    critRate: critRate,
    critDmg: critDmg,
    dodge: comp.dodge || 0,
    trueDmg: comp.trueDmg || 0,
    fireDmg: playerStats.fireDmg || 0,
    waterDmg: playerStats.waterDmg || 0,
    thunderDmg: playerStats.thunderDmg || 0,
    windDmg: playerStats.windDmg || 0,
    grassDmg: playerStats.grassDmg || 0,
    iceDmg: playerStats.iceDmg || 0,
    holyDmg: playerStats.holyDmg || 0,
    darkDmg: playerStats.darkDmg || 0,
    steelDmg: playerStats.steelDmg || 0,
    rockDmg: playerStats.rockDmg || 0
  }
})
    const companionTalentPoints = computed(() => {
      const aff = currentCompanion.value?.affection || 0
      const lv = Math.floor(aff / 200)
      return Math.max(0, lv - (currentCompanion.value?.talentSpent || 0))
    })

    const companionTalentNodes = computed(() => {
      const baseNodes = [
        { id: 'c_start', x: 50, y: 85, type: 'small', icon: 'mdi:circle-outline', name: '羁绊起点', effect: '伙伴之路', cost: 0, connections: [] },
        { id: 'c_atk1', x: 40, y: 78, type: 'small', icon: 'mdi:sword', name: '协力', effect: '伙伴攻击 +8%', cost: 1, connections: ['c_start'] },
        { id: 'c_atk2', x: 30, y: 72, type: 'small', icon: 'mdi:sword', name: '猛攻', effect: '伙伴攻击 +8%', cost: 1, connections: ['c_atk1'] },
        { id: 'c_notable_atk', x: 22, y: 65, type: 'notable', icon: 'mdi:axe-battle', name: '惩戒光环', effect: '伙伴生命高于80%时<br/>伤害 +40%', cost: 2, connections: ['c_atk2'] },
        { id: 'c_def1', x: 60, y: 78, type: 'small', icon: 'mdi:shield', name: '铁壁', effect: '伙伴防御 +10%', cost: 1, connections: ['c_start'] },
        { id: 'c_def2', x: 70, y: 72, type: 'small', icon: 'mdi:shield', name: '守护', effect: '伙伴防御 +10%', cost: 1, connections: ['c_def1'] },
        { id: 'c_notable_def', x: 78, y: 65, type: 'notable', icon: 'mdi:shield-star', name: '牺牲', effect: '玩家受到致命伤害时<br/>伙伴免疫该伤害<br/>每场战斗1次', cost: 2, connections: ['c_def2'] },
        { id: 'c_heal1', x: 50, y: 72, type: 'small', icon: 'mdi:heart', name: '治愈强化', effect: '伙伴受到治疗 +15%', cost: 1, connections: ['c_start'] },
        { id: 'c_heal2', x: 50, y: 64, type: 'small', icon: 'mdi:heart-pulse', name: '圣光谐振', effect: '伙伴造成伤害时<br/>20%概率回复玩家5% MP', cost: 2, connections: ['c_heal1'] }
      ]
      return baseNodes.map(n => ({
        ...n,
        allocated: currentCompanion.value?.talents?.[n.id] || false
      }))
    })

    function onCompanionTalentAllocate(node) {
      const comp = currentCompanion.value
      if (!comp) return
      if (companionTalentPoints.value < node.cost) { showToast('天赋点不足'); return }
      if (!comp.talents) comp.talents = {}
      comp.talents[node.id] = true
      comp.talentSpent = (comp.talentSpent || 0) + node.cost
      store.save()
      showToast(`${node.name} 已激活`)
    }

    function selectCompanion(id) {
      store.activeCompanionId = id
      store.save()
      showSwitch.value = false
    }

    function ensureCompanions() {
      if (store.companions && store.companions.length > 0) {
        if (!store.activeCompanionId && store.companions.length > 0) {
          store.activeCompanionId = store.companions[0].id
          store.save()
        }
        return
      }

      const chars = store.config?.characters || {}
      if (Object.keys(chars).length === 0) {
        setTimeout(() => ensureCompanions(), 500)
        return
      }

      const list = []
      for (const [id, char] of Object.entries(chars)) {
        if (id === 'hero' || id === 'player') continue
        list.push({
          id,
          name: char.name || id,
          icon: char.icon || 'mdi:account-heart',
          baseHp: char.baseHp || 200,
          baseMp: char.baseMp || 50,
          baseAtk: char.baseAttack || 25,
          baseDef: char.baseDefense || 12,
          baseSpeed: char.baseSpeed || 14,
          level: 1,
          exp: 0,
          affection: 100,
          skillPoints: 5,        // 初始技能点
          skills: {},
          skillSlots: {},
          skillSpent: 0,
          talents: {},
          talentSpent: 0,
          tripodChoices: {}
        })
      }

      if (list.length > 0) {
        store.companions = list
        store.activeCompanionId = list[0].id
        store.save()
      }
    }

    onMounted(() => {
      ensureCompanions()
    })

    return {
      activeTab, showSwitch,
      companionList, activeCompanionId, currentCompanion,
      nextExp, expPercent,
      affectionPercent, affectionTitle, affectionBonus,
      companionStats,
      companionTalentPoints,
      companionTalentNodes,
      companionSkillPoints,          // 关键：暴露技能点
      showCombatDetail,
      elements,
      selectCompanion, onCompanionTalentAllocate
    }
  }
}