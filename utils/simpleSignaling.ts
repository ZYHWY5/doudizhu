// 简单的P2P信令方案 - 通过URL分享房间信息
// 这种方案不需要外部服务器，适合局域网或小规模测试

export interface RoomInfo {
  roomCode: string
  hostPeerId: string
  hostName: string
  timestamp: number
}

export interface SignalingData {
  type: 'room-info' | 'connection-request' | 'connection-response'
  roomCode: string
  from: string
  to?: string
  data: any
  timestamp: number
}

export class SimpleSignalingService {
  private static instance: SimpleSignalingService
  private roomRegistry = new Map<string, RoomInfo>()
  private messageHandlers: Array<(data: SignalingData) => void> = []
  private broadcastChannel: BroadcastChannel | null = null

  constructor() {
    // 使用 BroadcastChannel 在同一设备的不同标签页间通信
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('doudizhu-signaling')
      this.broadcastChannel.onmessage = (event) => {
        const data: SignalingData = event.data
        this.messageHandlers.forEach(handler => handler(data))
      }
    }
  }

  static getInstance(): SimpleSignalingService {
    if (!SimpleSignalingService.instance) {
      SimpleSignalingService.instance = new SimpleSignalingService()
    }
    return SimpleSignalingService.instance
  }

  // 注册房间
  registerRoom(roomInfo: RoomInfo): void {
    this.roomRegistry.set(roomInfo.roomCode, roomInfo)
    console.log(`📡 房间已注册:`, roomInfo)
    
    // 广播房间信息（用于同设备多标签页测试）
    this.broadcast({
      type: 'room-info',
      roomCode: roomInfo.roomCode,
      from: roomInfo.hostPeerId,
      data: roomInfo,
      timestamp: Date.now()
    })
  }

  // 获取房间信息
  getRoomInfo(roomCode: string): RoomInfo | null {
    const info = this.roomRegistry.get(roomCode)
    if (info) {
      console.log(`📡 找到房间信息:`, info)
      return info
    }
    
    console.log(`📡 房间不存在: ${roomCode}`)
    return null
  }

  // 生成房间分享链接
  generateRoomLink(roomInfo: RoomInfo): string {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}${window.location.pathname}`
      : 'https://zyhwy5.github.io/doudizhu/'
    
    const params = new URLSearchParams({
      join: roomInfo.roomCode,
      host: roomInfo.hostPeerId,
      name: roomInfo.hostName,
      t: roomInfo.timestamp.toString()
    })
    
    const link = `${baseUrl}#/room/${roomInfo.roomCode}?${params.toString()}`
    console.log(`📡 生成房间链接:`, link)
    return link
  }

  // 生成二维码数据
  generateQRData(roomInfo: RoomInfo): string {
    return this.generateRoomLink(roomInfo)
  }

  // 从URL解析房间信息
  parseRoomFromUrl(): { roomCode: string, hostInfo: RoomInfo } | null {
    if (typeof window === 'undefined') return null
    
    try {
      // 从路由参数获取房间码
      const pathMatch = window.location.hash.match(/\/room\/([A-Z0-9]{6})/)
      if (!pathMatch) return null
      
      const roomCode = pathMatch[1]
      
      // 从查询参数获取房间信息
      const params = new URLSearchParams(window.location.search)
      const hostPeerId = params.get('host')
      const hostName = params.get('name')
      const timestamp = params.get('t')
      
      if (hostPeerId && hostName && timestamp) {
        const hostInfo: RoomInfo = {
          roomCode,
          hostPeerId,
          hostName,
          timestamp: parseInt(timestamp)
        }
        
        console.log(`📡 从URL解析房间信息:`, hostInfo)
        return { roomCode, hostInfo }
      }
    } catch (error) {
      console.error('📡 解析URL房间信息失败:', error)
    }
    
    return null
  }

  // 广播消息（用于同设备测试）
  broadcast(data: SignalingData): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(data)
      console.log(`📡 广播消息:`, data.type)
    }
  }

  // 添加消息处理器
  onMessage(handler: (data: SignalingData) => void): void {
    this.messageHandlers.push(handler)
  }

  // 移除消息处理器
  offMessage(handler: (data: SignalingData) => void): void {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  // 清理过期房间
  cleanupExpiredRooms(): void {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    
    for (const [roomCode, info] of this.roomRegistry.entries()) {
      if (now - info.timestamp > oneHour) {
        this.roomRegistry.delete(roomCode)
        console.log(`📡 清理过期房间: ${roomCode}`)
      }
    }
  }

  // 清理资源
  cleanup(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }
    this.messageHandlers = []
    this.roomRegistry.clear()
    console.log(`📡 清理信令服务资源`)
  }
}

// 创建全局单例
export const signalingService = SimpleSignalingService.getInstance()

// 导出便捷函数
export const registerRoom = (roomInfo: RoomInfo) => signalingService.registerRoom(roomInfo)
export const getRoomInfo = (roomCode: string) => signalingService.getRoomInfo(roomCode)
export const generateRoomLink = (roomInfo: RoomInfo) => signalingService.generateRoomLink(roomInfo)
export const generateQRData = (roomInfo: RoomInfo) => signalingService.generateQRData(roomInfo)
export const parseRoomFromUrl = () => signalingService.parseRoomFromUrl()

// 房间验证函数
export const validateRoomCode = (code: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(code)
}

// 生成房间码
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
