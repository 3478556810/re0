<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      
      <h2><Icon icon="mdi:skull-crossbones" /> 深渊副本</h2>
      <p class="hint">挑战强大的Boss，获得稀有材料与荣誉</p>

      <div class="raid-list">
        <!-- Boss 1：角斗士·血斧 (10层) -->
        <div class="raid-card" @click="enterRaid('raid_gladiator')">
          <div class="raid-header">
            <Icon icon="mdi:axe-battle" class="raid-icon" />
            <div class="raid-info">
              <h3 class="raid-boss-name">角斗士·血斧</h3>
              <span class="raid-level">10层难度 | 推荐等级 10+</span>
            </div>
            <span v-if="raidClears['raid_gladiator']" class="clear-badge">已通关</span>
          </div>
          <div class="raid-desc">
            竞技场的霸主，击败可获得角斗士勋章和随机宝石。
          </div>
          <div class="raid-rewards">
            <span class="reward-tag">角斗士勋章</span>
            <span class="reward-tag">随机宝石</span>
            <span class="reward-tag">品质魔石 x3</span>
          </div>
          <div class="raid-enter">
            <Icon icon="mdi:sword-cross" /> 进入战斗
          </div>
        </div>

        <!-- Boss 2：炎核·熔岩巨像 (15层) -->
        <div class="raid-card" @click="enterRaid('raid_lava_core')">
          <div class="raid-header">
            <Icon icon="mdi:lava-lamp" class="raid-icon" />
            <div class="raid-info">
              <h3 class="raid-boss-name">炎核·熔岩巨像</h3>
              <span class="raid-level">15层难度 | 推荐等级 15+</span>
            </div>
            <span v-if="raidClears['raid_lava_core']" class="clear-badge">已通关</span>
          </div>
          <div class="raid-desc">
            熔岩之心的守护者，击败可获得冷却水晶和随机宝石。
          </div>
          <div class="raid-rewards">
            <span class="reward-tag">冷却水晶</span>
            <span class="reward-tag">随机宝石</span>
            <span class="reward-tag">品质魔石 x4</span>
          </div>
          <div class="raid-enter">
            <Icon icon="mdi:sword-cross" /> 进入战斗
          </div>
        </div>

        <!-- Boss 3：永夜主教 (20层) -->
        <div class="raid-card" @click="enterRaid('raid_bishop')">
          <div class="raid-header">
            <Icon icon="mdi:ghost" class="raid-icon" />
            <div class="raid-info">
              <h3 class="raid-boss-name">永夜主教</h3>
              <span class="raid-level">20层难度 | 推荐等级 20+</span>
            </div>
            <span v-if="raidClears['raid_bishop']" class="clear-badge">已通关</span>
          </div>
          <div class="raid-desc">
            暗影圣殿的主宰，击败可获得圣光碎片和随机宝石。
          </div>
          <div class="raid-rewards">
            <span class="reward-tag">圣光碎片</span>
            <span class="reward-tag">随机宝石</span>
            <span class="reward-tag">品质魔石 x5</span>
          </div>
          <div class="raid-enter">
            <Icon icon="mdi:sword-cross" /> 进入战斗
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close', 'startBattle'])

const raidClears = computed(() => {
  if (!store.isStoryMode) {
    return { raid_gladiator: false, raid_lava_core: false, raid_bishop: false }
  }
  const saved = sessionStorage.getItem('story_raid_clears')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      return {
        raid_gladiator: !!data.raid_gladiator,
        raid_lava_core: !!data.raid_lava_core,
        raid_bishop: !!data.raid_bishop
      }
    } catch (e) {}
  }
  return { raid_gladiator: false, raid_lava_core: false, raid_bishop: false }
})

function enterRaid(bossId) {
  const template = store.config.monsterTemplates.find(m => m.id === bossId)
  if (!template) return

const raidMultiplier = {
    'raid_gladiator': { hp: 2.0, atk: 1.3, def: 1.3 },
    'raid_lava_core': { hp: 2.0, atk: 1.5, def: 1.5 },
    'raid_bishop': { hp: 2.4, atk: 2.0, def: 1.8 },
}
  const mult = raidMultiplier[bossId] || { hp: 1.0, atk: 1.0, def: 1.0 }

 const monster = {
    ...template,
    level: 21,
    hp: Math.floor(template.baseHp * mult.hp),
    maxHp: Math.floor(template.baseHp * mult.hp),
    atk: Math.floor(template.baseAtk * mult.atk),
    def: Math.floor(template.baseDef * mult.def),
    icon: template.icon,
    element: template.element,
    isBoss: true,
    isRaidBoss: true,          // ← 确保这行存在
    skills: JSON.parse(template.skillsText || '[]'),
}

  store.dungeon.isRaidBattle = true
  store.dungeon.currentRaidBoss = bossId

  emit('startBattle', [monster])
  emit('close')
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel {
  width: 90vw; height: 85vh; max-width: 600px;
  background: rgba(15,25,45,0.95); border: 2px solid #b89a6a; border-radius: 24px;
  color: #ffd; font-family: 'Press Start 2P', cursive;
  padding: 24px; overflow-y: auto; position: relative;
}
.close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; color: #ffd; font-size: 20px; cursor: pointer; }
h2 { font-size: 18px; color: #ffd700; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
.hint { font-size: 10px; color: #aaa; margin-bottom: 20px; }
.raid-list { display: flex; flex-direction: column; gap: 12px; }
.raid-card {
  background: rgba(0,0,0,0.4); border: 1px solid rgba(184,154,106,0.3);
  border-radius: 16px; padding: 16px; cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.raid-card:hover { border-color: #ffd700; background: rgba(255,215,0,0.05); }
.raid-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.raid-icon { font-size: 36px; color: #ff4444; }
.raid-info { flex: 1; }
.raid-boss-name { font-size: 14px; color: #ff4444; margin: 0 0 4px 0; }
.raid-level { font-size: 9px; color: #ff9800; }
.clear-badge {
  background: rgba(76, 175, 80, 0.2); border: 1px solid #4caf50;
  border-radius: 6px; padding: 3px 8px; font-size: 8px; color: #4caf50; white-space: nowrap;
}
.raid-desc { font-size: 9px; color: #ccc; margin-bottom: 10px; line-height: 1.5; }
.raid-rewards { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
.reward-tag {
  background: rgba(255,215,0,0.15); border: 1px solid rgba(255,215,0,0.3);
  border-radius: 6px; padding: 3px 8px; font-size: 8px; color: #ffd700;
}
.raid-enter {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  background: rgba(255,100,0,0.15); border: 1px solid rgba(255,100,0,0.4);
  border-radius: 10px; padding: 10px; font-size: 10px; color: #ffa500;
  transition: all 0.2s;
}
.raid-enter:hover { background: rgba(255,100,0,0.3); }
</style>