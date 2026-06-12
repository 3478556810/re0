<template>
  <div class="detail-container">
    <div class="detail-header">
      <span class="detail-name">{{ room.name }}</span>
      <span class="detail-owner">房主：{{ room.ownerName }}</span>
    </div>

    <div class="member-list">
      <div class="section-label"><Icon icon="mdi:account-multiple" /> 成员 ({{ room.players }}/{{ room.maxPlayers }})</div>
      <div v-for="member in room.members" :key="member.id" class="member-item">
        <Icon :icon="member.isOwner ? 'mdi:crown' : 'mdi:account'" :class="{ owner: member.isOwner }" />
        <span class="member-name">{{ member.name }}</span>
        <span class="member-gear" v-if="member.gearScore">装等 {{ member.gearScore }}</span>
        <button
          v-if="isOwner && !member.isOwner"
          class="pixel-btn micro danger"
          @click="$emit('kick', member.id)"
        >
          <Icon icon="mdi:account-remove" /> 踢出
        </button>
      </div>
    </div>

    <div class="detail-buttons">
      <button v-if="isOwner" class="pixel-btn primary" @click="$emit('invite')">
        <Icon icon="mdi:account-plus" /> 邀请
      </button>
      <button v-if="isOwner" class="pixel-btn warning" @click="$emit('disband')">
        <Icon icon="mdi:door-closed" /> 解散
      </button>
      <button v-if="!isOwner" class="pixel-btn warning" @click="$emit('leave')">
        <Icon icon="mdi:exit-run" /> 退出
      </button>
      <!-- 只有房主且满员时才能开始战斗 -->
      <button
        v-if="isOwner"
        class="pixel-btn primary"
        :disabled="!canStart"
        @click="$emit('start')"
      >
        <Icon icon="mdi:sword-cross" />
        {{ canStart ? '开始战斗' : `等待玩家 (${room.players}/${room.maxPlayers})` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  room: Object,
  isOwner: Boolean,
  canStart: Boolean   // 是否满足开始条件
})
defineEmits(['kick', 'invite', 'disband', 'leave', 'start'])
</script>

<style scoped>
.detail-container { display: flex; flex-direction: column; gap: 16px; }
.detail-header { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 16px; text-align: center; }
.detail-name { font-size: 13px; color: #ffd700; display: block; margin-bottom: 4px; }
.detail-owner { font-size: 8px; color: #aaa; }
.member-list { margin-bottom: 8px; }
.section-label { font-size: 9px; color: #ffd700; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.member-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 8px; }
.member-item .owner { color: #ffd700; }
.member-name { flex: 1; }
.member-gear { color: #aaa; font-size: 7px; }
.detail-buttons { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
.detail-buttons .pixel-btn { flex: 1 1 auto; min-width: 100px; justify-content: center; }
.pixel-btn.micro { font-size: 6px; padding: 4px 8px; }
</style>