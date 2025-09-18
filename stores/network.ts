import { defineStore } from 'pinia'

// 类型定义
export interface NetworkConnection {
  id: string
  peer: RTCPeerConnection
  dataChannel: RTCDataChannel | null
  status: 'connecting' | 'connected' | 'disconnected' | 'failed'
  latency: number
  lastSeen: number
}

export interface NetworkStats {
  latency: number
  packetLoss: number
  bandwidth: number
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  connectionType: 'local' | 'internet' | 'mobile' | 'unknown'
}

export interface NetworkMessage {
  type: string
  data: any
  timestamp: number
  sequenceId: number
  senderId: string
  targetId?: string
}

export const useNetworkStore = defineStore('network', () => {
  // 基础状态
  const status = ref<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected')
  const isHost = ref(false)
  const roomCode = ref<string>('')
  const playerId = ref<string>('')
  
  // 连接管理
  const connections = ref<Map<string, NetworkConnection>>(new Map())
  const messageHandlers = ref<Array<(message: any) => void>>([])
  const messageQueue = ref<NetworkMessage[]>([])
  const sequenceCounter = ref(0)
  
  // 网络统计
  const stats = ref<NetworkStats>({
    latency: 0,
    packetLoss: 0,
    bandwidth: 0,
    quality: 'excellent',
    connectionType: 'unknown'
  })
  
  // P2P配置
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10
  }

  // 计算属性
  const isConnecting = computed(() => status.value === 'connecting' || status.value === 'reconnecting')
  const isConnected = computed(() => status.value === 'connected')
  const connectedPeers = computed(() => {
    return Array.from(connections.value.values()).filter(conn => conn.status === 'connected')
  })
  const latency = computed(() => stats.value.latency)
  const quality = computed(() => stats.value.quality)
  const connectionType = computed(() => stats.value.connectionType)

  // Actions
  const initializeP2PConnection = async (code: string, asHost: boolean): Promise<void> => {
    status.value = 'connecting'
    roomCode.value = code
    isHost.value = asHost
    playerId.value = generatePeerId()
    
    try {
      if (asHost) {
        await setupAsHost(code)
      } else {
        await setupAsClient(code)
      }
      
      status.value = 'connected'
      startNetworkMonitoring()
      
      console.log(`P2P连接初始化完成 - ${asHost ? '房主' : '客户端'}`)
      
    } catch (error) {
      status.value = 'disconnected'
      console.error('P2P连接初始化失败:', error)
      throw error
    }
  }

  const connectToHost = async (code: string): Promise<void> => {
    status.value = 'connecting'
    roomCode.value = code
    isHost.value = false
    playerId.value = generatePeerId()
    
    try {
      // 通过信令服务器连接到房主
      await connectToRoom(code)
      
      status.value = 'connected'
      startNetworkMonitoring()
      
      console.log(`已连接到房间: ${code}`)
      
    } catch (error) {
      status.value = 'disconnected'
      console.error('连接房间失败:', error)
      throw error
    }
  }

  const sendMessage = async (message: any): Promise<void> => {
    if (!isConnected.value) {
      throw new Error('网络未连接')
    }
    
    const networkMessage: NetworkMessage = {
      type: message.type,
      data: message,
      timestamp: Date.now(),
      sequenceId: ++sequenceCounter.value,
      senderId: playerId.value,
      targetId: message.targetId
    }
    
    // 只记录非PING消息
    if (networkMessage.type !== 'PING') {
      console.log('发送网络消息:', networkMessage)
    }
    
    try {
      if (isHost.value) {
        // 房主广播给所有客户端
        await broadcastToClients(networkMessage)
      } else {
        // 客户端发送给房主
        await sendToHost(networkMessage)
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      // 添加到重试队列
      messageQueue.value.push(networkMessage)
      throw error
    }
  }

  const broadcastToClients = async (message: NetworkMessage): Promise<void> => {
    const promises = connectedPeers.value.map(conn => {
      if (conn.dataChannel && conn.dataChannel.readyState === 'open') {
        return sendMessageToPeer(conn, message)
      }
      return Promise.resolve()
    })
    
    await Promise.allSettled(promises)
  }

  const sendToHost = async (message: NetworkMessage): Promise<void> => {
    const connectedPeersList = connectedPeers.value
    const hostConnection = connectedPeersList[0] // 假设第一个连接是房主
    
    if (!hostConnection) {
      throw new Error('未找到房主连接')
    }
    
    if (hostConnection.dataChannel?.readyState === 'open') {
      await sendMessageToPeer(hostConnection, message)
    } else {
      throw new Error(`与房主的连接不可用，当前状态: ${hostConnection.dataChannel?.readyState || '未知'}`)
    }
  }

  const sendMessageToPeer = async (connection: NetworkConnection, message: NetworkMessage): Promise<void> => {
    if (!connection.dataChannel || connection.dataChannel.readyState !== 'open') {
      throw new Error('数据通道不可用')
    }
    
    try {
      const serialized = JSON.stringify(message)
      connection.dataChannel.send(serialized)
      
      // 更新连接最后活跃时间
      connection.lastSeen = Date.now()
      
    } catch (error) {
      console.error('发送消息到对等端失败:', error)
      throw error
    }
  }

  const onMessage = (handler: (message: any) => void): void => {
    messageHandlers.value.push(handler)
  }

  const offMessage = (handler: (message: any) => void): void => {
    const index = messageHandlers.value.indexOf(handler)
    if (index !== -1) {
      messageHandlers.value.splice(index, 1)
    }
  }

  const handleIncomingMessage = (message: NetworkMessage, fromPeer: string): void => {
    try {
      // 更新连接统计
      const connection = connections.value.get(fromPeer)
      if (connection) {
        connection.lastSeen = Date.now()
        connection.latency = Date.now() - message.timestamp
      }
      
      // 调用所有消息处理器
      messageHandlers.value.forEach(handler => {
        try {
          // 过滤掉系统内部消息（如PING）
          if (message.type !== 'PING' && message.type !== 'PONG') {
            handler(message.data)
          }
        } catch (error) {
          console.error('消息处理器执行失败:', error)
        }
      })
      
    } catch (error) {
      console.error('处理接收消息失败:', error)
    }
  }

  const startNetworkMonitoring = (): void => {
    // 每秒更新网络统计
    const monitoringInterval = setInterval(() => {
      if (!isConnected.value) {
        clearInterval(monitoringInterval)
        return
      }
      
      updateNetworkStats()
      checkConnectionHealth()
      
    }, 1000)

    // 每5秒发送一次PING消息测量延迟
    const pingInterval = setInterval(() => {
      if (!isConnected.value) {
        clearInterval(pingInterval)
        return
      }
      
      connectedPeers.value.forEach(connection => {
        sendPingMessage(connection.id)
      })
      
    }, 5000)
  }

  const updateNetworkStats = (): void => {
    const connections = connectedPeers.value
    if (connections.length === 0) return
    
    // 计算平均延迟
    const totalLatency = connections.reduce((sum, conn) => sum + conn.latency, 0)
    const avgLatency = totalLatency / connections.length
    
    // 检测连接类型
    const connectionType = detectConnectionType(avgLatency)
    
    // 计算质量等级
    const quality = calculateQuality(avgLatency, 0) // 简化版，暂不计算丢包率
    
    stats.value = {
      latency: Math.round(avgLatency),
      packetLoss: 0, // 需要实现丢包率计算
      bandwidth: 0,  // 需要实现带宽检测
      quality,
      connectionType
    }
  }

  const detectConnectionType = (latency: number): NetworkStats['connectionType'] => {
    if (latency < 10) return 'local'
    if (latency < 50) return 'internet'
    if (latency < 200) return 'mobile'
    return 'unknown'
  }

  const calculateQuality = (latency: number, packetLoss: number): NetworkStats['quality'] => {
    if (latency < 50 && packetLoss < 0.01) return 'excellent'
    if (latency < 100 && packetLoss < 0.03) return 'good'
    if (latency < 200 && packetLoss < 0.05) return 'fair'
    return 'poor'
  }

  const updateLatencyStats = (peerId: string): void => {
    const connection = connections.value.get(peerId)
    if (connection) {
      // 简单的延迟统计更新（不发送PING消息避免无限循环）
      connection.lastSeen = Date.now()
    }
  }

  const sendPingMessage = (peerId: string): void => {
    const connection = connections.value.get(peerId)
    if (connection && connection.dataChannel?.readyState === 'open') {
      // 发送ping消息测量延迟
      const pingMessage: NetworkMessage = {
        type: 'PING',
        data: { timestamp: Date.now() },
        timestamp: Date.now(),
        sequenceId: ++sequenceCounter.value,
        senderId: playerId.value
      }
      
      try {
        const serialized = JSON.stringify(pingMessage)
        connection.dataChannel.send(serialized)
        connection.lastSeen = Date.now()
      } catch (error) {
        console.error('发送PING消息失败:', error)
      }
    }
  }

  const checkConnectionHealth = (): void => {
    const now = Date.now()
    const timeout = 30000 // 30秒超时
    
    connections.value.forEach((connection, peerId) => {
      if (now - connection.lastSeen > timeout) {
        console.warn(`连接超时: ${peerId}`)
        handleConnectionLost(peerId)
      }
    })
  }

  const handleConnectionLost = (peerId: string): void => {
    const connection = connections.value.get(peerId)
    if (connection) {
      connection.status = 'disconnected'
      
      // 尝试重连
      attemptReconnection(peerId)
    }
  }

  const attemptReconnection = async (peerId: string): Promise<void> => {
    status.value = 'reconnecting'
    
    try {
      // 重连逻辑
      await reconnectToPeer(peerId)
      status.value = 'connected'
      
    } catch (error) {
      console.error('重连失败:', error)
      status.value = 'disconnected'
    }
  }

  const reconnectToPeer = async (peerId: string): Promise<void> => {
    // 重连实现
    console.log(`尝试重连到: ${peerId}`)
  }

  const disconnect = async (): Promise<void> => {
    status.value = 'disconnected'
    
    // 关闭所有连接
    connections.value.forEach(connection => {
      if (connection.dataChannel) {
        connection.dataChannel.close()
      }
      connection.peer.close()
    })
    
    // 清理状态
    connections.value.clear()
    messageHandlers.value = []
    messageQueue.value = []
    
    console.log('网络连接已断开')
  }

  const startMonitoring = (): void => {
    if (isConnected.value) {
      startNetworkMonitoring()
    }
  }

  const stopMonitoring = (): void => {
    // 停止监控的逻辑已在startNetworkMonitoring中处理
  }

  // 内部实现函数
  const setupAsHost = async (code: string): Promise<void> => {
    // 房主设置逻辑
    console.log(`设置为房主，房间码: ${code}`)
    
    // 注册到信令服务器
    await registerWithSignalingServer(code, playerId.value, true)
    
    // 等待客户端连接
    listenForIncomingConnections()
  }

  const setupAsClient = async (code: string): Promise<void> => {
    // 客户端设置逻辑
    console.log(`设置为客户端，连接到房间: ${code}`)
    
    // 通过信令服务器连接到房主
    await connectToRoom(code)
  }

  const connectToRoom = async (code: string): Promise<void> => {
    // 连接到房间的具体实现
    try {
      console.log(`尝试连接到房间: ${code}`)
      
      // 简化版本：直接模拟连接成功（跳过WebRTC复杂的信令过程）
      // 这是为了本地测试，实际部署时需要实现完整的WebRTC信令
      
      // 1. 检查房间是否存在
      const hostInfo = await getHostInfo(code)
      console.log(`找到房间房主:`, hostInfo)
      
      // 2. 模拟WebRTC连接建立成功
      await new Promise(resolve => setTimeout(resolve, 500)) // 模拟连接延迟
      
      // 3. 创建模拟的数据通道对象
      const mockDataChannel = {
        readyState: 'open' as const,
        send: (data: string) => {
          // 只记录非PING消息
          const message = JSON.parse(data)
          if (message.type !== 'PING') {
            console.log(`模拟发送消息:`, data)
          }
          // 在真实环境中，这里会通过WebRTC发送数据
          // 现在我们直接模拟消息到达
          setTimeout(() => {
            try {
              const networkMessage = JSON.parse(data)
              // 只记录非PING消息
              if (networkMessage.type !== 'PING') {
                console.log('模拟接收到网络消息:', networkMessage)
              }
              handleIncomingMessage(networkMessage, hostInfo.peerId)
            } catch (error) {
              console.error('模拟消息处理失败:', error)
            }
          }, 100)
        },
        close: () => {
          console.log('模拟数据通道关闭')
        },
        onopen: null as any,
        onclose: null as any,
        onerror: null as any,
        onmessage: null as any
      }
      
      // 4. 创建模拟的RTCPeerConnection
      const mockPeerConnection = {
        connectionState: 'connected' as const,
        close: () => {
          console.log('模拟peer连接关闭')
        }
      }
      
      // 5. 存储连接
      connections.value.set(hostInfo.peerId, {
        id: hostInfo.peerId,
        peer: mockPeerConnection as any,
        dataChannel: mockDataChannel as any,
        status: 'connected',
        latency: 50, // 模拟50ms延迟
        lastSeen: Date.now()
      })
      
      console.log(`模拟连接建立成功: ${hostInfo.peerId}`)
      
    } catch (error) {
      console.error('连接房间详细错误:', error)
      throw new Error(`连接房间失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const createPeerConnection = async (peerId: string): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection(rtcConfig)
    
    // 处理ICE候选
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // TODO: 实现真正的ICE候选发送
        console.log('ICE候选:', event.candidate)
      }
    }
    
    // 处理连接状态变化
    pc.onconnectionstatechange = () => {
      const connection = connections.value.get(peerId)
      if (connection) {
        switch (pc.connectionState) {
          case 'connected':
            connection.status = 'connected'
            break
          case 'disconnected':
          case 'failed':
            connection.status = 'disconnected'
            handleConnectionLost(peerId)
            break
        }
      }
    }
    
    // 处理数据通道
    pc.ondatachannel = (event) => {
      const channel = event.channel
      setupDataChannel(channel, peerId)
      
      const connection = connections.value.get(peerId)
      if (connection) {
        connection.dataChannel = channel
      }
    }
    
    return pc
  }

  const setupDataChannel = (channel: RTCDataChannel, peerId: string) => {
    channel.onopen = () => {
      console.log(`数据通道已打开: ${peerId}`)
      const connection = connections.value.get(peerId)
      if (connection) {
        connection.status = 'connected'
      }
    }
    
    channel.onclose = () => {
      console.log(`数据通道已关闭: ${peerId}`)
      const connection = connections.value.get(peerId)
      if (connection) {
        connection.status = 'disconnected'
      }
    }
    
    channel.onerror = (error) => {
      console.error(`数据通道错误 ${peerId}:`, error)
      const connection = connections.value.get(peerId)
      if (connection) {
        connection.status = 'failed'
      }
    }
    
    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleIncomingMessage(message, peerId)
      } catch (error) {
        console.error('解析消息失败:', error)
      }
    }
  }


  const listenForIncomingConnections = (): void => {
    // 监听来自信令服务器的连接请求
    console.log('开始监听客户端连接...')
  }

  // 简单信令服务器
  const registerWithSignalingServer = async (roomCode: string, peerId: string, isHost: boolean): Promise<void> => {
    console.log(`📡 注册到信令服务器: ${roomCode}, ${peerId}, ${isHost ? '房主' : '客户端'}`)
    
    if (process.client && isHost) {
      try {
        const { signalingService } = await import('~/utils/simpleSignaling')
        const gameStore = useGameStore()
        
        const roomInfo = {
          roomCode,
          hostPeerId: peerId,
          hostName: gameStore.playerName || '房主',
          timestamp: Date.now()
        }
        
        signalingService.registerRoom(roomInfo)
        console.log('📡 房间已注册到信令服务')
      } catch (error) {
        console.error('📡 信令服务注册失败:', error)
        // 降级到localStorage作为备选
        const roomData = {
          roomCode,
          hostPeerId: peerId,
          timestamp: Date.now()
        }
        localStorage.setItem(`room_${roomCode}`, JSON.stringify(roomData))
        console.log('💾 降级使用localStorage保存房间信息')
      }
    }
  }

  const getHostInfo = async (roomCode: string): Promise<{ peerId: string }> => {
    console.log(`📡 获取房间 ${roomCode} 的房主信息`)
    
    if (process.client) {
      try {
        // 首先尝试从URL解析房间信息
        const { parseRoomFromUrl } = await import('~/utils/simpleSignaling')
        const urlRoomInfo = parseRoomFromUrl()
        
        if (urlRoomInfo && urlRoomInfo.roomCode === roomCode) {
          console.log('📡 从URL获取到房主信息:', urlRoomInfo.hostInfo.hostPeerId)
          return { peerId: urlRoomInfo.hostInfo.hostPeerId }
        }
        
        // 然后尝试信令服务
        const { signalingService } = await import('~/utils/simpleSignaling')
        const roomInfo = signalingService.getRoomInfo(roomCode)
        
        if (roomInfo) {
          console.log('📡 从信令服务获取到房主信息:', roomInfo.hostPeerId)
          return { peerId: roomInfo.hostPeerId }
        }
      } catch (error) {
        console.error('📡 信令服务获取失败，尝试localStorage:', error)
      }
      
      // 降级到localStorage
      const roomDataStr = localStorage.getItem(`room_${roomCode}`)
      if (roomDataStr) {
        const roomData = JSON.parse(roomDataStr)
        if (roomData.hostPeerId) {
          console.log('💾 从localStorage获取到房主信息:', roomData.hostPeerId)
          return { peerId: roomData.hostPeerId }
        }
      }
    }
    
    throw new Error(`房间 ${roomCode} 不存在或房主信息不可用`)
  }

  const sendICECandidate = async (peerId: string, candidate: RTCIceCandidate): Promise<void> => {
    // 通过信令服务器发送ICE候选
    console.log(`发送ICE候选到: ${peerId}`)
  }

  const generatePeerId = (): string => {
    return `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }


  return {
    // 状态
    status: readonly(status),
    isHost: readonly(isHost),
    roomCode: readonly(roomCode),
    playerId: readonly(playerId),
    stats: readonly(stats),

    // 计算属性
    isConnecting,
    isConnected,
    connectedPeers,
    latency,
    quality,
    connectionType,

    // 方法
    initializeP2PConnection,
    connectToHost,
    sendMessage,
    onMessage,
    offMessage,
    disconnect,
    startMonitoring,
    stopMonitoring
  }
})
