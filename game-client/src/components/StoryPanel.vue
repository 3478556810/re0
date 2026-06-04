<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="story-panel pixel-panel">
      <div class="story-text">{{ storyText }}</div>
      <div v-if="choices.length" class="choices">
        <button
          v-for="(choice, idx) in choices"
          :key="idx"
          class="pixel-btn"
          @click="selectChoice(idx)"
        >
          {{ choice }}
        </button>
      </div>
      <button v-else class="pixel-btn" @click="$emit('close')">继续</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { generateStory } from '../utils/aiChat'

const props = defineProps({
  context: String   // 例如 "在黑暗森林中遇到一只受伤的独角兽"
})

const emit = defineEmits(['close', 'update'])

const storyText = ref('')
const choices = ref([])

onMounted(async () => {
  const result = await generateStory(props.context)
  storyText.value = result.text
  choices.value = result.choices
})

function selectChoice(index) {
  emit('update', choices.value[index])
  emit('close')
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 300; }
.story-panel { width: 500px; padding: 30px; text-align: center; }
.story-text { font-size: 12px; line-height: 1.8; margin-bottom: 20px; }
.choices { display: flex; flex-direction: column; gap: 10px; }
</style>