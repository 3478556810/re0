import { ref } from 'vue'
import { useGameStore } from '@/store/gameStore'

export function useMultiplayer(bossId, bossName) {
  const store = useGameStore()
  const rooms = ref([])
  const myRoom = ref(null)
  const currentRoom = ref(null)
  const isConnected = ref(false)
  const battleCountdown = ref(0) // 战斗倒计时，0 表示未开始

  let ws = null
  const myPlayerId = ref(store.player.id || `temp_${Date.now()}`)

  function connect() {
    ws = new WebSocket('ws://localhost:8080/ws')
    ws.onopen = () => {
      isConnected.value = true
      // 等待 welcome 消息才拉取列表
    }
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        console.log('[Multiplayer]', msg.type, msg)

        if (msg.type === 'welcome' && msg.yourId) {
          myPlayerId.value = msg.yourId
          console.log('真实ID:', myPlayerId.value)
          fetchRooms()
        } else if (msg.type === 'room_list') {
          console.table(msg.rooms.map(r => ({ id: r.id, name: r.name, status: r.status })));
          rooms.value = msg.rooms || []
          // 重新查找自己的房间
          const my = rooms.value.find(r => r.members?.some(m => m.id === myPlayerId.value))
          if (my) {
            myRoom.value = my
            if (currentRoom.value?.id === my.id) {
              currentRoom.value = my
            }
          } else {
            // 列表中找不到，可能被踢出或房间消失，清空本地引用
            if (myRoom.value && !rooms.value.find(r => r.id === myRoom.value.id)) {
              myRoom.value = null
              currentRoom.value = null
            }
          }
        } else if (msg.type === 'room_created') {
          const newRoom = msg.room
          rooms.value.push(newRoom)
          myRoom.value = newRoom
          currentRoom.value = newRoom
        } else if (msg.type === 'room_joined') {
          myRoom.value = msg.room
          currentRoom.value = msg.room
          fetchRooms() // 更新列表
     } else if (msg.type === 'room_updated') {
    console.log('收到 room_updated', msg.room.players, '人');
    const updatedRoom = msg.room;
    const idx = rooms.value.findIndex(r => r.id === updatedRoom.id);
    if (idx !== -1) {
        rooms.value[idx] = updatedRoom;
    }
    if (myRoom.value?.id === updatedRoom.id) {
        myRoom.value = updatedRoom;
    }
    if (currentRoom.value?.id === updatedRoom.id) {
        currentRoom.value = updatedRoom;
    }
}// 在 ws.onmessage 中，找到 else if (msg.type === 'room_disbanded') 部分
else if (msg.type === 'room_disbanded') {
    // 清空房间列表中的该房间
    rooms.value = rooms.value.filter(r => r.id !== msg.roomId)
    // 清空当前我的房间和详情房间
    if (myRoom.value?.id === msg.roomId) myRoom.value = null
    if (currentRoom.value?.id === msg.roomId) currentRoom.value = null
    // 关闭详情页（通过事件通知父组件）
    window.dispatchEvent(new CustomEvent('room_closed', { detail: { roomId: msg.roomId } }))
    // 强制刷新房间列表
    fetchRooms()
} else if (msg.type === 'kicked') {
    console.log('我被踢了，清理本地房间');
    myRoom.value = null;
    currentRoom.value = null;
    // 立刻从本地列表移除任何包含自己的房间
    rooms.value = rooms.value.filter(room => 
        !room.members?.some(m => m.id === myPlayerId.value)
    );
    window.dispatchEvent(new CustomEvent('player_kicked', { 
        detail: { message: msg.message || '你已被踢出房间' } 
    }));
    // 可选：再向服务器请求一次最新列表
    fetchRooms();
}else if (msg.type === 'match_success') {
          // 收到开始战斗信号，启动读秒
          startCountdown()
        }
      } catch (e) {
        console.error(e)
      }
    }
    ws.onclose = () => { isConnected.value = false }
    ws.onerror = () => { isConnected.value = false }
  }

  function startCountdown(seconds = 5) {
    battleCountdown.value = seconds
    const timer = setInterval(() => {
      battleCountdown.value--
      if (battleCountdown.value <= 0) {
        clearInterval(timer)
        battleCountdown.value = 0
        // 触发真正的战斗开始
        window.dispatchEvent(new CustomEvent('multiplayer_battle_go', {
          detail: { roomId: currentRoom.value?.id }
        }))
      }
    }, 1000)
  }

  function send(action, data) {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: action, ...data }))
  }

  function fetchRooms() { send('get_rooms') }

 function createRoom(params) {
  const roomData = {
    bossId: params.bossId,
    maxPlayers: params.maxPlayers,
    difficulty: params.difficulty,
    password: params.password,
    minGearScore: params.minGearScore,
    ownerName: store.player.name || '玩家',
    ownerId: myPlayerId.value
  }
  
  if (ws?.readyState === WebSocket.OPEN) {
    // 返回 Promise，等待后端返回 room_created
    return new Promise((resolve, reject) => {
      const handler = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'room_created') {
            const newRoom = msg.room
            rooms.value.push(newRoom)
            myRoom.value = newRoom
            currentRoom.value = newRoom
            ws.removeEventListener('message', handler)
            resolve()
          } else if (msg.type === 'error') {
            ws.removeEventListener('message', handler)
            reject(new Error(msg.message))
          }
        } catch (e) {}
      }
      ws.addEventListener('message', handler)
      send('create_room', roomData)
    })
  } else {
    // 模拟模式也返回 Promise
    return new Promise((resolve) => {
      const newRoom = {
        id: Date.now().toString(),
        ...roomData,
        players: 1,
        hasPassword: !!params.password,
        status: 'waiting',
        members: [{ id: myPlayerId.value, name: roomData.ownerName, gearScore: 300, isOwner: true }]
      }
      rooms.value.push(newRoom)
      myRoom.value = newRoom
      currentRoom.value = newRoom
      resolve()
    })
  }
}

  function joinRoom(roomId, password = null) {
    const payload = { roomId, playerName: store.player.name || '玩家', playerId: myPlayerId.value }
    if (password !== null) payload.password = password

    if (ws?.readyState === WebSocket.OPEN) {
      return new Promise((resolve, reject) => {
        const handler = (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === 'room_joined') {
              myRoom.value = msg.room
              currentRoom.value = msg.room
              ws.removeEventListener('message', handler)
              resolve()
            } else if (msg.type === 'error') {
              ws.removeEventListener('message', handler)
              reject(new Error(msg.message))
            }
          } catch (e) {}
        }
        ws.addEventListener('message', handler)
        send('join_room', payload)
      })
    } else {
      const room = rooms.value.find(r => r.id === roomId)
      if (!room || room.players >= room.maxPlayers) throw new Error('无法加入')
      if (room.hasPassword && room.password !== password) throw new Error('密码错误')
      room.players++
      room.members.push({ id: myPlayerId.value, name: payload.playerName, gearScore: 300, isOwner: false })
      myRoom.value = room
      currentRoom.value = room
    }
  }

  function leaveRoom(roomId) { send('leave_room', { roomId, playerId: myPlayerId.value }) }
  function disbandRoom(roomId) { send('disband_room', { roomId }) }
  function kickMember(roomId, memberId) { send('kick_member', { roomId, memberId }) }
  function startBattle(roomId) { send('start_battle', { roomId }) }

  function disconnect() {
    if (ws) { ws.close(); ws = null }
    isConnected.value = false
  }

  return {
    rooms, myRoom, currentRoom, isConnected, battleCountdown,
    connect, disconnect, fetchRooms, createRoom, joinRoom, leaveRoom, disbandRoom, kickMember, startBattle,
    myPlayerId
  }
}