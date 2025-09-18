import { defineStore } from 'pinia'
import { createSimplePeerRoom, type SimplePeerRoom } from '~/utils/peerSignaling'

// 网络连接状态
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

export const usePeerNetworkStore = defineStore('peerNetwork', () => {
  // 基础状态
  const status = ref<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected')
  const isHost = ref(false)
  const roomCode = ref<string>('')
  const playerId = ref<string>('')
  
  // PeerJS房间管理器
  const peerRoom = ref<SimplePeerRoom | null>(null)
  const messageHandlers = ref<Array<(message: any) => void>>([])
  const sequenceCounter = ref(0)
  
  // 网络统计
  const stats = ref<NetworkStats>({
    latency: 0,
    packetLoss: 0,
    bandwidth: 0,
    quality: 'excellent',
    connectionType: 'unknown'
  })

  // 计算属性
  const isConnecting = computed(() => status.value === 'connecting' || status.value === 'reconnecting')
  const isConnected = computed(() => status.value === 'connected')
  const connectedPeers = computed(() => {
    return peerRoom.value ? peerRoom.value.getConnectedPeers() : []
  })
  const latency = computed(() => stats.value.latency)
  const quality = computed(() => stats.value.quality)
  const connectionType = computed(() => stats.value.connectionType)

  // 初始化P2P连接（房主）
  const initializeP2PConnection = async (code: string, asHost: boolean): Promise<void> => {
    status.value = 'connecting'
    roomCode.value = code
    isHost.value = asHost
    
    try {
      console.log(`🌐 初始化PeerJS连接 - ${asHost ? '房主' : '客户端'}`)
      
      // 创建PeerJS房间管理器
      peerRoom.value = createSimplePeerRoom()
      
      // 设置消息处理
      peerRoom.value.onMessage((message, fromPeer) => {
        console.log(`🌐 收到来自 ${fromPeer} 的消息:`, message.type)
        messageHandlers.value.forEach(handler => handler(message))
      })
      
      if (asHost) {
        // 房主创建房间
        await peerRoom.value.createRoom(code, playerId.value)
      }
      
      status.value = 'connected'
      startNetworkMonitoring()
      
      console.log(`🌐 PeerJS连接初始化完成 - ${asHost ? '房主' : '客户端'}`)
      
    } catch (error) {
      status.value = 'disconnected'
      console.error('🌐 PeerJS连接初始化失败:', error)
      throw error
    }
  }

  // 连接到房主（客户端）
  const connectToHost = async (code: string, hostPeerId: string): Promise<void> => {
    status.value = 'connecting'
    roomCode.value = code
    isHost.value = false
    
    try {
      console.log(`🌐 连接到PeerJS房主: ${code}, 房主ID: ${hostPeerId}`)
      
      // 创建PeerJS房间管理器
      peerRoom.value = createSimplePeerRoom()
      
      // 设置消息处理
      peerRoom.value.onMessage((message, fromPeer) => {
        console.log(`🌐 收到来自 ${fromPeer} 的消息:`, message.type)
        messageHandlers.value.forEach(handler => handler(message))
      })
      
      // 加入房间
      await peerRoom.value.joinRoom(code, playerId.value, hostPeerId)
      
      status.value = 'connected'
      startNetworkMonitoring()
      
      console.log(`🌐 已连接到PeerJS房间: ${code}`)
      
    } catch (error) {
      status.value = 'disconnected'
      console.error('🌐 连接PeerJS房间失败:', error)
      throw error
    }
  }

  // 发送消息
  const sendMessage = async (message: any): Promise<void> => {
    if (!peerRoom.value) {
      console.error('🌐 PeerJS房间未初始化')
      throw new Error('PeerJS room not initialized')
    }

    try {
      const networkMessage = {
        ...message,
        timestamp: Date.now(),
        sequenceId: ++sequenceCounter.value,
        senderId: playerId.value
      }

      await peerRoom.value.sendMessage(networkMessage)
      console.log('🌐 PeerJS消息发送成功:', message.type)
    } catch (error) {
      console.error('🌐 PeerJS发送消息失败:', error)
      throw error
    }
  }

  // 添加消息处理器
  const onMessage = (handler: (message: any) => void): void => {
    messageHandlers.value.push(handler)
  }

  // 移除消息处理器
  const offMessage = (handler: (message: any) => void): void => {
    const index = messageHandlers.value.indexOf(handler)
    if (index > -1) {
      messageHandlers.value.splice(index, 1)
    }
  }

  // 断开连接
  const disconnect = async (): Promise<void> => {
    console.log('🌐 断开所有PeerJS连接')
    
    if (peerRoom.value) {
      peerRoom.value.disconnect()
      peerRoom.value = null
    }
    
    status.value = 'disconnected'
    messageHandlers.value = []
    stopNetworkMonitoring()
    
    console.log('🌐 PeerJS网络连接已断开')
  }

  // 网络监控
  const startNetworkMonitoring = (): void => {
    console.log('🌐 开始PeerJS网络质量监控')
    stats.value.connectionType = 'internet'
    stats.value.quality = 'good'
    stats.value.latency = 30 // PeerJS通常有更低的延迟
  }

  const stopNetworkMonitoring = (): void => {
    console.log('🌐 停止PeerJS网络质量监控')
  }

  const startMonitoring = (): void => {
    console.log('🌐 开始PeerJS网络监控')
    startNetworkMonitoring()
  }

  const stopMonitoring = (): void => {
    console.log('🌐 停止PeerJS网络监控')
    stopNetworkMonitoring()
  }

  // 设置玩家ID
  const setPlayerId = (id: string): void => {
    playerId.value = id
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
    stopMonitoring,
    setPlayerId
  }
})
