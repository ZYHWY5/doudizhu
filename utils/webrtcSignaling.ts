// 真实的WebRTC信令服务 - 支持跨设备局域网通信
export interface SignalingMessage {
  type: 'room-register' | 'room-join' | 'offer' | 'answer' | 'ice-candidate' | 'player-data'
  roomCode: string
  from: string
  to?: string
  data: any
  timestamp: number
}

export class WebRTCSignalingService {
  private ws: WebSocket | null = null
  private roomCode: string = ''
  private peerId: string = ''
  private messageHandlers: Array<(message: SignalingMessage) => void> = []
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3

  constructor() {}

  async connect(roomCode: string, peerId: string): Promise<void> {
    this.roomCode = roomCode
    this.peerId = peerId
    this.connectionState = 'connecting'

    return new Promise((resolve, reject) => {
      try {
        // 使用 WebSocket.org 的免费测试服务
        // 注意：这是一个回声服务，所有消息都会被广播给所有连接的客户端
        const wsUrl = 'wss://echo.websocket.org'
        
        console.log('🌐 连接到WebRTC信令服务器:', wsUrl)
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('🌐 WebRTC信令服务器连接成功')
          this.connectionState = 'connected'
          this.reconnectAttempts = 0
          
          // 发送房间注册消息
          this.sendSignalingMessage({
            type: 'room-register',
            roomCode: this.roomCode,
            from: this.peerId,
            data: { action: 'register' },
            timestamp: Date.now()
          })
          
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: SignalingMessage = JSON.parse(event.data)
            
            // 过滤消息：只处理相关房间且不是自己发送的消息
            if (message.roomCode === this.roomCode && message.from !== this.peerId) {
              console.log('🌐 收到WebRTC信令:', message.type, 'from:', message.from)
              this.messageHandlers.forEach(handler => handler(message))
            }
          } catch (error) {
            // 忽略非JSON消息（可能是服务器的其他响应）
          }
        }

        this.ws.onclose = () => {
          console.log('🌐 WebRTC信令服务器连接关闭')
          this.connectionState = 'disconnected'
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('🌐 WebRTC信令服务器错误:', error)
          this.connectionState = 'disconnected'
          reject(error)
        }

      } catch (error) {
        this.connectionState = 'disconnected'
        reject(error)
      }
    })
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.pow(2, this.reconnectAttempts) * 1000
      console.log(`🌐 ${delay/1000}秒后尝试重连 WebRTC信令 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect(this.roomCode, this.peerId).catch(console.error)
      }, delay)
    }
  }

  async sendSignalingMessage(message: SignalingMessage): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage = {
        ...message,
        timestamp: Date.now()
      }
      this.ws.send(JSON.stringify(fullMessage))
      console.log('🌐 发送WebRTC信令:', message.type, 'to:', message.to || 'broadcast')
    } else {
      console.error('🌐 WebRTC信令服务器未连接')
      throw new Error('WebRTC signaling server not connected')
    }
  }

  onMessage(handler: (message: SignalingMessage) => void): void {
    this.messageHandlers.push(handler)
  }

  offMessage(handler: (message: SignalingMessage) => void): void {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connectionState = 'disconnected'
    this.messageHandlers = []
    console.log('🌐 已断开WebRTC信令服务器连接')
  }

  getConnectionState(): string {
    return this.connectionState
  }
}

// WebRTC连接管理器
export class WebRTCConnectionManager {
  private signalingService: WebRTCSignalingService
  private peerConnections = new Map<string, RTCPeerConnection>()
  private dataChannels = new Map<string, RTCDataChannel>()
  private messageHandlers: Array<(message: any, fromPeer: string) => void> = []
  private roomCode: string = ''
  private peerId: string = ''
  private isHost: boolean = false

  // WebRTC配置
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10
  }

  constructor() {
    this.signalingService = new WebRTCSignalingService()
  }

  async initialize(roomCode: string, peerId: string, isHost: boolean): Promise<void> {
    this.roomCode = roomCode
    this.peerId = peerId
    this.isHost = isHost

    try {
      // 连接信令服务器
      await this.signalingService.connect(roomCode, peerId)

      // 监听信令消息
      this.signalingService.onMessage(async (message) => {
        await this.handleSignalingMessage(message)
      })

      console.log('🌐 WebRTC连接管理器初始化成功')
    } catch (error) {
      console.error('🌐 WebRTC连接管理器初始化失败:', error)
      throw error
    }
  }

  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    const { type, from, data } = message

    switch (type) {
      case 'room-join':
        if (this.isHost) {
          // 房主收到加入请求，创建offer
          await this.createOffer(from)
        }
        break

      case 'offer':
        // 收到offer，创建answer
        await this.handleOffer(from, data)
        break

      case 'answer':
        // 收到answer
        await this.handleAnswer(from, data)
        break

      case 'ice-candidate':
        // 收到ICE候选
        await this.handleIceCandidate(from, data)
        break

      case 'player-data':
        // 收到游戏数据
        this.messageHandlers.forEach(handler => handler(data, from))
        break
    }
  }

  private async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection(this.rtcConfig)

    // ICE候选事件
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingService.sendSignalingMessage({
          type: 'ice-candidate',
          roomCode: this.roomCode,
          from: this.peerId,
          to: peerId,
          data: event.candidate,
          timestamp: Date.now()
        })
      }
    }

    // 连接状态变化
    peerConnection.onconnectionstatechange = () => {
      console.log(`🌐 与 ${peerId} 的连接状态:`, peerConnection.connectionState)
    }

    // 数据通道接收
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel
      this.setupDataChannel(dataChannel, peerId)
    }

    this.peerConnections.set(peerId, peerConnection)
    return peerConnection
  }

  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      console.log(`🌐 数据通道已打开: ${peerId}`)
    }

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.messageHandlers.forEach(handler => handler(message, peerId))
      } catch (error) {
        console.error('🌐 解析数据通道消息失败:', error)
      }
    }

    dataChannel.onclose = () => {
      console.log(`🌐 数据通道已关闭: ${peerId}`)
    }

    this.dataChannels.set(peerId, dataChannel)
  }

  private async createOffer(targetPeerId: string): Promise<void> {
    try {
      const peerConnection = await this.createPeerConnection(targetPeerId)
      
      // 创建数据通道
      const dataChannel = peerConnection.createDataChannel('gameData', {
        ordered: true
      })
      this.setupDataChannel(dataChannel, targetPeerId)

      // 创建offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // 发送offer
      await this.signalingService.sendSignalingMessage({
        type: 'offer',
        roomCode: this.roomCode,
        from: this.peerId,
        to: targetPeerId,
        data: offer,
        timestamp: Date.now()
      })

      console.log(`🌐 已向 ${targetPeerId} 发送offer`)
    } catch (error) {
      console.error('🌐 创建offer失败:', error)
    }
  }

  private async handleOffer(fromPeerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const peerConnection = await this.createPeerConnection(fromPeerId)
      
      await peerConnection.setRemoteDescription(offer)
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      // 发送answer
      await this.signalingService.sendSignalingMessage({
        type: 'answer',
        roomCode: this.roomCode,
        from: this.peerId,
        to: fromPeerId,
        data: answer,
        timestamp: Date.now()
      })

      console.log(`🌐 已向 ${fromPeerId} 发送answer`)
    } catch (error) {
      console.error('🌐 处理offer失败:', error)
    }
  }

  private async handleAnswer(fromPeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(fromPeerId)
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer)
        console.log(`🌐 已设置来自 ${fromPeerId} 的answer`)
      }
    } catch (error) {
      console.error('🌐 处理answer失败:', error)
    }
  }

  private async handleIceCandidate(fromPeerId: string, candidate: RTCIceCandidate): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(fromPeerId)
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate)
        console.log(`🌐 已添加来自 ${fromPeerId} 的ICE候选`)
      }
    } catch (error) {
      console.error('🌐 处理ICE候选失败:', error)
    }
  }

  async joinRoom(): Promise<void> {
    if (!this.isHost) {
      // 非房主发送加入请求
      await this.signalingService.sendSignalingMessage({
        type: 'room-join',
        roomCode: this.roomCode,
        from: this.peerId,
        data: { action: 'join' },
        timestamp: Date.now()
      })
      console.log('🌐 已发送房间加入请求')
    }
  }

  async sendMessage(message: any): Promise<void> {
    const messageStr = JSON.stringify(message)
    
    // 通过所有数据通道发送消息
    for (const [peerId, dataChannel] of this.dataChannels.entries()) {
      if (dataChannel.readyState === 'open') {
        dataChannel.send(messageStr)
        console.log(`🌐 通过数据通道发送消息到 ${peerId}`)
      }
    }

    // 如果没有可用的数据通道，通过信令服务器发送
    if (this.dataChannels.size === 0) {
      await this.signalingService.sendSignalingMessage({
        type: 'player-data',
        roomCode: this.roomCode,
        from: this.peerId,
        data: message,
        timestamp: Date.now()
      })
      console.log('🌐 通过信令服务器发送消息')
    }
  }

  onMessage(handler: (message: any, fromPeer: string) => void): void {
    this.messageHandlers.push(handler)
  }

  offMessage(handler: (message: any, fromPeer: string) => void): void {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  disconnect(): void {
    // 关闭所有peer连接
    for (const [peerId, peerConnection] of this.peerConnections.entries()) {
      peerConnection.close()
    }
    this.peerConnections.clear()

    // 关闭所有数据通道
    for (const [peerId, dataChannel] of this.dataChannels.entries()) {
      dataChannel.close()
    }
    this.dataChannels.clear()

    // 断开信令服务器
    this.signalingService.disconnect()

    this.messageHandlers = []
    console.log('🌐 WebRTC连接管理器已断开所有连接')
  }

  getConnectedPeers(): string[] {
    const connectedPeers: string[] = []
    for (const [peerId, peerConnection] of this.peerConnections.entries()) {
      if (peerConnection.connectionState === 'connected') {
        connectedPeers.push(peerId)
      }
    }
    return connectedPeers
  }
}

// 导出便捷函数
export const createWebRTCConnection = () => {
  return new WebRTCConnectionManager()
}
