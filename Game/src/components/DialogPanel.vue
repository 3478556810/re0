<template>
  <div class="dialog-overlay" v-if="visible" @click="nextDialog">
    <div class="dialog-box pixel-panel">
      <!-- 角色头像 -->
      <div class="dialog-speaker" v-if="currentSpeaker">
        <img v-if="speakerImage" :src="speakerImage" class="speaker-img" />
        <Icon v-else :icon="speakerIcon" class="speaker-icon" />
        <span class="speaker-name">{{ speakerName }}</span>
      </div>
      <div class="dialog-content">
        <p class="dialog-text">{{ currentNode?.text || '...' }}</p>
        <div v-if="currentChoices.length" class="dialog-choices">
          <button
            v-for="(choice, idx) in currentChoices"
            :key="idx"
            class="pixel-btn choice-btn"
            @click.stop="selectChoice(idx)"
          >
            {{ choice.text }}
          </button>
        </div>
      </div>
      <div class="dialog-indicator" v-if="!currentChoices.length && !loading">
        点击任意处继续
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'
import { storyTree } from '../config/storyScript'
import { defaultCharacters } from '../config/characters'

const store = useGameStore()
const emit = defineEmits(['close', 'update'])
const visible = ref(false)
const currentNodeId = ref('start')
const loading = ref(false)

const currentNode = computed(() => storyTree[currentNodeId.value] || null)
const currentChoices = computed(() => currentNode.value?.choices || [])
const currentSpeaker = computed(() => currentNode.value?.speaker || null)

const speakerData = computed(() => {
  return currentSpeaker.value ? defaultCharacters[currentSpeaker.value] : null
})
const speakerIcon = computed(() => speakerData.value?.icon || 'mdi:account')
const speakerName = computed(() => speakerData.value?.name || '???')
const speakerImage = computed(() => {
  if (!currentSpeaker.value) return null
  return store.config?.customImages?.[currentSpeaker.value] || null
})

function startScene(startId = 'start') {
  currentNodeId.value = startId
  visible.value = true
}

// 点击任意处推进剧情（包括对话框内部和外部的空白区域）
function nextDialog() {
  if (loading.value) return
  // 如果有选项，不自动推进，等待玩家选择
  if (currentChoices.value.length > 0) return

  const node = currentNode.value
  if (!node) {
    closeDialog()
    return
  }

  // 如果节点有 action，通知父组件
  if (node.action) {
    emit('update', { nodeId: node.id, action: node.action })
  }

  // 跳转到下一个节点或关闭
  if (node.nextId) {
    currentNodeId.value = node.nextId
  } else {
    closeDialog()
  }
}

function selectChoice(idx) {
  const choice = currentChoices.value[idx]
  if (!choice) return

  if (choice.action) {
    emit('update', { nodeId: currentNodeId.value, action: choice.action, choice: choice.text })
  }

  currentNodeId.value = choice.nextId
  // 如果选择后节点无选项且无 nextId，自动关闭（可改为自动推进到下一节点）
}

function closeDialog() {
  visible.value = false
  emit('close')
}

defineExpose({ startScene })
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 300;
  cursor: pointer;
}

.dialog-box {
  width: 90%;
  max-width: 600px;
  margin-bottom: 30px;
  padding: 24px;
  background: rgba(10, 15, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 2px solid #b89a6a;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.7);
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  cursor: default;
  position: relative;
}

.dialog-speaker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.speaker-img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid #b89a6a;
  object-fit: cover;
}

.speaker-icon {
  font-size: 36px;
  color: #ffd700;
}

.speaker-name {
  font-size: 12px;
  color: #ffd700;
}

.dialog-content {
  margin-bottom: 15px;
}

.dialog-text {
  font-size: 14px;
  line-height: 1.8;
  text-shadow: 1px 1px 0 #000;
  margin-bottom: 20px;
}

.dialog-choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.choice-btn {
  width: 100%;
  justify-content: center;
  padding: 12px;
  font-size: 11px;
  background: rgba(255,215,0,0.1);
  border-color: #ffd700;
}

.choice-btn:hover {
  background: rgba(255,215,0,0.3);
}

.dialog-indicator {
  text-align: right;
  font-size: 9px;
  color: #888;
  margin-top: 10px;
}
</style>