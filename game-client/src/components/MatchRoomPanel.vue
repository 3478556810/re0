<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <!-- 顶部栏 -->
      <div class="top-bar">
        <h2 v-if="!showRoomDetail"><Icon icon="mdi:account-group" /> 匹配房间</h2>
        <h2 v-else><Icon icon="mdi:door" /> 房间详情</h2>
        <span class="boss-name">{{ bossName }}</span>
        <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      </div>

      <!-- ========== 房间列表视图 ========== -->
      <template v-if="!showRoomDetail">
        <!-- 操作栏 -->
        <div class="action-bar">
          <button class="pixel-btn primary" @click="showCreateDialog = true">
            <Icon icon="mdi:plus" /> 创建
          </button>
          <button class="pixel-btn" @click="fetchRooms">
            <Icon icon="mdi:refresh" /> 刷新
          </button>
        </div>

        <!-- 我的房间（如果已加入） -->
        <div v-if="myRoom" class="my-room-section">
          <div class="section-label"><Icon icon="mdi:home" /> 我的房间</div>
          <div class="room-card mine" @click="openRoomDetail(myRoom)">
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
            </div>
          </div>
        </div>

        <!-- 房间列表 -->
        <div class="room-list">
          <div v-if="rooms.length === 0" class="empty">暂无房间，点击「创建」建立新房间</div>
          <div
            v-for="room in rooms"
            :key="room.id"
            class="room-card"
            @click="handleRoomClick(room)"
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
            </div>
          </div>
        </div>
      </template>

      <!-- ========== 房间详情视图 ========== -->
      <template v-if="showRoomDetail && currentRoom">
        <div class="detail-content">
          <div class="detail-header">
            <span class="detail-name">{{ currentRoom.name }}</span>
            <span class="detail-owner">房主：{{ currentRoom.ownerName }}</span>
          </div>

          <div class="member-list">
            <div class="section-label"><Icon icon="mdi:account-multiple" /> 成员 ({{ currentRoom.players }}/{{ currentRoom.maxPlayers }})</div>
            <div v-for="member in currentRoom.members" :key="member.id" class="member-item">
              <Icon :icon="member.isOwner ? 'mdi:crown' : 'mdi:account'" :class="{ owner: member.isOwner }" />
              <span class="member-name">{{ member.name }}</span>
              <span class="member-gear" v-if="member.gearScore">装等 {{ member.gearScore }}</span>
              <!-- 房主管理按钮 -->
              <button
                v-if="isRoomOwner && !member.isOwner"
                class="pixel-btn micro danger"
                @click="kickMember(member.id)"
              >
                <Icon icon="mdi:account-remove" /> 踢出
              </button>
            </div>
          </div>

          <!-- 房主操作 -->
          <div v-if="isRoomOwner" class="owner-actions">
            <button class="pixel-btn primary" @click="inviteFriend">
              <Icon icon="mdi:account-plus" /> 邀请
            </button>
            <button class="pixel-btn warning" @click="disbandRoom">
              <Icon icon="mdi:door-closed" /> 解散
            </button>
          </div>

          <!-- 非房主操作 -->
          <div v-if="!isRoomOwner" class="member-actions">
            <button class="pixel-btn warning" @click="leaveRoom">
              <Icon icon="mdi:exit-run" /> 退出
            </button>
          </div>

          <!-- 开始战斗按钮 -->
          <button
            class="pixel-btn primary full-width"
            :disabled="currentRoom.players < currentRoom.maxPlayers"
            @click="startBattle"
          >
            <Icon icon="mdi:sword-cross" /> 开始战斗 ({{ currentRoom.players }}/{{ currentRoom.maxPlayers }})
          </button>
        </div>

        <button class="pixel-btn back-btn" @click="showRoomDetail = false">
          <Icon icon="mdi:arrow-left" /> 返回列表
        </button>
      </template>

      <!-- 连接状态 -->
      <div class="status-bar">
        <span :class="['status-dot', { connected: isConnected }]"></span>
        {{ isConnected ? '已连接' : '未连接' }}
      </div>
    </div>

    <!-- ========== 创建房间弹窗 ========== -->
    <div v-if="showCreateDialog" class="modal-mask" @click.self="showCreateDialog = false">
      <div class="modal-panel">
        <h3><Icon icon="mdi:plus-circle" /> 创建房间</h3>

        <div class="form-item">
          <label>副本</label>
          <select v-model="createForm.bossId" class="pixel-input">
            <option v-for="boss in bossList" :key="boss.id" :value="boss.id">{{ boss.name }}</option>
          </select>
        </div>

        <div class="form-item">
          <label>人数</label>
          <select v-model="createForm.maxPlayers" class="pixel-input">
            <option :value="2">2人</option>
            <option :value="3">3人</option>
            <option :value="4">4人</option>
          </select>
        </div>

        <div class="form-item">
          <label>难度</label>
          <div class="radio-group">
            <button
              v-for="diff in difficulties"
              :key="diff.value"
              :class="['radio-btn', { active: createForm.difficulty === diff.value }]"
              @click="createForm.difficulty = diff.value"
            >
              {{ diff.label }}
            </button>
          </div>
        </div>

        <div class="form-item">
          <label>密码（可选）</label>
          <input v-model="createForm.password" type="text" class="pixel-input" placeholder="留空则无密码" />
        </div>

        <div class="form-item">
          <label>最低装等（可选）</label>
          <input v-model.number="createForm.minGearScore" type="number" class="pixel-input" min="0" placeholder="无限制" />
        </div>

        <div class="modal-actions">
          <button class="pixel-btn primary" @click="createRoom">
            <Icon icon="mdi:check" /> 创建
          </button>
          <button class="pixel-btn" @click="showCreateDialog = false">
            <Icon icon="mdi:close" /> 取消
          </button>
        </div>
      </div>
    </div>

    <!-- ========== 密码输入弹窗 ========== -->
    <div v-if="showPasswordDialog" class="modal-mask" @click.self="showPasswordDialog = false">
      <div class="modal-panel small">
        <h3><Icon icon="mdi:lock" /> 输入房间密码</h3>
        <input v-model="passwordInput" type="password" class="pixel-input" placeholder="请输入密码" @keyup.enter="verifyPassword" />
        <div class="modal-actions">
          <button class="pixel-btn primary" @click="verifyPassword">
            <Icon icon="mdi:check" /> 进入
          </button>
          <button class="pixel-btn" @click="showPasswordDialog = false">
            <Icon icon="mdi:close" /> 取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '@/store/gameStore'

const props = defineProps({
  bossId: { type: String, required: true },
  bossName: { type: String, default: '' }
})
const emit = defineEmits(['close'])

const store = useGameStore()
const rooms = ref([])
const isConnected = ref(false)
let ws = null

const showCreateDialog = ref(false)
const showPasswordDialog = ref(false)
const showRoomDetail = ref(false)
const passwordInput = ref('')
const pendingRoom = ref(null) // 临时存储待验证的房间

const currentRoom = ref(null) // 当前详情房间
const myRoom = ref(null) // 我当前所在的房间（模拟）

// 玩家自身 ID
const myPlayerId = store.player.id || 'guest'

// 房主判断
const isRoomOwner = computed(() => {
  return currentRoom.value?.ownerId === myPlayerId
})

// 可选副本列表
const bossList = [
  { id: 'raid_gladiator', name: '角斗士·血斧' },
  { id: 'raid_lava_core', name: '炎核·熔岩巨像' },
  { id: 'raid_bishop', name: '永夜主教' }
]

const difficulties = [
  { label: '普通', value: 'normal' },
  { label: '困难', value: 'hard' },
  { label: '噩梦', value: 'nightmare' }
]

function difficultyLabel(value) {
  const map = { normal: '普通', hard: '困难', nightmare: '噩梦' }
  return map[value] || value
}

const createForm = reactive({
  bossId: props.bossId,
  maxPlayers: 2,
  difficulty: 'normal',
  password: '',
  minGearScore: 0
})

// ========== WebSocket 连接 ==========
function connect() {
  ws = new WebSocket('ws://localhost:8080/ws')
  ws.onopen = () => {
    isConnected.value = true
    fetchRooms()
  }
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'room_list') {
        rooms.value = msg.rooms || []
        // 检查自己是否在某个房间中
        const found = rooms.value.find(r => r.members?.some(m => m.id === myPlayerId))
        if (found) {
          myRoom.value = found
        }
      } else if (msg.type === 'room_created') {
        const newRoom = msg.room
        rooms.value.push(newRoom)
        // 自动设为我的房间并打开详情
        myRoom.value = newRoom
        currentRoom.value = newRoom
        showRoomDetail.value = true
        showCreateDialog.value = false
      } else if (msg.type === 'room_joined') {
        myRoom.value = msg.room
        currentRoom.value = msg.room
        showRoomDetail.value = true
      } else if (msg.type === 'match_success') {
        emit('close')
        window.dispatchEvent(new CustomEvent('multiplayer_battle', {
          detail: { roomId: msg.roomId, opponentId: msg.opponentId, bossId: props.bossId }
        }))
      }
    } catch (e) {}
  }
  ws.onclose = () => { isConnected.value = false }
  ws.onerror = () => { isConnected.value = false }
}

function fetchRooms() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'get_rooms' }))
  } else {
    // 模拟数据
    rooms.value = [
      {
        id: '1', name: '角斗士·血斧', ownerName: '玩家A', ownerId: 'playerA',
        players: 1, maxPlayers: 2, difficulty: 'normal', hasPassword: false, minGearScore: 0,
        members: [{ id: 'playerA', name: '玩家A', gearScore: 300, isOwner: true }]
      },
      {
        id: '2', name: '永夜主教', ownerName: '玩家B', ownerId: 'playerB',
        players: 2, maxPlayers: 3, difficulty: 'hard', hasPassword: true, minGearScore: 500,
        members: [
          { id: 'playerB', name: '玩家B', gearScore: 800, isOwner: true },
          { id: 'playerC', name: '玩家C', gearScore: 600, isOwner: false }
        ]
      }
    ]
  }
}

// 点击房间处理
function handleRoomClick(room) {
  if (room.hasPassword) {
    pendingRoom.value = room
    showPasswordDialog.value = true
  } else {
    joinRoom(room.id)
  }
}

// 验证密码
function verifyPassword() {
  if (pendingRoom.value) {
    // 模拟密码验证：任意非空密码都通过
    if (passwordInput.value.trim()) {
      joinRoom(pendingRoom.value.id)
      showPasswordDialog.value = false
      passwordInput.value = ''
      pendingRoom.value = null
    }
  }
}

// 加入房间
function joinRoom(roomId) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'join_room', roomId, playerName: store.player.name || '玩家', playerId: myPlayerId }))
  } else {
    // 模拟
    const room = rooms.value.find(r => r.id === roomId)
    if (room && room.players < room.maxPlayers) {
      room.players++
      room.members.push({ id: myPlayerId, name: store.player.name || '玩家', gearScore: 300, isOwner: false })
      myRoom.value = room
      currentRoom.value = room
      showRoomDetail.value = true
    }
  }
}

// 创建房间
function createRoom() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'create_room',
      bossId: createForm.bossId,
      maxPlayers: createForm.maxPlayers,
      difficulty: createForm.difficulty,
      password: createForm.password,
      minGearScore: createForm.minGearScore,
      ownerName: store.player.name || '玩家',
      ownerId: myPlayerId
    }))
  } else {
    // 模拟
    const newRoom = {
      id: Date.now().toString(),
      name: bossList.find(b => b.id === createForm.bossId)?.name || createForm.bossId,
      ownerName: store.player.name || '玩家',
      ownerId: myPlayerId,
      players: 1,
      maxPlayers: createForm.maxPlayers,
      difficulty: createForm.difficulty,
      hasPassword: !!createForm.password,
      minGearScore: createForm.minGearScore,
      members: [{ id: myPlayerId, name: store.player.name || '玩家', gearScore: 300, isOwner: true }]
    }
    rooms.value.push(newRoom)
    myRoom.value = newRoom
    currentRoom.value = newRoom
    showRoomDetail.value = true
    showCreateDialog.value = false
  }
}

// 打开房间详情（从我的房间入口）
function openRoomDetail(room) {
  currentRoom.value = room
  showRoomDetail.value = true
}

// 踢人
function kickMember(memberId) {
  const room = currentRoom.value
  if (room) {
    room.members = room.members.filter(m => m.id !== memberId)
    room.players--
  }
}

// 邀请（模拟分享链接）
function inviteFriend() {
  alert('邀请链接已复制：' + window.location.origin + '?room=' + currentRoom.value.id)
}

// 解散
function disbandRoom() {
  if (ws) ws.send(JSON.stringify({ type: 'disband_room', roomId: currentRoom.value.id }))
  rooms.value = rooms.value.filter(r => r.id !== currentRoom.value.id)
  myRoom.value = null
  currentRoom.value = null
  showRoomDetail.value = false
}

// 退出房间（非房主）
function leaveRoom() {
  if (ws) ws.send(JSON.stringify({ type: 'leave_room', roomId: currentRoom.value.id }))
  myRoom.value = null
  currentRoom.value = null
  showRoomDetail.value = false
}

// 开始战斗
function startBattle() {
  if (currentRoom.value.players < currentRoom.value.maxPlayers) return
  emit('close')
  window.dispatchEvent(new CustomEvent('multiplayer_battle', {
    detail: { roomId: currentRoom.value.id, opponentId: 'opponent', bossId: props.bossId }
  }))
}

onMounted(() => { connect() })
onUnmounted(() => { if (ws) ws.close() })
</script>

<style scoped>
/* ========== 全局变量 ========== */
:root {
  --gold: #ffd700;
  --gold-glow: rgba(255,215,0,0.25);
  --dark-bg: rgba(15, 25, 45, 0.96);
  --border-gold: rgba(184, 154, 106, 0.6);
  --card-bg: rgba(0, 0, 0, 0.35);
}

/* ========== 基础布局 ========== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(16px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

.panel {
  width: 95vw;
  max-width: 520px;
  height: 85vh;
  background: var(--dark-bg);
  border: 2px solid var(--border-gold);
  border-radius: 28px;
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}

/* 顶部栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  padding-bottom: 8px;
}
.top-bar h2 {
  font-size: 14px;
  color: var(--gold);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
.boss-name {
  font-size: 9px;
  color: #ffaa66;
  background: rgba(0,0,0,0.5);
  padding: 4px 8px;
  border-radius: 20px;
  letter-spacing: 1px;
}
.close-btn {
  background: none;
  border: none;
  color: #ffd;
  font-size: 22px;
  cursor: pointer;
  transition: transform 0.1s, color 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.close-btn:hover {
  color: #ffaa66;
  transform: scale(1.1);
  background: rgba(255,255,255,0.05);
}

/* 操作栏 */
.action-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.pixel-btn {
  background: #2a2a3a;
  border: 2px solid #5a5a7a;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  padding: 8px 14px;
  font-size: 9px;
  cursor: pointer;
  border-radius: 40px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}
.pixel-btn:hover {
  transform: translateY(-2px);
  background: #3a3a5a;
  border-color: #b89a6a;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}
.pixel-btn:active {
  transform: translateY(1px);
}
.pixel-btn.primary {
  background: rgba(255, 215, 0, 0.18);
  border-color: var(--gold);
  color: var(--gold);
}
.pixel-btn.primary:hover {
  background: rgba(255, 215, 0, 0.3);
  border-color: #ffcc33;
  box-shadow: 0 0 8px rgba(255,215,0,0.3);
}
.pixel-btn.warning {
  background: rgba(255, 165, 0, 0.15);
  border-color: #ffa500;
  color: #ffaa66;
}
.pixel-btn.danger {
  background: rgba(255, 68, 68, 0.15);
  border-color: #ff4444;
  color: #ff8888;
}
.pixel-btn.micro {
  font-size: 6px;
  padding: 4px 8px;
}
.pixel-btn.back-btn {
  margin-top: 12px;
  width: 100%;
  justify-content: center;
}
.pixel-btn.full-width {
  width: 100%;
  margin-top: 12px;
}

/* 我的房间区域 */
.my-room-section {
  margin-bottom: 12px;
}
.section-label {
  font-size: 9px;
  color: var(--gold);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 1px;
}
.room-card.mine {
  border: 1px solid var(--gold);
  background: rgba(255, 215, 0, 0.05);
  box-shadow: 0 0 10px rgba(255,215,0,0.1);
}
.room-card {
  background: var(--card-bg);
  border: 1px solid rgba(184, 154, 106, 0.3);
  border-radius: 18px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.room-card:hover {
  border-color: var(--gold);
  background: rgba(0,0,0,0.5);
  transform: scale(1.01);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
.room-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.room-icon {
  font-size: 26px;
  color: #6495ed;
  flex-shrink: 0;
}
.room-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.room-name {
  font-size: 10px;
  font-weight: bold;
  color: #ffd;
  text-shadow: 0 1px 0 #000;
}
.room-owner {
  font-size: 7px;
  color: #aaa;
}
.room-players {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 8px;
  color: var(--gold);
  background: rgba(0,0,0,0.4);
  padding: 3px 8px;
  border-radius: 20px;
  flex-shrink: 0;
}
.room-details {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.detail-tag {
  font-size: 7px;
  color: #bbb;
  background: rgba(255, 255, 255, 0.08);
  padding: 3px 8px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.5px;
}

/* 房间列表滚动区域 */
.room-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
  padding-right: 4px;
}
/* 自定义滚动条 */
.room-list::-webkit-scrollbar {
  width: 4px;
}
.room-list::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.05);
  border-radius: 4px;
}
.room-list::-webkit-scrollbar-thumb {
  background: var(--gold);
  border-radius: 4px;
}
.empty {
  text-align: center;
  color: #888;
  padding: 32px 16px;
  font-size: 9px;
}

/* 房间详情 */
.detail-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}
.detail-header {
  margin-bottom: 16px;
  background: rgba(0,0,0,0.3);
  padding: 10px;
  border-radius: 16px;
  text-align: center;
}
.detail-name {
  font-size: 13px;
  color: var(--gold);
  display: block;
  margin-bottom: 4px;
}
.detail-owner {
  font-size: 8px;
  color: #aaa;
}
.member-list {
  margin-bottom: 20px;
}
.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  font-size: 8px;
}
.member-item .owner {
  color: var(--gold);
}
.member-name {
  flex: 1;
  font-size: 8px;
}
.member-gear {
  color: #aaa;
  font-size: 7px;
}
.owner-actions, .member-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

/* 连接状态 */
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
  color: #777;
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f44336;
  box-shadow: 0 0 4px #f44336;
}
.status-dot.connected {
  background: #4caf50;
  box-shadow: 0 0 4px #4caf50;
}

/* ========== 弹窗美化 ========== */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 300;
}
.modal-panel {
  width: 90vw;
  max-width: 400px;
  background: rgba(15, 25, 45, 0.98);
  border: 2px solid var(--border-gold);
  border-radius: 28px;
  padding: 20px;
  color: #ffd;
  font-family: 'Press Start 2P', cursive;
  box-shadow: 0 20px 35px rgba(0,0,0,0.5);
}
.modal-panel.small {
  max-width: 300px;
}
.modal-panel h3 {
  font-size: 12px;
  color: var(--gold);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}
.form-item {
  margin-bottom: 14px;
}
.form-item label {
  display: block;
  font-size: 8px;
  color: #aaa;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}
.pixel-input {
  width: 100%;
  padding: 8px 10px;
  background: #1a1a2e;
  border: 2px solid #5a5a7a;
  border-radius: 14px;
  color: #fff;
  font-family: 'Press Start 2P', cursive;
  font-size: 8px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.pixel-input:focus {
  border-color: var(--gold);
  outline: none;
  background: #0f0f1a;
}
.radio-group {
  display: flex;
  gap: 8px;
}
.radio-btn {
  background: #1a1a2e;
  border: 2px solid #5a5a7a;
  color: #aaa;
  padding: 5px 12px;
  border-radius: 20px;
  font-family: 'Press Start 2P', cursive;
  font-size: 7px;
  cursor: pointer;
  transition: all 0.2s;
}
.radio-btn.active {
  background: rgba(255,215,0,0.2);
  border-color: var(--gold);
  color: var(--gold);
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

/* 横屏适配保持原逻辑 */
@media (orientation: landscape) {
  .panel {
    width: 100vw;
    height: 100vh;
    max-width: none;
    border-radius: 0;
    padding: 12px 20px;
  }
  .pixel-btn {
    padding: 6px 12px;
  }
}
</style>