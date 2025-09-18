// 基于PeerJS的简化P2P连接方案
// PeerJS提供免费的信令服务器和更可靠的WebRTC连接

export interface PeerMessage {
  type: string
  data: any
  timestamp: number
  senderId: string
}

export class PeerJSConnection {
  private peer: any = null
  private connections = new Map<string, any>()
  private messageHandlers: Array<(message: any, fromPeer: string) => void> = []
  private roomCode: string = ''
  private peerId: string = ''
  private isHost: boolean = false
  private isInitialized: boolean = false

  constructor() {}

  async initialize(roomCode: string, peerId: string, isHost: boolean): Promise<void> {
    this.roomCode = roomCode
    this.peerId = peerId
    this.isHost = isHost

    try {
      // 动态导入PeerJS
      const { default: Peer } = await import('peerjs')
      
      // 使用PeerJS的官方免费服务器
      this.peer = new Peer(peerId, {
        // 使用官方的免费PeerJS服务器
        secure: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            }
          ]
        },
        debug: 2 // 启用详细调试日志
      })

      return new Promise((resolve, reject) => {
        this.peer.on('open', (id: string) => {
          console.log('🌐 PeerJS连接成功，ID:', id)
          this.isInitialized = true
          
          // 如果是房主，等待其他peer连接
          if (this.isHost) {
            this.setupHostListeners()
          }
          
          resolve()
        })

        this.peer.on('error', (error: any) => {
          console.error('🌐 PeerJS连接错误:', error)
          reject(error)
        })

        this.peer.on('connection', (conn: any) => {
          console.log('🌐 收到新的peer连接:', conn.peer)
          this.setupConnection(conn)
        })

        this.peer.on('disconnected', () => {
          console.log('🌐 PeerJS连接断开，尝试重连')
          this.peer.reconnect()
        })
      })
    } catch (error) {
      console.error('🌐 PeerJS初始化失败:', error)
      throw error
    }
  }

  private setupHostListeners(): void {
    // 房主监听连接请求
    console.log('🌐 房主模式：等待客户端连接')
  }

  private setupConnection(conn: any): void {
    this.connections.set(conn.peer, conn)

    conn.on('open', () => {
      console.log('🌐 数据连接已建立:', conn.peer)
    })

    conn.on('data', (data: any) => {
      try {
        const message = typeof data === 'string' ? JSON.parse(data) : data
        console.log('🌐 收到数据:', message.type, 'from:', conn.peer)
        this.messageHandlers.forEach(handler => handler(message, conn.peer))
      } catch (error) {
        console.error('🌐 解析消息失败:', error)
      }
    })

    conn.on('close', () => {
      console.log('🌐 连接关闭:', conn.peer)
      this.connections.delete(conn.peer)
    })

    conn.on('error', (error: any) => {
      console.error('🌐 连接错误:', error)
      this.connections.delete(conn.peer)
    })
  }

  async connectToPeer(targetPeerId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('PeerJS not initialized')
    }

    try {
      console.log('🌐 连接到peer:', targetPeerId)
      const conn = this.peer.connect(targetPeerId, {
        reliable: true,
        serialization: 'json'
      })

      return new Promise((resolve, reject) => {
        conn.on('open', () => {
          console.log('🌐 成功连接到peer:', targetPeerId)
          this.setupConnection(conn)
          resolve()
        })

        conn.on('error', (error: any) => {
          console.error('🌐 连接peer失败:', error)
          reject(error)
        })

        // 设置超时
        setTimeout(() => {
          if (!conn.open) {
            reject(new Error('连接超时'))
          }
        }, 10000)
      })
    } catch (error) {
      console.error('🌐 连接peer异常:', error)
      throw error
    }
  }

  async sendMessage(message: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('PeerJS not initialized')
    }

    const fullMessage = {
      ...message,
      timestamp: Date.now(),
      senderId: this.peerId
    }

    const messageStr = JSON.stringify(fullMessage)
    let sentCount = 0

    // 发送给所有连接的peer
    for (const [peerId, conn] of this.connections.entries()) {
      if (conn.open) {
        try {
          conn.send(fullMessage)
          sentCount++
          console.log('🌐 消息发送到:', peerId)
        } catch (error) {
          console.error('🌐 发送消息失败:', peerId, error)
        }
      }
    }

    if (sentCount === 0) {
      console.warn('🌐 没有可用的连接发送消息')
    } else {
      console.log(`🌐 消息已发送到 ${sentCount} 个peer`)
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

  getConnectedPeers(): string[] {
    const connected: string[] = []
    for (const [peerId, conn] of this.connections.entries()) {
      if (conn.open) {
        connected.push(peerId)
      }
    }
    return connected
  }

  disconnect(): void {
    console.log('🌐 断开所有PeerJS连接')
    
    // 关闭所有连接
    for (const [peerId, conn] of this.connections.entries()) {
      if (conn.open) {
        conn.close()
      }
    }
    this.connections.clear()

    // 关闭peer
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy()
    }

    this.messageHandlers = []
    this.isInitialized = false
    console.log('🌐 PeerJS连接已断开')
  }
}

// 简化的房间管理
export class SimplePeerRoom {
  private peerConnection: PeerJSConnection
  private roomCode: string = ''
  private peerId: string = ''
  private isHost: boolean = false
  private hostPeerId: string = ''

  constructor() {
    this.peerConnection = new PeerJSConnection()
  }

  async createRoom(roomCode: string, peerId: string): Promise<void> {
    this.roomCode = roomCode
    this.peerId = peerId
    this.isHost = true
    this.hostPeerId = peerId

    console.log('🌐 创建PeerJS房间:', roomCode)
    await this.peerConnection.initialize(roomCode, peerId, true)
    console.log('🌐 房间创建成功，等待其他玩家加入')
  }

  async joinRoom(roomCode: string, peerId: string, hostPeerId: string): Promise<void> {
    this.roomCode = roomCode
    this.peerId = peerId
    this.isHost = false
    this.hostPeerId = hostPeerId

    console.log('🌐 加入PeerJS房间:', roomCode, '房主:', hostPeerId)
    
    // 初始化peer连接
    await this.peerConnection.initialize(roomCode, peerId, false)
    
    // 连接到房主
    await this.peerConnection.connectToPeer(hostPeerId)
    
    console.log('🌐 成功加入房间')
  }

  async sendMessage(message: any): Promise<void> {
    await this.peerConnection.sendMessage(message)
  }

  onMessage(handler: (message: any, fromPeer: string) => void): void {
    this.peerConnection.onMessage(handler)
  }

  offMessage(handler: (message: any, fromPeer: string) => void): void {
    this.peerConnection.offMessage(handler)
  }

  getConnectedPeers(): string[] {
    return this.peerConnection.getConnectedPeers()
  }

  disconnect(): void {
    this.peerConnection.disconnect()
  }
}

export const createSimplePeerRoom = () => {
  return new SimplePeerRoom()
}
