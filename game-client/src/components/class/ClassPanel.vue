<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
     

      <div class="tabs">
        <button :class="['tab-btn', { active: activeTab === 'tree' }]" @click="activeTab = 'tree'">
          <Icon icon="mdi:family-tree" /> 职业树
        </button>
        <button :class="['tab-btn', { active: activeTab === 'talent' }]" @click="activeTab = 'talent'">
          <Icon icon="mdi:star-circle" /> 天赋盘
        </button>
      </div>

      <!-- 职业树页 -->
      <div v-if="activeTab === 'tree'" class="tab-content">
        <div class="current-class">
          <div class="class-icon"><Icon :icon="classIcon" /></div>
          <div class="class-info">
            <div class="class-name">{{ className }}</div>
            <div class="class-desc">{{ classDesc }}</div>
          </div>
        </div>
        <ClassTree
          :first-jobs="firstJobs"
          :second-jobs="secondJobs"
          :is-advanced="isAdvancedClass"
          :current-class="store.player.class"
          @select="selectClass"
          @reset="resetClass"
        />
      </div>

    <!-- 天赋盘标签页 -->
<div v-if="activeTab === 'talent'" class="tab-content" style="overflow:hidden; display:flex; flex-direction:column;">
  <TalentGrid
    :nodes="currentTalentNodes"
    :skill-points="store.player.skillPoints"
    @allocate="onAllocate"
  />
</div>
  </div> </div>
</template>

<script setup>
import { ref, computed ,onMounted} from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'
import ClassTree from './ClassTree.vue'
import TalentGrid from './TalentGrid.vue'
import { useClassSystem } from './useClassSystem'

import { TALENT_TREES, CLASS_DEFS } from './classData'  // ← 添加这一行
const store = useGameStore()
const emit = defineEmits(['close'])
const activeTab = ref('tree')

const {initStartNodes,
  className, classIcon, classDesc, classBonuses,
  firstJobs, secondJobs, isAdvancedClass,
  selectClass, resetClass, allocateNode
} = useClassSystem()

onMounted(() => {
  initStartNodes()
})
// 根据当前职业系列获取天赋节点
const currentTalentNodes = computed(() => {
  const classId = store.player.class
  const def = CLASS_DEFS[classId]
  let series = 'warrior'
  if (def) {
    if (def.tier === 2) series = def.parent
    else if (def.tier === 1) series = classId
  }
  const tree = TALENT_TREES[series]
  return tree ? tree.nodes.map(node => ({
    ...node,
    allocated: store.player.talents?.[node.id] || false
  })) : []
})

function onAllocate(node) {
  allocateNode(node)
}
</script>

<style scoped>
/* 全屏横屏样式，与之前相同，不再赘述 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 100vw; height: 100vh; background: rgba(15,25,45,0.95); color: #ffd; font-family: 'Press Start 2P', cursive; display: flex; flex-direction: column; padding: 12px 20px; box-sizing: border-box; position: relative; }
.close-btn { position: absolute; top: 12px; right: 16px; background: none; border: none; color: #ffd; font-size: 22px; cursor: pointer; z-index: 10; }
h2 { font-size: 14px; color: #ffd700; margin: 0 0 12px 0; }
.tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.tab-btn { background: rgba(0,0,0,0.5); border: 1px solid #5a5a7a; border-radius: 12px; padding: 6px 18px; font-size: 9px; color: #ccc; cursor: pointer; }
.tab-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }
.tab-content { flex: 1; overflow-y: auto; padding-right: 4px; }
/* 其他样式复用子组件 */
.current-class { display: flex; gap: 14px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,215,0,0.2); border-radius: 14px; padding: 12px; margin-bottom: 16px; }
.class-icon { font-size: 44px; color: #ffd700; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: rgba(255,215,0,0.1); border-radius: 14px; }
.class-info { flex: 1; }
.class-name { font-size: 13px; font-weight: bold; }
.class-desc { font-size: 7px; color: #ccc; }
.class-bonus { margin-bottom: 16px; }
.bonus-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.bonus-item { display: flex; justify-content: space-between; background: rgba(0,0,0,0.3); padding: 5px 8px; border-radius: 7px; font-size: 7px; }
.bonus-label { color: #aaa; }
.bonus-value { font-weight: bold; }
</style>