import { defineStore } from 'pinia'

// 类型定义
export interface RoomPlayer {
  id: string
  name: string
  avatar?: string
  isReady: boolean
  isOnline: boolean
  isHost: boolean
  joinedAt: number
  lastSeen: number
}

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  message: string
  timestamp: number
  type: 'text' | 'system' | 'emoji'
}

export interface RoomInfo {
  code: string
  name?: string
  hostId: string
  maxPlayers: number
  currentPlayers: number
  isPrivate: boolean
  gameMode: 'classic' | 'custom'
  createdAt: number
  settings: RoomSettings
}

export interface RoomSettings {
  gameSpeed: 'slow' | 'normal' | 'fast'
  autoPlayTimeout: number
  allowSpectators: boolean
  chatEnabled: boolean
}

export const useRoomStore = defineStore('room', () => {
  // 基础状态
  const roomInfo = ref<RoomInfo | null>(null)
  const players = ref<RoomPlayer[]>([])
  const chatMessages = ref<ChatMessage[]>([])
  const isConnecting = ref(false)
  const isConnected = ref(false)
  const gameStarted = ref(false)

  // 当前用户状态
  const currentUserId = ref<string>('')
  const isHost = ref(false)

  // 计算属性
  const hostPlayer = computed(() => {
    return players.value.find(p => p.isHost) || null
  })

  const currentUser = computed(() => {
    return players.value.find(p => p.id === currentUserId.value) || null
  })

  const allPlayersReady = computed(() => {
    return players.value.length === 3 && players.value.every(p => p.isReady)
  })

  // 房主不需要准备，只需要其他玩家都准备好
  const nonHostPlayersReady = computed(() => {
    const nonHostPlayers = players.value.filter(p => !p.isHost)
    return players.value.length === 3 && nonHostPlayers.every(p => p.isReady)
  })

  const canStartGame = computed(() => {
    return isHost.value && nonHostPlayersReady.value && !gameStarted.value
  })

  // Actions
  const createRoom = async (): Promise<string> => {
    isConnecting.value = true
    
    try {
      // 生成房间码
      const roomCode = generateRoomCode()
      
      // 获取用户信息
      const gameStore = useGameStore()
      let playerId = gameStore.playerId
      
      // 如果没有玩家ID，生成一个基于设备的唯一ID
      if (!playerId) {
        if (process.client) {
          const { generateUniquePlayerId } = await import('~/utils/deviceId')
          playerId = await generateUniquePlayerId()
        } else {
          playerId = generatePlayerId()
        }
      }
      
      const playerName = gameStore.playerName || '房主'
      
      // 创建房间信息
      roomInfo.value = {
        code: roomCode,
        hostId: playerId,
        maxPlayers: 3,
        currentPlayers: 1,
        isPrivate: false,
        gameMode: 'classic',
        createdAt: Date.now(),
        settings: {
          gameSpeed: 'normal',
          autoPlayTimeout: 30,
          allowSpectators: false,
          chatEnabled: true
        }
      }
      
      // 设置当前用户
      currentUserId.value = playerId
      isHost.value = true
      console.log('🏠 房间创建 - 设置房主状态:', { playerId, isHost: isHost.value })
      
      // 添加房主到玩家列表
      // 房主不需要准备状态，始终为false
      const hostPlayer: RoomPlayer = {
        id: playerId,
        name: playerName,
        isReady: false, // 房主不参与准备机制
        isOnline: true,
        isHost: true,
        joinedAt: Date.now(),
        lastSeen: Date.now()
      }
      
      players.value = [hostPlayer]
      
      // 初始化网络连接
      await initializeNetworking(roomCode, true)
      
      // 确保房主状态在网络初始化后不被覆盖
      isHost.value = true
      console.log('🔧 网络初始化后 - 重新确认房主状态:', { isHost: isHost.value })
      
      isConnected.value = true
      
      // 发送系统消息
      addSystemMessage(`房间创建成功，房间码: ${roomCode}`)
      
      console.log(`房间创建成功: ${roomCode}`)
      return roomCode
      
    } catch (error) {
      console.error('创建房间失败:', error)
      throw new Error('创建房间失败，请重试')
    } finally {
      isConnecting.value = false
    }
  }

  const joinRoom = async (roomCode: string): Promise<void> => {
    isConnecting.value = true
    
    try {
      // 验证房间码格式
      if (!validateRoomCode(roomCode)) {
        throw new Error('房间码格式无效')
      }
      
      // 获取用户信息
      const gameStore = useGameStore()
      let playerId = gameStore.playerId
      
      // 如果没有玩家ID，生成一个基于设备的唯一ID
      if (!playerId) {
        if (process.client) {
          const { generateUniquePlayerId } = await import('~/utils/deviceId')
          playerId = await generateUniquePlayerId()
        } else {
          playerId = generatePlayerId()
        }
      }
      
      const playerName = gameStore.playerName || `玩家${Math.floor(Math.random() * 1000)}`
      
      currentUserId.value = playerId
      isHost.value = false
      console.log('👥 加入房间 - 设置非房主状态:', { playerId, isHost: isHost.value })
      
      // 尝试连接到房间
      await connectToRoom(roomCode, playerId, playerName)
      
      isConnected.value = true
      
      console.log(`成功加入房间: ${roomCode}`)
      
    } catch (error) {
      console.error('加入房间失败:', error)
      throw new Error('加入房间失败，房间可能不存在或已满员')
    } finally {
      isConnecting.value = false
    }
  }

  const leaveRoom = async (): Promise<void> => {
    try {
      // 发送离开消息
      if (isConnected.value) {
        await sendRoomMessage({
          type: 'PLAYER_LEAVE',
          playerId: currentUserId.value,
          timestamp: Date.now()
        })
      }
      
      // 清理状态
      await cleanup()
      
      console.log('已离开房间')
      
    } catch (error) {
      console.error('离开房间失败:', error)
    }
  }

  const toggleReady = async (): Promise<void> => {
    const currentPlayer = currentUser.value
    if (!currentPlayer) return
    
    // 房主不能切换准备状态
    if (currentPlayer.isHost) {
      console.log('房主不需要准备')
      return
    }
    
    try {
      const newReadyState = !currentPlayer.isReady
      
      // 发送准备状态变更
      await sendRoomMessage({
        type: 'PLAYER_READY_CHANGE',
        playerId: currentUserId.value,
        isReady: newReadyState,
        timestamp: Date.now()
      })
      
      // 更新本地状态
      currentPlayer.isReady = newReadyState
      
      // 发送聊天消息
      addSystemMessage(
        `${currentPlayer.name} ${newReadyState ? '已准备' : '取消准备'}`
      )
      
    } catch (error) {
      console.error('切换准备状态失败:', error)
      throw error
    }
  }

  const startGame = async (): Promise<void> => {
    if (!canStartGame.value) {
      throw new Error('无法开始游戏')
    }
    
    try {
      // 发送游戏开始消息
      await sendRoomMessage({
        type: 'GAME_START',
        hostId: currentUserId.value,
        players: players.value.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar
        })),
        timestamp: Date.now()
      })
      
      gameStarted.value = true
      
      // 初始化游戏状态
      const gameStore = useGameStore()
      await gameStore.startNewGame()
      
      addSystemMessage('游戏开始！')
      
    } catch (error) {
      console.error('开始游戏失败:', error)
      throw error
    }
  }

  const kickPlayer = async (playerId: string): Promise<void> => {
    if (!isHost.value) {
      throw new Error('只有房主可以踢出玩家')
    }
    
    const player = players.value.find(p => p.id === playerId)
    if (!player) return
    
    try {
      // 发送踢出消息
      await sendRoomMessage({
        type: 'PLAYER_KICK',
        hostId: currentUserId.value,
        kickedPlayerId: playerId,
        timestamp: Date.now()
      })
      
      // 移除玩家
      const index = players.value.findIndex(p => p.id === playerId)
      if (index !== -1) {
        players.value.splice(index, 1)
      }
      
      addSystemMessage(`${player.name} 被踢出房间`)
      
    } catch (error) {
      console.error('踢出玩家失败:', error)
      throw error
    }
  }

  const sendChatMessage = async (message: string): Promise<void> => {
    if (!message.trim() || !roomInfo.value?.settings.chatEnabled) return
    
    const currentPlayer = currentUser.value
    if (!currentPlayer) return
    
    try {
      const chatMessage: ChatMessage = {
        id: generateMessageId(),
        playerId: currentUserId.value,
        playerName: currentPlayer.name,
        message: message.trim(),
        timestamp: Date.now(),
        type: 'text'
      }
      
      // 发送到其他玩家
      await sendRoomMessage({
        type: 'CHAT_MESSAGE',
        message: chatMessage,
        timestamp: Date.now()
      })
      
      // 添加到本地聊天记录
      chatMessages.value.push(chatMessage)
      
      // 限制聊天记录数量
      if (chatMessages.value.length > 100) {
        chatMessages.value = chatMessages.value.slice(-100)
      }
      
    } catch (error) {
      console.error('发送消息失败:', error)
    }
  }

  const updateRoomSettings = async (settings: Partial<RoomSettings>): Promise<void> => {
    if (!isHost.value || !roomInfo.value) return
    
    try {
      roomInfo.value.settings = { ...roomInfo.value.settings, ...settings }
      
      // 发送设置更新
      await sendRoomMessage({
        type: 'ROOM_SETTINGS_UPDATE',
        settings: roomInfo.value.settings,
        timestamp: Date.now()
      })
      
      addSystemMessage('房间设置已更新')
      
    } catch (error) {
      console.error('更新房间设置失败:', error)
      throw error
    }
  }

  // 网络消息处理
  const handleRoomMessage = async (message: any) => {
    try {
      switch (message.type) {
        case 'PLAYER_JOIN':
          await handlePlayerJoin(message)
          break
          
        case 'PLAYER_LEAVE':
          handlePlayerLeave(message)
          break
          
        case 'PLAYER_READY_CHANGE':
          handlePlayerReadyChange(message)
          break
          
        case 'CHAT_MESSAGE':
          handleChatMessage(message)
          break
          
        case 'GAME_START':
          handleGameStart(message)
          break
          
        case 'PLAYER_KICK':
          handlePlayerKick(message)
          break
          
        case 'ROOM_SETTINGS_UPDATE':
          handleRoomSettingsUpdate(message)
          break
          
        case 'PLAYER_NAME_CHANGE':
          handlePlayerNameChange(message)
          break
          
        default:
          console.warn('未知的房间消息类型:', message.type)
      }
    } catch (error) {
      console.error('处理房间消息失败:', error)
    }
  }

  const handlePlayerJoin = async (message: any) => {
    const { playerId, playerName, playerInfo } = message
    
    // 检查玩家是否已存在
    if (players.value.find(p => p.id === playerId)) {
      console.log(`玩家 ${playerName} (${playerId}) 已存在，跳过重复添加`)
      return
    }
    
    // 如果是房主自己，跳过处理（房主在创建房间时已经添加）
    if (isHost.value && playerId === currentUserId.value) {
      console.log(`房主 ${playerName} 跳过自己的加入消息`)
      return
    }
    
    // 检查房间是否已满
    if (players.value.length >= 3) {
      console.log('房间已满，无法添加新玩家')
      // 发送房间已满消息
      return
    }
    
    const newPlayer: RoomPlayer = {
      id: playerId,
      name: playerName,
      avatar: playerInfo?.avatar,
      isReady: false,
      isOnline: true,
      isHost: false,
      joinedAt: Date.now(),
      lastSeen: Date.now()
    }
    
    players.value.push(newPlayer)
    console.log(`玩家 ${playerName} 成功加入房间`)
    
    addSystemMessage(`${playerName} 加入了房间`)
    
    // 如果是房主，发送房间信息给新玩家
    if (isHost.value) {
      await sendRoomMessage({
        type: 'ROOM_INFO',
        roomInfo: roomInfo.value,
        players: players.value,
        targetPlayerId: playerId,
        timestamp: Date.now()
      })
    }
  }

  const handlePlayerLeave = (message: any) => {
    const { playerId } = message
    const playerIndex = players.value.findIndex(p => p.id === playerId)
    
    if (playerIndex !== -1) {
      const player = players.value[playerIndex]
      players.value.splice(playerIndex, 1)
      
      addSystemMessage(`${player.name} 离开了房间`)
      
      // 如果离开的是房主，需要转移房主权限
      if (player.isHost && players.value.length > 0) {
        const newHost = players.value[0]
        newHost.isHost = true
        
        if (newHost.id === currentUserId.value) {
          isHost.value = true
          addSystemMessage(`您已成为新的房主`)
        } else {
          addSystemMessage(`${newHost.name} 成为新的房主`)
        }
      }
    }
  }

  const handlePlayerReadyChange = (message: any) => {
    const { playerId, isReady } = message
    const player = players.value.find(p => p.id === playerId)
    
    if (player) {
      player.isReady = isReady
    }
  }

  const handleChatMessage = (message: any) => {
    const chatMessage = message.message as ChatMessage
    chatMessages.value.push(chatMessage)
    
    // 限制聊天记录数量
    if (chatMessages.value.length > 100) {
      chatMessages.value = chatMessages.value.slice(-100)
    }
  }

  const handleGameStart = (message: any) => {
    gameStarted.value = true
    addSystemMessage('游戏即将开始...')
  }

  const handlePlayerKick = (message: any) => {
    const { kickedPlayerId } = message
    
    if (kickedPlayerId === currentUserId.value) {
      // 自己被踢出
      addSystemMessage('您被房主踢出了房间')
      setTimeout(() => {
        cleanup()
        // 返回大厅
        navigateTo('/')
      }, 2000)
    } else {
      // 其他玩家被踢出
      const playerIndex = players.value.findIndex(p => p.id === kickedPlayerId)
      if (playerIndex !== -1) {
        const player = players.value[playerIndex]
        players.value.splice(playerIndex, 1)
        addSystemMessage(`${player.name} 被踢出房间`)
      }
    }
  }

  const handleRoomSettingsUpdate = (message: any) => {
    if (roomInfo.value) {
      roomInfo.value.settings = message.settings
    }
  }

  const handlePlayerNameChange = (message: any) => {
    const { playerId, newName, oldName } = message
    
    // 更新玩家列表中的名称
    const player = players.value.find(p => p.id === playerId)
    if (player) {
      player.name = newName
      
      // 添加系统消息
      if (oldName && oldName !== newName) {
        addSystemMessage(`${oldName} 更名为 ${newName}`)
      }
      
      console.log(`玩家 ${playerId} 名称从 "${oldName}" 更改为 "${newName}"`)
    }
  }

  const syncPlayerNameChange = async (newName: string) => {
    if (!isConnected.value || !currentUserId.value) return
    
    try {
      const oldName = players.value.find(p => p.id === currentUserId.value)?.name || ''
      
      await sendRoomMessage({
        type: 'PLAYER_NAME_CHANGE',
        playerId: currentUserId.value,
        newName,
        oldName,
        timestamp: Date.now()
      })
      
      console.log('玩家名称同步成功:', newName)
    } catch (error) {
      console.error('同步玩家名称失败:', error)
      throw error
    }
  }

  // 工具函数
  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const generatePlayerId = (): string => {
    return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const generateMessageId = (): string => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const validateRoomCode = (code: string): boolean => {
    return /^[A-Z0-9]{6}$/.test(code)
  }

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: generateMessageId(),
      playerId: 'system',
      playerName: '系统',
      message,
      timestamp: Date.now(),
      type: 'system'
    }
    
    chatMessages.value.push(systemMessage)
  }

  const initializeNetworking = async (roomCode: string, isHost: boolean) => {
    // 初始化WebRTC网络连接
    const networkStore = useNetworkStore()
    await networkStore.initializeP2PConnection(roomCode, isHost)
    
    // 注册消息处理器
    networkStore.onMessage(handleRoomMessage)
  }

  const connectToRoom = async (roomCode: string, playerId: string, playerName: string) => {
    // 连接到现有房间
    const networkStore = useNetworkStore()
    await networkStore.connectToHost(roomCode)
    
    // 发送加入请求
    await sendRoomMessage({
      type: 'PLAYER_JOIN',
      playerId,
      playerName,
      playerInfo: {
        avatar: null
      },
      timestamp: Date.now()
    })
    
    // 注册消息处理器
    networkStore.onMessage(handleRoomMessage)
  }

  const sendRoomMessage = async (message: any) => {
    const networkStore = useNetworkStore()
    await networkStore.sendMessage(message)
  }

  const cleanup = async () => {
    // 清理网络连接
    const networkStore = useNetworkStore()
    await networkStore.disconnect()
    
    // 重置状态
    roomInfo.value = null
    players.value = []
    chatMessages.value = []
    isConnecting.value = false
    isConnected.value = false
    gameStarted.value = false
    currentUserId.value = ''
    isHost.value = false
  }

  return {
    // 状态
    roomInfo: readonly(roomInfo),
    players: readonly(players),
    chatMessages: readonly(chatMessages),
    isConnecting: readonly(isConnecting),
    isConnected: readonly(isConnected),
    gameStarted: readonly(gameStarted),
    currentUserId: readonly(currentUserId),
    isHost: readonly(isHost),

    // 计算属性
    hostPlayer,
    currentUser,
    allPlayersReady,
    nonHostPlayersReady,
    canStartGame,

    // 方法
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    kickPlayer,
    sendChatMessage,
    updateRoomSettings,
    handleRoomMessage,
    syncPlayerNameChange
  }
})
