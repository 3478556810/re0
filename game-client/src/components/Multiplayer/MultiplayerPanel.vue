<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <!-- 战斗倒计时覆盖层 -->
      <div v-if="battleCountdown > 0" class="countdown-overlay">
        <div class="countdown-number">{{ battleCountdown }}</div>
      </div>

      <!-- 顶部栏 -->
      <div class="top-bar">
        <h2 v-if="!showRoomDetail"><Icon icon="mdi:account-group" /> 匹配房间</h2>
        <h2 v-else><Icon icon="mdi:door" /> 房间详情</h2>
        <span class="boss-name">{{ bossName }}</span>
        <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      </div>

      <!-- 操作栏 -->
      <div class="action-bar">
        <button class="pixel-btn primary" @click="showCreateDialog = true">
          <Icon icon="mdi:plus" /> 创建
        </button>
        <button class="pixel-btn" @click="fetchRooms">
          <Icon icon="mdi:refresh" /> 刷新
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <RoomList
          v-if="!showRoomDetail"
          :rooms="displayRooms"
          :my-room="displayMyRoom"
          :boss-name="bossName"
          @room-click="enterRoom"
          @open-detail="openRoomDetail"
        />
        <RoomDetail
          v-else-if="currentRoom"
          :room="displayCurrentRoom"
          :is-owner="currentRoom.ownerId === myPlayerId"
          :can-start="currentRoom.players === currentRoom.maxPlayers"
          @kick="handleKick"
          @invite="inviteFriend"
          @disband="handleDisband"
          @leave="handleLeave"
          @start="handleStart"
        />
      </div>

      <!-- 返回按钮 -->
      <button v-if="showRoomDetail" class="pixel-btn back-btn" @click="showRoomDetail = false">
        <Icon icon="mdi:arrow-left" /> 返回列表
      </button>

      <!-- 连接状态 -->
      <div class="status-bar">
        <span :class="['status-dot', { connected: isConnected }]"></span>
        {{ isConnected ? '已连接' : '未连接' }}
      </div>
    </div>

    <CreateRoomDialog
      :visible="showCreateDialog"
      :boss-id="bossId"
      @update:visible="val => showCreateDialog = val"
      @create="handleCreate"
    />
    <PasswordDialog
      :visible="showPasswordDialog"
      @update:visible="val => showPasswordDialog = val"
      @confirm="handlePasswordConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useMultiplayer } from '@/composables/useMultiplayer'
import RoomList from './RoomList.vue'
import RoomDetail from './RoomDetail.vue'
import CreateRoomDialog from './CreateRoomDialog.vue'
import PasswordDialog from './PasswordDialog.vue'

const props = defineProps({
  bossId: { type: String, required: true },
  bossName: { type: String, default: '' }
})
const emit = defineEmits(['close', 'startBattle'])
const showToast = inject('showToast', (msg) => alert(msg))

const {
  rooms, myRoom, currentRoom, isConnected, battleCountdown,
  connect, disconnect, fetchRooms, createRoom, joinRoom, leaveRoom, disbandRoom, kickMember, startBattle,
  myPlayerId
} = useMultiplayer(props.bossId, props.bossName)

const showRoomDetail = ref(false)
const showCreateDialog = ref(false)
const showPasswordDialog = ref(false)
let pendingRoomId = null

// Boss中文名映射
const bossNameMap = {
  'raid_gladiator': '角斗士·血斧',
  'raid_lava_core': '炎核·熔岩巨像',
  'raid_bishop': '永夜主教'
}

const displayRooms = computed(() => rooms.value.map(r => ({
  ...r,
  name: bossNameMap[r.name] || r.name
})))
const displayMyRoom = computed(() => {
  if (!myRoom.value) return null
  return { ...myRoom.value, name: bossNameMap[myRoom.value.name] || myRoom.value.name }
})
const displayCurrentRoom = computed(() => {
  if (!currentRoom.value) return null
  return { ...currentRoom.value, name: bossNameMap[currentRoom.value.name] || currentRoom.value.name }
})

function openRoomDetail(room) {
  currentRoom.value = room
  showRoomDetail.value = true
}
function enterRoom(room) {
  if (room.hasPassword) {
    pendingRoomId = room.id
    showPasswordDialog.value = true
  } else {
    joinRoom(room.id)
    showRoomDetail.value = true
  }
}
async function handlePasswordConfirm(pwd) {
  if (pendingRoomId) {
    try {
      await joinRoom(pendingRoomId, pwd)
      showRoomDetail.value = true
    } catch (e) {
      showToast(e.message || '加入房间失败')
    }
    pendingRoomId = null
  }
}
async function handleCreate(params) {
  try {
    await createRoom(params)
    showCreateDialog.value = false
    showRoomDetail.value = true   // 等房间真正创建成功后再打开详情
  } catch (e) {
    showToast(e.message || '创建房间失败')
  }
}
function handleKick(memberId) {
  if (currentRoom.value) kickMember(currentRoom.value.id, memberId)
}
function handleDisband() {
    if (currentRoom.value) {
        disbandRoom(currentRoom.value.id)
        // 注意：不要在这里设置 showRoomDetail = false，等待后端回包
    }
}
function handleLeave() {
  if (currentRoom.value) {
    leaveRoom(currentRoom.value.id)
    showRoomDetail.value = false
  }
}
function inviteFriend() {
  showToast('邀请链接已复制（功能开发中）')
}
function handleStart() {
  if (currentRoom.value && currentRoom.value.players === currentRoom.value.maxPlayers && currentRoom.value.ownerId === myPlayerId.value) {
    startBattle(currentRoom.value.id)
  }
}

onMounted(() => {
  connect()
 window.addEventListener('player_kicked', (e) => {
  showToast(e.detail.message || '你已被踢出房间')
  // 关闭详情页（如果打开）
  showRoomDetail.value = false
  // 可选：清空当前房间引用（已在 useMultiplayer 中处理）
})
window.addEventListener('room_closed', () => {
    showRoomDetail.value = false
})
  window.addEventListener('multiplayer_battle_go', (e) => {
    emit('startBattle', e.detail)
  })
})
onUnmounted(() => disconnect())
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel {
  width: 95vw; max-width: 500px; height: 85vh;
  background: rgba(15,25,45,0.95); border: 2px solid #b89a6a; border-radius: 28px;
  color: #ffd; font-family: 'Press Start 2P', cursive;
  padding: 16px 20px; display: flex; flex-direction: column; box-sizing: border-box;
  backdrop-filter: blur(8px);
  position: relative;
}
.top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid rgba(255,215,0,0.2); padding-bottom: 8px; }
.top-bar h2 { font-size: 14px; color: #ffd700; display: flex; align-items: center; gap: 8px; margin: 0; }
.boss-name { font-size: 9px; color: #ffaa66; background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 20px; }
.close-btn { background: none; border: none; color: #ffd; font-size: 22px; cursor: pointer; }
.close-btn:hover { color: #ffaa66; transform: scale(1.1); }
.action-bar { display: flex; gap: 10px; margin-bottom: 16px; }
.pixel-btn { background: #2a2a3a; border: 2px solid #b89a6a; color: #ffd; padding: 8px 14px; font-size: 9px; cursor: pointer; border-radius: 40px; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
.pixel-btn:hover { transform: translateY(-2px); background: #3a3a5a; border-color: #ffd700; }
.pixel-btn.primary { background: rgba(255,215,0,0.15); border-color: #ffd700; color: #ffd700; }
.pixel-btn.warning { background: rgba(255,165,0,0.15); border-color: #ffa500; color: #ffaa66; }
.pixel-btn.danger { background: rgba(255,68,68,0.15); border-color: #ff4444; color: #ff8888; }
.pixel-btn.back-btn { margin-top: auto; width: 100%; justify-content: center; }
.content-area { flex: 1; overflow-y: auto; margin-bottom: 12px; }
.status-bar { display: flex; align-items: center; gap: 8px; font-size: 8px; color: #888; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #f44336; }
.status-dot.connected { background: #4caf50; }
.countdown-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}
.countdown-number {
  font-size: 64px;
  color: #ffd700;
  text-shadow: 0 0 20px #ffd700;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
@media (orientation: landscape) {
  .panel { width: 100vw; height: 100vh; max-width: none; border-radius: 0; padding: 12px 20px; }
}
</style>