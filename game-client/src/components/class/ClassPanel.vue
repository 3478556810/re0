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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'
import ClassTree from './ClassTree.vue'
import TalentGrid from './TalentGrid.vue'
import { useClassSystem } from './useClassSystem'
import { TALENT_TREES, CLASS_DEFS } from './classData'

const store = useGameStore()
const emit = defineEmits(['close'])
const activeTab = ref('tree')

// 只解构需要的属性，移除了 className, classIcon, classDesc, classBonuses
const {
  initStartNodes,
  firstJobs,
  secondJobs,
  isAdvancedClass,
  selectClass,
  resetClass,
  allocateNode
} = useClassSystem()

onMounted(() => { initStartNodes() })

const currentTalentNodes = computed(() => {
  const classId = store.player.class
  const def = CLASS_DEFS[classId]
  let series = 'warrior'
  if (def) {
    if (def.tier === 2) series = def.parent
    else if (def.tier === 1) series = classId
  }
  const tree = TALENT_TREES[series]
  return tree ? tree.nodes.map(node => ({ ...node, allocated: store.player.talents?.[node.id] || false })) : []
})

function onAllocate(node) { allocateNode(node) }
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 100vw; height: 100vh; background: rgba(15,25,45,0.95); color: #ffd; font-family: 'Press Start 2P', cursive; display: flex; flex-direction: column; padding: 12px 20px; box-sizing: border-box; position: relative; overflow: hidden; }
.close-btn { position: absolute; top: 12px; right: 16px; background: none; border: none; color: #ffd; font-size: 22px; cursor: pointer; z-index: 10; }
.tabs { display: flex; gap: 8px; margin-bottom: 8px; flex-shrink: 0; }
.tab-btn { background: rgba(0,0,0,0.5); border: 1px solid #5a5a7a; border-radius: 12px; padding: 6px 18px; font-size: 9px; color: #ccc; cursor: pointer; }
.tab-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd; }
.tab-content { flex: 1; overflow: hidden; padding-right: 4px; }
/* 已移除 .current-class 及相关样式 */
</style>