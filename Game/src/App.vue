<template>
  <div id="game-root">
<!-- 全局浮动提示 -->
<Transition name="fade">
  <div v-if="globalToast.visible" class="global-toast">{{ globalToast.message }}</div>
</Transition>
<!-- 自定义确认弹窗 -->
<div v-if="confirmDialog.visible" class="confirm-overlay">
  <div class="confirm-box pixel-panel">
    <p>{{ confirmDialog.message }}</p>
    <div class="confirm-buttons">
      <button class="pixel-btn small primary" @click="onConfirmOk">确定</button>
      <button class="pixel-btn small" @click="onConfirmCancel">取消</button>
    </div>
  </div>
</div>
   <!-- <audio ref="bgmAudio" volume="0.5"></audio> -->


    <MainScreen
      v-if="!inBattle"
      @start-battle="onStartBattle"
    />




<BattleScene
  v-else
  :key="battleKey"
  :enemies="currentEnemies"
  :storyBattle="!!storyBattleConfig"
  @victory="onVictory"
  @defeat="onBattleDefeat"
  @flee="onBattleExit"
  @exit="onBattleExit"
  @nextFloor="onNextFloor"
  @retreatToDungeon="() => { inBattle = false; store.pendingDungeonPanel = true }"
/>
  </div>
</template>

<script setup>
import { ref, reactive, provide, onMounted, onUnmounted, watch } from 'vue'
import MainScreen from './components/MainScreen.vue'
import BattleScene from './components/BattleScene.vue'
import { useGameStore } from './store/gameStore'
import { spawnEnemy } from './config/biomeConfig'
const confirmDialog = reactive({ visible: false, message: '', resolve: null })

function showConfirm(msg) {
  return new Promise((resolve) => {
    confirmDialog.message = msg
    confirmDialog.visible = true
    confirmDialog.resolve = resolve
  })
}

function onConfirmOk() {
  confirmDialog.visible = false
  if (confirmDialog.resolve) confirmDialog.resolve(true)
}

function onConfirmCancel() {
  confirmDialog.visible = false
  if (confirmDialog.resolve) confirmDialog.resolve(false)
}

// 提供给子组件使用
provide('showConfirm', showConfirm)
const globalToast = reactive({ visible: false, message: '' })
let toastTimer = null

function showToast(msg) {
  globalToast.message = msg
  globalToast.visible = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    globalToast.visible = false
  }, 2000)
}
window.showToast = showToast

// 暴露给全局使用
provide('showToast', showToast)
// ========== BGM 管理 ==========
const bgmAudio = ref(null)

// 音乐列表（文件名，放在 public/audio/ 下）
const bgmFiles = ['AspiralMoon.mp3', 'Bamboo.mp3', 'CopyMemory.mp3']

const currentTrackIndex = ref(0)               // 当前播放的索引
const isAutoRandom = ref(true)                 // 是否自动随机切歌

// 随机获取下一首（不同索引）
function getRandomTrack() {
  if (bgmFiles.length <= 1) return 0
  let idx = Math.floor(Math.random() * bgmFiles.length)
  if (idx === currentTrackIndex.value) {
    idx = (idx + 1) % bgmFiles.length
  }
  return idx
}
const bgmMuted = ref(sessionStorage.getItem('bgm_muted') === '1')
// 自动下一首（自动模式时使用）
function playNextBgm() {



   if (bgmMuted.value) return   // 静音时不播放
  
  if (!bgmAudio.value || !isAutoRandom.value) return
  const nextIndex = getRandomTrack()
  currentTrackIndex.value = nextIndex
  bgmAudio.value.src = '/audio/' + bgmFiles[nextIndex]
  bgmAudio.value.play().catch(() => {})
}
// 暴露给 MainScreen 使用
provide('bgmMuted', bgmMuted)
// 手动切歌（可从外部调用）
function playTrack(index) {
  if (bgmMuted.value) return
  if (!bgmAudio.value || index < 0 || index >= bgmFiles.length) return
  currentTrackIndex.value = index
  isAutoRandom.value = false          // 手动选歌时关闭自动随机
  bgmAudio.value.src = '/audio/' + bgmFiles[index]
  bgmAudio.value.play().catch(() => {})
  // 当前歌曲放完后恢复自动随机
  bgmAudio.value.onended = () => {
    isAutoRandom.value = true
    playNextBgm()
  }
}

// 恢复自动随机
function resumeAutoRandom() {

  if (bgmMuted.value) return
  isAutoRandom.value = true
  playNextBgm()
}

// 挂载时设置 ended 监听
onMounted(() => {

  const bgmMuted = ref(true)  // 改为 true，默认关闭
  if (bgmAudio.value) {
    bgmAudio.value.onended = () => playNextBgm()
  }
  
  // 首次用户交互后激活音频
  const activateAudio = () => {
    if (bgmAudio.value) {
      playNextBgm()
    }
    document.removeEventListener('click', activateAudio)
  }
  document.addEventListener('click', activateAudio)
})

const battleKey = ref(0)
const store = useGameStore()
const inBattle = ref(false)
const currentEnemies = ref([])

// 剧情战斗相关
const storyBattleConfig = ref(null)    // { enemies, winNext, loseNext, fleeNext }
const storyNodeBeforeBattle = ref(null) // 触发战斗前的剧情节点ID（保留，未用但可记录）

// 后备生成函数
function fallbackSpawnEnemy(template, playerLevel) {
  const lv = Math.floor(Math.random() * 3) + 1
  const material = template.material ? { ...template.material } : { id: 'unknown', name: '未知材料' }
  if (!material.name) material.name = material.id
  return {
    ...template,
    level: lv,
    hp: (template.baseHp || 30) + lv * 5,
    maxHp: (template.baseHp || 30) + lv * 5,
    atk: (template.baseAtk || 10) + lv * 2,
    def: (template.baseDef || 5) + lv,
    exp: 20 + lv * 10,
    gold: 0,
    material: material
  }
}

// 全局时间流逝
let timeInterval



onMounted(() => {
  // 仅在非开发环境启用强制全屏
  if (!import.meta.env.DEV) {
    // 标记全屏状态
    const setFullscreenState = () => {
      isFullscreen.value = !!document.fullscreenElement
    }

    // 进入全屏
    const requestFullscreen = () => {
      document.documentElement.requestFullscreen?.().catch(() => {})
    }

    // 首次用户交互时立即进入全屏
    const onFirstInteraction = () => {
      requestFullscreen()
      document.removeEventListener('click', onFirstInteraction)
      document.removeEventListener('touchstart', onFirstInteraction)
    }
    document.addEventListener('click', onFirstInteraction)
    document.addEventListener('touchstart', onFirstInteraction)

    // 监听全屏状态变化，退出全屏后再次显示全屏按钮
    document.addEventListener('fullscreenchange', setFullscreenState)
    document.addEventListener('webkitfullscreenchange', setFullscreenState)

    // 可选：如果用户退出全屏，可以自动弹出全屏按钮，但重新进入仍需用户手势
    // 因此建议在界面上保留一个明显的全屏按钮（仅在非全屏时显示）
  }

  // 页面刷新后，清理可能残留的战斗状态
  if (!inBattle.value) {
    storyBattleConfig.value = null
    storyNodeBeforeBattle.value = null
    store.pendingStoryNodeAfterBattle = null
    sessionStorage.removeItem('storyBattleConfig')
  }

  // 清除顽固的 Service Worker 缓存
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister()
      }
    })
  }

  // 时间流逝
  timeInterval = setInterval(() => {
    store.advanceTime(1)
  }, 1000)

  // 键盘调试
  window.addEventListener('keydown', onKeyDebug)
})

onUnmounted(() => {
  clearInterval(timeInterval)
  window.removeEventListener('keydown', onKeyDebug)
})

function onKeyDebug(e) {
  if (e.key === 't' || e.key === 'T') {
    store.moveTo('town', 0, 0)
  }
}

// 战斗结束处理
function onVictory(reward) {
  inBattle.value = false
   // 剧情模式通关检测
  if (store.isStoryMode && store.dungeon.completed) {
    store.storyEndTime = Date.now()
    store.dungeon.completed = false
    store.dungeon.active = false
  }

  if (storyBattleConfig.value) {
    // 剧情战斗胜利：跳转到 winNext
    const nextNode = storyBattleConfig.value.winNext
    storyBattleConfig.value = null
    startStoryAfterBattle(nextNode)
  }



}

function onBattleExit() {
  inBattle.value = false
  if (storyBattleConfig.value) {
    // 逃跑或手动退出：跳转到 fleeNext
    const nextNode = storyBattleConfig.value.fleeNext || storyBattleConfig.value.loseNext
    storyBattleConfig.value = null
    startStoryAfterBattle(nextNode)
  }
}

// 战斗失败（由 BattleScene 发出 defeat 事件）
function onBattleDefeat() {
  inBattle.value = false
  if (storyBattleConfig.value) {
    const nextNode = storyBattleConfig.value.loseNext
    storyBattleConfig.value = null
    startStoryAfterBattle(nextNode)
  } else {
    // 普通战斗失败：重生
    store.respawn()
  }
}

// 战斗结束后继续剧情
function startStoryAfterBattle(nodeId) {
  if (!nodeId) return
  // 通过 store 设置待处理的剧情节点，MainScreen 会检测并启动
  store.pendingStoryNodeAfterBattle = nodeId
}

function parseMonsterSkills(monster) {
  if (!monster || !monster.skillsText) return []
  try {
    const parsed = JSON.parse(monster.skillsText)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

// 内置兜底模板
const builtin = {
  slime: { id: 'slime', name: '史莱姆', baseHp: 35, baseAtk: 10, baseDef: 6, levelRange: [1,3], material: { id: 'slime_gel', name: '史莱姆凝露' }, icon: 'mdi:blur' },
  goblin: { id: 'goblin', name: '哥布林', baseHp: 45, baseAtk: 16, baseDef: 10, levelRange: [2,5], material: { id: 'goblin_fang', name: '哥布林之牙' }, icon: 'mdi:alien' },
  wolf: { id: 'wolf', name: '森林狼', baseHp: 50, baseAtk: 22, baseDef: 12, levelRange: [3,6], material: { id: 'wolf_fang', name: '狼牙' }, icon: 'mdi:dog' },
  scorpion: { id: 'scorpion', name: '毒蝎', baseHp: 40, baseAtk: 22, baseDef: 14, levelRange: [3,7], material: { id: 'scorpion_tail', name: '蝎尾针' }, icon: 'mdi:bug' },
  golem: { id: 'golem', name: '石魔像', baseHp: 80, baseAtk: 30, baseDef: 25, levelRange: [5,10], material: { id: 'golem_core', name: '魔像核心' }, icon: 'mdi:robot' },
  boss_wolfking: { id: 'boss_wolfking', name: '狼王', baseHp: 120, baseAtk: 35, baseDef: 20, levelRange: [8,12], material: { id: 'wolf_heart', name: '狼王之心' }, icon: 'mdi:skull', isBoss: true },
}

// 开始战斗（统一入口）
function onStartBattle(monstersOrConfig, storyNodeId = null) {
  // 如果是剧情触发的战斗：参数为一个对象 { enemies, winNext, loseNext, fleeNext }
  if (typeof monstersOrConfig === 'object' && monstersOrConfig.enemies) {
    storyBattleConfig.value = monstersOrConfig
    storyNodeBeforeBattle.value = storyNodeId

    // 根据配置生成怪物
    const enemyIds = storyBattleConfig.value.enemies
    const monsters = []
    for (const id of enemyIds) {
      const template = store.config.monsterTemplates?.find(m => m.id === id) || builtin[id]
      if (!template) {
        console.error('找不到怪物模板:', id)
        continue
      }
      // 简单生成，不使用世界等级，固定等级以匹配剧情难度
      const monster = fallbackSpawnEnemy(template, store.player.level)
      monster.icon = template.icon || 'mdi:help-circle'
      if (template.isBoss) monster.isBoss = true
      monster.skills = parseMonsterSkills(monster)
      monsters.push(monster)
    }
    currentEnemies.value = monsters
  } else {
    // 普通战斗（地下城或野外）
    const inputArray = Array.isArray(monstersOrConfig) ? monstersOrConfig : [monstersOrConfig]
    const monsters = []
    for (const item of inputArray) {
      let monster
      if (typeof item === 'object' && item !== null) {
        monster = { ...item }
        if (!monster.icon) monster.icon = 'mdi:help-circle'
      } else {
        const id = item
        const template = store.config.monsterTemplates?.find(m => m.id === id) || builtin[id]
        if (!template) {
          console.error('找不到怪物模板:', id)
          continue
        }
        try {
          monster = spawnEnemy ? spawnEnemy(template, store.player.level) : fallbackSpawnEnemy(template, store.player.level)
          monster.icon = template.icon || 'mdi:help-circle'
          if (template.isBoss) monster.isBoss = true
        } catch (e) {
          console.error('生成怪物失败', e)
          monster = fallbackSpawnEnemy(template, store.player.level)
          monster.icon = template.icon || 'mdi:help-circle'
        }
      }
      monster.skills = parseMonsterSkills(monster)
      monsters.push(monster)
    }
    if (monsters.length === 0) {
      console.error('无法生成任何怪物')
      return
    }
    currentEnemies.value = monsters
    // 清除剧情配置
    storyBattleConfig.value = null
    storyNodeBeforeBattle.value = null
  }

  battleKey.value++
  inBattle.value = true
}

function onNextFloor() {
  if (!store.dungeon.active) {
    inBattle.value = false
    return
  }
  const monsters = store.getRandomMonsterForFloor()
  if (!monsters || monsters.length === 0) {
    inBattle.value = false
    return
  }
  onStartBattle(monsters)
}
</script>

<style scoped>
#game-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}


.global-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid #ffd700;
  color: #ffd;
  padding: 12px 24px;
  border-radius: 12px;
  font-family: 'Press Start 2P', cursive;
  font-size: 10px;
  z-index: 9999;
  pointer-events: none;
  white-space: nowrap;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9998;
}

.confirm-box {
  background: rgba(20, 28, 40, 0.95);
  border: 2px solid #ffd700;
  border-radius: 16px;
  padding: 20px;
  min-width: 280px;
  text-align: center;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  font-size: 9px;
}

.confirm-box p {
  margin-bottom: 15px;
  line-height: 1.5;
}

.confirm-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.confirm-box {
  background: rgba(20, 28, 40, 0.95);
  border: 2px solid #ffd700;
  border-radius: 16px;
  padding: 24px;
  min-width: 300px;
  text-align: left;             /* 左对齐，竖排显示 */
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  font-size: 9px;
  line-height: 2.0;             /* 行距加大，易读 */
  white-space: pre-wrap;        /* 保留换行符 */
}

.confirm-box p {
  margin-bottom: 20px;
  line-height: 2.0;
}

.confirm-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}
</style>