<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      
      <h2><Icon icon="mdi:skull-crossbones" /> 深渊副本</h2>
      <p class="hint">挑战强大的Boss，获得稀有材料与荣誉</p>

      <div class="raid-list">
        

        <!-- Boss 2：焚狱炎龙 -->
        <div class="raid-card" @click="enterRaid('boss_fire_dragon')">
          <div class="raid-header">
            <Icon icon="game-icons:sea-dragon" class="raid-icon" />
            <div class="raid-info">
              <h3 class="raid-boss-name">焚狱炎龙</h3>
              <span class="raid-level">21层难度 | 推荐等级 20+</span>
            </div>
            <span v-if="raidClears['boss_fire_dragon']" class="clear-badge">已通关</span>
          </div>
          <div class="raid-desc">
            龙骸套装材料的唯一来源。火属性攻击，建议携带水属性技能。
          </div>
          <div class="raid-rewards">
            <span class="reward-tag">龙鳞矿</span>
            <span class="reward-tag">秘银矿石</span>
            <span class="reward-tag">品质魔石 x3</span>
          </div>
          <div class="raid-enter">
            <Icon icon="mdi:sword-cross" /> 进入战斗
          </div>
        </div>



        <!-- Boss 1：永夜领主 -->
        <div class="raid-card" @click="enterRaid('boss_shadow_lord')">
          <div class="raid-header">
            <Icon icon="line-md:moon-twotone" class="raid-icon" />
            <div class="raid-info">
              <h3 class="raid-boss-name">永夜领主</h3>
              <span class="raid-level">21层难度 | 推荐等级 15+</span>
            </div>
            <span v-if="raidClears['boss_shadow_lord']" class="clear-badge">已通关</span>
          </div>
          <div class="raid-desc">
            暗影咒装材料的唯一来源。血量极高，暗影套的百分比真伤在此发挥最大价值。
          </div>
          <div class="raid-rewards">
            <span class="reward-tag">黑曜石</span>
            <span class="reward-tag">秘银矿石</span>
            <span class="reward-tag">品质魔石 x4</span>
          </div>
          <div class="raid-enter">
            <Icon icon="mdi:sword-cross" /> 进入战斗
          </div>
        </div>
        <!-- Boss 3：猩红暴君 -->
        <div class="raid-card" @click="enterRaid('boss_goblin_king')">
          <div class="raid-header">
            <Icon icon="mdi:blood" class="raid-icon" />
            <div class="raid-info">
              <h3 class="raid-boss-name">猩红暴君</h3>
              <span class="raid-level">21层难度 | 推荐等级 10+</span>
            </div>
            <span v-if="raidClears['boss_goblin_king']" class="clear-badge">已通关</span>
          </div>
          <div class="raid-desc">
            血怒套装材料的唯一来源。中期强力Boss，适合测试Build强度。
          </div>
          <div class="raid-rewards">
            <span class="reward-tag">金矿石</span>
            <span class="reward-tag">晶簇碎片</span>
            <span class="reward-tag">品质魔石 x2</span>
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

// ✅ 改为计算属性，实时读取 sessionStorage
const raidClears = computed(() => {
  if (!store.isStoryMode) {
    return {
      boss_goblin_king: false,
      boss_fire_dragon: false,
      boss_shadow_lord: false
    }
  }
  const saved = sessionStorage.getItem('story_raid_clears')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      return {
        boss_goblin_king: !!data.boss_goblin_king,
        boss_fire_dragon: !!data.boss_fire_dragon,
        boss_shadow_lord: !!data.boss_shadow_lord
      }
    } catch (e) {}
  }
  return {
    boss_goblin_king: false,
    boss_fire_dragon: false,
    boss_shadow_lord: false
  }
})

function enterRaid(bossId) {
  const template = store.config.monsterTemplates.find(m => m.id === bossId)
  if (!template) return

const raidMultiplier = {
    'boss_shadow_lord': { hp: 2.5, atk: 2.0, def: 1.6 },  // 现在它是15层Boss，保持高倍率
    'boss_fire_dragon': { hp: 3.0, atk: 2.2, def: 1.8 },  // 20层炎龙，强度提到最高
    'boss_goblin_king': { hp: 2.0, atk: 1.8, def: 1.4 },
    'boss_goblin_chief': { hp: 1.5, atk: 1.4, def: 1.2 }
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
    isRaidBoss: true,
    skills: JSON.parse(template.skillsText || '[]'),
  }

  store.dungeon.isRaidBattle = true
  store.dungeon.currentRaidBoss = bossId

  emit('startBattle', [monster])
  emit('close')
}
</script>

<style scoped>
/* 样式保持不变 */
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
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid #4caf50;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 8px;
  color: #4caf50;
  white-space: nowrap;
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