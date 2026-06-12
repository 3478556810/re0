<template>
  <div class="room-list-container">
    <!-- 我的房间（始终置顶） -->
    <div v-if="myRoom" class="my-room-section">
      <div class="section-label"><Icon icon="mdi:home" /> 我的房间</div>
      <div class="room-card mine" @click="$emit('open-detail', myRoom)">
        <div class="room-header">
          <Icon icon="mdi:door" class="room-icon" />
          <div class="room-info">
            <span class="room-name">{{ myRoom.name || bossName }}</span>
            <span class="room-owner">房主：{{ myRoom.ownerName || '未知' }}</span>
          </div>
          <div class="room-players">
            <Icon icon="mdi:account" />
            <span>{{ myRoom.players }}/{{ myRoom.maxPlayers }}</span>
          </div>
        </div>
        <div class="room-details">
          <span class="detail-tag"><Icon icon="mdi:skull" /> {{ difficultyLabel(myRoom.difficulty) }}</span>
          <span class="detail-tag" v-if="myRoom.hasPassword"><Icon icon="mdi:lock" /> 加密</span>
          <span class="detail-tag" v-if="myRoom.minGearScore"><Icon icon="mdi:shield" /> 装等 {{ myRoom.minGearScore }}+</span>
          <span v-if="myRoom.status === 'playing'" class="detail-tag playing-tag">游戏中</span>
        </div>
      </div>
    </div>

    <!-- 其他房间 -->
    <div class="room-list">
      <div v-if="otherRooms.length === 0" class="empty">暂无其他房间</div>
      <div
        v-for="room in otherRooms"
        :key="room.id"
        class="room-card"
        :class="{ disabled: room.status !== 'waiting' }"
        @click="room.status === 'waiting' && $emit('room-click', room)"
      >
        <div class="room-header">
          <Icon icon="mdi:door" class="room-icon" />
          <div class="room-info">
            <span class="room-name">{{ room.name || bossName }}</span>
            <span class="room-owner">房主：{{ room.ownerName || '未知' }}</span>
          </div>
          <div class="room-players">
            <Icon icon="mdi:account" />
            <span>{{ room.players }}/{{ room.maxPlayers }}</span>
          </div>
        </div>
        <div class="room-details">
          <span class="detail-tag"><Icon icon="mdi:skull" /> {{ difficultyLabel(room.difficulty) }}</span>
          <span class="detail-tag" v-if="room.hasPassword"><Icon icon="mdi:lock" /> 加密</span>
          <span class="detail-tag" v-if="room.minGearScore"><Icon icon="mdi:shield" /> 装等 {{ room.minGearScore }}+</span>
          <span v-if="room.status === 'playing'" class="detail-tag playing-tag">游戏中</span>
        </div>
      </div>
    </div>

    <!-- 底部快捷入口 -->
    <div v-if="myRoom" class="current-room-footer" @click="$emit('open-detail', myRoom)">
      <Icon icon="mdi:door-open" class="footer-icon" />
      <span class="footer-text">{{ myRoom.name }}</span>
      <span class="footer-status">{{ myRoom.players }}/{{ myRoom.maxPlayers }}</span>
      <Icon icon="mdi:chevron-right" class="footer-arrow" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  rooms: Array,
  myRoom: Object,
  bossName: String
})

defineEmits(['room-click', 'open-detail'])

const otherRooms = computed(() => {
  if (!props.myRoom) return props.rooms
  return props.rooms.filter(r => r.id !== props.myRoom.id)
})

function difficultyLabel(value) {
  const map = { normal: '普通', hard: '困难', nightmare: '噩梦' }
  return map[value] || value
}
</script>

<style scoped>
.room-list-container { display: flex; flex-direction: column; gap: 12px; flex: 1; overflow-y: auto; }
.my-room-section { margin-bottom: 8px; }
.section-label { font-size: 9px; color: #ffd700; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.room-card { background: rgba(0,0,0,0.35); border: 1px solid rgba(184,154,106,0.3); border-radius: 18px; padding: 12px; cursor: pointer; transition: 0.2s; }
.room-card:hover { border-color: #ffd700; background: rgba(0,0,0,0.5); }
.room-card.mine { border-color: #ffd700; background: rgba(255,215,0,0.05); }
.room-card.disabled { opacity: 0.6; cursor: not-allowed; }
.room-card.disabled:hover { border-color: rgba(184,154,106,0.3); background: rgba(0,0,0,0.35); }
.room-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.room-icon { font-size: 26px; color: #6495ed; }
.room-info { flex: 1; }
.room-name { font-size: 10px; font-weight: bold; color: #ffd; }
.room-owner { font-size: 7px; color: #aaa; }
.room-players { display: flex; align-items: center; gap: 5px; font-size: 8px; color: #ffd700; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 20px; }
.room-details { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
.detail-tag { font-size: 7px; color: #bbb; background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px; }
.playing-tag { background: rgba(255,165,0,0.2); color: #ffa500; border: 1px solid #ffa500; }
.room-list { display: flex; flex-direction: column; gap: 10px; }
.empty { text-align: center; color: #888; padding: 20px; font-size: 9px; }
.current-room-footer { margin-top: 12px; padding: 8px 12px; background: rgba(0,0,0,0.5); border-radius: 20px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; border: 1px solid rgba(184,154,106,0.4); }
.current-room-footer:hover { border-color: #ffd700; background: rgba(255,215,0,0.1); }
.footer-icon { font-size: 16px; color: #ffd700; }
.footer-text { flex: 1; font-size: 8px; color: #ffd; }
.footer-status { font-size: 7px; color: #aaa; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 12px; }
.footer-arrow { font-size: 14px; color: #888; }
</style>