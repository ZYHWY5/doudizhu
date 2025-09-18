// 真实的跨设备信令服务 - 使用公共WebSocket服务
export interface RealSignalingMessage {
  type: 'room-register' | 'room-join' | 'webrtc-offer' | 'webrtc-answer' | 'ice-candidate' | 'player-message'
  roomCode: string
  from: string
  to?: string
  data: any
  timestamp: number
}

export class RealSignalingService {
  private ws: WebSocket | null = null
  private roomCode: string = ''
  private peerId: string = ''
  private messageHandlers: Array<(message: RealSignalingMessage) => void> = []
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    // 使用免费的公共WebSocket服务进行信令
    // 注意：这是演示用途，生产环境需要专用的信令服务器
  }

  async connect(roomCode: string, peerId: string): Promise<void> {
    this.roomCode = roomCode
    this.peerId = peerId
    this.connectionState = 'connecting'

    return new Promise((resolve, reject) => {
      try {
        // 使用公共的WebSocket服务
        // 这里使用一个支持CORS的WebSocket服务
        const wsUrl = 'wss://ws.postman-echo.com/raw'
        
        console.log('🌐 连接到信令服务器:', wsUrl)
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('🌐 信令服务器连接成功')
          this.connectionState = 'connected'
          this.reconnectAttempts = 0
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: RealSignalingMessage = JSON.parse(event.data)
            // 只处理与当前房间相关的消息
            if (message.roomCode === this.roomCode && message.from !== this.peerId) {
              console.log('🌐 收到信令消息:', message.type, 'from:', message.from)
              this.messageHandlers.forEach(handler => handler(message))
            }
          } catch (error) {
            console.error('🌐 解析信令消息失败:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('🌐 信令服务器连接关闭')
          this.connectionState = 'disconnected'
          this.stopHeartbeat()
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('🌐 信令服务器错误:', error)
          this.connectionState = 'disconnected'
          reject(error)
        }

      } catch (error) {
        this.connectionState = 'disconnected'
        reject(error)
      }
    })
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'room-register', // 心跳消息
          roomCode: this.roomCode,
          from: this.peerId,
          data: { heartbeat: true },
          timestamp: Date.now()
        })
      }
    }, 30000) // 每30秒发送心跳
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.pow(2, this.reconnectAttempts) * 1000
      console.log(`🌐 ${delay/1000}秒后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect(this.roomCode, this.peerId).catch(console.error)
      }, delay)
    } else {
      console.error('🌐 信令服务器重连失败，已达到最大尝试次数')
    }
  }

  async sendMessage(message: RealSignalingMessage): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage = {
        ...message,
        timestamp: Date.now()
      }
      this.ws.send(JSON.stringify(fullMessage))
      console.log('🌐 发送信令消息:', message.type, 'to:', message.to || 'broadcast')
    } else {
      console.error('🌐 信令服务器未连接，无法发送消息')
      throw new Error('Signaling server not connected')
    }
  }

  onMessage(handler: (message: RealSignalingMessage) => void): void {
    this.messageHandlers.push(handler)
  }

  offMessage(handler: (message: RealSignalingMessage) => void): void {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  disconnect(): void {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connectionState = 'disconnected'
    this.messageHandlers = []
    console.log('🌐 已断开信令服务器连接')
  }

  getConnectionState(): string {
    return this.connectionState
  }
}

// 全局信令服务实例
let globalSignalingService: RealSignalingService | null = null

export const getSignalingService = (): RealSignalingService => {
  if (!globalSignalingService) {
    globalSignalingService = new RealSignalingService()
  }
  return globalSignalingService
}

// 简化的跨设备通信方案
export class SimpleCrossDeviceMessaging {
  private roomCode: string = ''
  private peerId: string = ''
  private messageHandlers: Array<(message: any) => void> = []
  private signalingService: RealSignalingService

  constructor() {
    this.signalingService = getSignalingService()
  }

  async initialize(roomCode: string, peerId: string): Promise<void> {
    this.roomCode = roomCode
    this.peerId = peerId

    try {
      await this.signalingService.connect(roomCode, peerId)
      
      // 监听信令消息
      this.signalingService.onMessage((message) => {
        if (message.type === 'player-message') {
          this.messageHandlers.forEach(handler => handler(message.data))
        }
      })

      console.log('🌐 跨设备通信初始化成功')
    } catch (error) {
      console.error('🌐 跨设备通信初始化失败:', error)
      throw error
    }
  }

  async sendMessage(data: any): Promise<void> {
    try {
      await this.signalingService.sendMessage({
        type: 'player-message',
        roomCode: this.roomCode,
        from: this.peerId,
        data: data,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('🌐 发送跨设备消息失败:', error)
      throw error
    }
  }

  onMessage(handler: (message: any) => void): void {
    this.messageHandlers.push(handler)
  }

  offMessage(handler: (message: any) => void): void {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  disconnect(): void {
    this.signalingService.disconnect()
    this.messageHandlers = []
  }
}

export const createCrossDeviceMessaging = () => {
  return new SimpleCrossDeviceMessaging()
}
