<template>
  <div class="class-tree">
    <h3>
      <Icon icon="mdi:family-tree" /> 转职路线
      <button class="reset-class-btn" @click="resetClass">↺ 重置</button>
    </h3>
    <div class="tree-container">
      <div class="tree-root">
        <div class="tree-node base-node active">
          <Icon icon="mdi:account" class="node-icon" />
          <span class="node-label">流浪者</span>
        </div>
      </div>
      <div class="tree-line" :class="{ active: currentClass !== 'wanderer' }"></div>
      <div class="tree-branch">
        <div
          v-for="job in firstJobs"
          :key="job.id"
          class="tree-node"
          :class="{ active: store.player.class === job.id, unlocked: job.unlocked }"
          @click="handleSelect(job)"
        >
          <Icon :icon="job.icon" class="node-icon" />
          <span class="node-label">{{ job.name }}</span>
        </div>
      </div>
      <div class="tree-line" :class="{ active: isAdvanced }"></div>
      <div class="tree-branch">
        <div
          v-for="job in secondJobs"
          :key="job.id"
          class="tree-node advanced"
          :class="{ active: store.player.class === job.id, unlocked: job.unlocked }"
          @click="handleSelect(job)"
        >
          <Icon :icon="job.icon" class="node-icon" />
          <span class="node-label">{{ job.name }}</span>
          <span class="node-req" v-if="!job.unlocked">Lv.{{ job.reqLevel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'
import { CLASS_DEFS } from './classData'  // 请确保此路径与你项目一致

const store = useGameStore()
const showToast = inject('showToast', (msg) => alert(msg))

defineProps({
  firstJobs: Array,
  secondJobs: Array,
  isAdvanced: Boolean,
  currentClass: String
})

// 转职处理
function handleSelect(job) {
  const id = job.id
  const def = CLASS_DEFS[id]
  if (!def) return

  // 一转需要10级
  if (def.tier === 1 && store.player.level < 10) {
    showToast('需要等级 10 才能转职')
    return
  }

  // 二转需要25级 + 对应一转
  if (def.tier === 2) {
    if (store.player.level < (def.reqLevel || 25)) {
      showToast(`需要等级 ${def.reqLevel} 才能转职`)
      return
    }
    if (def.parent && store.player.class !== def.parent) {
      const parentName = CLASS_DEFS[def.parent]?.name || '对应一转职业'
      showToast(`需要先转职为 ${parentName}`)
      return
    }
  }

  store.player.class = id
  store.save()
  showToast(`已转职为 ${def.name}`)
}

// 重置为流浪者
function resetClass() {
  store.player.class = 'wanderer'
  store.save()
  showToast('已重置为流浪者')
}
</script>

<style scoped>
/* 样式保持原样，未作任何改动 */
.class-tree { margin-top: 8px; }
.reset-class-btn {
  margin-left: auto;
  background: rgba(255,100,100,0.15);
  border: 1px solid #ff5555;
  color: #ffaaaa;
  font-family: inherit;
  font-size: 7px;
  padding: 2px 8px;
  border-radius: 8px;
  cursor: pointer;
}
.reset-class-btn:hover { background: rgba(255,100,100,0.3); }
.tree-container { display: flex; flex-direction: column; align-items: center; gap: 0; }
.tree-root { display: flex; justify-content: center; }
.tree-branch { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
.tree-line {
  width: 2px; height: 18px;
  background: rgba(255,215,0,0.3); margin: 4px 0;
  transition: background 0.2s, box-shadow 0.2s;
}
.tree-line.active {
  background: #ffd700;
  box-shadow: 0 0 8px rgba(255,215,0,0.6);
}
.tree-node {
  background: rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.15);
  border-radius: 10px; padding: 6px 10px; min-width: 80px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: pointer; transition: 0.2s; position: relative;
}
.tree-node.unlocked:hover { border-color: #ffd700; }
.tree-node.active { border-color: #ffd700; background: rgba(255,215,0,0.15); box-shadow: 0 0 10px rgba(255,215,0,0.3); }
.tree-node:not(.unlocked) { opacity: 0.5; cursor: not-allowed; }
.tree-node.advanced { border-color: rgba(255,100,0,0.4); }
.tree-node.advanced.active { border-color: #ff6600; background: rgba(255,100,0,0.2); }
.node-icon { font-size: 24px; color: #ffd700; }
.node-label { font-size: 7px; color: #ccc; text-align: center; line-height: 1.2; }
.node-req { font-size: 6px; color: #ff9800; }
</style>