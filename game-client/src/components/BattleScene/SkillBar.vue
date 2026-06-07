<template>
  <div class="skill-bar">
    <div
      v-for="skill in skills"
      :key="skill.id"
      class="skill-card"
      :class="{ 'skill-disabled': skill.mpCost > playerMp }"
      @click="$emit('use-skill', skill)"
      @mouseenter="$emit('show-preview', skill, $event)"
      @mouseleave="$emit('hide-preview')"
    >
      <Icon :icon="skill.icon" class="skill-icon" />
      <div class="skill-info">
        <span class="skill-name">{{ skill.name }}</span>
        <span class="skill-mp">
          <span v-if="skill.element" class="skill-element-tag" :style="{ background: getElementColor(skill.element) }">
            {{ getElementLabel(skill.element) }}
          </span>
          MP {{ skill.mpCost }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { getElementLabel, getElementColor } from '@/utils/elementUtils.js'

defineProps({
  skills: Array,
  playerMp: Number
})

defineEmits(['use-skill', 'show-preview', 'hide-preview'])
</script>